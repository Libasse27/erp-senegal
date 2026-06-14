const crypto      = require('crypto');
const mongoose    = require('mongoose');
const PaiementSaaS = require('../models/PaiementSaaS');
const Abonnement  = require('../models/Abonnement');
const Company     = require('../models/Company');
const Forfait     = require('../models/Forfait');
const { AppError } = require('../middlewares/errorHandler');
const logger      = require('../config/logger');
const usageService = require('../services/usageService');

const waveProvider       = require('../services/payment/WaveProvider');
const orangeMoneyProvider = require('../services/payment/OrangeMoneyProvider');

const PROVIDERS = {
  WAVE:         waveProvider,
  ORANGE_MONEY: orangeMoneyProvider,
};

const WEBHOOK_HEADERS = {
  wave:         'wave-signature',
  orange_money: 'x-orange-signature',
};

const APP_URL      = process.env.APP_URL || 'http://localhost:5000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ─── Utilitaire : référence interne unique ──────────────────────────────────
const genererReference = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand  = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `SAA-${date}-${rand}`;
};

// ─── Activation de l'abonnement après paiement confirmé ────────────────────
const activerAbonnement = async (paiement, session) => {
  const abonnement = await Abonnement.findById(paiement.abonnementId).session(session);
  if (!abonnement) throw new Error(`Abonnement ${paiement.abonnementId} introuvable`);

  // Mettre à jour le paiement
  paiement.statut            = 'REUSSI';
  paiement.datePaiement      = new Date();
  paiement.webhookReceivedAt = new Date();
  await paiement.save({ session });

  // Activer l'abonnement
  abonnement.statut    = 'ACTIF';
  abonnement.paiementId = paiement._id;
  await abonnement.save({ session });

  // Activer l'entreprise
  await Company.findByIdAndUpdate(
    paiement.entrepriseId,
    {
      status:              'active',
      abonnementActifId:   abonnement._id,
      forfaitId:           abonnement.forfaitId,
      subscriptionEndDate: abonnement.dateFin,
    },
    { session }
  );

  logger.info(`[SaaS] Abonnement activé — company=${paiement.entrepriseId} | ref=${paiement.reference}`);
};

// ─── POST /paiements-saas/initier ───────────────────────────────────────────
const initierPaiement = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { abonnementId, methode } = req.body;
    const companyId = req.companyId || (req.user && req.user.companyId);

    if (!abonnementId) return next(new AppError('abonnementId requis', 400));
    if (!methode)      return next(new AppError('methode requis (WAVE | ORANGE_MONEY)', 400));

    const provider = PROVIDERS[methode];
    if (!provider) return next(new AppError(`Méthode de paiement non supportée : ${methode}`, 400));

    // Vérifier l'abonnement
    const abonnement = await Abonnement.findOne({
      _id:          abonnementId,
      entrepriseId: companyId,
    }).populate('forfaitId').session(session);

    if (!abonnement) return next(new AppError('Abonnement introuvable ou non autorisé', 404));
    if (abonnement.statut === 'ACTIF') {
      await session.abortTransaction();
      return next(new AppError('Cet abonnement est déjà actif', 409));
    }

    // Vérifier qu'un paiement EN_ATTENTE n'existe pas déjà (éviter les doublons)
    const paiementExistant = await PaiementSaaS.findOne({
      abonnementId,
      statut: 'EN_ATTENTE',
    }).session(session);

    if (paiementExistant) {
      await session.abortTransaction();
      return res.status(200).json({
        success: true,
        message: 'Un paiement est déjà en cours pour cet abonnement',
        data: {
          reference:   paiementExistant.reference,
          checkoutUrl: paiementExistant.checkoutUrl,
          statut:      paiementExistant.statut,
          expireAt:    paiementExistant.dateExpiration,
        },
      });
    }

    const company = await Company.findById(companyId).session(session);
    if (!company) return next(new AppError('Entreprise introuvable', 404));

    const reference  = genererReference();
    const montant    = abonnement.montant;
    const forfait    = abonnement.forfaitId;
    const description = `Abonnement ${forfait ? forfait.nom : ''} — ${abonnement.periodicite} — ${company.name}`;

    const callbackUrl = `${FRONTEND_URL}/abonnement/confirmation`;
    const webhookUrl  = `${APP_URL}/api/paiements-saas/webhook/${methode.toLowerCase()}`;

    // Créer le paiement EN_ATTENTE
    const [paiement] = await PaiementSaaS.create(
      [{
        entrepriseId:  companyId,
        abonnementId:  abonnement._id,
        montant,
        devise:        'XOF',
        methode,
        reference,
        statut:        'EN_ATTENTE',
        createdBy:     req.user ? req.user._id : undefined,
      }],
      { session }
    );

    // Appel au PSP
    const { transactionId, checkoutUrl, expireAt } = await provider.initier({
      reference,
      montant,
      description,
      clientEmail: req.user ? req.user.email : company.email,
      clientPhone: req.user ? req.user.phone  : company.phone,
      callbackUrl,
      webhookUrl,
    });

    // Mettre à jour avec les données du PSP
    paiement.transactionId  = transactionId;
    paiement.checkoutUrl    = checkoutUrl;
    paiement.dateExpiration = expireAt;
    await paiement.save({ session });

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: 'Paiement initié avec succès',
      data: {
        reference,
        checkoutUrl,
        transactionId,
        montant,
        devise: 'XOF',
        methode,
        expireAt,
      },
    });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};

// ─── POST /paiements-saas/webhook/:provider ─────────────────────────────────
const webhookPaiement = async (req, res) => {
  const providerKey = req.params.provider.toUpperCase().replace(/-/g, '_');
  const provider    = PROVIDERS[providerKey];

  // Toujours répondre 200 rapidement aux webhooks (best practice PSP)
  if (!provider) {
    logger.warn(`[Webhook SaaS] Provider inconnu : ${providerKey}`);
    return res.status(200).json({ received: true });
  }

  const rawBody        = req.rawBody || JSON.stringify(req.body);
  const signatureKey   = WEBHOOK_HEADERS[req.params.provider.toLowerCase()] || 'x-signature';
  const signatureValue = req.headers[signatureKey] || '';

  let parsed;
  try {
    parsed = provider.verifierWebhook(rawBody, signatureValue);
  } catch (err) {
    logger.warn(`[Webhook SaaS] Signature invalide (${providerKey}) : ${err.message}`);
    return res.status(200).json({ received: true, warning: 'signature_invalide' });
  }

  const { transactionId, statut, metadata } = parsed;

  // Calculer une empreinte pour l'idempotence
  const empreinte = crypto.createHash('sha256')
    .update(rawBody.toString())
    .digest('hex');

  try {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Retrouver le paiement (avec webhookSignature masqué par défaut — on le sélectionne)
      const paiement = await PaiementSaaS
        .findOne({ transactionId })
        .select('+webhookSignature')
        .session(session);

      if (!paiement) {
        logger.warn(`[Webhook SaaS] transactionId inconnu : ${transactionId}`);
        await session.abortTransaction();
        return res.status(200).json({ received: true });
      }

      // Idempotence : webhook déjà traité
      if (paiement.webhookSignature === empreinte) {
        await session.abortTransaction();
        return res.status(200).json({ received: true, info: 'deja_traite' });
      }

      // Marquer la signature (idempotence future)
      paiement.webhookSignature  = empreinte;
      paiement.webhookReceivedAt = new Date();
      paiement.metadata          = metadata;

      if (statut === 'REUSSI' && paiement.statut !== 'REUSSI') {
        await activerAbonnement(paiement, session);
      } else if (statut === 'ECHOUE' && paiement.statut === 'EN_ATTENTE') {
        paiement.statut = 'ECHOUE';
        await paiement.save({ session });
        logger.info(`[SaaS] Paiement échoué — ref=${paiement.reference}`);
      } else if (statut === 'REMBOURSE') {
        paiement.statut = 'REMBOURSE';
        await paiement.save({ session });
        logger.info(`[SaaS] Paiement remboursé — ref=${paiement.reference}`);
      } else {
        await paiement.save({ session });
      }

      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      logger.error(`[Webhook SaaS] Erreur traitement : ${err.message}`);
    } finally {
      session.endSession();
    }
  } catch (err) {
    logger.error(`[Webhook SaaS] Erreur session : ${err.message}`);
  }

  return res.status(200).json({ received: true });
};

// ─── GET /paiements-saas/statut/:ref ────────────────────────────────────────
const getStatutPaiement = async (req, res, next) => {
  try {
    const companyId = req.companyId || (req.user && req.user.companyId);
    const filter    = { reference: req.params.ref };

    // Un admin entreprise ne peut voir que ses propres paiements
    if (companyId) filter.entrepriseId = companyId;

    const paiement = await PaiementSaaS.findOne(filter)
      .populate('abonnementId', 'statut periodicite dateDebut dateFin montant')
      .populate('entrepriseId', 'name status');

    if (!paiement) return next(new AppError('Paiement introuvable', 404));

    res.json({
      success: true,
      data: paiement,
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /paiements-saas ────────────────────────────────────────────────────
const listerPaiements = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, statut, methode } = req.query;
    const companyId = req.companyId || (req.user && req.user.companyId);

    const filter = {};
    if (companyId)    filter.entrepriseId = companyId;
    if (statut)       filter.statut  = statut;
    if (methode)      filter.methode = methode;

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await PaiementSaaS.countDocuments(filter);

    const paiements = await PaiementSaaS.find(filter)
      .populate('entrepriseId', 'name status')
      .populate('abonnementId', 'periodicite statut forfaitId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      data: paiements,
      pagination: {
        page:       Number(page),
        limit:      Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── POST /paiements-saas/confirmer-simulation ─────────────────────────────
// Endpoint de test uniquement — simule un webhook de confirmation
const confirmerSimulation = async (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    return next(new AppError('Non disponible en production', 403));
  }

  try {
    const { reference, statut = 'REUSSI' } = req.body;
    if (!reference) return next(new AppError('reference requis', 400));

    const paiement = await PaiementSaaS.findOne({ reference });
    if (!paiement) return next(new AppError('Paiement introuvable', 404));

    const fakeWebhookBody = JSON.stringify({
      id:             paiement.transactionId || `sim_${Date.now()}`,
      transaction_id: paiement.transactionId,
      payment_status: statut === 'REUSSI' ? 'completed' : 'failed',
      client_reference: reference,
    });

    const empreinte = crypto.createHash('sha256').update(fakeWebhookBody).digest('hex');

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const p = await PaiementSaaS.findById(paiement._id).select('+webhookSignature').session(session);
      p.webhookSignature  = empreinte;
      p.webhookReceivedAt = new Date();
      p.metadata          = JSON.parse(fakeWebhookBody);

      if (!p.transactionId) {
        p.transactionId = `sim_${Date.now()}`;
      }

      if (statut === 'REUSSI' && p.statut !== 'REUSSI') {
        await activerAbonnement(p, session);
      } else {
        p.statut = statut === 'REUSSI' ? 'REUSSI' : 'ECHOUE';
        await p.save({ session });
      }

      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }

    res.json({
      success: true,
      message: `Paiement ${statut} simulé avec succès`,
      data: { reference, statut },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /paiements-saas/usage ──────────────────────────────────────────────
const getUsageSaas = async (req, res, next) => {
  try {
    const companyId = req.companyId || req.user?.companyId;
    if (!companyId) return next(new AppError('Entreprise non identifiée', 400));

    const [usage, company] = await Promise.all([
      usageService.getUsage(companyId),
      Company.findById(companyId)
        .populate({
          path: 'abonnementActifId',
          populate: { path: 'forfaitId', select: 'code nom prixMensuel prixAnnuel modulesInclus limites ordre' },
        })
        .select('status subscriptionEndDate forfaitId abonnementActifId name'),
    ]);

    res.json({
      success: true,
      data: {
        ...usage,
        companyStatus:       company?.status,
        subscriptionEndDate: company?.subscriptionEndDate,
        abonnement:          company?.abonnementActifId,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  initierPaiement,
  webhookPaiement,
  getStatutPaiement,
  listerPaiements,
  confirmerSimulation,
  getUsageSaas,
};

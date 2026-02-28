const Payment = require('../models/Payment');
const Facture = require('../models/Facture');
const Client = require('../models/Client');
const Fournisseur = require('../models/Fournisseur');
const BankAccount = require('../models/BankAccount');
const { AppError } = require('../middlewares/errorHandler');
const { buildPaginationOptions, buildPaginationResponse } = require('../utils/helpers');
const { getNextSequence } = require('../utils/sequenceHelper');
const {
  generateEcritureFromPaymentClient,
  generateEcritureFromPaymentFournisseur,
} = require('../services/comptabiliteService');
const logger = require('../config/logger');
const { notifyPaymentReceived, notifyPaymentValidated, notifyInvoicePaid } = require('../services/notificationService');

/**
 * @desc    Get all payments with pagination, filters, and search
 * @route   GET /api/payments
 * @access  Private
 */
const getPayments = async (req, res, next) => {
  try {
    const { page, limit, skip, sort } = buildPaginationOptions(req.query);
    const filter = {};

    if (req.query.typePaiement) filter.typePaiement = req.query.typePaiement;
    if (req.query.modePaiement) filter.modePaiement = req.query.modePaiement;
    if (req.query.statut) filter.statut = req.query.statut;
    if (req.query.client) filter.client = req.query.client;
    if (req.query.fournisseur) filter.fournisseur = req.query.fournisseur;
    if (req.query.compteBancaire) filter.compteBancaire = req.query.compteBancaire;

    if (req.query.dateFrom || req.query.dateTo) {
      filter.datePaiement = {};
      if (req.query.dateFrom) filter.datePaiement.$gte = new Date(req.query.dateFrom);
      if (req.query.dateTo) filter.datePaiement.$lte = new Date(req.query.dateTo);
    }

    if (req.query.search) {
      filter.$or = [
        { numero: { $regex: req.query.search, $options: 'i' } },
        { referenceInterne: { $regex: req.query.search, $options: 'i' } },
        { 'tiersSnapshot.displayName': { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate('client', 'raisonSociale firstName lastName code')
        .populate('fournisseur', 'raisonSociale code')
        .populate('facture', 'numero totalTTC montantPaye')
        .populate('compteBancaire', 'nom banque')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Payment.countDocuments(filter),
    ]);

    const pagination = buildPaginationResponse(total, page, limit);

    res.set('X-Total-Count', total);
    res.set('X-Total-Pages', pagination.totalPages);

    res.json({
      success: true,
      data: payments,
      meta: pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single payment
 * @route   GET /api/payments/:id
 * @access  Private
 */
const getPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('client')
      .populate('fournisseur')
      .populate('facture')
      .populate('compteBancaire')
      .populate('ecritureComptable');

    if (!payment) {
      return next(new AppError('Paiement non trouve.', 404));
    }

    res.json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new client payment
 * @route   POST /api/payments
 * @access  Private
 */
const createPayment = async (req, res, next) => {
  try {
    // Validate tiers exists
    let tiersSnapshot = {};
    if (req.body.typePaiement === 'client') {
      const client = await Client.findById(req.body.client);
      if (!client) return next(new AppError('Client non trouve.', 404));
      tiersSnapshot = {
        displayName: client.displayName,
        email: client.email,
        phone: client.phone,
      };
    } else if (req.body.typePaiement === 'fournisseur') {
      const fournisseur = await Fournisseur.findById(req.body.fournisseur);
      if (!fournisseur) return next(new AppError('Fournisseur non trouve.', 404));
      tiersSnapshot = {
        displayName: fournisseur.raisonSociale || `${fournisseur.firstName} ${fournisseur.lastName}`,
        email: fournisseur.email,
        phone: fournisseur.phone,
      };
    }

    // Validate facture if provided
    if (req.body.facture) {
      const facture = await Facture.findById(req.body.facture);
      if (!facture) return next(new AppError('Facture non trouvee.', 404));
      if (!['validee', 'envoyee', 'partiellement_payee'].includes(facture.statut)) {
        return next(new AppError('La facture doit etre validee pour recevoir un paiement.', 400));
      }
      const restant = facture.totalTTC - facture.montantPaye;
      if (req.body.montant > restant) {
        return next(
          new AppError(
            `Le montant du paiement (${req.body.montant}) depasse le solde restant (${restant}).`,
            400
          )
        );
      }
    }

    // Validate bank account if required
    if (req.body.compteBancaire) {
      const bankAccount = await BankAccount.findById(req.body.compteBancaire);
      if (!bankAccount) return next(new AppError('Compte bancaire non trouve.', 404));
    }

    const payment = await Payment.create({
      ...req.body,
      tiersSnapshot,
      createdBy: req.user._id,
    });

    const populated = await Payment.findById(payment._id)
      .populate('client', 'raisonSociale firstName lastName code')
      .populate('fournisseur', 'raisonSociale code')
      .populate('facture', 'numero totalTTC')
      .populate('compteBancaire', 'nom banque');

    notifyPaymentReceived({ ...payment.toObject(), numero: payment.numero || payment.referenceInterne });

    res.status(201).json({
      success: true,
      message: 'Paiement cree avec succes',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update payment (only brouillon)
 * @route   PUT /api/payments/:id
 * @access  Private
 */
const updatePayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return next(new AppError('Paiement non trouve.', 404));

    if (payment.statut !== 'brouillon') {
      return next(new AppError('Seuls les paiements en brouillon peuvent etre modifies.', 400));
    }

    req._previousData = payment.toObject();

    Object.assign(payment, req.body);
    payment.modifiedBy = req.user._id;
    await payment.save();

    const populated = await Payment.findById(payment._id)
      .populate('client', 'raisonSociale firstName lastName code')
      .populate('fournisseur', 'raisonSociale code')
      .populate('facture', 'numero totalTTC')
      .populate('compteBancaire', 'nom banque');

    res.json({
      success: true,
      message: 'Paiement modifie avec succes',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Soft delete payment (only brouillon)
 * @route   DELETE /api/payments/:id
 * @access  Private
 */
const deletePayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return next(new AppError('Paiement non trouve.', 404));

    await payment.softDelete(req.user._id);

    res.json({
      success: true,
      message: 'Paiement supprime avec succes',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Validate payment (assign numero, update facture, create accounting entry, update bank balance)
 * @route   POST /api/payments/:id/validate
 * @access  Private
 */
const validatePayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('client')
      .populate('fournisseur');

    if (!payment) return next(new AppError('Paiement non trouve.', 404));

    if (payment.statut !== 'brouillon') {
      return next(new AppError('Seuls les paiements en brouillon peuvent etre valides.', 400));
    }

    // 1. Assign sequential numero
    const { numero } = await getNextSequence('payment');
    payment.numero = numero;

    // 2. Update associated facture(s)
    if (payment.typePaiement === 'client') {
      if (payment.allocations && payment.allocations.length > 0) {
        // Multi-facture allocation
        for (const alloc of payment.allocations) {
          await applyPaymentToFacture(alloc.facture, alloc.montant);
        }
      } else if (payment.facture) {
        // Single facture payment
        await applyPaymentToFacture(payment.facture, payment.montant);
      }

      // Update client creances
      if (payment.client) {
        const clientId = payment.client._id || payment.client;
        await Client.findByIdAndUpdate(clientId, {
          $inc: { totalCreances: -payment.montant },
        });
      }
    }

    // 3. Update bank account balance
    if (payment.compteBancaire) {
      const bankAccount = await BankAccount.findById(payment.compteBancaire);
      if (bankAccount) {
        if (payment.typePaiement === 'client') {
          await bankAccount.crediter(payment.montant);
        } else {
          await bankAccount.debiter(payment.montant);
        }
      }
    } else if (payment.modePaiement === 'especes') {
      // Cash payments: credit/debit the default cash account or first cash account
      // Handled by accounting entry only
    }

    // 4. Generate accounting entry
    try {
      let ecriture;
      if (payment.typePaiement === 'client') {
        ecriture = await generateEcritureFromPaymentClient(payment, req.user._id);
      } else {
        ecriture = await generateEcritureFromPaymentFournisseur(payment, req.user._id);
      }
      payment.ecritureComptable = ecriture._id;
    } catch (comptaError) {
      logger.error(`Erreur generation ecriture comptable paiement: ${comptaError.message}`);
      // Continue validation even if accounting entry fails
    }

    // 5. Update status
    payment.statut = 'valide';
    payment.validatedBy = req.user._id;
    payment.validatedAt = new Date();
    await payment.save();

    const populated = await Payment.findById(payment._id)
      .populate('client', 'raisonSociale firstName lastName code')
      .populate('fournisseur', 'raisonSociale code')
      .populate('facture', 'numero totalTTC montantPaye')
      .populate('compteBancaire', 'nom banque');

    notifyPaymentValidated(populated);

    res.json({
      success: true,
      message: `Paiement valide avec le numero ${numero}`,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Apply a payment amount to a facture and update its status
 * @param {string} factureId - Facture ObjectId
 * @param {number} montant - Payment amount to apply
 */
const applyPaymentToFacture = async (factureId, montant) => {
  const facture = await Facture.findById(factureId);
  if (!facture) return;

  facture.montantPaye += montant;

  // Update status based on payment
  if (facture.montantPaye >= facture.totalTTC) {
    facture.montantPaye = facture.totalTTC; // Cap at total
    facture.statut = 'payee';
    notifyInvoicePaid(facture);
  } else if (facture.montantPaye > 0) {
    facture.statut = 'partiellement_payee';
  }

  await facture.save();
};

/**
 * @desc    Cancel a validated payment (reverse all effects)
 * @route   POST /api/payments/:id/cancel
 * @access  Private
 */
const cancelPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return next(new AppError('Paiement non trouve.', 404));

    if (payment.statut !== 'valide') {
      return next(new AppError('Seuls les paiements valides peuvent etre annules.', 400));
    }

    // 1. Reverse facture payment
    if (payment.typePaiement === 'client') {
      if (payment.allocations && payment.allocations.length > 0) {
        for (const alloc of payment.allocations) {
          await reversePaymentOnFacture(alloc.facture, alloc.montant);
        }
      } else if (payment.facture) {
        await reversePaymentOnFacture(payment.facture, payment.montant);
      }

      // Reverse client creances
      if (payment.client) {
        await Client.findByIdAndUpdate(payment.client, {
          $inc: { totalCreances: payment.montant },
        });
      }
    }

    // 2. Reverse bank account balance
    if (payment.compteBancaire) {
      const bankAccount = await BankAccount.findById(payment.compteBancaire);
      if (bankAccount) {
        if (payment.typePaiement === 'client') {
          await bankAccount.debiter(payment.montant);
        } else {
          await bankAccount.crediter(payment.montant);
        }
      }
    }

    // 3. Create contrepassation accounting entry
    if (payment.ecritureComptable) {
      try {
        const { contrepasser } = require('../services/comptabiliteService');
        await contrepasser(payment.ecritureComptable, req.user._id);
      } catch (comptaError) {
        logger.error(`Erreur contrepassation paiement: ${comptaError.message}`);
      }
    }

    // 4. Update status
    payment.statut = 'annule';
    payment.modifiedBy = req.user._id;
    await payment.save();

    res.json({
      success: true,
      message: 'Paiement annule avec succes',
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reverse a payment on a facture
 */
const reversePaymentOnFacture = async (factureId, montant) => {
  const facture = await Facture.findById(factureId);
  if (!facture) return;

  facture.montantPaye = Math.max(0, facture.montantPaye - montant);

  if (facture.montantPaye === 0) {
    // Revert to previous validated/sent status
    facture.statut = 'validee';
  } else if (facture.montantPaye < facture.totalTTC) {
    facture.statut = 'partiellement_payee';
  }

  await facture.save();
};

/**
 * @desc    Get payment schedule (echeancier)
 * @route   GET /api/payments/schedule
 * @access  Private
 */
const getPaymentSchedule = async (req, res, next) => {
  try {
    const filter = {
      statut: { $in: ['validee', 'envoyee', 'partiellement_payee'] },
      isActive: true,
    };

    if (req.query.client) filter.client = req.query.client;

    const factures = await Facture.find(filter)
      .populate('client', 'raisonSociale firstName lastName code')
      .select('numero clientSnapshot dateFacture dateEcheance totalTTC montantPaye statut')
      .sort('dateEcheance');

    const schedule = factures.map((f) => ({
      facture: f._id,
      numero: f.numero,
      client: f.clientSnapshot?.displayName || 'N/A',
      dateFacture: f.dateFacture,
      dateEcheance: f.dateEcheance,
      totalTTC: f.totalTTC,
      montantPaye: f.montantPaye,
      montantRestant: f.totalTTC - f.montantPaye,
      isEnRetard: f.dateEcheance && new Date() > f.dateEcheance,
      joursRetard: f.dateEcheance
        ? Math.max(0, Math.ceil((new Date() - f.dateEcheance) / (1000 * 60 * 60 * 24)))
        : 0,
    }));

    // Summary
    const totalRestant = schedule.reduce((s, item) => s + item.montantRestant, 0);
    const enRetard = schedule.filter((item) => item.isEnRetard);
    const totalEnRetard = enRetard.reduce((s, item) => s + item.montantRestant, 0);

    res.json({
      success: true,
      data: schedule,
      meta: {
        total: schedule.length,
        totalRestant,
        nombreEnRetard: enRetard.length,
        totalEnRetard,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get tresorerie (cash flow overview)
 * @route   GET /api/tresorerie
 * @access  Private
 */
const getTresorerie = async (req, res, next) => {
  try {
    // Bank accounts with balances
    const bankAccounts = await BankAccount.find({ isActive: true })
      .sort('-isDefault nom');

    const totalBanque = bankAccounts.reduce((s, a) => s + a.soldeActuel, 0);

    // Creances clients (unpaid invoices)
    const creancesResult = await Facture.aggregate([
      {
        $match: {
          statut: { $in: ['validee', 'envoyee', 'partiellement_payee'] },
          typeDocument: 'facture',
          isActive: true,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $subtract: ['$totalTTC', '$montantPaye'] } },
          count: { $sum: 1 },
        },
      },
    ]);

    // Creances aging (30/60/90 days)
    const now = new Date();
    const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const d60 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const d90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const agingResult = await Facture.aggregate([
      {
        $match: {
          statut: { $in: ['validee', 'envoyee', 'partiellement_payee'] },
          typeDocument: 'facture',
          isActive: true,
        },
      },
      {
        $addFields: {
          montantRestant: { $subtract: ['$totalTTC', '$montantPaye'] },
        },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $gte: ['$dateEcheance', now] },
              'non_echu',
              {
                $cond: [
                  { $gte: ['$dateEcheance', d30] },
                  '0_30',
                  {
                    $cond: [
                      { $gte: ['$dateEcheance', d60] },
                      '30_60',
                      {
                        $cond: [
                          { $gte: ['$dateEcheance', d90] },
                          '60_90',
                          'plus_90',
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          montant: { $sum: '$montantRestant' },
          count: { $sum: 1 },
        },
      },
    ]);

    // Recent payments
    const recentPayments = await Payment.find({ statut: 'valide', isActive: true })
      .sort('-datePaiement')
      .limit(10)
      .populate('client', 'raisonSociale firstName lastName')
      .populate('fournisseur', 'raisonSociale')
      .select('numero typePaiement modePaiement montant datePaiement tiersSnapshot');

    res.json({
      success: true,
      data: {
        comptesBancaires: bankAccounts,
        totalBanque,
        creances: {
          total: creancesResult[0]?.total || 0,
          nombre: creancesResult[0]?.count || 0,
          aging: agingResult,
        },
        derniersMovements: recentPayments,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPayments,
  getPayment,
  createPayment,
  updatePayment,
  deletePayment,
  validatePayment,
  cancelPayment,
  getPaymentSchedule,
  getTresorerie,
};

const FactureFournisseur = require('../models/FactureFournisseur');
const CommandeAchat = require('../models/CommandeAchat');
const Fournisseur = require('../models/Fournisseur');
const Payment = require('../models/Payment');
const { AppError } = require('../middlewares/errorHandler');
const { buildPaginationOptions, buildPaginationResponse } = require('../utils/helpers');
const { tc } = require('../utils/tenantHelper');

const getFacturesFournisseur = async (req, res, next) => {
  try {
    const { page, limit, skip, sort } = buildPaginationOptions(req.query);
    const filter = { companyId: tc(req) };

    if (req.query.statut) filter.statut = req.query.statut;
    if (req.query.fournisseur) filter.fournisseur = req.query.fournisseur;
    if (req.query.dateFrom || req.query.dateTo) {
      filter.dateFacture = {};
      if (req.query.dateFrom) filter.dateFacture.$gte = new Date(req.query.dateFrom);
      if (req.query.dateTo) filter.dateFacture.$lte = new Date(req.query.dateTo);
    }
    if (req.query.search) {
      filter.$or = [
        { numero: { $regex: req.query.search, $options: 'i' } },
        { referenceFournisseur: { $regex: req.query.search, $options: 'i' } },
        { 'fournisseurSnapshot.raisonSociale': { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const [factures, total] = await Promise.all([
      FactureFournisseur.find(filter)
        .populate('fournisseur', 'raisonSociale email telephone')
        .populate('commandeAchat', 'numero statut')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      FactureFournisseur.countDocuments(filter),
    ]);

    const pagination = buildPaginationResponse(total, page, limit);
    res.set('X-Total-Count', total);
    res.json({ success: true, data: factures, meta: pagination });
  } catch (error) {
    next(error);
  }
};

const getFactureFournisseur = async (req, res, next) => {
  try {
    const ff = await FactureFournisseur.findOne({ _id: req.params.id, companyId: tc(req) })
      .populate('fournisseur', 'raisonSociale email telephone ninea rccm address')
      .populate('commandeAchat', 'numero statut dateCommande')
      .populate('createdBy', 'firstName lastName')
      .populate('modifiedBy', 'firstName lastName');

    if (!ff) return next(new AppError('Facture fournisseur introuvable', 404));

    const paiements = await Payment.find({
      companyId: tc(req),
      factureFournisseur: ff._id,
      typePaiement: 'fournisseur',
    }).sort('-datePaiement');

    res.json({ success: true, data: { ...ff.toObject(), paiements } });
  } catch (error) {
    next(error);
  }
};

const createFactureFournisseur = async (req, res, next) => {
  try {
    const { commandeAchatId, fournisseurId, lignes, ...rest } = req.body;

    let ffLignes = lignes;
    let ffFournisseur = fournisseurId;
    let linkedCmde = commandeAchatId || null;

    if (commandeAchatId) {
      const cmde = await CommandeAchat.findOne({ _id: commandeAchatId, companyId: tc(req) });
      if (!cmde) return next(new AppError('Commande achat introuvable', 404));
      ffFournisseur = cmde.fournisseur;
      linkedCmde = cmde._id;
      if (!ffLignes || ffLignes.length === 0) {
        ffLignes = cmde.lignes.map((l) => ({
          product: l.product,
          designation: l.designation,
          reference: l.reference,
          quantite: l.quantite,
          prixUnitaire: l.prixUnitaire,
          remise: l.remise || 0,
          tauxTVA: l.tauxTVA,
          unite: l.unite,
        }));
      }
    }

    if (!ffFournisseur) return next(new AppError('Le fournisseur est requis', 400));
    if (!ffLignes || ffLignes.length === 0) return next(new AppError('Au moins une ligne est requise', 400));

    const fourn = await Fournisseur.findOne({ _id: ffFournisseur, companyId: tc(req) });
    if (!fourn) return next(new AppError('Fournisseur introuvable', 404));

    const ff = await FactureFournisseur.create({
      companyId: tc(req),
      fournisseur: ffFournisseur,
      commandeAchat: linkedCmde,
      fournisseurSnapshot: {
        raisonSociale: fourn.raisonSociale,
        email: fourn.email,
        phone: fourn.telephone,
        ninea: fourn.ninea,
        rccm: fourn.rccm,
        address: fourn.address,
      },
      lignes: ffLignes,
      ...rest,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, data: ff, message: 'Facture fournisseur créée' });
  } catch (error) {
    next(error);
  }
};

const updateFactureFournisseur = async (req, res, next) => {
  try {
    const ff = await FactureFournisseur.findOne({ _id: req.params.id, companyId: tc(req) });
    if (!ff) return next(new AppError('Facture fournisseur introuvable', 404));
    if (ff.statut !== 'brouillon') {
      return next(new AppError('Seules les factures en brouillon peuvent être modifiées', 400));
    }

    const { lignes, ...rest } = req.body;
    Object.assign(ff, rest, { modifiedBy: req.user._id });
    if (lignes) ff.lignes = lignes;
    await ff.save();

    res.json({ success: true, data: ff, message: 'Facture fournisseur mise à jour' });
  } catch (error) {
    next(error);
  }
};

const deleteFactureFournisseur = async (req, res, next) => {
  try {
    const ff = await FactureFournisseur.findOne({ _id: req.params.id, companyId: tc(req) });
    if (!ff) return next(new AppError('Facture fournisseur introuvable', 404));
    if (ff.statut !== 'brouillon') {
      return next(new AppError('Seules les factures en brouillon peuvent être supprimées', 400));
    }

    ff.isActive = false;
    ff.deletedAt = new Date();
    ff.deletedBy = req.user._id;
    await ff.save({ validateBeforeSave: false });

    res.json({ success: true, message: 'Facture fournisseur supprimée' });
  } catch (error) {
    next(error);
  }
};

const validerFactureFournisseur = async (req, res, next) => {
  try {
    const ff = await FactureFournisseur.findOne({ _id: req.params.id, companyId: tc(req) });
    if (!ff) return next(new AppError('Facture fournisseur introuvable', 404));
    if (ff.statut !== 'brouillon') {
      return next(new AppError('Seule une facture en brouillon peut être validée', 400));
    }

    ff.statut = 'validee';
    ff.modifiedBy = req.user._id;
    await ff.save({ validateBeforeSave: false });

    res.json({ success: true, data: ff, message: 'Facture fournisseur validée' });
  } catch (error) {
    next(error);
  }
};

const enregistrerPaiement = async (req, res, next) => {
  try {
    const ff = await FactureFournisseur.findOne({ _id: req.params.id, companyId: tc(req) });
    if (!ff) return next(new AppError('Facture fournisseur introuvable', 404));
    if (!['validee', 'partiellement_payee'].includes(ff.statut)) {
      return next(new AppError('Impossible d\'enregistrer un paiement sur cette facture', 400));
    }

    const { montant, modePaiement, datePaiement, reference, notes } = req.body;
    if (!montant || montant <= 0) return next(new AppError('Montant invalide', 400));
    if (!modePaiement) return next(new AppError('Mode de paiement requis', 400));

    const restantAvant = ff.totalTTC - ff.montantPaye;
    if (montant > restantAvant + 0.01) {
      return next(new AppError(`Le montant dépasse le restant dû (${restantAvant} FCFA)`, 400));
    }

    const payment = await Payment.create({
      companyId: tc(req),
      typePaiement: 'fournisseur',
      fournisseur: ff.fournisseur,
      factureFournisseur: ff._id,
      montant,
      modePaiement,
      datePaiement: datePaiement ? new Date(datePaiement) : new Date(),
      referenceInterne: reference || ff.numero,
      notes,
      statut: 'valide',
      tiersSnapshot: {
        displayName: ff.fournisseurSnapshot?.raisonSociale || '',
        email: ff.fournisseurSnapshot?.email || '',
        phone: ff.fournisseurSnapshot?.phone || '',
      },
      createdBy: req.user._id,
    });

    ff.montantPaye = Math.min(ff.totalTTC, ff.montantPaye + montant);
    ff.statut = ff.montantPaye >= ff.totalTTC ? 'payee' : 'partiellement_payee';
    ff.modifiedBy = req.user._id;
    await ff.save({ validateBeforeSave: false });

    res.json({ success: true, data: { facture: ff, payment }, message: 'Paiement enregistré' });
  } catch (error) {
    next(error);
  }
};

const getStatsFacturesFournisseur = async (req, res, next) => {
  try {
    const companyId = tc(req);
    const now = new Date();
    const firstDayMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalDu, encours, paidThisMonth, overdue] = await Promise.all([
      FactureFournisseur.aggregate([
        { $match: { companyId, isActive: true, statut: { $in: ['validee', 'partiellement_payee'] } } },
        { $group: { _id: null, total: { $sum: { $subtract: ['$totalTTC', '$montantPaye'] } }, count: { $sum: 1 } } },
      ]),
      FactureFournisseur.countDocuments({ companyId, isActive: true, statut: { $in: ['brouillon', 'validee', 'partiellement_payee'] } }),
      FactureFournisseur.aggregate([
        { $match: { companyId, isActive: true, statut: 'payee', updatedAt: { $gte: firstDayMonth } } },
        { $group: { _id: null, total: { $sum: '$totalTTC' }, count: { $sum: 1 } } },
      ]),
      FactureFournisseur.countDocuments({
        companyId, isActive: true,
        statut: { $in: ['validee', 'partiellement_payee'] },
        dateEcheance: { $lt: now },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalDu: totalDu[0]?.total || 0,
        nbEnAttente: totalDu[0]?.count || 0,
        encours,
        paidThisMonth: paidThisMonth[0]?.total || 0,
        nbPaidThisMonth: paidThisMonth[0]?.count || 0,
        overdue,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFacturesFournisseur,
  getFactureFournisseur,
  createFactureFournisseur,
  updateFactureFournisseur,
  deleteFactureFournisseur,
  validerFactureFournisseur,
  enregistrerPaiement,
  getStatsFacturesFournisseur,
};

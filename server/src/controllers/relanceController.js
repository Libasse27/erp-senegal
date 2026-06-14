const Relance = require('../models/Relance');
const Facture = require('../models/Facture');
const { AppError } = require('../middlewares/errorHandler');
const { buildPaginationOptions, buildPaginationResponse } = require('../utils/helpers');
const { tc } = require('../utils/tenantHelper');

// ── Helpers ──────────────────────────────────────────────────────────────────

const joursRetard = (dateEcheance) =>
  Math.max(0, Math.floor((Date.now() - new Date(dateEcheance)) / 86_400_000));

const trancheAging = (jours) => {
  if (jours <= 30) return '1_30';
  if (jours <= 60) return '31_60';
  if (jours <= 90) return '61_90';
  return 'sup90';
};

// ── Endpoint : créances en retard (groupées par client) ──────────────────────

const getCreancesEnRetard = async (req, res, next) => {
  try {
    const now = new Date();
    const companyId = tc(req);

    const factures = await Facture.find({
      companyId,
      typeDocument: 'facture',
      statut: { $in: ['validee', 'envoyee', 'partiellement_payee'] },
      dateEcheance: { $lt: now },
    })
      .populate('client', 'name email phone')
      .sort({ dateEcheance: 1 })
      .lean();

    // Group by client
    const byClient = {};
    let grandTotalDu = 0;

    factures.forEach((f) => {
      if (!f.client) return;
      const cid = String(f.client._id);
      const montantDu = Math.max(0, (f.totalTTC || 0) - (f.montantPaye || 0));
      const jours = joursRetard(f.dateEcheance);
      const tranche = trancheAging(jours);

      if (!byClient[cid]) {
        byClient[cid] = {
          client: f.client,
          factures: [],
          totalDu: 0,
          nbFactures: 0,
          joursMaxRetard: 0,
          aging: { '1_30': 0, '31_60': 0, '61_90': 0, sup90: 0 },
        };
      }
      byClient[cid].factures.push({ ...f, montantDu, joursRetard: jours });
      byClient[cid].totalDu += montantDu;
      byClient[cid].nbFactures += 1;
      byClient[cid].joursMaxRetard = Math.max(byClient[cid].joursMaxRetard, jours);
      byClient[cid].aging[tranche] += montantDu;
      grandTotalDu += montantDu;
    });

    const rows = Object.values(byClient).sort((a, b) => b.totalDu - a.totalDu);

    res.json({
      success: true,
      data: rows,
      summary: {
        nbClients: rows.length,
        nbFactures: factures.length,
        totalDu: grandTotalDu,
        aging: rows.reduce(
          (acc, r) => {
            Object.keys(r.aging).forEach((k) => { acc[k] = (acc[k] || 0) + r.aging[k]; });
            return acc;
          },
          { '1_30': 0, '31_60': 0, '61_90': 0, sup90: 0 }
        ),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── Stats relances ────────────────────────────────────────────────────────────

const getStatsRelances = async (req, res, next) => {
  try {
    const companyId = tc(req);
    const [total, envoyees, acquittees, montantAgg] = await Promise.all([
      Relance.countDocuments({ companyId }),
      Relance.countDocuments({ companyId, statut: 'envoyee' }),
      Relance.countDocuments({ companyId, statut: 'acquittee' }),
      Relance.aggregate([
        { $match: { companyId, statut: { $in: ['envoyee', 'brouillon'] } } },
        { $group: { _id: null, totalDu: { $sum: '$montantTotalDu' } } },
      ]),
    ]);
    res.json({
      success: true,
      data: {
        total,
        envoyees,
        acquittees,
        montantEnAttente: montantAgg[0]?.totalDu || 0,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── CRUD ─────────────────────────────────────────────────────────────────────

const getRelances = async (req, res, next) => {
  try {
    const { page, limit, skip, sort } = buildPaginationOptions(req.query);
    const filter = { companyId: tc(req) };

    if (req.query.statut)  filter.statut = req.query.statut;
    if (req.query.niveau)  filter.niveau = Number(req.query.niveau);
    if (req.query.client)  filter.client = req.query.client;
    if (req.query.search) filter.reference = { $regex: req.query.search, $options: 'i' };

    const [relances, total] = await Promise.all([
      Relance.find(filter)
        .populate('client', 'name email phone')
        .populate('createdBy', 'firstName lastName')
        .sort(sort || '-dateRelance')
        .skip(skip)
        .limit(limit),
      Relance.countDocuments(filter),
    ]);

    const meta = buildPaginationResponse(total, page, limit);
    res.set('X-Total-Count', total);
    res.json({ success: true, data: relances, meta });
  } catch (err) {
    next(err);
  }
};

const getRelance = async (req, res, next) => {
  try {
    const r = await Relance.findOne({ _id: req.params.id, companyId: tc(req) })
      .populate('client', 'name email phone address')
      .populate('createdBy', 'firstName lastName')
      .populate('acquittedBy', 'firstName lastName')
      .populate('factures.facture', 'numero referenceInterne dateFacture dateEcheance totalTTC montantPaye statut');

    if (!r) return next(new AppError('Relance introuvable', 404));
    res.json({ success: true, data: r });
  } catch (err) {
    next(err);
  }
};

const createRelance = async (req, res, next) => {
  try {
    const { clientId, factureIds, niveau, mode, dateRelance, dateEcheanceRelance, notes } = req.body;
    const companyId = tc(req);

    if (!factureIds || factureIds.length === 0) {
      return next(new AppError('Au moins une facture est requise', 400));
    }

    // Resolve factures
    const factures = await Facture.find({
      _id: { $in: factureIds },
      companyId,
      client: clientId,
      statut: { $in: ['validee', 'envoyee', 'partiellement_payee'] },
    })
      .populate('client', 'name email phone')
      .lean();

    if (factures.length === 0) {
      return next(new AppError('Aucune facture valide trouvée pour ce client', 400));
    }

    const now = new Date();
    let montantTotalDu = 0;
    const lignes = factures.map((f) => {
      const montantDu = Math.max(0, (f.totalTTC || 0) - (f.montantPaye || 0));
      montantTotalDu += montantDu;
      return {
        facture: f._id,
        numero: f.numero || f.referenceInterne,
        dateFacture: f.dateFacture,
        dateEcheance: f.dateEcheance,
        montantTTC: f.totalTTC || 0,
        montantPaye: f.montantPaye || 0,
        montantDu,
        joursRetard: f.dateEcheance ? joursRetard(f.dateEcheance) : 0,
      };
    });

    const client = factures[0].client;
    const relance = await Relance.create({
      companyId,
      client: clientId,
      clientSnapshot: {
        name: client?.name || clientId,
        email: client?.email || '',
        phone: client?.phone || '',
      },
      factures: lignes,
      niveau: niveau || 1,
      statut: 'envoyee',
      mode: mode || 'email',
      dateRelance: dateRelance || now,
      dateEcheanceRelance: dateEcheanceRelance || null,
      montantTotalDu,
      notes,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, data: relance, message: `Relance ${relance.reference} créée` });
  } catch (err) {
    next(err);
  }
};

const acquitterRelance = async (req, res, next) => {
  try {
    const r = await Relance.findOne({ _id: req.params.id, companyId: tc(req) });
    if (!r) return next(new AppError('Relance introuvable', 404));
    if (!['envoyee', 'brouillon'].includes(r.statut)) {
      return next(new AppError('Seule une relance envoyée peut être acquittée', 400));
    }
    r.statut = 'acquittee';
    r.acquittedBy = req.user._id;
    r.acquittedAt = new Date();
    if (req.body.notes) r.notes = (r.notes ? r.notes + '\n' : '') + req.body.notes;
    await r.save({ validateBeforeSave: false });
    res.json({ success: true, data: r, message: 'Relance acquittée' });
  } catch (err) {
    next(err);
  }
};

const annulerRelance = async (req, res, next) => {
  try {
    const r = await Relance.findOne({ _id: req.params.id, companyId: tc(req) });
    if (!r) return next(new AppError('Relance introuvable', 404));
    if (r.statut === 'acquittee') {
      return next(new AppError('Une relance acquittée ne peut pas être annulée', 400));
    }
    r.statut = 'annulee';
    r.cancelledBy = req.user._id;
    r.cancelledAt = new Date();
    await r.save({ validateBeforeSave: false });
    res.json({ success: true, data: r, message: 'Relance annulée' });
  } catch (err) {
    next(err);
  }
};

const deleteRelance = async (req, res, next) => {
  try {
    const r = await Relance.findOne({ _id: req.params.id, companyId: tc(req) });
    if (!r) return next(new AppError('Relance introuvable', 404));
    if (!['brouillon', 'annulee'].includes(r.statut)) {
      return next(new AppError('Seule une relance en brouillon ou annulée peut être supprimée', 400));
    }
    r.isActive = false;
    r.deletedAt = new Date();
    r.deletedBy = req.user._id;
    await r.save({ validateBeforeSave: false });
    res.json({ success: true, message: 'Relance supprimée' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCreancesEnRetard,
  getStatsRelances,
  getRelances,
  getRelance,
  createRelance,
  acquitterRelance,
  annulerRelance,
  deleteRelance,
};

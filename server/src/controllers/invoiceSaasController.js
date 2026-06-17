const Invoice     = require('../models/Invoice');
const { AppError } = require('../middlewares/errorHandler');
const { buildPaginationOptions, buildPaginationResponse } = require('../utils/helpers');

/**
 * @desc  Liste les factures d'abonnement SaaS de l'entreprise connectée
 * @route GET /api/invoices-saas
 * @access Admin entreprise
 */
const getMesFactures = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const { page, limit, skip, sort } = buildPaginationOptions(req.query, { defaultSort: { dateEmission: -1 } });

    const filter = { entrepriseId: companyId };
    if (req.query.statut) filter.statut = req.query.statut;

    const [factures, total] = await Promise.all([
      Invoice.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Invoice.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: factures,
      pagination: buildPaginationResponse(total, page, limit),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc  Détail d'une facture SaaS de l'entreprise connectée
 * @route GET /api/invoices-saas/:id
 * @access Admin entreprise
 */
const getUneFacture = async (req, res, next) => {
  try {
    const facture = await Invoice.findOne({
      _id:          req.params.id,
      entrepriseId: req.user.companyId,
    })
      .populate('abonnementId', 'planSnapshot periodicite statut')
      .populate('paiementId',   'methode reference transactionId')
      .lean();

    if (!facture) return next(new AppError('Facture non trouvée.', 404));

    res.json({ success: true, data: facture });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc  Liste toutes les factures SaaS (toutes entreprises) — Super Admin
 * @route GET /api/super-admin/invoices
 * @access Super Admin (scope PLATFORM)
 */
const toutesLesFactures = async (req, res, next) => {
  try {
    const { page, limit, skip, sort } = buildPaginationOptions(req.query, { defaultSort: { dateEmission: -1 } });

    const filter = {};
    if (req.query.statut)      filter.statut       = req.query.statut;
    if (req.query.entrepriseId) filter.entrepriseId = req.query.entrepriseId;

    const [factures, total] = await Promise.all([
      Invoice.find(filter)
        .sort(sort).skip(skip).limit(limit)
        .populate('entrepriseId', 'name email')
        .lean(),
      Invoice.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: factures,
      pagination: buildPaginationResponse(total, page, limit),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc  Totaux des factures par statut — Super Admin
 * @route GET /api/super-admin/invoices/stats
 * @access Super Admin (scope PLATFORM)
 */
const statsFactures = async (req, res, next) => {
  try {
    const agg = await Invoice.aggregate([
      {
        $group: {
          _id:    '$statut',
          total:  { $sum: '$totalTTC' },
          count:  { $sum: 1 },
        },
      },
    ]);

    const stats = { EMISE: { count: 0, total: 0 }, PAYEE: { count: 0, total: 0 }, ANNULEE: { count: 0, total: 0 } };
    agg.forEach(({ _id, count, total }) => {
      if (stats[_id] !== undefined) stats[_id] = { count, total };
    });

    const grandTotal = await Invoice.aggregate([
      { $match: { statut: 'PAYEE' } },
      { $group: { _id: null, total: { $sum: '$totalTTC' }, count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      data: {
        parStatut: stats,
        totalEncaisse: grandTotal[0]?.total ?? 0,
        nombreFactures: grandTotal[0]?.count ?? 0,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMesFactures, getUneFacture, toutesLesFactures, statsFactures };

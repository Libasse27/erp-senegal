const Client = require('../models/Client');
const Facture = require('../models/Facture');
const Payment = require('../models/Payment');
const Stock = require('../models/Stock');
const StockMovement = require('../models/StockMovement');
const Devis = require('../models/Devis');
const Commande = require('../models/Commande');
const Product = require('../models/Product');
const Warehouse = require('../models/Warehouse');
const { tc, tenantId } = require('../utils/tenantHelper');

/**
 * @desc    Get dashboard stats (KPIs)
 * @route   GET /api/dashboard/stats
 * @access  Private
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // CA du mois (factures validees/payees ce mois)
    const facturesMois = await Facture.aggregate([
      {
        $match: {
          isActive: true,
          companyId: tenantId(req),
          statut: { $in: ['validee', 'envoyee', 'partiellement_payee', 'payee'] },
          dateFacture: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      { $group: { _id: null, total: { $sum: '$montantTTC' } } },
    ]);
    const caDuMois = facturesMois[0]?.total || 0;

    // Clients actifs
    const clientsActifs = await Client.countDocuments({ companyId: tc(req), isActive: true });

    // Factures impayees
    const facturesImpayees = await Facture.countDocuments({
      companyId: tc(req),
      isActive: true,
      statut: { $in: ['validee', 'envoyee', 'partiellement_payee'] },
    });

    // Alertes stock (rupture + seuil minimum)
    const stocks = await Stock.find({ companyId: tc(req), isActive: true }).populate('product', 'stockMinimum stockAlerte');
    let alertesStock = 0;
    stocks.forEach((stock) => {
      if (!stock.product) return;
      if (stock.quantite <= 0 || stock.quantite <= stock.product.stockMinimum) {
        alertesStock++;
      }
    });

    // Paiements du mois
    const paiementsMois = await Payment.aggregate([
      {
        $match: {
          isActive: true,
          companyId: tenantId(req),
          statut: 'valide',
          datePaiement: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      { $group: { _id: null, total: { $sum: '$montant' } } },
    ]);

    // Devis en attente
    const devisEnAttente = await Devis.countDocuments({
      companyId: tc(req),
      isActive: true,
      statut: { $in: ['brouillon', 'envoye'] },
    });

    // Commandes en cours
    const commandesEnCours = await Commande.countDocuments({
      companyId: tc(req),
      isActive: true,
      statut: { $in: ['en_attente', 'confirmee', 'en_preparation'] },
    });

    res.json({
      success: true,
      data: {
        caDuMois,
        clientsActifs,
        facturesImpayees,
        alertesStock,
        paiementsDuMois: paiementsMois[0]?.total || 0,
        devisEnAttente,
        commandesEnCours,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get dashboard summary
 * @route   GET /api/dashboard/summary
 * @access  Private
 */
const getDashboardSummary = async (req, res, next) => {
  try {
    // Reuse stats
    const stats = {};

    const clientsActifs = await Client.countDocuments({ companyId: tc(req), isActive: true });
    const totalFactures = await Facture.countDocuments({ companyId: tc(req), isActive: true });
    const totalPaiements = await Payment.countDocuments({ companyId: tc(req), isActive: true, statut: 'valide' });

    stats.clientsActifs = clientsActifs;
    stats.totalFactures = totalFactures;
    stats.totalPaiements = totalPaiements;

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get dashboard charts data
 * @route   GET /api/dashboard/charts
 * @access  Private
 */
const getDashboardCharts = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();

    // CA mensuel
    const caMensuel = await Facture.aggregate([
      {
        $match: {
          isActive: true,
          companyId: tenantId(req),
          statut: { $in: ['validee', 'envoyee', 'partiellement_payee', 'payee'] },
          dateFacture: {
            $gte: new Date(year, 0, 1),
            $lte: new Date(year, 11, 31, 23, 59, 59),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$dateFacture' },
          total: { $sum: '$montantTTC' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Paiements par mode
    const paiementsParMode = await Payment.aggregate([
      { $match: { isActive: true, companyId: tenantId(req), statut: 'valide' } },
      { $group: { _id: '$modePaiement', total: { $sum: '$montant' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]);

    res.json({
      success: true,
      data: {
        caMensuel,
        paiementsParMode,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Top clients par CA sur l'année
 * @route   GET /api/dashboard/top-clients
 * @access  Private
 */
const getDashboardTopClients = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 20);
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const rows = await Facture.aggregate([
      {
        $match: {
          isActive: true,
          companyId: tenantId(req),
          statut: { $in: ['validee', 'envoyee', 'partiellement_payee', 'payee'] },
          dateFacture: {
            $gte: new Date(year, 0, 1),
            $lte: new Date(year, 11, 31, 23, 59, 59),
          },
        },
      },
      {
        $group: {
          _id: '$client',
          totalCA: { $sum: '$totalTTC' },
          nbFactures: { $sum: 1 },
          displayName: { $first: '$clientSnapshot.displayName' },
        },
      },
      { $sort: { totalCA: -1 } },
      { $limit: limit },
    ]);

    const maxCA = rows[0]?.totalCA || 1;
    const clients = rows.map((r) => ({
      clientId: r._id,
      displayName: r.displayName || 'Client inconnu',
      totalCA: r.totalCA,
      nbFactures: r.nbFactures,
      pct: Math.round((r.totalCA / maxCA) * 100),
    }));

    res.json({ success: true, data: clients });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Alertes stock détaillées (produits sous seuil)
 * @route   GET /api/dashboard/stock-alerts
 * @access  Private
 */
const getDashboardStockAlerts = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 30);

    const stocks = await Stock.find({ companyId: tc(req), isActive: true })
      .populate('product', 'name code stockMinimum stockAlerte')
      .populate('warehouse', 'name code')
      .sort({ quantite: 1 });

    const alerts = stocks
      .filter((s) => {
        if (!s.product) return false;
        const seuil = s.product.stockAlerte || s.product.stockMinimum || 0;
        return s.quantite <= seuil;
      })
      .slice(0, limit)
      .map((s) => {
        const seuil = s.product.stockAlerte || s.product.stockMinimum || 0;
        return {
          stockId: s._id,
          productId: s.product._id,
          productName: s.product.name,
          productCode: s.product.code,
          warehouseName: s.warehouse?.name || 'Dépôt principal',
          quantite: s.quantite,
          seuil,
          severity: s.quantite <= 0 ? 'critical' : 'warning',
        };
      });

    res.json({ success: true, data: alerts });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    KPIs avancés : trend CA, taux conversion devis, délai moyen paiement
 * @route   GET /api/dashboard/kpis
 * @access  Private
 */
const getDashboardKpis = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const factureMatch = {
      isActive: true,
      companyId: tenantId(req),
      statut: { $in: ['validee', 'envoyee', 'partiellement_payee', 'payee'] },
    };

    const [caMois, caLastMois, totalDevis, devisConverts, delaiAgg] = await Promise.all([
      Facture.aggregate([
        { $match: { ...factureMatch, dateFacture: { $gte: startOfMonth, $lte: endOfMonth } } },
        { $group: { _id: null, total: { $sum: '$totalTTC' } } },
      ]),
      Facture.aggregate([
        { $match: { ...factureMatch, dateFacture: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
        { $group: { _id: null, total: { $sum: '$totalTTC' } } },
      ]),
      Devis.countDocuments({
        companyId: tc(req),
        isActive: true,
        createdAt: { $gte: startOfMonth, $lte: endOfMonth },
      }),
      Devis.countDocuments({
        companyId: tc(req),
        isActive: true,
        statut: 'converti',
        createdAt: { $gte: startOfMonth, $lte: endOfMonth },
      }),
      Payment.aggregate([
        {
          $match: {
            isActive: true,
            companyId: tenantId(req),
            statut: 'valide',
            type: 'encaissement',
            facture: { $exists: true, $ne: null },
          },
        },
        {
          $lookup: {
            from: 'factures',
            localField: 'facture',
            foreignField: '_id',
            as: 'factureData',
          },
        },
        { $unwind: '$factureData' },
        {
          $project: {
            delai: {
              $divide: [
                { $subtract: ['$datePaiement', '$factureData.dateFacture'] },
                86400000,
              ],
            },
          },
        },
        { $group: { _id: null, delaiMoyen: { $avg: '$delai' } } },
      ]),
    ]);

    const caCurrentMonth = caMois[0]?.total || 0;
    const caPrevMonth = caLastMois[0]?.total || 0;
    const caTrend = caPrevMonth > 0
      ? Math.round(((caCurrentMonth - caPrevMonth) / caPrevMonth) * 100)
      : null;

    const tauxConversion = totalDevis > 0 ? Math.round((devisConverts / totalDevis) * 100) : 0;
    const delaiMoyenPaiement = delaiAgg[0] ? Math.round(delaiAgg[0].delaiMoyen) : null;

    res.json({
      success: true,
      data: {
        caCurrentMonth,
        caPrevMonth,
        caTrend,
        tauxConversion,
        totalDevis,
        devisConverts,
        delaiMoyenPaiement,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Top produits par CA (via lignes de factures)
 * @route   GET /api/dashboard/top-products?year=&limit=
 * @access  Private
 */
const getDashboardTopProducts = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 20);
    const year  = parseInt(req.query.year)  || new Date().getFullYear();

    const rows = await Facture.aggregate([
      {
        $match: {
          isActive: true,
          companyId: tenantId(req),
          statut: { $in: ['validee', 'envoyee', 'partiellement_payee', 'payee'] },
          dateFacture: {
            $gte: new Date(year, 0, 1),
            $lte: new Date(year, 11, 31, 23, 59, 59),
          },
        },
      },
      { $unwind: '$lignes' },
      {
        $group: {
          _id: { $ifNull: ['$lignes.product', '$lignes.designation'] },
          designation: { $first: '$lignes.designation' },
          totalCA:     { $sum: '$lignes.montantTTC' },
          totalQte:    { $sum: '$lignes.quantite' },
          nbFactures:  { $sum: 1 },
        },
      },
      { $sort: { totalCA: -1 } },
      { $limit: limit },
    ]);

    const maxCA = rows[0]?.totalCA || 1;
    const products = rows.map((r) => ({
      productId:   r._id,
      designation: r.designation || 'Produit inconnu',
      totalCA:     r.totalCA,
      totalQte:    r.totalQte,
      nbFactures:  r.nbFactures,
      pct:         Math.round((r.totalCA / maxCA) * 100),
    }));

    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Évolution stock : entrées et sorties par mois
 * @route   GET /api/dashboard/stock-evolution?year=
 * @access  Private
 */
const getDashboardStockEvolution = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

    const agg = await StockMovement.aggregate([
      {
        $match: {
          companyId: tenantId(req),
          isActive: true,
          type: { $in: ['entree', 'sortie'] },
          createdAt: {
            $gte: new Date(year, 0, 1),
            $lte: new Date(year, 11, 31, 23, 59, 59),
          },
        },
      },
      {
        $group: {
          _id: { mois: { $month: '$createdAt' }, type: '$type' },
          total:   { $sum: '$quantite' },
          valeur:  { $sum: { $ifNull: ['$coutTotal', 0] } },
        },
      },
    ]);

    // Build 12-month array
    const data = MONTHS.map((mois, i) => {
      const entree = agg.find((r) => r._id.mois === i + 1 && r._id.type === 'entree');
      const sortie = agg.find((r) => r._id.mois === i + 1 && r._id.type === 'sortie');
      return {
        mois,
        entrees:     entree?.total   || 0,
        sorties:     sortie?.total   || 0,
        valEntrees:  entree?.valeur  || 0,
        valSorties:  sortie?.valeur  || 0,
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Taux de recouvrement : CA total vs montants payés
 * @route   GET /api/dashboard/recouvrement?year=
 * @access  Private
 */
const getDashboardRecouvrement = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const match = {
      isActive: true,
      companyId: tenantId(req),
      statut: { $in: ['validee', 'envoyee', 'partiellement_payee', 'payee', 'en_retard'] },
      dateFacture: {
        $gte: new Date(year, 0, 1),
        $lte: new Date(year, 11, 31, 23, 59, 59),
      },
    };

    const [agg, parStatut] = await Promise.all([
      Facture.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            totalCA:    { $sum: '$totalTTC' },
            totalPaye:  { $sum: '$montantPaye' },
            nbFactures: { $sum: 1 },
          },
        },
      ]),
      Facture.aggregate([
        { $match: match },
        {
          $group: {
            _id: '$statut',
            montant:    { $sum: '$totalTTC' },
            count:      { $sum: 1 },
          },
        },
      ]),
    ]);

    const totalCA    = agg[0]?.totalCA   || 0;
    const totalPaye  = agg[0]?.totalPaye || 0;
    const totalDu    = totalCA - totalPaye;
    const tauxRecouvrement = totalCA > 0 ? Math.round((totalPaye / totalCA) * 100) : 0;

    const statutMap = {};
    parStatut.forEach((s) => { statutMap[s._id] = { montant: s.montant, count: s.count }; });

    res.json({
      success: true,
      data: {
        totalCA,
        totalPaye,
        totalDu,
        tauxRecouvrement,
        nbFactures: agg[0]?.nbFactures || 0,
        parStatut: statutMap,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getDashboardSummary,
  getDashboardCharts,
  getDashboardTopClients,
  getDashboardStockAlerts,
  getDashboardKpis,
  getDashboardTopProducts,
  getDashboardStockEvolution,
  getDashboardRecouvrement,
};

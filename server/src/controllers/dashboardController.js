const Client = require('../models/Client');
const Facture = require('../models/Facture');
const Payment = require('../models/Payment');
const Stock = require('../models/Stock');
const Devis = require('../models/Devis');
const Commande = require('../models/Commande');

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
          statut: { $in: ['validee', 'envoyee', 'partiellement_payee', 'payee'] },
          dateFacture: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      { $group: { _id: null, total: { $sum: '$montantTTC' } } },
    ]);
    const caDuMois = facturesMois[0]?.total || 0;

    // Clients actifs
    const clientsActifs = await Client.countDocuments({ isActive: true });

    // Factures impayees
    const facturesImpayees = await Facture.countDocuments({
      isActive: true,
      statut: { $in: ['validee', 'envoyee', 'partiellement_payee'] },
    });

    // Alertes stock (rupture + seuil minimum)
    const stocks = await Stock.find({ isActive: true }).populate('product', 'stockMinimum stockAlerte');
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
          statut: 'valide',
          datePaiement: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      { $group: { _id: null, total: { $sum: '$montant' } } },
    ]);

    // Devis en attente
    const devisEnAttente = await Devis.countDocuments({
      isActive: true,
      statut: { $in: ['brouillon', 'envoye'] },
    });

    // Commandes en cours
    const commandesEnCours = await Commande.countDocuments({
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

    const clientsActifs = await Client.countDocuments({ isActive: true });
    const totalFactures = await Facture.countDocuments({ isActive: true });
    const totalPaiements = await Payment.countDocuments({ isActive: true, statut: 'valide' });

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
      { $match: { isActive: true, statut: 'valide' } },
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

module.exports = {
  getDashboardStats,
  getDashboardSummary,
  getDashboardCharts,
};

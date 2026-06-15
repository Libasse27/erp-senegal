const Company = require('../models/Company');
const Facture = require('../models/Facture');
const Client = require('../models/Client');
const Payment = require('../models/Payment');
const Stock = require('../models/Stock');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Devis = require('../models/Devis');
const Commande = require('../models/Commande');
const CommandeAchat = require('../models/CommandeAchat');
const FactureFournisseur = require('../models/FactureFournisseur');
const { AppError } = require('../middlewares/errorHandler');
const comptabiliteService = require('../services/comptabiliteService');
const {
  generateBilanPDF,
  generateResultatPDF,
  generateCAPDF,
  generateReleveClientPDF,
  generateRapportStockPDF,
  generateRecouvrementPDF,
} = require('../services/pdfService');
const logger = require('../config/logger');

/** Helper: tenant company id shorthand */
const tc = (req) => req.companyId;

/**
 * Resolve date range for CA report.
 * Defaults to current calendar year if not provided.
 * @param {string} fromParam
 * @param {string} toParam
 * @returns {{ dateFrom: Date, dateTo: Date }}
 */
const resolveCAPeriod = (fromParam, toParam) => {
  const now = new Date();
  const dateFrom = fromParam
    ? new Date(fromParam)
    : new Date(now.getFullYear(), 0, 1);          // 1er janvier
  const dateTo = toParam
    ? new Date(toParam)
    : new Date(now.getFullYear(), 11, 31, 23, 59, 59); // 31 decembre
  return { dateFrom, dateTo };
};

/**
 * Format a month number + year into a French label: "Jan 2026"
 * @param {number} year
 * @param {number} month  1-based
 * @returns {string}
 */
const formatMonthLabel = (year, month) => {
  const mois = [
    'Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jun',
    'Jul', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return `${mois[month - 1]} ${year}`;
};

// =====================================================
// BILAN
// =====================================================

/**
 * @desc    Get bilan SYSCOHADA as JSON
 * @route   GET /api/rapports/bilan
 * @access  Private — rapports:read
 */
const getBilanJSON = async (req, res, next) => {
  try {
    const options = {};
    if (req.query.exercice) options.exercice = req.query.exercice;
    if (req.query.dateFrom) options.dateFrom = req.query.dateFrom;
    if (req.query.dateTo) options.dateTo = req.query.dateTo;

    const bilan = await comptabiliteService.getBilan(options);

    res.json({
      success: true,
      data: bilan,
      message: 'Bilan SYSCOHADA recupere avec succes',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get bilan SYSCOHADA as PDF download
 * @route   GET /api/rapports/bilan/pdf
 * @access  Private — rapports:read
 */
const getBilanPDF = async (req, res, next) => {
  try {
    const options = {};
    if (req.query.exercice) options.exercice = req.query.exercice;
    if (req.query.dateFrom) options.dateFrom = req.query.dateFrom;
    if (req.query.dateTo) options.dateTo = req.query.dateTo;

    const [bilan, company] = await Promise.all([
      comptabiliteService.getBilan(options),
      Company.findById(tc(req)).lean(),
    ]);

    if (!company) {
      return next(new AppError('Entreprise introuvable.', 404));
    }

    const pdfBuffer = await generateBilanPDF(bilan, company, options);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="bilan-${Date.now()}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  } catch (error) {
    logger.error(`Erreur generation PDF bilan: ${error.message}`);
    next(error);
  }
};

// =====================================================
// COMPTE DE RESULTAT
// =====================================================

/**
 * @desc    Get compte de resultat as JSON
 * @route   GET /api/rapports/resultat
 * @access  Private — rapports:read
 */
const getResultatJSON = async (req, res, next) => {
  try {
    const options = {};
    if (req.query.exercice) options.exercice = req.query.exercice;
    if (req.query.dateFrom) options.dateFrom = req.query.dateFrom;
    if (req.query.dateTo) options.dateTo = req.query.dateTo;

    const resultat = await comptabiliteService.getCompteResultat(options);

    res.json({
      success: true,
      data: resultat,
      message: 'Compte de resultat recupere avec succes',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get compte de resultat as PDF download
 * @route   GET /api/rapports/resultat/pdf
 * @access  Private — rapports:read
 */
const getResultatPDF = async (req, res, next) => {
  try {
    const options = {};
    if (req.query.exercice) options.exercice = req.query.exercice;
    if (req.query.dateFrom) options.dateFrom = req.query.dateFrom;
    if (req.query.dateTo) options.dateTo = req.query.dateTo;

    const [resultat, company] = await Promise.all([
      comptabiliteService.getCompteResultat(options),
      Company.findById(tc(req)).lean(),
    ]);

    if (!company) {
      return next(new AppError('Entreprise introuvable.', 404));
    }

    const pdfBuffer = await generateResultatPDF(resultat, company, options);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="compte-resultat-${Date.now()}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  } catch (error) {
    logger.error(`Erreur generation PDF compte de resultat: ${error.message}`);
    next(error);
  }
};

// =====================================================
// CHIFFRE D'AFFAIRES
// =====================================================

/**
 * Build and run the CA aggregation pipeline against Facture collection.
 * @param {string} companyId
 * @param {Date} dateFrom
 * @param {Date} dateTo
 * @returns {Promise<Object>} rapport CA
 */
const buildCARapport = async (companyId, dateFrom, dateTo) => {
  const pipeline = [
    {
      $match: {
        companyId,
        statut: { $in: ['validee', 'envoyee', 'partiellement_payee', 'payee'] },
        typeDocument: 'facture',
        isActive: true,
        dateFacture: { $gte: dateFrom, $lte: dateTo },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$dateFacture' },
          month: { $month: '$dateFacture' },
        },
        nbFactures: { $sum: 1 },
        caHT: { $sum: '$totalHT' },
        tva: { $sum: '$totalTVA' },
        caTTC: { $sum: '$totalTTC' },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ];

  const rows = await Facture.aggregate(pipeline);

  const lignes = rows.map((row) => ({
    mois: row._id.month,
    annee: row._id.year,
    label: formatMonthLabel(row._id.year, row._id.month),
    nbFactures: row.nbFactures,
    caHT: row.caHT,
    tva: row.tva,
    caTTC: row.caTTC,
  }));

  const totalHT = lignes.reduce((s, l) => s + l.caHT, 0);
  const totalTVA = lignes.reduce((s, l) => s + l.tva, 0);
  const totalTTC = lignes.reduce((s, l) => s + l.caTTC, 0);
  const nbFacturesTotal = lignes.reduce((s, l) => s + l.nbFactures, 0);

  return { lignes, totalHT, totalTVA, totalTTC, nbFacturesTotal };
};

/**
 * @desc    Get CA par periode as JSON
 * @route   GET /api/rapports/ca
 * @access  Private — rapports:read
 */
const getCAJSON = async (req, res, next) => {
  try {
    const { dateFrom, dateTo } = resolveCAPeriod(req.query.dateFrom, req.query.dateTo);
    const rapport = await buildCARapport(tc(req), dateFrom, dateTo);

    res.json({
      success: true,
      data: { rapport, dateFrom, dateTo },
      message: 'Chiffre d\'affaires recupere avec succes',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get CA par periode as PDF download
 * @route   GET /api/rapports/ca/pdf
 * @access  Private — rapports:read
 */
const getCAPDF = async (req, res, next) => {
  try {
    const { dateFrom, dateTo } = resolveCAPeriod(req.query.dateFrom, req.query.dateTo);

    const [rapport, company] = await Promise.all([
      buildCARapport(tc(req), dateFrom, dateTo),
      Company.findById(tc(req)).lean(),
    ]);

    if (!company) {
      return next(new AppError('Entreprise introuvable.', 404));
    }

    const pdfBuffer = await generateCAPDF(rapport, company, { dateFrom, dateTo });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="rapport-ca-${Date.now()}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  } catch (error) {
    logger.error(`Erreur generation PDF CA: ${error.message}`);
    next(error);
  }
};

// =====================================================
// RELEVÉ DE COMPTE CLIENT
// =====================================================

/**
 * @desc    Relevé de compte client PDF
 * @route   GET /api/rapports/releve-client/:clientId/pdf
 * @access  Private — rapports:read
 */
const getReleveClientPDF = async (req, res, next) => {
  try {
    const companyId = tc(req);
    const { clientId } = req.params;

    const now = new Date();
    const dateFrom = req.query.dateFrom
      ? new Date(req.query.dateFrom)
      : new Date(now.getFullYear(), 0, 1);
    const dateTo = req.query.dateTo ? new Date(req.query.dateTo) : now;

    const [client, company] = await Promise.all([
      Client.findOne({ _id: clientId, companyId }).lean(),
      Company.findById(companyId).lean(),
    ]);

    if (!client) return next(new AppError('Client non trouvé.', 404));
    if (!company) return next(new AppError('Entreprise introuvable.', 404));

    const [factures, paiements] = await Promise.all([
      Facture.find({
        companyId,
        client: clientId,
        typeDocument: 'facture',
        isActive: true,
        dateFacture: { $gte: dateFrom, $lte: dateTo },
      })
        .sort('dateFacture')
        .lean(),
      Payment.find({
        companyId,
        client: clientId,
        typePaiement: 'client',
        statut: 'valide',
        isActive: true,
        dateValidation: { $gte: dateFrom, $lte: dateTo },
      })
        .sort('dateValidation')
        .lean(),
    ]);

    const totalFacture = factures.reduce((s, f) => s + (f.totalTTC || 0), 0);
    const totalPaye = paiements.reduce((s, p) => s + (p.montant || 0), 0);
    const solde = totalFacture - totalPaye;

    const pdfBuffer = await generateReleveClientPDF(
      { client, factures, paiements, totalFacture, totalPaye, solde, nbFactures: factures.length },
      company,
      { dateFrom, dateTo }
    );

    const slug = (client.raisonSociale || `${client.lastName}`).replace(/\s+/g, '-').toLowerCase();
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="releve-${slug}-${Date.now()}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  } catch (error) {
    logger.error(`Erreur generation PDF relevé client: ${error.message}`);
    next(error);
  }
};

// =====================================================
// RAPPORT DE STOCK
// =====================================================

/**
 * @desc    Rapport d'inventaire stock PDF
 * @route   GET /api/rapports/stock/pdf
 * @access  Private — rapports:read
 */
const getRapportStockPDF = async (req, res, next) => {
  try {
    const companyId = tc(req);

    const [stocks, company] = await Promise.all([
      Stock.find({ companyId, isActive: true })
        .populate('product', 'nom reference prixAchat')
        .populate('warehouse', 'nom')
        .sort({ 'product.nom': 1 })
        .lean(),
      Company.findById(companyId).lean(),
    ]);

    if (!company) return next(new AppError('Entreprise introuvable.', 404));

    const lignes = stocks.map((s) => {
      const prixAchat = s.cump || s.product?.prixAchat || 0;
      const valeurTotale = (s.quantite || 0) * prixAchat;
      const alerte = (s.quantite || 0) <= (s.stockMin || 0);
      return {
        reference: s.product?.reference || '—',
        nom: s.product?.nom || '—',
        warehouse: s.warehouse?.nom || 'Stock principal',
        quantite: s.quantite || 0,
        stockMin: s.stockMin || 0,
        prixAchat,
        valeurTotale,
        alerte,
      };
    });

    const valeurTotale = lignes.reduce((s, l) => s + l.valeurTotale, 0);

    const pdfBuffer = await generateRapportStockPDF(
      { lignes, valeurTotale, nbProduits: lignes.length, nbAlertes: lignes.filter((l) => l.alerte).length },
      company
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="rapport-stock-${Date.now()}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  } catch (error) {
    logger.error(`Erreur generation PDF rapport stock: ${error.message}`);
    next(error);
  }
};

// =====================================================
// TOP CLIENTS PAR CA (PÉRIODE LIBRE)
// =====================================================

/**
 * @desc    Top clients par CA sur une période libre
 * @route   GET /api/rapports/top-clients?dateFrom=&dateTo=&limit=
 * @access  Private — rapports:read
 */
const getRapportTopClients = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 20);
    const { dateFrom, dateTo } = resolveCAPeriod(req.query.dateFrom, req.query.dateTo);

    const rows = await Facture.aggregate([
      {
        $match: {
          companyId: tc(req),
          isActive: true,
          typeDocument: 'facture',
          statut: { $in: ['validee', 'envoyee', 'partiellement_payee', 'payee'] },
          dateFacture: { $gte: dateFrom, $lte: dateTo },
        },
      },
      {
        $group: {
          _id: '$client',
          raisonSociale: { $first: '$clientSnapshot.raisonSociale' },
          displayName:   { $first: '$clientSnapshot.displayName' },
          totalCA:       { $sum: '$totalTTC' },
          totalHT:       { $sum: '$totalHT' },
          totalPaye:     { $sum: '$montantPaye' },
          nbFactures:    { $sum: 1 },
        },
      },
      { $sort: { totalCA: -1 } },
      { $limit: limit },
    ]);

    const totalCA = rows.reduce((s, r) => s + r.totalCA, 0);

    const clients = rows.map((r) => ({
      clientId:    r._id,
      displayName: r.raisonSociale || r.displayName || 'Client inconnu',
      totalCA:     r.totalCA,
      totalHT:     r.totalHT,
      totalPaye:   r.totalPaye || 0,
      nbFactures:  r.nbFactures,
      tauxPaiement: r.totalCA > 0 ? Math.round(((r.totalPaye || 0) / r.totalCA) * 100) : 0,
      pct:          totalCA > 0 ? Math.round((r.totalCA / totalCA) * 100) : 0,
    }));

    res.json({ success: true, data: { clients, totalCA, nbClients: clients.length } });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// TOP PRODUITS PAR CA (PÉRIODE LIBRE)
// =====================================================

/**
 * @desc    Top produits par CA sur une période libre
 * @route   GET /api/rapports/top-produits?dateFrom=&dateTo=&limit=
 * @access  Private — rapports:read
 */
const getRapportTopProduits = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 20);
    const { dateFrom, dateTo } = resolveCAPeriod(req.query.dateFrom, req.query.dateTo);

    const rows = await Facture.aggregate([
      {
        $match: {
          companyId: tc(req),
          isActive: true,
          typeDocument: 'facture',
          statut: { $in: ['validee', 'envoyee', 'partiellement_payee', 'payee'] },
          dateFacture: { $gte: dateFrom, $lte: dateTo },
        },
      },
      { $unwind: '$lignes' },
      {
        $group: {
          _id:         { $ifNull: ['$lignes.product', '$lignes.designation'] },
          designation: { $first: '$lignes.designation' },
          totalCA:     { $sum: '$lignes.montantTTC' },
          totalQte:    { $sum: '$lignes.quantite' },
          nbFactures:  { $sum: 1 },
        },
      },
      { $sort: { totalCA: -1 } },
      { $limit: limit },
    ]);

    const totalCA = rows.reduce((s, r) => s + r.totalCA, 0);

    const produits = rows.map((r) => ({
      productId:   r._id,
      designation: r.designation || 'Produit inconnu',
      totalCA:     r.totalCA,
      totalQte:    r.totalQte,
      nbFactures:  r.nbFactures,
      pct:         totalCA > 0 ? Math.round((r.totalCA / totalCA) * 100) : 0,
    }));

    res.json({ success: true, data: { produits, totalCA, nbProduits: produits.length } });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// RAPPORT DE RECOUVREMENT (CRÉANCES)
// =====================================================

/** Shared logic between JSON and PDF recouvrement endpoints */
const buildRecouvrementData = async (companyId) => {
  const now = new Date();

  const factures = await Facture.find({
    companyId,
    statut: { $in: ['envoyee', 'validee', 'partiellement_payee', 'en_retard'] },
    typeDocument: 'facture',
    isActive: true,
  })
    .populate('client', 'raisonSociale firstName lastName email telephone')
    .sort('dateEcheance')
    .lean();

  const buckets = { current: [], '1-30': [], '31-60': [], '61-90': [], '>90': [] };

  factures.forEach((f) => {
    const echeance = f.dateEcheance ? new Date(f.dateEcheance) : now;
    const daysOverdue = Math.floor((now - echeance) / (1000 * 60 * 60 * 24));
    const montantDu = Math.max(0, (f.totalTTC || 0) - (f.montantPaye || 0));
    const clientNom = f.client?.raisonSociale
      || [f.client?.firstName, f.client?.lastName].filter(Boolean).join(' ')
      || f.clientSnapshot?.raisonSociale
      || '—';

    const line = {
      _id:          f._id,
      numero:       f.numero,
      dateFacture:  f.dateFacture,
      dateEcheance: f.dateEcheance,
      daysOverdue,
      montantDu,
      totalTTC:     f.totalTTC || 0,
      montantPaye:  f.montantPaye || 0,
      clientNom,
      clientEmail:  f.client?.email || f.clientSnapshot?.email || '',
      statut:       f.statut,
    };

    if (daysOverdue <= 0)       buckets.current.push(line);
    else if (daysOverdue <= 30) buckets['1-30'].push(line);
    else if (daysOverdue <= 60) buckets['31-60'].push(line);
    else if (daysOverdue <= 90) buckets['61-90'].push(line);
    else                        buckets['>90'].push(line);
  });

  const sumBucket = (b) => b.reduce((s, l) => s + l.montantDu, 0);
  const totalCurrent = sumBucket(buckets.current);
  const total1_30    = sumBucket(buckets['1-30']);
  const total31_60   = sumBucket(buckets['31-60']);
  const total61_90   = sumBucket(buckets['61-90']);
  const totalPlus90  = sumBucket(buckets['>90']);
  const totalDu      = totalCurrent + total1_30 + total31_60 + total61_90 + totalPlus90;

  return {
    buckets,
    totalDu,
    nbCreances:   factures.length,
    totalCurrent,
    total1_30,
    total31_60,
    total61_90,
    totalPlus90,
    total30:      totalCurrent + total1_30,
    totalRetard:  total31_60 + total61_90 + totalPlus90,
  };
};

/**
 * @desc    Rapport de recouvrement / créances JSON
 * @route   GET /api/rapports/recouvrement
 * @access  Private — rapports:read
 */
const getRapportRecouvrement = async (req, res, next) => {
  try {
    const data = await buildRecouvrementData(tc(req));
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Rapport de recouvrement / créances PDF
 * @route   GET /api/rapports/recouvrement/pdf
 * @access  Private — rapports:read
 */
const getRecouvrementPDF = async (req, res, next) => {
  try {
    const companyId = tc(req);

    const [data, company] = await Promise.all([
      buildRecouvrementData(companyId),
      Company.findById(companyId).lean(),
    ]);

    if (!company) return next(new AppError('Entreprise introuvable.', 404));

    const pdfBuffer = await generateRecouvrementPDF(data, company);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="rapport-recouvrement-${Date.now()}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  } catch (error) {
    logger.error(`Erreur generation PDF recouvrement: ${error.message}`);
    next(error);
  }
};

// =====================================================
// RAPPORT ACHATS
// =====================================================

const getRapportAchats = async (req, res, next) => {
  try {
    const { dateFrom, dateTo } = resolveCAPeriod(req.query.dateFrom, req.query.dateTo);
    const cId = tc(req);

    const [statsCmdAchat, statsFactFourn, evolution, topFournisseurs] = await Promise.all([
      CommandeAchat.aggregate([
        { $match: { companyId: cId, dateCommande: { $gte: dateFrom, $lte: dateTo } } },
        { $group: { _id: null, total: { $sum: '$montantTTC' }, count: { $sum: 1 } } },
      ]),
      FactureFournisseur.aggregate([
        { $match: { companyId: cId, dateFacture: { $gte: dateFrom, $lte: dateTo } } },
        { $group: { _id: null, total: { $sum: '$montantTTC' }, totalHT: { $sum: '$montantHT' }, count: { $sum: 1 } } },
      ]),
      FactureFournisseur.aggregate([
        { $match: { companyId: cId, dateFacture: { $gte: dateFrom, $lte: dateTo } } },
        { $group: { _id: { year: { $year: '$dateFacture' }, month: { $month: '$dateFacture' } }, total: { $sum: '$montantTTC' }, count: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      FactureFournisseur.aggregate([
        { $match: { companyId: cId, dateFacture: { $gte: dateFrom, $lte: dateTo } } },
        { $group: { _id: '$fournisseur', total: { $sum: '$montantTTC' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
        { $limit: 10 },
        { $lookup: { from: 'fournisseurs', localField: '_id', foreignField: '_id', as: 'info' } },
        { $unwind: { path: '$info', preserveNullAndEmpty: true } },
        { $project: { designation: { $ifNull: ['$info.nom', 'Inconnu'] }, total: 1, count: 1 } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        kpis: {
          totalAchats: statsFactFourn[0]?.total || 0,
          totalAchatsHT: statsFactFourn[0]?.totalHT || 0,
          nbFacturesFourn: statsFactFourn[0]?.count || 0,
          nbCommandesAchat: statsCmdAchat[0]?.count || 0,
        },
        evolution: evolution.map((m) => ({ mois: formatMonthLabel(m._id.year, m._id.month), total: m.total, count: m.count })),
        topFournisseurs,
        dateFrom,
        dateTo,
      },
    });
  } catch (error) { next(error); }
};

// =====================================================
// RAPPORT STOCKS (valorisation & analyse)
// =====================================================

const getRapportStocksAnalyse = async (req, res, next) => {
  try {
    const cId = tc(req);

    const [valorisation, parCategorie, topProduits, alertes] = await Promise.all([
      Stock.aggregate([
        { $match: { companyId: cId, quantite: { $gt: 0 } } },
        { $group: { _id: null, valeurTotale: { $sum: '$valeurStock' }, nbProduits: { $sum: 1 }, qteTotal: { $sum: '$quantite' } } },
      ]),
      Stock.aggregate([
        { $match: { companyId: cId, quantite: { $gt: 0 } } },
        { $lookup: { from: 'products', localField: 'product', foreignField: '_id', as: 'prod' } },
        { $unwind: { path: '$prod', preserveNullAndEmpty: true } },
        { $lookup: { from: 'categories', localField: 'prod.category', foreignField: '_id', as: 'cat' } },
        { $unwind: { path: '$cat', preserveNullAndEmpty: true } },
        { $group: { _id: { catId: '$cat._id', catNom: '$cat.name' }, valeur: { $sum: '$valeurStock' }, nbProduits: { $sum: 1 } } },
        { $sort: { valeur: -1 } },
        { $project: { designation: { $ifNull: ['$_id.catNom', 'Sans catégorie'] }, valeur: 1, nbProduits: 1 } },
      ]),
      Stock.aggregate([
        { $match: { companyId: cId, quantite: { $gt: 0 } } },
        { $lookup: { from: 'products', localField: 'product', foreignField: '_id', as: 'prod' } },
        { $unwind: '$prod' },
        { $project: { designation: '$prod.name', code: '$prod.code', quantite: 1, valeurStock: 1 } },
        { $sort: { valeurStock: -1 } },
        { $limit: 10 },
      ]),
      Stock.aggregate([
        { $match: { companyId: cId } },
        { $lookup: { from: 'products', localField: 'product', foreignField: '_id', as: 'prod' } },
        { $unwind: '$prod' },
        { $match: { $expr: { $and: [{ $gt: ['$prod.stockAlerte', 0] }, { $lte: ['$quantite', '$prod.stockAlerte'] }] } } },
        { $count: 'total' },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        kpis: {
          valeurTotale: valorisation[0]?.valeurTotale || 0,
          nbReferences: valorisation[0]?.nbProduits || 0,
          qteTotal: valorisation[0]?.qteTotal || 0,
          nbAlertes: alertes[0]?.total || 0,
        },
        parCategorie,
        topProduits,
      },
    });
  } catch (error) { next(error); }
};

// =====================================================
// ANALYSE ABC (Pareto clients / produits)
// =====================================================

const getRapportABC = async (req, res, next) => {
  try {
    const { dateFrom, dateTo } = resolveCAPeriod(req.query.dateFrom, req.query.dateTo);
    const type = req.query.type === 'produits' ? 'produits' : 'clients';
    const cId = tc(req);

    const match = {
      companyId: cId,
      dateFacture: { $gte: dateFrom, $lte: dateTo },
      statut: { $in: ['validee', 'envoyee', 'partiellement_payee', 'payee'] },
    };

    let rawData;
    if (type === 'clients') {
      rawData = await Facture.aggregate([
        { $match: match },
        { $group: { _id: '$client', totalCA: { $sum: '$totalTTC' }, nbFactures: { $sum: 1 } } },
        { $sort: { totalCA: -1 } },
        { $lookup: { from: 'clients', localField: '_id', foreignField: '_id', as: 'info' } },
        { $unwind: { path: '$info', preserveNullAndEmpty: true } },
        {
          $project: {
            designation: {
              $ifNull: [
                { $concat: [{ $ifNull: ['$info.prenom', ''] }, ' ', { $ifNull: ['$info.nom', ''] }] },
                { $ifNull: ['$info.entreprise', 'Client inconnu'] },
              ],
            },
            totalCA: 1,
            nbFactures: 1,
          },
        },
      ]);
    } else {
      rawData = await Facture.aggregate([
        { $match: match },
        { $unwind: '$lignes' },
        { $group: { _id: '$lignes.productId', totalCA: { $sum: '$lignes.montantTTC' }, nbVentes: { $sum: '$lignes.quantite' } } },
        { $sort: { totalCA: -1 } },
        { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'info' } },
        { $unwind: { path: '$info', preserveNullAndEmpty: true } },
        { $project: { designation: { $ifNull: ['$info.name', 'Produit inconnu'] }, totalCA: 1, nbVentes: 1 } },
      ]);
    }

    const totalGlobal = rawData.reduce((s, r) => s + r.totalCA, 0);
    let cumulatif = 0;
    const items = rawData.map((r) => {
      cumulatif += r.totalCA;
      const pct = totalGlobal > 0 ? (r.totalCA / totalGlobal) * 100 : 0;
      const pctCumulatif = totalGlobal > 0 ? (cumulatif / totalGlobal) * 100 : 0;
      const classe = pctCumulatif <= 80 ? 'A' : pctCumulatif <= 95 ? 'B' : 'C';
      return { ...r, pct: Math.round(pct * 10) / 10, pctCumulatif: Math.round(pctCumulatif * 10) / 10, classe };
    });

    const nbA = items.filter((i) => i.classe === 'A').length;
    const nbB = items.filter((i) => i.classe === 'B').length;
    const nbC = items.filter((i) => i.classe === 'C').length;

    res.json({
      success: true,
      data: {
        type,
        items,
        kpis: { totalGlobal, nbItems: items.length, nbA, nbB, nbC },
        dateFrom,
        dateTo,
      },
    });
  } catch (error) { next(error); }
};

// =====================================================
// RAPPORT PERFORMANCE COMMERCIALE
// =====================================================

const getRapportPerformance = async (req, res, next) => {
  try {
    const { dateFrom, dateTo } = resolveCAPeriod(req.query.dateFrom, req.query.dateTo);
    const cId = tc(req);

    const periodeMatch = { companyId: cId, createdAt: { $gte: dateFrom, $lte: dateTo } };

    const [
      statsDevis,
      statsCommandes,
      statsFactures,
      statsPaiements,
      panierStats,
      nouveauxClients,
    ] = await Promise.all([
      Devis.aggregate([{ $match: periodeMatch }, { $group: { _id: null, count: { $sum: 1 }, totalCA: { $sum: '$montantTTC' }, acceptes: { $sum: { $cond: [{ $eq: ['$statut', 'accepte'] }, 1, 0] } } } }]),
      Commande.aggregate([{ $match: periodeMatch }, { $group: { _id: null, count: { $sum: 1 }, totalCA: { $sum: '$montantTTC' } } }]),
      Facture.aggregate([{ $match: { ...periodeMatch, statut: { $in: ['validee', 'envoyee', 'partiellement_payee', 'payee'] } } }, { $group: { _id: null, count: { $sum: 1 }, totalCA: { $sum: '$totalTTC' } } }]),
      Payment.aggregate([{ $match: { companyId: cId, createdAt: { $gte: dateFrom, $lte: dateTo } } }, { $group: { _id: null, total: { $sum: '$montant' }, count: { $sum: 1 } } }]),
      Facture.aggregate([
        { $match: { ...periodeMatch, statut: { $in: ['validee', 'envoyee', 'partiellement_payee', 'payee'] } } },
        { $group: { _id: null, panierMoyen: { $avg: '$totalTTC' }, maxCA: { $max: '$totalTTC' }, minCA: { $min: '$totalTTC' } } },
      ]),
      Client.countDocuments({ ...periodeMatch }),
    ]);

    const nbDevis = statsDevis[0]?.count || 0;
    const nbDevisAcceptes = statsDevis[0]?.acceptes || 0;
    const nbCommandes = statsCommandes[0]?.count || 0;
    const nbFactures = statsFactures[0]?.count || 0;

    const tauxConversionDevis = nbDevis > 0 ? Math.round((nbDevisAcceptes / nbDevis) * 100) : 0;
    const tauxConversionCommande = nbDevis > 0 ? Math.round((nbCommandes / nbDevis) * 100) : 0;

    res.json({
      success: true,
      data: {
        kpis: {
          nbDevis,
          nbDevisAcceptes,
          nbCommandes,
          nbFactures,
          totalCA: statsFactures[0]?.totalCA || 0,
          totalEncaisse: statsPaiements[0]?.total || 0,
          panierMoyen: Math.round(panierStats[0]?.panierMoyen || 0),
          tauxConversionDevis,
          tauxConversionCommande,
          nouveauxClients,
        },
        funnel: [
          { etape: 'Devis', count: nbDevis, color: '#6366f1' },
          { etape: 'Devis acceptés', count: nbDevisAcceptes, color: '#8b5cf6' },
          { etape: 'Commandes', count: nbCommandes, color: '#1a56db' },
          { etape: 'Factures', count: nbFactures, color: '#059669' },
        ],
        dateFrom,
        dateTo,
      },
    });
  } catch (error) { next(error); }
};

// =====================================================
// RAPPORT D'ACTIVITE GLOBALE
// =====================================================

const getRapportActivite = async (req, res, next) => {
  try {
    const { dateFrom, dateTo } = resolveCAPeriod(req.query.dateFrom, req.query.dateTo);
    const cId = tc(req);

    const match = (extra = {}) => ({ companyId: cId, createdAt: { $gte: dateFrom, $lte: dateTo }, ...extra });

    const [
      nbDevis, nbCommandes, nbBL, nbFactures, nbPaiements,
      nbCmdAchat, nbFactFourn, nbClients, nbTransferts,
      caFactures, totalPaiements, totalAchats,
      evolutionCA,
    ] = await Promise.all([
      Devis.countDocuments(match()),
      Commande.countDocuments(match()),
      // BonLivraison not imported yet — use Facture count as proxy or skip
      Facture.countDocuments(match({ statut: { $in: ['envoyee'] } })),
      Facture.countDocuments(match({ statut: { $in: ['validee', 'envoyee', 'partiellement_payee', 'payee'] } })),
      Payment.countDocuments({ companyId: cId, createdAt: { $gte: dateFrom, $lte: dateTo } }),
      CommandeAchat.countDocuments(match()),
      FactureFournisseur.countDocuments(match()),
      Client.countDocuments(match()),
      Stock.countDocuments({ companyId: cId }),
      Facture.aggregate([{ $match: match({ statut: { $in: ['validee', 'envoyee', 'partiellement_payee', 'payee'] } }) }, { $group: { _id: null, total: { $sum: '$totalTTC' } } }]),
      Payment.aggregate([{ $match: { companyId: cId, createdAt: { $gte: dateFrom, $lte: dateTo } } }, { $group: { _id: null, total: { $sum: '$montant' } } }]),
      FactureFournisseur.aggregate([{ $match: match() }, { $group: { _id: null, total: { $sum: '$montantTTC' } } }]),
      Facture.aggregate([
        { $match: match({ statut: { $in: ['validee', 'envoyee', 'partiellement_payee', 'payee'] } }) },
        { $group: { _id: { year: { $year: '$dateFacture' }, month: { $month: '$dateFacture' } }, ca: { $sum: '$totalTTC' } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        kpis: {
          nbDevis, nbCommandes, nbFactures, nbPaiements,
          nbCmdAchat, nbFactFourn, nbClients, nbTransferts,
          caFactures: caFactures[0]?.total || 0,
          totalPaiements: totalPaiements[0]?.total || 0,
          totalAchats: totalAchats[0]?.total || 0,
        },
        modules: [
          { label: 'Devis créés',        count: nbDevis,       color: '#6366f1', icon: 'devis' },
          { label: 'Commandes',           count: nbCommandes,   color: '#1a56db', icon: 'commandes' },
          { label: 'Factures ventes',     count: nbFactures,    color: '#059669', icon: 'factures' },
          { label: 'Paiements reçus',     count: nbPaiements,   color: '#10b981', icon: 'paiements' },
          { label: 'Cmds achat',          count: nbCmdAchat,    color: '#f59e0b', icon: 'achats' },
          { label: 'Factures fourn.',     count: nbFactFourn,   color: '#ef4444', icon: 'fournisseur' },
          { label: 'Nouveaux clients',    count: nbClients,     color: '#8b5cf6', icon: 'clients' },
          { label: 'Références en stock', count: nbTransferts,  color: '#0ea5e9', icon: 'stocks' },
        ],
        evolutionCA: evolutionCA.map((m) => ({ mois: formatMonthLabel(m._id.year, m._id.month), ca: m.ca })),
        dateFrom,
        dateTo,
      },
    });
  } catch (error) { next(error); }
};

// =====================================================
// RAPPORT FINANCIER (trésorerie & flux)
// =====================================================

const BankAccount = require('../models/BankAccount');
const PaymentModel = require('../models/Payment');

const getRapportFinancier = async (req, res, next) => {
  try {
    const { dateFrom, dateTo } = resolveCAPeriod(req.query.dateFrom, req.query.dateTo);
    const cId = tc(req);

    const payMatch = (type) => ({
      companyId: cId,
      statut: 'valide',
      typePaiement: type,
      datePaiement: { $gte: dateFrom, $lte: dateTo },
    });

    const [
      comptes,
      statsEnc,
      statsDec,
      evolutionEnc,
      evolutionDec,
      parModeEnc,
      creancessClients,
    ] = await Promise.all([
      BankAccount.find({ companyId: cId, isActive: true }).sort('-isDefault nom'),
      PaymentModel.aggregate([{ $match: payMatch('client') },    { $group: { _id: null, total: { $sum: '$montant' }, count: { $sum: 1 } } }]),
      PaymentModel.aggregate([{ $match: payMatch('fournisseur') }, { $group: { _id: null, total: { $sum: '$montant' }, count: { $sum: 1 } } }]),
      PaymentModel.aggregate([
        { $match: payMatch('client') },
        { $group: { _id: { year: { $year: '$datePaiement' }, month: { $month: '$datePaiement' } }, total: { $sum: '$montant' } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      PaymentModel.aggregate([
        { $match: payMatch('fournisseur') },
        { $group: { _id: { year: { $year: '$datePaiement' }, month: { $month: '$datePaiement' } }, total: { $sum: '$montant' } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      PaymentModel.aggregate([
        { $match: payMatch('client') },
        { $group: { _id: '$modePaiement', total: { $sum: '$montant' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),
      Facture.aggregate([
        { $match: { companyId: cId, statut: { $in: ['validee', 'envoyee', 'partiellement_payee'] }, isActive: true } },
        { $group: { _id: null, total: { $sum: { $subtract: ['$totalTTC', '$montantPaye'] } }, count: { $sum: 1 } } },
      ]),
    ]);

    const totalTresorerie = comptes.reduce((s, c) => s + c.soldeActuel, 0);
    const totalEnc = statsEnc[0]?.total || 0;
    const totalDec = statsDec[0]?.total || 0;

    // Merge evolution months
    const allMonths = new Set([
      ...evolutionEnc.map((m) => `${m._id.year}-${m._id.month}`),
      ...evolutionDec.map((m) => `${m._id.year}-${m._id.month}`),
    ]);
    const encMap = Object.fromEntries(evolutionEnc.map((m) => [`${m._id.year}-${m._id.month}`, m.total]));
    const decMap = Object.fromEntries(evolutionDec.map((m) => [`${m._id.year}-${m._id.month}`, m.total]));
    const evolution = Array.from(allMonths).sort().map((key) => {
      const [year, month] = key.split('-').map(Number);
      return { mois: formatMonthLabel(year, month), encaissements: encMap[key] || 0, decaissements: decMap[key] || 0 };
    });

    const comptesData = comptes.map((c) => ({
      _id: c._id,
      nom: c.nom,
      type: c.type,
      banque: c.banque,
      numeroCompte: c.numeroCompte,
      soldeActuel: c.soldeActuel,
      isDefault: c.isDefault,
    }));

    res.json({
      success: true,
      data: {
        kpis: {
          totalTresorerie,
          totalEncaissements: totalEnc,
          totalDecaissements: totalDec,
          soldeNet: totalEnc - totalDec,
          nbEncaissements: statsEnc[0]?.count || 0,
          nbDecaissements: statsDec[0]?.count || 0,
          creancesClients: creancessClients[0]?.total || 0,
          nbCreances: creancessClients[0]?.count || 0,
        },
        evolution,
        comptes: comptesData,
        parModeEnc: parModeEnc.map((m) => ({ mode: m._id, total: m.total, count: m.count })),
        dateFrom,
        dateTo,
      },
    });
  } catch (error) { next(error); }
};

module.exports = {
  getBilanJSON,
  getBilanPDF,
  getResultatJSON,
  getResultatPDF,
  getCAJSON,
  getCAPDF,
  getReleveClientPDF,
  getRapportStockPDF,
  getRapportTopClients,
  getRapportTopProduits,
  getRapportRecouvrement,
  getRecouvrementPDF,
  getRapportAchats,
  getRapportStocksAnalyse,
  getRapportABC,
  getRapportPerformance,
  getRapportActivite,
  getRapportFinancier,
};

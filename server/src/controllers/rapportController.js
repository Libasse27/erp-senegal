const Company = require('../models/Company');
const Facture = require('../models/Facture');
const Client = require('../models/Client');
const Payment = require('../models/Payment');
const Stock = require('../models/Stock');
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
};

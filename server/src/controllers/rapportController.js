const Company = require('../models/Company');
const Facture = require('../models/Facture');
const { AppError } = require('../middlewares/errorHandler');
const comptabiliteService = require('../services/comptabiliteService');
const { generateBilanPDF, generateResultatPDF, generateCAPDF } = require('../services/pdfService');
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

module.exports = {
  getBilanJSON,
  getBilanPDF,
  getResultatJSON,
  getResultatPDF,
  getCAJSON,
  getCAPDF,
};

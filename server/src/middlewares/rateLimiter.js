const rateLimit = require('express-rate-limit');

/** Global API limiter: 100 req/min */
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW, 10) || 60_000,
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  message: {
    success: false,
    message: 'Trop de requetes depuis cette adresse IP. Veuillez reessayer dans une minute.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/** Auth endpoints: 10 attempts per 15 min */
const authLimiter = rateLimit({
  windowMs: 15 * 60_000,
  max: 10,
  message: {
    success: false,
    message: 'Trop de tentatives de connexion. Veuillez reessayer dans 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/** PDF generation: 10 req per 10 min (Puppeteer is CPU/memory intensive) */
const pdfLimiter = rateLimit({
  windowMs: 10 * 60_000,
  max: 10,
  message: {
    success: false,
    message: 'Limite de generation PDF atteinte. Veuillez reessayer dans 10 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/** Export (Excel/CSV/FEC): 20 req per 5 min */
const exportLimiter = rateLimit({
  windowMs: 5 * 60_000,
  max: 20,
  message: {
    success: false,
    message: 'Limite d\'exportation atteinte. Veuillez reessayer dans 5 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/** File uploads: 30 req per 15 min */
const uploadLimiter = rateLimit({
  windowMs: 15 * 60_000,
  max: 30,
  message: {
    success: false,
    message: 'Limite de telechargement de fichiers atteinte. Veuillez reessayer dans 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { limiter, authLimiter, pdfLimiter, exportLimiter, uploadLimiter };

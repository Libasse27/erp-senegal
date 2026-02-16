const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW, 10) || 60000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  message: {
    success: false,
    message: 'Trop de requetes depuis cette adresse IP. Veuillez reessayer dans une minute.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limiteur plus strict pour l'authentification
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    message:
      'Trop de tentatives de connexion. Veuillez reessayer dans 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { limiter, authLimiter };

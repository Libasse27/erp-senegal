const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError } = require('./errorHandler');
const jwtConfig = require('../config/jwt');

/**
 * Middleware de protection — verifie le JWT, charge l'utilisateur complet
 * et expose req.companyId + req.scope pour les middlewares suivants.
 */
const protect = async (req, _res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Acces non autorise. Veuillez vous connecter.', 401));
    }

    const decoded = jwt.verify(token, jwtConfig.accessToken.secret);

    const user = await User.findById(decoded.id).populate({
      path: 'role',
      populate: { path: 'permissions' },
    });

    if (!user) {
      return next(new AppError('Utilisateur non trouve. Token invalide.', 401));
    }

    if (!user.isActive) {
      return next(new AppError('Votre compte a ete desactive. Contactez un administrateur.', 401));
    }

    req.user = user;
    // Raccourcis pratiques pour tenant.js et subscriptionGuard.js
    req.scope = decoded.scope || user.scope || 'ENTREPRISE';
    req.companyId = decoded.companyId || user.companyId || null;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Token invalide. Veuillez vous reconnecter.', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token expire. Veuillez vous reconnecter.', 401));
    }
    next(error);
  }
};

module.exports = { protect };

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError } = require('./errorHandler');
const jwtConfig = require('../config/jwt');

/**
 * Middleware de protection des routes - verifie le JWT et charge l'utilisateur
 */
const protect = async (req, _res, next) => {
  try {
    let token;

    // Verifier le header Authorization
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Acces non autorise. Veuillez vous connecter.', 401));
    }

    // Verifier le token
    const decoded = jwt.verify(token, jwtConfig.accessToken.secret);

    // Charger l'utilisateur
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

    // Ajouter l'utilisateur a la requete
    req.user = user;
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

const { AppError } = require('./errorHandler');

/**
 * Middleware qui reserve l'acces exclusivement au Super Administrateur.
 * Le Super Admin est le seul role qui ne peut jamais etre restreint.
 */
const requireSuperAdmin = (req, _res, next) => {
  if (!req.user) {
    return next(new AppError('Acces non autorise. Veuillez vous connecter.', 401));
  }
  if (!req.user.role || req.user.role.name !== 'super_admin') {
    return next(new AppError('Acces reserve au Super Administrateur uniquement.', 403));
  }
  next();
};

module.exports = { requireSuperAdmin };

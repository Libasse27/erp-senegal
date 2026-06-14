const { AppError } = require('./errorHandler');

/**
 * Réserve la route aux utilisateurs de scope PLATFORM (super_admin uniquement).
 * À placer après protect() dans la chaîne de middlewares.
 */
const platformGuard = (req, _res, next) => {
  if (!req.user) {
    return next(new AppError('Acces non autorise. Veuillez vous connecter.', 401));
  }

  if (req.scope !== 'PLATFORM') {
    return next(
      new AppError('Acces reserve a l\'administration de la plateforme.', 403)
    );
  }

  next();
};

module.exports = platformGuard;

const { AppError } = require('./errorHandler');
const { ROLES } = require('../config/constants');

/**
 * Middleware d'autorisation par permission
 * @param {string} requiredPermission - Code de permission requis (ex: "users:read")
 */
const authorize = (requiredPermission) => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError('Acces non autorise. Veuillez vous connecter.', 401));
    }

    // Super Admin et Admin ont acces a tout
    const roleName = req.user.role?.name;
    if (roleName === ROLES.SUPER_ADMIN || roleName === ROLES.ADMIN) {
      return next();
    }

    // Verifier la permission
    if (!req.user.role || !req.user.role.permissions) {
      return next(
        new AppError("Vous n'avez pas les permissions necessaires pour cette action.", 403)
      );
    }

    const hasPermission = req.user.role.permissions.some(
      (perm) => perm.code === requiredPermission && perm.isActive
    );

    if (!hasPermission) {
      return next(
        new AppError("Vous n'avez pas les permissions necessaires pour cette action.", 403)
      );
    }

    next();
  };
};

/**
 * Middleware d'autorisation par role(s)
 * @param  {...string} roles - Noms de roles autorises
 */
const authorizeRoles = (...roles) => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError('Acces non autorise. Veuillez vous connecter.', 401));
    }

    // Super Admin bypasse toutes les restrictions de role
    if (req.user.role?.name === ROLES.SUPER_ADMIN) {
      return next();
    }

    if (!req.user.role || !roles.includes(req.user.role.name)) {
      return next(
        new AppError("Vous n'avez pas les permissions necessaires pour cette action.", 403)
      );
    }

    next();
  };
};

module.exports = { authorize, authorizeRoles };

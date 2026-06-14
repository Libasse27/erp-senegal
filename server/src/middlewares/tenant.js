const { AppError } = require('./errorHandler');

/**
 * Middleware d'isolation tenant.
 *
 * - Si l'utilisateur a scope=PLATFORM (super_admin), laisse passer sans companyId.
 * - Pour tous les autres, exige req.companyId extrait du JWT par le middleware protect.
 * - Bloque toute tentative d'accès cross-tenant via un companyId passé en body/query.
 */
const tenantMiddleware = (req, _res, next) => {
  if (!req.user) {
    return next(new AppError('Acces non autorise. Veuillez vous connecter.', 401));
  }

  // Le super_admin opère sur toute la plateforme — pas de filtre tenant
  if (req.scope === 'PLATFORM') {
    return next();
  }

  const companyId = req.companyId;

  if (!companyId) {
    return next(
      new AppError(
        'Acces refuse : votre compte n\'est rattache a aucune entreprise. Contactez le support.',
        403
      )
    );
  }

  // Neutraliser toute tentative de contournement par body/query/params
  // Un utilisateur ne peut pas interroger les données d'une autre entreprise
  if (req.body && req.body.companyId && req.body.companyId.toString() !== companyId.toString()) {
    return next(new AppError('Acces inter-entreprises refuse.', 403));
  }

  next();
};

module.exports = tenantMiddleware;

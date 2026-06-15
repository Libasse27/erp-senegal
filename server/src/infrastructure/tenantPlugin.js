const tenantStorage = require('./tenantContext');

const QUERY_HOOKS = [
  'find',
  'findOne',
  'count',
  'countDocuments',
  'findOneAndUpdate',
  'findOneAndDelete',
  'updateOne',
  'updateMany',
  'deleteOne',
  'deleteMany',
];

/**
 * Mongoose plugin — auto-isole chaque requête par companyId.
 *
 * - S'applique uniquement aux schémas qui ont un champ companyId déclaré.
 * - Lit le contexte courant depuis AsyncLocalStorage (tenantContext).
 * - Échappe par { skipTenant: true } dans les options de requête (super admin cross-tenant).
 * - Ne touche pas aux agrégations — les controllers restent responsables du $match companyId.
 */
const tenantPlugin = (schema) => {
  // Platform models (Plan, Company, Abonnement, Role, etc.) n'ont pas companyId → skip
  if (!schema.path('companyId')) return;

  // Pre-save : injecter companyId si absent (création via code interne sans req)
  schema.pre('save', function (next) {
    const store = tenantStorage.getStore();
    if (store?.companyId && !this.companyId) {
      this.companyId = store.companyId;
    }
    next();
  });

  // Pre-query : injecter le filtre companyId sur toutes les lectures/mises à jour
  QUERY_HOOKS.forEach((hook) => {
    schema.pre(hook, function (next) {
      // Escape hatch pour les requêtes cross-tenant autorisées (super admin, jobs)
      if (this.options?.skipTenant) return next();

      const store = tenantStorage.getStore();
      // Injecter uniquement si un companyId est en contexte ET qu'il n'est pas déjà filtré
      if (store?.companyId && !this.getFilter().companyId) {
        this.where({ companyId: store.companyId });
      }
      next();
    });
  });
};

module.exports = tenantPlugin;

const mongoose = require('mongoose');

/**
 * Retourne le companyId brut depuis la requête (string ou ObjectId).
 * Null pour les utilisateurs PLATFORM (super_admin).
 */
const tc = (req) => req.companyId || null;

/**
 * Construit un filtre de base incluant companyId.
 * Usage : const filter = tenantFilter(req, { statut: 'actif' });
 */
const tenantFilter = (req, extra = {}) => ({
  companyId: tc(req),
  ...extra,
});

/**
 * Retourne le companyId sous forme d'ObjectId Mongoose.
 * Nécessaire pour les pipelines d'agrégation ($match ne cast pas automatiquement).
 */
const tenantId = (req) => {
  const id = tc(req);
  if (!id) return null;
  try {
    return new mongoose.Types.ObjectId(String(id));
  } catch {
    return null;
  }
};

/**
 * Recherche un document par _id en s'assurant qu'il appartient au bon tenant.
 * Remplace findById() dans les opérations d'update/delete pour empêcher
 * qu'un utilisateur modifie un document d'une autre entreprise.
 */
const findByTenant = (Model, id, req, projection) =>
  Model.findOne({ _id: id, companyId: tc(req) }, projection);

module.exports = { tc, tenantFilter, tenantId, findByTenant };

const crypto = require('crypto');

/**
 * Generer une reference unique pour un document
 * @param {string} prefix - Prefixe du document (FA, DE, BC, etc.)
 * @param {number} sequence - Numero de sequence
 * @returns {string} Reference formatee (ex: "FA-2024-000001")
 */
const generateReference = (prefix, sequence) => {
  const year = new Date().getFullYear();
  const seq = String(sequence).padStart(6, '0');
  return `${prefix}-${year}-${seq}`;
};

/**
 * Nettoyer le body d'une requete (supprimer les champs non autorises)
 * @param {Object} body - Corps de la requete
 * @param {string[]} allowedFields - Champs autorises
 * @returns {Object} Corps nettoye
 */
const sanitizeBody = (body, allowedFields) => {
  const sanitized = {};
  Object.keys(body).forEach((key) => {
    if (allowedFields.includes(key)) {
      sanitized[key] = body[key];
    }
  });
  return sanitized;
};

/**
 * Construire les options de pagination a partir des query params
 * @param {Object} query - Query params de la requete
 * @returns {Object} Options de pagination { page, limit, skip, sort }
 */
const buildPaginationOptions = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 25));
  const skip = (page - 1) * limit;

  let sort = '-createdAt';
  if (query.sort) {
    sort = query.sort.split(',').join(' ');
  }

  return { page, limit, skip, sort };
};

/**
 * Construire la reponse de pagination
 * @param {number} total - Total de documents
 * @param {number} page - Page actuelle
 * @param {number} limit - Limite par page
 * @returns {Object} Metadata de pagination
 */
const buildPaginationResponse = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

/**
 * Generer un token crypto aleatoire
 * @param {number} bytes - Nombre de bytes
 * @returns {string} Token hexadecimal
 */
const generateCryptoToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex');
};

/**
 * Hasher un token avec SHA-256
 * @param {string} token - Token a hasher
 * @returns {string} Token hashe
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

module.exports = {
  generateReference,
  sanitizeBody,
  buildPaginationOptions,
  buildPaginationResponse,
  generateCryptoToken,
  hashToken,
};

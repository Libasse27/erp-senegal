/**
 * Senegalese business format validators
 */

/**
 * Validate NINEA format (Numero d'Identification Nationale des Entreprises et Associations)
 * Format: 7 digits + 1 letter + 1 digit + 1 letter + 1 digit (e.g., 0012345 2G3)
 * @param {string} ninea - NINEA to validate
 * @returns {boolean}
 */
const isValidNINEA = (ninea) => {
  if (!ninea) return false;
  const cleaned = ninea.replace(/\s/g, '');
  return /^\d{7}[A-Z]\d[A-Z]\d$/.test(cleaned) || /^\d{7,10}$/.test(cleaned);
};

/**
 * Validate Senegalese phone number
 * Formats: +221 XX XXX XX XX or 77XXXXXXX, 78XXXXXXX, 76XXXXXXX, 70XXXXXXX, 33XXXXXXX
 * @param {string} phone - Phone number to validate
 * @returns {boolean}
 */
const isValidSenegalPhone = (phone) => {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s\-\.\(\)]/g, '');
  return /^(\+221)?[73][0-9]{8}$/.test(cleaned);
};

/**
 * Validate RC (Registre du Commerce) format for Senegal
 * Format: SN-DKR-YYYY-X-XXXXX (approximate)
 * @param {string} rc - RC to validate
 * @returns {boolean}
 */
const isValidRC = (rc) => {
  if (!rc) return false;
  return /^SN-[A-Z]{2,4}-\d{4}-[A-Z]-\d{3,6}$/.test(rc) || rc.length >= 5;
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
const isValidEmail = (email) => {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/**
 * Validate a MongoDB ObjectId string
 * @param {string} id - ID to validate
 * @returns {boolean}
 */
const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

module.exports = {
  isValidNINEA,
  isValidSenegalPhone,
  isValidRC,
  isValidEmail,
  isValidObjectId,
};

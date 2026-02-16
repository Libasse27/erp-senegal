/**
 * Validate email format
 * @param {string} email
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/**
 * Validate Senegalese phone number
 * @param {string} phone
 * @returns {boolean}
 */
export const isValidPhone = (phone) => {
  if (!phone) return true; // optional field
  return /^(\+221)?\s?(70|75|76|77|78)\s?\d{3}\s?\d{2}\s?\d{2}$/.test(phone.trim());
};

/**
 * Validate NINEA format
 * @param {string} ninea
 * @returns {boolean}
 */
export const isValidNINEA = (ninea) => {
  if (!ninea) return true;
  return /^\d{7,10}\s?\d[A-Z]\d$/.test(ninea.trim());
};

/**
 * Validate MongoDB ObjectId format
 * @param {string} id
 * @returns {boolean}
 */
export const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Check if a value is a positive integer (for FCFA amounts)
 * @param {*} value
 * @returns {boolean}
 */
export const isPositiveInteger = (value) => {
  return Number.isInteger(Number(value)) && Number(value) >= 0;
};

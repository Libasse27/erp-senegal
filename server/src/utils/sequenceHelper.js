const Settings = require('../models/Settings');

/**
 * Generate next sequence number atomically using $inc
 * Eliminates race conditions vs countDocuments()
 * @param {string} type - Numbering type key in Settings.numbering (e.g. 'invoice', 'quote')
 * @returns {Promise<{sequence: number, numero: string}>}
 */
const getNextSequence = async (type) => {
  const field = `numbering.${type}.currentSequence`;

  const settings = await Settings.findOneAndUpdate(
    { isActive: true },
    { $inc: { [field]: 1 } },
    { new: true }
  );

  if (!settings) {
    throw new Error('Parametres non trouves. Veuillez initialiser les parametres.');
  }

  const config = settings.numbering[type];
  if (!config) {
    throw new Error(`Type de numerotation "${type}" non configure.`);
  }

  const sequence = config.currentSequence;
  const numero = buildNumero(config.prefix, new Date().getFullYear(), sequence);

  return { sequence, numero };
};

/**
 * Build a document number from prefix, year and sequence
 * Format: PREFIX + YYYY + '-' + NNNNN (zero-padded to 5 digits)
 * @param {string} prefix - Document prefix (FA, DE, CM, BL, AV)
 * @param {number} year - Full year
 * @param {number} seq - Sequence number
 * @returns {string} Formatted document number
 */
const buildNumero = (prefix, year, seq) => {
  return `${prefix}${year}-${String(seq).padStart(5, '0')}`;
};

module.exports = {
  getNextSequence,
  buildNumero,
};

const Settings = require('../models/Settings');
const logger   = require('../config/logger');

/**
 * Provisionne une nouvelle entreprise juste après activation de l'abonnement.
 * Idempotent : si Settings existe déjà, aucune action.
 *
 * Appelé dans setImmediate (non-bloquant) depuis activerAbonnement.
 * @param {string|ObjectId} companyId
 */
const provisionnerNouvelleCompany = async (companyId) => {
  try {
    const existant = await Settings.findOne({ companyId });
    if (existant) return;

    await Settings.create({
      companyId,
      isActive: true,
      numbering: {
        invoice:       { prefix: 'FA', currentSequence: 0, format: 'FA-{YYYY}-{SEQ}' },
        quote:         { prefix: 'DE', currentSequence: 0, format: 'DE-{YYYY}-{SEQ}' },
        purchaseOrder: { prefix: 'BC', currentSequence: 0, format: 'BC-{YYYY}-{SEQ}' },
        deliveryNote:  { prefix: 'BL', currentSequence: 0, format: 'BL-{YYYY}-{SEQ}' },
        creditNote:    { prefix: 'AV', currentSequence: 0, format: 'AV-{YYYY}-{SEQ}' },
        salesOrder:    { prefix: 'CM', currentSequence: 0, format: 'CM-{YYYY}-{SEQ}' },
        payment:       { prefix: 'PA', currentSequence: 0, format: 'PA-{YYYY}-{SEQ}' },
      },
      general: {
        defaultPaymentTermDays: 30,
        defaultTvaRate: 18,
        currency: 'XOF',
        locale: 'fr-SN',
        timezone: 'Africa/Dakar',
      },
    });

    logger.info(`[Provisioning] Settings créés — company=${companyId}`);
  } catch (err) {
    logger.warn(`[Provisioning] Échec pour company=${companyId} : ${err.message}`);
  }
};

module.exports = { provisionnerNouvelleCompany };

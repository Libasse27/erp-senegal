const Joi = require('joi');

const numberingSchema = Joi.object({
  prefix: Joi.string().trim().min(1).max(5).optional(),
  currentSequence: Joi.number().integer().min(0).optional(),
  format: Joi.string().trim().max(50).optional(),
});

const updateSettings = Joi.object({
  numbering: Joi.object({
    invoice: numberingSchema.optional(),
    quote: numberingSchema.optional(),
    purchaseOrder: numberingSchema.optional(),
    deliveryNote: numberingSchema.optional(),
    creditNote: numberingSchema.optional(),
    payment: numberingSchema.optional(),
  }).optional(),

  fiscalYear: Joi.object({
    startMonth: Joi.number().integer().min(1).max(12).optional(),
    startDay: Joi.number().integer().min(1).max(31).optional(),
    currentYear: Joi.number().integer().min(2020).max(2100).optional(),
  }).optional(),

  general: Joi.object({
    defaultPaymentTermDays: Joi.number().integer().min(0).max(365).optional(),
    defaultTvaRate: Joi.number().valid(0, 18).optional(),
    currency: Joi.string().trim().optional(),
    language: Joi.string().trim().valid('fr', 'en').optional(),
    timezone: Joi.string().trim().optional(),
    dateFormat: Joi.string().trim().optional(),
  }).optional(),

  emailNotifications: Joi.object({
    onInvoiceCreated: Joi.boolean().optional(),
    onPaymentReceived: Joi.boolean().optional(),
    onQuoteAccepted: Joi.boolean().optional(),
    onLowStock: Joi.boolean().optional(),
  }).optional(),
})
  .min(1)
  .messages({
    'object.min': 'Au moins un champ doit etre fourni pour la mise a jour',
  });

module.exports = {
  updateSettings,
};

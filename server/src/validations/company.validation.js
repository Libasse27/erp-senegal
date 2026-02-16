const Joi = require('joi');

const updateCompany = Joi.object({
  name: Joi.string().trim().min(2).max(200).optional(),
  legalForm: Joi.string()
    .valid('SARL', 'SA', 'SAS', 'SASU', 'SNC', 'EI', 'GIE', 'Autre')
    .optional(),
  ninea: Joi.string().trim().uppercase().optional(),
  rccm: Joi.string().trim().optional(),
  address: Joi.object({
    street: Joi.string().trim().allow('').optional(),
    city: Joi.string().trim().optional(),
    region: Joi.string().trim().allow('').optional(),
    postalCode: Joi.string().trim().allow('').optional(),
    country: Joi.string().trim().optional(),
  }).optional(),
  phone: Joi.string().trim().allow('').optional(),
  fax: Joi.string().trim().allow('').optional(),
  email: Joi.string().trim().email().allow('').optional(),
  website: Joi.string().trim().allow('').optional(),
  bankInfo: Joi.object({
    bankName: Joi.string().trim().allow('').optional(),
    accountNumber: Joi.string().trim().allow('').optional(),
    iban: Joi.string().trim().allow('').optional(),
    swift: Joi.string().trim().allow('').optional(),
  }).optional(),
  fiscalInfo: Joi.object({
    tvaRate: Joi.number().min(0).max(100).optional(),
    isSubjectToTVA: Joi.boolean().optional(),
    fiscalRegime: Joi.string()
      .valid('reel_normal', 'reel_simplifie', 'contribuable_unique')
      .optional(),
  }).optional(),
  currency: Joi.string().trim().optional(),
}).min(1).messages({
  'object.min': 'Au moins un champ doit etre fourni pour la mise a jour',
});

module.exports = {
  updateCompany,
};

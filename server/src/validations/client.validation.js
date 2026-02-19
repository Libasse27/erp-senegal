const Joi = require('joi');

const contactPersonSchema = Joi.object({
  name: Joi.string().trim().max(100).allow('').optional(),
  phone: Joi.string().trim().max(30).allow('').optional(),
  email: Joi.string().trim().email().allow('').optional(),
  position: Joi.string().trim().max(100).allow('').optional(),
});

const addressSchema = Joi.object({
  street: Joi.string().trim().max(200).allow('').optional(),
  city: Joi.string().trim().max(100).optional(),
  region: Joi.string().trim().max(100).allow('').optional(),
  postalCode: Joi.string().trim().max(20).allow('').optional(),
  country: Joi.string().trim().max(100).optional(),
});

const createClient = Joi.object({
  type: Joi.string().valid('particulier', 'professionnel').default('professionnel'),
  raisonSociale: Joi.string().trim().max(200).when('type', {
    is: 'professionnel',
    then: Joi.required().messages({ 'any.required': 'La raison sociale est requise pour un professionnel' }),
    otherwise: Joi.allow('').optional(),
  }),
  firstName: Joi.string().trim().max(50).when('type', {
    is: 'particulier',
    then: Joi.required().messages({ 'any.required': 'Le prenom est requis pour un particulier' }),
    otherwise: Joi.allow('').optional(),
  }),
  lastName: Joi.string().trim().max(50).when('type', {
    is: 'particulier',
    then: Joi.required().messages({ 'any.required': 'Le nom est requis pour un particulier' }),
    otherwise: Joi.allow('').optional(),
  }),
  ninea: Joi.string().trim().uppercase().allow('').optional(),
  rccm: Joi.string().trim().allow('').optional(),
  email: Joi.string().trim().email().allow('').optional().messages({
    'string.email': 'Veuillez fournir un email valide',
  }),
  phone: Joi.string().trim().max(30).allow('').optional(),
  mobile: Joi.string().trim().max(30).allow('').optional(),
  fax: Joi.string().trim().max(30).allow('').optional(),
  website: Joi.string().trim().max(200).allow('').optional(),
  contactPerson: contactPersonSchema.optional(),
  address: addressSchema.optional(),
  segment: Joi.string().valid('A', 'B', 'C').optional(),
  category: Joi.string()
    .valid('grossiste', 'detaillant', 'distributeur', 'institutionnel', 'particulier', 'autre')
    .optional(),
  delaiPaiement: Joi.number().integer().min(0).max(365).optional(),
  plafondCredit: Joi.number().min(0).optional(),
  remiseGlobale: Joi.number().min(0).max(100).optional(),
  modePaiement: Joi.string()
    .valid('especes', 'cheque', 'virement', 'orange_money', 'wave', 'carte_bancaire')
    .optional(),
  notes: Joi.string().max(2000).allow('').optional(),
});

const updateClient = Joi.object({
  type: Joi.string().valid('particulier', 'professionnel').optional(),
  raisonSociale: Joi.string().trim().max(200).allow('').optional(),
  firstName: Joi.string().trim().max(50).allow('').optional(),
  lastName: Joi.string().trim().max(50).allow('').optional(),
  ninea: Joi.string().trim().uppercase().allow('').optional(),
  rccm: Joi.string().trim().allow('').optional(),
  email: Joi.string().trim().email().allow('').optional(),
  phone: Joi.string().trim().max(30).allow('').optional(),
  mobile: Joi.string().trim().max(30).allow('').optional(),
  fax: Joi.string().trim().max(30).allow('').optional(),
  website: Joi.string().trim().max(200).allow('').optional(),
  contactPerson: contactPersonSchema.optional(),
  address: addressSchema.optional(),
  segment: Joi.string().valid('A', 'B', 'C').optional(),
  category: Joi.string()
    .valid('grossiste', 'detaillant', 'distributeur', 'institutionnel', 'particulier', 'autre')
    .optional(),
  delaiPaiement: Joi.number().integer().min(0).max(365).optional(),
  plafondCredit: Joi.number().min(0).optional(),
  remiseGlobale: Joi.number().min(0).max(100).optional(),
  modePaiement: Joi.string()
    .valid('especes', 'cheque', 'virement', 'orange_money', 'wave', 'carte_bancaire')
    .optional(),
  notes: Joi.string().max(2000).allow('').optional(),
})
  .min(1)
  .messages({
    'object.min': 'Au moins un champ doit etre fourni pour la mise a jour',
  });

module.exports = {
  createClient,
  updateClient,
};

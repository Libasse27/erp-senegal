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

const bankInfoSchema = Joi.object({
  bankName: Joi.string().trim().max(100).allow('').optional(),
  accountNumber: Joi.string().trim().max(50).allow('').optional(),
  iban: Joi.string().trim().max(50).allow('').optional(),
  swift: Joi.string().trim().max(20).allow('').optional(),
});

const ratingSchema = Joi.object({
  qualite: Joi.number().integer().min(1).max(5).optional(),
  delai: Joi.number().integer().min(1).max(5).optional(),
  prix: Joi.number().integer().min(1).max(5).optional(),
  service: Joi.number().integer().min(1).max(5).optional(),
});

const createFournisseur = Joi.object({
  raisonSociale: Joi.string().trim().min(2).max(200).required().messages({
    'string.empty': 'La raison sociale est requise',
    'string.min': 'La raison sociale doit contenir au moins 2 caracteres',
    'any.required': 'La raison sociale est requise',
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
  category: Joi.string()
    .valid('local', 'international', 'fabricant', 'distributeur', 'prestataire', 'autre')
    .optional(),
  delaiPaiement: Joi.number().integer().min(0).max(365).optional(),
  delaiLivraison: Joi.number().integer().min(0).optional(),
  conditionsPaiement: Joi.string().trim().max(500).allow('').optional(),
  devises: Joi.string().trim().optional(),
  rating: ratingSchema.optional(),
  bankInfo: bankInfoSchema.optional(),
  notes: Joi.string().max(2000).allow('').optional(),
});

const updateFournisseur = Joi.object({
  raisonSociale: Joi.string().trim().min(2).max(200).optional(),
  ninea: Joi.string().trim().uppercase().allow('').optional(),
  rccm: Joi.string().trim().allow('').optional(),
  email: Joi.string().trim().email().allow('').optional(),
  phone: Joi.string().trim().max(30).allow('').optional(),
  mobile: Joi.string().trim().max(30).allow('').optional(),
  fax: Joi.string().trim().max(30).allow('').optional(),
  website: Joi.string().trim().max(200).allow('').optional(),
  contactPerson: contactPersonSchema.optional(),
  address: addressSchema.optional(),
  category: Joi.string()
    .valid('local', 'international', 'fabricant', 'distributeur', 'prestataire', 'autre')
    .optional(),
  delaiPaiement: Joi.number().integer().min(0).max(365).optional(),
  delaiLivraison: Joi.number().integer().min(0).optional(),
  conditionsPaiement: Joi.string().trim().max(500).allow('').optional(),
  devises: Joi.string().trim().optional(),
  rating: ratingSchema.optional(),
  bankInfo: bankInfoSchema.optional(),
  notes: Joi.string().max(2000).allow('').optional(),
})
  .min(1)
  .messages({
    'object.min': 'Au moins un champ doit etre fourni pour la mise a jour',
  });

module.exports = {
  createFournisseur,
  updateFournisseur,
};

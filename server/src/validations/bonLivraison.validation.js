const Joi = require('joi');

const ligneBLSchema = Joi.object({
  product: Joi.string().hex().length(24).required().messages({
    'any.required': 'Le produit est requis',
  }),
  designation: Joi.string().trim().max(200).required().messages({
    'any.required': 'La designation est requise',
  }),
  reference: Joi.string().trim().max(50).allow('').optional(),
  quantite: Joi.number().positive().required().messages({
    'any.required': 'La quantite est requise',
    'number.positive': 'La quantite doit etre superieure a 0',
  }),
  unite: Joi.string().trim().max(50).default('Unite'),
  warehouse: Joi.string().hex().length(24).required().messages({
    'any.required': 'Le depot est requis',
  }),
  ligneCommandeId: Joi.string().hex().length(24).optional(),
});

const createBonLivraison = Joi.object({
  commande: Joi.string().hex().length(24).required().messages({
    'any.required': 'La commande est requise',
  }),
  client: Joi.string().hex().length(24).required().messages({
    'any.required': 'Le client est requis',
  }),
  dateLivraison: Joi.date().optional(),
  lignes: Joi.array().items(ligneBLSchema).min(1).required().messages({
    'array.min': 'Le bon de livraison doit contenir au moins une ligne',
    'any.required': 'Les lignes sont requises',
  }),
  adresseLivraison: Joi.object({
    street: Joi.string().trim().max(200).allow('').optional(),
    city: Joi.string().trim().max(100).allow('').optional(),
    region: Joi.string().trim().max(100).allow('').optional(),
    postalCode: Joi.string().trim().max(20).allow('').optional(),
    country: Joi.string().trim().max(100).allow('').optional(),
  }).optional(),
  signatureClient: Joi.object({
    nom: Joi.string().trim().max(100).allow('').optional(),
    date: Joi.date().optional(),
    commentaire: Joi.string().max(500).allow('').optional(),
  }).optional(),
  notes: Joi.string().max(2000).allow('').optional(),
});

const validateBL = Joi.object({
  createFacture: Joi.boolean().default(false),
  signatureClient: Joi.object({
    nom: Joi.string().trim().max(100).optional(),
    date: Joi.date().optional(),
    commentaire: Joi.string().max(500).allow('').optional(),
  }).optional(),
});

module.exports = {
  createBonLivraison,
  validateBL,
};

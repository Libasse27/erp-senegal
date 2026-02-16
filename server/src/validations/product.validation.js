const Joi = require('joi');

const createProduct = Joi.object({
  name: Joi.string().trim().min(2).max(200).required().messages({
    'string.empty': 'Le nom du produit est requis',
    'string.min': 'Le nom doit contenir au moins 2 caracteres',
    'any.required': 'Le nom du produit est requis',
  }),
  barcode: Joi.string().trim().allow('').optional(),
  description: Joi.string().trim().max(2000).allow('').optional(),
  shortDescription: Joi.string().trim().max(500).allow('').optional(),
  category: Joi.string().hex().length(24).required().messages({
    'string.empty': 'La categorie est requise',
    'any.required': 'La categorie est requise',
  }),
  type: Joi.string().valid('produit', 'service').optional(),
  marque: Joi.string().trim().max(100).allow('').optional(),
  unite: Joi.string().trim().max(50).optional(),
  prixAchat: Joi.number().min(0).required().messages({
    'number.min': 'Le prix d\'achat ne peut pas etre negatif',
    'any.required': 'Le prix d\'achat est requis',
  }),
  prixVente: Joi.number().min(0).required().messages({
    'number.min': 'Le prix de vente ne peut pas etre negatif',
    'any.required': 'Le prix de vente est requis',
  }),
  prixVenteGros: Joi.number().min(0).allow(null).optional(),
  prixVenteSpecial: Joi.number().min(0).allow(null).optional(),
  tauxTVA: Joi.number().valid(0, 18).optional(),
  isExonere: Joi.boolean().optional(),
  isStockable: Joi.boolean().optional(),
  stockMinimum: Joi.number().integer().min(0).optional(),
  stockMaximum: Joi.number().integer().min(0).optional(),
  stockAlerte: Joi.number().integer().min(0).optional(),
  poids: Joi.number().min(0).allow(null).optional(),
  dimensions: Joi.object({
    longueur: Joi.number().min(0).optional(),
    largeur: Joi.number().min(0).optional(),
    hauteur: Joi.number().min(0).optional(),
  }).optional(),
  hasExpiry: Joi.boolean().optional(),
  defaultExpiryDays: Joi.number().integer().min(0).allow(null).optional(),
  notes: Joi.string().max(2000).allow('').optional(),
});

const updateProduct = Joi.object({
  name: Joi.string().trim().min(2).max(200).optional(),
  barcode: Joi.string().trim().allow('').optional(),
  description: Joi.string().trim().max(2000).allow('').optional(),
  shortDescription: Joi.string().trim().max(500).allow('').optional(),
  category: Joi.string().hex().length(24).optional(),
  type: Joi.string().valid('produit', 'service').optional(),
  marque: Joi.string().trim().max(100).allow('').optional(),
  unite: Joi.string().trim().max(50).optional(),
  prixAchat: Joi.number().min(0).optional(),
  prixVente: Joi.number().min(0).optional(),
  prixVenteGros: Joi.number().min(0).allow(null).optional(),
  prixVenteSpecial: Joi.number().min(0).allow(null).optional(),
  tauxTVA: Joi.number().valid(0, 18).optional(),
  isExonere: Joi.boolean().optional(),
  isStockable: Joi.boolean().optional(),
  stockMinimum: Joi.number().integer().min(0).optional(),
  stockMaximum: Joi.number().integer().min(0).optional(),
  stockAlerte: Joi.number().integer().min(0).optional(),
  poids: Joi.number().min(0).allow(null).optional(),
  dimensions: Joi.object({
    longueur: Joi.number().min(0).optional(),
    largeur: Joi.number().min(0).optional(),
    hauteur: Joi.number().min(0).optional(),
  }).optional(),
  hasExpiry: Joi.boolean().optional(),
  defaultExpiryDays: Joi.number().integer().min(0).allow(null).optional(),
  notes: Joi.string().max(2000).allow('').optional(),
})
  .min(1)
  .messages({
    'object.min': 'Au moins un champ doit etre fourni pour la mise a jour',
  });

module.exports = {
  createProduct,
  updateProduct,
};

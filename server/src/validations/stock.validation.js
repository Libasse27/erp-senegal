const Joi = require('joi');

const createStockMovement = Joi.object({
  type: Joi.string()
    .valid('entree', 'sortie', 'transfert', 'ajustement', 'retour')
    .required()
    .messages({
      'any.required': 'Le type de mouvement est requis',
      'any.only': 'Type de mouvement invalide',
    }),
  motif: Joi.string()
    .valid(
      'achat', 'vente', 'transfert', 'inventaire',
      'retour_client', 'retour_fournisseur',
      'ajustement_positif', 'ajustement_negatif',
      'perte', 'don', 'production', 'autre'
    )
    .required()
    .messages({
      'any.required': 'Le motif est requis',
    }),
  product: Joi.string().hex().length(24).required().messages({
    'any.required': 'Le produit est requis',
  }),
  warehouseSource: Joi.string().hex().length(24).when('type', {
    is: Joi.valid('sortie', 'transfert'),
    then: Joi.required().messages({ 'any.required': 'Le depot source est requis pour ce type de mouvement' }),
    otherwise: Joi.allow(null).optional(),
  }),
  warehouseDestination: Joi.string().hex().length(24).when('type', {
    is: Joi.valid('entree', 'transfert'),
    then: Joi.required().messages({ 'any.required': 'Le depot destination est requis pour ce type de mouvement' }),
    otherwise: Joi.allow(null).optional(),
  }),
  quantite: Joi.number().integer().min(1).required().messages({
    'number.min': 'La quantite doit etre superieure a 0',
    'any.required': 'La quantite est requise',
  }),
  coutUnitaire: Joi.number().min(0).optional(),
  date: Joi.date().optional(),
  notes: Joi.string().max(1000).allow('').optional(),
  documentReference: Joi.string().trim().max(50).allow('').optional(),
  documentType: Joi.string()
    .valid('commande', 'facture', 'bon_livraison', 'inventaire', 'commande_fournisseur', 'reception', 'manuel')
    .optional(),
  documentId: Joi.string().hex().length(24).optional(),
});

const stockTransfer = Joi.object({
  product: Joi.string().hex().length(24).required().messages({
    'any.required': 'Le produit est requis',
  }),
  warehouseSource: Joi.string().hex().length(24).required().messages({
    'any.required': 'Le depot source est requis',
  }),
  warehouseDestination: Joi.string().hex().length(24).required().messages({
    'any.required': 'Le depot destination est requis',
  }),
  quantite: Joi.number().integer().min(1).required().messages({
    'number.min': 'La quantite doit etre superieure a 0',
    'any.required': 'La quantite est requise',
  }),
  notes: Joi.string().max(1000).allow('').optional(),
});

const createWarehouse = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'Le nom du depot est requis',
    'any.required': 'Le nom du depot est requis',
  }),
  description: Joi.string().trim().max(500).allow('').optional(),
  type: Joi.string().valid('principal', 'secondaire', 'transit', 'retour').optional(),
  address: Joi.object({
    street: Joi.string().trim().max(200).allow('').optional(),
    city: Joi.string().trim().max(100).optional(),
    region: Joi.string().trim().max(100).allow('').optional(),
    country: Joi.string().trim().max(100).optional(),
  }).optional(),
  responsable: Joi.string().hex().length(24).allow(null).optional(),
  phone: Joi.string().trim().max(30).allow('').optional(),
  capacity: Joi.number().min(0).allow(null).optional(),
  isDefault: Joi.boolean().optional(),
});

const updateWarehouse = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),
  description: Joi.string().trim().max(500).allow('').optional(),
  type: Joi.string().valid('principal', 'secondaire', 'transit', 'retour').optional(),
  address: Joi.object({
    street: Joi.string().trim().max(200).allow('').optional(),
    city: Joi.string().trim().max(100).optional(),
    region: Joi.string().trim().max(100).allow('').optional(),
    country: Joi.string().trim().max(100).optional(),
  }).optional(),
  responsable: Joi.string().hex().length(24).allow(null).optional(),
  phone: Joi.string().trim().max(30).allow('').optional(),
  capacity: Joi.number().min(0).allow(null).optional(),
  isDefault: Joi.boolean().optional(),
})
  .min(1)
  .messages({
    'object.min': 'Au moins un champ doit etre fourni pour la mise a jour',
  });

module.exports = {
  createStockMovement,
  stockTransfer,
  createWarehouse,
  updateWarehouse,
};

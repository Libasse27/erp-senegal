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

module.exports = {
  createStockMovement,
  stockTransfer,
};

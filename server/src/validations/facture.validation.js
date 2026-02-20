const Joi = require('joi');

const ligneSchema = Joi.object({
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
  prixUnitaire: Joi.number().min(0).required().messages({
    'any.required': 'Le prix unitaire est requis',
  }),
  remise: Joi.number().min(0).max(100).default(0),
  tauxTVA: Joi.number().valid(0, 18).default(18),
  unite: Joi.string().trim().max(50).default('Unite'),
});

const createFacture = Joi.object({
  client: Joi.string().hex().length(24).required().messages({
    'any.required': 'Le client est requis',
  }),
  commande: Joi.string().hex().length(24).optional(),
  bonLivraison: Joi.string().hex().length(24).optional(),
  dateFacture: Joi.date().optional(),
  dateEcheance: Joi.date().optional(),
  lignes: Joi.array().items(ligneSchema).min(1).required().messages({
    'array.min': 'La facture doit contenir au moins une ligne',
    'any.required': 'Les lignes sont requises',
  }),
  remiseGlobale: Joi.number().min(0).max(100).default(0),
  conditionsPaiement: Joi.string().trim().max(500).optional(),
  modePaiement: Joi.string()
    .valid('especes', 'cheque', 'virement', 'orange_money', 'wave', 'carte_bancaire')
    .optional(),
  notes: Joi.string().max(2000).allow('').optional(),
  mentionsLegales: Joi.string().max(2000).optional(),
  commercial: Joi.string().hex().length(24).optional(),
});

const updateFacture = Joi.object({
  dateFacture: Joi.date().optional(),
  dateEcheance: Joi.date().optional(),
  lignes: Joi.array().items(ligneSchema).min(1).optional(),
  remiseGlobale: Joi.number().min(0).max(100).optional(),
  conditionsPaiement: Joi.string().trim().max(500).optional(),
  modePaiement: Joi.string()
    .valid('especes', 'cheque', 'virement', 'orange_money', 'wave', 'carte_bancaire')
    .optional(),
  notes: Joi.string().max(2000).allow('').optional(),
  mentionsLegales: Joi.string().max(2000).optional(),
  commercial: Joi.string().hex().length(24).optional(),
})
  .min(1)
  .messages({
    'object.min': 'Au moins un champ doit etre fourni pour la mise a jour',
  });

const createAvoir = Joi.object({
  motif: Joi.string().trim().max(500).required().messages({
    'any.required': 'Le motif de l\'avoir est requis',
  }),
  lignes: Joi.array()
    .items(
      Joi.object({
        ligneFactureId: Joi.string().hex().length(24).required(),
        quantite: Joi.number().positive().required(),
      })
    )
    .min(1)
    .optional(),
  notes: Joi.string().max(2000).allow('').optional(),
});

module.exports = {
  createFacture,
  updateFacture,
  createAvoir,
};

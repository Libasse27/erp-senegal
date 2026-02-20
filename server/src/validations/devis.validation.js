const Joi = require('joi');

const ligneSchema = Joi.object({
  product: Joi.string().hex().length(24).required().messages({
    'any.required': 'Le produit est requis',
    'string.hex': 'ID produit invalide',
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

const createDevis = Joi.object({
  client: Joi.string().hex().length(24).required().messages({
    'any.required': 'Le client est requis',
  }),
  dateDevis: Joi.date().optional(),
  dateValidite: Joi.date().greater('now').required().messages({
    'any.required': 'La date de validite est requise',
    'date.greater': 'La date de validite doit etre dans le futur',
  }),
  lignes: Joi.array().items(ligneSchema).min(1).required().messages({
    'array.min': 'Le devis doit contenir au moins une ligne',
    'any.required': 'Les lignes sont requises',
  }),
  remiseGlobale: Joi.number().min(0).max(100).default(0),
  conditionsPaiement: Joi.string().trim().max(500).optional(),
  notes: Joi.string().max(2000).allow('').optional(),
  commercial: Joi.string().hex().length(24).optional(),
});

const updateDevis = Joi.object({
  dateDevis: Joi.date().optional(),
  dateValidite: Joi.date().optional(),
  lignes: Joi.array().items(ligneSchema).min(1).optional(),
  remiseGlobale: Joi.number().min(0).max(100).optional(),
  conditionsPaiement: Joi.string().trim().max(500).optional(),
  notes: Joi.string().max(2000).allow('').optional(),
  commercial: Joi.string().hex().length(24).optional(),
})
  .min(1)
  .messages({
    'object.min': 'Au moins un champ doit etre fourni pour la mise a jour',
  });

const changeStatut = Joi.object({
  statut: Joi.string()
    .valid('envoye', 'accepte', 'refuse', 'expire', 'converti')
    .required()
    .messages({
      'any.required': 'Le statut est requis',
      'any.only': 'Statut invalide',
    }),
});

module.exports = {
  createDevis,
  updateDevis,
  changeStatut,
};

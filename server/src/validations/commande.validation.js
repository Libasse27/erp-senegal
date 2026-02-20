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

const createCommande = Joi.object({
  client: Joi.string().hex().length(24).required().messages({
    'any.required': 'Le client est requis',
  }),
  devis: Joi.string().hex().length(24).optional(),
  dateCommande: Joi.date().optional(),
  dateLivraisonPrevue: Joi.date().optional(),
  lignes: Joi.array().items(ligneSchema).min(1).required().messages({
    'array.min': 'La commande doit contenir au moins une ligne',
    'any.required': 'Les lignes sont requises',
  }),
  remiseGlobale: Joi.number().min(0).max(100).default(0),
  conditionsPaiement: Joi.string().trim().max(500).optional(),
  notes: Joi.string().max(2000).allow('').optional(),
  commercial: Joi.string().hex().length(24).optional(),
});

const updateCommande = Joi.object({
  dateCommande: Joi.date().optional(),
  dateLivraisonPrevue: Joi.date().optional(),
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

const changeStatutCommande = Joi.object({
  statut: Joi.string()
    .valid('confirmee', 'en_cours', 'partiellement_livree', 'livree', 'annulee')
    .required()
    .messages({
      'any.required': 'Le statut est requis',
      'any.only': 'Statut invalide',
    }),
});

const ligneBLSchema = Joi.object({
  ligneCommandeId: Joi.string().hex().length(24).required().messages({
    'any.required': 'L\'ID de la ligne commande est requis',
  }),
  quantite: Joi.number().positive().required().messages({
    'any.required': 'La quantite est requise',
    'number.positive': 'La quantite doit etre superieure a 0',
  }),
  warehouse: Joi.string().hex().length(24).required().messages({
    'any.required': 'Le depot est requis',
  }),
});

const generateBLSchema = Joi.object({
  lignes: Joi.array().items(ligneBLSchema).min(1).required().messages({
    'array.min': 'Au moins une ligne est requise',
    'any.required': 'Les lignes sont requises',
  }),
  dateLivraison: Joi.date().optional(),
  adresseLivraison: Joi.object({
    street: Joi.string().trim().max(200).allow('').optional(),
    city: Joi.string().trim().max(100).allow('').optional(),
    region: Joi.string().trim().max(100).allow('').optional(),
    postalCode: Joi.string().trim().max(20).allow('').optional(),
    country: Joi.string().trim().max(100).allow('').optional(),
  }).optional(),
  notes: Joi.string().max(2000).allow('').optional(),
});

module.exports = {
  createCommande,
  updateCommande,
  changeStatutCommande,
  generateBLSchema,
};

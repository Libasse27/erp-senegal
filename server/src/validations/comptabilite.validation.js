const Joi = require('joi');

// === Compte Comptable ===
const createCompteComptable = Joi.object({
  numero: Joi.string()
    .trim()
    .pattern(/^\d{1,10}$/)
    .required()
    .messages({
      'any.required': 'Le numero de compte est requis',
      'string.pattern.base': 'Le numero de compte doit etre compose de chiffres uniquement',
    }),
  libelle: Joi.string().trim().max(200).required().messages({
    'any.required': 'Le libelle du compte est requis',
  }),
  classe: Joi.number().integer().min(1).max(8).optional(),
  type: Joi.string().valid('debit', 'credit').optional(),
  parent: Joi.string().hex().length(24).optional(),
  isCollectif: Joi.boolean().default(false),
  isImputable: Joi.boolean().default(true),
  description: Joi.string().max(1000).allow('').optional(),
});

const updateCompteComptable = Joi.object({
  libelle: Joi.string().trim().max(200).optional(),
  isCollectif: Joi.boolean().optional(),
  isImputable: Joi.boolean().optional(),
  description: Joi.string().max(1000).allow('').optional(),
})
  .min(1)
  .messages({
    'object.min': 'Au moins un champ doit etre fourni pour la mise a jour',
  });

// === Ecriture Comptable ===
const ligneEcritureSchema = Joi.object({
  compteNumero: Joi.string().trim().required().messages({
    'any.required': 'Le numero de compte est requis',
  }),
  libelle: Joi.string().trim().max(200).required().messages({
    'any.required': 'Le libelle de la ligne est requis',
  }),
  debit: Joi.number().min(0).default(0),
  credit: Joi.number().min(0).default(0),
});

const createEcriture = Joi.object({
  journal: Joi.string().valid('VE', 'AC', 'BQ', 'CA', 'OD').required().messages({
    'any.required': 'Le journal est requis',
  }),
  dateEcriture: Joi.date().required().messages({
    'any.required': "La date de l'ecriture est requise",
  }),
  libelle: Joi.string().trim().max(500).required().messages({
    'any.required': "Le libelle de l'ecriture est requis",
  }),
  reference: Joi.string().trim().max(100).allow('').optional(),
  lignes: Joi.array().items(ligneEcritureSchema).min(2).required().messages({
    'array.min': "L'ecriture doit contenir au moins 2 lignes",
    'any.required': 'Les lignes sont requises',
  }),
  pieceJustificative: Joi.string().trim().max(200).allow('').optional(),
});

const updateEcriture = Joi.object({
  dateEcriture: Joi.date().optional(),
  libelle: Joi.string().trim().max(500).optional(),
  reference: Joi.string().trim().max(100).allow('').optional(),
  lignes: Joi.array().items(ligneEcritureSchema).min(2).optional(),
  pieceJustificative: Joi.string().trim().max(200).allow('').optional(),
})
  .min(1)
  .messages({
    'object.min': 'Au moins un champ doit etre fourni pour la mise a jour',
  });

// === Exercice Comptable ===
const createExercice = Joi.object({
  code: Joi.string().trim().max(20).required().messages({
    'any.required': "Le code de l'exercice est requis",
  }),
  libelle: Joi.string().trim().max(200).required().messages({
    'any.required': "Le libelle de l'exercice est requis",
  }),
  dateDebut: Joi.date().required().messages({
    'any.required': 'La date de debut est requise',
  }),
  dateFin: Joi.date().greater(Joi.ref('dateDebut')).required().messages({
    'any.required': 'La date de fin est requise',
    'date.greater': 'La date de fin doit etre posterieure a la date de debut',
  }),
  notes: Joi.string().max(2000).allow('').optional(),
});

// === Lettrage ===
const lettrage = Joi.object({
  compteNumero: Joi.string().trim().required().messages({
    'any.required': 'Le numero de compte est requis',
  }),
  ligneIds: Joi.array()
    .items(Joi.string().hex().length(24))
    .min(2)
    .required()
    .messages({
      'array.min': 'Au moins 2 lignes sont requises pour le lettrage',
      'any.required': 'Les lignes a lettrer sont requises',
    }),
});

module.exports = {
  createCompteComptable,
  updateCompteComptable,
  createEcriture,
  updateEcriture,
  createExercice,
  lettrage,
};

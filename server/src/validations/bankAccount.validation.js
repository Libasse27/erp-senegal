const Joi = require('joi');

const createBankAccount = Joi.object({
  nom: Joi.string().trim().max(200).required().messages({
    'any.required': 'Le nom du compte est requis',
  }),
  banque: Joi.string().trim().max(200).required().messages({
    'any.required': 'Le nom de la banque est requis',
  }),
  numeroCompte: Joi.string().trim().max(50).required().messages({
    'any.required': 'Le numero de compte est requis',
  }),
  iban: Joi.string().trim().max(34).allow('').optional(),
  swift: Joi.string().trim().max(11).allow('').optional(),
  type: Joi.string().valid('courant', 'epargne', 'mobile_money').default('courant'),
  devise: Joi.string().trim().max(5).default('XOF'),
  soldeInitial: Joi.number().default(0),
  compteComptable: Joi.string().hex().length(24).optional(),
  compteComptableNumero: Joi.string().trim().max(10).optional(),
  agence: Joi.string().trim().max(200).allow('').optional(),
  contactBanque: Joi.string().trim().max(200).allow('').optional(),
  telephoneBanque: Joi.string().trim().max(20).allow('').optional(),
  isDefault: Joi.boolean().default(false),
  notes: Joi.string().max(2000).allow('').optional(),
});

const updateBankAccount = Joi.object({
  nom: Joi.string().trim().max(200).optional(),
  banque: Joi.string().trim().max(200).optional(),
  iban: Joi.string().trim().max(34).allow('').optional(),
  swift: Joi.string().trim().max(11).allow('').optional(),
  type: Joi.string().valid('courant', 'epargne', 'mobile_money').optional(),
  compteComptable: Joi.string().hex().length(24).optional(),
  compteComptableNumero: Joi.string().trim().max(10).optional(),
  agence: Joi.string().trim().max(200).allow('').optional(),
  contactBanque: Joi.string().trim().max(200).allow('').optional(),
  telephoneBanque: Joi.string().trim().max(20).allow('').optional(),
  isDefault: Joi.boolean().optional(),
  notes: Joi.string().max(2000).allow('').optional(),
})
  .min(1)
  .messages({
    'object.min': 'Au moins un champ doit etre fourni pour la mise a jour',
  });

module.exports = {
  createBankAccount,
  updateBankAccount,
};

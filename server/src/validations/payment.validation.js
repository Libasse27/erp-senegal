const Joi = require('joi');

const createPayment = Joi.object({
  typePaiement: Joi.string().valid('client', 'fournisseur').required().messages({
    'any.required': 'Le type de paiement est requis',
    'any.only': 'Le type de paiement doit etre client ou fournisseur',
  }),
  modePaiement: Joi.string()
    .valid('especes', 'cheque', 'virement', 'orange_money', 'wave', 'carte_bancaire')
    .required()
    .messages({
      'any.required': 'Le mode de paiement est requis',
    }),
  datePaiement: Joi.date().default(Date.now).messages({
    'date.base': 'La date de paiement est invalide',
  }),
  montant: Joi.number().positive().required().messages({
    'any.required': 'Le montant est requis',
    'number.positive': 'Le montant doit etre superieur a 0',
  }),
  client: Joi.string().hex().length(24).when('typePaiement', {
    is: 'client',
    then: Joi.required().messages({ 'any.required': 'Le client est requis' }),
    otherwise: Joi.optional(),
  }),
  fournisseur: Joi.string().hex().length(24).when('typePaiement', {
    is: 'fournisseur',
    then: Joi.required().messages({ 'any.required': 'Le fournisseur est requis' }),
    otherwise: Joi.optional(),
  }),
  facture: Joi.string().hex().length(24).optional(),
  factureFournisseur: Joi.string().hex().length(24).optional(),
  allocations: Joi.array()
    .items(
      Joi.object({
        facture: Joi.string().hex().length(24).required(),
        montant: Joi.number().positive().required(),
      })
    )
    .optional(),
  compteBancaire: Joi.string().hex().length(24).when('modePaiement', {
    is: Joi.string().valid('cheque', 'virement'),
    then: Joi.required().messages({
      'any.required': 'Le compte bancaire est requis pour ce mode de paiement',
    }),
    otherwise: Joi.optional(),
  }),
  detailsCheque: Joi.object({
    numeroCheque: Joi.string().trim().max(50).optional(),
    banqueEmettrice: Joi.string().trim().max(100).optional(),
    dateEncaissement: Joi.date().optional(),
  }).optional(),
  detailsMobileMoney: Joi.object({
    numeroTransaction: Joi.string().trim().max(100).optional(),
    operateur: Joi.string().valid('orange_money', 'wave').optional(),
    numeroTelephone: Joi.string().trim().max(20).optional(),
  }).optional(),
  detailsVirement: Joi.object({
    referenceBancaire: Joi.string().trim().max(100).optional(),
    banqueOrigine: Joi.string().trim().max(100).optional(),
  }).optional(),
  notes: Joi.string().max(2000).allow('').optional(),
});

const updatePayment = Joi.object({
  modePaiement: Joi.string()
    .valid('especes', 'cheque', 'virement', 'orange_money', 'wave', 'carte_bancaire')
    .optional(),
  datePaiement: Joi.date().optional(),
  montant: Joi.number().positive().optional(),
  compteBancaire: Joi.string().hex().length(24).optional(),
  detailsCheque: Joi.object({
    numeroCheque: Joi.string().trim().max(50).optional(),
    banqueEmettrice: Joi.string().trim().max(100).optional(),
    dateEncaissement: Joi.date().optional(),
  }).optional(),
  detailsMobileMoney: Joi.object({
    numeroTransaction: Joi.string().trim().max(100).optional(),
    operateur: Joi.string().valid('orange_money', 'wave').optional(),
    numeroTelephone: Joi.string().trim().max(20).optional(),
  }).optional(),
  detailsVirement: Joi.object({
    referenceBancaire: Joi.string().trim().max(100).optional(),
    banqueOrigine: Joi.string().trim().max(100).optional(),
  }).optional(),
  notes: Joi.string().max(2000).allow('').optional(),
})
  .min(1)
  .messages({
    'object.min': 'Au moins un champ doit etre fourni pour la mise a jour',
  });

module.exports = {
  createPayment,
  updatePayment,
};

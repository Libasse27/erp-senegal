const Joi = require('joi');

const createCouponSchema = Joi.object({
  code: Joi.string().trim().uppercase().alphanum().min(3).max(20).required().messages({
    'any.required': 'Le code du coupon est requis.',
    'string.alphanum': 'Le code ne doit contenir que des lettres et chiffres.',
  }),
  description: Joi.string().trim().max(200).allow('').optional(),
  type: Joi.string().valid('POURCENTAGE', 'MONTANT_FIXE').required().messages({
    'any.required': 'Le type de remise est requis (POURCENTAGE ou MONTANT_FIXE).',
  }),
  valeur: Joi.number().min(0).required().messages({
    'any.required': 'La valeur de la remise est requise.',
    'number.min': 'La valeur ne peut pas être négative.',
  }),
  plansEligibles: Joi.array().items(Joi.string().trim().uppercase()).default([]),
  periodicitesEligibles: Joi.array().items(Joi.string().valid('MENSUEL', 'ANNUEL')).default([]),
  dateDebut: Joi.date().default(new Date()),
  dateExpiration: Joi.date().allow(null).optional(),
  usagesMax: Joi.number().integer().min(1).allow(null).default(null),
  actif: Joi.boolean().default(true),
});

const updateCouponSchema = createCouponSchema
  .fork(['code', 'type', 'valeur'], (field) => field.optional())
  .min(1);

module.exports = { createCoupon: createCouponSchema, updateCoupon: updateCouponSchema };

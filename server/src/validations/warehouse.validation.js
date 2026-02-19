const Joi = require('joi');

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
  createWarehouse,
  updateWarehouse,
};

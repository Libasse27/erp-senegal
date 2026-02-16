const Joi = require('joi');

const createCategory = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'Le nom de la categorie est requis',
    'string.min': 'Le nom doit contenir au moins 2 caracteres',
    'any.required': 'Le nom de la categorie est requis',
  }),
  description: Joi.string().trim().max(500).allow('').optional(),
  parent: Joi.string().hex().length(24).allow(null).optional().messages({
    'string.hex': 'Identifiant de categorie parent invalide',
  }),
  order: Joi.number().integer().min(0).optional(),
});

const updateCategory = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),
  description: Joi.string().trim().max(500).allow('').optional(),
  parent: Joi.string().hex().length(24).allow(null).optional(),
  order: Joi.number().integer().min(0).optional(),
})
  .min(1)
  .messages({
    'object.min': 'Au moins un champ doit etre fourni pour la mise a jour',
  });

module.exports = {
  createCategory,
  updateCategory,
};

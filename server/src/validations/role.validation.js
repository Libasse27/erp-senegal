const Joi = require('joi');

const createRole = Joi.object({
  name: Joi.string().trim().min(2).max(50).required().messages({
    'string.empty': 'Le nom du role est requis',
    'string.min': 'Le nom du role doit contenir au moins 2 caracteres',
    'string.max': 'Le nom du role ne peut pas depasser 50 caracteres',
    'any.required': 'Le nom du role est requis',
  }),
  displayName: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': "Le nom d'affichage est requis",
    'string.min': "Le nom d'affichage doit contenir au moins 2 caracteres",
    'string.max': "Le nom d'affichage ne peut pas depasser 100 caracteres",
    'any.required': "Le nom d'affichage est requis",
  }),
  description: Joi.string().trim().max(500).allow('').optional(),
  permissions: Joi.array()
    .items(Joi.string().hex().length(24))
    .optional()
    .messages({
      'string.hex': 'Identifiant de permission invalide',
      'string.length': 'Identifiant de permission invalide',
    }),
});

const updateRole = Joi.object({
  name: Joi.string().trim().min(2).max(50).optional(),
  displayName: Joi.string().trim().min(2).max(100).optional(),
  description: Joi.string().trim().max(500).allow('').optional(),
  permissions: Joi.array()
    .items(Joi.string().hex().length(24))
    .optional()
    .messages({
      'string.hex': 'Identifiant de permission invalide',
      'string.length': 'Identifiant de permission invalide',
    }),
})
  .min(1)
  .messages({
    'object.min': 'Au moins un champ doit etre fourni pour la mise a jour',
  });

module.exports = {
  createRole,
  updateRole,
};

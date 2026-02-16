const Joi = require('joi');

const createUser = Joi.object({
  firstName: Joi.string().trim().min(2).max(50).required().messages({
    'string.empty': 'Le prenom est requis',
    'string.min': 'Le prenom doit contenir au moins 2 caracteres',
    'string.max': 'Le prenom ne peut pas depasser 50 caracteres',
    'any.required': 'Le prenom est requis',
  }),
  lastName: Joi.string().trim().min(2).max(50).required().messages({
    'string.empty': 'Le nom est requis',
    'string.min': 'Le nom doit contenir au moins 2 caracteres',
    'string.max': 'Le nom ne peut pas depasser 50 caracteres',
    'any.required': 'Le nom est requis',
  }),
  email: Joi.string().trim().email().required().messages({
    'string.empty': "L'email est requis",
    'string.email': 'Veuillez fournir un email valide',
    'any.required': "L'email est requis",
  }),
  password: Joi.string().min(6).max(128).required().messages({
    'string.empty': 'Le mot de passe est requis',
    'string.min': 'Le mot de passe doit contenir au moins 6 caracteres',
    'any.required': 'Le mot de passe est requis',
  }),
  phone: Joi.string().trim().allow('').optional(),
  role: Joi.string().hex().length(24).required().messages({
    'string.empty': 'Le role est requis',
    'any.required': 'Le role est requis',
  }),
  isActive: Joi.boolean().optional(),
});

const updateUser = Joi.object({
  firstName: Joi.string().trim().min(2).max(50).optional(),
  lastName: Joi.string().trim().min(2).max(50).optional(),
  email: Joi.string().trim().email().optional(),
  phone: Joi.string().trim().allow('').optional(),
  role: Joi.string().hex().length(24).optional(),
  isActive: Joi.boolean().optional(),
  password: Joi.string().min(6).max(128).optional(),
}).min(1).messages({
  'object.min': 'Au moins un champ doit etre fourni pour la mise a jour',
});

const updateMe = Joi.object({
  firstName: Joi.string().trim().min(2).max(50).optional(),
  lastName: Joi.string().trim().min(2).max(50).optional(),
  email: Joi.string().trim().email().optional(),
  phone: Joi.string().trim().allow('').optional(),
  password: Joi.string().min(6).max(128).optional(),
}).min(1).messages({
  'object.min': 'Au moins un champ doit etre fourni pour la mise a jour',
});

module.exports = {
  createUser,
  updateUser,
  updateMe,
};

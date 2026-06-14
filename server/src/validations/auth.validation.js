const Joi = require('joi');

const register = Joi.object({
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
    'string.hex': 'Le role doit etre un identifiant valide',
    'string.length': 'Le role doit etre un identifiant valide',
    'any.required': 'Le role est requis',
  }),
});

const login = Joi.object({
  email: Joi.string().trim().email().required().messages({
    'string.empty': "L'email est requis",
    'string.email': 'Veuillez fournir un email valide',
    'any.required': "L'email est requis",
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Le mot de passe est requis',
    'any.required': 'Le mot de passe est requis',
  }),
});

const forgotPassword = Joi.object({
  email: Joi.string().trim().email().required().messages({
    'string.empty': "L'email est requis",
    'string.email': 'Veuillez fournir un email valide',
    'any.required': "L'email est requis",
  }),
});

const resetPassword = Joi.object({
  password: Joi.string().min(6).max(128).required().messages({
    'string.empty': 'Le mot de passe est requis',
    'string.min': 'Le mot de passe doit contenir au moins 6 caracteres',
    'any.required': 'Le mot de passe est requis',
  }),
});

// Inscription publique SaaS (créateur + entreprise + forfait)
const registerSaaS = Joi.object({
  // Informations du createur
  firstName: Joi.string().trim().min(2).max(50).required().messages({
    'string.empty': 'Le prenom est requis',
    'any.required': 'Le prenom est requis',
  }),
  lastName: Joi.string().trim().min(2).max(50).required().messages({
    'string.empty': 'Le nom est requis',
    'any.required': 'Le nom est requis',
  }),
  email: Joi.string().trim().email().required().messages({
    'string.email': 'Veuillez fournir un email valide',
    'any.required': "L'email est requis",
  }),
  password: Joi.string().min(8).max(128).required().messages({
    'string.min': 'Le mot de passe doit contenir au moins 8 caracteres',
    'any.required': 'Le mot de passe est requis',
  }),
  phone: Joi.string().trim().allow('').optional(),

  // Informations de l'entreprise
  companyName: Joi.string().trim().min(2).max(200).required().messages({
    'string.empty': "Le nom de l'entreprise est requis",
    'any.required': "Le nom de l'entreprise est requis",
  }),
  legalForm: Joi.string().valid('SARL', 'SA', 'SAS', 'SASU', 'SNC', 'EI', 'GIE', 'Autre').optional(),
  ninea: Joi.string().trim().allow('').optional(),
  rccm: Joi.string().trim().allow('').optional(),
  sector: Joi.string().trim().allow('').optional(),
  address: Joi.string().trim().allow('').optional(),
  city: Joi.string().trim().allow('').optional(),
  companyPhone: Joi.string().trim().allow('').optional(),
  companyEmail: Joi.string().trim().email().allow('').optional(),
  website: Joi.string().trim().allow('').optional(),

  // Forfait
  forfaitCode: Joi.string().valid('STANDARD', 'PROFESSIONNEL', 'COMPLET').required().messages({
    'any.only': 'Forfait invalide. Choisissez STANDARD, PROFESSIONNEL ou COMPLET.',
    'any.required': 'Le forfait est requis',
  }),
  periodicite: Joi.string().valid('MENSUEL', 'ANNUEL').default('MENSUEL'),
});

module.exports = {
  register,
  registerSaaS,
  login,
  forgotPassword,
  resetPassword,
};

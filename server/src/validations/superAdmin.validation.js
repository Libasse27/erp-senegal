const Joi = require('joi');

const resetPasswordSchema = Joi.object({
  newPassword: Joi.string().min(8).required().messages({
    'string.min': 'Le mot de passe doit contenir au moins 8 caracteres.',
    'any.required': 'Le nouveau mot de passe est requis.',
  }),
});

const purgeLogsSchema = Joi.object({
  olderThanDays: Joi.number().integer().min(1).max(365).default(90).messages({
    'number.min': 'La duree minimale est de 1 jour.',
    'number.max': 'La duree maximale est de 365 jours.',
  }),
  collection: Joi.string().valid('audit', 'system').default('audit'),
});

const updateSystemConfigSchema = Joi.object({
  maintenanceMode: Joi.boolean(),
  registrationEnabled: Joi.boolean(),
  maxLoginAttempts: Joi.number().integer().min(3).max(20),
  sessionTimeout: Joi.number().integer().min(15).max(1440),
  backupRetentionDays: Joi.number().integer().min(7).max(365),
  logRetentionDays: Joi.number().integer().min(7).max(365),
  allowedIPs: Joi.array().items(Joi.string()),
  smtpConfig: Joi.object({
    host: Joi.string(),
    port: Joi.number(),
    user: Joi.string(),
    from: Joi.string().email(),
  }),
});

// ── Gestion des entreprises (Super Admin) ────────────────────────────────────

const addressSchema = Joi.object({
  street: Joi.string().trim().allow('').optional(),
  city: Joi.string().trim().optional(),
  region: Joi.string().trim().allow('').optional(),
  postalCode: Joi.string().trim().allow('').optional(),
  country: Joi.string().trim().optional(),
}).optional();

const createCompanySchema = Joi.object({
  name: Joi.string().trim().min(2).max(200).required().messages({
    'any.required': "Le nom de l'entreprise est requis.",
    'string.min': "Le nom doit contenir au moins 2 caracteres.",
  }),
  legalForm: Joi.string().valid('SARL', 'SA', 'SAS', 'SASU', 'SNC', 'EI', 'GIE', 'Autre').optional(),
  ninea: Joi.string().trim().allow('').optional(),
  rccm: Joi.string().trim().allow('').optional(),
  address: addressSchema,
  phone: Joi.string().trim().allow('').optional(),
  email: Joi.string().trim().email().allow('').optional(),
  website: Joi.string().trim().allow('').optional(),
  sector: Joi.string().trim().allow('').optional(),
  employeeCount: Joi.number().integer().min(0).optional(),
  plan: Joi.string().valid('starter', 'professional', 'enterprise').default('starter'),
  status: Joi.string().valid('active', 'trial', 'suspended', 'expired').default('active'),
  adminUser: Joi.string().optional(),
  superAdminNotes: Joi.string().trim().max(2000).allow('').optional(),
  subscriptionStartDate: Joi.date().optional(),
  subscriptionEndDate: Joi.date().optional(),
  fiscalInfo: Joi.object({
    tvaRate: Joi.number().min(0).max(100).optional(),
    isSubjectToTVA: Joi.boolean().optional(),
    fiscalRegime: Joi.string().valid('reel_normal', 'reel_simplifie', 'contribuable_unique').optional(),
  }).optional(),
  currency: Joi.string().trim().optional(),
});

const updateCompanyAdminSchema = createCompanySchema.fork(
  ['name'],
  (field) => field.optional()
).min(1);

const suspendCompanySchema = Joi.object({
  reason: Joi.string().trim().min(5).max(500).required().messages({
    'any.required': 'Le motif de suspension est requis.',
    'string.min': 'Le motif doit contenir au moins 5 caracteres.',
  }),
});

module.exports = {
  resetPassword: resetPasswordSchema,
  purgeLogs: purgeLogsSchema,
  updateSystemConfig: updateSystemConfigSchema,
  createCompany: createCompanySchema,
  updateCompanyAdmin: updateCompanyAdminSchema,
  suspendCompany: suspendCompanySchema,
};

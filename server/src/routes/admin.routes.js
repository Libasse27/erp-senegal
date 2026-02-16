const express = require('express');
const router = express.Router();

const {
  getRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  getPermissions,
} = require('../controllers/roleController');
const {
  getAuditLogs,
  getAuditLog,
  getAuditStats,
} = require('../controllers/auditLogController');
const { getCompany, updateCompany } = require('../controllers/companyController');
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { protect } = require('../middlewares/auth');
const { authorizeRoles } = require('../middlewares/rbac');
const validate = require('../middlewares/validate');
const { createRole: createRoleSchema, updateRole: updateRoleSchema } = require('../validations/role.validation');
const { updateCompany: updateCompanySchema } = require('../validations/company.validation');
const { updateSettings: updateSettingsSchema } = require('../validations/settings.validation');
const audit = require('../middlewares/audit');

// All admin routes require authentication + admin role
router.use(protect);
router.use(authorizeRoles('admin'));

// === ROLES ===
router.get('/roles', getRoles);
router.get('/roles/:id', getRole);
router.post(
  '/roles',
  validate(createRoleSchema),
  audit('roles', 'create'),
  createRole
);
router.put(
  '/roles/:id',
  validate(updateRoleSchema),
  audit('roles', 'update'),
  updateRole
);
router.delete('/roles/:id', audit('roles', 'delete'), deleteRole);

// === PERMISSIONS ===
router.get('/permissions', getPermissions);

// === AUDIT LOGS ===
router.get('/audit-logs/stats', getAuditStats);
router.get('/audit-logs', getAuditLogs);
router.get('/audit-logs/:id', getAuditLog);

// === COMPANY ===
router.get('/company', getCompany);
router.put(
  '/company',
  validate(updateCompanySchema),
  audit('company', 'update'),
  updateCompany
);

// === SETTINGS ===
router.get('/settings', getSettings);
router.put(
  '/settings',
  validate(updateSettingsSchema),
  audit('settings', 'update'),
  updateSettings
);

module.exports = router;

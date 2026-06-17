const express = require('express');
const router = express.Router();

const {
  getSystemStats,
  getSystemHealth,
  getAllUsersAdmin,
  forceLogoutUser,
  unlockUserAccount,
  resetUserPassword,
  changeUserRole,
  getRbacMatrix,
  getAdvancedAuditLogs,
  purgeAuditLogs,
  getSystemLogs,
  getLogFiles,
  listBackups,
  createBackup,
  downloadBackup,
  deleteBackup,
  listAllCompanies,
  getCompanyAdmin,
  createCompanyAdmin,
  updateCompanyAdmin,
  suspendCompany,
  activateCompany,
  deleteCompanyAdmin,
  getCompaniesOverview,
} = require('../controllers/superAdminController');

const {
  listAllPlans,
  createPlan,
  updatePlan,
  deletePlan,
  migrateSubscribers,
  getPlanStats,
} = require('../controllers/planController');

const {
  listerCoupons,
  creerCoupon,
  mettreAJourCoupon,
  supprimerCoupon,
} = require('../controllers/couponController');

const { getMrrStats, getMrrHistorique } = require('../controllers/mrrController');

const { protect } = require('../middlewares/auth');
const platformGuard = require('../middlewares/platformGuard');
const validate = require('../middlewares/validate');
const {
  resetPassword,
  purgeLogs,
  createCompany,
  updateCompanyAdmin: updateCompanyAdminSchema,
  suspendCompany: suspendCompanySchema,
  createPlan: createPlanSchema,
  updatePlan: updatePlanSchema,
} = require('../validations/superAdmin.validation');

const {
  createCoupon: createCouponSchema,
  updateCoupon: updateCouponSchema,
} = require('../validations/coupon.validation');
const audit = require('../middlewares/audit');

// Toutes les routes super admin exigent : JWT valide + scope PLATFORM
router.use(protect);
router.use(platformGuard);

// ── Tableau de bord ──────────────────────────────────────────────────────────
router.get('/stats', getSystemStats);
router.get('/health', getSystemHealth);

// ── Gestion des utilisateurs ─────────────────────────────────────────────────
router.get('/users', getAllUsersAdmin);
router.post('/users/:id/force-logout', audit('users', 'update'), forceLogoutUser);
router.post('/users/:id/unlock', audit('users', 'update'), unlockUserAccount);
router.post(
  '/users/:id/reset-password',
  validate(resetPassword),
  audit('users', 'update'),
  resetUserPassword
);
router.put('/users/:id/role', audit('users', 'update'), changeUserRole);

// ── RBAC ─────────────────────────────────────────────────────────────────────
router.get('/rbac-matrix', getRbacMatrix);

// ── Journaux d'audit ─────────────────────────────────────────────────────────
router.get('/audit-logs', getAdvancedAuditLogs);
router.delete('/audit-logs/purge', validate(purgeLogs), audit('audit', 'delete'), purgeAuditLogs);

// ── Journaux systeme ─────────────────────────────────────────────────────────
router.get('/system-logs/files', getLogFiles);
router.get('/system-logs', getSystemLogs);

// ── Sauvegardes ──────────────────────────────────────────────────────────────
router.get('/backups', listBackups);
router.post('/backups', audit('backups', 'create'), createBackup);
router.get('/backups/:filename/download', downloadBackup);
router.delete('/backups/:filename', audit('backups', 'delete'), deleteBackup);

// ── Gestion des entreprises ──────────────────────────────────────────────────
router.get('/companies/overview', getCompaniesOverview);
router.get('/companies', listAllCompanies);
router.post('/companies', validate(createCompany), audit('company', 'create'), createCompanyAdmin);
router.get('/companies/:id', getCompanyAdmin);
router.put('/companies/:id', validate(updateCompanyAdminSchema), audit('company', 'update'), updateCompanyAdmin);
router.post('/companies/:id/suspend', validate(suspendCompanySchema), audit('company', 'update'), suspendCompany);
router.post('/companies/:id/activate', audit('company', 'update'), activateCompany);
router.delete('/companies/:id', audit('company', 'delete'), deleteCompanyAdmin);

// ── Gestion des Plans SaaS ───────────────────────────────────────────────────
router.get('/plans',                              listAllPlans);
router.post('/plans', validate(createPlanSchema), audit('plans', 'create'), createPlan);
router.put('/plans/:id', validate(updatePlanSchema), audit('plans', 'update'), updatePlan);
router.delete('/plans/:id',                       audit('plans', 'delete'), deletePlan);
router.get('/plans/:id/stats',                    getPlanStats);
router.post('/plans/:id/migrate-subscribers',     audit('plans', 'update'), migrateSubscribers);

// ── MRR / ARR ────────────────────────────────────────────────────────────────
router.get('/mrr/stats',      getMrrStats);
router.get('/mrr/historique', getMrrHistorique);

// ── Gestion des Coupons SaaS ─────────────────────────────────────────────────
router.get('/coupons',                           listerCoupons);
router.post('/coupons', validate(createCouponSchema), audit('coupons', 'create'), creerCoupon);
router.put('/coupons/:id', validate(updateCouponSchema), audit('coupons', 'update'), mettreAJourCoupon);
router.delete('/coupons/:id', audit('coupons', 'delete'), supprimerCoupon);

module.exports = router;

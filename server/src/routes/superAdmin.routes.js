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

/**
 * @swagger
 * /super-admin/mrr/stats:
 *   get:
 *     summary: Métriques MRR et ARR en temps réel
 *     tags: [MRR / ARR]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Calcule le MRR (Monthly Recurring Revenue) et l'ARR depuis les abonnements
 *       ACTIF et EN_PERIODE_GRACE. Les abonnements ANNUEL sont ramenés à une
 *       contribution mensuelle (montant / 12).
 *     responses:
 *       200:
 *         description: Métriques MRR calculées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/MrrStats'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/mrr/stats', getMrrStats);

/**
 * @swagger
 * /super-admin/mrr/historique:
 *   get:
 *     summary: Revenus mensuels des 12 derniers mois
 *     tags: [MRR / ARR]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Retourne exactement 12 entrées mensuelles (mois glissant) basées sur les
 *       PaiementSaaS au statut COMPLETE. Les mois sans paiement ont revenus=0.
 *     responses:
 *       200:
 *         description: Historique MRR sur 12 mois
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/MrrHistorique'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/mrr/historique', getMrrHistorique);

// ── Gestion des Coupons SaaS ─────────────────────────────────────────────────

/**
 * @swagger
 * /super-admin/coupons:
 *   get:
 *     summary: Lister tous les coupons de réduction
 *     tags: [Coupons SaaS]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des coupons
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Coupon'
 *   post:
 *     summary: Créer un coupon de réduction
 *     tags: [Coupons SaaS]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - typeReduction
 *               - valeur
 *             properties:
 *               code:
 *                 type: string
 *                 example: PROMO2026
 *               typeReduction:
 *                 type: string
 *                 enum: [POURCENTAGE, MONTANT_FIXE]
 *               valeur:
 *                 type: number
 *                 example: 20
 *               maxUtilisations:
 *                 type: integer
 *                 example: 100
 *               dateExpiration:
 *                 type: string
 *                 format: date-time
 *               plansEligibles:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [STANDARD, PROFESSIONNEL, COMPLET]
 *     responses:
 *       201:
 *         description: Coupon créé
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Coupon'
 *
 * /super-admin/coupons/{id}:
 *   put:
 *     summary: Mettre à jour un coupon
 *     tags: [Coupons SaaS]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Coupon'
 *     responses:
 *       200:
 *         description: Coupon mis à jour
 *   delete:
 *     summary: Supprimer un coupon
 *     tags: [Coupons SaaS]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Coupon supprimé
 */
router.get('/coupons',                           listerCoupons);
router.post('/coupons', validate(createCouponSchema), audit('coupons', 'create'), creerCoupon);
router.put('/coupons/:id', validate(updateCouponSchema), audit('coupons', 'update'), mettreAJourCoupon);
router.delete('/coupons/:id', audit('coupons', 'delete'), supprimerCoupon);

module.exports = router;

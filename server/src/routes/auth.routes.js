/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Connexion utilisateur
 *     tags: [Authentification]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@ndakaru.sn
 *               password:
 *                 type: string
 *                 example: Admin@2026
 *     responses:
 *       200:
 *         description: Authentifié avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken: { type: string }
 *                     refreshToken: { type: string }
 *                     user:
 *                       type: object
 *                       properties:
 *                         _id: { type: string }
 *                         email: { type: string }
 *                         role: { type: object }
 *       401:
 *         description: Identifiants invalides
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * /auth/register-saas:
 *   post:
 *     summary: Inscription SaaS — crée une entreprise + compte admin + abonnement
 *     tags: [Authentification]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [companyName, email, password, firstName, lastName, forfaitCode]
 *             properties:
 *               companyName:
 *                 type: string
 *                 example: Ndakaru SARL
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@ndakaru.sn
 *               password:
 *                 type: string
 *                 example: Admin@2026
 *               firstName:
 *                 type: string
 *                 example: Abdou
 *               lastName:
 *                 type: string
 *                 example: Diallo
 *               phone:
 *                 type: string
 *                 example: "+221 77 123 4567"
 *               forfaitCode:
 *                 type: string
 *                 enum: [STANDARD, PROFESSIONNEL, COMPLET]
 *                 example: PROFESSIONNEL
 *               periodicite:
 *                 type: string
 *                 enum: [MENSUEL, ANNUEL]
 *                 default: MENSUEL
 *     responses:
 *       201:
 *         description: Compte créé — paiement d'activation requis
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Données invalides ou email déjà utilisé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * /auth/logout:
 *   post:
 *     summary: Déconnexion (révoque le refresh token)
 *     tags: [Authentification]
 *     responses:
 *       200:
 *         description: Déconnecté avec succès
 *
 * /auth/refresh-token:
 *   post:
 *     summary: Renouveler l'access token via le refresh token
 *     tags: [Authentification]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: Nouveau token émis
 *       401:
 *         description: Refresh token invalide ou expiré
 */
const express = require('express');
const router = express.Router();

const {
  register,
  registerSaaS,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');
const { protect } = require('../middlewares/auth');
const { authorizeRoles } = require('../middlewares/rbac');
const { authLimiter } = require('../middlewares/rateLimiter');
const validate = require('../middlewares/validate');
const authValidation = require('../validations/auth.validation');
const audit = require('../middlewares/audit');

// Routes publiques
router.post('/login', authLimiter, validate(authValidation.login), login);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', authLimiter, validate(authValidation.forgotPassword), forgotPassword);
router.put('/reset-password/:token', validate(authValidation.resetPassword), resetPassword);

// Inscription publique SaaS (entreprise + admin + forfait)
router.post(
  '/register-saas',
  authLimiter,
  validate(authValidation.registerSaaS),
  registerSaaS
);

// Routes protegees
router.post(
  '/register',
  protect,
  authorizeRoles('admin', 'super_admin'),
  validate(authValidation.register),
  audit('users', 'create'),
  register
);
router.post('/logout', protect, logout);

module.exports = router;

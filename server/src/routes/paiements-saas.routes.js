/**
 * @swagger
 * /paiements-saas/usage:
 *   get:
 *     summary: Usage SaaS + abonnement actif de l'entreprise connectée
 *     tags: [Abonnements SaaS]
 *     responses:
 *       200:
 *         description: Métriques d'usage et informations d'abonnement
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   $ref: '#/components/schemas/UsageSaas'
 *
 * /paiements-saas/initier:
 *   post:
 *     summary: Initier un paiement d'abonnement (Wave ou Orange Money)
 *     tags: [Abonnements SaaS]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [abonnementId, methode]
 *             properties:
 *               abonnementId:
 *                 type: string
 *                 example: 65f1b2c3d4e5f6a7b8c9d0e1
 *               methode:
 *                 type: string
 *                 enum: [WAVE, ORANGE_MONEY]
 *                 example: WAVE
 *     responses:
 *       200:
 *         description: Paiement initié — URL de paiement renvoyée
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     reference: { type: string, example: PAY-20260614-XYZ }
 *                     checkoutUrl: { type: string, example: 'https://pay.wave.com/c/pay_xxx' }
 *                     transactionId: { type: string }
 *                     montant: { type: number, example: 35000 }
 *       400:
 *         description: Abonnement introuvable ou paiement déjà en cours
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * /paiements-saas/statut/{ref}:
 *   get:
 *     summary: Consulter le statut d'un paiement SaaS
 *     tags: [Abonnements SaaS]
 *     parameters:
 *       - in: path
 *         name: ref
 *         required: true
 *         schema: { type: string }
 *         example: PAY-20260614-XYZ
 *     responses:
 *       200:
 *         description: Statut du paiement
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   $ref: '#/components/schemas/PaiementSaas'
 *
 * /paiements-saas:
 *   get:
 *     summary: Lister les paiements SaaS (super_admin = tous; admin = les siens)
 *     tags: [Abonnements SaaS]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Liste paginée des paiements
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *
 * /paiements-saas/webhook/{provider}:
 *   post:
 *     summary: Webhook PSP — appelé par Wave ou Orange Money (usage interne PSP uniquement)
 *     tags: [Abonnements SaaS]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema: { type: string, enum: [wave, orange_money] }
 *     responses:
 *       200:
 *         description: Webhook traité avec succès
 *
 * /paiements-saas/confirmer-simulation:
 *   post:
 *     summary: Confirmer un paiement en mode simulation (dev uniquement)
 *     tags: [Abonnements SaaS]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reference]
 *             properties:
 *               reference: { type: string, example: PAY-20260614-XYZ }
 *               statut: { type: string, enum: [REUSSI, ECHOUE], default: REUSSI }
 *     responses:
 *       200:
 *         description: Simulation confirmée
 *       403:
 *         description: Disponible uniquement hors production
 */
const express = require('express');
const router  = express.Router();

const { protect }         = require('../middlewares/auth');
const { authorizeRoles }  = require('../middlewares/rbac');
const {
  initierPaiement,
  webhookPaiement,
  getStatutPaiement,
  listerPaiements,
  confirmerSimulation,
  getUsageSaas,
} = require('../controllers/paiementSaasController');

// ── Webhooks PSP — publics, pas d'auth (le PSP appelle depuis ses serveurs) ──
// Le corps brut est capturé par le middleware rawBody défini dans app.js
router.post('/webhook/:provider', webhookPaiement);

// ── Routes authentifiées ──────────────────────────────────────────────────────
router.use(protect);

// Métriques d'usage et abonnement actif
router.get('/usage', getUsageSaas);

// Initier un paiement (admin entreprise ou super_admin)
router.post(
  '/initier',
  authorizeRoles('admin', 'super_admin'),
  initierPaiement
);

// Consulter le statut d'un paiement
router.get('/statut/:ref', getStatutPaiement);

// Lister les paiements (super_admin voit tout, admin entreprise voit les siens)
router.get(
  '/',
  authorizeRoles('admin', 'super_admin'),
  listerPaiements
);

// Simulation uniquement (bloqué en production dans le controller)
router.post(
  '/confirmer-simulation',
  authorizeRoles('super_admin', 'admin'),
  confirmerSimulation
);

module.exports = router;

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
} = require('../controllers/paiementSaasController');

// ── Webhooks PSP — publics, pas d'auth (le PSP appelle depuis ses serveurs) ──
// Le corps brut est capturé par le middleware rawBody défini dans app.js
router.post('/webhook/:provider', webhookPaiement);

// ── Routes authentifiées ──────────────────────────────────────────────────────
router.use(protect);

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

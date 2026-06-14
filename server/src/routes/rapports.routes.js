const express = require('express');
const router = express.Router();

const {
  getBilanJSON,
  getBilanPDF,
  getResultatJSON,
  getResultatPDF,
  getCAJSON,
  getCAPDF,
} = require('../controllers/rapportController');
const { protect } = require('../middlewares/auth');
const tenantMiddleware = require('../middlewares/tenant');
const subscriptionGuard = require('../middlewares/subscriptionGuard');
const { authorize } = require('../middlewares/rbac');
const { pdfLimiter } = require('../middlewares/rateLimiter');

// Apply auth + tenant isolation + subscription check on all rapport routes
router.use(protect);
router.use(tenantMiddleware);
router.use(subscriptionGuard('COMPTABILITE'));

// === Bilan SYSCOHADA ===
router.get('/bilan', authorize('rapports:read'), getBilanJSON);
router.get('/bilan/pdf', pdfLimiter, authorize('rapports:read'), getBilanPDF);

// === Compte de Resultat ===
router.get('/resultat', authorize('rapports:read'), getResultatJSON);
router.get('/resultat/pdf', pdfLimiter, authorize('rapports:read'), getResultatPDF);

// === Chiffre d'Affaires par Periode ===
router.get('/ca', authorize('rapports:read'), getCAJSON);
router.get('/ca/pdf', pdfLimiter, authorize('rapports:read'), getCAPDF);

module.exports = router;

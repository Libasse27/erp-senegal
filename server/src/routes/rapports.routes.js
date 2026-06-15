const express = require('express');
const router = express.Router();

const {
  getBilanJSON,
  getBilanPDF,
  getResultatJSON,
  getResultatPDF,
  getCAJSON,
  getCAPDF,
  getReleveClientPDF,
  getRapportStockPDF,
  getRapportTopClients,
  getRapportTopProduits,
  getRapportRecouvrement,
  getRecouvrementPDF,
  getRapportAchats,
  getRapportStocksAnalyse,
  getRapportABC,
  getRapportPerformance,
  getRapportActivite,
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

// === Top clients & Top produits (période libre) ===
router.get('/top-clients', authorize('rapports:read'), getRapportTopClients);
router.get('/top-produits', authorize('rapports:read'), getRapportTopProduits);

// === Relevé de compte client ===
router.get('/releve-client/:clientId/pdf', pdfLimiter, authorize('rapports:read'), getReleveClientPDF);

// === Rapport de stock (inventaire) ===
router.get('/stock/pdf', pdfLimiter, authorize('rapports:read'), getRapportStockPDF);

// === Rapport de recouvrement (créances) ===
router.get('/recouvrement', authorize('rapports:read'), getRapportRecouvrement);
router.get('/recouvrement/pdf', pdfLimiter, authorize('rapports:read'), getRecouvrementPDF);

// === Rapport Achats ===
router.get('/achats', authorize('rapports:read'), getRapportAchats);

// === Rapport Stocks (valorisation & analyse) ===
router.get('/stocks-analyse', authorize('rapports:read'), getRapportStocksAnalyse);

// === Analyse ABC (Pareto) ===
router.get('/abc', authorize('rapports:read'), getRapportABC);

// === Performance Commerciale ===
router.get('/performance', authorize('rapports:read'), getRapportPerformance);

// === Rapport d'Activité Globale ===
router.get('/activite', authorize('rapports:read'), getRapportActivite);

module.exports = router;

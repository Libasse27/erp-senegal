const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const tenantMiddleware = require('../middlewares/tenant');
const subscriptionGuard = require('../middlewares/subscriptionGuard');
const { authorize } = require('../middlewares/rbac');
const { exportLimiter } = require('../middlewares/rateLimiter');
const {
  downloadTemplate,
  importData,
  exportClientsHandler,
  exportFournisseursHandler,
  exportProduitsHandler,
  exportStocksHandler,
  exportPaiementsHandler,
} = require('../controllers/importController');

router.use(protect);
router.use(tenantMiddleware);
router.use(subscriptionGuard('GESCOM'));

// ── Templates Excel (download)
router.get('/template/:type', exportLimiter, downloadTemplate);

// ── Import (upload + parse)
router.post('/:type', authorize('produits:create'), importData);

// ── Exports par entité
router.get('/export/clients',      exportLimiter, authorize('clients:read'),    exportClientsHandler);
router.get('/export/fournisseurs', exportLimiter, authorize('fournisseurs:read'), exportFournisseursHandler);
router.get('/export/produits',     exportLimiter, authorize('produits:read'),   exportProduitsHandler);
router.get('/export/stocks',       exportLimiter, authorize('stocks:read'),     exportStocksHandler);
router.get('/export/paiements',    exportLimiter, authorize('paiements:read'),  exportPaiementsHandler);

module.exports = router;

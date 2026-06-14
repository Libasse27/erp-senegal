const express = require('express');
const router = express.Router();

const {
  getDashboardStats,
  getDashboardSummary,
  getDashboardCharts,
  getDashboardTopClients,
  getDashboardStockAlerts,
  getDashboardKpis,
  getDashboardTopProducts,
  getDashboardStockEvolution,
  getDashboardRecouvrement,
  getDashboardCashflow,
  getDashboardFunnel,
  getDashboardPeriode,
} = require('../controllers/dashboardController');

const { protect } = require('../middlewares/auth');
const tenantMiddleware = require('../middlewares/tenant');

// Dashboard : isolation tenant uniquement (pas de guard module spécifique)
router.use(protect);
router.use(tenantMiddleware);

router.get('/stats', getDashboardStats);
router.get('/summary', getDashboardSummary);
router.get('/charts', getDashboardCharts);
router.get('/top-clients', getDashboardTopClients);
router.get('/top-products', getDashboardTopProducts);
router.get('/stock-alerts', getDashboardStockAlerts);
router.get('/stock-evolution', getDashboardStockEvolution);
router.get('/kpis', getDashboardKpis);
router.get('/recouvrement', getDashboardRecouvrement);
router.get('/cashflow', getDashboardCashflow);
router.get('/funnel', getDashboardFunnel);
router.get('/periode', getDashboardPeriode);

module.exports = router;

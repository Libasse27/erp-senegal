const express = require('express');
const router = express.Router();

const {
  getDashboardStats,
  getDashboardSummary,
  getDashboardCharts,
} = require('../controllers/dashboardController');

const { protect } = require('../middlewares/auth');
const tenantMiddleware = require('../middlewares/tenant');

// Dashboard : isolation tenant uniquement (pas de guard module spécifique)
router.use(protect);
router.use(tenantMiddleware);

router.get('/stats', getDashboardStats);
router.get('/summary', getDashboardSummary);
router.get('/charts', getDashboardCharts);

module.exports = router;

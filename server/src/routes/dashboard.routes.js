const express = require('express');
const router = express.Router();

const {
  getDashboardStats,
  getDashboardSummary,
  getDashboardCharts,
} = require('../controllers/dashboardController');

const { protect } = require('../middlewares/auth');

// Toutes les routes dashboard necessitent une authentification
router.use(protect);

router.get('/stats', getDashboardStats);
router.get('/summary', getDashboardSummary);
router.get('/charts', getDashboardCharts);

module.exports = router;

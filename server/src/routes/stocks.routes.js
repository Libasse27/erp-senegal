const express = require('express');
const router = express.Router();

const {
  getStocks,
  getStockAlerts,
  getMovements,
  createMovement,
  transferStock,
} = require('../controllers/stockController');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');
const validate = require('../middlewares/validate');
const { createStockMovement, stockTransfer } = require('../validations/stock.validation');
const audit = require('../middlewares/audit');

// All routes require authentication
router.use(protect);

// Stock overview
router.get('/', authorize('stocks:read'), getStocks);

// Alerts
router.get('/alerts', authorize('stocks:read'), getStockAlerts);

// Movements
router.get('/movements', authorize('stocks:read'), getMovements);
router.post(
  '/movements',
  authorize('stocks:create'),
  validate(createStockMovement),
  audit('stocks', 'create'),
  createMovement
);

// Transfer
router.post(
  '/transfer',
  authorize('stocks:create'),
  validate(stockTransfer),
  audit('stocks', 'create'),
  transferStock
);

module.exports = router;

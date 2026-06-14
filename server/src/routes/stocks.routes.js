const express = require('express');
const router = express.Router();

const {
  getStocks,
  getStock,
  getStockAlerts,
  getMovement,
  getMovements,
  createMovement,
  transferStock,
} = require('../controllers/stockController');
const { protect } = require('../middlewares/auth');
const tenantMiddleware = require('../middlewares/tenant');
const subscriptionGuard = require('../middlewares/subscriptionGuard');
const { authorize } = require('../middlewares/rbac');
const validate = require('../middlewares/validate');
const { createStockMovement, stockTransfer } = require('../validations/stock.validation');
const audit = require('../middlewares/audit');

router.use(protect);
router.use(tenantMiddleware);
router.use(subscriptionGuard('STOCK'));

// Stock overview
router.get('/', authorize('stocks:read'), getStocks);

// Alerts
router.get('/alerts', authorize('stocks:read'), getStockAlerts);

// Movements
router.get('/movements', authorize('stocks:read'), getMovements);
router.get('/movements/:id', authorize('stocks:read'), getMovement);
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

// Single stock by ID (after sub-routes to avoid conflict)
router.get('/:id', authorize('stocks:read'), getStock);

module.exports = router;

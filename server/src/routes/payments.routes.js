const express = require('express');
const router = express.Router();

const {
  getPayments,
  getPayment,
  createPayment,
  updatePayment,
  deletePayment,
  validatePayment,
  cancelPayment,
  getPaymentSchedule,
  getTresorerie,
} = require('../controllers/paymentController');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');
const validate = require('../middlewares/validate');
const {
  createPayment: createPaymentSchema,
  updatePayment: updatePaymentSchema,
} = require('../validations/payment.validation');
const audit = require('../middlewares/audit');

// All routes require authentication
router.use(protect);

// Tresorerie overview
router.get('/tresorerie', authorize('paiements:read'), getTresorerie);

// Payment schedule (echeancier)
router.get('/schedule', authorize('paiements:read'), getPaymentSchedule);

// CRUD
router.get('/', authorize('paiements:read'), getPayments);
router.get('/:id', authorize('paiements:read'), getPayment);
router.post(
  '/',
  authorize('paiements:create'),
  validate(createPaymentSchema),
  audit('paiements', 'create'),
  createPayment
);
router.put(
  '/:id',
  authorize('paiements:update'),
  validate(updatePaymentSchema),
  audit('paiements', 'update'),
  updatePayment
);
router.delete('/:id', authorize('paiements:delete'), audit('paiements', 'delete'), deletePayment);

// Validate payment (assign numero + accounting entry)
router.post(
  '/:id/validate',
  authorize('paiements:validate'),
  audit('paiements', 'validate'),
  validatePayment
);

// Cancel validated payment
router.post(
  '/:id/cancel',
  authorize('paiements:delete'),
  audit('paiements', 'delete'),
  cancelPayment
);

module.exports = router;

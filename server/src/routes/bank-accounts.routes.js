const express = require('express');
const router = express.Router();

const {
  getBankAccounts,
  getBankAccount,
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,
  getReconciliation,
} = require('../controllers/bankAccountController');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');
const validate = require('../middlewares/validate');
const {
  createBankAccount: createBankAccountSchema,
  updateBankAccount: updateBankAccountSchema,
} = require('../validations/bankAccount.validation');
const audit = require('../middlewares/audit');

// All routes require authentication
router.use(protect);

// CRUD
router.get('/', authorize('comptes_bancaires:read'), getBankAccounts);
router.get('/:id', authorize('comptes_bancaires:read'), getBankAccount);
router.post(
  '/',
  authorize('comptes_bancaires:create'),
  validate(createBankAccountSchema),
  audit('comptes_bancaires', 'create'),
  createBankAccount
);
router.put(
  '/:id',
  authorize('comptes_bancaires:update'),
  validate(updateBankAccountSchema),
  audit('comptes_bancaires', 'update'),
  updateBankAccount
);
router.delete(
  '/:id',
  authorize('comptes_bancaires:delete'),
  audit('comptes_bancaires', 'delete'),
  deleteBankAccount
);

// Reconciliation
router.get('/:id/reconciliation', authorize('comptes_bancaires:read'), getReconciliation);

module.exports = router;

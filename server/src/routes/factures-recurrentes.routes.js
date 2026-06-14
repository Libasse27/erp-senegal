const express = require('express');
const router = express.Router();

const {
  getAll,
  getOne,
  create,
  update,
  remove,
  toggleActive,
  genererMaintenant,
} = require('../controllers/factureRecurrenteController');
const { protect } = require('../middlewares/auth');
const tenantMiddleware = require('../middlewares/tenant');
const subscriptionGuard = require('../middlewares/subscriptionGuard');
const { authorize } = require('../middlewares/rbac');
const audit = require('../middlewares/audit');

router.use(protect);
router.use(tenantMiddleware);
router.use(subscriptionGuard('VENTES'));

router.get('/', authorize('invoices:read'), getAll);
router.get('/:id', authorize('invoices:read'), getOne);
router.post('/', authorize('invoices:create'), audit('factures_recurrentes', 'create'), create);
router.put('/:id', authorize('invoices:update'), audit('factures_recurrentes', 'update'), update);
router.delete('/:id', authorize('invoices:delete'), audit('factures_recurrentes', 'delete'), remove);
router.patch('/:id/toggle-active', authorize('invoices:update'), audit('factures_recurrentes', 'update'), toggleActive);
router.post('/:id/generer-maintenant', authorize('invoices:create'), audit('factures_recurrentes', 'create'), genererMaintenant);

module.exports = router;

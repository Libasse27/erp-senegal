const express = require('express');
const router = express.Router();
const {
  getBudgets,
  getBudget,
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetComparaison,
} = require('../controllers/budgetController');
const { protect } = require('../middlewares/auth');
const tenantMiddleware = require('../middlewares/tenant');
const { authorize } = require('../middlewares/rbac');

router.use(protect);
router.use(tenantMiddleware);

router.get('/comparaison', authorize('rapports:read'), getBudgetComparaison);

router.route('/')
  .get(authorize('rapports:read'), getBudgets)
  .post(authorize('rapports:read'), createBudget);

router.route('/:id')
  .get(authorize('rapports:read'), getBudget)
  .put(authorize('rapports:read'), updateBudget)
  .delete(authorize('rapports:read'), deleteBudget);

module.exports = router;

const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { tenantMiddleware } = require('../middlewares/tenant');
const { authorize } = require('../middlewares/rbac');
const {
  getConges,
  getConge,
  createConge,
  updateConge,
  deleteConge,
  getCongesStats,
} = require('../controllers/congeController');

router.use(protect, tenantMiddleware);

router.get('/stats', authorize('conges:read'),   getCongesStats);
router.get('/',      authorize('conges:read'),   getConges);
router.post('/',     authorize('conges:create'), createConge);
router.get('/:id',   authorize('conges:read'),   getConge);
router.put('/:id',   authorize('conges:update'), updateConge);
router.delete('/:id',authorize('conges:delete'), deleteConge);

module.exports = router;

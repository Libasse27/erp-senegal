const express = require('express');
const router  = express.Router();
const { protect }          = require('../middlewares/auth');
const { tenantMiddleware } = require('../middlewares/tenant');
const { authorize }        = require('../middlewares/rbac');
const {
  getOpportunites,
  getOpportunite,
  createOpportunite,
  updateOpportunite,
  deleteOpportunite,
  getPipelineStats,
  convertirEnDevis,
} = require('../controllers/opportuniteController');

router.use(protect, tenantMiddleware);

router.get('/pipeline',              authorize('opportunites:read'),   getPipelineStats);
router.get('/',                      authorize('opportunites:read'),   getOpportunites);
router.post('/',                     authorize('opportunites:create'), createOpportunite);
router.get('/:id',                   authorize('opportunites:read'),   getOpportunite);
router.put('/:id',                   authorize('opportunites:update'), updateOpportunite);
router.delete('/:id',                authorize('opportunites:delete'), deleteOpportunite);
router.post('/:id/convertir-devis',  authorize('opportunites:update'), convertirEnDevis);

module.exports = router;

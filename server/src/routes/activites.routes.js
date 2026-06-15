const express = require('express');
const router  = express.Router();
const { protect }          = require('../middlewares/auth');
const { tenantMiddleware } = require('../middlewares/tenant');
const { authorize }        = require('../middlewares/rbac');
const {
  getActivites,
  getActivite,
  createActivite,
  updateActivite,
  deleteActivite,
} = require('../controllers/activiteController');

router.use(protect, tenantMiddleware);

router.get('/',      authorize('activites:read'),   getActivites);
router.post('/',     authorize('activites:create'), createActivite);
router.get('/:id',   authorize('activites:read'),   getActivite);
router.put('/:id',   authorize('activites:update'), updateActivite);
router.delete('/:id',authorize('activites:delete'), deleteActivite);

module.exports = router;

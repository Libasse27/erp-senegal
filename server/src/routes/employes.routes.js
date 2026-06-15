const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { tenantMiddleware } = require('../middlewares/tenant');
const { authorize } = require('../middlewares/rbac');
const {
  getEmployes,
  getEmploye,
  createEmploye,
  updateEmploye,
  deleteEmploye,
  getStatsRH,
  getBulletin,
  genererEcrituresPayroll,
} = require('../controllers/employeController');

router.use(protect, tenantMiddleware);

router.get('/stats',           authorize('employes:read'),   getStatsRH);
router.get('/',                authorize('employes:read'),   getEmployes);
router.post('/',               authorize('employes:create'), createEmploye);
router.get('/:id',             authorize('employes:read'),   getEmploye);
router.put('/:id',             authorize('employes:update'), updateEmploye);
router.delete('/:id',          authorize('employes:delete'), deleteEmploye);
router.get('/:id/bulletin',    authorize('employes:read'),   getBulletin);
router.post('/:id/ecritures-paie', authorize('employes:update'), genererEcrituresPayroll);

module.exports = router;

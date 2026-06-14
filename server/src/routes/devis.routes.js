const express = require('express');
const router = express.Router();

const {
  getDevisList,
  getDevis,
  createDevis,
  updateDevis,
  deleteDevis,
  changeStatut,
  sendDevis,
  convertDevis,
  getDevisPDF,
} = require('../controllers/devisController');
const { protect } = require('../middlewares/auth');
const tenantMiddleware = require('../middlewares/tenant');
const subscriptionGuard = require('../middlewares/subscriptionGuard');
const { authorize } = require('../middlewares/rbac');
const validate = require('../middlewares/validate');
const {
  createDevis: createDevisSchema,
  updateDevis: updateDevisSchema,
  changeStatut: changeStatutSchema,
} = require('../validations/devis.validation');
const audit = require('../middlewares/audit');

router.use(protect);
router.use(tenantMiddleware);
router.use(subscriptionGuard('GESCOM'));

// CRUD
router.get('/', authorize('devis:read'), getDevisList);
router.get('/:id', authorize('devis:read'), getDevis);
router.get('/:id/pdf', authorize('devis:read'), getDevisPDF);
router.post(
  '/',
  authorize('devis:create'),
  validate(createDevisSchema),
  audit('devis', 'create'),
  createDevis
);
router.put(
  '/:id',
  authorize('devis:update'),
  validate(updateDevisSchema),
  audit('devis', 'update'),
  updateDevis
);
router.delete('/:id', authorize('devis:delete'), audit('devis', 'delete'), deleteDevis);

// Status change
router.put(
  '/:id/status',
  authorize('devis:update'),
  validate(changeStatutSchema),
  audit('devis', 'update'),
  changeStatut
);

// Send by email
router.post('/:id/send', authorize('devis:update'), audit('devis', 'update'), sendDevis);

// Convert to commande
router.post('/:id/convert', authorize('devis:update'), audit('devis', 'update'), convertDevis);

module.exports = router;

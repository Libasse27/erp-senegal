const express = require('express');
const router = express.Router();

const {
  getFactures,
  getFacture,
  createFacture,
  updateFacture,
  deleteFacture,
  validateFacture,
  sendFacture,
  getFacturePDF,
  createAvoir,
} = require('../controllers/factureController');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');
const validate = require('../middlewares/validate');
const {
  createFacture: createFactureSchema,
  updateFacture: updateFactureSchema,
  createAvoir: createAvoirSchema,
} = require('../validations/facture.validation');
const audit = require('../middlewares/audit');

// All routes require authentication
router.use(protect);

// CRUD
router.get('/', authorize('factures:read'), getFactures);
router.get('/:id', authorize('factures:read'), getFacture);
router.get('/:id/pdf', authorize('factures:read'), getFacturePDF);
router.post(
  '/',
  authorize('factures:create'),
  validate(createFactureSchema),
  audit('factures', 'create'),
  createFacture
);
router.put(
  '/:id',
  authorize('factures:update'),
  validate(updateFactureSchema),
  audit('factures', 'update'),
  updateFacture
);
router.delete('/:id', authorize('factures:delete'), audit('factures', 'delete'), deleteFacture);

// Validate facture (DGI numero + accounting entry)
router.post(
  '/:id/validate',
  authorize('factures:validate'),
  audit('factures', 'validate'),
  validateFacture
);

// Send by email
router.post('/:id/send', authorize('factures:update'), audit('factures', 'update'), sendFacture);

// Create avoir (credit note)
router.post(
  '/:id/avoir',
  authorize('factures:create'),
  validate(createAvoirSchema),
  audit('factures', 'create'),
  createAvoir
);

module.exports = router;

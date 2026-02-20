const express = require('express');
const router = express.Router();

const {
  getBonsLivraison,
  getBonLivraison,
  createBonLivraison,
  validateBL,
} = require('../controllers/bonLivraisonController');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');
const validate = require('../middlewares/validate');
const {
  createBonLivraison: createBLSchema,
  validateBL: validateBLSchema,
} = require('../validations/bonLivraison.validation');
const audit = require('../middlewares/audit');

// All routes require authentication
router.use(protect);

// CRUD
router.get('/', authorize('bons_livraison:read'), getBonsLivraison);
router.get('/:id', authorize('bons_livraison:read'), getBonLivraison);
router.post(
  '/',
  authorize('bons_livraison:create'),
  validate(createBLSchema),
  audit('bons_livraison', 'create'),
  createBonLivraison
);

// Validate BL (decrement stock + update commande)
router.post(
  '/:id/validate',
  authorize('bons_livraison:validate'),
  validate(validateBLSchema),
  audit('bons_livraison', 'validate'),
  validateBL
);

module.exports = router;

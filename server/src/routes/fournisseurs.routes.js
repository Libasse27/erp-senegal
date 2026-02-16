const express = require('express');
const router = express.Router();

const {
  getFournisseurs,
  getFournisseur,
  createFournisseur,
  updateFournisseur,
  deleteFournisseur,
} = require('../controllers/fournisseurController');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');
const validate = require('../middlewares/validate');
const { createFournisseur: createSchema, updateFournisseur: updateSchema } = require('../validations/fournisseur.validation');
const audit = require('../middlewares/audit');

// All routes require authentication
router.use(protect);

router.get('/', authorize('fournisseurs:read'), getFournisseurs);
router.get('/:id', authorize('fournisseurs:read'), getFournisseur);
router.post(
  '/',
  authorize('fournisseurs:create'),
  validate(createSchema),
  audit('fournisseurs', 'create'),
  createFournisseur
);
router.put(
  '/:id',
  authorize('fournisseurs:update'),
  validate(updateSchema),
  audit('fournisseurs', 'update'),
  updateFournisseur
);
router.delete('/:id', authorize('fournisseurs:delete'), audit('fournisseurs', 'delete'), deleteFournisseur);

module.exports = router;

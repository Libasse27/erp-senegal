const express = require('express');
const router = express.Router();

const {
  getCommandes,
  getCommande,
  createCommande,
  updateCommande,
  deleteCommande,
  changeStatut,
  generateBL,
} = require('../controllers/commandeController');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');
const validate = require('../middlewares/validate');
const {
  createCommande: createCommandeSchema,
  updateCommande: updateCommandeSchema,
  changeStatutCommande: changeStatutSchema,
  generateBLSchema,
} = require('../validations/commande.validation');
const audit = require('../middlewares/audit');

// All routes require authentication
router.use(protect);

// CRUD
router.get('/', authorize('commandes:read'), getCommandes);
router.get('/:id', authorize('commandes:read'), getCommande);
router.post(
  '/',
  authorize('commandes:create'),
  validate(createCommandeSchema),
  audit('commandes', 'create'),
  createCommande
);
router.put(
  '/:id',
  authorize('commandes:update'),
  validate(updateCommandeSchema),
  audit('commandes', 'update'),
  updateCommande
);
router.delete('/:id', authorize('commandes:delete'), audit('commandes', 'delete'), deleteCommande);

// Status change
router.put(
  '/:id/status',
  authorize('commandes:update'),
  validate(changeStatutSchema),
  audit('commandes', 'update'),
  changeStatut
);

// Generate bon de livraison
router.post(
  '/:id/livraison',
  authorize('bons_livraison:create'),
  validate(generateBLSchema),
  audit('bons_livraison', 'create'),
  generateBL
);

module.exports = router;

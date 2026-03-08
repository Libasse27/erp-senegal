const express = require('express');
const router = express.Router();

const {
  getCommandesAchat,
  getCommandeAchat,
  createCommandeAchat,
  updateCommandeAchat,
  deleteCommandeAchat,
  changeStatut,
} = require('../controllers/commandeAchatController');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');
const validate = require('../middlewares/validate');
const {
  createCommandeAchat: createSchema,
  updateCommandeAchat: updateSchema,
  changeStatutCommandeAchat: changeStatutSchema,
} = require('../validations/commandeAchat.validation');
const audit = require('../middlewares/audit');

router.use(protect);

router.get('/', authorize('commandes_achat:read'), getCommandesAchat);
router.get('/:id', authorize('commandes_achat:read'), getCommandeAchat);
router.post(
  '/',
  authorize('commandes_achat:create'),
  validate(createSchema),
  audit('commandes_achat', 'create'),
  createCommandeAchat
);
router.put(
  '/:id',
  authorize('commandes_achat:update'),
  validate(updateSchema),
  audit('commandes_achat', 'update'),
  updateCommandeAchat
);
router.delete(
  '/:id',
  authorize('commandes_achat:delete'),
  audit('commandes_achat', 'delete'),
  deleteCommandeAchat
);
router.put(
  '/:id/statut',
  authorize('commandes_achat:update'),
  validate(changeStatutSchema),
  audit('commandes_achat', 'update'),
  changeStatut
);

module.exports = router;

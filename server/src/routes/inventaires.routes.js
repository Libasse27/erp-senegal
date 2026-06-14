const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');
const {
  getInventaires,
  getInventaire,
  createInventaire,
  updateInventaireLignes,
  demarrerInventaire,
  validerInventaire,
  annulerInventaire,
  deleteInventaire,
} = require('../controllers/inventaireController');

router.use(authenticate);

router.get('/', authorize('stocks:read'), getInventaires);
router.get('/:id', authorize('stocks:read'), getInventaire);

router.post('/', authorize('stocks:update'), createInventaire);
router.put('/:id', authorize('stocks:update'), updateInventaireLignes);
router.delete('/:id', authorize('stocks:update'), deleteInventaire);

router.post('/:id/demarrer', authorize('stocks:update'), demarrerInventaire);
router.post('/:id/valider', authorize('stocks:update'), validerInventaire);
router.post('/:id/annuler', authorize('stocks:update'), annulerInventaire);

module.exports = router;

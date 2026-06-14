const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');
const {
  getTransferts,
  getTransfert,
  createTransfert,
  updateTransfert,
  deleteTransfert,
  validerTransfert,
  annulerTransfert,
} = require('../controllers/transfertController');

router.use(authenticate);

router.get('/',    authorize('stocks:read'),   getTransferts);
router.get('/:id', authorize('stocks:read'),   getTransfert);
router.post('/',   authorize('stocks:update'), createTransfert);
router.put('/:id', authorize('stocks:update'), updateTransfert);
router.delete('/:id', authorize('stocks:update'), deleteTransfert);
router.post('/:id/valider',  authorize('stocks:update'), validerTransfert);
router.post('/:id/annuler',  authorize('stocks:update'), annulerTransfert);

module.exports = router;

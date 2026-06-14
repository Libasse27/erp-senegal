const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');
const {
  getFacturesFournisseur,
  getFactureFournisseur,
  createFactureFournisseur,
  updateFactureFournisseur,
  deleteFactureFournisseur,
  validerFactureFournisseur,
  enregistrerPaiement,
  getStatsFacturesFournisseur,
} = require('../controllers/factureFournisseurController');

router.use(authenticate);

router.get('/stats', authorize('factures_fournisseurs:read'), getStatsFacturesFournisseur);
router.get('/', authorize('factures_fournisseurs:read'), getFacturesFournisseur);
router.get('/:id', authorize('factures_fournisseurs:read'), getFactureFournisseur);

router.post('/', authorize('factures_fournisseurs:create'), createFactureFournisseur);
router.put('/:id', authorize('factures_fournisseurs:create'), updateFactureFournisseur);
router.delete('/:id', authorize('factures_fournisseurs:create'), deleteFactureFournisseur);
router.post('/:id/valider', authorize('factures_fournisseurs:create'), validerFactureFournisseur);
router.post('/:id/paiement', authorize('factures_fournisseurs:create'), enregistrerPaiement);

module.exports = router;

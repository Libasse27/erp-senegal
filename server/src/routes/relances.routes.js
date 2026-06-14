const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');
const {
  getCreancesEnRetard,
  getStatsRelances,
  getRelances,
  getRelance,
  createRelance,
  acquitterRelance,
  annulerRelance,
  deleteRelance,
} = require('../controllers/relanceController');

router.use(authenticate);

router.get('/retards', authorize('factures:read'), getCreancesEnRetard);
router.get('/stats',   authorize('factures:read'), getStatsRelances);
router.get('/',        authorize('factures:read'), getRelances);
router.get('/:id',     authorize('factures:read'), getRelance);
router.post('/',       authorize('factures:create'), createRelance);
router.post('/:id/acquitter', authorize('factures:create'), acquitterRelance);
router.post('/:id/annuler',   authorize('factures:create'), annulerRelance);
router.delete('/:id',         authorize('factures:create'), deleteRelance);

module.exports = router;

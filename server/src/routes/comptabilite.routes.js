const express = require('express');
const router = express.Router();

const {
  // Plan comptable
  getPlanComptable,
  getCompteComptable,
  createCompteComptable,
  updateCompteComptable,
  deleteCompteComptable,
  // Ecritures
  getEcritures,
  getEcriture,
  createEcriture,
  updateEcriture,
  validateEcriture,
  deleteEcriture,
  contrepasserEcriture,
  lettrerEcritures,
  // Exercices
  getExercices,
  createExercice,
  cloturerExercice,
  // Etats financiers
  getGrandLivre,
  getBalance,
  getCompteResultat,
  getBilan,
  getDeclarationTVA,
  exportFEC,
  exportBalanceExcelHandler,
  exportGrandLivreExcelHandler,
  exportCompteResultatExcelHandler,
} = require('../controllers/comptabiliteController');
const { protect } = require('../middlewares/auth');
const tenantMiddleware = require('../middlewares/tenant');
const subscriptionGuard = require('../middlewares/subscriptionGuard');
const { authorize } = require('../middlewares/rbac');
const validate = require('../middlewares/validate');
const {
  createCompteComptable: createCompteSchema,
  updateCompteComptable: updateCompteSchema,
  createEcriture: createEcritureSchema,
  updateEcriture: updateEcritureSchema,
  createExercice: createExerciceSchema,
  lettrage: lettrageSchema,
} = require('../validations/comptabilite.validation');
const audit = require('../middlewares/audit');
const { cache } = require('../middlewares/cache');
const { exportLimiter } = require('../middlewares/rateLimiter');

router.use(protect);
router.use(tenantMiddleware);
router.use(subscriptionGuard('COMPTABILITE'));

// === Plan Comptable ===
router.get('/plan', authorize('comptabilite:read'), cache(300), getPlanComptable);
router.get('/plan/:id', authorize('comptabilite:read'), getCompteComptable);
router.post(
  '/plan',
  authorize('comptabilite:create'),
  validate(createCompteSchema),
  audit('comptabilite', 'create'),
  createCompteComptable
);
router.put(
  '/plan/:id',
  authorize('comptabilite:update'),
  validate(updateCompteSchema),
  audit('comptabilite', 'update'),
  updateCompteComptable
);
router.delete(
  '/plan/:id',
  authorize('comptabilite:delete'),
  audit('comptabilite', 'delete'),
  deleteCompteComptable
);

// === Ecritures Comptables ===
router.get('/ecritures', authorize('ecritures:read'), getEcritures);
router.get('/ecritures/:id', authorize('ecritures:read'), getEcriture);
router.post(
  '/ecritures',
  authorize('ecritures:create'),
  validate(createEcritureSchema),
  audit('ecritures', 'create'),
  createEcriture
);
router.put(
  '/ecritures/:id',
  authorize('ecritures:update'),
  validate(updateEcritureSchema),
  audit('ecritures', 'update'),
  updateEcriture
);
router.delete(
  '/ecritures/:id',
  authorize('ecritures:delete'),
  audit('ecritures', 'delete'),
  deleteEcriture
);
router.post(
  '/ecritures/:id/validate',
  authorize('ecritures:validate'),
  audit('ecritures', 'validate'),
  validateEcriture
);
router.post(
  '/ecritures/:id/contrepasser',
  authorize('ecritures:create'),
  audit('ecritures', 'create'),
  contrepasserEcriture
);

// === Lettrage ===
router.post(
  '/lettrage',
  authorize('ecritures:update'),
  validate(lettrageSchema),
  audit('ecritures', 'update'),
  lettrerEcritures
);

// === Exercices Comptables ===
router.get('/exercices', authorize('comptabilite:read'), getExercices);
router.post(
  '/exercices',
  authorize('comptabilite:create'),
  validate(createExerciceSchema),
  audit('comptabilite', 'create'),
  createExercice
);
router.post(
  '/exercices/:id/cloture',
  authorize('comptabilite:validate'),
  audit('comptabilite', 'validate'),
  cloturerExercice
);

// === Etats Financiers ===
router.get('/grand-livre', authorize('comptabilite:read'), getGrandLivre);
router.get('/balance', authorize('comptabilite:read'), getBalance);
router.get('/compte-resultat', authorize('comptabilite:read'), getCompteResultat);
router.get('/bilan', authorize('comptabilite:read'), getBilan);
router.get('/tva', authorize('comptabilite:read'), getDeclarationTVA);
router.get('/fec', exportLimiter, authorize('comptabilite:export'), exportFEC);

// === Exports Excel ===
router.get('/balance/export', exportLimiter, authorize('comptabilite:export'), exportBalanceExcelHandler);
router.get('/grand-livre/export', exportLimiter, authorize('comptabilite:export'), exportGrandLivreExcelHandler);
router.get('/compte-resultat/export', exportLimiter, authorize('comptabilite:export'), exportCompteResultatExcelHandler);

module.exports = router;

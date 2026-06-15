const express = require('express');
const router = express.Router();
const {
  getBudgets,
  getBudget,
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetComparaison,
} = require('../controllers/budgetController');
const { protect } = require('../middlewares/auth');
const tenantMiddleware = require('../middlewares/tenant');
const { authorize } = require('../middlewares/rbac');

router.use(protect);
router.use(tenantMiddleware);

/**
 * @swagger
 * /budgets/comparaison:
 *   get:
 *     summary: Comparaison budget vs réalisé par catégorie et période
 *     tags: [Budget & Prévisions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: annee
 *         required: true
 *         schema:
 *           type: integer
 *         description: Année de l'exercice budgétaire
 *       - in: query
 *         name: mois
 *         schema:
 *           type: integer
 *         description: Mois (1-12). Omis = budget annuel global
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [produit, charge]
 *         description: Filtrer par type de budget
 *     responses:
 *       200:
 *         description: Tableau comparatif avec taux de réalisation par catégorie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     lignes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           categorie:
 *                             type: string
 *                           type:
 *                             type: string
 *                             enum: [produit, charge]
 *                           montantPrevu:
 *                             type: number
 *                           montantRealise:
 *                             type: number
 *                           ecart:
 *                             type: number
 *                           tauxRealisation:
 *                             type: number
 *                             description: Pourcentage de réalisation
 *                     totaux:
 *                       type: object
 *                       properties:
 *                         totalPrevu:
 *                           type: number
 *                         totalRealise:
 *                           type: number
 *                         tauxGlobal:
 *                           type: number
 */
router.get('/comparaison', authorize('rapports:read'), getBudgetComparaison);

/**
 * @swagger
 * /budgets:
 *   get:
 *     summary: Liste des budgets / lignes budgétaires
 *     tags: [Budget & Prévisions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: annee
 *         schema:
 *           type: integer
 *       - in: query
 *         name: mois
 *         schema:
 *           type: integer
 *         description: Mois (1-12). Omis = budgets annuels
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [produit, charge]
 *     responses:
 *       200:
 *         description: Liste des lignes budgétaires
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *   post:
 *     summary: Créer une ligne budgétaire
 *     tags: [Budget & Prévisions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [annee, type, categorie, montantPrevu]
 *             properties:
 *               annee:
 *                 type: integer
 *                 example: 2026
 *               mois:
 *                 type: integer
 *                 description: Mois (1-12). Omis = budget annuel global
 *               type:
 *                 type: string
 *                 enum: [produit, charge]
 *               categorie:
 *                 type: string
 *                 description: Catégorie budgétaire (ventes, salaires, loyer, etc.)
 *               montantPrevu:
 *                 type: number
 *                 description: Montant prévisionnel en FCFA
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Ligne budgétaire créée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.route('/')
  .get(authorize('rapports:read'), getBudgets)
  .post(authorize('rapports:read'), createBudget);

/**
 * @swagger
 * /budgets/{id}:
 *   get:
 *     summary: Détail d'une ligne budgétaire
 *     tags: [Budget & Prévisions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ligne budgétaire
 *   put:
 *     summary: Modifier une ligne budgétaire
 *     tags: [Budget & Prévisions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Ligne budgétaire mise à jour
 *   delete:
 *     summary: Supprimer une ligne budgétaire
 *     tags: [Budget & Prévisions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ligne supprimée
 */
router.route('/:id')
  .get(authorize('rapports:read'), getBudget)
  .put(authorize('rapports:read'), updateBudget)
  .delete(authorize('rapports:read'), deleteBudget);

module.exports = router;

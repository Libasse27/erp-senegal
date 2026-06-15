const express = require('express');
const router  = express.Router();
const { protect }          = require('../middlewares/auth');
const { tenantMiddleware } = require('../middlewares/tenant');
const { authorize }        = require('../middlewares/rbac');
const {
  getActivites,
  getActivite,
  createActivite,
  updateActivite,
  deleteActivite,
} = require('../controllers/activiteController');

router.use(protect, tenantMiddleware);

/**
 * @swagger
 * /crm/activites:
 *   get:
 *     summary: Liste des activités commerciales
 *     tags: [CRM — Activités]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: opportunite
 *         schema:
 *           type: string
 *         description: Filtrer par ID d'opportunité
 *       - in: query
 *         name: statut
 *         schema:
 *           type: string
 *           enum: [planifie, realise, annule]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [appel, email, reunion, demonstration, relance, autre]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *     responses:
 *       200:
 *         description: Liste paginée des activités
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *   post:
 *     summary: Créer une activité commerciale
 *     tags: [CRM — Activités]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [opportunite, type, titre, dateActivite]
 *             properties:
 *               opportunite:
 *                 type: string
 *                 description: ID de l'opportunité liée
 *               type:
 *                 type: string
 *                 enum: [appel, email, reunion, demonstration, relance, autre]
 *               titre:
 *                 type: string
 *                 maxLength: 200
 *               dateActivite:
 *                 type: string
 *                 format: date-time
 *               dureeMinutes:
 *                 type: integer
 *                 default: 30
 *               statut:
 *                 type: string
 *                 enum: [planifie, realise, annule]
 *                 default: planifie
 *               description:
 *                 type: string
 *               resultat:
 *                 type: string
 *                 description: Outcome / décision prise après l'activité
 *     responses:
 *       201:
 *         description: Activité créée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.get('/', authorize('activites:read'), getActivites);
router.post('/', authorize('activites:create'), createActivite);

/**
 * @swagger
 * /crm/activites/{id}:
 *   get:
 *     summary: Détail d'une activité
 *     tags: [CRM — Activités]
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
 *         description: Détail de l'activité
 *   put:
 *     summary: Modifier une activité (dont marquer comme réalisée)
 *     tags: [CRM — Activités]
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
 *             properties:
 *               statut:
 *                 type: string
 *                 enum: [planifie, realise, annule]
 *               resultat:
 *                 type: string
 *     responses:
 *       200:
 *         description: Activité mise à jour
 *   delete:
 *     summary: Supprimer une activité (suppression définitive)
 *     tags: [CRM — Activités]
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
 *         description: Activité supprimée
 */
router.get('/:id', authorize('activites:read'), getActivite);
router.put('/:id', authorize('activites:update'), updateActivite);
router.delete('/:id', authorize('activites:delete'), deleteActivite);

module.exports = router;

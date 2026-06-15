const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const tenantMiddleware = require('../middlewares/tenant');
const { authorize } = require('../middlewares/rbac');
const {
  getConges,
  getConge,
  createConge,
  updateConge,
  deleteConge,
  getCongesStats,
} = require('../controllers/congeController');

router.use(protect, tenantMiddleware);

/**
 * @swagger
 * /conges/stats:
 *   get:
 *     summary: Statistiques des congés par type
 *     tags: [RH — Congés]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Répartition des congés (congé annuel, maladie, maternité, etc.)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.get('/stats', authorize('conges:read'), getCongesStats);

/**
 * @swagger
 * /conges:
 *   get:
 *     summary: Liste des demandes de congé
 *     tags: [RH — Congés]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: statut
 *         schema:
 *           type: string
 *           enum: [en_attente, approuve, refuse, annule]
 *       - in: query
 *         name: employe
 *         schema:
 *           type: string
 *         description: ID de l'employé pour filtrer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *     responses:
 *       200:
 *         description: Liste paginée des congés
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *   post:
 *     summary: Créer une demande de congé
 *     tags: [RH — Congés]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [employe, type, dateDebut, dateFin]
 *             properties:
 *               employe:
 *                 type: string
 *                 description: ID de l'employé
 *               type:
 *                 type: string
 *                 enum: [conge_annuel, maladie, maternite, paternite, sans_solde, autre]
 *               dateDebut:
 *                 type: string
 *                 format: date
 *               dateFin:
 *                 type: string
 *                 format: date
 *               motif:
 *                 type: string
 *     responses:
 *       201:
 *         description: Demande créée — nbJours calculé automatiquement (jours ouvrables, hors week-ends)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.get('/', authorize('conges:read'), getConges);
router.post('/', authorize('conges:create'), createConge);

/**
 * @swagger
 * /conges/{id}:
 *   get:
 *     summary: Détail d'une demande de congé
 *     tags: [RH — Congés]
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
 *         description: Détail du congé
 *   put:
 *     summary: Modifier / approuver / refuser un congé
 *     tags: [RH — Congés]
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
 *                 enum: [approuve, refuse, annule]
 *               commentaireRH:
 *                 type: string
 *     responses:
 *       200:
 *         description: Congé mis à jour
 *   delete:
 *     summary: Supprimer une demande de congé (statut en_attente uniquement)
 *     tags: [RH — Congés]
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
 *         description: Demande supprimée
 */
router.get('/:id', authorize('conges:read'), getConge);
router.put('/:id', authorize('conges:update'), updateConge);
router.delete('/:id', authorize('conges:delete'), deleteConge);

module.exports = router;

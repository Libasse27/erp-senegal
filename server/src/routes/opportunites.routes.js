const express = require('express');
const router  = express.Router();
const { protect }          = require('../middlewares/auth');
const tenantMiddleware = require('../middlewares/tenant');
const { authorize }        = require('../middlewares/rbac');
const {
  getOpportunites,
  getOpportunite,
  createOpportunite,
  updateOpportunite,
  deleteOpportunite,
  getPipelineStats,
  convertirEnDevis,
} = require('../controllers/opportuniteController');

router.use(protect, tenantMiddleware);

/**
 * @swagger
 * /crm/opportunites/pipeline:
 *   get:
 *     summary: Statistiques du pipeline commercial
 *     tags: [CRM — Opportunités]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: KPIs pipeline — count/montant par étape, affaires gagnées du mois, activités planifiées
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
 *                     pipeline:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           etape:
 *                             type: string
 *                             enum: [prospect, qualification, proposition, negociation, gagne, perdu]
 *                           count:
 *                             type: integer
 *                           montantTotal:
 *                             type: number
 *                           montantPondere:
 *                             type: number
 *                             description: Montant x probabilité (FCFA)
 *                     gagnesMois:
 *                       type: integer
 *                     montantGagneMois:
 *                       type: number
 *                     activitesPlanifiees:
 *                       type: integer
 *                     montantPipelineTotal:
 *                       type: number
 */
router.get('/pipeline', authorize('opportunites:read'), getPipelineStats);

/**
 * @swagger
 * /crm/opportunites:
 *   get:
 *     summary: Liste des opportunités commerciales
 *     tags: [CRM — Opportunités]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: etape
 *         schema:
 *           type: string
 *           enum: [prospect, qualification, proposition, negociation, gagne, perdu]
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: string
 *           default: "true"
 *         description: '"true" | "false" | "tous"'
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *     responses:
 *       200:
 *         description: Liste paginée des opportunités
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *   post:
 *     summary: Créer une opportunité
 *     tags: [CRM — Opportunités]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [titre]
 *             properties:
 *               titre:
 *                 type: string
 *               client:
 *                 type: string
 *                 description: ID du client
 *               etape:
 *                 type: string
 *                 enum: [prospect, qualification, proposition, negociation, gagne, perdu]
 *                 default: prospect
 *               montantEstime:
 *                 type: number
 *                 description: Montant estimé en FCFA
 *               probabilite:
 *                 type: integer
 *                 description: Probabilité en % (auto-calculé selon étape si non fourni)
 *               dateEcheance:
 *                 type: string
 *                 format: date
 *               sourceContact:
 *                 type: string
 *                 enum: [inbound, outbound, referral, partenaire, salon, autre]
 *     responses:
 *       201:
 *         description: Opportunité créée avec référence auto-générée (OPP-YYYY-NNNN)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.get('/', authorize('opportunites:read'), getOpportunites);
router.post('/', authorize('opportunites:create'), createOpportunite);

/**
 * @swagger
 * /crm/opportunites/{id}:
 *   get:
 *     summary: Détail d'une opportunité avec ses activités
 *     tags: [CRM — Opportunités]
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
 *         description: Opportunité + activités associées
 *       404:
 *         description: Non trouvée
 *   put:
 *     summary: Modifier une opportunité (dont changer d'étape)
 *     tags: [CRM — Opportunités]
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
 *         description: Opportunité mise à jour (probabilité ajustée si étape change)
 *   delete:
 *     summary: Archiver une opportunité (soft delete — isActive = false)
 *     tags: [CRM — Opportunités]
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
 *         description: Opportunité archivée
 */
router.get('/:id', authorize('opportunites:read'), getOpportunite);
router.put('/:id', authorize('opportunites:update'), updateOpportunite);
router.delete('/:id', authorize('opportunites:delete'), deleteOpportunite);

/**
 * @swagger
 * /crm/opportunites/{id}/convertir-devis:
 *   post:
 *     summary: Convertir une opportunité en devis
 *     tags: [CRM — Opportunités]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Devis créé (numéro DE{YYYY}-{NNNNN}) et lié à l'opportunité
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Un devis existe déjà ou aucun client associé
 */
router.post('/:id/convertir-devis', authorize('opportunites:update'), convertirEnDevis);

module.exports = router;

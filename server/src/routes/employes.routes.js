const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { tenantMiddleware } = require('../middlewares/tenant');
const { authorize } = require('../middlewares/rbac');
const {
  getEmployes,
  getEmploye,
  createEmploye,
  updateEmploye,
  deleteEmploye,
  getStatsRH,
  getBulletin,
  genererEcrituresPayroll,
} = require('../controllers/employeController');

router.use(protect, tenantMiddleware);

/**
 * @swagger
 * /employes/stats:
 *   get:
 *     summary: Statistiques RH globales
 *     tags: [RH — Employés]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: KPIs RH (effectif, masse salariale, répartition contrats, congés)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.get('/stats', authorize('employes:read'), getStatsRH);

/**
 * @swagger
 * /employes:
 *   get:
 *     summary: Liste des employés
 *     tags: [RH — Employés]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: statut
 *         schema:
 *           type: string
 *           enum: [actif, inactif]
 *       - in: query
 *         name: departement
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Liste paginée des employés
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *   post:
 *     summary: Créer un employé
 *     tags: [RH — Employés]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [prenom, nom, email, poste, departement, dateEmbauche, typeContrat, salaireBrut]
 *             properties:
 *               prenom:
 *                 type: string
 *               nom:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               poste:
 *                 type: string
 *               departement:
 *                 type: string
 *               dateEmbauche:
 *                 type: string
 *                 format: date
 *               typeContrat:
 *                 type: string
 *                 enum: [CDI, CDD, Stage, Consultant, Freelance]
 *               salaireBrut:
 *                 type: number
 *                 description: Salaire brut en FCFA
 *               tauxIPRES:
 *                 type: number
 *                 default: 5.6
 *               tauxIR:
 *                 type: number
 *                 default: 3
 *     responses:
 *       201:
 *         description: Employé créé avec matricule auto-généré (EMP-YYYY-NNNN)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.get('/', authorize('employes:read'), getEmployes);
router.post('/', authorize('employes:create'), createEmploye);

/**
 * @swagger
 * /employes/{id}:
 *   get:
 *     summary: Détail d'un employé
 *     tags: [RH — Employés]
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
 *         description: Détail employé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: Employé non trouvé
 *   put:
 *     summary: Modifier un employé
 *     tags: [RH — Employés]
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
 *         description: Employé mis à jour
 *   delete:
 *     summary: Désactiver un employé (soft delete)
 *     tags: [RH — Employés]
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
 *         description: Employé désactivé (statut = inactif)
 */
router.get('/:id', authorize('employes:read'), getEmploye);
router.put('/:id', authorize('employes:update'), updateEmploye);
router.delete('/:id', authorize('employes:delete'), deleteEmploye);

/**
 * @swagger
 * /employes/{id}/bulletin:
 *   get:
 *     summary: Générer le bulletin de paie d'un employé
 *     tags: [RH — Employés]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: mois
 *         schema:
 *           type: integer
 *         description: Mois (1-12)
 *       - in: query
 *         name: annee
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Données du bulletin (salaireBrut, cotisations, IR, salaireNet)
 *
 * /employes/{id}/ecritures-paie:
 *   post:
 *     summary: Générer les écritures comptables SYSCOHADA pour le payroll
 *     tags: [RH — Employés]
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
 *             required: [mois, annee]
 *             properties:
 *               mois:
 *                 type: integer
 *                 description: Mois de paie (1-12)
 *               annee:
 *                 type: integer
 *                 description: Année de paie
 *     responses:
 *       201:
 *         description: Écritures créées — D.661 Rémunérations / C.421 Rémunérations dues / C.431 IPRES / C.447 IR
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.get('/:id/bulletin', authorize('employes:read'), getBulletin);
router.post('/:id/ecritures-paie', authorize('employes:update'), genererEcrituresPayroll);

module.exports = router;

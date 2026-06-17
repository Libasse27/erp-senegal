const express = require('express');
const router = express.Router();
const { listPlans, getPlan } = require('../controllers/planController');

/**
 * @swagger
 * tags:
 *   - name: Plans SaaS
 *     description: Plans d'abonnement disponibles (public)
 */

/**
 * @swagger
 * /plans:
 *   get:
 *     summary: Lister tous les plans actifs et visibles
 *     tags: [Plans SaaS]
 *     responses:
 *       200:
 *         description: Liste des plans disponibles
 */
router.get('/', listPlans);

/**
 * @swagger
 * /plans/{code}:
 *   get:
 *     summary: "Détail d'un plan par son code (ex: STANDARD)"
 *     tags: [Plans SaaS]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Plan trouvé
 *       404:
 *         description: Plan introuvable
 */
router.get('/:code', getPlan);

module.exports = router;

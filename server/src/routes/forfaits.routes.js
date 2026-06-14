/**
 * @swagger
 * /forfaits:
 *   get:
 *     summary: Lister tous les forfaits SaaS actifs
 *     tags: [Forfaits SaaS]
 *     security: []
 *     responses:
 *       200:
 *         description: Liste des forfaits disponibles (STANDARD, PROFESSIONNEL, COMPLET)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Forfait'
 *
 * /forfaits/{code}:
 *   get:
 *     summary: Détails d'un forfait par son code
 *     tags: [Forfaits SaaS]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *           enum: [STANDARD, PROFESSIONNEL, COMPLET]
 *         example: PROFESSIONNEL
 *     responses:
 *       200:
 *         description: Forfait trouvé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   $ref: '#/components/schemas/Forfait'
 *       404:
 *         description: Forfait introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
const express = require('express');
const router = express.Router();
const { listForfaits, getForfait } = require('../controllers/forfaitController');

// Routes publiques — accessibles depuis la page d'inscription
router.get('/', listForfaits);
router.get('/:code', getForfait);

module.exports = router;

/**
 * @swagger
 * tags:
 *   - name: Factures SaaS
 *     description: Factures d'abonnement émises par la plateforme vers l'entreprise
 */

/**
 * @swagger
 * /invoices-saas:
 *   get:
 *     summary: Lister les factures d'abonnement de l'entreprise connectée
 *     tags: [Factures SaaS]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: statut
 *         schema:
 *           type: string
 *           enum: [EMISE, PAYEE, ANNULEE]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Liste paginée des factures SaaS
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *
 * /invoices-saas/{id}:
 *   get:
 *     summary: Détail d'une facture d'abonnement
 *     tags: [Factures SaaS]
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
 *         description: Détail de la facture
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

const express = require('express');
const router  = express.Router();

const { getMesFactures, getUneFacture } = require('../controllers/invoiceSaasController');
const { protect }         = require('../middlewares/auth');
const tenantMiddleware    = require('../middlewares/tenant');
const subscriptionGuard   = require('../middlewares/subscriptionGuard');

// Toutes les routes nécessitent un utilisateur authentifié appartenant à une entreprise
router.use(protect);
router.use(tenantMiddleware);

router.get('/',    getMesFactures);
router.get('/:id', getUneFacture);

module.exports = router;

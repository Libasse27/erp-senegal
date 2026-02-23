const express = require('express');
const router = express.Router();

// Phase 1 routes
const authRoutes = require('./auth.routes');
const usersRoutes = require('./users.routes');
const companyRoutes = require('./company.routes');
const settingsRoutes = require('./settings.routes');
const adminRoutes = require('./admin.routes');

// Phase 2 routes — Modules Commerciaux
const clientsRoutes = require('./clients.routes');
const fournisseursRoutes = require('./fournisseurs.routes');
const categoriesRoutes = require('./categories.routes');
const productsRoutes = require('./products.routes');
const stocksRoutes = require('./stocks.routes');
const warehousesRoutes = require('./warehouses.routes');

// Phase 3 routes — Cycle de Vente
const devisRoutes = require('./devis.routes');
const commandesRoutes = require('./commandes.routes');
const bonsLivraisonRoutes = require('./bons-livraison.routes');
const facturesRoutes = require('./factures.routes');

// Phase 4 routes — Paiements & Comptabilite
const paymentsRoutes = require('./payments.routes');
const bankAccountsRoutes = require('./bank-accounts.routes');
const comptabiliteRoutes = require('./comptabilite.routes');

// Dashboard
const dashboardRoutes = require('./dashboard.routes');

// Notifications
const notificationsRoutes = require('./notifications.routes');

const { limiter } = require('../middlewares/rateLimiter');

// Appliquer le rate limiter global
router.use(limiter);

// === Phase 1 — Fondations ===
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/company', companyRoutes);
router.use('/settings', settingsRoutes);
router.use('/admin', adminRoutes);

// === Phase 2 — Modules Commerciaux ===
router.use('/clients', clientsRoutes);
router.use('/fournisseurs', fournisseursRoutes);
router.use('/categories', categoriesRoutes);
router.use('/products', productsRoutes);
router.use('/stocks', stocksRoutes);
router.use('/warehouses', warehousesRoutes);

// === Phase 3 — Cycle de Vente ===
router.use('/devis', devisRoutes);
router.use('/commandes', commandesRoutes);
router.use('/bons-livraison', bonsLivraisonRoutes);
router.use('/factures', facturesRoutes);

// === Phase 4 — Paiements & Comptabilite ===
router.use('/payments', paymentsRoutes);
router.use('/bank-accounts', bankAccountsRoutes);
router.use('/comptabilite', comptabiliteRoutes);

// === Dashboard ===
router.use('/dashboard', dashboardRoutes);

// === Notifications ===
router.use('/notifications', notificationsRoutes);

module.exports = router;

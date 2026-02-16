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

module.exports = router;

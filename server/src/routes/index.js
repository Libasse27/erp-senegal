const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const usersRoutes = require('./users.routes');
const companyRoutes = require('./company.routes');
const settingsRoutes = require('./settings.routes');
const adminRoutes = require('./admin.routes');

const { limiter } = require('../middlewares/rateLimiter');

// Appliquer le rate limiter global
router.use(limiter);

// Monter les routes
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/company', companyRoutes);
router.use('/settings', settingsRoutes);
router.use('/admin', adminRoutes);

module.exports = router;

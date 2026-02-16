const express = require('express');
const router = express.Router();

const {
  register,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');
const { protect } = require('../middlewares/auth');
const { authorizeRoles } = require('../middlewares/rbac');
const { authLimiter } = require('../middlewares/rateLimiter');
const validate = require('../middlewares/validate');
const authValidation = require('../validations/auth.validation');
const audit = require('../middlewares/audit');

// Routes publiques
router.post('/login', authLimiter, validate(authValidation.login), login);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', authLimiter, validate(authValidation.forgotPassword), forgotPassword);
router.put('/reset-password/:token', validate(authValidation.resetPassword), resetPassword);

// Routes protegees
router.post(
  '/register',
  protect,
  authorizeRoles('admin'),
  validate(authValidation.register),
  audit('users', 'create'),
  register
);
router.post('/logout', protect, logout);

module.exports = router;

const express = require('express');
const router = express.Router();

const { getSettings, updateSettings } = require('../controllers/settingsController');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');
const audit = require('../middlewares/audit');

// Toutes les routes sont protegees
router.use(protect);

router.get('/', authorize('settings:read'), getSettings);
router.put('/', authorize('settings:update'), audit('settings', 'update'), updateSettings);

module.exports = router;

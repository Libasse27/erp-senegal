const express = require('express');
const router = express.Router();

const { getSettings, updateSettings } = require('../controllers/settingsController');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');
const validate = require('../middlewares/validate');
const { updateSettings: updateSettingsSchema } = require('../validations/settings.validation');
const audit = require('../middlewares/audit');

// Toutes les routes sont protegees
router.use(protect);

router.get('/', authorize('settings:read'), getSettings);
router.put(
  '/',
  authorize('settings:update'),
  validate(updateSettingsSchema),
  audit('settings', 'update'),
  updateSettings
);

module.exports = router;

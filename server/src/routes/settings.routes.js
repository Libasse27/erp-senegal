const express = require('express');
const router = express.Router();

const { getSettings, updateSettings } = require('../controllers/settingsController');
const { protect } = require('../middlewares/auth');
const tenantMiddleware = require('../middlewares/tenant');
const { authorize } = require('../middlewares/rbac');
const validate = require('../middlewares/validate');
const { updateSettings: updateSettingsSchema } = require('../validations/settings.validation');
const audit = require('../middlewares/audit');
const { cache } = require('../middlewares/cache');

router.use(protect);
router.use(tenantMiddleware);

router.get('/', authorize('settings:read'), cache(300), getSettings);
router.put(
  '/',
  authorize('settings:update'),
  validate(updateSettingsSchema),
  audit('settings', 'update'),
  updateSettings
);

module.exports = router;

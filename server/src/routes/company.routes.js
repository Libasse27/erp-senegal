const express = require('express');
const router = express.Router();

const { getCompany, updateCompany } = require('../controllers/companyController');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');
const validate = require('../middlewares/validate');
const { updateCompany: updateCompanySchema } = require('../validations/company.validation');
const audit = require('../middlewares/audit');
const { cache } = require('../middlewares/cache');

// Toutes les routes sont protegees
router.use(protect);

router.get('/', authorize('company:read'), cache(300), getCompany);
router.put(
  '/',
  authorize('company:update'),
  validate(updateCompanySchema),
  audit('company', 'update'),
  updateCompany
);

module.exports = router;

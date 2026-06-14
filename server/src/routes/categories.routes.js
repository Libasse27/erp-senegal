const express = require('express');
const router = express.Router();

const {
  getCategories,
  getCategoryTree,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { protect } = require('../middlewares/auth');
const tenantMiddleware = require('../middlewares/tenant');
const subscriptionGuard = require('../middlewares/subscriptionGuard');
const { authorize } = require('../middlewares/rbac');
const validate = require('../middlewares/validate');
const { createCategory: createSchema, updateCategory: updateSchema } = require('../validations/category.validation');
const audit = require('../middlewares/audit');
const { cache } = require('../middlewares/cache');

router.use(protect);
router.use(tenantMiddleware);
router.use(subscriptionGuard('GESCOM'));

router.get('/', authorize('categories:read'), cache(120), getCategories);
router.get('/tree', authorize('categories:read'), cache(120), getCategoryTree);
router.get('/:id', authorize('categories:read'), getCategory);
router.post(
  '/',
  authorize('categories:create'),
  validate(createSchema),
  audit('categories', 'create'),
  createCategory
);
router.put(
  '/:id',
  authorize('categories:update'),
  validate(updateSchema),
  audit('categories', 'update'),
  updateCategory
);
router.delete('/:id', authorize('categories:delete'), audit('categories', 'delete'), deleteCategory);

module.exports = router;

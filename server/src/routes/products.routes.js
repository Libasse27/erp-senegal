const express = require('express');
const router = express.Router();

const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { protect } = require('../middlewares/auth');
const tenantMiddleware = require('../middlewares/tenant');
const subscriptionGuard = require('../middlewares/subscriptionGuard');
const { authorize } = require('../middlewares/rbac');
const validate = require('../middlewares/validate');
const { createProduct: createSchema, updateProduct: updateSchema } = require('../validations/product.validation');
const audit = require('../middlewares/audit');

router.use(protect);
router.use(tenantMiddleware);
router.use(subscriptionGuard('STOCK'));

router.get('/', authorize('produits:read'), getProducts);
router.get('/:id', authorize('produits:read'), getProduct);
router.post(
  '/',
  authorize('produits:create'),
  validate(createSchema),
  audit('produits', 'create'),
  createProduct
);
router.put(
  '/:id',
  authorize('produits:update'),
  validate(updateSchema),
  audit('produits', 'update'),
  updateProduct
);
router.delete('/:id', authorize('produits:delete'), audit('produits', 'delete'), deleteProduct);

module.exports = router;

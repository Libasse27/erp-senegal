const express = require('express');
const router = express.Router();

const {
  getWarehouses,
  getWarehouse,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
} = require('../controllers/warehouseController');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');
const validate = require('../middlewares/validate');
const { createWarehouse: createSchema, updateWarehouse: updateSchema } = require('../validations/warehouse.validation');
const audit = require('../middlewares/audit');

// All routes require authentication
router.use(protect);

router.get('/', authorize('depots:read'), getWarehouses);
router.get('/:id', authorize('depots:read'), getWarehouse);
router.post(
  '/',
  authorize('depots:create'),
  validate(createSchema),
  audit('depots', 'create'),
  createWarehouse
);
router.put(
  '/:id',
  authorize('depots:update'),
  validate(updateSchema),
  audit('depots', 'update'),
  updateWarehouse
);
router.delete('/:id', authorize('depots:delete'), audit('depots', 'delete'), deleteWarehouse);

module.exports = router;

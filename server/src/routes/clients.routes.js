const express = require('express');
const router = express.Router();

const {
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  getClientStats,
  updateSegmentation,
} = require('../controllers/clientController');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');
const validate = require('../middlewares/validate');
const { createClient: createClientSchema, updateClient: updateClientSchema } = require('../validations/client.validation');
const audit = require('../middlewares/audit');

// All routes require authentication
router.use(protect);

// Segmentation update (admin/manager)
router.post('/segmentation', authorize('clients:update'), audit('clients', 'update'), updateSegmentation);

// CRUD
router.get('/', authorize('clients:read'), getClients);
router.get('/:id', authorize('clients:read'), getClient);
router.get('/:id/stats', authorize('clients:read'), getClientStats);
router.post(
  '/',
  authorize('clients:create'),
  validate(createClientSchema),
  audit('clients', 'create'),
  createClient
);
router.put(
  '/:id',
  authorize('clients:update'),
  validate(updateClientSchema),
  audit('clients', 'update'),
  updateClient
);
router.delete('/:id', authorize('clients:delete'), audit('clients', 'delete'), deleteClient);

module.exports = router;

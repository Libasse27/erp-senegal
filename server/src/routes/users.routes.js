const express = require('express');
const router = express.Router();

const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getMe,
  updateMe,
} = require('../controllers/userController');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');
const validate = require('../middlewares/validate');
const { createUser: createUserSchema, updateUser: updateUserSchema, updateMe: updateMeSchema } = require('../validations/user.validation');
const audit = require('../middlewares/audit');

// Toutes les routes sont protegees
router.use(protect);

// Routes profil personnel (avant /:id pour eviter conflit)
router.get('/me', getMe);
router.put('/me', validate(updateMeSchema), audit('users', 'update'), updateMe);

// Routes admin
router.get('/', authorize('users:read'), getUsers);
router.get('/:id', authorize('users:read'), getUser);
router.post(
  '/',
  authorize('users:create'),
  validate(createUserSchema),
  audit('users', 'create'),
  createUser
);
router.put(
  '/:id',
  authorize('users:update'),
  validate(updateUserSchema),
  audit('users', 'update'),
  updateUser
);
router.delete('/:id', authorize('users:delete'), audit('users', 'delete'), deleteUser);

module.exports = router;

const express = require('express');
const router = express.Router();

const {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification,
} = require('../controllers/notificationController');
const { protect } = require('../middlewares/auth');
const tenantMiddleware = require('../middlewares/tenant');

router.use(protect);
router.use(tenantMiddleware);

// Routes specifiques avant les routes parametrees
router.get('/unread-count', getUnreadCount);
router.put('/read-all', markAllAsRead);

// CRUD
router.get('/', getMyNotifications);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

module.exports = router;

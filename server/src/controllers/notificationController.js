const Notification = require('../models/Notification');
const { AppError } = require('../middlewares/errorHandler');
const { buildPaginationOptions, buildPaginationResponse } = require('../utils/helpers');

/**
 * @desc    Recuperer les notifications de l'utilisateur connecte (paginee)
 * @route   GET /api/notifications
 * @access  Private
 */
const getMyNotifications = async (req, res, next) => {
  try {
    const { page, limit, skip, sort } = buildPaginationOptions(req.query);

    const filter = { user: req.user._id };

    // Filtre par statut de lecture
    if (req.query.isRead === 'true') {
      filter.isRead = true;
    } else if (req.query.isRead === 'false') {
      filter.isRead = false;
    }

    // Filtre par type
    if (req.query.type && ['info', 'success', 'warning', 'error'].includes(req.query.type)) {
      filter.type = req.query.type;
    }

    const [notifications, total] = await Promise.all([
      Notification.find(filter).sort(sort).skip(skip).limit(limit),
      Notification.countDocuments(filter),
    ]);

    const pagination = buildPaginationResponse(total, page, limit);

    res.json({
      success: true,
      data: notifications,
      meta: pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Marquer une notification comme lue
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!notification) {
      return next(new AppError('Notification non trouvee.', 404));
    }

    notification.isRead = true;
    await notification.save();

    res.json({
      success: true,
      message: 'Notification marquee comme lue',
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Marquer toutes les notifications comme lues
 * @route   PUT /api/notifications/read-all
 * @access  Private
 */
const markAllAsRead = async (req, res, next) => {
  try {
    const result = await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { isRead: true }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} notification(s) marquee(s) comme lue(s)`,
      data: { modifiedCount: result.modifiedCount },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obtenir le nombre de notifications non lues
 * @route   GET /api/notifications/unread-count
 * @access  Private
 */
const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      user: req.user._id,
      isRead: false,
    });

    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Supprimer une notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!notification) {
      return next(new AppError('Notification non trouvee.', 404));
    }

    res.json({
      success: true,
      message: 'Notification supprimee avec succes',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification,
};

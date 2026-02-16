const AuditLog = require('../models/AuditLog');
const { buildPaginationOptions, buildPaginationResponse } = require('../utils/helpers');

/**
 * @desc    Get audit logs with pagination and filters
 * @route   GET /api/admin/audit-logs
 * @access  Private/Admin
 */
const getAuditLogs = async (req, res, next) => {
  try {
    const { page, limit, skip, sort } = buildPaginationOptions(req.query);

    const filter = {};

    // Filter by user
    if (req.query.userId) {
      filter.user = req.query.userId;
    }

    // Filter by action
    if (req.query.action) {
      filter.action = req.query.action;
    }

    // Filter by module
    if (req.query.module) {
      filter.module = req.query.module;
    }

    // Filter by date range
    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};
      if (req.query.startDate) {
        filter.createdAt.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filter.createdAt.$lte = new Date(req.query.endDate);
      }
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('user', 'firstName lastName email')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments(filter),
    ]);

    const pagination = buildPaginationResponse(total, page, limit);

    res.set('X-Total-Count', total);
    res.set('X-Total-Pages', pagination.totalPages);

    res.json({
      success: true,
      data: logs,
      meta: pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single audit log entry
 * @route   GET /api/admin/audit-logs/:id
 * @access  Private/Admin
 */
const getAuditLog = async (req, res, next) => {
  try {
    const log = await AuditLog.findById(req.params.id).populate(
      'user',
      'firstName lastName email'
    );

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Entree de log non trouvee.',
      });
    }

    res.json({
      success: true,
      data: log,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get audit log statistics
 * @route   GET /api/admin/audit-logs/stats
 * @access  Private/Admin
 */
const getAuditStats = async (req, res, next) => {
  try {
    const stats = await AuditLog.aggregate([
      {
        $group: {
          _id: { action: '$action', module: '$module' },
          count: { $sum: 1 },
          lastOccurrence: { $max: '$createdAt' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const totalLogs = await AuditLog.countDocuments();

    res.json({
      success: true,
      data: {
        total: totalLogs,
        byActionAndModule: stats,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAuditLogs,
  getAuditLog,
  getAuditStats,
};

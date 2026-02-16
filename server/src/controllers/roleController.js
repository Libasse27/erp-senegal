const Role = require('../models/Role');
const Permission = require('../models/Permission');
const User = require('../models/User');
const { AppError } = require('../middlewares/errorHandler');
const { buildPaginationOptions, buildPaginationResponse } = require('../utils/helpers');

/**
 * @desc    Get all roles with pagination and filters
 * @route   GET /api/admin/roles
 * @access  Private/Admin
 */
const getRoles = async (req, res, next) => {
  try {
    const { page, limit, skip, sort } = buildPaginationOptions(req.query);

    const filter = {};
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { displayName: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const [roles, total] = await Promise.all([
      Role.find(filter)
        .populate('permissions', 'code module action description')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Role.countDocuments(filter),
    ]);

    const pagination = buildPaginationResponse(total, page, limit);

    res.set('X-Total-Count', total);
    res.set('X-Total-Pages', pagination.totalPages);

    res.json({
      success: true,
      data: roles,
      meta: pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single role by ID
 * @route   GET /api/admin/roles/:id
 * @access  Private/Admin
 */
const getRole = async (req, res, next) => {
  try {
    const role = await Role.findById(req.params.id).populate(
      'permissions',
      'code module action description'
    );

    if (!role) {
      return next(new AppError('Role non trouve.', 404));
    }

    res.json({
      success: true,
      data: role,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new role
 * @route   POST /api/admin/roles
 * @access  Private/Admin
 */
const createRole = async (req, res, next) => {
  try {
    const { name, displayName, description, permissions } = req.body;

    // Check for duplicate role name
    const existingRole = await Role.findOne({ name });
    if (existingRole) {
      return next(new AppError('Un role avec ce nom existe deja.', 400));
    }

    // Validate permission IDs if provided
    if (permissions && permissions.length > 0) {
      const validPermissions = await Permission.countDocuments({
        _id: { $in: permissions },
        isActive: true,
      });
      if (validPermissions !== permissions.length) {
        return next(new AppError('Une ou plusieurs permissions sont invalides.', 400));
      }
    }

    const role = await Role.create({
      name,
      displayName,
      description,
      permissions: permissions || [],
      createdBy: req.user._id,
    });

    const populatedRole = await Role.findById(role._id).populate(
      'permissions',
      'code module action description'
    );

    res.status(201).json({
      success: true,
      message: 'Role cree avec succes',
      data: populatedRole,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update role permissions and details
 * @route   PUT /api/admin/roles/:id
 * @access  Private/Admin
 */
const updateRole = async (req, res, next) => {
  try {
    const role = await Role.findById(req.params.id);

    if (!role) {
      return next(new AppError('Role non trouve.', 404));
    }

    // Prevent modification of system role names
    if (role.isSystem && req.body.name && req.body.name !== role.name) {
      return next(new AppError('Le nom des roles systeme ne peut pas etre modifie.', 400));
    }

    // Save previous data for audit
    req._previousData = role.toObject();

    // Validate permission IDs if provided
    if (req.body.permissions && req.body.permissions.length > 0) {
      const validPermissions = await Permission.countDocuments({
        _id: { $in: req.body.permissions },
        isActive: true,
      });
      if (validPermissions !== req.body.permissions.length) {
        return next(new AppError('Une ou plusieurs permissions sont invalides.', 400));
      }
    }

    const updatedRole = await Role.findByIdAndUpdate(
      req.params.id,
      { ...req.body, modifiedBy: req.user._id },
      { new: true, runValidators: true }
    ).populate('permissions', 'code module action description');

    res.json({
      success: true,
      message: 'Role modifie avec succes',
      data: updatedRole,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete role (soft delete)
 * @route   DELETE /api/admin/roles/:id
 * @access  Private/Admin
 */
const deleteRole = async (req, res, next) => {
  try {
    const role = await Role.findById(req.params.id);

    if (!role) {
      return next(new AppError('Role non trouve.', 404));
    }

    // Prevent deletion of system roles
    if (role.isSystem) {
      return next(new AppError('Les roles systeme ne peuvent pas etre supprimes.', 400));
    }

    // Check if any active users have this role
    const usersWithRole = await User.countDocuments({ role: role._id, isActive: true });
    if (usersWithRole > 0) {
      return next(
        new AppError(
          `Ce role est assigne a ${usersWithRole} utilisateur(s) actif(s). Reassignez-les avant de supprimer.`,
          400
        )
      );
    }

    await role.softDelete(req.user._id);

    res.json({
      success: true,
      message: 'Role supprime avec succes',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all available permissions
 * @route   GET /api/admin/permissions
 * @access  Private/Admin
 */
const getPermissions = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.module) {
      filter.module = req.query.module;
    }

    const permissions = await Permission.find(filter).sort('module action');

    // Group permissions by module for easier consumption
    const grouped = {};
    permissions.forEach((perm) => {
      if (!grouped[perm.module]) {
        grouped[perm.module] = [];
      }
      grouped[perm.module].push(perm);
    });

    res.json({
      success: true,
      data: permissions,
      grouped,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  getPermissions,
};

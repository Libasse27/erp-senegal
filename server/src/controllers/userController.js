const User = require('../models/User');
const { AppError } = require('../middlewares/errorHandler');
const { buildPaginationOptions, buildPaginationResponse } = require('../utils/helpers');

/**
 * @desc    Obtenir la liste des utilisateurs (pagine + filtres)
 * @route   GET /api/users
 * @access  Private/Admin
 */
const getUsers = async (req, res, next) => {
  try {
    const { page, limit, skip, sort } = buildPaginationOptions(req.query);

    // Construire le filtre
    const filter = {};
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }
    if (req.query.role) {
      filter.role = req.query.role;
    }
    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .populate('role', 'name displayName')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    const pagination = buildPaginationResponse(total, page, limit);

    res.set('X-Total-Count', total);
    res.set('X-Total-Pages', pagination.totalPages);

    res.json({
      success: true,
      data: users,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obtenir un utilisateur par ID
 * @route   GET /api/users/:id
 * @access  Private/Admin
 */
const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate({
      path: 'role',
      populate: { path: 'permissions' },
    });

    if (!user) {
      return next(new AppError('Utilisateur non trouve.', 404));
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Creer un utilisateur (admin)
 * @route   POST /api/users
 * @access  Private/Admin
 */
const createUser = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, phone, role, isActive } = req.body;

    // Verifier si l'email existe deja
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('Un utilisateur avec cet email existe deja.', 400));
    }

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      role,
      isActive,
      createdBy: req.user._id,
    });

    user.password = undefined;

    const populatedUser = await User.findById(user._id).populate('role', 'name displayName');

    res.status(201).json({
      success: true,
      message: 'Utilisateur cree avec succes',
      data: populatedUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Modifier un utilisateur
 * @route   PUT /api/users/:id
 * @access  Private/Admin
 */
const updateUser = async (req, res, next) => {
  try {
    // Sauvegarder les anciennes donnees pour l'audit
    const previousUser = await User.findById(req.params.id);
    if (!previousUser) {
      return next(new AppError('Utilisateur non trouve.', 404));
    }

    req._previousData = previousUser.toObject();

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { ...req.body, modifiedBy: req.user._id },
      { new: true, runValidators: true }
    ).populate('role', 'name displayName');

    res.json({
      success: true,
      message: 'Utilisateur modifie avec succes',
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Supprimer un utilisateur (soft delete)
 * @route   DELETE /api/users/:id
 * @access  Private/Admin
 */
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new AppError('Utilisateur non trouve.', 404));
    }

    // Empecher la suppression de son propre compte
    if (user._id.toString() === req.user._id.toString()) {
      return next(new AppError('Vous ne pouvez pas supprimer votre propre compte.', 400));
    }

    await user.softDelete(req.user._id);

    res.json({
      success: true,
      message: 'Utilisateur supprime avec succes',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obtenir le profil connecte
 * @route   GET /api/users/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'role',
      populate: { path: 'permissions' },
    });

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Modifier son propre profil
 * @route   PUT /api/users/me
 * @access  Private
 */
const updateMe = async (req, res, next) => {
  try {
    // Ne pas permettre de changer le role ni le statut via ce endpoint
    delete req.body.role;
    delete req.body.isActive;
    delete req.body.password; // Le mot de passe passe par /me/password

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { ...req.body, modifiedBy: req.user._id },
      { new: true, runValidators: true }
    ).populate('role', 'name displayName');

    res.json({
      success: true,
      message: 'Profil modifie avec succes',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Changer son mot de passe (requiert l'ancien)
 * @route   PUT /api/users/me/password
 * @access  Private
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Charger l'utilisateur avec le mot de passe hashé
    const user = await User.findById(req.user._id).select('+password');

    // Verifier l'ancien mot de passe
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return next(new AppError('Mot de passe actuel incorrect.', 400));
    }

    // Sauvegarder le nouveau mot de passe (pre-save hook hashe automatiquement)
    user.password = newPassword;
    user.modifiedBy = req.user._id;
    await user.save();

    res.json({
      success: true,
      message: 'Mot de passe modifie avec succes',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getMe,
  updateMe,
  changePassword,
};

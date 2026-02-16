const crypto = require('crypto');
const User = require('../models/User');
const { AppError } = require('../middlewares/errorHandler');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
} = require('../services/tokenService');
const { sendResetPasswordEmail } = require('../services/emailService');
const logger = require('../config/logger');

/**
 * @desc    Inscription d'un nouvel utilisateur (admin only)
 * @route   POST /api/auth/register
 * @access  Private/Admin
 */
const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, phone, role } = req.body;

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
      createdBy: req.user ? req.user._id : undefined,
    });

    // Ne pas retourner le mot de passe
    user.password = undefined;

    res.status(201).json({
      success: true,
      message: 'Utilisateur cree avec succes',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Connexion utilisateur
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Trouver l'utilisateur avec le mot de passe
    const user = await User.findOne({ email })
      .select('+password +refreshToken')
      .populate({
        path: 'role',
        populate: { path: 'permissions' },
      });

    if (!user) {
      return next(new AppError('Email ou mot de passe incorrect.', 401));
    }

    if (!user.isActive) {
      return next(new AppError('Votre compte a ete desactive. Contactez un administrateur.', 401));
    }

    // Verifier le mot de passe
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(new AppError('Email ou mot de passe incorrect.', 401));
    }

    // Generer les tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Sauvegarder le refresh token en DB
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Configurer le cookie
    setRefreshTokenCookie(res, refreshToken);

    // Ne pas retourner le mot de passe
    user.password = undefined;
    user.refreshToken = undefined;

    logger.info(`Connexion reussie: ${user.email}`);

    res.json({
      success: true,
      message: 'Connexion reussie',
      data: {
        user,
        accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Rafraichir le token d'acces
 * @route   POST /api/auth/refresh-token
 * @access  Public (avec cookie)
 */
const refreshTokenHandler = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return next(new AppError('Aucun refresh token fourni.', 401));
    }

    // Verifier le refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Trouver l'utilisateur
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken) {
      return next(new AppError('Refresh token invalide.', 401));
    }

    if (!user.isActive) {
      return next(new AppError('Votre compte a ete desactive.', 401));
    }

    // Generer un nouveau access token
    const newAccessToken = generateAccessToken(user._id);

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(new AppError('Refresh token invalide ou expire. Veuillez vous reconnecter.', 401));
    }
    next(error);
  }
};

/**
 * @desc    Deconnexion
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = async (req, res, next) => {
  try {
    // Invalider le refresh token en DB
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });

    // Supprimer le cookie
    clearRefreshTokenCookie(res);

    logger.info(`Deconnexion: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Deconnexion reussie',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mot de passe oublie - envoyer email
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return next(new AppError('Aucun compte associe a cet email.', 404));
    }

    // Generer le token de reset
    const resetToken = user.generateResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Construire l'URL de reset
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    try {
      await sendResetPasswordEmail(user.email, resetUrl, user.fullName);

      res.json({
        success: true,
        message: 'Email de reinitialisation envoye avec succes',
      });
    } catch (emailError) {
      // Annuler le token en cas d'erreur d'envoi
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      logger.error(`Erreur envoi email reset: ${emailError.message}`);
      return next(new AppError("Erreur lors de l'envoi de l'email. Veuillez reessayer.", 500));
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reinitialiser le mot de passe
 * @route   PUT /api/auth/reset-password/:token
 * @access  Public
 */
const resetPassword = async (req, res, next) => {
  try {
    // Hasher le token recu
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    // Trouver l'utilisateur avec le token valide
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return next(new AppError('Token invalide ou expire.', 400));
    }

    // Mettre a jour le mot de passe
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    logger.info(`Mot de passe reinitialise: ${user.email}`);

    res.json({
      success: true,
      message: 'Mot de passe reinitialise avec succes. Vous pouvez maintenant vous connecter.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refreshToken: refreshTokenHandler,
  logout,
  forgotPassword,
  resetPassword,
};

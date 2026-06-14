const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('../models/User');
const Company = require('../models/Company');
const Role = require('../models/Role');
const Forfait = require('../models/Forfait');
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
const { ROLES, SCOPE } = require('../config/constants');

/**
 * @desc    Inscription interne — crée un utilisateur dans une entreprise (admin_entreprise only)
 * @route   POST /api/auth/register
 * @access  Private / admin_entreprise
 */
const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, phone, role } = req.body;

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
      scope: SCOPE.ENTREPRISE,
      companyId: req.companyId || (req.user ? req.user.companyId : undefined),
      createdBy: req.user ? req.user._id : undefined,
    });

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
 * @desc    Inscription publique SaaS — crée l'entreprise + l'admin en transaction atomique
 * @route   POST /api/auth/register-saas
 * @access  Public
 */
const registerSaaS = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      // Createur / futur admin
      firstName, lastName, email, password, phone,
      // Entreprise
      companyName, legalForm, ninea, rccm, sector,
      address, city, companyPhone, companyEmail, website,
      // Forfait choisi
      forfaitCode, periodicite,
    } = req.body;

    // 1. Verifier unicite email
    const existingUser = await User.findOne({ email }).session(session);
    if (existingUser) {
      await session.abortTransaction();
      return next(new AppError('Un compte existe deja avec cet email.', 400));
    }

    // 2. Verifier que le forfait existe
    const forfait = await Forfait.findOne({ code: forfaitCode, actif: true }).session(session);
    if (!forfait) {
      await session.abortTransaction();
      return next(new AppError('Forfait invalide ou inactif.', 400));
    }

    // 3. Recuperer le role admin_entreprise
    const adminRole = await Role.findOne({ name: ROLES.ADMIN }).session(session);
    if (!adminRole) {
      await session.abortTransaction();
      return next(new AppError('Configuration systeme manquante : role admin introuvable.', 500));
    }

    // 4. Creer l'entreprise en attente de paiement
    const [company] = await Company.create(
      [
        {
          name: companyName,
          legalForm: legalForm || undefined,
          ninea: ninea || undefined,
          rccm: rccm || undefined,
          sector: sector || undefined,
          address: {
            street: address || undefined,
            city: city || 'Dakar',
            country: 'Senegal',
          },
          phone: companyPhone || undefined,
          email: companyEmail || email,
          website: website || undefined,
          status: 'pending_payment',
          plan: forfaitCode,
          forfaitId: forfait._id,
          subscriptionStartDate: new Date(),
        },
      ],
      { session }
    );

    // 5. Creer l'utilisateur admin de cette entreprise
    const [user] = await User.create(
      [
        {
          firstName,
          lastName,
          email,
          password,
          phone: phone || undefined,
          role: adminRole._id,
          scope: SCOPE.ENTREPRISE,
          companyId: company._id,
        },
      ],
      { session }
    );

    // 6. Lier l'admin à l'entreprise
    company.adminUser = user._id;
    await company.save({ session });

    await session.commitTransaction();

    // Ne pas renvoyer le mot de passe
    user.password = undefined;

    const montant = periodicite === 'ANNUEL' ? forfait.prixAnnuel : forfait.prixMensuel;

    logger.info(`Inscription SaaS: entreprise="${companyName}" admin="${email}"`);

    res.status(201).json({
      success: true,
      message: 'Compte cree avec succes. Finalisez l\'inscription en effectuant le paiement.',
      data: {
        user,
        company,
        paiement: {
          forfait: { code: forfait.code, nom: forfait.nom },
          periodicite: periodicite || 'MENSUEL',
          montant,
          devise: 'FCFA',
          statut: 'EN_ATTENTE',
        },
      },
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
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

    // Construire le payload JWT enrichi (scope + companyId pour le tenant middleware)
    const tokenPayload = {
      scope: user.scope || SCOPE.ENTREPRISE,
      companyId: user.companyId ? user.companyId.toString() : null,
      roleName: user.role?.name || null,
    };

    const accessToken = generateAccessToken(user._id, tokenPayload);
    const refreshToken = generateRefreshToken(user._id, { scope: tokenPayload.scope });

    // Sauvegarder le refresh token en DB
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    setRefreshTokenCookie(res, refreshToken);

    user.password = undefined;
    user.refreshToken = undefined;

    // Cible de redirection selon le perimetre
    const redirectTo = user.scope === SCOPE.PLATFORM ? '/super-admin' : '/dashboard';

    logger.info(`Connexion reussie: ${user.email} [scope=${tokenPayload.scope}]`);

    res.json({
      success: true,
      message: 'Connexion reussie',
      data: {
        user,
        accessToken,
        redirectTo,
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

    // Trouver l'utilisateur (avec role pour roleName dans le payload)
    const user = await User.findById(decoded.id).select('+refreshToken').populate('role');

    if (!user || user.refreshToken !== refreshToken) {
      return next(new AppError('Refresh token invalide.', 401));
    }

    if (!user.isActive) {
      return next(new AppError('Votre compte a ete desactive.', 401));
    }

    // Regenerer l'access token en preservant scope + companyId (critiques pour platformGuard et tenantMiddleware)
    const newAccessToken = generateAccessToken(user._id, {
      scope: decoded.scope || user.scope || SCOPE.ENTREPRISE,
      companyId: user.companyId ? user.companyId.toString() : null,
      roleName: user.role?.name || null,
    });

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
  registerSaaS,
  login,
  refreshToken: refreshTokenHandler,
  logout,
  forgotPassword,
  resetPassword,
};

const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('../models/User');
const Company = require('../models/Company');
const Role = require('../models/Role');
const Plan = require('../models/Plan');
const { AppError } = require('../middlewares/errorHandler');
const {
  hashToken,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  generateMfaChallengeToken,
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
      // Plan choisi
      planCode, periodicite,
    } = req.body;

    // 1. Verifier unicite email
    const existingUser = await User.findOne({ email }).session(session);
    if (existingUser) {
      await session.abortTransaction();
      return next(new AppError('Un compte existe deja avec cet email.', 400));
    }

    // 2. Verifier que le plan existe et est actif
    const plan = await Plan.findOne({ code: planCode?.toUpperCase(), actif: true }).session(session);
    if (!plan) {
      await session.abortTransaction();
      return next(new AppError('Plan invalide ou inactif.', 400));
    }

    // 3. Recuperer le role admin_entreprise
    const adminRole = await Role.findOne({ name: ROLES.ADMIN }).session(session);
    if (!adminRole) {
      await session.abortTransaction();
      return next(new AppError('Configuration systeme manquante : role admin introuvable.', 500));
    }

    // 4. Statut initial : ESSAI si le plan a un essai gratuit, sinon EN_ATTENTE_PAIEMENT
    const statusInitial = plan.essaiGratuitJours > 0 ? 'ESSAI' : 'EN_ATTENTE_PAIEMENT';

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
          status: statusInitial,
          plan: plan.code,
          planId: plan._id,
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

    // 6. Lier l'admin à l'entreprise + incrémenter usage
    company.adminUser = user._id;
    company.usage = { utilisateurs: 1, stockageMo: 0 };
    await company.save({ session });

    // 7. Si essai gratuit : créer l'abonnement d'essai immédiatement
    if (plan.essaiGratuitJours > 0) {
      const dateFin = new Date();
      dateFin.setDate(dateFin.getDate() + plan.essaiGratuitJours);

      const planSnapshot = {
        code: plan.code, nom: plan.nom,
        tarifs: plan.tarifs, limites: plan.limites,
        modules: plan.modules, features: plan.features,
        version: plan.version, snapshotAt: new Date(),
      };

      const Abonnement = require('../models/Abonnement');
      const [abonnement] = await Abonnement.create(
        [{ entrepriseId: company._id, planId: plan._id, planSnapshot, periodicite: 'MENSUEL',
           dateDebut: new Date(), dateFin, montant: 0, statut: 'ESSAI',
           historique: [{ action: 'creation', nouveauPlan: plan.code, note: 'Essai gratuit' }] }],
        { session }
      );

      company.abonnementActifId = abonnement._id;
      await company.save({ session });
    }

    await session.commitTransaction();

    user.password = undefined;

    const montant = periodicite === 'ANNUEL' ? plan.tarifs.annuel : plan.tarifs.mensuel;

    logger.info(`Inscription SaaS: entreprise="${companyName}" admin="${email}" plan="${plan.code}"`);

    // Email de bienvenue (non bloquant)
    const { sendWelcomeSaasEmail } = require('../services/emailService');
    sendWelcomeSaasEmail(email, {
      firstName:   firstName,
      companyName: companyName,
      forfaitNom:  plan.nom,
      loginUrl:    `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`,
    }).catch((err) => logger.warn(`[Email] Welcome SaaS non envoyé : ${err.message}`));

    res.status(201).json({
      success: true,
      message: plan.essaiGratuitJours > 0
        ? `Essai gratuit de ${plan.essaiGratuitJours} jours activé. Bienvenue !`
        : 'Compte créé. Finalisez l\'inscription en effectuant le paiement.',
      data: {
        user,
        company,
        paiement: plan.essaiGratuitJours > 0 ? null : {
          plan: { code: plan.code, nom: plan.nom },
          periodicite: periodicite || 'MENSUEL',
          montant,
          devise: 'XOF',
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
 * @desc    Connexion utilisateur (avec verrouillage et challenge MFA)
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email })
      .select('+password +refreshToken +refreshTokenHash +tentativesEchouees +verrouilleJusqua +mfaEnabled +mfaSecret')
      .populate({ path: 'role', populate: { path: 'permissions' } });

    // Message générique — pas de divulgation d'existence de compte
    if (!user || !user.isActive) {
      return next(new AppError('Email ou mot de passe incorrect.', 401));
    }

    // Compte verrouillé après trop d'échecs
    if (user.estVerrouille) {
      const minutesRestantes = Math.ceil((user.verrouilleJusqua - Date.now()) / 60000);
      return next(
        new AppError(
          `Compte temporairement verrouillé. Réessayez dans ${minutesRestantes} minute(s).`,
          423
        )
      );
    }

    // Vérifier le mot de passe
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.enregistrerEchecConnexion();
      logger.warn(`Echec connexion: ${email} (tentative ${user.tentativesEchouees + 1})`);
      return next(new AppError('Email ou mot de passe incorrect.', 401));
    }

    // Réinitialiser le compteur d'échecs après succès
    await user.reinitialiserEchecs();

    const tokenPayload = {
      scope:     user.scope || SCOPE.ENTREPRISE,
      companyId: user.companyId ? user.companyId.toString() : null,
      roleName:  user.role?.name || null,
    };

    // ── MFA activé : émettre un challenge token à usage unique ───────────────
    if (user.mfaEnabled) {
      const challengeToken = generateMfaChallengeToken(user._id, tokenPayload);
      logger.info(`MFA challenge emis: ${user.email}`);
      return res.json({
        success: true,
        message: 'Code MFA requis.',
        data: { mfaRequired: true, challengeToken },
      });
    }

    // ── Connexion normale ─────────────────────────────────────────────────────
    const accessToken  = generateAccessToken(user._id, tokenPayload);
    const refreshToken = generateRefreshToken(user._id, { scope: tokenPayload.scope });

    // Stocker le hash — jamais le token en clair
    user.refreshTokenHash = hashToken(refreshToken);
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    setRefreshTokenCookie(res, refreshToken);

    user.password         = undefined;
    user.refreshToken     = undefined;
    user.refreshTokenHash = undefined;

    const redirectTo = user.scope === SCOPE.PLATFORM ? '/super-admin' : '/dashboard';
    logger.info(`Connexion reussie: ${user.email} [scope=${tokenPayload.scope}]`);

    res.json({
      success: true,
      message: 'Connexion reussie',
      data: { user, accessToken, redirectTo },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Rafraîchir le token d'accès avec rotation one-use
 * @route   POST /api/auth/refresh-token
 * @access  Public (cookie httpOnly)
 *
 * Chaque appel invalide l'ancien refresh token et en émet un nouveau.
 * Si le même token est utilisé deux fois → 401 (détection de vol).
 */
const refreshTokenHandler = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return next(new AppError('Aucun refresh token fourni.', 401));
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      return next(new AppError('Refresh token invalide ou expiré. Veuillez vous reconnecter.', 401));
    }

    const user = await User.findById(decoded.id)
      .select('+refreshToken +refreshTokenHash')
      .populate('role');

    if (!user || !user.isActive) {
      return next(new AppError('Refresh token invalide.', 401));
    }

    // Comparer avec le hash stocké (one-use : si hash ne correspond pas → token déjà consommé ou volé)
    const incomingHash = hashToken(refreshToken);
    const storedHash   = user.refreshTokenHash || (user.refreshToken && user.refreshToken.length === 64 ? user.refreshToken : null);

    if (!storedHash || storedHash !== incomingHash) {
      // Token déjà utilisé ou inexistant — révoquer toutes les sessions par précaution
      user.refreshTokenHash = null;
      user.refreshToken     = null;
      await user.save({ validateBeforeSave: false });
      logger.warn(`Refresh token réutilisé ou inconnu pour userId=${user._id} — sessions révoquées`);
      return next(new AppError('Session invalide. Veuillez vous reconnecter.', 401));
    }

    // ── Rotation : générer de nouveaux tokens ─────────────────────────────────
    const tokenPayload = {
      scope:     decoded.scope || user.scope || SCOPE.ENTREPRISE,
      companyId: user.companyId ? user.companyId.toString() : null,
      roleName:  user.role?.name || null,
    };

    const newAccessToken  = generateAccessToken(user._id, tokenPayload);
    const newRefreshToken = generateRefreshToken(user._id, { scope: tokenPayload.scope });

    // Invalider l'ancien et stocker le hash du nouveau
    user.refreshTokenHash = hashToken(newRefreshToken);
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    setRefreshTokenCookie(res, newRefreshToken);

    res.json({
      success: true,
      data: { accessToken: newAccessToken },
    });
  } catch (error) {
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
    // Invalider le refresh token et son hash en DB
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null, refreshTokenHash: null });

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

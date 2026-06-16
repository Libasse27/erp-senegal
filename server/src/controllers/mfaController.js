const crypto = require('crypto');
const User = require('../models/User');
const { AppError } = require('../middlewares/errorHandler');
const { generateSecret, verifyTotp, buildOtpAuthUri } = require('../utils/totp');
const {
  hashToken,
  generateAccessToken,
  generateRefreshToken,
  setRefreshTokenCookie,
  verifyMfaChallengeToken,
} = require('../services/tokenService');
const logger = require('../config/logger');
const { SCOPE } = require('../config/constants');

// ── Helpers ──────────────────────────────────────────────────────────────────

const APP_NAME = process.env.APP_NAME || 'ERP Sénégal';

const requireValidTotp = (code, secret, next) => {
  if (!code || !/^\d{6}$/.test(code)) {
    next(new AppError('Code MFA invalide. Fournissez un code à 6 chiffres.', 400));
    return false;
  }
  if (!verifyTotp(code, secret)) {
    next(new AppError('Code MFA incorrect ou expiré.', 401));
    return false;
  }
  return true;
};

// ── Endpoints ────────────────────────────────────────────────────────────────

/**
 * @desc    Initialiser le setup MFA — génère un secret et retourne l'URI otpauth
 * @route   POST /api/auth/mfa/setup
 * @access  Privé (utilisateur authentifié)
 *
 * L'URI otpauth:// peut être affiché comme QR code côté frontend
 * (ex: avec la lib `qrcode.react` ou `react-qr-code`).
 */
const setupMfa = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+mfaSecret');

    if (user.mfaEnabled) {
      return next(new AppError('MFA est déjà activé sur ce compte.', 409));
    }

    const secret = generateSecret();
    const otpAuthUri = buildOtpAuthUri(secret, user.email, APP_NAME);

    // Stocker le secret (non encore validé) — la validation se fait dans /enable
    user.mfaSecret = secret;
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: 'Scannez ce QR code avec votre application d\'authentification, puis confirmez avec /mfa/enable.',
      data: {
        otpAuthUri,
        secret, // affiché pour saisie manuelle si le QR ne fonctionne pas
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Activer le MFA après vérification du premier code TOTP
 * @route   POST /api/auth/mfa/enable
 * @access  Privé
 * @body    { code: "123456" }
 */
const enableMfa = async (req, res, next) => {
  try {
    const { code } = req.body;
    const user = await User.findById(req.user._id).select('+mfaSecret');

    if (user.mfaEnabled) {
      return next(new AppError('MFA est déjà activé.', 409));
    }
    if (!user.mfaSecret) {
      return next(new AppError('Aucun setup MFA en cours. Appelez /mfa/setup d\'abord.', 400));
    }

    if (!requireValidTotp(code, user.mfaSecret, next)) return;

    user.mfaEnabled = true;
    await user.save({ validateBeforeSave: false });

    logger.info(`MFA activé: ${user.email}`);

    res.json({
      success: true,
      message: 'Authentification à deux facteurs activée avec succès.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Désactiver le MFA après vérification du code TOTP actuel
 * @route   POST /api/auth/mfa/disable
 * @access  Privé
 * @body    { code: "123456" }
 */
const disableMfa = async (req, res, next) => {
  try {
    const { code } = req.body;
    const user = await User.findById(req.user._id).select('+mfaSecret');

    if (!user.mfaEnabled) {
      return next(new AppError('MFA n\'est pas activé sur ce compte.', 400));
    }

    if (!requireValidTotp(code, user.mfaSecret, next)) return;

    user.mfaEnabled = false;
    user.mfaSecret  = undefined;
    await user.save({ validateBeforeSave: false });

    logger.info(`MFA désactivé: ${user.email}`);

    res.json({
      success: true,
      message: 'Authentification à deux facteurs désactivée.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Vérifier le code TOTP dans le flux de connexion (challenge)
 * @route   POST /api/auth/mfa/verify
 * @access  Public (challenge token requis)
 * @body    { code: "123456", challengeToken: "..." }
 *
 * challengeToken = token émis par /login quand mfaEnabled=true.
 * Valide 5 min. Si OK, émet les vrais access + refresh tokens.
 */
const verifyMfa = async (req, res, next) => {
  try {
    const { code, challengeToken } = req.body;

    if (!challengeToken) {
      return next(new AppError('challengeToken manquant.', 400));
    }

    // Vérifier et décoder le challenge token
    let decoded;
    try {
      decoded = verifyMfaChallengeToken(challengeToken);
    } catch {
      return next(new AppError('Challenge MFA invalide ou expiré. Veuillez vous reconnecter.', 401));
    }

    const user = await User.findById(decoded.id)
      .select('+mfaSecret +mfaEnabled')
      .populate({ path: 'role', populate: { path: 'permissions' } });

    if (!user || !user.isActive) {
      return next(new AppError('Utilisateur introuvable ou désactivé.', 401));
    }
    if (!user.mfaEnabled || !user.mfaSecret) {
      return next(new AppError('MFA non configuré pour cet utilisateur.', 400));
    }

    if (!requireValidTotp(code, user.mfaSecret, next)) return;

    // ── Émettre les tokens complets ───────────────────────────────────────────
    const tokenPayload = {
      scope:     decoded.scope || user.scope || SCOPE.ENTREPRISE,
      companyId: decoded.companyId || (user.companyId ? user.companyId.toString() : null),
      roleName:  decoded.roleName  || user.role?.name || null,
    };

    const accessToken  = generateAccessToken(user._id, tokenPayload);
    const refreshToken = generateRefreshToken(user._id, { scope: tokenPayload.scope });

    user.refreshTokenHash = hashToken(refreshToken);
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    setRefreshTokenCookie(res, refreshToken);

    user.mfaSecret = undefined;

    const redirectTo = user.scope === SCOPE.PLATFORM ? '/super-admin' : '/dashboard';
    logger.info(`MFA vérifié — connexion complète: ${user.email}`);

    res.json({
      success: true,
      message: 'Authentification MFA réussie.',
      data: { user, accessToken, redirectTo },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { setupMfa, enableMfa, disableMfa, verifyMfa };

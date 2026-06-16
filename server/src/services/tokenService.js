const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

/**
 * Hash un token pour stockage sécurisé en DB (jamais de plaintext).
 * @param {string} token
 * @returns {string} sha256 hex
 */
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

/**
 * Generer un access token JWT
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} extraPayload - Donnees supplementaires (scope, companyId, roleName)
 * @returns {string} Access token
 */
const generateAccessToken = (userId, extraPayload = {}) => {
  return jwt.sign(
    { id: userId, ...extraPayload },
    jwtConfig.accessToken.secret,
    { expiresIn: jwtConfig.accessToken.expire }
  );
};

/**
 * Generer un refresh token JWT
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} extraPayload - Donnees supplementaires
 * @returns {string} Refresh token
 */
const generateRefreshToken = (userId, extraPayload = {}) => {
  return jwt.sign(
    { id: userId, ...extraPayload },
    jwtConfig.refreshToken.secret,
    { expiresIn: jwtConfig.refreshToken.expire }
  );
};

/**
 * Verifier un access token JWT
 * @param {string} token - Token a verifier
 * @returns {Object} Payload decode
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, jwtConfig.accessToken.secret);
};

/**
 * Verifier un refresh token JWT
 * @param {string} token - Token a verifier
 * @returns {Object} Payload decode
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, jwtConfig.refreshToken.secret);
};

/**
 * Configurer le cookie httpOnly pour le refresh token
 * @param {Object} res - Objet response Express
 * @param {string} refreshToken - Refresh token
 */
const setRefreshTokenCookie = (res, refreshToken) => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: jwtConfig.cookie.httpOnly,
    secure: jwtConfig.cookie.secure,
    sameSite: jwtConfig.cookie.sameSite,
    path: '/',
    maxAge: jwtConfig.cookie.expire * 24 * 60 * 60 * 1000, // jours -> ms
  });
};

/**
 * Supprimer le cookie du refresh token
 * @param {Object} res - Objet response Express
 */
const clearRefreshTokenCookie = (res) => {
  res.cookie('refreshToken', '', {
    httpOnly: true,
    path: '/',
    expires: new Date(0),
  });
};

/**
 * Génère un token de challenge MFA (5 min) — ne donne accès à rien sauf /auth/mfa/verify.
 * @param {string} userId
 * @param {Object} payload — scope, companyId, roleName (seront recopiés dans le vrai access token)
 * @returns {string}
 */
const generateMfaChallengeToken = (userId, payload = {}) => {
  return jwt.sign(
    { id: userId, mfaChallenge: true, ...payload },
    jwtConfig.accessToken.secret,
    { expiresIn: '5m' }
  );
};

/**
 * Vérifie un token de challenge MFA et s'assure qu'il porte bien le flag mfaChallenge.
 * @param {string} token
 * @returns {Object} payload décodé
 * @throws {Error} si invalide / expiré / mauvais type
 */
const verifyMfaChallengeToken = (token) => {
  const decoded = jwt.verify(token, jwtConfig.accessToken.secret);
  if (!decoded.mfaChallenge) {
    const err = new Error('Token de challenge MFA invalide.');
    err.name = 'JsonWebTokenError';
    throw err;
  }
  return decoded;
};

module.exports = {
  hashToken,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  generateMfaChallengeToken,
  verifyMfaChallengeToken,
};

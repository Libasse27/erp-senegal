const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

/**
 * Generer un access token JWT
 * @param {string} userId - ID de l'utilisateur
 * @returns {string} Access token
 */
const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, jwtConfig.accessToken.secret, {
    expiresIn: jwtConfig.accessToken.expire,
  });
};

/**
 * Generer un refresh token JWT
 * @param {string} userId - ID de l'utilisateur
 * @returns {string} Refresh token
 */
const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, jwtConfig.refreshToken.secret, {
    expiresIn: jwtConfig.refreshToken.expire,
  });
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
    expires: new Date(0),
  });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
};

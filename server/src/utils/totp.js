/**
 * TOTP — RFC 6238 (Time-based One-Time Password)
 * Implémenté avec Node.js crypto natif. Aucune dépendance externe.
 *
 * Compatible Google Authenticator, Authy, Microsoft Authenticator.
 */

const crypto = require('crypto');

// ── Base32 ──────────────────────────────────────────────────────────────────

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

const base32Encode = (buf) => {
  let bits = 0;
  let value = 0;
  let output = '';
  for (let i = 0; i < buf.length; i++) {
    value = (value << 8) | buf[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_CHARS[(value << (5 - bits)) & 31];
  }
  return output;
};

const base32Decode = (str) => {
  const s = str.replace(/=+$/, '').toUpperCase();
  const buf = Buffer.alloc(Math.floor((s.length * 5) / 8));
  let bits = 0;
  let value = 0;
  let idx = 0;
  for (let i = 0; i < s.length; i++) {
    const charVal = BASE32_CHARS.indexOf(s[i]);
    if (charVal === -1) throw new Error(`Caractère base32 invalide : ${s[i]}`);
    value = (value << 5) | charVal;
    bits += 5;
    if (bits >= 8) {
      buf[idx++] = (value >>> (bits - 8)) & 255;
      bits -= 8;
    }
  }
  return buf;
};

// ── HOTP (RFC 4226) ─────────────────────────────────────────────────────────

const hotp = (secretBase32, counter) => {
  const key = base32Decode(secretBase32);
  // Counter en buffer 8 octets big-endian
  const buf = Buffer.alloc(8);
  let c = counter;
  for (let i = 7; i >= 0; i--) {
    buf[i] = c & 0xff;
    c = Math.floor(c / 256);
  }
  const hmac = crypto.createHmac('sha1', key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = ((hmac[offset] & 0x7f) << 24) |
               ((hmac[offset + 1] & 0xff) << 16) |
               ((hmac[offset + 2] & 0xff) << 8) |
               (hmac[offset + 3] & 0xff);
  return String(code % 1_000_000).padStart(6, '0');
};

// ── TOTP (RFC 6238) ─────────────────────────────────────────────────────────

const STEP = 30; // secondes

/**
 * Génère le code TOTP actuel pour un secret donné.
 * @param {string} secretBase32 — secret encodé en base32
 * @param {number} [drift=0]    — décalage de fenêtre (−1 = période précédente, +1 = suivante)
 */
const generateTotp = (secretBase32, drift = 0) => {
  const counter = Math.floor(Date.now() / 1000 / STEP) + drift;
  return hotp(secretBase32, counter);
};

/**
 * Vérifie un code TOTP soumis par l'utilisateur.
 * Accepte la fenêtre courante ± 1 (90 s de tolérance horaire).
 * @param {string} token        — code à 6 chiffres soumis
 * @param {string} secretBase32 — secret de l'utilisateur
 * @returns {boolean}
 */
const verifyTotp = (token, secretBase32) => {
  for (const drift of [-1, 0, 1]) {
    if (crypto.timingSafeEqual(
      Buffer.from(generateTotp(secretBase32, drift)),
      Buffer.from(String(token).padStart(6, '0'))
    )) return true;
  }
  return false;
};

/**
 * Génère un nouveau secret aléatoire (20 octets → base32).
 * @returns {string} secret base32 (160 bits)
 */
const generateSecret = () => base32Encode(crypto.randomBytes(20));

/**
 * Construit l'URI otpauth:// pour afficher un QR code dans l'appli frontend.
 * @param {string} secret       — secret base32
 * @param {string} email        — email de l'utilisateur (label du compte)
 * @param {string} [issuer]     — nom de l'application
 * @returns {string} URI otpauth://totp/...
 */
const buildOtpAuthUri = (secret, email, issuer = 'ERP Sénégal') => {
  const label = encodeURIComponent(`${issuer}:${email}`);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
};

module.exports = { generateSecret, generateTotp, verifyTotp, buildOtpAuthUri };

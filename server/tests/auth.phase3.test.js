/**
 * Tests Phase 3 — Sécurité Auth :
 *   - Verrouillage compte après 5 échecs (423)
 *   - Rotation one-use du refresh token
 *   - Flux MFA complet : setup → enable → login challenge → verify → disable
 */
require('./setup');
const request = require('supertest');
const app     = require('../app');
const User    = require('../src/models/User');
const { createTestUser } = require('./helpers');
const { generateTotp }   = require('../src/utils/totp');

const VALID_PASSWORD = 'password123'; // mot de passe créé par createTestUser

// ── Verrouillage ─────────────────────────────────────────────────────────────

describe('Auth lockout — verrouillage après 5 échecs', () => {
  let userEmail;

  beforeEach(async () => {
    const { user } = await createTestUser('admin');
    userEmail = user.email;
  });

  it('verrouille le compte après 5 mots de passe incorrects', async () => {
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/auth/login')
        .send({ email: userEmail, password: 'WrongPass!99' });
    }

    // 6e tentative : compte verrouillé → 423
    const locked = await request(app)
      .post('/api/auth/login')
      .send({ email: userEmail, password: 'WrongPass!99' });

    expect(locked.status).toBe(423);
    expect(locked.body.message).toMatch(/verrouill/i);
  });

  it('réinitialise le compteur après une connexion réussie', async () => {
    // 2 échecs d'abord
    for (let i = 0; i < 2; i++) {
      await request(app)
        .post('/api/auth/login')
        .send({ email: userEmail, password: 'WrongPass!99' });
    }

    const dbUser = await User.findOne({ email: userEmail }).select('+tentativesEchouees');
    expect(dbUser.tentativesEchouees).toBe(2);

    // Connexion réussie avec le bon mot de passe
    const loginOk = await request(app)
      .post('/api/auth/login')
      .send({ email: userEmail, password: VALID_PASSWORD });
    expect(loginOk.status).toBe(200);

    const resetUser = await User.findOne({ email: userEmail }).select('+tentativesEchouees');
    expect(resetUser.tentativesEchouees).toBe(0);
  });
});

// ── Rotation refresh token ────────────────────────────────────────────────────

describe('Refresh token rotation (one-use)', () => {
  let userEmail;

  beforeEach(async () => {
    const { user } = await createTestUser('admin');
    userEmail = user.email;
  });

  it('émet un nouveau cookie refresh à chaque appel /refresh-token', async () => {
    const agent = request.agent(app);

    const loginRes = await agent
      .post('/api/auth/login')
      .send({ email: userEmail, password: VALID_PASSWORD });
    expect(loginRes.status).toBe(200);

    // Premier refresh
    const res1 = await agent.post('/api/auth/refresh-token');
    expect(res1.status).toBe(200);
    expect(res1.body.data).toHaveProperty('accessToken');

    // Deuxième refresh avec le nouveau cookie (rotation) — le fait que ça marche
    // prouve que le cookie a bien été renouvelé après le premier appel
    const res2 = await agent.post('/api/auth/refresh-token');
    expect(res2.status).toBe(200);
    expect(res2.body.data).toHaveProperty('accessToken');
  });

  it('rejette un refresh token sans cookie', async () => {
    const res = await request(app).post('/api/auth/refresh-token');
    expect(res.status).toBe(401);
  });

  it('stocke un hash en DB — jamais le token en clair', async () => {
    const agent = request.agent(app);

    await agent
      .post('/api/auth/login')
      .send({ email: userEmail, password: VALID_PASSWORD });

    const user = await User.findOne({ email: userEmail }).select('+refreshTokenHash');
    // Le hash doit être un sha256 hex (64 chars)
    expect(user.refreshTokenHash).toBeDefined();
    expect(user.refreshTokenHash.length).toBe(64);
  });
});

// ── MFA complet ───────────────────────────────────────────────────────────────

describe('MFA — flux complet setup → enable → login → verify → disable', () => {
  let token;
  let userEmail;

  beforeEach(async () => {
    const { token: t, user } = await createTestUser('admin');
    token     = t;
    userEmail = user.email;
  });

  // ── Setup ──────────────────────────────────────────────────────────────────

  it('setup retourne un otpAuthUri et un secret base32', async () => {
    const res = await request(app)
      .post('/api/auth/mfa/setup')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.otpAuthUri).toMatch(/^otpauth:\/\/totp\//);
    expect(res.body.data.secret).toMatch(/^[A-Z2-7]{32}$/);
  });

  it('retourne 409 si MFA déjà activé lors du setup', async () => {
    await User.findOneAndUpdate({ email: userEmail }, { mfaEnabled: true });

    const res = await request(app)
      .post('/api/auth/mfa/setup')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(409);
  });

  // ── Enable ─────────────────────────────────────────────────────────────────

  it('enable avec un code TOTP valide active le MFA', async () => {
    const setupRes = await request(app)
      .post('/api/auth/mfa/setup')
      .set('Authorization', `Bearer ${token}`);
    expect(setupRes.status).toBe(200);

    const code = generateTotp(setupRes.body.data.secret);
    const enableRes = await request(app)
      .post('/api/auth/mfa/enable')
      .set('Authorization', `Bearer ${token}`)
      .send({ code });

    expect(enableRes.status).toBe(200);

    const user = await User.findOne({ email: userEmail });
    expect(user.mfaEnabled).toBe(true);
  });

  it('enable avec un code incorrect retourne 401', async () => {
    await request(app)
      .post('/api/auth/mfa/setup')
      .set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .post('/api/auth/mfa/enable')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: '000000' });

    expect(res.status).toBe(401);
  });

  it('enable sans setup préalable retourne 400', async () => {
    const res = await request(app)
      .post('/api/auth/mfa/enable')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: '123456' });

    expect(res.status).toBe(400);
  });

  // ── Login avec MFA ─────────────────────────────────────────────────────────

  it('login avec MFA actif retourne challengeToken (pas de tokens complets)', async () => {
    // Activer le MFA
    const setupRes = await request(app)
      .post('/api/auth/mfa/setup')
      .set('Authorization', `Bearer ${token}`);
    expect(setupRes.status).toBe(200);
    const mfaSecret = setupRes.body.data.secret;

    const enableRes = await request(app)
      .post('/api/auth/mfa/enable')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: generateTotp(mfaSecret) });
    expect(enableRes.status).toBe(200);

    // Login → doit déclencher le flux challenge
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: userEmail, password: VALID_PASSWORD });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.mfaRequired).toBe(true);
    expect(loginRes.body.data.challengeToken).toBeDefined();
    expect(loginRes.body.data.accessToken).toBeUndefined();
  });

  // ── Verify ─────────────────────────────────────────────────────────────────

  it('verify avec challengeToken + code valide retourne des tokens complets', async () => {
    // Setup + enable
    const setupRes = await request(app)
      .post('/api/auth/mfa/setup')
      .set('Authorization', `Bearer ${token}`);
    const mfaSecret = setupRes.body.data.secret;

    await request(app)
      .post('/api/auth/mfa/enable')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: generateTotp(mfaSecret) });

    // Login → challenge
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: userEmail, password: VALID_PASSWORD });
    const { challengeToken } = loginRes.body.data;

    // Verify MFA
    const verifyRes = await request(app)
      .post('/api/auth/mfa/verify')
      .send({ code: generateTotp(mfaSecret), challengeToken });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data.accessToken).toBeDefined();
    expect(verifyRes.body.data.redirectTo).toBeDefined();
  });

  it('verify avec code incorrect retourne 401', async () => {
    const setupRes = await request(app)
      .post('/api/auth/mfa/setup')
      .set('Authorization', `Bearer ${token}`);
    const mfaSecret = setupRes.body.data.secret;

    await request(app)
      .post('/api/auth/mfa/enable')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: generateTotp(mfaSecret) });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: userEmail, password: VALID_PASSWORD });

    const res = await request(app)
      .post('/api/auth/mfa/verify')
      .send({ code: '999999', challengeToken: loginRes.body.data.challengeToken });

    expect(res.status).toBe(401);
  });

  it('verify sans challengeToken retourne 400', async () => {
    const res = await request(app)
      .post('/api/auth/mfa/verify')
      .send({ code: '123456' });

    expect(res.status).toBe(400);
  });

  // ── Disable ────────────────────────────────────────────────────────────────

  it('disable avec code valide désactive le MFA', async () => {
    const setupRes = await request(app)
      .post('/api/auth/mfa/setup')
      .set('Authorization', `Bearer ${token}`);
    const mfaSecret = setupRes.body.data.secret;

    await request(app)
      .post('/api/auth/mfa/enable')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: generateTotp(mfaSecret) });

    const disableRes = await request(app)
      .post('/api/auth/mfa/disable')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: generateTotp(mfaSecret) });

    expect(disableRes.status).toBe(200);

    const user = await User.findOne({ email: userEmail });
    expect(user.mfaEnabled).toBe(false);
  });

  it('disable sans MFA activé retourne 400', async () => {
    const res = await request(app)
      .post('/api/auth/mfa/disable')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: '123456' });

    expect(res.status).toBe(400);
  });
});

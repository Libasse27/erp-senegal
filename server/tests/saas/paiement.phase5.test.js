/**
 * Tests Phase 5 — Provisioning post-paiement + Coupon + Invoice + Transaction
 *
 * Couvre :
 *   - Invoice créée après confirmation de paiement
 *   - Transaction enregistrée après confirmation
 *   - Coupon POURCENTAGE / MONTANT_FIXE appliqué à initierPaiement
 *   - Coupon invalide / expiré / usages max → 400
 *   - Provisioning Settings auto pour une nouvelle company
 *   - validerCoupon (route pré-vérification)
 *   - CRUD Coupons Super Admin
 */
require('../setup');
const request  = require('supertest');
const jwt      = require('jsonwebtoken');
const app      = require('../../app');
const {
  createTestCompany,
  createTestSettings,
  createTestAbonnement,
  createSaasUser,
  createTestUser,
} = require('../helpers');
const Plan        = require('../../src/models/Plan');
const Coupon      = require('../../src/models/Coupon');
const PaiementSaaS = require('../../src/models/PaiementSaaS');
const Invoice     = require('../../src/models/Invoice');
const Transaction = require('../../src/models/Transaction');
const Settings    = require('../../src/models/Settings');
const User        = require('../../src/models/User');
const Role        = require('../../src/models/Role');
const Company     = require('../../src/models/Company');

// ── Helper super admin ────────────────────────────────────────────────────────

const createSuperAdmin = async () => {
  let role = await Role.findOne({ name: 'super_admin' });
  if (!role) {
    role = await Role.create({
      name: 'super_admin', displayName: 'Super Admin',
      description: 'Platform administrator', permissions: [], isSystem: true,
    });
  }
  const user = await User.create({
    firstName: 'Super', lastName: 'Admin',
    email: `sa-p5-${Date.now()}@test.sn`,
    password: 'password123', phone: '+221770000000',
    role: role._id, scope: 'PLATFORM', companyId: null, isActive: true,
  });
  const token = jwt.sign(
    { id: user._id, scope: 'PLATFORM', companyId: null },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
  return { user, token };
};

// ── Helper : setup complet paiement ──────────────────────────────────────────

const setupPaiement = async (opts = {}) => {
  const company = await createTestCompany({ name: opts.companyName || 'Acme SA', status: 'EN_ATTENTE_PAIEMENT' });
  const plan    = await Plan.create({
    code: `PL${Date.now() % 10000000}`, nom: 'Plan Test',
    tarifs: { mensuel: opts.montant || 15000, annuel: 150000 }, modules: ['GESCOM', 'FACTURATION', 'STOCK', 'COMPTABILITE', 'VENTES'],
  });
  const abo = await createTestAbonnement(company._id, plan._id, {
    statut: 'EN_ATTENTE', montant: opts.montant || 15000,
    dateDebut: new Date(), dateFin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });
  await Company.findByIdAndUpdate(company._id, { planId: plan._id });
  const { user, token } = await createSaasUser(company._id, 'admin', { email: `admin-p5-${Date.now()}@test.sn` });
  return { company, plan, abo, user, token };
};

// ─────────────────────────────────────────────────────────────────────────────
// Invoice + Transaction après paiement
// ─────────────────────────────────────────────────────────────────────────────

describe('Invoice + Transaction après paiement confirmé', () => {
  it('crée une Invoice et une Transaction lors de la confirmation simulée', async () => {
    const { company, abo, token } = await setupPaiement();

    // Initier
    const initRes = await request(app)
      .post('/api/paiements-saas/initier')
      .set('Authorization', `Bearer ${token}`)
      .send({ abonnementId: abo._id, methode: 'WAVE' });
    expect(initRes.status).toBe(201);

    const { reference } = initRes.body.data;

    // Confirmer la simulation → déclenche activerAbonnement
    const confRes = await request(app)
      .post('/api/paiements-saas/confirmer-simulation')
      .set('Authorization', `Bearer ${token}`)
      .send({ reference, statut: 'REUSSI' });
    expect(confRes.status).toBe(200);

    // Laisser setImmediate se terminer
    await new Promise((r) => setImmediate(r));

    // Invoice créée
    const invoice = await Invoice.findOne({ entrepriseId: company._id });
    expect(invoice).not.toBeNull();
    expect(invoice.statut).toBe('PAYEE');
    expect(invoice.numero).toMatch(/^INV-\d{4}-\d{5}$/);
    expect(invoice.totalTTC).toBe(15000);

    // Transaction créée
    const transaction = await Transaction.findOne({ entrepriseId: company._id });
    expect(transaction).not.toBeNull();
    expect(transaction.type).toBe('PAIEMENT');
    expect(transaction.statut).toBe('COMPLETE');
    expect(transaction.montant).toBe(15000);
  });

  it('les numéros de facture sont uniques et séquentiels', async () => {
    const { abo: abo1, token: t1, company: c1 } = await setupPaiement({ companyName: 'Seq1' });
    const { abo: abo2, token: t2, company: c2 } = await setupPaiement({ companyName: 'Seq2' });

    for (const [abo, token] of [[abo1, t1], [abo2, t2]]) {
      const init = await request(app)
        .post('/api/paiements-saas/initier')
        .set('Authorization', `Bearer ${token}`)
        .send({ abonnementId: abo._id, methode: 'ORANGE_MONEY' });
      await request(app)
        .post('/api/paiements-saas/confirmer-simulation')
        .set('Authorization', `Bearer ${token}`)
        .send({ reference: init.body.data.reference, statut: 'REUSSI' });
    }

    await new Promise((r) => setImmediate(r));

    const inv1 = await Invoice.findOne({ entrepriseId: c1._id });
    const inv2 = await Invoice.findOne({ entrepriseId: c2._id });
    expect(inv1.numero).not.toBe(inv2.numero);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Provisioning Settings
// ─────────────────────────────────────────────────────────────────────────────

describe('Provisioning Settings post-activation', () => {
  it('crée les Settings pour une company qui n\'en a pas encore', async () => {
    const { company, abo, token } = await setupPaiement({ companyName: 'NoSettings SA' });
    // NE PAS créer de Settings → on teste que le provisioning les crée

    const init = await request(app)
      .post('/api/paiements-saas/initier')
      .set('Authorization', `Bearer ${token}`)
      .send({ abonnementId: abo._id, methode: 'WAVE' });

    await request(app)
      .post('/api/paiements-saas/confirmer-simulation')
      .set('Authorization', `Bearer ${token}`)
      .send({ reference: init.body.data.reference, statut: 'REUSSI' });

    // Attendre que setImmediate provisionnerNouvelleCompany s'exécute
    await new Promise((r) => setTimeout(r, 200));

    const settings = await Settings.findOne({ companyId: company._id });
    expect(settings).not.toBeNull();
    expect(settings.isActive).toBe(true);
    expect(settings.numbering).toBeDefined();
  });

  it('ne recrée pas les Settings si ils existent déjà (idempotent)', async () => {
    const { company, abo, token } = await setupPaiement({ companyName: 'HasSettings SA' });
    await createTestSettings(company._id);

    const init = await request(app)
      .post('/api/paiements-saas/initier')
      .set('Authorization', `Bearer ${token}`)
      .send({ abonnementId: abo._id, methode: 'WAVE' });

    await request(app)
      .post('/api/paiements-saas/confirmer-simulation')
      .set('Authorization', `Bearer ${token}`)
      .send({ reference: init.body.data.reference, statut: 'REUSSI' });

    await new Promise((r) => setTimeout(r, 200));

    const count = await Settings.countDocuments({ companyId: company._id });
    expect(count).toBe(1); // pas de doublon
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Coupon — route valider-coupon
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/paiements-saas/valider-coupon', () => {
  let adminToken;

  beforeEach(async () => {
    const { token } = await createTestUser('admin');
    adminToken = token;
    await Coupon.create({
      code: 'PROMO20', type: 'POURCENTAGE', valeur: 20, actif: true,
    });
  });

  it('retourne la remise calculée pour un coupon valide', async () => {
    const res = await request(app)
      .post('/api/paiements-saas/valider-coupon')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: 'PROMO20', montant: 15000 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.remise).toBe(3000);           // 20% de 15000
    expect(res.body.data.montantApresRemise).toBe(12000);
  });

  it('retourne success:false pour un code inexistant', async () => {
    const res = await request(app)
      .post('/api/paiements-saas/valider-coupon')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: 'BIDON999', montant: 15000 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Coupon — application dans initierPaiement
// ─────────────────────────────────────────────────────────────────────────────

describe('Coupon appliqué dans initierPaiement', () => {
  it('POURCENTAGE : réduit le montant du paiement', async () => {
    await Coupon.create({ code: 'PCT30', type: 'POURCENTAGE', valeur: 30, actif: true });
    const { abo, token } = await setupPaiement({ montant: 20000 });

    const res = await request(app)
      .post('/api/paiements-saas/initier')
      .set('Authorization', `Bearer ${token}`)
      .send({ abonnementId: abo._id, methode: 'WAVE', couponCode: 'PCT30' });

    expect(res.status).toBe(201);
    expect(res.body.data.couponApplique).toBe(true);
    expect(res.body.data.montantRemise).toBe(6000);        // 30% de 20000
    expect(res.body.data.montant).toBe(14000);             // 20000 - 6000
    expect(res.body.data.montantOriginal).toBe(20000);

    // Vérifier en DB
    const paiement = await PaiementSaaS.findOne({ reference: res.body.data.reference });
    expect(paiement.montant).toBe(14000);
    expect(paiement.montantRemise).toBe(6000);
  });

  it('MONTANT_FIXE : réduit le montant d\'une valeur fixe', async () => {
    await Coupon.create({ code: 'FIX5000', type: 'MONTANT_FIXE', valeur: 5000, actif: true });
    const { abo, token } = await setupPaiement({ montant: 15000 });

    const res = await request(app)
      .post('/api/paiements-saas/initier')
      .set('Authorization', `Bearer ${token}`)
      .send({ abonnementId: abo._id, methode: 'ORANGE_MONEY', couponCode: 'FIX5000' });

    expect(res.status).toBe(201);
    expect(res.body.data.montant).toBe(10000);
    expect(res.body.data.montantRemise).toBe(5000);
  });

  it('coupon expiré → 400', async () => {
    await Coupon.create({
      code: 'EXPIRED', type: 'POURCENTAGE', valeur: 10, actif: true,
      dateExpiration: new Date(Date.now() - 86400000), // hier
    });
    const { abo, token } = await setupPaiement();

    const res = await request(app)
      .post('/api/paiements-saas/initier')
      .set('Authorization', `Bearer ${token}`)
      .send({ abonnementId: abo._id, methode: 'WAVE', couponCode: 'EXPIRED' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid|expiré|invalide/i);
  });

  it('coupon avec usages max atteint → 400', async () => {
    await Coupon.create({
      code: 'MAXUSED', type: 'POURCENTAGE', valeur: 15, actif: true,
      usagesMax: 2, usagesActuels: 2,
    });
    const { abo, token } = await setupPaiement();

    const res = await request(app)
      .post('/api/paiements-saas/initier')
      .set('Authorization', `Bearer ${token}`)
      .send({ abonnementId: abo._id, methode: 'WAVE', couponCode: 'MAXUSED' });

    expect(res.status).toBe(400);
  });

  it('coupon inactif → 400', async () => {
    await Coupon.create({ code: 'INACTIF', type: 'POURCENTAGE', valeur: 10, actif: false });
    const { abo, token } = await setupPaiement();

    const res = await request(app)
      .post('/api/paiements-saas/initier')
      .set('Authorization', `Bearer ${token}`)
      .send({ abonnementId: abo._id, methode: 'WAVE', couponCode: 'INACTIF' });

    expect(res.status).toBe(400);
  });

  it('code coupon inexistant → 400', async () => {
    const { abo, token } = await setupPaiement();

    const res = await request(app)
      .post('/api/paiements-saas/initier')
      .set('Authorization', `Bearer ${token}`)
      .send({ abonnementId: abo._id, methode: 'WAVE', couponCode: 'INEXISTANT' });

    expect(res.status).toBe(400);
  });

  it('sans couponCode → paiement normal sans remise', async () => {
    const { abo, token } = await setupPaiement({ montant: 15000 });

    const res = await request(app)
      .post('/api/paiements-saas/initier')
      .set('Authorization', `Bearer ${token}`)
      .send({ abonnementId: abo._id, methode: 'WAVE' });

    expect(res.status).toBe(201);
    expect(res.body.data.montant).toBe(15000);
    expect(res.body.data.couponApplique).toBe(false);
    expect(res.body.data.montantRemise).toBe(0);
  });

  it('incrémente usagesActuels du coupon après utilisation', async () => {
    await Coupon.create({ code: 'COUNTER', type: 'POURCENTAGE', valeur: 10, actif: true, usagesMax: 5 });
    const { abo, token } = await setupPaiement();

    await request(app)
      .post('/api/paiements-saas/initier')
      .set('Authorization', `Bearer ${token}`)
      .send({ abonnementId: abo._id, methode: 'WAVE', couponCode: 'COUNTER' });

    const coupon = await Coupon.findOne({ code: 'COUNTER' });
    expect(coupon.usagesActuels).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CRUD Coupons Super Admin
// ─────────────────────────────────────────────────────────────────────────────

describe('Super Admin — CRUD /api/super-admin/coupons', () => {
  let saToken;

  beforeEach(async () => {
    const { token } = await createSuperAdmin();
    saToken = token;
  });

  it('crée un coupon', async () => {
    const res = await request(app)
      .post('/api/super-admin/coupons')
      .set('Authorization', `Bearer ${saToken}`)
      .send({ code: `CP${Date.now() % 100000}`, type: 'POURCENTAGE', valeur: 25 });

    expect(res.status).toBe(201);
    expect(res.body.data.type).toBe('POURCENTAGE');
    expect(res.body.data.valeur).toBe(25);
  });

  it('liste les coupons', async () => {
    await Coupon.create({ code: `LIST${Date.now() % 10000}`, type: 'MONTANT_FIXE', valeur: 2000, actif: true });

    const res = await request(app)
      .get('/api/super-admin/coupons')
      .set('Authorization', `Bearer ${saToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('met à jour un coupon (description + dateExpiration)', async () => {
    const coupon = await Coupon.create({ code: `UPD${Date.now() % 10000}`, type: 'POURCENTAGE', valeur: 10, actif: true });

    const res = await request(app)
      .put(`/api/super-admin/coupons/${coupon._id}`)
      .set('Authorization', `Bearer ${saToken}`)
      .send({ description: 'Promo spéciale', dateExpiration: '2027-12-31' });

    expect(res.status).toBe(200);
    expect(res.body.data.description).toBe('Promo spéciale');
  });

  it('désactive un coupon (soft delete)', async () => {
    const coupon = await Coupon.create({ code: `DEL${Date.now() % 10000}`, type: 'POURCENTAGE', valeur: 5, actif: true });

    const res = await request(app)
      .delete(`/api/super-admin/coupons/${coupon._id}`)
      .set('Authorization', `Bearer ${saToken}`);

    expect(res.status).toBe(200);
    const dbCoupon = await Coupon.findById(coupon._id);
    expect(dbCoupon.actif).toBe(false);
  });

  it('retourne 400 si type manquant à la création', async () => {
    const res = await request(app)
      .post('/api/super-admin/coupons')
      .set('Authorization', `Bearer ${saToken}`)
      .send({ code: 'INCOMPLETE', valeur: 10 });

    expect(res.status).toBe(400);
  });
});

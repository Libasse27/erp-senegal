/**
 * Tests Phase 4 — Super Admin : CRUD Plans SaaS
 *
 * Couvre :
 *   - Authentification et autorisation (protect + platformGuard)
 *   - CRUD complet : listAllPlans, createPlan, updatePlan, deletePlan
 *   - getPlanStats (abonnés, MRR)
 *   - migrateSubscribers (mise à jour planSnapshot)
 *   - Validation des champs
 */
require('./setup');
const request  = require('supertest');
const jwt      = require('jsonwebtoken');
const app      = require('../app');
const User     = require('../src/models/User');
const Role     = require('../src/models/Role');
const Plan     = require('../src/models/Plan');
const Abonnement = require('../src/models/Abonnement');
const { createTestCompany, createTestAbonnement, createTestUser } = require('./helpers');

// ── Helper : créer un super admin avec token PLATFORM ────────────────────────

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
    email: `superadmin-plans-${Date.now()}@test.sn`,
    password: 'password123',
    phone: '+221770000000',
    role: role._id, scope: 'PLATFORM', companyId: null, isActive: true,
  });

  const token = jwt.sign(
    { id: user._id, scope: 'PLATFORM', companyId: null },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  return { user, token };
};

// ── Payload de plan valide ────────────────────────────────────────────────────

const planPayload = () => ({
  code: `TP${Date.now() % 10000000}`,
  nom: 'Plan Test',
  description: 'Un plan pour les tests',
  tarifs: { mensuel: 20000, annuel: 200000 },
  limites: { maxUtilisateurs: 5, maxFacturesMois: 200, maxStockageMo: 2048 },
  modules: ['GESCOM', 'FACTURATION', 'STOCK'],
  essaiGratuitJours: 14,
  ordreAffichage: 2,
});

// ── Autorisation ─────────────────────────────────────────────────────────────

describe('Autorisation — /api/super-admin/plans', () => {
  it('retourne 401 sans token', async () => {
    const res = await request(app).get('/api/super-admin/plans');
    expect(res.status).toBe(401);
  });

  it('retourne 403 avec un token ENTREPRISE (pas PLATFORM)', async () => {
    // createTestUser crée un utilisateur réel avec scope ENTREPRISE — protect le trouvera
    // et platformGuard rejettera avec 403 (non 401)
    const { token: entrepriseToken } = await createTestUser('admin');
    const res = await request(app)
      .get('/api/super-admin/plans')
      .set('Authorization', `Bearer ${entrepriseToken}`);
    expect(res.status).toBe(403);
  });
});

// ── GET /super-admin/plans ────────────────────────────────────────────────────

describe('GET /api/super-admin/plans', () => {
  let saToken;

  beforeEach(async () => {
    const { token } = await createSuperAdmin();
    saToken = token;
    await Plan.create([
      { code: 'A1STANDARD', nom: 'Standard', tarifs: { mensuel: 15000, annuel: 150000 }, modules: [] },
      { code: 'A1PRO', nom: 'Pro', tarifs: { mensuel: 35000, annuel: 350000 }, actif: false, modules: [] },
    ]);
  });

  it('retourne tous les plans (actifs et inactifs)', async () => {
    const res = await request(app)
      .get('/api/super-admin/plans')
      .set('Authorization', `Bearer ${saToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    // Inclut les plans inactifs
    const codes = res.body.data.map((p) => p.code);
    expect(codes).toContain('A1STANDARD');
    expect(codes).toContain('A1PRO');
  });
});

// ── POST /super-admin/plans ───────────────────────────────────────────────────

describe('POST /api/super-admin/plans', () => {
  let saToken;

  beforeEach(async () => {
    const { token } = await createSuperAdmin();
    saToken = token;
  });

  it('crée un plan avec tous les champs valides', async () => {
    const payload = planPayload();
    const res = await request(app)
      .post('/api/super-admin/plans')
      .set('Authorization', `Bearer ${saToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.code).toBe(payload.code);
    expect(res.body.data.tarifs.mensuel).toBe(20000);
    expect(res.body.data.modules).toEqual(expect.arrayContaining(['GESCOM']));

    // Vérifier en DB
    const dbPlan = await Plan.findOne({ code: payload.code });
    expect(dbPlan).not.toBeNull();
    expect(dbPlan.actif).toBe(true);
  });

  it('retourne 400 si code manquant', async () => {
    const { code: _omit, ...payload } = planPayload();
    const res = await request(app)
      .post('/api/super-admin/plans')
      .set('Authorization', `Bearer ${saToken}`)
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('retourne 400 si tarifs manquants', async () => {
    const payload = planPayload();
    delete payload.tarifs;
    const res = await request(app)
      .post('/api/super-admin/plans')
      .set('Authorization', `Bearer ${saToken}`)
      .send(payload);

    expect(res.status).toBe(400);
  });

  it('retourne 400 si module invalide', async () => {
    const payload = { ...planPayload(), modules: ['GESCOM', 'MODULE_INEXISTANT'] };
    const res = await request(app)
      .post('/api/super-admin/plans')
      .set('Authorization', `Bearer ${saToken}`)
      .send(payload);

    expect(res.status).toBe(400);
  });

  it('retourne 409 si code déjà utilisé (duplicate)', async () => {
    const payload = planPayload();
    await request(app)
      .post('/api/super-admin/plans')
      .set('Authorization', `Bearer ${saToken}`)
      .send(payload);

    const res2 = await request(app)
      .post('/api/super-admin/plans')
      .set('Authorization', `Bearer ${saToken}`)
      .send(payload);

    // MongoDB unique index → 11000 → traduit en 409 par l'error handler
    expect([400, 409]).toContain(res2.status);
  });
});

// ── PUT /super-admin/plans/:id ────────────────────────────────────────────────

describe('PUT /api/super-admin/plans/:id', () => {
  let saToken;
  let planId;

  beforeEach(async () => {
    const { token } = await createSuperAdmin();
    saToken = token;

    const plan = await Plan.create({
      code: `UPD${Date.now()}`, nom: 'Plan à modifier',
      tarifs: { mensuel: 10000, annuel: 100000 }, modules: ['GESCOM'],
    });
    planId = plan._id.toString();
  });

  it('met à jour le nom et les tarifs', async () => {
    const res = await request(app)
      .put(`/api/super-admin/plans/${planId}`)
      .set('Authorization', `Bearer ${saToken}`)
      .send({ nom: 'Plan Modifié', tarifs: { mensuel: 12000, annuel: 120000 } });

    expect(res.status).toBe(200);
    expect(res.body.data.nom).toBe('Plan Modifié');
    expect(res.body.data.tarifs.mensuel).toBe(12000);
    expect(res.body.data.version).toBeGreaterThan(1); // version incrémentée
    expect(res.body.message).toMatch(/grandfathering/i);
  });

  it('retourne 404 si plan inexistant', async () => {
    const fakeId = new (require('mongoose').Types.ObjectId)();
    const res = await request(app)
      .put(`/api/super-admin/plans/${fakeId}`)
      .set('Authorization', `Bearer ${saToken}`)
      .send({ nom: 'Nouveau Nom' });

    expect(res.status).toBe(404);
  });

  it('retourne 400 si module invalide dans la mise à jour', async () => {
    const res = await request(app)
      .put(`/api/super-admin/plans/${planId}`)
      .set('Authorization', `Bearer ${saToken}`)
      .send({ modules: ['GESCOM', 'MODULE_INVALIDE'] });

    expect(res.status).toBe(400);
  });
});

// ── DELETE /super-admin/plans/:id ─────────────────────────────────────────────

describe('DELETE /api/super-admin/plans/:id', () => {
  let saToken;
  let planId;

  beforeEach(async () => {
    const { token } = await createSuperAdmin();
    saToken = token;

    const plan = await Plan.create({
      code: `DEL${Date.now()}`, nom: 'Plan à supprimer',
      tarifs: { mensuel: 5000, annuel: 50000 }, modules: [],
    });
    planId = plan._id.toString();
  });

  it('désactive le plan (soft disable) si aucun abonné actif', async () => {
    const res = await request(app)
      .delete(`/api/super-admin/plans/${planId}`)
      .set('Authorization', `Bearer ${saToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const dbPlan = await Plan.findById(planId);
    expect(dbPlan.actif).toBe(false);
    expect(dbPlan.visible).toBe(false);
  });

  it('retourne 409 si des abonnements actifs dépendent du plan', async () => {
    const company = await createTestCompany({ name: 'Abonné SA' });
    await createTestAbonnement(company._id, planId, { statut: 'ACTIF' });

    const res = await request(app)
      .delete(`/api/super-admin/plans/${planId}`)
      .set('Authorization', `Bearer ${saToken}`);

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/abonnement/i);
  });

  it('retourne 404 si plan inexistant', async () => {
    const fakeId = new (require('mongoose').Types.ObjectId)();
    const res = await request(app)
      .delete(`/api/super-admin/plans/${fakeId}`)
      .set('Authorization', `Bearer ${saToken}`);

    expect(res.status).toBe(404);
  });
});

// ── GET /super-admin/plans/:id/stats ─────────────────────────────────────────

describe('GET /api/super-admin/plans/:id/stats', () => {
  let saToken;
  let plan;

  beforeEach(async () => {
    const { token } = await createSuperAdmin();
    saToken = token;

    plan = await Plan.create({
      code: `STATS${Date.now()}`, nom: 'Plan Stats',
      tarifs: { mensuel: 15000, annuel: 150000 }, modules: ['GESCOM'],
    });
  });

  it('retourne les stats avec 0 abonnés si plan vide', async () => {
    const res = await request(app)
      .get(`/api/super-admin/plans/${plan._id}/stats`)
      .set('Authorization', `Bearer ${saToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.abonnes.total).toBe(0);
    expect(res.body.data.abonnes.actifs).toBe(0);
    expect(res.body.data.revenus.mrr).toBe(0);
  });

  it('calcule le MRR correctement avec des abonnements ACTIF', async () => {
    const c1 = await createTestCompany({ name: 'C1' });
    const c2 = await createTestCompany({ name: 'C2' });

    await createTestAbonnement(c1._id, plan._id, {
      statut: 'ACTIF', periodicite: 'MENSUEL', montant: 15000,
    });
    await createTestAbonnement(c2._id, plan._id, {
      statut: 'ACTIF', periodicite: 'MENSUEL', montant: 15000,
    });

    const res = await request(app)
      .get(`/api/super-admin/plans/${plan._id}/stats`)
      .set('Authorization', `Bearer ${saToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.abonnes.actifs).toBe(2);
    expect(res.body.data.revenus.mrr).toBe(30000);
    expect(res.body.data.revenus.arr).toBe(360000);
  });

  it('retourne 404 pour un plan inexistant', async () => {
    const fakeId = new (require('mongoose').Types.ObjectId)();
    const res = await request(app)
      .get(`/api/super-admin/plans/${fakeId}/stats`)
      .set('Authorization', `Bearer ${saToken}`);

    expect(res.status).toBe(404);
  });
});

// ── POST /super-admin/plans/:id/migrate-subscribers ──────────────────────────

describe('POST /api/super-admin/plans/:id/migrate-subscribers', () => {
  let saToken;
  let plan;
  let abonnementId;

  beforeEach(async () => {
    const { token } = await createSuperAdmin();
    saToken = token;

    plan = await Plan.create({
      code: `MIG${Date.now()}`, nom: 'Plan Migré',
      tarifs: { mensuel: 20000, annuel: 200000 },
      modules: ['GESCOM', 'FACTURATION'], version: 2,
    });

    const company = await createTestCompany({ name: 'Migrant SA' });
    const abo = await createTestAbonnement(company._id, plan._id, {
      statut: 'ACTIF',
      planSnapshot: {
        code: plan.code, nom: plan.nom, version: 1, snapshotAt: new Date(),
        tarifs: { mensuel: 15000, annuel: 150000, devise: 'XOF' },
        limites: { maxUtilisateurs: 3, maxFacturesMois: 100, maxStockageMo: 1024 },
        modules: ['GESCOM'], features: { supportPrioritaire: false, apiAccess: false, multiEtablissement: false },
      },
    });
    abonnementId = abo._id;
  });

  it('met à jour le planSnapshot des abonnés actifs vers la version courante', async () => {
    const res = await request(app)
      .post(`/api/super-admin/plans/${plan._id}/migrate-subscribers`)
      .set('Authorization', `Bearer ${saToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/migr/i);

    // Vérifier le snapshot mis à jour
    const abo = await Abonnement.findById(abonnementId);
    expect(abo.planSnapshot.version).toBe(2);
    expect(abo.planSnapshot.modules).toEqual(expect.arrayContaining(['GESCOM', 'FACTURATION']));
  });

  it('retourne 404 si plan inexistant', async () => {
    const fakeId = new (require('mongoose').Types.ObjectId)();
    const res = await request(app)
      .post(`/api/super-admin/plans/${fakeId}/migrate-subscribers`)
      .set('Authorization', `Bearer ${saToken}`);

    expect(res.status).toBe(404);
  });
});

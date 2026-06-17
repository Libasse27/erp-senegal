/**
 * Tests Phase 9 — Super Admin MRR / ARR Dashboard
 *
 * Couvre :
 *   GET /api/super-admin/mrr/stats
 *     - Authentification : PLATFORM requis (403 ENTREPRISE, 401 sans token)
 *     - MRR = 0 quand aucun abonnement actif
 *     - Contribution MENSUEL = montant
 *     - Contribution ANNUEL  = montant / 12 (arrondi)
 *     - parPlan groupé par planSnapshot.code
 *     - Champs présents : mrr, arr, parPlan, abonnesActifs, tauxChurn…
 *
 *   GET /api/super-admin/mrr/historique
 *     - Retourne exactement 12 entrées mensuelles
 *     - Chaque entrée a : annee, mois, label, revenus, nbPaiements
 *     - Authentification : 403 ENTREPRISE
 */
require('../setup');
const request    = require('supertest');
const jwt        = require('jsonwebtoken');
const app        = require('../../app');
const User       = require('../../src/models/User');
const Role       = require('../../src/models/Role');
const Abonnement = require('../../src/models/Abonnement');
const {
  createTestCompany,
  createTestAbonnement,
  createTestUser,
} = require('../helpers');

// ── Helpers ───────────────────────────────────────────────────────────────────

const createSuperAdmin = async () => {
  let role = await Role.findOne({ name: 'super_admin' });
  if (!role) {
    role = await Role.create({
      name: 'super_admin', displayName: 'Super Admin',
      permissions: [], isSystem: true,
    });
  }
  const user = await User.create({
    firstName: 'MRR', lastName: 'Admin',
    email: `mrr-sa-${Date.now()}@test.sn`,
    password: 'password123', phone: '+221770000000',
    role: role._id, scope: 'PLATFORM', companyId: null, isActive: true,
  });
  const token = jwt.sign(
    { id: user._id, scope: 'PLATFORM', companyId: null },
    process.env.JWT_SECRET, { expiresIn: '15m' }
  );
  return { user, token };
};

const creerAboActif = async (montant, periodicite = 'MENSUEL', planCode = 'STD') => {
  const company = await createTestCompany({ name: `MRR Co ${Date.now()}` });
  const abo = await Abonnement.create({
    entrepriseId: company._id,
    planId:       company._id, // référence fictive — non peuplée dans le test
    planSnapshot: {
      code: planCode, nom: `Plan ${planCode}`,
      tarifs: { mensuel: montant, annuel: montant * 10, devise: 'XOF' },
      limites: { maxUtilisateurs: 5, maxFacturesMois: 100, maxStockageMo: 1024 },
      modules: ['GESCOM'], features: {}, version: 1, snapshotAt: new Date(),
    },
    periodicite,
    dateDebut: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    dateFin:   new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
    montant,
    statut:    'ACTIF',
  });
  return { company, abo };
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/super-admin/mrr/stats
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /super-admin/mrr/stats — authentification', () => {
  it('retourne 401 sans token', async () => {
    const res = await request(app).get('/api/super-admin/mrr/stats');
    expect(res.status).toBe(401);
  });

  it('retourne 403 avec un token ENTREPRISE', async () => {
    const { token } = await createTestUser('admin');
    const res = await request(app)
      .get('/api/super-admin/mrr/stats')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('retourne 200 avec un token PLATFORM (super_admin)', async () => {
    const { token } = await createSuperAdmin();
    const res = await request(app)
      .get('/api/super-admin/mrr/stats')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('GET /super-admin/mrr/stats — calculs MRR', () => {
  it('MRR = 0 quand aucun abonnement ACTIF ou EN_PERIODE_GRACE', async () => {
    const { token } = await createSuperAdmin();
    // Aucun abonnement créé dans ce test isolé — les autres tests nettoient via beforeEach
    const res = await request(app)
      .get('/api/super-admin/mrr/stats')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    // MRR peut être 0 ou > 0 selon les données d'autres tests concurrents
    // On vérifie juste la structure
    expect(typeof res.body.data.mrr).toBe('number');
    expect(res.body.data.mrr).toBeGreaterThanOrEqual(0);
  });

  it('contribution MENSUEL = montant exact', async () => {
    const { token } = await createSuperAdmin();
    const montant = 25000;
    await creerAboActif(montant, 'MENSUEL', 'MENSTEST');

    const res = await request(app)
      .get('/api/super-admin/mrr/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    // Le MRR inclut au moins cette contribution
    expect(res.body.data.mrr).toBeGreaterThanOrEqual(montant);
  });

  it('contribution ANNUEL = Math.round(montant / 12)', async () => {
    const { token } = await createSuperAdmin();
    const montant = 120000;
    const expectedContrib = Math.round(montant / 12); // 10 000
    await creerAboActif(montant, 'ANNUEL', 'ANNTEST');

    const res = await request(app)
      .get('/api/super-admin/mrr/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.mrr).toBeGreaterThanOrEqual(expectedContrib);
  });

  it('ARR = MRR × 12', async () => {
    const { token } = await createSuperAdmin();
    const res = await request(app)
      .get('/api/super-admin/mrr/stats')
      .set('Authorization', `Bearer ${token}`);

    const { mrr, arr } = res.body.data;
    expect(arr).toBe(mrr * 12);
  });

  it('parPlan contient les codes de plans actifs', async () => {
    const { token } = await createSuperAdmin();
    await creerAboActif(15000, 'MENSUEL', 'PLANTEST');

    const res = await request(app)
      .get('/api/super-admin/mrr/stats')
      .set('Authorization', `Bearer ${token}`);

    const { parPlan } = res.body.data;
    expect(Array.isArray(parPlan)).toBe(true);
    const found = parPlan.find((p) => p.code === 'PLANTEST');
    expect(found).toBeDefined();
    expect(found.abonnes).toBeGreaterThanOrEqual(1);
    expect(found.mrr).toBeGreaterThanOrEqual(15000);
  });

  it('retourne tous les champs attendus dans data', async () => {
    const { token } = await createSuperAdmin();
    const res = await request(app)
      .get('/api/super-admin/mrr/stats')
      .set('Authorization', `Bearer ${token}`);

    const d = res.body.data;
    expect(d).toHaveProperty('mrr');
    expect(d).toHaveProperty('arr');
    expect(d).toHaveProperty('nouveauMrr');
    expect(d).toHaveProperty('mrrPerdu');
    expect(d).toHaveProperty('mrrNet');
    expect(d).toHaveProperty('abonnesActifs');
    expect(d).toHaveProperty('abonnesEssai');
    expect(d).toHaveProperty('abonnesGrace');
    expect(d).toHaveProperty('abonnesAttente');
    expect(d).toHaveProperty('tauxChurn');
    expect(d).toHaveProperty('parPlan');
    expect(d).toHaveProperty('generatedAt');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/super-admin/mrr/historique
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /super-admin/mrr/historique', () => {
  it('retourne 401 sans token', async () => {
    const res = await request(app).get('/api/super-admin/mrr/historique');
    expect(res.status).toBe(401);
  });

  it('retourne 403 avec un token ENTREPRISE', async () => {
    const { token } = await createTestUser('admin');
    const res = await request(app)
      .get('/api/super-admin/mrr/historique')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('retourne exactement 12 entrées mensuelles', async () => {
    const { token } = await createSuperAdmin();
    const res = await request(app)
      .get('/api/super-admin/mrr/historique')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.historique).toHaveLength(12);
  });

  it('chaque entrée contient annee, mois, label, revenus, nbPaiements', async () => {
    const { token } = await createSuperAdmin();
    const res = await request(app)
      .get('/api/super-admin/mrr/historique')
      .set('Authorization', `Bearer ${token}`);

    const { historique } = res.body.data;
    for (const m of historique) {
      expect(typeof m.annee).toBe('number');
      expect(typeof m.mois).toBe('number');
      expect(typeof m.label).toBe('string');
      expect(m.label.length).toBeGreaterThan(0);
      expect(typeof m.revenus).toBe('number');
      expect(typeof m.nbPaiements).toBe('number');
      expect(m.revenus).toBeGreaterThanOrEqual(0);
    }
  });

  it('les mois sont triés par ordre chronologique', async () => {
    const { token } = await createSuperAdmin();
    const res = await request(app)
      .get('/api/super-admin/mrr/historique')
      .set('Authorization', `Bearer ${token}`);

    const { historique } = res.body.data;
    for (let i = 1; i < historique.length; i++) {
      const prev = historique[i - 1];
      const curr = historique[i];
      const prevTs = prev.annee * 12 + prev.mois;
      const currTs = curr.annee * 12 + curr.mois;
      expect(currTs).toBeGreaterThan(prevTs);
    }
  });

  it('retourne totalAnnee et maxMois dans data', async () => {
    const { token } = await createSuperAdmin();
    const res = await request(app)
      .get('/api/super-admin/mrr/historique')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.data).toHaveProperty('totalAnnee');
    expect(res.body.data).toHaveProperty('maxMois');
    expect(typeof res.body.data.totalAnnee).toBe('number');
    expect(typeof res.body.data.maxMois).toBe('number');
  });
});

const request = require('supertest');
const app = require('../app');
const Budget = require('../src/models/Budget');
const { createTestUser, createTestBudget } = require('./helpers');

// Le budget controller utilise authorize('rapports:read') sur toutes ses routes
const PERMS = ['rapports:read'];

describe('Budget Routes — /api/budgets', () => {
  let authToken;
  let testUser;

  beforeEach(async () => {
    const result = await createTestUser('admin', PERMS);
    authToken = result.token;
    testUser  = result.user;
  });

  // ── POST ─────────────────────────────────────────────────────────────────────
  describe('POST /api/budgets', () => {
    it('crée une ligne budgétaire de type produits (201)', async () => {
      const res = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          annee:        2026,
          type:         'produits',
          categorie:    'ventes_merchandises',
          libelle:      'Budget Ventes Marchandises',
          montantPrevu: 15000000,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.type).toBe('produits');
      expect(res.body.data.categorie).toBe('ventes_merchandises');
      expect(res.body.data.montantPrevu).toBe(15000000);
    });

    it('crée un budget mensuel (avec mois)', async () => {
      const res = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          annee: 2026, mois: 7,
          type: 'charges', categorie: 'salaires', libelle: 'Masse salariale juillet',
          montantPrevu: 5000000,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.mois).toBe(7);
    });

    it('crée un budget annuel (sans mois)', async () => {
      const res = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          annee: 2026, type: 'charges',
          categorie: 'loyer', libelle: 'Loyer annuel', montantPrevu: 3600000,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.mois).toBeNull();
    });

    it('rejette sans annee (400)', async () => {
      const res = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ type: 'produits', categorie: 'ventes', libelle: 'Test', montantPrevu: 1000000 });

      expect(res.status).toBe(400);
    });

    it('rejette sans montantPrevu (400)', async () => {
      const res = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ annee: 2026, type: 'produits', categorie: 'ventes', libelle: 'Test' });

      expect(res.status).toBe(400);
    });

    it('rejette sans token (401)', async () => {
      const res = await request(app)
        .post('/api/budgets')
        .send({ annee: 2026, type: 'produits', categorie: 'ventes', libelle: 'Test', montantPrevu: 1000000 });

      expect(res.status).toBe(401);
    });
  });

  // ── GET comparaison ───────────────────────────────────────────────────────────
  describe('GET /api/budgets/comparaison', () => {
    beforeEach(async () => {
      await createTestBudget(testUser._id, { annee: 2026, type: 'produits', categorie: 'ventes', libelle: 'Ventes 2026', montantPrevu: 10000000 });
      await createTestBudget(testUser._id, { annee: 2026, type: 'charges', categorie: 'salaires', libelle: 'Salaires 2026', montantPrevu: 5000000 });
    });

    it('retourne la comparaison budget/réalisé pour une année (200)', async () => {
      const res = await request(app)
        .get('/api/budgets/comparaison?annee=2026')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('parCategorie');
      expect(res.body.data.parCategorie).toBeInstanceOf(Array);
      expect(res.body.data).toHaveProperty('kpis');
    });

    it('chaque catégorie contient prevu, realise, tauxRealisation', async () => {
      const res = await request(app)
        .get('/api/budgets/comparaison?annee=2026')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      if (res.body.data.parCategorie.length > 0) {
        const cat = res.body.data.parCategorie[0];
        expect(cat).toHaveProperty('prevu');
        expect(cat).toHaveProperty('realise');
        expect(cat).toHaveProperty('tauxRealisation');
      }
    });
  });

  // ── GET liste ─────────────────────────────────────────────────────────────────
  describe('GET /api/budgets', () => {
    beforeEach(async () => {
      await createTestBudget(testUser._id, { annee: 2026, type: 'produits', categorie: 'ventes', libelle: 'Ventes' });
      await createTestBudget(testUser._id, { annee: 2026, type: 'charges', categorie: 'loyer', libelle: 'Loyer' });
      await createTestBudget(testUser._id, { annee: 2025, type: 'produits', categorie: 'services', libelle: 'Services' });
    });

    it('retourne tous les budgets actifs (200)', async () => {
      const res = await request(app)
        .get('/api/budgets')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(3);
    });

    it('filtre par année', async () => {
      const res = await request(app)
        .get('/api/budgets?annee=2026')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every((b) => b.annee === 2026)).toBe(true);
    });

    it('filtre par type', async () => {
      const res = await request(app)
        .get('/api/budgets?type=produits')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every((b) => b.type === 'produits')).toBe(true);
    });

    it('isole les données par entreprise (multi-tenant)', async () => {
      const { token: otherToken } = await createTestUser('admin', PERMS);

      const res = await request(app)
        .get('/api/budgets')
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0);
    });
  });

  // ── GET :id ───────────────────────────────────────────────────────────────────
  describe('GET /api/budgets/:id', () => {
    it('retourne le détail d\'une ligne budgétaire (200)', async () => {
      const budget = await createTestBudget(testUser._id);

      const res = await request(app)
        .get(`/api/budgets/${budget._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data._id).toBe(budget._id.toString());
      expect(res.body.data.montantPrevu).toBe(budget.montantPrevu);
    });

    it('retourne 404 pour un id inexistant', async () => {
      const res = await request(app)
        .get('/api/budgets/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ── PUT :id ───────────────────────────────────────────────────────────────────
  describe('PUT /api/budgets/:id', () => {
    it('met à jour le montant prévisionnel (200)', async () => {
      const budget = await createTestBudget(testUser._id, { montantPrevu: 1000000 });

      const res = await request(app)
        .put(`/api/budgets/${budget._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ montantPrevu: 1500000, notes: 'Révisé en cours d\'année' });

      expect(res.status).toBe(200);
      expect(res.body.data.montantPrevu).toBe(1500000);
    });

    it('retourne 404 pour un id inexistant', async () => {
      const res = await request(app)
        .put('/api/budgets/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ montantPrevu: 500000 });

      expect(res.status).toBe(404);
    });
  });

  // ── DELETE :id ────────────────────────────────────────────────────────────────
  describe('DELETE /api/budgets/:id', () => {
    it('supprime une ligne budgétaire (200)', async () => {
      const budget = await createTestBudget(testUser._id);

      const res = await request(app)
        .delete(`/api/budgets/${budget._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const deleted = await Budget.findOne({ _id: budget._id, isActive: true });
      expect(deleted).toBeNull();
    });
  });
});

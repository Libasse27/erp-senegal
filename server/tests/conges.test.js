const request = require('supertest');
const app = require('../app');
const { createTestUser, createTestEmploye, createTestConge } = require('./helpers');

const PERMS_RH = [
  'employes:create', 'employes:read',
  'conges:create', 'conges:read', 'conges:update', 'conges:delete',
];

describe('Conges Routes — /api/rh/conges', () => {
  let authToken;
  let testUser;
  let testEmploye;

  beforeEach(async () => {
    const result = await createTestUser('admin', PERMS_RH);
    authToken   = result.token;
    testUser    = result.user;
    testEmploye = await createTestEmploye(testUser._id);
  });

  // ── POST ─────────────────────────────────────────────────────────────────────
  describe('POST /api/rh/conges', () => {
    it('crée une demande de congé avec nbJours calculés automatiquement', async () => {
      const res = await request(app)
        .post('/api/rh/conges')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          employe:   testEmploye._id.toString(),
          type:      'conge_annuel',
          dateDebut: '2026-07-01',
          dateFin:   '2026-07-03',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.statut).toBe('en_attente');
      // 2026-07-01 (mer) → 2026-07-03 (ven) = 3 jours ouvrables
      expect(res.body.data.nbJours).toBe(3);
    });

    it('rejette une demande sans champ employe (400)', async () => {
      const res = await request(app)
        .post('/api/rh/conges')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ type: 'maladie', dateDebut: '2026-07-01', dateFin: '2026-07-05' });

      expect(res.status).toBe(400);
    });

    it('rejette sans token (401)', async () => {
      const res = await request(app)
        .post('/api/rh/conges')
        .send({ employe: testEmploye._id, type: 'conge_annuel', dateDebut: '2026-07-01', dateFin: '2026-07-05' });

      expect(res.status).toBe(401);
    });

    it('rejette si dateFin < dateDebut (400)', async () => {
      const res = await request(app)
        .post('/api/rh/conges')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          employe: testEmploye._id, type: 'conge_annuel',
          dateDebut: '2026-07-10', dateFin: '2026-07-05',
        });

      expect(res.status).toBe(400);
    });
  });

  // ── GET stats ─────────────────────────────────────────────────────────────────
  describe('GET /api/rh/conges/stats', () => {
    it('retourne les statistiques par type (200)', async () => {
      await createTestConge(testUser._id, testEmploye._id, { type: 'conge_annuel' });
      await createTestConge(testUser._id, testEmploye._id, { type: 'maladie' });

      const res = await request(app)
        .get('/api/rh/conges/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('enAttente');
      expect(res.body.data).toHaveProperty('parType');
      expect(res.body.data.parType).toBeInstanceOf(Array);
    });
  });

  // ── GET liste ─────────────────────────────────────────────────────────────────
  describe('GET /api/rh/conges', () => {
    beforeEach(async () => {
      await createTestConge(testUser._id, testEmploye._id, { statut: 'en_attente' });
      await createTestConge(testUser._id, testEmploye._id, { statut: 'approuve' });
    });

    it('retourne la liste complète (200)', async () => {
      const res = await request(app)
        .get('/api/rh/conges')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
    });

    it('filtre par statut', async () => {
      const res = await request(app)
        .get('/api/rh/conges?statut=approuve')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every((c) => c.statut === 'approuve')).toBe(true);
    });

    it('filtre par employé', async () => {
      const autreEmploye = await createTestEmploye(testUser._id, { nom: 'Ba', matricule: 'EMP-2026-9999' });
      await createTestConge(testUser._id, autreEmploye._id);

      const res = await request(app)
        .get(`/api/rh/conges?employe=${testEmploye._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every((c) => (c.employe._id || c.employe).toString() === testEmploye._id.toString())).toBe(true);
    });
  });

  // ── GET :id ───────────────────────────────────────────────────────────────────
  describe('GET /api/rh/conges/:id', () => {
    it('retourne le détail d\'une demande (200)', async () => {
      const conge = await createTestConge(testUser._id, testEmploye._id);

      const res = await request(app)
        .get(`/api/rh/conges/${conge._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data._id).toBe(conge._id.toString());
    });

    it('retourne 404 pour un id inexistant', async () => {
      const res = await request(app)
        .get('/api/rh/conges/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ── PUT :id — Approbation ─────────────────────────────────────────────────────
  describe('PUT /api/rh/conges/:id', () => {
    it('approuve un congé en_attente (200)', async () => {
      const conge = await createTestConge(testUser._id, testEmploye._id, { statut: 'en_attente' });

      const res = await request(app)
        .put(`/api/rh/conges/${conge._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ statut: 'approuve', commentaireRH: 'Accordé' });

      expect(res.status).toBe(200);
      expect(res.body.data.statut).toBe('approuve');
    });

    it('refuse un congé en_attente (200)', async () => {
      const conge = await createTestConge(testUser._id, testEmploye._id);

      const res = await request(app)
        .put(`/api/rh/conges/${conge._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ statut: 'refuse', commentaireRH: 'Période chargée' });

      expect(res.status).toBe(200);
      expect(res.body.data.statut).toBe('refuse');
    });
  });

  // ── DELETE :id ────────────────────────────────────────────────────────────────
  describe('DELETE /api/rh/conges/:id', () => {
    it('annule une demande en_attente (statut → annule, 200)', async () => {
      const conge = await createTestConge(testUser._id, testEmploye._id);

      const res = await request(app)
        .delete(`/api/rh/conges/${conge._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('refuse de supprimer un congé déjà approuvé (400)', async () => {
      const conge = await createTestConge(testUser._id, testEmploye._id, { statut: 'approuve' });

      const res = await request(app)
        .delete(`/api/rh/conges/${conge._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(400);
    });
  });
});

const request = require('supertest');
const app = require('../app');
const { createTestUser, createTestOpportunite, createTestActivite } = require('./helpers');

const PERMS = [
  'opportunites:read',
  'activites:create', 'activites:read', 'activites:update', 'activites:delete',
];

describe('Activites Routes — /api/crm/activites', () => {
  let authToken;
  let testUser;
  let testOpp;

  beforeEach(async () => {
    const result = await createTestUser('admin', PERMS);
    authToken = result.token;
    testUser  = result.user;
    testOpp   = await createTestOpportunite(testUser._id);
  });

  // ── POST ─────────────────────────────────────────────────────────────────────
  describe('POST /api/crm/activites', () => {
    it('crée une activité liée à une opportunité (201)', async () => {
      const res = await request(app)
        .post('/api/crm/activites')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          opportunite:  testOpp._id.toString(),
          type:         'appel',
          titre:        'Appel découverte client',
          dateActivite: new Date().toISOString(),
          dureeMinutes: 45,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.type).toBe('appel');
      expect(res.body.data.statut).toBe('planifie');
    });

    it('crée une activité de type réunion (201)', async () => {
      const res = await request(app)
        .post('/api/crm/activites')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          opportunite:  testOpp._id.toString(),
          type:         'reunion',
          titre:        'Réunion de présentation',
          dateActivite: new Date().toISOString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.data.type).toBe('reunion');
    });

    it('rejette sans titre (400)', async () => {
      const res = await request(app)
        .post('/api/crm/activites')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ opportunite: testOpp._id, type: 'email', dateActivite: new Date().toISOString() });

      expect(res.status).toBe(400);
    });

    it('rejette sans token (401)', async () => {
      const res = await request(app)
        .post('/api/crm/activites')
        .send({ type: 'appel', titre: 'Test', dateActivite: new Date().toISOString() });

      expect(res.status).toBe(401);
    });
  });

  // ── GET liste ─────────────────────────────────────────────────────────────────
  describe('GET /api/crm/activites', () => {
    beforeEach(async () => {
      await createTestActivite(testUser._id, testOpp._id, { type: 'appel', statut: 'planifie' });
      await createTestActivite(testUser._id, testOpp._id, { type: 'email', statut: 'realise' });
      await createTestActivite(testUser._id, testOpp._id, { type: 'reunion', statut: 'planifie' });
    });

    it('retourne la liste paginée (200)', async () => {
      const res = await request(app)
        .get('/api/crm/activites')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(3);
    });

    it('filtre par statut', async () => {
      const res = await request(app)
        .get('/api/crm/activites?statut=realise')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every((a) => a.statut === 'realise')).toBe(true);
    });

    it('filtre par opportunité', async () => {
      const autreOpp = await createTestOpportunite(testUser._id, { titre: 'Autre' });
      await createTestActivite(testUser._id, autreOpp._id, { titre: 'Activité autre opp' });

      const res = await request(app)
        .get(`/api/crm/activites?opportunite=${testOpp._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every((a) => (a.opportunite._id || a.opportunite).toString() === testOpp._id.toString())).toBe(true);
    });

    it('isole les données par entreprise (multi-tenant)', async () => {
      const { token: otherToken } = await createTestUser('admin', PERMS);

      const res = await request(app)
        .get('/api/crm/activites')
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0);
    });
  });

  // ── GET :id ───────────────────────────────────────────────────────────────────
  describe('GET /api/crm/activites/:id', () => {
    it('retourne le détail d\'une activité (200)', async () => {
      const activite = await createTestActivite(testUser._id, testOpp._id);

      const res = await request(app)
        .get(`/api/crm/activites/${activite._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data._id).toBe(activite._id.toString());
    });

    it('retourne 404 pour un id inexistant', async () => {
      const res = await request(app)
        .get('/api/crm/activites/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ── PUT :id ───────────────────────────────────────────────────────────────────
  describe('PUT /api/crm/activites/:id', () => {
    it('marque une activité comme réalisée (200)', async () => {
      const activite = await createTestActivite(testUser._id, testOpp._id, { statut: 'planifie' });

      const res = await request(app)
        .put(`/api/crm/activites/${activite._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ statut: 'realise', resultat: 'Client intéressé, devis à envoyer' });

      expect(res.status).toBe(200);
      expect(res.body.data.statut).toBe('realise');
      expect(res.body.data.resultat).toBe('Client intéressé, devis à envoyer');
    });

    it('met à jour la durée et la description (200)', async () => {
      const activite = await createTestActivite(testUser._id, testOpp._id, { dureeMinutes: 30 });

      const res = await request(app)
        .put(`/api/crm/activites/${activite._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ dureeMinutes: 90, description: 'Réunion plus longue que prévu' });

      expect(res.status).toBe(200);
      expect(res.body.data.dureeMinutes).toBe(90);
    });

    it('retourne 404 pour un id inexistant', async () => {
      const res = await request(app)
        .put('/api/crm/activites/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ statut: 'realise' });

      expect(res.status).toBe(404);
    });
  });

  // ── DELETE :id ────────────────────────────────────────────────────────────────
  describe('DELETE /api/crm/activites/:id', () => {
    it('supprime définitivement une activité (200)', async () => {
      const activite = await createTestActivite(testUser._id, testOpp._id);

      const res = await request(app)
        .delete(`/api/crm/activites/${activite._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Vérification de la suppression en base
      const res2 = await request(app)
        .get(`/api/crm/activites/${activite._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res2.status).toBe(404);
    });
  });
});

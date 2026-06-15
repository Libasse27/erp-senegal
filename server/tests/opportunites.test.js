const request = require('supertest');
const app = require('../app');
const Opportunite = require('../src/models/Opportunite');
const {
  createTestUser,
  createTestClient,
  createTestOpportunite,
} = require('./helpers');

const PERMS = ['opportunites:create', 'opportunites:read', 'opportunites:update', 'opportunites:delete'];

describe('Opportunites Routes — /api/crm/opportunites', () => {
  let authToken;
  let testUser;

  beforeEach(async () => {
    const result = await createTestUser('admin', PERMS);
    authToken = result.token;
    testUser  = result.user;
  });

  // ── POST ─────────────────────────────────────────────────────────────────────
  describe('POST /api/crm/opportunites', () => {
    it('crée une opportunité avec référence OPP-YYYY-NNNN (201)', async () => {
      const res = await request(app)
        .post('/api/crm/opportunites')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ titre: 'Déploiement ERP Ndakaru', etape: 'qualification', montantEstime: 2500000 });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.reference).toMatch(/^OPP-\d{4}-\d{4}$/);
      expect(res.body.data.titre).toBe('Déploiement ERP Ndakaru');
    });

    it('assigne la probabilité par défaut selon l\'étape', async () => {
      const res = await request(app)
        .post('/api/crm/opportunites')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ titre: 'Test proba', etape: 'proposition' });

      expect(res.status).toBe(201);
      expect(res.body.data.probabilite).toBe(50); // PROBA_DEFAUT.proposition = 50
    });

    it('rejette sans titre (400)', async () => {
      const res = await request(app)
        .post('/api/crm/opportunites')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ etape: 'prospect', montantEstime: 500000 });

      expect(res.status).toBe(400);
    });

    it('rejette sans token (401)', async () => {
      const res = await request(app)
        .post('/api/crm/opportunites')
        .send({ titre: 'Sans auth', etape: 'prospect' });

      expect(res.status).toBe(401);
    });
  });

  // ── GET pipeline ──────────────────────────────────────────────────────────────
  describe('GET /api/crm/opportunites/pipeline', () => {
    it('retourne les stats pour toutes les 6 étapes (200)', async () => {
      await createTestOpportunite(testUser._id, { etape: 'prospect', montantEstime: 1000000 });
      await createTestOpportunite(testUser._id, { etape: 'negociation', montantEstime: 3000000 });

      const res = await request(app)
        .get('/api/crm/opportunites/pipeline')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.pipeline).toBeInstanceOf(Array);
      expect(res.body.data.pipeline.length).toBe(6);
      expect(res.body.data).toHaveProperty('montantPipelineTotal');
    });

    it('renvoie count=0 pour les étapes sans opportunité', async () => {
      const res = await request(app)
        .get('/api/crm/opportunites/pipeline')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.pipeline.every((e) => e.count === 0)).toBe(true);
    });
  });

  // ── GET liste ─────────────────────────────────────────────────────────────────
  describe('GET /api/crm/opportunites', () => {
    beforeEach(async () => {
      await createTestOpportunite(testUser._id, { etape: 'prospect' });
      await createTestOpportunite(testUser._id, { etape: 'gagne' });
    });

    it('retourne la liste active (200)', async () => {
      const res = await request(app)
        .get('/api/crm/opportunites')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
    });

    it('filtre par étape', async () => {
      const res = await request(app)
        .get('/api/crm/opportunites?etape=gagne')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every((o) => o.etape === 'gagne')).toBe(true);
    });

    it('isole les données par entreprise (multi-tenant)', async () => {
      const { token: otherToken } = await createTestUser('admin', PERMS);

      const res = await request(app)
        .get('/api/crm/opportunites')
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0);
    });
  });

  // ── GET :id ───────────────────────────────────────────────────────────────────
  describe('GET /api/crm/opportunites/:id', () => {
    it('retourne le détail avec activités (200)', async () => {
      const opp = await createTestOpportunite(testUser._id);

      const res = await request(app)
        .get(`/api/crm/opportunites/${opp._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data._id).toBe(opp._id.toString());
      expect(res.body.data).toHaveProperty('activites');
    });

    it('retourne 404 pour un id inexistant', async () => {
      const res = await request(app)
        .get('/api/crm/opportunites/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ── PUT :id ───────────────────────────────────────────────────────────────────
  describe('PUT /api/crm/opportunites/:id', () => {
    it('change l\'étape et ajuste la probabilité automatiquement (200)', async () => {
      const opp = await createTestOpportunite(testUser._id, { etape: 'prospect', probabilite: 10 });

      const res = await request(app)
        .put(`/api/crm/opportunites/${opp._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ etape: 'negociation' });

      expect(res.status).toBe(200);
      expect(res.body.data.etape).toBe('negociation');
      expect(res.body.data.probabilite).toBe(75); // PROBA_DEFAUT.negociation = 75
    });

    it('conserve la probabilité manuelle si fournie', async () => {
      const opp = await createTestOpportunite(testUser._id, { etape: 'prospect' });

      const res = await request(app)
        .put(`/api/crm/opportunites/${opp._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ etape: 'proposition', probabilite: 60 });

      expect(res.status).toBe(200);
      expect(res.body.data.probabilite).toBe(60);
    });

    it('retourne 404 pour un id inexistant', async () => {
      const res = await request(app)
        .put('/api/crm/opportunites/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ etape: 'gagne' });

      expect(res.status).toBe(404);
    });
  });

  // ── DELETE :id — Archive ──────────────────────────────────────────────────────
  describe('DELETE /api/crm/opportunites/:id', () => {
    it('archive l\'opportunité (isActive = false, soft delete)', async () => {
      const opp = await createTestOpportunite(testUser._id);

      const res = await request(app)
        .delete(`/api/crm/opportunites/${opp._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const updated = await Opportunite.findById(opp._id);
      expect(updated.isActive).toBe(false);
    });

    it('n\'apparaît plus dans la liste active après archivage', async () => {
      const opp = await createTestOpportunite(testUser._id);
      await request(app)
        .delete(`/api/crm/opportunites/${opp._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      const res = await request(app)
        .get('/api/crm/opportunites')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.body.data.find((o) => o._id === opp._id.toString())).toBeUndefined();
    });
  });

  // ── POST :id/convertir-devis ──────────────────────────────────────────────────
  describe('POST /api/crm/opportunites/:id/convertir-devis', () => {
    it('crée un devis à partir de l\'opportunité (201)', async () => {
      const client = await createTestClient(testUser._id);
      const opp    = await createTestOpportunite(testUser._id, { client: client._id });

      const res = await request(app)
        .post(`/api/crm/opportunites/${opp._id}/convertir-devis`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('numero');
      expect(res.body.data.numero).toMatch(/^DE\d{4}-\d{5}$/);
    });

    it('rejette si l\'opportunité n\'a pas de client (400)', async () => {
      const opp = await createTestOpportunite(testUser._id, { client: null });

      const res = await request(app)
        .post(`/api/crm/opportunites/${opp._id}/convertir-devis`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(400);
    });

    it('rejette si un devis existe déjà (400)', async () => {
      const client = await createTestClient(testUser._id);
      const opp    = await createTestOpportunite(testUser._id, { client: client._id });

      // Première conversion
      await request(app)
        .post(`/api/crm/opportunites/${opp._id}/convertir-devis`)
        .set('Authorization', `Bearer ${authToken}`);

      // Deuxième tentative
      const res = await request(app)
        .post(`/api/crm/opportunites/${opp._id}/convertir-devis`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(400);
    });
  });
});

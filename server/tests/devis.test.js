const request = require('supertest');
const app = require('../app');
const Devis = require('../src/models/Devis');
const Permission = require('../src/models/Permission');
const { createTestUser, createTestClient, createTestCategory, createTestProduct, createTestDevis } = require('./helpers');

describe('Devis Routes', () => {
  let authToken;
  let testUser;
  let testClient;
  let testProduct;

  beforeAll(async () => {
    // Create additional permissions for devis module
    const extraModules = ['devis'];
    const actions = ['create', 'read', 'update', 'delete', 'export'];
    for (const mod of extraModules) {
      for (const action of actions) {
        await Permission.create({
          module: mod,
          action,
          code: `${mod}:${action}`,
          description: `Permission to ${action} ${mod}`,
        });
      }
    }

    const result = await createTestUser('admin');
    authToken = result.token;
    testUser = result.user;

    // Create test client and product
    testClient = await createTestClient(testUser._id);
    const category = await createTestCategory(testUser._id);
    testProduct = await createTestProduct(testUser._id, category._id);
  });

  describe('POST /api/devis', () => {
    it('should create a devis with lignes', async () => {
      const res = await request(app)
        .post('/api/devis')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          client: testClient._id,
          dateValidite: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          lignes: [
            {
              product: testProduct._id,
              designation: 'Produit Test',
              quantite: 2,
              prixUnitaire: 10000,
              tauxTVA: 18,
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('numero');
      expect(res.body.data).toHaveProperty('statut', 'brouillon');
      expect(res.body.data).toHaveProperty('montantHT');
      expect(res.body.data).toHaveProperty('montantTVA');
      expect(res.body.data).toHaveProperty('montantTTC');
      expect(res.body.data.montantHT).toBe(20000); // 2 * 10000
      expect(res.body.data.montantTVA).toBe(3600); // 20000 * 0.18
      expect(res.body.data.montantTTC).toBe(23600); // 20000 + 3600
    });

    it('should reject creation without client', async () => {
      const res = await request(app)
        .post('/api/devis')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          lignes: [
            {
              product: testProduct._id,
              designation: 'Produit Test',
              quantite: 1,
              prixUnitaire: 10000,
              tauxTVA: 18,
            },
          ],
        });

      expect(res.status).toBe(400);
    });

    it('should reject creation without lignes', async () => {
      const res = await request(app)
        .post('/api/devis')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          client: testClient._id,
          dateValidite: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });

      expect(res.status).toBe(400);
    });

    it('should reject unauthorized access (no token)', async () => {
      const res = await request(app)
        .post('/api/devis')
        .send({
          client: testClient._id,
          lignes: [],
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/devis', () => {
    beforeEach(async () => {
      // Create test devis
      await createTestDevis(testUser._id, testClient._id, testProduct._id, {
        statut: 'brouillon',
      });
      await createTestDevis(testUser._id, testClient._id, testProduct._id, {
        statut: 'envoye',
      });
      await createTestDevis(testUser._id, testClient._id, testProduct._id, {
        statut: 'accepte',
      });
    });

    it('should get all devis (paginated)', async () => {
      const res = await request(app)
        .get('/api/devis')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body).toHaveProperty('meta');
    });

    it('should filter devis by statut', async () => {
      const res = await request(app)
        .get('/api/devis?statut=brouillon')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.every((d) => d.statut === 'brouillon')).toBe(true);
    });
  });

  describe('GET /api/devis/:id', () => {
    it('should get a single devis by ID', async () => {
      const devis = await createTestDevis(testUser._id, testClient._id, testProduct._id);

      const res = await request(app)
        .get(`/api/devis/${devis._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('_id', devis._id.toString());
    });

    it('should return 404 for non-existent devis', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .get(`/api/devis/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/devis/:id', () => {
    it('should update a devis in brouillon status', async () => {
      const devis = await createTestDevis(testUser._id, testClient._id, testProduct._id, {
        statut: 'brouillon',
      });

      const res = await request(app)
        .put(`/api/devis/${devis._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          lignes: [
            {
              product: testProduct._id,
              designation: 'Produit Modifie',
              quantite: 5,
              prixUnitaire: 12000,
              tauxTVA: 18,
            },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.lignes[0]).toHaveProperty('designation', 'Produit Modifie');
    });

    it('should return 404 for non-existent devis', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .put(`/api/devis/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          lignes: [],
        });

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/devis/:id/status', () => {
    it('should change status from brouillon to envoye', async () => {
      const devis = await createTestDevis(testUser._id, testClient._id, testProduct._id, {
        statut: 'brouillon',
      });

      const res = await request(app)
        .put(`/api/devis/${devis._id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          statut: 'envoye',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('statut', 'envoye');
    });
  });

  describe('DELETE /api/devis/:id', () => {
    it('should soft-delete a devis in brouillon status', async () => {
      const devis = await createTestDevis(testUser._id, testClient._id, testProduct._id, {
        statut: 'brouillon',
      });

      const res = await request(app)
        .delete(`/api/devis/${devis._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify soft delete
      const deletedDevis = await Devis.findById(devis._id);
      expect(deletedDevis).toBeNull(); // Should be filtered by soft delete
    });
  });
});

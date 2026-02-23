const request = require('supertest');
const app = require('../app');
const Commande = require('../src/models/Commande');
const Permission = require('../src/models/Permission');
const { createTestUser, createTestClient, createTestCategory, createTestProduct, createTestCommande } = require('./helpers');

describe('Commande Routes', () => {
  let authToken;
  let testUser;
  let testClient;
  let testProduct;

  beforeAll(async () => {
    // Create additional permissions for commandes module
    const extraModules = ['commandes', 'bons_livraison'];
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

  describe('POST /api/commandes', () => {
    it('should create a commande with lignes', async () => {
      const res = await request(app)
        .post('/api/commandes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          client: testClient._id,
          lignes: [
            {
              product: testProduct._id,
              designation: 'Produit Test',
              quantite: 5,
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
      expect(res.body.data.montantHT).toBe(50000); // 5 * 10000
      expect(res.body.data.montantTVA).toBe(9000); // 50000 * 0.18
      expect(res.body.data.montantTTC).toBe(59000); // 50000 + 9000
    });

    it('should reject creation without client', async () => {
      const res = await request(app)
        .post('/api/commandes')
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

    it('should reject unauthorized access (no token)', async () => {
      const res = await request(app)
        .post('/api/commandes')
        .send({
          client: testClient._id,
          lignes: [],
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/commandes', () => {
    beforeEach(async () => {
      // Create test commandes
      await createTestCommande(testUser._id, testClient._id, testProduct._id, {
        statut: 'brouillon',
      });
      await createTestCommande(testUser._id, testClient._id, testProduct._id, {
        statut: 'confirmee',
      });
      await createTestCommande(testUser._id, testClient._id, testProduct._id, {
        statut: 'livree_partielle',
      });
    });

    it('should get all commandes (paginated)', async () => {
      const res = await request(app)
        .get('/api/commandes')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body).toHaveProperty('meta');
    });

    it('should filter commandes by statut', async () => {
      const res = await request(app)
        .get('/api/commandes?statut=confirmee')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.every((c) => c.statut === 'confirmee')).toBe(true);
    });
  });

  describe('GET /api/commandes/:id', () => {
    it('should get a single commande by ID', async () => {
      const commande = await createTestCommande(testUser._id, testClient._id, testProduct._id);

      const res = await request(app)
        .get(`/api/commandes/${commande._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('_id', commande._id.toString());
    });

    it('should return 404 for non-existent commande', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .get(`/api/commandes/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/commandes/:id', () => {
    it('should update a commande in brouillon status', async () => {
      const commande = await createTestCommande(testUser._id, testClient._id, testProduct._id, {
        statut: 'brouillon',
      });

      const res = await request(app)
        .put(`/api/commandes/${commande._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          lignes: [
            {
              product: testProduct._id,
              designation: 'Produit Modifie',
              quantite: 10,
              prixUnitaire: 12000,
              tauxTVA: 18,
            },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.lignes[0]).toHaveProperty('designation', 'Produit Modifie');
    });

    it('should return 404 for non-existent commande', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .put(`/api/commandes/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          lignes: [],
        });

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/commandes/:id/status', () => {
    it('should change status from brouillon to confirmee', async () => {
      const commande = await createTestCommande(testUser._id, testClient._id, testProduct._id, {
        statut: 'brouillon',
      });

      const res = await request(app)
        .put(`/api/commandes/${commande._id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          statut: 'confirmee',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('statut', 'confirmee');
    });
  });

  describe('DELETE /api/commandes/:id', () => {
    it('should soft-delete a commande in brouillon status', async () => {
      const commande = await createTestCommande(testUser._id, testClient._id, testProduct._id, {
        statut: 'brouillon',
      });

      const res = await request(app)
        .delete(`/api/commandes/${commande._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify soft delete
      const deletedCommande = await Commande.findById(commande._id);
      expect(deletedCommande).toBeNull(); // Should be filtered by soft delete
    });
  });
});

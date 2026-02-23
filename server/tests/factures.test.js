const request = require('supertest');
const app = require('../app');
const Facture = require('../src/models/Facture');
const {
  createTestUser,
  createTestClient,
  createTestCategory,
  createTestProduct,
} = require('./helpers');

describe('Facture Routes', () => {
  let authToken;
  let testUser;
  let testClient;
  let testProduct;

  beforeAll(async () => {
    const result = await createTestUser('admin', [
      'factures:create',
      'factures:read',
      'factures:update',
      'factures:delete',
      'factures:validate',
    ]);
    authToken = result.token;
    testUser = result.user;
    testClient = await createTestClient(testUser._id);

    // Create category and product
    const category = await createTestCategory(testUser._id);
    testProduct = await createTestProduct(testUser._id, category._id, {
      name: 'Test Product',
      prixVente: 10000,
    });
  });

  describe('POST /api/factures', () => {
    it('should create a facture (brouillon)', async () => {
      const res = await request(app)
        .post('/api/factures')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          client: testClient._id,
          dateFacture: new Date().toISOString(),
          lignes: [
            {
              product: testProduct._id,
              designation: testProduct.name,
              quantite: 2,
              prixUnitaire: testProduct.prixVente,
              tauxTVA: 18,
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('statut', 'brouillon');
      expect(res.body.data).toHaveProperty('client');
      expect(res.body.data.lignes).toHaveLength(1);
      expect(res.body.data).toHaveProperty('totalHT');
      expect(res.body.data).toHaveProperty('totalTVA');
      expect(res.body.data).toHaveProperty('totalTTC');
      expect(res.body.data.totalTTC).toBeGreaterThan(0);
    });

    it('should reject creation without lines', async () => {
      const res = await request(app)
        .post('/api/factures')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          client: testClient._id,
          lignes: [],
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/factures', () => {
    beforeEach(async () => {
      // Create test factures
      await Facture.create({
        client: testClient._id,
        dateFacture: new Date(),
        lignes: [
          {
            product: testProduct._id,
            designation: testProduct.name,
            quantite: 1,
            prixUnitaire: testProduct.prixVente,
            tauxTVA: 18,
          },
        ],
        createdBy: testUser._id,
      });
    });

    it('should get all factures', async () => {
      const res = await request(app)
        .get('/api/factures')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/factures/:id', () => {
    it('should get a single facture', async () => {
      const facture = await Facture.create({
        client: testClient._id,
        dateFacture: new Date(),
        lignes: [
          {
            product: testProduct._id,
            designation: testProduct.name,
            quantite: 1,
            prixUnitaire: testProduct.prixVente,
            tauxTVA: 18,
          },
        ],
        createdBy: testUser._id,
      });

      const res = await request(app)
        .get(`/api/factures/${facture._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('_id', facture._id.toString());
    });

    it('should return 404 for non-existent facture', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .get(`/api/factures/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/factures/:id', () => {
    it('should update a facture (brouillon only)', async () => {
      const facture = await Facture.create({
        client: testClient._id,
        dateFacture: new Date(),
        lignes: [
          {
            product: testProduct._id,
            designation: testProduct.name,
            quantite: 1,
            prixUnitaire: testProduct.prixVente,
            tauxTVA: 18,
          },
        ],
        statut: 'brouillon',
        createdBy: testUser._id,
      });

      const res = await request(app)
        .put(`/api/factures/${facture._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          notes: 'Updated notes',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('notes', 'Updated notes');
    });

    it('should reject modification of validated facture', async () => {
      const facture = await Facture.create({
        client: testClient._id,
        dateFacture: new Date(),
        numero: 'FA-00001',
        lignes: [
          {
            product: testProduct._id,
            designation: testProduct.name,
            quantite: 1,
            prixUnitaire: testProduct.prixVente,
            tauxTVA: 18,
          },
        ],
        statut: 'validee',
        createdBy: testUser._id,
      });

      const res = await request(app)
        .put(`/api/factures/${facture._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          notes: 'Trying to update validated facture',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/factures/:id/validate', () => {
    it('should validate a facture', async () => {
      const facture = await Facture.create({
        client: testClient._id,
        dateFacture: new Date(),
        lignes: [
          {
            product: testProduct._id,
            designation: testProduct.name,
            quantite: 1,
            prixUnitaire: testProduct.prixVente,
            tauxTVA: 18,
          },
        ],
        statut: 'brouillon',
        createdBy: testUser._id,
      });

      const res = await request(app)
        .post(`/api/factures/${facture._id}/validate`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('statut', 'validee');
      expect(res.body.data).toHaveProperty('numero'); // Should have DGI numero
      expect(res.body.data.numero).toBeTruthy();
    });
  });

  describe('DELETE /api/factures/:id', () => {
    it('should delete a brouillon facture', async () => {
      const facture = await Facture.create({
        client: testClient._id,
        dateFacture: new Date(),
        lignes: [
          {
            product: testProduct._id,
            designation: testProduct.name,
            quantite: 1,
            prixUnitaire: testProduct.prixVente,
            tauxTVA: 18,
          },
        ],
        statut: 'brouillon',
        createdBy: testUser._id,
      });

      const res = await request(app)
        .delete(`/api/factures/${facture._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify deletion
      const deletedFacture = await Facture.findById(facture._id);
      expect(deletedFacture).toBeNull();
    });

    it('should reject deletion of validated facture', async () => {
      const facture = await Facture.create({
        client: testClient._id,
        dateFacture: new Date(),
        numero: 'FA-00002',
        lignes: [
          {
            product: testProduct._id,
            designation: testProduct.name,
            quantite: 1,
            prixUnitaire: testProduct.prixVente,
            tauxTVA: 18,
          },
        ],
        statut: 'validee',
        createdBy: testUser._id,
      });

      const res = await request(app)
        .delete(`/api/factures/${facture._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(400);
    });
  });
});

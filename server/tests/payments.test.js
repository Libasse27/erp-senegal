const request = require('supertest');
const app = require('../app');
const Payment = require('../src/models/Payment');
const Facture = require('../src/models/Facture');
const {
  createTestUser,
  createTestClient,
  createTestCategory,
  createTestProduct,
} = require('./helpers');

describe('Payment Routes', () => {
  let authToken;
  let testUser;
  let testClient;
  let testFacture;

  beforeAll(async () => {
    const result = await createTestUser('admin', [
      'paiements:create',
      'paiements:read',
      'paiements:update',
      'paiements:delete',
      'paiements:validate',
    ]);
    authToken = result.token;
    testUser = result.user;
    testClient = await createTestClient(testUser._id);

    // Create a validated facture
    const category = await createTestCategory(testUser._id);
    const product = await createTestProduct(testUser._id, category._id, {
      prixVente: 10000,
    });

    testFacture = await Facture.create({
      client: testClient._id,
      dateFacture: new Date(),
      numero: 'FA-00001',
      lignes: [
        {
          product: product._id,
          designation: product.name,
          quantite: 1,
          prixUnitaire: product.prixVente,
          tauxTVA: 18,
        },
      ],
      statut: 'validee',
      createdBy: testUser._id,
    });
  });

  describe('POST /api/payments', () => {
    it('should create a payment', async () => {
      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          typePaiement: 'client',
          modePaiement: 'especes',
          montant: 5000,
          client: testClient._id,
          facture: testFacture._id,
          datePaiement: new Date().toISOString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('typePaiement', 'client');
      expect(res.body.data).toHaveProperty('montant', 5000);
      expect(res.body.data).toHaveProperty('statut', 'brouillon');
    });

    it('should reject invalid payment mode', async () => {
      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          typePaiement: 'client',
          modePaiement: 'invalid_mode',
          montant: 5000,
          client: testClient._id,
        });

      expect(res.status).toBe(400);
    });

    it('should reject payment without required fields', async () => {
      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          montant: 5000,
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/payments', () => {
    beforeEach(async () => {
      // Create test payments
      await Payment.create({
        typePaiement: 'client',
        modePaiement: 'especes',
        montant: 5000,
        client: testClient._id,
        createdBy: testUser._id,
      });
    });

    it('should get all payments', async () => {
      const res = await request(app)
        .get('/api/payments')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/payments/:id/validate', () => {
    it('should validate a payment', async () => {
      const payment = await Payment.create({
        typePaiement: 'client',
        modePaiement: 'especes',
        montant: 5000,
        client: testClient._id,
        facture: testFacture._id,
        statut: 'brouillon',
        createdBy: testUser._id,
      });

      const res = await request(app)
        .post(`/api/payments/${payment._id}/validate`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('statut', 'valide');
      expect(res.body.data).toHaveProperty('numero');
      expect(res.body.data.numero).toBeTruthy();
    });
  });

  describe('POST /api/payments/:id/cancel', () => {
    it('should cancel a validated payment', async () => {
      const payment = await Payment.create({
        typePaiement: 'client',
        modePaiement: 'especes',
        montant: 5000,
        client: testClient._id,
        numero: 'PA-00001',
        statut: 'valide',
        createdBy: testUser._id,
      });

      const res = await request(app)
        .post(`/api/payments/${payment._id}/cancel`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('statut', 'annule');
    });
  });

  describe('GET /api/payments/tresorerie', () => {
    it('should get tresorerie data', async () => {
      const res = await request(app)
        .get('/api/payments/tresorerie')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('soldeTotal');
    });
  });
});

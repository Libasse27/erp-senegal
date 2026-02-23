const request = require('supertest');
const app = require('../app');
const Permission = require('../src/models/Permission');
const Stock = require('../src/models/Stock');
const StockMovement = require('../src/models/StockMovement');
const { createTestUser, createTestCategory, createTestProduct, createTestWarehouse } = require('./helpers');

describe('Stock Routes', () => {
  let authToken;
  let testUser;
  let testProduct;
  let testWarehouse;

  beforeAll(async () => {
    // Create additional permissions for stocks module
    const extraModules = ['stocks', 'depots'];
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

    // Create test product and warehouse
    const category = await createTestCategory(testUser._id);
    testProduct = await createTestProduct(testUser._id, category._id);
    testWarehouse = await createTestWarehouse(testUser._id);
  });

  describe('GET /api/stocks', () => {
    beforeEach(async () => {
      // Create test stocks
      await Stock.create({
        product: testProduct._id,
        warehouse: testWarehouse._id,
        quantite: 100,
        seuilAlerte: 20,
        createdBy: testUser._id,
      });
    });

    it('should get all stocks', async () => {
      const res = await request(app)
        .get('/api/stocks')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/stocks/alerts', () => {
    beforeEach(async () => {
      // Create stock with low quantity (below alert threshold)
      await Stock.create({
        product: testProduct._id,
        warehouse: testWarehouse._id,
        quantite: 10,
        seuilAlerte: 20,
        createdBy: testUser._id,
      });
    });

    it('should get stock alerts', async () => {
      const res = await request(app)
        .get('/api/stocks/alerts')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      // Should return stocks where quantite <= seuilAlerte
    });
  });

  describe('GET /api/stocks/movements', () => {
    beforeEach(async () => {
      // Create stock movement
      await StockMovement.create({
        product: testProduct._id,
        warehouse: testWarehouse._id,
        type: 'entree',
        quantite: 50,
        motif: 'Achat',
        createdBy: testUser._id,
      });
    });

    it('should get stock movements', async () => {
      const res = await request(app)
        .get('/api/stocks/movements')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/stocks/movements', () => {
    it('should create a stock movement (entree)', async () => {
      const res = await request(app)
        .post('/api/stocks/movements')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          product: testProduct._id,
          warehouse: testWarehouse._id,
          type: 'entree',
          quantite: 50,
          motif: 'Achat fournisseur',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('type', 'entree');
      expect(res.body.data).toHaveProperty('quantite', 50);
    });

    it('should reject unauthorized access (no token)', async () => {
      const res = await request(app)
        .post('/api/stocks/movements')
        .send({
          product: testProduct._id,
          warehouse: testWarehouse._id,
          type: 'entree',
          quantite: 50,
        });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/stocks/transfer', () => {
    let warehouseDestination;

    beforeEach(async () => {
      // Create second warehouse for transfer
      warehouseDestination = await createTestWarehouse(testUser._id, {
        name: 'Depot Destination',
        type: 'secondaire',
      });

      // Create stock in source warehouse
      await Stock.create({
        product: testProduct._id,
        warehouse: testWarehouse._id,
        quantite: 100,
        seuilAlerte: 20,
        createdBy: testUser._id,
      });
    });

    it('should transfer stock between warehouses', async () => {
      const res = await request(app)
        .post('/api/stocks/transfer')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          product: testProduct._id,
          fromWarehouse: testWarehouse._id,
          toWarehouse: warehouseDestination._id,
          quantite: 30,
          motif: 'Transfert inter-depots',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('transfer');
    });
  });
});

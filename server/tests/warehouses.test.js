const request = require('supertest');
const app = require('../app');
const Warehouse = require('../src/models/Warehouse');
const Permission = require('../src/models/Permission');
const { createTestUser, createTestWarehouse } = require('./helpers');

describe('Warehouse Routes', () => {
  let authToken;
  let testUser;

  beforeAll(async () => {
    // Create additional permissions for depots module
    const extraModules = ['depots'];
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
  });

  describe('POST /api/warehouses', () => {
    it('should create a warehouse', async () => {
      const res = await request(app)
        .post('/api/warehouses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Depot Principal',
          type: 'principal',
          address: '123 Rue Test, Dakar',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('name', 'Depot Principal');
      expect(res.body.data).toHaveProperty('type', 'principal');
    });

    it('should reject creation without name', async () => {
      const res = await request(app)
        .post('/api/warehouses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'principal',
        });

      expect(res.status).toBe(400);
    });

    it('should reject unauthorized access (no token)', async () => {
      const res = await request(app)
        .post('/api/warehouses')
        .send({
          name: 'Test Depot',
          type: 'principal',
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/warehouses', () => {
    beforeEach(async () => {
      // Create test warehouses
      await createTestWarehouse(testUser._id, {
        name: 'Depot A',
        type: 'principal',
      });
      await createTestWarehouse(testUser._id, {
        name: 'Depot B',
        type: 'secondaire',
      });
      await createTestWarehouse(testUser._id, {
        name: 'Depot C',
        type: 'transit',
      });
    });

    it('should get all warehouses', async () => {
      const res = await request(app)
        .get('/api/warehouses')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/warehouses/:id', () => {
    it('should get a single warehouse by ID', async () => {
      const warehouse = await createTestWarehouse(testUser._id);

      const res = await request(app)
        .get(`/api/warehouses/${warehouse._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('_id', warehouse._id.toString());
    });

    it('should return 404 for non-existent warehouse', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .get(`/api/warehouses/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/warehouses/:id', () => {
    it('should update a warehouse', async () => {
      const warehouse = await createTestWarehouse(testUser._id, {
        name: 'Old Name',
      });

      const res = await request(app)
        .put(`/api/warehouses/${warehouse._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'New Name',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('name', 'New Name');
    });

    it('should return 404 for non-existent warehouse', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .put(`/api/warehouses/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated',
        });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/warehouses/:id', () => {
    it('should soft-delete a warehouse', async () => {
      const warehouse = await createTestWarehouse(testUser._id);

      const res = await request(app)
        .delete(`/api/warehouses/${warehouse._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify soft delete
      const deletedWarehouse = await Warehouse.findById(warehouse._id);
      expect(deletedWarehouse).toBeNull(); // Should be filtered by soft delete
    });
  });
});

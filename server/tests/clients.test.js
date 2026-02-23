const request = require('supertest');
const app = require('../app');
const Client = require('../src/models/Client');
const { createTestUser, createTestClient } = require('./helpers');

describe('Client Routes', () => {
  let authToken;
  let testUser;

  beforeAll(async () => {
    const result = await createTestUser('admin', [
      'clients:create',
      'clients:read',
      'clients:update',
      'clients:delete',
    ]);
    authToken = result.token;
    testUser = result.user;
  });

  describe('POST /api/clients', () => {
    it('should create a client (type particulier)', async () => {
      const res = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'particulier',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@test.com',
          phone: '221771234567',
          segment: 'C',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('type', 'particulier');
      expect(res.body.data).toHaveProperty('firstName', 'John');
      expect(res.body.data).toHaveProperty('code'); // Auto-generated
    });

    it('should create a client (type entreprise)', async () => {
      const res = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'professionnel',
          raisonSociale: 'Acme Corp',
          email: 'contact@acme.com',
          phone: '221771234568',
          ninea: '987654321',
          segment: 'A',
          category: 'grossiste',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('type', 'professionnel');
      expect(res.body.data).toHaveProperty('raisonSociale', 'Acme Corp');
      expect(res.body.data).toHaveProperty('ninea', '987654321');
    });

    it('should reject creation without required fields', async () => {
      const res = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'incomplete@test.com',
        });

      expect(res.status).toBe(400);
    });

    it('should reject unauthorized access (no token)', async () => {
      const res = await request(app)
        .post('/api/clients')
        .send({
          type: 'particulier',
          firstName: 'John',
          lastName: 'Doe',
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/clients', () => {
    beforeEach(async () => {
      // Create test clients
      await createTestClient(testUser._id, {
        raisonSociale: 'Client A',
        segment: 'A',
      });
      await createTestClient(testUser._id, {
        raisonSociale: 'Client B',
        segment: 'B',
      });
      await createTestClient(testUser._id, {
        raisonSociale: 'Client C',
        segment: 'C',
      });
    });

    it('should get all clients (paginated)', async () => {
      const res = await request(app)
        .get('/api/clients')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body).toHaveProperty('meta');
    });

    it('should filter clients by segment', async () => {
      const res = await request(app)
        .get('/api/clients?segment=A')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.every((c) => c.segment === 'A')).toBe(true);
    });

    it('should search clients by name', async () => {
      const res = await request(app)
        .get('/api/clients?search=Client A')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/clients/:id', () => {
    it('should get a single client by ID', async () => {
      const client = await createTestClient(testUser._id);

      const res = await request(app)
        .get(`/api/clients/${client._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('_id', client._id.toString());
    });

    it('should return 404 for non-existent client', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .get(`/api/clients/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/clients/:id', () => {
    it('should update a client', async () => {
      const client = await createTestClient(testUser._id, {
        raisonSociale: 'Old Name',
      });

      const res = await request(app)
        .put(`/api/clients/${client._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          raisonSociale: 'New Name',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('raisonSociale', 'New Name');
    });

    it('should return 404 for non-existent client', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .put(`/api/clients/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          raisonSociale: 'Updated',
        });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/clients/:id', () => {
    it('should soft-delete a client', async () => {
      const client = await createTestClient(testUser._id);

      const res = await request(app)
        .delete(`/api/clients/${client._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify soft delete
      const deletedClient = await Client.findById(client._id);
      expect(deletedClient).toBeNull(); // Should be filtered by soft delete

      // Verify it exists with includeDeleted
      const deletedClientRaw = await Client.findOne({
        _id: client._id,
        includeDeleted: true,
      });
      expect(deletedClientRaw).toBeTruthy();
      expect(deletedClientRaw.isActive).toBe(false);
    });
  });
});

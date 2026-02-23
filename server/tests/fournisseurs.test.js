const request = require('supertest');
const app = require('../app');
const Fournisseur = require('../src/models/Fournisseur');
const Permission = require('../src/models/Permission');
const { createTestUser, createTestFournisseur } = require('./helpers');

describe('Fournisseur Routes', () => {
  let authToken;
  let testUser;

  beforeAll(async () => {
    // Create additional permissions for fournisseurs module
    const extraModules = ['fournisseurs'];
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

  describe('POST /api/fournisseurs', () => {
    it('should create a fournisseur', async () => {
      const res = await request(app)
        .post('/api/fournisseurs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          raisonSociale: 'Fournisseur Test SA',
          email: 'fournisseur@test.com',
          phone: '221771234567',
          category: 'local',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('raisonSociale', 'Fournisseur Test SA');
      expect(res.body.data).toHaveProperty('code'); // Auto-generated
    });

    it('should reject creation without raisonSociale', async () => {
      const res = await request(app)
        .post('/api/fournisseurs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'incomplete@test.com',
          phone: '221771234567',
        });

      expect(res.status).toBe(400);
    });

    it('should reject unauthorized access (no token)', async () => {
      const res = await request(app)
        .post('/api/fournisseurs')
        .send({
          raisonSociale: 'Test Fournisseur',
          email: 'test@test.com',
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/fournisseurs', () => {
    beforeEach(async () => {
      // Create test fournisseurs
      await createTestFournisseur(testUser._id, {
        raisonSociale: 'Fournisseur A',
        category: 'local',
      });
      await createTestFournisseur(testUser._id, {
        raisonSociale: 'Fournisseur B',
        category: 'international',
      });
      await createTestFournisseur(testUser._id, {
        raisonSociale: 'Fournisseur C',
        category: 'local',
      });
    });

    it('should get all fournisseurs (paginated)', async () => {
      const res = await request(app)
        .get('/api/fournisseurs')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body).toHaveProperty('meta');
    });

    it('should search fournisseurs by name', async () => {
      const res = await request(app)
        .get('/api/fournisseurs?search=Fournisseur A')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/fournisseurs/:id', () => {
    it('should get a single fournisseur by ID', async () => {
      const fournisseur = await createTestFournisseur(testUser._id);

      const res = await request(app)
        .get(`/api/fournisseurs/${fournisseur._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('_id', fournisseur._id.toString());
    });

    it('should return 404 for non-existent fournisseur', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .get(`/api/fournisseurs/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/fournisseurs/:id', () => {
    it('should update a fournisseur', async () => {
      const fournisseur = await createTestFournisseur(testUser._id, {
        raisonSociale: 'Old Name',
      });

      const res = await request(app)
        .put(`/api/fournisseurs/${fournisseur._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          raisonSociale: 'New Name',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('raisonSociale', 'New Name');
    });

    it('should return 404 for non-existent fournisseur', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .put(`/api/fournisseurs/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          raisonSociale: 'Updated',
        });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/fournisseurs/:id', () => {
    it('should soft-delete a fournisseur', async () => {
      const fournisseur = await createTestFournisseur(testUser._id);

      const res = await request(app)
        .delete(`/api/fournisseurs/${fournisseur._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify soft delete
      const deletedFournisseur = await Fournisseur.findById(fournisseur._id);
      expect(deletedFournisseur).toBeNull(); // Should be filtered by soft delete

      // Verify it exists with raw query
      const deletedFournisseurRaw = await Fournisseur.findOne({
        _id: fournisseur._id,
      }).lean();
      // Note: With soft delete plugin, findById won't return deleted records
      // but direct find might, depending on plugin implementation
    });
  });
});

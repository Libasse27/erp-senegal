const request = require('supertest');
const app = require('../app');
const { createTestUser } = require('./helpers');

describe('User Routes', () => {
  let adminToken;
  let adminUser;

  beforeAll(async () => {
    const result = await createTestUser('admin');
    adminToken = result.token;
    adminUser = result.user;
  });

  describe('GET /api/users/me', () => {
    it('should return the current user profile', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('email', 'admin@test.com');
      expect(res.body.data).toHaveProperty('firstName', 'Test');
    });

    it('should reject unauthenticated requests', async () => {
      const res = await request(app).get('/api/users/me');
      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/users/me', () => {
    it('should update own profile', async () => {
      const res = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ firstName: 'Updated', lastName: 'Name' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.firstName).toBe('Updated');
    });
  });

  describe('GET /api/users', () => {
    it('should list all users (admin)', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should get a user by ID', async () => {
      const res = await request(app)
        .get(`/api/users/${adminUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(adminUser._id.toString());
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app)
        .get('/api/users/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user (admin)', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'New',
          lastName: 'User',
          email: 'newuser@test.com',
          password: 'Password123!',
          phone: '221771234590',
          role: adminUser.role._id || adminUser.role,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('email', 'newuser@test.com');
    });

    it('should reject duplicate email', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Dup',
          lastName: 'User',
          email: 'admin@test.com',
          password: 'Password123!',
          phone: '221771234591',
          role: adminUser.role._id || adminUser.role,
        });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update a user', async () => {
      const { user: target } = await createTestUser('vendeur', ['users:read']);
      const res = await request(app)
        .put(`/api/users/${target._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ firstName: 'Modified' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should soft-delete a user', async () => {
      const { user: target } = await createTestUser('caissier', ['users:read']);
      const res = await request(app)
        .delete(`/api/users/${target._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});

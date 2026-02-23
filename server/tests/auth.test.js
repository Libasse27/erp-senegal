const request = require('supertest');
const app = require('../app');
const User = require('../src/models/User');
const { createTestUser } = require('./helpers');

describe('Auth Routes', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user with admin token', async () => {
      const { token, user } = await createTestUser('admin');

      const res = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${token}`)
        .send({
          firstName: 'New',
          lastName: 'User',
          email: 'newuser@test.com',
          password: 'password123',
          phone: '221771234568',
          role: user.role._id,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('email', 'newuser@test.com');
      expect(res.body.data).not.toHaveProperty('password');
    });

    it('should reject registration without token', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'New',
          lastName: 'User',
          email: 'newuser@test.com',
          password: 'password123',
        });

      expect(res.status).toBe(401);
    });

    it('should reject duplicate email', async () => {
      const { token, user } = await createTestUser('admin');

      const res = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${token}`)
        .send({
          firstName: 'Duplicate',
          lastName: 'User',
          email: 'admin@test.com', // Already exists
          password: 'password123',
          role: user.role._id,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      await createTestUser('admin');

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'password123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data.user).toHaveProperty('email', 'admin@test.com');
      expect(res.body.data.user).not.toHaveProperty('password');
    });

    it('should reject login with wrong password', async () => {
      await createTestUser('admin');

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'wrongpassword',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject login with non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'password123',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject login for inactive user', async () => {
      const { user } = await createTestUser('admin');

      // Deactivate user
      user.isActive = false;
      await user.save();

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'password123',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    it('should refresh token successfully', async () => {
      await createTestUser('admin');

      // First login to get refresh token cookie
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'password123',
        });

      const cookies = loginRes.headers['set-cookie'];

      // Use refresh token to get new access token
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .set('Cookie', cookies);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
    });

    it('should reject refresh without cookie', async () => {
      const res = await request(app).post('/api/auth/refresh-token');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const { token } = await createTestUser('admin');

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Deconnexion');
    });

    it('should reject logout without token', async () => {
      const res = await request(app).post('/api/auth/logout');

      expect(res.status).toBe(401);
    });
  });
});

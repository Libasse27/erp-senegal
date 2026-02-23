const request = require('supertest');
const app = require('../app');
const Company = require('../src/models/Company');
const Settings = require('../src/models/Settings');
const { createTestUser } = require('./helpers');

describe('Admin Routes', () => {
  let adminToken;
  let adminUser;
  let vendeurToken;

  beforeAll(async () => {
    const adminResult = await createTestUser('admin');
    adminToken = adminResult.token;
    adminUser = adminResult.user;

    // Create non-admin user
    const vendeurResult = await createTestUser('vendeur', ['products:read']);
    vendeurToken = vendeurResult.token;

    // Create company and settings for tests
    await Company.create({
      raisonSociale: 'Test Company SA',
      formeJuridique: 'SA',
      ninea: '123456789',
      rccm: 'RC-123',
      telephone: '221338001234',
      email: 'company@test.com',
      devise: 'XOF',
      createdBy: adminUser._id,
    });

    await Settings.create({
      createdBy: adminUser._id,
    });
  });

  describe('GET /api/admin/roles', () => {
    it('should list all roles (admin)', async () => {
      const res = await request(app)
        .get('/api/admin/roles')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should reject non-admin (403)', async () => {
      const res = await request(app)
        .get('/api/admin/roles')
        .set('Authorization', `Bearer ${vendeurToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/admin/permissions', () => {
    it('should list all permissions', async () => {
      const res = await request(app)
        .get('/api/admin/permissions')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/admin/audit-logs', () => {
    it('should list audit logs', async () => {
      const res = await request(app)
        .get('/api/admin/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/admin/audit-logs/stats', () => {
    it('should return audit stats', async () => {
      const res = await request(app)
        .get('/api/admin/audit-logs/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/admin/company', () => {
    it('should return company info', async () => {
      const res = await request(app)
        .get('/api/admin/company')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/admin/settings', () => {
    it('should return settings', async () => {
      const res = await request(app)
        .get('/api/admin/settings')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Unauthorized access', () => {
    it('should reject unauthenticated requests', async () => {
      const res = await request(app).get('/api/admin/roles');
      expect(res.status).toBe(401);
    });
  });
});

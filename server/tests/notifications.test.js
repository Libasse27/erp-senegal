const request = require('supertest');
const app = require('../app');
const { createTestUser, createTestNotification } = require('./helpers');

describe('Notification Routes', () => {
  let authToken;
  let testUser;

  beforeAll(async () => {
    const result = await createTestUser('admin');
    authToken = result.token;
    testUser = result.user;
  });

  describe('GET /api/notifications', () => {
    beforeEach(async () => {
      await createTestNotification(testUser._id, { title: 'Notif 1', message: 'Message 1' });
      await createTestNotification(testUser._id, { title: 'Notif 2', message: 'Message 2', type: 'warning' });
      await createTestNotification(testUser._id, { title: 'Notif 3', message: 'Message 3', isRead: true });
    });

    it('should return user notifications', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBe(3);
    });

    it('should reject unauthenticated', async () => {
      const res = await request(app).get('/api/notifications');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/notifications/unread-count', () => {
    beforeEach(async () => {
      await createTestNotification(testUser._id, { title: 'Unread 1', message: 'M1' });
      await createTestNotification(testUser._id, { title: 'Unread 2', message: 'M2' });
      await createTestNotification(testUser._id, { title: 'Read', message: 'M3', isRead: true });
    });

    it('should return unread count', async () => {
      const res = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('count');
      expect(res.body.data.count).toBe(2);
    });
  });

  describe('PUT /api/notifications/:id/read', () => {
    it('should mark a notification as read', async () => {
      const notif = await createTestNotification(testUser._id, { title: 'To Read', message: 'Msg' });

      const res = await request(app)
        .put(`/api/notifications/${notif._id}/read`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isRead).toBe(true);
    });
  });

  describe('PUT /api/notifications/read-all', () => {
    beforeEach(async () => {
      await createTestNotification(testUser._id, { title: 'N1', message: 'M1' });
      await createTestNotification(testUser._id, { title: 'N2', message: 'M2' });
    });

    it('should mark all as read', async () => {
      const res = await request(app)
        .put('/api/notifications/read-all')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('DELETE /api/notifications/:id', () => {
    it('should delete a notification', async () => {
      const notif = await createTestNotification(testUser._id, { title: 'To Delete', message: 'Msg' });

      const res = await request(app)
        .delete(`/api/notifications/${notif._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});

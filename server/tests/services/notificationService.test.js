const notificationService = require('../../src/services/notificationService');
const Notification = require('../../src/models/Notification');
const User = require('../../src/models/User');
const Role = require('../../src/models/Role');

describe('notificationService', () => {
  let mockIO;
  let testRole;
  let testUser1;
  let testUser2;

  beforeEach(async () => {
    // Create mock Socket.io
    mockIO = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };

    // Initialize notification service
    notificationService.initNotificationService(mockIO);

    // Create test role
    testRole = await Role.create({
      name: 'gestionnaire_stock',
      displayName: 'Gestionnaire Stock',
    });

    // Create test users
    testUser1 = await User.create({
      firstName: 'User',
      lastName: 'One',
      email: 'user1@example.com',
      password: 'password123',
      role: testRole._id,
    });

    testUser2 = await User.create({
      firstName: 'User',
      lastName: 'Two',
      email: 'user2@example.com',
      password: 'password123',
      role: testRole._id,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('notifyUser', () => {
    it('should emit to correct user room', () => {
      const userId = 'user123';
      const event = 'test:event';
      const data = { message: 'Test notification' };

      notificationService.notifyUser(userId, event, data);

      expect(mockIO.to).toHaveBeenCalledWith(`user:${userId}`);
      expect(mockIO.emit).toHaveBeenCalledWith(event, expect.objectContaining({
        message: 'Test notification',
        timestamp: expect.any(String),
      }));
    });

    it('should add timestamp to emitted data', () => {
      const userId = 'user123';
      const event = 'notification';
      const data = { title: 'Test', message: 'Test message' };

      notificationService.notifyUser(userId, event, data);

      const emittedData = mockIO.emit.mock.calls[0][1];
      expect(emittedData).toHaveProperty('timestamp');
      expect(typeof emittedData.timestamp).toBe('string');
    });

    it('should warn if Socket.io is not initialized', () => {
      // Create a new service instance without init
      const { notifyUser } = require('../../src/services/notificationService');
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Reset the service
      const uninitializedService = notificationService;
      uninitializedService.initNotificationService(null);

      uninitializedService.notifyUser('user123', 'test', {});

      // Re-init for other tests
      notificationService.initNotificationService(mockIO);
      consoleWarnSpy.mockRestore();
    });
  });

  describe('notifyRole', () => {
    it('should emit to correct role room', () => {
      const role = 'admin';
      const event = 'test:event';
      const data = { message: 'Test notification' };

      notificationService.notifyRole(role, event, data);

      expect(mockIO.to).toHaveBeenCalledWith(`role:${role}`);
      expect(mockIO.emit).toHaveBeenCalledWith(event, expect.objectContaining({
        message: 'Test notification',
        timestamp: expect.any(String),
      }));
    });

    it('should add timestamp to emitted data', () => {
      const role = 'manager';
      const event = 'notification';
      const data = { title: 'Role notification' };

      notificationService.notifyRole(role, event, data);

      const emittedData = mockIO.emit.mock.calls[0][1];
      expect(emittedData).toHaveProperty('timestamp');
    });
  });

  describe('notifyAll', () => {
    it('should emit to all connected users', () => {
      const event = 'global:event';
      const data = { message: 'Global notification' };

      notificationService.notifyAll(event, data);

      expect(mockIO.to).not.toHaveBeenCalled();
      expect(mockIO.emit).toHaveBeenCalledWith(event, expect.objectContaining({
        message: 'Global notification',
        timestamp: expect.any(String),
      }));
    });
  });

  describe('createAndNotify', () => {
    it('should create notification in database', async () => {
      const options = {
        userId: testUser1._id.toString(),
        type: 'success',
        title: 'Test Title',
        message: 'Test Message',
        link: '/test',
        data: { key: 'value' },
      };

      const notification = await notificationService.createAndNotify(options);

      expect(notification).toBeDefined();
      expect(notification._id).toBeDefined();

      const dbNotification = await Notification.findById(notification._id);
      expect(dbNotification).toBeDefined();
      expect(dbNotification.user.toString()).toBe(testUser1._id.toString());
      expect(dbNotification.type).toBe('success');
      expect(dbNotification.title).toBe('Test Title');
      expect(dbNotification.message).toBe('Test Message');
      expect(dbNotification.link).toBe('/test');
      expect(dbNotification.data.key).toBe('value');
    });

    it('should emit socket notification', async () => {
      const options = {
        userId: testUser1._id.toString(),
        type: 'info',
        title: 'Socket Test',
        message: 'Socket Message',
      };

      await notificationService.createAndNotify(options);

      expect(mockIO.to).toHaveBeenCalledWith(`user:${testUser1._id.toString()}`);
      expect(mockIO.emit).toHaveBeenCalledWith('notification', expect.objectContaining({
        type: 'info',
        title: 'Socket Test',
        message: 'Socket Message',
        notificationId: expect.anything(),
      }));
    });

    it('should default to info type if not provided', async () => {
      const options = {
        userId: testUser1._id.toString(),
        title: 'Default Type',
        message: 'Test',
      };

      const notification = await notificationService.createAndNotify(options);

      expect(notification.type).toBe('info');
    });

    it('should return null on error', async () => {
      const options = {
        userId: 'invalid-user-id',
        title: 'Test',
        message: 'Test',
      };

      const result = await notificationService.createAndNotify(options);

      expect(result).toBeNull();
    });
  });

  describe('createAndNotifyRole', () => {
    it('should create notifications for all users of a role', async () => {
      const options = {
        type: 'warning',
        title: 'Role Notification',
        message: 'Message for role',
        link: '/stocks',
        data: { test: true },
      };

      await notificationService.createAndNotifyRole('gestionnaire_stock', options);

      const notifications = await Notification.find({
        user: { $in: [testUser1._id, testUser2._id] },
      });

      expect(notifications).toHaveLength(2);
      expect(notifications[0].type).toBe('warning');
      expect(notifications[0].title).toBe('Role Notification');
      expect(notifications[1].type).toBe('warning');
      expect(notifications[1].title).toBe('Role Notification');
    });

    it('should emit to role room', async () => {
      const options = {
        type: 'info',
        title: 'Test',
        message: 'Test',
      };

      await notificationService.createAndNotifyRole('gestionnaire_stock', options);

      expect(mockIO.to).toHaveBeenCalledWith('role:gestionnaire_stock');
      expect(mockIO.emit).toHaveBeenCalledWith('notification', expect.objectContaining({
        type: 'info',
        title: 'Test',
        message: 'Test',
      }));
    });

    it('should not fail if role does not exist', async () => {
      const options = {
        title: 'Test',
        message: 'Test',
      };

      await expect(
        notificationService.createAndNotifyRole('non_existent_role', options)
      ).resolves.not.toThrow();
    });

    it('should only create notifications for active users', async () => {
      // Deactivate one user
      await User.findByIdAndUpdate(testUser2._id, { isActive: false });

      const options = {
        title: 'Active Only',
        message: 'Test',
      };

      await notificationService.createAndNotifyRole('gestionnaire_stock', options);

      const notifications = await Notification.find({
        user: { $in: [testUser1._id, testUser2._id] },
      });

      // Should only create for active user (testUser1)
      expect(notifications).toHaveLength(1);
      expect(notifications[0].user.toString()).toBe(testUser1._id.toString());
    });
  });

  describe('notifyStockAlert', () => {
    let managerRole;
    let adminRole;

    beforeEach(async () => {
      managerRole = await Role.create({
        name: 'manager',
        displayName: 'Manager',
      });

      adminRole = await Role.create({
        name: 'admin',
        displayName: 'Administrateur',
      });
    });

    it('should notify gestionnaire_stock role', () => {
      const product = {
        _id: 'product123',
        name: 'Test Product',
      };
      const warehouse = {
        _id: 'warehouse123',
        name: 'Main Warehouse',
      };

      notificationService.notifyStockAlert(product, warehouse, 3, 10);

      expect(mockIO.to).toHaveBeenCalledWith('role:gestionnaire_stock');
      expect(mockIO.emit).toHaveBeenCalledWith('stock:alert', expect.objectContaining({
        type: 'warning',
        title: 'Alerte stock bas',
        data: expect.objectContaining({
          productId: 'product123',
          warehouseId: 'warehouse123',
          currentStock: 3,
          minimum: 10,
        }),
      }));
    });

    it('should notify manager role', () => {
      const product = { _id: 'p1', name: 'Product' };
      const warehouse = { _id: 'w1', name: 'Warehouse' };

      notificationService.notifyStockAlert(product, warehouse, 5, 15);

      expect(mockIO.to).toHaveBeenCalledWith('role:manager');
    });

    it('should notify admin role', () => {
      const product = { _id: 'p1', name: 'Product' };
      const warehouse = { _id: 'w1', name: 'Warehouse' };

      notificationService.notifyStockAlert(product, warehouse, 5, 15);

      expect(mockIO.to).toHaveBeenCalledWith('role:admin');
    });

    it('should include product and warehouse names in message', () => {
      const product = { _id: 'p1', name: 'Test Product XYZ' };
      const warehouse = { _id: 'w1', name: 'Warehouse ABC' };

      notificationService.notifyStockAlert(product, warehouse, 2, 20);

      const emitCall = mockIO.emit.mock.calls.find((call) => call[0] === 'stock:alert');
      expect(emitCall[1].message).toContain('Test Product XYZ');
      expect(emitCall[1].message).toContain('Warehouse ABC');
      expect(emitCall[1].message).toContain('(2/20)');
    });

    it('should handle product with designation instead of name', () => {
      const product = { _id: 'p1', designation: 'Product Designation' };
      const warehouse = { _id: 'w1', nom: 'Warehouse Name' };

      notificationService.notifyStockAlert(product, warehouse, 1, 5);

      const emitCall = mockIO.emit.mock.calls.find((call) => call[0] === 'stock:alert');
      expect(emitCall[1].message).toContain('Product Designation');
      expect(emitCall[1].message).toContain('Warehouse Name');
    });
  });

  describe('getIO', () => {
    it('should return initialized Socket.io instance', () => {
      const io = notificationService.getIO();
      expect(io).toBe(mockIO);
    });
  });
});

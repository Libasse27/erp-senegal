const User = require('../../src/models/User');
const Role = require('../../src/models/Role');
const { createTestRole } = require('../helpers');

describe('User Model', () => {
  let testRole;

  beforeAll(async () => {
    testRole = await createTestRole('test-role', []);
  });

  describe('Password hashing', () => {
    it('should hash password on save', async () => {
      const user = await User.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com',
        password: 'plaintext123',
        role: testRole._id,
      });

      expect(user.password).toBeDefined();
      expect(user.password).not.toBe('plaintext123');
      expect(user.password.length).toBeGreaterThan(20); // Bcrypt hashes are long
    });

    it('should not rehash password if not modified', async () => {
      const user = await User.create({
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@test.com',
        password: 'password123',
        role: testRole._id,
      });

      const originalHash = user.password;
      user.firstName = 'Jane Updated';
      await user.save();

      const updatedUser = await User.findById(user._id).select('+password');
      expect(updatedUser.password).toBe(originalHash);
    });
  });

  describe('comparePassword method', () => {
    it('should validate correct password', async () => {
      const user = await User.create({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@password.com',
        password: 'correctPassword',
        role: testRole._id,
      });

      const userWithPassword = await User.findById(user._id).select('+password');
      const isMatch = await userWithPassword.comparePassword('correctPassword');

      expect(isMatch).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const user = await User.create({
        firstName: 'Test',
        lastName: 'User',
        email: 'test2@password.com',
        password: 'correctPassword',
        role: testRole._id,
      });

      const userWithPassword = await User.findById(user._id).select('+password');
      const isMatch = await userWithPassword.comparePassword('wrongPassword');

      expect(isMatch).toBe(false);
    });
  });

  describe('Field validation', () => {
    it('should enforce required fields', async () => {
      const user = new User({
        firstName: 'Test',
        // Missing required fields
      });

      let error;
      try {
        await user.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.name).toBe('ValidationError');
    });

    it('should validate email format', async () => {
      const user = new User({
        firstName: 'Test',
        lastName: 'User',
        email: 'invalid-email',
        password: 'password123',
        role: testRole._id,
      });

      let error;
      try {
        await user.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.name).toBe('ValidationError');
      expect(error.errors.email).toBeDefined();
    });

    it('should enforce minimum password length', async () => {
      const user = new User({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@short.com',
        password: '12345', // Less than 6 characters
        role: testRole._id,
      });

      let error;
      try {
        await user.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.name).toBe('ValidationError');
      expect(error.errors.password).toBeDefined();
    });
  });

  describe('Virtual fields', () => {
    it('should generate fullName virtual', async () => {
      const user = await User.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'virtual@test.com',
        password: 'password123',
        role: testRole._id,
      });

      expect(user.fullName).toBe('John Doe');
    });
  });

  describe('Soft delete', () => {
    it('should soft delete user', async () => {
      const user = await User.create({
        firstName: 'Delete',
        lastName: 'Me',
        email: 'delete@test.com',
        password: 'password123',
        role: testRole._id,
      });

      await user.softDelete(testRole._id);

      // Should not be found by default queries
      const found = await User.findById(user._id);
      expect(found).toBeNull();

      // Should exist with includeDeleted
      const foundDeleted = await User.findOne({
        _id: user._id,
        includeDeleted: true,
      });
      expect(foundDeleted).toBeTruthy();
      expect(foundDeleted.isActive).toBe(false);
      expect(foundDeleted.deletedAt).toBeTruthy();
    });
  });

  describe('Reset password token', () => {
    it('should generate reset password token', async () => {
      const user = await User.create({
        firstName: 'Reset',
        lastName: 'Password',
        email: 'reset@test.com',
        password: 'password123',
        role: testRole._id,
      });

      const token = user.generateResetPasswordToken();

      expect(token).toBeDefined();
      expect(token.length).toBeGreaterThan(20);
      expect(user.resetPasswordToken).toBeDefined();
      expect(user.resetPasswordExpire).toBeDefined();
      expect(user.resetPasswordExpire).toBeInstanceOf(Date);
    });
  });
});

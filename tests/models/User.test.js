const User = require('../../models/User');
const bcrypt = require('bcryptjs');

describe('User Model', () => {
  describe('User Creation', () => {
    it('should create a user with valid data', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test123456',
        role: 'patient'
      };

      const user = await User.create(userData);

      expect(user._id).toBeDefined();
      expect(user.name).toBe(userData.name);
      expect(user.email).toBe(userData.email.toLowerCase());
      expect(user.role).toBe(userData.role);
      expect(user.isActive).toBe(true);
      expect(user.password).not.toBe(userData.password); // Should be hashed
    });

    it('should require name field', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Test123456'
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should require email field', async () => {
      const userData = {
        name: 'Test User',
        password: 'Test123456'
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should require password field', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com'
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should enforce unique email', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test123456'
      };

      await User.create(userData);
      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should lowercase email', async () => {
      const userData = {
        name: 'Test User',
        email: 'TEST@EXAMPLE.COM',
        password: 'Test123456'
      };

      const user = await User.create(userData);
      expect(user.email).toBe('test@example.com');
    });

    it('should default role to patient', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test123456'
      };

      const user = await User.create(userData);
      expect(user.role).toBe('patient');
    });

    it('should validate role enum', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test123456',
        role: 'invalid-role'
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should validate email format', async () => {
      const userData = {
        name: 'Test User',
        email: 'invalid-email',
        password: 'Test123456'
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should validate password minimum length', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: '12345'
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should validate name max length', async () => {
      const userData = {
        name: 'A'.repeat(51),
        email: 'test@example.com',
        password: 'Test123456'
      };

      await expect(User.create(userData)).rejects.toThrow();
    });
  });

  describe('Password Hashing', () => {
    it('should hash password before saving', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test123456'
      };

      const user = await User.create(userData);
      expect(user.password).not.toBe(userData.password);
      expect(user.password.length).toBeGreaterThan(20); // bcrypt hash length
    });

    it('should not rehash password if not modified', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test123456'
      };

      const user = await User.create(userData);
      const originalPassword = user.password;

      user.name = 'Updated Name';
      await user.save();

      expect(user.password).toBe(originalPassword);
    });
  });

  describe('comparePassword method', () => {
    it('should return true for correct password', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test123456'
      };

      const user = await User.create(userData);
      const isMatch = await user.comparePassword('Test123456');
      expect(isMatch).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test123456'
      };

      const user = await User.create(userData);
      const isMatch = await user.comparePassword('WrongPassword');
      expect(isMatch).toBe(false);
    });
  });

  describe('toJSON method', () => {
    it('should exclude password from JSON output', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test123456'
      };

      const user = await User.create(userData);
      const userJSON = user.toJSON();

      expect(userJSON.password).toBeUndefined();
      expect(userJSON.name).toBe(userData.name);
      expect(userJSON.email).toBe(userData.email);
    });
  });

  describe('Timestamps', () => {
    it('should set createdAt and updatedAt', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test123456'
      };

      const user = await User.create(userData);
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
    });

    it('should update updatedAt on save', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test123456'
      };

      const user = await User.create(userData);
      const originalUpdatedAt = user.updatedAt;

      // Wait a bit to ensure time difference
      await new Promise(resolve => setTimeout(resolve, 100));

      user.name = 'Updated Name';
      await user.save();

      expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });
});

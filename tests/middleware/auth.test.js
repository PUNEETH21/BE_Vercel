const jwt = require('jsonwebtoken');
const { protect, authorize } = require('../../middleware/auth');
const User = require('../../models/User');

describe('Auth Middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      headers: {},
      user: null
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
  });

  describe('protect middleware', () => {
    it('should call next() with valid token', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test123456',
        role: 'patient'
      });

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
      mockReq.headers.authorization = `Bearer ${token}`;

      await protect(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeDefined();
      expect(mockReq.user._id.toString()).toBe(user._id.toString());
    });

    it('should return 401 without token', async () => {
      await protect(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Not authorized to access this route'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 with invalid token', async () => {
      mockReq.headers.authorization = 'Bearer invalid-token';

      await protect(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 if user not found', async () => {
      const mongoose = require('mongoose');
      const fakeId = new mongoose.Types.ObjectId();
      const token = jwt.sign({ id: fakeId }, process.env.JWT_SECRET);
      mockReq.headers.authorization = `Bearer ${token}`;

      await protect(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 for deactivated user', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test123456',
        role: 'patient',
        isActive: false
      });

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
      mockReq.headers.authorization = `Bearer ${token}`;

      await protect(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'User account is deactivated'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle token without Bearer prefix', async () => {
      mockReq.headers.authorization = 'some-token';

      await protect(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('authorize middleware', () => {
    beforeEach(() => {
      mockReq.user = {
        role: 'patient'
      };
    });

    it('should call next() for authorized role', () => {
      const middleware = authorize('patient', 'doctor');
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 403 for unauthorized role', () => {
      const middleware = authorize('doctor', 'admin');
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "User role 'patient' is not authorized to access this route"
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should work with single role', () => {
      mockReq.user.role = 'admin';
      const middleware = authorize('admin');
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });
});

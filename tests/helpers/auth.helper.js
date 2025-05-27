import jwt from 'jsonwebtoken';
import User from '../../src/models/User.js';
import env from '../../src/config/env.js';

export const authHelper = {
  // Generate JWT tokens for testing
  generateTokens: (userId, role = 'viewer') => {
    const accessToken = jwt.sign(
      { id: userId, role },
      env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    
    const refreshToken = jwt.sign(
      { id: userId },
      env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
    
    return { accessToken, refreshToken };
  },
  
  // Create test user with specific role
  createTestUser: async (role = 'viewer', overrides = {}) => {
    const userData = global.testHelpers.generateUserData({
      role,
      auth: { isEmailVerified: true },
      ...overrides
    });
    
    const user = await User.create(userData);
    const tokens = authHelper.generateTokens(user._id, user.role);
    
    return { user, ...tokens };
  },
  
  // Create authenticated request headers
  getAuthHeaders: (token) => ({
    Authorization: `Bearer ${token}`
  }),
  
  // Create multiple test users with different roles
  createTestUsers: async () => {
    const admin = await authHelper.createTestUser('admin');
    const editor = await authHelper.createTestUser('editor');
    const viewer = await authHelper.createTestUser('viewer');
    
    return { admin, editor, viewer };
  }
};
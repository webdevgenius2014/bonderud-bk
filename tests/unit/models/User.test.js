import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import User from '../../../src/models/User.js';
import mongoose from 'mongoose';

// Mock logger
jest.unstable_mockModule('../../../src/config/logger.js', () => ({
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    stream: { write: jest.fn() }
  }
}));

describe('User Model', () => {
  describe('Schema Validation', () => {
    it('should create a valid user', async () => {
      const userData = global.testHelpers.generateUserData();
      const user = new User(userData);
      const savedUser = await user.save();
      
      expect(savedUser._id).toBeDefined();
      expect(savedUser.email).toBe(userData.email.toLowerCase());
      expect(savedUser.role).toBe('viewer');
      expect(savedUser.isActive).toBe(true);
      expect(savedUser.isDeleted).toBe(false);
      expect(savedUser.profile.firstName).toBe(userData.profile.firstName);
      expect(savedUser.profile.lastName).toBe(userData.profile.lastName);
    });
    
    it('should require email', async () => {
      const user = new User({
        password: 'Test123!@#',
        profile: { firstName: 'Test', lastName: 'User' }
      });
      
      await expect(user.save()).rejects.toThrow(/email.*required/i);
    });
    
    it('should require valid email format', async () => {
      const user = new User({
        email: 'invalid-email',
        password: 'Test123!@#',
        profile: { firstName: 'Test', lastName: 'User' }
      });
      
      await expect(user.save()).rejects.toThrow(/invalid email/i);
    });
    
    it('should require password', async () => {
      const user = new User({
        email: 'test@example.com',
        profile: { firstName: 'Test', lastName: 'User' }
      });
      
      await expect(user.save()).rejects.toThrow(/password.*required/i);
    });
    
    it('should validate password complexity', async () => {
      const user = new User({
        email: 'test@example.com',
        password: 'weak',
        profile: { firstName: 'Test', lastName: 'User' }
      });
      
      await expect(user.save()).rejects.toThrow(/password.*requirements/i);
    });
    
    it('should enforce unique email', async () => {
      const userData = global.testHelpers.generateUserData();
      await User.create(userData);
      
      const duplicate = new User(userData);
      await expect(duplicate.save()).rejects.toThrow(/duplicate/i);
    });
    
    it('should validate role enum', async () => {
      const user = new User({
        email: 'test@example.com',
        password: 'Test123!@#',
        role: 'invalid-role',
        profile: { firstName: 'Test', lastName: 'User' }
      });
      
      await expect(user.save()).rejects.toThrow(/role.*valid/i);
    });
  });
  
  describe('Password Hashing', () => {
    it('should hash password on save', async () => {
      const password = 'Test123!@#';
      const userData = global.testHelpers.generateUserData({ password });
      const user = await User.create(userData);
      
      expect(user.password).not.toBe(password);
      expect(user.password).toMatch(/^\$2[aby]\$/); // bcrypt hash pattern
    });
    
    it('should not rehash unchanged password', async () => {
      const userData = global.testHelpers.generateUserData();
      const user = await User.create(userData);
      const originalHash = user.password;
      
      user.profile.firstName = 'Updated';
      await user.save();
      
      expect(user.password).toBe(originalHash);
    });
  });
  
  describe('Instance Methods', () => {
    let user;
    const password = 'Test123!@#';
    
    beforeEach(async () => {
      const userData = global.testHelpers.generateUserData({ password });
      user = await User.create(userData);
    });
    
    describe('comparePassword', () => {
      it('should return true for correct password', async () => {
        const isMatch = await user.comparePassword(password);
        expect(isMatch).toBe(true);
      });
      
      it('should return false for incorrect password', async () => {
        const isMatch = await user.comparePassword('WrongPassword123!');
        expect(isMatch).toBe(false);
      });
    });
    
    describe('generateEmailVerificationToken', () => {
      it('should generate verification token', async () => {
        const token = await user.generateEmailVerificationToken();
        
        expect(token).toBeDefined();
        expect(token).toHaveLength(64); // SHA256 hex length
        expect(user.auth.emailVerificationToken).toBeDefined();
        expect(user.auth.emailVerificationExpires).toBeInstanceOf(Date);
        
        // Token should expire in future
        expect(user.auth.emailVerificationExpires.getTime()).toBeGreaterThan(Date.now());
      });
    });
    
    describe('generatePasswordResetToken', () => {
      it('should generate reset token', async () => {
        const token = await user.generatePasswordResetToken();
        
        expect(token).toBeDefined();
        expect(token).toHaveLength(64);
        expect(user.auth.passwordResetToken).toBeDefined();
        expect(user.auth.passwordResetExpires).toBeInstanceOf(Date);
        
        // Token should expire in 10 minutes
        const expiresIn = user.auth.passwordResetExpires.getTime() - Date.now();
        expect(expiresIn).toBeGreaterThan(0);
        expect(expiresIn).toBeLessThanOrEqual(10 * 60 * 1000);
      });
    });
    
    describe('incrementLoginAttempts', () => {
      it('should increment login attempts', async () => {
        await user.incrementLoginAttempts();
        expect(user.auth.loginAttempts).toBe(1);
        
        await user.incrementLoginAttempts();
        expect(user.auth.loginAttempts).toBe(2);
      });
      
      it('should lock account after 5 attempts', async () => {
        for (let i = 0; i < 5; i++) {
          await user.incrementLoginAttempts();
        }
        
        expect(user.auth.loginAttempts).toBe(5);
        expect(user.auth.lockUntil).toBeInstanceOf(Date);
        expect(user.auth.lockUntil.getTime()).toBeGreaterThan(Date.now());
      });
    });
    
    describe('resetLoginAttempts', () => {
      it('should reset login attempts and unlock', async () => {
        user.auth.loginAttempts = 3;
        user.auth.lockUntil = new Date(Date.now() + 1000000);
        
        await user.resetLoginAttempts();
        
        expect(user.auth.loginAttempts).toBe(0);
        expect(user.auth.lockUntil).toBeUndefined();
      });
    });
  });
  
  describe('Virtual Fields', () => {
    let user;
    
    beforeEach(async () => {
      const userData = global.testHelpers.generateUserData({
        profile: { firstName: 'John', lastName: 'Doe' }
      });
      user = await User.create(userData);
    });
    
    it('should calculate fullName', () => {
      expect(user.fullName).toBe('John Doe');
    });
    
    it('should calculate initials', () => {
      expect(user.initials).toBe('JD');
    });
    
    it('should determine isLocked status', () => {
      expect(user.isLocked).toBe(false);
      
      user.auth.lockUntil = new Date(Date.now() + 1000000);
      expect(user.isLocked).toBe(true);
      
      user.auth.lockUntil = new Date(Date.now() - 1000);
      expect(user.isLocked).toBe(false);
    });
  });
  
  describe('Static Methods', () => {
    beforeEach(async () => {
      await User.create(global.testHelpers.generateUserData({
        email: 'active@example.com',
        isActive: true
      }));
      
      await User.create(global.testHelpers.generateUserData({
        email: 'inactive@example.com',
        isActive: false
      }));
      
      await User.create(global.testHelpers.generateUserData({
        email: 'deleted@example.com',
        isDeleted: true
      }));
      
      await User.create(global.testHelpers.generateUserData({
        email: 'admin@example.com',
        role: 'admin'
      }));
    });
    
    describe('findByEmail', () => {
      it('should find non-deleted user by email', async () => {
        const user = await User.findByEmail('active@example.com');
        expect(user).toBeDefined();
        expect(user.email).toBe('active@example.com');
      });
      
      it('should not find deleted user', async () => {
        const user = await User.findByEmail('deleted@example.com');
        expect(user).toBeNull();
      });
      
      it('should be case insensitive', async () => {
        const user = await User.findByEmail('ACTIVE@EXAMPLE.COM');
        expect(user).toBeDefined();
        expect(user.email).toBe('active@example.com');
      });
    });
    
    describe('findActive', () => {
      it('should return only active non-deleted users', async () => {
        const users = await User.findActive();
        
        expect(users).toHaveLength(2);
        expect(users.every(u => u.isActive && !u.isDeleted)).toBe(true);
      });
    });
    
    describe('findByRole', () => {
      it('should find active users by role', async () => {
        const admins = await User.findByRole('admin');
        
        expect(admins).toHaveLength(1);
        expect(admins[0].role).toBe('admin');
        expect(admins[0].isActive).toBe(true);
      });
    });
  });
  
  describe('Permissions', () => {
    it('should assign default permissions based on role', async () => {
      const viewer = await User.create(global.testHelpers.generateUserData({
        role: 'viewer'
      }));
      
      expect(viewer.permissions.canViewContactSubmissions).toBe(false);
      expect(viewer.permissions.canManageAttorneys).toBe(false);
      
      const editor = await User.create(global.testHelpers.generateUserData({
        role: 'editor'
      }));
      
      expect(editor.permissions.canManageAttorneys).toBe(true);
      expect(editor.permissions.canManageUsers).toBe(false);
      
      const admin = await User.create(global.testHelpers.generateUserData({
        role: 'admin'
      }));
      
      expect(admin.permissions.canManageUsers).toBe(true);
      expect(admin.permissions.canAccessAnalytics).toBe(true);
    });
  });
});
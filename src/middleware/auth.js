import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { env } from '../config/env.js';

export const authenticateToken = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : null;

  if (!token) {
    throw new ApiError('Access token required', 401, 'NO_TOKEN');
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findById(decoded.userId)
      .select('-password -refreshTokens -resetPasswordToken -resetPasswordExpires');

    if (!user) {
      throw new ApiError('User not found', 401, 'USER_NOT_FOUND');
    }

    if (!user.isActive) {
      throw new ApiError('Account is deactivated', 401, 'ACCOUNT_DEACTIVATED');
    }

    if (!user.auth.isEmailVerified) {
      throw new ApiError('Email not verified', 401, 'EMAIL_NOT_VERIFIED');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new ApiError('Token expired', 401, 'TOKEN_EXPIRED');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new ApiError('Invalid token', 401, 'INVALID_TOKEN');
    }
    throw error;
  }
});

export const authorize = (roles = []) => {
  const roleArray = typeof roles === 'string' ? [roles] : roles;

  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError('Authentication required', 401, 'NOT_AUTHENTICATED');
    }

    if (!roleArray.includes(req.user.role)) {
      throw new ApiError('Insufficient permissions', 403, 'INSUFFICIENT_PERMISSIONS');
    }

    next();
  };
};

export const checkPermission = (permission) => (req, res, next) => {
    if (!req.user) {
      throw new ApiError('Authentication required', 401, 'NOT_AUTHENTICATED');
    }

    // Admin has all permissions
    if (req.user.role === 'admin') {
      return next();
    }

    if (!req.user.permissions.includes(permission)) {
      throw new ApiError(`Permission required: ${permission}`, 403, 'MISSING_PERMISSION');
    }

    return next();
  };

export const optionalAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : null;

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findById(decoded.userId)
      .select('-password -refreshTokens -resetPasswordToken -resetPasswordExpires');

    if (user && user.isActive && user.auth.isEmailVerified) {
      req.user = user;
    }
  } catch (error) {
    // Ignore token errors for optional auth
  }

  return next();
});

export const rateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100,
    message = 'Too many requests',
    keyGenerator = (req) => req.ip
  } = options;

  const requests = new Map();

  return (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old entries
    for (const [k, timestamps] of requests.entries()) {
      requests.set(k, timestamps.filter(t => t > windowStart));
      if (requests.get(k).length === 0) {
        requests.delete(k);
      }
    }

    const timestamps = requests.get(key) || [];
    const recentRequests = timestamps.filter(t => t > windowStart);

    if (recentRequests.length >= max) {
      throw new ApiError(message, 429, 'RATE_LIMIT_EXCEEDED');
    }

    recentRequests.push(now);
    requests.set(key, recentRequests);

    next();
  };
};
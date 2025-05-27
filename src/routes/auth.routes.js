import { Router } from 'express';
import {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
  getProfile,
  updateProfile,
  changePassword
} from '../controllers/auth.controller.js';
import { authenticateToken, rateLimiter } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { authValidation } from '../validators/auth.validator.js';

const router = Router();

// Public routes with rate limiting
router.post(
  '/register',
  rateLimiter({ max: 5, windowMs: 60 * 60 * 1000 }), // 5 attempts per hour
  validateRequest(authValidation.register),
  register
);

router.post(
  '/login',
  rateLimiter({ max: 5, windowMs: 15 * 60 * 1000 }), // 5 attempts per 15 minutes
  validateRequest(authValidation.login),
  login
);

router.post(
  '/logout',
  validateRequest(authValidation.logout),
  logout
);

router.post(
  '/refresh',
  rateLimiter({ max: 10, windowMs: 15 * 60 * 1000 }),
  validateRequest(authValidation.refreshToken),
  refreshToken
);

router.post(
  '/forgot-password',
  rateLimiter({ max: 3, windowMs: 60 * 60 * 1000 }), // 3 attempts per hour
  validateRequest(authValidation.forgotPassword),
  forgotPassword
);

router.post(
  '/reset-password',
  rateLimiter({ max: 3, windowMs: 60 * 60 * 1000 }),
  validateRequest(authValidation.resetPassword),
  resetPassword
);

router.post(
  '/verify-email',
  validateRequest(authValidation.verifyEmail),
  verifyEmail
);

// Protected routes
router.get(
  '/profile',
  authenticateToken,
  getProfile
);

router.put(
  '/profile',
  authenticateToken,
  validateRequest(authValidation.updateProfile),
  updateProfile
);

router.put(
  '/change-password',
  authenticateToken,
  validateRequest(authValidation.changePassword),
  changePassword
);

export default router;
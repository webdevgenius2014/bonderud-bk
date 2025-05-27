import { Router } from 'express';
import {
  listReviews,
  getReview,
  submitReview,
  listAllReviews,
  moderateReview,
  addResponse,
  markHelpful,
  deleteReview,
  toggleVerified,
  getStatistics
} from '../controllers/clientReview.controller.js';
import { authenticateToken, authorize, rateLimiter, optionalAuth } from '../middleware/auth.js';
import { validateRequest, validateQuery, validateParams } from '../middleware/validation.js';
import { reviewValidation } from '../validators/review.validator.js';

const router = Router();

// Public routes
router.get(
  '/',
  validateQuery(reviewValidation.listQuery),
  listReviews
);

router.get(
  '/statistics',
  validateQuery(reviewValidation.statsQuery),
  getStatistics
);

router.get(
  '/:id',
  validateParams(reviewValidation.idParam),
  optionalAuth, // Allow both public and authenticated access
  getReview
);

router.post(
  '/submit',
  rateLimiter({ max: 1, windowMs: 24 * 60 * 60 * 1000 }), // 1 per day per IP
  validateRequest(reviewValidation.submit),
  submitReview
);

router.post(
  '/:id/helpful',
  rateLimiter({ max: 50, windowMs: 60 * 60 * 1000 }), // 50 per hour
  validateParams(reviewValidation.idParam),
  optionalAuth,
  markHelpful
);

// Admin routes
router.get(
  '/admin/all',
  authenticateToken,
  authorize(['admin', 'editor']),
  validateQuery(reviewValidation.adminListQuery),
  listAllReviews
);

router.put(
  '/:id/moderate',
  authenticateToken,
  authorize(['admin']),
  validateParams(reviewValidation.idParam),
  validateRequest(reviewValidation.moderate),
  moderateReview
);

router.post(
  '/:id/respond',
  authenticateToken,
  authorize(['admin', 'editor']),
  validateParams(reviewValidation.idParam),
  validateRequest(reviewValidation.respond),
  addResponse
);

router.delete(
  '/:id',
  authenticateToken,
  authorize(['admin']),
  validateParams(reviewValidation.idParam),
  deleteReview
);

router.post(
  '/:id/toggle-verified',
  authenticateToken,
  authorize(['admin']),
  validateParams(reviewValidation.idParam),
  toggleVerified
);

export default router;
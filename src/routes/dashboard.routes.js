import { Router } from 'express';
import {
  getDashboardStats,
  getRecentActivity,
  getPerformanceMetrics
} from '../controllers/dashboard.controller.js';
import { authenticateToken, authorize } from '../middleware/auth.js';
import { validateQuery } from '../middleware/validation.js';
import { dashboardValidation } from '../validators/dashboard.validator.js';

const router = Router();

// All dashboard routes require admin authentication
router.use(authenticateToken);
router.use(authorize(['admin']));

// Get dashboard statistics
router.get(
  '/stats',
  validateQuery(dashboardValidation.statsQuery),
  getDashboardStats
);

// Get recent activity
router.get(
  '/activity',
  validateQuery(dashboardValidation.activityQuery),
  getRecentActivity
);

// Get performance metrics
router.get(
  '/metrics',
  validateQuery(dashboardValidation.metricsQuery),
  getPerformanceMetrics
);

export default router;
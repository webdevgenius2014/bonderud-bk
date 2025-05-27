import { Router } from 'express';
import {
  listCaseResults,
  getCaseResult,
  getCaseResultsByCategory,
  createCaseResult,
  updateCaseResult,
  deleteCaseResult,
  restoreCaseResult,
  toggleFeatured,
  reorderCaseResults
} from '../controllers/caseResult.controller.js';
import { authenticateToken, authorize } from '../middleware/auth.js';
import { validateRequest, validateQuery, validateParams } from '../middleware/validation.js';
import { caseResultValidation } from '../validators/caseResult.validator.js';

const router = Router();

// Public routes
router.get(
  '/',
  validateQuery(caseResultValidation.listQuery),
  listCaseResults
);

router.get(
  '/:id',
  validateParams(caseResultValidation.idParam),
  getCaseResult
);

router.get(
  '/categories/:category',
  validateParams(caseResultValidation.categoryParam),
  validateQuery(caseResultValidation.paginationQuery),
  getCaseResultsByCategory
);

// Admin routes
router.use(authenticateToken);
router.use(authorize(['admin']));

router.post(
  '/',
  validateRequest(caseResultValidation.create),
  createCaseResult
);

router.put(
  '/:id',
  validateParams(caseResultValidation.idParam),
  validateRequest(caseResultValidation.update),
  updateCaseResult
);

router.delete(
  '/:id',
  validateParams(caseResultValidation.idParam),
  deleteCaseResult
);

router.post(
  '/:id/restore',
  validateParams(caseResultValidation.idParam),
  restoreCaseResult
);

router.post(
  '/:id/toggle-featured',
  validateParams(caseResultValidation.idParam),
  toggleFeatured
);

router.post(
  '/reorder',
  validateRequest(caseResultValidation.reorder),
  reorderCaseResults
);

export default router;
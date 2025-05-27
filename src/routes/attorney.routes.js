import { Router } from 'express';
import {
  listAttorneys,
  getAttorney,
  createAttorney,
  updateAttorney,
  deleteAttorney,
  toggleFeatured,
  reorderAttorneys,
  listAttorneysAdmin
} from '../controllers/attorney.controller.js';
import { authenticateToken, authorize } from '../middleware/auth.js';
import { validateRequest, validateQuery, validateParams } from '../middleware/validation.js';
import { attorneyValidation } from '../validators/attorney.validator.js';

const router = Router();

// Public routes
router.get(
  '/',
  validateQuery(attorneyValidation.listQuery),
  listAttorneys
);

router.get(
  '/:id',
  validateParams(attorneyValidation.idOrSlugParam),
  validateQuery(attorneyValidation.languageQuery),
  getAttorney
);

// Admin routes
router.use(authenticateToken);
router.use(authorize(['admin']));

// Admin list with additional filters
router.get(
  '/admin/list',
  validateQuery(attorneyValidation.adminListQuery),
  listAttorneysAdmin
);

router.post(
  '/',
  validateRequest(attorneyValidation.create),
  createAttorney
);

router.put(
  '/:id',
  validateParams(attorneyValidation.idParam),
  validateRequest(attorneyValidation.update),
  updateAttorney
);

router.delete(
  '/:id',
  validateParams(attorneyValidation.idParam),
  deleteAttorney
);

router.post(
  '/:id/toggle-featured',
  validateParams(attorneyValidation.idParam),
  toggleFeatured
);

router.post(
  '/reorder',
  validateRequest(attorneyValidation.reorder),
  reorderAttorneys
);

export default router;
import { Router } from 'express';
import {
  listPracticeAreas,
  getPracticeArea,
  createPracticeArea,
  updatePracticeArea,
  deletePracticeArea,
  associateAttorneys,
  addFaq,
  removeFaq,
  reorderPracticeAreas
} from '../controllers/practiceArea.controller.js';
import { authenticateToken, authorize } from '../middleware/auth.js';
import { validateRequest, validateQuery, validateParams } from '../middleware/validation.js';
import { practiceAreaValidation } from '../validators/practiceArea.validator.js';

const router = Router();

// Public routes
router.get(
  '/',
  validateQuery(practiceAreaValidation.listQuery),
  listPracticeAreas
);

router.get(
  '/:id',
  validateParams(practiceAreaValidation.idOrSlugParam),
  validateQuery(practiceAreaValidation.languageQuery),
  getPracticeArea
);

// Admin routes
router.use(authenticateToken);
router.use(authorize(['admin']));

router.post(
  '/',
  validateRequest(practiceAreaValidation.create),
  createPracticeArea
);

router.put(
  '/:id',
  validateParams(practiceAreaValidation.idParam),
  validateRequest(practiceAreaValidation.update),
  updatePracticeArea
);

router.delete(
  '/:id',
  validateParams(practiceAreaValidation.idParam),
  deletePracticeArea
);

router.post(
  '/:id/attorneys',
  validateParams(practiceAreaValidation.idParam),
  validateRequest(practiceAreaValidation.associateAttorneys),
  associateAttorneys
);

router.post(
  '/:id/faqs',
  validateParams(practiceAreaValidation.idParam),
  validateRequest(practiceAreaValidation.addFaq),
  addFaq
);

router.delete(
  '/:id/faqs/:faqId',
  validateParams(practiceAreaValidation.faqParams),
  removeFaq
);

router.post(
  '/reorder',
  validateRequest(practiceAreaValidation.reorder),
  reorderPracticeAreas
);

export default router;
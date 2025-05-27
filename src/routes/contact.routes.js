import { Router } from 'express';
import {
  submitContact,
  listSubmissions,
  getSubmission,
  updateSubmissionStatus,
  assignSubmission,
  addNote,
  archiveSubmission,
  deleteSubmission,
  getStatistics
} from '../controllers/contact.controller.js';
import { authenticateToken, authorize, rateLimiter } from '../middleware/auth.js';
import { validateRequest, validateQuery, validateParams } from '../middleware/validation.js';
import { contactValidation } from '../validators/contact.validator.js';

const router = Router();

// Public route - Contact form submission
router.post(
  '/submit',
  rateLimiter({ max: 1, windowMs: 60 * 60 * 1000 }), // 1 per hour per IP
  validateRequest(contactValidation.submit),
  submitContact
);

// Admin routes
router.use(authenticateToken);

// List submissions (admin/editor)
router.get(
  '/submissions',
  authorize(['admin', 'editor']),
  validateQuery(contactValidation.listQuery),
  listSubmissions
);

// Get statistics (admin/editor)
router.get(
  '/statistics',
  authorize(['admin', 'editor']),
  validateQuery(contactValidation.statsQuery),
  getStatistics
);

// Get single submission (admin/editor)
router.get(
  '/submissions/:id',
  authorize(['admin', 'editor']),
  validateParams(contactValidation.idParam),
  getSubmission
);

// Update submission status (admin/editor)
router.put(
  '/submissions/:id/status',
  authorize(['admin', 'editor']),
  validateParams(contactValidation.idParam),
  validateRequest(contactValidation.updateStatus),
  updateSubmissionStatus
);

// Assign submission (admin only)
router.put(
  '/submissions/:id/assign',
  authorize(['admin']),
  validateParams(contactValidation.idParam),
  validateRequest(contactValidation.assign),
  assignSubmission
);

// Add note to submission (admin/editor)
router.post(
  '/submissions/:id/notes',
  authorize(['admin', 'editor']),
  validateParams(contactValidation.idParam),
  validateRequest(contactValidation.addNote),
  addNote
);

// Archive submission (admin/editor)
router.post(
  '/submissions/:id/archive',
  authorize(['admin', 'editor']),
  validateParams(contactValidation.idParam),
  archiveSubmission
);

// Delete submission (admin only)
router.delete(
  '/submissions/:id',
  authorize(['admin']),
  validateParams(contactValidation.idParam),
  deleteSubmission
);

export default router;
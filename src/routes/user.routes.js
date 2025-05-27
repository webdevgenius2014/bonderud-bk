import { Router } from 'express';
import {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  updateUserPermissions,
  toggleUserStatus
} from '../controllers/user.controller.js';
import { authenticateToken, authorize } from '../middleware/auth.js';
import { validateRequest, validateQuery, validateParams } from '../middleware/validation.js';
import { userValidation } from '../validators/user.validator.js';

const router = Router();

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(authorize(['admin']));

// List users
router.get(
  '/',
  validateQuery(userValidation.listQuery),
  listUsers
);

// Get single user
router.get(
  '/:id',
  validateParams(userValidation.idParam),
  getUser
);

// Create user
router.post(
  '/',
  validateRequest(userValidation.create),
  createUser
);

// Update user
router.put(
  '/:id',
  validateParams(userValidation.idParam),
  validateRequest(userValidation.update),
  updateUser
);

// Delete user
router.delete(
  '/:id',
  validateParams(userValidation.idParam),
  deleteUser
);

// Update user permissions
router.put(
  '/:id/permissions',
  validateParams(userValidation.idParam),
  validateRequest(userValidation.updatePermissions),
  updateUserPermissions
);

// Toggle user status
router.post(
  '/:id/toggle-status',
  validateParams(userValidation.idParam),
  toggleUserStatus
);

export default router;
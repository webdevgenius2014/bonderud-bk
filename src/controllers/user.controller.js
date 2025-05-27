import { User } from '../models/User.js';
import { ApiError } from '../utils/apiError.js';
import { apiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { pagination } from '../utils/pagination.js';
import logger from '../config/logger.js';

// List users with filters (admin only)
export const listUsers = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    role,
    isActive,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build query
  const query = { isDeleted: false };

  if (role) {
    query.role = role;
  }

  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }

  if (search) {
    query.$or = [
      { 'profile.name.en': { $regex: search, $options: 'i' } },
      { 'profile.name.es': { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  // Build sort object
  const sort = {};
  if (sortBy === 'createdAt') {
    sort.createdAt = sortOrder === 'asc' ? 1 : -1;
  } else if (sortBy === 'name') {
    sort['profile.name.en'] = sortOrder === 'asc' ? 1 : -1;
  } else if (sortBy === 'email') {
    sort.email = sortOrder === 'asc' ? 1 : -1;
  } else if (sortBy === 'lastLogin') {
    sort['auth.lastLogin'] = sortOrder === 'asc' ? 1 : -1;
  }

  // Execute query with pagination
  const totalCount = await User.countDocuments(query);
  const paginationData = pagination(page, limit, totalCount);

  const users = await User
    .find(query)
    .sort(sort)
    .limit(paginationData.limit)
    .skip(paginationData.skip)
    .populate('createdBy', 'email profile.name')
    .populate('updatedBy', 'email profile.name');

  // Get user statistics
  const stats = await User.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: { $sum: { $cond: ['$isActive', 1, 0] } },
        byRole: {
          $push: '$role'
        }
      }
    },
    {
      $project: {
        total: 1,
        active: 1,
        roleCounts: {
          admin: {
            $size: {
              $filter: {
                input: '$byRole',
                cond: { $eq: ['$$this', 'admin'] }
              }
            }
          },
          editor: {
            $size: {
              $filter: {
                input: '$byRole',
                cond: { $eq: ['$$this', 'editor'] }
              }
            }
          },
          viewer: {
            $size: {
              $filter: {
                input: '$byRole',
                cond: { $eq: ['$$this', 'viewer'] }
              }
            }
          }
        }
      }
    }
  ]);

  const userStats = stats[0] || {
    total: 0,
    active: 0,
    roleCounts: { admin: 0, editor: 0, viewer: 0 }
  };

  apiResponse.success(res, {
    users,
    stats: userStats,
    pagination: paginationData
  }, 'Users retrieved successfully');
});

// Get user details (admin only)
export const getUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User
    .findOne({ _id: id, isDeleted: false })
    .populate('createdBy', 'email profile.name')
    .populate('updatedBy', 'email profile.name');

  if (!user) {
    throw new ApiError('User not found', 404, 'NOT_FOUND');
  }

  apiResponse.success(res, user, 'User retrieved successfully');
});

// Create user (admin only)
export const createUser = asyncHandler(async (req, res) => {
  const {
    email,
    password,
    role,
    profile,
    isActive
  } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ApiError('User with this email already exists', 400, 'EMAIL_EXISTS');
  }

  // Create user
  const user = new User({
    email: email.toLowerCase(),
    password,
    role: role || 'viewer',
    profile,
    isActive: isActive !== false,
    createdBy: req.user._id,
    updatedBy: req.user._id
  });

  await user.save();

  await user.populate('createdBy', 'email profile.name');

  // TODO: Send welcome email with temporary password

  logger.info('User created', {
    userId: user._id,
    email: user.email,
    role: user.role,
    createdBy: req.user._id
  });

  apiResponse.created(res, user, 'User created successfully');
});

// Update user (admin only)
export const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // Prevent self-modification of critical fields
  if (id === req.user._id.toString()) {
    if (updates.role || updates.isActive === false) {
      throw new ApiError('Cannot modify your own role or deactivate yourself', 400, 'SELF_MODIFICATION');
    }
  }

  const user = await User.findOne({ 
    _id: id, 
    isDeleted: false 
  });

  if (!user) {
    throw new ApiError('User not found', 404, 'NOT_FOUND');
  }

  // Check for email conflicts (if updating email)
  if (updates.email && updates.email.toLowerCase() !== user.email) {
    const existingUser = await User.findOne({ 
      email: updates.email.toLowerCase(),
      _id: { $ne: id }
    });
    
    if (existingUser) {
      throw new ApiError('Email already in use', 400, 'EMAIL_EXISTS');
    }
  }

  // Update allowed fields
  const allowedUpdates = [
    'email', 'role', 'profile', 'isActive', 'permissions'
  ];

  allowedUpdates.forEach(field => {
    if (updates[field] !== undefined) {
      if (field === 'email') {
        user[field] = updates[field].toLowerCase();
      } else {
        user[field] = updates[field];
      }
    }
  });

  user.updatedBy = req.user._id;

  await user.save();

  await user.populate('updatedBy', 'email profile.name');

  logger.info('User updated', {
    userId: user._id,
    updatedBy: req.user._id,
    changes: Object.keys(updates)
  });

  apiResponse.updated(res, user, 'User updated successfully');
});

// Delete user (admin only)
export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Prevent self-deletion
  if (id === req.user._id.toString()) {
    throw new ApiError('Cannot delete your own account', 400, 'SELF_DELETION');
  }

  const user = await User.findOne({ 
    _id: id, 
    isDeleted: false 
  });

  if (!user) {
    throw new ApiError('User not found', 404, 'NOT_FOUND');
  }

  // Soft delete
  user.isDeleted = true;
  user.deletedAt = new Date();
  user.deletedBy = req.user._id;
  user.isActive = false;

  await user.save();

  logger.info('User deleted', {
    userId: user._id,
    deletedBy: req.user._id
  });

  apiResponse.deleted(res, 'User deleted successfully');
});

// Update user permissions (admin only)
export const updateUserPermissions = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { permissions } = req.body;

  const user = await User.findOne({ 
    _id: id, 
    isDeleted: false 
  });

  if (!user) {
    throw new ApiError('User not found', 404, 'NOT_FOUND');
  }

  // Validate permissions array
  const validPermissions = [
    'users.create', 'users.read', 'users.update', 'users.delete',
    'attorneys.create', 'attorneys.read', 'attorneys.update', 'attorneys.delete',
    'practice-areas.create', 'practice-areas.read', 'practice-areas.update', 'practice-areas.delete',
    'blog.create', 'blog.read', 'blog.update', 'blog.delete',
    'case-results.create', 'case-results.read', 'case-results.update', 'case-results.delete',
    'contacts.read', 'contacts.update', 'contacts.delete',
    'settings.read', 'settings.update',
    'analytics.read'
  ];

  const invalidPermissions = permissions.filter(p => !validPermissions.includes(p));
  if (invalidPermissions.length > 0) {
    throw new ApiError(`Invalid permissions: ${invalidPermissions.join(', ')}`, 400, 'INVALID_PERMISSIONS');
  }

  user.permissions = permissions;
  user.updatedBy = req.user._id;

  await user.save();

  logger.info('User permissions updated', {
    userId: user._id,
    permissions,
    updatedBy: req.user._id
  });

  apiResponse.success(res, {
    id: user._id,
    permissions: user.permissions
  }, 'User permissions updated successfully');
});

// Activate/deactivate user (admin only)
export const toggleUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Prevent self-deactivation
  if (id === req.user._id.toString()) {
    throw new ApiError('Cannot deactivate your own account', 400, 'SELF_DEACTIVATION');
  }

  const user = await User.findOne({ 
    _id: id, 
    isDeleted: false 
  });

  if (!user) {
    throw new ApiError('User not found', 404, 'NOT_FOUND');
  }

  user.isActive = !user.isActive;
  user.updatedBy = req.user._id;

  await user.save();

  logger.info('User status toggled', {
    userId: user._id,
    isActive: user.isActive,
    updatedBy: req.user._id
  });

  apiResponse.success(res, {
    id: user._id,
    isActive: user.isActive
  }, `User ${user.isActive ? 'activated' : 'deactivated'} successfully`);
});
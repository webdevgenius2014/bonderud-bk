import { Attorney } from '../models/Attorney.js';
import { ApiError } from '../utils/apiError.js';
import { apiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { pagination } from '../utils/pagination.js';
import logger from '../config/logger.js';

// List attorneys (public)
export const listAttorneys = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    featured,
    practiceArea,
    search,
    sortBy = 'displayOrder',
    sortOrder = 'asc'
  } = req.query;

  // Build query for public access
  const query = { isActive: true, isDeleted: false };

  if (featured === 'true') {
    query.isFeatured = true;
  }

  if (practiceArea) {
    query.practiceAreas = practiceArea;
  }

  if (search) {
    query.$or = [
      { 'name.en': { $regex: search, $options: 'i' } },
      { 'name.es': { $regex: search, $options: 'i' } },
      { 'bio.en': { $regex: search, $options: 'i' } },
      { 'bio.es': { $regex: search, $options: 'i' } }
    ];
  }

  // Build sort object
  const sort = {};
  if (sortBy === 'displayOrder') {
    sort.displayOrder = sortOrder === 'asc' ? 1 : -1;
  } else if (sortBy === 'name') {
    sort['name.en'] = sortOrder === 'asc' ? 1 : -1;
  } else if (sortBy === 'yearsExperience') {
    sort.yearsExperience = sortOrder === 'asc' ? 1 : -1;
  }

  // Execute query with pagination
  const totalCount = await Attorney.countDocuments(query);
  const paginationData = pagination(page, limit, totalCount);

  const attorneys = await Attorney
    .find(query)
    .sort(sort)
    .limit(paginationData.limit)
    .skip(paginationData.skip)
    .populate('practiceAreas', 'name slug')
    .select('-__v');

  apiResponse.success(res, {
    attorneys,
    pagination: paginationData
  }, 'Attorneys retrieved successfully');
});

// Get attorney by ID or slug (public)
export const getAttorney = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { language = 'en' } = req.query;

  let attorney;

  // Try to find by ObjectId first, then by slug
  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    attorney = await Attorney
      .findOne({ _id: id, isActive: true, isDeleted: false })
      .populate('practiceAreas', 'name slug description');
  } else {
    // Find by slug
    const slugQuery = {};
    slugQuery[`slug.${language}`] = id;
    attorney = await Attorney
      .findOne({ ...slugQuery, isActive: true, isDeleted: false })
      .populate('practiceAreas', 'name slug description');
  }

  if (!attorney) {
    throw new ApiError('Attorney not found', 404, 'NOT_FOUND');
  }

  apiResponse.success(res, attorney, 'Attorney retrieved successfully');
});

// Create attorney (admin only)
export const createAttorney = asyncHandler(async (req, res) => {
  const {
    name,
    slug,
    title,
    bio,
    specialties,
    education,
    practiceAreas,
    contact,
    availability,
    media,
    seo,
    displayOrder,
    isFeatured
  } = req.body;

  // Check for duplicate slugs
  if (slug) {
    const existingEn = await Attorney.findOne({ 'slug.en': slug.en });
    const existingEs = await Attorney.findOne({ 'slug.es': slug.es });
    
    if (existingEn || existingEs) {
      throw new ApiError('Slug already exists', 400, 'DUPLICATE_SLUG');
    }
  }

  const attorney = new Attorney({
    name,
    slug,
    title: title || {},
    bio: bio || {},
    specialties: specialties || { en: [], es: [] },
    education: education || { en: [], es: [] },
    practiceAreas: practiceAreas || [],
    contact: contact || {},
    availability: availability || {},
    media: media || {},
    seo: seo || {},
    displayOrder: displayOrder || 0,
    isFeatured: isFeatured || false,
    createdBy: req.user._id,
    updatedBy: req.user._id
  });

  await attorney.save();

  await attorney.populate('practiceAreas', 'name slug');
  await attorney.populate('createdBy', 'email profile.name');

  logger.info('Attorney created', {
    attorneyId: attorney._id,
    name: attorney.name.en,
    createdBy: req.user._id
  });

  apiResponse.created(res, attorney, 'Attorney created successfully');
});

// Update attorney (admin only)
export const updateAttorney = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const attorney = await Attorney.findOne({ 
    _id: id, 
    isDeleted: false 
  });

  if (!attorney) {
    throw new ApiError('Attorney not found', 404, 'NOT_FOUND');
  }

  // Check for duplicate slugs (if updating slug)
  if (updates.slug) {
    const existingEn = await Attorney.findOne({ 
      'slug.en': updates.slug.en,
      _id: { $ne: id }
    });
    const existingEs = await Attorney.findOne({ 
      'slug.es': updates.slug.es,
      _id: { $ne: id }
    });
    
    if (existingEn || existingEs) {
      throw new ApiError('Slug already exists', 400, 'DUPLICATE_SLUG');
    }
  }

  // Update allowed fields
  const allowedUpdates = [
    'name', 'slug', 'title', 'bio', 'specialties', 'education',
    'practiceAreas', 'contact', 'availability', 'media', 'seo',
    'displayOrder', 'isFeatured', 'isActive', 'yearsExperience'
  ];

  allowedUpdates.forEach(field => {
    if (updates[field] !== undefined) {
      attorney[field] = updates[field];
    }
  });

  attorney.updatedBy = req.user._id;

  await attorney.save();

  await attorney.populate('practiceAreas', 'name slug');
  await attorney.populate('updatedBy', 'email profile.name');

  logger.info('Attorney updated', {
    attorneyId: attorney._id,
    updatedBy: req.user._id
  });

  apiResponse.updated(res, attorney, 'Attorney updated successfully');
});

// Delete attorney (admin only)
export const deleteAttorney = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const attorney = await Attorney.findOne({ 
    _id: id, 
    isDeleted: false 
  });

  if (!attorney) {
    throw new ApiError('Attorney not found', 404, 'NOT_FOUND');
  }

  // Soft delete
  attorney.isDeleted = true;
  attorney.deletedAt = new Date();
  attorney.deletedBy = req.user._id;
  attorney.isActive = false;

  await attorney.save();

  logger.info('Attorney deleted', {
    attorneyId: attorney._id,
    deletedBy: req.user._id
  });

  apiResponse.deleted(res, 'Attorney deleted successfully');
});

// Toggle featured status (admin only)
export const toggleFeatured = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const attorney = await Attorney.findOne({ 
    _id: id, 
    isDeleted: false 
  });

  if (!attorney) {
    throw new ApiError('Attorney not found', 404, 'NOT_FOUND');
  }

  attorney.isFeatured = !attorney.isFeatured;
  attorney.updatedBy = req.user._id;

  await attorney.save();

  logger.info('Attorney featured status toggled', {
    attorneyId: attorney._id,
    isFeatured: attorney.isFeatured,
    updatedBy: req.user._id
  });

  apiResponse.success(res, {
    id: attorney._id,
    isFeatured: attorney.isFeatured
  }, `Attorney ${attorney.isFeatured ? 'featured' : 'unfeatured'} successfully`);
});

// Reorder attorneys (admin only)
export const reorderAttorneys = asyncHandler(async (req, res) => {
  const { orders } = req.body;

  if (!Array.isArray(orders)) {
    throw new ApiError('Orders must be an array', 400, 'INVALID_FORMAT');
  }

  // Update display order for each attorney
  const updatePromises = orders.map(({ id, displayOrder }) => 
    Attorney.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { displayOrder, updatedBy: req.user._id },
      { new: true }
    )
  );

  await Promise.all(updatePromises);

  logger.info('Attorneys reordered', {
    updatedBy: req.user._id,
    count: orders.length
  });

  apiResponse.success(res, null, 'Attorneys reordered successfully');
});

// List attorneys for admin (includes inactive)
export const listAttorneysAdmin = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    isActive,
    isFeatured,
    search
  } = req.query;

  // Build query for admin access
  const query = { isDeleted: false };

  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }

  if (isFeatured !== undefined) {
    query.isFeatured = isFeatured === 'true';
  }

  if (search) {
    query.$or = [
      { 'name.en': { $regex: search, $options: 'i' } },
      { 'name.es': { $regex: search, $options: 'i' } },
      { 'contact.email': { $regex: search, $options: 'i' } }
    ];
  }

  // Execute query with pagination
  const totalCount = await Attorney.countDocuments(query);
  const paginationData = pagination(page, limit, totalCount);

  const attorneys = await Attorney
    .find(query)
    .sort({ displayOrder: 1, 'name.en': 1 })
    .limit(paginationData.limit)
    .skip(paginationData.skip)
    .populate('practiceAreas', 'name')
    .populate('createdBy', 'email profile.name')
    .populate('updatedBy', 'email profile.name');

  // Get statistics
  const stats = await Attorney.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: { $sum: { $cond: ['$isActive', 1, 0] } },
        featured: { $sum: { $cond: ['$isFeatured', 1, 0] } }
      }
    }
  ]);

  const attorneyStats = stats[0] || { total: 0, active: 0, featured: 0 };

  apiResponse.success(res, {
    attorneys,
    stats: attorneyStats,
    pagination: paginationData
  }, 'Attorneys retrieved successfully');
});
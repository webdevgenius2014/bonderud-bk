import { PracticeArea } from '../models/PracticeArea.js';
import { Attorney } from '../models/Attorney.js';
import { ApiError } from '../utils/apiError.js';
import { apiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { pagination } from '../utils/pagination.js';
import logger from '../config/logger.js';

// List practice areas (public)
export const listPracticeAreas = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    parent,
    featured,
    hasAttorneys,
    search,
    sortBy = 'displayOrder',
    sortOrder = 'asc'
  } = req.query;

  // Build query for public access
  const query = { isActive: true, isDeleted: false };

  if (parent !== undefined) {
    query.parent = parent === 'null' ? null : parent;
  }

  if (featured === 'true') {
    query.isFeatured = true;
  }

  if (search) {
    query.$or = [
      { 'name.en': { $regex: search, $options: 'i' } },
      { 'name.es': { $regex: search, $options: 'i' } },
      { 'description.en': { $regex: search, $options: 'i' } },
      { 'description.es': { $regex: search, $options: 'i' } }
    ];
  }

  // Build sort object
  const sort = {};
  if (sortBy === 'displayOrder') {
    sort.displayOrder = sortOrder === 'asc' ? 1 : -1;
  } else if (sortBy === 'name') {
    sort['name.en'] = sortOrder === 'asc' ? 1 : -1;
  }

  // Execute query with pagination
  const totalCount = await PracticeArea.countDocuments(query);
  const paginationData = pagination(page, limit, totalCount);

  let practiceAreas = await PracticeArea
    .find(query)
    .sort(sort)
    .limit(paginationData.limit)
    .skip(paginationData.skip)
    .populate('parent', 'name slug')
    .populate('attorneys', 'name slug title')
    .select('-__v');

  // Filter by attorney count if requested
  if (hasAttorneys === 'true') {
    practiceAreas = practiceAreas.filter(area => area.attorneys.length > 0);
  }

  // Organize into hierarchical structure if no parent filter
  if (parent === undefined) {
    const topLevel = practiceAreas.filter(area => !area.parent);
    const children = practiceAreas.filter(area => area.parent);

    const hierarchical = topLevel.map(parent => {
      const parentObj = parent.toObject();
      parentObj.children = children
        .filter(child => child.parent._id.toString() === parent._id.toString())
        .map(child => child.toObject());
      return parentObj;
    });

    apiResponse.success(res, {
      practiceAreas: hierarchical,
      pagination: paginationData
    }, 'Practice areas retrieved successfully');
  } else {
    apiResponse.success(res, {
      practiceAreas,
      pagination: paginationData
    }, 'Practice areas retrieved successfully');
  }
});

// Get practice area by ID or slug (public)
export const getPracticeArea = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { language = 'en' } = req.query;

  let practiceArea;

  // Try to find by ObjectId first, then by slug
  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    practiceArea = await PracticeArea
      .findOne({ _id: id, isActive: true, isDeleted: false })
      .populate('parent', 'name slug')
      .populate('attorneys', 'name slug title bio media.profilePhoto')
      .populate('children', 'name slug description');
  } else {
    // Find by slug
    const slugQuery = {};
    slugQuery[`slug.${language}`] = id;
    practiceArea = await PracticeArea
      .findOne({ ...slugQuery, isActive: true, isDeleted: false })
      .populate('parent', 'name slug')
      .populate('attorneys', 'name slug title bio media.profilePhoto')
      .populate('children', 'name slug description');
  }

  if (!practiceArea) {
    throw new ApiError('Practice area not found', 404, 'NOT_FOUND');
  }

  apiResponse.success(res, practiceArea, 'Practice area retrieved successfully');
});

// Create practice area (admin only)
export const createPracticeArea = asyncHandler(async (req, res) => {
  const {
    name,
    slug,
    description,
    parent,
    services,
    faqs,
    benefits,
    process,
    documents,
    statistics,
    media,
    seo,
    displayOrder,
    isFeatured
  } = req.body;

  // Check for duplicate slugs
  if (slug) {
    const existingEn = await PracticeArea.findOne({ 'slug.en': slug.en });
    const existingEs = await PracticeArea.findOne({ 'slug.es': slug.es });
    
    if (existingEn || existingEs) {
      throw new ApiError('Slug already exists', 400, 'DUPLICATE_SLUG');
    }
  }

  // Check if parent exists
  if (parent) {
    const parentArea = await PracticeArea.findById(parent);
    if (!parentArea) {
      throw new ApiError('Parent practice area not found', 404, 'PARENT_NOT_FOUND');
    }
  }

  const practiceArea = new PracticeArea({
    name,
    slug,
    description: description || {},
    parent,
    services: services || { en: [], es: [] },
    faqs: faqs || [],
    benefits: benefits || { en: [], es: [] },
    process: process || { en: [], es: [] },
    documents: documents || { en: [], es: [] },
    statistics: statistics || [],
    media: media || {},
    seo: seo || {},
    displayOrder: displayOrder || 0,
    isFeatured: isFeatured || false,
    createdBy: req.user._id,
    updatedBy: req.user._id
  });

  await practiceArea.save();

  await practiceArea.populate('parent', 'name slug');
  await practiceArea.populate('createdBy', 'email profile.name');

  logger.info('Practice area created', {
    practiceAreaId: practiceArea._id,
    name: practiceArea.name.en,
    createdBy: req.user._id
  });

  apiResponse.created(res, practiceArea, 'Practice area created successfully');
});

// Update practice area (admin only)
export const updatePracticeArea = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const practiceArea = await PracticeArea.findOne({ 
    _id: id, 
    isDeleted: false 
  });

  if (!practiceArea) {
    throw new ApiError('Practice area not found', 404, 'NOT_FOUND');
  }

  // Check for duplicate slugs (if updating slug)
  if (updates.slug) {
    const existingEn = await PracticeArea.findOne({ 
      'slug.en': updates.slug.en,
      _id: { $ne: id }
    });
    const existingEs = await PracticeArea.findOne({ 
      'slug.es': updates.slug.es,
      _id: { $ne: id }
    });
    
    if (existingEn || existingEs) {
      throw new ApiError('Slug already exists', 400, 'DUPLICATE_SLUG');
    }
  }

  // Check if parent exists (if updating)
  if (updates.parent !== undefined) {
    if (updates.parent) {
      const parentArea = await PracticeArea.findById(updates.parent);
      if (!parentArea) {
        throw new ApiError('Parent practice area not found', 404, 'PARENT_NOT_FOUND');
      }
      
      // Prevent setting self as parent
      if (updates.parent === id) {
        throw new ApiError('Practice area cannot be its own parent', 400, 'INVALID_PARENT');
      }
    }
  }

  // Update allowed fields
  const allowedUpdates = [
    'name', 'slug', 'description', 'parent', 'services', 'faqs',
    'benefits', 'process', 'documents', 'statistics', 'media',
    'seo', 'displayOrder', 'isFeatured', 'isActive'
  ];

  allowedUpdates.forEach(field => {
    if (updates[field] !== undefined) {
      practiceArea[field] = updates[field];
    }
  });

  practiceArea.updatedBy = req.user._id;

  await practiceArea.save();

  await practiceArea.populate('parent', 'name slug');
  await practiceArea.populate('attorneys', 'name slug');
  await practiceArea.populate('updatedBy', 'email profile.name');

  logger.info('Practice area updated', {
    practiceAreaId: practiceArea._id,
    updatedBy: req.user._id
  });

  apiResponse.updated(res, practiceArea, 'Practice area updated successfully');
});

// Delete practice area (admin only)
export const deletePracticeArea = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const practiceArea = await PracticeArea.findOne({ 
    _id: id, 
    isDeleted: false 
  });

  if (!practiceArea) {
    throw new ApiError('Practice area not found', 404, 'NOT_FOUND');
  }

  // Check if practice area has children
  const childrenCount = await PracticeArea.countDocuments({
    parent: id,
    isDeleted: false
  });

  if (childrenCount > 0) {
    throw new ApiError('Cannot delete practice area with sub-areas', 400, 'HAS_CHILDREN');
  }

  // Soft delete
  practiceArea.isDeleted = true;
  practiceArea.deletedAt = new Date();
  practiceArea.deletedBy = req.user._id;
  practiceArea.isActive = false;

  await practiceArea.save();

  // Remove from attorneys
  await Attorney.updateMany(
    { practiceAreas: id },
    { $pull: { practiceAreas: id } }
  );

  logger.info('Practice area deleted', {
    practiceAreaId: practiceArea._id,
    deletedBy: req.user._id
  });

  apiResponse.deleted(res, 'Practice area deleted successfully');
});

// Associate attorneys with practice area (admin only)
export const associateAttorneys = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { attorneyIds } = req.body;

  const practiceArea = await PracticeArea.findOne({ 
    _id: id, 
    isDeleted: false 
  });

  if (!practiceArea) {
    throw new ApiError('Practice area not found', 404, 'NOT_FOUND');
  }

  // Validate attorneys exist
  const attorneys = await Attorney.find({
    _id: { $in: attorneyIds },
    isDeleted: false
  });

  if (attorneys.length !== attorneyIds.length) {
    throw new ApiError('One or more attorneys not found', 400, 'INVALID_ATTORNEYS');
  }

  // Update practice area
  practiceArea.attorneys = attorneyIds;
  practiceArea.updatedBy = req.user._id;
  await practiceArea.save();

  // Update attorneys
  await Attorney.updateMany(
    { _id: { $in: attorneyIds } },
    { $addToSet: { practiceAreas: id } }
  );

  // Remove from attorneys not in the list
  await Attorney.updateMany(
    { 
      _id: { $nin: attorneyIds },
      practiceAreas: id 
    },
    { $pull: { practiceAreas: id } }
  );

  await practiceArea.populate('attorneys', 'name slug');

  logger.info('Attorneys associated with practice area', {
    practiceAreaId: practiceArea._id,
    attorneyCount: attorneyIds.length,
    updatedBy: req.user._id
  });

  apiResponse.success(res, {
    practiceArea: {
      id: practiceArea._id,
      name: practiceArea.name,
      attorneys: practiceArea.attorneys
    }
  }, 'Attorneys associated successfully');
});

// Add FAQ to practice area (admin only)
export const addFaq = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { question, answer } = req.body;

  const practiceArea = await PracticeArea.findOne({ 
    _id: id, 
    isDeleted: false 
  });

  if (!practiceArea) {
    throw new ApiError('Practice area not found', 404, 'NOT_FOUND');
  }

  practiceArea.faqs.push({ question, answer });
  practiceArea.updatedBy = req.user._id;

  await practiceArea.save();

  const newFaq = practiceArea.faqs[practiceArea.faqs.length - 1];

  logger.info('FAQ added to practice area', {
    practiceAreaId: practiceArea._id,
    faqId: newFaq._id,
    updatedBy: req.user._id
  });

  apiResponse.success(res, newFaq, 'FAQ added successfully');
});

// Remove FAQ from practice area (admin only)
export const removeFaq = asyncHandler(async (req, res) => {
  const { id, faqId } = req.params;

  const practiceArea = await PracticeArea.findOne({ 
    _id: id, 
    isDeleted: false 
  });

  if (!practiceArea) {
    throw new ApiError('Practice area not found', 404, 'NOT_FOUND');
  }

  practiceArea.faqs = practiceArea.faqs.filter(
    faq => faq._id.toString() !== faqId
  );
  practiceArea.updatedBy = req.user._id;

  await practiceArea.save();

  logger.info('FAQ removed from practice area', {
    practiceAreaId: practiceArea._id,
    faqId,
    updatedBy: req.user._id
  });

  apiResponse.success(res, null, 'FAQ removed successfully');
});

// Reorder practice areas (admin only)
export const reorderPracticeAreas = asyncHandler(async (req, res) => {
  const { orders } = req.body;

  if (!Array.isArray(orders)) {
    throw new ApiError('Orders must be an array', 400, 'INVALID_FORMAT');
  }

  // Update display order for each practice area
  const updatePromises = orders.map(({ id, displayOrder }) => 
    PracticeArea.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { displayOrder, updatedBy: req.user._id },
      { new: true }
    )
  );

  await Promise.all(updatePromises);

  logger.info('Practice areas reordered', {
    updatedBy: req.user._id,
    count: orders.length
  });

  apiResponse.success(res, null, 'Practice areas reordered successfully');
});
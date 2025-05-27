import { CaseResult } from '../models/CaseResult.js';
import { ApiError } from '../utils/apiError.js';
import { apiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { pagination } from '../utils/pagination.js';

// List all case results with filters
export const listCaseResults = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    category,
    featured,
    startDate,
    endDate,
    search,
    sortBy = 'date',
    sortOrder = 'desc'
  } = req.query;

  // Build query
  const query = { isActive: true, isDeleted: false };

  if (category) {
    query.category = category;
  }

  if (featured !== undefined) {
    query.featured = featured === 'true';
  }

  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  // Search functionality
  if (search) {
    query.$or = [
      { 'title.en': { $regex: search, $options: 'i' } },
      { 'title.es': { $regex: search, $options: 'i' } },
      { 'description.en': { $regex: search, $options: 'i' } },
      { 'description.es': { $regex: search, $options: 'i' } }
    ];
  }

  // Build sort object
  const sort = {};
  if (sortBy === 'date') {
    sort.date = sortOrder === 'asc' ? 1 : -1;
  } else if (sortBy === 'displayOrder') {
    sort.displayOrder = sortOrder === 'asc' ? 1 : -1;
  } else if (sortBy === 'title') {
    sort['title.en'] = sortOrder === 'asc' ? 1 : -1;
  }

  // Execute query with pagination
  const totalCount = await CaseResult.countDocuments(query);
  const paginationData = pagination(page, limit, totalCount);

  const results = await CaseResult
    .find(query)
    .sort(sort)
    .limit(paginationData.limit)
    .skip(paginationData.skip)
    .populate('createdBy', 'email profile.name')
    .populate('updatedBy', 'email profile.name');

  apiResponse.success(res, {
    results,
    pagination: paginationData
  }, 'Case results retrieved successfully');
});

// Get single case result
export const getCaseResult = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await CaseResult
    .findOne({ _id: id, isActive: true, isDeleted: false })
    .populate('createdBy', 'email profile.name')
    .populate('updatedBy', 'email profile.name');

  if (!result) {
    throw new ApiError('Case result not found', 404, 'NOT_FOUND');
  }

  apiResponse.success(res, result, 'Case result retrieved successfully');
});

// Get case results by category
export const getCaseResultsByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const validCategories = ['criminal-defense', 'family-law', 'personal-injury', 'local-counsel'];
  if (!validCategories.includes(category)) {
    throw new ApiError('Invalid category', 400, 'INVALID_CATEGORY');
  }

  const query = { 
    category, 
    isActive: true, 
    isDeleted: false 
  };

  const totalCount = await CaseResult.countDocuments(query);
  const paginationData = pagination(page, limit, totalCount);

  const results = await CaseResult
    .find(query)
    .sort({ featured: -1, date: -1 })
    .limit(paginationData.limit)
    .skip(paginationData.skip)
    .populate('createdBy', 'email profile.name');

  apiResponse.success(res, {
    category,
    results,
    pagination: paginationData
  }, 'Case results by category retrieved successfully');
});

// Create new case result (admin only)
export const createCaseResult = asyncHandler(async (req, res) => {
  const {
    title,
    category,
    outcome,
    description,
    date,
    featured,
    client,
    charges,
    result,
    displayOrder,
    metadata,
    seo
  } = req.body;

  // Validate required fields
  if (!title || !title.en || !title.es) {
    throw new ApiError('Title in both languages is required', 400, 'MISSING_TITLE');
  }

  if (!outcome || !outcome.en || !outcome.es) {
    throw new ApiError('Outcome in both languages is required', 400, 'MISSING_OUTCOME');
  }

  if (!description || !description.en || !description.es) {
    throw new ApiError('Description in both languages is required', 400, 'MISSING_DESCRIPTION');
  }

  if (!result || !result.en || !result.es) {
    throw new ApiError('Result in both languages is required', 400, 'MISSING_RESULT');
  }

  // Create case result
  const caseResult = new CaseResult({
    title,
    category,
    outcome,
    description,
    date,
    featured: featured || false,
    client: client || { name: 'Confidential' },
    charges: charges || [],
    result,
    displayOrder: displayOrder || 0,
    metadata: metadata || {},
    seo: seo || {},
    createdBy: req.user._id,
    updatedBy: req.user._id
  });

  await caseResult.save();

  await caseResult.populate('createdBy', 'email profile.name');

  apiResponse.created(res, caseResult, 'Case result created successfully');
});

// Update case result (admin only)
export const updateCaseResult = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const caseResult = await CaseResult.findOne({ 
    _id: id, 
    isDeleted: false 
  });

  if (!caseResult) {
    throw new ApiError('Case result not found', 404, 'NOT_FOUND');
  }

  // Update allowed fields
  const allowedUpdates = [
    'title', 'category', 'outcome', 'description', 'date',
    'featured', 'client', 'charges', 'result', 'displayOrder',
    'isActive', 'metadata', 'seo'
  ];

  allowedUpdates.forEach(field => {
    if (updates[field] !== undefined) {
      caseResult[field] = updates[field];
    }
  });

  caseResult.updatedBy = req.user._id;

  await caseResult.save();

  await caseResult.populate('createdBy', 'email profile.name');
  await caseResult.populate('updatedBy', 'email profile.name');

  apiResponse.updated(res, caseResult, 'Case result updated successfully');
});

// Soft delete case result (admin only)
export const deleteCaseResult = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const caseResult = await CaseResult.findOne({ 
    _id: id, 
    isDeleted: false 
  });

  if (!caseResult) {
    throw new ApiError('Case result not found', 404, 'NOT_FOUND');
  }

  await caseResult.softDelete(req.user._id);

  apiResponse.deleted(res, 'Case result deleted successfully');
});

// Restore deleted case result (admin only)
export const restoreCaseResult = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const caseResult = await CaseResult.findOne({ 
    _id: id, 
    isDeleted: true 
  });

  if (!caseResult) {
    throw new ApiError('Deleted case result not found', 404, 'NOT_FOUND');
  }

  await caseResult.restore();

  apiResponse.success(res, caseResult, 'Case result restored successfully');
});

// Toggle featured status (admin only)
export const toggleFeatured = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const caseResult = await CaseResult.findOne({ 
    _id: id, 
    isDeleted: false 
  });

  if (!caseResult) {
    throw new ApiError('Case result not found', 404, 'NOT_FOUND');
  }

  caseResult.featured = !caseResult.featured;
  caseResult.updatedBy = req.user._id;

  await caseResult.save();

  apiResponse.success(res, {
    id: caseResult._id,
    featured: caseResult.featured
  }, `Case result ${caseResult.featured ? 'featured' : 'unfeatured'} successfully`);
});

// Reorder case results (admin only)
export const reorderCaseResults = asyncHandler(async (req, res) => {
  const { orders } = req.body;

  if (!Array.isArray(orders)) {
    throw new ApiError('Orders must be an array', 400, 'INVALID_FORMAT');
  }

  // Update display order for each case result
  const updatePromises = orders.map(({ id, displayOrder }) => 
    CaseResult.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { displayOrder, updatedBy: req.user._id },
      { new: true }
    )
  );

  await Promise.all(updatePromises);

  apiResponse.success(res, null, 'Case results reordered successfully');
});
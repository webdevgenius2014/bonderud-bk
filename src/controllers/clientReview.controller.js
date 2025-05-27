import { ClientReview } from '../models/ClientReview.js';
import { ApiError } from '../utils/apiError.js';
import { apiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { pagination } from '../utils/pagination.js';
import logger from '../config/logger.js';

// List approved reviews (public)
export const listReviews = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    rating,
    practiceArea,
    attorney,
    verifiedOnly,
    sortBy = 'dateApproved',
    sortOrder = 'desc',
    search
  } = req.query;

  // Build query
  const query = { status: 'approved', isDeleted: false };

  if (rating) {
    query.rating = parseInt(rating);
  }

  if (practiceArea) {
    query.practiceArea = practiceArea;
  }

  if (attorney) {
    query.attorney = attorney;
  }

  if (verifiedOnly === 'true') {
    query.verifiedClient = true;
  }

  if (search) {
    query.$or = [
      { 'title.en': { $regex: search, $options: 'i' } },
      { 'title.es': { $regex: search, $options: 'i' } },
      { 'content.en': { $regex: search, $options: 'i' } },
      { 'content.es': { $regex: search, $options: 'i' } }
    ];
  }

  // Build sort object
  const sort = {};
  if (sortBy === 'dateApproved') {
    sort.dateApproved = sortOrder === 'asc' ? 1 : -1;
  } else if (sortBy === 'rating') {
    sort.rating = sortOrder === 'asc' ? 1 : -1;
    sort.dateApproved = -1; // Secondary sort
  } else if (sortBy === 'helpful') {
    sort.helpful = sortOrder === 'asc' ? 1 : -1;
    sort.dateApproved = -1; // Secondary sort
  }

  // Execute query with pagination
  const totalCount = await ClientReview.countDocuments(query);
  const paginationData = pagination(page, limit, totalCount);

  const reviews = await ClientReview
    .find(query)
    .sort(sort)
    .limit(paginationData.limit)
    .skip(paginationData.skip)
    .populate('practiceArea', 'name slug')
    .populate('attorney', 'name slug');

  // Get rating statistics
  const stats = await ClientReview.getAverageRating();

  apiResponse.success(res, {
    reviews,
    stats,
    pagination: paginationData
  }, 'Reviews retrieved successfully');
});

// Get single review (public if approved)
export const getReview = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const review = await ClientReview
    .findById(id)
    .populate('practiceArea', 'name slug')
    .populate('attorney', 'name slug')
    .populate('responseFromFirm.respondedBy', 'email profile.name');

  if (!review) {
    throw new ApiError('Review not found', 404, 'NOT_FOUND');
  }

  // Only show approved reviews to public
  if (!req.user && review.status !== 'approved') {
    throw new ApiError('Review not found', 404, 'NOT_FOUND');
  }

  apiResponse.success(res, review, 'Review retrieved successfully');
});

// Submit new review (public with rate limiting)
export const submitReview = asyncHandler(async (req, res) => {
  const {
    reviewer,
    rating,
    title,
    content,
    practiceArea,
    attorney,
    source,
    consentToDisplay
  } = req.body;

  // Check for recent submissions from same email
  const recentReview = await ClientReview.findOne({
    'reviewer.email': reviewer.email.toLowerCase(),
    dateSubmitted: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
  }).select('_id');

  if (recentReview) {
    throw new ApiError('You can only submit one review per day', 429, 'RATE_LIMIT_EXCEEDED');
  }

  // Create review
  const review = new ClientReview({
    reviewer: {
      ...reviewer,
      email: reviewer.email.toLowerCase()
    },
    rating,
    title: title || {},
    content,
    practiceArea,
    attorney,
    source: source || 'website',
    consentToDisplay,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  await review.save();

  // TODO: Send email notifications
  // - Confirmation email to reviewer
  // - Notification to admin for moderation

  logger.info('New review submitted', {
    reviewId: review._id,
    rating: review.rating,
    email: reviewer.email
  });

  apiResponse.created(res, {
    id: review._id,
    status: review.status
  }, 'Review submitted successfully and is pending moderation');
});

// List all reviews with filters (admin only)
export const listAllReviews = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    status,
    rating,
    startDate,
    endDate,
    verifiedOnly,
    search
  } = req.query;

  // Build query
  const query = { isDeleted: false };

  if (status) {
    query.status = status;
  }

  if (rating) {
    query.rating = parseInt(rating);
  }

  if (verifiedOnly === 'true') {
    query.verifiedClient = true;
  }

  if (startDate || endDate) {
    query.dateSubmitted = {};
    if (startDate) query.dateSubmitted.$gte = new Date(startDate);
    if (endDate) query.dateSubmitted.$lte = new Date(endDate);
  }

  if (search) {
    query.$or = [
      { 'reviewer.name': { $regex: search, $options: 'i' } },
      { 'content.en': { $regex: search, $options: 'i' } },
      { 'content.es': { $regex: search, $options: 'i' } }
    ];
  }

  // Execute query with pagination
  const totalCount = await ClientReview.countDocuments(query);
  const paginationData = pagination(page, limit, totalCount);

  const reviews = await ClientReview
    .find(query)
    .sort({ dateSubmitted: -1 })
    .limit(paginationData.limit)
    .skip(paginationData.skip)
    .select('+reviewer.email +moderationNotes')
    .populate('practiceArea', 'name')
    .populate('attorney', 'name')
    .populate('moderatedBy', 'email profile.name');

  // Get counts by status
  const statusCounts = await ClientReview.aggregate([
    { $match: { isDeleted: false } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  const counts = {
    pending: 0,
    approved: 0,
    rejected: 0
  };

  statusCounts.forEach(item => {
    counts[item._id] = item.count;
  });

  apiResponse.success(res, {
    reviews,
    counts,
    pagination: paginationData
  }, 'All reviews retrieved successfully');
});

// Moderate review (admin only)
export const moderateReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { action, reason, notes } = req.body;

  const review = await ClientReview.findById(id);

  if (!review) {
    throw new ApiError('Review not found', 404, 'NOT_FOUND');
  }

  if (review.status !== 'pending') {
    throw new ApiError('Review has already been moderated', 400, 'ALREADY_MODERATED');
  }

  if (action === 'approve') {
    await review.approve(req.user._id, notes);
    
    // TODO: Send approval email to reviewer
    
    logger.info('Review approved', {
      reviewId: review._id,
      moderatedBy: req.user._id
    });

    apiResponse.success(res, review, 'Review approved successfully');
  } else if (action === 'reject') {
    if (!reason) {
      throw new ApiError('Rejection reason is required', 400, 'MISSING_REASON');
    }

    await review.reject(req.user._id, reason, notes);
    
    // TODO: Send rejection email to reviewer (optional)
    
    logger.info('Review rejected', {
      reviewId: review._id,
      moderatedBy: req.user._id,
      reason
    });

    apiResponse.success(res, review, 'Review rejected successfully');
  } else {
    throw new ApiError('Invalid action. Must be approve or reject', 400, 'INVALID_ACTION');
  }
});

// Add firm response (admin only)
export const addResponse = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  const review = await ClientReview.findById(id);

  if (!review) {
    throw new ApiError('Review not found', 404, 'NOT_FOUND');
  }

  if (review.status !== 'approved') {
    throw new ApiError('Can only respond to approved reviews', 400, 'NOT_APPROVED');
  }

  if (review.responseFromFirm && review.responseFromFirm.content) {
    throw new ApiError('Review already has a response', 400, 'RESPONSE_EXISTS');
  }

  await review.addResponse(content, req.user._id);

  await review.populate('responseFromFirm.respondedBy', 'email profile.name');

  logger.info('Response added to review', {
    reviewId: review._id,
    respondedBy: req.user._id
  });

  apiResponse.success(res, review, 'Response added successfully');
});

// Mark review as helpful (public)
export const markHelpful = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Use IP address as voter ID for anonymous users
  const voterId = req.user ? req.user._id.toString() : req.ip;

  const review = await ClientReview.findOne({
    _id: id,
    status: 'approved',
    isDeleted: false
  }).select('+helpfulVoters');

  if (!review) {
    throw new ApiError('Review not found', 404, 'NOT_FOUND');
  }

  // Check if already voted
  if (review.helpfulVoters.includes(voterId)) {
    throw new ApiError('You have already marked this review as helpful', 400, 'ALREADY_VOTED');
  }

  await review.markHelpful(voterId);

  apiResponse.success(res, {
    helpful: review.helpful
  }, 'Review marked as helpful');
});

// Delete review (admin only)
export const deleteReview = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const review = await ClientReview.findById(id);

  if (!review) {
    throw new ApiError('Review not found', 404, 'NOT_FOUND');
  }

  await review.softDelete(req.user._id);

  logger.info('Review deleted', {
    reviewId: review._id,
    deletedBy: req.user._id
  });

  apiResponse.deleted(res, 'Review deleted successfully');
});

// Toggle verified status (admin only)
export const toggleVerified = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const review = await ClientReview.findById(id);

  if (!review) {
    throw new ApiError('Review not found', 404, 'NOT_FOUND');
  }

  review.verifiedClient = !review.verifiedClient;
  await review.save();

  logger.info('Review verified status toggled', {
    reviewId: review._id,
    verifiedClient: review.verifiedClient,
    toggledBy: req.user._id
  });

  apiResponse.success(res, {
    id: review._id,
    verifiedClient: review.verifiedClient
  }, `Review ${review.verifiedClient ? 'verified' : 'unverified'} successfully`);
});

// Get review statistics (public)
export const getStatistics = asyncHandler(async (req, res) => {
  const { practiceArea, attorney } = req.query;

  const filter = {};
  if (practiceArea) filter.practiceArea = practiceArea;
  if (attorney) filter.attorney = attorney;

  const stats = await ClientReview.getAverageRating(filter);

  // Get recent reviews
  const recentReviews = await ClientReview
    .findApproved()
    .sort({ dateApproved: -1 })
    .limit(5)
    .populate('practiceArea', 'name')
    .populate('attorney', 'name');

  apiResponse.success(res, {
    ...stats,
    recentReviews
  }, 'Review statistics retrieved successfully');
});
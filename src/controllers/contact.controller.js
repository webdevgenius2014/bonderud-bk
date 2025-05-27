import { ContactSubmission } from '../models/ContactSubmission.js';
import { PracticeArea } from '../models/PracticeArea.js';
import { ApiError } from '../utils/apiError.js';
import { apiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { pagination } from '../utils/pagination.js';
import logger from '../config/logger.js';

// Submit contact form (public with rate limiting)
export const submitContact = asyncHandler(async (req, res) => {
  const {
    formType,
    contact,
    subject,
    message,
    practiceArea,
    urgency,
    preferredCallbackTime,
    source,
    consent
  } = req.body;

  // Validate practice area if provided
  if (practiceArea) {
    const existingPracticeArea = await PracticeArea.findById(practiceArea);
    if (!existingPracticeArea) {
      throw new ApiError('Practice area not found', 400, 'INVALID_PRACTICE_AREA');
    }
  }

  // Check for recent submissions from same email (spam protection)
  const recentSubmission = await ContactSubmission.findOne({
    'contact.email': contact.email.toLowerCase(),
    submittedAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // 1 hour
  }).select('_id');

  if (recentSubmission) {
    throw new ApiError('You can only submit one contact form per hour', 429, 'RATE_LIMIT_EXCEEDED');
  }

  // Create contact submission
  const submission = new ContactSubmission({
    formType: formType || 'general',
    contact: {
      ...contact,
      email: contact.email.toLowerCase()
    },
    subject,
    message,
    practiceArea,
    urgency: urgency || 'normal',
    preferredCallbackTime,
    source: {
      page: req.headers.referer || req.body.source?.page || 'Unknown',
      referrer: req.headers.referer,
      campaign: source?.campaign
    },
    consent,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  await submission.save();

  // TODO: Send email notifications
  // - Confirmation email to user
  // - Notification to admin/assigned staff
  // - SMS notification for urgent requests

  logger.info('Contact form submitted', {
    submissionId: submission._id,
    email: contact.email,
    urgency: submission.urgency,
    practiceArea: practiceArea || 'general'
  });

  apiResponse.created(res, {
    id: submission._id,
    status: submission.status,
    submittedAt: submission.submittedAt
  }, 'Contact form submitted successfully. We will get back to you soon.');
});

// List contact submissions (admin only)
export const listSubmissions = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    status,
    urgency,
    assignedTo,
    practiceArea,
    startDate,
    endDate,
    search,
    unassignedOnly
  } = req.query;

  // Build query
  const query = { isDeleted: false };

  if (status) {
    query.status = status;
  }

  if (urgency) {
    query.urgency = urgency;
  }

  if (assignedTo) {
    query.assignedTo = assignedTo;
  }

  if (unassignedOnly === 'true') {
    query.assignedTo = null;
  }

  if (practiceArea) {
    query.practiceArea = practiceArea;
  }

  if (startDate || endDate) {
    query.submittedAt = {};
    if (startDate) query.submittedAt.$gte = new Date(startDate);
    if (endDate) query.submittedAt.$lte = new Date(endDate);
  }

  if (search) {
    query.$or = [
      { 'contact.name': { $regex: search, $options: 'i' } },
      { 'contact.email': { $regex: search, $options: 'i' } },
      { subject: { $regex: search, $options: 'i' } },
      { message: { $regex: search, $options: 'i' } }
    ];
  }

  // Execute query with pagination
  const totalCount = await ContactSubmission.countDocuments(query);
  const paginationData = pagination(page, limit, totalCount);

  const submissions = await ContactSubmission
    .find(query)
    .sort({ urgency: -1, submittedAt: -1 }) // Urgent first, then newest
    .limit(paginationData.limit)
    .skip(paginationData.skip)
    .populate('practiceArea', 'name')
    .populate('assignedTo', 'email profile.name')
    .populate('notes.createdBy', 'email profile.name');

  // Get statistics
  const stats = await ContactSubmission.getStatistics();

  apiResponse.success(res, {
    submissions,
    stats,
    pagination: paginationData
  }, 'Contact submissions retrieved successfully');
});

// Get single submission (admin only)
export const getSubmission = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const submission = await ContactSubmission
    .findOne({ _id: id, isDeleted: false })
    .populate('practiceArea', 'name')
    .populate('assignedTo', 'email profile.name')
    .populate('notes.createdBy', 'email profile.name');

  if (!submission) {
    throw new ApiError('Contact submission not found', 404, 'NOT_FOUND');
  }

  // Mark as read if it's new and user is viewing it
  if (submission.status === 'new') {
    await submission.markAsRead(req.user._id);
  }

  apiResponse.success(res, submission, 'Contact submission retrieved successfully');
});

// Update submission status (admin only)
export const updateSubmissionStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const submission = await ContactSubmission.findOne({ 
    _id: id, 
    isDeleted: false 
  });

  if (!submission) {
    throw new ApiError('Contact submission not found', 404, 'NOT_FOUND');
  }

  const oldStatus = submission.status;
  submission.status = status;

  // Set responded date if marking as responded
  if (status === 'responded' && oldStatus !== 'responded') {
    submission.respondedAt = new Date();
  }

  await submission.save();

  logger.info('Contact submission status updated', {
    submissionId: submission._id,
    oldStatus,
    newStatus: status,
    updatedBy: req.user._id
  });

  apiResponse.success(res, {
    id: submission._id,
    status: submission.status,
    respondedAt: submission.respondedAt
  }, 'Submission status updated successfully');
});

// Assign submission to user (admin only)
export const assignSubmission = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { assignedTo } = req.body;

  const submission = await ContactSubmission.findOne({ 
    _id: id, 
    isDeleted: false 
  });

  if (!submission) {
    throw new ApiError('Contact submission not found', 404, 'NOT_FOUND');
  }

  await submission.assignTo(assignedTo);

  await submission.populate('assignedTo', 'email profile.name');

  logger.info('Contact submission assigned', {
    submissionId: submission._id,
    assignedTo,
    assignedBy: req.user._id
  });

  apiResponse.success(res, {
    id: submission._id,
    assignedTo: submission.assignedTo,
    status: submission.status
  }, 'Submission assigned successfully');
});

// Add note to submission (admin only)
export const addNote = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  const submission = await ContactSubmission.findOne({ 
    _id: id, 
    isDeleted: false 
  });

  if (!submission) {
    throw new ApiError('Contact submission not found', 404, 'NOT_FOUND');
  }

  await submission.addNote(content, req.user._id);

  await submission.populate('notes.createdBy', 'email profile.name');

  const newNote = submission.notes[submission.notes.length - 1];

  logger.info('Note added to contact submission', {
    submissionId: submission._id,
    noteId: newNote._id,
    addedBy: req.user._id
  });

  apiResponse.success(res, newNote, 'Note added successfully');
});

// Archive submission (admin only)
export const archiveSubmission = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const submission = await ContactSubmission.findOne({ 
    _id: id, 
    isDeleted: false 
  });

  if (!submission) {
    throw new ApiError('Contact submission not found', 404, 'NOT_FOUND');
  }

  await submission.archive();

  logger.info('Contact submission archived', {
    submissionId: submission._id,
    archivedBy: req.user._id
  });

  apiResponse.success(res, {
    id: submission._id,
    status: submission.status
  }, 'Submission archived successfully');
});

// Delete submission (admin only)
export const deleteSubmission = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const submission = await ContactSubmission.findOne({ 
    _id: id, 
    isDeleted: false 
  });

  if (!submission) {
    throw new ApiError('Contact submission not found', 404, 'NOT_FOUND');
  }

  await submission.softDelete(req.user._id);

  logger.info('Contact submission deleted', {
    submissionId: submission._id,
    deletedBy: req.user._id
  });

  apiResponse.deleted(res, 'Contact submission deleted successfully');
});

// Get submission statistics (admin only)
export const getStatistics = asyncHandler(async (req, res) => {
  const { 
    startDate, 
    endDate, 
    practiceArea, 
    assignedTo 
  } = req.query;

  const filter = {};

  if (startDate || endDate) {
    filter.submittedAt = {};
    if (startDate) filter.submittedAt.$gte = new Date(startDate);
    if (endDate) filter.submittedAt.$lte = new Date(endDate);
  }

  if (practiceArea) {
    filter.practiceArea = practiceArea;
  }

  if (assignedTo) {
    filter.assignedTo = assignedTo;
  }

  const stats = await ContactSubmission.getStatistics(filter);

  // Get recent urgent submissions
  const urgentSubmissions = await ContactSubmission
    .findUrgent()
    .where({ status: { $in: ['new', 'read'] } })
    .sort({ submittedAt: -1 })
    .limit(5)
    .populate('practiceArea', 'name')
    .select('contact.name contact.email subject urgency submittedAt');

  apiResponse.success(res, {
    ...stats,
    urgentSubmissions
  }, 'Contact submission statistics retrieved successfully');
});
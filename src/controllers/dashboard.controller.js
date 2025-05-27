import { User } from '../models/User.js';
import { Attorney } from '../models/Attorney.js';
import { PracticeArea } from '../models/PracticeArea.js';
import { CaseResult } from '../models/CaseResult.js';
import { BlogPost } from '../models/BlogPost.js';
import { ClientReview } from '../models/ClientReview.js';
import { ContactSubmission } from '../models/ContactSubmission.js';
import { apiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Get dashboard statistics (admin only)
export const getDashboardStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  // Build date filter
  const dateFilter = {};
  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
    if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
  }

  // Collect statistics
  const [
    userStats,
    attorneyStats,
    practiceAreaStats,
    caseResultStats,
    blogStats,
    reviewStats,
    contactStats
  ] = await Promise.all([
    // User statistics
    User.aggregate([
      { $match: { isDeleted: false, ...dateFilter } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: ['$isActive', 1, 0] } },
          byRole: {
            $push: '$role'
          },
          newThisMonth: {
            $sum: {
              $cond: [
                { $gte: ['$createdAt', new Date(new Date().setDate(1))] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $project: {
          total: 1,
          active: 1,
          newThisMonth: 1,
          roles: {
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
    ]),

    // Attorney statistics
    Attorney.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: ['$isActive', 1, 0] } },
          featured: { $sum: { $cond: ['$isFeatured', 1, 0] } }
        }
      }
    ]),

    // Practice Area statistics
    PracticeArea.countDocuments({ isDeleted: false }),

    // Case Result statistics
    CaseResult.aggregate([
      { $match: { isDeleted: false, ...dateFilter } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          featured: { $sum: { $cond: ['$featured', 1, 0] } }
        }
      }
    ]),

    // Blog statistics
    BlogPost.aggregate([
      { $match: { isDeleted: false, ...dateFilter } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalViews: { $sum: '$viewCount' }
        }
      }
    ]),

    // Review statistics
    ClientReview.aggregate([
      { $match: { isDeleted: false, ...dateFilter } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgRating: { $avg: '$rating' }
        }
      }
    ]),

    // Contact submission statistics
    ContactSubmission.aggregate([
      { $match: { isDeleted: false, ...dateFilter } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          byUrgency: {
            $push: '$urgency'
          }
        }
      },
      {
        $project: {
          count: 1,
          urgency: {
            normal: {
              $size: {
                $filter: {
                  input: '$byUrgency',
                  cond: { $eq: ['$$this', 'normal'] }
                }
              }
            },
            urgent: {
              $size: {
                $filter: {
                  input: '$byUrgency',
                  cond: { $eq: ['$$this', 'urgent'] }
                }
              }
            },
            emergency: {
              $size: {
                $filter: {
                  input: '$byUrgency',
                  cond: { $eq: ['$$this', 'emergency'] }
                }
              }
            }
          }
        }
      }
    ])
  ]);

  // Process results
  const stats = {
    users: userStats[0] || { total: 0, active: 0, roles: { admin: 0, editor: 0, viewer: 0 } },
    attorneys: attorneyStats[0] || { total: 0, active: 0, featured: 0 },
    practiceAreas: practiceAreaStats,
    caseResults: {
      total: caseResultStats.reduce((sum, cat) => sum + cat.count, 0),
      byCategory: caseResultStats
    },
    blog: {
      total: blogStats.reduce((sum, status) => sum + status.count, 0),
      byStatus: blogStats,
      totalViews: blogStats.reduce((sum, status) => sum + (status.totalViews || 0), 0)
    },
    reviews: {
      total: reviewStats.reduce((sum, status) => sum + status.count, 0),
      byStatus: reviewStats,
      averageRating: reviewStats.find(s => s._id === 'approved')?.avgRating || 0
    },
    contacts: {
      total: contactStats.reduce((sum, status) => sum + status.count, 0),
      byStatus: contactStats
    }
  };

  apiResponse.success(res, stats, 'Dashboard statistics retrieved successfully');
});

// Get recent activity (admin only)
export const getRecentActivity = asyncHandler(async (req, res) => {
  const { limit = 20 } = req.query;

  const [
    recentReviews,
    recentContacts,
    recentPosts,
    recentCases
  ] = await Promise.all([
    // Recent reviews
    ClientReview.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('reviewer.name rating status createdAt')
      .lean(),

    // Recent contact submissions
    ContactSubmission.find({ isDeleted: false })
      .sort({ submittedAt: -1 })
      .limit(5)
      .select('contact.name subject status urgency submittedAt')
      .lean(),

    // Recent blog posts
    BlogPost.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title status author createdAt')
      .populate('author', 'name')
      .lean(),

    // Recent case results
    CaseResult.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title category date createdAt')
      .lean()
  ]);

  // Combine and sort by date
  const activities = [
    ...recentReviews.map(r => ({
      type: 'review',
      title: `New review from ${r.reviewer.name}`,
      status: r.status,
      rating: r.rating,
      date: r.createdAt
    })),
    ...recentContacts.map(c => ({
      type: 'contact',
      title: `Contact from ${c.contact.name}`,
      subject: c.subject,
      status: c.status,
      urgency: c.urgency,
      date: c.submittedAt
    })),
    ...recentPosts.map(p => ({
      type: 'blog',
      title: p.title.en || p.title.es,
      status: p.status,
      author: p.author?.name.en || p.author?.name.es,
      date: p.createdAt
    })),
    ...recentCases.map(c => ({
      type: 'case',
      title: c.title.en || c.title.es,
      category: c.category,
      date: c.createdAt
    }))
  ]
  .sort((a, b) => b.date - a.date)
  .slice(0, parseInt(limit));

  apiResponse.success(res, activities, 'Recent activities retrieved successfully');
});

// Get performance metrics (admin only)
export const getPerformanceMetrics = asyncHandler(async (req, res) => {
  const { period = '30d' } = req.query;

  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  
  switch (period) {
    case '7d':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(startDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(startDate.getDate() - 90);
      break;
    case '1y':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
  }

  // Get metrics
  const [
    reviewMetrics,
    contactMetrics,
    blogMetrics
  ] = await Promise.all([
    // Review metrics
    ClientReview.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          isDeleted: false
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 },
          avgRating: { $avg: '$rating' }
        }
      },
      { $sort: { _id: 1 } }
    ]),

    // Contact metrics
    ContactSubmission.aggregate([
      {
        $match: {
          submittedAt: { $gte: startDate, $lte: endDate },
          isDeleted: false
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$submittedAt' }
          },
          count: { $sum: 1 },
          avgResponseTime: {
            $avg: {
              $cond: [
                { $and: ['$respondedAt', '$submittedAt'] },
                { $divide: [{ $subtract: ['$respondedAt', '$submittedAt'] }, 3600000] },
                null
              ]
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]),

    // Blog metrics
    BlogPost.aggregate([
      {
        $match: {
          publishedAt: { $gte: startDate, $lte: endDate },
          status: 'published',
          isDeleted: false
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$publishedAt' }
          },
          count: { $sum: 1 },
          totalViews: { $sum: '$viewCount' }
        }
      },
      { $sort: { _id: 1 } }
    ])
  ]);

  const metrics = {
    period,
    startDate,
    endDate,
    reviews: {
      data: reviewMetrics,
      total: reviewMetrics.reduce((sum, day) => sum + day.count, 0),
      averageRating: reviewMetrics.reduce((sum, day) => sum + day.avgRating, 0) / reviewMetrics.length || 0
    },
    contacts: {
      data: contactMetrics,
      total: contactMetrics.reduce((sum, day) => sum + day.count, 0),
      avgResponseTimeHours: contactMetrics.reduce((sum, day) => sum + (day.avgResponseTime || 0), 0) / contactMetrics.filter(d => d.avgResponseTime).length || 0
    },
    blog: {
      data: blogMetrics,
      totalPosts: blogMetrics.reduce((sum, day) => sum + day.count, 0),
      totalViews: blogMetrics.reduce((sum, day) => sum + day.totalViews, 0)
    }
  };

  apiResponse.success(res, metrics, 'Performance metrics retrieved successfully');
});
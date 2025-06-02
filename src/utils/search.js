import { Attorney } from '../models/Attorney.js';
import { PracticeArea } from '../models/PracticeArea.js';
import { BlogPost } from '../models/BlogPost.js';
import { CaseResult } from '../models/CaseResult.js';

/**
 * Global search across multiple collections
 */
export const globalSearch = async (query, options = {}) => {
  const {
    limit = 10,
    language = 'en',
    collections = ['attorneys', 'practiceAreas', 'blogPosts', 'caseResults']
  } = options;

  const searchRegex = new RegExp(query, 'i');
  const results = {};

  // Search Attorneys
  if (collections.includes('attorneys')) {
    results.attorneys = await Attorney.find({
      $and: [
        { isActive: true, isDeleted: false },
        {
          $or: [
            { [`name.${language}`]: searchRegex },
            { [`title.${language}`]: searchRegex },
            { [`bio.${language}`]: searchRegex },
            { [`specialties.${language}`]: { $in: [searchRegex] } }
          ]
        }
      ]
    })
    .select('name slug title')
    .limit(limit);
  }

  // Search Practice Areas
  if (collections.includes('practiceAreas')) {
    results.practiceAreas = await PracticeArea.find({
      $and: [
        { isActive: true, isDeleted: false },
        {
          $or: [
            { [`name.${language}`]: searchRegex },
            { [`description.${language}`]: searchRegex },
            { [`services.${language}`]: { $in: [searchRegex] } }
          ]
        }
      ]
    })
    .select('name slug description')
    .limit(limit);
  }

  // Search Blog Posts
  if (collections.includes('blogPosts')) {
    results.blogPosts = await BlogPost.find({
      $and: [
        { 
          status: 'published', 
          isDeleted: false,
          publishedAt: { $lte: new Date() }
        },
        {
          $or: [
            { [`title.${language}`]: searchRegex },
            { [`excerpt.${language}`]: searchRegex },
            { [`content.${language}`]: searchRegex },
            { [`tags.${language}`]: { $in: [searchRegex] } }
          ]
        }
      ]
    })
    .select('title slug excerpt publishedAt')
    .populate('author', 'name')
    .limit(limit);
  }

  // Search Case Results
  if (collections.includes('caseResults')) {
    results.caseResults = await CaseResult.find({
      $and: [
        { isActive: true, isDeleted: false },
        {
          $or: [
            { [`title.${language}`]: searchRegex },
            { [`description.${language}`]: searchRegex },
            { [`outcome.${language}`]: searchRegex }
          ]
        }
      ]
    })
    .select('title category outcome date')
    .limit(limit);
  }

  // Calculate total results
  const totalResults = Object.values(results).reduce(
    (sum, arr) => sum + arr.length, 
    0
  );

  return {
    query,
    totalResults,
    results
  };
};

/**
 * Search with filters and pagination
 */
export const advancedSearch = async (model, query, filters = {}, options = {}) => {
  const {
    page = 1,
    limit = 20,
    sortBy = 'relevance',
    language = 'en'
  } = options;

  // Build search query
  const searchQuery = {
    $text: { $search: query },
    isDeleted: false,
    isActive: true,
    ...filters
  };

  // Get total count
  const totalCount = await model.countDocuments(searchQuery);

  // Build sort options
  let sort = {};
  if (sortBy === 'relevance') {
    sort = { score: { $meta: 'textScore' } };
  } else if (sortBy === 'date') {
    sort = { createdAt: -1 };
  } else if (sortBy === 'name') {
    sort = { [`name.${language}`]: 1 };
  }

  // Execute search
  const results = await model
    .find(searchQuery, { score: { $meta: 'textScore' } })
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit);

  return {
    results,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      totalCount
    }
  };
};

/**
 * Autocomplete suggestions
 */
export const getAutocompleteSuggestions = async (query, options = {}) => {
  const {
    limit = 5,
    language = 'en',
    collections = ['attorneys', 'practiceAreas', 'blogPosts']
  } = options;

  const searchRegex = new RegExp(`^${query}`, 'i');
  const suggestions = [];

  // Get attorney name suggestions
  if (collections.includes('attorneys')) {
    const attorneys = await Attorney
      .find({
        [`name.${language}`]: searchRegex,
        isActive: true,
        isDeleted: false
      })
      .select(`name.${language} slug.${language}`)
      .limit(limit);

    attorneys.forEach(attorney => {
      suggestions.push({
        type: 'attorney',
        text: attorney.name[language],
        url: `/attorneys/${attorney.slug[language]}`
      });
    });
  }

  // Get practice area suggestions
  if (collections.includes('practiceAreas')) {
    const practiceAreas = await PracticeArea
      .find({
        [`name.${language}`]: searchRegex,
        isActive: true,
        isDeleted: false
      })
      .select(`name.${language} slug.${language}`)
      .limit(limit);

    practiceAreas.forEach(area => {
      suggestions.push({
        type: 'practiceArea',
        text: area.name[language],
        url: `/practice-areas/${area.slug[language]}`
      });
    });
  }

  // Get blog post title suggestions
  if (collections.includes('blogPosts')) {
    const posts = await BlogPost
      .find({
        [`title.${language}`]: searchRegex,
        status: 'published',
        isDeleted: false
      })
      .select(`title.${language} slug.${language}`)
      .limit(limit);

    posts.forEach(post => {
      suggestions.push({
        type: 'blogPost',
        text: post.title[language],
        url: `/blog/${post.slug[language]}`
      });
    });
  }

  return suggestions.slice(0, limit);
};

/**
 * Related content finder
 */
export const findRelatedContent = async (model, document, options = {}) => {
  const {
    limit = 5,
    language = 'en',
    fields = ['tags', 'categories']
  } = options;

  const query = {
    _id: { $ne: document._id },
    isDeleted: false,
    isActive: true
  };

  // Build OR conditions for related content
  const orConditions = [];

  // Related by tags
  if (fields.includes('tags') && document.tags && document.tags[language]) {
    orConditions.push({
      [`tags.${language}`]: { $in: document.tags[language] }
    });
  }

  // Related by categories
  if (fields.includes('categories') && document.categories) {
    orConditions.push({
      categories: { $in: document.categories }
    });
  }

  // Related by practice areas
  if (fields.includes('practiceAreas') && document.practiceAreas) {
    orConditions.push({
      practiceAreas: { $in: document.practiceAreas }
    });
  }

  if (orConditions.length === 0) {
    return [];
  }

  query.$or = orConditions;

  return model
    .find(query)
    .select('title slug excerpt')
    .limit(limit)
    .sort({ createdAt: -1 });
};

/**
 * Search analytics (for tracking popular searches)
 */
export const trackSearch = async (query, results, _userId = null) => {
  // In production, implement search analytics
  // Can use MongoDB, Redis, or analytics service
  
  // Example structure:
  // await SearchAnalytics.create({
  //   query,
  //   resultsCount: results.length,
  //   userId,
  //   timestamp: new Date(),
  //   ip: req.ip
  // });
  
  console.log(`Search tracked: "${query}" - ${results.length} results`);
};
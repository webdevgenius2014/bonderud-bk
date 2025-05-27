import { BlogPost } from '../models/BlogPost.js';
import { BlogCategory } from '../models/BlogCategory.js';
import { Attorney } from '../models/Attorney.js';
import { ApiError } from '../utils/apiError.js';
import { apiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { pagination } from '../utils/pagination.js';

// List published posts (public)
export const listPosts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    category,
    author,
    featured,
    tag,
    search,
    sortBy = 'publishedAt',
    sortOrder = 'desc'
  } = req.query;

  // Build query
  const query = { 
    status: 'published', 
    isDeleted: false,
    publishedAt: { $lte: new Date() }
  };

  if (category) {
    query.categories = category;
  }

  if (author) {
    query.author = author;
  }

  if (featured === 'true') {
    query.isFeatured = true;
  }

  if (tag) {
    query.$or = [
      { 'tags.en': { $in: [tag] } },
      { 'tags.es': { $in: [tag] } }
    ];
  }

  if (search) {
    query.$or = [
      { 'title.en': { $regex: search, $options: 'i' } },
      { 'title.es': { $regex: search, $options: 'i' } },
      { 'excerpt.en': { $regex: search, $options: 'i' } },
      { 'excerpt.es': { $regex: search, $options: 'i' } }
    ];
  }

  // Build sort object
  const sort = {};
  if (sortBy === 'publishedAt') {
    sort.publishedAt = sortOrder === 'asc' ? 1 : -1;
  } else if (sortBy === 'viewCount') {
    sort.viewCount = sortOrder === 'asc' ? 1 : -1;
    sort.publishedAt = -1; // Secondary sort
  } else if (sortBy === 'title') {
    sort['title.en'] = sortOrder === 'asc' ? 1 : -1;
  }

  // Execute query with pagination
  const totalCount = await BlogPost.countDocuments(query);
  const paginationData = pagination(page, limit, totalCount);

  const posts = await BlogPost
    .find(query)
    .sort(sort)
    .limit(paginationData.limit)
    .skip(paginationData.skip)
    .populate('author', 'name slug bio')
    .populate('categories', 'name slug');

  apiResponse.success(res, {
    posts,
    pagination: paginationData
  }, 'Posts retrieved successfully');
});

// Get single post by slug (public)
export const getPost = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const { language = 'en' } = req.query;

  const post = await BlogPost.findBySlug(slug, language)
    .populate('author', 'name slug bio image')
    .populate('categories', 'name slug')
    .populate('relatedPosts', 'title slug excerpt featuredImage publishedAt');

  if (!post) {
    throw new ApiError('Post not found', 404, 'NOT_FOUND');
  }

  // Increment view count (async, don't await)
  post.incrementViewCount().catch(err => {
    console.error('Failed to increment view count:', err);
  });

  // Get related posts if not manually set
  let relatedPosts = post.relatedPosts;
  if (!relatedPosts.length) {
    relatedPosts = await BlogPost.findRelated(post._id, post.categories, 3);
  }

  const result = post.toObject();
  result.relatedPosts = relatedPosts;

  apiResponse.success(res, result, 'Post retrieved successfully');
});

// Get posts by category slug (public)
export const getPostsByCategory = asyncHandler(async (req, res) => {
  const { categorySlug } = req.params;
  const { language = 'en', page = 1, limit = 10 } = req.query;

  const category = await BlogCategory.findBySlug(categorySlug, language);
  
  if (!category) {
    throw new ApiError('Category not found', 404, 'CATEGORY_NOT_FOUND');
  }

  const query = { 
    categories: category._id,
    status: 'published',
    isDeleted: false,
    publishedAt: { $lte: new Date() }
  };

  const totalCount = await BlogPost.countDocuments(query);
  const paginationData = pagination(page, limit, totalCount);

  const posts = await BlogPost
    .find(query)
    .sort({ publishedAt: -1 })
    .limit(paginationData.limit)
    .skip(paginationData.skip)
    .populate('author', 'name slug')
    .populate('categories', 'name slug');

  apiResponse.success(res, {
    category,
    posts,
    pagination: paginationData
  }, 'Posts by category retrieved successfully');
});

// Get posts by author (public)
export const getPostsByAuthor = asyncHandler(async (req, res) => {
  const { authorId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const author = await Attorney.findById(authorId);
  
  if (!author) {
    throw new ApiError('Author not found', 404, 'AUTHOR_NOT_FOUND');
  }

  const query = { 
    author: authorId,
    status: 'published',
    isDeleted: false,
    publishedAt: { $lte: new Date() }
  };

  const totalCount = await BlogPost.countDocuments(query);
  const paginationData = pagination(page, limit, totalCount);

  const posts = await BlogPost
    .find(query)
    .sort({ publishedAt: -1 })
    .limit(paginationData.limit)
    .skip(paginationData.skip)
    .populate('categories', 'name slug');

  apiResponse.success(res, {
    author,
    posts,
    pagination: paginationData
  }, 'Posts by author retrieved successfully');
});

// Search posts (public)
export const searchPosts = asyncHandler(async (req, res) => {
  const { q, page = 1, limit = 10, category, author } = req.query;

  if (!q || q.trim().length < 2) {
    throw new ApiError('Search query must be at least 2 characters', 400, 'INVALID_QUERY');
  }

  // Build query
  const query = {
    status: 'published',
    isDeleted: false,
    publishedAt: { $lte: new Date() },
    $or: [
      { 'title.en': { $regex: q, $options: 'i' } },
      { 'title.es': { $regex: q, $options: 'i' } },
      { 'content.en': { $regex: q, $options: 'i' } },
      { 'content.es': { $regex: q, $options: 'i' } },
      { 'tags.en': { $regex: q, $options: 'i' } },
      { 'tags.es': { $regex: q, $options: 'i' } }
    ]
  };

  if (category) {
    query.categories = category;
  }

  if (author) {
    query.author = author;
  }

  const totalCount = await BlogPost.countDocuments(query);
  const paginationData = pagination(page, limit, totalCount);

  const posts = await BlogPost
    .find(query)
    .sort({ publishedAt: -1 })
    .limit(paginationData.limit)
    .skip(paginationData.skip)
    .populate('author', 'name slug')
    .populate('categories', 'name slug');

  apiResponse.success(res, {
    query: q,
    posts,
    pagination: paginationData
  }, 'Search results retrieved successfully');
});

// Create post (editor/admin only)
export const createPost = asyncHandler(async (req, res) => {
  const {
    title,
    slug,
    content,
    excerpt,
    author,
    categories,
    status,
    featuredImage,
    gallery,
    tags,
    allowComments,
    isFeatured,
    seo,
    scheduledFor
  } = req.body;

  // Validate categories exist
  if (categories && categories.length > 0) {
    const existingCategories = await BlogCategory.find({
      _id: { $in: categories },
      isDeleted: false
    });
    
    if (existingCategories.length !== categories.length) {
      throw new ApiError('One or more categories not found', 400, 'INVALID_CATEGORIES');
    }
  }

  // Validate author exists
  if (author) {
    const existingAuthor = await Attorney.findById(author);
    if (!existingAuthor) {
      throw new ApiError('Author not found', 400, 'AUTHOR_NOT_FOUND');
    }
  }

  // Check for duplicate slugs
  if (slug) {
    const existingEn = await BlogPost.findOne({ 'slug.en': slug.en });
    const existingEs = await BlogPost.findOne({ 'slug.es': slug.es });
    
    if (existingEn || existingEs) {
      throw new ApiError('Slug already exists', 400, 'DUPLICATE_SLUG');
    }
  }

  const post = new BlogPost({
    title,
    slug,
    content,
    excerpt: excerpt || {},
    author,
    categories: categories || [],
    status: status || 'draft',
    featuredImage: featuredImage || {},
    gallery: gallery || [],
    tags: tags || { en: [], es: [] },
    allowComments: allowComments !== false,
    isFeatured: isFeatured || false,
    seo: seo || {},
    scheduledFor,
    createdBy: req.user._id,
    updatedBy: req.user._id
  });

  await post.save();

  await post.populate('author', 'name slug');
  await post.populate('categories', 'name slug');
  await post.populate('createdBy', 'email profile.name');

  apiResponse.created(res, post, 'Post created successfully');
});

// Update post (editor/admin only)
export const updatePost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const post = await BlogPost.findOne({ 
    _id: id, 
    isDeleted: false 
  });

  if (!post) {
    throw new ApiError('Post not found', 404, 'NOT_FOUND');
  }

  // Check permissions - only allow author or admin to edit
  if (req.user.role !== 'admin' && post.createdBy.toString() !== req.user._id.toString()) {
    throw new ApiError('Not authorized to edit this post', 403, 'NOT_AUTHORIZED');
  }

  // Validate categories exist (if updating)
  if (updates.categories) {
    const existingCategories = await BlogCategory.find({
      _id: { $in: updates.categories },
      isDeleted: false
    });
    
    if (existingCategories.length !== updates.categories.length) {
      throw new ApiError('One or more categories not found', 400, 'INVALID_CATEGORIES');
    }
  }

  // Validate author exists (if updating)
  if (updates.author) {
    const existingAuthor = await Attorney.findById(updates.author);
    if (!existingAuthor) {
      throw new ApiError('Author not found', 400, 'AUTHOR_NOT_FOUND');
    }
  }

  // Check for duplicate slugs (if updating slug)
  if (updates.slug) {
    const existingEn = await BlogPost.findOne({ 
      'slug.en': updates.slug.en,
      _id: { $ne: id }
    });
    const existingEs = await BlogPost.findOne({ 
      'slug.es': updates.slug.es,
      _id: { $ne: id }
    });
    
    if (existingEn || existingEs) {
      throw new ApiError('Slug already exists', 400, 'DUPLICATE_SLUG');
    }
  }

  // Update allowed fields
  const allowedUpdates = [
    'title', 'slug', 'content', 'excerpt', 'author', 
    'categories', 'status', 'featuredImage', 'gallery',
    'tags', 'allowComments', 'isFeatured', 'seo',
    'scheduledFor', 'relatedPosts'
  ];

  allowedUpdates.forEach(field => {
    if (updates[field] !== undefined) {
      post[field] = updates[field];
    }
  });

  post.updatedBy = req.user._id;

  await post.save();

  await post.populate('author', 'name slug');
  await post.populate('categories', 'name slug');
  await post.populate('updatedBy', 'email profile.name');

  apiResponse.updated(res, post, 'Post updated successfully');
});

// Delete post (admin only)
export const deletePost = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const post = await BlogPost.findOne({ 
    _id: id, 
    isDeleted: false 
  });

  if (!post) {
    throw new ApiError('Post not found', 404, 'NOT_FOUND');
  }

  await post.softDelete(req.user._id);

  apiResponse.deleted(res, 'Post deleted successfully');
});

// Toggle featured status (admin only)
export const toggleFeatured = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const post = await BlogPost.findOne({ 
    _id: id, 
    isDeleted: false 
  });

  if (!post) {
    throw new ApiError('Post not found', 404, 'NOT_FOUND');
  }

  post.isFeatured = !post.isFeatured;
  post.updatedBy = req.user._id;

  await post.save();

  apiResponse.success(res, {
    id: post._id,
    isFeatured: post.isFeatured
  }, `Post ${post.isFeatured ? 'featured' : 'unfeatured'} successfully`);
});

// Publish/unpublish post (editor/admin only)
export const togglePublish = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const post = await BlogPost.findOne({ 
    _id: id, 
    isDeleted: false 
  });

  if (!post) {
    throw new ApiError('Post not found', 404, 'NOT_FOUND');
  }

  if (post.status === 'published') {
    await post.unpublish();
  } else {
    await post.publish();
  }

  post.updatedBy = req.user._id;
  await post.save();

  apiResponse.success(res, {
    id: post._id,
    status: post.status
  }, `Post ${post.status === 'published' ? 'published' : 'unpublished'} successfully`);
});
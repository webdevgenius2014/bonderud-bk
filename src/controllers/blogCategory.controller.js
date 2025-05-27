import { BlogCategory } from '../models/BlogCategory.js';
import { BlogPost } from '../models/BlogPost.js';
import { ApiError } from '../utils/apiError.js';
import { apiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { pagination } from '../utils/pagination.js';

// List all active categories (public)
export const listCategories = asyncHandler(async (req, res) => {
  const { includeChildren = true, includePostCount = true } = req.query;

  let query = BlogCategory.findActive().sort({ displayOrder: 1, 'name.en': 1 });

  if (includeChildren === 'true') {
    query = query.populate('children');
  }

  if (includePostCount === 'true') {
    query = query.populate('postCount');
  }

  const categories = await query.exec();

  // Organize into hierarchical structure
  const topLevelCategories = categories.filter(cat => !cat.parent);
  const childCategories = categories.filter(cat => cat.parent);

  // Group children under parents
  const hierarchical = topLevelCategories.map(parent => {
    const children = childCategories.filter(child => 
      child.parent.toString() === parent._id.toString()
    );
    return {
      ...parent.toObject(),
      children: children.map(child => child.toObject())
    };
  });

  apiResponse.success(res, {
    categories: hierarchical,
    totalCount: categories.length
  }, 'Categories retrieved successfully');
});

// Get category with posts (public)
export const getCategoryWithPosts = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const { language = 'en', page = 1, limit = 10 } = req.query;

  const category = await BlogCategory.findBySlug(slug, language)
    .populate('children')
    .populate('postCount');

  if (!category) {
    throw new ApiError('Category not found', 404, 'NOT_FOUND');
  }

  // Get posts in this category
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
  }, 'Category with posts retrieved successfully');
});

// Create category (admin only)
export const createCategory = asyncHandler(async (req, res) => {
  const {
    name,
    slug,
    description,
    parent,
    displayOrder,
    seo
  } = req.body;

  // Check if parent exists (if provided)
  if (parent) {
    const parentCategory = await BlogCategory.findById(parent);
    if (!parentCategory) {
      throw new ApiError('Parent category not found', 404, 'PARENT_NOT_FOUND');
    }
  }

  // Check for duplicate slugs
  if (slug) {
    const existingEn = await BlogCategory.findOne({ 'slug.en': slug.en });
    const existingEs = await BlogCategory.findOne({ 'slug.es': slug.es });
    
    if (existingEn || existingEs) {
      throw new ApiError('Slug already exists', 400, 'DUPLICATE_SLUG');
    }
  }

  const category = new BlogCategory({
    name,
    slug,
    description: description || {},
    parent,
    displayOrder: displayOrder || 0,
    seo: seo || {},
    createdBy: req.user._id,
    updatedBy: req.user._id
  });

  await category.save();

  await category.populate('createdBy', 'email profile.name');
  await category.populate('parent', 'name');

  apiResponse.created(res, category, 'Category created successfully');
});

// Update category (admin only)
export const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const category = await BlogCategory.findOne({ 
    _id: id, 
    isDeleted: false 
  });

  if (!category) {
    throw new ApiError('Category not found', 404, 'NOT_FOUND');
  }

  // Check if trying to set self as parent
  if (updates.parent && updates.parent.toString() === id) {
    throw new ApiError('Category cannot be its own parent', 400, 'INVALID_PARENT');
  }

  // Check if parent exists (if provided)
  if (updates.parent) {
    const parentCategory = await BlogCategory.findById(updates.parent);
    if (!parentCategory) {
      throw new ApiError('Parent category not found', 404, 'PARENT_NOT_FOUND');
    }
  }

  // Check for duplicate slugs (if updating slug)
  if (updates.slug) {
    const existingEn = await BlogCategory.findOne({ 
      'slug.en': updates.slug.en,
      _id: { $ne: id }
    });
    const existingEs = await BlogCategory.findOne({ 
      'slug.es': updates.slug.es,
      _id: { $ne: id }
    });
    
    if (existingEn || existingEs) {
      throw new ApiError('Slug already exists', 400, 'DUPLICATE_SLUG');
    }
  }

  // Update allowed fields
  const allowedUpdates = [
    'name', 'slug', 'description', 'parent', 
    'displayOrder', 'isActive', 'seo'
  ];

  allowedUpdates.forEach(field => {
    if (updates[field] !== undefined) {
      category[field] = updates[field];
    }
  });

  category.updatedBy = req.user._id;

  await category.save();

  await category.populate('createdBy', 'email profile.name');
  await category.populate('updatedBy', 'email profile.name');
  await category.populate('parent', 'name');

  apiResponse.updated(res, category, 'Category updated successfully');
});

// Delete category (admin only)
export const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await BlogCategory.findOne({ 
    _id: id, 
    isDeleted: false 
  });

  if (!category) {
    throw new ApiError('Category not found', 404, 'NOT_FOUND');
  }

  // Check if category has posts
  const postCount = await BlogPost.countDocuments({
    categories: id,
    isDeleted: false
  });

  if (postCount > 0) {
    throw new ApiError('Cannot delete category with existing posts', 400, 'CATEGORY_HAS_POSTS');
  }

  // Check if category has children
  const childrenCount = await BlogCategory.countDocuments({
    parent: id,
    isDeleted: false
  });

  if (childrenCount > 0) {
    throw new ApiError('Cannot delete category with subcategories', 400, 'CATEGORY_HAS_CHILDREN');
  }

  await category.softDelete(req.user._id);

  apiResponse.deleted(res, 'Category deleted successfully');
});

// Reorder categories (admin only)
export const reorderCategories = asyncHandler(async (req, res) => {
  const { orders } = req.body;

  if (!Array.isArray(orders)) {
    throw new ApiError('Orders must be an array', 400, 'INVALID_FORMAT');
  }

  // Update display order for each category
  const updatePromises = orders.map(({ id, displayOrder }) => 
    BlogCategory.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { displayOrder, updatedBy: req.user._id },
      { new: true }
    )
  );

  await Promise.all(updatePromises);

  apiResponse.success(res, null, 'Categories reordered successfully');
});
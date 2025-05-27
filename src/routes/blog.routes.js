import { Router } from 'express';
import {
  listCategories,
  getCategoryWithPosts,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories
} from '../controllers/blogCategory.controller.js';
import {
  listPosts,
  getPost,
  getPostsByCategory,
  getPostsByAuthor,
  searchPosts,
  createPost,
  updatePost,
  deletePost,
  toggleFeatured,
  togglePublish
} from '../controllers/blogPost.controller.js';
import { authenticateToken, authorize } from '../middleware/auth.js';
import { validateRequest, validateQuery, validateParams } from '../middleware/validation.js';
import { blogValidation } from '../validators/blog.validator.js';

const router = Router();

// Category routes (public)
router.get(
  '/categories',
  validateQuery(blogValidation.categoriesQuery),
  listCategories
);

router.get(
  '/categories/:slug',
  validateParams(blogValidation.slugParam),
  validateQuery(blogValidation.categoryPostsQuery),
  getCategoryWithPosts
);

// Post routes (public)
router.get(
  '/posts',
  validateQuery(blogValidation.postsListQuery),
  listPosts
);

router.get(
  '/posts/search',
  validateQuery(blogValidation.searchQuery),
  searchPosts
);

router.get(
  '/posts/category/:categorySlug',
  validateParams(blogValidation.categorySlugParam),
  validateQuery(blogValidation.paginationQuery),
  getPostsByCategory
);

router.get(
  '/posts/author/:authorId',
  validateParams(blogValidation.authorIdParam),
  validateQuery(blogValidation.paginationQuery),
  getPostsByAuthor
);

router.get(
  '/posts/:slug',
  validateParams(blogValidation.slugParam),
  validateQuery(blogValidation.languageQuery),
  getPost
);

// Admin/Editor routes
router.use(authenticateToken);

// Category management (admin only)
router.post(
  '/categories',
  authorize(['admin']),
  validateRequest(blogValidation.createCategory),
  createCategory
);

router.put(
  '/categories/:id',
  authorize(['admin']),
  validateParams(blogValidation.idParam),
  validateRequest(blogValidation.updateCategory),
  updateCategory
);

router.delete(
  '/categories/:id',
  authorize(['admin']),
  validateParams(blogValidation.idParam),
  deleteCategory
);

router.post(
  '/categories/reorder',
  authorize(['admin']),
  validateRequest(blogValidation.reorderCategories),
  reorderCategories
);

// Post management (editor/admin)
router.post(
  '/posts',
  authorize(['admin', 'editor']),
  validateRequest(blogValidation.createPost),
  createPost
);

router.put(
  '/posts/:id',
  authorize(['admin', 'editor']),
  validateParams(blogValidation.idParam),
  validateRequest(blogValidation.updatePost),
  updatePost
);

router.delete(
  '/posts/:id',
  authorize(['admin']),
  validateParams(blogValidation.idParam),
  deletePost
);

router.post(
  '/posts/:id/toggle-featured',
  authorize(['admin']),
  validateParams(blogValidation.idParam),
  toggleFeatured
);

router.post(
  '/posts/:id/toggle-publish',
  authorize(['admin', 'editor']),
  validateParams(blogValidation.idParam),
  togglePublish
);

export default router;
import Joi from 'joi';

const bilingualString = Joi.object({
  en: Joi.string().required(),
  es: Joi.string().required()
});

const bilingualStringOptional = Joi.object({
  en: Joi.string().allow(''),
  es: Joi.string().allow('')
});

const bilingualSlug = Joi.object({
  en: Joi.string().pattern(/^[a-z0-9-]+$/).required(),
  es: Joi.string().pattern(/^[a-z0-9-]+$/).required()
});

const seoSchema = Joi.object({
  metaTitle: bilingualStringOptional,
  metaDescription: bilingualStringOptional,
  canonicalUrl: Joi.string().uri().allow(''),
  ogImage: Joi.string().uri().allow('')
});

export const blogValidation = {
  // Common params
  idParam: Joi.object({
    id: Joi.string().hex().length(24).required()
  }),

  slugParam: Joi.object({
    slug: Joi.string().required()
  }),

  categorySlugParam: Joi.object({
    categorySlug: Joi.string().required()
  }),

  authorIdParam: Joi.object({
    authorId: Joi.string().hex().length(24).required()
  }),

  // Query schemas
  categoriesQuery: Joi.object({
    includeChildren: Joi.boolean().default(true),
    includePostCount: Joi.boolean().default(true)
  }),

  categoryPostsQuery: Joi.object({
    language: Joi.string().valid('en', 'es').default('en'),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10)
  }),

  postsListQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10),
    category: Joi.string().hex().length(24),
    author: Joi.string().hex().length(24),
    featured: Joi.boolean(),
    tag: Joi.string().trim(),
    search: Joi.string().trim().min(2),
    sortBy: Joi.string().valid('publishedAt', 'viewCount', 'title').default('publishedAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  }),

  searchQuery: Joi.object({
    q: Joi.string().trim().min(2).required(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10),
    category: Joi.string().hex().length(24),
    author: Joi.string().hex().length(24)
  }),

  paginationQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10)
  }),

  languageQuery: Joi.object({
    language: Joi.string().valid('en', 'es').default('en')
  }),

  // Category schemas
  createCategory: Joi.object({
    name: bilingualString.required(),
    slug: bilingualSlug,
    description: bilingualStringOptional,
    parent: Joi.string().hex().length(24).allow(null),
    displayOrder: Joi.number().integer().min(0).default(0),
    seo: seoSchema
  }),

  updateCategory: Joi.object({
    name: bilingualString,
    slug: bilingualSlug,
    description: bilingualStringOptional,
    parent: Joi.string().hex().length(24).allow(null),
    displayOrder: Joi.number().integer().min(0),
    isActive: Joi.boolean(),
    seo: seoSchema
  }).min(1),

  reorderCategories: Joi.object({
    orders: Joi.array().items(
      Joi.object({
        id: Joi.string().hex().length(24).required(),
        displayOrder: Joi.number().integer().min(0).required()
      })
    ).min(1).required()
  }),

  // Post schemas
  createPost: Joi.object({
    title: bilingualString.required(),
    slug: bilingualSlug,
    content: bilingualString.required(),
    excerpt: bilingualStringOptional,
    author: Joi.string().hex().length(24).required(),
    categories: Joi.array().items(Joi.string().hex().length(24)).min(1).required(),
    status: Joi.string().valid('draft', 'published', 'archived').default('draft'),
    featuredImage: Joi.object({
      url: Joi.string().uri(),
      alt: bilingualStringOptional,
      caption: bilingualStringOptional
    }),
    gallery: Joi.array().items(
      Joi.object({
        url: Joi.string().uri().required(),
        alt: bilingualStringOptional,
        caption: bilingualStringOptional,
        order: Joi.number().integer().min(0).default(0)
      })
    ),
    tags: Joi.object({
      en: Joi.array().items(Joi.string().trim().lowercase()),
      es: Joi.array().items(Joi.string().trim().lowercase())
    }),
    allowComments: Joi.boolean().default(true),
    isFeatured: Joi.boolean().default(false),
    seo: seoSchema,
    scheduledFor: Joi.date().iso().greater('now')
  }),

  updatePost: Joi.object({
    title: bilingualString,
    slug: bilingualSlug,
    content: bilingualString,
    excerpt: bilingualStringOptional,
    author: Joi.string().hex().length(24),
    categories: Joi.array().items(Joi.string().hex().length(24)).min(1),
    status: Joi.string().valid('draft', 'published', 'archived'),
    featuredImage: Joi.object({
      url: Joi.string().uri(),
      alt: bilingualStringOptional,
      caption: bilingualStringOptional
    }),
    gallery: Joi.array().items(
      Joi.object({
        url: Joi.string().uri().required(),
        alt: bilingualStringOptional,
        caption: bilingualStringOptional,
        order: Joi.number().integer().min(0).default(0)
      })
    ),
    tags: Joi.object({
      en: Joi.array().items(Joi.string().trim().lowercase()),
      es: Joi.array().items(Joi.string().trim().lowercase())
    }),
    allowComments: Joi.boolean(),
    isFeatured: Joi.boolean(),
    seo: seoSchema,
    scheduledFor: Joi.date().iso().greater('now'),
    relatedPosts: Joi.array().items(Joi.string().hex().length(24)).max(5)
  }).min(1)
};
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

const bilingualArray = Joi.object({
  en: Joi.array().items(Joi.string()),
  es: Joi.array().items(Joi.string())
});

const faqItem = Joi.object({
  question: bilingualString.required(),
  answer: bilingualString.required()
});

const statisticItem = Joi.object({
  label: bilingualString.required(),
  value: Joi.string().required(),
  icon: Joi.string(),
  order: Joi.number().integer().min(0)
});

export const practiceAreaValidation = {
  // Query params
  listQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    parent: Joi.alternatives().try(
      Joi.string().hex().length(24),
      Joi.string().valid('null')
    ),
    featured: Joi.boolean(),
    hasAttorneys: Joi.boolean(),
    search: Joi.string().trim().min(2),
    sortBy: Joi.string().valid('displayOrder', 'name').default('displayOrder'),
    sortOrder: Joi.string().valid('asc', 'desc').default('asc')
  }),

  languageQuery: Joi.object({
    language: Joi.string().valid('en', 'es').default('en')
  }),

  // Params
  idParam: Joi.object({
    id: Joi.string().hex().length(24).required()
  }),

  idOrSlugParam: Joi.object({
    id: Joi.string().required() // Can be ObjectId or slug
  }),

  faqParams: Joi.object({
    id: Joi.string().hex().length(24).required(),
    faqId: Joi.string().hex().length(24).required()
  }),

  // Create/Update schemas
  create: Joi.object({
    name: bilingualString.required(),
    slug: bilingualSlug,
    description: bilingualString.required(),
    parent: Joi.string().hex().length(24).allow(null),
    services: bilingualArray,
    faqs: Joi.array().items(faqItem),
    benefits: bilingualArray,
    process: Joi.object({
      en: Joi.array().items(
        Joi.object({
          step: Joi.number().integer().min(1).required(),
          title: Joi.string().required(),
          description: Joi.string().required()
        })
      ),
      es: Joi.array().items(
        Joi.object({
          step: Joi.number().integer().min(1).required(),
          title: Joi.string().required(),
          description: Joi.string().required()
        })
      )
    }),
    documents: bilingualArray,
    statistics: Joi.array().items(statisticItem),
    media: Joi.object({
      icon: Joi.string(),
      featuredImage: Joi.string().uri(),
      gallery: Joi.array().items(
        Joi.object({
          url: Joi.string().uri().required(),
          title: bilingualStringOptional,
          caption: bilingualStringOptional,
          order: Joi.number().integer().min(0)
        })
      ),
      videos: Joi.array().items(
        Joi.object({
          url: Joi.string().uri().required(),
          title: bilingualString.required(),
          platform: Joi.string().valid('youtube', 'vimeo', 'other'),
          thumbnail: Joi.string().uri()
        })
      )
    }),
    seo: Joi.object({
      metaTitle: bilingualStringOptional,
      metaDescription: bilingualStringOptional,
      keywords: Joi.array().items(Joi.string().trim().lowercase()),
      structuredData: Joi.object()
    }),
    displayOrder: Joi.number().integer().min(0).default(0),
    isFeatured: Joi.boolean().default(false)
  }),

  update: Joi.object({
    name: bilingualString,
    slug: bilingualSlug,
    description: bilingualString,
    parent: Joi.string().hex().length(24).allow(null),
    services: bilingualArray,
    faqs: Joi.array().items(faqItem),
    benefits: bilingualArray,
    process: Joi.object({
      en: Joi.array().items(
        Joi.object({
          step: Joi.number().integer().min(1).required(),
          title: Joi.string().required(),
          description: Joi.string().required()
        })
      ),
      es: Joi.array().items(
        Joi.object({
          step: Joi.number().integer().min(1).required(),
          title: Joi.string().required(),
          description: Joi.string().required()
        })
      )
    }),
    documents: bilingualArray,
    statistics: Joi.array().items(statisticItem),
    media: Joi.object({
      icon: Joi.string().allow(''),
      featuredImage: Joi.string().uri().allow(''),
      gallery: Joi.array().items(
        Joi.object({
          url: Joi.string().uri().required(),
          title: bilingualStringOptional,
          caption: bilingualStringOptional,
          order: Joi.number().integer().min(0)
        })
      ),
      videos: Joi.array().items(
        Joi.object({
          url: Joi.string().uri().required(),
          title: bilingualString.required(),
          platform: Joi.string().valid('youtube', 'vimeo', 'other'),
          thumbnail: Joi.string().uri().allow('')
        })
      )
    }),
    seo: Joi.object({
      metaTitle: bilingualStringOptional,
      metaDescription: bilingualStringOptional,
      keywords: Joi.array().items(Joi.string().trim().lowercase()),
      structuredData: Joi.object()
    }),
    displayOrder: Joi.number().integer().min(0),
    isFeatured: Joi.boolean(),
    isActive: Joi.boolean()
  }).min(1),

  associateAttorneys: Joi.object({
    attorneyIds: Joi.array()
      .items(Joi.string().hex().length(24))
      .unique()
      .required()
  }),

  addFaq: Joi.object({
    question: bilingualString.required(),
    answer: bilingualString.required()
  }),

  reorder: Joi.object({
    orders: Joi.array().items(
      Joi.object({
        id: Joi.string().hex().length(24).required(),
        displayOrder: Joi.number().integer().min(0).required()
      })
    ).min(1).required()
  })
};
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

const educationItem = Joi.object({
  en: Joi.object({
    degree: Joi.string().required(),
    institution: Joi.string().required(),
    year: Joi.number().integer().min(1900).max(new Date().getFullYear())
  }),
  es: Joi.object({
    degree: Joi.string().required(),
    institution: Joi.string().required(),
    year: Joi.number().integer().min(1900).max(new Date().getFullYear())
  })
});

export const attorneyValidation = {
  // Query params
  listQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10),
    featured: Joi.boolean(),
    practiceArea: Joi.string().hex().length(24),
    search: Joi.string().trim().min(2),
    sortBy: Joi.string().valid('displayOrder', 'name', 'yearsExperience').default('displayOrder'),
    sortOrder: Joi.string().valid('asc', 'desc').default('asc')
  }),

  adminListQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    isActive: Joi.boolean(),
    isFeatured: Joi.boolean(),
    search: Joi.string().trim().min(2)
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

  // Create/Update schemas
  create: Joi.object({
    name: bilingualString.required(),
    slug: bilingualSlug,
    title: bilingualString.required(),
    bio: bilingualString.required(),
    specialties: bilingualArray,
    education: Joi.object({
      en: Joi.array().items(educationItem.required()),
      es: Joi.array().items(educationItem.required())
    }),
    practiceAreas: Joi.array().items(Joi.string().hex().length(24)),
    contact: Joi.object({
      email: Joi.string().email().required(),
      phone: Joi.string().pattern(/^\+?[\d\s-()]{10,}$/),
      officePhone: Joi.string().pattern(/^\+?[\d\s-()]{10,}$/),
      extension: Joi.string().max(10)
    }),
    availability: Joi.object({
      isAvailable: Joi.boolean().default(true),
      consultationTypes: Joi.array().items(
        Joi.string().valid('in-person', 'phone', 'video', 'email')
      ),
      schedule: bilingualStringOptional
    }),
    media: Joi.object({
      profilePhoto: Joi.string().uri(),
      coverPhoto: Joi.string().uri(),
      gallery: Joi.array().items(
        Joi.object({
          url: Joi.string().uri().required(),
          caption: bilingualStringOptional,
          order: Joi.number().integer().min(0)
        })
      ),
      documents: Joi.array().items(
        Joi.object({
          title: bilingualString.required(),
          url: Joi.string().uri().required(),
          type: Joi.string().valid('resume', 'certificate', 'license', 'other')
        })
      )
    }),
    seo: Joi.object({
      metaTitle: bilingualStringOptional,
      metaDescription: bilingualStringOptional,
      keywords: Joi.array().items(Joi.string().trim().lowercase())
    }),
    displayOrder: Joi.number().integer().min(0).default(0),
    isFeatured: Joi.boolean().default(false),
    yearsExperience: Joi.number().integer().min(0).max(100)
  }),

  update: Joi.object({
    name: bilingualString,
    slug: bilingualSlug,
    title: bilingualString,
    bio: bilingualString,
    specialties: bilingualArray,
    education: Joi.object({
      en: Joi.array().items(educationItem.required()),
      es: Joi.array().items(educationItem.required())
    }),
    practiceAreas: Joi.array().items(Joi.string().hex().length(24)),
    contact: Joi.object({
      email: Joi.string().email(),
      phone: Joi.string().pattern(/^\+?[\d\s-()]{10,}$/),
      officePhone: Joi.string().pattern(/^\+?[\d\s-()]{10,}$/),
      extension: Joi.string().max(10)
    }),
    availability: Joi.object({
      isAvailable: Joi.boolean(),
      consultationTypes: Joi.array().items(
        Joi.string().valid('in-person', 'phone', 'video', 'email')
      ),
      schedule: bilingualStringOptional
    }),
    media: Joi.object({
      profilePhoto: Joi.string().uri().allow(''),
      coverPhoto: Joi.string().uri().allow(''),
      gallery: Joi.array().items(
        Joi.object({
          url: Joi.string().uri().required(),
          caption: bilingualStringOptional,
          order: Joi.number().integer().min(0)
        })
      ),
      documents: Joi.array().items(
        Joi.object({
          title: bilingualString.required(),
          url: Joi.string().uri().required(),
          type: Joi.string().valid('resume', 'certificate', 'license', 'other')
        })
      )
    }),
    seo: Joi.object({
      metaTitle: bilingualStringOptional,
      metaDescription: bilingualStringOptional,
      keywords: Joi.array().items(Joi.string().trim().lowercase())
    }),
    displayOrder: Joi.number().integer().min(0),
    isFeatured: Joi.boolean(),
    isActive: Joi.boolean(),
    yearsExperience: Joi.number().integer().min(0).max(100)
  }).min(1),

  reorder: Joi.object({
    orders: Joi.array().items(
      Joi.object({
        id: Joi.string().hex().length(24).required(),
        displayOrder: Joi.number().integer().min(0).required()
      })
    ).min(1).required()
  })
};
import Joi from 'joi';

const bilingualString = Joi.object({
  en: Joi.string().required(),
  es: Joi.string().required()
});

const bilingualStringOptional = Joi.object({
  en: Joi.string().allow(''),
  es: Joi.string().allow('')
});

export const caseResultValidation = {
  listQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    category: Joi.string().valid('criminal-defense', 'family-law', 'personal-injury', 'local-counsel'),
    featured: Joi.boolean(),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().greater(Joi.ref('startDate')),
    search: Joi.string().trim().min(2),
    sortBy: Joi.string().valid('date', 'displayOrder', 'title').default('date'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  }),

  paginationQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
  }),

  idParam: Joi.object({
    id: Joi.string().hex().length(24).required()
  }),

  categoryParam: Joi.object({
    category: Joi.string().valid('criminal-defense', 'family-law', 'personal-injury', 'local-counsel').required()
  }),

  create: Joi.object({
    title: bilingualString.required(),
    category: Joi.string().valid('criminal-defense', 'family-law', 'personal-injury', 'local-counsel').required(),
    outcome: bilingualString.required(),
    description: bilingualString.required(),
    date: Joi.date().iso().required(),
    featured: Joi.boolean().default(false),
    client: Joi.object({
      name: Joi.string().trim().default('Confidential'),
      testimonial: bilingualStringOptional
    }),
    charges: Joi.array().items(bilingualString),
    result: bilingualString.required(),
    displayOrder: Joi.number().integer().min(0).default(0),
    metadata: Joi.object({
      court: Joi.string().trim().allow(''),
      caseNumber: Joi.string().trim().allow(''),
      judge: Joi.string().trim().allow('')
    }),
    seo: Joi.object({
      metaTitle: bilingualStringOptional,
      metaDescription: bilingualStringOptional,
      keywords: Joi.array().items(Joi.string().trim().lowercase())
    })
  }),

  update: Joi.object({
    title: bilingualString,
    category: Joi.string().valid('criminal-defense', 'family-law', 'personal-injury', 'local-counsel'),
    outcome: bilingualString,
    description: bilingualString,
    date: Joi.date().iso(),
    featured: Joi.boolean(),
    client: Joi.object({
      name: Joi.string().trim(),
      testimonial: bilingualStringOptional
    }),
    charges: Joi.array().items(bilingualString),
    result: bilingualString,
    displayOrder: Joi.number().integer().min(0),
    isActive: Joi.boolean(),
    metadata: Joi.object({
      court: Joi.string().trim().allow(''),
      caseNumber: Joi.string().trim().allow(''),
      judge: Joi.string().trim().allow('')
    }),
    seo: Joi.object({
      metaTitle: bilingualStringOptional,
      metaDescription: bilingualStringOptional,
      keywords: Joi.array().items(Joi.string().trim().lowercase())
    })
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
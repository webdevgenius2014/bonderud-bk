import Joi from 'joi';

const bilingualStringOptional = Joi.object({
  en: Joi.string().allow(''),
  es: Joi.string().allow('')
});

export const reviewValidation = {
  listQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    rating: Joi.number().integer().min(1).max(5),
    practiceArea: Joi.string().hex().length(24),
    attorney: Joi.string().hex().length(24),
    verifiedOnly: Joi.boolean(),
    sortBy: Joi.string().valid('dateApproved', 'rating', 'helpful').default('dateApproved'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
    search: Joi.string().trim().min(2)
  }),

  statsQuery: Joi.object({
    practiceArea: Joi.string().hex().length(24),
    attorney: Joi.string().hex().length(24)
  }),

  adminListQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    status: Joi.string().valid('pending', 'approved', 'rejected'),
    rating: Joi.number().integer().min(1).max(5),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().greater(Joi.ref('startDate')),
    verifiedOnly: Joi.boolean(),
    search: Joi.string().trim().min(2)
  }),

  idParam: Joi.object({
    id: Joi.string().hex().length(24).required()
  }),

  submit: Joi.object({
    reviewer: Joi.object({
      name: Joi.string().trim().min(2).max(100).required(),
      email: Joi.string().email().required(),
      phone: Joi.string().pattern(/^\+?[\d\s-()]{10,}$/).allow(''),
      location: Joi.object({
        city: Joi.string().trim().max(50),
        state: Joi.string().trim().max(50)
      })
    }).required(),
    rating: Joi.number().integer().min(1).max(5).required(),
    title: bilingualStringOptional,
    content: Joi.object({
      en: Joi.string().trim().min(10).max(2000).required(),
      es: Joi.string().trim().min(10).max(2000).required()
    }).required(),
    practiceArea: Joi.string().hex().length(24),
    attorney: Joi.string().hex().length(24),
    source: Joi.string().valid('website', 'google', 'avvo', 'other'),
    consentToDisplay: Joi.boolean().valid(true).required()
      .messages({
        'any.only': 'You must consent to display your review'
      })
  }),

  moderate: Joi.object({
    action: Joi.string().valid('approve', 'reject').required(),
    reason: Joi.when('action', {
      is: 'reject',
      then: Joi.string().trim().min(5).max(500).required(),
      otherwise: Joi.string().allow('')
    }),
    notes: Joi.string().trim().max(500).allow('')
  }),

  respond: Joi.object({
    content: Joi.object({
      en: Joi.string().trim().min(10).max(1000).required(),
      es: Joi.string().trim().min(10).max(1000).required()
    }).required()
  })
};
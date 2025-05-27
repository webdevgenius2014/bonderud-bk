import Joi from 'joi';

export const contactValidation = {
  submit: Joi.object({
    formType: Joi.string().valid('general', 'consultation', 'callback').default('general'),
    contact: Joi.object({
      name: Joi.string().trim().min(2).max(100).required(),
      email: Joi.string().email().required(),
      phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]{10,}$/).required(),
      preferredContact: Joi.string().valid('email', 'phone', 'either').default('either')
    }).required(),
    subject: Joi.string().trim().min(5).max(200).required(),
    message: Joi.string().trim().min(10).max(2000).required(),
    practiceArea: Joi.string().hex().length(24),
    urgency: Joi.string().valid('normal', 'urgent', 'emergency').default('normal'),
    preferredCallbackTime: Joi.object({
      date: Joi.date().iso().greater('now'),
      timeSlot: Joi.string().valid('morning', 'afternoon', 'evening')
    }),
    source: Joi.object({
      page: Joi.string().uri().max(500),
      referrer: Joi.string().uri().max(500),
      campaign: Joi.string().trim().max(100)
    }),
    consent: Joi.object({
      termsAccepted: Joi.boolean().valid(true).required()
        .messages({
          'any.only': 'You must accept the terms and conditions'
        }),
      marketingOptIn: Joi.boolean().default(false)
    }).required()
  }),

  listQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    status: Joi.string().valid('new', 'read', 'responded', 'archived'),
    urgency: Joi.string().valid('normal', 'urgent', 'emergency'),
    assignedTo: Joi.string().hex().length(24),
    practiceArea: Joi.string().hex().length(24),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().greater(Joi.ref('startDate')),
    search: Joi.string().trim().min(2),
    unassignedOnly: Joi.boolean()
  }),

  statsQuery: Joi.object({
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().greater(Joi.ref('startDate')),
    practiceArea: Joi.string().hex().length(24),
    assignedTo: Joi.string().hex().length(24)
  }),

  idParam: Joi.object({
    id: Joi.string().hex().length(24).required()
  }),

  updateStatus: Joi.object({
    status: Joi.string().valid('new', 'read', 'responded', 'archived').required()
  }),

  assign: Joi.object({
    assignedTo: Joi.string().hex().length(24).required()
  }),

  addNote: Joi.object({
    content: Joi.string().trim().min(5).max(1000).required()
  })
};
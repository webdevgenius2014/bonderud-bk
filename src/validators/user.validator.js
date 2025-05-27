import Joi from 'joi';

const bilingualName = Joi.object({
  en: Joi.string().trim().min(2).max(100).required(),
  es: Joi.string().trim().min(2).max(100).required()
});

const profileSchema = Joi.object({
  name: bilingualName.required(),
  phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]{10,}$/).allow(''),
  preferredLanguage: Joi.string().valid('en', 'es').default('en'),
  timezone: Joi.string().default('America/New_York')
});

const validPermissions = [
  'users.create', 'users.read', 'users.update', 'users.delete',
  'attorneys.create', 'attorneys.read', 'attorneys.update', 'attorneys.delete',
  'practice-areas.create', 'practice-areas.read', 'practice-areas.update', 'practice-areas.delete',
  'blog.create', 'blog.read', 'blog.update', 'blog.delete',
  'case-results.create', 'case-results.read', 'case-results.update', 'case-results.delete',
  'contacts.read', 'contacts.update', 'contacts.delete',
  'settings.read', 'settings.update',
  'analytics.read'
];

export const userValidation = {
  listQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    role: Joi.string().valid('admin', 'editor', 'viewer'),
    isActive: Joi.boolean(),
    search: Joi.string().trim().min(2),
    sortBy: Joi.string().valid('createdAt', 'name', 'email', 'lastLogin').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  }),

  idParam: Joi.object({
    id: Joi.string().hex().length(24).required()
  }),

  create: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      }),
    role: Joi.string().valid('admin', 'editor', 'viewer').default('viewer'),
    profile: profileSchema.required(),
    isActive: Joi.boolean().default(true)
  }),

  update: Joi.object({
    email: Joi.string().email(),
    role: Joi.string().valid('admin', 'editor', 'viewer'),
    profile: profileSchema,
    isActive: Joi.boolean(),
    permissions: Joi.array().items(
      Joi.string().valid(...validPermissions)
    ).unique()
  }).min(1),

  updatePermissions: Joi.object({
    permissions: Joi.array()
      .items(Joi.string().valid(...validPermissions))
      .unique()
      .required()
  })
};
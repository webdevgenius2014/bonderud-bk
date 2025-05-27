import Joi from 'joi';

export const authValidation = {
  register: Joi.object({
    email: Joi.string().email().required().lowercase(),
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      }),
    profile: Joi.object({
      name: Joi.object({
        en: Joi.string().min(2).max(100).required(),
        es: Joi.string().min(2).max(100).required()
      }).required(),
      phone: Joi.string().pattern(/^\+?[\d\s-()]+$/).allow(''),
      preferredLanguage: Joi.string().valid('en', 'es').default('en')
    }).required()
  }),

  login: Joi.object({
    email: Joi.string().email().required().lowercase(),
    password: Joi.string().required()
  }),

  logout: Joi.object({
    refreshToken: Joi.string().required()
  }),

  refreshToken: Joi.object({
    refreshToken: Joi.string().required()
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required().lowercase()
  }),

  resetPassword: Joi.object({
    token: Joi.string().required(),
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      })
  }),

  verifyEmail: Joi.object({
    token: Joi.string().required()
  }),

  updateProfile: Joi.object({
    profile: Joi.object({
      name: Joi.object({
        en: Joi.string().min(2).max(100),
        es: Joi.string().min(2).max(100)
      }),
      phone: Joi.string().pattern(/^\+?[\d\s-()]+$/).allow(''),
      preferredLanguage: Joi.string().valid('en', 'es')
    })
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      })
  })
};
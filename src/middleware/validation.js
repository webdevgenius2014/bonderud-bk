import { ApiError } from '../utils/apiError.js';

export const validateRequest = (schema) => (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return next(new ApiError('Validation error', 400, 'VALIDATION_ERROR', errors));
    }

    req.body = value;
    return next();
  };

export const validateQuery = (schema) => (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return next(new ApiError('Validation error', 400, 'VALIDATION_ERROR', errors));
    }

    req.query = value;
    return next();
  };

export const validateParams = (schema) => (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return next(new ApiError('Validation error', 400, 'VALIDATION_ERROR', errors));
    }

    req.params = value;
    return next();
  };
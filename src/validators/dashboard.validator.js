import Joi from 'joi';

export const dashboardValidation = {
  statsQuery: Joi.object({
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().greater(Joi.ref('startDate'))
  }),

  activityQuery: Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(20)
  }),

  metricsQuery: Joi.object({
    period: Joi.string().valid('7d', '30d', '90d', '1y').default('30d')
  })
};
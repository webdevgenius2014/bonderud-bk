import { Router } from 'express';
import { env } from '../config/env.js';
import { swaggerUi, swaggerSpec } from '../swagger/swagger.js';
import authRoutes from './auth.routes.js';
import caseResultRoutes from './caseResult.routes.js';
import clientReviewRoutes from './clientReview.routes.js';
import blogRoutes from './blog.routes.js';
import contactRoutes from './contact.routes.js';
import userRoutes from './user.routes.js';
import attorneyRoutes from './attorney.routes.js';
import practiceAreaRoutes from './practiceArea.routes.js';
import dashboardRoutes from './dashboard.routes.js';

const router = Router();

// Swagger documentation
router.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API routes
router.use(`${env.API_PREFIX}/${env.API_VERSION}/auth`, authRoutes);
router.use(`${env.API_PREFIX}/${env.API_VERSION}/case-results`, caseResultRoutes);
router.use(`${env.API_PREFIX}/${env.API_VERSION}/reviews`, clientReviewRoutes);
router.use(`${env.API_PREFIX}/${env.API_VERSION}/blog`, blogRoutes);
router.use(`${env.API_PREFIX}/${env.API_VERSION}/contact`, contactRoutes);
router.use(`${env.API_PREFIX}/${env.API_VERSION}/users`, userRoutes);
router.use(`${env.API_PREFIX}/${env.API_VERSION}/attorneys`, attorneyRoutes);
router.use(`${env.API_PREFIX}/${env.API_VERSION}/practice-areas`, practiceAreaRoutes);
router.use(`${env.API_PREFIX}/${env.API_VERSION}/dashboard`, dashboardRoutes);

router.get(`${env.API_PREFIX}/${env.API_VERSION}`, (_req, res) => {
  res.json({
    message: 'Bonderud Law Firm API',
    version: env.API_VERSION,
    endpoints: {
      health: '/health',
      docs: '/api/docs',
      auth: `${env.API_PREFIX}/${env.API_VERSION}/auth`,
      caseResults: `${env.API_PREFIX}/${env.API_VERSION}/case-results`,
      reviews: `${env.API_PREFIX}/${env.API_VERSION}/reviews`,
      blog: `${env.API_PREFIX}/${env.API_VERSION}/blog`,
      contact: `${env.API_PREFIX}/${env.API_VERSION}/contact`,
      users: `${env.API_PREFIX}/${env.API_VERSION}/users`,
      attorneys: `${env.API_PREFIX}/${env.API_VERSION}/attorneys`,
      practiceAreas: `${env.API_PREFIX}/${env.API_VERSION}/practice-areas`,
      dashboard: `${env.API_PREFIX}/${env.API_VERSION}/dashboard`,
    },
  });
});

export default router;
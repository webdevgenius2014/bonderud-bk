import { Router } from 'express';
import env from '../config/env.js';

const router = Router();

router.get(`${env.API_PREFIX}/${env.API_VERSION}`, (req, res) => {
  res.json({
    message: 'Bonderud Law Firm API',
    version: env.API_VERSION,
    endpoints: {
      health: '/health',
      docs: `${env.API_PREFIX}/${env.API_VERSION}/docs`,
    },
  });
});

export default router;
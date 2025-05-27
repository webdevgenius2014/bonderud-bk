import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import { errorHandler } from './errorHandler.js';
import { notFound } from './notFound.js';
import { requestLogger } from './requestLogger.js';
import env from '../config/env.js';
import logger from '../config/logger.js';

export function setupMiddleware(app) {
  app.set('trust proxy', 1);

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  const corsOrigins = env.CORS_ORIGIN.split(',').map(origin => origin.trim());
  app.use(cors({
    origin: corsOrigins,
    credentials: env.CORS_CREDENTIALS,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  }));

  app.use(compression());

  const limiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX_REQUESTS,
    message: {
      error: 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);

  app.use(mongoSanitize());

  app.use(express.json({ 
    limit: '10mb',
    verify: (_req, _res, buf) => {
      try {
        JSON.parse(buf.toString());
      } catch (e) {
        throw new Error('Invalid JSON');
      }
    }
  }));
  
  app.use(express.urlencoded({ 
    extended: true, 
    limit: '10mb' 
  }));

  app.use(cookieParser());

  if (env.NODE_ENV !== 'test') {
    app.use(morgan('combined', { 
      stream: logger.stream,
      skip: (_req, res) => res.statusCode < 400
    }));
  }

  app.use(requestLogger);

  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: env.NODE_ENV,
      version: process.env['npm_package_version'] || '1.0.0',
    });
  });

  app.get('/', (_req, res) => {
    res.json({
      message: 'Bonderud Law Firm API',
      version: '1.0.0',
      documentation: '/api/docs',
      health: '/health',
    });
  });
}

export function setupErrorHandling(app) {
  app.use(notFound);
  app.use(errorHandler);
}
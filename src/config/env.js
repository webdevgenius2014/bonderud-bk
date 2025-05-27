import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)).default('3000'),
  HOST: z.string().default('localhost'),
  
  MONGODB_URI: z.string().min(1, 'MongoDB URI is required'),
  MONGODB_TEST_URI: z.string().optional(),
  
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT refresh secret must be at least 32 characters'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  
  BCRYPT_SALT_ROUNDS: z.string().transform(Number).pipe(z.number().min(10).max(15)).default('12'),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).pipe(z.number().positive()).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).pipe(z.number().positive()).default('100'),
  
  CORS_ORIGIN: z.string().default('http://localhost:5000'),
  CORS_CREDENTIALS: z.string().transform(val => val === 'true').default('true'),
  
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).pipe(z.number().positive()).optional(),
  SMTP_SECURE: z.string().transform(val => val === 'true').optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  
  MAX_FILE_SIZE: z.string().transform(Number).pipe(z.number().positive()).default('5242880'),
  UPLOAD_PATH: z.string().default('uploads/'),
  
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FILE_PATH: z.string().default('logs/'),
  LOG_MAX_SIZE: z.string().default('20m'),
  LOG_MAX_FILES: z.string().default('14d'),
  
  API_VERSION: z.string().default('v1'),
  API_PREFIX: z.string().default('/api'),
  
  SESSION_SECRET: z.string().min(32, 'Session secret must be at least 32 characters'),
  SESSION_MAX_AGE: z.string().transform(Number).pipe(z.number().positive()).default('86400000'),
  
  COMPANY_NAME: z.string().default('Bonderud Law Firm'),
  COMPANY_EMAIL: z.string().email().default('info@bounderudlaw.com'),
  COMPANY_PHONE: z.string().default('+1-555-0123'),
  SUPPORT_EMAIL: z.string().email().default('support@bounderudlaw.com'),
});

function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new Error(`Environment validation failed:\n${missingVars.join('\n')}`);
    }
    throw error;
  }
}

export const env = validateEnv();

export default env;
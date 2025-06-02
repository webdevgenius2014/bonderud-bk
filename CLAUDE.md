# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Bonderud Law Firm API

## Project Overview
This is a REST API for the Bonderud Law Firm's bilingual (English/Spanish) website. The API is built with Node.js, Express.js, and MongoDB, featuring JWT authentication, role-based access control, and comprehensive security measures.

## Essential Commands
```bash
# Development
npm run dev          # Start with nodemon hot reload
npm start            # Production mode

# Testing
npm test             # Run all tests with Jest
npm run test:unit    # Run unit tests only  
npm run test:integration # Run integration tests only
npm run test:coverage    # Run tests with coverage report
npm run test:watch   # Watch mode for development

# Code Quality  
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues automatically
npm run format       # Format code with Prettier

# Build & Deploy
npm run build        # Lint and test (CI/CD)
npm run seed         # Seed database with sample data
npm run deploy       # Deploy using scripts/deploy.sh

# PM2 Process Management
npm run pm2:start    # Start with PM2
npm run pm2:restart  # Restart PM2 process
npm run pm2:logs     # View PM2 logs
```

## Architecture Overview

### Tech Stack
- **Runtime**: Node.js v18+ (ES6 modules with `"type": "module"`)
- **Framework**: Express.js with comprehensive middleware stack
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (access + refresh tokens)
- **Validation**: Zod for environment validation, Joi for API validation
- **Security**: Helmet, CORS, rate limiting, mongo-sanitize, bcrypt
- **Testing**: Jest with MongoDB Memory Server
- **Logging**: Winston with daily rotation
- **File Handling**: Multer for uploads
- **Documentation**: Swagger/OpenAPI

### Project Structure
```
src/
├── config/          # Configuration files
│   ├── database.js  # MongoDB connection with retry logic
│   ├── env.js       # Environment config with Zod validation
│   └── logger.js    # Winston logger setup
├── controllers/     # Business logic
│   └── base.controller.js  # Base CRUD controller template
├── middleware/      # Express middleware
│   ├── errorHandler.js     # Global error handling
│   ├── requestLogger.js    # Morgan request logging
│   └── notFound.js         # 404 handler
├── models/          # Mongoose schemas
│   ├── User.js      # User with auth & permissions
│   ├── Attorney.js  # Attorney profiles
│   └── PracticeArea.js  # Legal practice areas
├── routes/          # API routes
│   └── index.js     # Route definitions (minimal)
├── swagger/         # API documentation
├── utils/           # Utility functions
│   ├── apiError.js  # Custom error classes
│   ├── apiResponse.js  # Standardized responses
│   ├── asyncHandler.js # Promise error wrapper
│   └── pagination.js   # Pagination helper
└── server.js        # Application entry point
```

## Key Features

### 1. Authentication & Authorization
- **JWT-based**: Access tokens (15min) + Refresh tokens (7d)
- **Roles**: admin, editor, viewer
- **Permissions**: Granular permission system
- **Security**: Password hashing, account locking, 2FA support

### 2. Data Models

#### User Model
- Authentication (email, password, verification)
- Profile (bilingual name, phone, avatar)
- Permissions & roles
- Security (login attempts, last login, 2FA)
- Soft deletion support

#### Attorney Model
- Personal info & credentials
- Bilingual content (bio, specialties, education)
- Practice areas & availability
- Media (photos, documents)
- SEO optimization fields

#### Practice Area Model
- Hierarchical structure (parent/child)
- Bilingual content throughout
- Services, FAQs, statistics
- Attorney associations
- Media galleries
- SEO & structured data

### 3. Security Features
- Helmet.js security headers
- CORS with whitelist
- Rate limiting (100 req/15min)
- MongoDB injection protection
- Input sanitization
- Request size limits
- Secure JWT handling

### 4. API Response Format
```javascript
// Success
{
  "success": true,
  "data": { ... },
  "pagination": { ... }  // if applicable
}

// Error
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "statusCode": 400
  }
}
```

## Environment Configuration

Environment variables are validated using Zod schema in `src/config/env.js`. All variables are type-checked and have sensible defaults where applicable.

Critical variables (no defaults):
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Must be 32+ characters
- `JWT_REFRESH_SECRET`: Must be 32+ characters  
- `SESSION_SECRET`: Must be 32+ characters

Important variables with defaults:
- `NODE_ENV`: development/production/test (default: development)
- `PORT`: Server port (default: 3000)
- `BCRYPT_SALT_ROUNDS`: Password hashing rounds (default: 12)
- `RATE_LIMIT_MAX_REQUESTS`: Max requests per window (default: 100)
- `CORS_ORIGIN`: Allowed origins (default: http://localhost:5000)

## Development Guidelines

### BaseController Pattern

All controllers extend `BaseController` which provides standard CRUD operations:

```javascript
import { BaseController } from './base.controller.js';
import { User } from '../models/User.js';

class UserController extends BaseController {
  constructor() {
    super(User, 'User');
  }

  // Inherit: getAll, getById, create, update, delete
  // Override or add custom methods as needed
}
```

### Adding New Endpoints
1. Create controller extending `BaseController` in `src/controllers/`
2. Create route file in `src/routes/` 
3. Add Joi validation in `src/validators/`
4. Register route in `src/routes/index.js`

### Common Patterns
```javascript
// Standard response format (from utils/apiResponse.js)
res.status(200).json(ApiResponse.success(data));
res.status(201).json(ApiResponse.created(item));
res.status(200).json(ApiResponse.updated(item));

// Error handling (from utils/apiError.js)  
throw ApiError.notFound('Resource not found');
throw ApiError.badRequest('Invalid input');
throw ApiError.unauthorized('Token required');

// Pagination (built into BaseController)
const options = Pagination.getOptions(req.query);
const result = Pagination.createResult(items, total, page, limit);
```

### Database Operations
- Always use Mongoose methods
- Implement proper error handling
- Use transactions for multi-document updates
- Index frequently queried fields

## Testing Architecture

Uses Jest with MongoDB Memory Server for isolated testing:

```bash
# Test structure
tests/
├── setup.js              # Global test setup
├── helpers/               # Test utilities (auth, db, request helpers)
├── unit/                  # Unit tests (models, middleware, utils)
├── integration/           # API endpoint tests
└── fixtures/              # Test data

# Key test helpers
- `auth.helper.js`: Generate JWT tokens for testing
- `db.helper.js`: Database setup/teardown
- `request.helper.js`: API request utilities
```

Test files use `*.test.js` naming convention. Tests run with `NODE_OPTIONS=--experimental-vm-modules` for ES module support.

## ES Modules & Import Patterns

This project uses ES6 modules (`"type": "module"` in package.json):

```javascript
// File extensions required for local imports
import { User } from '../models/User.js';  // ✓ Correct
import { User } from '../models/User';     // ✗ Missing .js

// Named imports from utils/index.js barrel export
import { ApiResponse, ApiError, Pagination } from '../utils/index.js';

// Environment config
import env from '../config/env.js';
```

## Key Architecture Decisions

- **Centralized Error Handling**: All errors go through `middleware/errorHandler.js`
- **Standardized Responses**: All API responses use `ApiResponse` class
- **Environment Validation**: Startup fails if required env vars missing/invalid
- **Base Controller**: CRUD operations inherited, extend for custom logic  
- **Middleware Stack**: Security-first approach with rate limiting, sanitization
- **Bilingual Support**: Models support `en`/`es` content throughout

## Debugging & Development

```bash
# Logs are in logs/ directory with daily rotation
tail -f logs/error.log
tail -f logs/combined.log

# MongoDB shell access  
mongosh $MONGODB_URI

# Check environment validation
node -e "import('./src/config/env.js')"

# Run linting before commits
npm run lint && npm run test
```

## Important Notes

- **Environment**: Server fails to start if env validation fails
- **File Extensions**: Required for ES module imports (`.js`)
- **Base Controller**: Inherit from `BaseController` for standard CRUD
- **Testing**: Use `tests/helpers/` for auth tokens, DB setup
- **API Docs**: Available at `/api-docs` when server running
- **Logs**: Winston with daily rotation in `logs/` directory

---
*This codebase uses ES6 modules, Zod validation, and follows RESTful conventions*
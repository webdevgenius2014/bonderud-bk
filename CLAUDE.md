# Bonderud Law Firm API - Project Memory

## Project Overview
This is a REST API for the Bonderud Law Firm's bilingual (English/Spanish) website. The API is built with Node.js, Express.js, and MongoDB, featuring JWT authentication, role-based access control, and comprehensive security measures.

## Quick Start
```bash
# Install dependencies
npm install

# Development mode with hot reload
npm run dev

# Production mode
npm start

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix
```

## Architecture Overview

### Tech Stack
- **Runtime**: Node.js v18+ (ES6 modules)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (access + refresh tokens)
- **Security**: Helmet, CORS, rate limiting, sanitization
- **Logging**: Winston with daily rotation

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

## Environment Variables
Key variables (see .env.example):
- `NODE_ENV`: development/production
- `PORT`: Server port (default: 5000)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: JWT signing secret
- `JWT_REFRESH_SECRET`: Refresh token secret
- `CORS_ORIGIN`: Allowed origins
- `RATE_LIMIT_*`: Rate limiting config

## Development Guidelines

### Adding New Endpoints
1. Create route file in `src/routes/`
2. Create controller extending `base.controller.js`
3. Add validation middleware
4. Register route in `src/routes/index.js`

### Common Patterns
```javascript
// Async route handler
router.get('/endpoint', asyncHandler(async (req, res) => {
  const data = await Model.find();
  apiResponse.success(res, data);
}));

// Error handling
throw new ApiError('Error message', 400, 'ERROR_CODE');

// Pagination
const paginationData = pagination(page, limit, totalCount);
```

### Database Operations
- Always use Mongoose methods
- Implement proper error handling
- Use transactions for multi-document updates
- Index frequently queried fields

## Current Implementation Status

### ✅ Implemented
- Project structure & configuration
- Database models (User, Attorney, PracticeArea)
- Base controller with CRUD template
- Error handling & logging
- Security middleware
- Utility functions

### ⚠️ TODO
1. **Authentication Routes**: Login, register, refresh, logout
2. **Entity Routes**: CRUD endpoints for all models
3. **Auth Middleware**: JWT verification, role checking
4. **Validation**: Request validation middleware
5. **File Upload**: Multer configuration for media
6. **Email Service**: SMTP integration
7. **Swagger Docs**: Complete API documentation
8. **Tests**: Unit and integration tests

## Common Tasks

### Add New Model
1. Create schema in `src/models/`
2. Define Mongoose schema with validation
3. Add methods, virtuals, and hooks
4. Export model

### Add New Route
1. Create route file in `src/routes/`
2. Define endpoints with validation
3. Implement controller logic
4. Add to router in `src/routes/index.js`

### Handle File Uploads
```javascript
// Configure multer in route
const upload = multer({ 
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    // Validation logic
  }
});

router.post('/upload', upload.single('file'), controller.upload);
```

### Implement Authentication
```javascript
// In middleware
const authenticateToken = asyncHandler(async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  // Verify JWT and attach user to request
});

// In routes
router.use(authenticateToken);
router.use(authorize(['admin', 'editor']));
```

## Debugging Tips
- Check logs in `logs/` directory
- Use `npm run dev` for hot reload
- MongoDB connection issues: Check MONGODB_URI
- CORS errors: Verify CORS_ORIGIN in .env
- Auth errors: Check JWT secrets and expiration

## Security Checklist
- [ ] Never commit .env file
- [ ] Use strong JWT secrets
- [ ] Enable rate limiting in production
- [ ] Sanitize all user inputs
- [ ] Validate request data
- [ ] Use HTTPS in production
- [ ] Keep dependencies updated
- [ ] Implement proper error messages (no stack traces)

## Performance Tips
- Index database queries
- Use pagination for list endpoints
- Implement caching for static data
- Use compression middleware
- Optimize images before storage
- Use CDN for static assets

## Deployment Checklist
1. Set NODE_ENV=production
2. Configure production MongoDB
3. Set strong JWT secrets
4. Configure CORS for production domain
5. Enable all security middleware
6. Set up logging and monitoring
7. Configure reverse proxy (nginx)
8. Set up SSL certificates
9. Configure backup strategy
10. Set up health monitoring

## Useful Commands
```bash
# Check for outdated packages
npm outdated

# Update dependencies
npm update

# Audit for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Run specific file
node src/server.js

# MongoDB shell access
mongosh mongodb://localhost:27017/bonderud-law
```

## Contact & Support
- Repository: [GitHub URL]
- Documentation: See swagger docs at `/api-docs`
- Issues: Report via GitHub issues

---
Last Updated: January 2025
Version: 1.0.0
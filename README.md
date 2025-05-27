# Bonderud Law Firm API

A comprehensive REST API backend for the Bonderud Law Firm bilingual website, built with Node.js, Express.js, and MongoDB.

## 🚀 Features

- **JavaScript** - Modern ES6+ JavaScript
- **Express.js** - Fast and minimal web framework
- **MongoDB** - Document database with Mongoose ODM
- **Authentication** - JWT-based authentication with refresh tokens
- **Security** - Comprehensive security middleware stack
- **Logging** - Winston logger with file rotation
- **Validation** - Request validation with Joi and express-validator
- **Error Handling** - Centralized error handling with custom error classes
- **Rate Limiting** - Protection against abuse
- **CORS** - Cross-origin resource sharing configuration
- **Compression** - Response compression for better performance
- **Environment Configuration** - Robust environment variable validation

## 📋 Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- MongoDB >= 5.0

## ⚡ Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd bounderulaw-api
npm install
```

### 2. Environment Setup

Copy the environment template and configure your settings:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/bounderulaw-db

# JWT Secrets (Generate secure secrets!)
JWT_SECRET=your-super-secret-jwt-key-32-chars-min
JWT_REFRESH_SECRET=your-refresh-token-secret-32-chars-min

# Session Secret
SESSION_SECRET=your-session-secret-32-chars-minimum
```

### 3. Start Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server with hot reload
npm start           # Start production server

# Code Quality
npm run lint        # Lint JavaScript files
npm run lint:fix    # Fix linting issues
npm run format      # Format code with Prettier

# Testing
npm test           # Run tests
npm run test:watch # Run tests in watch mode
npm run test:coverage # Run tests with coverage

# Utilities
npm run clean      # Clean build directory
```

### Project Structure

```
src/
├── config/          # Configuration files
│   ├── database.js  # Database connection with retry logic
│   ├── env.js      # Environment variable validation
│   └── logger.js   # Winston logger configuration
├── controllers/     # Route controllers
├── middleware/      # Custom middleware
│   ├── errorHandler.js   # Global error handling
│   ├── notFound.js      # 404 handler
│   ├── requestLogger.js # Request logging
│   └── index.js         # Middleware setup
├── models/         # Mongoose models
├── routes/         # Express routes
├── utils/          # Utility functions
└── server.js       # Application entry point
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode | `development` | No |
| `PORT` | Server port | `3000` | No |
| `MONGODB_URI` | MongoDB connection string | - | Yes |
| `JWT_SECRET` | JWT signing secret (32+ chars) | - | Yes |
| `JWT_EXPIRES_IN` | JWT expiration time | `7d` | No |
| `BCRYPT_SALT_ROUNDS` | Bcrypt salt rounds | `12` | No |
| `CORS_ORIGIN` | Allowed CORS origins | `http://localhost:3000` | No |

See `.env.example` for all available configuration options.

### Database Configuration

The application includes robust database connection handling:

- **Connection Retry Logic** - Automatically retries failed connections
- **Graceful Shutdown** - Properly closes connections on app termination
- **Health Monitoring** - Connection state monitoring and logging
- **Test Database** - Separate database for testing

### Logging Configuration

Winston logger with:

- **File Rotation** - Daily rotating log files
- **Log Levels** - Configurable log levels (error, warn, info, debug)
- **Structured Logging** - JSON format for easy parsing
- **Request Logging** - HTTP request/response logging
- **Error Tracking** - Comprehensive error logging with stack traces

## 🔒 Security Features

### Implemented Security Measures

- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - Request rate limiting
- **Input Sanitization** - MongoDB injection protection
- **Request Size Limits** - Payload size restrictions
- **JWT Authentication** - Secure token-based auth
- **Bcrypt** - Password hashing
- **Environment Validation** - Configuration validation

### Security Best Practices

1. **Never commit secrets** - Use environment variables
2. **Use HTTPS in production** - Always encrypt in transit
3. **Regular dependency updates** - Keep packages current
4. **Input validation** - Validate all user inputs
5. **Error handling** - Don't expose sensitive information

## 🧪 Testing

### Test Setup

```bash
# Install dependencies
npm install

# Run tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Test Structure

```
tests/
├── unit/           # Unit tests
├── integration/    # Integration tests
├── helpers/        # Test utilities
└── fixtures/       # Test data
```

## 📊 Monitoring and Health Checks

### Health Endpoint

The API provides a health check endpoint:

```
GET /health
```

Response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.45,
  "environment": "development",
  "version": "1.0.0"
}
```

### Logging

Logs are written to:
- `logs/combined-YYYY-MM-DD.log` - All logs
- `logs/error-YYYY-MM-DD.log` - Error logs only
- Console output (development only)

## 🚀 Production Deployment

### Start Production Server

```bash
npm start
```

### Environment Variables for Production

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://your-production-db
JWT_SECRET=your-production-secret-32-chars-minimum
# ... other production configs
```

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong JWT secrets (32+ characters)
- [ ] Configure production MongoDB URI
- [ ] Set up proper CORS origins
- [ ] Configure rate limiting for your use case
- [ ] Set up log rotation and monitoring
- [ ] Use HTTPS/TLS
- [ ] Configure firewall rules
- [ ] Set up health checks
- [ ] Configure backup procedures

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Write tests for new features
- Use meaningful commit messages
- Update documentation for API changes
- Follow existing code style
- Use ES6+ JavaScript features

## 📝 API Documentation

The API documentation will be available at `/api/docs` when Swagger is configured.

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Check MongoDB is running
   - Verify connection string in `.env`
   - Check network connectivity

2. **Port Already in Use**
   - Change `PORT` in `.env`
   - Kill process using the port: `lsof -ti:3000 | xargs kill -9`

3. **JWT Errors**
   - Ensure JWT secrets are 32+ characters
   - Check token expiration settings

4. **Environment Variable Errors**
   - Copy `.env.example` to `.env`
   - Ensure all required variables are set

### Debug Mode

Enable debug logging:

```env
LOG_LEVEL=debug
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, email support@bounderudlaw.com or create an issue in the repository.

---

Built with ❤️ for Bonderud Law Firm
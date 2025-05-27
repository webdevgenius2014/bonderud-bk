# Bonderud Law Firm API - Testing Guide

## Overview
This guide covers testing strategies, tools, and procedures for the Bonderud Law Firm API.

## Testing Environment Setup

### 1. Install Testing Dependencies
```bash
npm install --save-dev jest supertest @faker-js/faker mongodb-memory-server
```

### 2. Environment Configuration
Create `.env.test`:
```env
NODE_ENV=test
PORT=5001
MONGODB_URI=mongodb://localhost:27017/bonderud-test
JWT_SECRET=test-jwt-secret-key
JWT_REFRESH_SECRET=test-refresh-secret-key
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
```

## Unit Testing

### Model Tests
```javascript
// tests/models/user.test.js
import { User } from '../../src/models/User.js';

describe('User Model', () => {
  test('should hash password before saving', async () => {
    const user = new User({
      email: 'test@example.com',
      password: 'Test@123',
      name: { first: 'Test', last: 'User' }
    });
    
    await user.save();
    expect(user.password).not.toBe('Test@123');
  });

  test('should validate email format', async () => {
    const user = new User({
      email: 'invalid-email',
      password: 'Test@123'
    });
    
    await expect(user.save()).rejects.toThrow();
  });
});
```

### Controller Tests
```javascript
// tests/controllers/auth.test.js
import request from 'supertest';
import app from '../../src/server.js';

describe('Auth Controller', () => {
  test('POST /api/auth/register', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'newuser@example.com',
        password: 'Test@123',
        name: { first: 'New', last: 'User' }
      });
    
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('accessToken');
  });
});
```

## Integration Testing

### API Endpoint Tests
```javascript
// tests/integration/practice-areas.test.js
describe('Practice Areas API', () => {
  let authToken;
  
  beforeAll(async () => {
    // Login as admin
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@bonderudlaw.com',
        password: 'Admin@123'
      });
    authToken = res.body.data.accessToken;
  });

  test('should create practice area', async () => {
    const res = await request(app)
      .post('/api/practice-areas')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: { en: 'Test Area', es: 'Área de Prueba' },
        slug: 'test-area',
        description: { 
          en: 'Test description', 
          es: 'Descripción de prueba' 
        }
      });
    
    expect(res.status).toBe(201);
    expect(res.body.data.slug).toBe('test-area');
  });
});
```

## End-to-End Testing

### User Journey Tests
```javascript
// tests/e2e/client-journey.test.js
describe('Client User Journey', () => {
  test('complete review submission flow', async () => {
    // 1. Submit contact form
    const contactRes = await request(app)
      .post('/api/contact')
      .send({
        name: 'Test Client',
        email: 'client@example.com',
        phone: '555-0123',
        subject: 'Legal Inquiry',
        message: 'Need legal help',
        preferredLanguage: 'en'
      });
    
    expect(contactRes.status).toBe(201);
    
    // 2. Submit review
    const reviewRes = await request(app)
      .post('/api/reviews')
      .send({
        reviewerName: 'Test Client',
        reviewerEmail: 'client@example.com',
        rating: 5,
        title: { en: 'Great Service' },
        content: { en: 'Excellent legal representation' },
        attorneyId: 'attorney-id',
        practiceAreaId: 'practice-area-id'
      });
    
    expect(reviewRes.status).toBe(201);
    expect(reviewRes.body.data.status).toBe('pending');
  });
});
```

## Performance Testing

### Load Testing with Artillery
```yaml
# tests/load/api-load-test.yml
config:
  target: 'http://localhost:5000'
  phases:
    - duration: 60
      arrivalRate: 10
      rampTo: 50
  defaults:
    headers:
      Content-Type: 'application/json'

scenarios:
  - name: 'API Load Test'
    flow:
      - post:
          url: '/api/auth/login'
          json:
            email: 'test@example.com'
            password: 'Test@123'
          capture:
            - json: '$.data.accessToken'
              as: 'authToken'
      
      - get:
          url: '/api/practice-areas'
          headers:
            Authorization: 'Bearer {{ authToken }}'
      
      - get:
          url: '/api/attorneys'
          headers:
            Authorization: 'Bearer {{ authToken }}'
```

Run load tests:
```bash
npm install -g artillery
artillery run tests/load/api-load-test.yml
```

## Security Testing

### OWASP ZAP API Scan
```bash
# Run OWASP ZAP in Docker
docker run -t owasp/zap2docker-stable zap-api-scan.py \
  -t http://localhost:5000/api/swagger.json \
  -f openapi \
  -r security-report.html
```

### SQL Injection Tests
```javascript
// tests/security/injection.test.js
describe('Security - Injection Prevention', () => {
  test('should prevent NoSQL injection', async () => {
    const maliciousPayload = {
      email: { $ne: null },
      password: { $ne: null }
    };
    
    const res = await request(app)
      .post('/api/auth/login')
      .send(maliciousPayload);
    
    expect(res.status).toBe(400);
  });
});
```

## Test Data Management

### Fixtures
```javascript
// tests/fixtures/users.js
export const testUsers = {
  admin: {
    email: 'admin@test.com',
    password: 'Admin@123',
    role: 'admin'
  },
  editor: {
    email: 'editor@test.com',
    password: 'Editor@123',
    role: 'editor'
  },
  viewer: {
    email: 'viewer@test.com',
    password: 'Viewer@123',
    role: 'viewer'
  }
};
```

### Database Seeding
```javascript
// tests/helpers/seed.js
import { User } from '../../src/models/User.js';
import { testUsers } from '../fixtures/users.js';

export async function seedTestDatabase() {
  await User.deleteMany({});
  
  for (const userData of Object.values(testUsers)) {
    await User.create(userData);
  }
}
```

## Continuous Integration

### GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: API Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:6
        ports:
          - 27017:27017
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run tests
        run: npm test
        env:
          MONGODB_URI: mongodb://localhost:27017/test
          JWT_SECRET: test-secret
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Test Coverage

### Jest Configuration
```javascript
// jest.config.js
export default {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/config/*.js'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### Generate Coverage Report
```bash
npm test -- --coverage
```

## Monitoring & Debugging

### Test Logging
```javascript
// tests/helpers/logger.js
export function logTestContext(testName, data) {
  if (process.env.DEBUG_TESTS) {
    console.log(`[TEST: ${testName}]`, JSON.stringify(data, null, 2));
  }
}
```

### Debug Mode
```bash
# Run tests with debugging
DEBUG_TESTS=true npm test

# Run specific test file
npm test -- tests/controllers/auth.test.js

# Run tests in watch mode
npm test -- --watch
```

## Best Practices

### 1. Test Structure
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Group related tests with describe blocks
- Use beforeEach/afterEach for setup/cleanup

### 2. Test Data
- Use factories for consistent test data
- Clean up test data after each test
- Don't rely on test execution order
- Use unique identifiers to avoid conflicts

### 3. Assertions
- Test both success and error cases
- Verify response structure, not just status
- Test edge cases and boundaries
- Include negative test scenarios

### 4. Performance
- Use test database or in-memory MongoDB
- Parallelize independent tests
- Mock external services
- Minimize database operations

## Test Checklist

### Before Each Release
- [ ] All unit tests passing
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Security tests passing
- [ ] Performance benchmarks met
- [ ] Test coverage > 80%
- [ ] No console errors/warnings
- [ ] API documentation updated

### New Feature Testing
- [ ] Unit tests for models
- [ ] Unit tests for controllers
- [ ] Integration tests for endpoints
- [ ] Error handling tests
- [ ] Authorization tests
- [ ] Validation tests
- [ ] Performance impact assessed

## Common Test Scenarios

### Authentication Testing
```javascript
// Test token expiration
test('should reject expired token', async () => {
  const expiredToken = generateExpiredToken();
  
  const res = await request(app)
    .get('/api/users/me')
    .set('Authorization', `Bearer ${expiredToken}`);
  
  expect(res.status).toBe(401);
  expect(res.body.error.code).toBe('TOKEN_EXPIRED');
});
```

### File Upload Testing
```javascript
// Test file upload
test('should upload attorney photo', async () => {
  const res = await request(app)
    .post('/api/attorneys/upload')
    .set('Authorization', `Bearer ${authToken}`)
    .attach('photo', 'tests/fixtures/test-photo.jpg');
  
  expect(res.status).toBe(200);
  expect(res.body.data.photoUrl).toBeDefined();
});
```

### Pagination Testing
```javascript
// Test pagination
test('should paginate results', async () => {
  const res = await request(app)
    .get('/api/practice-areas?page=2&limit=10')
    .set('Authorization', `Bearer ${authToken}`);
  
  expect(res.status).toBe(200);
  expect(res.body.pagination.page).toBe(2);
  expect(res.body.data.length).toBeLessThanOrEqual(10);
});
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Kill process on port 5001
   lsof -ti:5001 | xargs kill -9
   ```

2. **MongoDB Connection Failed**
   ```bash
   # Start MongoDB service
   brew services start mongodb-community
   ```

3. **Test Timeout**
   ```javascript
   // Increase timeout for slow tests
   jest.setTimeout(30000);
   ```

4. **Memory Leaks**
   ```javascript
   // Properly close connections
   afterAll(async () => {
     await mongoose.connection.close();
   });
   ```

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [MongoDB Memory Server](https://github.com/nodkz/mongodb-memory-server)
- [Artillery.io](https://www.artillery.io/)
- [OWASP ZAP](https://www.zaproxy.org/)
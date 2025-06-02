# Bonderud Law Firm API - Postman Collection

This directory contains comprehensive Postman collections for testing and documenting the Bonderud Law Firm API.

## Collections Available

1. **Bonderud-Law-API-Complete.postman_collection.json** - Complete API collection with all endpoints
2. **Bonderud-Law-API.postman_collection.json** - Basic collection (legacy)

## Quick Start

### 1. Import the Collection

1. Open Postman
2. Click "Import" 
3. Select the `Bonderud-Law-API-Complete.postman_collection.json` file
4. The collection will be imported with all requests organized by category

### 2. Environment Setup

The collection includes variables that need to be configured:

- `baseUrl` - API base URL (default: `http://localhost:3003/api/v1`)
- `accessToken` - JWT access token (auto-populated after login)
- `refreshToken` - JWT refresh token (auto-populated after login) 
- `userId` - Current user ID (auto-populated)
- `attorneyId` - Sample attorney ID (auto-populated)
- `practiceAreaId` - Sample practice area ID (auto-populated)

### 3. Authentication Flow

1. **Register a new user** OR **Login with existing credentials**
   - Use the requests in the "Authentication" folder
   - Tokens will be automatically saved to collection variables
   - Default admin credentials (if seeded): 
     - Email: `admin@bonderudlaw.com`
     - Password: `Admin@123456`

2. **Make authenticated requests**
   - Requests requiring authentication automatically use the saved `accessToken`
   - Token refresh is handled automatically in pre-request scripts

## Collection Features

### 🔐 Automatic Authentication
- Tokens are automatically saved after login/registration
- Auto-refresh token functionality in pre-request scripts
- Bearer token authentication is handled automatically

### 📝 Comprehensive Documentation
- Each request includes detailed descriptions
- Request/response examples with realistic data
- Parameter descriptions and usage notes
- Error handling examples

### 🧪 Built-in Testing
- Response time validation (< 2000ms)
- Status code verification
- Response format validation
- Automatic ID extraction for chaining requests

### 🌐 Bilingual Support
- Examples include both English and Spanish content
- Language parameter testing
- Bilingual content structure examples

## API Endpoints Covered

### System
- ✅ API Welcome message
- ✅ Health check

### Authentication
- ✅ User registration
- ✅ User login
- ✅ Token refresh
- ✅ Logout
- ✅ Forgot password
- ✅ Reset password
- ✅ Email verification

### Users
- ✅ Get all users (paginated, filtered)
- ✅ Create user
- ✅ Get current user profile
- ✅ Update current user
- ✅ Get user by ID
- ✅ Update user
- ✅ Delete user
- ✅ Change user password

### Attorneys
- ✅ Get all attorneys (with filtering)
- ✅ Get featured attorneys
- ✅ Get attorney by ID
- ✅ Create attorney (comprehensive example)
- ✅ Update attorney
- ✅ Delete attorney
- ✅ Upload attorney photo

### Practice Areas
- ✅ Get all practice areas (with filtering)
- ✅ Get practice areas hierarchy
- ✅ Get practice area by ID
- ✅ Get attorneys in practice area
- ✅ Create practice area (comprehensive example)
- ✅ Update practice area
- ✅ Delete practice area

## Example Data

### User Registration
```json
{
  "email": "test@example.com",
  "password": "Test@123456",
  "profile": {
    "firstName": "Test",
    "lastName": "User",
    "phone": "+1-555-0123",
    "preferredLanguage": "en"
  }
}
```

### Attorney Creation
The collection includes a comprehensive attorney creation example with:
- ✅ Complete bilingual profile information
- ✅ Education history with validation
- ✅ Professional experience
- ✅ Certifications and credentials
- ✅ Awards and recognitions
- ✅ Professional memberships
- ✅ Language proficiencies
- ✅ Practice area associations
- ✅ Availability scheduling
- ✅ Social media profiles
- ✅ SEO metadata

### Practice Area Creation
The collection includes detailed practice area examples with:
- ✅ Bilingual content throughout
- ✅ Service offerings
- ✅ Key features and benefits
- ✅ FAQ sections
- ✅ Statistics and achievements
- ✅ Attorney associations
- ✅ SEO optimization
- ✅ Structured data

## Testing Workflows

### 1. Complete User Journey
1. Register new user → Login → Update profile → Change password
2. Admin creates attorney → Updates attorney → Uploads photo
3. Admin creates practice area → Associates with attorney
4. Public access to attorneys and practice areas

### 2. Authentication Testing
1. Registration with validation
2. Login with various scenarios
3. Token refresh flow
4. Password reset workflow
5. Logout and session cleanup

### 3. CRUD Operations
1. Create resources with full validation
2. Read with filtering and pagination
3. Update with partial data
4. Delete with proper authorization

### 4. Error Handling
1. Validation errors (400)
2. Authentication errors (401)
3. Authorization errors (403)
4. Not found errors (404)
5. Server errors (500)

## Advanced Features

### Pre-request Scripts
- Automatic token refresh if expired
- Environment variable management
- Request logging and debugging

### Test Scripts
- Automatic token extraction and storage
- Response validation
- ID extraction for request chaining
- Performance monitoring

### Variables and Environments
- Dynamic variable population
- Environment-specific configurations
- Automatic ID management for testing

## Security Considerations

### 🔒 Included Security Features
- JWT token-based authentication
- Role-based access control testing
- Permission validation
- Secure password requirements
- Rate limiting awareness

### ⚠️ Security Notes
- Never commit real credentials to version control
- Use environment variables for sensitive data
- Regularly rotate test credentials
- Be aware of rate limiting (100 req/15min)

## Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Check if you're logged in
   - Verify token hasn't expired
   - Use refresh token flow

2. **403 Forbidden**
   - Check user permissions
   - Verify user role
   - Contact admin for permission updates

3. **404 Not Found**
   - Verify endpoint URLs
   - Check if resources exist
   - Validate ID parameters

4. **422 Validation Error**
   - Check required fields
   - Validate data formats
   - Review bilingual content structure

### Debug Mode
Enable detailed logging by adding to pre-request scripts:
```javascript
console.log('Request URL:', pm.request.url);
console.log('Headers:', pm.request.headers);
console.log('Body:', pm.request.body);
```

## Contributing

When adding new endpoints:
1. Follow existing naming conventions
2. Include comprehensive examples
3. Add appropriate test scripts
4. Document all parameters
5. Include error scenarios

## Production Usage

For production testing:
1. Update `baseUrl` to production URL
2. Use production credentials
3. Be mindful of rate limits
4. Test in non-production environment first

## Support

For API issues or questions:
- Check the Swagger documentation at `/api/docs`
- Review error response messages
- Contact the development team
- Report bugs via GitHub issues

---

**Last Updated:** January 2025  
**Collection Version:** 1.0.0  
**API Version:** v1
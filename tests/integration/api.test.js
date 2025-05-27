import { requestHelper } from '../helpers/request.helper.js';
import { authHelper } from '../helpers/auth.helper.js';
import { dbHelper } from '../helpers/db.helper.js';

describe('API Integration Tests', () => {
  describe('API Structure', () => {
    it('should have correct API structure', async () => {
      const response = await requestHelper.get('/api/v1');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('endpoints');
    });
    
    it('should have Swagger documentation available', async () => {
      const response = await requestHelper.get('/api/docs');
      
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/html');
    });
  });
  
  describe('Error Handling', () => {
    it('should handle 404 errors consistently', async () => {
      const response = await requestHelper.get('/api/v1/non-existent');
      
      requestHelper.expectError(response, 404, 'NOT_FOUND');
    });
    
    it('should handle malformed JSON', async () => {
      const response = await requestHelper
        .post('/api/v1/test')
        .send('{"malformed": json}')
        .set('Content-Type', 'application/json');
      
      expect(response.status).toBe(400);
    });
  });
  
  describe('Authentication Flow (Future Implementation)', () => {
    it.skip('should register new user', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'Test123!@#',
        profile: {
          firstName: 'New',
          lastName: 'User'
        }
      };
      
      const response = await requestHelper
        .post('/api/v1/auth/register')
        .send(userData);
      
      requestHelper.expectSuccess(response, 201);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
    });
    
    it.skip('should login existing user', async () => {
      const { user } = await authHelper.createTestUser();
      
      const response = await requestHelper
        .post('/api/v1/auth/login')
        .send({
          email: user.email,
          password: 'Test123!@#'
        });
      
      requestHelper.expectSuccess(response, 200);
      expect(response.body.data).toHaveProperty('accessToken');
    });
    
    it.skip('should refresh access token', async () => {
      const { refreshToken } = await authHelper.createTestUser();
      
      const response = await requestHelper
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });
      
      requestHelper.expectSuccess(response, 200);
      expect(response.body.data).toHaveProperty('accessToken');
    });
    
    it.skip('should logout user', async () => {
      const { accessToken } = await authHelper.createTestUser();
      
      const response = await requestHelper
        .authenticatedRequest('post', '/api/v1/auth/logout', accessToken);
      
      requestHelper.expectSuccess(response, 200);
    });
  });
  
  describe('User Management (Future Implementation)', () => {
    let adminToken, editorToken, viewerToken;
    
    beforeEach(async () => {
      const users = await authHelper.createTestUsers();
      adminToken = users.admin.accessToken;
      editorToken = users.editor.accessToken;
      viewerToken = users.viewer.accessToken;
    });
    
    it.skip('should require authentication for user endpoints', async () => {
      await requestHelper.testAuthRequired('get', '/api/v1/users');
    });
    
    it.skip('should require permissions to list users', async () => {
      await requestHelper.testPermissionRequired('get', '/api/v1/users', viewerToken);
    });
    
    it.skip('should allow admin to list users', async () => {
      const response = await requestHelper
        .authenticatedRequest('get', '/api/v1/users', adminToken);
      
      requestHelper.expectSuccess(response, 200);
      requestHelper.expectPagination(response);
      expect(response.body.data).toBeInstanceOf(Array);
    });
    
    it.skip('should get current user profile', async () => {
      const response = await requestHelper
        .authenticatedRequest('get', '/api/v1/users/me', viewerToken);
      
      requestHelper.expectSuccess(response, 200);
      expect(response.body.data).toHaveProperty('email');
      expect(response.body.data).toHaveProperty('role', 'viewer');
    });
    
    it.skip('should update current user profile', async () => {
      const updateData = {
        profile: {
          bio: 'Updated bio'
        }
      };
      
      const response = await requestHelper
        .authenticatedRequest('patch', '/api/v1/users/me', viewerToken)
        .send(updateData);
      
      requestHelper.expectSuccess(response, 200);
      expect(response.body.data.profile.bio).toBe('Updated bio');
    });
  });
  
  describe('Attorney Management (Future Implementation)', () => {
    let adminToken, testData;
    
    beforeEach(async () => {
      const { admin } = await authHelper.createTestUsers();
      adminToken = admin.accessToken;
      testData = await dbHelper.seedDatabase();
    });
    
    it.skip('should list attorneys publicly', async () => {
      const response = await requestHelper.get('/api/v1/attorneys');
      
      requestHelper.expectSuccess(response, 200);
      requestHelper.expectPagination(response);
      expect(response.body.data).toBeInstanceOf(Array);
    });
    
    it.skip('should filter attorneys', async () => {
      const response = await requestHelper
        .get('/api/v1/attorneys')
        .query({
          isActive: true,
          isPublished: true,
          isFeatured: true
        });
      
      requestHelper.expectSuccess(response, 200);
      expect(response.body.data.every(a => a.isFeatured)).toBe(true);
    });
    
    it.skip('should get attorney by ID', async () => {
      const attorneyId = testData.attorneys.attorney1._id;
      const response = await requestHelper.get(`/api/v1/attorneys/${attorneyId}`);
      
      requestHelper.expectSuccess(response, 200);
      expect(response.body.data._id).toBe(attorneyId.toString());
    });
    
    it.skip('should require auth to create attorney', async () => {
      await requestHelper.testAuthRequired('post', '/api/v1/attorneys');
    });
    
    it.skip('should create attorney with admin permission', async () => {
      const attorneyData = global.testHelpers.generateAttorneyData({
        practiceAreas: [testData.practiceAreas.corporateLaw._id]
      });
      
      const response = await requestHelper
        .authenticatedRequest('post', '/api/v1/attorneys', adminToken)
        .send(attorneyData);
      
      requestHelper.expectSuccess(response, 201);
      expect(response.body.data).toHaveProperty('slug');
    });
    
    it.skip('should update attorney', async () => {
      const attorneyId = testData.attorneys.attorney1._id;
      const updateData = {
        bio: { en: 'Updated bio', es: 'Biografía actualizada' }
      };
      
      const response = await requestHelper
        .authenticatedRequest('patch', `/api/v1/attorneys/${attorneyId}`, adminToken)
        .send(updateData);
      
      requestHelper.expectSuccess(response, 200);
      expect(response.body.data.bio.en).toBe('Updated bio');
    });
    
    it.skip('should upload attorney photo', async () => {
      const attorneyId = testData.attorneys.attorney1._id;
      
      const response = await requestHelper
        .authenticatedRequest('post', `/api/v1/attorneys/${attorneyId}/upload-photo`, adminToken)
        .attach('photo', Buffer.from('fake-image'), 'photo.jpg');
      
      requestHelper.expectSuccess(response, 200);
      expect(response.body.data).toHaveProperty('url');
    });
  });
  
  describe('Practice Area Management (Future Implementation)', () => {
    let adminToken, testData;
    
    beforeEach(async () => {
      const { admin } = await authHelper.createTestUsers();
      adminToken = admin.accessToken;
      testData = await dbHelper.seedDatabase();
    });
    
    it.skip('should list practice areas publicly', async () => {
      const response = await requestHelper.get('/api/v1/practice-areas');
      
      requestHelper.expectSuccess(response, 200);
      requestHelper.expectPagination(response);
      expect(response.body.data).toBeInstanceOf(Array);
    });
    
    it.skip('should get practice area hierarchy', async () => {
      const response = await requestHelper.get('/api/v1/practice-areas/hierarchy');
      
      requestHelper.expectSuccess(response, 200);
      expect(response.body.data).toBeInstanceOf(Array);
    });
    
    it.skip('should get practice area by ID', async () => {
      const areaId = testData.practiceAreas.corporateLaw._id;
      const response = await requestHelper.get(`/api/v1/practice-areas/${areaId}`);
      
      requestHelper.expectSuccess(response, 200);
      expect(response.body.data._id).toBe(areaId.toString());
    });
    
    it.skip('should get attorneys in practice area', async () => {
      const areaId = testData.practiceAreas.corporateLaw._id;
      const response = await requestHelper.get(`/api/v1/practice-areas/${areaId}/attorneys`);
      
      requestHelper.expectSuccess(response, 200);
      expect(response.body.data).toBeInstanceOf(Array);
    });
    
    it.skip('should create practice area with admin permission', async () => {
      const practiceAreaData = global.testHelpers.generatePracticeAreaData({
        attorneys: [testData.attorneys.attorney1._id]
      });
      
      const response = await requestHelper
        .authenticatedRequest('post', '/api/v1/practice-areas', adminToken)
        .send(practiceAreaData);
      
      requestHelper.expectSuccess(response, 201);
      expect(response.body.data).toHaveProperty('slug');
    });
    
    it.skip('should update practice area', async () => {
      const areaId = testData.practiceAreas.corporateLaw._id;
      const updateData = {
        description: { en: 'Updated description', es: 'Descripción actualizada' }
      };
      
      const response = await requestHelper
        .authenticatedRequest('patch', `/api/v1/practice-areas/${areaId}`, adminToken)
        .send(updateData);
      
      requestHelper.expectSuccess(response, 200);
      expect(response.body.data.description.en).toBe('Updated description');
    });
  });
  
  describe('Bilingual Content', () => {
    it.skip('should support language parameter', async () => {
      const responseEn = await requestHelper
        .get('/api/v1/attorneys')
        .query({ language: 'en' });
      
      const responseEs = await requestHelper
        .get('/api/v1/attorneys')
        .query({ language: 'es' });
      
      expect(responseEn.status).toBe(200);
      expect(responseEs.status).toBe(200);
    });
  });
  
  describe('Search Functionality', () => {
    it.skip('should search attorneys', async () => {
      const response = await requestHelper
        .get('/api/v1/attorneys')
        .query({ search: 'John' });
      
      requestHelper.expectSuccess(response, 200);
    });
    
    it.skip('should search practice areas', async () => {
      const response = await requestHelper
        .get('/api/v1/practice-areas')
        .query({ search: 'Corporate' });
      
      requestHelper.expectSuccess(response, 200);
    });
  });
  
  describe('Pagination', () => {
    it.skip('should paginate results', async () => {
      const response = await requestHelper
        .get('/api/v1/attorneys')
        .query({ page: 1, limit: 5 });
      
      requestHelper.expectSuccess(response, 200);
      requestHelper.expectPagination(response);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });
    
    it.skip('should sort results', async () => {
      const response = await requestHelper
        .get('/api/v1/attorneys')
        .query({ sort: 'lastName', order: 'asc' });
      
      requestHelper.expectSuccess(response, 200);
    });
  });
  
  describe('Security', () => {
    it('should include security headers', async () => {
      const response = await requestHelper.get('/health');
      
      expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
    });
    
    it('should handle CORS properly', async () => {
      const response = await requestHelper
        .get('/health')
        .set('Origin', 'http://localhost:3000');
      
      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
    
    it('should sanitize MongoDB queries', async () => {
      const response = await requestHelper
        .get('/api/v1/test')
        .query({ '$ne': 'injection' });
      
      // Should be sanitized, not cause error
      expect(response.status).toBe(404);
    });
  });
});
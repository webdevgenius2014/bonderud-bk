import request from 'supertest';
import app from '../../src/server.js';

export const requestHelper = {
  // Create supertest request instance
  getRequest: () => request(app),
  
  // Common request builders
  get: (url) => request(app).get(url),
  post: (url) => request(app).post(url),
  patch: (url) => request(app).patch(url),
  put: (url) => request(app).put(url),
  delete: (url) => request(app).delete(url),
  
  // Request with authentication
  authenticatedRequest: (method, url, token) => {
    const req = request(app)[method](url);
    if (token) {
      req.set('Authorization', `Bearer ${token}`);
    }
    return req;
  },
  
  // Validate success response
  expectSuccess: (response, statusCode = 200) => {
    expect(response.status).toBe(statusCode);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('data');
  },
  
  // Validate error response
  expectError: (response, statusCode, errorCode) => {
    expect(response.status).toBe(statusCode);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toHaveProperty('message');
    expect(response.body.error).toHaveProperty('statusCode', statusCode);
    if (errorCode) {
      expect(response.body.error).toHaveProperty('code', errorCode);
    }
  },
  
  // Validate pagination response
  expectPagination: (response) => {
    expect(response.body).toHaveProperty('pagination');
    expect(response.body.pagination).toHaveProperty('currentPage');
    expect(response.body.pagination).toHaveProperty('totalPages');
    expect(response.body.pagination).toHaveProperty('totalItems');
    expect(response.body.pagination).toHaveProperty('hasNext');
    expect(response.body.pagination).toHaveProperty('hasPrev');
  },
  
  // Common test scenarios
  testAuthRequired: async (method, url) => {
    const response = await requestHelper[method](url);
    requestHelper.expectError(response, 401, 'UNAUTHORIZED');
  },
  
  testPermissionRequired: async (method, url, token) => {
    const response = await requestHelper
      .authenticatedRequest(method, url, token);
    requestHelper.expectError(response, 403, 'FORBIDDEN');
  },
  
  testNotFound: async (method, url, token) => {
    const fakeId = '507f1f77bcf86cd799439011';
    const response = await requestHelper
      .authenticatedRequest(method, `${url}/${fakeId}`, token);
    requestHelper.expectError(response, 404, 'NOT_FOUND');
  },
  
  testValidation: async (method, url, token, invalidData) => {
    const response = await requestHelper
      .authenticatedRequest(method, url, token)
      .send(invalidData);
    requestHelper.expectError(response, 400, 'VALIDATION_ERROR');
  }
};
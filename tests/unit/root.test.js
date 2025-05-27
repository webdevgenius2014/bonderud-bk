import { requestHelper } from '../helpers/request.helper.js';

describe('Root Endpoints', () => {
  describe('GET /', () => {
    it('should return API welcome message', async () => {
      const response = await requestHelper.get('/');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Bonderud Law Firm API');
      expect(response.body).toHaveProperty('version', '1.0.0');
      expect(response.body).toHaveProperty('documentation', '/api/docs');
      expect(response.body).toHaveProperty('health', '/health');
    });
    
    it('should not require authentication', async () => {
      const response = await requestHelper.get('/');
      expect(response.status).toBe(200);
    });
  });
  
  describe('GET /api/v1', () => {
    it('should return API version info', async () => {
      const response = await requestHelper.get('/api/v1');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Bonderud Law Firm API');
      expect(response.body).toHaveProperty('version', 'v1');
      expect(response.body).toHaveProperty('endpoints');
      expect(response.body.endpoints).toHaveProperty('health', '/health');
      expect(response.body.endpoints).toHaveProperty('docs', '/api/docs');
    });
    
    it('should not require authentication', async () => {
      const response = await requestHelper.get('/api/v1');
      expect(response.status).toBe(200);
    });
  });
  
  describe('404 Handler', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await requestHelper.get('/non-existent-route');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error).toHaveProperty('code', 'NOT_FOUND');
      expect(response.body.error).toHaveProperty('statusCode', 404);
    });
    
    it('should handle various non-existent paths', async () => {
      const paths = [
        '/api/v1/non-existent',
        '/api/v2',
        '/users/invalid-path',
        '/test/404'
      ];
      
      for (const path of paths) {
        const response = await requestHelper.get(path);
        expect(response.status).toBe(404);
        expect(response.body.error.code).toBe('NOT_FOUND');
      }
    });
  });
});
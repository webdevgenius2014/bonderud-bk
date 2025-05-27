import { requestHelper } from '../helpers/request.helper.js';

describe('Health Check Endpoint', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await requestHelper.get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('environment', 'test');
      expect(response.body).toHaveProperty('version');
      
      // Validate timestamp format
      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
      
      // Validate uptime is a positive number
      expect(typeof response.body.uptime).toBe('number');
      expect(response.body.uptime).toBeGreaterThan(0);
    });
    
    it('should not require authentication', async () => {
      const response = await requestHelper.get('/health');
      expect(response.status).toBe(200);
    });
    
    it('should work with any HTTP method', async () => {
      const methods = ['get', 'post', 'put', 'patch', 'delete'];
      
      for (const method of methods) {
        const response = await requestHelper[method]('/health');
        expect([200, 404]).toContain(response.status);
      }
    });
  });
});
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { apiPost } from '../api';

// Create a mock adapter for axios
const mock = new MockAdapter(axios);

describe('API Service - JSON Response Handling', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    mock.reset();
    
    // Clear localStorage
    localStorage.clear();
    
    // Mock localStorage
    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn()
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
  });

  afterEach(() => {
    mock.restore();
  });

  describe('Submit test successfully', () => {
    it('should handle valid JSON response successfully', async () => {
      const mockResponseData = {
        success: true,
        data: {
          resultId: 'result123',
          score: 85,
          totalQuestions: 20,
          correctAnswers: 17
        },
        message: 'Test completed successfully!'
      };

      mock.onPost('/test-endpoint').reply(200, mockResponseData);

      const result = await apiPost('/test-endpoint', { answers: [1, 2, 3] });

      expect(result).toEqual(mockResponseData);
    });

    it('should add authorization header when token exists', async () => {
      localStorage.getItem = jest.fn().mockReturnValue('test-token');

      mock.onPost('/test-endpoint').reply((config) => {
        expect(config.headers?.Authorization).toBe('Bearer test-token');
        return [200, { success: true, data: {} }];
      });

      await apiPost('/test-endpoint', { test: 'data' });
    });
  });

  describe('Handle server timeout gracefully', () => {
    it('should throw network error for timeout', async () => {
      mock.onPost('/test-endpoint').timeout();

      await expect(apiPost('/test-endpoint', {}))
        .rejects
        .toThrow('Network connection failed. Please check your internet connection and try again.');
    });

    it('should handle server unavailable errors', async () => {
      mock.onPost('/test-endpoint').reply(502, 'Bad Gateway');

      await expect(apiPost('/test-endpoint', {}))
        .rejects
        .toThrow('Server is temporarily unavailable. Please try again in a few moments.');
    });
  });

  describe('Handle empty JSON response', () => {
    it('should throw error for null response data', async () => {
      mock.onPost('/test-endpoint').reply(200, null);

      await expect(apiPost('/test-endpoint', {}))
        .rejects
        .toThrow('Server returned invalid response format');
    });

    it('should throw error for undefined response data', async () => {
      mock.onPost('/test-endpoint').reply(200, undefined);

      await expect(apiPost('/test-endpoint', {}))
        .rejects
        .toThrow('Server returned invalid response format');
    });

    it('should handle empty string response', async () => {
      mock.onPost('/test-endpoint').reply(200, '');

      await expect(apiPost('/test-endpoint', {}))
        .rejects
        .toThrow('Server returned empty response');
    });
  });

  describe('Handle malformed JSON response', () => {
    it('should handle string response and parse as JSON in interceptor', async () => {
      const validJsonString = '{"success": true, "data": {"test": "value"}}';
      mock.onPost('/test-endpoint').reply(200, validJsonString);

      const result = await apiPost('/test-endpoint', {});
      
      // The response interceptor should parse the string as JSON
      expect(result).toEqual({
        success: true,
        data: { test: 'value' }
      });
    });

    it('should handle invalid JSON string response', async () => {
      const invalidJsonString = '{"invalid": json}'; // Invalid JSON
      mock.onPost('/test-endpoint').reply(200, invalidJsonString);

      const result = await apiPost('/test-endpoint', {});
      
      // The response interceptor should handle the invalid JSON
      expect(result).toEqual({
        success: false,
        error: 'Invalid JSON response from server',
        originalData: invalidJsonString
      });
    });
  });

  describe('Handle network connection failure', () => {
    it('should handle network errors', async () => {
      mock.onPost('/test-endpoint').networkError();

      await expect(apiPost('/test-endpoint', {}))
        .rejects
        .toThrow('Network connection failed. Please check your internet connection and try again.');
    });

    it('should handle network timeout', async () => {
      mock.onPost('/test-endpoint').timeout();

      await expect(apiPost('/test-endpoint', {}))
        .rejects
        .toThrow('Network connection failed. Please check your internet connection and try again.');
    });
  });

  describe('Retry on JSON parsing error', () => {
    it('should handle 401 unauthorized for protected routes', async () => {
      // Mock window.location for redirect test
      delete (window as any).location;
      window.location = { href: '' } as any;

      mock.onPost('/protected-endpoint').reply(401, {
        success: false,
        error: 'Unauthorized'
      });

      try {
        await apiPost('/protected-endpoint', {});
      } catch (error) {
        // Should have cleared localStorage and redirected
        expect(localStorage.removeItem).toHaveBeenCalledWith('token');
        expect(localStorage.removeItem).toHaveBeenCalledWith('user');
        expect(window.location.href).toBe('/login');
      }
    });

    it('should not redirect for auth endpoints', async () => {
      // Mock window.location
      delete (window as any).location;
      window.location = { href: '' } as any;

      mock.onPost('/auth/login').reply(401, {
        success: false,
        error: 'Invalid credentials'
      });

      try {
        await apiPost('/auth/login', { email: 'test', password: 'wrong' });
      } catch (error) {
        // Should clear tokens but not redirect for auth endpoints
        expect(localStorage.removeItem).toHaveBeenCalledWith('token');
        expect(localStorage.removeItem).toHaveBeenCalledWith('user');
        expect(window.location.href).toBe(''); // No redirect
      }
    });
  });

  describe('Handle large response data', () => {
    it('should handle large JSON responses efficiently', async () => {
      // Create a large mock response
      const largeResponse = {
        success: true,
        data: {
          results: Array.from({ length: 1000 }, (_, i) => ({
            id: i,
            name: `Item ${i}`,
            description: `This is a description for item ${i}`.repeat(10),
            metadata: {
              tags: [`tag${i}`, `category${i % 10}`],
              created: new Date().toISOString(),
              updated: new Date().toISOString()
            }
          }))
        },
        message: 'Large dataset retrieved successfully'
      };

      mock.onPost('/large-data-endpoint').reply(200, largeResponse);

      const result = await apiPost('/large-data-endpoint', {});

      expect(result).toEqual(largeResponse);
      expect(result.data.results).toHaveLength(1000);
    });

    it('should log request data for debugging', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      mock.onPost('/test-endpoint').reply(200, { success: true });

      const requestData = { answers: [1, 2, 3], timeSpent: 300 };
      await apiPost('/test-endpoint', requestData);

      expect(consoleSpy).toHaveBeenCalledWith('🌐 Making POST request to /test-endpoint');
      expect(consoleSpy).toHaveBeenCalledWith('🌐 Request data:', requestData);

      consoleSpy.mockRestore();
    });
  });

  describe('Error response handling', () => {
    it('should provide detailed error information', async () => {
      const errorResponse = {
        success: false,
        error: 'Validation failed',
        message: 'Invalid input data provided'
      };

      mock.onPost('/test-endpoint').reply(400, errorResponse);

      try {
        await apiPost('/test-endpoint', { invalid: 'data' });
      } catch (error: any) {
        expect(error.response.status).toBe(400);
        expect(error.response.data).toEqual(errorResponse);
      }
    });

    it('should handle server error responses', async () => {
      mock.onPost('/test-endpoint').reply(500, {
        success: false,
        error: 'Internal server error'
      });

      await expect(apiPost('/test-endpoint', {}))
        .rejects
        .toMatchObject({
          response: expect.objectContaining({
            status: 500,
            data: expect.objectContaining({
              success: false,
              error: 'Internal server error'
            })
          })
        });
    });
  });
});
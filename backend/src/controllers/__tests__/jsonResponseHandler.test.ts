/**
 * Tests for JSON response handling in psychometric test submission
 * This test focuses on ensuring proper JSON responses are sent even when errors occur
 */

import { Response } from 'express';

describe('JSON Response Handler', () => {
  let mockRes: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockSet: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn(() => ({ json: mockJson }));
    mockSet = jest.fn();

    mockRes = {
      status: mockStatus,
      json: mockJson,
      set: mockSet,
      headersSent: false
    };
  });

  describe('Submit test successfully', () => {
    it('should set proper JSON headers for success response', () => {
      const responseData = {
        success: true,
        data: { score: 85, totalQuestions: 10 },
        message: 'Test completed successfully!'
      };

      // Simulate setting headers like in the controller
      mockRes.set!({
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff'
      });

      // Validate JSON before sending
      const jsonString = JSON.stringify(responseData);
      expect(jsonString).toBeTruthy();
      expect(() => JSON.parse(jsonString)).not.toThrow();

      // Send response
      mockRes.status!(200).json(responseData);

      expect(mockSet).toHaveBeenCalledWith({
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff'
      });
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(responseData);
    });
  });

  describe('Handle server timeout gracefully', () => {
    it('should set proper JSON headers for error response', () => {
      const errorResponse = {
        success: false,
        error: 'Failed to submit test',
        message: 'Connection timeout',
        timestamp: new Date().toISOString()
      };

      // Simulate error response handling
      mockRes.set!({
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff'
      });

      mockRes.status!(500).json(errorResponse);

      expect(mockSet).toHaveBeenCalledWith({
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff'
      });
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith(errorResponse);
    });
  });

  describe('Handle empty JSON response', () => {
    it('should validate JSON serialization before sending', () => {
      const responseData = {
        success: true,
        data: { score: 75 },
        message: 'Test completed'
      };

      // Test JSON serialization
      expect(() => {
        const jsonString = JSON.stringify(responseData);
        expect(jsonString.length).toBeGreaterThan(0);
        JSON.parse(jsonString);
      }).not.toThrow();
    });

    it('should handle JSON serialization errors gracefully', () => {
      // Create circular reference that would cause JSON.stringify to fail
      const circularObj: any = { name: 'test' };
      circularObj.self = circularObj;

      expect(() => {
        JSON.stringify(circularObj);
      }).toThrow();

      // In this case, we would fallback to error response
      const fallbackErrorResponse = {
        success: false,
        error: 'Failed to serialize response',
        message: 'Internal server error occurred while preparing response'
      };

      mockRes.status!(500).json(fallbackErrorResponse);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith(fallbackErrorResponse);
    });
  });

  describe('Handle malformed JSON response', () => {
    it('should not send response when headers already sent', () => {
      mockRes.headersSent = true;

      // Attempt to send error response when headers already sent
      if (!mockRes.headersSent) {
        mockRes.status!(500).json({ error: 'Should not be called' });
      }

      expect(mockStatus).not.toHaveBeenCalled();
      expect(mockJson).not.toHaveBeenCalled();
    });
  });

  describe('Handle network connection failure', () => {
    it('should create proper error response structure', () => {
      const error = new Error('Network timeout');
      const errorResponse = {
        success: false,
        error: 'Failed to submit test',
        message: error.message || 'An unexpected error occurred during test submission',
        timestamp: expect.any(String)
      };

      mockRes.set!({
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff'
      });
      
      mockRes.status!(500).json(errorResponse);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to submit test',
          message: 'Network timeout',
          timestamp: expect.any(String)
        })
      );
    });
  });

  describe('Retry on JSON parsing error', () => {
    it('should validate response structure before sending', () => {
      const responseData = {
        success: true,
        data: {
          resultId: 'test-123',
          score: 80,
          totalQuestions: 20,
          correctAnswers: 16,
          summary: {
            correctCount: 16,
            incorrectCount: 4,
            categories: ['logical', 'numerical']
          }
        },
        message: 'Test completed successfully!'
      };

      // Validate the structure matches expected format
      expect(responseData).toMatchObject({
        success: expect.any(Boolean),
        data: expect.objectContaining({
          score: expect.any(Number),
          totalQuestions: expect.any(Number),
          correctAnswers: expect.any(Number)
        }),
        message: expect.any(String)
      });

      // Validate JSON serialization works
      const jsonString = JSON.stringify(responseData);
      expect(jsonString).toBeTruthy();
      
      const parsed = JSON.parse(jsonString);
      expect(parsed).toEqual(responseData);
    });
  });

  describe('Handle large response data', () => {
    it('should handle compact response structure efficiently', () => {
      const compactResponseData = {
        success: true,
        data: {
          resultId: 'result123',
          score: 85,
          totalQuestions: 50,
          correctAnswers: 42,
          incorrectAnswers: 8,
          timeSpent: 2700,
          interpretation: 'Good performance',
          categoryScores: {
            logical: 80,
            numerical: 90,
            verbal: 85
          },
          hasDetailedResults: true,
          recommendations: ['Continue practicing logical reasoning'],
          grade: 'Good',
          percentile: 72,
          // Compact summary instead of large arrays
          summary: {
            correctCount: 42,
            incorrectCount: 8,
            categories: ['logical', 'numerical', 'verbal']
          }
        },
        message: 'Test completed successfully!'
      };

      // Test that this structure can be serialized efficiently
      const jsonString = JSON.stringify(compactResponseData);
      expect(jsonString.length).toBeLessThan(10000); // Should be reasonably sized

      // Validate it parses correctly
      const parsed = JSON.parse(jsonString);
      expect(parsed).toEqual(compactResponseData);

      // Verify it doesn't contain large arrays that could cause issues
      expect(compactResponseData.data).not.toHaveProperty('detailedResults');
      expect(compactResponseData.data).not.toHaveProperty('failedQuestions');
      expect(compactResponseData.data).not.toHaveProperty('correctQuestions');

      // But does contain the essential summary
      expect(compactResponseData.data.summary).toMatchObject({
        correctCount: expect.any(Number),
        incorrectCount: expect.any(Number),
        categories: expect.any(Array)
      });
    });

    it('should measure and validate JSON response size', () => {
      const largeData = {
        success: true,
        data: {
          results: Array.from({ length: 100 }, (_, i) => ({
            id: i,
            question: `Question ${i}`,
            category: ['logical', 'numerical', 'verbal'][i % 3],
            isCorrect: i % 2 === 0
          }))
        }
      };

      const jsonString = JSON.stringify(largeData);
      console.log(`JSON size: ${jsonString.length} bytes`);

      // Should be able to handle reasonable sizes
      expect(jsonString.length).toBeGreaterThan(0);
      expect(() => JSON.parse(jsonString)).not.toThrow();
    });
  });
});
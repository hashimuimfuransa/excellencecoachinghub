import { Request, Response } from 'express';
import { 
  submitPsychometricTest
} from '../simplePsychometricController';
import { PsychometricTestSession, PsychometricTestResult } from '../../models';
import { AIQuestionGenerator } from '../../services/aiQuestionGenerator';

// Mock dependencies
jest.mock('../../models');
jest.mock('../../services/aiQuestionGenerator');

// Mock Request interface with auth
interface MockAuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

describe('SimplePsychometricController - JSON Response Handling', () => {
  let mockReq: Partial<MockAuthRequest>;
  let mockRes: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockSet: jest.Mock;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup response mocks
    mockJson = jest.fn();
    mockStatus = jest.fn(() => ({ json: mockJson }));
    mockSet = jest.fn();

    mockReq = {
      user: { id: 'user123', email: 'test@example.com' },
      params: { sessionId: 'session123' },
      body: { answers: [1, 2, 0, 1], timeSpent: 300 }
    };

    mockRes = {
      status: mockStatus,
      json: mockJson,
      set: mockSet,
      headersSent: false
    };
  });

  describe('Submit test successfully', () => {
    it('should return valid JSON response with correct headers', async () => {
      // Mock test session
      const mockTestSession = {
        _id: 'session123',
        user: 'user123',
        questions: [
          { id: 1, question: 'Q1', options: ['A', 'B', 'C'], correctAnswer: 1, category: 'logical' },
          { id: 2, question: 'Q2', options: ['A', 'B', 'C'], correctAnswer: 2, category: 'numerical' },
          { id: 3, question: 'Q3', options: ['A', 'B', 'C'], correctAnswer: 0, category: 'logical' },
          { id: 4, question: 'Q4', options: ['A', 'B', 'C'], correctAnswer: 1, category: 'verbal' }
        ],
        job: { _id: 'job123', title: 'Software Developer', company: 'TechCorp' },
        testLevel: 'intermediate',
        status: 'in-progress',
        timeLimit: 30,
        startedAt: new Date(Date.now() - 300000), // 5 minutes ago
        save: jest.fn()
      };

      // Mock test result
      const mockTestResult = {
        _id: 'result123',
        user: 'user123',
        scores: { logical: 50, numerical: 0, verbal: 0 },
        interpretation: 'Good performance',
        recommendations: ['Practice more'],
        timeSpent: 300,
        save: jest.fn()
      };

      (PsychometricTestSession.findById as jest.Mock).mockResolvedValue(mockTestSession);
      (PsychometricTestResult.findOne as jest.Mock).mockResolvedValue(null);
      (PsychometricTestResult.create as jest.Mock).mockResolvedValue(mockTestResult);
      (AIQuestionGenerator.prototype.evaluateAnswers as jest.Mock).mockResolvedValue([
        { isCorrect: true, correctAnswer: 1, userAnswer: 1, question: 'Q1', category: 'logical', explanation: 'Correct!' },
        { isCorrect: true, correctAnswer: 2, userAnswer: 2, question: 'Q2', category: 'numerical', explanation: 'Correct!' },
        { isCorrect: true, correctAnswer: 0, userAnswer: 0, question: 'Q3', category: 'logical', explanation: 'Correct!' },
        { isCorrect: true, correctAnswer: 1, userAnswer: 1, question: 'Q4', category: 'verbal', explanation: 'Correct!' }
      ]);

      await submitPsychometricTest(mockReq as MockAuthRequest, mockRes as Response);

      // Verify headers are set correctly
      expect(mockSet).toHaveBeenCalledWith({
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff'
      });

      // Verify response structure
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            resultId: 'result123',
            score: 100, // All answers correct
            totalQuestions: 4,
            correctAnswers: 4,
            incorrectAnswers: 0,
            timeSpent: 300,
            interpretation: 'Good performance',
            categoryScores: { logical: 50, numerical: 0, verbal: 0 },
            hasDetailedResults: true,
            recommendations: ['Practice more'],
            grade: 'Excellent',
            percentile: 85,
            summary: expect.objectContaining({
              correctCount: 4,
              incorrectCount: 0,
              categories: ['logical', 'numerical', 'verbal']
            })
          }),
          message: 'Test completed successfully!'
        })
      );
    });
  });

  describe('Handle server timeout gracefully', () => {
    it('should handle database timeout and return error JSON', async () => {
      // Mock database timeout
      (PsychometricTestSession.findById as jest.Mock).mockRejectedValue(new Error('Connection timeout'));

      await submitPsychometricTest(mockReq as MockAuthRequest, mockRes as Response);

      // Verify error response has proper JSON headers
      expect(mockSet).toHaveBeenCalledWith({
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff'
      });

      // Verify error response structure
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to submit test',
          message: 'Connection timeout',
          timestamp: expect.any(String)
        })
      );
    });
  });

  describe('Handle empty JSON response', () => {
    it('should validate JSON before sending and handle serialization errors', async () => {
      // Create a mock object that will cause JSON.stringify to fail
      const circularObj: any = { name: 'test' };
      circularObj.self = circularObj; // Creates circular reference

      const mockTestSession = {
        _id: 'session123',
        user: 'user123',
        questions: [],
        job: circularObj, // This will cause JSON.stringify to fail
        testLevel: 'easy',
        status: 'in-progress',
        save: jest.fn()
      };

      (PsychometricTestSession.findById as jest.Mock).mockResolvedValue(mockTestSession);

      await submitPsychometricTest(mockReq as MockAuthRequest, mockRes as Response);

      // Should handle JSON serialization error gracefully
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringMatching(/Failed to serialize response|Failed to submit test/),
          message: expect.any(String)
        })
      );
    });
  });

  describe('Handle malformed JSON response', () => {
    it('should not send response if headers already sent', async () => {
      // Mock headers already sent scenario
      mockRes.headersSent = true;

      // Mock an error to trigger error handling
      (PsychometricTestSession.findById as jest.Mock).mockRejectedValue(new Error('Test error'));

      await submitPsychometricTest(mockReq as MockAuthRequest, mockRes as Response);

      // Should not call json() when headers are already sent
      expect(mockJson).not.toHaveBeenCalled();
      expect(mockStatus).not.toHaveBeenCalled();
      expect(mockSet).not.toHaveBeenCalled();
    });
  });

  describe('Handle network connection failure', () => {
    it('should handle missing session gracefully', async () => {
      // Mock session not found
      (PsychometricTestSession.findById as jest.Mock).mockResolvedValue(null);

      await submitPsychometricTest(mockReq as MockAuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to submit test',
          message: expect.stringContaining('Test session not found')
        })
      );
    });
  });

  describe('Retry on JSON parsing error', () => {
    it('should handle invalid user authentication', async () => {
      // Mock request without user
      mockReq.user = undefined;

      await submitPsychometricTest(mockReq as MockAuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to submit test',
          message: expect.stringContaining('User not authenticated')
        })
      );
    });
  });

  describe('Handle large response data', () => {
    it('should handle response with compact data structure', async () => {
      // Mock test session with many questions
      const largeQuestionSet = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        question: `Question ${i + 1}`,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: i % 4,
        category: ['logical', 'numerical', 'verbal', 'analytical'][i % 4]
      }));

      const mockTestSession = {
        _id: 'session123',
        user: 'user123',
        questions: largeQuestionSet,
        job: { _id: 'job123', title: 'Software Developer', company: 'TechCorp' },
        testLevel: 'hard',
        status: 'in-progress',
        timeLimit: 60,
        startedAt: new Date(Date.now() - 300000),
        save: jest.fn()
      };

      const mockTestResult = {
        _id: 'result123',
        user: 'user123',
        scores: { logical: 75, numerical: 80, verbal: 70, analytical: 85 },
        interpretation: 'Excellent performance',
        recommendations: ['Continue practicing'],
        timeSpent: 3600,
        save: jest.fn()
      };

      // Mock large answers array
      mockReq.body = { 
        answers: Array.from({ length: 50 }, (_, i) => i % 4), 
        timeSpent: 3600 
      };

      (PsychometricTestSession.findById as jest.Mock).mockResolvedValue(mockTestSession);
      (PsychometricTestResult.findOne as jest.Mock).mockResolvedValue(null);
      (PsychometricTestResult.create as jest.Mock).mockResolvedValue(mockTestResult);
      
      // Mock detailed results for all questions
      const mockDetailedResults = largeQuestionSet.map((q, i) => ({
        isCorrect: i % 2 === 0, // Half correct, half incorrect
        correctAnswer: q.correctAnswer,
        userAnswer: i % 4,
        question: q.question,
        category: q.category,
        explanation: `Explanation for question ${i + 1}`
      }));

      (AIQuestionGenerator.prototype.evaluateAnswers as jest.Mock).mockResolvedValue(mockDetailedResults);

      await submitPsychometricTest(mockReq as MockAuthRequest, mockRes as Response);

      // Verify response uses compact structure
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            summary: expect.objectContaining({
              correctCount: 25, // Half of 50
              incorrectCount: 25,
              categories: expect.arrayContaining(['logical', 'numerical', 'verbal', 'analytical'])
            })
          })
        })
      );

      // Verify response doesn't contain large arrays that could cause JSON issues
      const responseCall = mockJson.mock.calls[0][0];
      expect(responseCall.data).not.toHaveProperty('detailedResults');
      expect(responseCall.data).not.toHaveProperty('failedQuestions');
      expect(responseCall.data).not.toHaveProperty('correctQuestions');
    });
  });
});
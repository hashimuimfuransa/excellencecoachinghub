import { Request, Response } from 'express';
import { 
  submitPsychometricTest,
  startPsychometricTest
} from '../simplePsychometricController';
import { TestSession, PsychometricTestResult, Job } from '../../models';
import { AuthRequest } from '../../middleware/auth';
import mongoose from 'mongoose';

// Mock dependencies
jest.mock('../../models');
jest.mock('mongoose');

describe('SimplePsychometricController - Debug Tests for 500 Error', () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockSet: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockJson = jest.fn();
    mockStatus = jest.fn(() => ({ json: mockJson }));
    mockSet = jest.fn();

    mockReq = {
      user: { id: 'user123', email: 'test@example.com' },
      params: { sessionId: '68b044cda17f7b6db6ea1fe1' },
      body: { 
        answers: [1, 2, 0, 1, 3, 2, 1, 0, 2, 1] // 10 answers
      }
    };

    mockRes = {
      status: mockStatus,
      json: mockJson,
      set: mockSet,
      headersSent: false
    };

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Submit with valid session ID', () => {
    it('should submit test successfully with complete data', async () => {
      const mockTestSession = {
        _id: '68b044cda17f7b6db6ea1fe1',
        user: new mongoose.Types.ObjectId('user123'),
        job: {
          _id: 'job123',
          title: 'Software Developer',
          company: 'TechCorp',
          industry: 'Technology'
        },
        testLevel: 'intermediate',
        status: 'in_progress',
        timeLimit: 30,
        startedAt: new Date(Date.now() - 300000), // 5 minutes ago
        questions: [
          {
            question: 'What is 2+2?',
            options: ['3', '4', '5', '6'],
            correctAnswer: 1,
            category: 'numerical',
            explanation: '2+2 equals 4'
          },
          {
            question: 'Which is a programming language?',
            options: ['HTML', 'JavaScript', 'CSS', 'SQL'],
            correctAnswer: 1,
            category: 'cognitive',
            explanation: 'JavaScript is a programming language'
          },
          {
            question: 'Complete the pattern: A, C, E, ?',
            options: ['F', 'G', 'H', 'I'],
            correctAnswer: 1,
            category: 'problem-solving',
            explanation: 'The pattern is odd letters: A, C, E, G'
          }
        ],
        purchase: null,
        save: jest.fn().mockResolvedValue(true)
      };

      const mockTestResult = {
        _id: 'result123',
        user: 'user123',
        job: 'job123',
        answers: [1, 2, 0],
        scores: { numerical: 100, cognitive: 0, 'problem-solving': 0 },
        overallScore: 33,
        interpretation: 'Average performance with room for improvement',
        recommendations: ['Practice more', 'Focus on weak areas'],
        timeSpent: 5,
        attempt: 1,
        testMetadata: {
          testId: '68b044cda17f7b6db6ea1fe1',
          title: 'Psychometric Assessment for Software Developer',
          type: 'job-specific',
          categories: ['numerical', 'cognitive', 'problem-solving'],
          difficulty: 'intermediate',
          isGenerated: true,
          jobSpecific: true
        },
        save: jest.fn().mockResolvedValue(true)
      };

      // Mock successful database operations
      (TestSession.findOne as jest.Mock).mockResolvedValue(mockTestSession);
      (PsychometricTestResult.findOne as jest.Mock).mockResolvedValue(null);
      (PsychometricTestResult.create as jest.Mock).mockResolvedValue(mockTestResult);

      // Adjust request to match question count
      mockReq.body = { answers: [1, 2, 0] };

      await submitPsychometricTest(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            resultId: 'result123',
            score: 33,
            totalQuestions: 3,
            correctAnswers: 1,
            incorrectAnswers: 2
          })
        })
      );
    });
  });

  describe('Database connection timeout error', () => {
    it('should handle MongoDB connection timeout gracefully', async () => {
      const timeoutError = new Error('MongoTimeoutError: Server selection timed out after 30000 ms');
      timeoutError.name = 'MongoTimeoutError';
      
      (TestSession.findOne as jest.Mock).mockRejectedValue(timeoutError);

      await submitPsychometricTest(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to submit test',
          message: expect.stringContaining('Server selection timed out')
        })
      );
    });
  });

  describe('Invalid session ID format', () => {
    it('should handle invalid ObjectId format', async () => {
      mockReq.params = { sessionId: 'invalid-id-format' };

      const castError = new Error('Cast to ObjectId failed');
      castError.name = 'CastError';
      
      (TestSession.findOne as jest.Mock).mockRejectedValue(castError);

      await submitPsychometricTest(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to submit test'
        })
      );
    });
  });

  describe('Missing answers in request body', () => {
    it('should handle missing answers array', async () => {
      mockReq.body = {};

      await submitPsychometricTest(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Answers must be provided as an array'
        })
      );
    });

    it('should handle non-array answers', async () => {
      mockReq.body = { answers: 'not-an-array' };

      await submitPsychometricTest(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Answers must be provided as an array'
        })
      );
    });
  });

  describe('Session not found in database', () => {
    it('should handle non-existent session', async () => {
      (TestSession.findOne as jest.Mock).mockResolvedValue(null);

      await submitPsychometricTest(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Test session not found'
        })
      );
    });
  });

  describe('User authentication failure', () => {
    it('should handle missing user authentication', async () => {
      mockReq.user = undefined;

      await submitPsychometricTest(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'User not authenticated'
        })
      );
    });

    it('should handle user with missing ID', async () => {
      mockReq.user = { email: 'test@example.com' } as any;

      await submitPsychometricTest(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'User not authenticated'
        })
      );
    });
  });

  describe('Model validation errors', () => {
    it('should handle PsychometricTestResult validation errors', async () => {
      const mockTestSession = {
        _id: '68b044cda17f7b6db6ea1fe1',
        user: 'user123',
        job: { _id: 'job123', title: 'Software Developer' },
        testLevel: 'intermediate',
        status: 'in_progress',
        timeLimit: 30,
        startedAt: new Date(),
        questions: [
          {
            question: 'Test question',
            options: ['A', 'B', 'C', 'D'],
            correctAnswer: 1,
            category: 'cognitive',
            explanation: 'Test explanation'
          }
        ],
        save: jest.fn().mockResolvedValue(true)
      };

      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      
      (TestSession.findOne as jest.Mock).mockResolvedValue(mockTestSession);
      (PsychometricTestResult.findOne as jest.Mock).mockResolvedValue(null);
      (PsychometricTestResult.create as jest.Mock).mockRejectedValue(validationError);

      mockReq.body = { answers: [1] };

      await submitPsychometricTest(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to submit test'
        })
      );
    });
  });

  describe('Circular reference JSON error', () => {
    it('should handle JSON serialization errors', async () => {
      const mockTestSession = {
        _id: '68b044cda17f7b6db6ea1fe1',
        user: 'user123',
        job: { _id: 'job123', title: 'Software Developer' },
        testLevel: 'intermediate',
        status: 'in_progress',
        timeLimit: 30,
        startedAt: new Date(),
        questions: [
          {
            question: 'Test question',
            options: ['A', 'B', 'C', 'D'],
            correctAnswer: 1,
            category: 'cognitive',
            explanation: 'Test explanation'
          }
        ],
        save: jest.fn().mockResolvedValue(true)
      };

      // Create circular reference in test result
      const mockTestResult: any = {
        _id: 'result123',
        user: 'user123',
        job: 'job123',
        answers: [1],
        scores: { cognitive: 100 },
        overallScore: 100,
        interpretation: 'Excellent performance',
        recommendations: ['Keep it up'],
        timeSpent: 5,
        save: jest.fn().mockResolvedValue(true)
      };
      // Create circular reference
      mockTestResult.circular = mockTestResult;

      (TestSession.findOne as jest.Mock).mockResolvedValue(mockTestSession);
      (PsychometricTestResult.findOne as jest.Mock).mockResolvedValue(null);
      (PsychometricTestResult.create as jest.Mock).mockResolvedValue(mockTestResult);

      // Mock JSON.stringify to throw error
      const originalStringify = JSON.stringify;
      jest.spyOn(JSON, 'stringify').mockImplementationOnce(() => {
        throw new Error('Converting circular structure to JSON');
      });

      mockReq.body = { answers: [1] };

      await submitPsychometricTest(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to serialize response',
          message: 'Internal server error occurred while preparing response'
        })
      );

      // Restore original stringify
      jest.spyOn(JSON, 'stringify').mockImplementation(originalStringify);
    });
  });

  // Additional test for session status validation
  describe('Test session status validation', () => {
    it('should handle session with invalid status', async () => {
      const mockTestSession = {
        _id: '68b044cda17f7b6db6ea1fe1',
        user: 'user123',
        job: { _id: 'job123', title: 'Software Developer' },
        testLevel: 'intermediate',
        status: 'expired', // Invalid status for submission
        timeLimit: 30,
        questions: [],
        save: jest.fn()
      };

      (TestSession.findOne as jest.Mock).mockResolvedValue(mockTestSession);

      await submitPsychometricTest(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Test session is not available for submission (status: expired)'
        })
      );
    });
  });

  // Test for missing job data in session
  describe('Test missing job data', () => {
    it('should handle session with null job reference', async () => {
      const mockTestSession = {
        _id: '68b044cda17f7b6db6ea1fe1',
        user: 'user123',
        job: null, // Missing job data
        testLevel: 'intermediate',
        status: 'in_progress',
        timeLimit: 30,
        questions: [
          {
            question: 'Test question',
            options: ['A', 'B', 'C', 'D'],
            correctAnswer: 1,
            category: 'cognitive',
            explanation: 'Test explanation'
          }
        ],
        save: jest.fn().mockResolvedValue(true)
      };

      (TestSession.findOne as jest.Mock).mockResolvedValue(mockTestSession);

      mockReq.body = { answers: [1] };

      await submitPsychometricTest(mockReq as AuthRequest, mockRes as Response);

      // This should cause an error when trying to access job.title
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to submit test'
        })
      );
    });
  });
});
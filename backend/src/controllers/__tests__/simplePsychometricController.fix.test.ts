import { Request, Response } from 'express';
import { submitPsychometricTest } from '../simplePsychometricController';
import { TestSession, PsychometricTestResult } from '../../models';
import { AuthRequest } from '../../middleware/auth';
import mongoose from 'mongoose';

// Mock dependencies
jest.mock('../../models');

describe('SimplePsychometricController - Fix 500 Error Tests', () => {
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

  describe('Identify and Fix Root Cause of 500 Error', () => {
    it('should handle job data being null/undefined', async () => {
      const mockTestSession = {
        _id: '68b044cda17f7b6db6ea1fe1',
        user: 'user123',
        job: null, // This is likely causing the error
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

      (TestSession.findOne as jest.Mock).mockResolvedValue(mockTestSession);
      (PsychometricTestResult.findOne as jest.Mock).mockResolvedValue(null);

      mockReq.body = { answers: [1] };

      await submitPsychometricTest(mockReq as AuthRequest, mockRes as Response);

      // This should cause a 500 error when trying to access testSession.job.title
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to submit test'
        })
      );
    });

    it('should handle job data with missing _id property', async () => {
      const mockTestSession = {
        _id: '68b044cda17f7b6db6ea1fe1',
        user: 'user123',
        job: { title: 'Software Developer' }, // Missing _id property
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

      (TestSession.findOne as jest.Mock).mockResolvedValue(mockTestSession);
      (PsychometricTestResult.findOne as jest.Mock).mockResolvedValue(null);

      mockReq.body = { answers: [1] };

      await submitPsychometricTest(mockReq as AuthRequest, mockRes as Response);

      // This might cause issues when trying to access testSession.job._id
      expect(mockStatus).toHaveBeenCalledWith(500);
    });

    it('should handle the exact session ID from production logs', async () => {
      // Test with the exact session ID from the error: 68b044cda17f7b6db6ea1fe1
      mockReq.params = { sessionId: '68b044cda17f7b6db6ea1fe1' };
      
      // Mock session not found (most likely scenario)
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

    it('should handle PsychometricTestResult.create throwing an error', async () => {
      const mockTestSession = {
        _id: '68b044cda17f7b6db6ea1fe1',
        user: 'user123',
        job: {
          _id: 'job123',
          title: 'Software Developer',
          company: 'TechCorp'
        },
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

      // Mock PsychometricTestResult.create to throw a validation error
      const validationError = new Error('Validation failed: job: Path `job` is required');
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
          error: 'Failed to submit test',
          message: 'Validation failed: job: Path `job` is required'
        })
      );
    });

    it('should handle database connection timeouts', async () => {
      const timeoutError = new Error('MongoTimeoutError: Server selection timed out after 30000 ms');
      timeoutError.name = 'MongoTimeoutError';

      (TestSession.findOne as jest.Mock).mockRejectedValue(timeoutError);

      await submitPsychometricTest(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to submit test',
          message: 'MongoTimeoutError: Server selection timed out after 30000 ms'
        })
      );
    });

    it('should handle large response causing JSON serialization issues', async () => {
      const mockTestSession = {
        _id: '68b044cda17f7b6db6ea1fe1',
        user: 'user123',
        job: {
          _id: 'job123',
          title: 'Software Developer',
          company: 'TechCorp'
        },
        testLevel: 'intermediate',
        status: 'in_progress',
        timeLimit: 30,
        startedAt: new Date(),
        questions: Array(50).fill(null).map((_, index) => ({
          question: `Very long test question ${index} with lots of text content that could potentially cause JSON serialization issues when sending large responses back to the client`,
          options: [`Option A with long text ${index}`, `Option B with long text ${index}`, `Option C with long text ${index}`, `Option D with long text ${index}`],
          correctAnswer: index % 4,
          category: 'cognitive',
          explanation: `Very detailed explanation ${index} with lots of text that explains the correct answer in great detail and provides additional context`
        })),
        save: jest.fn().mockResolvedValue(true)
      };

      const mockTestResult = {
        _id: 'result123',
        user: 'user123',
        job: 'job123',
        answers: Array(50).fill(0).map((_, i) => i % 4),
        scores: { cognitive: 75, numerical: 80, verbal: 70 },
        overallScore: 75,
        interpretation: 'A very long interpretation that provides detailed feedback about the test performance',
        recommendations: ['Recommendation 1', 'Recommendation 2', 'Recommendation 3'],
        timeSpent: 30,
        save: jest.fn().mockResolvedValue(true)
      };

      (TestSession.findOne as jest.Mock).mockResolvedValue(mockTestSession);
      (PsychometricTestResult.findOne as jest.Mock).mockResolvedValue(null);
      (PsychometricTestResult.create as jest.Mock).mockResolvedValue(mockTestResult);

      mockReq.body = { answers: Array(50).fill(0).map((_, i) => i % 4) };

      await submitPsychometricTest(mockReq as AuthRequest, mockRes as Response);

      // Should handle large responses without issues
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            score: 75,
            totalQuestions: 50
          })
        })
      );
    });
  });

  describe('Test Specific Error Scenarios from Production', () => {
    it('should handle ObjectId cast errors', async () => {
      // Test with invalid ObjectId format
      mockReq.params = { sessionId: 'invalid-object-id' };
      
      const castError = new Error('Cast to ObjectId failed for value "invalid-object-id" (type string) at path "_id" for model "TestSession"');
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

    it('should handle middleware authentication issues', async () => {
      // Test with undefined user (auth middleware failure)
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

    it('should handle memory/heap errors during processing', async () => {
      const mockTestSession = {
        _id: '68b044cda17f7b6db6ea1fe1',
        user: 'user123',
        job: {
          _id: 'job123',
          title: 'Software Developer'
        },
        testLevel: 'intermediate',
        status: 'in_progress',
        questions: [{ question: 'Test', options: ['A', 'B'], correctAnswer: 0, category: 'test' }],
        save: jest.fn().mockResolvedValue(true)
      };

      (TestSession.findOne as jest.Mock).mockResolvedValue(mockTestSession);
      (PsychometricTestResult.findOne as jest.Mock).mockResolvedValue(null);

      // Mock a memory error during result creation
      const memoryError = new Error('JavaScript heap out of memory');
      memoryError.name = 'RangeError';
      (PsychometricTestResult.create as jest.Mock).mockRejectedValue(memoryError);

      mockReq.body = { answers: [0] };

      await submitPsychometricTest(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to submit test',
          message: 'JavaScript heap out of memory'
        })
      );
    });
  });
});
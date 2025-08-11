import { Request, Response, NextFunction } from 'express';
import { generateToken, startRecording, stopRecording, endRoom } from '../videoController';
import { hmsVideoService } from '../../services/hmsVideoService';
import { User } from '../../models/User';
import { LiveSession } from '../../models/LiveSession';

// Mock dependencies
jest.mock('../../services/hmsVideoService');
jest.mock('../../models/User');
jest.mock('../../models/LiveSession');
jest.mock('express-validator', () => ({
  validationResult: jest.fn(() => ({
    isEmpty: () => true,
    array: () => []
  }))
}));

const mockHmsVideoService = hmsVideoService as jest.Mocked<typeof hmsVideoService>;
const mockUser = User as jest.Mocked<typeof User>;
const mockLiveSession = LiveSession as jest.Mocked<typeof LiveSession>;

describe('Video Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      user: {
        id: 'user123',
        _id: 'user123',
        role: 'student'
      },
      body: {}
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    mockNext = jest.fn();
    
    jest.clearAllMocks();
  });

  describe('generateToken', () => {
    it('should generate token successfully for valid request', async () => {
      const mockUserDoc = {
        id: 'user123',
        role: 'student',
        firstName: 'Test',
        lastName: 'User'
      };

      const mockTokenResponse = {
        token: 'mock-jwt-token',
        roomId: 'room123',
        userId: 'user123',
        role: 'guest'
      };

      mockRequest.body = {
        role: 'student',
        userName: 'Test User'
      };

      mockUser.findById.mockResolvedValue(mockUserDoc as any);
      mockHmsVideoService.generateToken.mockResolvedValue(mockTokenResponse);

      await generateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          token: 'mock-jwt-token',
          roomId: 'room123',
          userId: 'user123',
          role: 'guest',
          userName: 'Test User'
        },
        message: 'Video token generated successfully'
      });
    });

    it('should return 401 if user is not authenticated', async () => {
      mockRequest.user = undefined;

      await generateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'User authentication required'
      });
    });

    it('should return 404 if user is not found', async () => {
      mockRequest.body = {
        role: 'student',
        userName: 'Test User'
      };

      mockUser.findById.mockResolvedValue(null);

      await generateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not found'
      });
    });

    it('should return 403 if user lacks permission for requested role', async () => {
      const mockUserDoc = {
        id: 'user123',
        role: 'student'
      };

      mockRequest.body = {
        role: 'admin',
        userName: 'Test User'
      };

      mockUser.findById.mockResolvedValue(mockUserDoc as any);

      await generateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Insufficient permissions for requested role'
      });
    });

    it('should validate session access when sessionId is provided', async () => {
      const mockUserDoc = {
        id: 'user123',
        role: 'teacher'
      };

      const mockSession = {
        _id: 'session123',
        instructor: 'user123'
      };

      mockRequest.body = {
        role: 'teacher',
        userName: 'Test User',
        sessionId: 'session123'
      };

      mockUser.findById.mockResolvedValue(mockUserDoc as any);
      mockLiveSession.findById.mockResolvedValue(mockSession as any);
      mockHmsVideoService.generateToken.mockResolvedValue({
        token: 'mock-token',
        roomId: 'room123',
        userId: 'user123',
        role: 'host'
      });

      await generateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockLiveSession.findById).toHaveBeenCalledWith('session123');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should return 403 if teacher tries to access session they do not own', async () => {
      const mockUserDoc = {
        id: 'user123',
        role: 'teacher'
      };

      const mockSession = {
        _id: 'session123',
        instructor: 'other-user'
      };

      mockRequest.body = {
        role: 'teacher',
        userName: 'Test User',
        sessionId: 'session123'
      };

      mockUser.findById.mockResolvedValue(mockUserDoc as any);
      mockLiveSession.findById.mockResolvedValue(mockSession as any);

      await generateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'You are not the instructor for this session'
      });
    });
  });

  describe('startRecording', () => {
    it('should start recording successfully for teacher', async () => {
      const mockUserDoc = {
        id: 'user123',
        role: 'teacher'
      };

      const mockSession = {
        _id: 'session123',
        instructor: 'user123',
        meetingId: 'room123'
      };

      mockRequest.body = {
        sessionId: 'session123'
      };

      mockUser.findById.mockResolvedValue(mockUserDoc as any);
      mockLiveSession.findById.mockResolvedValue(mockSession as any);
      mockLiveSession.findByIdAndUpdate.mockResolvedValue(mockSession as any);
      mockHmsVideoService.startRecording.mockResolvedValue({
        recordingId: 'recording123'
      });

      await startRecording(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockHmsVideoService.startRecording).toHaveBeenCalledWith('room123');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          recordingId: 'recording123',
          roomId: 'room123'
        },
        message: 'Recording started successfully'
      });
    });

    it('should return 403 if non-teacher tries to start recording', async () => {
      const mockUserDoc = {
        id: 'user123',
        role: 'student'
      };

      mockRequest.body = {
        sessionId: 'session123'
      };

      mockUser.findById.mockResolvedValue(mockUserDoc as any);

      await startRecording(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Only teachers and admins can start recordings'
      });
    });
  });

  describe('stopRecording', () => {
    it('should stop recording successfully', async () => {
      const mockUserDoc = {
        id: 'user123',
        role: 'teacher'
      };

      const mockSession = {
        _id: 'session123',
        instructor: 'user123',
        meetingId: 'room123'
      };

      mockRequest.body = {
        sessionId: 'session123',
        recordingId: 'recording123'
      };

      mockUser.findById.mockResolvedValue(mockUserDoc as any);
      mockLiveSession.findById.mockResolvedValue(mockSession as any);
      mockLiveSession.findByIdAndUpdate.mockResolvedValue(mockSession as any);
      mockHmsVideoService.stopRecording.mockResolvedValue({
        recordingUrl: 'https://example.com/recording.mp4'
      });

      await stopRecording(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockHmsVideoService.stopRecording).toHaveBeenCalledWith('room123', 'recording123');
      expect(mockLiveSession.findByIdAndUpdate).toHaveBeenCalledWith('session123', {
        recordingStatus: 'completed',
        recordingUrl: 'https://example.com/recording.mp4'
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  describe('endRoom', () => {
    it('should end room successfully for teacher', async () => {
      const mockUserDoc = {
        id: 'user123',
        role: 'teacher'
      };

      const mockSession = {
        _id: 'session123',
        instructor: 'user123',
        meetingId: 'room123',
        endSession: jest.fn().mockResolvedValue(undefined)
      };

      mockRequest.body = {
        sessionId: 'session123',
        reason: 'Session completed'
      };

      mockUser.findById.mockResolvedValue(mockUserDoc as any);
      mockLiveSession.findById.mockResolvedValue(mockSession as any);
      mockHmsVideoService.endRoom.mockResolvedValue(true);

      await endRoom(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockHmsVideoService.endRoom).toHaveBeenCalledWith('room123', 'Session completed');
      expect(mockSession.endSession).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          roomId: 'room123'
        },
        message: 'Room ended successfully'
      });
    });

    it('should return 403 if non-teacher tries to end room', async () => {
      const mockUserDoc = {
        id: 'user123',
        role: 'student'
      };

      mockRequest.body = {
        sessionId: 'session123'
      };

      mockUser.findById.mockResolvedValue(mockUserDoc as any);

      await endRoom(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Only teachers and admins can end rooms'
      });
    });
  });

  describe('Error handling', () => {
    it('should call next with error when HMS service throws', async () => {
      const mockUserDoc = {
        id: 'user123',
        role: 'student'
      };

      mockRequest.body = {
        role: 'student',
        userName: 'Test User'
      };

      mockUser.findById.mockResolvedValue(mockUserDoc as any);
      mockHmsVideoService.generateToken.mockRejectedValue(new Error('HMS service error'));

      await generateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle missing room ID gracefully', async () => {
      const mockUserDoc = {
        id: 'user123',
        role: 'teacher'
      };

      mockRequest.body = {
        sessionId: 'session123'
      };

      mockUser.findById.mockResolvedValue(mockUserDoc as any);

      await startRecording(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Room ID is required'
      });
    });
  });
});

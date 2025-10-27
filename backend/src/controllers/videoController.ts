import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { hmsVideoService, HMSTokenRequest, UserRole } from '../services/hmsVideoService';
import { LiveSession } from '../models/LiveSession';
import { User } from '../models/User';
import { asyncHandler } from '../middleware/asyncHandler';

// Validation rules for token generation
export const generateTokenValidation = [
  body('role')
    .isIn(['student', 'teacher', 'admin'])
    .withMessage('Role must be student, teacher, or admin'),
  body('userName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('User name must be between 1 and 50 characters'),
  body('sessionId')
    .optional()
    .isMongoId()
    .withMessage('Invalid session ID'),
  body('roomId')
    .optional()
    .isString()
    .withMessage('Room ID must be a string'),
  body('isRecorder')
    .optional()
    .isBoolean()
    .withMessage('isRecorder must be a boolean')
];

/**
 * Generate HMS token for video session
 * POST /api/video/token
 */
export const generateToken = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
      return;
    }

    const { role, userName, sessionId, isRecorder = false } = req.body;
    const userId = req.user?.id || req.user?._id?.toString();

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
      return;
    }

    // Verify user has permission for the requested role
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    // Check role permissions
    if (!isValidRoleForUser(user.role, role as UserRole)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions for requested role'
      });
      return;
    }

    // If sessionId is provided, verify the session exists and user has access
    if (sessionId) {
      const session = await LiveSession.findById(sessionId);
      if (!session) {
        res.status(404).json({
          success: false,
          error: 'Live session not found'
        });
        return;
      }

      // Check if user has access to this session
      if (role === 'teacher' && session.instructor.toString() !== userId) {
        res.status(403).json({
          success: false,
          error: 'You are not the instructor for this session'
        });
        return;
      }

    }

    // Generate HMS token (roomId will be set to default in the service)
    const tokenRequest: HMSTokenRequest = {
      role: role as UserRole,
      userName,
      userId,
      isRecorder
    };



    const tokenResponse = await hmsVideoService.generateToken(tokenRequest);

    // Update session with room information if sessionId provided
    if (sessionId && tokenResponse.roomId) {
      await LiveSession.findByIdAndUpdate(sessionId, {
        meetingId: tokenResponse.roomId,
        meetingUrl: `https://your-app.100ms.live/meeting/${tokenResponse.roomId}`
      });
    }

    res.status(200).json({
      success: true,
      data: {
        token: tokenResponse.token,
        roomId: tokenResponse.roomId,
        userId: tokenResponse.userId,
        role: tokenResponse.role,
        userName
      },
      message: 'Video token generated successfully'
    });

  } catch (error) {
    console.error('❌ Error generating video token:', error);
    next(error);
  }
});

/**
 * Start recording for a session
 * POST /api/video/recording/start
 */
export const startRecording = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { sessionId, roomId } = req.body;
    const userId = req.user?.id || req.user?._id?.toString();

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
      return;
    }

    // Verify user is teacher or admin
    const user = await User.findById(userId);
    if (!user || !['teacher', 'admin'].includes(user.role)) {
      res.status(403).json({
        success: false,
        error: 'Only teachers and admins can start recordings'
      });
      return;
    }

    let finalRoomId = roomId;

    // If sessionId provided, get room ID from session
    if (sessionId) {
      const session = await LiveSession.findById(sessionId);
      if (!session) {
        res.status(404).json({
          success: false,
          error: 'Live session not found'
        });
        return;
      }

      // Check if user is the instructor (for teachers)
      if (user.role === 'teacher' && session.instructor.toString() !== userId) {
        res.status(403).json({
          success: false,
          error: 'You are not the instructor for this session'
        });
        return;
      }

      finalRoomId = session.meetingId || `session-${sessionId}`;

      // Update session recording status
      await LiveSession.findByIdAndUpdate(sessionId, {
        recordingStatus: 'recording',
        hmsRecordingId: null // Will be updated after successful recording start
      });
    }

    if (!finalRoomId) {
      res.status(400).json({
        success: false,
        error: 'Room ID is required'
      });
      return;
    }

    // Start recording
    console.log('🎥 Starting recording for room:', finalRoomId);
    const recordingResult = await hmsVideoService.startRecording(finalRoomId);
    console.log('🎥 Recording result:', recordingResult);

    if (!recordingResult || !recordingResult.recordingId) {
      res.status(500).json({
        success: false,
        error: 'Failed to start recording - no recording ID received'
      });
      return;
    }

    // Update session with recording ID if sessionId provided
    if (sessionId && recordingResult.recordingId) {
      await LiveSession.findByIdAndUpdate(sessionId, {
        hmsRecordingId: recordingResult.recordingId,
        recordingMetadata: {
          startTime: new Date(),
          resolution: '1280x720'
        }
      });
      console.log('✅ Updated session with recording ID:', recordingResult.recordingId);
    }

    const responseData = {
      success: true,
      data: {
        recordingId: recordingResult.recordingId,
        roomId: finalRoomId
      },
      message: 'Recording started successfully'
    };

    console.log('📤 Sending recording start response:', responseData);
    res.status(200).json(responseData);

  } catch (error) {
    console.error('❌ Error starting recording:', error);
    next(error);
  }
});

/**
 * Stop recording for a session
 * POST /api/video/recording/stop
 */
export const stopRecording = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log('🛑 Stop recording request received:', {
      body: req.body,
      userId: req.user?.id || req.user?._id?.toString()
    });

    const { sessionId, roomId, recordingId } = req.body;
    const userId = req.user?.id || req.user?._id?.toString();

    if (!userId) {
      console.log('❌ No user ID found in request');
      res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
      return;
    }

    if (!recordingId) {
      console.log('❌ No recording ID provided');
      res.status(400).json({
        success: false,
        error: 'Recording ID is required'
      });
      return;
    }

    // Verify user is teacher or admin
    const user = await User.findById(userId);
    if (!user || !['teacher', 'admin'].includes(user.role)) {
      res.status(403).json({
        success: false,
        error: 'Only teachers and admins can stop recordings'
      });
      return;
    }

    let finalRoomId = roomId;

    // If sessionId provided, get room ID from session
    if (sessionId) {
      const session = await LiveSession.findById(sessionId);
      if (!session) {
        res.status(404).json({
          success: false,
          error: 'Live session not found'
        });
        return;
      }

      // Check if user is the instructor (for teachers)
      if (user.role === 'teacher' && session.instructor.toString() !== userId) {
        res.status(403).json({
          success: false,
          error: 'You are not the instructor for this session'
        });
        return;
      }

      finalRoomId = session.meetingId || `session-${sessionId}`;
    }

    if (!finalRoomId || !recordingId) {
      res.status(400).json({
        success: false,
        error: 'Room ID and recording ID are required'
      });
      return;
    }

    // Stop recording
    const recordingResult = await hmsVideoService.stopRecording(finalRoomId, recordingId);

    // Update session with recording URL if sessionId provided
    if (sessionId) {
      const updateData: any = {
        recordingStatus: recordingResult.recordingUrl ? 'completed' : 'failed'
      };

      if (recordingResult.recordingUrl) {
        updateData.recordingUrl = recordingResult.recordingUrl;
        updateData['recordingMetadata.endTime'] = new Date();
      }

      await LiveSession.findByIdAndUpdate(sessionId, updateData);

      // If recording completed successfully, try to add it to course content
      if (recordingResult.recordingUrl) {
        try {
          const session = await LiveSession.findById(sessionId);
          if (session) {
            await session.addRecordingToCourseContent();
          }
        } catch (error) {
          console.error('❌ Error adding recording to course content:', error);
          // Don't fail the response if this fails
        }
      }
    }

    res.status(200).json({
      success: true,
      data: {
        recordingUrl: recordingResult.recordingUrl,
        roomId: finalRoomId
      },
      message: 'Recording stopped successfully'
    });

  } catch (error) {
    console.error('❌ Error stopping recording:', error);
    next(error);
  }
});

/**
 * Enable a room
 * POST /api/video/room/enable
 */
export const enableRoom = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { roomId } = req.body;
    const userId = req.user?.id || req.user?._id?.toString();

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
      return;
    }

    // Verify user is teacher or admin
    const user = await User.findById(userId);
    if (!user || !['teacher', 'admin'].includes(user.role)) {
      res.status(403).json({
        success: false,
        error: 'Only teachers and admins can enable rooms'
      });
      return;
    }

    if (!roomId) {
      res.status(400).json({
        success: false,
        error: 'Room ID is required'
      });
      return;
    }

    // Enable the room
    const success = await hmsVideoService.enableRoom(roomId);

    res.status(200).json({
      success,
      data: {
        roomId,
        enabled: true
      },
      message: success ? 'Room enabled successfully' : 'Failed to enable room'
    });

  } catch (error) {
    console.error('❌ Error enabling room:', error);
    next(error);
  }
});

/**
 * End a video room
 * POST /api/video/room/end
 */
export const endRoom = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { sessionId, roomId, reason } = req.body;
    const userId = req.user?.id || req.user?._id?.toString();

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
      return;
    }

    // Verify user is teacher or admin
    const user = await User.findById(userId);
    if (!user || !['teacher', 'admin'].includes(user.role)) {
      res.status(403).json({
        success: false,
        error: 'Only teachers and admins can end rooms'
      });
      return;
    }

    let finalRoomId = roomId;

    // If sessionId provided, get room ID from session
    if (sessionId) {
      const session = await LiveSession.findById(sessionId);
      if (!session) {
        res.status(404).json({
          success: false,
          error: 'Live session not found'
        });
        return;
      }

      // Check if user is the instructor (for teachers)
      if (user.role === 'teacher' && session.instructor.toString() !== userId) {
        res.status(403).json({
          success: false,
          error: 'You are not the instructor for this session'
        });
        return;
      }

      finalRoomId = session.meetingId || `session-${sessionId}`;

      // End the session
      await session.endSession();
    }

    if (!finalRoomId) {
      res.status(400).json({
        success: false,
        error: 'Room ID is required'
      });
      return;
    }

    // End the room
    const success = await hmsVideoService.endRoom(finalRoomId, reason);

    res.status(200).json({
      success,
      data: {
        roomId: finalRoomId
      },
      message: success ? 'Room ended successfully' : 'Failed to end room'
    });

  } catch (error) {
    console.error('❌ Error ending room:', error);
    next(error);
  }
});

/**
 * Get recording details and status
 * GET /api/video/recording/:recordingId
 */
export const getRecordingDetails = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { recordingId } = req.params;
    const userId = req.user?.id || req.user?._id?.toString();

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
      return;
    }

    // Verify user is teacher or admin
    const user = await User.findById(userId);
    if (!user || !['teacher', 'admin'].includes(user.role)) {
      res.status(403).json({
        success: false,
        error: 'Only teachers and admins can access recording details'
      });
      return;
    }

    if (!recordingId) {
      res.status(400).json({
        success: false,
        error: 'Recording ID is required'
      });
      return;
    }

    // Get recording details
    const recordingDetails = await hmsVideoService.getRecordingDetails(recordingId);

    res.status(200).json({
      success: true,
      data: recordingDetails,
      message: 'Recording details retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error getting recording details:', error);
    next(error);
  }
});

/**
 * Helper function to validate role permissions
 */
function isValidRoleForUser(userRole: string, requestedRole: UserRole): boolean {
  switch (userRole) {
    case 'admin':
      return true; // Admins can use any role
    case 'teacher':
      return ['teacher', 'student'].includes(requestedRole); // Teachers can be teachers or students
    case 'student':
      return requestedRole === 'student'; // Students can only be students
    default:
      return false;
  }
}

import { Router } from 'express';
import {
  generateToken,
  generateTokenValidation,
  startRecording,
  stopRecording,
  endRoom,
  enableRoom,
  getRecordingDetails
} from '../controllers/videoController';
import { protect } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';
import { body } from 'express-validator';

const router = Router();

// All routes require authentication
router.use(protect);

// Validation for recording start operations
const recordingStartValidation = [
  body('sessionId')
    .optional()
    .isMongoId()
    .withMessage('Invalid session ID'),
  body('roomId')
    .optional()
    .isString()
    .withMessage('Room ID must be a string')
];

// Validation for recording stop operations
const recordingStopValidation = [
  body('sessionId')
    .optional()
    .isMongoId()
    .withMessage('Invalid session ID'),
  body('roomId')
    .optional()
    .isString()
    .withMessage('Room ID must be a string'),
  body('recordingId')
    .notEmpty()
    .withMessage('Recording ID is required')
    .isString()
    .withMessage('Recording ID must be a string')
    .isLength({ min: 1 })
    .withMessage('Recording ID cannot be empty')
];

// Validation for ending room
const endRoomValidation = [
  body('sessionId')
    .optional()
    .isMongoId()
    .withMessage('Invalid session ID'),
  body('roomId')
    .optional()
    .isString()
    .withMessage('Room ID must be a string'),
  body('reason')
    .optional()
    .isString()
    .withMessage('Reason must be a string')
];

// Validation for enabling room
const enableRoomValidation = [
  body('roomId')
    .notEmpty()
    .withMessage('Room ID is required')
    .isString()
    .withMessage('Room ID must be a string')
];

/**
 * @route   POST /api/video/token
 * @desc    Generate HMS token for video session
 * @access  Private (authenticated users)
 * @body    { role: 'student'|'teacher'|'admin', userName: string, sessionId?: string, roomId?: string, isRecorder?: boolean }
 */
router.post('/token', generateTokenValidation, validateRequest, generateToken);

/**
 * @route   POST /api/video/recording/start
 * @desc    Start recording for a video session
 * @access  Private (teachers and admins only)
 * @body    { sessionId?: string, roomId?: string }
 */
router.post('/recording/start', recordingStartValidation, validateRequest, startRecording);

/**
 * @route   POST /api/video/recording/stop
 * @desc    Stop recording for a video session
 * @access  Private (teachers and admins only)
 * @body    { sessionId?: string, roomId?: string, recordingId: string }
 */
router.post('/recording/stop', recordingStopValidation, validateRequest, stopRecording);

/**
 * @route   POST /api/video/room/end
 * @desc    End a video room
 * @access  Private (teachers and admins only)
 * @body    { sessionId?: string, roomId?: string, reason?: string }
 */
router.post('/room/end', endRoomValidation, validateRequest, endRoom);

/**
 * @route   POST /api/video/room/enable
 * @desc    Enable a video room
 * @access  Private (teachers and admins only)
 * @body    { roomId: string }
 */
router.post('/room/enable', enableRoomValidation, validateRequest, enableRoom);

/**
 * @route   GET /api/video/recording/:recordingId
 * @desc    Get recording details and status
 * @access  Private (teachers and admins only)
 */
router.get('/recording/:recordingId', getRecordingDetails);

export default router;

import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  getAllSessions,
  getSessionById,
  getSessionsByTeacher,
  getActiveSessions,
  cancelSession,
  getSessionStats,
  forceEndSession,
  endSession,
  getSessionAttendance,
  getSessionRecordings,
  getRecordingById,
  syncRecordedSessionsToCourseContent,
  joinLiveSession
} from '../controllers/liveSessionController';
import { protect } from '../middleware/auth';
import { requireAdmin } from '../middleware/roleAuth';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

// All routes require authentication
router.use(protect);

// Validation schemas
const cancelSessionValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid session ID'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters')
];

const sessionIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid session ID')
];

const teacherIdValidation = [
  param('teacherId')
    .isMongoId()
    .withMessage('Invalid teacher ID')
];

const endSessionValidation = [
  body('sessionId')
    .optional()
    .isMongoId()
    .withMessage('Invalid session ID'),
  body('roomId')
    .optional()
    .isString()
    .withMessage('Room ID must be a string'),
  body('startTime')
    .optional()
    .isISO8601()
    .withMessage('Start time must be a valid date'),
  body('endTime')
    .optional()
    .isISO8601()
    .withMessage('End time must be a valid date'),
  body('attendance')
    .optional()
    .isArray()
    .withMessage('Attendance must be an array'),
  body('recordingId')
    .optional()
    .isString()
    .withMessage('Recording ID must be a string'),
  body('participants')
    .optional()
    .isArray()
    .withMessage('Participants must be an array')
];

const joinSessionValidation = [
  param('sessionId')
    .isMongoId()
    .withMessage('Invalid session ID')
];

// Public routes (teachers can access their own sessions)
router.post('/end', endSessionValidation, validateRequest, endSession);

// Join session route (available to all authenticated users)
router.post('/:sessionId/join', joinSessionValidation, validateRequest, joinLiveSession);

// Admin-only routes
router.get('/', requireAdmin, getAllSessions);
router.get('/stats', requireAdmin, getSessionStats);
router.get('/active', requireAdmin, getActiveSessions);
router.get('/recordings', requireAdmin, getSessionRecordings);
router.get('/recordings/:id', requireAdmin, sessionIdValidation, validateRequest, getRecordingById);
router.get('/teacher/:teacherId', requireAdmin, teacherIdValidation, validateRequest, getSessionsByTeacher);
router.get('/:id', requireAdmin, sessionIdValidation, validateRequest, getSessionById);
router.get('/:id/attendance', requireAdmin, sessionIdValidation, validateRequest, getSessionAttendance);
router.put('/:id/cancel', requireAdmin, cancelSessionValidation, validateRequest, cancelSession);
router.put('/:id/force-end', requireAdmin, sessionIdValidation, validateRequest, forceEndSession);
router.post('/course/:courseId/sync-recordings',
  requireAdmin,
  param('courseId').isMongoId().withMessage('Invalid course ID'),
  validateRequest,
  syncRecordedSessionsToCourseContent
);

export default router;

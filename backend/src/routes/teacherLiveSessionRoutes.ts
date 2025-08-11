import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  createLiveSession,
  getTeacherSessions,
  getSessionById,
  startSession,
  endSession,
  updateSession,
  deleteSession,
  startRecording,
  stopRecording,
  resetRecordingStatus,
  joinSession
} from '../controllers/teacherLiveSessionController';
import { protect } from '../middleware/auth';
import { requireTeacher } from '../middleware/roleAuth';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

// All routes require authentication and teacher role
router.use(protect);
router.use(requireTeacher);

// Validation schemas
const createSessionValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('courseId')
    .isMongoId()
    .withMessage('Invalid course ID'),
  body('scheduledTime')
    .isISO8601()
    .withMessage('Invalid scheduled time format')
    .custom((value) => {
      const scheduledDate = new Date(value);
      const now = new Date();
      if (scheduledDate <= now) {
        throw new Error('Scheduled time must be in the future');
      }
      return true;
    }),
  body('duration')
    .isInt({ min: 15, max: 480 })
    .withMessage('Duration must be between 15 and 480 minutes'),
  body('maxParticipants')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Max participants must be between 1 and 1000'),
  body('isRecorded')
    .optional()
    .isBoolean()
    .withMessage('isRecorded must be a boolean'),
  body('agenda')
    .optional()
    .isArray()
    .withMessage('Agenda must be an array'),
  body('agenda.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Each agenda item must be between 1 and 500 characters'),
  body('chatEnabled')
    .optional()
    .isBoolean()
    .withMessage('chatEnabled must be a boolean'),
  body('handRaiseEnabled')
    .optional()
    .isBoolean()
    .withMessage('handRaiseEnabled must be a boolean'),
  body('screenShareEnabled')
    .optional()
    .isBoolean()
    .withMessage('screenShareEnabled must be a boolean'),
  body('attendanceRequired')
    .optional()
    .isBoolean()
    .withMessage('attendanceRequired must be a boolean')
];

const updateSessionValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid session ID'),
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('scheduledTime')
    .optional()
    .isISO8601()
    .withMessage('Invalid scheduled time format')
    .custom((value) => {
      if (value) {
        const scheduledDate = new Date(value);
        const now = new Date();
        if (scheduledDate <= now) {
          throw new Error('Scheduled time must be in the future');
        }
      }
      return true;
    }),
  body('duration')
    .optional()
    .isInt({ min: 15, max: 480 })
    .withMessage('Duration must be between 15 and 480 minutes'),
  body('maxParticipants')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Max participants must be between 1 and 1000'),
  body('isRecorded')
    .optional()
    .isBoolean()
    .withMessage('isRecorded must be a boolean'),
  body('agenda')
    .optional()
    .isArray()
    .withMessage('Agenda must be an array'),
  body('agenda.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Each agenda item must be between 1 and 500 characters'),
  body('chatEnabled')
    .optional()
    .isBoolean()
    .withMessage('chatEnabled must be a boolean'),
  body('handRaiseEnabled')
    .optional()
    .isBoolean()
    .withMessage('handRaiseEnabled must be a boolean'),
  body('screenShareEnabled')
    .optional()
    .isBoolean()
    .withMessage('screenShareEnabled must be a boolean'),
  body('attendanceRequired')
    .optional()
    .isBoolean()
    .withMessage('attendanceRequired must be a boolean')
];

const sessionIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid session ID')
];

// Routes
router.post('/', createSessionValidation, validateRequest, createLiveSession);
router.get('/', getTeacherSessions);
router.get('/:id', sessionIdValidation, validateRequest, getSessionById);
router.put('/:id', updateSessionValidation, validateRequest, updateSession);
router.delete('/:id', sessionIdValidation, validateRequest, deleteSession);
router.post('/:id/start', sessionIdValidation, validateRequest, startSession);
router.post('/:id/end', sessionIdValidation, validateRequest, endSession);
router.post('/:id/start-recording', sessionIdValidation, validateRequest, startRecording);
router.post('/:id/stop-recording', sessionIdValidation, validateRequest, stopRecording);
router.post('/:id/reset-recording', sessionIdValidation, validateRequest, resetRecordingStatus);

// Join session route (for both teachers and students)
router.use(protect); // Remove teacher requirement for join
router.post('/:id/join', sessionIdValidation, validateRequest, joinSession);

export default router;
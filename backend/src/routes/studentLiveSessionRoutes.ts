import { Router } from 'express';
import { param } from 'express-validator';
import {
  getSessionRecordings,
  getRecordingById,
  getStudentAvailableSessions,
  joinLiveSession
} from '../controllers/liveSessionController';
import { protect } from '../middleware/auth';
import { requireStudent } from '../middleware/roleAuth';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

// All routes require authentication and student role
router.use(protect);
router.use(requireStudent);

// Validation schemas
const sessionIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid session ID')
];

const joinSessionValidation = [
  param('sessionId')
    .isMongoId()
    .withMessage('Invalid session ID')
];

// Student session routes
router.get('/', getStudentAvailableSessions);
router.get('/recordings', getSessionRecordings);
router.get('/recordings/:id', sessionIdValidation, validateRequest, getRecordingById);
router.post('/:sessionId/join', joinSessionValidation, validateRequest, joinLiveSession);

export default router;

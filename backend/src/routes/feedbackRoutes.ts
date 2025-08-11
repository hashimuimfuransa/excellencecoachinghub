import express from 'express';
import {
  submitFeedback,
  getSessionFeedback,
  getTeacherFeedback,
  getTeacherFeedbackStats,
  getAllFeedback
} from '../controllers/feedbackController';
import { protect as auth } from '../middleware/auth';
import { authorizeRoles } from '../middleware/roleAuth';

const router = express.Router();

// Submit feedback (students only)
router.post('/submit', auth, authorizeRoles(['student']), submitFeedback);

// Get feedback for a specific session (teachers and admins)
router.get('/session/:sessionId', auth, authorizeRoles(['teacher', 'admin']), getSessionFeedback);

// Get teacher's feedback (teachers only)
router.get('/teacher', auth, authorizeRoles(['teacher']), getTeacherFeedback);

// Get teacher's feedback statistics (teachers only)
router.get('/teacher/stats', auth, authorizeRoles(['teacher']), getTeacherFeedbackStats);

// Get all feedback (admins only)
router.get('/all', auth, authorizeRoles(['admin']), getAllFeedback);

export default router;

import express from 'express';
import {
  submitWeekFeedback,
  getWeekFeedback,
  getWeekFeedbackStats,
  getCourseFeedback,
  getCourseFeedbackStats,
  hasSubmittedFeedback,
  getUserFeedbackHistory
} from '../controllers/weekFeedbackController';
import { protect as auth } from '../middleware/auth';
import { authorizeRoles } from '../middleware/roleAuth';

const router = express.Router();

// Submit week-end feedback (students only)
router.post('/week-end', auth, authorizeRoles(['student']), submitWeekFeedback);

// Get feedback for a specific week (teachers and admins)
router.get('/week/:weekId', auth, authorizeRoles(['teacher', 'admin', 'super_admin']), getWeekFeedback);

// Get feedback statistics for a week (teachers and admins)
router.get('/week/:weekId/stats', auth, authorizeRoles(['teacher', 'admin', 'super_admin']), getWeekFeedbackStats);

// Get all feedback for a course (admins only)
router.get('/course/:courseId', auth, authorizeRoles(['admin', 'super_admin']), getCourseFeedback);

// Get course feedback statistics (admins only)
router.get('/course/:courseId/stats', auth, authorizeRoles(['admin', 'super_admin']), getCourseFeedbackStats);

// Check if user has already submitted feedback for a week
router.get('/week/:weekId/user/:userId/exists', auth, hasSubmittedFeedback);

// Get user's feedback history
router.get('/user/:userId', auth, getUserFeedbackHistory);

export default router;

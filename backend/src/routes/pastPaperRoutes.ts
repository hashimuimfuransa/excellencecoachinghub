import express from 'express';
import {
  getAllPastPapers,
  getPastPaperById,
  getPastPaperQuestions,
  startPastPaperAttempt,
  submitPastPaperAttempt,
  getStudentAttempts,
  getStudentProgress,
  getPopularPastPapers,
  getRecentPastPapers,
  searchPastPapers
} from '../controllers/pastPaperController';
import { auth } from '../middleware/auth';

const router = express.Router();

// Public routes (no authentication required)
router.get('/', getAllPastPapers);
router.get('/popular', getPopularPastPapers);
router.get('/recent', getRecentPastPapers);
router.get('/search', searchPastPapers);
router.get('/:id', getPastPaperById);
router.get('/:id/questions', getPastPaperQuestions);

// Protected routes (authentication required)
router.post('/:id/start', auth, startPastPaperAttempt);
router.post('/attempts/:attemptId/submit', auth, submitPastPaperAttempt);
router.get('/student/attempts', auth, getStudentAttempts);
router.get('/student/progress', auth, getStudentProgress);

export default router;

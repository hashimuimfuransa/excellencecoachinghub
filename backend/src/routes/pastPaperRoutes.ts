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

// Public routes for taking past papers (no authentication required)
router.post('/:id/start', startPastPaperAttempt);
router.post('/attempts/:attemptId/submit', submitPastPaperAttempt);

// Protected routes (authentication required for viewing personal data)
router.get('/student/attempts', auth, getStudentAttempts);
router.get('/student/progress', auth, getStudentProgress);

export default router;

import express from 'express';
import { auth } from '../middleware/auth';
import {
  generateSmartTest,
  getUserSmartTests,
  getSmartTestById,
  startSmartTest,
  submitSmartTest,
  getUserSmartTestResults
} from '../controllers/smartTestController';

const router = express.Router();

// All routes require authentication
router.use(auth);

// Generate smart test for job preparation
router.post('/generate', generateSmartTest);

// Get user's smart tests
router.get('/user', getUserSmartTests);

// Get user's smart test results
router.get('/results', getUserSmartTestResults);

// Get smart test by ID
router.get('/:testId', getSmartTestById);

// Start smart test session
router.post('/:testId/start', startSmartTest);

// Submit smart test answers
router.post('/:testId/submit', submitSmartTest);

export default router;
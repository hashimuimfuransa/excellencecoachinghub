import express from 'express';
import {
  generatePsychometricTest,
  startPsychometricTest,
  submitPsychometricTest,
  getUserTestResults,
  getDetailedTestResult,
  getTestSession
} from '../controllers/simplePsychometricController';
import { auth } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.post('/generate-test', auth, generatePsychometricTest);
router.get('/start/:sessionId', auth, startPsychometricTest);
router.get('/session/:sessionId', auth, getTestSession);
router.post('/submit/:sessionId', auth, submitPsychometricTest);
router.get('/my-results', auth, getUserTestResults);
router.get('/result/:resultId', auth, getDetailedTestResult);

export default router;
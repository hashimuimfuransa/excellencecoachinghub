import express from 'express';
import { auth } from '@/middleware/auth';
import {
  getPsychometricTests,
  getPsychometricTestById,
  createPsychometricTest,
  updatePsychometricTest,
  deletePsychometricTest,
  takePsychometricTest,
  getUserTestResults,
  getJobTestResults,
  generateJobSpecificTest,
  generateJobSpecificTestDirect,
  getGeneratedTest,
  purchaseTest,
  startTestSession,
  getTestSession,
  updateTestSession,
  checkTestAccess,
  getUserTestPurchases,
  requestTestApproval,
  getPendingTestApprovals,
  getApprovedTests,
  approveTest,
  rejectTest
} from '@/controllers/psychometricTestController';

const router = express.Router();

// Public routes
router.get('/', getPsychometricTests);
router.get('/:id', getPsychometricTestById);

// Protected routes
router.use(auth);

// Super Admin routes
router.post('/', createPsychometricTest);
router.put('/:id', updatePsychometricTest);
router.delete('/:id', deletePsychometricTest);

// Payment and Session routes
router.post('/:testId/purchase', purchaseTest);
router.get('/:testId/access', checkTestAccess);
router.post('/:testId/start-session', startTestSession);
router.get('/session/:sessionId', getTestSession);
router.put('/session/:sessionId', updateTestSession);

// User routes
router.post('/:testId/take', takePsychometricTest);
router.get('/results/my-results', getUserTestResults);
router.get('/purchases/my-purchases', getUserTestPurchases);
router.post('/purchases/:purchaseId/request-approval', requestTestApproval);

// Job-specific test generation
router.post('/generate/job/:jobId', generateJobSpecificTest);
router.post('/generate-job-specific', generateJobSpecificTestDirect);

// Get generated test by ID
router.get('/generated/:testId', getGeneratedTest);

// Employer routes
router.get('/results/job/:jobId', getJobTestResults);

// Admin approval routes
router.get('/approvals/pending', getPendingTestApprovals);
router.get('/approvals/approved', getApprovedTests);
router.post('/approvals/:purchaseId/approve', approveTest);
router.post('/approvals/:purchaseId/reject', rejectTest);

export default router;
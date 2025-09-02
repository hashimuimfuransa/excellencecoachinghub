import express from 'express';
import { auth } from '../middleware/auth';
import { authorizeRoles } from '../middleware/roleAuth';
import {
  generateSmartTest,
  generateFreeSmartTest,
  generatePremiumSmartTest,
  checkFreeTestStatus,
  getUserSmartTests,
  debugUserTests,
  getSmartTestById,
  startSmartTest,
  submitSmartTest,
  getUserSmartTestResults,
  getAdminSmartTests,
  createAdminSmartTest,
  updateAdminSmartTest,
  deleteAdminSmartTest,
  toggleSmartTestStatus,
  uploadSmartTestFile,
  uploadTestContentToExisting,
  togglePublishStatus
} from '../controllers/smartTestController';

const router = express.Router();

// All routes require authentication
router.use(auth);

// Generate smart test for job preparation
router.post('/generate', generateSmartTest);

// Generate free smart test (one-time only)
router.post('/generate-free', generateFreeSmartTest);

// Generate premium smart test (requires payment)
router.post('/generate-premium', generatePremiumSmartTest);

// Check free test status
router.get('/free-test-status', checkFreeTestStatus);

// Debug endpoint to check all user tests
router.get('/debug-user-tests', debugUserTests);

// Get user's smart tests
router.get('/user', getUserSmartTests);

// Get user's smart test results
router.get('/results', getUserSmartTestResults);

// Admin routes (must come before dynamic routes)
// Get admin uploaded smart tests (for job seekers)
router.get('/admin/published', getAdminSmartTests);

// Create admin smart test (requires admin role)
router.post('/admin/create', authorizeRoles(['admin', 'super_admin']), createAdminSmartTest);

// Get all smart tests for admin management (requires admin role)
router.get('/admin/manage', authorizeRoles(['admin', 'super_admin']), getAdminSmartTests);

// Upload smart test file (requires admin role)
router.post('/admin/upload', authorizeRoles(['admin', 'super_admin']), uploadSmartTestFile);

// Update admin smart test (requires admin role)
router.put('/admin/:testId', authorizeRoles(['admin', 'super_admin']), updateAdminSmartTest);

// Delete admin smart test (requires admin role)
router.delete('/admin/:testId', authorizeRoles(['admin', 'super_admin']), deleteAdminSmartTest);

// Toggle smart test status (requires admin role)
router.patch('/admin/:testId/status', authorizeRoles(['admin', 'super_admin']), toggleSmartTestStatus);

// Upload content to existing test (requires admin role)
router.post('/admin/:testId/upload-content', authorizeRoles(['admin', 'super_admin']), uploadTestContentToExisting);

// Toggle publish status (requires admin role)
router.put('/admin/:testId/publish', authorizeRoles(['admin', 'super_admin']), togglePublishStatus);

// Dynamic routes (must come after static routes)
// Get smart test by ID
router.get('/:testId', getSmartTestById);

// Start smart test session
router.post('/:testId/start', startSmartTest);

// Submit smart test answers
router.post('/:testId/submit', submitSmartTest);

export default router;
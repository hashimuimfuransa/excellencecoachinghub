import express from 'express';
import { auth } from '@/middleware/auth';
import { authorizeRoles } from '@/middleware/roleAuth';
import {
  createTestRequest,
  getUserTestRequests,
  getTestRequestById,
  updateTestRequestStatus,
  getPendingRequests,
  getApprovedRequests,
  generateRequestedTests,
  getApprovedTestsForUser,
  completeTestRequest
} from '@/controllers/testRequestController';

const router = express.Router();

// All routes require authentication
router.use(auth);

// User routes
router.post('/create', createTestRequest);
router.get('/my-requests', getUserTestRequests);
router.get('/my-approved', getApprovedTestsForUser);
router.post('/:requestId/complete', completeTestRequest);

// Super Admin routes
router.get('/pending', authorizeRoles(['super_admin']), getPendingRequests);
router.get('/approved', authorizeRoles(['super_admin']), getApprovedRequests);
router.put('/:requestId/status', authorizeRoles(['super_admin']), updateTestRequestStatus);
router.post('/:requestId/generate', authorizeRoles(['super_admin']), generateRequestedTests);

// Shared routes
router.get('/:requestId', getTestRequestById);

export default router;
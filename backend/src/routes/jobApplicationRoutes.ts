import express from 'express';
import { auth } from '@/middleware/auth';
import {
  applyForJob,
  getUserApplications,
  getJobApplications,
  getQualifiedApplicants,
  updateApplicationStatus,
  withdrawApplication,
  getApplicationDetails,
  getEmployerApplications
} from '@/controllers/jobApplicationController';

const router = express.Router();

// All routes require authentication
router.use(auth);

// Job seeker/student routes
router.post('/:jobId/apply', applyForJob);
router.get('/my-applications', getUserApplications);
router.put('/:applicationId/withdraw', withdrawApplication);

// Employer routes
router.get('/employer/all', getEmployerApplications);
router.get('/job/:jobId', getJobApplications);
router.get('/job/:jobId/qualified', getQualifiedApplicants);
router.put('/:applicationId/status', updateApplicationStatus);

// Shared routes
router.get('/:applicationId', getApplicationDetails);

export default router;
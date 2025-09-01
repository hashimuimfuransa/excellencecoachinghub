import express from 'express';
import { auth } from '../middleware/auth';
import {
  getJobs,
  getJobsForStudent,
  getCuratedJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  getJobsByEmployer,
  getRecommendedCourses,
  getJobCategories,
  getAIMatchedJobs
} from '../controllers/jobController';
import { testAIMatchedJobs } from '../controllers/testJobController';
import { getAIMatchedJobsSimple } from '../controllers/jobControllerSimple';

const router = express.Router();

// Public routes
router.get('/', getJobs);
router.get('/categories', getJobCategories);
router.get('/curated', getCuratedJobs);
router.get('/:id', getJobById);
router.get('/:id/recommended-courses', getRecommendedCourses);

// Protected routes
router.use(auth); // All routes below require authentication

router.get('/student/available', getJobsForStudent);
router.get('/ai-matched-test', testAIMatchedJobs);  // Test endpoint
router.get('/ai-matched', getAIMatchedJobsSimple);  // Simple AI-powered job matching endpoint
router.get('/employer/my-jobs', getJobsByEmployer);
router.post('/', createJob);
router.put('/:id', updateJob);
router.delete('/:id', deleteJob);

export default router;
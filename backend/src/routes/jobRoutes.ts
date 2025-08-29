import express from 'express';
import { auth } from '@/middleware/auth';
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
  getJobCategories
} from '@/controllers/jobController';

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
router.get('/employer/my-jobs', getJobsByEmployer);
router.post('/', createJob);
router.put('/:id', updateJob);
router.delete('/:id', deleteJob);

export default router;
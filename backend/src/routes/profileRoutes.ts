import express from 'express';
import { auth } from '@/middleware/auth';
import {
  createOrUpdateJobSeekerProfile,
  createOrUpdateStudentProfile,
  getJobSeekerProfile,
  getStudentProfile,
  getSimpleProfile,
  searchJobSeekers,
  getStudentsByEducationLevel,
  getEligibleStudents
} from '@/controllers/profileController';

const router = express.Router();

// All routes require authentication
router.use(auth);

// Simple profile route for basic user info
router.get('/simple', getSimpleProfile);

// Job seeker profile routes
router.post('/job-seeker', createOrUpdateJobSeekerProfile);
router.put('/job-seeker', createOrUpdateJobSeekerProfile);
router.get('/job-seeker', getJobSeekerProfile);

// Student profile routes
router.post('/student', createOrUpdateStudentProfile);
router.put('/student', createOrUpdateStudentProfile);
router.get('/student', getStudentProfile);

// Search and admin routes
router.get('/job-seekers/search', searchJobSeekers);
router.get('/students/education/:educationLevel', getStudentsByEducationLevel);
router.get('/students/eligible', getEligibleStudents);

export default router;
import express from 'express';
import { 
  getUserSettings, 
  updateUserSettings, 
  getTeacherStudents, 
  getStudentPerformance,
  getStudentDetailedPerformance 
} from '../controllers/settingsController';
import { protect } from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// User settings routes
router.get('/user', getUserSettings);
router.put('/user', updateUserSettings);

// Teacher-specific routes
router.get('/teacher/students', getTeacherStudents);
router.get('/teacher/students/:studentId', getStudentDetailedPerformance);

// Student-specific routes
router.get('/student/performance', getStudentPerformance);

export default router;
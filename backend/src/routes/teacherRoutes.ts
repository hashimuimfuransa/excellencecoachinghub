import express from 'express';
import { 
  getTeacherStats,
  getTeacherStudents,
  getTeacherHomework,
  getTeacherSubmissions
} from '../controllers/teacherController';
import { protect } from '../middleware/auth';
import { authorizeRoles } from '../middleware/roleAuth';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Teacher stats route
router.get('/stats', authorizeRoles(['teacher']), getTeacherStats);

// Teacher students route
router.get('/students', authorizeRoles(['teacher']), getTeacherStudents);

// Teacher homework route
router.get('/homework', authorizeRoles(['teacher']), getTeacherHomework);

// Teacher submissions route
router.get('/submissions', authorizeRoles(['teacher']), getTeacherSubmissions);

export default router;
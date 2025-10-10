import express from 'express';
import { 
  markMaterialCompleted,
  getStudentCourseProgress,
  getStudentWeekProgress,
  markAssessmentCompleted,
  markAssignmentCompleted,
  syncProgressWithServer
} from '../controllers/progressController';
import { auth } from '../middleware/auth';

const router = express.Router();

// Progress tracking routes
router.post('/weeks/:weekId/materials/:materialId/complete', auth, markMaterialCompleted);
router.get('/courses/:courseId/progress', auth, getStudentCourseProgress);
router.get('/weeks/:weekId/progress', auth, getStudentWeekProgress);
router.post('/weeks/:weekId/assessment/complete', auth, markAssessmentCompleted);
router.post('/weeks/:weekId/assignment/complete', auth, markAssignmentCompleted);
router.post('/courses/:courseId/sync', auth, syncProgressWithServer);

export default router;
import express from 'express';
import { 
  getCourseWeeks, 
  getWeek, 
  createWeek, 
  updateWeek, 
  deleteWeek,
  addWeekMaterial,
  updateWeekMaterial,
  deleteWeekMaterial,
  toggleWeekPublish,
  processExamUpload
} from '../controllers/weekController';
import { auth } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';

const router = express.Router();

// Week routes
router.get('/courses/:courseId/weeks', auth, getCourseWeeks);
router.get('/weeks/:weekId', auth, getWeek);
router.post('/courses/:courseId/weeks', auth, requireRole(['teacher', 'admin']), createWeek);
router.put('/weeks/:weekId', auth, requireRole(['teacher', 'admin']), updateWeek);
router.delete('/weeks/:weekId', auth, requireRole(['teacher', 'admin']), deleteWeek);
router.put('/weeks/:weekId/publish', auth, requireRole(['teacher', 'admin']), toggleWeekPublish);

// Week material routes
router.post('/weeks/:weekId/materials', auth, requireRole(['teacher', 'admin']), addWeekMaterial);
router.put('/weeks/:weekId/materials/:materialId', auth, requireRole(['teacher', 'admin']), updateWeekMaterial);
router.delete('/weeks/:weekId/materials/:materialId', auth, requireRole(['teacher', 'admin']), deleteWeekMaterial);

// Exam processing route
router.post('/weeks/:weekId/process-exam', auth, requireRole(['teacher', 'admin']), processExamUpload);

export default router;

import express from 'express';
import { auth, requireRole } from '../middleware/auth';
import {
  getTeacherRecordedSessions,
  uploadRecordedSession,
  getRecordedSession,
  updateRecordedSession,
  deleteRecordedSession,
  incrementViewCount,
  getRecordedSessionsForStudents,
  getAllRecordedSessionsForStudent,
  getAdminRecordedSessions,
  upload
} from '../controllers/recordedSessionController';
import { UserRole } from '../../../shared/types';

const router = express.Router();

// Teacher routes
router.get(
  '/teacher',
  auth,
  requireRole(UserRole.TEACHER, UserRole.ADMIN),
  getTeacherRecordedSessions
);

router.post(
  '/upload',
  auth,
  requireRole(UserRole.TEACHER, UserRole.ADMIN),
  uploadRecordedSession
);

// Admin routes
router.get(
  '/admin',
  auth,
  requireRole(UserRole.ADMIN),
  getAdminRecordedSessions
);

// Student and Professional routes - MUST come before /:id routes to avoid conflicts
router.get(
  '/course/:courseId/student',
  auth,
  requireRole(UserRole.STUDENT, UserRole.PROFESSIONAL),
  getRecordedSessionsForStudents
);

// Get all recorded sessions for a student across all enrolled courses
router.get(
  '/student',
  auth,
  requireRole(UserRole.STUDENT, UserRole.PROFESSIONAL),
  getAllRecordedSessionsForStudent
);

// Generic routes with :id parameter - MUST come after specific routes
router.get(
  '/:id',
  auth,
  requireRole(UserRole.TEACHER, UserRole.STUDENT, UserRole.PROFESSIONAL, UserRole.ADMIN),
  getRecordedSession
);

router.put(
  '/:id',
  auth,
  requireRole(UserRole.TEACHER, UserRole.ADMIN),
  updateRecordedSession
);

router.delete(
  '/:id',
  auth,
  requireRole(UserRole.TEACHER, UserRole.ADMIN),
  deleteRecordedSession
);

router.post(
  '/:id/view',
  auth,
  incrementViewCount
);

export default router;
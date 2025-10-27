import express from 'express';
import { body } from 'express-validator';
import { protect } from '../middleware/auth';
import { requireAdmin } from '../middleware/roleAuth';
import { validateRequest } from '../middleware/validateRequest';
import {
  getAllStudents,
  getStudentDetails,
  getStudentCourseAttendance,
  markAttendance,
  getCourseAttendanceReport,
  getStudentStats,
  updateStudentStatus,
  bulkMarkAttendance
} from '../controllers/studentController';

const router = express.Router();

// Validation schemas
const markAttendanceValidation = [
  body('studentId')
    .notEmpty()
    .withMessage('Student ID is required')
    .isMongoId()
    .withMessage('Invalid student ID'),
  body('courseId')
    .notEmpty()
    .withMessage('Course ID is required')
    .isMongoId()
    .withMessage('Invalid course ID'),
  body('status')
    .isIn(['present', 'absent', 'late', 'excused'])
    .withMessage('Status must be present, absent, late, or excused'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
  body('sessionId')
    .optional()
    .isMongoId()
    .withMessage('Invalid session ID')
];

const bulkAttendanceValidation = [
  body('courseId')
    .notEmpty()
    .withMessage('Course ID is required')
    .isMongoId()
    .withMessage('Invalid course ID'),
  body('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Invalid date format'),
  body('attendanceData')
    .isArray({ min: 1 })
    .withMessage('Attendance data must be a non-empty array'),
  body('attendanceData.*.studentId')
    .notEmpty()
    .withMessage('Student ID is required')
    .isMongoId()
    .withMessage('Invalid student ID'),
  body('attendanceData.*.status')
    .isIn(['present', 'absent', 'late', 'excused'])
    .withMessage('Status must be present, absent, late, or excused'),
  body('attendanceData.*.notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

const updateStatusValidation = [
  body('isActive')
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

// Apply authentication to all routes
router.use(protect);

// Student management routes (Admin only)
router.get('/', requireAdmin, getAllStudents);
router.get('/stats', requireAdmin, getStudentStats);
router.get('/:id', requireAdmin, getStudentDetails);
router.put('/:id/status', requireAdmin, updateStatusValidation, validateRequest, updateStudentStatus);

// Attendance routes (Admin only)
router.post('/attendance/mark', requireAdmin, markAttendanceValidation, validateRequest, markAttendance);
router.post('/attendance/bulk', requireAdmin, bulkAttendanceValidation, validateRequest, bulkMarkAttendance);
router.get('/:studentId/courses/:courseId/attendance', requireAdmin, getStudentCourseAttendance);
router.get('/courses/:courseId/attendance-report', requireAdmin, getCourseAttendanceReport);

export default router;

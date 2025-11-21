import express from 'express';
import {
  getAttendanceRecords,
  getTeacherAttendance,
  markAttendance,
  getTeacherStats,
  getAttendanceByDateRange
} from '../controllers/teacherAttendanceController';

const router = express.Router();

// Get all attendance records
router.get('/', getAttendanceRecords);

// Get attendance records for a specific teacher
router.get('/teacher/:teacherName', getTeacherAttendance);

// Mark attendance for a teacher
router.post('/mark', markAttendance);

// Get teacher statistics
router.get('/stats/:teacherName', getTeacherStats);

// Get attendance records by date range
router.get('/range', getAttendanceByDateRange);

export default router;
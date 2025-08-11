import { Router } from 'express';
import { body } from 'express-validator';
import {
  getAllCourses,
  getCourseById,
  approveCourse,
  rejectCourse,
  updateCourse,
  deleteCourse,
  getCourseStats,
  assignModerator,
  createCourse,
  getEnrolledCourses
} from '../controllers/courseController';
import { getCourseMaterials } from '../controllers/courseMaterialsController';
import { protect, authorize } from '../middleware/auth';
import { requireAdmin } from '../middleware/roleAuth';
import { requireApprovedTeacher } from '../middleware/teacherAuth';
import { validateRequest } from '../middleware/validateRequest';
import { UserRole } from '../../../shared/types';

const router = Router();

// Public routes (no authentication required) - MUST be defined BEFORE protect middleware
router.get('/public', getAllCourses);
router.get('/public/:id', getCourseById);

// All other routes require authentication
router.use(protect);

// Validation schemas
const createCourseValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required'),
  body('level')
    .isIn(['Beginner', 'Intermediate', 'Advanced', 'beginner', 'intermediate', 'advanced'])
    .withMessage('Level must be Beginner, Intermediate, or Advanced'),
  body('price')
    .isNumeric()
    .withMessage('Price must be a number')
    .isFloat({ min: 0 })
    .withMessage('Price must be positive'),
  body('duration')
    .isNumeric()
    .withMessage('Duration must be a number')
    .isInt({ min: 1 })
    .withMessage('Duration must be at least 1 hour')
];

const updateCourseValidation = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
  body('category')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Category cannot be empty'),
  body('level')
    .optional()
    .isIn(['Beginner', 'Intermediate', 'Advanced', 'beginner', 'intermediate', 'advanced'])
    .withMessage('Level must be Beginner, Intermediate, or Advanced'),
  body('price')
    .optional()
    .isNumeric()
    .withMessage('Price must be a number')
    .isFloat({ min: 0 })
    .withMessage('Price must be positive'),
  body('duration')
    .optional()
    .isNumeric()
    .withMessage('Duration must be a number')
    .isInt({ min: 1 })
    .withMessage('Duration must be at least 1 hour')
];

const approveCourseValidation = [
  body('feedback')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Feedback cannot exceed 1000 characters')
];

const rejectCourseValidation = [
  body('feedback')
    .trim()
    .notEmpty()
    .withMessage('Feedback is required when rejecting a course')
    .isLength({ max: 1000 })
    .withMessage('Feedback cannot exceed 1000 characters')
];

const assignModeratorValidation = [
  body('moderatorId')
    .notEmpty()
    .withMessage('Moderator ID is required')
    .isMongoId()
    .withMessage('Invalid moderator ID')
];

// Student routes
router.get('/enrolled', getEnrolledCourses);

// Routes accessible by teachers and admins
router.get('/', authorize(UserRole.TEACHER, UserRole.ADMIN), getAllCourses);

// Admin-only routes (must be before /:id route to avoid conflicts)
router.get('/stats', requireAdmin, getCourseStats);

// Routes with ID parameter (must be after specific routes like /stats)
router.get('/:id', authorize(UserRole.TEACHER, UserRole.ADMIN), getCourseById);

// Teacher-specific routes (requires approved teacher profile)
router.post('/', authorize(UserRole.TEACHER), requireApprovedTeacher, createCourseValidation, validateRequest, createCourse);
router.put('/:id', requireAdmin, updateCourseValidation, validateRequest, updateCourse);
router.delete('/:id', requireAdmin, deleteCourse);
router.put('/:id/approve', requireAdmin, approveCourseValidation, validateRequest, approveCourse);
router.put('/:id/reject', requireAdmin, rejectCourseValidation, validateRequest, rejectCourse);
router.put('/:id/assign-moderator', requireAdmin, assignModeratorValidation, validateRequest, assignModerator);

// Course materials route
router.get('/:courseId/materials', getCourseMaterials);

export default router;

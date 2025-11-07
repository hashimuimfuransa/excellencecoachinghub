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
  getEnrolledCourses,
  getCourseEnrolledStudents,
  getTeacherDashboardStats
} from '../controllers/courseController';
import { getCourseMaterials, proxyPDF, proxyDocument } from '../controllers/courseMaterialsController';
import { protect, authorize } from '../middleware/auth';
import { requireAdmin } from '../middleware/roleAuth';
import { requireApprovedTeacher } from '../middleware/teacherAuth';
import { requireCourseModification } from '../middleware/courseAuth';
import { validateRequest } from '../middleware/validateRequest';
import { UserRole } from '../../../shared/types';

const router = Router();

// Simple rate limiting for course routes
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30; // 30 requests per minute

const rateLimitMiddleware = (req: any, res: any, next: any) => {
  const clientId = req.user?._id || req.ip;
  const now = Date.now();
  
  const clientData = requestCounts.get(clientId);
  
  if (!clientData || now > clientData.resetTime) {
    requestCounts.set(clientId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return next();
  }
  
  if (clientData.count >= RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({
      success: false,
      error: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
    });
  }
  
  clientData.count++;
  next();
};

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
  body('difficultyLevel')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced', 'expert'])
    .withMessage('Difficulty level must be beginner, intermediate, advanced, or expert'),
  body('courseFormat')
    .optional()
    .isIn(['self_paced', 'instructor_led', 'hybrid'])
    .withMessage('Course format must be self_paced, instructor_led, or hybrid'),
  body('language')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Language cannot exceed 50 characters'),
  body('totalEstimatedTime')
    .optional()
    .isNumeric()
    .withMessage('Total estimated time must be a number')
    .isFloat({ min: 0 })
    .withMessage('Total estimated time cannot be negative'),
  body('weeklyTimeCommitment')
    .optional()
    .isNumeric()
    .withMessage('Weekly time commitment must be a number')
    .isFloat({ min: 0 })
    .withMessage('Weekly time commitment cannot be negative'),
  body('certificationOffered')
    .optional()
    .isBoolean()
    .withMessage('Certification offered must be a boolean'),
  // Price will be set during approval process
  body('duration')
    .isNumeric()
    .withMessage('Duration must be a number')
    .isInt({ min: 1 })
    .withMessage('Duration must be at least 1 hour'),
  // New fields for better discoverability
  body('careerGoal')
    .optional()
    .isIn(['employment', 'business_owner', 'student', 'career_change', 'skill_upgrade', 'exploring'])
    .withMessage('Career goal must be one of: employment, business_owner, student, career_change, skill_upgrade, exploring'),
  body('experienceLevel')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Experience level must be one of: beginner, intermediate, advanced'),
  body('timeCommitment')
    .optional()
    .isIn(['light', 'moderate', 'intensive', 'full_time'])
    .withMessage('Time commitment must be one of: light, moderate, intensive, full_time'),
  body('learningStyle')
    .optional()
    .isIn(['visual', 'hands_on', 'theoretical', 'interactive'])
    .withMessage('Learning style must be one of: visual, hands_on, theoretical, interactive'),
  body('specificInterests')
    .optional()
    .isArray()
    .withMessage('Specific interests must be an array'),
  body('specificInterests.*')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Each specific interest cannot exceed 100 characters'),
  body('learningCategories')
    .optional()
    .isArray()
    .withMessage('Learning categories must be an array'),
  body('learningCategories.*')
    .optional()
    .isString()
    .isIn([
      'professional_coaching',
      'business_entrepreneurship_coaching',
      'academic_coaching',
      'nursery_coaching',
      'language_coaching',
      'technical_digital_coaching',
      'job_seeker_coaching',
      'personal_corporate_development_coaching'
    ])
    .withMessage('Each learning category must be one of the updated coaching categories')
  ,
  body('learningSubcategories')
    .optional()
    .isArray()
    .withMessage('Learning subcategories must be an array'),
  body('learningSubcategories.*')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Each subcategory cannot exceed 100 characters'),
  body('nurseryLevel')
    .optional()
    .isString()
    .trim()
    .isIn(['Nursery 1', 'Nursery 2', 'Nursery 3', ''])
    .withMessage('Nursery level must be one of: Nursery 1, Nursery 2, or Nursery 3')
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
    .withMessage('Duration must be at least 1 hour'),
  // New fields for better discoverability
  body('careerGoal')
    .optional()
    .isIn(['employment', 'business_owner', 'student', 'career_change', 'skill_upgrade', 'exploring'])
    .withMessage('Career goal must be one of: employment, business_owner, student, career_change, skill_upgrade, exploring'),
  body('experienceLevel')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Experience level must be one of: beginner, intermediate, advanced'),
  body('timeCommitment')
    .optional()
    .isIn(['light', 'moderate', 'intensive', 'full_time'])
    .withMessage('Time commitment must be one of: light, moderate, intensive, full_time'),
  body('learningStyle')
    .optional()
    .isIn(['visual', 'hands_on', 'theoretical', 'interactive'])
    .withMessage('Learning style must be one of: visual, hands_on, theoretical, interactive'),
  body('specificInterests')
    .optional()
    .isArray()
    .withMessage('Specific interests must be an array'),
  body('specificInterests.*')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Each specific interest cannot exceed 100 characters'),
  body('learningCategories')
    .optional()
    .isArray()
    .withMessage('Learning categories must be an array'),
  body('learningCategories.*')
    .optional()
    .isString()
    .isIn([
      'professional_coaching',
      'business_entrepreneurship_coaching',
      'academic_coaching',
      'nursery_coaching',
      'language_coaching',
      'technical_digital_coaching',
      'job_seeker_coaching',
      'personal_corporate_development_coaching'
    ])
    .withMessage('Each learning category must be one of the updated coaching categories'),
  body('learningSubcategories')
    .optional()
    .isArray()
    .withMessage('Learning subcategories must be an array'),
  body('learningSubcategories.*')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Each subcategory cannot exceed 100 characters'),
  body('nurseryLevel')
    .optional()
    .isString()
    .trim()
    .isIn(['Nursery 1', 'Nursery 2', 'Nursery 3', ''])
    .withMessage('Nursery level must be one of: Nursery 1, Nursery 2, or Nursery 3'),
  body('prerequisites')
    .optional()
    .isArray()
    .withMessage('Prerequisites must be an array'),
  body('prerequisites.*')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Each prerequisite cannot exceed 200 characters'),
  body('learningObjectives')
    .optional()
    .isArray()
    .withMessage('Learning objectives must be an array'),
  body('learningObjectives.*')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 300 })
    .withMessage('Each learning objective cannot exceed 300 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Each tag cannot exceed 50 characters')
];

const approveCourseValidation = [
  body('notesPrice')
    .optional()
    .isNumeric()
    .withMessage('Notes price must be a number')
    .isFloat({ min: 0 })
    .withMessage('Notes price must be positive'),
  body('liveSessionPrice')
    .optional()
    .isNumeric()
    .withMessage('Live session price must be a number')
    .isFloat({ min: 0 })
    .withMessage('Live session price must be positive'),
  body('enrollmentDeadline')
    .optional()
    .isISO8601()
    .withMessage('Invalid enrollment deadline format'),
  body('courseStartDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid course start date format'),
  body('maxEnrollments')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max enrollments must be at least 1'),
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

// Student and Professional routes (learners)
router.get('/enrolled', authorize(UserRole.STUDENT, UserRole.PROFESSIONAL), getEnrolledCourses);

// Routes accessible by teachers, admins, and super admins
router.get('/', rateLimitMiddleware, authorize(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN), getAllCourses);

// Admin-only routes (must be before /:id route to avoid conflicts)
router.get('/stats', requireAdmin, getCourseStats);

// Routes with ID parameter (must be after specific routes like /stats)
// Allow all authenticated users to access course details (access control is handled in controller)
router.get('/:id', getCourseById);

// Teacher-specific routes (requires approved teacher profile)
router.post('/', authorize(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN), requireApprovedTeacher, createCourseValidation, validateRequest, createCourse);
router.put('/:id', requireCourseModification, updateCourseValidation, validateRequest, updateCourse);
router.delete('/:id', requireAdmin, deleteCourse);
router.put('/:id/approve', requireAdmin, approveCourseValidation, validateRequest, approveCourse);
router.put('/:id/reject', requireAdmin, rejectCourseValidation, validateRequest, rejectCourse);
router.put('/:id/assign-moderator', requireAdmin, assignModeratorValidation, validateRequest, assignModerator);

// Course materials route
router.get('/:courseId/materials', getCourseMaterials);

// PDF proxy route for authenticated PDF access
router.get('/materials/pdf-proxy', protect, proxyPDF);

// Document proxy route for authenticated document access (all document types)
router.get('/documents/proxy', protect, proxyDocument);

// Get enrolled students for a course (teachers and admins only)
router.get('/:courseId/enrolled-students', authorize(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN), getCourseEnrolledStudents);

// Get teacher dashboard statistics
router.get('/teacher/dashboard-stats', authorize(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN), getTeacherDashboardStats);

export default router;

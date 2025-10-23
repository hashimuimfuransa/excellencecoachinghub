import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  enrollInCourse,
  completePayment,
  getMyEnrollments,
  getEnrollmentDetails,
  checkCourseAccess,
  updateProgress,
  getCourseEnrollments
} from '../controllers/enrollmentController';
import { protect, authorize } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';
import { UserRole } from '../../../shared/types';

const router = Router();

// All routes require authentication
router.use(protect);

// Validation schemas
const enrollmentValidation = [
  param('courseId')
    .isMongoId()
    .withMessage('Invalid course ID'),
  body('enrollmentType')
    .optional()
    .isIn(['notes', 'live_sessions', 'both'])
    .withMessage('Invalid enrollment type')
    .default('both'),
  body('paymentMethod')
    .optional()
    .isIn(['card', 'mobile_money', 'bank_transfer', 'cash'])
    .withMessage('Invalid payment method')
];

const paymentValidation = [
  param('enrollmentId')
    .isMongoId()
    .withMessage('Invalid enrollment ID'),
  body('transactionId')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Transaction ID cannot be empty'),
  body('paymentReference')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Payment reference cannot be empty')
];

const progressValidation = [
  param('courseId')
    .isMongoId()
    .withMessage('Invalid course ID'),
  body('itemId')
    .optional()
    .isMongoId()
    .withMessage('Invalid item ID'),
  body('itemType')
    .optional()
    .isIn(['lesson', 'assignment'])
    .withMessage('Invalid item type'),
  body('progressPercentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Progress percentage must be between 0 and 100')
];

const accessCheckValidation = [
  param('courseId')
    .isMongoId()
    .withMessage('Invalid course ID'),
  query('accessType')
    .isIn(['notes', 'live_sessions'])
    .withMessage('Invalid access type')
];

// Student and Professional routes
router.post('/courses/:courseId/enroll', 
  authorize(UserRole.STUDENT, UserRole.PROFESSIONAL), 
  enrollmentValidation, 
  validateRequest, 
  enrollInCourse
);

router.put('/enrollments/:enrollmentId/complete-payment', 
  authorize(UserRole.STUDENT, UserRole.PROFESSIONAL), 
  paymentValidation, 
  validateRequest, 
  completePayment
);

router.get('/my-enrollments', 
  authorize(UserRole.STUDENT, UserRole.PROFESSIONAL), 
  getMyEnrollments
);

router.get('/:courseId', 
  authorize(UserRole.STUDENT, UserRole.PROFESSIONAL), 
  [param('courseId').isMongoId().withMessage('Invalid course ID')],
  validateRequest,
  getEnrollmentDetails
);

router.get('/courses/:courseId/access', 
  authorize(UserRole.STUDENT, UserRole.PROFESSIONAL), 
  accessCheckValidation, 
  validateRequest, 
  checkCourseAccess
);

router.put('/courses/:courseId/progress', 
  authorize(UserRole.STUDENT, UserRole.PROFESSIONAL), 
  progressValidation, 
  validateRequest, 
  updateProgress
);

// Instructor/Admin routes
router.get('/courses/:courseId/enrollments', 
  authorize(UserRole.TEACHER, UserRole.ADMIN), 
  [param('courseId').isMongoId().withMessage('Invalid course ID')],
  validateRequest,
  getCourseEnrollments
);

export default router;
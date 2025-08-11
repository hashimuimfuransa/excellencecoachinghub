import { Router } from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest';
import { protect, authorize } from '../middleware/auth';
import { UserRole } from '../../../shared/types';
import {
  addCourseContent,
  getCourseContent,
  updateCourseContent,
  deleteCourseContent,
  reorderCourseContent
} from '../controllers/courseContentController';

const router = Router();

// Validation middleware
const contentValidation = [
  body('title')
    .notEmpty()
    .withMessage('Content title is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('type')
    .isIn(['video', 'document', 'quiz', 'assignment', 'live_session'])
    .withMessage('Invalid content type'),
  body('order')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Order must be a positive integer'),
  body('isRequired')
    .optional()
    .isBoolean()
    .withMessage('isRequired must be a boolean'),
  body('duration')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Duration must be a positive integer')
];

const contentUpdateValidation = [
  body('title')
    .optional()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('type')
    .optional()
    .isIn(['video', 'document', 'quiz', 'assignment', 'live_session'])
    .withMessage('Invalid content type'),
  body('order')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Order must be a positive integer'),
  body('isRequired')
    .optional()
    .isBoolean()
    .withMessage('isRequired must be a boolean'),
  body('duration')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Duration must be a positive integer')
];

const reorderValidation = [
  body('contentOrder')
    .isArray()
    .withMessage('Content order must be an array')
    .notEmpty()
    .withMessage('Content order cannot be empty')
];

// Routes for course content management
router.post(
  '/:courseId/content',
  protect,
  authorize(UserRole.TEACHER, UserRole.ADMIN),
  contentValidation,
  validateRequest,
  addCourseContent
);

router.get(
  '/:courseId/content',
  protect,
  authorize(UserRole.TEACHER, UserRole.ADMIN, UserRole.STUDENT),
  getCourseContent
);

router.put(
  '/:courseId/content/:contentId',
  protect,
  authorize(UserRole.TEACHER, UserRole.ADMIN),
  contentUpdateValidation,
  validateRequest,
  updateCourseContent
);

router.delete(
  '/:courseId/content/:contentId',
  protect,
  authorize(UserRole.TEACHER, UserRole.ADMIN),
  deleteCourseContent
);

router.put(
  '/:courseId/content/reorder',
  protect,
  authorize(UserRole.TEACHER, UserRole.ADMIN),
  reorderValidation,
  validateRequest,
  reorderCourseContent
);

export default router;
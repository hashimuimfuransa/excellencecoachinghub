import { Router } from 'express';
import { body, param } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest';
import { protect, authorize } from '../middleware/auth';
import { UserRole } from '../../../shared/types';
import {
  markContentCompleted,
  getCourseProgress,
  getUserProgress,
  getUserStats,
  removeCompletedContent
} from '../controllers/progressController';

const router = Router();

// Validation middleware
const courseIdValidation = [
  param('courseId')
    .isMongoId()
    .withMessage('Invalid course ID')
];

const contentIdValidation = [
  param('contentId')
    .notEmpty()
    .withMessage('Content ID is required')
];

// Student progress routes
router.post(
  '/courses/:courseId/content/:contentId/complete',
  protect,
  authorize(UserRole.STUDENT),
  [...courseIdValidation, ...contentIdValidation],
  validateRequest,
  markContentCompleted
);

router.delete(
  '/courses/:courseId/content/:contentId/complete',
  protect,
  authorize(UserRole.STUDENT),
  [...courseIdValidation, ...contentIdValidation],
  validateRequest,
  removeCompletedContent
);

router.get(
  '/courses/:courseId',
  protect,
  authorize(UserRole.STUDENT),
  courseIdValidation,
  validateRequest,
  getCourseProgress
);

router.get(
  '/my-progress',
  protect,
  authorize(UserRole.STUDENT),
  getUserProgress
);

router.get(
  '/my-stats',
  protect,
  authorize(UserRole.STUDENT),
  getUserStats
);

export default router;

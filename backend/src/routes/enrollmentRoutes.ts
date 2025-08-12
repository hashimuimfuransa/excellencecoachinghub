import { Router } from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest';
import { protect, authorize } from '../middleware/auth';
import { UserRole } from '../../../shared/types';
import {
  enrollInCourse,
  unenrollFromCourse,
  getMyEnrollments,
  getEnrollmentDetails
} from '../controllers/enrollmentController';

const router = Router();

// All routes require authentication
router.use(protect);

// Validation middleware
const enrollmentValidation = [
  body('courseId')
    .notEmpty()
    .withMessage('Course ID is required')
    .isMongoId()
    .withMessage('Invalid course ID')
];

// Student enrollment routes
router.post('/enroll', authorize(UserRole.STUDENT), enrollmentValidation, validateRequest, enrollInCourse);
router.delete('/unenroll/:courseId', authorize(UserRole.STUDENT), unenrollFromCourse);
router.get('/my-enrollments', authorize(UserRole.STUDENT), getMyEnrollments);
router.get('/:courseId', authorize(UserRole.STUDENT), getEnrollmentDetails);

export default router;
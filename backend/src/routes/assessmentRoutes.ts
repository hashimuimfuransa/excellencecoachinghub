import express from 'express';
import { body, param } from 'express-validator';
import { protect as auth } from '../middleware/auth';
import { authorizeRoles } from '../middleware/roleAuth';
import { validateRequest } from '../middleware/validateRequest';

// Import controllers
import assessmentController from '../controllers/assessmentController';
import studentAssessmentController from '../controllers/studentAssessmentController';

const router = express.Router();

// Validation middleware
const assessmentValidation = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  body('courseId')
    .notEmpty()
    .withMessage('Course ID is required')
    .isMongoId()
    .withMessage('Invalid course ID'),
  body('type')
    .isIn(['quiz', 'assignment', 'exam', 'project', 'homework'])
    .withMessage('Invalid assessment type'),
  body('questions')
    .optional()
    .isArray()
    .withMessage('Questions must be an array'),
  body('timeLimit')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Time limit must be at least 1 minute'),
  body('attempts')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Must allow at least 1 attempt'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid due date format'),
  body('passingScore')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Passing score must be between 0 and 100')
];

const submissionValidation = [
  body('answers')
    .isArray()
    .withMessage('Answers must be an array'),
  body('timeSpent')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Time spent must be non-negative')
];

const idValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format')
];

// Teacher routes
router.post(
  '/',
  auth,
  authorizeRoles(['teacher']),
  assessmentValidation,
  validateRequest,
  assessmentController.createAssessment
);

router.get(
  '/teacher',
  auth,
  authorizeRoles(['teacher']),
  assessmentController.getTeacherAssessments
);

router.get(
  '/:id',
  auth,
  idValidation,
  validateRequest,
  assessmentController.getAssessmentById
);

router.put(
  '/:id',
  auth,
  authorizeRoles(['teacher']),
  idValidation,
  assessmentValidation,
  validateRequest,
  assessmentController.updateAssessment
);

router.delete(
  '/:id',
  auth,
  authorizeRoles(['teacher']),
  idValidation,
  validateRequest,
  assessmentController.deleteAssessment
);

router.patch(
  '/:id/publish',
  auth,
  authorizeRoles(['teacher']),
  idValidation,
  validateRequest,
  assessmentController.togglePublishAssessment
);

router.get(
  '/:id/submissions',
  auth,
  authorizeRoles(['teacher']),
  idValidation,
  validateRequest,
  assessmentController.getAssessmentSubmissions
);

router.put(
  '/submissions/:submissionId/grade',
  auth,
  authorizeRoles(['teacher']),
  [
    param('submissionId')
      .isMongoId()
      .withMessage('Invalid submission ID format')
  ],
  validateRequest,
  assessmentController.gradeSubmission
);

// Student routes
router.get(
  '/student/available',
  auth,
  authorizeRoles(['student']),
  studentAssessmentController.getStudentAssessments
);

router.post(
  '/:id/start',
  auth,
  authorizeRoles(['student']),
  idValidation,
  validateRequest,
  studentAssessmentController.startAssessment
);

router.put(
  '/submissions/:submissionId/save',
  auth,
  authorizeRoles(['student']),
  [
    param('submissionId')
      .isMongoId()
      .withMessage('Invalid submission ID format')
  ],
  submissionValidation,
  validateRequest,
  studentAssessmentController.saveAssessmentProgress
);

router.post(
  '/submissions/:submissionId/submit',
  auth,
  authorizeRoles(['student']),
  [
    param('submissionId')
      .isMongoId()
      .withMessage('Invalid submission ID format')
  ],
  submissionValidation,
  validateRequest,
  studentAssessmentController.submitAssessment
);

router.get(
  '/student/submissions',
  auth,
  authorizeRoles(['student']),
  studentAssessmentController.getStudentSubmissions
);

router.get(
  '/submissions/:submissionId',
  auth,
  [
    param('submissionId')
      .isMongoId()
      .withMessage('Invalid submission ID format')
  ],
  validateRequest,
  studentAssessmentController.getSubmissionDetails
);

export default router;

import express from 'express';
import { body, param } from 'express-validator';
import { protect as auth } from '../middleware/auth';
import { authorizeRoles } from '../middleware/roleAuth';
import { validateRequest } from '../middleware/validateRequest';

import courseNotesController from '../controllers/courseNotesController';
import readingProgressController from '../controllers/readingProgressController';

const router = express.Router();

// Validation middleware
const courseNotesValidation = [
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
  body('chapter')
    .isInt({ min: 1 })
    .withMessage('Chapter must be a positive integer'),
  body('sections')
    .optional()
    .isArray()
    .withMessage('Sections must be an array')
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
  courseNotesValidation,
  validateRequest,
  courseNotesController.createCourseNotes
);

router.get(
  '/teacher',
  auth,
  authorizeRoles(['teacher']),
  courseNotesController.getTeacherCourseNotes
);

router.get(
  '/:id',
  auth,
  idValidation,
  validateRequest,
  courseNotesController.getCourseNotesById
);

router.put(
  '/:id',
  auth,
  authorizeRoles(['teacher']),
  idValidation,
  validateRequest,
  courseNotesController.updateCourseNotes
);

router.delete(
  '/:id',
  auth,
  authorizeRoles(['teacher']),
  idValidation,
  validateRequest,
  courseNotesController.deleteCourseNotes
);

router.patch(
  '/:id/publish',
  auth,
  authorizeRoles(['teacher']),
  idValidation,
  validateRequest,
  courseNotesController.togglePublishCourseNotes
);

// Student routes
router.get(
  '/course/:courseId',
  auth,
  authorizeRoles(['student']),
  [
    param('courseId')
      .isMongoId()
      .withMessage('Invalid course ID format')
  ],
  validateRequest,
  courseNotesController.getCourseNotesByCourse
);

router.post(
  '/:id/generate-quiz',
  auth,
  authorizeRoles(['student']),
  idValidation,
  [
    body('difficulty')
      .optional()
      .isIn(['easy', 'medium', 'hard'])
      .withMessage('Invalid difficulty level'),
    body('questionCount')
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage('Question count must be between 1 and 20')
  ],
  validateRequest,
  courseNotesController.generateQuizFromNotes
);

// Reading progress routes
router.put(
  '/:courseNotesId/progress',
  auth,
  authorizeRoles(['student']),
  [
    param('courseNotesId')
      .isMongoId()
      .withMessage('Invalid course notes ID format'),
    body('timeSpent')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Time spent must be non-negative')
  ],
  validateRequest,
  readingProgressController.updateReadingProgress
);

router.post(
  '/:courseNotesId/sections/:sectionId/complete',
  auth,
  authorizeRoles(['student']),
  [
    param('courseNotesId')
      .isMongoId()
      .withMessage('Invalid course notes ID format'),
    param('sectionId')
      .notEmpty()
      .withMessage('Section ID is required')
  ],
  validateRequest,
  readingProgressController.markSectionComplete
);

router.post(
  '/:courseNotesId/sections/:sectionId/bookmark',
  auth,
  authorizeRoles(['student']),
  [
    param('courseNotesId')
      .isMongoId()
      .withMessage('Invalid course notes ID format'),
    param('sectionId')
      .notEmpty()
      .withMessage('Section ID is required'),
    body('note')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Bookmark note cannot exceed 500 characters')
  ],
  validateRequest,
  readingProgressController.addBookmark
);

router.delete(
  '/:courseNotesId/sections/:sectionId/bookmark',
  auth,
  authorizeRoles(['student']),
  [
    param('courseNotesId')
      .isMongoId()
      .withMessage('Invalid course notes ID format'),
    param('sectionId')
      .notEmpty()
      .withMessage('Section ID is required')
  ],
  validateRequest,
  readingProgressController.removeBookmark
);

router.get(
  '/progress/course/:courseId',
  auth,
  authorizeRoles(['student']),
  [
    param('courseId')
      .isMongoId()
      .withMessage('Invalid course ID format')
  ],
  validateRequest,
  readingProgressController.getStudentProgress
);

// Teacher progress statistics
router.get(
  '/progress/course/:courseId/statistics',
  auth,
  authorizeRoles(['teacher']),
  [
    param('courseId')
      .isMongoId()
      .withMessage('Invalid course ID format')
  ],
  validateRequest,
  readingProgressController.getCourseProgressStatistics
);

export default router;

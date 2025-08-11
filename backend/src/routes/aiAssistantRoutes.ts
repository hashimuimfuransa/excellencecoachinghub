import express from 'express';
import { body, param } from 'express-validator';
import { protect as auth } from '../middleware/auth';
import { authorizeRoles } from '../middleware/roleAuth';
import { validateRequest } from '../middleware/validateRequest';

import aiAssistantController from '../controllers/aiAssistantController';

const router = express.Router();

// Validation middleware
const chatValidation = [
  body('question')
    .notEmpty()
    .withMessage('Question is required')
    .isLength({ max: 1000 })
    .withMessage('Question cannot exceed 1000 characters'),
  body('context')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Context cannot exceed 2000 characters'),
  body('courseId')
    .optional()
    .isMongoId()
    .withMessage('Invalid course ID format')
];

const conceptValidation = [
  body('concept')
    .notEmpty()
    .withMessage('Concept is required')
    .isLength({ max: 200 })
    .withMessage('Concept cannot exceed 200 characters'),
  body('difficulty')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Invalid difficulty level'),
  body('courseId')
    .optional()
    .isMongoId()
    .withMessage('Invalid course ID format')
];

const homeworkHelpValidation = [
  body('question')
    .notEmpty()
    .withMessage('Question is required')
    .isLength({ max: 1000 })
    .withMessage('Question cannot exceed 1000 characters'),
  body('assessmentId')
    .optional()
    .isMongoId()
    .withMessage('Invalid assessment ID format'),
  body('questionType')
    .optional()
    .isIn(['multiple_choice', 'true_false', 'short_answer', 'essay', 'calculation'])
    .withMessage('Invalid question type')
];

const practiceQuestionsValidation = [
  body('topic')
    .notEmpty()
    .withMessage('Topic is required')
    .isLength({ max: 200 })
    .withMessage('Topic cannot exceed 200 characters'),
  body('difficulty')
    .optional()
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('Invalid difficulty level'),
  body('count')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Question count must be between 1 and 10'),
  body('courseId')
    .optional()
    .isMongoId()
    .withMessage('Invalid course ID format')
];

// AI Assistant routes (Student only)
router.post(
  '/chat',
  auth,
  authorizeRoles(['student']),
  chatValidation,
  validateRequest,
  aiAssistantController.chatWithAI
);

router.get(
  '/study-suggestions/:courseId',
  auth,
  authorizeRoles(['student']),
  [
    param('courseId')
      .isMongoId()
      .withMessage('Invalid course ID format')
  ],
  validateRequest,
  aiAssistantController.getStudySuggestions
);

router.post(
  '/explain',
  auth,
  authorizeRoles(['student']),
  conceptValidation,
  validateRequest,
  aiAssistantController.explainConcept
);

router.post(
  '/homework-help',
  auth,
  authorizeRoles(['student']),
  homeworkHelpValidation,
  validateRequest,
  aiAssistantController.getHomeworkHelp
);

router.post(
  '/practice-questions',
  auth,
  authorizeRoles(['student']),
  practiceQuestionsValidation,
  validateRequest,
  aiAssistantController.generatePracticeQuestions
);

router.get(
  '/availability',
  auth,
  authorizeRoles(['student']),
  aiAssistantController.checkAIAvailability
);

export default router;

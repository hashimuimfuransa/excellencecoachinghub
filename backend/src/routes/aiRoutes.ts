import { Router } from 'express';
import { body } from 'express-validator';
import {
  generateQuizQuestions,
  gradeEssayAnswer,
  generateLearningRecommendations,
  analyzeStudentPerformance,
  generateCourseContent,
  getAIServiceStatus
} from '../controllers/aiController';
import { protect } from '../middleware/auth';
import { authorizeRoles } from '../middleware/roleAuth';

const router = Router();

// All AI routes require authentication
router.use(protect);

// Get AI service status
router.get('/status', getAIServiceStatus);

// Generate quiz questions (Teachers and Admins only)
router.post('/generate-quiz',
  authorizeRoles(['teacher', 'admin']),
  [
    body('courseContent')
      .notEmpty()
      .withMessage('Course content is required')
      .isLength({ min: 50 })
      .withMessage('Course content must be at least 50 characters long'),
    body('questionCount')
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage('Question count must be between 1 and 20'),
    body('difficulty')
      .optional()
      .isIn(['easy', 'medium', 'hard'])
      .withMessage('Difficulty must be easy, medium, or hard')
  ],
  generateQuizQuestions
);

// Grade essay answer (Teachers and Admins only)
router.post('/grade-essay',
  authorizeRoles(['teacher', 'admin']),
  [
    body('question')
      .notEmpty()
      .withMessage('Question is required'),
    body('studentAnswer')
      .notEmpty()
      .withMessage('Student answer is required'),
    body('modelAnswer')
      .optional()
      .isString(),
    body('maxPoints')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Max points must be between 1 and 100')
  ],
  gradeEssayAnswer
);

// Generate learning recommendations (All authenticated users)
router.post('/recommendations',
  [
    body('completedCourses')
      .isArray()
      .withMessage('Completed courses must be an array'),
    body('currentCourses')
      .isArray()
      .withMessage('Current courses must be an array'),
    body('interests')
      .isArray()
      .withMessage('Interests must be an array'),
    body('skillLevel')
      .notEmpty()
      .withMessage('Skill level is required'),
    body('learningGoals')
      .isArray()
      .withMessage('Learning goals must be an array')
  ],
  generateLearningRecommendations
);

// Analyze student performance (Teachers and Admins, or own performance for students)
router.post('/analyze-performance',
  [
    body('quizScores')
      .isArray()
      .withMessage('Quiz scores must be an array'),
    body('assignmentScores')
      .isArray()
      .withMessage('Assignment scores must be an array'),
    body('timeSpent')
      .isNumeric()
      .withMessage('Time spent must be a number'),
    body('coursesCompleted')
      .isInt({ min: 0 })
      .withMessage('Courses completed must be a non-negative integer'),
    body('strengths')
      .isArray()
      .withMessage('Strengths must be an array'),
    body('weaknesses')
      .isArray()
      .withMessage('Weaknesses must be an array')
  ],
  analyzeStudentPerformance
);

// Generate course content (Teachers and Admins only)
router.post('/generate-course',
  authorizeRoles(['teacher', 'admin']),
  [
    body('topic')
      .notEmpty()
      .withMessage('Topic is required'),
    body('targetAudience')
      .notEmpty()
      .withMessage('Target audience is required'),
    body('duration')
      .isInt({ min: 1, max: 200 })
      .withMessage('Duration must be between 1 and 200 hours'),
    body('learningObjectives')
      .isArray({ min: 1 })
      .withMessage('At least one learning objective is required')
  ],
  generateCourseContent
);

export default router;

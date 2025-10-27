import { Router } from 'express';
import { body } from 'express-validator';
import {
  generateQuizQuestions,
  gradeEssayAnswer,
  generateLearningRecommendations,
  analyzeStudentPerformance,
  generateCourseContent,
  getAIServiceStatus,
  generateSectionQuiz,
  evaluateQuizAnswers,
  gradeAssessment,
  gradeAssignment,
  gradeQuestion,
  getTextFeedback,
  gradeMathExpression,
  gradeCode,
  detectPlagiarism,
  generateRubric,
  generateGeneralContent
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

// Generate section quiz (Students can generate quizzes for their enrolled courses)
router.post('/generate-section-quiz',
  authorizeRoles(['student', 'teacher', 'admin']),
  [
    body('courseId')
      .notEmpty()
      .withMessage('Course ID is required')
      .isMongoId()
      .withMessage('Invalid course ID'),
    body('sectionId')
      .notEmpty()
      .withMessage('Section ID is required'),
    body('sectionTitle')
      .notEmpty()
      .withMessage('Section title is required'),
    body('sectionContent')
      .notEmpty()
      .withMessage('Section content is required')
      .isLength({ min: 50 })
      .withMessage('Section content must be at least 50 characters long'),
    body('difficulty')
      .optional()
      .isIn(['easy', 'medium', 'hard'])
      .withMessage('Difficulty must be easy, medium, or hard'),
    body('questionCount')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('Question count must be between 1 and 10')
  ],
  generateSectionQuiz
);

// Evaluate quiz answers (Students can evaluate their own quiz answers)
router.post('/evaluate-quiz-answers',
  authorizeRoles(['student', 'teacher', 'admin']),
  [
    body('courseId')
      .notEmpty()
      .withMessage('Course ID is required')
      .isMongoId()
      .withMessage('Invalid course ID'),
    body('sectionId')
      .notEmpty()
      .withMessage('Section ID is required'),
    body('quizId')
      .notEmpty()
      .withMessage('Quiz ID is required'),
    body('answers')
      .isObject()
      .withMessage('Answers must be an object'),
    body('questions')
      .isArray({ min: 1 })
      .withMessage('Questions array is required')
  ],
  evaluateQuizAnswers
);

// Grade assessment automatically
router.post('/grade-assessment',
  authorizeRoles(['student', 'teacher', 'admin']),
  [
    body('assessmentId')
      .notEmpty()
      .withMessage('Assessment ID is required')
      .isMongoId()
      .withMessage('Invalid assessment ID'),
    body('answers')
      .isArray()
      .withMessage('Answers must be an array'),
    body('questions')
      .isArray()
      .withMessage('Questions must be an array')
  ],
  gradeAssessment
);

// Grade assignment text/essay
router.post('/grade-assignment',
  authorizeRoles(['student', 'teacher', 'admin']),
  [
    body('assignmentId')
      .notEmpty()
      .withMessage('Assignment ID is required')
      .isMongoId()
      .withMessage('Invalid assignment ID'),
    body('submissionText')
      .notEmpty()
      .withMessage('Submission text is required'),
    body('maxPoints')
      .isInt({ min: 1 })
      .withMessage('Max points must be a positive integer')
  ],
  gradeAssignment
);

// Grade individual question
router.post('/grade-question',
  authorizeRoles(['student', 'teacher', 'admin']),
  [
    body('question')
      .isObject()
      .withMessage('Question must be an object'),
    body('answer')
      .notEmpty()
      .withMessage('Answer is required')
  ],
  gradeQuestion
);

// Get AI feedback for text
router.post('/text-feedback',
  authorizeRoles(['student', 'teacher', 'admin']),
  [
    body('text')
      .notEmpty()
      .withMessage('Text is required')
  ],
  getTextFeedback
);

// Grade math expressions
router.post('/grade-math',
  authorizeRoles(['student', 'teacher', 'admin']),
  [
    body('expression')
      .notEmpty()
      .withMessage('Math expression is required'),
    body('correctAnswer')
      .notEmpty()
      .withMessage('Correct answer is required')
  ],
  gradeMathExpression
);

// Grade code submissions
router.post('/grade-code',
  authorizeRoles(['student', 'teacher', 'admin']),
  [
    body('code')
      .notEmpty()
      .withMessage('Code is required'),
    body('language')
      .notEmpty()
      .withMessage('Programming language is required')
  ],
  gradeCode
);

// Detect plagiarism
router.post('/detect-plagiarism',
  authorizeRoles(['student', 'teacher', 'admin']),
  [
    body('text')
      .notEmpty()
      .withMessage('Text is required')
  ],
  detectPlagiarism
);

// Generate rubric for assignment
router.post('/generate-rubric',
  authorizeRoles(['teacher', 'admin']),
  [
    body('title')
      .notEmpty()
      .withMessage('Assignment title is required'),
    body('description')
      .notEmpty()
      .withMessage('Assignment description is required'),
    body('maxPoints')
      .isInt({ min: 1 })
      .withMessage('Max points must be a positive integer')
  ],
  generateRubric
);

// Generate general AI content (Super Admin only)
router.post('/generate-content',
  authorizeRoles(['super_admin']),
  [
    body('prompt')
      .notEmpty()
      .withMessage('Prompt is required')
      .isLength({ min: 10 })
      .withMessage('Prompt must be at least 10 characters long')
  ],
  generateGeneralContent
);

export default router;

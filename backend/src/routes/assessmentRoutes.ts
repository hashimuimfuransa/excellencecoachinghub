import express from 'express';
import { body, param } from 'express-validator';
import { protect as auth } from '../middleware/auth';
import { authorizeRoles } from '../middleware/roleAuth';
import { validateRequest } from '../middleware/validateRequest';
import { upload } from '../utils/fileUpload';

// Import controllers
import assessmentController from '../controllers/assessmentController';
import { addQuestionsFromDocument, replaceQuestionsFromDocument } from '../controllers/assessmentController';
import studentAssessmentController from '../controllers/studentAssessmentController';

const router = express.Router();

// Validation middleware
const assessmentValidation = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  body('course')
    .optional()
    .isMongoId()
    .withMessage('Invalid course ID'),
  body('courseId')
    .optional()
    .isMongoId()
    .withMessage('Invalid course ID'),
  body()
    .custom((value, { req }) => {
      if (!req.body.course && !req.body.courseId) {
        throw new Error('Course ID is required (provide either course or courseId)');
      }
      return true;
    }),
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
  upload.single('document'), // Add file upload middleware
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

// Admin route to get all assessments
router.get(
  '/admin',
  auth,
  authorizeRoles(['admin']),
  assessmentController.getAllAssessments
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

router.post(
  '/:id/add-questions',
  auth,
  authorizeRoles(['teacher']),
  upload.fields([
    { name: 'document', maxCount: 1 },
    { name: 'answerSheet', maxCount: 1 }
  ]),
  idValidation,
  validateRequest,
  addQuestionsFromDocument
);

router.put(
  '/:id/replace-questions',
  auth,
  authorizeRoles(['teacher']),
  upload.fields([
    { name: 'document', maxCount: 1 },
    { name: 'answerSheet', maxCount: 1 }
  ]),
  idValidation,
  validateRequest,
  replaceQuestionsFromDocument
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

// Submit assessment directly (creates submission and submits)
router.post(
  '/:id/submit',
  auth,
  authorizeRoles(['student']),
  idValidation,
  submissionValidation,
  validateRequest,
  studentAssessmentController.submitAssessmentDirect
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

// Get assessment result for student
router.get(
  '/:id/result',
  auth,
  authorizeRoles(['student']),
  idValidation,
  validateRequest,
  studentAssessmentController.getAssessmentResult
);

// Course-specific routes
router.get(
  '/course/:courseId',
  auth,
  [
    param('courseId')
      .isMongoId()
      .withMessage('Invalid course ID format')
  ],
  validateRequest,
  assessmentController.getCourseAssessments
);

router.get(
  '/course/:courseId/student-attempts',
  auth,
  authorizeRoles(['student']),
  [
    param('courseId')
      .isMongoId()
      .withMessage('Invalid course ID format')
  ],
  validateRequest,
  studentAssessmentController.getStudentCourseAttempts
);

// Debug route to check assessments and enrollments
router.get(
  '/debug/student-info',
  auth,
  authorizeRoles(['student']),
  async (req, res) => {
    try {
      const studentId = req.user?.id;
      
      // Get enrollments
      const { UserProgress } = await import('../models/UserProgress');
      const { Assessment } = await import('../models/Assessment');
      const enrollments = await UserProgress.find({ user: studentId }).populate('course', 'title instructor');
      
      // Get all published assessments in enrolled courses
      const courseIds = enrollments.map(e => e.course._id);
      const assessments = await Assessment.find({
        course: { $in: courseIds },
        isPublished: true,
        status: 'published'
      }).populate('course', 'title');
      
      res.json({
        success: true,
        debug: {
          studentId,
          enrollments: enrollments.map(e => ({
            courseId: e.course._id,
            courseTitle: e.course.title,
            instructor: e.course.instructor
          })),
          publishedAssessments: assessments.map(a => ({
            id: a._id,
            title: a.title,
            courseTitle: a.course.title,
            isPublished: a.isPublished,
            status: a.status,
            type: a.type
          }))
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Proctoring endpoints
router.post(
  '/:id/progress',
  auth,
  authorizeRoles(['student']),
  idValidation,
  [
    body('answers').isArray().withMessage('Answers must be an array'),
    body('currentQuestionIndex').isInt({ min: 0 }).withMessage('Current question index must be a non-negative integer'),
    body('violations').isArray().withMessage('Violations must be an array')
  ],
  validateRequest,
  async (req, res) => {
    try {
      // For now, just acknowledge the progress save
      // In a full implementation, you'd save this to a database
      res.json({
        success: true,
        message: 'Progress saved successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

router.post(
  '/:id/submit',
  auth,
  authorizeRoles(['student']),
  idValidation,
  [
    body('answers').isArray().withMessage('Answers must be an array'),
    body('submissionType').isIn(['manual', 'auto']).withMessage('Invalid submission type'),
    body('violations').isArray().withMessage('Violations must be an array'),
    body('timeSpent').isInt({ min: 0 }).withMessage('Time spent must be a non-negative integer')
  ],
  validateRequest,
  async (req, res) => {
    try {
      // For now, just acknowledge the submission
      // In a full implementation, you'd save this to a database and calculate scores
      res.json({
        success: true,
        message: 'Assessment submitted successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

export default router;

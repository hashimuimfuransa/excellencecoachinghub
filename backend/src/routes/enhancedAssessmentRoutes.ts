import express from 'express';
import multer from 'multer';
import {
  uploadAssessmentDocument,
  submitAssessmentForGrading,
  generateCertificate,
  getAssessmentStatistics,
  updateAssessmentConfig,
  getCourseAssessments,
  getStudentCourseProgress,
  updateStudentProgress,
  getTeacherCourseProgress,
  getAdminProgressOverview
} from '../controllers/enhancedAssessmentController';
// import { getStudentAssessments } from '../controllers/studentAssessmentController';
import { protect as auth } from '../middleware/auth';
import { authorizeRoles } from '../middleware/roleAuth';

const router = express.Router();

// Get student assessments
router.get('/student', auth, authorizeRoles(['student']), (req, res) => {
  res.json({ 
    success: true, 
    data: {
      assessments: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        itemsPerPage: 10
      }
    }
  });
});

// Get certificates for student
router.get('/certificates', auth, authorizeRoles(['student']), async (req, res) => {
  try {
    const studentId = req.user?.id;
    
    // For now, return empty array - can be implemented later with actual certificate logic
    res.json({ 
      success: true, 
      data: {
        certificates: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: 10
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch certificates'
    });
  }
});

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only specific file types
    if (file.mimetype === 'application/pdf' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.mimetype === 'text/plain') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOCX, and TXT files are allowed'));
    }
  }
});

// Upload assessment document (teachers only)
router.post(
  '/:assessmentId/upload-document',
  auth,
  authorizeRoles(['teacher']),
  upload.single('document'),
  uploadAssessmentDocument
);

// Submit assessment for AI grading (students only)
router.post(
  '/:assessmentId/submit',
  auth,
  authorizeRoles(['student']),
  submitAssessmentForGrading
);

// Generate certificate (teachers only)
router.post(
  '/course/:courseId/student/:studentId/certificate',
  auth,
  authorizeRoles(['teacher']),
  generateCertificate
);

// Get assessment statistics (teachers only)
router.get(
  '/:assessmentId/statistics',
  auth,
  authorizeRoles(['teacher']),
  getAssessmentStatistics
);

// Update assessment configuration (teachers only)
router.put(
  '/:assessmentId/config',
  auth,
  authorizeRoles(['teacher']),
  updateAssessmentConfig
);

// Get course assessments (teachers and students)
router.get(
  '/course/:courseId',
  auth,
  getCourseAssessments
);

// Progress tracking routes
router.get('/course/:courseId/progress/:studentId?', auth, authorizeRoles(['student', 'teacher', 'admin']), getStudentCourseProgress);
router.post('/assessment/:assessmentId/progress', auth, authorizeRoles(['student']), updateStudentProgress);
router.get('/course/:courseId/teacher-progress', auth, authorizeRoles(['teacher', 'admin']), getTeacherCourseProgress);
router.get('/admin/progress-overview', auth, authorizeRoles(['admin']), getAdminProgressOverview);

export default router;

import express from 'express';
import { auth } from '../middleware/auth';
import { authorizeRoles } from '../middleware/roleAuth';
import { requireApprovedTeacher } from '../middleware/teacherAuth';
import { asyncHandler } from '../middleware/asyncHandler';
import { uploadDocument } from '../config/cloudinary';
import { Assignment, AssignmentSubmission } from '../models/Assignment';
import {
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getCourseAssignments,
  getAssignmentById,
  submitAssignment,
  uploadAssignmentFile,
  uploadAssignmentDocument,
  replaceAssignmentDocument,
  getAssignmentSubmissions,
  getStudentSubmission,
  gradeSubmission,
  getAssignmentStats,
  toggleAssignmentStatus,
  saveDraft,
  getSubmissionHistory,
  updateAIGrade,
  getExtractedQuestions,
  submitExtractedAssignment,
  extractQuestionsFromDocument,
  replaceQuestionsFromDocument,
  getAssignmentSubmissionsForGrading,
  gradeAssignmentSubmission,
  getSubmissionDetails,
  checkAIProcessingStatus,
  retryQuestionExtraction,
  debugAIProcessing,
  extractAssignmentQuestions,
  saveAssignmentProgress,
  submitAssignmentWithExtractedAnswers
} from '../controllers/assignmentController';

const router = express.Router();

// Assignment CRUD operations (require approved teacher profile)
router.post('/', auth, requireApprovedTeacher, asyncHandler(createAssignment));
router.put('/:id', auth, requireApprovedTeacher, asyncHandler(updateAssignment));
router.delete('/:id', auth, requireApprovedTeacher, asyncHandler(deleteAssignment));
router.get('/:id', auth, asyncHandler(getAssignmentById));

// Admin route to get all assignments
router.get('/admin/all', auth, authorizeRoles(['admin']), asyncHandler(async (req, res) => {
  try {
    const assignments = await Assignment.find({})
      .populate('course', 'title')
      .populate('instructor', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        assignments,
        count: assignments.length
      }
    });
  } catch (error) {
    console.error('Error fetching all assignments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assignments'
    });
  }
}));

// Toggle assignment publish status
router.patch('/:id/publish', auth, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !['published', 'draft'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Status must be either "published" or "draft"'
      });
    }
    
    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found'
      });
    }
    
    // Check if user owns this assignment
    if (assignment.instructor.toString() !== req.user?._id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to modify this assignment'
      });
    }
    
    assignment.status = status;
    await assignment.save();
    
    res.json({
      success: true,
      data: assignment
    });
  } catch (error: any) {
    console.error('Error toggling assignment publish status:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update assignment status'
    });
  }
}));

// Course assignments
router.get('/course/:courseId', auth, asyncHandler(getCourseAssignments));
router.get('/course/:courseId/submissions', auth, asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  
  try {
    // Get all assignments for the course
    const assignments = await Assignment.find({ course: courseId });
    const assignmentIds = assignments.map(a => a._id);
    
    // Get all submissions for these assignments
    const submissions = await AssignmentSubmission.find({ 
      assignment: { $in: assignmentIds } 
    })
    .populate('assignment', 'title dueDate')
    .populate('student', 'firstName lastName email')
    .sort({ submittedAt: -1 });
    
    res.json({
      success: true,
      data: submissions
    });
  } catch (error: any) {
    console.error('Failed to fetch course submissions:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch course submissions'
    });
  }
}));

// Assignment submissions
router.post('/:assignmentId/submit', auth, asyncHandler(submitAssignment));
router.get('/:assignmentId/submissions', auth, asyncHandler(getAssignmentSubmissions));
router.get('/:assignmentId/submission', auth, asyncHandler(getStudentSubmission));

// Extracted questions assignments
router.get('/:assignmentId/extracted-questions', auth, asyncHandler(getExtractedQuestions));
router.post('/:assignmentId/submit-extracted', auth, asyncHandler(submitAssignmentWithExtractedAnswers));

// Assignment progress saving (auto-save functionality)
router.post('/:assignmentId/save-progress', auth, asyncHandler(saveAssignmentProgress));

// File upload for assignments (student submissions)
router.post('/:assignmentId/upload', auth, uploadDocument.single('file'), asyncHandler(uploadAssignmentFile));

// Upload assignment document (instructor - requires approved profile)
router.post('/:assignmentId/upload-document', auth, requireApprovedTeacher, uploadDocument.single('file'), asyncHandler(uploadAssignmentDocument));

// Replace assignment document (instructor - requires approved profile)
router.put('/:assignmentId/replace-document', auth, requireApprovedTeacher, uploadDocument.single('file'), asyncHandler(replaceAssignmentDocument));

// AI Question Extraction Routes (like assessments)
router.post('/:assignmentId/extract-questions', auth, requireApprovedTeacher, uploadDocument.single('document'), asyncHandler(extractQuestionsFromDocument));
router.put('/:assignmentId/replace-questions', auth, requireApprovedTeacher, uploadDocument.single('document'), asyncHandler(replaceQuestionsFromDocument));

// New synchronous assignment extraction (like assessment processing)
router.post('/:assignmentId/extract-sync', auth, requireApprovedTeacher, uploadDocument.single('document'), asyncHandler(extractAssignmentQuestions));

// AI Processing Status and Retry Routes
router.get('/:assignmentId/ai-status', auth, requireApprovedTeacher, asyncHandler(checkAIProcessingStatus));
router.post('/:assignmentId/retry-extraction', auth, requireApprovedTeacher, asyncHandler(retryQuestionExtraction));
router.post('/:assignmentId/debug-ai', auth, requireApprovedTeacher, asyncHandler(debugAIProcessing));

// Enhanced Grading Routes (like assessments)
router.get('/:assignmentId/submissions', auth, requireApprovedTeacher, asyncHandler(getAssignmentSubmissionsForGrading));
router.put('/submissions/:submissionId/grade', auth, requireApprovedTeacher, asyncHandler(gradeAssignmentSubmission));
router.get('/submissions/:submissionId', auth, asyncHandler(getSubmissionDetails));

// Legacy grading route (keep for backward compatibility)
router.post('/submissions/:submissionId/grade', auth, requireApprovedTeacher, asyncHandler(gradeSubmission));

// Statistics (requires approved teacher profile)
router.get('/:assignmentId/stats', auth, requireApprovedTeacher, asyncHandler(getAssignmentStats));

// Status management (requires approved teacher profile)
router.patch('/:assignmentId/toggle-status', auth, requireApprovedTeacher, asyncHandler(toggleAssignmentStatus));

// Draft saving and submission history
router.post('/save-draft', auth, asyncHandler(saveDraft));
router.get('/:assignmentId/submission-history', auth, asyncHandler(getSubmissionHistory));
router.post('/submissions/:submissionId/ai-grade', auth, asyncHandler(updateAIGrade));

// Additional utility routes
router.get('/course/:courseId/upcoming', auth, asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const { days = 7 } = req.query;
  
  try {
    const assignments = await (Assignment as any).findUpcoming(courseId, parseInt(days as string));
    
    res.json({
      success: true,
      data: assignments
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch upcoming assignments'
    });
  }
}));

router.get('/course/:courseId/overdue', auth, asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  
  try {
    const assignments = await (Assignment as any).findOverdue(courseId);
    
    res.json({
      success: true,
      data: assignments
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch overdue assignments'
    });
  }
}));

// Check if assignment is submittable
router.get('/:assignmentId/submittable', auth, asyncHandler(async (req, res) => {
  const { assignmentId } = req.params;
  
  try {
    const assignment = await Assignment.findById(assignmentId);
    
    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found'
      });
    }
    
    const isSubmittable = assignment.status === 'published' && new Date() <= assignment.dueDate;
    
    res.json({
      success: true,
      data: isSubmittable
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to check assignment status'
    });
  }
}));

export default router;
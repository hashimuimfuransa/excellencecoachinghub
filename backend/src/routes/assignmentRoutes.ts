import express from 'express';
import { auth } from '../middleware/auth';
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
  updateAIGrade
} from '../controllers/assignmentController';

const router = express.Router();

// Assignment CRUD operations
router.post('/', auth, asyncHandler(createAssignment));
router.put('/:id', auth, asyncHandler(updateAssignment));
router.delete('/:id', auth, asyncHandler(deleteAssignment));
router.get('/:id', auth, asyncHandler(getAssignmentById));

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

// File upload for assignments (student submissions)
router.post('/:assignmentId/upload', auth, uploadDocument.single('file'), asyncHandler(uploadAssignmentFile));

// Upload assignment document (instructor)
router.post('/:assignmentId/upload-document', auth, uploadDocument.single('file'), asyncHandler(uploadAssignmentDocument));

// Replace assignment document (instructor)
router.put('/:assignmentId/replace-document', auth, uploadDocument.single('file'), asyncHandler(replaceAssignmentDocument));

// Grading
router.post('/submissions/:submissionId/grade', auth, asyncHandler(gradeSubmission));

// Statistics
router.get('/:assignmentId/stats', auth, asyncHandler(getAssignmentStats));

// Status management
router.patch('/:assignmentId/toggle-status', auth, asyncHandler(toggleAssignmentStatus));

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
import express from 'express';
import { auth } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { uploadDocument } from '../config/cloudinary';
import {
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getCourseAssignments,
  getAssignmentById,
  submitAssignment,
  uploadAssignmentFile,
  uploadAssignmentDocument,
  getAssignmentSubmissions,
  getStudentSubmission,
  gradeSubmission,
  getAssignmentStats,
  toggleAssignmentStatus
} from '../controllers/assignmentController';

const router = express.Router();

// Assignment CRUD operations
router.post('/', auth, asyncHandler(createAssignment));
router.put('/:id', auth, asyncHandler(updateAssignment));
router.delete('/:id', auth, asyncHandler(deleteAssignment));
router.get('/:id', auth, asyncHandler(getAssignmentById));

// Course assignments
router.get('/course/:courseId', auth, asyncHandler(getCourseAssignments));

// Assignment submissions
router.post('/:assignmentId/submit', auth, asyncHandler(submitAssignment));
router.get('/:assignmentId/submissions', auth, asyncHandler(getAssignmentSubmissions));
router.get('/:assignmentId/submission', auth, asyncHandler(getStudentSubmission));

// File upload for assignments (student submissions)
router.post('/:assignmentId/upload', auth, uploadDocument.single('file'), asyncHandler(uploadAssignmentFile));

// Upload assignment document (instructor)
router.post('/:assignmentId/upload-document', auth, uploadDocument.single('file'), asyncHandler(uploadAssignmentDocument));

// Grading
router.post('/submissions/:submissionId/grade', auth, asyncHandler(gradeSubmission));

// Statistics
router.get('/:assignmentId/stats', auth, asyncHandler(getAssignmentStats));

// Status management
router.patch('/:assignmentId/toggle-status', auth, asyncHandler(toggleAssignmentStatus));

// Additional utility routes
router.get('/course/:courseId/upcoming', auth, asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const { days = 7 } = req.query;
  
  try {
    const { Assignment } = await import('../models/Assignment');
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
    const { Assignment } = await import('../models/Assignment');
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
    const { Assignment } = await import('../models/Assignment');
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
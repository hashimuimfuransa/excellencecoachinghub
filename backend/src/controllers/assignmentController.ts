import { Request, Response } from 'express';
import { Assignment, AssignmentSubmission, IAssignment, IAssignmentSubmission } from '../models/Assignment';
import { Course } from '../models/Course';
import { User } from '../models/User';
import { uploadDocumentToCloudinary, deleteDocumentFromCloudinary } from '../config/cloudinary';
import mongoose from 'mongoose';

interface AuthRequest extends Request {
  user?: {
    _id: string;
    role: string;
    email: string;
  };
}

// Create assignment
export const createAssignment = async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      description,
      instructions,
      courseId,
      dueDate,
      maxPoints,
      submissionType,
      allowedFileTypes,
      maxFileSize,
      isRequired
    } = req.body;

    // Validate required fields
    if (!title || !description || !instructions || !courseId || !dueDate || !maxPoints) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Verify course exists and user is the instructor
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }
    
    if (course.instructor.toString() !== req.user?._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to create assignments for this course'
      });
    }

    // Validate due date
    const dueDateObj = new Date(dueDate);
    if (isNaN(dueDateObj.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid due date format'
      });
    }
    
    // Allow due dates in the past for now (can be changed later)
    // if (dueDateObj <= new Date()) {
    //   return res.status(400).json({
    //     success: false,
    //     error: 'Due date must be in the future'
    //   });
    // }

    // Create assignment
    console.log('📝 Creating assignment with data:', {
      title,
      courseId,
      instructor: req.user._id,
      dueDate: dueDateObj
    });

    const assignment = new Assignment({
      title,
      description,
      instructions,
      course: courseId,
      instructor: req.user._id,
      dueDate: dueDateObj,
      maxPoints,
      submissionType: submissionType || 'both',
      allowedFileTypes: allowedFileTypes || ['pdf', 'doc', 'docx'],
      maxFileSize: maxFileSize || 10,
      isRequired: isRequired !== undefined ? isRequired : true,
      status: 'published'
    });

    await assignment.save();
    await assignment.populate('instructor', 'firstName lastName email');
    
    console.log('✅ Assignment saved successfully:', {
      id: assignment._id,
      title: assignment.title,
      course: assignment.course,
      instructor: assignment.instructor,
      status: assignment.status
    });

    res.status(201).json({
      success: true,
      data: assignment,
      message: 'Assignment created successfully'
    });
  } catch (error: any) {
    console.error('Error creating assignment:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create assignment'
    });
  }
};

// Update assignment
export const updateAssignment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Find assignment
    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found'
      });
    }

    // Check authorization
    if (assignment.instructor.toString() !== req.user?._id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this assignment'
      });
    }

    // Validate due date if provided
    if (updateData.dueDate) {
      const dueDateObj = new Date(updateData.dueDate);
      if (dueDateObj <= new Date()) {
        return res.status(400).json({
          success: false,
          error: 'Due date must be in the future'
        });
      }
      updateData.dueDate = dueDateObj;
    }

    // Update assignment
    const updatedAssignment = await Assignment.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('instructor', 'firstName lastName email');

    res.json({
      success: true,
      data: updatedAssignment,
      message: 'Assignment updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating assignment:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update assignment'
    });
  }
};

// Delete assignment
export const deleteAssignment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Find assignment
    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found'
      });
    }

    // Check authorization
    if (assignment.instructor.toString() !== req.user?._id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this assignment'
      });
    }

    // Delete all submissions for this assignment
    const submissions = await AssignmentSubmission.find({ assignment: id });
    for (const submission of submissions) {
      // Delete attachments from Cloudinary
      for (const attachment of submission.attachments) {
        await deleteDocumentFromCloudinary(attachment.fileUrl);
      }
    }
    await AssignmentSubmission.deleteMany({ assignment: id });

    // Delete assignment
    await Assignment.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Assignment deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete assignment'
    });
  }
};

// Get assignments for a course
export const getCourseAssignments = async (req: AuthRequest, res: Response) => {
  try {
    const { courseId } = req.params;
    const { status } = req.query;

    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    // Build query
    const query: any = { course: courseId };
    if (status) {
      query.status = status;
    }

    // Debug instructor comparison
    console.log('🔍 Instructor comparison:', {
      courseInstructor: course.instructor.toString(),
      currentUser: req.user?._id,
      isInstructor: course.instructor.toString() === req.user?._id
    });

    // If user is not the instructor, only show published assignments
    if (course.instructor.toString() !== req.user?._id) {
      console.log('⚠️ User is not instructor, filtering to published only');
      query.status = 'published';
    } else {
      console.log('✅ User is instructor, showing all assignments');
    }

    console.log('🔍 Final query:', query);

    const assignments = await Assignment.find(query)
      .populate('instructor', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        assignments,
        count: assignments.length
      }
    });
  } catch (error: any) {
    console.error('Error fetching course assignments:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch assignments'
    });
  }
};

// Get assignment by ID
export const getAssignmentById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const assignment = await Assignment.findById(id)
      .populate('instructor', 'firstName lastName email')
      .populate('course', 'title description');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found'
      });
    }

    res.json({
      success: true,
      data: assignment
    });
  } catch (error: any) {
    console.error('Error fetching assignment:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch assignment'
    });
  }
};

// Submit assignment
export const submitAssignment = async (req: AuthRequest, res: Response) => {
  try {
    const { assignmentId } = req.params;
    const { submissionText, attachments } = req.body;

    // Find assignment
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found'
      });
    }

    // Check if assignment is published
    if (assignment.status !== 'published') {
      return res.status(400).json({
        success: false,
        error: 'Assignment is not available for submission'
      });
    }

    // Check if already submitted
    const existingSubmission = await AssignmentSubmission.findOne({
      assignment: assignmentId,
      student: req.user._id
    });

    if (existingSubmission) {
      return res.status(400).json({
        success: false,
        error: 'Assignment already submitted'
      });
    }

    // Validate submission based on type
    if (assignment.submissionType === 'text' && !submissionText) {
      return res.status(400).json({
        success: false,
        error: 'Text submission is required'
      });
    }

    if (assignment.submissionType === 'file' && (!attachments || attachments.length === 0)) {
      return res.status(400).json({
        success: false,
        error: 'File submission is required'
      });
    }

    // Create submission
    const submission = new AssignmentSubmission({
      assignment: assignmentId,
      student: req.user._id,
      submissionText,
      attachments: attachments || [],
      submittedAt: new Date(),
      isLate: new Date() > assignment.dueDate
    });

    await submission.save();
    await submission.populate('student', 'firstName lastName email');

    res.status(201).json({
      success: true,
      data: submission,
      message: 'Assignment submitted successfully'
    });
  } catch (error: any) {
    console.error('Error submitting assignment:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to submit assignment'
    });
  }
};

// Upload assignment file (for student submissions)
export const uploadAssignmentFile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const { assignmentId } = req.params;

    // Find assignment to validate file constraints
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found'
      });
    }

    // Check file size
    const fileSizeMB = req.file.size / (1024 * 1024);
    if (fileSizeMB > assignment.maxFileSize) {
      return res.status(400).json({
        success: false,
        error: `File size exceeds maximum allowed size of ${assignment.maxFileSize}MB`
      });
    }

    // Check file type
    const fileExtension = req.file.originalname.split('.').pop()?.toLowerCase();
    if (fileExtension && !assignment.allowedFileTypes.includes(fileExtension)) {
      return res.status(400).json({
        success: false,
        error: `File type .${fileExtension} is not allowed. Allowed types: ${assignment.allowedFileTypes.join(', ')}`
      });
    }

    // Upload to Cloudinary
    const uploadResult = await uploadDocumentToCloudinary(
      req.file.buffer,
      req.user._id,
      req.file.originalname,
      `excellence-coaching-hub/assignments/${assignmentId}/submissions`
    );

    const fileData = {
      filename: uploadResult.publicId,
      originalName: req.file.originalname,
      fileUrl: uploadResult.url,
      fileSize: uploadResult.size,
      uploadedAt: new Date()
    };

    res.json({
      success: true,
      data: fileData,
      message: 'File uploaded successfully'
    });
  } catch (error: any) {
    console.error('Error uploading assignment file:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload file'
    });
  }
};

// Upload assignment document (for instructor - the assignment document itself)
export const uploadAssignmentDocument = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const { assignmentId } = req.params;

    // Find assignment and verify instructor
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found'
      });
    }

    if (assignment.instructor.toString() !== req.user?._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to upload documents for this assignment'
      });
    }

    // Upload to Cloudinary
    const uploadResult = await uploadDocumentToCloudinary(
      req.file.buffer,
      req.user._id,
      req.file.originalname,
      `excellence-coaching-hub/assignments/${assignmentId}/documents`
    );

    // Update assignment with document info
    assignment.assignmentDocument = {
      filename: uploadResult.publicId,
      originalName: req.file.originalname,
      fileUrl: uploadResult.url,
      fileSize: uploadResult.size,
      uploadedAt: new Date()
    };

    await assignment.save();

    res.json({
      success: true,
      data: assignment,
      message: 'Assignment document uploaded successfully'
    });
  } catch (error: any) {
    console.error('Error uploading assignment document:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload assignment document'
    });
  }
};

// Get student submissions for an assignment
export const getAssignmentSubmissions = async (req: AuthRequest, res: Response) => {
  try {
    const { assignmentId } = req.params;

    // Find assignment and verify instructor
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found'
      });
    }

    if (assignment.instructor.toString() !== req.user?._id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view submissions'
      });
    }

    const submissions = await AssignmentSubmission.find({ assignment: assignmentId })
      .populate('student', 'firstName lastName email')
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      data: {
        submissions,
        count: submissions.length
      }
    });
  } catch (error: any) {
    console.error('Error fetching assignment submissions:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch submissions'
    });
  }
};

// Get student's own submission
export const getStudentSubmission = async (req: AuthRequest, res: Response) => {
  try {
    const { assignmentId } = req.params;

    const submission = await AssignmentSubmission.findOne({
      assignment: assignmentId,
      student: req.user._id
    }).populate('assignment', 'title dueDate maxPoints');

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'No submission found'
      });
    }

    res.json({
      success: true,
      data: submission
    });
  } catch (error: any) {
    console.error('Error fetching student submission:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch submission'
    });
  }
};

// Grade assignment submission
export const gradeSubmission = async (req: AuthRequest, res: Response) => {
  try {
    const { submissionId } = req.params;
    const { grade, feedback } = req.body;

    // Find submission
    const submission = await AssignmentSubmission.findById(submissionId)
      .populate('assignment');

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
    }

    // Check authorization
    const assignment = submission.assignment as IAssignment;
    if (assignment.instructor.toString() !== req.user?._id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to grade this submission'
      });
    }

    // Validate grade
    if (grade < 0 || grade > assignment.maxPoints) {
      return res.status(400).json({
        success: false,
        error: `Grade must be between 0 and ${assignment.maxPoints}`
      });
    }

    // Update submission
    submission.grade = grade;
    submission.feedback = feedback;
    submission.status = 'graded';
    submission.gradedAt = new Date();
    submission.gradedBy = new mongoose.Types.ObjectId(req.user._id);

    await submission.save();
    await submission.populate('student', 'firstName lastName email');

    res.json({
      success: true,
      data: submission,
      message: 'Submission graded successfully'
    });
  } catch (error: any) {
    console.error('Error grading submission:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to grade submission'
    });
  }
};

// Get assignment statistics
export const getAssignmentStats = async (req: AuthRequest, res: Response) => {
  try {
    const { assignmentId } = req.params;

    // Find assignment and verify instructor
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found'
      });
    }

    if (assignment.instructor.toString() !== req.user?._id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view statistics'
      });
    }

    // Get submission statistics
    const totalSubmissions = await AssignmentSubmission.countDocuments({ assignment: assignmentId });
    const gradedSubmissions = await AssignmentSubmission.countDocuments({ 
      assignment: assignmentId, 
      status: 'graded' 
    });
    const lateSubmissions = await AssignmentSubmission.countDocuments({ 
      assignment: assignmentId, 
      isLate: true 
    });

    // Get grade statistics
    const gradeStats = await AssignmentSubmission.aggregate([
      { $match: { assignment: new mongoose.Types.ObjectId(assignmentId), grade: { $exists: true } } },
      {
        $group: {
          _id: null,
          averageGrade: { $avg: '$grade' },
          highestGrade: { $max: '$grade' },
          lowestGrade: { $min: '$grade' }
        }
      }
    ]);

    const stats = {
      totalSubmissions,
      gradedSubmissions,
      lateSubmissions,
      pendingGrading: totalSubmissions - gradedSubmissions,
      gradeStatistics: gradeStats[0] || {
        averageGrade: 0,
        highestGrade: 0,
        lowestGrade: 0
      }
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Error fetching assignment statistics:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch statistics'
    });
  }
};

// Publish/unpublish assignment
export const toggleAssignmentStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { assignmentId } = req.params;

    // Find assignment
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found'
      });
    }

    // Check authorization
    if (assignment.instructor.toString() !== req.user?._id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to modify this assignment'
      });
    }

    // Toggle status
    assignment.status = assignment.status === 'published' ? 'draft' : 'published';
    await assignment.save();

    res.json({
      success: true,
      data: assignment,
      message: `Assignment ${assignment.status === 'published' ? 'published' : 'unpublished'} successfully`
    });
  } catch (error: any) {
    console.error('Error toggling assignment status:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update assignment status'
    });
  }
};
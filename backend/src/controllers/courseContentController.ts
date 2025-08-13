import { Request, Response, NextFunction } from 'express';
import { Course } from '../models/Course';
import { validationResult } from 'express-validator';
import { CourseStatus } from '../../../shared/types';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/assignments');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `assignment-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, Word documents, text files, and images are allowed.'));
    }
  }
});

export const uploadAssignmentDocument = upload.single('document');

// Add course content (notes, materials, etc.)
export const addCourseContent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
      return;
    }

    const { courseId } = req.params;
    const { title, type, content, fileUrl, videoUrl, duration, order, isRequired } = req.body;

    // Find course and verify ownership
    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({
        success: false,
        error: 'Course not found'
      });
      return;
    }

    // Check if user is the instructor or admin
    if (req.user.role !== 'admin' && course.instructor.toString() !== req.user._id.toString()) {
      res.status(403).json({
        success: false,
        error: 'Access denied. You can only add content to your own courses.'
      });
      return;
    }

    // Create new content item
    const newContent = {
      title,
      type,
      content,
      fileUrl,
      videoUrl,
      duration,
      order: order || course.content.length + 1,
      isRequired: isRequired || false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add content to course
    course.content.push(newContent);
    await course.save();

    res.status(201).json({
      success: true,
      data: { content: newContent },
      message: 'Course content added successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get course content
export const getCourseContent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { courseId } = req.params;

    // Find course
    const course = await Course.findById(courseId).populate('instructor', 'firstName lastName email');
    if (!course) {
      res.status(404).json({
        success: false,
        error: 'Course not found'
      });
      return;
    }

    // Check if user is authenticated
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    // Check access permissions
    const isInstructor = req.user.role === 'teacher' && course.instructor._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    // For students, we'll check enrollment later, but allow access for now
    const isStudent = req.user.role === 'student';

    if (!isInstructor && !isAdmin && !isStudent) {
      res.status(403).json({
        success: false,
        error: 'Access denied'
      });
      return;
    }

    // For students, only show content if course is approved
    if (req.user.role === 'student' && course.status !== CourseStatus.APPROVED) {
      res.status(403).json({
        success: false,
        error: 'Course is not available'
      });
      return;
    }

    // Auto-sync recorded sessions to course content (run in background)
    try {
      const { LiveSession } = require('../models/LiveSession');

      // Find recorded sessions that aren't yet in course content
      const recordedSessions = await LiveSession.find({
        course: courseId,
        recordingStatus: 'completed',
        recordingUrl: { $exists: true, $ne: null }
      });

      let syncedCount = 0;
      // Check which sessions are not yet in course content
      for (const session of recordedSessions) {
        const existingContent = course.content.find((content: any) =>
          content.liveSessionId && content.liveSessionId.toString() === session._id.toString()
        );

        if (!existingContent) {
          try {
            await session.addRecordingToCourseContent();
            syncedCount++;
          } catch (syncError) {
            console.error(`Failed to sync session ${session.title}:`, syncError);
          }
        }
      }

      // If we synced any sessions, refresh the course data
      if (syncedCount > 0) {
        await course.populate('instructor', 'firstName lastName email');
        console.log(`Auto-synced ${syncedCount} recorded sessions to course ${course.title}`);
      }
    } catch (syncError) {
      console.error('Auto-sync recorded sessions failed:', syncError);
      // Don't fail the main request if sync fails
    }

    res.status(200).json({
      success: true,
      data: {
        content: course.content || [],
        courseTitle: course.title,
        instructor: course.instructor
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update course content
export const updateCourseContent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
      return;
    }

    const { courseId, contentId } = req.params;
    const { title, type, content, fileUrl, videoUrl, duration, order, isRequired } = req.body;

    // Find course and verify ownership
    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({
        success: false,
        error: 'Course not found'
      });
      return;
    }

    // Check if user is the instructor or admin
    if (req.user.role !== 'admin' && course.instructor.toString() !== req.user._id.toString()) {
      res.status(403).json({
        success: false,
        error: 'Access denied. You can only update content in your own courses.'
      });
      return;
    }

    // Find and update content item
    const contentItem = course.content.id(contentId);
    if (!contentItem) {
      res.status(404).json({
        success: false,
        error: 'Content item not found'
      });
      return;
    }

    // Update content item
    if (title !== undefined) contentItem.title = title;
    if (type !== undefined) contentItem.type = type;
    if (content !== undefined) contentItem.content = content;
    if (fileUrl !== undefined) contentItem.fileUrl = fileUrl;
    if (videoUrl !== undefined) contentItem.videoUrl = videoUrl;
    if (duration !== undefined) contentItem.duration = duration;
    if (order !== undefined) contentItem.order = order;
    if (isRequired !== undefined) contentItem.isRequired = isRequired;
    contentItem.updatedAt = new Date();

    await course.save();

    res.status(200).json({
      success: true,
      data: { content: contentItem },
      message: 'Course content updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Delete course content
export const deleteCourseContent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { courseId, contentId } = req.params;

    // Find course and verify ownership
    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({
        success: false,
        error: 'Course not found'
      });
      return;
    }

    // Check if user is the instructor or admin
    if (req.user.role !== 'admin' && course.instructor.toString() !== req.user._id.toString()) {
      res.status(403).json({
        success: false,
        error: 'Access denied. You can only delete content from your own courses.'
      });
      return;
    }

    // Find and remove content item
    const contentItem = course.content.id(contentId);
    if (!contentItem) {
      res.status(404).json({
        success: false,
        error: 'Content item not found'
      });
      return;
    }

    course.content.pull(contentId);
    await course.save();

    res.status(200).json({
      success: true,
      message: 'Course content deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Reorder course content
export const reorderCourseContent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { courseId } = req.params;
    const { contentOrder } = req.body; // Array of content IDs in new order

    // Find course and verify ownership
    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({
        success: false,
        error: 'Course not found'
      });
      return;
    }

    // Check if user is the instructor or admin
    if (req.user.role !== 'admin' && course.instructor.toString() !== req.user._id.toString()) {
      res.status(403).json({
        success: false,
        error: 'Access denied. You can only reorder content in your own courses.'
      });
      return;
    }

    // Update order for each content item
    contentOrder.forEach((contentId: string, index: number) => {
      const contentItem = course.content.id(contentId);
      if (contentItem) {
        contentItem.order = index + 1;
        contentItem.updatedAt = new Date();
      }
    });

    await course.save();

    res.status(200).json({
      success: true,
      data: { content: course.content },
      message: 'Course content reordered successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Create enhanced assignment with document upload
export const createEnhancedAssignment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { courseId } = req.params;
    const { assignmentData } = req.body;
    
    // Parse assignment data
    let parsedData;
    try {
      parsedData = JSON.parse(assignmentData);
    } catch (parseError) {
      res.status(400).json({
        success: false,
        error: 'Invalid assignment data format'
      });
      return;
    }

    const { title, description, dueDate, points, instructions } = parsedData;

    // Find course and verify ownership
    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({
        success: false,
        error: 'Course not found'
      });
      return;
    }

    // Check if user is the instructor or admin
    if (req.user.role !== 'admin' && course.instructor.toString() !== req.user._id.toString()) {
      res.status(403).json({
        success: false,
        error: 'Access denied. You can only add assignments to your own courses.'
      });
      return;
    }

    // Create assignment content
    const assignmentContent = {
      description,
      dueDate,
      points: points || 100,
      instructions: instructions || '',
      type: 'assignment'
    };

    // Create new assignment
    const newAssignment = {
      title,
      type: 'assignment',
      content: JSON.stringify(assignmentContent),
      order: course.content.length + 1,
      isRequired: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add file URL if document was uploaded
    if (req.file) {
      const fileUrl = `/uploads/assignments/${req.file.filename}`;
      newAssignment.fileUrl = fileUrl;
    }

    // Add assignment to course
    course.content.push(newAssignment);
    await course.save();

    res.status(201).json({
      success: true,
      data: { content: newAssignment },
      message: 'Assignment created successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Upload document to existing assignment
export const uploadDocumentToAssignment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { courseId, assignmentId } = req.params;

    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'No document uploaded'
      });
      return;
    }

    // Find course and verify ownership
    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({
        success: false,
        error: 'Course not found'
      });
      return;
    }

    // Check if user is the instructor or admin
    if (req.user.role !== 'admin' && course.instructor.toString() !== req.user._id.toString()) {
      res.status(403).json({
        success: false,
        error: 'Access denied. You can only upload documents to your own assignments.'
      });
      return;
    }

    // Find assignment
    const assignment = course.content.id(assignmentId);
    if (!assignment) {
      res.status(404).json({
        success: false,
        error: 'Assignment not found'
      });
      return;
    }

    if (assignment.type !== 'assignment') {
      res.status(400).json({
        success: false,
        error: 'Content item is not an assignment'
      });
      return;
    }

    // Update assignment with file URL
    const fileUrl = `/uploads/assignments/${req.file.filename}`;
    assignment.fileUrl = fileUrl;
    assignment.updatedAt = new Date();

    await course.save();

    res.status(200).json({
      success: true,
      data: { content: assignment },
      message: 'Document uploaded successfully'
    });
  } catch (error) {
    next(error);
  }
};
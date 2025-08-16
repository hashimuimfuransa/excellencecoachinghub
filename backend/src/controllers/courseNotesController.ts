import { Request, Response, NextFunction } from 'express';
import { CourseNotes } from '../models/CourseNotes';
import { ReadingProgress } from '../models/ReadingProgress';
import { Course } from '../models/Course';
import { UserProgress } from '../models/UserProgress';
import { aiService } from '../services/aiService';
import { validationResult } from 'express-validator';

// Create course notes (Teacher only)
export const createCourseNotes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

    const teacherId = req.user?._id;
    const {
      title,
      description,
      courseId,
      chapter,
      sections,
      prerequisites,
      learningObjectives,
      tags,
      attachments
    } = req.body;

    // Verify course exists and teacher has access
    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({
        success: false,
        error: 'Course not found'
      });
      return;
    }

    if (course.instructor.toString() !== teacherId) {
      res.status(403).json({
        success: false,
        error: 'You do not have permission to create notes for this course'
      });
      return;
    }

    // Check if chapter already exists
    const existingNotes = await CourseNotes.findOne({ course: courseId, chapter });
    if (existingNotes) {
      res.status(400).json({
        success: false,
        error: `Chapter ${chapter} already exists for this course`
      });
      return;
    }

    // Create course notes
    const courseNotes = new CourseNotes({
      title,
      description,
      course: courseId,
      instructor: teacherId,
      chapter,
      sections: sections || [],
      prerequisites: prerequisites || [],
      learningObjectives: learningObjectives || [],
      tags: tags || [],
      attachments: attachments || []
    });

    await courseNotes.save();

    // Populate response
    await courseNotes.populate('course', 'title');
    await courseNotes.populate('instructor', 'firstName lastName');

    res.status(201).json({
      success: true,
      data: { courseNotes },
      message: 'Course notes created successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get teacher's course notes
export const getTeacherCourseNotes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const teacherId = req.user?._id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const courseId = req.query.courseId as string;

    // Build filter
    const filter: any = { instructor: teacherId };
    if (courseId) {
      filter.course = courseId;
    }

    const skip = (page - 1) * limit;

    const [courseNotes, total] = await Promise.all([
      CourseNotes.find(filter)
        .populate('course', 'title')
        .sort({ course: 1, chapter: 1 })
        .skip(skip)
        .limit(limit),
      CourseNotes.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: {
        courseNotes,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get course notes by ID
export const getCourseNotesById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;
    const userRole = req.user?.role;

    const courseNotes = await CourseNotes.findById(id)
      .populate('course', 'title')
      .populate('instructor', 'firstName lastName')
      .populate('prerequisites', 'title chapter');

    if (!courseNotes) {
      res.status(404).json({
        success: false,
        error: 'Course notes not found'
      });
      return;
    }

    // Check permissions
    if (userRole === 'teacher' && courseNotes.instructor._id.toString() !== userId) {
      res.status(403).json({
        success: false,
        error: 'You do not have permission to view these notes'
      });
      return;
    }

    // For students, check if they're enrolled and if notes are published
    if (userRole === 'student') {
      const { CourseEnrollment } = require('../models/CourseEnrollment');
      const enrollment = await CourseEnrollment.findOne({ 
        student: userId, 
        course: courseNotes.course._id,
        isActive: true,
        paymentStatus: { $in: ['completed', 'pending'] } // Allow both completed and pending for development
      });
      
      console.log(`🔍 Enrollment check for student ${userId} in course ${courseNotes.course._id}:`, enrollment ? 'FOUND' : 'NOT FOUND');
      
      if (!enrollment) {
        res.status(403).json({
          success: false,
          error: 'You are not enrolled in this course'
        });
        return;
      }

      if (!courseNotes.isPublished) {
        res.status(403).json({
          success: false,
          error: 'These notes are not yet published'
        });
        return;
      }

      // Get student's reading progress
      const progress = await ReadingProgress.findOne({
        student: userId,
        courseNotes: id
      });

      res.status(200).json({
        success: true,
        data: { 
          courseNotes,
          progress: progress || null
        }
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { courseNotes }
    });
  } catch (error) {
    next(error);
  }
};

// Update course notes
export const updateCourseNotes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const teacherId = req.user?._id;
    const updates = req.body;

    const courseNotes = await CourseNotes.findOne({ _id: id, instructor: teacherId });
    if (!courseNotes) {
      res.status(404).json({
        success: false,
        error: 'Course notes not found or you do not have permission to update them'
      });
      return;
    }

    // Update allowed fields
    const allowedUpdates = [
      'title', 'description', 'sections', 'prerequisites', 
      'learningObjectives', 'tags', 'attachments'
    ];

    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        (courseNotes as any)[field] = updates[field];
      }
    });

    // Increment version if content changed
    if (updates.sections) {
      courseNotes.version += 1;
    }

    await courseNotes.save();

    res.status(200).json({
      success: true,
      data: { courseNotes },
      message: 'Course notes updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Delete course notes
export const deleteCourseNotes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const teacherId = req.user?._id;

    const courseNotes = await CourseNotes.findOne({ _id: id, instructor: teacherId });
    if (!courseNotes) {
      res.status(404).json({
        success: false,
        error: 'Course notes not found or you do not have permission to delete them'
      });
      return;
    }

    // Check if there are reading progress records
    const hasProgress = await ReadingProgress.exists({ courseNotes: id });
    if (hasProgress) {
      res.status(400).json({
        success: false,
        error: 'Cannot delete notes that students have already accessed'
      });
      return;
    }

    await CourseNotes.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Course notes deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Publish/unpublish course notes
export const togglePublishCourseNotes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const teacherId = req.user?._id;

    const courseNotes = await CourseNotes.findOne({ _id: id, instructor: teacherId });
    if (!courseNotes) {
      res.status(404).json({
        success: false,
        error: 'Course notes not found or you do not have permission to modify them'
      });
      return;
    }

    courseNotes.isPublished = !courseNotes.isPublished;
    await courseNotes.save();

    res.status(200).json({
      success: true,
      data: { courseNotes },
      message: `Course notes ${courseNotes.isPublished ? 'published' : 'unpublished'} successfully`
    });
  } catch (error) {
    next(error);
  }
};

// Get course notes for a course (Student view)
export const getCourseNotesByCourse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { courseId } = req.params;
    const studentId = req.user?._id;
    
    console.log(`🔍 getCourseNotesByCourse called - Course: ${courseId}, Student: ${studentId}`);

    // Check if student is enrolled
    const { CourseEnrollment } = require('../models/CourseEnrollment');
    const enrollment = await CourseEnrollment.findOne({ 
      student: studentId, 
      course: courseId,
      isActive: true,
      paymentStatus: { $in: ['completed', 'pending'] } // Allow both completed and pending for development
    });
    
    console.log(`🔍 Enrollment check for student ${studentId} in course ${courseId}: ${enrollment ? 'FOUND' : 'NOT FOUND'}`);
    
    if (!enrollment) {
      res.status(403).json({
        success: false,
        error: 'You are not enrolled in this course'
      });
      return;
    }

    // Get course details
    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({
        success: false,
        error: 'Course not found'
      });
      return;
    }

    // Get published notes in progressive order
    let courseNotes;
    try {
      courseNotes = await CourseNotes.getProgressiveOrder(courseId);
      console.log(`📚 getProgressiveOrder returned ${courseNotes.length} notes for course ${courseId}`);
    } catch (error) {
      console.error('Error with getProgressiveOrder, using fallback:', error);
      // Fallback to direct query
      courseNotes = await CourseNotes.find({ 
        course: courseId, 
        isPublished: true 
      })
      .populate('prerequisites')
      .sort({ chapter: 1 });
      console.log(`📚 Fallback query returned ${courseNotes.length} notes for course ${courseId}`);
    }

    // Get student's progress for each chapter
    const notesWithProgress = await Promise.all(
      courseNotes.map(async (notes) => {
        const progress = await ReadingProgress.findOne({
          student: studentId,
          courseNotes: notes._id
        });

        return {
          ...notes.toObject(),
          progress: progress ? {
            isCompleted: progress.isCompleted,
            completedAt: progress.completedAt,
            currentSection: progress.currentSection,
            sectionsCompleted: progress.sectionsCompleted,
            completionPercentage: progress.getCompletionPercentage(),
            timeSpent: progress.timeSpent,
            bookmarks: progress.bookmarks
          } : null
        };
      })
    );

    console.log(`📤 Returning ${notesWithProgress.length} course notes to student`);
    
    res.status(200).json({
      success: true,
      data: { courseNotes: notesWithProgress }
    });
  } catch (error) {
    next(error);
  }
};

// Generate AI quiz from notes
export const generateQuizFromNotes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { difficulty = 'medium', questionCount = 10 } = req.body;
    const studentId = req.user?._id;

    const courseNotes = await CourseNotes.findById(id);
    if (!courseNotes) {
      res.status(404).json({
        success: false,
        error: 'Course notes not found'
      });
      return;
    }

    // Check if student has completed reading the notes
    const progress = await ReadingProgress.findOne({
      student: studentId,
      courseNotes: id
    });

    if (!progress || !progress.isCompleted) {
      res.status(400).json({
        success: false,
        error: 'You must complete reading the notes before generating a quiz'
      });
      return;
    }

    // Extract text content from sections
    const notesContent = courseNotes.sections
      .filter(section => section.type === 'text')
      .map(section => section.content)
      .join('\n\n');

    // Generate quiz using AI
    const questions = await aiService.generateQuizFromNotes(notesContent, difficulty, questionCount);

    // Mark quiz as generated
    progress.quizGenerated = true;
    await progress.save();

    res.status(200).json({
      success: true,
      data: { questions },
      message: 'Quiz generated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Create course notes from uploaded materials (Teacher only)
export const createNotesFromMaterials = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { courseId } = req.params;
    const { title, description, chapter, materialContent } = req.body;
    const instructorId = req.user?._id;

    // Check if course exists and user is the instructor
    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({
        success: false,
        error: 'Course not found'
      });
      return;
    }

    if (course.instructor.toString() !== instructorId) {
      res.status(403).json({
        success: false,
        error: 'You are not authorized to create notes for this course'
      });
      return;
    }

    // Extract sections from material content (simple text processing)
    const sections = materialContent.split('\n\n').filter((section: string) => section.trim()).map((content: string, index: number) => {
      const lines = content.trim().split('\n');
      const title = lines[0] || `Section ${index + 1}`;
      const sectionContent = lines.slice(1).join('\n') || content;
      
      return {
        id: `section-${Date.now()}-${index}`,
        title: title.replace(/^#+\s*/, ''), // Remove markdown headers
        content: sectionContent,
        order: index + 1,
        type: 'text',
        isRequired: true,
        estimatedReadTime: Math.ceil(sectionContent.split(' ').length / 200)
      };
    });

    // Create course notes
    const courseNotes = new CourseNotes({
      title: title || `${course.title} - Chapter ${chapter}`,
      description: description || 'Auto-generated from uploaded materials',
      course: courseId,
      instructor: instructorId,
      chapter: chapter || 1,
      sections,
      isPublished: false
    });

    await courseNotes.save();

    // Populate the response
    await courseNotes.populate('course', 'title');
    await courseNotes.populate('instructor', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Course notes created from materials successfully',
      data: courseNotes
    });

  } catch (error) {
    next(error);
  }
};

export default {
  createCourseNotes,
  getTeacherCourseNotes,
  getCourseNotesById,
  updateCourseNotes,
  deleteCourseNotes,
  togglePublishCourseNotes,
  getCourseNotesByCourse,
  generateQuizFromNotes,
  createNotesFromMaterials
};

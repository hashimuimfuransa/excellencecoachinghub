import { Request, Response, NextFunction } from 'express';
import { ReadingProgress } from '../models/ReadingProgress';
import { CourseNotes } from '../models/CourseNotes';
import { Course } from '../models/Course';

// Update reading progress
export const updateReadingProgress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { courseNotesId } = req.params;
    const studentId = req.user?.id;
    const { currentSection, sectionsCompleted, timeSpent } = req.body;

    const courseNotes = await CourseNotes.findById(courseNotesId);
    if (!courseNotes) {
      res.status(404).json({
        success: false,
        error: 'Course notes not found'
      });
      return;
    }

    // Check if student is enrolled in the course
    const course = await Course.findOne({ 
      _id: courseNotes.course, 
      enrolledStudents: studentId 
    });
    
    if (!course) {
      res.status(403).json({
        success: false,
        error: 'You are not enrolled in this course'
      });
      return;
    }

    // Find or create progress record
    let progress = await ReadingProgress.findOne({
      student: studentId,
      courseNotes: courseNotesId
    });

    if (!progress) {
      progress = new ReadingProgress({
        student: studentId,
        course: courseNotes.course,
        courseNotes: courseNotesId,
        timeSpent: 0,
        sectionsCompleted: []
      });
    }

    // Update progress
    if (currentSection) {
      progress.currentSection = currentSection;
    }

    if (sectionsCompleted && Array.isArray(sectionsCompleted)) {
      progress.sectionsCompleted = [...new Set([...progress.sectionsCompleted, ...sectionsCompleted])];
    }

    if (timeSpent) {
      progress.timeSpent = Math.max(progress.timeSpent, timeSpent);
    }

    // Check if all required sections are completed
    const totalRequiredSections = courseNotes.sections.filter(s => s.isRequired).length;
    const completedRequiredSections = progress.sectionsCompleted.filter(sectionId => {
      const section = courseNotes.sections.find(s => s.id === sectionId);
      return section && section.isRequired;
    }).length;

    if (completedRequiredSections >= totalRequiredSections && !progress.isCompleted) {
      progress.isCompleted = true;
      progress.completedAt = new Date();
    }

    await progress.save();

    res.status(200).json({
      success: true,
      data: { progress },
      message: 'Reading progress updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Mark section as complete
export const markSectionComplete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { courseNotesId, sectionId } = req.params;
    const studentId = req.user?.id;

    const courseNotes = await CourseNotes.findById(courseNotesId);
    if (!courseNotes) {
      res.status(404).json({
        success: false,
        error: 'Course notes not found'
      });
      return;
    }

    // Verify section exists
    const section = courseNotes.sections.find(s => s.id === sectionId);
    if (!section) {
      res.status(404).json({
        success: false,
        error: 'Section not found'
      });
      return;
    }

    // Find or create progress record
    let progress = await ReadingProgress.findOne({
      student: studentId,
      courseNotes: courseNotesId
    });

    if (!progress) {
      progress = new ReadingProgress({
        student: studentId,
        course: courseNotes.course,
        courseNotes: courseNotesId,
        timeSpent: 0,
        sectionsCompleted: []
      });
    }

    // Mark section as complete
    await progress.markSectionComplete(sectionId);

    res.status(200).json({
      success: true,
      data: { progress },
      message: 'Section marked as complete'
    });
  } catch (error) {
    next(error);
  }
};

// Add bookmark
export const addBookmark = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { courseNotesId, sectionId } = req.params;
    const { note } = req.body;
    const studentId = req.user?.id;

    const courseNotes = await CourseNotes.findById(courseNotesId);
    if (!courseNotes) {
      res.status(404).json({
        success: false,
        error: 'Course notes not found'
      });
      return;
    }

    // Verify section exists
    const section = courseNotes.sections.find(s => s.id === sectionId);
    if (!section) {
      res.status(404).json({
        success: false,
        error: 'Section not found'
      });
      return;
    }

    // Find or create progress record
    let progress = await ReadingProgress.findOne({
      student: studentId,
      courseNotes: courseNotesId
    });

    if (!progress) {
      progress = new ReadingProgress({
        student: studentId,
        course: courseNotes.course,
        courseNotes: courseNotesId,
        timeSpent: 0,
        sectionsCompleted: []
      });
    }

    // Add bookmark
    await progress.addBookmark(sectionId, note);

    res.status(200).json({
      success: true,
      data: { progress },
      message: 'Bookmark added successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Remove bookmark
export const removeBookmark = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { courseNotesId, sectionId } = req.params;
    const studentId = req.user?.id;

    const progress = await ReadingProgress.findOne({
      student: studentId,
      courseNotes: courseNotesId
    });

    if (!progress) {
      res.status(404).json({
        success: false,
        error: 'Reading progress not found'
      });
      return;
    }

    // Remove bookmark
    await progress.removeBookmark(sectionId);

    res.status(200).json({
      success: true,
      data: { progress },
      message: 'Bookmark removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get student's reading progress for a course
export const getStudentProgress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { courseId } = req.params;
    const studentId = req.user?.id;

    // Check if student is enrolled
    const course = await Course.findOne({ 
      _id: courseId, 
      enrolledStudents: studentId 
    });
    
    if (!course) {
      res.status(403).json({
        success: false,
        error: 'You are not enrolled in this course'
      });
      return;
    }

    const progress = await ReadingProgress.getStudentProgress(studentId, courseId);

    // Calculate overall course progress
    const totalChapters = await CourseNotes.countDocuments({ 
      course: courseId, 
      isPublished: true 
    });
    
    const completedChapters = progress.filter(p => p.isCompleted).length;
    const overallProgress = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        progress,
        summary: {
          totalChapters,
          completedChapters,
          overallProgress,
          totalTimeSpent: progress.reduce((sum, p) => sum + p.timeSpent, 0)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get all student progress (for teachers)
export const getCourseProgressStatistics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { courseId } = req.params;
    const teacherId = req.user?.id;

    // Verify teacher owns the course
    const course = await Course.findOne({ _id: courseId, instructor: teacherId });
    if (!course) {
      res.status(404).json({
        success: false,
        error: 'Course not found or you do not have permission to view statistics'
      });
      return;
    }

    const statistics = await ReadingProgress.getCourseStatistics(courseId);

    // Get detailed progress by chapter
    const chapterProgress = await ReadingProgress.aggregate([
      { $match: { course: new (require('mongoose')).Types.ObjectId(courseId) } },
      {
        $lookup: {
          from: 'coursenotes',
          localField: 'courseNotes',
          foreignField: '_id',
          as: 'notes'
        }
      },
      { $unwind: '$notes' },
      {
        $group: {
          _id: '$notes.chapter',
          title: { $first: '$notes.title' },
          totalStudents: { $sum: 1 },
          completedStudents: {
            $sum: { $cond: [{ $eq: ['$isCompleted', true] }, 1, 0] }
          },
          averageTimeSpent: { $avg: '$timeSpent' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overall: statistics,
        byChapter: chapterProgress
      }
    });
  } catch (error) {
    next(error);
  }
};

export default {
  updateReadingProgress,
  markSectionComplete,
  addBookmark,
  removeBookmark,
  getStudentProgress,
  getCourseProgressStatistics
};

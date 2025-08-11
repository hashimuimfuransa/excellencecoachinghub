import { Request, Response, NextFunction } from 'express';
import { UserProgress } from '../models/UserProgress';
import { Course } from '../models/Course';

// Mark content as completed
export const markContentCompleted = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { courseId, contentId } = req.params;
    console.log('Mark content completed - User:', req.user);
    console.log('Mark content completed - Params:', { courseId, contentId });

    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }

    const studentId = req.user._id;

    // Find or create user progress
    let progress = await UserProgress.findByUserAndCourse(studentId, courseId);
    
    if (!progress) {
      // Create new progress record if doesn't exist
      progress = new UserProgress({
        user: studentId,
        course: courseId,
        completedLessons: [],
        enrollmentDate: new Date()
      });
    }

    // Add completed lesson
    await progress.addCompletedLesson(contentId);

    // Get course to calculate accurate progress
    const course = await Course.findById(courseId);
    if (course) {
      // Calculate progress based on actual course content
      // This is a simplified calculation - you might want to make it more sophisticated
      const totalContent = course.content?.length || 1;
      const completedContent = progress.completedLessons.length;
      progress.progressPercentage = Math.min((completedContent / totalContent) * 100, 100);
      
      if (progress.progressPercentage >= 100 && !progress.isCompleted) {
        await progress.markAsCompleted();
      }
      
      await progress.save();
    }

    res.status(200).json({
      success: true,
      data: {
        progress: progress.progressPercentage,
        completedLessons: progress.completedLessons,
        isCompleted: progress.isCompleted,
        totalPoints: progress.totalPoints
      }
    });
  } catch (error) {
    console.error('Mark content completed error:', error);
    next(error);
  }
};

// Get user progress for a course
export const getCourseProgress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { courseId } = req.params;
    console.log('Get course progress - User:', req.user);
    console.log('Get course progress - CourseId:', courseId);

    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }

    const studentId = req.user._id;

    const progress = await UserProgress.findByUserAndCourse(studentId, courseId);
    
    if (!progress) {
      res.status(404).json({
        success: false,
        error: 'Progress not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: progress
    });
  } catch (error) {
    next(error);
  }
};

// Get all user progress
export const getUserProgress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const studentId = req.user._id;
    const progressList = await UserProgress.findByUser(studentId);

    res.status(200).json({
      success: true,
      data: progressList
    });
  } catch (error) {
    next(error);
  }
};

// Get user statistics
export const getUserStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const studentId = req.user._id;
    const stats = await UserProgress.getUserStats(studentId);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

// Remove completed content (undo completion)
export const removeCompletedContent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { courseId, contentId } = req.params;
    const studentId = req.user._id;

    const progress = await UserProgress.findByUserAndCourse(studentId, courseId);
    
    if (!progress) {
      res.status(404).json({
        success: false,
        error: 'Progress not found'
      });
      return;
    }

    // Remove from completed lessons
    progress.completedLessons = progress.completedLessons.filter(id => id !== contentId);
    
    // Recalculate progress
    const course = await Course.findById(courseId);
    if (course) {
      const totalContent = course.content?.length || 1;
      const completedContent = progress.completedLessons.length;
      progress.progressPercentage = Math.min((completedContent / totalContent) * 100, 100);
      
      // If no longer 100%, mark as not completed
      if (progress.progressPercentage < 100) {
        progress.isCompleted = false;
        progress.completionDate = undefined;
      }
      
      await progress.save();
    }

    res.status(200).json({
      success: true,
      data: {
        progress: progress.progressPercentage,
        completedLessons: progress.completedLessons,
        isCompleted: progress.isCompleted
      }
    });
  } catch (error) {
    next(error);
  }
};

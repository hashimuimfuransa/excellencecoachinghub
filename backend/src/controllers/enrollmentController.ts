import { Request, Response, NextFunction } from 'express';
import { Course } from '../models/Course';
import { UserProgress } from '../models/UserProgress';
import { User } from '../models/User';
import { CourseStatus } from '../../../shared/types';
import { notificationService } from '../services/notificationService';

// Enroll in a course
export const enrollInCourse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { courseId } = req.body;
    const studentId = req.user._id;

    // Check if course exists and is approved
    const course = await Course.findById(courseId).populate('instructor', 'firstName lastName email');
    if (!course) {
      res.status(404).json({
        success: false,
        error: 'Course not found'
      });
      return;
    }

    if (course.status !== CourseStatus.APPROVED) {
      res.status(400).json({
        success: false,
        error: 'Course is not available for enrollment'
      });
      return;
    }

    // Check if student is already enrolled
    const existingEnrollment = await UserProgress.findOne({
      user: studentId,
      course: courseId
    });

    if (existingEnrollment) {
      res.status(400).json({
        success: false,
        error: 'You are already enrolled in this course'
      });
      return;
    }

    // Create enrollment record
    const enrollment = new UserProgress({
      user: studentId,
      course: courseId,
      enrollmentDate: new Date(),
      progress: 0,
      isCompleted: false,
      lastAccessed: new Date()
    });

    await enrollment.save();

    // Update course enrollment count
    await course.incrementEnrollment();

    // Send notification to instructor
    try {
      await notificationService.notifyInstructorNewEnrollment(
        course.instructor._id.toString(),
        course._id.toString(),
        course.title,
        req.user.firstName + ' ' + req.user.lastName
      );
    } catch (notificationError) {
      console.error('Failed to send enrollment notification:', notificationError);
      // Don't fail the enrollment if notification fails
    }

    // Populate the enrollment with course details for response
    const populatedEnrollment = await UserProgress.findById(enrollment._id)
      .populate('course', 'title description instructor category level duration price')
      .populate({
        path: 'course',
        populate: {
          path: 'instructor',
          select: 'firstName lastName email'
        }
      });

    res.status(201).json({
      success: true,
      data: { enrollment: populatedEnrollment },
      message: 'Successfully enrolled in course'
    });
  } catch (error) {
    next(error);
  }
};

// Unenroll from a course
export const unenrollFromCourse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { courseId } = req.params;
    const studentId = req.user._id;

    // Find and delete enrollment
    const enrollment = await UserProgress.findOneAndDelete({
      user: studentId,
      course: courseId
    });

    if (!enrollment) {
      res.status(404).json({
        success: false,
        error: 'Enrollment not found'
      });
      return;
    }

    // Update course enrollment count
    const course = await Course.findById(courseId);
    if (course) {
      await course.decrementEnrollment();
    }

    res.status(200).json({
      success: true,
      message: 'Successfully unenrolled from course'
    });
  } catch (error) {
    next(error);
  }
};

// Get student's enrollments
export const getMyEnrollments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const studentId = req.user._id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Get enrollments with course details
    const enrollments = await UserProgress.find({ user: studentId })
      .populate({
        path: 'course',
        select: 'title description instructor category level duration price status thumbnail',
        populate: {
          path: 'instructor',
          select: 'firstName lastName email'
        }
      })
      .sort({ enrollmentDate: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count
    const totalEnrollments = await UserProgress.countDocuments({ user: studentId });
    const totalPages = Math.ceil(totalEnrollments / limit);

    res.status(200).json({
      success: true,
      data: {
        enrollments,
        pagination: {
          currentPage: page,
          totalPages,
          totalEnrollments,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get specific enrollment details
export const getEnrollmentDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { courseId } = req.params;
    const studentId = req.user._id;

    const enrollment = await UserProgress.findOne({
      user: studentId,
      course: courseId
    }).populate({
      path: 'course',
      select: 'title description instructor category level duration price status thumbnail',
      populate: {
        path: 'instructor',
        select: 'firstName lastName email'
      }
    });

    if (!enrollment) {
      res.status(404).json({
        success: false,
        error: 'Enrollment not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { enrollment }
    });
  } catch (error) {
    next(error);
  }
};
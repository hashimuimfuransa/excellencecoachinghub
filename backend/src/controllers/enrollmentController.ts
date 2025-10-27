import { Request, Response, NextFunction } from 'express';
import { CourseEnrollment } from '../models/CourseEnrollment';
import { Course } from '../models/Course';
import { User } from '../models/User';
import { notificationService } from '../services/notificationService';

// Enroll in a course
export const enrollInCourse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { courseId } = req.params;
    const { enrollmentType = 'both', paymentMethod } = req.body;
    const studentId = req.user?._id;

    if (!studentId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    // Check if course exists and is approved
    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({
        success: false,
        error: 'Course not found'
      });
      return;
    }

    if (course.status !== 'approved') {
      res.status(400).json({
        success: false,
        error: 'Course is not available for enrollment'
      });
      return;
    }

    // Check enrollment deadline
    if (course.enrollmentDeadline && new Date() > course.enrollmentDeadline) {
      res.status(400).json({
        success: false,
        error: 'Enrollment deadline has passed'
      });
      return;
    }

    // Check if course is full
    if (course.maxEnrollments && course.enrollmentCount >= course.maxEnrollments) {
      res.status(400).json({
        success: false,
        error: 'Course is full'
      });
      return;
    }

    // Check if student is already enrolled
    const existingEnrollment = await CourseEnrollment.findOne({
      student: studentId,
      course: courseId,
      isActive: true
    });

    if (existingEnrollment) {
      res.status(400).json({
        success: false,
        error: 'Already enrolled in this course'
      });
      return;
    }

    // Calculate payment amount
    let paymentAmount = 0;
    switch (enrollmentType) {
      case 'notes':
        paymentAmount = course.notesPrice;
        break;
      case 'live_sessions':
        paymentAmount = course.liveSessionPrice;
        break;
      case 'both':
        // 20% discount for bundle
        paymentAmount = course.notesPrice + (course.liveSessionPrice * 0.8);
        break;
      default:
        res.status(400).json({
          success: false,
          error: 'Invalid enrollment type'
        });
        return;
    }

    // Set access permissions based on enrollment type
    const accessPermissions = {
      canAccessNotes: enrollmentType === 'notes' || enrollmentType === 'both',
      canAccessLiveSessions: enrollmentType === 'live_sessions' || enrollmentType === 'both',
      canDownloadMaterials: enrollmentType === 'notes' || enrollmentType === 'both',
      canSubmitAssignments: enrollmentType === 'notes' || enrollmentType === 'both'
    };

    // Create enrollment record
    const enrollment = new CourseEnrollment({
      student: studentId,
      course: courseId,
      enrollmentType,
      paymentAmount,
      paymentMethod,
      paymentStatus: paymentAmount === 0 ? 'completed' : 'pending',
      transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      accessPermissions,
      progress: {
        completedLessons: [],
        completedAssignments: [],
        totalProgress: 0,
        lastAccessedAt: new Date()
      }
    });

    await enrollment.save();

    // If free course, mark as completed and increment enrollment count
    if (paymentAmount === 0) {
      await Course.findByIdAndUpdate(courseId, {
        $inc: { enrollmentCount: 1 }
      });

      // Notify instructor about new enrollment
      try {
        await notificationService.notifyInstructorNewEnrollment(
          course.instructor.toString(),
          courseId,
          course.title,
          studentId.toString()
        );
      } catch (notificationError) {
        console.error('Failed to send enrollment notification:', notificationError);
      }
    }

    // Populate enrollment data for response
    const populatedEnrollment = await CourseEnrollment.findById(enrollment._id)
      .populate('course', 'title description instructor category level')
      .populate('course.instructor', 'firstName lastName');

    res.status(201).json({
      success: true,
      data: { enrollment: populatedEnrollment },
      message: paymentAmount === 0 ? 'Successfully enrolled in course' : 'Enrollment created. Please complete payment.'
    });

  } catch (error) {
    next(error);
  }
};

// Complete payment for enrollment
export const completePayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { enrollmentId } = req.params;
    const { transactionId, paymentReference } = req.body;
    const studentId = req.user?._id;

    const enrollment = await CourseEnrollment.findOne({
      _id: enrollmentId,
      student: studentId,
      paymentStatus: 'pending'
    }).populate('course');

    if (!enrollment) {
      res.status(404).json({
        success: false,
        error: 'Enrollment not found or payment already completed'
      });
      return;
    }

    // Update enrollment status
    enrollment.paymentStatus = 'completed';
    enrollment.transactionId = transactionId || enrollment.transactionId;
    if (paymentReference) {
      enrollment.transactionId = paymentReference;
    }

    await enrollment.save();

    // Increment course enrollment count
    await Course.findByIdAndUpdate(enrollment.course._id, {
      $inc: { enrollmentCount: 1 }
    });

    // Notify instructor about new enrollment
    try {
      const course = enrollment.course as any;
      await notificationService.notifyInstructorNewEnrollment(
        course.instructor.toString(),
        course._id.toString(),
        course.title,
        studentId.toString()
      );
    } catch (notificationError) {
      console.error('Failed to send enrollment notification:', notificationError);
    }

    res.status(200).json({
      success: true,
      data: { enrollment },
      message: 'Payment completed successfully. You now have access to the course.'
    });

  } catch (error) {
    next(error);
  }
};

// Get enrollment details for a specific course
export const getEnrollmentDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { courseId } = req.params;
    const studentId = req.user?._id;

    if (!studentId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    const enrollment = await CourseEnrollment.findOne({
      student: studentId,
      course: courseId,
      isActive: true
    }).populate({
      path: 'course',
      select: 'title description instructor category level rating',
      populate: {
        path: 'instructor',
        select: 'firstName lastName'
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

// Get student's enrollments
export const getMyEnrollments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const studentId = req.user?._id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;

    const filter: any = { student: studentId, isActive: true };
    if (status) {
      filter.paymentStatus = status;
    }

    const enrollments = await CourseEnrollment.find(filter)
      .populate({
        path: 'course',
        select: 'title description instructor category level rating enrollmentDeadline courseStartDate',
        populate: {
          path: 'instructor',
          select: 'firstName lastName'
        }
      })
      .sort({ enrolledAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await CourseEnrollment.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        enrollments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

// Check course access
export const checkCourseAccess = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { courseId } = req.params;
    const { accessType } = req.query;
    const studentId = req.user?._id;

    if (!studentId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    const hasAccess = await CourseEnrollment.checkAccess(
      studentId.toString(),
      courseId,
      accessType as 'notes' | 'live_sessions'
    );

    const enrollment = await CourseEnrollment.findOne({
      student: studentId,
      course: courseId,
      isActive: true
    });

    res.status(200).json({
      success: true,
      data: {
        hasAccess,
        enrollment: enrollment ? {
          enrollmentType: enrollment.enrollmentType,
          paymentStatus: enrollment.paymentStatus,
          accessPermissions: enrollment.accessPermissions,
          progress: enrollment.progress
        } : null
      }
    });

  } catch (error) {
    next(error);
  }
};

// Update course progress
export const updateProgress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { courseId } = req.params;
    const { itemId, itemType, progressPercentage } = req.body;
    const studentId = req.user?._id;

    const enrollment = await CourseEnrollment.findOne({
      student: studentId,
      course: courseId,
      isActive: true,
      paymentStatus: { $in: ['completed', 'pending'] } // Allow both completed and pending for development
    });

    if (!enrollment) {
      res.status(404).json({
        success: false,
        error: 'Active enrollment not found'
      });
      return;
    }

    // Update progress
    if (itemId && itemType) {
      await enrollment.updateProgress(itemId, itemType);
    }

    if (progressPercentage !== undefined) {
      enrollment.progress.totalProgress = Math.min(100, Math.max(0, progressPercentage));
      enrollment.progress.lastAccessedAt = new Date();
      await enrollment.save();
    }

    res.status(200).json({
      success: true,
      data: { progress: enrollment.progress },
      message: 'Progress updated successfully'
    });

  } catch (error) {
    next(error);
  }
};

// Get course enrollments (for instructors/admins)
export const getCourseEnrollments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { courseId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    // Check if user has permission to view enrollments
    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({
        success: false,
        error: 'Course not found'
      });
      return;
    }

    // Only course instructor or admin can view enrollments
    if (req.user?.role !== 'admin' && course.instructor.toString() !== req.user?._id?.toString()) {
      res.status(403).json({
        success: false,
        error: 'Not authorized to view course enrollments'
      });
      return;
    }

    const enrollments = await CourseEnrollment.find({
      course: courseId,
      isActive: true,
      paymentStatus: { $in: ['completed', 'pending'] } // Allow both completed and pending for development
    })
      .populate('student', 'firstName lastName email')
      .sort({ enrolledAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await CourseEnrollment.countDocuments({
      course: courseId,
      isActive: true,
      paymentStatus: { $in: ['completed', 'pending'] } // Allow both completed and pending for development
    });

    // Calculate enrollment statistics
    const stats = await CourseEnrollment.aggregate([
      { $match: { course: course._id, isActive: true } },
      {
        $group: {
          _id: '$enrollmentType',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$paymentAmount' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        enrollments,
        stats,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

export default {
  enrollInCourse,
  completePayment,
  getMyEnrollments,
  checkCourseAccess,
  updateProgress,
  getCourseEnrollments
};
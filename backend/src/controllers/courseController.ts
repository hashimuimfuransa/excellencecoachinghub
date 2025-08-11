import { Request, Response, NextFunction } from 'express';
import { Course } from '../models/Course';
import { User } from '../models/User';
import { UserProgress } from '../models/UserProgress';
import { validationResult } from 'express-validator';
import { notificationService } from '../services/notificationService';
import { CourseStatus } from '../../../shared/types';

// Get all courses with filtering and pagination (Teachers see their own, Admins see all)
export const getAllCourses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || '';
    const status = req.query.status as string;
    const category = req.query.category as string;
    const instructor = req.query.instructor as string;
    const sortBy = req.query.sortBy as string || 'createdAt';
    const sortOrder = req.query.sortOrder as string || 'desc';

    // Build filter object
    const filter: any = {};

    // Check if this is a public request (no user authentication)
    const isPublicRequest = !req.user;
    
    if (isPublicRequest) {
      // For public requests, only show approved courses
      filter.status = CourseStatus.APPROVED;
    } else {
      // Role-based filtering: Teachers can only see their own courses
      if (req.user.role === 'teacher') {
        filter.instructor = req.user._id;
      } else if (instructor) {
        // Admins can filter by instructor if specified
        filter.instructor = instructor;
      }
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    if (status && !isPublicRequest) {
      // Only allow status filtering for authenticated users
      filter.status = status;
    }

    if (category) {
      filter.category = category;
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Get courses with pagination and populate instructor info
    const courses = await Course.find(filter)
      .populate('instructor', 'firstName lastName email')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalCourses = await Course.countDocuments(filter);
    const totalPages = Math.ceil(totalCourses / limit);

    res.status(200).json({
      success: true,
      data: {
        courses,
        pagination: {
          currentPage: page,
          totalPages,
          totalCourses,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get course by ID (Teachers can view their own, Admins can view all, Public can view approved)
export const getCourseById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    // Build filter based on user role
    const filter: any = { _id: id };
    const isPublicRequest = !req.user;
    
    if (isPublicRequest) {
      // For public requests, only show approved courses
      filter.status = CourseStatus.APPROVED;
    } else if (req.user.role === 'teacher') {
      filter.instructor = req.user._id;
    }

    const course = await Course.findOne(filter)
      .populate('instructor', 'firstName lastName email');

    if (!course) {
      res.status(404).json({
        success: false,
        error: 'Course not found or access denied'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { course }
    });
  } catch (error) {
    next(error);
  }
};

// Create course (Teachers only)
export const createCourse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

    const {
      title,
      description,
      category,
      level,
      price,
      duration,
      prerequisites,
      learningObjectives,
      tags
    } = req.body;

    // Normalize level to lowercase (frontend might send capitalized)
    const normalizedLevel = level ? level.toLowerCase() : 'beginner';

    // Create new course with teacher as instructor
    const course = new Course({
      title,
      description,
      category,
      level: normalizedLevel,
      price,
      duration,
      prerequisites: prerequisites || [],
      learningOutcomes: learningObjectives || [], // Note: using learningOutcomes as per schema
      tags: tags || [],
      instructor: req.user._id,
      status: CourseStatus.PENDING_APPROVAL, // Use proper enum value
      isPublished: false,
      enrollmentCount: 0,
      rating: 0,
      ratingCount: 0,
      content: []
    });

    await course.save();

    // Populate instructor info for response
    await course.populate('instructor', 'firstName lastName email');

    // Notify admins about pending course approval
    try {
      const instructor = course.instructor as any;
      await notificationService.notifyAdminsCoursesPending(
        course._id.toString(),
        course.title,
        instructor._id.toString(),
        `${instructor.firstName} ${instructor.lastName}`
      );
      console.log(`✅ Notified admins about pending course: ${course.title}`);
    } catch (notificationError) {
      console.error('❌ Failed to send course notification:', notificationError);
      // Don't fail the request if notification fails
    }

    res.status(201).json({
      success: true,
      data: { course },
      message: 'Course created successfully and submitted for approval'
    });
  } catch (error) {
    next(error);
  }
};

// Approve course (Admin only)
export const approveCourse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { feedback } = req.body;

    const course = await Course.findById(id);
    if (!course) {
      res.status(404).json({
        success: false,
        error: 'Course not found'
      });
      return;
    }

    course.status = CourseStatus.APPROVED;
    course.approvedAt = new Date();
    course.approvedBy = req.user?._id as any;
    if (feedback) {
      course.adminFeedback = feedback;
    }

    await course.save();

    // Notify instructor about course approval
    try {
      await notificationService.notifyTeacherCourseStatus(
        course.instructor.toString(),
        course._id.toString(),
        course.title,
        CourseStatus.APPROVED,
        (req.user?._id as any)?.toString() || '',
        feedback
      );
      console.log(`✅ Notified instructor about course approval: ${course.title}`);
    } catch (notificationError) {
      console.error('❌ Failed to send course approval notification:', notificationError);
      // Don't fail the request if notification fails
    }

    res.status(200).json({
      success: true,
      data: { course },
      message: 'Course approved successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Reject course (Admin only)
export const rejectCourse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { feedback } = req.body;

    const course = await Course.findById(id);
    if (!course) {
      res.status(404).json({
        success: false,
        error: 'Course not found'
      });
      return;
    }

    course.status = CourseStatus.REJECTED;
    course.rejectedAt = new Date();
    course.rejectedBy = req.user?._id as any;
    if (feedback) {
      course.adminFeedback = feedback;
    }

    await course.save();

    // Notify instructor about course rejection
    try {
      await notificationService.notifyTeacherCourseStatus(
        course.instructor.toString(),
        course._id.toString(),
        course.title,
        CourseStatus.REJECTED,
        (req.user?._id as any)?.toString() || '',
        feedback
      );
      console.log(`✅ Notified instructor about course rejection: ${course.title}`);
    } catch (notificationError) {
      console.error('❌ Failed to send course rejection notification:', notificationError);
      // Don't fail the request if notification fails
    }

    res.status(200).json({
      success: true,
      data: { course },
      message: 'Course rejected'
    });
  } catch (error) {
    next(error);
  }
};

// Update course (Admin only)
export const updateCourse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

    const { id } = req.params;
    const updateData = req.body;

    const course = await Course.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('instructor', 'firstName lastName email');

    if (!course) {
      res.status(404).json({
        success: false,
        error: 'Course not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { course },
      message: 'Course updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Delete course (Admin only)
export const deleteCourse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id);
    if (!course) {
      res.status(404).json({
        success: false,
        error: 'Course not found'
      });
      return;
    }

    // Soft delete by setting status to 'deleted'
    course.status = 'deleted';
    course.isActive = false;
    await course.save();

    res.status(200).json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get course statistics (Admin only)
export const getCourseStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const totalCourses = await Course.countDocuments({ status: { $ne: CourseStatus.ARCHIVED } });
    const activeCourses = await Course.countDocuments({ status: CourseStatus.APPROVED, isPublished: true });
    const approvedCourses = await Course.countDocuments({ status: CourseStatus.APPROVED });
    const pendingCourses = await Course.countDocuments({ status: CourseStatus.PENDING_APPROVAL });
    const rejectedCourses = await Course.countDocuments({ status: CourseStatus.REJECTED });

    // Get courses by category
    const coursesByCategory = await Course.aggregate([
      { $match: { status: { $ne: CourseStatus.ARCHIVED } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get recent courses
    const recentCourses = await Course.find({ status: { $ne: CourseStatus.ARCHIVED } })
      .populate('instructor', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('title instructor category status createdAt enrollmentCount')
      .lean();

    // Calculate total enrollments
    const totalEnrollments = await Course.aggregate([
      { $match: { status: CourseStatus.APPROVED } },
      { $group: { _id: null, total: { $sum: '$enrollmentCount' } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalCourses,
        activeCourses,
        approvedCourses,
        pendingCourses,
        rejectedCourses,
        coursesByCategory,
        recentCourses,
        totalEnrollments: totalEnrollments[0]?.total || 0
      }
    });
  } catch (error) {
    next(error);
  }
};

// Assign moderator to course (Admin only)
export const assignModerator = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { moderatorId } = req.body;

    const course = await Course.findById(id);
    if (!course) {
      res.status(404).json({
        success: false,
        error: 'Course not found'
      });
      return;
    }

    const moderator = await User.findById(moderatorId);
    if (!moderator) {
      res.status(404).json({
        success: false,
        error: 'Moderator not found'
      });
      return;
    }

    course.moderators = course.moderators || [];
    if (!course.moderators.includes(moderatorId)) {
      course.moderators.push(moderatorId);
    }

    await course.save();

    res.status(200).json({
      success: true,
      data: { course },
      message: 'Moderator assigned successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get enrolled courses for a student
export const getEnrolledCourses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }

    // Only students should have enrolled courses
    if (req.user.role !== 'student') {
      res.status(200).json({
        success: true,
        data: {
          courses: [],
          total: 0,
          page: 1,
          totalPages: 0
        }
      });
      return;
    }

    const studentId = req.user._id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Get enrollments with course details
    const enrollments = await UserProgress.find({ user: studentId })
      .populate({
        path: 'course',
        select: 'title description instructor category level duration price status thumbnail createdAt',
        populate: {
          path: 'instructor',
          select: 'firstName lastName email'
        }
      })
      .sort({ enrollmentDate: -1 })
      .skip(skip)
      .limit(limit);

    // Filter out enrollments where course is null (deleted courses)
    const validEnrollments = enrollments.filter(enrollment => enrollment.course);

    // Extract courses from enrollments
    const courses = validEnrollments.map(enrollment => ({
      ...enrollment.course.toObject(),
      enrollmentDate: enrollment.enrollmentDate,
      progress: enrollment.progressPercentage || 0,
      isCompleted: enrollment.isCompleted,
      lastAccessed: enrollment.lastAccessed,
      enrollmentCount: 0 // This would need to be calculated separately if needed
    }));

    // Get total count
    const totalEnrollments = await UserProgress.countDocuments({
      user: studentId,
      course: { $ne: null }
    });
    const totalPages = Math.ceil(totalEnrollments / limit);

    res.status(200).json({
      success: true,
      data: {
        courses,
        pagination: {
          currentPage: page,
          totalPages,
          totalCourses: totalEnrollments,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching enrolled courses:', error);
    next(error);
  }
};

import { Request, Response, NextFunction } from 'express';
import { Course } from '../models/Course';
import { User } from '../models/User';
import { UserProgress } from '../models/UserProgress';
import { CourseEnrollment } from '../models/CourseEnrollment';
import { validationResult } from 'express-validator';
import { notificationService } from '../services/notificationService';
import { CourseNotificationService } from '../services/courseNotificationService';
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
    const level = req.query.level as string;
    const learningCategories = req.query.learningCategories as string;
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

    if (level) {
      filter.level = level;
    }

    if (learningCategories) {
      // Handle both single category and comma-separated categories
      const categories = learningCategories.split(',').map(cat => cat.trim());
      filter.learningCategories = { $in: categories };
    }

    // Debug logging
    console.log('🔍 Course filters applied:', {
      filter,
      query: req.query,
      isPublicRequest
    });

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

    console.log('📊 Course query results:', {
      coursesFound: courses.length,
      totalCourses,
      filter,
      page,
      limit
    });

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
    }

    const course = await Course.findOne(filter)
      .populate('instructor', 'firstName lastName email');

    if (!course) {
      res.status(404).json({
        success: false,
        error: 'Course not found',
        courseId: id
      });
      return;
    }

    // Check if course has a valid instructor
    if (!course.instructor) {
      console.error(`⚠️ Course ${id} has no instructor assigned`);
      res.status(500).json({
        success: false,
        error: 'Course data is corrupted - no instructor assigned',
        courseId: id
      });
      return;
    }

    // Check access permissions for authenticated users
    if (!isPublicRequest) {
      const userId = req.user._id.toString();
      const isInstructor = course.instructor && course.instructor._id.toString() === userId;
      const isAdmin = req.user.role === 'admin';
      
      // Check if user is enrolled by looking at UserProgress
      const enrollment = await UserProgress.findOne({
        user: userId,
        course: id
      });
      const isEnrolled = !!enrollment;

      // Allow access if user is instructor, enrolled student, or admin
      if (!isInstructor && !isEnrolled && !isAdmin) {
        // For non-enrolled users, only show approved courses
        if (course.status !== CourseStatus.APPROVED) {
          res.status(403).json({
            success: false,
            error: 'Access denied to this course'
          });
          return;
        }
      }
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
      tags,
      // New fields for better discoverability
      careerGoal,
      experienceLevel,
      timeCommitment,
      learningStyle,
      specificInterests,
      learningCategories,
      learningSubcategories
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
      // New fields for better discoverability
      careerGoal: careerGoal || 'exploring',
      experienceLevel: experienceLevel || 'beginner',
      timeCommitment: timeCommitment || 'moderate',
      learningStyle: learningStyle || 'hands_on',
      specificInterests: specificInterests || [],
      learningCategories: learningCategories || [],
      learningSubcategories: learningSubcategories || [],
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
    const { 
      notesPrice, 
      liveSessionPrice, 
      enrollmentDeadline, 
      courseStartDate, 
      maxEnrollments,
      feedback 
    } = req.body;

    const course = await Course.findById(id);
    if (!course) {
      res.status(404).json({
        success: false,
        error: 'Course not found'
      });
      return;
    }

    // Validate dates if provided
    if (enrollmentDeadline && courseStartDate) {
      const enrollmentDate = new Date(enrollmentDeadline);
      const startDate = new Date(courseStartDate);
      const now = new Date();

      if (enrollmentDate <= now) {
        res.status(400).json({
          success: false,
          error: 'Enrollment deadline must be in the future'
        });
        return;
      }

      if (startDate <= enrollmentDate) {
        res.status(400).json({
          success: false,
          error: 'Course start date must be after enrollment deadline'
        });
        return;
      }
      
      course.enrollmentDeadline = enrollmentDate;
      course.courseStartDate = startDate;
    }

    // Update course with approval data
    course.status = CourseStatus.APPROVED;
    course.approvedAt = new Date();
    course.approvedBy = req.user?._id as any;
    
    // Set pricing (default to 0 if not provided)
    course.notesPrice = notesPrice || 0;
    course.liveSessionPrice = liveSessionPrice || 0;
    
    if (maxEnrollments) {
      course.maxEnrollments = maxEnrollments;
    }
    if (feedback) {
      course.adminFeedback = feedback;
    }

    await course.save();

    // Notify instructor about course approval
    try {
      // Send in-app notification
      if (course.instructor) {
        await notificationService.notifyTeacherCourseStatus(
          course.instructor.toString(),
          course._id.toString(),
          course.title,
          CourseStatus.APPROVED,
          (req.user?._id as any)?.toString() || '',
          feedback
        );
        console.log(`✅ Sent in-app notification for course approval: ${course.title}`);

        // Send SendGrid email notification
        const instructor = await User.findById(course.instructor);
        if (instructor) {
          await CourseNotificationService.sendCourseApprovalNotification({
            teacherName: `${instructor.firstName} ${instructor.lastName}`,
            teacherEmail: instructor.email,
            courseTitle: course.title,
            courseId: course._id.toString(),
            adminName: req.user?.firstName ? `${req.user.firstName} ${req.user.lastName}` : 'Admin',
            adminFeedback: feedback
          });
          console.log(`✅ Sent SendGrid email for course approval: ${course.title}`);
        }
      }
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
      // Send in-app notification
      if (course.instructor) {
        await notificationService.notifyTeacherCourseStatus(
          course.instructor.toString(),
          course._id.toString(),
          course.title,
          CourseStatus.REJECTED,
          (req.user?._id as any)?.toString() || '',
          feedback
        );
        console.log(`✅ Sent in-app notification for course rejection: ${course.title}`);

        // Send SendGrid email notification
        const instructor = await User.findById(course.instructor);
        if (instructor) {
          await CourseNotificationService.sendCourseRejectionNotification({
            teacherName: `${instructor.firstName} ${instructor.lastName}`,
            teacherEmail: instructor.email,
            courseTitle: course.title,
            courseId: course._id.toString(),
            adminName: req.user?.firstName ? `${req.user.firstName} ${req.user.lastName}` : 'Admin',
            adminFeedback: feedback
          });
          console.log(`✅ Sent SendGrid email for course rejection: ${course.title}`);
        }
      }
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
    const {
      title,
      description,
      category,
      level,
      duration,
      prerequisites,
      learningObjectives,
      tags,
      // New fields for better discoverability
      careerGoal,
      experienceLevel,
      timeCommitment,
      learningStyle,
      specificInterests,
      learningCategories,
      learningSubcategories
    } = req.body;

    // Build update object with only provided fields
    const updateData: any = {};
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (level !== undefined) {
      // Normalize level to lowercase
      updateData.level = level.toLowerCase();
    }
    if (duration !== undefined) updateData.duration = duration;
    if (prerequisites !== undefined) updateData.prerequisites = prerequisites;
    if (learningObjectives !== undefined) updateData.learningOutcomes = learningObjectives; // Note: using learningOutcomes as per schema
    if (tags !== undefined) updateData.tags = tags;
    
    // New discoverability fields
    if (careerGoal !== undefined) updateData.careerGoal = careerGoal;
    if (experienceLevel !== undefined) updateData.experienceLevel = experienceLevel;
    if (timeCommitment !== undefined) updateData.timeCommitment = timeCommitment;
    if (learningStyle !== undefined) updateData.learningStyle = learningStyle;
    if (specificInterests !== undefined) updateData.specificInterests = specificInterests;
    if (learningCategories !== undefined) updateData.learningCategories = learningCategories;
    if (learningSubcategories !== undefined) updateData.learningSubcategories = learningSubcategories;

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

// Get enrolled courses for learners (students and job seekers)
export const getEnrolledCourses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }

    // Only students and professionals (job seekers) should have enrolled courses
    if (req.user.role !== 'student' && req.user.role !== 'professional') {
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
    const enrollments = await CourseEnrollment.find({ 
      student: studentId, 
      isActive: true,
      paymentStatus: { $in: ['completed', 'pending'] } // Allow both completed and pending for development
    })
      .populate({
        path: 'course',
        select: 'title description instructor category level duration notesPrice liveSessionPrice status thumbnail createdAt',
        populate: {
          path: 'instructor',
          select: 'firstName lastName email'
        }
      })
      .sort({ enrolledAt: -1 })
      .skip(skip)
      .limit(limit);

    // Filter out enrollments where course is null (deleted courses)
    const validEnrollments = enrollments.filter(enrollment => enrollment.course);

    // Extract courses from enrollments
    const courses = validEnrollments.map(enrollment => ({
      ...enrollment.course.toObject(),
      enrollmentDate: enrollment.enrolledAt,
      enrollmentType: enrollment.enrollmentType,
      accessPermissions: enrollment.accessPermissions,
      progress: enrollment.progress?.totalProgress || 0,
      lastAccessed: enrollment.progress?.lastAccessedAt
    }));

    // Get total count
    const totalEnrollments = await CourseEnrollment.countDocuments({
      student: studentId,
      isActive: true,
      paymentStatus: { $in: ['completed', 'pending'] } // Allow both completed and pending for development
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

// Get enrolled students for a specific course (for teachers)
export const getCourseEnrolledStudents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const courseId = req.params.courseId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    // Verify the course exists and get instructor info
    const course = await Course.findById(courseId).populate('instructor', 'firstName lastName email');
    if (!course) {
      res.status(404).json({
        success: false,
        error: 'Course not found'
      });
      return;
    }

    // Check if the requesting user is the instructor or an admin
    const requestingUserId = req.user._id.toString();
    const instructorId = course.instructor ? course.instructor._id.toString() : null;
    const isInstructor = instructorId && requestingUserId === instructorId;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';

    if (!isInstructor && !isAdmin) {
      res.status(403).json({
        success: false,
        error: 'Access denied. Only course instructors and admins can view enrolled students.'
      });
      return;
    }

    // Get enrollments for this course
    const enrollments = await CourseEnrollment.find({
      course: courseId,
      isActive: true,
      paymentStatus: { $in: ['completed', 'pending'] } // Include both completed and pending
    })
      .populate({
        path: 'student',
        select: 'firstName lastName email createdAt'
      })
      .sort({ enrolledAt: -1 })
      .skip(skip)
      .limit(limit);

    // Format the response
    const students = enrollments.map(enrollment => ({
      _id: enrollment.student._id,
      firstName: enrollment.student.firstName,
      lastName: enrollment.student.lastName,
      email: enrollment.student.email,
      enrolledAt: enrollment.enrolledAt,
      enrollmentType: enrollment.enrollmentType,
      paymentStatus: enrollment.paymentStatus,
      progress: {
        totalProgress: enrollment.progress?.totalProgress || 0,
        lastAccessedAt: enrollment.progress?.lastAccessedAt,
        completedLessons: enrollment.progress?.completedLessons?.length || 0,
        completedAssignments: enrollment.progress?.completedAssignments?.length || 0
      },
      accessPermissions: enrollment.accessPermissions
    }));

    // Get total count
    const totalEnrollments = await CourseEnrollment.countDocuments({
      course: courseId,
      isActive: true,
      paymentStatus: { $in: ['completed', 'pending'] }
    });
    const totalPages = Math.ceil(totalEnrollments / limit);

    res.status(200).json({
      success: true,
      data: {
        course: {
          _id: course._id,
          title: course.title,
          instructor: course.instructor
        },
        students,
        pagination: {
          currentPage: page,
          totalPages,
          totalStudents: totalEnrollments,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching enrolled students:', error);
    next(error);
  }
};

// Get teacher dashboard statistics
export const getTeacherDashboardStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const teacherId = req.user._id.toString();

    // Get teacher's courses first
    const courses = await Course.find({ instructor: teacherId }).select('_id title status enrollmentCount createdAt');
    const courseIds = courses.map(course => course._id);
    const approvedCourses = courses.filter(course => course.status === CourseStatus.APPROVED);
    const pendingCourses = courses.filter(course => course.status === CourseStatus.PENDING_APPROVAL);
    const rejectedCourses = courses.filter(course => course.status === CourseStatus.REJECTED);

    // Execute all enrollment queries in parallel for better performance
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const [
      totalEnrollments,
      uniqueStudents,
      enrollmentsWithProgress,
      recentEnrollments,
      totalEarnings,
      recentActivity
    ] = await Promise.all([
      // Get total enrollments
      CourseEnrollment.countDocuments({
        course: { $in: courseIds },
        isActive: true,
        paymentStatus: { $in: ['completed', 'pending'] }
      }),
      
      // Get unique students
      CourseEnrollment.distinct('student', {
        course: { $in: courseIds },
        isActive: true,
        paymentStatus: { $in: ['completed', 'pending'] }
      }),
      
      // Get enrollments with progress (limit for performance)
      CourseEnrollment.find({
        course: { $in: courseIds },
        isActive: true,
        paymentStatus: { $in: ['completed', 'pending'] }
      }).select('progress').limit(100),
      
      // Get recent enrollments
      CourseEnrollment.countDocuments({
        course: { $in: courseIds },
        isActive: true,
        enrolledAt: { $gte: thirtyDaysAgo }
      }),
      
      // Calculate total earnings
      CourseEnrollment.aggregate([
        {
          $match: {
            course: { $in: courseIds },
            isActive: true,
            paymentStatus: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$paymentAmount' }
          }
        }
      ]),
      
      // Get recent activity
      CourseEnrollment.find({
        course: { $in: courseIds },
        isActive: true,
        enrolledAt: { $gte: thirtyDaysAgo }
      })
        .populate('student', 'firstName lastName email')
        .populate('course', 'title')
        .sort({ enrolledAt: -1 })
        .limit(5)
    ]);

    // Process the data
    const liveSessionsCount = approvedCourses.length;
    const totalProgress = enrollmentsWithProgress.reduce((sum, enrollment) => {
      return sum + (enrollment.progress?.totalProgress || 0);
    }, 0);
    const averageCompletionRate = enrollmentsWithProgress.length > 0 
      ? Math.round(totalProgress / enrollmentsWithProgress.length) 
      : 0;
    const completedCourses = enrollmentsWithProgress.filter(
      enrollment => enrollment.progress?.totalProgress >= 100
    ).length;
    const earnings = totalEarnings.length > 0 ? totalEarnings[0].total : 0;

    const formattedRecentActivity = recentActivity
      .filter(enrollment => enrollment.student && enrollment.course)
      .map(enrollment => ({
        type: 'enrollment',
        message: `${enrollment.student.firstName} ${enrollment.student.lastName} enrolled in ${enrollment.course.title}`,
        timestamp: enrollment.enrolledAt,
        student: enrollment.student,
        course: enrollment.course
      }));

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalCourses: courses.length,
          activeCourses: approvedCourses.length,
          pendingCourses: pendingCourses.length,
          rejectedCourses: rejectedCourses.length,
          totalStudents: uniqueStudents.length,
          totalEnrollments: totalEnrollments,
          liveSessionsCount: liveSessionsCount,
          averageCompletionRate: averageCompletionRate,
          completedCourses: completedCourses,
          recentEnrollments: recentEnrollments,
          totalEarnings: earnings
        },
        recentActivity: formattedRecentActivity,
        courses: approvedCourses.map(course => ({
          _id: course._id,
          title: course.title,
          status: course.status,
          enrollmentCount: course.enrollmentCount || 0,
          createdAt: course.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching teacher dashboard stats:', error);
    next(error);
  }
};
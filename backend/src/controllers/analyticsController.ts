import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { Course } from '../models/Course';
import { Quiz } from '../models/Quiz';
import { TeacherProfile } from '../models/TeacherProfile';
import { UserRole, CourseStatus } from '../../../shared/types';

// Get dashboard analytics (Admin only)
export const getDashboardAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // User statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const newUsersToday = await User.countDocuments({
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    });
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const activeInLastWeek = await User.countDocuments({
      lastLogin: { $gte: sevenDaysAgo }
    });

    // Role distribution
    const adminCount = await User.countDocuments({ role: UserRole.ADMIN });
    const teacherCount = await User.countDocuments({ role: UserRole.TEACHER });
    const studentCount = await User.countDocuments({ role: UserRole.STUDENT });

    // Course statistics (if Course model exists)
    let courseStats = {
      totalCourses: 0,
      activeCourses: 0,
      pendingCourses: 0
    };

    try {
      courseStats.totalCourses = await Course.countDocuments();
      courseStats.activeCourses = await Course.countDocuments({ isPublished: true });
      courseStats.pendingCourses = await Course.countDocuments({ status: CourseStatus.PENDING_APPROVAL });
    } catch (error) {
      // Course model might not exist yet, use default values
      console.log('Course model not available, using default values');
    }

    // Teacher profile statistics
    let teacherProfileStats = {
      pendingTeacherProfiles: 0
    };

    try {
      teacherProfileStats.pendingTeacherProfiles = await TeacherProfile.countDocuments({ profileStatus: 'pending' });
    } catch (error) {
      console.log('TeacherProfile model not available, using default values');
    }

    // Total pending approvals (courses + teacher profiles)
    const totalPendingApprovals = courseStats.pendingCourses + teacherProfileStats.pendingTeacherProfiles;

    // Quiz statistics (if Quiz model exists)
    let quizStats = {
      totalQuizzes: 0,
      activeQuizzes: 0
    };

    try {
      quizStats.totalQuizzes = await Quiz.countDocuments();
      quizStats.activeQuizzes = await Quiz.countDocuments({ isActive: true });
    } catch (error) {
      // Quiz model might not exist yet, use default values
      console.log('Quiz model not available, using default values');
    }

    // System health (simplified)
    const systemHealth = 98; // This would be calculated based on various metrics

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          activeUsers,
          newUsersToday,
          activeInLastWeek,
          totalCourses: courseStats.totalCourses,
          activeCourses: courseStats.activeCourses,
          pendingApprovals: totalPendingApprovals,
          totalQuizzes: quizStats.totalQuizzes,
          activeQuizzes: quizStats.activeQuizzes,
          systemHealth
        },
        roleDistribution: {
          admin: adminCount,
          teacher: teacherCount,
          student: studentCount
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get recent users (Admin only)
export const getRecentUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    
    const recentUsers = await User.find()
      .select('firstName lastName email role createdAt isActive isEmailVerified')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.status(200).json({
      success: true,
      data: { recentUsers }
    });
  } catch (error) {
    next(error);
  }
};

// Get user analytics (Admin only)
export const getUserAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // User growth over time (last 12 months)
    const userGrowth = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const count = await User.countDocuments({
        createdAt: { $gte: startOfMonth, $lte: endOfMonth }
      });
      
      userGrowth.push({
        month: startOfMonth.toISOString().substring(0, 7), // YYYY-MM format
        count
      });
    }

    // User activity (last 30 days)
    const userActivity = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));
      
      const activeCount = await User.countDocuments({
        lastLogin: { $gte: startOfDay, $lte: endOfDay }
      });
      
      userActivity.push({
        date: startOfDay.toISOString().substring(0, 10), // YYYY-MM-DD format
        activeUsers: activeCount
      });
    }

    // Email verification status
    const verifiedUsers = await User.countDocuments({ isEmailVerified: true });
    const unverifiedUsers = await User.countDocuments({ isEmailVerified: false });

    res.status(200).json({
      success: true,
      data: {
        userGrowth,
        userActivity,
        emailVerification: {
          verified: verifiedUsers,
          unverified: unverifiedUsers
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get course analytics (Admin only)
export const getCourseAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Default values if Course model doesn't exist
    let courseAnalytics = {
      totalCourses: 0,
      activeCourses: 0,
      pendingCourses: 0,
      approvedCourses: 0,
      rejectedCourses: 0,
      coursesByCategory: [],
      recentCourses: []
    };

    try {
      // Course statistics
      courseAnalytics.totalCourses = await Course.countDocuments();
      courseAnalytics.activeCourses = await Course.countDocuments({ isActive: true });
      courseAnalytics.pendingCourses = await Course.countDocuments({ status: 'pending' });
      courseAnalytics.approvedCourses = await Course.countDocuments({ status: 'approved' });
      courseAnalytics.rejectedCourses = await Course.countDocuments({ status: 'rejected' });

      // Courses by category
      const categoryAggregation = await Course.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
      courseAnalytics.coursesByCategory = categoryAggregation;

      // Recent courses
      const recentCourses = await Course.find()
        .select('title instructor category status createdAt')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();
      courseAnalytics.recentCourses = recentCourses;
    } catch (error) {
      console.log('Course model not available, using default values');
    }

    res.status(200).json({
      success: true,
      data: courseAnalytics
    });
  } catch (error) {
    next(error);
  }
};

// Get performance analytics (Admin only)
export const getPerformanceAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // System performance metrics
    const performanceData = {
      systemHealth: 98,
      serverUptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      responseTime: {
        average: 150, // ms
        p95: 300,
        p99: 500
      },
      errorRate: 0.02, // 2%
      activeConnections: 45,
      databaseConnections: 10
    };

    res.status(200).json({
      success: true,
      data: performanceData
    });
  } catch (error) {
    next(error);
  }
};

// Get system alerts (Admin only)
export const getSystemAlerts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Mock system alerts - in a real system, these would come from monitoring services
    const alerts = [
      {
        id: '1',
        type: 'info',
        message: 'Database backup completed successfully',
        timestamp: new Date().toISOString(),
        severity: 'low'
      },
      {
        id: '2',
        type: 'warning',
        message: 'High memory usage detected (85%)',
        timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        severity: 'medium'
      }
    ];

    res.status(200).json({
      success: true,
      data: { alerts }
    });
  } catch (error) {
    next(error);
  }
};

// Get pending approvals (Admin only)
export const getPendingApprovals = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const approvals = [];

    // Get pending teacher profiles
    try {
      const pendingTeachers = await TeacherProfile.find({ profileStatus: 'pending' })
        .populate('user', 'firstName lastName email')
        .select('user expertise specialization createdAt')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      for (const teacher of pendingTeachers) {
        if (teacher.user) {
          approvals.push({
            id: teacher._id.toString(),
            type: 'teacher',
            name: `${teacher.user.firstName} ${teacher.user.lastName}`,
            subject: teacher.specialization || teacher.expertise?.[0] || 'Subject not specified',
            submittedDate: teacher.createdAt.toISOString(),
            status: 'pending'
          });
        }
      }
    } catch (error) {
      console.log('TeacherProfile model not available or error fetching pending teachers:', error);
    }

    // Get pending courses
    try {
      const pendingCourses = await Course.find({ status: CourseStatus.PENDING_APPROVAL })
        .populate('instructor', 'firstName lastName')
        .select('title instructor createdAt')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      for (const course of pendingCourses) {
        if (course.instructor) {
          approvals.push({
            id: course._id.toString(),
            type: 'course',
            name: course.title,
            instructor: `${course.instructor.firstName} ${course.instructor.lastName}`,
            submittedDate: course.createdAt.toISOString(),
            status: 'pending'
          });
        }
      }
    } catch (error) {
      console.log('Course model not available or error fetching pending courses:', error);
    }

    // Sort by submission date (most recent first)
    approvals.sort((a, b) => new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime());

    res.status(200).json({
      success: true,
      data: { approvals }
    });
  } catch (error) {
    next(error);
  }
};

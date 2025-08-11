import { Request, Response } from 'express';
import { 
  User, 
  Course, 
  UserProgress, 
  QuizAttempt, 
  Badge, 
  UserBadge,
  UserRole 
} from '../models';
import { asyncHandler } from '../middleware/asyncHandler';

// @desc    Get user settings
// @route   GET /api/settings/user
// @access  Private
export const getUserSettings = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user;

  if (!user) {
    res.status(401).json({
      success: false,
      error: 'User not authenticated'
    });
    return;
  }

  const settings = {
    profile: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      avatar: user.avatar,
      role: user.role
    },
    preferences: {
      emailNotifications: user.emailNotifications || true,
      pushNotifications: user.pushNotifications || true,
      theme: user.theme || 'light',
      language: user.language || 'en'
    }
  };

  res.status(200).json({
    success: true,
    data: settings
  });
});

// @desc    Update user settings
// @route   PUT /api/settings/user
// @access  Private
export const updateUserSettings = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user;

  if (!user) {
    res.status(401).json({
      success: false,
      error: 'User not authenticated'
    });
    return;
  }

  const { profile, preferences } = req.body;

  // Update profile fields if provided
  if (profile) {
    if (profile.firstName) user.firstName = profile.firstName;
    if (profile.lastName) user.lastName = profile.lastName;
    if (profile.avatar !== undefined) user.avatar = profile.avatar;
  }

  // Update preferences if provided
  if (preferences) {
    if (preferences.emailNotifications !== undefined) {
      user.emailNotifications = preferences.emailNotifications;
    }
    if (preferences.pushNotifications !== undefined) {
      user.pushNotifications = preferences.pushNotifications;
    }
    if (preferences.theme) user.theme = preferences.theme;
    if (preferences.language) user.language = preferences.language;
  }

  await user.save();

  const updatedSettings = {
    profile: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      avatar: user.avatar,
      role: user.role
    },
    preferences: {
      emailNotifications: user.emailNotifications || true,
      pushNotifications: user.pushNotifications || true,
      theme: user.theme || 'light',
      language: user.language || 'en'
    }
  };

  res.status(200).json({
    success: true,
    data: updatedSettings
  });
});

// @desc    Get teacher's students data
// @route   GET /api/settings/teacher/students
// @access  Private (Teacher only)
export const getTeacherStudents = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user;

  if (!user || user.role !== UserRole.TEACHER) {
    res.status(403).json({
      success: false,
      error: 'Access denied. Teacher role required.'
    });
    return;
  }

  try {
    // Get all courses created by this teacher
    const teacherCourses = await Course.find({ instructor: user._id }).select('_id title');

    if (teacherCourses.length === 0) {
      res.status(200).json({
        success: true,
        data: {
          students: [],
          totalStudents: 0,
          courses: [],
          summary: {
            totalStudents: 0,
            averageProgress: 0,
            averageScore: 0,
            totalTimeSpent: 0
          }
        }
      });
      return;
    }

    const courseIds = teacherCourses.map(course => course._id);

    // Get all enrollments for teacher's courses
    const enrollments = await UserProgress.find({
      course: { $in: courseIds }
    }).populate('user', 'firstName lastName email avatar createdAt lastLogin');

    // Get unique students
    const uniqueStudentIds = [...new Set(enrollments.map(e => e.user._id.toString()))];
    
    // Get all quiz attempts for these students in teacher's courses
    const quizAttempts = await QuizAttempt.find({
      student: { $in: uniqueStudentIds }
    }).populate('quiz', 'title course');

    // Filter quiz attempts to only include those from teacher's courses
    const relevantQuizAttempts = quizAttempts.filter(attempt => 
      courseIds.some(courseId => courseId.toString() === attempt.quiz.course.toString())
    );

    // Get badges for students
    const userBadges = await UserBadge.find({
      user: { $in: uniqueStudentIds }
    }).populate('badge', 'name icon points type');

    // Process student data
    const studentsData = [];
    let totalTimeSpent = 0;
    let totalProgress = 0;
    let totalScore = 0;
    let totalScoreCount = 0;

    for (const studentId of uniqueStudentIds) {
      const studentEnrollments = enrollments.filter(e => e.user._id.toString() === studentId);
      const studentQuizAttempts = relevantQuizAttempts.filter(a => a.student.toString() === studentId);
      const studentBadges = userBadges.filter(ub => ub.user.toString() === studentId);

      if (studentEnrollments.length === 0) continue;

      const student = studentEnrollments[0].user;

      // Calculate course progress
      const courses = studentEnrollments.map(enrollment => ({
        course: {
          _id: enrollment.course._id,
          title: teacherCourses.find(c => c._id.toString() === enrollment.course.toString())?.title || 'Unknown Course'
        },
        progressPercentage: enrollment.progressPercentage || 0,
        totalPoints: enrollment.totalPoints || 0,
        timeSpent: enrollment.totalTimeSpent || 0,
        isCompleted: enrollment.isCompleted || false,
        completionDate: enrollment.completionDate,
        lastAccessed: enrollment.lastAccessed || enrollment.createdAt,
        streakDays: enrollment.streakDays || 0
      }));

      // Calculate exam attempts
      const examAttempts = studentQuizAttempts.map(attempt => ({
        quiz: {
          _id: attempt.quiz._id,
          title: attempt.quiz.title
        },
        score: attempt.score,
        percentage: attempt.percentage,
        status: attempt.status,
        submittedAt: attempt.submittedAt,
        timeSpent: attempt.timeSpent || 0,
        gradeLetter: attempt.gradeLetter || 'N/A'
      }));

      // Calculate averages
      const averageProgress = courses.length > 0 
        ? courses.reduce((sum, c) => sum + c.progressPercentage, 0) / courses.length 
        : 0;

      const averageScore = examAttempts.length > 0 
        ? examAttempts.reduce((sum, e) => sum + e.percentage, 0) / examAttempts.length 
        : 0;

      const totalCourses = courses.length;
      const completedCourses = courses.filter(c => c.isCompleted).length;
      const totalExams = examAttempts.length;
      const passedExams = examAttempts.filter(e => e.percentage >= 60).length;
      const totalPoints = courses.reduce((sum, c) => sum + c.totalPoints, 0);
      const studentTimeSpent = courses.reduce((sum, c) => sum + c.timeSpent, 0);

      studentsData.push({
        student: {
          _id: student._id,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          avatar: student.avatar,
          createdAt: student.createdAt,
          lastLogin: student.lastLogin
        },
        courses,
        examAttempts,
        averageProgress,
        averageScore,
        totalCourses,
        completedCourses,
        totalExams,
        passedExams,
        totalPoints,
        totalTimeSpent: studentTimeSpent,
        uniqueBadges: studentBadges.length
      });

      // Add to totals for summary
      totalTimeSpent += studentTimeSpent;
      totalProgress += averageProgress;
      if (averageScore > 0) {
        totalScore += averageScore;
        totalScoreCount++;
      }
    }

    // Calculate course enrollment counts
    const coursesWithEnrollment = teacherCourses.map(course => ({
      _id: course._id,
      title: course.title,
      enrollmentCount: enrollments.filter(e => e.course.toString() === course._id.toString()).length
    }));

    const summary = {
      totalStudents: studentsData.length,
      averageProgress: studentsData.length > 0 ? totalProgress / studentsData.length : 0,
      averageScore: totalScoreCount > 0 ? totalScore / totalScoreCount : 0,
      totalTimeSpent
    };

    res.status(200).json({
      success: true,
      data: {
        students: studentsData,
        totalStudents: studentsData.length,
        courses: coursesWithEnrollment,
        summary
      }
    });

  } catch (error) {
    console.error('Error fetching teacher students:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch students data'
    });
  }
});

// @desc    Get student performance data
// @route   GET /api/settings/student/performance
// @access  Private (Student only)
export const getStudentPerformance = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user;

  if (!user || user.role !== UserRole.STUDENT) {
    res.status(403).json({
      success: false,
      error: 'Access denied. Student role required.'
    });
    return;
  }

  try {
    // Get student enrollments
    const enrollments = await UserProgress.find({ user: user._id })
      .populate('course', 'title thumbnail');

    // Get quiz attempts
    const quizAttempts = await QuizAttempt.find({ student: user._id })
      .populate('quiz', 'title')
      .sort({ submittedAt: -1 });

    // Get user badges
    const userBadges = await UserBadge.find({ user: user._id })
      .populate('badge', 'name icon points type');

    // Calculate overview statistics
    const totalCourses = enrollments.length;
    const completedCourses = enrollments.filter(e => e.isCompleted).length;
    const totalPoints = enrollments.reduce((sum, e) => sum + (e.totalPoints || 0), 0);
    const totalTimeSpent = enrollments.reduce((sum, e) => sum + (e.totalTimeSpent || 0), 0);
    const averageProgress = totalCourses > 0 
      ? enrollments.reduce((sum, e) => sum + (e.progressPercentage || 0), 0) / totalCourses 
      : 0;

    const totalExams = quizAttempts.length;
    const passedExams = quizAttempts.filter(a => a.percentage >= 60).length;
    const averageScore = totalExams > 0 
      ? quizAttempts.reduce((sum, a) => sum + a.percentage, 0) / totalExams 
      : 0;

    // Process courses data
    const courses = enrollments.map(enrollment => ({
      course: {
        _id: enrollment.course._id,
        title: enrollment.course.title,
        thumbnail: enrollment.course.thumbnail
      },
      progressPercentage: enrollment.progressPercentage || 0,
      totalPoints: enrollment.totalPoints || 0,
      timeSpent: enrollment.totalTimeSpent || 0,
      isCompleted: enrollment.isCompleted || false,
      completionDate: enrollment.completionDate,
      lastAccessed: enrollment.lastAccessed || enrollment.createdAt,
      streakDays: enrollment.streakDays || 0
    }));

    // Process exam history
    const examHistory = quizAttempts.map(attempt => ({
      quiz: {
        _id: attempt.quiz._id,
        title: attempt.quiz.title
      },
      score: attempt.score,
      percentage: attempt.percentage,
      status: attempt.status,
      submittedAt: attempt.submittedAt,
      timeSpent: attempt.timeSpent || 0,
      gradeLetter: attempt.gradeLetter || 'N/A',
      attemptNumber: attempt.attemptNumber || 1
    }));

    // Process badges
    const badges = userBadges.map(ub => ({
      _id: ub.badge._id,
      name: ub.badge.name,
      icon: ub.badge.icon,
      points: ub.badge.points,
      type: ub.badge.type
    }));

    // Generate recent activity
    const recentActivity = [];
    
    // Add recent course progress
    const recentCourseActivity = courses
      .filter(c => c.lastAccessed)
      .sort((a, b) => new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime())
      .slice(0, 3)
      .map(c => ({
        type: 'course_progress',
        title: `Studied ${c.course.title}`,
        progress: c.progressPercentage,
        date: c.lastAccessed
      }));

    // Add recent exam attempts
    const recentExamActivity = examHistory
      .slice(0, 2)
      .map(e => ({
        type: 'exam_attempt',
        title: `Completed ${e.quiz.title}`,
        score: e.percentage,
        date: e.submittedAt
      }));

    recentActivity.push(...recentCourseActivity, ...recentExamActivity);
    recentActivity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const performanceData = {
      overview: {
        totalCourses,
        completedCourses,
        totalPoints,
        totalTimeSpent,
        averageProgress,
        totalExams,
        passedExams,
        averageScore,
        totalBadges: badges.length
      },
      courses,
      examHistory,
      badges,
      recentActivity: recentActivity.slice(0, 10)
    };

    res.status(200).json({
      success: true,
      data: performanceData
    });

  } catch (error) {
    console.error('Error fetching student performance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch performance data'
    });
  }
});

// @desc    Get detailed student performance (for teachers)
// @route   GET /api/settings/teacher/students/:studentId
// @access  Private (Teacher only)
export const getStudentDetailedPerformance = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user;
  const { studentId } = req.params;

  if (!user || user.role !== UserRole.TEACHER) {
    res.status(403).json({
      success: false,
      error: 'Access denied. Teacher role required.'
    });
    return;
  }

  try {
    // Verify student exists
    const student = await User.findById(studentId);
    if (!student || student.role !== UserRole.STUDENT) {
      res.status(404).json({
        success: false,
        error: 'Student not found'
      });
      return;
    }

    // Get teacher's courses
    const teacherCourses = await Course.find({ instructor: user._id }).select('_id title');
    const courseIds = teacherCourses.map(course => course._id);

    // Get student enrollments in teacher's courses
    const enrollments = await UserProgress.find({
      user: studentId,
      course: { $in: courseIds }
    }).populate('course', 'title');

    // Get quiz attempts for teacher's courses
    const quizAttempts = await QuizAttempt.find({
      student: studentId
    }).populate('quiz', 'title course');

    // Filter quiz attempts to only include those from teacher's courses
    const relevantQuizAttempts = quizAttempts.filter(attempt => 
      courseIds.some(courseId => courseId.toString() === attempt.quiz.course.toString())
    );

    // Process the data similar to getTeacherStudents but for a single student
    const courses = enrollments.map(enrollment => ({
      course: {
        _id: enrollment.course._id,
        title: enrollment.course.title
      },
      progressPercentage: enrollment.progressPercentage || 0,
      totalPoints: enrollment.totalPoints || 0,
      timeSpent: enrollment.totalTimeSpent || 0,
      isCompleted: enrollment.isCompleted || false,
      completionDate: enrollment.completionDate,
      lastAccessed: enrollment.lastAccessed || enrollment.createdAt,
      streakDays: enrollment.streakDays || 0
    }));

    const examAttempts = relevantQuizAttempts.map(attempt => ({
      quiz: {
        _id: attempt.quiz._id,
        title: attempt.quiz.title
      },
      score: attempt.score,
      percentage: attempt.percentage,
      status: attempt.status,
      submittedAt: attempt.submittedAt,
      timeSpent: attempt.timeSpent || 0,
      gradeLetter: attempt.gradeLetter || 'N/A'
    }));

    // Calculate statistics
    const averageProgress = courses.length > 0 
      ? courses.reduce((sum, c) => sum + c.progressPercentage, 0) / courses.length 
      : 0;

    const averageScore = examAttempts.length > 0 
      ? examAttempts.reduce((sum, e) => sum + e.percentage, 0) / examAttempts.length 
      : 0;

    const studentData = {
      student: {
        _id: student._id,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        avatar: student.avatar,
        createdAt: student.createdAt,
        lastLogin: student.lastLogin
      },
      courses,
      examAttempts,
      averageProgress,
      averageScore,
      totalCourses: courses.length,
      completedCourses: courses.filter(c => c.isCompleted).length,
      totalExams: examAttempts.length,
      passedExams: examAttempts.filter(e => e.percentage >= 60).length,
      totalPoints: courses.reduce((sum, c) => sum + c.totalPoints, 0),
      totalTimeSpent: courses.reduce((sum, c) => sum + c.timeSpent, 0),
      uniqueBadges: 0 // Could be enhanced to get actual badges
    };

    res.status(200).json({
      success: true,
      data: studentData
    });

  } catch (error) {
    console.error('Error fetching detailed student performance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch student details'
    });
  }
});
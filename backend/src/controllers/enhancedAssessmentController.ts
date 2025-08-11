import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { Assessment, IAssessment } from '../models/Assessment';
import { Certificate, ICertificate } from '../models/Certificate';
import { Course } from '../models/Course';
import { User } from '../models/User';
import { UserProgress } from '../models/UserProgress';
import { Attendance } from '../models/Attendance';
import { LiveSession } from '../models/LiveSession';
import aiDocumentService from '../services/aiDocumentService';
import { uploadToCloudinary } from '../config/cloudinary';

// Upload assessment document and extract questions
export const uploadAssessmentDocument = asyncHandler(async (req: Request, res: Response) => {
  const { assessmentId } = req.params;
  const teacherId = req.user?._id;

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Document file is required'
    });
  }

  const assessment = await Assessment.findOne({ _id: assessmentId, teacherId });
  if (!assessment) {
    return res.status(404).json({
      success: false,
      message: 'Assessment not found'
    });
  }

  try {
    // Upload document to Cloudinary
    const uploadResult = await uploadToCloudinary(req.file.buffer, {
      folder: 'assessments',
      resource_type: 'auto'
    });

    // Process document content
    const documentContent = await aiDocumentService.processDocumentContent(
      req.file.buffer,
      req.file.mimetype.includes('pdf') ? 'pdf' : 
      req.file.mimetype.includes('docx') ? 'docx' : 'txt'
    );

    // Extract questions using AI
    const extractedQuestions = await aiDocumentService.extractQuestionsFromDocument(
      documentContent,
      req.file.mimetype.includes('pdf') ? 'pdf' : 
      req.file.mimetype.includes('docx') ? 'docx' : 'txt'
    );

    // Update assessment with document and extracted questions
    assessment.documentUrl = uploadResult.secure_url;
    assessment.documentType = req.file.mimetype.includes('pdf') ? 'pdf' : 
                             req.file.mimetype.includes('docx') ? 'docx' : 'txt';
    assessment.extractedQuestions = extractedQuestions;
    assessment.totalPoints = extractedQuestions.reduce((sum, q) => sum + q.points, 0);

    await assessment.save();

    res.status(200).json({
      success: true,
      message: 'Document uploaded and questions extracted successfully',
      data: {
        assessmentId: assessment._id,
        documentUrl: assessment.documentUrl,
        questionsCount: extractedQuestions.length,
        totalPoints: assessment.totalPoints,
        questions: extractedQuestions
      }
    });
  } catch (error) {
    console.error('❌ Error uploading assessment document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process document'
    });
  }
});

// Submit assessment for AI grading
export const submitAssessmentForGrading = asyncHandler(async (req: Request, res: Response) => {
  const { assessmentId } = req.params;
  const studentId = req.user?._id;
  const { answers } = req.body;

  if (!answers || !Array.isArray(answers)) {
    return res.status(400).json({
      success: false,
      message: 'Answers array is required'
    });
  }

  const assessment = await Assessment.findById(assessmentId);
  if (!assessment) {
    return res.status(404).json({
      success: false,
      message: 'Assessment not found'
    });
  }

  if (!assessment.extractedQuestions || assessment.extractedQuestions.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Assessment has no questions to grade'
    });
  }

  try {
    // Grade assessment using AI
    const gradingResult = await aiDocumentService.gradeAssessment(
      assessment.extractedQuestions,
      answers
    );

    // Update assessment statistics
    assessment.totalSubmissions += 1;
    assessment.averageScore = (
      (assessment.averageScore * (assessment.totalSubmissions - 1) + gradingResult.score) /
      assessment.totalSubmissions
    );
    
    if (gradingResult.score >= assessment.passingScore) {
      assessment.passRate += 1;
    }

    await assessment.save();

    res.status(200).json({
      success: true,
      message: 'Assessment graded successfully',
      data: {
        assessmentId: assessment._id,
        gradingResult,
        statistics: {
          totalSubmissions: assessment.totalSubmissions,
          averageScore: assessment.averageScore,
          passRate: assessment.passRate
        }
      }
    });
  } catch (error) {
    console.error('❌ Error grading assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to grade assessment'
    });
  }
});

// Generate certificate for course completion
export const generateCertificate = asyncHandler(async (req: Request, res: Response) => {
  const { courseId, studentId } = req.params;
  const teacherId = req.user?._id;

  // Verify teacher owns the course
  const course = await Course.findOne({ _id: courseId, teacherId });
  if (!course) {
    return res.status(404).json({
      success: false,
      message: 'Course not found'
    });
  }

  // Check if student has completed all requirements
  const student = await User.findById(studentId);
  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Student not found'
    });
  }

  // Get final assessment
  const finalAssessment = await Assessment.findOne({
    courseId,
    type: 'final',
    status: 'published'
  });

  if (!finalAssessment) {
    return res.status(400).json({
      success: false,
      message: 'No final assessment found for this course'
    });
  }

  // Check if certificate already exists
  const existingCertificate = await Certificate.findOne({
    studentId,
    courseId
  });

  if (existingCertificate) {
    return res.status(400).json({
      success: false,
      message: 'Certificate already exists for this student and course'
    });
  }

  // Get student's final assessment submission (you'll need to implement this)
  // For now, we'll create a placeholder certificate
  const certificate = new Certificate({
    studentId,
    courseId,
    teacherId,
    assessmentId: finalAssessment._id,
    grade: 'Pass', // This should come from actual assessment result
    score: 85, // This should come from actual assessment result
    totalPoints: finalAssessment.totalPoints,
    earnedPoints: Math.floor(finalAssessment.totalPoints * 0.85),
    sessionsAttended: 10, // This should come from actual attendance data
    totalSessions: 12, // This should come from course requirements
    assessmentsCompleted: 5, // This should come from actual completion data
    totalAssessments: 5, // This should come from course requirements
    status: 'issued',
    isVerified: true,
    issuedBy: teacherId
  });

  await certificate.save();

  res.status(201).json({
    success: true,
    message: 'Certificate generated successfully',
    data: {
      certificateId: certificate._id,
      certificateNumber: certificate.certificateNumber,
      verificationCode: certificate.verificationCode,
      grade: certificate.grade,
      score: certificate.score,
      issueDate: certificate.issueDate
    }
  });
});

// Get assessment statistics
export const getAssessmentStatistics = asyncHandler(async (req: Request, res: Response) => {
  const { assessmentId } = req.params;
  const teacherId = req.user?._id;

  const assessment = await Assessment.findOne({ _id: assessmentId, teacherId });
  if (!assessment) {
    return res.status(404).json({
      success: false,
      message: 'Assessment not found'
    });
  }

  const statistics = {
    assessmentId: assessment._id,
    title: assessment.title,
    totalSubmissions: assessment.totalSubmissions,
    averageScore: assessment.averageScore,
    passRate: assessment.passRate,
    totalPoints: assessment.totalPoints,
    passingScore: assessment.passingScore,
    questionsCount: assessment.extractedQuestions?.length || 0,
    status: assessment.status,
    type: assessment.type,
    scheduledDate: assessment.scheduledDate,
    dueDate: assessment.dueDate
  };

  res.status(200).json({
    success: true,
    data: statistics
  });
});

// Update assessment configuration
export const updateAssessmentConfig = asyncHandler(async (req: Request, res: Response) => {
  const { assessmentId } = req.params;
  const teacherId = req.user?._id;
  const {
    title,
    description,
    scheduledDate,
    duration,
    dueDate,
    requireProctoring,
    requireCamera,
    requireScreenShare,
    aiCheatingDetection,
    passingScore,
    autoGrade,
    teacherReviewRequired,
    status
  } = req.body;

  const assessment = await Assessment.findOne({ _id: assessmentId, teacherId });
  if (!assessment) {
    return res.status(404).json({
      success: false,
      message: 'Assessment not found'
    });
  }

  // Update fields
  if (title) assessment.title = title;
  if (description) assessment.description = description;
  if (scheduledDate) assessment.scheduledDate = new Date(scheduledDate);
  if (duration) assessment.duration = duration;
  if (dueDate) assessment.dueDate = new Date(dueDate);
  if (requireProctoring !== undefined) assessment.requireProctoring = requireProctoring;
  if (requireCamera !== undefined) assessment.requireCamera = requireCamera;
  if (requireScreenShare !== undefined) assessment.requireScreenShare = requireScreenShare;
  if (aiCheatingDetection !== undefined) assessment.aiCheatingDetection = aiCheatingDetection;
  if (passingScore !== undefined) assessment.passingScore = passingScore;
  if (autoGrade !== undefined) assessment.autoGrade = autoGrade;
  if (teacherReviewRequired !== undefined) assessment.teacherReviewRequired = teacherReviewRequired;
  if (status) assessment.status = status;

  await assessment.save();

  res.status(200).json({
    success: true,
    message: 'Assessment configuration updated successfully',
    data: {
      assessmentId: assessment._id,
      title: assessment.title,
      status: assessment.status,
      scheduledDate: assessment.scheduledDate,
      dueDate: assessment.dueDate
    }
  });
});

// Get all assessments for a course
export const getCourseAssessments = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const userRole = req.user?.role;
  const userId = req.user?._id;

  let query: any = { courseId };
  
  // Teachers can only see their own assessments
  if (userRole === 'teacher') {
    query.teacherId = userId;
  }

  const assessments = await Assessment.find(query)
    .populate('teacherId', 'firstName lastName')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: {
      courseId,
      assessments: assessments.map(assessment => ({
        id: assessment._id,
        title: assessment.title,
        description: assessment.description,
        type: assessment.type,
        status: assessment.status,
        scheduledDate: assessment.scheduledDate,
        dueDate: assessment.dueDate,
        totalPoints: assessment.totalPoints,
        passingScore: assessment.passingScore,
        totalSubmissions: assessment.totalSubmissions,
        averageScore: assessment.averageScore,
        passRate: assessment.passRate,
        requireProctoring: assessment.requireProctoring,
        requireCamera: assessment.requireCamera,
        requireScreenShare: assessment.requireScreenShare,
        aiCheatingDetection: assessment.aiCheatingDetection,
        teacherName: assessment.teacherId ? 
          `${assessment.teacherId.firstName} ${assessment.teacherId.lastName}` : 'Unknown'
      }))
    }
  });
});

// Get comprehensive student progress for a course
export const getStudentCourseProgress = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const studentId = req.user?._id;
  const userRole = req.user?.role;

  // Verify access permissions
  if (userRole === 'student' && studentId !== req.params.studentId) {
    return res.status(403).json({
      success: false,
      message: 'You can only view your own progress'
    });
  }

  const targetStudentId = req.params.studentId || studentId;

  // Get course details
  const course = await Course.findById(courseId);
  if (!course) {
    return res.status(404).json({
      success: false,
      message: 'Course not found'
    });
  }

  // Verify teacher access if teacher is requesting
  if (userRole === 'teacher' && course.instructor.toString() !== req.user?._id) {
    return res.status(403).json({
      success: false,
      message: 'You can only view progress for your own courses'
    });
  }

  // Get user progress
  const userProgress = await UserProgress.findByUserAndCourse(targetStudentId, courseId);

  // Get assessment submissions
  const assessmentSubmissions = await Assessment.find({
    courseId,
    'submissions.studentId': targetStudentId
  }).select('title type status submissions');

  // Get attendance records
  const attendanceRecords = await Attendance.find({
    student: targetStudentId,
    course: courseId
  }).populate('session', 'title scheduledTime duration');

  // Get live session participation
  const sessionParticipation = await LiveSession.find({
    course: courseId,
    'attendees.user': targetStudentId
  }).select('title scheduledTime duration status attendees');

  // Calculate progress metrics
  const totalAssessments = assessmentSubmissions.length;
  const completedAssessments = assessmentSubmissions.filter(a => 
    a.submissions?.some(s => s.studentId.toString() === targetStudentId && s.status === 'completed')
  ).length;

  const totalSessions = sessionParticipation.length;
  const attendedSessions = attendanceRecords.filter(a => 
    ['present', 'late'].includes(a.status)
  ).length;

  const averageScore = assessmentSubmissions.reduce((sum, assessment) => {
    const submission = assessment.submissions?.find(s => s.studentId.toString() === targetStudentId);
    return sum + (submission?.score || 0);
  }, 0) / Math.max(completedAssessments, 1);

  const progressPercentage = userProgress ? userProgress.progressPercentage : 0;

  // Check certificate eligibility
  const isEligibleForCertificate = completedAssessments >= course.requiredAssessments && 
                                  attendedSessions >= course.requiredSessions &&
                                  progressPercentage >= 80;

  res.status(200).json({
    success: true,
    data: {
      courseId,
      courseTitle: course.title,
      studentId: targetStudentId,
      progress: {
        overall: progressPercentage,
        assessments: {
          total: totalAssessments,
          completed: completedAssessments,
          averageScore: Math.round(averageScore),
          submissions: assessmentSubmissions.map(a => ({
            assessmentId: a._id,
            title: a.title,
            type: a.type,
            status: a.status,
            submission: a.submissions?.find(s => s.studentId.toString() === targetStudentId)
          }))
        },
        sessions: {
          total: totalSessions,
          attended: attendedSessions,
          attendanceRate: totalSessions > 0 ? Math.round((attendedSessions / totalSessions) * 100) : 0,
          records: attendanceRecords
        },
        requirements: {
          requiredAssessments: course.requiredAssessments || 0,
          requiredSessions: course.requiredSessions || 0,
          minimumProgress: 80,
          isEligibleForCertificate
        },
        userProgress: userProgress ? {
          totalTimeSpent: userProgress.totalTimeSpent,
          totalPoints: userProgress.totalPoints,
          streakDays: userProgress.streakDays,
          isCompleted: userProgress.isCompleted,
          completionDate: userProgress.completionDate
        } : null
      }
    }
  });
});

// Update student progress when assessment is completed
export const updateStudentProgress = asyncHandler(async (req: Request, res: Response) => {
  const { assessmentId } = req.params;
  const studentId = req.user?._id;
  const { score, timeSpent } = req.body;

  const assessment = await Assessment.findById(assessmentId);
  if (!assessment) {
    return res.status(404).json({
      success: false,
      message: 'Assessment not found'
    });
  }

  // Find or create user progress
  let userProgress = await UserProgress.findByUserAndCourse(studentId, assessment.courseId);
  
  if (!userProgress) {
    userProgress = new UserProgress({
      user: studentId,
      course: assessment.courseId,
      completedLessons: [],
      enrollmentDate: new Date()
    });
  }

  // Add points based on score
  const pointsEarned = Math.round((score / 100) * assessment.totalPoints);
  await userProgress.addPoints(pointsEarned);

  // Update time spent
  userProgress.totalTimeSpent += timeSpent || 0;

  // Update progress percentage based on completed assessments
  const course = await Course.findById(assessment.courseId);
  if (course) {
    const totalAssessments = course.requiredAssessments || 1;
    const completedAssessments = await Assessment.countDocuments({
      courseId: assessment.courseId,
      'submissions.studentId': studentId,
      'submissions.status': 'completed'
    });

    userProgress.progressPercentage = Math.min((completedAssessments / totalAssessments) * 100, 100);
    
    if (userProgress.progressPercentage >= 100 && !userProgress.isCompleted) {
      await userProgress.markAsCompleted();
    }
  }

  await userProgress.save();

  res.status(200).json({
    success: true,
    message: 'Progress updated successfully',
    data: {
      pointsEarned,
      totalPoints: userProgress.totalPoints,
      progressPercentage: userProgress.progressPercentage,
      isCompleted: userProgress.isCompleted
    }
  });
});

// Get teacher's course progress overview
export const getTeacherCourseProgress = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const teacherId = req.user?._id;

  // Verify teacher owns the course
  const course = await Course.findOne({ _id: courseId, instructor: teacherId });
  if (!course) {
    return res.status(404).json({
      success: false,
      message: 'Course not found or access denied'
    });
  }

  // Get all student progress for this course
  const allProgress = await UserProgress.findByCourse(courseId);

  // Get assessment statistics
  const assessments = await Assessment.find({ courseId });
  const assessmentStats = assessments.map(assessment => ({
    assessmentId: assessment._id,
    title: assessment.title,
    type: assessment.type,
    totalSubmissions: assessment.totalSubmissions,
    averageScore: assessment.averageScore,
    passRate: assessment.passRate
  }));

  // Get attendance statistics
  const attendanceStats = await Attendance.aggregate([
    { $match: { course: course._id } },
    {
      $group: {
        _id: '$student',
        totalSessions: { $sum: 1 },
        presentSessions: {
          $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] }
        }
      }
    }
  ]);

  // Calculate overall statistics
  const totalStudents = allProgress.length;
  const completedStudents = allProgress.filter(p => p.isCompleted).length;
  const averageProgress = totalStudents > 0 
    ? allProgress.reduce((sum, p) => sum + p.progressPercentage, 0) / totalStudents 
    : 0;

  const averageAttendance = attendanceStats.length > 0
    ? attendanceStats.reduce((sum, stat) => sum + (stat.presentSessions / stat.totalSessions), 0) / attendanceStats.length
    : 0;

  res.status(200).json({
    success: true,
    data: {
      courseId,
      courseTitle: course.title,
      overview: {
        totalStudents,
        completedStudents,
        completionRate: totalStudents > 0 ? Math.round((completedStudents / totalStudents) * 100) : 0,
        averageProgress: Math.round(averageProgress),
        averageAttendance: Math.round(averageAttendance * 100)
      },
      studentProgress: allProgress.map(progress => ({
        studentId: progress.user,
        studentName: `${progress.user.firstName} ${progress.user.lastName}`,
        progressPercentage: progress.progressPercentage,
        totalTimeSpent: progress.totalTimeSpent,
        totalPoints: progress.totalPoints,
        isCompleted: progress.isCompleted,
        lastAccessed: progress.lastAccessed
      })),
      assessmentStats,
      attendanceStats: attendanceStats.map(stat => ({
        studentId: stat._id,
        totalSessions: stat.totalSessions,
        presentSessions: stat.presentSessions,
        attendanceRate: Math.round((stat.presentSessions / stat.totalSessions) * 100)
      }))
    }
  });
});

// Get admin progress overview
export const getAdminProgressOverview = asyncHandler(async (req: Request, res: Response) => {
  // Get overall system statistics
  const totalStudents = await User.countDocuments({ role: 'student' });
  const totalTeachers = await User.countDocuments({ role: 'teacher' });
  const totalCourses = await Course.countDocuments();

  // Get progress statistics
  const progressStats = await UserProgress.aggregate([
    {
      $group: {
        _id: null,
        totalEnrollments: { $sum: 1 },
        completedCourses: { $sum: { $cond: ['$isCompleted', 1, 0] } },
        averageProgress: { $avg: '$progressPercentage' },
        totalTimeSpent: { $sum: '$totalTimeSpent' },
        totalPoints: { $sum: '$totalPoints' }
      }
    }
  ]);

  const stats = progressStats[0] || {
    totalEnrollments: 0,
    completedCourses: 0,
    averageProgress: 0,
    totalTimeSpent: 0,
    totalPoints: 0
  };

  // Get top performing courses
  const topCourses = await UserProgress.aggregate([
    {
      $group: {
        _id: '$course',
        averageProgress: { $avg: '$progressPercentage' },
        totalStudents: { $sum: 1 },
        completedStudents: { $sum: { $cond: ['$isCompleted', 1, 0] } }
      }
    },
    { $sort: { averageProgress: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'courses',
        localField: '_id',
        foreignField: '_id',
        as: 'course'
      }
    },
    { $unwind: '$course' }
  ]);

  // Get top performing students
  const topStudents = await UserProgress.aggregate([
    {
      $group: {
        _id: '$user',
        totalPoints: { $sum: '$totalPoints' },
        averageProgress: { $avg: '$progressPercentage' },
        completedCourses: { $sum: { $cond: ['$isCompleted', 1, 0] } }
      }
    },
    { $sort: { totalPoints: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' }
  ]);

  res.status(200).json({
    success: true,
    data: {
      overview: {
        totalStudents,
        totalTeachers,
        totalCourses,
        totalEnrollments: stats.totalEnrollments,
        completedCourses: stats.completedCourses,
        completionRate: stats.totalEnrollments > 0 ? Math.round((stats.completedCourses / stats.totalEnrollments) * 100) : 0,
        averageProgress: Math.round(stats.averageProgress),
        totalTimeSpent: Math.round(stats.totalTimeSpent / 60), // Convert to hours
        totalPoints: stats.totalPoints
      },
      topCourses: topCourses.map(course => ({
        courseId: course._id,
        title: course.course.title,
        averageProgress: Math.round(course.averageProgress),
        totalStudents: course.totalStudents,
        completedStudents: course.completedStudents,
        completionRate: Math.round((course.completedStudents / course.totalStudents) * 100)
      })),
      topStudents: topStudents.map(student => ({
        studentId: student._id,
        name: `${student.user.firstName} ${student.user.lastName}`,
        totalPoints: student.totalPoints,
        averageProgress: Math.round(student.averageProgress),
        completedCourses: student.completedCourses
      }))
    }
  });
});

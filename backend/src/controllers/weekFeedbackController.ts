import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import WeekFeedback from '../models/WeekFeedback';
import { User } from '../models/User';
import { Week } from '../models/Week';
import { Course } from '../models/Course';

// Submit week-end feedback
export const submitWeekFeedback = asyncHandler(async (req: Request, res: Response) => {
  const {
    weekId,
    courseId,
    overallRating,
    contentQuality,
    difficultyLevel,
    paceRating,
    instructorRating,
    materialsRating,
    comments,
    suggestions,
    wouldRecommend,
    favoriteAspects,
    challenges,
    timeSpent,
    completedMaterials,
    totalMaterials
  } = req.body;

  const studentId = req.user?._id;

  if (!studentId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated'
    });
  }

  // Validate required fields
  if (!weekId || !courseId || !overallRating || !comments) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: weekId, courseId, overallRating, comments'
    });
  }

  // Validate ratings
  const ratings = [overallRating, contentQuality, paceRating, instructorRating, materialsRating];
  for (const rating of ratings) {
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        message: 'All ratings must be between 1 and 5'
      });
    }
  }

  // Validate difficulty level
  if (difficultyLevel && !['too_easy', 'just_right', 'too_hard'].includes(difficultyLevel)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid difficulty level'
    });
  }

  // Check if feedback already exists for this student and week
  const existingFeedback = await WeekFeedback.findOne({
    weekId,
    studentId
  });

  if (existingFeedback) {
    return res.status(400).json({
      success: false,
      message: 'Feedback already submitted for this week'
    });
  }

  // Verify week and course exist
  const week = await Week.findById(weekId);
  const course = await Course.findById(courseId);

  if (!week) {
    return res.status(404).json({
      success: false,
      message: 'Week not found'
    });
  }

  if (!course) {
    return res.status(404).json({
      success: false,
      message: 'Course not found'
    });
  }

  // Create new feedback
  const feedback = new WeekFeedback({
    weekId,
    courseId,
    studentId,
    overallRating,
    contentQuality: contentQuality || overallRating,
    difficultyLevel: difficultyLevel || 'just_right',
    paceRating: paceRating || overallRating,
    instructorRating: instructorRating || overallRating,
    materialsRating: materialsRating || overallRating,
    comments,
    suggestions: suggestions || '',
    wouldRecommend: wouldRecommend || false,
    favoriteAspects: favoriteAspects || [],
    challenges: challenges || [],
    timeSpent: timeSpent || 0,
    completedMaterials: completedMaterials || 0,
    totalMaterials: totalMaterials || 0
  });

  await feedback.save();

  res.status(201).json({
    success: true,
    message: 'Week feedback submitted successfully',
    data: {
      feedbackId: feedback._id,
      weekId: feedback.weekId,
      courseId: feedback.courseId,
      overallRating: feedback.overallRating,
      submittedAt: feedback.createdAt
    }
  });
});

// Get feedback for a specific week (for admins and teachers)
export const getWeekFeedback = asyncHandler(async (req: Request, res: Response) => {
  const { weekId } = req.params;
  const userRole = req.user?.role;

  if (!weekId) {
    return res.status(400).json({
      success: false,
      message: 'Week ID is required'
    });
  }

  // Only teachers and admins can view week feedback
  if (userRole !== 'teacher' && userRole !== 'admin' && userRole !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only teachers and admins can view week feedback.'
    });
  }

  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const feedback = await WeekFeedback.find({ weekId })
    .populate('studentId', 'firstName lastName email')
    .populate('weekId', 'title description')
    .populate('courseId', 'title')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await WeekFeedback.countDocuments({ weekId });

  res.status(200).json({
    success: true,
    data: {
      weekId,
      feedbackCount: total,
      feedback: feedback.map(f => ({
        id: f._id,
        studentName: `${f.studentId.firstName} ${f.studentId.lastName}`,
        studentEmail: f.studentId.email,
        weekTitle: f.weekId.title,
        courseTitle: f.courseId.title,
        overallRating: f.overallRating,
        contentQuality: f.contentQuality,
        difficultyLevel: f.difficultyLevel,
        paceRating: f.paceRating,
        instructorRating: f.instructorRating,
        materialsRating: f.materialsRating,
        comments: f.comments,
        suggestions: f.suggestions,
        wouldRecommend: f.wouldRecommend,
        favoriteAspects: f.favoriteAspects,
        challenges: f.challenges,
        timeSpent: f.timeSpent,
        completedMaterials: f.completedMaterials,
        totalMaterials: f.totalMaterials,
        submittedAt: f.createdAt
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    }
  });
});

// Get feedback statistics for a week
export const getWeekFeedbackStats = asyncHandler(async (req: Request, res: Response) => {
  const { weekId } = req.params;
  const userRole = req.user?.role;

  if (!weekId) {
    return res.status(400).json({
      success: false,
      message: 'Week ID is required'
    });
  }

  // Only teachers and admins can view feedback statistics
  if (userRole !== 'teacher' && userRole !== 'admin' && userRole !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only teachers and admins can view feedback statistics.'
    });
  }

  const feedback = await WeekFeedback.find({ weekId });

  const totalFeedback = feedback.length;
  
  if (totalFeedback === 0) {
    return res.status(200).json({
      success: true,
      data: {
        totalFeedback: 0,
        averageRating: 0,
        averageContentQuality: 0,
        averageInstructorRating: 0,
        averageMaterialsRating: 0,
        averagePaceRating: 0,
        difficultyDistribution: {
          too_easy: 0,
          just_right: 0,
          too_hard: 0
        },
        recommendationRate: 0,
        commonChallenges: [],
        commonFavorites: []
      }
    });
  }

  const averageRating = feedback.reduce((sum, f) => sum + f.overallRating, 0) / totalFeedback;
  const averageContentQuality = feedback.reduce((sum, f) => sum + f.contentQuality, 0) / totalFeedback;
  const averageInstructorRating = feedback.reduce((sum, f) => sum + f.instructorRating, 0) / totalFeedback;
  const averageMaterialsRating = feedback.reduce((sum, f) => sum + f.materialsRating, 0) / totalFeedback;
  const averagePaceRating = feedback.reduce((sum, f) => sum + f.paceRating, 0) / totalFeedback;

  const difficultyDistribution = {
    too_easy: feedback.filter(f => f.difficultyLevel === 'too_easy').length,
    just_right: feedback.filter(f => f.difficultyLevel === 'just_right').length,
    too_hard: feedback.filter(f => f.difficultyLevel === 'too_hard').length
  };

  const recommendationRate = (feedback.filter(f => f.wouldRecommend).length / totalFeedback) * 100;

  // Count common challenges
  const challengeCounts: { [key: string]: number } = {};
  feedback.forEach(f => {
    f.challenges.forEach(challenge => {
      challengeCounts[challenge] = (challengeCounts[challenge] || 0) + 1;
    });
  });

  const commonChallenges = Object.entries(challengeCounts)
    .map(([challenge, count]) => ({ challenge, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Count common favorites
  const favoriteCounts: { [key: string]: number } = {};
  feedback.forEach(f => {
    f.favoriteAspects.forEach(aspect => {
      favoriteCounts[aspect] = (favoriteCounts[aspect] || 0) + 1;
    });
  });

  const commonFavorites = Object.entries(favoriteCounts)
    .map(([aspect, count]) => ({ aspect, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  res.status(200).json({
    success: true,
    data: {
      totalFeedback,
      averageRating: Math.round(averageRating * 100) / 100,
      averageContentQuality: Math.round(averageContentQuality * 100) / 100,
      averageInstructorRating: Math.round(averageInstructorRating * 100) / 100,
      averageMaterialsRating: Math.round(averageMaterialsRating * 100) / 100,
      averagePaceRating: Math.round(averagePaceRating * 100) / 100,
      difficultyDistribution,
      recommendationRate: Math.round(recommendationRate * 100) / 100,
      commonChallenges,
      commonFavorites
    }
  });
});

// Get all feedback for a course (for admins)
export const getCourseFeedback = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const userRole = req.user?.role;

  if (!courseId) {
    return res.status(400).json({
      success: false,
      message: 'Course ID is required'
    });
  }

  // Only admins can view all course feedback
  if (userRole !== 'admin' && userRole !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only admins can view all course feedback.'
    });
  }

  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const feedback = await WeekFeedback.find({ courseId })
    .populate('studentId', 'firstName lastName email')
    .populate('weekId', 'title description')
    .populate('courseId', 'title')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await WeekFeedback.countDocuments({ courseId });

  res.status(200).json({
    success: true,
    data: {
      courseId,
      feedbackCount: total,
      feedback: feedback.map(f => ({
        id: f._id,
        studentName: `${f.studentId.firstName} ${f.studentId.lastName}`,
        studentEmail: f.studentId.email,
        weekTitle: f.weekId.title,
        courseTitle: f.courseId.title,
        overallRating: f.overallRating,
        contentQuality: f.contentQuality,
        difficultyLevel: f.difficultyLevel,
        paceRating: f.paceRating,
        instructorRating: f.instructorRating,
        materialsRating: f.materialsRating,
        comments: f.comments,
        suggestions: f.suggestions,
        wouldRecommend: f.wouldRecommend,
        favoriteAspects: f.favoriteAspects,
        challenges: f.challenges,
        timeSpent: f.timeSpent,
        completedMaterials: f.completedMaterials,
        totalMaterials: f.totalMaterials,
        submittedAt: f.createdAt
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    }
  });
});

// Check if user has already submitted feedback for a week
export const hasSubmittedFeedback = asyncHandler(async (req: Request, res: Response) => {
  const { weekId } = req.params;
  const studentId = req.user?._id;

  if (!studentId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated'
    });
  }

  if (!weekId) {
    return res.status(400).json({
      success: false,
      message: 'Week ID is required'
    });
  }

  const existingFeedback = await WeekFeedback.findOne({
    weekId,
    studentId
  });

  res.status(200).json({
    success: true,
    data: !!existingFeedback
  });
});

// Get user's feedback history
export const getUserFeedbackHistory = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const currentUserId = req.user?._id;
  const userRole = req.user?.role;

  // Users can only view their own feedback history, admins can view anyone's
  if (userId !== currentUserId && userRole !== 'admin' && userRole !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only view your own feedback history.'
    });
  }

  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const feedback = await WeekFeedback.find({ studentId: userId })
    .populate('weekId', 'title description')
    .populate('courseId', 'title')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await WeekFeedback.countDocuments({ studentId: userId });

  res.status(200).json({
    success: true,
    data: {
      feedback: feedback.map(f => ({
        id: f._id,
        weekTitle: f.weekId.title,
        courseTitle: f.courseId.title,
        overallRating: f.overallRating,
        contentQuality: f.contentQuality,
        difficultyLevel: f.difficultyLevel,
        paceRating: f.paceRating,
        instructorRating: f.instructorRating,
        materialsRating: f.materialsRating,
        comments: f.comments,
        suggestions: f.suggestions,
        wouldRecommend: f.wouldRecommend,
        favoriteAspects: f.favoriteAspects,
        challenges: f.challenges,
        timeSpent: f.timeSpent,
        completedMaterials: f.completedMaterials,
        totalMaterials: f.totalMaterials,
        submittedAt: f.createdAt
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    }
  });
});

// Get course feedback statistics (for admins)
export const getCourseFeedbackStats = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const userRole = req.user?.role;

  if (!courseId) {
    return res.status(400).json({
      success: false,
      message: 'Course ID is required'
    });
  }

  // Only admins can view course feedback statistics
  if (userRole !== 'admin' && userRole !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only admins can view course feedback statistics.'
    });
  }

  const feedback = await WeekFeedback.find({ courseId })
    .populate('weekId', 'title')
    .populate('studentId', 'firstName lastName');

  const totalFeedback = feedback.length;
  
  if (totalFeedback === 0) {
    return res.status(200).json({
      success: true,
      data: {
        courseId,
        totalFeedback: 0,
        averageRating: 0,
        averageContentQuality: 0,
        averageInstructorRating: 0,
        averageMaterialsRating: 0,
        averagePaceRating: 0,
        difficultyDistribution: {
          too_easy: 0,
          just_right: 0,
          too_hard: 0
        },
        recommendationRate: 0,
        feedbackByWeek: [],
        topChallenges: [],
        topFavorites: [],
        recentFeedback: []
      }
    });
  }

  const averageRating = feedback.reduce((sum, f) => sum + f.overallRating, 0) / totalFeedback;
  const averageContentQuality = feedback.reduce((sum, f) => sum + f.contentQuality, 0) / totalFeedback;
  const averageInstructorRating = feedback.reduce((sum, f) => sum + f.instructorRating, 0) / totalFeedback;
  const averageMaterialsRating = feedback.reduce((sum, f) => sum + f.materialsRating, 0) / totalFeedback;
  const averagePaceRating = feedback.reduce((sum, f) => sum + f.paceRating, 0) / totalFeedback;

  const difficultyDistribution = {
    too_easy: feedback.filter(f => f.difficultyLevel === 'too_easy').length,
    just_right: feedback.filter(f => f.difficultyLevel === 'just_right').length,
    too_hard: feedback.filter(f => f.difficultyLevel === 'too_hard').length
  };

  const recommendationRate = (feedback.filter(f => f.wouldRecommend).length / totalFeedback) * 100;

  // Group feedback by week
  const feedbackByWeek: { [key: string]: any[] } = {};
  feedback.forEach(f => {
    const weekId = f.weekId._id.toString();
    const weekTitle = f.weekId.title;
    if (!feedbackByWeek[weekId]) {
      feedbackByWeek[weekId] = [];
    }
    feedbackByWeek[weekId].push({
      ...f.toObject(),
      weekTitle,
      studentName: `${f.studentId.firstName} ${f.studentId.lastName}`
    });
  });

  const weekStats = Object.entries(feedbackByWeek).map(([weekId, weekFeedback]) => {
    const avgRating = weekFeedback.reduce((sum, f) => sum + f.overallRating, 0) / weekFeedback.length;
    return {
      weekId,
      weekTitle: weekFeedback[0].weekTitle,
      feedbackCount: weekFeedback.length,
      averageRating: Math.round(avgRating * 100) / 100,
      feedback: weekFeedback
    };
  });

  // Count common challenges across all weeks
  const challengeCounts: { [key: string]: number } = {};
  feedback.forEach(f => {
    f.challenges.forEach(challenge => {
      challengeCounts[challenge] = (challengeCounts[challenge] || 0) + 1;
    });
  });

  const topChallenges = Object.entries(challengeCounts)
    .map(([challenge, count]) => ({ challenge, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Count common favorites across all weeks
  const favoriteCounts: { [key: string]: number } = {};
  feedback.forEach(f => {
    f.favoriteAspects.forEach(aspect => {
      favoriteCounts[aspect] = (favoriteCounts[aspect] || 0) + 1;
    });
  });

  const topFavorites = Object.entries(favoriteCounts)
    .map(([aspect, count]) => ({ aspect, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const recentFeedback = feedback
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10)
    .map(f => ({
      id: f._id,
      studentName: `${f.studentId.firstName} ${f.studentId.lastName}`,
      weekTitle: f.weekId.title,
      overallRating: f.overallRating,
      comments: f.comments.substring(0, 150) + (f.comments.length > 150 ? '...' : ''),
      submittedAt: f.createdAt
    }));

  res.status(200).json({
    success: true,
    data: {
      courseId,
      totalFeedback,
      averageRating: Math.round(averageRating * 100) / 100,
      averageContentQuality: Math.round(averageContentQuality * 100) / 100,
      averageInstructorRating: Math.round(averageInstructorRating * 100) / 100,
      averageMaterialsRating: Math.round(averageMaterialsRating * 100) / 100,
      averagePaceRating: Math.round(averagePaceRating * 100) / 100,
      difficultyDistribution,
      recommendationRate: Math.round(recommendationRate * 100) / 100,
      feedbackByWeek: weekStats,
      topChallenges,
      topFavorites,
      recentFeedback
    }
  });
});

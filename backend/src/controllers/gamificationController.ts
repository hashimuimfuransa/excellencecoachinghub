import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { Course } from '../models/Course';
import { User } from '../models/User';
import { Enrollment } from '../models/Enrollment';
import { StudentProgress } from '../models/StudentProgress';

// Get study statistics for a course
export const getStudyStats = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated'
    });
  }

  try {
    // Get course details
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Get enrollment
    const enrollment = await Enrollment.findOne({ 
      course: courseId, 
      student: userId 
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Student not enrolled in this course'
      });
    }

    // Get progress data
    const progress = await StudentProgress.findOne({ 
      course: courseId, 
      student: userId 
    });

    // Calculate stats
    const totalSections = course.sections?.length || 0;
    const completedSections = progress?.completedSections?.length || 0;
    const totalReadTime = progress?.totalReadTime || 0;
    const currentStreak = progress?.currentStreak || 0;
    const pointsEarned = progress?.pointsEarned || 0;
    const badgesEarned = progress?.badgesEarned || [];
    const averageQuizScore = progress?.averageQuizScore || 0;
    const studyLevel = Math.floor(pointsEarned / 100) + 1;

    res.json({
      success: true,
      data: {
        totalSections,
        completedSections,
        totalReadTime,
        currentStreak,
        pointsEarned,
        badgesEarned,
        averageQuizScore,
        studyLevel
      }
    });
  } catch (error) {
    console.error('Error fetching study stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch study statistics'
    });
  }
});

// Get level information
export const getLevelInfo = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated'
    });
  }

  try {
    const progress = await StudentProgress.findOne({ 
      course: courseId, 
      student: userId 
    });

    const currentXP = progress?.pointsEarned || 0;
    const currentLevel = Math.floor(currentXP / 100) + 1;
    const xpToNextLevel = currentLevel * 100 - currentXP;
    const totalXP = currentXP;

    res.json({
      success: true,
      data: {
        currentLevel,
        currentXP,
        xpToNextLevel,
        totalXP
      }
    });
  } catch (error) {
    console.error('Error fetching level info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch level information'
    });
  }
});

// Get achievements
export const getAchievements = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated'
    });
  }

  try {
    const progress = await StudentProgress.findOne({ 
      course: courseId, 
      student: userId 
    });

    // Mock achievements for now
    const achievements = [
      {
        _id: '1',
        user: userId,
        course: courseId,
        type: 'milestone',
        title: 'First Steps',
        description: 'Completed your first section',
        points: 10,
        data: {},
        earnedAt: new Date()
      },
      {
        _id: '2',
        user: userId,
        course: courseId,
        type: 'streak',
        title: 'Consistent Learner',
        description: 'Studied for 3 days in a row',
        points: 25,
        data: {},
        earnedAt: new Date()
      }
    ];

    res.json({
      success: true,
      data: achievements
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch achievements'
    });
  }
});

// Get earned badges
export const getEarnedBadges = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated'
    });
  }

  try {
    const progress = await StudentProgress.findOne({ 
      course: courseId, 
      student: userId 
    });

    // Mock badges for now
    const badges = [
      {
        _id: '1',
        name: 'Quick Learner',
        description: 'Completed a section in record time',
        icon: '⚡',
        type: 'reading',
        criteria: {
          type: 'time',
          value: 5,
          description: 'Complete a section in under 5 minutes'
        },
        points: 15,
        rarity: 'common',
        earnedAt: new Date()
      },
      {
        _id: '2',
        name: 'Quiz Master',
        description: 'Scored 100% on a quiz',
        icon: '🎯',
        type: 'quiz',
        criteria: {
          type: 'score',
          value: 100,
          description: 'Get a perfect score on any quiz'
        },
        points: 20,
        rarity: 'rare',
        earnedAt: new Date()
      }
    ];

    res.json({
      success: true,
      data: badges
    });
  } catch (error) {
    console.error('Error fetching earned badges:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch earned badges'
    });
  }
});

// Get leaderboard
export const getLeaderboard = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const { limit = 10 } = req.query;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated'
    });
  }

  try {
    // Get all enrollments for this course with progress
    const enrollments = await Enrollment.find({ course: courseId })
      .populate('student', 'firstName lastName avatar')
      .populate('progress');

    // Create leaderboard data
    const leaderboard = enrollments
      .map((enrollment: any) => ({
        rank: 0, // Will be set after sorting
        user: {
          _id: enrollment.student._id,
          firstName: enrollment.student.firstName,
          lastName: enrollment.student.lastName,
          avatar: enrollment.student.avatar
        },
        points: enrollment.progress?.pointsEarned || 0,
        level: Math.floor((enrollment.progress?.pointsEarned || 0) / 100) + 1,
        badges: enrollment.progress?.badgesEarned?.length || 0,
        completionRate: enrollment.progress?.completedSections?.length || 0
      }))
      .sort((a, b) => b.points - a.points)
      .slice(0, parseInt(limit as string))
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
        isCurrentUser: entry.user._id === userId
      }));

    res.json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard'
    });
  }
});

// Award reading points
export const awardReadingPoints = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const { sectionId, readTime } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated'
    });
  }

  try {
    // Calculate points based on read time (1 point per minute)
    const points = Math.floor(readTime / 60);
    
    // Update or create progress
    let progress = await StudentProgress.findOne({ 
      course: courseId, 
      student: userId 
    });

    if (!progress) {
      progress = new StudentProgress({
        course: courseId,
        student: userId,
        pointsEarned: points,
        totalReadTime: readTime
      });
    } else {
      progress.pointsEarned = (progress.pointsEarned || 0) + points;
      progress.totalReadTime = (progress.totalReadTime || 0) + readTime;
    }

    await progress.save();

    res.json({
      success: true,
      data: {
        pointsAwarded: points,
        totalPoints: progress.pointsEarned
      }
    });
  } catch (error) {
    console.error('Error awarding reading points:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to award reading points'
    });
  }
});

// Award quiz points
export const awardQuizPoints = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const { sectionId, score } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated'
    });
  }

  try {
    // Calculate points based on score (1 point per percentage point)
    const points = Math.floor(score);
    
    // Update or create progress
    let progress = await StudentProgress.findOne({ 
      course: courseId, 
      student: userId 
    });

    if (!progress) {
      progress = new StudentProgress({
        course: courseId,
        student: userId,
        pointsEarned: points,
        averageQuizScore: score
      });
    } else {
      progress.pointsEarned = (progress.pointsEarned || 0) + points;
      // Update average quiz score
      const currentAverage = progress.averageQuizScore || 0;
      const quizCount = progress.quizScores?.length || 0;
      progress.averageQuizScore = (currentAverage * quizCount + score) / (quizCount + 1);
      
      if (!progress.quizScores) progress.quizScores = [];
      progress.quizScores.push(score);
    }

    await progress.save();

    res.json({
      success: true,
      data: {
        pointsAwarded: points,
        totalPoints: progress.pointsEarned,
        averageScore: progress.averageQuizScore
      }
    });
  } catch (error) {
    console.error('Error awarding quiz points:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to award quiz points'
    });
  }
});

// Get study streak
export const getStudyStreak = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated'
    });
  }

  try {
    const progress = await StudentProgress.findOne({ 
      course: courseId, 
      student: userId 
    });

    res.json({
      success: true,
      data: {
        currentStreak: progress?.currentStreak || 0,
        longestStreak: progress?.longestStreak || 0,
        lastStudyDate: progress?.lastStudyDate || null
      }
    });
  } catch (error) {
    console.error('Error fetching study streak:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch study streak'
    });
  }
});

// Update study streak
export const updateStudyStreak = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated'
    });
  }

  try {
    let progress = await StudentProgress.findOne({ 
      course: courseId, 
      student: userId 
    });

    if (!progress) {
      progress = new StudentProgress({
        course: courseId,
        student: userId,
        currentStreak: 1,
        longestStreak: 1,
        lastStudyDate: new Date()
      });
    } else {
      const today = new Date();
      const lastStudy = progress.lastStudyDate ? new Date(progress.lastStudyDate) : null;
      
      if (lastStudy) {
        const diffTime = today.getTime() - lastStudy.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          // Consecutive day
          progress.currentStreak = (progress.currentStreak || 0) + 1;
        } else if (diffDays > 1) {
          // Streak broken
          progress.currentStreak = 1;
        }
        // If diffDays === 0, same day, don't change streak
      } else {
        // First study
        progress.currentStreak = 1;
      }
      
      progress.longestStreak = Math.max(progress.longestStreak || 0, progress.currentStreak);
      progress.lastStudyDate = today;
    }

    await progress.save();

    res.json({
      success: true,
      data: {
        currentStreak: progress.currentStreak,
        longestStreak: progress.longestStreak,
        lastStudyDate: progress.lastStudyDate
      }
    });
  } catch (error) {
    console.error('Error updating study streak:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update study streak'
    });
  }
});

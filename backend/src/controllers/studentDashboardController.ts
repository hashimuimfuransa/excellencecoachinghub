import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import VideoWatch from '../models/VideoWatch';
import { AssignmentSubmission } from '../models/Assignment';

// Get student dashboard stats
export const getStudentDashboardStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user._id;

    // Get videos watched count
    const videosWatched = await VideoWatch.countDocuments({
      user: userId,
      completed: true
    });

    // Get total videos available
    const totalVideos = await import('../models/UploadedVideo').then(m => m.default.countDocuments({ isActive: true }));

    // Get homework completed count
    const homeworkCompleted = await AssignmentSubmission.countDocuments({
      student: userId,
      status: 'submitted'
    });

    // Get total homework assignments
    const totalHomework = await import('../models/Assignment').then(m => m.Assignment.countDocuments({ status: 'published' }));

    // Calculate streak (consecutive days with activity)
    const streak = await calculateStreak(userId);

    // Calculate points (for now, simple calculation based on completed items)
    const points = (videosWatched * 10) + (homeworkCompleted * 20) + (streak * 5);

    res.status(200).json({
      success: true,
      data: {
        points,
        streak,
        videosWatched: {
          current: videosWatched,
          total: totalVideos
        },
        homeworkDone: {
          current: homeworkCompleted,
          total: totalHomework
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to calculate streak
async function calculateStreak(userId: string): Promise<number> {
  try {
    // Get all activity dates (video watches and homework submissions)
    const videoDates = await VideoWatch.find({ user: userId, completed: true })
      .select('watchedAt')
      .sort({ watchedAt: -1 });

    const homeworkDates = await AssignmentSubmission.find({
      student: userId,
      status: 'submitted'
    })
      .select('submittedAt')
      .sort({ submittedAt: -1 });

    // Combine and deduplicate dates
    const allDates = [
      ...videoDates.map(v => v.watchedAt),
      ...homeworkDates.map(h => h.submittedAt).filter(date => date)
    ];

    if (allDates.length === 0) return 0;

    // Sort dates in descending order and remove duplicates
    const uniqueDates = [...new Set(allDates.map(date => date.toDateString()))]
      .map(dateStr => new Date(dateStr))
      .sort((a, b) => b.getTime() - a.getTime());

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if there's activity today or yesterday
    const latestActivity = uniqueDates[0];
    latestActivity.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor((today.getTime() - latestActivity.getTime()) / (1000 * 60 * 60 * 24));

    // If no activity in last 2 days, streak is 0
    if (daysDiff > 1) return 0;

    // Count consecutive days
    for (let i = 0; i < uniqueDates.length; i++) {
      const currentDate = new Date(uniqueDates[i]);
      currentDate.setHours(0, 0, 0, 0);

      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);

      if (currentDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  } catch (error) {
    console.error('Error calculating streak:', error);
    return 0;
  }
}
import { Router } from 'express';
import { body } from 'express-validator';
import {
  getStudyStats,
  getLevelInfo,
  getAchievements,
  getEarnedBadges,
  getLeaderboard,
  awardReadingPoints,
  awardQuizPoints,
  getStudyStreak,
  updateStudyStreak
} from '../controllers/gamificationController';
import { protect } from '../middleware/auth';

const router = Router();

// All gamification routes require authentication
router.use(protect);

// Get study statistics for a course
router.get('/course/:courseId/stats', getStudyStats);

// Get level information
router.get('/course/:courseId/level', getLevelInfo);

// Get achievements
router.get('/course/:courseId/achievements', getAchievements);

// Get earned badges
router.get('/course/:courseId/badges/earned', getEarnedBadges);

// Get leaderboard
router.get('/course/:courseId/leaderboard', getLeaderboard);

// Award reading points
router.post('/course/:courseId/award-reading-points',
  [
    body('sectionId')
      .notEmpty()
      .withMessage('Section ID is required'),
    body('readTime')
      .isNumeric()
      .withMessage('Read time must be a number')
      .isFloat({ min: 0 })
      .withMessage('Read time must be positive')
  ],
  awardReadingPoints
);

// Award quiz points
router.post('/course/:courseId/award-quiz-points',
  [
    body('sectionId')
      .notEmpty()
      .withMessage('Section ID is required'),
    body('score')
      .isNumeric()
      .withMessage('Score must be a number')
      .isFloat({ min: 0, max: 100 })
      .withMessage('Score must be between 0 and 100')
  ],
  awardQuizPoints
);

// Get study streak
router.get('/course/:courseId/streak', getStudyStreak);

// Update study streak
router.post('/course/:courseId/streak/update', updateStudyStreak);

export default router;

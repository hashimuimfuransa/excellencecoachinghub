import express from 'express';
import { auth } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { getLeaderboard } from '../controllers/leaderboardController';

const router = express.Router();

// All routes require authentication
router.use(auth);

// Get leaderboard
router.get('/', asyncHandler(getLeaderboard));

export default router;
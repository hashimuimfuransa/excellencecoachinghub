import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';

// Mock leaderboard data
const leaderboardData = [
  {
    userId: 'user1',
    userName: 'John Doe',
    score: 95,
    rank: 1,
    courseId: 'course1',
    avatar: 'https://example.com/avatar1.jpg'
  },
  {
    userId: 'user2',
    userName: 'Jane Smith',
    score: 92,
    rank: 2,
    courseId: 'course1',
    avatar: 'https://example.com/avatar2.jpg'
  },
  {
    userId: 'user3',
    userName: 'Mike Johnson',
    score: 88,
    rank: 3,
    courseId: 'course1',
    avatar: 'https://example.com/avatar3.jpg'
  },
  {
    userId: 'user4',
    userName: 'Sarah Wilson',
    score: 85,
    rank: 4,
    courseId: 'course1',
    avatar: 'https://example.com/avatar4.jpg'
  },
  {
    userId: 'user5',
    userName: 'David Brown',
    score: 82,
    rank: 5,
    courseId: 'course1',
    avatar: 'https://example.com/avatar5.jpg'
  }
];

// Get leaderboard
export const getLeaderboard = asyncHandler(async (req: Request, res: Response) => {
  const { courseId, limit = 10 } = req.query;
  
  // Filter by course if specified
  let filteredData = leaderboardData;
  if (courseId) {
    filteredData = leaderboardData.filter(entry => entry.courseId === courseId);
  }
  
  // Limit results
  const limitedData = filteredData.slice(0, Number(limit));
  
  res.status(200).json({
    success: true,
    data: limitedData
  });
});
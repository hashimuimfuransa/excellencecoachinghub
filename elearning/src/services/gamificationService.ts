import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface StudyStats {
  totalSections: number;
  completedSections: number;
  totalReadTime: number;
  currentStreak: number;
  pointsEarned: number;
  badgesEarned: string[];
  averageQuizScore: number;
  studyLevel: number;
}

export interface Badge {
  _id: string;
  name: string;
  description: string;
  icon: string;
  type: 'reading' | 'quiz' | 'streak' | 'completion' | 'special';
  criteria: {
    type: string;
    value: number;
    description: string;
  };
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earnedAt?: Date;
}

export interface Achievement {
  _id: string;
  user: string;
  course: string;
  type: 'badge' | 'level' | 'streak' | 'milestone';
  title: string;
  description: string;
  points: number;
  data: any;
  earnedAt: Date;
}

export interface Leaderboard {
  rank: number;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  points: number;
  level: number;
  badges: number;
  completionRate: number;
}

class GamificationService {
  // Get study statistics
  async getStudyStats(courseId: string): Promise<StudyStats> {
    try {
      const response = await api.get(`/gamification/course/${courseId}/stats`);
      return response.data.data || {
        totalSections: 0,
        completedSections: 0,
        totalReadTime: 0,
        currentStreak: 0,
        pointsEarned: 0,
        badgesEarned: [],
        averageQuizScore: 0,
        studyLevel: 1
      };
    } catch (error: any) {
      console.error('Failed to fetch study stats:', error);
      return {
        totalSections: 0,
        completedSections: 0,
        totalReadTime: 0,
        currentStreak: 0,
        pointsEarned: 0,
        badgesEarned: [],
        averageQuizScore: 0,
        studyLevel: 1
      };
    }
  }

  // Award points for reading
  async awardReadingPoints(courseId: string, sectionId: string, readTime: number): Promise<any> {
    try {
      const response = await api.post(`/gamification/course/${courseId}/award-reading-points`, {
        sectionId,
        readTime
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to award reading points:', error);
      throw new Error(error.response?.data?.message || 'Failed to award reading points');
    }
  }

  // Award points for quiz completion
  async awardQuizPoints(courseId: string, sectionId: string, score: number): Promise<any> {
    try {
      const response = await api.post(`/gamification/course/${courseId}/award-quiz-points`, {
        sectionId,
        score
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to award quiz points:', error);
      throw new Error(error.response?.data?.message || 'Failed to award quiz points');
    }
  }

  // Get available badges
  async getAvailableBadges(courseId: string): Promise<Badge[]> {
    try {
      const response = await api.get(`/gamification/course/${courseId}/badges`);
      return response.data.data || [];
    } catch (error: any) {
      console.error('Failed to fetch available badges:', error);
      return [];
    }
  }

  // Get earned badges
  async getEarnedBadges(courseId: string): Promise<Badge[]> {
    try {
      const response = await api.get(`/gamification/course/${courseId}/badges/earned`);
      return response.data.data || [];
    } catch (error: any) {
      console.error('Failed to fetch earned badges:', error);
      return [];
    }
  }

  // Get achievements
  async getAchievements(courseId: string): Promise<Achievement[]> {
    try {
      const response = await api.get(`/gamification/course/${courseId}/achievements`);
      return response.data.data || [];
    } catch (error: any) {
      console.error('Failed to fetch achievements:', error);
      return [];
    }
  }

  // Get recent achievements
  async getRecentAchievements(courseId: string, limit: number = 5): Promise<Achievement[]> {
    try {
      const response = await api.get(`/gamification/course/${courseId}/achievements/recent`, {
        params: { limit }
      });
      return response.data.data || [];
    } catch (error: any) {
      console.error('Failed to fetch recent achievements:', error);
      return [];
    }
  }

  // Get leaderboard
  async getLeaderboard(courseId: string, limit: number = 10): Promise<Leaderboard[]> {
    try {
      const response = await api.get(`/gamification/course/${courseId}/leaderboard`, {
        params: { limit }
      });
      return response.data.data || [];
    } catch (error: any) {
      console.error('Failed to fetch leaderboard:', error);
      return [];
    }
  }

  // Get user rank
  async getUserRank(courseId: string): Promise<number> {
    try {
      const response = await api.get(`/gamification/course/${courseId}/rank`);
      return response.data.data || 0;
    } catch (error: any) {
      console.error('Failed to fetch user rank:', error);
      return 0;
    }
  }

  // Get study streak
  async getStudyStreak(courseId: string): Promise<any> {
    try {
      const response = await api.get(`/gamification/course/${courseId}/streak`);
      return response.data.data || {
        currentStreak: 0,
        longestStreak: 0,
        lastStudyDate: null
      };
    } catch (error: any) {
      console.error('Failed to fetch study streak:', error);
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastStudyDate: null
      };
    }
  }

  // Update study streak
  async updateStudyStreak(courseId: string): Promise<any> {
    try {
      const response = await api.post(`/gamification/course/${courseId}/streak/update`);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to update study streak:', error);
      throw new Error(error.response?.data?.message || 'Failed to update study streak');
    }
  }

  // Get level information
  async getLevelInfo(courseId: string): Promise<any> {
    try {
      const response = await api.get(`/gamification/course/${courseId}/level`);
      return response.data.data || {
        currentLevel: 1,
        currentXP: 0,
        xpToNextLevel: 100,
        totalXP: 0
      };
    } catch (error: any) {
      console.error('Failed to fetch level info:', error);
      return {
        currentLevel: 1,
        currentXP: 0,
        xpToNextLevel: 100,
        totalXP: 0
      };
    }
  }

  // Get progress milestones
  async getProgressMilestones(courseId: string): Promise<any[]> {
    try {
      const response = await api.get(`/gamification/course/${courseId}/milestones`);
      return response.data.data || [];
    } catch (error: any) {
      console.error('Failed to fetch progress milestones:', error);
      return [];
    }
  }

  // Check for new achievements
  async checkForNewAchievements(courseId: string): Promise<Achievement[]> {
    try {
      const response = await api.post(`/gamification/course/${courseId}/check-achievements`);
      return response.data.data || [];
    } catch (error: any) {
      console.error('Failed to check for new achievements:', error);
      return [];
    }
  }

  // Get daily challenges
  async getDailyChallenges(courseId: string): Promise<any[]> {
    try {
      const response = await api.get(`/gamification/course/${courseId}/daily-challenges`);
      return response.data.data || [];
    } catch (error: any) {
      console.error('Failed to fetch daily challenges:', error);
      return [];
    }
  }

  // Complete daily challenge
  async completeDailyChallenge(courseId: string, challengeId: string): Promise<any> {
    try {
      const response = await api.post(`/gamification/course/${courseId}/daily-challenges/${challengeId}/complete`);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to complete daily challenge:', error);
      throw new Error(error.response?.data?.message || 'Failed to complete daily challenge');
    }
  }

  // Get study analytics
  async getStudyAnalytics(courseId: string, period: 'week' | 'month' | 'all' = 'week'): Promise<any> {
    try {
      const response = await api.get(`/gamification/course/${courseId}/analytics`, {
        params: { period }
      });
      return response.data.data || {
        studyTime: [],
        pointsEarned: [],
        quizScores: [],
        streakData: []
      };
    } catch (error: any) {
      console.error('Failed to fetch study analytics:', error);
      return {
        studyTime: [],
        pointsEarned: [],
        quizScores: [],
        streakData: []
      };
    }
  }

  // Get course completion certificate
  async getCourseCompletionCertificate(courseId: string): Promise<Blob> {
    try {
      const response = await api.get(`/gamification/course/${courseId}/certificate`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to get completion certificate:', error);
      throw new Error(error.response?.data?.message || 'Failed to get completion certificate');
    }
  }

  // Share achievement
  async shareAchievement(achievementId: string, platform: 'twitter' | 'facebook' | 'linkedin'): Promise<string> {
    try {
      const response = await api.post(`/gamification/achievements/${achievementId}/share`, {
        platform
      });
      return response.data.data.shareUrl;
    } catch (error: any) {
      console.error('Failed to share achievement:', error);
      throw new Error(error.response?.data?.message || 'Failed to share achievement');
    }
  }

  // Get global leaderboard
  async getGlobalLeaderboard(limit: number = 50): Promise<Leaderboard[]> {
    try {
      const response = await api.get('/gamification/global-leaderboard', {
        params: { limit }
      });
      return response.data.data || [];
    } catch (error: any) {
      console.error('Failed to fetch global leaderboard:', error);
      return [];
    }
  }

  // Get user's global rank
  async getGlobalRank(): Promise<number> {
    try {
      const response = await api.get('/gamification/global-rank');
      return response.data.data || 0;
    } catch (error: any) {
      console.error('Failed to fetch global rank:', error);
      return 0;
    }
  }
}

export const gamificationService = new GamificationService();
export default gamificationService;
import api from './api';

export interface WeekFeedback {
  id: string;
  studentName: string;
  studentEmail: string;
  weekTitle: string;
  courseTitle: string;
  overallRating: number;
  contentQuality: number;
  difficultyLevel: 'too_easy' | 'just_right' | 'too_hard';
  paceRating: number;
  instructorRating: number;
  materialsRating: number;
  comments: string;
  suggestions: string;
  wouldRecommend: boolean;
  favoriteAspects: string[];
  challenges: string[];
  timeSpent: number;
  completedMaterials: number;
  totalMaterials: number;
  submittedAt: string;
}

export interface CourseFeedbackStats {
  courseId: string;
  totalFeedback: number;
  averageRating: number;
  averageContentQuality: number;
  averageInstructorRating: number;
  averageMaterialsRating: number;
  averagePaceRating: number;
  difficultyDistribution: {
    too_easy: number;
    just_right: number;
    too_hard: number;
  };
  recommendationRate: number;
  feedbackByWeek: WeekFeedbackSummary[];
  topChallenges: { challenge: string; count: number }[];
  topFavorites: { aspect: string; count: number }[];
  recentFeedback: RecentFeedback[];
}

export interface WeekFeedbackSummary {
  weekId: string;
  weekTitle: string;
  feedbackCount: number;
  averageRating: number;
  feedback: WeekFeedback[];
}

export interface RecentFeedback {
  id: string;
  studentName: string;
  weekTitle: string;
  overallRating: number;
  comments: string;
  submittedAt: string;
}

export interface FeedbackResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedFeedbackResponse<T> {
  success: boolean;
  data: {
    feedback: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

class FeedbackService {
  // Get all feedback for a course (admin only)
  async getCourseFeedback(courseId: string, page = 1, limit = 20): Promise<PaginatedFeedbackResponse<WeekFeedback>> {
    try {
      const response = await api.get(`/week-feedback/course/${courseId}?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching course feedback:', error);
      throw error;
    }
  }

  // Get course feedback statistics (admin only)
  async getCourseFeedbackStats(courseId: string): Promise<FeedbackResponse<CourseFeedbackStats>> {
    try {
      const response = await api.get(`/week-feedback/course/${courseId}/stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching course feedback stats:', error);
      throw error;
    }
  }

  // Get feedback for a specific week (admin/teacher only)
  async getWeekFeedback(weekId: string, page = 1, limit = 20): Promise<PaginatedFeedbackResponse<WeekFeedback>> {
    try {
      const response = await api.get(`/week-feedback/week/${weekId}?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching week feedback:', error);
      throw error;
    }
  }

  // Get feedback statistics for a week (admin/teacher only)
  async getWeekFeedbackStats(weekId: string): Promise<FeedbackResponse<any>> {
    try {
      const response = await api.get(`/week-feedback/week/${weekId}/stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching week feedback stats:', error);
      throw error;
    }
  }

  // Submit week-end feedback (students only)
  async submitWeekFeedback(feedbackData: {
    weekId: string;
    courseId: string;
    overallRating: number;
    contentQuality?: number;
    difficultyLevel?: string;
    paceRating?: number;
    instructorRating?: number;
    materialsRating?: number;
    comments: string;
    suggestions?: string;
    wouldRecommend?: boolean;
    favoriteAspects?: string[];
    challenges?: string[];
    timeSpent?: number;
    completedMaterials?: number;
    totalMaterials?: number;
  }): Promise<FeedbackResponse<any>> {
    try {
      const response = await api.post('/week-feedback/week-end', feedbackData);
      return response.data;
    } catch (error) {
      console.error('Error submitting week feedback:', error);
      throw error;
    }
  }

  // Check if user has already submitted feedback for a week
  async hasSubmittedFeedback(weekId: string): Promise<FeedbackResponse<boolean>> {
    try {
      const response = await api.get(`/week-feedback/week/${weekId}/user/check/exists`);
      return response.data;
    } catch (error) {
      console.error('Error checking feedback submission:', error);
      throw error;
    }
  }

  // Get user's feedback history
  async getUserFeedbackHistory(userId: string, page = 1, limit = 20): Promise<PaginatedFeedbackResponse<WeekFeedback>> {
    try {
      const response = await api.get(`/week-feedback/user/${userId}?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user feedback history:', error);
      throw error;
    }
  }
}

export const feedbackService = new FeedbackService();
export default feedbackService;
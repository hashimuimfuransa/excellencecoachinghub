import api from './api';

export interface WeekFeedback {
  weekId: string;
  courseId: string;
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
}

export interface WeekFeedbackResponse {
  success: boolean;
  data: WeekFeedback;
  message?: string;
}

export interface WeekFeedbackStats {
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
  commonChallenges: Array<{ challenge: string; count: number }>;
  commonFavorites: Array<{ aspect: string; count: number }>;
}

class WeekFeedbackService {
  // Submit week-end feedback
  async submitWeekFeedback(feedback: WeekFeedback): Promise<WeekFeedbackResponse> {
    try {
      const response = await api.post('/week-feedback/week-end', feedback);
      return response.data;
    } catch (error: any) {
      console.error('Error submitting week feedback:', error);
      throw new Error(error.response?.data?.message || 'Failed to submit feedback');
    }
  }

  // Get feedback for a specific week (for admins)
  async getWeekFeedback(weekId: string): Promise<WeekFeedback[]> {
    try {
      const response = await api.get(`/week-feedback/week/${weekId}`);
      return response.data.data.feedback || [];
    } catch (error: any) {
      console.error('Error fetching week feedback:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch feedback');
    }
  }

  // Get feedback statistics for a week (for admins)
  async getWeekFeedbackStats(weekId: string): Promise<WeekFeedbackStats> {
    try {
      const response = await api.get(`/week-feedback/week/${weekId}/stats`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching week feedback stats:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch feedback statistics');
    }
  }

  // Get all feedback for a course (for admins)
  async getCourseFeedback(courseId: string): Promise<WeekFeedback[]> {
    try {
      const response = await api.get(`/week-feedback/course/${courseId}`);
      return response.data.data.feedback || [];
    } catch (error: any) {
      console.error('Error fetching course feedback:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch course feedback');
    }
  }

  // Check if user has already submitted feedback for a week
  async hasSubmittedFeedback(weekId: string, userId: string): Promise<boolean> {
    try {
      const response = await api.get(`/week-feedback/week/${weekId}/user/${userId}/exists`);
      return response.data.data || false;
    } catch (error: any) {
      console.error('Error checking feedback submission:', error);
      return false;
    }
  }

  // Get user's feedback history
  async getUserFeedbackHistory(userId: string): Promise<WeekFeedback[]> {
    try {
      const response = await api.get(`/week-feedback/user/${userId}`);
      return response.data.data.feedback || [];
    } catch (error: any) {
      console.error('Error fetching user feedback history:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch feedback history');
    }
  }
}

export const weekFeedbackService = new WeekFeedbackService();

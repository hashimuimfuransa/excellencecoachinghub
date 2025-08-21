import { apiGet, apiPost, handleApiResponse } from './api';

// Define types locally to avoid import issues
export enum InterviewType {
  TECHNICAL = 'technical',
  BEHAVIORAL = 'behavioral',
  CASE_STUDY = 'case_study',
  GENERAL = 'general'
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AIInterview {
  _id: string;
  user: any;
  job?: any;
  type: InterviewType;
  questions: any[];
  responses: any[];
  overallScore: number;
  feedback: string;
  recommendations: string[];
  strengths: string[];
  areasForImprovement: string[];
  duration: number;
  completedAt?: string;
  createdAt: string;
}

class AIInterviewService {
  // Start AI interview
  async startAIInterview(jobId?: string, type: InterviewType = InterviewType.GENERAL): Promise<AIInterview> {
    const response = await apiPost<ApiResponse<AIInterview>>('/ai-interviews/start', {
      jobId,
      type
    });
    return handleApiResponse(response);
  }

  // Submit interview response
  async submitInterviewResponse(
    interviewId: string,
    questionId: string,
    response: string,
    audioUrl?: string,
    responseTime?: number
  ): Promise<any> {
    const responseData = await apiPost<ApiResponse<any>>(
      `/ai-interviews/${interviewId}/response`,
      {
        questionId,
        response,
        audioUrl,
        responseTime
      }
    );
    return handleApiResponse(responseData);
  }

  // Complete AI interview
  async completeAIInterview(interviewId: string, duration: number): Promise<AIInterview> {
    const response = await apiPost<ApiResponse<AIInterview>>(
      `/ai-interviews/${interviewId}/complete`,
      { duration }
    );
    return handleApiResponse(response);
  }

  // Get user's interviews
  async getUserInterviews(): Promise<AIInterview[]> {
    const response = await apiGet<ApiResponse<AIInterview[]>>('/ai-interviews/my-interviews');
    return handleApiResponse(response);
  }

  // Get interview results for a job (Employer only)
  async getJobInterviews(jobId: string): Promise<AIInterview[]> {
    const response = await apiGet<ApiResponse<AIInterview[]>>(`/ai-interviews/job/${jobId}`);
    return handleApiResponse(response);
  }

  // Get interview details
  async getInterviewDetails(interviewId: string): Promise<AIInterview> {
    const response = await apiGet<ApiResponse<AIInterview>>(`/ai-interviews/${interviewId}`);
    return handleApiResponse(response);
  }

  // Check if user has completed interview for a job
  async hasCompletedInterview(jobId: string, type: InterviewType): Promise<boolean> {
    try {
      const interviews = await this.getUserInterviews();
      return interviews.some(interview => 
        interview.job?._id === jobId && 
        interview.type === type && 
        interview.completedAt
      );
    } catch (error) {
      console.error('Error checking interview status:', error);
      return false;
    }
  }

  // Get interview by job and type
  async getInterviewByJobAndType(jobId: string, type: InterviewType): Promise<AIInterview | null> {
    try {
      const interviews = await this.getUserInterviews();
      return interviews.find(interview => 
        interview.job?._id === jobId && 
        interview.type === type
      ) || null;
    } catch (error) {
      console.error('Error getting interview by job and type:', error);
      return null;
    }
  }

  // Get user's interview history
  async getUserInterviewHistory(): Promise<AIInterview[]> {
    const interviews = await this.getUserInterviews();
    return interviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Get completed interviews
  async getCompletedInterviews(): Promise<AIInterview[]> {
    const interviews = await this.getUserInterviews();
    return interviews.filter(interview => interview.completedAt);
  }

  // Get pending interviews
  async getPendingInterviews(): Promise<AIInterview[]> {
    const interviews = await this.getUserInterviews();
    return interviews.filter(interview => !interview.completedAt);
  }

  // Get interview statistics
  async getInterviewStatistics(): Promise<{
    totalInterviews: number;
    completedInterviews: number;
    averageScore: number;
    bestScore: number;
    interviewsByType: Record<InterviewType, number>;
  }> {
    const interviews = await this.getUserInterviews();
    const completed = interviews.filter(interview => interview.completedAt);
    
    const stats = {
      totalInterviews: interviews.length,
      completedInterviews: completed.length,
      averageScore: 0,
      bestScore: 0,
      interviewsByType: {} as Record<InterviewType, number>
    };

    if (completed.length > 0) {
      const totalScore = completed.reduce((sum, interview) => sum + interview.overallScore, 0);
      stats.averageScore = totalScore / completed.length;
      stats.bestScore = Math.max(...completed.map(interview => interview.overallScore));
    }

    // Count interviews by type
    Object.values(InterviewType).forEach(type => {
      stats.interviewsByType[type] = interviews.filter(interview => interview.type === type).length;
    });

    return stats;
  }

  // Get performance trends
  async getPerformanceTrends(): Promise<{
    date: string;
    score: number;
    type: InterviewType;
  }[]> {
    const interviews = await this.getCompletedInterviews();
    return interviews.map(interview => ({
      date: interview.completedAt!,
      score: interview.overallScore,
      type: interview.type
    }));
  }

  // Get strengths and weaknesses analysis
  async getStrengthsAndWeaknesses(): Promise<{
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  }> {
    const interviews = await this.getCompletedInterviews();
    
    const allStrengths: string[] = [];
    const allWeaknesses: string[] = [];
    const allRecommendations: string[] = [];

    interviews.forEach(interview => {
      allStrengths.push(...interview.strengths);
      allWeaknesses.push(...interview.areasForImprovement);
      allRecommendations.push(...interview.recommendations);
    });

    // Count occurrences and get most common
    const strengthCounts = this.countOccurrences(allStrengths);
    const weaknessCounts = this.countOccurrences(allWeaknesses);
    const recommendationCounts = this.countOccurrences(allRecommendations);

    return {
      strengths: Object.keys(strengthCounts).slice(0, 5),
      weaknesses: Object.keys(weaknessCounts).slice(0, 5),
      recommendations: Object.keys(recommendationCounts).slice(0, 5)
    };
  }

  private countOccurrences(items: string[]): Record<string, number> {
    const counts: Record<string, number> = {};
    items.forEach(item => {
      counts[item] = (counts[item] || 0) + 1;
    });
    
    // Sort by count descending
    return Object.fromEntries(
      Object.entries(counts).sort(([,a], [,b]) => b - a)
    );
  }

  // Practice interview (without job association)
  async startPracticeInterview(type: InterviewType): Promise<AIInterview> {
    return this.startAIInterview(undefined, type);
  }

  // Get available interview types
  getAvailableInterviewTypes(): { value: InterviewType; label: string; description: string }[] {
    return [
      {
        value: InterviewType.GENERAL,
        label: 'General Interview',
        description: 'Basic interview questions about your background and motivation'
      },
      {
        value: InterviewType.TECHNICAL,
        label: 'Technical Interview',
        description: 'Technical questions related to your field and skills'
      },
      {
        value: InterviewType.BEHAVIORAL,
        label: 'Behavioral Interview',
        description: 'Situational questions about your past experiences and behavior'
      },
      {
        value: InterviewType.CASE_STUDY,
        label: 'Case Study Interview',
        description: 'Problem-solving scenarios and analytical thinking questions'
      }
    ];
  }
}

export const aiInterviewService = new AIInterviewService();
export default aiInterviewService;
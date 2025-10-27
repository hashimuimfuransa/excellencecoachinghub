import { apiService } from './api';

// AI Settings interfaces
export interface AIGradingSettings {
  enabled: boolean;
  confidenceThreshold: number;
  autoGradeQuizzes: boolean;
  autoGradeAssignments: boolean;
  humanReviewRequired: boolean;
}

export interface QuizGenerationSettings {
  enabled: boolean;
  defaultDifficulty: 'easy' | 'medium' | 'hard';
  questionTypes: string[];
  maxQuestionsPerQuiz: number;
  autoGenerateFromContent: boolean;
}

export interface CheatingDetectionSettings {
  enabled: boolean;
  sensitivity: 'low' | 'medium' | 'high';
  detectionMethods: string[];
  alertThreshold: number;
  autoFlagSuspiciousActivity: boolean;
}

export interface FeedbackTemplate {
  id: string;
  name: string;
  category: string;
  template: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AISettings {
  grading: AIGradingSettings;
  quizGeneration: QuizGenerationSettings;
  cheatingDetection: CheatingDetectionSettings;
  feedbackTemplates: FeedbackTemplate[];
}

export interface UpdateAISettingsData {
  grading?: Partial<AIGradingSettings>;
  quizGeneration?: Partial<QuizGenerationSettings>;
  cheatingDetection?: Partial<CheatingDetectionSettings>;
}

export interface CreateFeedbackTemplateData {
  name: string;
  category: string;
  template: string;
  variables: string[];
}

export interface UpdateFeedbackTemplateData {
  name?: string;
  category?: string;
  template?: string;
  variables?: string[];
  isActive?: boolean;
}

export const aiService = {
  // Get AI settings
  getAISettings: async (): Promise<AISettings> => {
    const response = await apiService.get<AISettings>('/ai/settings');
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to fetch AI settings');
  },

  // Update AI settings
  updateAISettings: async (settings: UpdateAISettingsData): Promise<AISettings> => {
    const response = await apiService.put<AISettings>('/ai/settings', settings);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to update AI settings');
  },

  // Get feedback templates
  getFeedbackTemplates: async (): Promise<FeedbackTemplate[]> => {
    const response = await apiService.get<{ templates: FeedbackTemplate[] }>('/ai/feedback-templates');
    
    if (response.success && response.data) {
      return response.data.templates;
    }
    
    throw new Error(response.error || 'Failed to fetch feedback templates');
  },

  // Create feedback template
  createFeedbackTemplate: async (templateData: CreateFeedbackTemplateData): Promise<FeedbackTemplate> => {
    const response = await apiService.post<{ template: FeedbackTemplate }>('/ai/feedback-templates', templateData);
    
    if (response.success && response.data) {
      return response.data.template;
    }
    
    throw new Error(response.error || 'Failed to create feedback template');
  },

  // Update feedback template
  updateFeedbackTemplate: async (id: string, templateData: UpdateFeedbackTemplateData): Promise<FeedbackTemplate> => {
    const response = await apiService.put<{ template: FeedbackTemplate }>(`/ai/feedback-templates/${id}`, templateData);
    
    if (response.success && response.data) {
      return response.data.template;
    }
    
    throw new Error(response.error || 'Failed to update feedback template');
  },

  // Delete feedback template
  deleteFeedbackTemplate: async (id: string): Promise<void> => {
    const response = await apiService.delete(`/ai/feedback-templates/${id}`);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete feedback template');
    }
  },

  // Test AI grading
  testAIGrading: async (content: string): Promise<any> => {
    const response = await apiService.post('/ai/test-grading', { content });
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to test AI grading');
  },

  // Generate quiz questions
  generateQuizQuestions: async (topic: string, difficulty: string, count: number): Promise<any[]> => {
    const response = await apiService.post<{ questions: any[] }>('/ai/generate-quiz', {
      topic,
      difficulty,
      count
    });
    
    if (response.success && response.data) {
      return response.data.questions;
    }
    
    throw new Error(response.error || 'Failed to generate quiz questions');
  },

  // Generate section quiz
  generateSectionQuiz: async (params: {
    courseId: string;
    sectionId: string;
    sectionTitle: string;
    sectionContent: string;
    difficulty?: string;
    questionCount?: number;
  }): Promise<any> => {
    try {
      const response = await apiService.post('/ai/generate-section-quiz', {
        ...params,
        difficulty: params.difficulty || 'medium',
        questionCount: params.questionCount || 5
      });
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to generate section quiz');
    } catch (error: any) {
      console.error('Failed to generate section quiz:', error);
      // Return a fallback quiz structure
      return {
        id: `quiz_${params.sectionId}_${Date.now()}`,
        sectionId: params.sectionId,
        title: `Quiz: ${params.sectionTitle}`,
        questions: [],
        totalPoints: 0,
        estimatedTime: 5
      };
    }
  },

  // Evaluate quiz answers
  evaluateQuizAnswers: async (params: {
    courseId: string;
    sectionId: string;
    quizId: string;
    answers: Record<string, any>;
  }): Promise<any> => {
    try {
      const response = await apiService.post('/ai/evaluate-quiz-answers', params);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to evaluate quiz answers');
    } catch (error: any) {
      console.error('Failed to evaluate quiz answers:', error);
      // Return a fallback evaluation
      return {
        score: 0,
        percentage: 0,
        passed: false,
        feedback: 'Unable to evaluate answers at this time.',
        detailedResults: []
      };
    }
  }
};

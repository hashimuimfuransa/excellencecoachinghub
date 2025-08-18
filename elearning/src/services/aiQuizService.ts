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

export interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'fill-blank';
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  timeLimit?: number;
  hints?: string[];
}

export interface GeneratedQuiz {
  id: string;
  sectionId: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  totalPoints: number;
  estimatedTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  createdAt: Date;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  studentId: string;
  answers: Record<string, any>;
  score: number;
  percentage: number;
  timeSpent: number;
  completedAt: Date;
  feedback: string;
  detailedResults: Array<{
    questionId: string;
    isCorrect: boolean;
    studentAnswer: any;
    correctAnswer: any;
    explanation: string;
    pointsEarned: number;
  }>;
}

export interface QuizGenerationRequest {
  sectionId: string;
  content: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionCount: number;
  questionTypes: string[];
  focusAreas?: string[];
  learningObjectives?: string[];
}

class AIQuizService {
  // Generate quiz from section content using Gemini AI
  async generateQuizFromSection(request: QuizGenerationRequest): Promise<GeneratedQuiz> {
    try {
      const response = await api.post('/ai/generate-quiz', request);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to generate quiz:', error);
      throw new Error(error.response?.data?.message || 'Failed to generate quiz');
    }
  }

  // Get generated quiz by section ID
  async getQuizBySection(sectionId: string): Promise<GeneratedQuiz | null> {
    try {
      const response = await api.get(`/ai/quiz/section/${sectionId}`);
      return response.data.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('Failed to fetch quiz:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch quiz');
    }
  }

  // Start quiz attempt
  async startQuizAttempt(quizId: string): Promise<{ attemptId: string; quiz: GeneratedQuiz }> {
    try {
      const response = await api.post(`/ai/quiz/${quizId}/start`);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to start quiz attempt:', error);
      throw new Error(error.response?.data?.message || 'Failed to start quiz attempt');
    }
  }

  // Submit quiz answer
  async submitQuizAnswer(attemptId: string, questionId: string, answer: any): Promise<void> {
    try {
      await api.post(`/ai/quiz/attempt/${attemptId}/answer`, {
        questionId,
        answer
      });
    } catch (error: any) {
      console.error('Failed to submit answer:', error);
      // Don't throw error for individual answer submissions
    }
  }

  // Submit complete quiz attempt
  async submitQuizAttempt(attemptId: string, answers: Record<string, any>): Promise<QuizAttempt> {
    try {
      const response = await api.post(`/ai/quiz/attempt/${attemptId}/submit`, {
        answers
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to submit quiz attempt:', error);
      throw new Error(error.response?.data?.message || 'Failed to submit quiz attempt');
    }
  }

  // Get quiz attempt results
  async getQuizAttemptResults(attemptId: string): Promise<QuizAttempt> {
    try {
      const response = await api.get(`/ai/quiz/attempt/${attemptId}/results`);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to fetch quiz results:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch quiz results');
    }
  }

  // Get student's quiz attempts for a section
  async getStudentQuizAttempts(sectionId: string): Promise<QuizAttempt[]> {
    try {
      const response = await api.get(`/ai/quiz/section/${sectionId}/attempts`);
      return response.data.data || [];
    } catch (error: any) {
      console.error('Failed to fetch quiz attempts:', error);
      return [];
    }
  }

  // Get quiz statistics
  async getQuizStatistics(quizId: string): Promise<any> {
    try {
      const response = await api.get(`/ai/quiz/${quizId}/statistics`);
      return response.data.data || {
        totalAttempts: 0,
        averageScore: 0,
        passRate: 0,
        averageTime: 0
      };
    } catch (error: any) {
      console.error('Failed to fetch quiz statistics:', error);
      return {
        totalAttempts: 0,
        averageScore: 0,
        passRate: 0,
        averageTime: 0
      };
    }
  }

  // Generate adaptive questions based on student performance
  async generateAdaptiveQuestions(sectionId: string, studentPerformance: any): Promise<QuizQuestion[]> {
    try {
      const response = await api.post('/ai/generate-adaptive-questions', {
        sectionId,
        studentPerformance
      });
      return response.data.data || [];
    } catch (error: any) {
      console.error('Failed to generate adaptive questions:', error);
      return [];
    }
  }

  // Get personalized study recommendations
  async getStudyRecommendations(sectionId: string, quizResults: QuizAttempt[]): Promise<any> {
    try {
      const response = await api.post('/ai/study-recommendations', {
        sectionId,
        quizResults
      });
      return response.data.data || {
        weakAreas: [],
        recommendedTopics: [],
        studyTips: [],
        nextSteps: []
      };
    } catch (error: any) {
      console.error('Failed to get study recommendations:', error);
      return {
        weakAreas: [],
        recommendedTopics: [],
        studyTips: [],
        nextSteps: []
      };
    }
  }

  // Generate explanation for incorrect answers
  async generateExplanation(questionId: string, studentAnswer: any, correctAnswer: any): Promise<string> {
    try {
      const response = await api.post('/ai/generate-explanation', {
        questionId,
        studentAnswer,
        correctAnswer
      });
      return response.data.data.explanation || 'No explanation available.';
    } catch (error: any) {
      console.error('Failed to generate explanation:', error);
      return 'No explanation available.';
    }
  }

  // Get quiz hints using AI
  async getQuizHint(questionId: string, currentAnswer?: any): Promise<string> {
    try {
      const response = await api.post('/ai/quiz-hint', {
        questionId,
        currentAnswer
      });
      return response.data.data.hint || 'No hint available.';
    } catch (error: any) {
      console.error('Failed to get quiz hint:', error);
      return 'No hint available.';
    }
  }

  // Analyze learning progress using AI
  async analyzeLearningProgress(courseId: string, sectionId?: string): Promise<any> {
    try {
      const response = await api.post('/ai/analyze-progress', {
        courseId,
        sectionId
      });
      return response.data.data || {
        overallProgress: 0,
        strengths: [],
        weaknesses: [],
        recommendations: [],
        nextMilestones: []
      };
    } catch (error: any) {
      console.error('Failed to analyze learning progress:', error);
      return {
        overallProgress: 0,
        strengths: [],
        weaknesses: [],
        recommendations: [],
        nextMilestones: []
      };
    }
  }

  // Generate practice questions for weak areas
  async generatePracticeQuestions(weakAreas: string[], difficulty: string = 'medium'): Promise<QuizQuestion[]> {
    try {
      const response = await api.post('/ai/generate-practice-questions', {
        weakAreas,
        difficulty
      });
      return response.data.data || [];
    } catch (error: any) {
      console.error('Failed to generate practice questions:', error);
      return [];
    }
  }

  // Get AI-powered study plan
  async generateStudyPlan(courseId: string, studentGoals: any): Promise<any> {
    try {
      const response = await api.post('/ai/generate-study-plan', {
        courseId,
        studentGoals
      });
      return response.data.data || {
        dailyTasks: [],
        weeklyGoals: [],
        milestones: [],
        estimatedCompletion: null
      };
    } catch (error: any) {
      console.error('Failed to generate study plan:', error);
      return {
        dailyTasks: [],
        weeklyGoals: [],
        milestones: [],
        estimatedCompletion: null
      };
    }
  }

  // Validate quiz question using AI
  async validateQuizQuestion(question: Partial<QuizQuestion>): Promise<{
    isValid: boolean;
    suggestions: string[];
    improvedQuestion?: QuizQuestion;
  }> {
    try {
      const response = await api.post('/ai/validate-question', question);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to validate question:', error);
      return {
        isValid: false,
        suggestions: ['Unable to validate question at this time.']
      };
    }
  }

  // Generate quiz summary and insights
  async generateQuizSummary(attemptId: string): Promise<{
    summary: string;
    insights: string[];
    recommendations: string[];
    nextSteps: string[];
  }> {
    try {
      const response = await api.post(`/ai/quiz/attempt/${attemptId}/summary`);
      return response.data.data || {
        summary: '',
        insights: [],
        recommendations: [],
        nextSteps: []
      };
    } catch (error: any) {
      console.error('Failed to generate quiz summary:', error);
      return {
        summary: 'Unable to generate summary at this time.',
        insights: [],
        recommendations: [],
        nextSteps: []
      };
    }
  }

  // Get AI-powered flashcards for section
  async generateFlashcards(sectionId: string, count: number = 10): Promise<Array<{
    id: string;
    front: string;
    back: string;
    difficulty: string;
    tags: string[];
  }>> {
    try {
      const response = await api.post('/ai/generate-flashcards', {
        sectionId,
        count
      });
      return response.data.data || [];
    } catch (error: any) {
      console.error('Failed to generate flashcards:', error);
      return [];
    }
  }

  // Get concept map for section
  async generateConceptMap(sectionId: string): Promise<{
    nodes: Array<{ id: string; label: string; type: string }>;
    edges: Array<{ from: string; to: string; label: string }>;
  }> {
    try {
      const response = await api.post('/ai/generate-concept-map', {
        sectionId
      });
      return response.data.data || { nodes: [], edges: [] };
    } catch (error: any) {
      console.error('Failed to generate concept map:', error);
      return { nodes: [], edges: [] };
    }
  }
}

export const aiQuizService = new AIQuizService();
export default aiQuizService;
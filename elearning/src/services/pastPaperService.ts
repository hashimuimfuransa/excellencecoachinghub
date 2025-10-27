import api from './api';

export interface PastPaper {
  _id: string;
  title: string;
  description: string;
  subject: string;
  level: 'O-Level' | 'A-Level' | 'University' | 'Professional' | 'General';
  year: number;
  examBoard?: string;
  duration: number;
  totalMarks: number;
  totalAttempts: number;
  averageScore: number;
  difficultyRating: number;
  tags: string[];
  isPublished: boolean;
  publishedAt: string;
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  questions: Array<{
    id: string;
    question: string;
    type: string;
    points: number;
    section?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
  }>;
}

export interface PastPaperAttempt {
  _id: string;
  pastPaper: string;
  attemptNumber: number;
  score: number;
  percentage: number;
  maxScore: number;
  startTime: string;
  endTime?: string;
  timeSpent?: number;
  status: 'in_progress' | 'completed' | 'abandoned';
  correctAnswers: number;
  incorrectAnswers: number;
  unansweredQuestions: number;
  feedback?: string;
  recommendations: string[];
  strengths: string[];
  weaknesses: string[];
  questionResults: Array<{
    questionId: string;
    studentAnswer: any;
    correctAnswer: any;
    isCorrect: boolean;
    pointsEarned: number;
    pointsPossible: number;
    explanation?: string;
    topic?: string;
  }>;
}

export interface PastPaperFilters {
  subject?: string;
  level?: string;
  year?: number;
  examBoard?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PastPaperResponse {
  success: boolean;
  data: {
    pastPapers: PastPaper[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  };
}

class PastPaperService {
  // Get all past papers with filters
  async getPastPapers(filters: PastPaperFilters = {}): Promise<PastPaperResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/past-papers?${params}`);
    return response.data;
  }

  // Get past paper by ID
  async getPastPaperById(id: string): Promise<{ success: boolean; data: PastPaper }> {
    const response = await api.get(`/past-papers/${id}`);
    return response.data;
  }

  // Get past paper questions for taking exam
  async getPastPaperQuestions(id: string, randomize: boolean = false): Promise<{
    success: boolean;
    data: {
      pastPaper: PastPaper;
      questions: any[];
    };
  }> {
    const response = await api.get(`/past-papers/${id}/questions?randomize=${randomize}`);
    return response.data;
  }

  // Start past paper attempt
  async startPastPaperAttempt(id: string): Promise<{
    success: boolean;
    data: {
      attemptId: string;
      pastPaper: PastPaper;
      settings: any;
    };
  }> {
    const response = await api.post(`/past-papers/${id}/start`);
    return response.data;
  }

  // Submit past paper attempt
  async submitPastPaperAttempt(attemptId: string, answers: Record<string, any>, questionResults: any[]): Promise<{
    success: boolean;
    data: {
      attempt: PastPaperAttempt;
    };
  }> {
    const response = await api.post(`/past-papers/attempts/${attemptId}/submit`, {
      answers,
      questionResults
    });
    return response.data;
  }

  // Get student's past paper attempts
  async getStudentAttempts(pastPaperId?: string): Promise<{
    success: boolean;
    data: PastPaperAttempt[];
  }> {
    const params = pastPaperId ? `?pastPaperId=${pastPaperId}` : '';
    const response = await api.get(`/past-papers/student/attempts${params}`);
    return response.data;
  }

  // Get student progress
  async getStudentProgress(): Promise<{
    success: boolean;
    data: {
      totalAttempts: number;
      averageScore: number;
      bestScore: number;
      improvementRate: number;
      strongTopics: string[];
      weakTopics: string[];
    };
  }> {
    const response = await api.get('/past-papers/student/progress');
    return response.data;
  }

  // Get popular past papers
  async getPopularPastPapers(limit: number = 10): Promise<{
    success: boolean;
    data: PastPaper[];
  }> {
    const response = await api.get(`/past-papers/popular?limit=${limit}`);
    return response.data;
  }

  // Get recent past papers
  async getRecentPastPapers(limit: number = 10): Promise<{
    success: boolean;
    data: PastPaper[];
  }> {
    const response = await api.get(`/past-papers/recent?limit=${limit}`);
    return response.data;
  }

  // Search past papers
  async searchPastPapers(query: string, filters: Omit<PastPaperFilters, 'search'> = {}): Promise<{
    success: boolean;
    data: PastPaper[];
  }> {
    const params = new URLSearchParams({ q: query });
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/past-papers/search?${params}`);
    return response.data;
  }
}

export default new PastPaperService();

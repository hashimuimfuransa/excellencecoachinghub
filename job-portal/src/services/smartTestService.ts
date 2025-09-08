import { apiGet, apiPost, apiPut, apiDelete, handleApiResponse, handlePaginatedResponse } from './api';

interface SmartTestQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'case_study' | 'coding_challenge' | 'situational' | 'technical';
  options?: string[];
  correctAnswer: any;
  explanation: string;
  category: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
}

interface SmartTest {
  _id: string;
  testId: string;
  title: string;
  description: string;
  jobId: string;
  jobTitle: string;
  company: string;
  userId: string;
  questions: SmartTestQuestion[];
  timeLimit: number; // in minutes
  difficulty: 'basic' | 'intermediate' | 'advanced';
  questionCount: number;
  industry?: string;
  jobRole: string;
  skillsRequired: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SmartTestResult {
  _id: string;
  testId: string;
  userId: string;
  jobId: string;
  answers: Record<string, any>;
  score: number;
  percentageScore: number;
  correctAnswers: number;
  incorrectAnswers: number;
  timeSpent: number;
  isCompleted: boolean;
  detailedResults: Array<{
    questionId: string;
    question: string;
    userAnswer: any;
    correctAnswer: any;
    isCorrect: boolean;
    explanation: string;
    category: string;
  }>;
  feedback: {
    overall: string;
    strengths: string[];
    improvements: string[];
    recommendations: string[];
  };
  createdAt: string;
  completedAt?: string;
}

interface GenerateSmartTestRequest {
  jobId: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  questionCount: number;
  testType?: 'free' | 'premium';
}

class SmartTestService {
  // Generate a free smart test (one-time only)
  async generateFreeSmartTest(request: Omit<GenerateSmartTestRequest, 'testType'>): Promise<SmartTest> {
    const response = await apiPost<any>('/smart-tests/generate-free', { ...request, testType: 'free' });
    return handleApiResponse(response);
  }

  // Generate a premium smart test (requires payment approval)
  async generatePremiumSmartTest(request: Omit<GenerateSmartTestRequest, 'testType'>): Promise<SmartTest> {
    const response = await apiPost<any>('/smart-tests/generate-premium', { ...request, testType: 'premium' });
    return handleApiResponse(response);
  }

  // Check if user has used their free test
  async checkFreeTestStatus(): Promise<{ 
    hasUsedFreeTest: boolean; 
    canUseFreeTest: boolean;
    permanentlyLocked: boolean;
    freeTestId: string | null;
    usedAt: string | null;
    permanentLockDate: string | null;
    message: string;
  }> {
    const response = await apiGet<any>('/smart-tests/free-test-status');
    return handleApiResponse(response);
  }

  // Generate a new smart test for a specific job (legacy method)
  async generateSmartTest(request: GenerateSmartTestRequest): Promise<SmartTest> {
    const response = await apiPost<any>('/smart-tests/generate', request);
    return handleApiResponse(response);
  }

  // Get user's smart tests
  async getUserSmartTests(): Promise<SmartTest[]> {
    const response = await apiGet<any>('/smart-tests/user');
    return handleApiResponse(response);
  }

  // Get admin uploaded smart tests
  async getAdminSmartTests(): Promise<any[]> {
    try {
      const response = await apiGet<any>('/smart-tests/admin');
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error fetching admin smart tests:', error);
      return [];
    }
  }

  // Get smart test by ID
  async getSmartTestById(testId: string): Promise<SmartTest> {
    const response = await apiGet<any>(`/smart-tests/${testId}`);
    return handleApiResponse(response);
  }

  // Start a smart test session
  async startSmartTest(testId: string): Promise<{ sessionId: string; test: SmartTest }> {
    const response = await apiPost<any>(`/smart-tests/${testId}/start`, {});
    return handleApiResponse(response);
  }

  // Submit smart test answers
  async submitSmartTest(
    testId: string, 
    sessionId: string, 
    answers: Record<string, any>,
    timeSpent: number
  ): Promise<SmartTestResult> {
    const response = await apiPost<any>(`/smart-tests/${testId}/submit`, {
      sessionId,
      answers,
      timeSpent
    });
    return handleApiResponse(response);
  }

  // Get user's smart test results
  async getUserSmartTestResults(): Promise<SmartTestResult[]> {
    const response = await apiGet<any>('/smart-tests/results');
    return handleApiResponse(response);
  }

  // Get smart test result by ID
  async getSmartTestResult(resultId: string): Promise<SmartTestResult> {
    const response = await apiGet<any>(`/smart-tests/results/${resultId}`);
    return handleApiResponse(response);
  }

  // Delete a smart test
  async deleteSmartTest(testId: string): Promise<void> {
    const response = await apiDelete<any>(`/smart-tests/${testId}`);
    handleApiResponse(response);
  }

  // Get smart tests by job ID
  async getSmartTestsByJob(jobId: string): Promise<SmartTest[]> {
    const response = await apiGet<any>(`/smart-tests/job/${jobId}`);
    return handleApiResponse(response);
  }

  // Start admin test with AI-selected questions
  async startAdminTest(testId: string, options?: { questionCount?: number; randomize?: boolean }): Promise<{ 
    sessionId: string; 
    test: SmartTest; 
    questions: any[]; 
    timeLimit: number; 
    totalQuestions: number; 
    randomized: boolean;
  }> {
    const response = await apiPost<any>(`/smart-tests/admin/${testId}/start-admin-test`, options || {});
    return handleApiResponse(response);
  }
}

export const smartTestService = new SmartTestService();
export type { SmartTest, SmartTestResult, SmartTestQuestion, GenerateSmartTestRequest };
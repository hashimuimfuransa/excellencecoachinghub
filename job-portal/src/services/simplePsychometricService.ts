import { apiGet, apiPost } from './api';

export interface SimpleTestSession {
  sessionId: string;
  questions: Array<{
    id: number;
    question: string;
    options: string[];
    category: string;
  }>;
  timeLimit: number;
  startedAt: string;
  job: {
    _id: string;
    title: string;
    company: string;
    industry: string;
  };
}

export interface SimpleTestResult {
  resultId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  timeSpent: number;
  categoryScores: Record<string, number>;
  interpretation: string;
  recommendations: string[];
  grade: string;
  percentile: number;
  hasDetailedResults: boolean;
  // Additional fields that might come from detailed analysis
  correctQuestions?: any[];
  failedQuestions?: any[];
  detailedResults?: any[];
}

class SimplePsychometricService {
  // Generate a simple psychometric test
  async generateSimpleTest(params: {
    jobId: string;
    jobTitle: string;
    jobDescription: string;
    requiredSkills: string[];
    experienceLevel: string;
    industry: string;
    testType?: 'basic' | 'premium';
    questionCount?: number;
    timeLimit?: number;
  }): Promise<{ testSessionId: string; jobTitle: string; testLevel: string; questionCount: number; timeLimit: number; instructions: string }> {
    try {
      console.log('🚀 Generating simple psychometric test:', params);
      
      // Determine level based on test type and question count
      let levelId = 'easy'; // default
      if (params.testType === 'premium' || (params.questionCount && params.questionCount > 30)) {
        levelId = 'hard';
      } else if (params.questionCount && params.questionCount > 20) {
        levelId = 'intermediate';
      }
      
      // Send the correct parameters that the backend expects
      const requestData = {
        jobId: params.jobId,
        levelId: levelId
      };
      
      console.log('📤 Sending request data:', requestData);
      
      const response = await apiPost('/psychometric-tests/generate-test', requestData) as {
        success: boolean;
        data?: any;
        error?: string;
      };
      
      if (response.success) {
        console.log('✅ Simple test generated successfully:', response.data);
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to generate simple test');
      }
    } catch (error: any) {
      console.error('❌ Error generating simple test:', error);
      throw new Error(error.message || 'Failed to generate simple test');
    }
  }

  // Start a simple test session
  async startSimpleTestSession(sessionId: string): Promise<SimpleTestSession> {
    try {
      console.log('🎯 Starting simple test session:', sessionId);
      
      const response = await apiGet(`/psychometric-tests/start/${sessionId}`);
      
      if (response.success) {
        console.log('✅ Simple test session started:', response.data);
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to start simple test session');
      }
    } catch (error: any) {
      console.error('❌ Error starting simple test session:', error);
      throw new Error(error.message || 'Failed to start test session');
    }
  }

  // Get test session details (for direct access)
  async getTestSession(sessionId: string): Promise<SimpleTestSession> {
    try {
      console.log('🔍 Getting test session:', sessionId);
      
      // Validate sessionId before making the API call
      if (!sessionId || sessionId === 'undefined' || sessionId.trim() === '') {
        throw new Error('Valid session ID is required');
      }

      // Validate ObjectId format
      if (!/^[0-9a-fA-F]{24}$/.test(sessionId)) {
        throw new Error('Invalid session ID format');
      }
      
      const response = await apiGet(`/psychometric-tests/session/${sessionId}`);
      
      if (response.success) {
        console.log('✅ Test session retrieved:', response.data);
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to get test session');
      }
    } catch (error: any) {
      console.error('❌ Error getting test session:', error);
      throw new Error(error.message || 'Failed to get test session');
    }
  }

  // Submit simple test answers
  async submitSimpleTest(sessionId: string, answers: number[], timeSpent?: number): Promise<SimpleTestResult> {
    try {
      console.log('📝 Submitting simple test:', { sessionId, answers, timeSpent });
      
      // Validate sessionId before making the API call
      if (!sessionId || sessionId === 'undefined' || sessionId.trim() === '') {
        throw new Error('Valid session ID is required');
      }

      // Validate ObjectId format
      if (!/^[0-9a-fA-F]{24}$/.test(sessionId)) {
        throw new Error('Invalid session ID format');
      }
      
      const response = await apiPost(`/psychometric-tests/submit/${sessionId}`, {
        answers,
        timeSpent: timeSpent || 0
      });
      
      if (response.success) {
        console.log('✅ Simple test submitted successfully:', response.data);
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to submit simple test');
      }
    } catch (error: any) {
      console.error('❌ Error submitting simple test:', error);
      throw new Error(error.message || 'Failed to submit test');
    }
  }

  // Get simple test result
  async getSimpleTestResult(sessionId: string): Promise<SimpleTestResult> {
    try {
      console.log('📊 Getting simple test result:', sessionId);
      
      const response = await apiGet(`/psychometric-tests/result/${sessionId}`);
      
      if (response.success) {
        console.log('✅ Simple test result retrieved:', response.data);
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to get simple test result');
      }
    } catch (error: any) {
      console.error('❌ Error getting simple test result:', error);
      throw new Error(error.message || 'Failed to get test result');
    }
  }

  // Get user's simple test history
  async getSimpleTestHistory(): Promise<SimpleTestResult[]> {
    try {
      console.log('📋 Getting simple test history');
      
      const response = await apiGet('/psychometric-tests/my-results');
      
      if (response.success) {
        console.log('✅ Simple test history retrieved:', response.data);
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to get simple test history');
      }
    } catch (error: any) {
      console.error('❌ Error getting simple test history:', error);
      throw new Error(error.message || 'Failed to get test history');
    }
  }
}

export const simplePsychometricService = new SimplePsychometricService();
export default simplePsychometricService;
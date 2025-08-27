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
  sessionId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number;
  categoryScores: Record<string, number>;
  feedback: string;
  passed: boolean;
}

class SimplePsychometricService {
  // Generate a simple psychometric test
  async generateSimpleTest(params: {
    jobTitle: string;
    jobDescription: string;
    requiredSkills: string[];
    experienceLevel: string;
    industry: string;
    testType?: string;
    questionCount?: number;
    timeLimit?: number;
  }): Promise<{ testSessionId: string; jobTitle: string; testLevel: number; questionCount: number; timeLimit: number; instructions: string }> {
    try {
      console.log('🚀 Generating simple psychometric test:', params);
      
      const response = await apiPost('/psychometric-tests/generate-simple', params);
      
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

  // Submit simple test answers
  async submitSimpleTest(sessionId: string, answers: number[], timeSpent: number): Promise<SimpleTestResult> {
    try {
      console.log('📝 Submitting simple test:', { sessionId, answers, timeSpent });
      
      const response = await apiPost(`/psychometric-tests/submit/${sessionId}`, {
        answers,
        timeSpent
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
      
      const response = await apiGet('/psychometric-tests/simple-history');
      
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
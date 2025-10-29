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
    categories?: string[];
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
        levelId: levelId,
        categories: params.categories && params.categories.length > 0 ? params.categories : undefined
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
      
      // Handle specific backend error responses
      if (error.response?.data?.error === 'FREE_TEST_ALREADY_USED') {
        throw new Error(error.response.data.message || 'FREE_TEST_ALREADY_USED: You have already used your one-time free test.');
      }
      
      // Handle other API errors
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
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
      console.log('🔍 Getting test session:', {
        sessionId,
        sessionIdType: typeof sessionId,
        sessionIdLength: sessionId?.length,
        isNewTab: document.referrer === '' || window.opener !== null,
        currentUrl: window.location.href
      });
      
      // Enhanced validation for new tab scenarios
      if (!sessionId || sessionId === 'undefined' || sessionId === 'null' || sessionId.trim() === '') {
        console.error('❌ Session ID validation failed for getTestSession:', { 
          sessionId, 
          type: typeof sessionId,
          isNewTab: document.referrer === '' || window.opener !== null
        });
        throw new Error(`Valid session ID is required for test session. Current value: "${sessionId}". This often happens when opening tests in new tabs - ensure the session ID is properly passed in the URL.`);
      }

      // Validate ObjectId format
      if (!/^[0-9a-fA-F]{24}$/.test(sessionId)) {
        console.error('❌ Invalid session ID format for getTestSession:', { 
          sessionId, 
          length: sessionId.length,
          expectedFormat: '24-character hexadecimal string'
        });
        throw new Error(`Invalid session ID format. Expected 24-character ObjectId, got: "${sessionId}" (${sessionId.length} characters)`);
      }
      
      // Check local storage for completed tests (client-side prevention)
      const isCompletedLocally = localStorage.getItem(`testCompleted_${sessionId}`);
      if (isCompletedLocally === 'true') {
        console.log('⚠️ Test already completed (local check):', sessionId);
        throw new Error('This test has already been completed. You can only take each test once. Please request a new test from your super admin if needed.');
      }
      
      const response = await apiGet(`/psychometric-tests/session/${sessionId}`) as any;
      
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
  async submitSimpleTest(sessionId: string, answers: number[], timeSpent?: number, jobId?: string, testType?: 'free' | 'premium'): Promise<SimpleTestResult> {
    try {
      console.log('📝 Submitting simple test:', { 
        sessionId, 
        sessionIdType: typeof sessionId,
        sessionIdLength: sessionId?.length,
        answers, 
        timeSpent,
        isNewTab: document.referrer === '' || window.opener !== null
      });
      
      // Enhanced validation for new tab scenarios
      if (!sessionId || sessionId === 'undefined' || sessionId === 'null' || sessionId.trim() === '') {
        console.error('❌ Session validation failed:', { 
          sessionId, 
          type: typeof sessionId,
          isNewTab: document.referrer === '' || window.opener !== null
        });
        throw new Error(`Valid session ID is required. Current value: "${sessionId}". This often happens when opening tests in new tabs - ensure the session ID is properly passed in the URL.`);
      }

      // Validate ObjectId format
      if (!/^[0-9a-fA-F]{24}$/.test(sessionId)) {
        console.error('❌ Invalid session ID format:', { 
          sessionId, 
          length: sessionId.length,
          expectedFormat: '24-character hexadecimal string'
        });
        throw new Error(`Invalid session ID format. Expected 24-character ObjectId, got: "${sessionId}" (${sessionId.length} characters)`);
      }
      
      const response = await apiPost(`/psychometric-tests/submit/${sessionId}`, {
        answers,
        timeSpent: timeSpent || 0
      }) as any;
      
      if (response.success) {
        console.log('✅ Simple test submitted successfully:', response.data);
        
        // Mark test as completed to prevent retaking
        localStorage.setItem(`testCompleted_${sessionId}`, 'true');
        
        // Also mark specific job test as completed if job info is provided
        if (jobId && testType) {
          const jobTestKey = `testCompleted_${jobId}_${testType}`;
          localStorage.setItem(jobTestKey, 'true');
          console.log('✅ Marked job-specific test as completed:', jobTestKey);
        }
        
        return response.data;
      } else {
        // Check if error indicates test was already submitted
        if (response.error && response.error.includes('already submitted')) {
          throw new Error('This test has already been submitted. You can only take each test once.');
        }
        throw new Error(response.error || 'Failed to submit simple test');
      }
    } catch (error: any) {
      console.error('❌ Error submitting simple test:', error);
      
      // Provide specific error messages for common scenarios
      if (error.message.includes('already submitted') || error.message.includes('already completed')) {
        throw new Error('This test has already been completed. You can only take each test once. Please request a new test from your super admin if needed.');
      }
      
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

// Helper function to create new tab-friendly test URLs
export const createTestUrl = (sessionId: string, jobTitle?: string, company?: string): string => {
  // Validate session ID before creating URL
  if (!sessionId || sessionId === 'undefined' || sessionId === 'null' || sessionId.trim() === '') {
    throw new Error('Valid session ID is required to create test URL');
  }
  
  if (!/^[0-9a-fA-F]{24}$/.test(sessionId)) {
    throw new Error('Invalid session ID format for URL creation');
  }
  
  // Store session ID for recovery in new tabs
  sessionStorage.setItem('currentTestSessionId', sessionId);
  localStorage.setItem('currentTestSessionId', sessionId);
  
  const params = new URLSearchParams();
  params.set('sessionId', sessionId);
  
  if (jobTitle) params.set('jobTitle', jobTitle);
  if (company) params.set('company', company);
  
  const url = `/test-taking?${params.toString()}`;
  console.log('🔗 Created new tab-friendly test URL:', url);
  
  return url;
};

// Check if user has available tests to take (not completed all their approved tests)
export const hasAvailableTests = async (): Promise<boolean> => {
  try {
    // Check local storage for completed tests
    const completedTests = Object.keys(localStorage)
      .filter(key => key.startsWith('testCompleted_'))
      .map(key => key.replace('testCompleted_', ''));
    
    console.log('📊 User completed tests (local):', completedTests.length);
    
    // For now, return true if user has less than 5 completed tests
    // This can be enhanced to check against actual approved tests from backend
    return completedTests.length < 5;
  } catch (error) {
    console.error('❌ Error checking available tests:', error);
    // Default to true to allow access in case of error
    return true;
  }
};

// Check if user should be redirected to test request instead of jobs
export const shouldRequestNewTest = (completedTestsCount: number = 0): boolean => {
  // If user has completed tests but no new approved tests available
  const completedTests = Object.keys(localStorage)
    .filter(key => key.startsWith('testCompleted_'));
  
  console.log('🔍 Checking if user should request new test:', {
    localCompletedTests: completedTests.length,
    passedCompletedCount: completedTestsCount
  });
  
  // If they have completed tests, they should request new ones before accessing jobs
  return completedTests.length > 0 || completedTestsCount > 0;
};

// Check if a specific job test has been completed
export const hasCompletedJobTest = (jobId: string, testType: 'free' | 'premium' = 'premium'): boolean => {
  const testKey = `testCompleted_${jobId}_${testType}`;
  return localStorage.getItem(testKey) !== null;
};

// Check if any test has been completed (for general UI state)
export const hasCompletedAnyTest = (): boolean => {
  const completedTests = Object.keys(localStorage)
    .filter(key => key.startsWith('testCompleted_'));
  return completedTests.length > 0;
};

// Migration function to retroactively mark job-specific completions
// This helps users who completed tests before the new tracking system
export const migrateOldCompletions = (approvedJobIds: string[] = []): void => {
  try {
    const allCompletedTests = Object.keys(localStorage)
      .filter(key => key.startsWith('testCompleted_') && !key.includes('_free') && !key.includes('_premium'));
    
    console.log('🔄 Migrating old test completions:', {
      oldCompletions: allCompletedTests,
      approvedJobIds
    });
    
    // For each old completion that doesn't have job-specific tracking
    allCompletedTests.forEach(testKey => {
      // If user has approved jobs, mark them as completed for premium tests
      approvedJobIds.forEach(jobId => {
        const jobTestKey = `testCompleted_${jobId}_premium`;
        if (!localStorage.getItem(jobTestKey)) {
          localStorage.setItem(jobTestKey, 'true');
          console.log('✅ Migrated completion for job:', jobId);
        }
      });
    });
  } catch (error) {
    console.error('❌ Error migrating old completions:', error);
  }
};

export default simplePsychometricService;
import { apiGet, apiPost, apiPut, apiDelete, handleApiResponse, handlePaginatedResponse } from './api';
import type { 
  PsychometricTest, 
  PsychometricTestResult, 
  ApiResponse, 
  PaginatedResponse 
} from '../types';

class PsychometricTestService {
  // Get all psychometric tests
  async getPsychometricTests(filters: any = {}, page = 1, limit = 10): Promise<PaginatedResponse<PsychometricTest>> {
    const params = {
      ...filters,
      page,
      limit
    };
    const response = await apiGet<PaginatedResponse<PsychometricTest>>('/psychometric-tests', params);
    return handlePaginatedResponse(response);
  }

  // Get single psychometric test
  async getPsychometricTestById(id: string): Promise<PsychometricTest> {
    const response = await apiGet<ApiResponse<PsychometricTest>>(`/psychometric-tests/${id}`);
    return handleApiResponse(response);
  }

  // Create psychometric test (Admin only)
  async createPsychometricTest(testData: any): Promise<PsychometricTest> {
    const response = await apiPost<ApiResponse<PsychometricTest>>('/psychometric-tests', testData);
    return handleApiResponse(response);
  }

  // Update psychometric test (Admin only)
  async updatePsychometricTest(id: string, testData: any): Promise<PsychometricTest> {
    const response = await apiPut<ApiResponse<PsychometricTest>>(`/psychometric-tests/${id}`, testData);
    return handleApiResponse(response);
  }

  // Delete psychometric test (Admin only)
  async deletePsychometricTest(id: string): Promise<void> {
    const response = await apiDelete<ApiResponse<void>>(`/psychometric-tests/${id}`);
    handleApiResponse(response);
  }

  // Take psychometric test with retry mechanism
  async takePsychometricTest(
    testId: string, 
    answers: Record<string, any>, 
    jobId?: string, 
    timeSpent?: number,
    testData?: any
  ): Promise<PsychometricTestResult> {
    console.log('📝 Submitting test answers:', { testId, answersCount: Object.keys(answers).length, jobId, timeSpent });
    
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Test submission attempt ${attempt}/${maxRetries}`);
        
        const response = await apiPost<ApiResponse<PsychometricTestResult>>(
          `/psychometric-tests/${testId}/take`,
          {
            answers,
            jobId,
            timeSpent,
            testData
          }
        );
        
        console.log('✅ Test submission successful:', response);
        return handleApiResponse(response);
        
      } catch (error: any) {
        console.error(`❌ Test submission attempt ${attempt} failed:`, error);
        
        const isLastAttempt = attempt === maxRetries;
        const isRetryableError = 
          error.message?.includes('JSON') || 
          error.message?.includes('Unexpected end of JSON input') ||
          error.message?.includes('Failed to execute \'json\' on \'Response\'') ||
          error.message?.includes('Network connection failed') ||
          error.message?.includes('Server is temporarily unavailable') ||
          error.response?.status >= 500;
        
        if (isLastAttempt || !isRetryableError) {
          // Enhanced error handling for JSON parsing errors
          if (error.message?.includes('JSON') || 
              error.message?.includes('Unexpected end of JSON input') ||
              error.message?.includes('Failed to execute \'json\' on \'Response\'')) {
            
            console.error('🔍 JSON parsing error details:', {
              error: error.message,
              response: error.response,
              config: error.config?.url,
              attempt: attempt
            });
            
            const contextualError = new Error(
              `Test submission failed due to server communication issue after ${attempt} attempts. This might be a temporary server problem. Please try refreshing the page and submitting again. If the issue persists, your test answers may have been saved.`
            );
            (contextualError as any).originalError = error;
            (contextualError as any).isJsonError = true;
            (contextualError as any).attempts = attempt;
            throw contextualError;
          }
          
          // Re-throw other errors with additional context
          const enhancedError = new Error(`Test submission failed after ${attempt} attempts: ${error.message || 'Unknown error'}`);
          (enhancedError as any).originalError = error;
          (enhancedError as any).attempts = attempt;
          throw enhancedError;
        }
        
        // Wait before retrying with exponential backoff
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // This should never be reached, but included for completeness
    throw new Error('Test submission failed after all retry attempts');
  }

  // Get user's test results
  async getUserTestResults(): Promise<PsychometricTestResult[]> {
    // Add cache busting parameter to force fresh data
    const timestamp = Date.now();
    const response = await apiGet<ApiResponse<PsychometricTestResult[]>>(
      '/psychometric-tests/results/my-results', 
      { _t: timestamp }
    );
    return handleApiResponse(response);
  }

  // Get test results for a job (Employer only)
  async getJobTestResults(jobId: string): Promise<PsychometricTestResult[]> {
    const response = await apiGet<ApiResponse<PsychometricTestResult[]>>(`/psychometric-tests/results/job/${jobId}`);
    return handleApiResponse(response);
  }

  // Get test result by ID
  async getTestResultById(resultId: string): Promise<PsychometricTestResult> {
    const response = await apiGet<ApiResponse<PsychometricTestResult>>(`/psychometric-tests/results/${resultId}`);
    return handleApiResponse(response);
  }

  // Check if user has taken a test for a specific job
  async hasUserTakenTest(testId: string, jobId?: string): Promise<boolean> {
    try {
      const results = await this.getUserTestResults();
      return results.some(result => 
        result.test._id === testId && 
        (jobId ? result.job?._id === jobId : true)
      );
    } catch (error) {
      console.error('Error checking test status:', error);
      return false;
    }
  }

  // Get available tests for a job
  async getAvailableTestsForJob(jobId: string): Promise<PsychometricTest[]> {
    try {
      const response = await apiGet<ApiResponse<PsychometricTest[]>>(`/psychometric-tests/job/${jobId}/available`);
      return handleApiResponse(response);
    } catch (error) {
      // If endpoint doesn't exist, return empty array
      return [];
    }
  }

  // Get test statistics
  async getTestStatistics(): Promise<any> {
    const response = await apiGet<ApiResponse<any>>('/psychometric-tests/statistics');
    return handleApiResponse(response);
  }

  // Get tests by type
  async getTestsByType(type: string): Promise<PsychometricTest[]> {
    const response = await apiGet<ApiResponse<PsychometricTest[]>>('/psychometric-tests', { type });
    return handleApiResponse(response);
  }

  // Get tests by industry
  async getTestsByIndustry(industry: string): Promise<PsychometricTest[]> {
    const response = await apiGet<ApiResponse<PsychometricTest[]>>('/psychometric-tests', { industry });
    return handleApiResponse(response);
  }

  // Generate psychometric test for a specific job
  async generatePsychometricTest(testData: {
    jobId: string;
    levelId: string;
  }): Promise<any> {
    const response = await apiPost<any>('/simple-psychometric/generate-test', testData);
    return response;
  }

  // Get user's test history
  async getUserTestHistory(): Promise<PsychometricTestResult[]> {
    const results = await this.getUserTestResults();
    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Get user's best scores
  async getUserBestScores(): Promise<Record<string, PsychometricTestResult>> {
    const results = await this.getUserTestResults();
    const bestScores: Record<string, PsychometricTestResult> = {};

    results.forEach(result => {
      const testId = result.test._id;
      if (!bestScores[testId] || result.overallScore > bestScores[testId].overallScore) {
        bestScores[testId] = result;
      }
    });

    return bestScores;
  }

  // Purchase a test (temporarily disabled - payment functionality removed)
  async purchaseTest(
    testId: string, 
    paymentDetails: {
      paymentIntentId: string;
      amount: number;
      currency?: string;
      maxAttempts?: number;
      jobId?: string;
    }
  ): Promise<any> {
    console.log('🔍 Payment functionality temporarily disabled - cannot purchase test:', testId);
    throw new Error('Payment functionality is temporarily disabled');
  }

  // Check test access (temporarily modified - always allow access without purchases)
  async checkTestAccess(testId: string, jobId?: string): Promise<{
    canTakeTest: boolean;
    reason?: string;
    purchase?: any;
    existingSession?: any;
    existingResults?: any[];
    hasActivePurchase: boolean;
    remainingAttempts: number;
  }> {
    console.log('🔍 Payment functionality temporarily disabled - allowing access to test:', testId);
    // Return a mock response that allows access
    return {
      canTakeTest: true,
      reason: 'Access granted (payment functionality temporarily disabled)',
      purchase: null,
      existingSession: null,
      existingResults: [],
      hasActivePurchase: false,
      remainingAttempts: 99
    };
  }

  // Start test session
  async startTestSession(testId: string, jobId?: string): Promise<any> {
    const response = await apiPost<ApiResponse<any>>(`/psychometric-tests/${testId}/start-session`, { jobId });
    return handleApiResponse(response);
  }

  // Get test session
  async getTestSession(sessionId: string): Promise<any> {
    const response = await apiGet<ApiResponse<any>>(`/psychometric-tests/session/${sessionId}`);
    return handleApiResponse(response);
  }

  // Update test session (save progress)
  async updateTestSession(
    sessionId: string, 
    updates: {
      answers?: Record<string, any>;
      currentQuestionIndex?: number;
      timeSpent?: number;
    }
  ): Promise<any> {
    const response = await apiPut<ApiResponse<any>>(`/psychometric-tests/session/${sessionId}`, updates);
    return handleApiResponse(response);
  }

  // Resume test session
  async resumeTestSession(testId: string, jobId?: string): Promise<{
    canResume: boolean;
    session?: any;
    reason?: string;
  }> {
    try {
      const accessCheck = await this.checkTestAccess(testId, jobId);
      
      if (!accessCheck.canTakeTest) {
        return {
          canResume: false,
          reason: accessCheck.reason || 'No access to test'
        };
      }

      if (accessCheck.existingSession) {
        // Update last activity for the existing session
        await this.getTestSession(accessCheck.existingSession.sessionId);
        
        return {
          canResume: true,
          session: accessCheck.existingSession
        };
      }

      return {
        canResume: false,
        reason: 'No active session found'
      };
    } catch (error) {
      console.error('Error resuming test session:', error);
      return {
        canResume: false,
        reason: 'Failed to resume session'
      };
    }
  }

  // Auto-save test progress
  async autoSaveProgress(
    sessionId: string,
    answers: Record<string, any>,
    currentQuestionIndex: number,
    timeSpent: number
  ): Promise<boolean> {
    try {
      await this.updateTestSession(sessionId, {
        answers,
        currentQuestionIndex,
        timeSpent
      });
      return true;
    } catch (error) {
      console.error('Auto-save failed:', error);
      return false;
    }
  }

  // Calculate average score for a test type
  async getAverageScoreByType(type: string): Promise<number> {
    const results = await this.getUserTestResults();
    const typeResults = results.filter(result => result.test.type === type);
    
    if (typeResults.length === 0) return 0;
    
    const totalScore = typeResults.reduce((sum, result) => sum + result.overallScore, 0);
    return totalScore / typeResults.length;
  }

  // Generate AI-powered job-specific psychometric test
  async generateJobSpecificTest(params: {
    jobTitle: string;
    jobDescription: string;
    requiredSkills: string[];
    experienceLevel: string;
    industry: string;
    testType: 'personality' | 'cognitive' | 'aptitude' | 'skills' | 'behavioral' | 'comprehensive';
    questionCount?: number;
    timeLimit?: number;
  }): Promise<{testId: string; test: PsychometricTest}> {
    const response = await apiPost<ApiResponse<{testId: string; test: PsychometricTest}>>(
      '/psychometric-tests/generate-job-specific',
      params
    );
    return handleApiResponse(response);
  }

  // Get user's test purchases (temporarily disabled - payment functionality removed)
  async getUserTestPurchases(): Promise<any[]> {
    console.log('🔍 Payment functionality temporarily disabled - returning empty array');
    return [];
  }

  // Debug method to get a specific payment by ID (temporarily disabled - payment functionality removed)
  async getPaymentById(paymentId: string): Promise<any> {
    console.log('🔍 Payment functionality temporarily disabled - returning null for payment ID:', paymentId);
    return null;
  }



  // Get recommended tests based on user profile
  async getRecommendedTests(): Promise<PsychometricTest[]> {
    try {
      const response = await apiGet<ApiResponse<PsychometricTest[]>>('/psychometric-tests/recommended');
      return handleApiResponse(response);
    } catch (error) {
      // If endpoint doesn't exist, return general tests
      const allTests = await this.getPsychometricTests();
      return allTests.data.slice(0, 5); // Return first 5 tests
    }
  }

  // Enhanced grading system for job-specific tests
  async calculateDetailedScore(
    testId: string, 
    answers: Record<string, any>, 
    test: any
  ): Promise<{
    overallScore: number;
    categoryScores: Record<string, number>;
    traitScores: Record<string, number>;
    feedback: {
      overall: string;
      strengths: string[];
      improvements: string[];
      recommendations: string[];
    };
    percentile: number;
    grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';
  }> {
    let totalScore = 0;
    let maxScore = 0;
    const categoryScores: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};
    const traitScores: Record<string, number> = {};
    const traitCounts: Record<string, number> = {};

    // Calculate scores for each question
    test.questions.forEach((question: any) => {
      const userAnswer = answers[question._id];
      let questionScore = 0;
      
      // Score based on question type
      if (question.type === 'multiple_choice' && question.correctAnswer) {
        questionScore = userAnswer === question.correctAnswer ? question.weight : 0;
      } else if (question.type === 'scale') {
        // For personality/scale questions, normalize the score
        const scaleMax = question.scaleRange?.max || 5;
        questionScore = (userAnswer / scaleMax) * question.weight;
      } else if (question.type === 'situational') {
        // Score situational questions based on best practices
        questionScore = userAnswer === question.correctAnswer ? question.weight : 0;
      }

      totalScore += questionScore;
      maxScore += question.weight;

      // Update category scores
      const category = question.category || 'general';
      categoryScores[category] = (categoryScores[category] || 0) + questionScore;
      categoryCounts[category] = (categoryCounts[category] || 0) + question.weight;

      // Update trait scores
      if (question.traits) {
        question.traits.forEach((trait: string) => {
          traitScores[trait] = (traitScores[trait] || 0) + questionScore;
          traitCounts[trait] = (traitCounts[trait] || 0) + question.weight;
        });
      }
    });

    // Normalize scores to percentages
    const overallScore = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    
    Object.keys(categoryScores).forEach(category => {
      categoryScores[category] = categoryCounts[category] > 0 
        ? (categoryScores[category] / categoryCounts[category]) * 100 
        : 0;
    });

    Object.keys(traitScores).forEach(trait => {
      traitScores[trait] = traitCounts[trait] > 0 
        ? (traitScores[trait] / traitCounts[trait]) * 100 
        : 0;
    });

    // Generate detailed feedback
    const feedback = this.generateDetailedFeedback(overallScore, categoryScores, traitScores, test);
    
    // Calculate percentile (simulated for now - in real app, compare with other users)
    const percentile = this.calculatePercentile(overallScore);
    
    // Assign letter grade
    const grade = this.assignLetterGrade(overallScore);

    return {
      overallScore: Math.round(overallScore),
      categoryScores,
      traitScores,
      feedback,
      percentile,
      grade
    };
  }

  private generateDetailedFeedback(
    overallScore: number, 
    categoryScores: Record<string, number>, 
    traitScores: Record<string, number>,
    test: any
  ) {
    const strengths: string[] = [];
    const improvements: string[] = [];
    const recommendations: string[] = [];

    // Identify strengths (categories/traits with scores > 75%)
    Object.entries(categoryScores).forEach(([category, score]) => {
      if (score >= 75) {
        strengths.push(`Excellent performance in ${category} reasoning`);
      } else if (score < 60) {
        improvements.push(`Consider strengthening your ${category} skills`);
        recommendations.push(`Practice more ${category} problems and exercises`);
      }
    });

    Object.entries(traitScores).forEach(([trait, score]) => {
      if (score >= 80) {
        strengths.push(`Strong ${trait.replace('_', ' ')} capabilities`);
      } else if (score < 55) {
        improvements.push(`Focus on developing ${trait.replace('_', ' ')} skills`);
        recommendations.push(`Work on ${trait.replace('_', ' ')} through targeted practice`);
      }
    });

    // Overall performance feedback
    let overall = '';
    if (overallScore >= 90) {
      overall = 'Outstanding performance! You demonstrate exceptional competency across all assessed areas.';
    } else if (overallScore >= 80) {
      overall = 'Excellent work! You show strong competency with minor areas for growth.';
    } else if (overallScore >= 70) {
      overall = 'Good performance overall with several areas showing strong competency.';
    } else if (overallScore >= 60) {
      overall = 'Satisfactory performance with opportunities for improvement in key areas.';
    } else {
      overall = 'Areas for development identified. Focus on strengthening core competencies.';
    }

    // Add job-specific recommendations if available
    if (test.jobSpecific && test.targetSkills) {
      const jobSkills = test.targetSkills.slice(0, 3);
      recommendations.push(`Continue developing: ${jobSkills.join(', ')}`);
      recommendations.push(`Consider courses or certifications in ${test.industry} field`);
    }

    return {
      overall,
      strengths: strengths.length > 0 ? strengths : ['Demonstrated basic competency in assessed areas'],
      improvements: improvements.length > 0 ? improvements : ['Continue practicing to maintain strong performance'],
      recommendations: recommendations.length > 0 ? recommendations : ['Regular practice and skill development recommended']
    };
  }

  private calculatePercentile(score: number): number {
    // Simulated percentile calculation based on score distribution
    if (score >= 95) return 95;
    if (score >= 90) return 85;
    if (score >= 85) return 75;
    if (score >= 80) return 65;
    if (score >= 75) return 55;
    if (score >= 70) return 45;
    if (score >= 65) return 35;
    if (score >= 60) return 25;
    if (score >= 55) return 15;
    return 5;
  }

  private assignLetterGrade(score: number): 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F' {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 85) return 'B+';
    if (score >= 80) return 'B';
    if (score >= 75) return 'C+';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  // Submit assessment request to admin
  async submitAssessmentRequest(requestData: {
    userId: string;
    jobTitle: string;
    company?: string;
    jobDescription?: string;
    category: string;
    urgency: string;
    additionalRequirements?: string;
    userProfile: {
      firstName: string;
      lastName: string;
      email: string;
    };
  }): Promise<ApiResponse<any>> {
    const response = await apiPost<ApiResponse<any>>('/assessment-requests', requestData);
    return response;
  }
}

export const psychometricTestService = new PsychometricTestService();
export default psychometricTestService;
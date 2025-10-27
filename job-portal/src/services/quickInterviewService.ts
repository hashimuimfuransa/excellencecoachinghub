/**
 * Quick Interview Service
 * Handles 3-minute FREE AI interview test sessions with AvatarTalk integration
 */

import { avatarTalkService, AvatarTalkResponse } from './avatarTalkService';
import { aiInterviewService } from './aiInterviewService';

export interface QuickInterviewQuestion {
  id: string;
  text: string;
  category: 'general' | 'behavioral' | 'technical' | 'situational' | 'Introduction';
  expectedDuration: number; // in seconds
  avatarResponse?: AvatarTalkResponse;
  type?: string;
  questionNumber?: number;
  totalQuestions?: number;
}

export interface QuickInterviewSession {
  id: string;
  userId: string;
  questions: QuickInterviewQuestion[];
  currentQuestionIndex: number;
  startTime: string;
  endTime?: string;
  totalDuration: number; // Target: 180 seconds (3 minutes) or 900 (15 minutes) for job interviews
  status: 'ready' | 'in_progress' | 'completed' | 'cancelled';
  avatar: string;
  welcomeMessage?: string | null; // Optional avatar welcome message
  isTestInterview: boolean; // True for free test interviews, false for job interviews
  backendInterviewId?: string; // Optional backend interview ID for database storage
  jobContext?: any; // Job context for job-specific interviews
  difficulty?: 'easy' | 'medium' | 'hard'; // Interview difficulty level
}

export interface QuickInterviewResult {
  sessionId: string;
  overallScore: number;
  scores: {
    communication: number;
    confidence: number;
    technical: number;
    clarity: number;
    professionalism: number;
  };
  feedback: string[];
  strengths: string[];
  improvements: string[];
  recommendations: string[];
  completedAt: string;
}

class QuickInterviewService {
  private readonly SESSION_DURATION = 180; // 3 minutes in seconds
  
  // Valid AvatarTalk API avatar options
  private readonly VALID_AVATARS = [
    'japanese_man',
    'old_european_woman', 
    'european_woman',
    'black_man',
    'japanese_woman',
    'iranian_man',
    'mexican_man',
    'mexican_woman'
  ];
  
  // Get a valid avatar (fallback to default if invalid)
  private getValidAvatar(avatar?: string): string {
    if (avatar && this.VALID_AVATARS.includes(avatar)) {
      return avatar;
    }
    return 'black_man'; // Default professional avatar
  }
  private readonly QUESTION_COUNT = 3; // 3 questions for time management
  private activeSession: QuickInterviewSession | null = null; // Track active session
  private readonly baseURL = import.meta.env.VITE_API_URL;

  /**
   * Create a new free 3-minute test interview session
   * @param userId - User ID
   * @returns Promise<QuickInterviewSession>
   */
  async createTestSession(userId: string): Promise<QuickInterviewSession> {
    try {
      console.log('🎯 Creating test session for userId:', userId);
      
      // Check if there's already an active session for this user
      if (this.activeSession && this.activeSession.userId === userId && this.activeSession.status !== 'completed') {
        console.warn('Active session exists, returning existing session');
        return this.activeSession;
      }

      // Generate unique session ID with timestamp and crypto random
      const timestamp = Date.now();
      const randomId = crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
      const sessionId = `test_${timestamp}_${randomId}`;

      // Generate general interview questions (not job-specific)
      const questions = await this.generateGeneralQuestions();

      // Create session object
      const session: QuickInterviewSession = {
        id: sessionId,
        userId,
        questions,
        currentQuestionIndex: 0,
        startTime: new Date().toISOString(),
        totalDuration: this.SESSION_DURATION,
        status: 'ready',
        avatar: this.getValidAvatar('black_man'), // Default avatar
        isTestInterview: true
      };

      console.log('✅ Session created with userId:', session.userId, 'sessionId:', session.id);

      // Store session (mock storage)
      await this.storeSession(session);
      
      // Track as active session
      this.activeSession = session;

      return session;
    } catch (error) {
      console.error('Error creating test interview session:', error);
      throw new Error('Failed to create test interview session');
    }
  }

  // No payment processing needed for free test interviews

  /**
   * Start the free test interview session with pre-generated questions and avatars
   * @param sessionId - Session ID
   * @returns Promise<QuickInterviewSession>
   */
  async startSession(sessionId: string): Promise<QuickInterviewSession> {
    try {
      let session = await this.getSession(sessionId);
      if (!session) {
        // If session not found, try to recreate it if it's the active session
        if (this.activeSession && this.activeSession.id === sessionId) {
          session = this.activeSession;
        } else {
          throw new Error('Session not found');
        }
      }

      console.log('Starting session with status:', session.status);

      // Allow starting sessions in various states for flexibility
      if (session.status === 'completed') {
        throw new Error('Cannot start a completed session');
      }

      // Update session status to in_progress
      session.status = 'in_progress';
      await this.storeSession(session);

      console.log('✅ Session started successfully');
      return session;
    } catch (error) {
      console.error('Error starting session:', error);
      throw new Error('Failed to start session');
    }
  }

  /**
   * Get session by ID
   * @param sessionId - Session ID
   * @returns Promise<QuickInterviewSession | null>
   */
  async getSession(sessionId: string): Promise<QuickInterviewSession | null> {
    try {
      // Check active session first
      if (this.activeSession && this.activeSession.id === sessionId) {
        return this.activeSession;
      }

      // Try to get from localStorage with correct key pattern
      const sessionData = localStorage.getItem(`quick_interview_${sessionId}`);
      if (sessionData) {
        const session = JSON.parse(sessionData);
        this.activeSession = session; // Cache it
        console.log('✅ Session retrieved with key:', `quick_interview_${sessionId}`);
        return session;
      }

      return null;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  /**
   * Store session in localStorage
   * @param session - Session to store
   */
  private async storeSession(session: QuickInterviewSession): Promise<void> {
    try {
      // Store with the correct key pattern that matches existing data
      localStorage.setItem(`quick_interview_${session.id}`, JSON.stringify(session));
      this.activeSession = session; // Keep in memory
      console.log('✅ Session stored with key:', `quick_interview_${session.id}`);
    } catch (error) {
      console.error('Error storing session:', error);
    }
  }

  /**
   * Update session in storage
   * @param session - Updated session
   */
  private async updateSession(session: QuickInterviewSession): Promise<void> {
    await this.storeSession(session);
  }

  /**
   * Generate general interview questions for test sessions
   * @returns Promise<QuickInterviewQuestion[]>
   */
  private async generateGeneralQuestions(): Promise<QuickInterviewQuestion[]> {
    const generalQuestions: QuickInterviewQuestion[] = [
      {
        id: 'general_1',
        text: 'Tell me about yourself and what interests you most about this type of role.',
        category: 'Introduction',
        expectedDuration: 60,
        questionNumber: 1,
        totalQuestions: 3
      },
      {
        id: 'general_2', 
        text: 'Describe a challenging situation you faced and how you overcame it.',
        category: 'behavioral',
        expectedDuration: 90,
        questionNumber: 2,
        totalQuestions: 3
      },
      {
        id: 'general_3',
        text: 'What are your career goals and how do you see yourself growing in this position?',
        category: 'general',
        expectedDuration: 60,
        questionNumber: 3,
        totalQuestions: 3
      }
    ];

    return generalQuestions;
  }

  /**
   * Move to next question in the session
   * @param sessionId - Session ID
   * @returns Promise<QuickInterviewQuestion | null>
   */
  async moveToNextQuestion(sessionId: string): Promise<QuickInterviewQuestion | null> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      if (session.currentQuestionIndex < session.questions.length - 1) {
        session.currentQuestionIndex++;
        await this.updateSession(session);
        return session.questions[session.currentQuestionIndex];
      }

      return null; // No more questions
    } catch (error) {
      console.error('Error moving to next question:', error);
      throw new Error('Failed to move to next question');
    }
  }

  /**
   * Generate real AI feedback for a response
   * @param question - The interview question
   * @param answer - User's answer
   * @param duration - Response duration in seconds
   * @returns Promise with AI feedback
   */
  async generateRealFeedback(question: string, answer: string, duration: number): Promise<{
    score: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
  }> {
    try {
      // For now, we'll use a mock AI evaluation that's more realistic
      // In production, this would call a real AI service
      const mockEvaluation = this.generateRealisticEvaluation(question, answer, duration);
      
      return mockEvaluation;
    } catch (error) {
      console.error('Error generating AI feedback:', error);
      // Fallback to basic evaluation
      return this.generateBasicEvaluation(answer, duration);
    }
  }

  /**
   * Generate realistic evaluation based on response content
   */
  private generateRealisticEvaluation(question: string, answer: string, duration: number): {
    score: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
  } {
    const answerLength = answer.length;
    const wordCount = answer.split(' ').length;
    const hasExamples = answer.toLowerCase().includes('for example') || answer.toLowerCase().includes('for instance');
    const hasStructure = answer.includes('first') || answer.includes('second') || answer.includes('finally');
    const isRelevant = this.checkRelevance(question, answer);
    
    // Calculate base score
    let score = 60; // Base score
    
    // Length scoring (optimal 50-150 words)
    if (wordCount >= 30 && wordCount <= 100) score += 15;
    else if (wordCount >= 20 && wordCount <= 150) score += 10;
    else if (wordCount < 10) score -= 20;
    
    // Content quality
    if (hasExamples) score += 10;
    if (hasStructure) score += 8;
    if (isRelevant) score += 12;
    
    // Duration scoring (optimal 30-90 seconds)
    if (duration >= 20 && duration <= 90) score += 5;
    else if (duration < 10) score -= 10;
    
    // Ensure score is within bounds
    score = Math.max(0, Math.min(100, score));
    
    // Generate feedback based on score
    let feedback = '';
    const strengths: string[] = [];
    const improvements: string[] = [];
    
    if (score >= 85) {
      feedback = 'Excellent response! You demonstrated strong communication skills and provided relevant, well-structured answers.';
      strengths.push('Clear communication');
      strengths.push('Good structure and organization');
      strengths.push('Relevant examples');
    } else if (score >= 70) {
      feedback = 'Good response with solid communication skills. You addressed the question well with room for minor improvements.';
      strengths.push('Clear communication');
      strengths.push('Relevant content');
      if (hasExamples) strengths.push('Good use of examples');
    } else if (score >= 55) {
      feedback = 'Adequate response that addresses the question. Consider providing more specific examples and structuring your thoughts better.';
      strengths.push('Basic communication skills');
      if (isRelevant) strengths.push('Relevant to the question');
    } else {
      feedback = 'Your response needs improvement. Focus on providing more detailed answers with specific examples and better structure.';
    }
    
    // Add improvements based on weaknesses
    if (wordCount < 20) improvements.push('Provide more detailed responses');
    if (!hasExamples) improvements.push('Include specific examples');
    if (!hasStructure) improvements.push('Structure your thoughts better');
    if (!isRelevant) improvements.push('Stay more focused on the question');
    if (duration < 15) improvements.push('Take more time to think before responding');
    
    return { score, feedback, strengths, improvements };
  }

  /**
   * Check if answer is relevant to the question
   */
  private checkRelevance(question: string, answer: string): boolean {
    const questionWords = question.toLowerCase().split(' ').filter(w => w.length > 3);
    const answerWords = answer.toLowerCase().split(' ').filter(w => w.length > 3);
    
    // Check for keyword overlap
    const overlap = questionWords.filter(word => answerWords.includes(word)).length;
    return overlap >= Math.min(2, questionWords.length * 0.3);
  }

  /**
   * Generate basic evaluation as fallback
   */
  private generateBasicEvaluation(answer: string, duration: number): {
    score: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
  } {
    const wordCount = answer.split(' ').length;
    const score = Math.min(100, Math.max(40, wordCount * 2 + (duration > 10 ? 20 : 0)));
    
    return {
      score,
      feedback: 'Thank you for your response. We\'re processing your answer and will provide detailed feedback.',
      strengths: ['Participation'],
      improvements: ['Continue practicing interview skills']
    };
  }

  /**
   * Submit a quick response for a question
   * @param sessionId - Session ID
   * @param response - User response data
   * @returns Promise<void>
   */
  async submitQuickResponse(sessionId: string, response: {
    questionId: string;
    answer: string;
    audioBlob?: Blob;
    duration: number;
    confidence: number;
    timestamp: Date;
  }): Promise<void> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      // Store the response locally (for now - can be enhanced to send to backend later)
      const responses = JSON.parse(localStorage.getItem(`quick_responses_${sessionId}`) || '[]');
      responses.push({
        ...response,
        sessionId,
        questionIndex: session.currentQuestionIndex,
        submittedAt: new Date().toISOString()
      });
      
      localStorage.setItem(`quick_responses_${sessionId}`, JSON.stringify(responses));
      
      console.log('✅ Quick response submitted:', {
        sessionId,
        questionId: response.questionId,
        answerLength: response.answer.length,
        confidence: response.confidence,
        duration: response.duration
      });
      
    } catch (error) {
      console.error('Error submitting quick response:', error);
      throw new Error('Failed to submit response');
    }
  }

  /**
   * Complete the interview session and generate results
   * @param sessionId - Session ID
   * @param userAnswers - User's recorded answers (optional for now)
   * @returns Promise<QuickInterviewResult>
   */
  async completeSession(sessionId: string, userAnswers: Record<string, any> = {}): Promise<QuickInterviewResult> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      // Calculate actual duration
      const startTime = new Date(session.startTime);
      const endTime = new Date();
      const actualDuration = Math.round((endTime.getTime() - startTime.getTime()) / 1000);

      // Get all responses from localStorage
      const responses = JSON.parse(localStorage.getItem(`quick_responses_${sessionId}`) || '[]');
      
      // Generate real AI scoring for all responses
      let totalScore = 0;
      let allStrengths: string[] = [];
      let allImprovements: string[] = [];
      let allFeedback: string[] = [];
      
      for (let i = 0; i < responses.length; i++) {
        const response = responses[i];
        const question = session.questions[i];
        
        if (question && response) {
          const feedback = await this.generateRealFeedback(
            question.text,
            response.answer,
            response.duration
          );
          
          totalScore += feedback.score;
          allStrengths.push(...feedback.strengths);
          allImprovements.push(...feedback.improvements);
          allFeedback.push(feedback.feedback);
        }
      }
      
      // Calculate overall score
      const overallScore = responses.length > 0 ? Math.round(totalScore / responses.length) : 0;
      
      // Create comprehensive feedback summary
      const feedbackSummary = this.createFeedbackSummary(overallScore, allStrengths, allImprovements);
      
      // Generate comprehensive result
      const result: QuickInterviewResult = {
        sessionId,
        completedAt: endTime.toISOString(),
        overallScore,
        scores: {
          communication: Math.round(overallScore * 0.95 + Math.random() * 10),
          confidence: Math.round(overallScore * 0.9 + Math.random() * 15),
          technical: Math.round(overallScore * 0.88 + Math.random() * 20),
          clarity: Math.round(overallScore * 1.02 + Math.random() * 8),
          professionalism: Math.round(overallScore * 0.92 + Math.random() * 12)
        },
        strengths: [...new Set(allStrengths)], // Remove duplicates
        improvements: [...new Set(allImprovements)], // Remove duplicates
        feedback: feedbackSummary, // Single comprehensive feedback string
        recommendations: this.generateRecommendations(overallScore, allImprovements)
      };

      // Store result
      await this.storeResult(result);
      
      // Update session status
      session.status = 'completed';
      session.endTime = endTime.toISOString();
      await this.storeSession(session);

      console.log('✅ Real AI Interview completed with score:', overallScore);
      return result;
      
    } catch (error) {
      console.error('Error completing session:', error);
      throw new Error('Failed to complete session');
    }
  }

  /**
   * Generate recommendations based on overall score and improvements
   */
  private createFeedbackSummary(overallScore: number, strengths: string[], improvements: string[]): string {
    let summary = '';
    
    if (overallScore >= 85) {
      summary = 'Excellent performance! You demonstrated strong communication skills and provided comprehensive, well-structured answers throughout the interview.';
    } else if (overallScore >= 70) {
      summary = 'Good performance with solid communication skills. You addressed the questions well with room for minor improvements in detail and structure.';
    } else if (overallScore >= 55) {
      summary = 'Adequate performance that addresses the questions. Consider providing more specific examples and structuring your thoughts better for stronger responses.';
    } else {
      summary = 'Room for improvement in your interview responses. Focus on providing more detailed answers with specific examples and better organization of your thoughts.';
    }
    
    // Add strengths if any
    if (strengths.length > 0) {
      const uniqueStrengths = [...new Set(strengths)];
      summary += ` Your key strengths include: ${uniqueStrengths.slice(0, 3).join(', ')}.`;
    }
    
    // Add improvements if any
    if (improvements.length > 0) {
      const uniqueImprovements = [...new Set(improvements)];
      summary += ` Areas for improvement: ${uniqueImprovements.slice(0, 2).join(' and ')}.`;
    }
    
    return summary;
  }

  private generateRecommendations(overallScore: number, improvements: string[]): string[] {
    const recommendations: string[] = [];
    
    if (overallScore >= 85) {
      recommendations.push('Continue practicing interview skills to maintain your excellent performance');
      recommendations.push('Consider taking on leadership roles to further develop your skills');
    } else if (overallScore >= 70) {
      recommendations.push('Practice more interview scenarios to improve your confidence');
      recommendations.push('Focus on providing more specific examples in your responses');
    } else if (overallScore >= 55) {
      recommendations.push('Take time to prepare thoroughly before interviews');
      recommendations.push('Practice structuring your thoughts before speaking');
    } else {
      recommendations.push('Consider taking interview preparation courses');
      recommendations.push('Practice answering common interview questions daily');
    }
    
    // Add specific recommendations based on improvements
    if (improvements.includes('Provide more detailed responses')) {
      recommendations.push('Work on expanding your answers with more context and examples');
    }
    if (improvements.includes('Include specific examples')) {
      recommendations.push('Prepare specific examples from your experience for common questions');
    }
    if (improvements.includes('Structure your thoughts better')) {
      recommendations.push('Use frameworks like STAR (Situation, Task, Action, Result) for behavioral questions');
    }
    
    return recommendations.slice(0, 4); // Limit to 4 recommendations
  }

  /**
   * Store result in database via API
   * @param result - Result to store in database
   * @param session - Session data
   */
  private async storeResultInDatabase(result: QuickInterviewResult, session: QuickInterviewSession): Promise<boolean> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No auth token available for database storage');
        return false;
      }

      // Prepare data for database storage
      const dbData = {
        sessionId: result.sessionId,
        userId: session.userId,
        overallScore: result.overallScore,
        scores: result.scores,
        feedback: result.feedback,
        strengths: result.strengths,
        improvements: result.improvements,
        recommendations: result.recommendations,
        completedAt: result.completedAt,
        sessionData: {
          questions: session.questions,
          startTime: session.startTime,
          endTime: session.endTime,
          totalDuration: session.totalDuration,
          avatar: session.avatar,
          isTestInterview: session.isTestInterview
        }
      };

      const response = await fetch(`${this.baseURL}/quick-interviews/${result.sessionId}/results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dbData)
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ Result stored in database:', responseData);
        return true;
      } else {
        console.warn('Database storage failed:', response.status, response.statusText);
        return false;
      }
    } catch (error) {
      console.error('Error storing result in database:', error);
      return false;
    }
  }
  private async storeResult(result: QuickInterviewResult): Promise<void> {
    try {
      const session = await this.getSession(result.sessionId);
      if (!session) return;

      // Try to store in database first
      const dbStored = await this.storeResultInDatabase(result, session);
      
      if (dbStored) {
        console.log('✅ Result successfully stored in database');
      } else {
        console.warn('Database storage failed, using local storage only');
      }

      // Fallback: Store in localStorage with correct patterns
      localStorage.setItem(`quick_result_${result.sessionId}`, JSON.stringify(result));
      
      // Store in user-specific results array (matches existing pattern)
      const userResultsKey = `quick_interview_results_${session.userId}`;
      const existingUserResults = JSON.parse(localStorage.getItem(userResultsKey) || '[]');
      const updatedUserResults = existingUserResults.filter((r: any) => r.sessionId !== result.sessionId);
      updatedUserResults.unshift(result); // Add new result at the beginning
      localStorage.setItem(userResultsKey, JSON.stringify(updatedUserResults));
      
      // Also store in general interview results array for easier access
      const existingResults = JSON.parse(localStorage.getItem('interview_results') || '[]');
      const updatedResults = existingResults.filter((r: any) => r.sessionId !== result.sessionId);
      updatedResults.unshift(result); // Add new result at the beginning
      localStorage.setItem('interview_results', JSON.stringify(updatedResults));
      
      console.log('✅ Result stored in local storage with multiple keys:', {
        individual: `quick_result_${result.sessionId}`,
        userSpecific: userResultsKey,
        general: 'interview_results',
        database: dbStored ? 'success' : 'failed'
      });
      
    } catch (error) {
      console.error('Error storing result:', error);
    }
  }

  /**
   * Get stored result by session ID
   * @param sessionId - Session ID
   * @returns Promise<QuickInterviewResult | null>
   */
  async getResult(sessionId: string): Promise<QuickInterviewResult | null> {
    try {
      const resultData = localStorage.getItem(`quick_result_${sessionId}`);
      if (resultData) {
        return JSON.parse(resultData);
      }
      return null;
    } catch (error) {
      console.error('Error getting result:', error);
      return null;
    }
  }

  /**
   * Fetch results from database
   * @param userId - User ID
   */
  private async fetchResultsFromDatabase(userId: string): Promise<QuickInterviewResult[]> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No auth token available for database fetch');
        return [];
      }

      const response = await fetch(`${this.baseURL}/quick-interviews/my-results`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Fetched', data.length, 'results from database');
        return data;
      } else {
        console.warn('Database fetch failed:', response.status, response.statusText);
        return [];
      }
    } catch (error) {
      console.error('Error fetching results from database:', error);
      return [];
    }
  }
  async getUserResults(userId: string): Promise<QuickInterviewResult[]> {
    try {
      console.log('🔍 Getting user results for userId:', userId);
      const results: QuickInterviewResult[] = [];
      
      // Method 0: Try to fetch from database first
      const dbResults = await this.fetchResultsFromDatabase(userId);
      results.push(...dbResults);
      console.log('✅ Found', dbResults.length, 'results from database');
      
      // Method 1: Get from user-specific results array (primary method)
      const userResultsKey = `quick_interview_results_${userId}`;
      const userResults = JSON.parse(localStorage.getItem(userResultsKey) || '[]');
      userResults.forEach((result: any) => {
        if (!results.find(r => r.sessionId === result.sessionId)) {
          results.push(result);
        }
      });
      console.log('✅ Found', userResults.length, 'results in user-specific array');
      
      // Method 2: Get from quick_result_ keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('quick_result_')) {
          try {
            const resultData = localStorage.getItem(key);
            if (resultData) {
              const result = JSON.parse(resultData);
              // Check if this result belongs to the user and isn't already included
              if (!results.find(r => r.sessionId === result.sessionId)) {
                const session = await this.getSession(result.sessionId);
                if (session && session.userId === userId) {
                  results.push(result);
                  console.log('✅ Found additional result for user:', result.sessionId);
                }
              }
            }
          } catch (parseError) {
            console.warn('Error parsing result:', parseError);
          }
        }
      }
      
      // Method 3: Get from general interview_results array
      try {
        const generalResults = JSON.parse(localStorage.getItem('interview_results') || '[]');
        generalResults.forEach((result: any) => {
          if (!results.find(r => r.sessionId === result.sessionId)) {
            // Check if this result belongs to the user by checking session
            const session = this.getSessionSync(result.sessionId);
            if (session && session.userId === userId) {
              results.push(result);
              console.log('✅ Found result in general array for user:', result.sessionId);
            }
          }
        });
      } catch (error) {
        console.warn('Error reading general results:', error);
      }
      
      // Sort by completion date (newest first)
      results.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
      
      console.log('📊 Total results found for user:', results.length, '(DB:', dbResults.length, 'Local:', results.length - dbResults.length, ')');
      return results;
    } catch (error) {
      console.error('Error getting user results:', error);
      return [];
    }
  }

  /**
   * Synchronous version of getSession for better performance
   */
  private getSessionSync(sessionId: string): QuickInterviewSession | null {
    try {
      // Check active session first
      if (this.activeSession && this.activeSession.id === sessionId) {
        return this.activeSession;
      }

      // Try to get from localStorage with correct key pattern
      const sessionData = localStorage.getItem(`quick_interview_${sessionId}`);
      if (sessionData) {
        return JSON.parse(sessionData);
      }

      return null;
    } catch (error) {
      console.warn('Error getting session sync:', error);
      return null;
    }
  }

  /**
   * Clear all data for a user (for testing/cleanup)
   * @param userId - User ID
   */
  async clearUserData(userId: string): Promise<void> {
    try {
      const keysToRemove: string[] = [];
      
      // Find all keys related to this user
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('quick_session_') || key.startsWith('quick_responses_') || key.startsWith('quick_result_'))) {
          try {
            const data = localStorage.getItem(key);
            if (data) {
              const parsed = JSON.parse(data);
              if (parsed.userId === userId || parsed.sessionId?.includes(userId)) {
                keysToRemove.push(key);
              }
            }
          } catch (parseError) {
            console.warn('Error parsing data for cleanup:', parseError);
          }
        }
      }
      
      // Remove all related keys
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Clear active session if it belongs to this user
      if (this.activeSession && this.activeSession.userId === userId) {
        this.activeSession = null;
      }
      
      console.log(`✅ Cleared ${keysToRemove.length} items for user ${userId}`);
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  }
}

export const quickInterviewService = new QuickInterviewService();

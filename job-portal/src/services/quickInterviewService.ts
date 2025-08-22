/**
 * Quick Interview Service
 * Handles 3-minute FREE AI interview test sessions with AvatarTalk integration
 */

import { avatarTalkService, AvatarTalkResponse } from './avatarTalkService';

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
  actualDuration: number;
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

      // Quick interviews are now fully frontend-based for optimal performance
      console.log('✅ Frontend-only interview created - no backend needed for instant experience');

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

      // If already in progress, just return the session
      if (session.status === 'in_progress') {
        console.log('Session already in progress, returning existing session');
        return session;
      }

      // Update status to in_progress regardless of current status
      session.status = 'in_progress';
      session.startTime = new Date().toISOString();

      // Pre-generate all questions with avatars in parallel for faster interview experience
      console.log('🎬 Pre-generating all questions and avatar videos...');
      await this.preGenerateAllQuestions(session);

      // Skip lengthy welcome message - just show a brief intro
      session.welcomeMessage = null; // Skip avatar intro to save time
      
      // Update both stored session and active session
      await this.updateSession(session);
      this.activeSession = session;

      console.log('✅ Session started with pre-generated questions:', sessionId);
      return session;
    } catch (error) {
      console.error('Error starting session:', error);
      throw new Error(`Failed to start interview session: ${error.message}`);
    }
  }

  /**
   * Pre-generate all questions with their avatar videos for seamless experience
   * @param session - Interview session
   */
  private async preGenerateAllQuestions(session: QuickInterviewSession): Promise<void> {
    try {
      console.log('🎯 Pre-generating questions for seamless interview flow...');

      // For job interviews, generate all questions at once
      if (!session.isTestInterview && session.jobContext) {
        await this.generateAllJobQuestions(session);
      }

      // Generate avatar videos for all questions in parallel
      const avatarPromises = session.questions.map(async (question, index) => {
        if (!question.avatarResponse) {
          try {
            console.log(`🎬 Generating avatar for question ${index + 1}:`, question.text.substring(0, 50) + '...');
            
            const avatarResponse = await Promise.race([
              avatarTalkService.generateInterviewQuestion(
                question.text,
                session.avatar,
                avatarTalkService.getInterviewEmotion('question'),
                'en',
                true  // Enable streaming for faster response
              ),
              new Promise<null>((_, reject) => 
                setTimeout(() => reject(new Error(`Avatar timeout for question ${index + 1}`)), 12000)
              )
            ]);

            if (avatarResponse && avatarResponse.success) {
              question.avatarResponse = avatarResponse;
              console.log(`✅ Question ${index + 1} avatar ready`);
            } else {
              console.warn(`⚠️ Question ${index + 1} avatar failed but continuing`);
            }
          } catch (error) {
            console.warn(`⚠️ Avatar generation failed for question ${index + 1}, continuing:`, error);
          }
        }
      });

      // Wait for all avatars to be generated (or timeout)
      await Promise.allSettled(avatarPromises);
      await this.updateSession(session);
      
      const readyCount = session.questions.filter(q => q.avatarResponse).length;
      console.log(`🎬 Pre-generation complete: ${readyCount}/${session.questions.length} questions have avatars ready`);
    } catch (error) {
      console.warn('Pre-generation had issues but continuing:', error);
    }
  }

  /**
   * Generate all job-specific questions at once instead of one by one
   * @param session - Interview session
   */
  private async generateAllJobQuestions(session: QuickInterviewSession): Promise<void> {
    const totalQuestions = 5;
    const questions: QuickInterviewQuestion[] = [];
    
    // Introduction question (already exists)
    if (session.questions.length > 0) {
      questions.push(session.questions[0]);
    }

    // Generate all remaining questions
    for (let i = 1; i < totalQuestions; i++) {
      let newQuestion: QuickInterviewQuestion;

      switch (i) {
        case 1:
          newQuestion = {
            id: `q${i + 1}`,
            text: `What interests you most about the ${session.jobContext.title} position at ${session.jobContext.company}? What specific aspects of this role excite you?`,
            expectedDuration: this.calculateExpectedDuration('interests', session.difficulty || 'medium'),
            type: 'behavioral',
            category: 'behavioral',
            questionNumber: i + 1,
            totalQuestions: totalQuestions
          };
          break;
        
        case 2:
          newQuestion = {
            id: `q${i + 1}`,
            text: `Can you describe your relevant experience and skills that make you a strong candidate for this ${session.jobContext.title} role?`,
            expectedDuration: this.calculateExpectedDuration('experience', session.difficulty || 'medium'),
            type: 'behavioral',
            category: 'behavioral',
            questionNumber: i + 1,
            totalQuestions: totalQuestions
          };
          break;
        
        case 3:
          const requirement = session.jobContext.requirements ? 
            (Array.isArray(session.jobContext.requirements) ? 
              session.jobContext.requirements[0] : 
              session.jobContext.requirements) : 
            'the technical requirements';
          newQuestion = {
            id: `q${i + 1}`,
            text: `How would you approach ${requirement} in this role? Can you give me an example of your experience with this?`,
            expectedDuration: this.calculateExpectedDuration('technical', session.difficulty || 'medium'),
            type: 'technical',
            category: 'technical',
            questionNumber: i + 1,
            totalQuestions: totalQuestions
          };
          break;
        
        case 4:
          newQuestion = {
            id: `q${i + 1}`,
            text: `Describe a challenging situation you've faced in your career and how you handled it. How would this experience help you in the ${session.jobContext.title} position?`,
            expectedDuration: this.calculateExpectedDuration('challenging', session.difficulty || 'medium'),
            type: 'situational',
            category: 'situational',
            questionNumber: i + 1,
            totalQuestions: totalQuestions
          };
          break;
        
        default:
          continue;
      }

      questions.push(newQuestion);
    }

    // Replace session questions with all generated questions
    session.questions = questions;
    console.log(`✅ Generated all ${questions.length} questions at once`);
  }

  /**
   * Get next question (now pre-generated with avatars for instant access)
   * @param sessionId - Session ID
   * @returns Promise<QuickInterviewQuestion | null>
   */
  async getNextQuestion(sessionId: string): Promise<QuickInterviewQuestion | null> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      if (session.currentQuestionIndex >= session.questions.length) {
        return null; // No more questions
      }

      const question = session.questions[session.currentQuestionIndex];
      
      console.log(`🎯 Returning pre-generated question ${session.currentQuestionIndex + 1}/${session.questions.length}:`, {
        hasAvatar: !!question.avatarResponse,
        text: question.text.substring(0, 50) + '...'
      });

      return question;
    } catch (error) {
      console.error('Error getting next question:', error);
      throw new Error('Failed to get next question');
    }
  }



  /**
   * Move to next question
   * @param sessionId - Session ID
   * @returns Promise<boolean> - True if there are more questions
   */
  async moveToNextQuestion(sessionId: string): Promise<boolean> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      session.currentQuestionIndex++;
      await this.updateSession(session);

      return session.currentQuestionIndex < session.questions.length;
    } catch (error) {
      console.error('Error moving to next question:', error);
      throw new Error('Failed to move to next question');
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

      // Try to submit to backend first
      try {
        const token = localStorage.getItem('token');
        if (token && session.backendInterviewId) {
          const response = await fetch(`${this.baseURL}/ai-interviews/${session.backendInterviewId}/complete`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              duration: Math.round(actualDuration / 60) // Convert to minutes
            })
          });

          if (response.ok) {
            const backendResult = await response.json();
            if (backendResult.success && backendResult.data) {
              // Transform backend response to our format
              const result: QuickInterviewResult = {
                sessionId: backendResult.data._id,
                completedAt: backendResult.data.completedAt,
                overallScore: Math.round(backendResult.data.overallScore),
                scores: {
                  communication: Math.round(backendResult.data.overallScore * 0.95 + Math.random() * 10),
                  confidence: Math.round(backendResult.data.overallScore * 0.9 + Math.random() * 15),
                  professionalism: Math.round(backendResult.data.overallScore * 1.02 + Math.random() * 8),
                  technicalKnowledge: Math.round(backendResult.data.overallScore * 0.88 + Math.random() * 20)
                },
                strengths: backendResult.data.strengths || [
                  'Clear communication skills',
                  'Professional demeanor',
                  'Good problem-solving approach'
                ],
                improvements: backendResult.data.areasForImprovement || [
                  'Provide more specific examples',
                  'Practice technical terminology'
                ],
                feedback: backendResult.data.feedback || 'Overall good performance in the interview.',
                timeSpent: Math.round(actualDuration / 60),
                questionsAnswered: session.questions.length
              };

              // Update session status
              session.status = 'completed';
              session.endTime = endTime.toISOString();
              await this.updateSession(session);

              // Store result locally as well
              await this.storeResult(result);

              // Clear active session
              this.activeSession = null;

              return result;
            }
          }
        }
      } catch (backendError) {
        console.warn('Backend completion failed, using fallback:', backendError);
      }

      // Fallback to local processing
      const result = await this.generateResults(session, userAnswers, actualDuration);

      // Generate closing message
      await avatarTalkService.generateClosingMessage(session.avatar, false);

      // Update session status
      session.status = 'completed';
      session.endTime = endTime.toISOString();
      await this.updateSession(session);

      // Store result
      await this.storeResult(result);

      // Clear active session
      this.activeSession = null;

      return result;
    } catch (error) {
      console.error('Error completing session:', error);
      throw new Error('Failed to complete interview session');
    }
  }

  /**
   * Get session by ID
   * @param sessionId - Session ID
   * @returns Promise<QuickInterviewSession | null>
   */
  async getSession(sessionId: string): Promise<QuickInterviewSession | null> {
    try {
      const stored = localStorage.getItem(`quick_interview_${sessionId}`);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  /**
   * Get user's interview results (from backend and local storage)
   * @param userId - User ID
   * @returns Promise<QuickInterviewResult[]>
   */
  async getUserResults(userId: string): Promise<QuickInterviewResult[]> {
    try {
      // First try to get from backend
      let backendResults: QuickInterviewResult[] = [];
      
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        if (token) {
          const response = await fetch(`${this.baseURL}/quick-interviews/my-results`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              backendResults = data.data;
              console.log('📊 Fetched', backendResults.length, 'results from backend database');
            }
          }
        }
      } catch (backendError) {
        console.warn('Could not fetch from backend, using local storage only:', backendError);
      }

      // Get local storage results as fallback
      const localStored = localStorage.getItem(`quick_interview_results_${userId}`);
      const localResults = localStored ? JSON.parse(localStored) : [];

      // Merge results, giving preference to backend
      const combinedResults = [...backendResults];
      localResults.forEach((localResult: QuickInterviewResult) => {
        if (!combinedResults.find(r => r.sessionId === localResult.sessionId)) {
          combinedResults.push(localResult);
        }
      });

      return combinedResults;
    } catch (error) {
      console.error('Error getting user results:', error);
      // Fallback to just local storage
      const stored = localStorage.getItem(`quick_interview_results_${userId}`);
      return stored ? JSON.parse(stored) : [];
    }
  }

  /**
   * Generate general interview questions (not job-specific)
   * @returns Promise<QuickInterviewQuestion[]>
   */
  private async generateGeneralQuestions(): Promise<QuickInterviewQuestion[]> {
    const questions: QuickInterviewQuestion[] = [];
    const questionDuration = Math.floor(this.SESSION_DURATION / this.QUESTION_COUNT);

    // General introduction question
    questions.push({
      id: `q1_${Date.now()}`,
      text: `Hello! Can you briefly introduce yourself and tell me about your background and career goals?`,
      category: 'general',
      expectedDuration: questionDuration
    });

    // Behavioral question
    questions.push({
      id: `q2_${Date.now()}`,
      text: `Describe a challenging situation you faced in your work or studies and how you handled it.`,
      category: 'behavioral',
      expectedDuration: questionDuration
    });

    // General skills question
    questions.push({
      id: `q3_${Date.now()}`,
      text: `What are your key strengths, and how do you think they would benefit an employer?`,
      category: 'general',
      expectedDuration: questionDuration
    });

    return questions;
  }

  /**
   * Generate interview results with AI analysis
   * @param session - Interview session
   * @param userAnswers - User answers
   * @param actualDuration - Actual session duration
   * @returns Promise<QuickInterviewResult>
   */
  private async generateResults(
    session: QuickInterviewSession,
    userAnswers: Record<string, any>,
    actualDuration: number
  ): Promise<QuickInterviewResult> {
    // Simulate AI analysis - in real implementation, this would use actual AI
    const scores = {
      communication: Math.floor(Math.random() * 20) + 75, // 75-95
      confidence: Math.floor(Math.random() * 20) + 70,    // 70-90
      technical: Math.floor(Math.random() * 25) + 70,     // 70-95
      clarity: Math.floor(Math.random() * 20) + 75,       // 75-95
      professionalism: Math.floor(Math.random() * 15) + 80 // 80-95
    };

    const overallScore = Math.floor(Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length);

    const feedback = [
      'Good eye contact and professional demeanor throughout the interview',
      'Clear and articulate responses to most questions',
      'Demonstrated relevant experience and skills for the position',
      `Completed the interview within the allocated ${Math.floor(actualDuration / 60)} minute timeframe`
    ];

    const strengths = [
      'Strong communication skills',
      'Professional presentation',
      'Relevant experience highlighted',
      'Good understanding of role requirements'
    ];

    const improvements = [
      'Provide more specific examples when answering behavioral questions',
      'Elaborate on technical skills with concrete examples',
      'Practice maintaining eye contact consistently',
      'Work on confident body language'
    ];

    const recommendations = [
      'Research the company culture and values more deeply',
      'Prepare detailed STAR method examples for behavioral questions',
      'Practice technical explanations with real-world scenarios',
      'Consider taking additional courses to strengthen weak areas'
    ];

    return {
      sessionId: session.id,
      overallScore,
      scores,
      feedback,
      strengths,
      improvements,
      recommendations,
      completedAt: new Date().toISOString(),
      actualDuration
    };
  }

  /**
   * Store session (mock storage)
   * @param session - Session to store
   */
  private async storeSession(session: QuickInterviewSession): Promise<void> {
    localStorage.setItem(`quick_interview_${session.id}`, JSON.stringify(session));
  }

  /**
   * Update session (mock storage)
   * @param session - Session to update
   */
  private async updateSession(session: QuickInterviewSession): Promise<void> {
    localStorage.setItem(`quick_interview_${session.id}`, JSON.stringify(session));
  }

  /**
   * Store result (database + local storage)
   * @param result - Result to store
   */
  private async storeResult(result: QuickInterviewResult): Promise<void> {
    try {
      const session = await this.getSession(result.sessionId);
      if (!session) return;

      // Try to store in backend database first
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        if (token && session.backendInterviewId) {
          const response = await fetch(`${this.baseURL}/quick-interviews/${session.backendInterviewId}/results`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              results: result,
              sessionDetails: {
                sessionId: session.id,
                totalQuestions: session.questions.length,
                completedAt: result.completedAt,
                actualDuration: result.actualDuration
              }
            })
          });

          if (response.ok) {
            const backendData = await response.json();
            console.log('✅ Results successfully stored in database:', backendData);
          } else {
            console.warn('❌ Backend storage failed, using local storage only:', response.status);
          }
        }
      } catch (backendError) {
        console.error('Backend storage error, falling back to local:', backendError);
      }

      // Always store locally as backup
      const userId = session.userId;
      const existing = await this.getUserResults(userId);
      existing.push(result);
      
      localStorage.setItem(`quick_interview_results_${userId}`, JSON.stringify(existing));
      console.log('📱 Results stored in local storage for user:', userId);
    } catch (error) {
      console.error('Error storing result:', error);
    }
  }

  /**
   * Create a job-specific interview session
   * @param job - Job object with details
   * @param difficulty - Interview difficulty level
   * @param userId - User ID
   */
  async createJobInterviewSession(job: any, difficulty: 'easy' | 'medium' | 'hard' = 'medium', userId: string): Promise<QuickInterviewSession> {
    try {
      console.log('🎯 Creating job-specific interview session for:', job.title);
      
      if (!job || !job.title || !job.company) {
        throw new Error('Invalid job object provided');
      }

      const sessionId = `job-interview-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('🚀 Pre-generating ALL questions and avatars for instant experience...');
      
      // Generate all 5 job-specific questions at once for instant access
      const allQuestions = await this.generateAllJobQuestionsOptimized(job, difficulty);
      
      const session: QuickInterviewSession = {
        id: sessionId,
        userId,
        questions: allQuestions, // All questions pre-generated with avatars
        currentQuestionIndex: 0,
        startTime: new Date().toISOString(),
        totalDuration: 900, // 15 minutes for job-specific interviews
        status: 'ready',
        avatar: this.getValidAvatar('black_man'),
        isTestInterview: false,
        backendInterviewId: sessionId,
        jobContext: job,
        difficulty: difficulty
      };

      // Store the session in multiple formats for compatibility
      this.activeSession = session;
      
      // Store with the quick_interview key for getSession compatibility
      localStorage.setItem(`quick_interview_${sessionId}`, JSON.stringify(session));
      
      // Also store in the user sessions array for history
      const existingSessions = JSON.parse(localStorage.getItem(`interview_sessions_${userId}`) || '[]');
      existingSessions.push(session);
      localStorage.setItem(`interview_sessions_${userId}`, JSON.stringify(existingSessions));

      console.log('✅ Created job-specific session:', session);
      return session;
    } catch (error) {
      console.error('Failed to create job-specific interview session:', error);
      throw error;
    }
  }

  /**
   * Generate ALL job-specific questions with avatars for optimized experience
   * @param job - Job details  
   * @param difficulty - Interview difficulty
   */
  private async generateAllJobQuestionsOptimized(job: any, difficulty: 'easy' | 'medium' | 'hard'): Promise<QuickInterviewQuestion[]> {
    try {
      console.log('🎯 Generating optimized question set for:', job.title);
      
      // Create structured questions for better interview flow
      const questions: QuickInterviewQuestion[] = [
        {
          id: 'q1',
          text: `Welcome to your interview for the ${job.title} position at ${job.company}! Let's start with your introduction. Please tell me about yourself, your background, and what makes you interested in this particular role.`,
          expectedDuration: this.calculateExpectedDuration('introduction', difficulty),
          type: 'behavioral',
          category: 'Introduction',
          questionNumber: 1,
          totalQuestions: 5
        },
        {
          id: 'q2',
          text: `What interests you most about the ${job.title} position at ${job.company}? What specific aspects of this role excite you?`,
          expectedDuration: this.calculateExpectedDuration('interests', difficulty),
          type: 'behavioral',
          category: 'Motivation',
          questionNumber: 2,
          totalQuestions: 5
        },
        {
          id: 'q3',
          text: `Can you describe your relevant experience and skills that make you a strong candidate for this ${job.title} role?`,
          expectedDuration: this.calculateExpectedDuration('experience', difficulty),
          type: 'behavioral',
          category: 'Experience',
          questionNumber: 3,
          totalQuestions: 5
        },
        {
          id: 'q4',
          text: `How would you approach ${this.getJobRequirement(job)} in this role? Can you give me an example of your experience with this?`,
          expectedDuration: this.calculateExpectedDuration('technical', difficulty),
          type: 'technical',
          category: 'Technical Skills',
          questionNumber: 4,
          totalQuestions: 5
        },
        {
          id: 'q5',
          text: `Describe a challenging situation you've faced in your career and how you handled it. How would this experience help you in the ${job.title} position?`,
          expectedDuration: this.calculateExpectedDuration('challenging', difficulty),
          type: 'situational',
          category: 'Problem Solving',
          questionNumber: 5,
          totalQuestions: 5
        }
      ];

      // Generate avatars for all questions concurrently for maximum speed
      console.log('🎬 Pre-generating avatar videos for all questions...');
      const avatar = this.getValidAvatar('black_man');
      
      const avatarPromises = questions.map(async (question, index) => {
        try {
          console.log(`🎬 Generating avatar for question ${index + 1}/5...`);
          const avatarResponse = await avatarTalkService.generateInterviewQuestion(
            question.text,
            avatar,
            avatarTalkService.getInterviewEmotion(question.category.toLowerCase()),
            'en',
            true // Enable streaming for faster loading
          );

          if (avatarResponse && avatarResponse.success) {
            question.avatarResponse = avatarResponse;
            console.log(`✅ Avatar generated for question ${index + 1}`);
          } else {
            console.warn(`⚠️ Avatar generation failed for question ${index + 1}, continuing with text-only`);
          }
        } catch (error) {
          console.warn(`⚠️ Avatar error for question ${index + 1}:`, error);
        }
        return question;
      });

      // Wait for all avatars to complete (with individual error handling)
      const questionsWithAvatars = await Promise.allSettled(avatarPromises);
      const finalQuestions = questionsWithAvatars.map((result, index) => 
        result.status === 'fulfilled' ? result.value : questions[index]
      );

      console.log(`✅ Generated all ${finalQuestions.length} questions with avatars`);
      return finalQuestions;
      
    } catch (error) {
      console.error('Error generating optimized questions:', error);
      throw error;
    }
  }

  /**
   * Get a relevant job requirement for technical questions
   */
  private getJobRequirement(job: any): string {
    if (job.requirements && Array.isArray(job.requirements) && job.requirements.length > 0) {
      return job.requirements[0];
    }
    if (job.skills && Array.isArray(job.skills) && job.skills.length > 0) {
      return job.skills[0];
    }
    if (typeof job.requirements === 'string') {
      return job.requirements;
    }
    return 'the key technical requirements';
  }

  /**
   * Generate job-specific questions using AI (legacy method)
   * @param job - Job details
   * @param difficulty - Interview difficulty
   */
  private async generateJobSpecificQuestions(job: any, difficulty: 'easy' | 'medium' | 'hard'): Promise<QuickInterviewQuestion[]> {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      
      // If we have a backend connection, try to generate AI questions
      if (token && this.baseURL) {
        try {
          const response = await fetch(`${this.baseURL}/ai-interviews/generate-questions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              job: {
                title: job.title,
                company: job.company,
                description: job.description,
                requirements: job.requirements,
                skills: job.skills
              },
              difficulty,
              count: 5 // Generate 5 questions for job interviews
            })
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.questions) {
              return data.questions.map((q: any, index: number) => ({
                id: `q${index + 1}`,
                text: q.question,
                expectedDuration: this.calculateExpectedDuration(q.question, difficulty),
                type: q.type || 'behavioral'
              }));
            }
          }
        } catch (aiError) {
          console.warn('AI question generation failed, using templates:', aiError);
        }
      }

      // Fallback to template-based questions
      return this.generateTemplateQuestions(job, difficulty);
    } catch (error) {
      console.error('Error generating job-specific questions:', error);
      return this.generateTemplateQuestions(job, difficulty);
    }
  }

  /**
   * Generate template-based questions for job interviews
   */
  private generateTemplateQuestions(job: any, difficulty: 'easy' | 'medium' | 'hard'): QuickInterviewQuestion[] {
    const baseQuestions = [
      `Tell me about your experience that makes you suitable for the ${job.title} position at ${job.company}.`,
      `What interests you most about working as a ${job.title} at ${job.company}?`,
      `How would you handle a challenging situation in the ${job.title} role?`,
      `What skills do you bring that would be valuable for this ${job.title} position?`,
      `Why do you want to work at ${job.company} specifically?`
    ];

    // Add technical questions based on job requirements
    const technicalQuestions = [];
    if (job.requirements) {
      const requirements = Array.isArray(job.requirements) ? job.requirements : [job.requirements];
      requirements.slice(0, 2).forEach((req: string, index: number) => {
        technicalQuestions.push(`Can you explain your experience with ${req}? How would you apply it in this role?`);
      });
    }

    const allQuestions = [...baseQuestions, ...technicalQuestions].slice(0, 5);

    return allQuestions.map((question, index) => ({
      id: `q${index + 1}`,
      text: question,
      expectedDuration: this.calculateExpectedDuration(question, difficulty),
      type: index < 3 ? 'behavioral' : 'technical'
    }));
  }

  /**
   * Calculate expected duration based on question complexity
   */
  private calculateExpectedDuration(questionType: string, difficulty: 'easy' | 'medium' | 'hard'): number {
    let baseDuration = 120; // 2 minutes base
    
    // Adjust for difficulty
    if (difficulty === 'easy') baseDuration = 90;
    if (difficulty === 'hard') baseDuration = 180;
    
    // Adjust for question type/complexity
    if (questionType.includes('experience') || questionType.includes('explain')) baseDuration += 30;
    if (questionType.includes('challenging') || questionType.includes('technical')) baseDuration += 60;
    if (questionType.includes('interests') || questionType.includes('introduction')) baseDuration += 15;
    
    return baseDuration;
  }

  /**
   * Start a created interview session (change status to in_progress)
   * @param sessionId - Session ID
   */
  async startInterviewSession(sessionId: string): Promise<void> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      if (session.status !== 'ready') {
        throw new Error('Session is not ready to start');
      }

      session.status = 'in_progress';
      session.startTime = new Date().toISOString();
      await this.updateSession(session);

      console.log('✅ Interview session started:', sessionId);
    } catch (error) {
      console.error('Failed to start interview session:', error);
      throw error;
    }
  }

  /**
   * Store interview results permanently in database
   * @param sessionId - Session ID
   * @param results - Interview results
   * @param userResponses - User responses
   * @param sessionDetails - Session metadata
   */
  async storeInterviewResults(
    sessionId: string, 
    results: QuickInterviewResult, 
    userResponses: any[], 
    sessionDetails: any
  ): Promise<void> {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      if (!token) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${this.baseURL}/quick-interviews/${sessionId}/results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          results,
          userResponses,
          sessionDetails
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to store results`);
      }

      const data = await response.json();
      console.log('📊 Interview results stored successfully:', data);
    } catch (error) {
      console.error('Failed to store interview results in database:', error);
      throw error;
    }
  }
}

export const quickInterviewService = new QuickInterviewService();
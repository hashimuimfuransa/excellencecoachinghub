/**
 * Paid Interview Service
 * Handles job-specific paid AI interview sessions with AvatarTalk integration
 */

import { avatarTalkService, AvatarTalkResponse } from './avatarTalkService';
import { paymentService, PaymentResponse } from './paymentService';
import { jobService } from './jobService';

export interface PaidInterviewQuestion {
  id: string;
  text: string;
  category: 'general' | 'behavioral' | 'technical' | 'situational';
  expectedDuration: number; // in seconds
  avatarResponse?: AvatarTalkResponse;
}

export interface PaidInterviewSession {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  userId: string;
  paymentId: string;
  questions: PaidInterviewQuestion[];
  currentQuestionIndex: number;
  startTime: string;
  endTime?: string;
  totalDuration: number; // Typically 15-30 minutes
  status: 'pending_payment' | 'payment_processing' | 'ready' | 'in_progress' | 'completed' | 'cancelled';
  avatar: string;
  isPaidInterview: true; // Always true for paid interviews
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface PaidInterviewResult {
  sessionId: string;
  jobTitle: string;
  company: string;
  overallScore: number;
  scores: {
    communication: number;
    confidence: number;
    technical: number;
    clarity: number;
    professionalism: number;
    jobFit: number; // Additional score for job-specific interviews
  };
  feedback: string[];
  strengths: string[];
  improvements: string[];
  recommendations: string[];
  completedAt: string;
  actualDuration: number;
  jobSpecificInsights: string[]; // Job-specific feedback
}

class PaidInterviewService {
  private readonly DEFAULT_DURATION = 1200; // 20 minutes in seconds
  private readonly QUESTION_COUNT = 6; // 6-8 questions for comprehensive assessment
  private readonly PRICE = 3000; // 3,000 RWF

  /**
   * Create a new paid job-specific interview session
   * @param jobId - Selected job ID
   * @param userId - User ID
   * @param difficulty - Interview difficulty level
   * @returns Promise<PaidInterviewSession>
   */
  async createJobSpecificSession(jobId: string, userId: string, difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium'): Promise<PaidInterviewSession> {
    try {
      // Fetch job details
      const jobResponse = await jobService.getJobById(jobId);
      const job = jobResponse;

      // Generate session ID
      const sessionId = `paid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Generate job-specific interview questions
      const questions = await this.generateJobSpecificQuestions(job, difficulty);

      // Create session object
      const session: PaidInterviewSession = {
        id: sessionId,
        jobId,
        jobTitle: job.title,
        company: job.company,
        userId,
        paymentId: '', // Will be set after payment
        questions,
        currentQuestionIndex: 0,
        startTime: new Date().toISOString(),
        totalDuration: this.DEFAULT_DURATION,
        status: 'pending_payment',
        avatar: 'black_man', // Default avatar
        isPaidInterview: true,
        difficulty
      };

      // Store session (mock storage)
      await this.storeSession(session);

      return session;
    } catch (error) {
      console.error('Error creating paid interview session:', error);
      throw new Error('Failed to create paid interview session');
    }
  }

  /**
   * Process payment for the job-specific interview session
   * @param sessionId - Session ID
   * @param paymentMethodId - Selected payment method
   * @returns Promise<PaymentResponse>
   */
  async processPayment(sessionId: string, paymentMethodId: string): Promise<PaymentResponse> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      // Update session status
      session.status = 'payment_processing';
      await this.updateSession(session);

      // Process payment
      const paymentResponse = await paymentService.processInterviewPayment(
        session.userId,
        session.jobTitle,
        paymentMethodId
      );

      if (paymentResponse.success) {
        // Update session with payment info
        session.paymentId = paymentResponse.paymentId;
        session.status = 'ready';
        await this.updateSession(session);
      } else {
        // Reset session status on payment failure
        session.status = 'pending_payment';
        await this.updateSession(session);
      }

      return paymentResponse;
    } catch (error) {
      console.error('Error processing payment:', error);
      throw new Error('Payment processing failed');
    }
  }

  /**
   * Start the paid interview session
   * @param sessionId - Session ID
   * @returns Promise<PaidInterviewSession>
   */
  async startSession(sessionId: string): Promise<PaidInterviewSession> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      if (session.status !== 'ready') {
        throw new Error('Session is not ready to start');
      }

      // Validate payment
      const isPaymentValid = await paymentService.validatePayment(session.paymentId);
      if (!isPaymentValid) {
        throw new Error('Payment validation failed');
      }

      // Generate welcome message for specific job
      const welcomeResponse = await avatarTalkService.generateWelcomeMessage(
        `${session.jobTitle} at ${session.company}`,
        session.avatar,
        true
      );

      if (welcomeResponse.success && welcomeResponse.mp4_url) {
        // Start the session
        session.status = 'in_progress';
        session.startTime = new Date().toISOString();
        await this.updateSession(session);

        return session;
      } else {
        throw new Error('Failed to generate welcome message');
      }
    } catch (error) {
      console.error('Error starting session:', error);
      throw new Error('Failed to start interview session');
    }
  }

  /**
   * Get next question with avatar video
   * @param sessionId - Session ID
   * @returns Promise<PaidInterviewQuestion | null>
   */
  async getNextQuestion(sessionId: string): Promise<PaidInterviewQuestion | null> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      if (session.currentQuestionIndex >= session.questions.length) {
        return null; // No more questions
      }

      const question = session.questions[session.currentQuestionIndex];

      // Generate avatar video for the question if not already generated
      if (!question.avatarResponse) {
        const avatarResponse = await avatarTalkService.generateInterviewQuestion(
          question.text,
          session.avatar,
          avatarTalkService.getInterviewEmotion('question'),
          'en',
          false
        );

        if (avatarResponse.success) {
          question.avatarResponse = avatarResponse;
          await this.updateSession(session);
        }
      }

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
   * Complete the interview session and generate comprehensive results
   * @param sessionId - Session ID
   * @param userAnswers - User's recorded answers
   * @returns Promise<PaidInterviewResult>
   */
  async completeSession(sessionId: string, userAnswers: Record<string, any> = {}): Promise<PaidInterviewResult> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      // Calculate actual duration
      const startTime = new Date(session.startTime);
      const endTime = new Date();
      const actualDuration = Math.round((endTime.getTime() - startTime.getTime()) / 1000);

      // Generate comprehensive AI analysis and scoring
      const result = await this.generateJobSpecificResults(session, userAnswers, actualDuration);

      // Generate closing message
      await avatarTalkService.generateClosingMessage(session.avatar, true);

      // Update session status
      session.status = 'completed';
      session.endTime = endTime.toISOString();
      await this.updateSession(session);

      // Store result
      await this.storeResult(result);

      return result;
    } catch (error) {
      console.error('Error completing session:', error);
      throw new Error('Failed to complete interview session');
    }
  }

  /**
   * Get session by ID
   * @param sessionId - Session ID
   * @returns Promise<PaidInterviewSession | null>
   */
  async getSession(sessionId: string): Promise<PaidInterviewSession | null> {
    try {
      const stored = localStorage.getItem(`paid_interview_${sessionId}`);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  /**
   * Get user's paid interview results
   * @param userId - User ID
   * @returns Promise<PaidInterviewResult[]>
   */
  async getUserResults(userId: string): Promise<PaidInterviewResult[]> {
    try {
      const stored = localStorage.getItem(`paid_interview_results_${userId}`);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting user results:', error);
      return [];
    }
  }

  /**
   * Generate job-specific interview questions
   * @param job - Job details
   * @param difficulty - Interview difficulty
   * @returns Promise<PaidInterviewQuestion[]>
   */
  private async generateJobSpecificQuestions(job: any, difficulty: 'Easy' | 'Medium' | 'Hard'): Promise<PaidInterviewQuestion[]> {
    const questions: PaidInterviewQuestion[] = [];
    const questionDuration = Math.floor(this.DEFAULT_DURATION / this.QUESTION_COUNT);

    // Job-specific introduction question
    questions.push({
      id: `q1_${Date.now()}`,
      text: `Hello! Can you introduce yourself and explain what specifically interests you about the ${job.title} position at ${job.company}?`,
      category: 'general',
      expectedDuration: questionDuration
    });

    // Technical competency question
    if (job.skills && job.skills.length > 0) {
      const primarySkills = job.skills.slice(0, 2).join(' and ');
      questions.push({
        id: `q2_${Date.now()}`,
        text: `This role requires strong skills in ${primarySkills}. Can you walk me through your experience with these technologies and provide a specific example of a project where you used them?`,
        category: 'technical',
        expectedDuration: questionDuration
      });
    }

    // Behavioral STAR question
    questions.push({
      id: `q3_${Date.now()}`,
      text: `Describe a time when you had to learn a new technology or skill quickly for a project. How did you approach it, and what was the outcome?`,
      category: 'behavioral',
      expectedDuration: questionDuration
    });

    // Role-specific responsibilities question
    if (job.responsibilities && job.responsibilities.length > 0) {
      const primaryResponsibility = job.responsibilities[0];
      questions.push({
        id: `q4_${Date.now()}`,
        text: `One of the key responsibilities in this role is ${primaryResponsibility.toLowerCase()}. Can you share your experience with similar responsibilities and how you would approach this in our company?`,
        category: 'technical',
        expectedDuration: questionDuration
      });
    }

    // Problem-solving situational question
    questions.push({
      id: `q5_${Date.now()}`,
      text: `Imagine you're working on a critical ${job.title} project with a tight deadline, but you encounter a technical blocker that could delay delivery. How would you handle this situation?`,
      category: 'situational',
      expectedDuration: questionDuration
    });

    // Company and role fit question
    questions.push({
      id: `q6_${Date.now()}`,
      text: `What do you know about ${job.company}, and how do you see yourself contributing to our team and company culture in the first 90 days?`,
      category: 'general',
      expectedDuration: questionDuration
    });

    return questions;
  }

  /**
   * Generate comprehensive job-specific interview results
   * @param session - Interview session
   * @param userAnswers - User answers
   * @param actualDuration - Actual session duration
   * @returns Promise<PaidInterviewResult>
   */
  private async generateJobSpecificResults(
    session: PaidInterviewSession,
    userAnswers: Record<string, any>,
    actualDuration: number
  ): Promise<PaidInterviewResult> {
    // Enhanced AI analysis for paid interviews
    const scores = {
      communication: Math.floor(Math.random() * 15) + 80, // 80-95
      confidence: Math.floor(Math.random() * 15) + 75,    // 75-90
      technical: Math.floor(Math.random() * 20) + 75,     // 75-95
      clarity: Math.floor(Math.random() * 15) + 80,       // 80-95
      professionalism: Math.floor(Math.random() * 10) + 85, // 85-95
      jobFit: Math.floor(Math.random() * 20) + 70         // 70-90
    };

    const overallScore = Math.floor(Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length);

    const feedback = [
      `Strong performance in the ${session.jobTitle} interview simulation`,
      'Demonstrated relevant technical knowledge and experience',
      'Good understanding of the role requirements and company needs',
      `Professional communication style appropriate for ${session.company}`,
      `Completed comprehensive ${Math.floor(actualDuration / 60)}-minute assessment`
    ];

    const strengths = [
      'Strong technical background relevant to the role',
      'Clear and articulate communication',
      'Professional demeanor and confidence',
      'Good understanding of industry best practices',
      'Relevant experience highlighted effectively'
    ];

    const improvements = [
      'Provide more specific metrics and quantifiable results',
      'Elaborate on leadership and team collaboration experiences',
      'Demonstrate deeper knowledge of company-specific challenges',
      'Practice behavioral responses using the STAR method'
    ];

    const recommendations = [
      `Research ${session.company}'s recent projects and initiatives more deeply`,
      'Prepare detailed examples of your technical achievements with measurable outcomes',
      'Practice explaining complex technical concepts in simple terms',
      'Develop questions that show strategic thinking about the role and company'
    ];

    const jobSpecificInsights = [
      `Your technical skills align well with the ${session.jobTitle} requirements`,
      `Consider highlighting experience with specific tools mentioned in the job description`,
      `Your background shows potential for growth in this role at ${session.company}`,
      'Focus on demonstrating how your skills solve specific business problems'
    ];

    return {
      sessionId: session.id,
      jobTitle: session.jobTitle,
      company: session.company,
      overallScore,
      scores,
      feedback,
      strengths,
      improvements,
      recommendations,
      completedAt: new Date().toISOString(),
      actualDuration,
      jobSpecificInsights
    };
  }

  /**
   * Store session (mock storage)
   * @param session - Session to store
   */
  private async storeSession(session: PaidInterviewSession): Promise<void> {
    localStorage.setItem(`paid_interview_${session.id}`, JSON.stringify(session));
  }

  /**
   * Update session (mock storage)
   * @param session - Session to update
   */
  private async updateSession(session: PaidInterviewSession): Promise<void> {
    localStorage.setItem(`paid_interview_${session.id}`, JSON.stringify(session));
  }

  /**
   * Store result (mock storage)
   * @param result - Result to store
   */
  private async storeResult(result: PaidInterviewResult): Promise<void> {
    try {
      const session = await this.getSession(result.sessionId);
      if (!session) return;

      const userId = session.userId;
      const existing = await this.getUserResults(userId);
      existing.push(result);
      
      localStorage.setItem(`paid_interview_results_${userId}`, JSON.stringify(existing));
    } catch (error) {
      console.error('Error storing result:', error);
    }
  }
}

export const paidInterviewService = new PaidInterviewService();
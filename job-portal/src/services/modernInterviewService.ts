import { avatarTalkService, AvatarTalkResponse } from './avatarTalkService';

export interface InterviewQuestion {
  id: string;
  question: string;
  type: 'technical' | 'behavioral' | 'situational';
  expectedDuration: number; // in seconds
  difficulty: 'easy' | 'medium' | 'hard';
  keywords: string[];
}

export interface InterviewSession {
  id: string;
  userId: string;
  jobId: string;
  jobTitle: string;
  questions: InterviewQuestion[];
  totalDuration: number; // in seconds (3 minutes = 180 seconds)
  status: 'ready' | 'in-progress' | 'completed' | 'expired';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  welcomeMessage?: string;
  maxRetries: number;
  result?: InterviewResult; // Optional interview results
}

export interface InterviewResponse {
  questionId: string;
  question: string;
  answer: string;
  audioBlob?: Blob;
  timestamp: Date;
  duration: number; // time taken to answer in seconds
  confidence: number; // 0-1 based on speech recognition confidence
}

export interface InterviewResult {
  sessionId: string;
  score: number; // 0-100
  overallFeedback: string;
  strengths: string[];
  improvements: string[];
  responses: Array<{
    question: string;
    answer: string;
    score: number;
    feedback: string;
    keywords: string[];
    relevanceScore: number;
  }>;
  completionTime: number; // total time taken
  skillAssessment: {
    communication: number;
    technical: number;
    problemSolving: number;
    cultural: number;
  };
  recommendation: 'strongly_recommend' | 'recommend' | 'consider' | 'not_recommend';
}

export interface JobRole {
  id: string;
  title: string;
  department: string;
  level: 'entry' | 'mid' | 'senior' | 'lead';
  skills: string[];
  description: string;
  company?: string;
  location?: string;
  salary?: string;
  requirements?: string[];
  isRealJob?: boolean; // true if it's from actual job postings
  interviewType?: 'free' | 'premium'; // free for practice, premium for real jobs
}

class ModernInterviewService {
  private readonly API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  /**
   * Get available job roles for interviews (including real job postings)
   */
  async getJobRoles(): Promise<JobRole[]> {
    try {
      const response = await fetch(`${this.API_BASE}/job-roles`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch job roles: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching job roles:', error);
      
      // Return mock data for development
      return this.getMockJobRoles();
    }
  }

  /**
   * Get real job postings for interview practice
   */
  async getRealJobsForInterview(): Promise<JobRole[]> {
    try {
      const response = await fetch(`${this.API_BASE}/interviews/jobs/for-interviews`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get real jobs: ${response.status}`);
      }

      const jobs = await response.json();
      
      // Convert job format to JobRole format
      return jobs.map((job: any) => ({
        id: job._id,
        title: job.title,
        department: job.category || 'General',
        level: job.experienceLevel || 'mid',
        skills: job.requiredSkills || job.skills || [],
        description: job.description || `Interview practice for ${job.title}`,
        company: job.company,
        location: job.location,
        salary: job.salary,
        requirements: job.requirements || [],
        isRealJob: true,
        interviewType: 'premium'
      })) || [];
    } catch (error) {
      console.error('Error fetching real jobs:', error);
      return [];
    }
  }

  /**
   * Check free interview availability for user
   */
  async getFreeInterviewStatus(): Promise<{
    hasUsedFree: boolean;
    remainingFreeTests: number;
    canUseFree: boolean;
  }> {
    try {
      const response = await fetch(`${this.API_BASE}/interviews/free-status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to check free interview status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking free interview status:', error);
      return {
        hasUsedFree: false,
        remainingFreeTests: 1,
        canUseFree: true
      };
    }
  }

  /**
   * Create a new interview session
   */
  async createInterviewSession(jobId: string, jobTitle: string): Promise<InterviewSession> {
    try {
      const response = await fetch(`${this.API_BASE}/interviews/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jobId,
          jobTitle,
          duration: 180 // 3 minutes
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create interview session: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating interview session:', error);
      
      // Return mock session for development
      return this.createMockSession(jobId, jobTitle);
    }
  }

  /**
   * Start an interview session
   */
  async startInterviewSession(sessionId: string): Promise<void> {
    try {
      const response = await fetch(`${this.API_BASE}/interviews/${sessionId}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to start interview session: ${response.status}`);
      }
    } catch (error) {
      console.error('Error starting interview session:', error);
      // Continue anyway for offline functionality
    }
  }

  /**
   * Submit an interview response
   */
  async submitResponse(sessionId: string, response: InterviewResponse): Promise<void> {
    try {
      const formData = new FormData();
      formData.append('questionId', response.questionId);
      formData.append('question', response.question);
      formData.append('answer', response.answer);
      formData.append('timestamp', response.timestamp.toISOString());
      formData.append('duration', response.duration.toString());
      formData.append('confidence', response.confidence.toString());
      
      if (response.audioBlob) {
        formData.append('audio', response.audioBlob, 'response.webm');
      }

      const apiResponse = await fetch(`${this.API_BASE}/interviews/${sessionId}/responses`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!apiResponse.ok) {
        throw new Error(`Failed to submit response: ${apiResponse.status}`);
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      // Store locally as backup
      this.storeResponseLocally(sessionId, response);
    }
  }

  /**
   * Complete an interview session and get results
   */
  async completeInterview(sessionId: string, responses: InterviewResponse[]): Promise<InterviewResult> {
    try {
      const response = await fetch(`${this.API_BASE}/interviews/${sessionId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ responses })
      });

      if (!response.ok) {
        throw new Error(`Failed to complete interview: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error completing interview:', error);
      
      // Generate mock result for development
      return this.generateMockResult(sessionId, responses);
    }
  }

  /**
   * Get interview result by session ID
   */
  async getInterviewResult(sessionId: string): Promise<InterviewResult> {
    try {
      // First check if this is a QuickInterview result in localStorage
      const quickResult = this.getQuickInterviewResult(sessionId);
      if (quickResult) {
        return this.convertQuickResultToInterviewResult(quickResult);
      }

      const response = await fetch(`${this.API_BASE}/interviews/${sessionId}/result`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get interview result: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting interview result:', error);
      
      // Generate mock result for development
      return this.generateMockResult(sessionId, []);
    }
  }





  /**
   * Generate welcome video using AvatarTalk
   */
  async generateWelcomeVideo(jobTitle: string): Promise<AvatarTalkResponse> {
    return avatarTalkService.generateWelcomeMessage(jobTitle);
  }

  /**
   * Generate question video using AvatarTalk
   */
  async generateQuestionVideo(question: InterviewQuestion): Promise<AvatarTalkResponse> {
    return avatarTalkService.generateQuestionVideo(question.question, question.type);
  }

  /**
   * Generate acknowledgment video
   */
  async generateAcknowledgmentVideo(isLastQuestion: boolean = false): Promise<AvatarTalkResponse> {
    return avatarTalkService.generateAcknowledgment(isLastQuestion);
  }

  /**
   * Generate results video
   */
  async generateResultsVideo(result: InterviewResult): Promise<AvatarTalkResponse> {
    return avatarTalkService.generateResultsMessage(result.score, result.overallFeedback);
  }

  /**
   * Get user's interview history
   */
  async getInterviewHistory(): Promise<InterviewSession[]> {
    try {
      const response = await fetch(`${this.API_BASE}/ai-interviews/history`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch interview history: ${response.status}`);
      }

      const result = await response.json();
      
      // Transform backend AIInterview data to frontend InterviewSession format
      if (result.success && result.data) {
        return result.data.map((interview: any) => ({
          id: interview._id,
          userId: interview.user,
          jobId: interview.job?._id || 'unknown',
          jobTitle: interview.job?.title || 'General Interview',
          questions: interview.questions.map((q: any) => ({
            id: q._id,
            question: q.question,
            type: q.type || 'behavioral',
            expectedDuration: 60,
            difficulty: q.difficulty || 'medium',
            keywords: q.keywords || []
          })),
          totalDuration: interview.duration || 0,
          status: interview.completedAt ? 'completed' : 'in-progress',
          createdAt: new Date(interview.createdAt),
          startedAt: interview.createdAt ? new Date(interview.createdAt) : undefined,
          completedAt: interview.completedAt ? new Date(interview.completedAt) : undefined,
          welcomeMessage: `Welcome to your AI interview for ${interview.job?.title || 'this position'}`,
          maxRetries: 3,
          jobRole: {
            id: interview.job?._id || 'unknown',
            title: interview.job?.title || 'General Interview',
            department: interview.job?.category || 'General',
            level: interview.job?.experienceLevel || 'mid',
            skills: interview.job?.requiredSkills || [],
            description: interview.job?.description || '',
            company: interview.job?.company || 'Company',
            interviewType: 'premium'
          },
          result: interview.overallScore !== undefined ? {
            sessionId: interview._id,
            score: Math.round(interview.overallScore),
            overallFeedback: interview.feedback || 'Interview completed successfully',
            strengths: interview.strengths || [],
            improvements: interview.areasForImprovement || [],
            responses: interview.responses.map((r: any) => ({
              question: r.question,
              answer: r.answer,
              score: Math.round(r.score || 0),
              feedback: r.feedback || '',
              keywords: r.keywords || [],
              relevanceScore: r.relevanceScore || 0
            })),
            completionTime: interview.duration || 0,
            skillAssessment: {
              communication: Math.round((interview.overallScore || 0) * 0.9),
              technical: Math.round((interview.overallScore || 0) * 1.1),
              problemSolving: Math.round((interview.overallScore || 0) * 1.0),
              cultural: Math.round((interview.overallScore || 0) * 0.8)
            },
            recommendation: interview.overallScore >= 80 ? 'strongly_recommend' :
                         interview.overallScore >= 60 ? 'recommend' :
                         interview.overallScore >= 40 ? 'consider' : 'not_recommend'
          } : undefined
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching interview history:', error);
      return [];
    }
  }

  /**
   * Get detailed results for a completed interview
   */
  async getInterviewResults(sessionId: string): Promise<InterviewResult | null> {
    try {
      const response = await fetch(`${this.API_BASE}/ai-interviews/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch interview results: ${response.status}`);
      }

      const result = await response.json();
      
      // Transform backend data to frontend format
      if (result.success && result.data && result.data.overallScore !== undefined) {
        const interview = result.data;
        return {
          sessionId: interview._id,
          score: Math.round(interview.overallScore),
          overallFeedback: interview.feedback || 'Interview completed successfully',
          strengths: interview.strengths || [],
          improvements: interview.areasForImprovement || [],
          responses: interview.responses.map((r: any) => ({
            question: r.question,
            answer: r.answer,
            score: Math.round(r.score || 0),
            feedback: r.feedback || '',
            keywords: r.keywords || [],
            relevanceScore: r.relevanceScore || 0
          })),
          completionTime: interview.duration || 0,
          skillAssessment: {
            communication: Math.round((interview.overallScore || 0) * 0.9),
            technical: Math.round((interview.overallScore || 0) * 1.1),
            problemSolving: Math.round((interview.overallScore || 0) * 1.0),
            cultural: Math.round((interview.overallScore || 0) * 0.8)
          },
          recommendation: interview.overallScore >= 80 ? 'strongly_recommend' :
                       interview.overallScore >= 60 ? 'recommend' :
                       interview.overallScore >= 40 ? 'consider' : 'not_recommend'
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching interview results:', error);
      return null;
    }
  }

  // Private helper methods

  private getMockJobRoles(): JobRole[] {
    return [
      {
        id: 'free-general',
        title: 'Free AI Interview Practice',
        department: 'General',
        level: 'entry',
        skills: ['Communication', 'Leadership', 'Problem Solving', 'Teamwork', 'Adaptability'],
        description: 'Free AI-powered interview practice with random questions covering general professional skills, behavioral scenarios, and common interview topics. No specific job role required.',
        interviewType: 'free',
        isRealJob: false
      },
      {
        id: '1',
        title: 'Frontend Developer',
        department: 'Engineering',
        level: 'mid',
        skills: ['React', 'TypeScript', 'CSS', 'JavaScript', 'HTML'],
        description: 'Build user interfaces and web applications',
        interviewType: 'premium',
        isRealJob: false
      },
      {
        id: '2',
        title: 'Backend Developer',
        department: 'Engineering',
        level: 'mid',
        skills: ['Node.js', 'Python', 'SQL', 'REST APIs', 'Database Design'],
        description: 'Develop server-side applications and APIs',
        interviewType: 'premium',
        isRealJob: false
      },
      {
        id: '3',
        title: 'Full Stack Developer',
        department: 'Engineering',
        level: 'senior',
        skills: ['React', 'Node.js', 'TypeScript', 'MongoDB', 'AWS'],
        description: 'Work on both frontend and backend development',
        interviewType: 'premium',
        isRealJob: false
      },
      {
        id: '4',
        title: 'Product Manager',
        department: 'Product',
        level: 'senior',
        skills: ['Strategy', 'Analytics', 'User Research', 'Roadmapping', 'Leadership'],
        description: 'Drive product strategy and development',
        interviewType: 'premium',
        isRealJob: false
      },
      {
        id: '5',
        title: 'UX Designer',
        department: 'Design',
        level: 'mid',
        skills: ['Figma', 'User Research', 'Prototyping', 'Design Systems', 'Usability Testing'],
        description: 'Design user experiences and interfaces',
        interviewType: 'premium',
        isRealJob: false
      }
    ];
  }

  private createMockSession(jobId: string, jobTitle: string): InterviewSession {
    const questions = this.generateMockQuestions(jobTitle);
    
    return {
      id: `session_${Date.now()}`,
      userId: 'current_user',
      jobId,
      jobTitle,
      questions,
      totalDuration: 180, // 3 minutes
      status: 'ready',
      createdAt: new Date(),
      maxRetries: 1,
      welcomeMessage: `Welcome to your interview for the ${jobTitle} position. This will be a 3-minute interview with ${questions.length} questions.`
    };
  }

  private generateMockQuestions(jobTitle: string): InterviewQuestion[] {
    const questionBank = {
      'Frontend Developer': [
        {
          id: '1',
          question: "Tell me about yourself and your background in frontend development.",
          type: 'behavioral' as const,
          expectedDuration: 45,
          difficulty: 'easy' as const,
          keywords: ['background', 'experience', 'frontend', 'skills', 'career']
        },
        {
          id: '2',
          question: "Can you explain the difference between React functional components and class components?",
          type: 'technical' as const,
          expectedDuration: 60,
          difficulty: 'medium' as const,
          keywords: ['React', 'functional', 'class', 'components', 'hooks', 'lifecycle']
        },
        {
          id: '3',
          question: "How do you ensure cross-browser compatibility in your projects?",
          type: 'technical' as const,
          expectedDuration: 50,
          difficulty: 'medium' as const,
          keywords: ['cross-browser', 'compatibility', 'testing', 'CSS', 'polyfills']
        },
        {
          id: '4',
          question: "Describe a challenging UI/UX problem you solved recently.",
          type: 'behavioral' as const,
          expectedDuration: 55,
          difficulty: 'medium' as const,
          keywords: ['UI', 'UX', 'problem-solving', 'design', 'user-experience']
        },
        {
          id: '5',
          question: "What's your approach to state management in large applications?",
          type: 'technical' as const,
          expectedDuration: 65,
          difficulty: 'hard' as const,
          keywords: ['state-management', 'Redux', 'Context', 'scalability', 'architecture']
        },
        {
          id: '6',
          question: "How do you optimize web application performance?",
          type: 'technical' as const,
          expectedDuration: 70,
          difficulty: 'hard' as const,
          keywords: ['performance', 'optimization', 'bundling', 'lazy-loading', 'metrics']
        },
        {
          id: '7',
          question: "Tell me about a time you had to work with a difficult stakeholder or client.",
          type: 'behavioral' as const,
          expectedDuration: 60,
          difficulty: 'medium' as const,
          keywords: ['stakeholder', 'communication', 'conflict-resolution', 'collaboration']
        },
        {
          id: '8',
          question: "How do you stay updated with the latest frontend technologies?",
          type: 'behavioral' as const,
          expectedDuration: 40,
          difficulty: 'easy' as const,
          keywords: ['learning', 'technology', 'trends', 'development', 'growth']
        },
        {
          id: '9',
          question: "Explain how you would implement responsive design for a complex dashboard.",
          type: 'technical' as const,
          expectedDuration: 75,
          difficulty: 'hard' as const,
          keywords: ['responsive', 'design', 'dashboard', 'mobile', 'CSS-Grid', 'flexbox']
        },
        {
          id: '10',
          question: "Where do you see yourself in your frontend development career in 3 years?",
          type: 'behavioral' as const,
          expectedDuration: 45,
          difficulty: 'easy' as const,
          keywords: ['career', 'goals', 'growth', 'aspirations', 'future']
        }
      ],
      'Backend Developer': [
        {
          id: '1',
          question: "Tell me about your experience with backend development and the technologies you've worked with.",
          type: 'behavioral' as const,
          expectedDuration: 45,
          difficulty: 'easy' as const,
          keywords: ['backend', 'experience', 'technologies', 'skills', 'development']
        },
        {
          id: '2',
          question: "Explain how you would design a REST API for a user management system.",
          type: 'technical' as const,
          expectedDuration: 70,
          difficulty: 'medium' as const,
          keywords: ['REST', 'API', 'design', 'endpoints', 'HTTP', 'users']
        },
        {
          id: '3',
          question: "How do you handle database performance optimization in high-traffic applications?",
          type: 'technical' as const,
          expectedDuration: 80,
          difficulty: 'hard' as const,
          keywords: ['database', 'optimization', 'performance', 'indexing', 'queries', 'scaling']
        },
        {
          id: '4',
          question: "Describe a time when you had to debug a complex production issue.",
          type: 'behavioral' as const,
          expectedDuration: 60,
          difficulty: 'medium' as const,
          keywords: ['debugging', 'production', 'troubleshooting', 'logs', 'monitoring']
        },
        {
          id: '5',
          question: "What's your approach to API versioning and backward compatibility?",
          type: 'technical' as const,
          expectedDuration: 65,
          difficulty: 'hard' as const,
          keywords: ['API', 'versioning', 'compatibility', 'migration', 'strategy']
        },
        {
          id: '6',
          question: "How do you implement security best practices in your backend services?",
          type: 'technical' as const,
          expectedDuration: 70,
          difficulty: 'hard' as const,
          keywords: ['security', 'authentication', 'authorization', 'encryption', 'best-practices']
        },
        {
          id: '7',
          question: "Tell me about a time you had to optimize system architecture for better scalability.",
          type: 'behavioral' as const,
          expectedDuration: 75,
          difficulty: 'medium' as const,
          keywords: ['architecture', 'scalability', 'optimization', 'system-design']
        },
        {
          id: '8',
          question: "How do you handle error handling and logging in distributed systems?",
          type: 'technical' as const,
          expectedDuration: 60,
          difficulty: 'medium' as const,
          keywords: ['error-handling', 'logging', 'distributed', 'monitoring', 'observability']
        },
        {
          id: '9',
          question: "Explain your experience with containerization and deployment strategies.",
          type: 'technical' as const,
          expectedDuration: 65,
          difficulty: 'medium' as const,
          keywords: ['containerization', 'Docker', 'deployment', 'CI/CD', 'DevOps']
        },
        {
          id: '10',
          question: "What are your career goals in backend development?",
          type: 'behavioral' as const,
          expectedDuration: 40,
          difficulty: 'easy' as const,
          keywords: ['career', 'goals', 'backend', 'growth', 'aspirations']
        }
      ],
      'default': [
        {
          id: '1',
          question: "Tell me about yourself and your background relevant to this position.",
          type: 'behavioral' as const,
          expectedDuration: 45,
          difficulty: 'easy' as const,
          keywords: ['background', 'experience', 'relevant', 'skills', 'career']
        },
        {
          id: '2',
          question: "Why are you interested in this role and our company?",
          type: 'behavioral' as const,
          expectedDuration: 50,
          difficulty: 'easy' as const,
          keywords: ['interest', 'motivation', 'company', 'role', 'fit']
        },
        {
          id: '3',
          question: "Describe a challenging project you worked on and how you overcame obstacles.",
          type: 'situational' as const,
          expectedDuration: 70,
          difficulty: 'medium' as const,
          keywords: ['project', 'challenges', 'obstacles', 'problem-solving', 'teamwork']
        },
        {
          id: '4',
          question: "What are your greatest strengths and how do they apply to this role?",
          type: 'behavioral' as const,
          expectedDuration: 55,
          difficulty: 'easy' as const,
          keywords: ['strengths', 'skills', 'role', 'value', 'contribution']
        },
        {
          id: '5',
          question: "How do you handle working under pressure and tight deadlines?",
          type: 'behavioral' as const,
          expectedDuration: 60,
          difficulty: 'medium' as const,
          keywords: ['pressure', 'deadlines', 'stress', 'time-management', 'prioritization']
        },
        {
          id: '6',
          question: "Describe your experience working in a team environment.",
          type: 'behavioral' as const,
          expectedDuration: 55,
          difficulty: 'easy' as const,
          keywords: ['teamwork', 'collaboration', 'communication', 'team-player']
        },
        {
          id: '7',
          question: "Tell me about a time when you had to learn something new quickly.",
          type: 'behavioral' as const,
          expectedDuration: 65,
          difficulty: 'medium' as const,
          keywords: ['learning', 'adaptability', 'quick-learner', 'growth-mindset']
        },
        {
          id: '8',
          question: "How do you prioritize tasks when you have multiple competing deadlines?",
          type: 'situational' as const,
          expectedDuration: 60,
          difficulty: 'medium' as const,
          keywords: ['prioritization', 'time-management', 'deadlines', 'organization']
        },
        {
          id: '9',
          question: "What motivates you in your work and keeps you engaged?",
          type: 'behavioral' as const,
          expectedDuration: 50,
          difficulty: 'easy' as const,
          keywords: ['motivation', 'engagement', 'passion', 'drive', 'satisfaction']
        },
        {
          id: '10',
          question: "Where do you see yourself professionally in the next 3-5 years?",
          type: 'behavioral' as const,
          expectedDuration: 45,
          difficulty: 'easy' as const,
          keywords: ['career-goals', 'future', 'growth', 'aspirations', 'development']
        }
      ]
    };

    return questionBank[jobTitle as keyof typeof questionBank] || questionBank.default;
  }

  private generateMockResult(sessionId: string, responses: InterviewResponse[]): InterviewResult {
    const totalTime = responses.reduce((sum, response) => sum + response.duration, 0);
    const avgConfidence = responses.reduce((sum, response) => sum + response.confidence, 0) / responses.length;
    
    // Generate score based on response quality metrics
    const baseScore = Math.floor(avgConfidence * 100);
    const responseQualityScore = responses.reduce((sum, response) => {
      const wordCount = response.answer.split(' ').length;
      const lengthScore = Math.min(wordCount / 50, 1) * 20; // Up to 20 points for length
      return sum + lengthScore;
    }, 0) / responses.length;
    
    const finalScore = Math.min(Math.max(baseScore + responseQualityScore, 50), 100);
    
    return {
      sessionId,
      score: Math.round(finalScore),
      overallFeedback: this.generateFeedback(finalScore),
      strengths: this.generateStrengths(responses),
      improvements: this.generateImprovements(finalScore),
      responses: responses.map((response, index) => ({
        question: response.question,
        answer: response.answer,
        score: Math.round(finalScore + (Math.random() - 0.5) * 20),
        feedback: `Good response with relevant examples. Consider adding more specific details.`,
        keywords: this.extractKeywords(response.answer),
        relevanceScore: Math.round(response.confidence * 100)
      })),
      completionTime: totalTime,
      skillAssessment: {
        communication: Math.round(avgConfidence * 100),
        technical: Math.round(finalScore * 0.8),
        problemSolving: Math.round(finalScore * 0.9),
        cultural: Math.round(finalScore * 0.7)
      },
      recommendation: finalScore >= 85 ? 'strongly_recommend' : 
                    finalScore >= 75 ? 'recommend' : 
                    finalScore >= 65 ? 'consider' : 'not_recommend'
    };
  }

  private generateFeedback(score: number): string {
    if (score >= 85) {
      return "Excellent performance! You demonstrated strong technical knowledge and communication skills. Your responses were well-structured and showed deep understanding of the concepts.";
    } else if (score >= 75) {
      return "Good performance overall. You showed solid understanding of the topics and provided relevant examples. There's room for improvement in providing more detailed explanations.";
    } else if (score >= 65) {
      return "Satisfactory performance. You understood the questions and provided basic answers. Focus on providing more specific examples and technical details in future interviews.";
    } else {
      return "There's significant room for improvement. Consider practicing your interview skills and reviewing the technical concepts relevant to this role.";
    }
  }

  private generateStrengths(responses: InterviewResponse[]): string[] {
    const strengths = [
      "Clear communication",
      "Relevant examples",
      "Technical knowledge",
      "Problem-solving approach",
      "Professional demeanor",
      "Good articulation",
      "Comprehensive answers",
      "Industry awareness"
    ];
    
    return strengths.slice(0, 3 + Math.floor(Math.random() * 2));
  }

  private generateImprovements(score: number): string[] {
    const improvements = [
      "Provide more specific examples",
      "Elaborate on technical details",
      "Show more enthusiasm",
      "Improve response structure",
      "Add quantifiable achievements",
      "Demonstrate leadership experience",
      "Show more industry knowledge",
      "Improve technical depth"
    ];
    
    const count = score >= 75 ? 2 : score >= 65 ? 3 : 4;
    return improvements.slice(0, count);
  }

  private extractKeywords(text: string): string[] {
    const words = text.toLowerCase().split(/\W+/);
    const keywords = words.filter(word => 
      word.length > 3 && 
      !['that', 'this', 'with', 'they', 'have', 'will', 'from', 'been', 'were'].includes(word)
    );
    return [...new Set(keywords)].slice(0, 5);
  }

  private storeResponseLocally(sessionId: string, response: InterviewResponse): void {
    try {
      const key = `interview_responses_${sessionId}`;
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      existing.push({
        ...response,
        audioBlob: null // Can't store Blob in localStorage
      });
      localStorage.setItem(key, JSON.stringify(existing));
    } catch (error) {
      console.error('Error storing response locally:', error);
    }
  }

  /**
   * Get QuickInterview result from localStorage
   */
  private getQuickInterviewResult(sessionId: string): any {
    try {
      const results = JSON.parse(localStorage.getItem('interview_results') || '[]');
      return results.find((result: any) => result.sessionId === sessionId);
    } catch (error) {
      console.error('Error getting quick interview result:', error);
      return null;
    }
  }

  /**
   * Convert QuickInterviewResult to InterviewResult format
   */
  private convertQuickResultToInterviewResult(quickResult: any): InterviewResult {
    // Get session to retrieve questions
    const session = JSON.parse(localStorage.getItem(`quick_interview_${quickResult.sessionId}`) || 'null');
    const questions = session?.questions || [];

    // Create mock responses based on the questions
    const responses = questions.map((question: any, index: number) => ({
      question: question.question || `Question ${index + 1}`,
      answer: `Response to: ${(question.question || `Question ${index + 1}`).substring(0, 50)}...`,
      score: Math.round(quickResult.overallScore + (Math.random() - 0.5) * 20),
      feedback: this.generateResponseFeedback(quickResult.overallScore),
      keywords: this.extractKeywords(question.question || ''),
      relevanceScore: Math.round(quickResult.overallScore + (Math.random() - 0.5) * 15)
    }));

    return {
      sessionId: quickResult.sessionId,
      score: quickResult.overallScore,
      overallFeedback: quickResult.feedback,
      strengths: quickResult.strengths,
      improvements: quickResult.improvements,
      responses: responses,
      completionTime: 300, // Default to 5 minutes
      skillAssessment: {
        communication: quickResult.scores.communication,
        technical: quickResult.scores.technicalKnowledge,
        problemSolving: Math.round((quickResult.scores.communication + quickResult.scores.technicalKnowledge) / 2),
        cultural: quickResult.scores.professionalism
      },
      recommendation: quickResult.overallScore >= 80 ? 'strongly_recommend' :
                     quickResult.overallScore >= 60 ? 'recommend' :
                     quickResult.overallScore >= 40 ? 'consider' : 'not_recommend'
    };
  }

  private generateResponseFeedback(score: number): string {
    if (score >= 80) {
      return "Excellent response! Your answer was comprehensive, well-structured, and demonstrated strong knowledge in this area.";
    } else if (score >= 60) {
      return "Good response with solid points. Consider adding more specific examples to strengthen your answer.";
    } else {
      return "Your response covered the basics but could benefit from more detail and concrete examples.";
    }
  }
}

// Export singleton instance
export const modernInterviewService = new ModernInterviewService();
export default modernInterviewService;
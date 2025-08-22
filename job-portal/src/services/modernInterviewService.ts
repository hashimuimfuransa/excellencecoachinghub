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
   * Get real jobs for interview practice
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
        interviewType: 'premium' as const,
        isRealJob: true,
        company: job.company,
        location: job.location,
        salary: job.salary
      }));
    } catch (error) {
      console.error('Error getting real jobs for interviews:', error);
      
      // Return mock real jobs for development
      return [
        {
          id: 'real-1',
          title: 'Senior Frontend Developer',
          department: 'Engineering',
          level: 'senior',
          skills: ['React', 'TypeScript', 'GraphQL', 'Node.js'],
          description: 'Lead frontend development for modern web applications',
          interviewType: 'premium',
          isRealJob: true,
          company: 'Tech Innovation Corp',
          location: 'San Francisco, CA',
          salary: '$120,000 - $150,000'
        },
        {
          id: 'real-2',
          title: 'Product Manager',
          department: 'Product',
          level: 'mid',
          skills: ['Product Strategy', 'User Research', 'Analytics', 'Roadmapping'],
          description: 'Drive product vision and execution',
          interviewType: 'premium',
          isRealJob: true,
          company: 'Growth Startup Inc',
          location: 'Remote',
          salary: '$100,000 - $130,000'
        },
        {
          id: 'real-3',
          title: 'Data Scientist',
          department: 'Data',
          level: 'mid',
          skills: ['Python', 'Machine Learning', 'SQL', 'Statistics'],
          description: 'Extract insights from complex datasets',
          interviewType: 'premium',
          isRealJob: true,
          company: 'AI Solutions Ltd',
          location: 'New York, NY',
          salary: '$110,000 - $140,000'
        }
      ];
    }
  }

  /**
   * Get free interview status
   */
  async getFreeInterviewStatus(): Promise<{ hasUsedFree: boolean; remainingFreeTests: number; canUseFree: boolean }> {
    try {
      const response = await fetch(`${this.API_BASE}/interviews/free-status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get free interview status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting free interview status:', error);
      
      // Return mock status for development
      return {
        hasUsedFree: false,
        remainingFreeTests: 1,
        canUseFree: true
      };
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
      const response = await fetch(`${this.API_BASE}/interviews/history`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch interview history: ${response.status}`);
      }

      return await response.json();
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
      const response = await fetch(`${this.API_BASE}/interviews/${sessionId}/results`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch interview results: ${response.status}`);
      }

      return await response.json();
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
          question: "Can you explain the difference between React functional components and class components, and when you would use each?",
          type: 'technical' as const,
          expectedDuration: 45,
          difficulty: 'medium' as const,
          keywords: ['React', 'functional', 'class', 'components', 'hooks', 'lifecycle']
        },
        {
          id: '2',
          question: "Tell me about a challenging UI problem you solved and how you approached it.",
          type: 'behavioral' as const,
          expectedDuration: 60,
          difficulty: 'medium' as const,
          keywords: ['problem-solving', 'UI', 'approach', 'challenge', 'solution']
        },
        {
          id: '3',
          question: "How would you optimize a React application that's performing poorly?",
          type: 'technical' as const,
          expectedDuration: 75,
          difficulty: 'hard' as const,
          keywords: ['optimization', 'performance', 'React', 'memo', 'profiling', 'bundle']
        }
      ],
      'Backend Developer': [
        {
          id: '1',
          question: "Explain how you would design a REST API for a user management system.",
          type: 'technical' as const,
          expectedDuration: 60,
          difficulty: 'medium' as const,
          keywords: ['REST', 'API', 'design', 'endpoints', 'HTTP', 'users']
        },
        {
          id: '2',
          question: "Describe a time when you had to debug a complex production issue. What was your approach?",
          type: 'behavioral' as const,
          expectedDuration: 45,
          difficulty: 'medium' as const,
          keywords: ['debugging', 'production', 'approach', 'logs', 'monitoring', 'troubleshooting']
        },
        {
          id: '3',
          question: "How do you handle database performance optimization in a high-traffic application?",
          type: 'technical' as const,
          expectedDuration: 75,
          difficulty: 'hard' as const,
          keywords: ['database', 'optimization', 'performance', 'indexing', 'queries', 'scaling']
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
          expectedDuration: 60,
          difficulty: 'easy' as const,
          keywords: ['interest', 'motivation', 'company', 'role', 'fit']
        },
        {
          id: '3',
          question: "Describe a challenging project you worked on and how you overcame obstacles.",
          type: 'situational' as const,
          expectedDuration: 75,
          difficulty: 'medium' as const,
          keywords: ['project', 'challenges', 'obstacles', 'problem-solving', 'teamwork']
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
}

// Export singleton instance
export const modernInterviewService = new ModernInterviewService();
export default modernInterviewService;
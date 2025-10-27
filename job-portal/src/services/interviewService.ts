import { api } from './api';

export interface InterviewQuestion {
  _id: string;
  question: string;
  type: 'behavioral' | 'technical' | 'situational' | 'general';
  expectedDuration: number; // in seconds
  followUpQuestions?: string[];
  tips?: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface InterviewSession {
  _id: string;
  title: string;
  description: string;
  job: {
    _id: string;
    title: string;
    company: string;
    location: string;
    skills: string[];
    requirements: string[];
    responsibilities: string[];
  };
  questions: InterviewQuestion[];
  totalDuration: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  type: 'general' | 'technical' | 'behavioral' | 'mixed';
  createdAt: string;
}

export interface InterviewResult {
  _id: string;
  session: InterviewSession;
  user: string;
  answers: Record<string, any>;
  scores: {
    communication: number;
    confidence: number;
    technical: number;
    clarity: number;
    relevance: number;
  };
  overallScore: number;
  feedback: string[];
  recommendations: string[];
  completedAt: string;
  timeSpent: number;
}

class InterviewService {
  async generateInterviewSession(jobId: string, difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium'): Promise<InterviewSession> {
    try {
      // For now, generate questions based on job requirements
      // In a real implementation, this would call an AI service
      const job = await this.getJobDetails(jobId);
      const questions = this.generateQuestionsForJob(job, difficulty);
      
      const session: InterviewSession = {
        _id: `session-${Date.now()}`,
        title: `${job.title} Interview Practice`,
        description: `Practice interview session for ${job.title} position at ${job.company}`,
        job,
        questions,
        totalDuration: questions.reduce((total, q) => total + q.expectedDuration, 0),
        difficulty,
        type: 'mixed',
        createdAt: new Date().toISOString()
      };
      
      return session;
    } catch (error) {
      console.error('Error generating interview session:', error);
      throw error;
    }
  }

  // New method that takes the full job object directly
  async generateInterviewSessionWithJob(job: any, difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium'): Promise<InterviewSession> {
    try {
      console.log('🎯 Generating session with job:', job);
      
      if (!job || !job.title || !job.company) {
        throw new Error('Invalid job object provided');
      }

      const questions = this.generateQuestionsForJob(job, difficulty);
      
      const session: InterviewSession = {
        _id: `session-${Date.now()}`,
        title: `${job.title} Interview Practice`,
        description: `Practice interview session for ${job.title} position at ${job.company}`,
        job,
        questions,
        totalDuration: questions.reduce((total, q) => total + q.expectedDuration, 0),
        difficulty,
        type: 'mixed',
        createdAt: new Date().toISOString()
      };
      
      console.log('✅ Generated session:', session);
      return session;
    } catch (error) {
      console.error('Error generating interview session with job object:', error);
      throw error;
    }
  }

  private async getJobDetails(jobId: string) {
    try {
      const response = await api.get(`/jobs/${jobId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching job details:', error);
      throw error;
    }
  }

  private generateQuestionsForJob(job: any, difficulty: 'Easy' | 'Medium' | 'Hard'): InterviewQuestion[] {
    const questions: InterviewQuestion[] = [];
    
    // Question 1: Introduction and Interest
    questions.push({
      _id: `q-general-1`,
      question: `Tell me about yourself and why you're interested in the ${job.title} position.`,
      type: 'general',
      expectedDuration: 120,
      tips: [
        'Keep your answer concise and relevant to the role',
        'Highlight your key achievements and experiences',
        'Connect your background to the job requirements'
      ],
      difficulty
    });

    // Question 2: Challenging Project (Behavioral)
    questions.push({
      _id: `q-behavioral-1`,
      question: 'Describe a challenging project you worked on and how you overcame the obstacles.',
      type: 'behavioral',
      expectedDuration: 180,
      tips: [
        'Use the STAR method (Situation, Task, Action, Result)',
        'Focus on your specific contributions',
        'Quantify your results when possible'
      ],
      difficulty
    });

    // Question 3: Technical Skill Question
    if (job.skills && job.skills.length > 0) {
      const primarySkill = job.skills[0];
      questions.push({
        _id: `q-technical-1`,
        question: `How would you approach a problem involving ${primarySkill}? Walk me through your thought process.`,
        type: 'technical',
        expectedDuration: 240,
        tips: [
          'Break down the problem into smaller parts',
          'Explain your reasoning clearly',
          'Consider edge cases and alternatives'
        ],
        difficulty
      });
    } else {
      questions.push({
        _id: `q-technical-1`,
        question: 'Tell me about a technical challenge you faced recently and how you solved it.',
        type: 'technical',
        expectedDuration: 180,
        tips: [
          'Describe the problem clearly',
          'Explain your approach step by step',
          'Highlight the outcome and lessons learned'
        ],
        difficulty
      });
    }

    // Question 4: Situational Question
    questions.push({
      _id: `q-situational-1`,
      question: `Imagine you're working on a tight deadline for a ${job.title} project, but you discover a significant issue that could delay the delivery. How would you handle this situation?`,
      type: 'situational',
      expectedDuration: 150,
      tips: [
        'Consider all stakeholders involved',
        'Prioritize communication and transparency',
        'Propose concrete solutions'
      ],
      difficulty
    });

    // Question 5: Company-specific question
    questions.push({
      _id: `q-general-2`,
      question: `What do you know about ${job.company} and why do you want to work here?`,
      type: 'general',
      expectedDuration: 120,
      tips: [
        'Research the company beforehand',
        'Mention specific aspects that appeal to you',
        'Connect your values with the company culture'
      ],
      difficulty
    });

    // Question 6: Team Collaboration
    questions.push({
      _id: `q-behavioral-2`,
      question: 'Tell me about a time when you had to work with a difficult team member. How did you handle the situation?',
      type: 'behavioral',
      expectedDuration: 150,
      tips: [
        'Focus on professional behavior',
        'Show conflict resolution skills',
        'Emphasize positive outcomes'
      ],
      difficulty
    });

    // Question 7: Role-specific question
    if (job.responsibilities && job.responsibilities.length > 0) {
      const primaryResponsibility = job.responsibilities[0];
      questions.push({
        _id: `q-technical-2`,
        question: `This role involves ${primaryResponsibility.toLowerCase()}. Can you share your experience with similar responsibilities?`,
        type: 'technical',
        expectedDuration: 180,
        tips: [
          'Provide specific examples from your experience',
          'Highlight relevant achievements',
          'Show enthusiasm for the responsibility'
        ],
        difficulty
      });
    } else {
      questions.push({
        _id: `q-technical-2`,
        question: 'What do you consider to be your greatest professional strength and how does it relate to this position?',
        type: 'technical',
        expectedDuration: 120,
        tips: [
          'Choose a strength relevant to the role',
          'Provide concrete examples',
          'Show how it benefits the organization'
        ],
        difficulty
      });
    }

    // Question 8: Leadership/Initiative
    questions.push({
      _id: `q-behavioral-3`,
      question: 'Describe a time when you took initiative to improve a process or solve a problem without being asked.',
      type: 'behavioral',
      expectedDuration: 180,
      tips: [
        'Show proactive thinking',
        'Demonstrate leadership qualities',
        'Quantify the impact of your actions'
      ],
      difficulty
    });

    // Question 9: Future Goals and Growth
    questions.push({
      _id: `q-general-4`,
      question: 'Where do you see yourself professionally in 3-5 years, and how does this role fit into those goals?',
      type: 'general',
      expectedDuration: 120,
      tips: [
        'Show ambition but be realistic',
        'Connect your goals to the company',
        'Demonstrate long-term commitment'
      ],
      difficulty
    });

    // Question 10: Closing question - Questions for us
    questions.push({
      _id: `q-general-5`,
      question: 'Do you have any questions about the role, team, or company culture?',
      type: 'general',
      expectedDuration: 120,
      tips: [
        'Always have thoughtful questions prepared',
        'Ask about growth opportunities and team culture',
        'Show genuine interest in the role'
      ],
      difficulty
    });

    return questions;
  }

  async saveInterviewResult(result: Omit<InterviewResult, '_id' | 'createdAt'>): Promise<InterviewResult> {
    try {
      // For now, use the AI interview completion endpoint
      // This should be adapted to the actual AI interview structure
      console.log('Interview result to save:', result);
      
      // Return mock result for now until we integrate with AI interviews
      return {
        ...result,
        _id: `result-${Date.now()}`,
        completedAt: new Date().toISOString()
      } as InterviewResult;
    } catch (error) {
      console.error('Error saving interview result:', error);
      // Return mock result for now
      return {
        ...result,
        _id: `result-${Date.now()}`,
        completedAt: new Date().toISOString()
      } as InterviewResult;
    }
  }

  async getUserInterviewResults(): Promise<InterviewResult[]> {
    try {
      // Use the correct AI interview endpoint
      const response = await api.get('/ai-interviews/my-interviews');
      
      // Transform AI interview data to InterviewResult format
      const aiInterviews = response.data || [];
      return aiInterviews.map((interview: any) => ({
        _id: interview._id,
        userId: interview.user,
        jobId: interview.job,
        type: interview.type,
        questions: interview.questions || [],
        responses: interview.responses || [],
        scores: interview.analysis || {
          technical: 0,
          communication: 0,
          problemSolving: 0,
          cultural: 0
        },
        overallScore: interview.overallScore || 0,
        feedback: interview.feedback ? [interview.feedback] : [],
        recommendations: interview.recommendations || [],
        completedAt: interview.completedAt || interview.createdAt,
        createdAt: interview.createdAt
      })) as InterviewResult[];
      
    } catch (error) {
      console.error('Error fetching interview results:', error);
      return [];
    }
  }

  async analyzeInterviewPerformance(answers: Record<string, any>, questions: InterviewQuestion[]): Promise<{
    scores: InterviewResult['scores'];
    overallScore: number;
    feedback: string[];
    recommendations: string[];
  }> {
    // Simulate analysis - in real implementation, this would use AI/ML
    const scores = {
      communication: Math.floor(Math.random() * 30) + 70,
      confidence: Math.floor(Math.random() * 30) + 70,
      technical: Math.floor(Math.random() * 30) + 70,
      clarity: Math.floor(Math.random() * 30) + 70,
      relevance: Math.floor(Math.random() * 30) + 70
    };

    const overallScore = Math.floor(Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length);

    const feedback = [
      'Demonstrated strong communication skills throughout the interview',
      'Provided relevant examples to support your answers',
      'Showed good understanding of the role requirements',
      'Maintained professional demeanor and confidence'
    ];

    const recommendations = [
      'Practice more technical scenarios specific to the role',
      'Prepare more detailed examples for behavioral questions',
      'Research the company culture and values more deeply',
      'Work on structuring your answers more clearly'
    ];

    return {
      scores,
      overallScore,
      feedback,
      recommendations
    };
  }
}

export const interviewService = new InterviewService();
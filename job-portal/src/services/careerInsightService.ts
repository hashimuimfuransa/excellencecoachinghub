import { api } from './api';

export interface Skill {
  skill: string;
  level: number; // 1-5
  yearsOfExperience?: number;
}

export interface CareerInsight {
  _id: string;
  user: string;
  skillsAssessment: {
    technicalSkills: Skill[];
    softSkills: Skill[];
    overallScore: number;
  };
  careerPath: {
    currentRole: string;
    experienceLevel: 'entry_level' | 'mid_level' | 'senior_level' | 'executive';
    suggestedRoles: string[];
    careerProgression: Array<{
      role: string;
      timeline: string;
      requirements: string[];
    }>;
  };
  marketInsights: {
    salaryRange: {
      min: number;
      max: number;
      currency: string;
    };
    demandLevel: 'low' | 'medium' | 'high';
    growthPotential: 'declining' | 'stable' | 'growing' | 'high-growth';
    competitionLevel: 'low' | 'medium' | 'high';
  };
  recommendations: {
    skillsToImprove: string[];
    coursesRecommended: string[];
    certificationsRecommended: string[];
    jobsRecommended: string[];
  };
  quizResults: Array<{
    quizType: string;
    score: number;
    completedAt: string;
    results: any;
  }>;
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuizSubmission {
  quizType: string;
  answers: any;
  score: number;
}

export interface SkillsAssessmentUpdate {
  technicalSkills?: Skill[];
  softSkills?: Skill[];
}

export interface CareerRecommendations {
  jobRecommendations: Array<{
    _id: string;
    title: string;
    company: string;
    location: string;
    jobType: string;
    experienceLevel: string;
  }>;
  skillGaps: string[];
  currentSkills: string[];
  overallScore: number;
  recommendations: {
    skillsToImprove: string[];
    coursesRecommended: string[];
    certificationsRecommended: string[];
    jobsRecommended: string[];
  };
}

export interface MarketInsight {
  roleName: string;
  jobsAvailable: number;
  salaryRange: {
    min: number;
    max: number;
    currency: string;
  };
  demandLevel: 'low' | 'medium' | 'high';
  growthPotential: 'declining' | 'stable' | 'growing' | 'high-growth';
  competitionLevel: 'low' | 'medium' | 'high';
  topSkills: string[];
  locations: string[];
}

class CareerInsightService {
  async getCareerInsights() {
    const response = await api.get('/insights/skills');
    return response.data;
  }

  async submitQuiz(quizData: QuizSubmission) {
    const response = await api.post('/insights/quiz', quizData);
    return response.data;
  }

  async updateSkillsAssessment(skillsData: SkillsAssessmentUpdate) {
    const response = await api.put('/insights/skills', skillsData);
    return response.data;
  }

  async getCareerRecommendations(): Promise<{ data: CareerRecommendations }> {
    const response = await api.get('/insights/recommendations');
    return response.data;
  }

  async getMarketInsights(role: string): Promise<{ data: MarketInsight }> {
    const response = await api.get(`/insights/market/${encodeURIComponent(role)}`);
    return response.data;
  }

  // Mini assessment/quiz templates
  getSkillQuizzes() {
    return [
      {
        id: 'technical-skills',
        title: 'Technical Skills Assessment',
        description: 'Evaluate your technical competencies',
        duration: 10,
        questions: [
          {
            id: 1,
            question: 'How comfortable are you with programming languages?',
            type: 'scale',
            scale: { min: 1, max: 5, labels: ['Beginner', 'Novice', 'Intermediate', 'Advanced', 'Expert'] }
          },
          {
            id: 2,
            question: 'How often do you learn new technologies?',
            type: 'multiple-choice',
            options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always']
          },
          {
            id: 3,
            question: 'Which best describes your project experience?',
            type: 'multiple-choice',
            options: [
              'No professional projects',
              'Small personal projects',
              'Team projects in education',
              'Professional projects',
              'Leading complex projects'
            ]
          }
        ]
      },
      {
        id: 'soft-skills',
        title: 'Soft Skills Assessment',
        description: 'Evaluate your interpersonal and professional skills',
        duration: 8,
        questions: [
          {
            id: 1,
            question: 'How well do you communicate with team members?',
            type: 'scale',
            scale: { min: 1, max: 5, labels: ['Poor', 'Below Average', 'Average', 'Good', 'Excellent'] }
          },
          {
            id: 2,
            question: 'How do you handle tight deadlines?',
            type: 'multiple-choice',
            options: [
              'I get overwhelmed and stressed',
              'I struggle but manage to complete tasks',
              'I work efficiently under pressure',
              'I thrive under pressure and deliver quality work',
              'I excel and help others manage their workload'
            ]
          },
          {
            id: 3,
            question: 'How do you approach problem-solving?',
            type: 'multiple-choice',
            options: [
              'I ask others for solutions',
              'I try a few basic approaches',
              'I research and analyze before acting',
              'I use systematic problem-solving methods',
              'I innovate and create novel solutions'
            ]
          }
        ]
      },
      {
        id: 'leadership',
        title: 'Leadership Potential',
        description: 'Assess your leadership and management capabilities',
        duration: 12,
        questions: [
          {
            id: 1,
            question: 'How often do others seek your guidance?',
            type: 'scale',
            scale: { min: 1, max: 5, labels: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'] }
          },
          {
            id: 2,
            question: 'How do you handle team conflicts?',
            type: 'multiple-choice',
            options: [
              'I avoid conflicts',
              'I let others handle it',
              'I try to mediate when asked',
              'I actively resolve conflicts',
              'I prevent conflicts through proactive management'
            ]
          },
          {
            id: 3,
            question: 'How do you motivate team members?',
            type: 'multiple-choice',
            options: [
              'I don\'t take on that responsibility',
              'I offer basic encouragement',
              'I recognize good work publicly',
              'I provide mentoring and development opportunities',
              'I create inspiring visions and empower others'
            ]
          }
        ]
      }
    ];
  }

  // Calculate quiz score based on answers
  calculateQuizScore(quizId: string, answers: { [questionId: number]: string | number }): number {
    const quizzes = this.getSkillQuizzes();
    const quiz = quizzes.find(q => q.id === quizId);
    
    if (!quiz) return 0;

    let totalScore = 0;
    let maxScore = 0;

    quiz.questions.forEach(question => {
      maxScore += question.type === 'scale' ? 5 : 5; // Normalize all to 5 points max
      
      const answer = answers[question.id];
      if (answer !== undefined) {
        if (question.type === 'scale') {
          totalScore += Number(answer);
        } else if (question.type === 'multiple-choice') {
          // Convert multiple choice to score (index + 1)
          const optionIndex = question.options.findIndex(opt => opt === answer);
          totalScore += optionIndex >= 0 ? optionIndex + 1 : 0;
        }
      }
    });

    return Math.round((totalScore / maxScore) * 100);
  }
}

export const careerInsightService = new CareerInsightService();
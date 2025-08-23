import axios from 'axios';
import api from './api';

export interface ICareerAssessmentQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'likert_scale' | 'text' | 'ranking';
  options?: string[];
  category: 'personality' | 'interests' | 'skills' | 'values' | 'competencies' | 'readiness' | 'technical' | 'behavioral';
  weight: number;
}

export interface IPersonalityProfile {
  primaryType: string;
  traits: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
  strengths: string[];
  developmentAreas: string[];
}

export interface ISkillsAnalysis {
  technicalSkills: Array<{
    skill: string;
    proficiency: number;
    category: string;
  }>;
  softSkills: Array<{
    skill: string;
    proficiency: number;
    importance: number;
  }>;
  skillGaps: string[];
}

export interface ICareerRecommendation {
  careerPath: string;
  matchPercentage: number;
  reasons: string[];
  requiredSkills: string[];
  averageSalary?: string;
  growthOutlook: string;
  industry: string;
}

export interface ILearningRecommendation {
  courseId?: string;
  courseName: string;
  provider: string;
  priority: 'high' | 'medium' | 'low';
  estimatedDuration: string;
  skillsToGain: string[];
  category: string;
}

export interface IJobMatch {
  jobId?: string;
  jobTitle: string;
  company: string;
  matchPercentage: number;
  missingSkills: string[];
  readinessScore: number;
}

export interface IRoadmapGoal {
  goal: string;
  timeline: string;
  actions: string[];
}

export interface IPersonalizedRoadmap {
  shortTerm: IRoadmapGoal[];
  mediumTerm: IRoadmapGoal[];
  longTerm: IRoadmapGoal[];
}

export interface IAIInsights {
  summary: string;
  keyRecommendations: string[];
  motivationalMessage: string;
  nextSteps: string[];
}

export interface ICareerAssessmentResult {
  personalityProfile: IPersonalityProfile;
  skillsAnalysis: ISkillsAnalysis;
  careerRecommendations: ICareerRecommendation[];
  learningRecommendations: ILearningRecommendation[];
  jobMatches: IJobMatch[];
  personalizedRoadmap: IPersonalizedRoadmap;
  aiInsights: IAIInsights;
  completedAt: Date;
}

export interface ICareerAssessment {
  id: string;
  title: string;
  description: string;
  type: 'career_discovery' | 'job_readiness' | 'skill_gap' | 'personality';
  questions: ICareerAssessmentQuestion[];
  isCompleted: boolean;
  completedAt?: Date;
  createdAt: Date;
  progress: number;
  results?: ICareerAssessmentResult;
}

export interface ISuccessStory {
  name: string;
  careerPath: string;
  story: string;
  achievements: string[];
  coursesCompleted: string[];
  timeToSuccess: string;
  currentRole: string;
  company: string;
  advice: string;
}

export interface IPersonalizedGuidance {
  hasCompletedAssessment: boolean;
  latestResults?: ICareerAssessmentResult;
  recommendations: {
    nextSteps: string[];
    skillsToImprove: string[];
    coursesToTake: string[];
    jobsToConsider: string[];
  };
  progressTracking: {
    completedMilestones: number;
    totalMilestones: number;
    currentGoals: string[];
  };
}

// Use the existing API instance from api.ts which already has auth interceptors configured

export class CareerGuidanceService {
  // Generate Career Discovery Assessment
  async generateCareerDiscoveryAssessment(): Promise<{
    assessmentId: string;
    title: string;
    description: string;
    questionsCount: number;
    estimatedDuration: string;
    assessmentType: string;
  }> {
    try {
      const response = await api.post('/career-guidance/assessments/career-discovery');
      return response.data.data;
    } catch (error) {
      console.error('Error generating career discovery assessment:', error);
      throw new Error('Failed to generate career discovery assessment');
    }
  }

  // Generate Job Readiness Assessment
  async generateJobReadinessAssessment(targetJob?: string): Promise<{
    assessmentId: string;
    title: string;
    description: string;
    questionsCount: number;
    estimatedDuration: string;
    assessmentType: string;
    targetJob?: string;
  }> {
    try {
      const response = await api.post('/career-guidance/assessments/job-readiness', {
        targetJob
      });
      return response.data.data;
    } catch (error) {
      console.error('Error generating job readiness assessment:', error);
      throw new Error('Failed to generate job readiness assessment');
    }
  }

  // Get Career Assessment by ID
  async getCareerAssessment(assessmentId: string): Promise<ICareerAssessment> {
    try {
      const response = await api.get(`/career-guidance/assessments/${assessmentId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error getting career assessment:', error);
      throw new Error('Failed to get career assessment');
    }
  }

  // Submit Career Assessment
  async submitCareerAssessment(assessmentId: string, answers: Record<string, any>): Promise<{
    assessmentId: string;
    results: ICareerAssessmentResult;
    completedAt: Date;
    nextSteps: string[];
  }> {
    try {
      const response = await api.post(`/career-guidance/assessments/${assessmentId}/submit`, {
        answers
      });
      return response.data.data;
    } catch (error) {
      console.error('Error submitting career assessment:', error);
      throw new Error('Failed to submit career assessment');
    }
  }

  // Get All Career Assessments
  async getCareerAssessments(): Promise<{
    assessments: ICareerAssessment[];
    total: number;
    completed: number;
  }> {
    try {
      const response = await api.get('/career-guidance/assessments');
      return response.data.data;
    } catch (error) {
      console.error('Error getting career assessments:', error);
      throw new Error('Failed to get career assessments');
    }
  }

  // Get Assessment Results
  async getAssessmentResults(assessmentId: string): Promise<{
    assessmentInfo: {
      id: string;
      title: string;
      type: string;
      completedAt: Date;
    };
    results: ICareerAssessmentResult;
  }> {
    try {
      const response = await api.get(`/career-guidance/assessments/${assessmentId}/results`);
      return response.data.data;
    } catch (error) {
      console.error('Error getting assessment results:', error);
      throw new Error('Failed to get assessment results');
    }
  }

  // Get Personalized Guidance
  async getPersonalizedGuidance(): Promise<IPersonalizedGuidance> {
    try {
      const response = await api.get('/career-guidance/guidance');
      return response.data.data;
    } catch (error) {
      console.error('Error getting personalized guidance:', error);
      throw new Error('Failed to get personalized guidance');
    }
  }

  // AI Career Mentor Chat
  async getChatMentorResponse(
    message: string,
    conversationHistory: Array<{ role: string; content: string }> = []
  ): Promise<{
    response: string;
    timestamp: Date;
    conversationId: string;
  }> {
    try {
      const response = await api.post('/career-guidance/mentor/chat', {
        message,
        conversationHistory
      });
      return response.data.data;
    } catch (error) {
      console.error('Error getting career mentor response:', error);
      throw new Error('Failed to get career mentor response');
    }
  }

  // Get Success Stories
  async getSuccessStories(careerField?: string, limit?: number): Promise<{
    stories: ISuccessStory[];
    total: number;
  }> {
    try {
      const params = new URLSearchParams();
      if (careerField) params.append('careerField', careerField);
      if (limit) params.append('limit', limit.toString());

      const response = await api.get(`/career-guidance/success-stories?${params.toString()}`);
      return response.data.data;
    } catch (error) {
      console.error('Error getting success stories:', error);
      throw new Error('Failed to get success stories');
    }
  }

  // Helper Methods
  async checkHasCompletedCareerTest(): Promise<boolean> {
    try {
      const assessments = await this.getCareerAssessments();
      return assessments.assessments.some(
        (assessment) => assessment.type === 'career_discovery' && assessment.isCompleted
      );
    } catch (error) {
      console.error('Error checking career test completion:', error);
      return false;
    }
  }

  async getLatestCareerAssessmentResult(): Promise<ICareerAssessmentResult | null> {
    try {
      const assessments = await this.getCareerAssessments();
      const completedCareerAssessment = assessments.assessments
        .filter((assessment) => assessment.type === 'career_discovery' && assessment.isCompleted)
        .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())[0];

      if (completedCareerAssessment) {
        const results = await this.getAssessmentResults(completedCareerAssessment.id);
        return results.results;
      }
      return null;
    } catch (error) {
      console.error('Error getting latest career assessment result:', error);
      return null;
    }
  }
}

export default new CareerGuidanceService();
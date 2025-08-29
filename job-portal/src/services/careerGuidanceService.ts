import { api } from './api';

export interface IJobReadinessAssessment {
  id: string;
  title: string;
  description: string;
  type: 'job_readiness' | 'skill_gap' | 'personality';
  questions: IAssessmentQuestion[];
  isCompleted: boolean;
  completedAt?: Date;
  createdAt: Date;
  progress: number;
  results?: IJobReadinessResult;
  targetJob?: string;
}

export interface IAssessmentQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'likert_scale' | 'text' | 'ranking';
  options?: string[];
  category: 'competencies' | 'readiness' | 'technical' | 'behavioral';
  weight: number;
}

export interface IJobReadinessResult {
  personalityProfile: {
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
  };
  skillsAnalysis: {
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
  };
  jobReadinessScore: number;
  careerRecommendations: Array<{
    careerPath: string;
    matchPercentage: number;
    reasons: string[];
    requiredSkills: string[];
    averageSalary?: string;
    growthOutlook: string;
    industry: string;
  }>;
  jobMatches: Array<{
    jobId?: string;
    jobTitle: string;
    company: string;
    matchPercentage: number;
    missingSkills: string[];
    readinessScore: number;
  }>;
  learningRecommendations: Array<{
    courseId?: string;
    courseName: string;
    provider: string;
    priority: 'high' | 'medium' | 'low';
    estimatedDuration: string;
    skillsToGain: string[];
    category: string;
  }>;
  aiInsights: {
    summary: string;
    keyRecommendations: string[];
    motivationalMessage: string;
    nextSteps: string[];
  };
  completedAt: Date;
}

export interface ICandidateProfile {
  userId: string;
  jobReadinessScore: number;
  skillsAnalysis: {
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
  };
  personalityType: string;
  strengths: string[];
  developmentAreas: string[];
  completedAssessments: string[];
  lastAssessmentDate: Date;
  readinessLevel: 'Entry Level' | 'Intermediate' | 'Experienced' | 'Expert';
}

export interface ICareerPathAnalysis {
  recommendedPaths: Array<{
    careerPath: string;
    matchPercentage: number;
    industry: string;
    averageSalary: string;
    growthOutlook: string;
    requiredSkills: string[];
    reasons: string[];
  }>;
  skillGaps: string[];
  nextSteps: string[];
  timeToReadiness: string;
}

class CareerGuidanceService {
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
    const response = await api.post('/career-guidance/assessments/job-readiness', {
      targetJob
    });
    return response.data.data;
  }

  // Submit Job Readiness Assessment
  async submitJobReadinessAssessment(assessmentId: string, answers: Record<string, any>): Promise<{
    assessmentId: string;
    results: IJobReadinessResult;
    completedAt: Date;
    nextSteps: string[];
  }> {
    const response = await api.post(`/career-guidance/assessments/${assessmentId}/submit`, {
      answers
    });
    return response.data.data;
  }

  // Get Job Readiness Assessment
  async getJobReadinessAssessment(assessmentId: string): Promise<IJobReadinessAssessment> {
    const response = await api.get(`/career-guidance/assessments/${assessmentId}`);
    return response.data.data;
  }

  // Get All Assessments for Current User
  async getUserAssessments(): Promise<{
    assessments: IJobReadinessAssessment[];
    total: number;
    completed: number;
  }> {
    const response = await api.get('/career-guidance/assessments');
    return response.data.data;
  }

  // Get Assessment Results
  async getAssessmentResults(assessmentId: string): Promise<{
    assessmentInfo: {
      id: string;
      title: string;
      type: string;
      completedAt: Date;
    };
    results: IJobReadinessResult;
  }> {
    const response = await api.get(`/career-guidance/assessments/${assessmentId}/results`);
    return response.data.data;
  }

  // Get Job Matching Based on Assessment Results
  async getJobMatchingResults(): Promise<{
    matches: Array<{
      jobId: string;
      jobTitle: string;
      company: string;
      location: string;
      matchPercentage: number;
      missingSkills: string[];
      readinessScore: number;
      salaryRange: string;
      requirements: string[];
    }>;
    totalJobs: number;
    averageMatch: number;
  }> {
    const response = await api.get('/career-guidance/job-matching');
    return response.data.data;
  }

  // Get Career Path Analysis
  async getCareerPathAnalysis(): Promise<ICareerPathAnalysis> {
    const response = await api.get('/career-guidance/career-paths');
    return response.data.data;
  }

  // Get AI Career Mentor Response (for job seekers)
  async getChatMentorResponse(
    message: string,
    conversationHistory: Array<{ role: string; content: string }> = [],
    jobContext?: string
  ): Promise<{
    response: string;
    timestamp: Date;
    conversationId: string;
  }> {
    const response = await api.post('/career-guidance/mentor/chat', {
      message,
      conversationHistory,
      jobContext
    });
    return response.data.data;
  }

  // Get Course Recommendations Based on Skill Gaps
  async getCourseRecommendations(): Promise<{
    recommendations: Array<{
      courseId?: string;
      courseName: string;
      provider: string;
      priority: 'high' | 'medium' | 'low';
      estimatedDuration: string;
      skillsToGain: string[];
      category: string;
      price?: string;
      rating?: number;
      link?: string;
    }>;
    skillGaps: string[];
    totalRecommendations: number;
  }> {
    const response = await api.get('/career-guidance/course-recommendations');
    return response.data.data;
  }

  // Generate Career Report/Certificate
  async generateCareerReport(): Promise<{
    reportUrl: string;
    reportId: string;
    generatedAt: Date;
    validUntil: Date;
  }> {
    const response = await api.get('/career-guidance/report');
    return response.data.data;
  }

  // Download Career Certificate
  async downloadCareerCertificate(): Promise<{
    certificateUrl: string;
    certificateId: string;
    issuedAt: Date;
  }> {
    const response = await api.get('/career-guidance/certificate');
    return response.data.data;
  }

  // Get Candidate Profile (for employers to view)
  async getCandidateProfile(candidateId: string): Promise<ICandidateProfile> {
    const response = await api.get(`/career-guidance/candidate-profile/${candidateId}`);
    return response.data.data;
  }

  // Helper Methods
  async checkHasCompletedJobReadinessTest(): Promise<boolean> {
    try {
      const assessments = await this.getUserAssessments();
      return assessments.assessments.some(
        (assessment) => assessment.type === 'job_readiness' && assessment.isCompleted
      );
    } catch (error) {
      console.error('Error checking job readiness test completion:', error);
      return false;
    }
  }

  async getLatestJobReadinessResult(): Promise<IJobReadinessResult | null> {
    try {
      const assessments = await this.getUserAssessments();
      const completedJobReadinessAssessment = assessments.assessments
        .filter((assessment) => assessment.type === 'job_readiness' && assessment.isCompleted)
        .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())[0];

      if (completedJobReadinessAssessment) {
        const results = await this.getAssessmentResults(completedJobReadinessAssessment.id);
        return results.results;
      }
      return null;
    } catch (error) {
      console.error('Error getting latest job readiness result:', error);
      return null;
    }
  }

  // Calculate overall readiness score from multiple factors
  calculateOverallReadinessScore(results: IJobReadinessResult): {
    overallScore: number;
    breakdown: {
      personalityMatch: number;
      skillsProficiency: number;
      technicalReadiness: number;
      behavioralFit: number;
    };
    readinessLevel: 'Entry Level' | 'Intermediate' | 'Experienced' | 'Expert';
  } {
    // Calculate component scores
    const personalityMatch = (results.personalityProfile.traits.conscientiousness + 
                             results.personalityProfile.traits.extraversion) / 2;
    
    const skillsProficiency = results.skillsAnalysis.softSkills.reduce((acc, skill) => 
      acc + skill.proficiency, 0) / results.skillsAnalysis.softSkills.length;
    
    const technicalReadiness = results.skillsAnalysis.technicalSkills.reduce((acc, skill) => 
      acc + skill.proficiency, 0) / Math.max(results.skillsAnalysis.technicalSkills.length, 1);
    
    const behavioralFit = results.jobReadinessScore || 75; // Default if not provided

    const overallScore = Math.round(
      (personalityMatch * 0.2 + skillsProficiency * 0.3 + technicalReadiness * 0.3 + behavioralFit * 0.2)
    );

    let readinessLevel: 'Entry Level' | 'Intermediate' | 'Experienced' | 'Expert';
    if (overallScore >= 90) readinessLevel = 'Expert';
    else if (overallScore >= 75) readinessLevel = 'Experienced';
    else if (overallScore >= 60) readinessLevel = 'Intermediate';
    else readinessLevel = 'Entry Level';

    return {
      overallScore,
      breakdown: {
        personalityMatch: Math.round(personalityMatch),
        skillsProficiency: Math.round(skillsProficiency),
        technicalReadiness: Math.round(technicalReadiness),
        behavioralFit: Math.round(behavioralFit)
      },
      readinessLevel
    };
  }
}

export default new CareerGuidanceService();
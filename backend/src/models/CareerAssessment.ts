import mongoose, { Schema, Document } from 'mongoose';

export interface ICareerAssessmentQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'likert_scale' | 'text' | 'ranking';
  options?: string[];
  category: 'personality' | 'interests' | 'skills' | 'values' | 'competencies' | 'readiness' | 'technical' | 'behavioral';
  weight: number;
  correctAnswer?: string | null;
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
  courseId?: mongoose.Types.ObjectId;
  courseName: string;
  provider: string;
  priority: 'high' | 'medium' | 'low';
  estimatedDuration: string;
  skillsToGain: string[];
  category: string;
}

export interface IJobMatch {
  jobId?: mongoose.Types.ObjectId;
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
  userId: mongoose.Types.ObjectId;
  assessmentId: mongoose.Types.ObjectId;
  personalityProfile: IPersonalityProfile;
  skillsAnalysis: ISkillsAnalysis;
  careerRecommendations: ICareerRecommendation[];
  learningRecommendations: ILearningRecommendation[];
  jobMatches: IJobMatch[];
  personalizedRoadmap: IPersonalizedRoadmap;
  aiInsights: IAIInsights;
  completedAt: Date;
}

export interface ICareerAssessment extends Document {
  userId: mongoose.Types.ObjectId;
  assessmentType: 'career_discovery' | 'job_readiness' | 'skill_gap' | 'personality';
  title: string;
  description: string;
  questions: ICareerAssessmentQuestion[];
  results?: ICareerAssessmentResult;
  answers?: Record<string, any>;
  completedAt?: Date;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CareerAssessmentQuestionSchema = new Schema<ICareerAssessmentQuestion>({
  id: { type: String, required: true },
  question: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['multiple_choice', 'likert_scale', 'text', 'ranking'], 
    required: true 
  },
  options: [{ type: String }],
  category: { 
    type: String, 
    enum: ['personality', 'interests', 'skills', 'values', 'competencies', 'readiness', 'technical', 'behavioral'],
    required: true 
  },
  weight: { type: Number, default: 1 },
  correctAnswer: { type: String, default: null }
});

const PersonalityProfileSchema = new Schema<IPersonalityProfile>({
  primaryType: { type: String, required: true },
  traits: {
    openness: { type: Number, min: 0, max: 100 },
    conscientiousness: { type: Number, min: 0, max: 100 },
    extraversion: { type: Number, min: 0, max: 100 },
    agreeableness: { type: Number, min: 0, max: 100 },
    neuroticism: { type: Number, min: 0, max: 100 }
  },
  strengths: [{ type: String }],
  developmentAreas: [{ type: String }]
});

const SkillAnalysisSchema = new Schema<ISkillsAnalysis>({
  technicalSkills: [{
    skill: { type: String, required: true },
    proficiency: { type: Number, min: 0, max: 100 },
    category: { type: String, required: true }
  }],
  softSkills: [{
    skill: { type: String, required: true },
    proficiency: { type: Number, min: 0, max: 100 },
    importance: { type: Number, min: 0, max: 100 }
  }],
  skillGaps: [{ type: String }]
});

const CareerRecommendationSchema = new Schema<ICareerRecommendation>({
  careerPath: { type: String, required: true },
  matchPercentage: { type: Number, min: 0, max: 100 },
  reasons: [{ type: String }],
  requiredSkills: [{ type: String }],
  averageSalary: { type: String },
  growthOutlook: { type: String, enum: ['Excellent', 'Good', 'Fair', 'Limited'] },
  industry: { type: String, required: true }
});

const LearningRecommendationSchema = new Schema<ILearningRecommendation>({
  courseId: { type: Schema.Types.ObjectId, ref: 'Course' },
  courseName: { type: String, required: true },
  provider: { type: String, default: 'Excellence Coaching Hub' },
  priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
  estimatedDuration: { type: String, required: true },
  skillsToGain: [{ type: String }],
  category: { type: String, required: true }
});

const JobMatchSchema = new Schema<IJobMatch>({
  jobId: { type: Schema.Types.ObjectId, ref: 'Job' },
  jobTitle: { type: String, required: true },
  company: { type: String, required: true },
  matchPercentage: { type: Number, min: 0, max: 100 },
  missingSkills: [{ type: String }],
  readinessScore: { type: Number, min: 0, max: 100 }
});

const RoadmapGoalSchema = new Schema<IRoadmapGoal>({
  goal: { type: String, required: true },
  timeline: { type: String, required: true },
  actions: [{ type: String }]
});

const PersonalizedRoadmapSchema = new Schema<IPersonalizedRoadmap>({
  shortTerm: [RoadmapGoalSchema],
  mediumTerm: [RoadmapGoalSchema],
  longTerm: [RoadmapGoalSchema]
});

const AIInsightsSchema = new Schema<IAIInsights>({
  summary: { type: String, required: true },
  keyRecommendations: [{ type: String }],
  motivationalMessage: { type: String, required: true },
  nextSteps: [{ type: String }]
});

const CareerAssessmentResultSchema = new Schema<ICareerAssessmentResult>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  assessmentId: { type: Schema.Types.ObjectId, required: true },
  personalityProfile: PersonalityProfileSchema,
  skillsAnalysis: SkillAnalysisSchema,
  careerRecommendations: [CareerRecommendationSchema],
  learningRecommendations: [LearningRecommendationSchema],
  jobMatches: [JobMatchSchema],
  personalizedRoadmap: PersonalizedRoadmapSchema,
  aiInsights: AIInsightsSchema,
  completedAt: { type: Date, default: Date.now }
});

const CareerAssessmentSchema = new Schema<ICareerAssessment>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  assessmentType: { 
    type: String, 
    enum: ['career_discovery', 'job_readiness', 'skill_gap', 'personality'],
    required: true 
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  questions: [CareerAssessmentQuestionSchema],
  results: CareerAssessmentResultSchema,
  answers: { type: Schema.Types.Mixed },
  completedAt: { type: Date },
  isCompleted: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Indexes for performance
CareerAssessmentSchema.index({ userId: 1, assessmentType: 1 });
CareerAssessmentSchema.index({ userId: 1, createdAt: -1 });
CareerAssessmentSchema.index({ assessmentType: 1, createdAt: -1 });

// Methods
CareerAssessmentSchema.methods.markCompleted = function(results: ICareerAssessmentResult, answers: Record<string, any>) {
  this.isCompleted = true;
  this.completedAt = new Date();
  this.results = results;
  this.answers = answers;
  return this.save();
};

CareerAssessmentSchema.methods.getProgress = function() {
  if (!this.answers) return 0;
  const answeredQuestions = Object.keys(this.answers).length;
  const totalQuestions = this.questions.length;
  return Math.round((answeredQuestions / totalQuestions) * 100);
};

// Statics
CareerAssessmentSchema.statics.findByUserId = function(userId: string) {
  return this.find({ userId }).sort({ createdAt: -1 });
};

CareerAssessmentSchema.statics.findLatestByType = function(userId: string, assessmentType: string) {
  return this.findOne({ userId, assessmentType }).sort({ createdAt: -1 });
};

CareerAssessmentSchema.statics.findCompletedAssessments = function(userId: string) {
  return this.find({ userId, isCompleted: true }).sort({ completedAt: -1 });
};

export default mongoose.model<ICareerAssessment>('CareerAssessment', CareerAssessmentSchema);
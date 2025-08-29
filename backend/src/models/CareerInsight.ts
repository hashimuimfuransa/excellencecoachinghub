import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICareerInsightDocument extends Document {
  user: string; // User ID
  skillsAssessment: {
    technicalSkills: {
      skill: string;
      level: number; // 1-5
      yearsOfExperience: number;
    }[];
    softSkills: {
      skill: string;
      level: number; // 1-5
    }[];
    overallScore: number;
  };
  careerPath: {
    currentRole: string;
    experienceLevel: string;
    suggestedRoles: string[];
    careerProgression: {
      role: string;
      timeline: string;
      requirements: string[];
    }[];
  };
  marketInsights: {
    salaryRange: {
      min: number;
      max: number;
      currency: string;
    };
    demandLevel: string; // 'low', 'medium', 'high'
    growthPotential: string; // 'declining', 'stable', 'growing', 'high-growth'
    competitionLevel: string; // 'low', 'medium', 'high'
  };
  recommendations: {
    skillsToImprove: string[];
    coursesRecommended: string[];
    certificationsRecommended: string[];
    jobsRecommended: string[];
  };
  quizResults: {
    quizType: string;
    score: number;
    completedAt: Date;
    results: any;
  }[];
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICareerInsightModel extends Model<ICareerInsightDocument> {
  findByUser(userId: string): Promise<ICareerInsightDocument | null>;
  updateSkillsAssessment(userId: string, skills: any): Promise<ICareerInsightDocument>;
}

const careerInsightSchema = new Schema<ICareerInsightDocument>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
    unique: true
  },
  skillsAssessment: {
    technicalSkills: [{
      skill: { type: String, required: true, trim: true },
      level: { type: Number, required: true, min: 1, max: 5 },
      yearsOfExperience: { type: Number, required: true, min: 0 }
    }],
    softSkills: [{
      skill: { type: String, required: true, trim: true },
      level: { type: Number, required: true, min: 1, max: 5 }
    }],
    overallScore: { type: Number, default: 0, min: 0, max: 100 }
  },
  careerPath: {
    currentRole: { type: String, trim: true },
    experienceLevel: { 
      type: String, 
      enum: ['entry_level', 'mid_level', 'senior_level', 'executive'],
      default: 'entry_level'
    },
    suggestedRoles: [{ type: String, trim: true }],
    careerProgression: [{
      role: { type: String, required: true, trim: true },
      timeline: { type: String, required: true, trim: true },
      requirements: [{ type: String, trim: true }]
    }]
  },
  marketInsights: {
    salaryRange: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
      currency: { type: String, default: 'USD' }
    },
    demandLevel: { 
      type: String, 
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    growthPotential: { 
      type: String, 
      enum: ['declining', 'stable', 'growing', 'high-growth'],
      default: 'stable'
    },
    competitionLevel: { 
      type: String, 
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  },
  recommendations: {
    skillsToImprove: [{ type: String, trim: true }],
    coursesRecommended: [{ type: String, trim: true }],
    certificationsRecommended: [{ type: String, trim: true }],
    jobsRecommended: [{ type: String, trim: true }]
  },
  quizResults: [{
    quizType: { type: String, required: true, trim: true },
    score: { type: Number, required: true, min: 0, max: 100 },
    completedAt: { type: Date, default: Date.now },
    results: { type: Schema.Types.Mixed }
  }],
  lastUpdated: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes
careerInsightSchema.index({ user: 1 });
careerInsightSchema.index({ lastUpdated: -1 });

// Static methods
careerInsightSchema.statics.findByUser = function(userId: string): Promise<ICareerInsightDocument | null> {
  return this.findOne({ user: userId })
    .populate('user', 'firstName lastName email skills experience');
};

careerInsightSchema.statics.updateSkillsAssessment = function(userId: string, skills: any): Promise<ICareerInsightDocument> {
  return this.findOneAndUpdate(
    { user: userId },
    { 
      skillsAssessment: skills,
      lastUpdated: new Date()
    },
    { upsert: true, new: true }
  );
};

export const CareerInsight = mongoose.model<ICareerInsightDocument, ICareerInsightModel>('CareerInsight', careerInsightSchema);
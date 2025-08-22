import mongoose, { Document, Schema } from 'mongoose';

export interface IJobRole extends Document {
  title: string;
  department: string;
  level: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
  skills: string[];
  description: string;
  requirements?: string[];
  responsibilities?: string[];
  salaryRange?: {
    min: number;
    max: number;
    currency: string;
  };
  experienceYears?: {
    min: number;
    max: number;
  };
  isActive: boolean;
  interviewDuration: number; // in seconds, default 180 (3 minutes)
  questionCategories: {
    technical: number; // number of technical questions
    behavioral: number; // number of behavioral questions
    situational: number; // number of situational questions
  };
  evaluationCriteria: {
    technicalWeight: number; // 0-100, percentage weight for technical skills
    communicationWeight: number; // 0-100, percentage weight for communication
    culturalWeight: number; // 0-100, percentage weight for cultural fit
    problemSolvingWeight: number; // 0-100, percentage weight for problem solving
  };
  customQuestions?: string[]; // Pre-defined questions specific to this role
  tags: string[]; // For categorization and search
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  usageStats?: {
    totalInterviews: number;
    averageScore: number;
    lastUsed: Date;
  };
}

const JobRoleSchema = new Schema({
  title: { 
    type: String, 
    required: true, 
    trim: true,
    index: true
  },
  department: { 
    type: String, 
    required: true, 
    trim: true,
    index: true
  },
  level: { 
    type: String, 
    enum: ['entry', 'mid', 'senior', 'lead', 'executive'], 
    required: true,
    index: true
  },
  skills: [{ 
    type: String, 
    required: true, 
    trim: true 
  }],
  description: { 
    type: String, 
    required: true, 
    trim: true 
  },
  requirements: [{ 
    type: String, 
    trim: true 
  }],
  responsibilities: [{ 
    type: String, 
    trim: true 
  }],
  salaryRange: {
    min: { 
      type: Number, 
      min: 0 
    },
    max: { 
      type: Number, 
      min: 0 
    },
    currency: { 
      type: String, 
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR']
    }
  },
  experienceYears: {
    min: { 
      type: Number, 
      min: 0, 
      default: 0 
    },
    max: { 
      type: Number, 
      min: 0 
    }
  },
  isActive: { 
    type: Boolean, 
    default: true,
    index: true
  },
  interviewDuration: { 
    type: Number, 
    default: 180, // 3 minutes
    min: 60,    // minimum 1 minute
    max: 600    // maximum 10 minutes
  },
  questionCategories: {
    technical: { 
      type: Number, 
      default: 2, 
      min: 0, 
      max: 10 
    },
    behavioral: { 
      type: Number, 
      default: 2, 
      min: 0, 
      max: 10 
    },
    situational: { 
      type: Number, 
      default: 1, 
      min: 0, 
      max: 10 
    }
  },
  evaluationCriteria: {
    technicalWeight: { 
      type: Number, 
      default: 40, 
      min: 0, 
      max: 100 
    },
    communicationWeight: { 
      type: Number, 
      default: 25, 
      min: 0, 
      max: 100 
    },
    culturalWeight: { 
      type: Number, 
      default: 20, 
      min: 0, 
      max: 100 
    },
    problemSolvingWeight: { 
      type: Number, 
      default: 15, 
      min: 0, 
      max: 100 
    }
  },
  customQuestions: [{ 
    type: String, 
    trim: true 
  }],
  tags: [{ 
    type: String, 
    trim: true, 
    lowercase: true 
  }],
  createdBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  },
  updatedBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  },
  usageStats: {
    totalInterviews: { 
      type: Number, 
      default: 0 
    },
    averageScore: { 
      type: Number, 
      default: 0,
      min: 0,
      max: 100
    },
    lastUsed: { 
      type: Date 
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
JobRoleSchema.index({ title: 1, isActive: 1 });
JobRoleSchema.index({ department: 1, level: 1 });
JobRoleSchema.index({ skills: 1 });
JobRoleSchema.index({ tags: 1 });
JobRoleSchema.index({ 'usageStats.totalInterviews': -1 });

// Virtual for total questions
JobRoleSchema.virtual('totalQuestions').get(function(this: IJobRole) {
  return this.questionCategories.technical + 
         this.questionCategories.behavioral + 
         this.questionCategories.situational;
});

// Virtual for weight validation
JobRoleSchema.virtual('weightSum').get(function(this: IJobRole) {
  return this.evaluationCriteria.technicalWeight + 
         this.evaluationCriteria.communicationWeight + 
         this.evaluationCriteria.culturalWeight + 
         this.evaluationCriteria.problemSolvingWeight;
});

// Virtual for complexity score
JobRoleSchema.virtual('complexityScore').get(function(this: IJobRole) {
  const levelScores = { entry: 1, mid: 2, senior: 3, lead: 4, executive: 5 };
  const skillComplexity = this.skills.length * 0.5;
  const questionComplexity = this.totalQuestions * 0.3;
  const levelComplexity = levelScores[this.level];
  
  return Math.round((skillComplexity + questionComplexity + levelComplexity) * 10);
});

// Pre-save validation middleware
JobRoleSchema.pre('save', function(this: IJobRole) {
  // Ensure evaluation criteria weights sum to 100
  const totalWeight = this.evaluationCriteria.technicalWeight + 
                     this.evaluationCriteria.communicationWeight + 
                     this.evaluationCriteria.culturalWeight + 
                     this.evaluationCriteria.problemSolvingWeight;
  
  if (totalWeight !== 100) {
    throw new Error('Evaluation criteria weights must sum to 100');
  }

  // Ensure at least one question category has questions
  const totalQuestions = this.questionCategories.technical + 
                        this.questionCategories.behavioral + 
                        this.questionCategories.situational;
  
  if (totalQuestions === 0) {
    throw new Error('At least one question category must have questions');
  }

  // Auto-generate tags from title and skills
  if (this.tags.length === 0) {
    const titleTags = this.title.toLowerCase().split(/\s+/);
    const skillTags = this.skills.map(skill => skill.toLowerCase());
    const departmentTag = this.department.toLowerCase();
    
    this.tags = [...new Set([...titleTags, ...skillTags, departmentTag])]
      .filter(tag => tag.length > 2);
  }

  // Set salary range validation
  if (this.salaryRange && this.salaryRange.min && this.salaryRange.max) {
    if (this.salaryRange.min > this.salaryRange.max) {
      throw new Error('Minimum salary cannot be greater than maximum salary');
    }
  }

  // Set experience years validation
  if (this.experienceYears && this.experienceYears.min !== undefined && this.experienceYears.max !== undefined) {
    if (this.experienceYears.min > this.experienceYears.max) {
      throw new Error('Minimum experience cannot be greater than maximum experience');
    }
  }
});

// Instance methods
JobRoleSchema.methods.incrementUsage = async function(this: IJobRole, score?: number) {
  this.usageStats = this.usageStats || { totalInterviews: 0, averageScore: 0 };
  
  this.usageStats.totalInterviews += 1;
  this.usageStats.lastUsed = new Date();
  
  if (score !== undefined) {
    const currentTotal = this.usageStats.averageScore * (this.usageStats.totalInterviews - 1);
    this.usageStats.averageScore = (currentTotal + score) / this.usageStats.totalInterviews;
  }
  
  return this.save();
};

JobRoleSchema.methods.generateQuestionDistribution = function(this: IJobRole) {
  const total = this.totalQuestions;
  const duration = this.interviewDuration;
  const avgTimePerQuestion = Math.floor(duration / total);
  
  return {
    technical: {
      count: this.questionCategories.technical,
      timeAllocation: Math.floor((this.questionCategories.technical / total) * duration),
      avgTimePerQuestion
    },
    behavioral: {
      count: this.questionCategories.behavioral,
      timeAllocation: Math.floor((this.questionCategories.behavioral / total) * duration),
      avgTimePerQuestion
    },
    situational: {
      count: this.questionCategories.situational,
      timeAllocation: Math.floor((this.questionCategories.situational / total) * duration),
      avgTimePerQuestion
    }
  };
};

JobRoleSchema.methods.getRecommendedInterviewFormat = function(this: IJobRole) {
  const technicalWeight = this.evaluationCriteria.technicalWeight;
  const totalQuestions = this.totalQuestions;
  
  if (technicalWeight >= 60) {
    return {
      format: 'technical-heavy',
      description: 'Focus on technical competency with practical problem-solving',
      recommendedDuration: Math.max(this.interviewDuration, 240), // at least 4 minutes
      emphasis: 'technical skills and problem-solving approach'
    };
  } else if (this.evaluationCriteria.communicationWeight >= 40) {
    return {
      format: 'communication-focused',
      description: 'Emphasis on communication skills and cultural fit',
      recommendedDuration: this.interviewDuration,
      emphasis: 'communication style and team collaboration'
    };
  } else {
    return {
      format: 'balanced',
      description: 'Well-rounded assessment across all competencies',
      recommendedDuration: this.interviewDuration,
      emphasis: 'balanced evaluation across all skills'
    };
  }
};

// Static methods
JobRoleSchema.statics.findActiveRoles = function(department?: string) {
  const query: any = { isActive: true };
  if (department) query.department = department;
  
  return this.find(query).sort({ title: 1 });
};

JobRoleSchema.statics.findBySkills = function(skills: string[], minMatch: number = 1) {
  return this.find({
    isActive: true,
    skills: { $in: skills }
  }).aggregate([
    {
      $addFields: {
        matchCount: {
          $size: {
            $filter: {
              input: '$skills',
              cond: { $in: ['$$this', skills] }
            }
          }
        }
      }
    },
    { $match: { matchCount: { $gte: minMatch } } },
    { $sort: { matchCount: -1, 'usageStats.totalInterviews': -1 } }
  ]);
};

JobRoleSchema.statics.getPopularRoles = function(limit: number = 10) {
  return this.find({ isActive: true })
    .sort({ 'usageStats.totalInterviews': -1, 'usageStats.averageScore': -1 })
    .limit(limit);
};

JobRoleSchema.statics.getRoleAnalytics = function() {
  return this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$department',
        count: { $sum: 1 },
        avgInterviews: { $avg: '$usageStats.totalInterviews' },
        avgScore: { $avg: '$usageStats.averageScore' },
        levels: { $push: '$level' }
      }
    },
    {
      $project: {
        department: '$_id',
        count: 1,
        avgInterviews: { $round: ['$avgInterviews', 1] },
        avgScore: { $round: ['$avgScore', 1] },
        levelDistribution: {
          entry: { $size: { $filter: { input: '$levels', cond: { $eq: ['$$this', 'entry'] } } } },
          mid: { $size: { $filter: { input: '$levels', cond: { $eq: ['$$this', 'mid'] } } } },
          senior: { $size: { $filter: { input: '$levels', cond: { $eq: ['$$this', 'senior'] } } } },
          lead: { $size: { $filter: { input: '$levels', cond: { $eq: ['$$this', 'lead'] } } } },
          executive: { $size: { $filter: { input: '$levels', cond: { $eq: ['$$this', 'executive'] } } } }
        }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

JobRoleSchema.statics.searchRoles = function(searchTerm: string, options: any = {}) {
  const {
    department,
    level,
    skills,
    minExperience,
    maxExperience,
    limit = 20
  } = options;

  const query: any = { isActive: true };
  
  // Text search
  if (searchTerm) {
    query.$or = [
      { title: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } },
      { skills: { $in: [new RegExp(searchTerm, 'i')] } },
      { tags: { $in: [new RegExp(searchTerm, 'i')] } }
    ];
  }

  // Filters
  if (department) query.department = department;
  if (level) query.level = level;
  if (skills && skills.length > 0) query.skills = { $in: skills };
  
  if (minExperience !== undefined || maxExperience !== undefined) {
    query.$and = query.$and || [];
    if (minExperience !== undefined) {
      query.$and.push({ 'experienceYears.min': { $lte: minExperience } });
    }
    if (maxExperience !== undefined) {
      query.$and.push({ 'experienceYears.max': { $gte: maxExperience } });
    }
  }

  return this.find(query)
    .sort({ 'usageStats.totalInterviews': -1, title: 1 })
    .limit(limit);
};

export const JobRole = mongoose.model<IJobRole>('JobRole', JobRoleSchema);
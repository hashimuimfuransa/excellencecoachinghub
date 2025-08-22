import mongoose, { Document, Schema } from 'mongoose';

export interface ResponseAnalysis {
  question: string;
  answer: string;
  score: number; // 0-100
  feedback: string;
  keywords: string[];
  relevanceScore: number; // 0-100
  technicalAccuracy?: number; // 0-100 for technical questions
  communicationScore: number; // 0-100
  structure: 'poor' | 'fair' | 'good' | 'excellent';
  timeSpent: number; // seconds
}

export interface SkillAssessment {
  communication: number; // 0-100
  technical: number; // 0-100
  problemSolving: number; // 0-100
  cultural: number; // 0-100
  leadership?: number; // 0-100 (optional, for senior roles)
  creativity?: number; // 0-100 (optional, for creative roles)
}

export interface DetailedFeedback {
  category: 'strength' | 'improvement' | 'neutral';
  aspect: string; // e.g., 'Technical Knowledge', 'Communication Skills'
  description: string;
  severity: 'low' | 'medium' | 'high'; // for improvements
  impact: 'minor' | 'moderate' | 'significant'; // for strengths
  suggestions?: string[]; // actionable suggestions for improvements
}

export interface IInterviewResult extends Document {
  sessionId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  jobId: string;
  jobTitle: string;
  score: number; // Overall score 0-100
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';
  overallFeedback: string;
  strengths: string[];
  improvements: string[];
  responses: ResponseAnalysis[];
  completionTime: number; // Total time taken in seconds
  skillAssessment: SkillAssessment;
  recommendation: 'strongly_recommend' | 'recommend' | 'consider' | 'not_recommend';
  detailedFeedback: DetailedFeedback[];
  
  // Performance metrics
  averageResponseTime: number; // seconds per response
  consistencyScore: number; // 0-100, measures consistency across responses
  confidenceLevel: number; // 0-100, overall confidence in responses
  
  // Comparative analysis
  percentile?: number; // Where this result stands compared to others (0-100)
  roleAlignment?: number; // How well responses align with the specific role (0-100)
  
  // Processing metadata
  aiModel?: string; // Which AI model was used for analysis
  processingVersion?: string; // Version of the analysis algorithm
  processingTime?: number; // Time taken to process results (ms)
  
  // Flags for review
  flagged?: boolean; // If result needs human review
  flagReason?: string; // Reason for flagging
  reviewedBy?: mongoose.Types.ObjectId; // User who reviewed (if any)
  reviewedAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

const ResponseAnalysisSchema = new Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  score: { 
    type: Number, 
    required: true, 
    min: 0, 
    max: 100 
  },
  feedback: { type: String, required: true },
  keywords: [{ type: String }],
  relevanceScore: { 
    type: Number, 
    required: true, 
    min: 0, 
    max: 100 
  },
  technicalAccuracy: { 
    type: Number, 
    min: 0, 
    max: 100 
  },
  communicationScore: { 
    type: Number, 
    required: true, 
    min: 0, 
    max: 100 
  },
  structure: { 
    type: String, 
    enum: ['poor', 'fair', 'good', 'excellent'], 
    required: true 
  },
  timeSpent: { 
    type: Number, 
    required: true, 
    min: 0 
  }
}, { _id: false });

const SkillAssessmentSchema = new Schema({
  communication: { 
    type: Number, 
    required: true, 
    min: 0, 
    max: 100 
  },
  technical: { 
    type: Number, 
    required: true, 
    min: 0, 
    max: 100 
  },
  problemSolving: { 
    type: Number, 
    required: true, 
    min: 0, 
    max: 100 
  },
  cultural: { 
    type: Number, 
    required: true, 
    min: 0, 
    max: 100 
  },
  leadership: { 
    type: Number, 
    min: 0, 
    max: 100 
  },
  creativity: { 
    type: Number, 
    min: 0, 
    max: 100 
  }
}, { _id: false });

const DetailedFeedbackSchema = new Schema({
  category: { 
    type: String, 
    enum: ['strength', 'improvement', 'neutral'], 
    required: true 
  },
  aspect: { type: String, required: true },
  description: { type: String, required: true },
  severity: { 
    type: String, 
    enum: ['low', 'medium', 'high'], 
    required: function() { return this.category === 'improvement'; }
  },
  impact: { 
    type: String, 
    enum: ['minor', 'moderate', 'significant'], 
    required: function() { return this.category === 'strength'; }
  },
  suggestions: [{ type: String }]
}, { _id: false });

const InterviewResultSchema = new Schema({
  sessionId: { 
    type: Schema.Types.ObjectId, 
    ref: 'InterviewSession', 
    required: true,
    unique: true,
    index: true
  },
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  jobId: { type: String, required: true },
  jobTitle: { type: String, required: true },
  score: { 
    type: Number, 
    required: true, 
    min: 0, 
    max: 100,
    index: true
  },
  grade: { 
    type: String, 
    enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'], 
    required: true,
    index: true
  },
  overallFeedback: { type: String, required: true },
  strengths: [{ type: String }],
  improvements: [{ type: String }],
  responses: [ResponseAnalysisSchema],
  completionTime: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  skillAssessment: { 
    type: SkillAssessmentSchema, 
    required: true 
  },
  recommendation: { 
    type: String, 
    enum: ['strongly_recommend', 'recommend', 'consider', 'not_recommend'], 
    required: true,
    index: true
  },
  detailedFeedback: [DetailedFeedbackSchema],
  
  // Performance metrics
  averageResponseTime: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  consistencyScore: { 
    type: Number, 
    required: true, 
    min: 0, 
    max: 100 
  },
  confidenceLevel: { 
    type: Number, 
    required: true, 
    min: 0, 
    max: 100 
  },
  
  // Comparative analysis
  percentile: { 
    type: Number, 
    min: 0, 
    max: 100 
  },
  roleAlignment: { 
    type: Number, 
    min: 0, 
    max: 100 
  },
  
  // Processing metadata
  aiModel: { type: String },
  processingVersion: { type: String },
  processingTime: { type: Number },
  
  // Flags for review
  flagged: { type: Boolean, default: false, index: true },
  flagReason: { type: String },
  reviewedBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  },
  reviewedAt: { type: Date }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
InterviewResultSchema.index({ userId: 1, createdAt: -1 });
InterviewResultSchema.index({ jobTitle: 1, score: -1 });
InterviewResultSchema.index({ recommendation: 1, score: -1 });
InterviewResultSchema.index({ createdAt: -1, score: -1 });

// Pre-save middleware to calculate grade and derived metrics
InterviewResultSchema.pre('save', function(this: IInterviewResult) {
  // Calculate grade based on score
  if (this.score >= 97) this.grade = 'A+';
  else if (this.score >= 93) this.grade = 'A';
  else if (this.score >= 87) this.grade = 'B+';
  else if (this.score >= 83) this.grade = 'B';
  else if (this.score >= 77) this.grade = 'C+';
  else if (this.score >= 70) this.grade = 'C';
  else if (this.score >= 60) this.grade = 'D';
  else this.grade = 'F';

  // Calculate average response time
  if (this.responses.length > 0) {
    this.averageResponseTime = this.responses.reduce((sum, response) => sum + response.timeSpent, 0) / this.responses.length;
  }

  // Calculate consistency score (how consistent the scores are across responses)
  if (this.responses.length > 1) {
    const scores = this.responses.map(r => r.score);
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Convert to 0-100 scale where lower deviation = higher consistency
    this.consistencyScore = Math.max(0, 100 - (standardDeviation * 2));
  } else {
    this.consistencyScore = 100; // Single response is perfectly consistent
  }

  // Calculate confidence level based on response quality metrics
  const avgCommunicationScore = this.responses.reduce((sum, r) => sum + r.communicationScore, 0) / this.responses.length;
  const avgRelevanceScore = this.responses.reduce((sum, r) => sum + r.relevanceScore, 0) / this.responses.length;
  this.confidenceLevel = Math.round((avgCommunicationScore + avgRelevanceScore) / 2);
});

// Virtual for performance summary
InterviewResultSchema.virtual('performanceSummary').get(function(this: IInterviewResult) {
  const excellence = ['A+', 'A'].includes(this.grade) ? 'excellent' : 
                   ['B+', 'B'].includes(this.grade) ? 'good' : 
                   ['C+', 'C'].includes(this.grade) ? 'satisfactory' : 'needs improvement';
  
  return {
    level: excellence,
    score: this.score,
    grade: this.grade,
    recommendation: this.recommendation,
    topStrength: this.strengths[0] || 'N/A',
    primaryImprovement: this.improvements[0] || 'N/A'
  };
});

// Virtual for skill radar data (for charts)
InterviewResultSchema.virtual('skillRadarData').get(function(this: IInterviewResult) {
  return [
    { skill: 'Communication', score: this.skillAssessment.communication },
    { skill: 'Technical', score: this.skillAssessment.technical },
    { skill: 'Problem Solving', score: this.skillAssessment.problemSolving },
    { skill: 'Cultural Fit', score: this.skillAssessment.cultural },
    ...(this.skillAssessment.leadership ? [{ skill: 'Leadership', score: this.skillAssessment.leadership }] : []),
    ...(this.skillAssessment.creativity ? [{ skill: 'Creativity', score: this.skillAssessment.creativity }] : [])
  ];
});

// Instance methods
InterviewResultSchema.methods.flagForReview = function(this: IInterviewResult, reason: string, flaggedBy?: string) {
  this.flagged = true;
  this.flagReason = reason;
  if (flaggedBy) {
    this.reviewedBy = new mongoose.Types.ObjectId(flaggedBy);
  }
  return this.save();
};

InterviewResultSchema.methods.markReviewed = function(this: IInterviewResult, reviewerId: string) {
  this.flagged = false;
  this.reviewedBy = new mongoose.Types.ObjectId(reviewerId);
  this.reviewedAt = new Date();
  return this.save();
};

InterviewResultSchema.methods.getComparisonData = async function(this: IInterviewResult) {
  // Get comparison data for similar roles and time period
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  const stats = await this.constructor.aggregate([
    {
      $match: {
        jobTitle: this.jobTitle,
        createdAt: { $gte: thirtyDaysAgo },
        _id: { $ne: this._id }
      }
    },
    {
      $group: {
        _id: null,
        avgScore: { $avg: '$score' },
        count: { $sum: 1 },
        scoreDistribution: { 
          $push: '$score' 
        }
      }
    }
  ]);

  if (stats.length === 0) {
    return { percentile: null, comparison: 'insufficient-data' };
  }

  const { avgScore, count, scoreDistribution } = stats[0];
  const lowerScores = scoreDistribution.filter((score: number) => score < this.score).length;
  const percentile = Math.round((lowerScores / count) * 100);

  return {
    percentile,
    avgScore: Math.round(avgScore),
    comparison: this.score > avgScore ? 'above-average' : 
               this.score === avgScore ? 'average' : 'below-average',
    sampleSize: count
  };
};

// Static methods
InterviewResultSchema.statics.findByUser = function(userId: string, limit: number = 10) {
  return this.find({ userId: new mongoose.Types.ObjectId(userId) })
    .sort({ createdAt: -1 })
    .limit(limit);
};

InterviewResultSchema.statics.getTopPerformers = function(jobTitle?: string, limit: number = 10) {
  const match: any = { score: { $gte: 80 } };
  if (jobTitle) match.jobTitle = jobTitle;

  return this.find(match)
    .sort({ score: -1, createdAt: -1 })
    .limit(limit)
    .populate('userId', 'firstName lastName email');
};

InterviewResultSchema.statics.getAnalytics = function(period: 'week' | 'month' | 'year' = 'month') {
  const periodMap = {
    week: 7,
    month: 30,
    year: 365
  };
  
  const startDate = new Date(Date.now() - periodMap[period] * 24 * 60 * 60 * 1000);

  return this.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: '$jobTitle',
        count: { $sum: 1 },
        avgScore: { $avg: '$score' },
        recommendations: {
          $push: '$recommendation'
        }
      }
    },
    {
      $project: {
        jobTitle: '$_id',
        count: 1,
        avgScore: { $round: ['$avgScore', 1] },
        stronglyRecommended: {
          $size: {
            $filter: {
              input: '$recommendations',
              cond: { $eq: ['$$this', 'strongly_recommend'] }
            }
          }
        },
        recommended: {
          $size: {
            $filter: {
              input: '$recommendations',
              cond: { $eq: ['$$this', 'recommend'] }
            }
          }
        }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

InterviewResultSchema.statics.getFlaggedResults = function(limit: number = 50) {
  return this.find({ flagged: true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('userId', 'firstName lastName email')
    .populate('reviewedBy', 'firstName lastName');
};

export const InterviewResult = mongoose.model<IInterviewResult>('InterviewResult', InterviewResultSchema);
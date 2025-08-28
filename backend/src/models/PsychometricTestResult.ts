import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPsychometricTestResultDocument extends Document {
  test?: string;
  user: string;
  job?: string;
  answers: Record<string, any>;
  scores: Record<string, number>;
  overallScore: number;
  interpretation: string;
  recommendations: string[];
  completedAt: Date;
  timeSpent: number;
  grade?: string;
  percentile?: number;
  categoryScores?: Record<string, number>;
  detailedAnalysis?: Record<string, any>;
  failedQuestions?: Array<{
    questionNumber: number;
    question: string;
    yourAnswer: string;
    correctAnswer: string;
    explanation: string;
    category?: string;
  }>;
  correctQuestions?: Array<{
    questionNumber: number;
    question: string;
    candidateAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    category?: string;
    explanation?: string;
    options?: string[];
  }>;
  questionByQuestionAnalysis?: Array<{
    questionNumber: number;
    question: string;
    candidateAnswer: any;
    correctAnswer: any;
    isCorrect: boolean;
    pointsEarned: number;
    maxPoints: number;
    analysis: string;
    traitImpact: string;
    category?: string;
  }>;
  attempt: number;
  testMetadata?: {
    testId: string;
    title: string;
    type: string;
    categories: string[];
    difficulty: string;
    isGenerated: boolean;
    jobSpecific: boolean;
    questions?: any[];
  };
}

export interface IPsychometricTestResultModel extends Model<IPsychometricTestResultDocument> {
  findByUser(userId: string): Promise<IPsychometricTestResultDocument[]>;
  findByTest(testId: string): Promise<IPsychometricTestResultDocument[]>;
  findByJob(jobId: string): Promise<IPsychometricTestResultDocument[]>;
  findUserResultForTest(userId: string, testId: string): Promise<IPsychometricTestResultDocument | null>;
}

const psychometricTestResultSchema = new Schema<IPsychometricTestResultDocument>({
  test: {
    type: Schema.Types.ObjectId,
    ref: 'PsychometricTest',
    required: false // Make optional for dynamically generated tests
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  job: {
    type: Schema.Types.ObjectId,
    ref: 'Job'
  },
  answers: {
    type: Schema.Types.Mixed,
    required: [true, 'Answers are required']
  },
  scores: {
    type: Schema.Types.Mixed,
    required: [true, 'Scores are required']
  },
  overallScore: {
    type: Number,
    required: [true, 'Overall score is required'],
    min: [0, 'Score cannot be negative'],
    max: [100, 'Score cannot exceed 100']
  },
  interpretation: {
    type: String,
    required: [true, 'Interpretation is required'],
    trim: true,
    maxlength: [2000, 'Interpretation cannot exceed 2000 characters']
  },
  recommendations: [{
    type: String,
    trim: true,
    maxlength: [500, 'Recommendation cannot exceed 500 characters']
  }],
  completedAt: {
    type: Date,
    default: Date.now
  },
  timeSpent: {
    type: Number,
    required: [true, 'Time spent is required'],
    min: [1, 'Time spent must be at least 1 minute']
  },
  grade: {
    type: String,
    required: false
  },
  percentile: {
    type: Number,
    required: false,
    min: [0, 'Percentile cannot be negative'],
    max: [100, 'Percentile cannot exceed 100']
  },
  categoryScores: {
    type: Schema.Types.Mixed,
    required: false
  },
  detailedAnalysis: {
    type: Schema.Types.Mixed,
    required: false
  },
  failedQuestions: [{
    questionNumber: { type: Number, required: false },
    question: { type: String, required: false },
    yourAnswer: { type: String, required: false },
    correctAnswer: { type: String, required: false },
    explanation: { type: String, required: false },
    category: { type: String, required: false }
  }],
  correctQuestions: [{
    questionNumber: { type: Number, required: false },
    question: { type: String, required: false },
    candidateAnswer: { type: String, required: false },
    correctAnswer: { type: String, required: false },
    isCorrect: { type: Boolean, default: true },
    category: { type: String, required: false },
    explanation: { type: String, required: false },
    options: [{ type: String }]
  }],
  questionByQuestionAnalysis: [{
    questionNumber: { type: Number, required: false },
    question: { type: String, required: false },
    candidateAnswer: { type: Schema.Types.Mixed, required: false },
    correctAnswer: { type: Schema.Types.Mixed, required: false },
    isCorrect: { type: Boolean, required: false },
    pointsEarned: { type: Number, required: false },
    maxPoints: { type: Number, required: false },
    analysis: { type: String, required: false },
    traitImpact: { type: String, required: false },
    category: { type: String, required: false }
  }],
  testMetadata: {
    testId: { type: String, required: false },
    title: { type: String, required: false },
    type: { type: String, required: false },
    categories: [{ type: String }],
    difficulty: { type: String, required: false },
    isGenerated: { type: Boolean, default: false },
    jobSpecific: { type: Boolean, default: false },
    questions: { type: Schema.Types.Mixed, required: false }
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for performance
psychometricTestResultSchema.index({ user: 1 });
psychometricTestResultSchema.index({ test: 1 });
psychometricTestResultSchema.index({ job: 1 });
psychometricTestResultSchema.index({ completedAt: -1 });
psychometricTestResultSchema.index({ overallScore: -1 });

// Compound indexes
psychometricTestResultSchema.index({ user: 1, test: 1 });
psychometricTestResultSchema.index({ user: 1, job: 1 });
psychometricTestResultSchema.index({ test: 1, overallScore: -1 });

// Modified index to allow multiple attempts - removed unique constraint
// Users should be able to retake tests multiple times
psychometricTestResultSchema.index({ user: 1, test: 1, job: 1 });

// Index for generated tests - also allowing multiple attempts
psychometricTestResultSchema.index({ user: 1, 'testMetadata.testId': 1, job: 1 });

// Add attempt tracking
psychometricTestResultSchema.add({
  attempt: {
    type: Number,
    default: 1
  }
});

// Virtual for performance level
psychometricTestResultSchema.virtual('performanceLevel').get(function(this: IPsychometricTestResultDocument) {
  if (this.overallScore >= 90) return 'Excellent';
  if (this.overallScore >= 80) return 'Very Good';
  if (this.overallScore >= 70) return 'Good';
  if (this.overallScore >= 60) return 'Average';
  return 'Below Average';
});

// Static methods
psychometricTestResultSchema.statics.findByUser = function(userId: string): Promise<IPsychometricTestResultDocument[]> {
  return this.find({ user: userId })
    .populate('test', 'title type description')
    .populate('job', 'title company')
    .sort({ completedAt: -1, attempt: -1 });
};

psychometricTestResultSchema.statics.findByTest = function(testId: string): Promise<IPsychometricTestResultDocument[]> {
  return this.find({ test: testId })
    .populate('user', 'firstName lastName email')
    .populate('job', 'title company')
    .sort({ overallScore: -1 });
};

psychometricTestResultSchema.statics.findByJob = function(jobId: string): Promise<IPsychometricTestResultDocument[]> {
  return this.find({ job: jobId })
    .populate('user', 'firstName lastName email')
    .populate('test', 'title type description')
    .sort({ overallScore: -1 });
};

psychometricTestResultSchema.statics.findUserResultForTest = function(
  userId: string, 
  testId: string
): Promise<IPsychometricTestResultDocument | null> {
  return this.findOne({ user: userId, test: testId })
    .populate('test', 'title type description')
    .populate('job', 'title company');
};

export const PsychometricTestResult = mongoose.model<IPsychometricTestResultDocument, IPsychometricTestResultModel>('PsychometricTestResult', psychometricTestResultSchema);
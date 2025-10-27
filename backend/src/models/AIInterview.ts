import mongoose, { Schema, Document, Model } from 'mongoose';
import { InterviewType } from '../types';

export interface IAIInterviewQuestionDocument {
  _id: string;
  question: string;
  type: InterviewType;
  expectedKeywords: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit?: number;
}

export interface IAIInterviewResponseDocument {
  questionId: string;
  response: string;
  audioUrl?: string;
  score: number;
  feedback: string;
  keywordsFound: string[];
  responseTime: number;
}

export interface IAIInterviewDocument extends Document {
  user: string;
  job?: string;
  type: InterviewType;
  questions: IAIInterviewQuestionDocument[];
  responses: IAIInterviewResponseDocument[];
  overallScore: number;
  feedback: string;
  recommendations: string[];
  strengths: string[];
  areasForImprovement: string[];
  completedAt: Date;
  duration: number;
}

export interface IAIInterviewModel extends Model<IAIInterviewDocument> {
  findByUser(userId: string): Promise<IAIInterviewDocument[]>;
  findByJob(jobId: string): Promise<IAIInterviewDocument[]>;
  findByType(type: InterviewType): Promise<IAIInterviewDocument[]>;
  findUserInterviewForJob(userId: string, jobId: string): Promise<IAIInterviewDocument | null>;
}

const aiInterviewQuestionSchema = new Schema({
  question: {
    type: String,
    required: [true, 'Question is required'],
    trim: true,
    maxlength: [1000, 'Question cannot exceed 1000 characters']
  },
  type: {
    type: String,
    enum: InterviewType ? Object.values(InterviewType) : ['general', 'technical', 'behavioral', 'case_study'],
    required: [true, 'Question type is required']
  },
  expectedKeywords: [{
    type: String,
    trim: true,
    maxlength: [100, 'Keyword cannot exceed 100 characters']
  }],
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: [true, 'Difficulty level is required']
  },
  timeLimit: {
    type: Number,
    min: [30, 'Time limit must be at least 30 seconds'],
    max: [600, 'Time limit cannot exceed 600 seconds']
  }
}, { _id: true });

const aiInterviewResponseSchema = new Schema({
  questionId: {
    type: String,
    required: [true, 'Question ID is required']
  },
  response: {
    type: String,
    required: [true, 'Response is required'],
    trim: true,
    maxlength: [5000, 'Response cannot exceed 5000 characters']
  },
  audioUrl: {
    type: String,
    trim: true
  },
  score: {
    type: Number,
    required: [true, 'Score is required'],
    min: [0, 'Score cannot be negative'],
    max: [100, 'Score cannot exceed 100']
  },
  feedback: {
    type: String,
    required: [true, 'Feedback is required'],
    trim: true,
    maxlength: [1000, 'Feedback cannot exceed 1000 characters']
  },
  keywordsFound: [{
    type: String,
    trim: true,
    maxlength: [100, 'Keyword cannot exceed 100 characters']
  }],
  responseTime: {
    type: Number,
    required: [true, 'Response time is required'],
    min: [1, 'Response time must be at least 1 second']
  }
}, { _id: false });

const aiInterviewSchema = new Schema<IAIInterviewDocument>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  job: {
    type: Schema.Types.ObjectId,
    ref: 'Job'
  },
  type: {
    type: String,
    enum: InterviewType ? Object.values(InterviewType) : ['general', 'technical', 'behavioral', 'case_study'],
    required: [true, 'Interview type is required']
  },
  questions: {
    type: [aiInterviewQuestionSchema],
    required: [true, 'Questions are required'],
    validate: {
      validator: function(questions: IAIInterviewQuestionDocument[]) {
        return questions && questions.length > 0;
      },
      message: 'Interview must have at least one question'
    }
  },
  responses: {
    type: [aiInterviewResponseSchema],
    required: [true, 'Responses are required']
  },
  overallScore: {
    type: Number,
    required: [true, 'Overall score is required'],
    min: [0, 'Score cannot be negative'],
    max: [100, 'Score cannot exceed 100']
  },
  feedback: {
    type: String,
    required: [true, 'Feedback is required'],
    trim: true,
    maxlength: [2000, 'Feedback cannot exceed 2000 characters']
  },
  recommendations: [{
    type: String,
    trim: true,
    maxlength: [500, 'Recommendation cannot exceed 500 characters']
  }],
  strengths: [{
    type: String,
    trim: true,
    maxlength: [200, 'Strength cannot exceed 200 characters']
  }],
  areasForImprovement: [{
    type: String,
    trim: true,
    maxlength: [200, 'Area for improvement cannot exceed 200 characters']
  }],
  completedAt: {
    type: Date,
    default: Date.now
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [1, 'Duration must be at least 1 minute']
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
aiInterviewSchema.index({ user: 1 });
aiInterviewSchema.index({ job: 1 });
aiInterviewSchema.index({ type: 1 });
aiInterviewSchema.index({ completedAt: -1 });
aiInterviewSchema.index({ overallScore: -1 });

// Compound indexes
aiInterviewSchema.index({ user: 1, job: 1 });
aiInterviewSchema.index({ user: 1, type: 1 });
aiInterviewSchema.index({ job: 1, overallScore: -1 });

// Virtual for performance level
aiInterviewSchema.virtual('performanceLevel').get(function(this: IAIInterviewDocument) {
  if (this.overallScore >= 90) return 'Excellent';
  if (this.overallScore >= 80) return 'Very Good';
  if (this.overallScore >= 70) return 'Good';
  if (this.overallScore >= 60) return 'Average';
  return 'Below Average';
});

// Virtual for completion rate
aiInterviewSchema.virtual('completionRate').get(function(this: IAIInterviewDocument) {
  if (!this.questions || !this.responses) return 0;
  return (this.responses.length / this.questions.length) * 100;
});

// Static methods
aiInterviewSchema.statics.findByUser = function(userId: string): Promise<IAIInterviewDocument[]> {
  return this.find({ user: userId })
    .populate('job', 'title company')
    .sort({ completedAt: -1 });
};

aiInterviewSchema.statics.findByJob = function(jobId: string): Promise<IAIInterviewDocument[]> {
  return this.find({ job: jobId })
    .populate('user', 'firstName lastName email')
    .sort({ overallScore: -1 });
};

aiInterviewSchema.statics.findByType = function(type: InterviewType): Promise<IAIInterviewDocument[]> {
  return this.find({ type })
    .populate('user', 'firstName lastName email')
    .populate('job', 'title company')
    .sort({ completedAt: -1 });
};

aiInterviewSchema.statics.findUserInterviewForJob = function(
  userId: string, 
  jobId: string
): Promise<IAIInterviewDocument | null> {
  return this.findOne({ user: userId, job: jobId })
    .populate('job', 'title company');
};

export const AIInterview = mongoose.model<IAIInterviewDocument, IAIInterviewModel>('AIInterview', aiInterviewSchema);
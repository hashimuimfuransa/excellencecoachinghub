import mongoose, { Schema, Document, Model } from 'mongoose';
import { ExamStatus } from '../types';

// Exam attempt document interface
export interface IExamAttemptDocument extends Document {
  student: mongoose.Types.ObjectId;
  quiz: mongoose.Types.ObjectId;
  attemptNumber: number;
  answers: Record<string, any>;
  score: number;
  percentage: number;
  maxScore: number;
  startTime: Date;
  endTime?: Date;
  timeSpent?: number; // in minutes
  status: ExamStatus;
  proctoringSession?: mongoose.Types.ObjectId;
  aiGraded: boolean;
  teacherReviewed: boolean;
  feedback?: string;
  flaggedQuestions: string[]; // Question IDs that were flagged for review
  isSubmitted: boolean;
  submittedAt?: Date;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  calculateScore(): Promise<number>;
  submitAttempt(): Promise<IExamAttemptDocument>;
  addFeedback(feedback: string, reviewedBy: mongoose.Types.ObjectId): Promise<IExamAttemptDocument>;
  flagQuestion(questionId: string): Promise<IExamAttemptDocument>;
  isPassed(): boolean;
  getDuration(): number;
}

// Exam attempt model interface
export interface IExamAttemptModel extends Model<IExamAttemptDocument> {
  findByStudent(studentId: string): Promise<IExamAttemptDocument[]>;
  findByQuiz(quizId: string): Promise<IExamAttemptDocument[]>;
  findByStatus(status: ExamStatus): Promise<IExamAttemptDocument[]>;
  findPendingReview(): Promise<IExamAttemptDocument[]>;
  findByStudentAndQuiz(studentId: string, quizId: string): Promise<IExamAttemptDocument[]>;
  getAttemptCount(studentId: string, quizId: string): Promise<number>;
  getAverageScore(quizId: string): Promise<number>;
}

// Exam attempt schema
const examAttemptSchema = new Schema<IExamAttemptDocument>({
  student: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student reference is required']
  },
  quiz: {
    type: Schema.Types.ObjectId,
    ref: 'Quiz',
    required: [true, 'Quiz reference is required']
  },
  attemptNumber: {
    type: Number,
    required: [true, 'Attempt number is required'],
    min: [1, 'Attempt number must be at least 1']
  },
  answers: {
    type: Schema.Types.Mixed,
    default: {}
  },
  score: {
    type: Number,
    default: 0,
    min: [0, 'Score cannot be negative']
  },
  percentage: {
    type: Number,
    default: 0,
    min: [0, 'Percentage cannot be negative'],
    max: [100, 'Percentage cannot exceed 100']
  },
  maxScore: {
    type: Number,
    required: [true, 'Maximum score is required'],
    min: [1, 'Maximum score must be at least 1']
  },
  startTime: {
    type: Date,
    required: [true, 'Start time is required'],
    default: Date.now
  },
  endTime: {
    type: Date,
    default: null
  },
  timeSpent: {
    type: Number,
    default: 0,
    min: [0, 'Time spent cannot be negative']
  },
  status: {
    type: String,
    enum: ExamStatus ? Object.values(ExamStatus) : ['scheduled', 'in_progress', 'completed', 'cancelled'],
    default: ExamStatus.IN_PROGRESS
  },
  proctoringSession: {
    type: Schema.Types.ObjectId,
    ref: 'ProctoringSession',
    default: null
  },
  aiGraded: {
    type: Boolean,
    default: false
  },
  teacherReviewed: {
    type: Boolean,
    default: false
  },
  feedback: {
    type: String,
    maxlength: [2000, 'Feedback cannot exceed 2000 characters']
  },
  flaggedQuestions: [{
    type: String
  }],
  isSubmitted: {
    type: Boolean,
    default: false
  },
  submittedAt: {
    type: Date,
    default: null
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
examAttemptSchema.index({ student: 1 });
examAttemptSchema.index({ quiz: 1 });
examAttemptSchema.index({ status: 1 });
examAttemptSchema.index({ student: 1, quiz: 1 });
examAttemptSchema.index({ aiGraded: 1 });
examAttemptSchema.index({ teacherReviewed: 1 });
examAttemptSchema.index({ createdAt: -1 });
examAttemptSchema.index({ submittedAt: -1 });

// Compound index for finding attempts by student and quiz
examAttemptSchema.index({ student: 1, quiz: 1, attemptNumber: 1 }, { unique: true });

// Virtual for grade letter
examAttemptSchema.virtual('gradeLetter').get(function(this: IExamAttemptDocument) {
  if (this.percentage >= 90) return 'A';
  if (this.percentage >= 80) return 'B';
  if (this.percentage >= 70) return 'C';
  if (this.percentage >= 60) return 'D';
  return 'F';
});

// Pre-save middleware to calculate percentage
examAttemptSchema.pre<IExamAttemptDocument>('save', function(next) {
  if (this.isModified('score') || this.isModified('maxScore')) {
    this.percentage = this.maxScore > 0 ? (this.score / this.maxScore) * 100 : 0;
  }
  
  if (this.isModified('endTime') && this.endTime && this.startTime) {
    this.timeSpent = Math.round((this.endTime.getTime() - this.startTime.getTime()) / (1000 * 60));
  }
  
  next();
});

// Instance method to calculate score
examAttemptSchema.methods.calculateScore = async function(): Promise<number> {
  // This will be implemented with AI grading logic
  // For now, return the current score
  return this.score;
};

// Instance method to submit attempt
examAttemptSchema.methods.submitAttempt = async function(): Promise<IExamAttemptDocument> {
  this.isSubmitted = true;
  this.submittedAt = new Date();
  this.endTime = new Date();
  this.status = ExamStatus.COMPLETED;
  
  return this.save();
};

// Instance method to add feedback
examAttemptSchema.methods.addFeedback = async function(
  feedback: string, 
  reviewedBy: mongoose.Types.ObjectId
): Promise<IExamAttemptDocument> {
  this.feedback = feedback;
  this.teacherReviewed = true;
  
  return this.save();
};

// Instance method to flag question
examAttemptSchema.methods.flagQuestion = async function(questionId: string): Promise<IExamAttemptDocument> {
  if (!this.flaggedQuestions.includes(questionId)) {
    this.flaggedQuestions.push(questionId);
  }
  return this.save();
};

// Instance method to check if passed
examAttemptSchema.methods.isPassed = function(): boolean {
  // This will be compared against the quiz's passing score
  return this.percentage >= 60; // Default passing score, should be dynamic
};

// Instance method to get duration
examAttemptSchema.methods.getDuration = function(): number {
  if (this.endTime && this.startTime) {
    return Math.round((this.endTime.getTime() - this.startTime.getTime()) / (1000 * 60));
  }
  return 0;
};

// Static method to find attempts by student
examAttemptSchema.statics.findByStudent = function(studentId: string): Promise<IExamAttemptDocument[]> {
  return this.find({ student: studentId })
    .populate('quiz', 'title course')
    .populate('student', 'firstName lastName email')
    .sort({ createdAt: -1 });
};

// Static method to find attempts by quiz
examAttemptSchema.statics.findByQuiz = function(quizId: string): Promise<IExamAttemptDocument[]> {
  return this.find({ quiz: quizId })
    .populate('student', 'firstName lastName email')
    .sort({ createdAt: -1 });
};

// Static method to find attempts by status
examAttemptSchema.statics.findByStatus = function(status: ExamStatus): Promise<IExamAttemptDocument[]> {
  return this.find({ status })
    .populate('quiz', 'title course')
    .populate('student', 'firstName lastName email')
    .sort({ createdAt: -1 });
};

// Static method to find attempts pending review
examAttemptSchema.statics.findPendingReview = function(): Promise<IExamAttemptDocument[]> {
  return this.find({ 
    status: ExamStatus.COMPLETED,
    aiGraded: true,
    teacherReviewed: false
  })
    .populate('quiz', 'title course')
    .populate('student', 'firstName lastName email')
    .sort({ submittedAt: 1 });
};

// Static method to find attempts by student and quiz
examAttemptSchema.statics.findByStudentAndQuiz = function(
  studentId: string, 
  quizId: string
): Promise<IExamAttemptDocument[]> {
  return this.find({ student: studentId, quiz: quizId })
    .sort({ attemptNumber: -1 });
};

// Static method to get attempt count
examAttemptSchema.statics.getAttemptCount = async function(
  studentId: string, 
  quizId: string
): Promise<number> {
  return this.countDocuments({ student: studentId, quiz: quizId });
};

// Static method to get average score for a quiz
examAttemptSchema.statics.getAverageScore = async function(quizId: string): Promise<number> {
  const result = await this.aggregate([
    { $match: { quiz: new mongoose.Types.ObjectId(quizId), status: ExamStatus.COMPLETED } },
    { $group: { _id: null, averageScore: { $avg: '$percentage' } } }
  ]);
  
  return result.length > 0 ? result[0].averageScore : 0;
};

// Create and export the model
export const ExamAttempt = mongoose.model<IExamAttemptDocument, IExamAttemptModel>('ExamAttempt', examAttemptSchema);

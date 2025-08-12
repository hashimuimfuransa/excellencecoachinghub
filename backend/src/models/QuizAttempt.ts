import mongoose, { Schema, Document, Model } from 'mongoose';

// QuizAttempt document interface
export interface IQuizAttemptDocument extends Document {
  student: mongoose.Types.ObjectId;
  quiz: mongoose.Types.ObjectId;
  answers: Array<{
    question: mongoose.Types.ObjectId;
    selectedAnswer: string | string[];
    isCorrect: boolean;
    points: number;
    timeSpent?: number; // in seconds
  }>;
  score: number;
  maxScore: number;
  percentage: number;
  timeSpent: number; // in minutes
  startedAt: Date;
  submittedAt: Date;
  status: 'in-progress' | 'completed' | 'abandoned' | 'timed-out';
  attemptNumber: number;
  gradeLetter: string;
  feedback?: string;
  isProctored: boolean;
  proctoringData?: {
    violations: Array<{
      type: string;
      timestamp: Date;
      description: string;
      severity: 'low' | 'medium' | 'high';
    }>;
    screenshots: string[];
    eyeTrackingData?: any;
  };
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

// QuizAttempt model interface
export interface IQuizAttemptModel extends Model<IQuizAttemptDocument> {
  findByStudent(studentId: string): Promise<IQuizAttemptDocument[]>;
  findByQuiz(quizId: string): Promise<IQuizAttemptDocument[]>;
  getStudentAttempts(studentId: string, quizId: string): Promise<IQuizAttemptDocument[]>;
  getBestAttempt(studentId: string, quizId: string): Promise<IQuizAttemptDocument | null>;
  getAverageScore(quizId: string): Promise<number>;
}

// QuizAttempt schema
const quizAttemptSchema = new Schema<IQuizAttemptDocument>({
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
  answers: [{
    question: {
      type: Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    selectedAnswer: {
      type: Schema.Types.Mixed,
      required: true
    },
    isCorrect: {
      type: Boolean,
      required: true
    },
    points: {
      type: Number,
      required: true,
      min: 0
    },
    timeSpent: {
      type: Number,
      min: 0
    }
  }],
  score: {
    type: Number,
    required: [true, 'Score is required'],
    min: [0, 'Score cannot be negative']
  },
  maxScore: {
    type: Number,
    required: [true, 'Max score is required'],
    min: [1, 'Max score must be at least 1']
  },
  percentage: {
    type: Number,
    required: [true, 'Percentage is required'],
    min: [0, 'Percentage cannot be negative'],
    max: [100, 'Percentage cannot exceed 100']
  },
  timeSpent: {
    type: Number,
    required: [true, 'Time spent is required'],
    min: [0, 'Time spent cannot be negative']
  },
  startedAt: {
    type: Date,
    required: [true, 'Start time is required']
  },
  submittedAt: {
    type: Date,
    required: [true, 'Submission time is required']
  },
  status: {
    type: String,
    enum: ['in-progress', 'completed', 'abandoned', 'timed-out'],
    default: 'in-progress'
  },
  attemptNumber: {
    type: Number,
    required: [true, 'Attempt number is required'],
    min: [1, 'Attempt number must be at least 1']
  },
  gradeLetter: {
    type: String,
    required: [true, 'Grade letter is required'],
    enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F']
  },
  feedback: {
    type: String,
    maxlength: [2000, 'Feedback cannot exceed 2000 characters']
  },
  isProctored: {
    type: Boolean,
    default: false
  },
  proctoringData: {
    violations: [{
      type: {
        type: String,
        required: true
      },
      timestamp: {
        type: Date,
        required: true
      },
      description: {
        type: String,
        required: true
      },
      severity: {
        type: String,
        enum: ['low', 'medium', 'high'],
        required: true
      }
    }],
    screenshots: [String],
    eyeTrackingData: Schema.Types.Mixed
  },
  ipAddress: {
    type: String,
    maxlength: [45, 'IP address cannot exceed 45 characters'] // IPv6 max length
  },
  userAgent: {
    type: String,
    maxlength: [500, 'User agent cannot exceed 500 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
quizAttemptSchema.index({ student: 1 });
quizAttemptSchema.index({ quiz: 1 });
quizAttemptSchema.index({ student: 1, quiz: 1 });
quizAttemptSchema.index({ submittedAt: -1 });
quizAttemptSchema.index({ status: 1 });
quizAttemptSchema.index({ percentage: -1 });

// Virtual for duration in minutes
quizAttemptSchema.virtual('durationMinutes').get(function(this: IQuizAttemptDocument) {
  return Math.ceil((this.submittedAt.getTime() - this.startedAt.getTime()) / (1000 * 60));
});

// Virtual for pass/fail status
quizAttemptSchema.virtual('isPassed').get(function(this: IQuizAttemptDocument) {
  return this.percentage >= 60; // Assuming 60% is passing grade
});

// Pre-save middleware to calculate grade letter
quizAttemptSchema.pre<IQuizAttemptDocument>('save', function(next) {
  // Calculate grade letter based on percentage
  if (this.percentage >= 97) this.gradeLetter = 'A+';
  else if (this.percentage >= 93) this.gradeLetter = 'A';
  else if (this.percentage >= 90) this.gradeLetter = 'A-';
  else if (this.percentage >= 87) this.gradeLetter = 'B+';
  else if (this.percentage >= 83) this.gradeLetter = 'B';
  else if (this.percentage >= 80) this.gradeLetter = 'B-';
  else if (this.percentage >= 77) this.gradeLetter = 'C+';
  else if (this.percentage >= 73) this.gradeLetter = 'C';
  else if (this.percentage >= 70) this.gradeLetter = 'C-';
  else if (this.percentage >= 67) this.gradeLetter = 'D+';
  else if (this.percentage >= 60) this.gradeLetter = 'D';
  else this.gradeLetter = 'F';
  
  next();
});

// Static method to find attempts by student
quizAttemptSchema.statics.findByStudent = function(studentId: string): Promise<IQuizAttemptDocument[]> {
  return this.find({ student: studentId })
    .populate('quiz', 'title course')
    .sort({ submittedAt: -1 });
};

// Static method to find attempts by quiz
quizAttemptSchema.statics.findByQuiz = function(quizId: string): Promise<IQuizAttemptDocument[]> {
  return this.find({ quiz: quizId })
    .populate('student', 'firstName lastName email')
    .sort({ submittedAt: -1 });
};

// Static method to get student attempts for a specific quiz
quizAttemptSchema.statics.getStudentAttempts = function(studentId: string, quizId: string): Promise<IQuizAttemptDocument[]> {
  return this.find({ student: studentId, quiz: quizId })
    .sort({ attemptNumber: -1 });
};

// Static method to get best attempt for a student on a quiz
quizAttemptSchema.statics.getBestAttempt = function(studentId: string, quizId: string): Promise<IQuizAttemptDocument | null> {
  return this.findOne({ student: studentId, quiz: quizId })
    .sort({ percentage: -1, submittedAt: -1 });
};

// Static method to get average score for a quiz
quizAttemptSchema.statics.getAverageScore = async function(quizId: string): Promise<number> {
  const result = await this.aggregate([
    { $match: { quiz: new mongoose.Types.ObjectId(quizId), status: 'completed' } },
    { $group: { _id: '$student', bestScore: { $max: '$percentage' } } },
    { $group: { _id: null, averageScore: { $avg: '$bestScore' } } }
  ]);
  
  return result.length > 0 ? result[0].averageScore : 0;
};

// Create and export the model
export const QuizAttempt = mongoose.model<IQuizAttemptDocument, IQuizAttemptModel>('QuizAttempt', quizAttemptSchema);
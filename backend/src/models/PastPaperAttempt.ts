import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IPastPaperAttemptDocument extends Document {
  student: mongoose.Types.ObjectId | string; // Can be ObjectId for authenticated users or string for anonymous
  pastPaper: mongoose.Types.ObjectId;
  attemptNumber: number;
  answers: Record<string, any>;
  score: number;
  percentage: number;
  maxScore: number;
  startTime: Date;
  endTime?: Date;
  timeSpent?: number; // in minutes
  status: 'in_progress' | 'completed' | 'abandoned';
  
  // Feedback and results
  feedback?: string;
  correctAnswers: number;
  incorrectAnswers: number;
  unansweredQuestions: number;
  
  // Detailed results for each question
  questionResults: Array<{
    questionId: string;
    studentAnswer: any;
    correctAnswer: any;
    isCorrect: boolean;
    pointsEarned: number;
    pointsPossible: number;
    explanation?: string;
    topic?: string;
    timeSpent?: number; // time spent on this specific question
  }>;
  
  // Performance analytics
  strengths: string[]; // Topics where student performed well
  weaknesses: string[]; // Topics where student needs improvement
  recommendations: string[]; // AI-generated study recommendations
  
  // Settings used during attempt
  settings: {
    randomizeQuestions: boolean;
    randomizeOptions: boolean;
    showResultsImmediately: boolean;
    showCorrectAnswers: boolean;
    showExplanations: boolean;
    timeLimit?: number;
  };
  
  // Anonymous student info (for public attempts)
  anonymousStudent?: {
    name: string;
    email?: string;
  };
  
  // Metadata
  ipAddress?: string;
  userAgent?: string;
  isSubmitted: boolean;
  submittedAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  calculateScore(): Promise<number>;
  submitAttempt(): Promise<IPastPaperAttemptDocument>;
  generateFeedback(): Promise<string>;
  generateRecommendations(): Promise<string[]>;
  isPassed(): boolean;
  getDuration(): number;
  getPerformanceByTopic(): Record<string, { correct: number; total: number; percentage: number }>;
}

export interface IPastPaperAttemptModel extends Model<IPastPaperAttemptDocument> {
  findByStudent(studentId: string): Promise<IPastPaperAttemptDocument[]>;
  findByPastPaper(pastPaperId: string): Promise<IPastPaperAttemptDocument[]>;
  findByStatus(status: string): Promise<IPastPaperAttemptDocument[]>;
  findByStudentAndPastPaper(studentId: string, pastPaperId: string): Promise<IPastPaperAttemptDocument[]>;
  getAttemptCount(studentId: string, pastPaperId: string): Promise<number>;
  getAverageScore(pastPaperId: string): Promise<number>;
  getStudentProgress(studentId: string): Promise<{
    totalAttempts: number;
    averageScore: number;
    bestScore: number;
    improvementRate: number;
    strongTopics: string[];
    weakTopics: string[];
  }>;
}

const pastPaperAttemptSchema = new Schema<IPastPaperAttemptDocument>({
  student: {
    type: Schema.Types.Mixed, // Can be ObjectId for authenticated users or string for anonymous
    required: [true, 'Student reference is required'],
    validate: {
      validator: function(v: any) {
        return mongoose.Types.ObjectId.isValid(v) || typeof v === 'string';
      },
      message: 'Student must be a valid ObjectId or string'
    }
  },
  pastPaper: {
    type: Schema.Types.ObjectId,
    ref: 'PastPaper',
    required: [true, 'Past paper reference is required']
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
    enum: ['in_progress', 'completed', 'abandoned'],
    default: 'in_progress'
  },
  
  // Feedback and results
  feedback: {
    type: String,
    maxlength: [2000, 'Feedback cannot exceed 2000 characters']
  },
  correctAnswers: {
    type: Number,
    default: 0,
    min: [0, 'Correct answers cannot be negative']
  },
  incorrectAnswers: {
    type: Number,
    default: 0,
    min: [0, 'Incorrect answers cannot be negative']
  },
  unansweredQuestions: {
    type: Number,
    default: 0,
    min: [0, 'Unanswered questions cannot be negative']
  },
  
  // Detailed results for each question
  questionResults: [{
    questionId: {
      type: String,
      required: true
    },
    studentAnswer: Schema.Types.Mixed,
    correctAnswer: Schema.Types.Mixed,
    isCorrect: {
      type: Boolean,
      required: true
    },
    pointsEarned: {
      type: Number,
      required: true,
      min: 0
    },
    pointsPossible: {
      type: Number,
      required: true,
      min: 0
    },
    explanation: String,
    topic: String,
    timeSpent: {
      type: Number,
      min: 0
    }
  }],
  
  // Performance analytics
  strengths: [String],
  weaknesses: [String],
  recommendations: [String],
  
  // Settings used during attempt
  settings: {
    randomizeQuestions: {
      type: Boolean,
      default: false
    },
    randomizeOptions: {
      type: Boolean,
      default: false
    },
    showResultsImmediately: {
      type: Boolean,
      default: true
    },
    showCorrectAnswers: {
      type: Boolean,
      default: true
    },
    showExplanations: {
      type: Boolean,
      default: true
    },
    timeLimit: {
      type: Number,
      min: 1
    }
  },
  
  // Anonymous student info (for public attempts)
  anonymousStudent: {
    name: {
      type: String,
      required: function(this: any) {
        return !this.student || typeof this.student === 'string';
      }
    },
    email: {
      type: String,
      validate: {
        validator: function(v: string) {
          return !v || /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
        },
        message: 'Please enter a valid email address'
      }
    }
  },
  
  // Metadata
  ipAddress: String,
  userAgent: String,
  isSubmitted: {
    type: Boolean,
    default: false
  },
  submittedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
pastPaperAttemptSchema.index({ student: 1 });
pastPaperAttemptSchema.index({ pastPaper: 1 });
pastPaperAttemptSchema.index({ status: 1 });
pastPaperAttemptSchema.index({ student: 1, pastPaper: 1 });
pastPaperAttemptSchema.index({ createdAt: -1 });
pastPaperAttemptSchema.index({ submittedAt: -1 });
pastPaperAttemptSchema.index({ score: -1 });

// Compound index for finding attempts by student and past paper
pastPaperAttemptSchema.index({ student: 1, pastPaper: 1, attemptNumber: 1 }, { unique: true });

// Virtual for grade letter
pastPaperAttemptSchema.virtual('gradeLetter').get(function(this: IPastPaperAttemptDocument) {
  if (this.percentage >= 90) return 'A+';
  if (this.percentage >= 85) return 'A';
  if (this.percentage >= 80) return 'A-';
  if (this.percentage >= 75) return 'B+';
  if (this.percentage >= 70) return 'B';
  if (this.percentage >= 65) return 'B-';
  if (this.percentage >= 60) return 'C+';
  if (this.percentage >= 55) return 'C';
  if (this.percentage >= 50) return 'C-';
  if (this.percentage >= 45) return 'D+';
  if (this.percentage >= 40) return 'D';
  return 'F';
});

// Pre-save middleware to calculate percentage and statistics
pastPaperAttemptSchema.pre<IPastPaperAttemptDocument>('save', function(next) {
  if (this.isModified('score') || this.isModified('maxScore')) {
    this.percentage = this.maxScore > 0 ? (this.score / this.maxScore) * 100 : 0;
  }
  
  if (this.isModified('endTime') && this.endTime && this.startTime) {
    this.timeSpent = Math.round((this.endTime.getTime() - this.startTime.getTime()) / (1000 * 60));
  }
  
  // Calculate correct/incorrect/unanswered counts from question results
  if (this.isModified('questionResults')) {
    this.correctAnswers = this.questionResults.filter(qr => qr.isCorrect).length;
    this.incorrectAnswers = this.questionResults.filter(qr => !qr.isCorrect && qr.studentAnswer !== null && qr.studentAnswer !== undefined).length;
    this.unansweredQuestions = this.questionResults.filter(qr => qr.studentAnswer === null || qr.studentAnswer === undefined).length;
  }
  
  next();
});

// Instance method to calculate score
pastPaperAttemptSchema.methods.calculateScore = async function(): Promise<number> {
  // Calculate score based on question results
  const totalScore = this.questionResults.reduce((sum, qr) => sum + qr.pointsEarned, 0);
  this.score = totalScore;
  return totalScore;
};

// Instance method to submit attempt
pastPaperAttemptSchema.methods.submitAttempt = async function(): Promise<IPastPaperAttemptDocument> {
  this.isSubmitted = true;
  this.submittedAt = new Date();
  this.endTime = new Date();
  this.status = 'completed';
  
  // Generate feedback and recommendations
  this.feedback = await this.generateFeedback();
  this.recommendations = await this.generateRecommendations();
  
  return this.save();
};

// Instance method to generate feedback
pastPaperAttemptSchema.methods.generateFeedback = async function(): Promise<string> {
  const percentage = this.percentage;
  const correctCount = this.correctAnswers;
  const totalQuestions = this.questionResults.length;
  
  let feedback = `You scored ${percentage.toFixed(1)}% (${correctCount}/${totalQuestions} questions correct). `;
  
  if (percentage >= 90) {
    feedback += "Excellent work! You have a strong understanding of the material.";
  } else if (percentage >= 80) {
    feedback += "Good job! You're doing well with most concepts.";
  } else if (percentage >= 70) {
    feedback += "Not bad! There's room for improvement in some areas.";
  } else if (percentage >= 60) {
    feedback += "You're on the right track, but more study is needed.";
  } else {
    feedback += "Consider reviewing the material more thoroughly before attempting again.";
  }
  
  // Add topic-specific feedback
  if (this.strengths.length > 0) {
    feedback += ` Your strengths include: ${this.strengths.join(', ')}.`;
  }
  
  if (this.weaknesses.length > 0) {
    feedback += ` Areas to focus on: ${this.weaknesses.join(', ')}.`;
  }
  
  return feedback;
};

// Instance method to generate recommendations
pastPaperAttemptSchema.methods.generateRecommendations = async function(): Promise<string[]> {
  const recommendations: string[] = [];
  
  if (this.percentage < 70) {
    recommendations.push("Review the course materials thoroughly before attempting again");
    recommendations.push("Focus on understanding the fundamental concepts");
  }
  
  if (this.unansweredQuestions > 0) {
    recommendations.push("Try to answer all questions - even educated guesses can earn partial credit");
  }
  
  if (this.weaknesses.length > 0) {
    recommendations.push(`Spend extra time studying: ${this.weaknesses.join(', ')}`);
  }
  
  if (this.timeSpent && this.timeSpent < 30) {
    recommendations.push("Take your time to read questions carefully and think through your answers");
  }
  
  recommendations.push("Practice with similar past papers to improve your performance");
  
  return recommendations;
};

// Instance method to check if passed
pastPaperAttemptSchema.methods.isPassed = function(): boolean {
  return this.percentage >= 60; // Default passing score
};

// Instance method to get duration
pastPaperAttemptSchema.methods.getDuration = function(): number {
  if (this.endTime && this.startTime) {
    return Math.round((this.endTime.getTime() - this.startTime.getTime()) / (1000 * 60));
  }
  return 0;
};

// Instance method to get performance by topic
pastPaperAttemptSchema.methods.getPerformanceByTopic = function(): Record<string, { correct: number; total: number; percentage: number }> {
  const topicPerformance: Record<string, { correct: number; total: number; percentage: number }> = {};
  
  this.questionResults.forEach(qr => {
    if (qr.topic) {
      if (!topicPerformance[qr.topic]) {
        topicPerformance[qr.topic] = { correct: 0, total: 0, percentage: 0 };
      }
      topicPerformance[qr.topic].total++;
      if (qr.isCorrect) {
        topicPerformance[qr.topic].correct++;
      }
    }
  });
  
  // Calculate percentages
  Object.keys(topicPerformance).forEach(topic => {
    const perf = topicPerformance[topic];
    perf.percentage = perf.total > 0 ? (perf.correct / perf.total) * 100 : 0;
  });
  
  return topicPerformance;
};

// Static method to find attempts by student
pastPaperAttemptSchema.statics.findByStudent = function(studentId: string): Promise<IPastPaperAttemptDocument[]> {
  return this.find({ student: studentId })
    .populate('pastPaper', 'title subject level year')
    .populate('student', 'firstName lastName email')
    .sort({ createdAt: -1 });
};

// Static method to find attempts by past paper
pastPaperAttemptSchema.statics.findByPastPaper = function(pastPaperId: string): Promise<IPastPaperAttemptDocument[]> {
  return this.find({ pastPaper: pastPaperId })
    .populate('student', 'firstName lastName email')
    .sort({ createdAt: -1 });
};

// Static method to find attempts by status
pastPaperAttemptSchema.statics.findByStatus = function(status: string): Promise<IPastPaperAttemptDocument[]> {
  return this.find({ status })
    .populate('pastPaper', 'title subject level year')
    .populate('student', 'firstName lastName email')
    .sort({ createdAt: -1 });
};

// Static method to find attempts by student and past paper
pastPaperAttemptSchema.statics.findByStudentAndPastPaper = function(
  studentId: string, 
  pastPaperId: string
): Promise<IPastPaperAttemptDocument[]> {
  return this.find({ student: studentId, pastPaper: pastPaperId })
    .sort({ attemptNumber: -1 });
};

// Static method to get attempt count
pastPaperAttemptSchema.statics.getAttemptCount = async function(
  studentId: string, 
  pastPaperId: string
): Promise<number> {
  return this.countDocuments({ student: studentId, pastPaper: pastPaperId });
};

// Static method to get average score for a past paper
pastPaperAttemptSchema.statics.getAverageScore = async function(pastPaperId: string): Promise<number> {
  const result = await this.aggregate([
    { $match: { pastPaper: new mongoose.Types.ObjectId(pastPaperId), status: 'completed' } },
    { $group: { _id: null, averageScore: { $avg: '$percentage' } } }
  ]);
  
  return result.length > 0 ? result[0].averageScore : 0;
};

// Static method to get student progress
pastPaperAttemptSchema.statics.getStudentProgress = async function(studentId: string): Promise<{
  totalAttempts: number;
  averageScore: number;
  bestScore: number;
  improvementRate: number;
  strongTopics: string[];
  weakTopics: string[];
}> {
  const attempts = await this.find({ student: studentId, status: 'completed' })
    .populate('pastPaper', 'subject');
  
  const totalAttempts = attempts.length;
  const averageScore = totalAttempts > 0 ? attempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / totalAttempts : 0;
  const bestScore = totalAttempts > 0 ? Math.max(...attempts.map(attempt => attempt.percentage)) : 0;
  
  // Calculate improvement rate (comparing first half vs second half of attempts)
  let improvementRate = 0;
  if (totalAttempts >= 4) {
    const firstHalf = attempts.slice(0, Math.floor(totalAttempts / 2));
    const secondHalf = attempts.slice(Math.floor(totalAttempts / 2));
    
    const firstHalfAvg = firstHalf.reduce((sum, attempt) => sum + attempt.percentage, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, attempt) => sum + attempt.percentage, 0) / secondHalf.length;
    
    improvementRate = secondHalfAvg - firstHalfAvg;
  }
  
  // Analyze strong and weak topics
  const topicPerformance: Record<string, { correct: number; total: number }> = {};
  
  attempts.forEach(attempt => {
    attempt.questionResults.forEach(qr => {
      if (qr.topic) {
        if (!topicPerformance[qr.topic]) {
          topicPerformance[qr.topic] = { correct: 0, total: 0 };
        }
        topicPerformance[qr.topic].total++;
        if (qr.isCorrect) {
          topicPerformance[qr.topic].correct++;
        }
      }
    });
  });
  
  const strongTopics: string[] = [];
  const weakTopics: string[] = [];
  
  Object.entries(topicPerformance).forEach(([topic, perf]) => {
    const percentage = (perf.correct / perf.total) * 100;
    if (percentage >= 80) {
      strongTopics.push(topic);
    } else if (percentage < 60) {
      weakTopics.push(topic);
    }
  });
  
  return {
    totalAttempts,
    averageScore,
    bestScore,
    improvementRate,
    strongTopics,
    weakTopics
  };
};

// Create and export the model
export const PastPaperAttempt = mongoose.model<IPastPaperAttemptDocument, IPastPaperAttemptModel>('PastPaperAttempt', pastPaperAttemptSchema);

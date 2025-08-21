import mongoose, { Schema, Document, Model } from 'mongoose';
import { QuestionType } from './Assessment';

// Answer interface
export interface IAnswer {
  questionId: string;
  answer: string | string[]; // Can be single or multiple answers
  timeSpent?: number; // in seconds
  isCorrect?: boolean; // Set during grading
  pointsEarned?: number;
  feedback?: string; // AI or instructor feedback
}

// Submission status
export enum SubmissionStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  GRADED = 'graded',
  RETURNED = 'returned'
}

// Assessment submission document interface
export interface IAssessmentSubmissionDocument extends Document {
  assessment: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  answers: IAnswer[];
  submittedAt?: Date;
  startedAt: Date;
  completedAt?: Date;
  timeSpent: number; // total time in seconds
  attemptNumber: number;
  status: SubmissionStatus;
  score?: number; // points earned
  percentage?: number; // percentage score
  grade?: string; // letter grade
  feedback?: string; // overall feedback
  isLate: boolean;
  latePenaltyApplied?: number; // percentage penalty applied
  gradedBy?: mongoose.Types.ObjectId; // instructor or AI
  gradedAt?: Date;
  aiGraded: boolean;
  requiresManualReview: boolean; // for essay questions or flagged submissions
  proctoringData?: {
    sessionId?: string;
    violations?: string[];
    flagged: boolean;
  };
  attachments?: string[]; // file URLs for submitted files
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  calculateScore(): { score: number; percentage: number };
  submit(): Promise<IAssessmentSubmissionDocument>;
  gradeSubmission(graderId: string | null, isAI?: boolean): Promise<IAssessmentSubmissionDocument>;
  applyLatePenalty(penalty: number): void;
  canResubmit(): boolean;
}

// Assessment submission model interface
export interface IAssessmentSubmissionModel extends Model<IAssessmentSubmissionDocument> {
  findByStudent(studentId: string): Promise<IAssessmentSubmissionDocument[]>;
  findByAssessment(assessmentId: string): Promise<IAssessmentSubmissionDocument[]>;
  findByCourse(courseId: string): Promise<IAssessmentSubmissionDocument[]>;
  findPendingGrading(): Promise<IAssessmentSubmissionDocument[]>;
  getStudentAttempts(studentId: string, assessmentId: string): Promise<IAssessmentSubmissionDocument[]>;
}

// Answer schema
const answerSchema = new Schema({
  questionId: {
    type: String,
    required: true
  },
  answer: {
    type: Schema.Types.Mixed, // Can be string or array
    required: true
  },
  timeSpent: {
    type: Number,
    default: 0,
    min: [0, 'Time spent cannot be negative']
  },
  isCorrect: {
    type: Boolean
  },
  pointsEarned: {
    type: Number,
    default: 0,
    min: [0, 'Points earned cannot be negative']
  },
  feedback: {
    type: String,
    trim: true
  }
}, { _id: false });

// Assessment submission schema
const assessmentSubmissionSchema = new Schema<IAssessmentSubmissionDocument>({
  assessment: {
    type: Schema.Types.ObjectId,
    ref: 'Assessment',
    required: [true, 'Assessment is required']
  },
  student: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student is required']
  },
  course: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course is required']
  },
  answers: [answerSchema],
  submittedAt: {
    type: Date
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  timeSpent: {
    type: Number,
    default: 0,
    min: [0, 'Time spent cannot be negative']
  },
  attemptNumber: {
    type: Number,
    required: true,
    min: [1, 'Attempt number must be at least 1']
  },
  status: {
    type: String,
    enum: SubmissionStatus ? Object.values(SubmissionStatus) : ['draft', 'submitted', 'graded', 'returned'],
    default: SubmissionStatus.DRAFT
  },
  score: {
    type: Number,
    min: [0, 'Score cannot be negative']
  },
  percentage: {
    type: Number,
    min: [0, 'Percentage cannot be negative'],
    max: [100, 'Percentage cannot exceed 100']
  },
  grade: {
    type: String,
    trim: true
  },
  feedback: {
    type: String,
    trim: true
  },
  isLate: {
    type: Boolean,
    default: false
  },
  latePenaltyApplied: {
    type: Number,
    min: [0, 'Late penalty cannot be negative'],
    max: [100, 'Late penalty cannot exceed 100%']
  },
  gradedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  gradedAt: {
    type: Date
  },
  aiGraded: {
    type: Boolean,
    default: false
  },
  requiresManualReview: {
    type: Boolean,
    default: false
  },
  proctoringData: {
    sessionId: String,
    violations: [String],
    flagged: {
      type: Boolean,
      default: false
    }
  },
  attachments: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
assessmentSubmissionSchema.index({ student: 1, assessment: 1 });
assessmentSubmissionSchema.index({ assessment: 1 });
assessmentSubmissionSchema.index({ course: 1 });
assessmentSubmissionSchema.index({ status: 1 });
assessmentSubmissionSchema.index({ submittedAt: 1 });
assessmentSubmissionSchema.index({ requiresManualReview: 1 });

// Instance method to calculate score
assessmentSubmissionSchema.methods.calculateScore = function(): { score: number; percentage: number } {
  const totalPoints = this.answers.reduce((sum: number, answer: IAnswer) => sum + (answer.pointsEarned || 0), 0);
  
  // Get total possible points from assessment
  const assessment = this.assessment;
  const totalPossible = assessment.totalPoints || 1; // Avoid division by zero
  
  const percentage = Math.round((totalPoints / totalPossible) * 100);
  
  return {
    score: totalPoints,
    percentage: Math.min(percentage, 100) // Cap at 100%
  };
};

// Instance method to submit assessment
assessmentSubmissionSchema.methods.submit = async function(): Promise<IAssessmentSubmissionDocument> {
  this.status = SubmissionStatus.SUBMITTED;
  this.submittedAt = new Date();
  this.completedAt = new Date();
  
  // Calculate if submission is late
  const assessment = await mongoose.model('Assessment').findById(this.assessment);
  if (assessment && assessment.dueDate) {
    this.isLate = new Date() > assessment.dueDate;
  }
  
  return this.save();
};

// Instance method to grade assessment
assessmentSubmissionSchema.methods.gradeSubmission = async function(graderId: string | null, isAI: boolean = false): Promise<IAssessmentSubmissionDocument> {
  const { score, percentage } = this.calculateScore();
  
  this.score = score;
  this.percentage = percentage;
  this.status = SubmissionStatus.GRADED;
  this.gradedBy = graderId ? new mongoose.Types.ObjectId(graderId) : null;
  this.gradedAt = new Date();
  this.aiGraded = isAI;
  
  // Apply late penalty if applicable
  const assessment = await mongoose.model('Assessment').findById(this.assessment);
  if (this.isLate && assessment && assessment.lateSubmissionPenalty) {
    this.applyLatePenalty(assessment.lateSubmissionPenalty);
  }
  
  // Determine letter grade (simple A-F scale)
  if (this.percentage >= 90) this.grade = 'A';
  else if (this.percentage >= 80) this.grade = 'B';
  else if (this.percentage >= 70) this.grade = 'C';
  else if (this.percentage >= 60) this.grade = 'D';
  else this.grade = 'F';
  
  return this.save();
};

// Instance method to apply late penalty
assessmentSubmissionSchema.methods.applyLatePenalty = function(penalty: number): void {
  if (this.isLate && penalty > 0) {
    const penaltyAmount = (this.percentage || 0) * (penalty / 100);
    this.percentage = Math.max(0, (this.percentage || 0) - penaltyAmount);
    this.latePenaltyApplied = penalty;
  }
};

// Instance method to check if resubmission is allowed
assessmentSubmissionSchema.methods.canResubmit = async function(): Promise<boolean> {
  const assessment = await mongoose.model('Assessment').findById(this.assessment);
  if (!assessment) return false;
  
  // Check if more attempts are allowed
  const attempts = await mongoose.model('AssessmentSubmission').countDocuments({
    student: this.student,
    assessment: this.assessment,
    status: { $in: [SubmissionStatus.SUBMITTED, SubmissionStatus.GRADED] }
  });
  
  return attempts < assessment.attempts;
};

// Static method to find submissions by student
assessmentSubmissionSchema.statics.findByStudent = function(studentId: string): Promise<IAssessmentSubmissionDocument[]> {
  return this.find({ student: studentId })
    .populate('assessment', 'title type dueDate')
    .populate('course', 'title')
    .sort({ createdAt: -1 });
};

// Static method to find submissions by assessment
assessmentSubmissionSchema.statics.findByAssessment = function(assessmentId: string): Promise<IAssessmentSubmissionDocument[]> {
  return this.find({ assessment: assessmentId })
    .populate('student', 'firstName lastName email')
    .sort({ submittedAt: -1 });
};

// Static method to find submissions by course
assessmentSubmissionSchema.statics.findByCourse = function(courseId: string): Promise<IAssessmentSubmissionDocument[]> {
  return this.find({ course: courseId })
    .populate('assessment', 'title type')
    .populate('student', 'firstName lastName')
    .sort({ submittedAt: -1 });
};

// Static method to find submissions pending grading
assessmentSubmissionSchema.statics.findPendingGrading = function(): Promise<IAssessmentSubmissionDocument[]> {
  return this.find({ 
    status: SubmissionStatus.SUBMITTED,
    requiresManualReview: true
  })
  .populate('assessment', 'title type')
  .populate('student', 'firstName lastName')
  .populate('course', 'title')
  .sort({ submittedAt: 1 });
};

// Static method to get student attempts for an assessment
assessmentSubmissionSchema.statics.getStudentAttempts = function(studentId: string, assessmentId: string): Promise<IAssessmentSubmissionDocument[]> {
  return this.find({ 
    student: studentId, 
    assessment: assessmentId 
  }).sort({ attemptNumber: 1 });
};

export const AssessmentSubmission = mongoose.model<IAssessmentSubmissionDocument, IAssessmentSubmissionModel>('AssessmentSubmission', assessmentSubmissionSchema);

import mongoose, { Schema, Document, Model } from 'mongoose';

// Enrollment document interface
export interface IEnrollmentDocument extends Document {
  student: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  enrolledAt: Date;
  enrollmentType: 'notes' | 'live_sessions' | 'both'; // Type of enrollment
  hasNotesAccess: boolean; // Whether student has paid for notes access
  hasLiveSessionAccess: boolean; // Whether student has paid for live session access
  notesPaymentAmount?: number; // Amount paid for notes access
  liveSessionPaymentAmount?: number; // Amount paid for live session access
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  progressPercentage: number;
  totalPoints: number;
  timeSpent: number; // in minutes
  isCompleted: boolean;
  completionDate?: Date;
  lastAccessed?: Date;
  streakDays: number;
  currentLesson?: mongoose.Types.ObjectId;
  completedLessons: mongoose.Types.ObjectId[];
  quizScores: Array<{
    quiz: mongoose.Types.ObjectId;
    score: number;
    attempts: number;
    lastAttempt: Date;
  }>;
  certificateIssued: boolean;
  certificateId?: string;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Enrollment model interface
export interface IEnrollmentModel extends Model<IEnrollmentDocument> {
  findByStudent(studentId: string): Promise<IEnrollmentDocument[]>;
  findByCourse(courseId: string): Promise<IEnrollmentDocument[]>;
  findActiveEnrollments(): Promise<IEnrollmentDocument[]>;
  getStudentProgress(studentId: string, courseId: string): Promise<IEnrollmentDocument | null>;
}

// Enrollment schema
const enrollmentSchema = new Schema<IEnrollmentDocument>({
  student: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student reference is required']
  },
  course: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course reference is required']
  },
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  enrollmentType: {
    type: String,
    enum: ['notes', 'live_sessions', 'both'],
    required: [true, 'Enrollment type is required']
  },
  hasNotesAccess: {
    type: Boolean,
    default: false
  },
  hasLiveSessionAccess: {
    type: Boolean,
    default: false
  },
  notesPaymentAmount: {
    type: Number,
    default: 0,
    min: [0, 'Notes payment amount cannot be negative']
  },
  liveSessionPaymentAmount: {
    type: Number,
    default: 0,
    min: [0, 'Live session payment amount cannot be negative']
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  progressPercentage: {
    type: Number,
    default: 0,
    min: [0, 'Progress percentage cannot be negative'],
    max: [100, 'Progress percentage cannot exceed 100']
  },
  totalPoints: {
    type: Number,
    default: 0,
    min: [0, 'Total points cannot be negative']
  },
  timeSpent: {
    type: Number,
    default: 0,
    min: [0, 'Time spent cannot be negative']
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completionDate: {
    type: Date,
    default: null
  },
  lastAccessed: {
    type: Date,
    default: Date.now
  },
  streakDays: {
    type: Number,
    default: 0,
    min: [0, 'Streak days cannot be negative']
  },
  currentLesson: {
    type: Schema.Types.ObjectId,
    ref: 'Lesson',
    default: null
  },
  completedLessons: [{
    type: Schema.Types.ObjectId,
    ref: 'Lesson'
  }],
  quizScores: [{
    quiz: {
      type: Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true
    },
    score: {
      type: Number,
      required: true,
      min: 0
    },
    attempts: {
      type: Number,
      default: 1,
      min: 1
    },
    lastAttempt: {
      type: Date,
      default: Date.now
    }
  }],
  certificateIssued: {
    type: Boolean,
    default: false
  },
  certificateId: {
    type: String,
    default: null
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index to ensure a student can only have one enrollment per type per course
enrollmentSchema.index({ student: 1, course: 1, enrollmentType: 1 }, { unique: true });

// Indexes for performance
enrollmentSchema.index({ student: 1 });
enrollmentSchema.index({ course: 1 });
enrollmentSchema.index({ enrolledAt: -1 });
enrollmentSchema.index({ lastAccessed: -1 });
enrollmentSchema.index({ isCompleted: 1 });
enrollmentSchema.index({ isActive: 1 });

// Virtual for completion status
enrollmentSchema.virtual('completionStatus').get(function(this: IEnrollmentDocument) {
  if (this.isCompleted) return 'completed';
  if (this.progressPercentage > 0) return 'in-progress';
  return 'not-started';
});

// Virtual for average quiz score
enrollmentSchema.virtual('averageQuizScore').get(function(this: IEnrollmentDocument) {
  if (this.quizScores.length === 0) return 0;
  const totalScore = this.quizScores.reduce((sum, quiz) => sum + quiz.score, 0);
  return totalScore / this.quizScores.length;
});

// Pre-save middleware to update completion status
enrollmentSchema.pre<IEnrollmentDocument>('save', function(next) {
  // Auto-complete if progress reaches 100%
  if (this.progressPercentage >= 100 && !this.isCompleted) {
    this.isCompleted = true;
    this.completionDate = new Date();
  }
  
  // Reset completion if progress drops below 100%
  if (this.progressPercentage < 100 && this.isCompleted) {
    this.isCompleted = false;
    this.completionDate = undefined;
  }
  
  next();
});

// Static method to find enrollments by student
enrollmentSchema.statics.findByStudent = function(studentId: string): Promise<IEnrollmentDocument[]> {
  return this.find({ student: studentId, isActive: true })
    .populate('course', 'title thumbnail instructor')
    .sort({ lastAccessed: -1 });
};

// Static method to find enrollments by course
enrollmentSchema.statics.findByCourse = function(courseId: string): Promise<IEnrollmentDocument[]> {
  return this.find({ course: courseId, isActive: true })
    .populate('student', 'firstName lastName email avatar')
    .sort({ enrolledAt: -1 });
};

// Static method to find active enrollments
enrollmentSchema.statics.findActiveEnrollments = function(): Promise<IEnrollmentDocument[]> {
  return this.find({ isActive: true })
    .populate('student', 'firstName lastName email')
    .populate('course', 'title instructor')
    .sort({ lastAccessed: -1 });
};

// Static method to get student progress for a specific course
enrollmentSchema.statics.getStudentProgress = function(studentId: string, courseId: string): Promise<IEnrollmentDocument | null> {
  return this.findOne({ student: studentId, course: courseId, isActive: true })
    .populate('course', 'title thumbnail instructor')
    .populate('currentLesson', 'title order')
    .populate('completedLessons', 'title order');
};

// Create and export the model
export const Enrollment = mongoose.model<IEnrollmentDocument, IEnrollmentModel>('Enrollment', enrollmentSchema);
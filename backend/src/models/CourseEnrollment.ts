import mongoose, { Document, Schema } from 'mongoose';

export interface ICourseEnrollment extends Document {
  student: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  enrollmentType: 'notes' | 'live_sessions' | 'both';
  paymentAmount: number;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod?: string;
  transactionId?: string;
  enrolledAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  progress: {
    completedLessons: mongoose.Types.ObjectId[];
    completedAssignments: mongoose.Types.ObjectId[];
    totalProgress: number; // percentage
    lastAccessedAt?: Date;
  };
  accessPermissions: {
    canAccessNotes: boolean;
    canAccessLiveSessions: boolean;
    canDownloadMaterials: boolean;
    canSubmitAssignments: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const CourseEnrollmentSchema = new Schema<ICourseEnrollment>({
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
  enrollmentType: {
    type: String,
    enum: ['notes', 'live_sessions', 'both'],
    required: [true, 'Enrollment type is required']
  },
  paymentAmount: {
    type: Number,
    required: [true, 'Payment amount is required'],
    min: [0, 'Payment amount cannot be negative']
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'mobile_money', 'bank_transfer', 'cash'],
    default: 'mobile_money'
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true
  },
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: null // null means lifetime access
  },
  isActive: {
    type: Boolean,
    default: true
  },
  progress: {
    completedLessons: [{
      type: Schema.Types.ObjectId,
      ref: 'CourseNotes'
    }],
    completedAssignments: [{
      type: Schema.Types.ObjectId,
      ref: 'Assignment'
    }],
    totalProgress: {
      type: Number,
      default: 0,
      min: [0, 'Progress cannot be negative'],
      max: [100, 'Progress cannot exceed 100%']
    },
    lastAccessedAt: {
      type: Date,
      default: Date.now
    }
  },
  accessPermissions: {
    canAccessNotes: {
      type: Boolean,
      default: function(this: ICourseEnrollment) {
        return this.enrollmentType === 'notes' || this.enrollmentType === 'both';
      }
    },
    canAccessLiveSessions: {
      type: Boolean,
      default: function(this: ICourseEnrollment) {
        return this.enrollmentType === 'live_sessions' || this.enrollmentType === 'both';
      }
    },
    canDownloadMaterials: {
      type: Boolean,
      default: function(this: ICourseEnrollment) {
        return this.enrollmentType === 'notes' || this.enrollmentType === 'both';
      }
    },
    canSubmitAssignments: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
CourseEnrollmentSchema.index({ student: 1, course: 1 }, { unique: true });
CourseEnrollmentSchema.index({ student: 1 });
CourseEnrollmentSchema.index({ course: 1 });
CourseEnrollmentSchema.index({ paymentStatus: 1 });
CourseEnrollmentSchema.index({ enrolledAt: -1 });

// Virtual for checking if enrollment is expired
CourseEnrollmentSchema.virtual('isExpired').get(function() {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

// Virtual for days remaining
CourseEnrollmentSchema.virtual('daysRemaining').get(function() {
  if (!this.expiresAt) return null;
  const now = new Date();
  const diff = this.expiresAt.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to update access permissions
CourseEnrollmentSchema.pre('save', function(next) {
  // Update access permissions based on enrollment type and payment status
  if (this.paymentStatus === 'completed') {
    this.accessPermissions.canAccessNotes = this.enrollmentType === 'notes' || this.enrollmentType === 'both';
    this.accessPermissions.canAccessLiveSessions = this.enrollmentType === 'live_sessions' || this.enrollmentType === 'both';
    this.accessPermissions.canDownloadMaterials = this.enrollmentType === 'notes' || this.enrollmentType === 'both';
  } else {
    // Revoke access if payment is not completed
    this.accessPermissions.canAccessNotes = false;
    this.accessPermissions.canAccessLiveSessions = false;
    this.accessPermissions.canDownloadMaterials = false;
  }
  
  next();
});

// Static method to find enrollments by student
CourseEnrollmentSchema.statics.findByStudent = function(studentId: string) {
  return this.find({ student: studentId, isActive: true })
    .populate('course', 'title description instructor category level rating')
    .populate('course.instructor', 'firstName lastName')
    .sort({ enrolledAt: -1 });
};

// Static method to find enrollments by course
CourseEnrollmentSchema.statics.findByCourse = function(courseId: string) {
  return this.find({ course: courseId, isActive: true })
    .populate('student', 'firstName lastName email')
    .sort({ enrolledAt: -1 });
};

// Static method to check if student can access course content
CourseEnrollmentSchema.statics.checkAccess = async function(studentId: string, courseId: string, accessType: 'notes' | 'live_sessions') {
  const enrollment = await this.findOne({
    student: studentId,
    course: courseId,
    isActive: true,
    paymentStatus: 'completed'
  });

  if (!enrollment) return false;

  // Check if enrollment is expired
  if (enrollment.expiresAt && new Date() > enrollment.expiresAt) {
    return false;
  }

  // Check specific access permissions
  if (accessType === 'notes') {
    return enrollment.accessPermissions.canAccessNotes;
  } else if (accessType === 'live_sessions') {
    return enrollment.accessPermissions.canAccessLiveSessions;
  }

  return false;
};

// Instance method to update progress
CourseEnrollmentSchema.methods.updateProgress = function(completedItem: string, itemType: 'lesson' | 'assignment') {
  if (itemType === 'lesson' && !this.progress.completedLessons.includes(completedItem)) {
    this.progress.completedLessons.push(completedItem);
  } else if (itemType === 'assignment' && !this.progress.completedAssignments.includes(completedItem)) {
    this.progress.completedAssignments.push(completedItem);
  }

  this.progress.lastAccessedAt = new Date();
  return this.save();
};

export const CourseEnrollment = mongoose.model<ICourseEnrollment>('CourseEnrollment', CourseEnrollmentSchema);
export default CourseEnrollment;
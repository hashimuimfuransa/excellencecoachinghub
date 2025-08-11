import mongoose, { Schema, Document, Model } from 'mongoose';

// Video violation data interface
export interface IVideoViolation {
  type: 'face_not_detected' | 'multiple_faces' | 'looking_away' | 'suspicious_movement';
  confidence: number;
  timestamp: Date;
  description: string;
  severity: 'low' | 'medium' | 'high';
  resolved: boolean;
  resolvedBy?: mongoose.Types.ObjectId;
  resolvedAt?: Date;
  notes?: string;
}

// Video proctoring session document interface
export interface IVideoProctoringSessionDocument extends Document {
  examId: string;
  student: mongoose.Types.ObjectId;
  proctor?: mongoose.Types.ObjectId; // Admin monitoring the session
  startTime: Date;
  endTime?: Date;
  duration?: number; // in minutes
  status: 'active' | 'completed' | 'terminated' | 'failed';
  
  // 100ms integration
  hmsRoomId: string;
  hmsRecordingId?: string;
  recordingUrl?: string;
  recordingStatus: 'not_started' | 'recording' | 'completed' | 'failed';
  
  // AI monitoring data
  violations: IVideoViolation[];
  totalViolations: number;
  severityBreakdown: {
    low: number;
    medium: number;
    high: number;
  };
  
  // Technical data
  cameraEnabled: boolean;
  microphoneEnabled: boolean;
  screenRecordingEnabled: boolean;
  browserInfo?: {
    userAgent: string;
    platform: string;
    language: string;
  };
  
  // Consent and compliance
  consentGiven: boolean;
  consentTimestamp?: Date;
  privacyPolicyAccepted: boolean;
  
  // Session metadata
  sessionNotes?: string;
  flaggedForReview: boolean;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  reviewNotes?: string;
  
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  addViolation(violation: Omit<IVideoViolation, 'timestamp'>): Promise<IVideoProctoringSessionDocument>;
  resolveViolation(violationId: string, resolvedBy: string, notes?: string): Promise<IVideoProctoringSessionDocument>;
  startRecording(): Promise<IVideoProctoringSessionDocument>;
  stopRecording(recordingUrl?: string): Promise<IVideoProctoringSessionDocument>;
  endSession(): Promise<IVideoProctoringSessionDocument>;
  flagForReview(reason?: string): Promise<IVideoProctoringSessionDocument>;
  getViolationSummary(): {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    unresolved: number;
  };
}

// Static methods interface
export interface IVideoProctoringSessionModel extends Model<IVideoProctoringSessionDocument> {
  findActiveSession(studentId: string): Promise<IVideoProctoringSessionDocument | null>;
  findByExam(examId: string): Promise<IVideoProctoringSessionDocument[]>;
  findByProctor(proctorId: string): Promise<IVideoProctoringSessionDocument[]>;
  getViolationStats(dateRange?: { start: Date; end: Date }): Promise<any>;
}

// Video violation schema
const videoViolationSchema = new Schema<IVideoViolation>({
  type: {
    type: String,
    enum: ['face_not_detected', 'multiple_faces', 'looking_away', 'suspicious_movement'],
    required: true
  },
  confidence: {
    type: Number,
    required: true,
    min: [0, 'Confidence cannot be negative'],
    max: [1, 'Confidence cannot exceed 1']
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  resolved: {
    type: Boolean,
    default: false
  },
  resolvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  }
}, { _id: true });

// Video proctoring session schema
const videoProctoringSessionSchema = new Schema<IVideoProctoringSessionDocument>({
  examId: {
    type: String,
    required: [true, 'Exam ID is required'],
    trim: true
  },
  student: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student reference is required']
  },
  proctor: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date,
    default: null
  },
  duration: {
    type: Number,
    default: null,
    min: [0, 'Duration cannot be negative']
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'terminated', 'failed'],
    default: 'active'
  },
  
  // 100ms integration
  hmsRoomId: {
    type: String,
    required: [true, 'HMS Room ID is required']
  },
  hmsRecordingId: {
    type: String,
    default: null
  },
  recordingUrl: {
    type: String,
    default: null
  },
  recordingStatus: {
    type: String,
    enum: ['not_started', 'recording', 'completed', 'failed'],
    default: 'not_started'
  },
  
  // AI monitoring data
  violations: [videoViolationSchema],
  totalViolations: {
    type: Number,
    default: 0,
    min: [0, 'Total violations cannot be negative']
  },
  severityBreakdown: {
    low: {
      type: Number,
      default: 0,
      min: [0, 'Low severity count cannot be negative']
    },
    medium: {
      type: Number,
      default: 0,
      min: [0, 'Medium severity count cannot be negative']
    },
    high: {
      type: Number,
      default: 0,
      min: [0, 'High severity count cannot be negative']
    }
  },
  
  // Technical data
  cameraEnabled: {
    type: Boolean,
    default: false
  },
  microphoneEnabled: {
    type: Boolean,
    default: false
  },
  screenRecordingEnabled: {
    type: Boolean,
    default: false
  },
  browserInfo: {
    userAgent: {
      type: String,
      default: null
    },
    platform: {
      type: String,
      default: null
    },
    language: {
      type: String,
      default: null
    }
  },
  
  // Consent and compliance
  consentGiven: {
    type: Boolean,
    default: false
  },
  consentTimestamp: {
    type: Date,
    default: null
  },
  privacyPolicyAccepted: {
    type: Boolean,
    default: false
  },
  
  // Session metadata
  sessionNotes: {
    type: String,
    trim: true,
    maxlength: [2000, 'Session notes cannot exceed 2000 characters']
  },
  flaggedForReview: {
    type: Boolean,
    default: false
  },
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  reviewNotes: {
    type: String,
    trim: true,
    maxlength: [2000, 'Review notes cannot exceed 2000 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
videoProctoringSessionSchema.index({ examId: 1, student: 1 });
videoProctoringSessionSchema.index({ student: 1, status: 1 });
videoProctoringSessionSchema.index({ proctor: 1, status: 1 });
videoProctoringSessionSchema.index({ startTime: -1 });
videoProctoringSessionSchema.index({ flaggedForReview: 1 });

// Instance methods
videoProctoringSessionSchema.methods.addViolation = async function(
  violation: Omit<IVideoViolation, 'timestamp'>
): Promise<IVideoProctoringSessionDocument> {
  const newViolation: IVideoViolation = {
    ...violation,
    timestamp: new Date()
  };
  
  this.violations.push(newViolation);
  this.totalViolations += 1;
  this.severityBreakdown[violation.severity] += 1;
  
  // Auto-flag for review if high severity or too many violations
  if (violation.severity === 'high' || this.totalViolations >= 5) {
    this.flaggedForReview = true;
  }
  
  return await this.save();
};

videoProctoringSessionSchema.methods.resolveViolation = async function(
  violationId: string,
  resolvedBy: string,
  notes?: string
): Promise<IVideoProctoringSessionDocument> {
  const violation = this.violations.id(violationId);
  if (violation) {
    violation.resolved = true;
    violation.resolvedBy = new mongoose.Types.ObjectId(resolvedBy);
    violation.resolvedAt = new Date();
    if (notes) {
      violation.notes = notes;
    }
  }
  
  return await this.save();
};

videoProctoringSessionSchema.methods.startRecording = async function(): Promise<IVideoProctoringSessionDocument> {
  this.recordingStatus = 'recording';
  return await this.save();
};

videoProctoringSessionSchema.methods.stopRecording = async function(
  recordingUrl?: string
): Promise<IVideoProctoringSessionDocument> {
  this.recordingStatus = recordingUrl ? 'completed' : 'failed';
  if (recordingUrl) {
    this.recordingUrl = recordingUrl;
  }
  return await this.save();
};

videoProctoringSessionSchema.methods.endSession = async function(): Promise<IVideoProctoringSessionDocument> {
  this.endTime = new Date();
  this.duration = Math.round((this.endTime.getTime() - this.startTime.getTime()) / (1000 * 60));
  this.status = 'completed';
  return await this.save();
};

videoProctoringSessionSchema.methods.flagForReview = async function(
  reason?: string
): Promise<IVideoProctoringSessionDocument> {
  this.flaggedForReview = true;
  if (reason && this.sessionNotes) {
    this.sessionNotes += `\n[FLAGGED]: ${reason}`;
  } else if (reason) {
    this.sessionNotes = `[FLAGGED]: ${reason}`;
  }
  return await this.save();
};

videoProctoringSessionSchema.methods.getViolationSummary = function() {
  const byType: Record<string, number> = {};
  const bySeverity: Record<string, number> = { low: 0, medium: 0, high: 0 };
  let unresolved = 0;
  
  this.violations.forEach((violation: IVideoViolation) => {
    byType[violation.type] = (byType[violation.type] || 0) + 1;
    bySeverity[violation.severity] += 1;
    if (!violation.resolved) {
      unresolved += 1;
    }
  });
  
  return {
    total: this.totalViolations,
    byType,
    bySeverity,
    unresolved
  };
};

// Static methods
videoProctoringSessionSchema.statics.findActiveSession = async function(
  studentId: string
): Promise<IVideoProctoringSessionDocument | null> {
  return await this.findOne({ student: studentId, status: 'active' });
};

videoProctoringSessionSchema.statics.findByExam = async function(
  examId: string
): Promise<IVideoProctoringSessionDocument[]> {
  return await this.find({ examId }).populate('student proctor reviewedBy', 'firstName lastName email');
};

videoProctoringSessionSchema.statics.findByProctor = async function(
  proctorId: string
): Promise<IVideoProctoringSessionDocument[]> {
  return await this.find({ proctor: proctorId }).populate('student', 'firstName lastName email');
};

// Create and export the model
export const VideoProctoringSession = mongoose.model<IVideoProctoringSessionDocument, IVideoProctoringSessionModel>(
  'VideoProctoringSession',
  videoProctoringSessionSchema
);

export default VideoProctoringSession;

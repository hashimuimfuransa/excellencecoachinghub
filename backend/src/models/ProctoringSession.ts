import mongoose, { Schema, Document, Model } from 'mongoose';
import { ProctoringEventType } from '../../../shared/types';

// Proctoring event interface
export interface IProctoringEventDocument extends Document {
  type: ProctoringEventType;
  timestamp: Date;
  confidence: number;
  description: string;
  screenshot?: string;
  metadata?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  isResolved: boolean;
  resolvedBy?: mongoose.Types.ObjectId;
  resolvedAt?: Date;
  resolutionNotes?: string;
}

// Proctoring session document interface
export interface IProctoringSessionDocument extends Document {
  examAttempt: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  startTime: Date;
  endTime?: Date;
  events: IProctoringEventDocument[];
  videoRecording?: string;
  screenshots: string[];
  alertCount: number;
  suspiciousActivityScore: number;
  overallRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  isActive: boolean;
  adminNotified: boolean;
  finalReport?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  addEvent(event: Omit<IProctoringEventDocument, '_id'>): Promise<IProctoringSessionDocument>;
  addScreenshot(screenshotPath: string): Promise<IProctoringSessionDocument>;
  calculateRiskLevel(): 'low' | 'medium' | 'high' | 'critical';
  endSession(): Promise<IProctoringSessionDocument>;
  generateReport(): string;
}

// Proctoring session model interface
export interface IProctoringSessionModel extends Model<IProctoringSessionDocument> {
  findByStudent(studentId: string): Promise<IProctoringSessionDocument[]>;
  findByExamAttempt(examAttemptId: string): Promise<IProctoringSessionDocument | null>;
  findActiveSessions(): Promise<IProctoringSessionDocument[]>;
  findHighRiskSessions(): Promise<IProctoringSessionDocument[]>;
  findUnreviewedSessions(): Promise<IProctoringSessionDocument[]>;
}

// Proctoring event schema
const proctoringEventSchema = new Schema<IProctoringEventDocument>({
  type: {
    type: String,
    enum: Object.values(ProctoringEventType),
    required: [true, 'Event type is required']
  },
  timestamp: {
    type: Date,
    required: [true, 'Event timestamp is required'],
    default: Date.now
  },
  confidence: {
    type: Number,
    required: [true, 'Confidence level is required'],
    min: [0, 'Confidence cannot be negative'],
    max: [1, 'Confidence cannot exceed 1']
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  screenshot: {
    type: String,
    default: null
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: [true, 'Event severity is required'],
    default: 'medium'
  },
  isResolved: {
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
  resolutionNotes: {
    type: String,
    maxlength: [1000, 'Resolution notes cannot exceed 1000 characters']
  }
}, {
  timestamps: true
});

// Proctoring session schema
const proctoringSessionSchema = new Schema<IProctoringSessionDocument>({
  examAttempt: {
    type: Schema.Types.ObjectId,
    ref: 'ExamAttempt',
    required: [true, 'Exam attempt reference is required'],
    unique: true
  },
  student: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student reference is required']
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
  events: [proctoringEventSchema],
  videoRecording: {
    type: String,
    default: null
  },
  screenshots: [{
    type: String
  }],
  alertCount: {
    type: Number,
    default: 0,
    min: [0, 'Alert count cannot be negative']
  },
  suspiciousActivityScore: {
    type: Number,
    default: 0,
    min: [0, 'Suspicious activity score cannot be negative'],
    max: [100, 'Suspicious activity score cannot exceed 100']
  },
  overallRiskLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  adminNotified: {
    type: Boolean,
    default: false
  },
  finalReport: {
    type: String,
    maxlength: [5000, 'Final report cannot exceed 5000 characters']
  },
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance (examAttempt index is already created by unique: true in schema)
proctoringSessionSchema.index({ student: 1 });
proctoringSessionSchema.index({ isActive: 1 });
proctoringSessionSchema.index({ overallRiskLevel: 1 });
proctoringSessionSchema.index({ startTime: -1 });
proctoringSessionSchema.index({ alertCount: -1 });
proctoringSessionSchema.index({ suspiciousActivityScore: -1 });

// Virtual for session duration
proctoringSessionSchema.virtual('duration').get(function(this: IProctoringSessionDocument) {
  if (this.endTime && this.startTime) {
    return Math.round((this.endTime.getTime() - this.startTime.getTime()) / (1000 * 60));
  }
  return 0;
});

// Virtual for high severity events count
proctoringSessionSchema.virtual('highSeverityEventsCount').get(function(this: IProctoringSessionDocument) {
  return this.events.filter(event => event.severity === 'high' || event.severity === 'critical').length;
});

// Pre-save middleware to update risk level and alert count
proctoringSessionSchema.pre<IProctoringSessionDocument>('save', function(next) {
  this.alertCount = this.events.length;
  this.overallRiskLevel = this.calculateRiskLevel();
  
  // Calculate suspicious activity score based on events
  let score = 0;
  this.events.forEach(event => {
    switch (event.severity) {
      case 'low': score += 5; break;
      case 'medium': score += 15; break;
      case 'high': score += 30; break;
      case 'critical': score += 50; break;
    }
  });
  this.suspiciousActivityScore = Math.min(score, 100);
  
  next();
});

// Instance method to add event
proctoringSessionSchema.methods.addEvent = async function(
  event: Omit<IProctoringEventDocument, '_id'>
): Promise<IProctoringSessionDocument> {
  this.events.push(event as IProctoringEventDocument);
  return this.save();
};

// Instance method to add screenshot
proctoringSessionSchema.methods.addScreenshot = async function(
  screenshotPath: string
): Promise<IProctoringSessionDocument> {
  this.screenshots.push(screenshotPath);
  return this.save();
};

// Instance method to calculate risk level
proctoringSessionSchema.methods.calculateRiskLevel = function(): 'low' | 'medium' | 'high' | 'critical' {
  const criticalEvents = this.events.filter(e => e.severity === 'critical').length;
  const highEvents = this.events.filter(e => e.severity === 'high').length;
  const mediumEvents = this.events.filter(e => e.severity === 'medium').length;
  
  if (criticalEvents > 0 || this.suspiciousActivityScore >= 80) return 'critical';
  if (highEvents >= 3 || this.suspiciousActivityScore >= 60) return 'high';
  if (highEvents >= 1 || mediumEvents >= 5 || this.suspiciousActivityScore >= 30) return 'medium';
  return 'low';
};

// Instance method to end session
proctoringSessionSchema.methods.endSession = async function(): Promise<IProctoringSessionDocument> {
  this.endTime = new Date();
  this.isActive = false;
  this.finalReport = this.generateReport();
  return this.save();
};

// Instance method to generate report
proctoringSessionSchema.methods.generateReport = function(): string {
  const duration = this.duration;
  const eventsSummary = this.events.reduce((acc, event) => {
    acc[event.type] = (acc[event.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  let report = `Proctoring Session Report\n`;
  report += `Duration: ${duration} minutes\n`;
  report += `Total Events: ${this.events.length}\n`;
  report += `Risk Level: ${this.overallRiskLevel.toUpperCase()}\n`;
  report += `Suspicious Activity Score: ${this.suspiciousActivityScore}/100\n\n`;
  
  report += `Event Summary:\n`;
  Object.entries(eventsSummary).forEach(([type, count]) => {
    report += `- ${type.replace(/_/g, ' ')}: ${count}\n`;
  });
  
  return report;
};

// Static method to find sessions by student
proctoringSessionSchema.statics.findByStudent = function(studentId: string): Promise<IProctoringSessionDocument[]> {
  return this.find({ student: studentId })
    .populate('examAttempt')
    .sort({ startTime: -1 });
};

// Static method to find session by exam attempt
proctoringSessionSchema.statics.findByExamAttempt = function(
  examAttemptId: string
): Promise<IProctoringSessionDocument | null> {
  return this.findOne({ examAttempt: examAttemptId })
    .populate('student', 'firstName lastName email');
};

// Static method to find active sessions
proctoringSessionSchema.statics.findActiveSessions = function(): Promise<IProctoringSessionDocument[]> {
  return this.find({ isActive: true })
    .populate('student', 'firstName lastName email')
    .populate('examAttempt')
    .sort({ startTime: -1 });
};

// Static method to find high risk sessions
proctoringSessionSchema.statics.findHighRiskSessions = function(): Promise<IProctoringSessionDocument[]> {
  return this.find({ overallRiskLevel: { $in: ['high', 'critical'] } })
    .populate('student', 'firstName lastName email')
    .populate('examAttempt')
    .sort({ suspiciousActivityScore: -1 });
};

// Static method to find unreviewed sessions
proctoringSessionSchema.statics.findUnreviewedSessions = function(): Promise<IProctoringSessionDocument[]> {
  return this.find({ 
    isActive: false,
    reviewedBy: null,
    overallRiskLevel: { $in: ['medium', 'high', 'critical'] }
  })
    .populate('student', 'firstName lastName email')
    .populate('examAttempt')
    .sort({ endTime: 1 });
};

// Create and export the model
export const ProctoringSession = mongoose.model<IProctoringSessionDocument, IProctoringSessionModel>(
  'ProctoringSession', 
  proctoringSessionSchema
);

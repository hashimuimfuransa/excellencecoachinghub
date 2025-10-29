import mongoose, { Document, Schema } from 'mongoose';

export interface ICertificate extends Document {
  studentId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  assessmentId?: mongoose.Types.ObjectId | null;
  
  // Certificate details
  certificateNumber: string;
  issueDate: Date;
  expiryDate?: Date;
  grade: string; // A, B, C, D, F or Pass/Fail
  score: number; // Percentage score
  totalPoints: number;
  earnedPoints: number;
  
  // Course completion details
  completionDate: Date;
  sessionsAttended: number;
  totalSessions: number;
  assessmentsCompleted: number;
  totalAssessments: number;
  
  // Certificate status
  status: 'pending' | 'issued' | 'expired' | 'revoked';
  isVerified: boolean;
  verificationCode: string;
  
  // PDF generation
  pdfUrl?: string;
  pdfGeneratedAt?: Date;
  
  // Metadata
  issuedBy: mongoose.Types.ObjectId;
  notes?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const certificateSchema = new Schema<ICertificate>({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  courseId: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  teacherId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  assessmentId: {
    type: Schema.Types.ObjectId,
    ref: 'Assessment',
    default: null,
    index: true
  },
  
  // Certificate details
  certificateNumber: {
    type: String,
    required: true,
    unique: true
  },
  issueDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  expiryDate: Date,
  grade: {
    type: String,
    required: true,
    enum: ['A', 'B', 'C', 'D', 'F', 'Pass', 'Fail']
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  totalPoints: {
    type: Number,
    required: true,
    min: 0
  },
  earnedPoints: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Course completion details
  completionDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  sessionsAttended: {
    type: Number,
    required: true,
    min: 0
  },
  totalSessions: {
    type: Number,
    required: true,
    min: 0
  },
  assessmentsCompleted: {
    type: Number,
    required: true,
    min: 0
  },
  totalAssessments: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Certificate status
  status: {
    type: String,
    enum: ['pending', 'issued', 'expired', 'revoked'],
    default: 'pending'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationCode: {
    type: String,
    required: true,
    unique: true
  },
  
  // PDF generation
  pdfUrl: String,
  pdfGeneratedAt: Date,
  
  // Metadata
  issuedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: String
}, {
  timestamps: true
});

// Generate certificate number
certificateSchema.pre('save', async function(next) {
  if (this.isNew && !this.certificateNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Certificate').countDocuments({
      issueDate: {
        $gte: new Date(year, 0, 1),
        $lt: new Date(year + 1, 0, 1)
      }
    });
    this.certificateNumber = `CERT-${year}-${String(count + 1).padStart(6, '0')}`;
  }
  
  if (this.isNew && !this.verificationCode) {
    this.verificationCode = `VERIFY-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
  
  next();
});

// Indexes for efficient queries
certificateSchema.index({ studentId: 1, courseId: 1 }, { unique: true });
certificateSchema.index({ status: 1 });
certificateSchema.index({ issueDate: -1 });

// Virtual for certificate validity
certificateSchema.virtual('isValid').get(function() {
  if (this.status === 'revoked') return false;
  if (this.expiryDate && new Date() > this.expiryDate) return false;
  return this.status === 'issued';
});

// Virtual for completion percentage
certificateSchema.virtual('completionPercentage').get(function() {
  const sessionPercentage = this.totalSessions > 0 ? (this.sessionsAttended / this.totalSessions) * 100 : 0;
  const assessmentPercentage = this.totalAssessments > 0 ? (this.assessmentsCompleted / this.totalAssessments) * 100 : 0;
  return Math.round((sessionPercentage + assessmentPercentage) / 2);
});

export default mongoose.model<ICertificate>('Certificate', certificateSchema);

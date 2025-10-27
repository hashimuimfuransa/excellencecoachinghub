import mongoose, { Schema, Document, Model } from 'mongoose';
import { CertificateType } from '../types';

export interface IJobCertificateDocument extends Document {
  user: string;
  type: CertificateType;
  title: string;
  description: string;
  skills: string[];
  issuedBy: string;
  issuedAt: Date;
  expiresAt?: Date;
  verificationCode: string;
  isVerified: boolean;
  relatedJob?: string;
  relatedCourse?: string;
  psychometricTestResults?: string[];
  interviewResults?: string[];
}

export interface IJobCertificateModel extends Model<IJobCertificateDocument> {
  findByUser(userId: string): Promise<IJobCertificateDocument[]>;
  findByType(type: CertificateType): Promise<IJobCertificateDocument[]>;
  findByVerificationCode(code: string): Promise<IJobCertificateDocument | null>;
  findValidCertificates(): Promise<IJobCertificateDocument[]>;
  generateVerificationCode(): string;
}

const jobCertificateSchema = new Schema<IJobCertificateDocument>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  type: {
    type: String,
    enum: CertificateType ? Object.values(CertificateType) : ['course_completion', 'skill_assessment', 'job_preparation', 'interview_excellence', 'psychometric_achievement'],
    required: [true, 'Certificate type is required']
  },
  title: {
    type: String,
    required: [true, 'Certificate title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Certificate description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  skills: [{
    type: String,
    trim: true,
    maxlength: [100, 'Skill name cannot exceed 100 characters']
  }],
  issuedBy: {
    type: String,
    required: [true, 'Issuer is required'],
    trim: true,
    maxlength: [200, 'Issuer name cannot exceed 200 characters']
  },
  issuedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    validate: {
      validator: function(this: IJobCertificateDocument, value: Date) {
        return !value || value > this.issuedAt;
      },
      message: 'Expiration date must be after issue date'
    }
  },
  verificationCode: {
    type: String,
    required: [true, 'Verification code is required'],
    unique: true,
    trim: true,
    maxlength: [50, 'Verification code cannot exceed 50 characters']
  },
  isVerified: {
    type: Boolean,
    default: true
  },
  relatedJob: {
    type: Schema.Types.ObjectId,
    ref: 'Job'
  },
  relatedCourse: {
    type: Schema.Types.ObjectId,
    ref: 'Course'
  },
  psychometricTestResults: [{
    type: Schema.Types.ObjectId,
    ref: 'PsychometricTestResult'
  }],
  interviewResults: [{
    type: Schema.Types.ObjectId,
    ref: 'AIInterview'
  }]
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
jobCertificateSchema.index({ user: 1 });
jobCertificateSchema.index({ type: 1 });
jobCertificateSchema.index({ verificationCode: 1 });
jobCertificateSchema.index({ issuedAt: -1 });
jobCertificateSchema.index({ expiresAt: 1 });
jobCertificateSchema.index({ isVerified: 1 });

// Compound indexes
jobCertificateSchema.index({ user: 1, type: 1 });
jobCertificateSchema.index({ user: 1, isVerified: 1 });

// Virtual for checking if certificate is expired
jobCertificateSchema.virtual('isExpired').get(function(this: IJobCertificateDocument) {
  return this.expiresAt && this.expiresAt < new Date();
});

// Virtual for checking if certificate is valid
jobCertificateSchema.virtual('isValid').get(function(this: IJobCertificateDocument) {
  return this.isVerified && (!this.expiresAt || this.expiresAt > new Date());
});

// Pre-save middleware to generate verification code if not provided
jobCertificateSchema.pre<IJobCertificateDocument>('save', function(next) {
  if (!this.verificationCode) {
    this.verificationCode = JobCertificate.generateVerificationCode();
  }
  next();
});

// Static methods
jobCertificateSchema.statics.findByUser = function(userId: string): Promise<IJobCertificateDocument[]> {
  return this.find({ user: userId })
    .populate('relatedJob', 'title company')
    .populate('relatedCourse', 'title description')
    .populate('psychometricTestResults')
    .populate('interviewResults')
    .sort({ issuedAt: -1 });
};

jobCertificateSchema.statics.findByType = function(type: CertificateType): Promise<IJobCertificateDocument[]> {
  return this.find({ type })
    .populate('user', 'firstName lastName email')
    .populate('relatedJob', 'title company')
    .populate('relatedCourse', 'title description')
    .sort({ issuedAt: -1 });
};

jobCertificateSchema.statics.findByVerificationCode = function(code: string): Promise<IJobCertificateDocument | null> {
  return this.findOne({ verificationCode: code })
    .populate('user', 'firstName lastName email')
    .populate('relatedJob', 'title company')
    .populate('relatedCourse', 'title description')
    .populate('psychometricTestResults')
    .populate('interviewResults');
};

jobCertificateSchema.statics.findValidCertificates = function(): Promise<IJobCertificateDocument[]> {
  return this.find({
    isVerified: true,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ]
  })
    .populate('user', 'firstName lastName email')
    .populate('relatedJob', 'title company')
    .populate('relatedCourse', 'title description')
    .sort({ issuedAt: -1 });
};

jobCertificateSchema.statics.generateVerificationCode = function(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'CERT-';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
    if (i === 3 || i === 7) result += '-';
  }
  return result;
};

export const JobCertificate = mongoose.model<IJobCertificateDocument, IJobCertificateModel>('JobCertificate', jobCertificateSchema);
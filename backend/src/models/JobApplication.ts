import mongoose, { Schema, Document, Model } from 'mongoose';
import { ApplicationStatus } from '../types';

export interface IJobApplicationDocument extends Document {
  job: string;
  applicant: string;
  resume: string;
  coverLetter?: string;
  status: ApplicationStatus;
  appliedAt: Date;
  psychometricTestResults: string[];
  interviewResults: string[];
  certificates: string[];
  notes?: string;
  updatedAt: Date;
}

export interface IJobApplicationModel extends Model<IJobApplicationDocument> {
  findByJob(jobId: string): Promise<IJobApplicationDocument[]>;
  findByApplicant(applicantId: string): Promise<IJobApplicationDocument[]>;
  findByEmployer(employerId: string): Promise<IJobApplicationDocument[]>;
  findQualifiedApplicants(jobId: string): Promise<IJobApplicationDocument[]>;
}

const jobApplicationSchema = new Schema<IJobApplicationDocument>({
  job: {
    type: Schema.Types.ObjectId,
    ref: 'Job',
    required: [true, 'Job is required']
  },
  applicant: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Applicant is required']
  },
  resume: {
    type: String,
    required: [true, 'Resume is required'],
    trim: true
  },
  coverLetter: {
    type: String,
    trim: true,
    maxlength: [2000, 'Cover letter cannot exceed 2000 characters']
  },
  status: {
    type: String,
    enum: ApplicationStatus ? Object.values(ApplicationStatus) : ['applied', 'under_review', 'shortlisted', 'interview_scheduled', 'interviewed', 'offered', 'rejected', 'withdrawn'],
    default: ApplicationStatus.APPLIED
  },
  appliedAt: {
    type: Date,
    default: Date.now
  },
  psychometricTestResults: [{
    type: Schema.Types.ObjectId,
    ref: 'PsychometricTestResult'
  }],
  interviewResults: [{
    type: Schema.Types.ObjectId,
    ref: 'AIInterview'
  }],
  certificates: [{
    type: Schema.Types.ObjectId,
    ref: 'JobCertificate'
  }],
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  }
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
jobApplicationSchema.index({ job: 1 });
jobApplicationSchema.index({ applicant: 1 });
jobApplicationSchema.index({ status: 1 });
jobApplicationSchema.index({ appliedAt: -1 });

// Compound indexes
jobApplicationSchema.index({ job: 1, status: 1 });
jobApplicationSchema.index({ applicant: 1, status: 1 });

// Unique constraint to prevent duplicate applications
jobApplicationSchema.index({ job: 1, applicant: 1 }, { unique: true });

// Static methods
jobApplicationSchema.statics.findByJob = function(jobId: string): Promise<IJobApplicationDocument[]> {
  return this.find({ job: jobId })
    .populate('applicant', 'firstName lastName email avatar')
    .populate('psychometricTestResults')
    .populate('interviewResults')
    .populate('certificates')
    .sort({ appliedAt: -1 });
};

jobApplicationSchema.statics.findByApplicant = function(applicantId: string): Promise<IJobApplicationDocument[]> {
  return this.find({ applicant: applicantId })
    .populate('job', 'title company location status')
    .populate('psychometricTestResults')
    .populate('interviewResults')
    .populate('certificates')
    .sort({ appliedAt: -1 });
};

jobApplicationSchema.statics.findByEmployer = function(employerId: string): Promise<IJobApplicationDocument[]> {
  return this.find()
    .populate({
      path: 'job',
      match: { employer: employerId },
      select: 'title company location status'
    })
    .populate('applicant', 'firstName lastName email avatar')
    .populate('psychometricTestResults')
    .populate('interviewResults')
    .populate('certificates')
    .then((applications: IJobApplicationDocument[]) => 
      applications.filter(app => app.job) // Filter out applications where job doesn't match employer
    );
};

jobApplicationSchema.statics.findQualifiedApplicants = function(jobId: string): Promise<IJobApplicationDocument[]> {
  return this.find({ 
    job: jobId,
    $and: [
      { psychometricTestResults: { $exists: true, $not: { $size: 0 } } },
      { interviewResults: { $exists: true, $not: { $size: 0 } } }
    ]
  })
    .populate('applicant', 'firstName lastName email avatar')
    .populate('psychometricTestResults')
    .populate('interviewResults')
    .populate('certificates')
    .sort({ appliedAt: -1 });
};

export const JobApplication = mongoose.model<IJobApplicationDocument, IJobApplicationModel>('JobApplication', jobApplicationSchema);
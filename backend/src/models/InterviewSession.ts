import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IInterviewSessionDocument extends Document {
  application: string;
  scheduledDate: Date;
  interviewType: 'phone' | 'video' | 'in_person';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  feedback?: string;
  rating?: number;
  duration?: number;
  meetingUrl?: string;
  interviewerNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInterviewSessionModel extends Model<IInterviewSessionDocument> {
  findByApplication(applicationId: string): Promise<IInterviewSessionDocument[]>;
  findUpcoming(): Promise<IInterviewSessionDocument[]>;
}

const interviewSessionSchema = new Schema<IInterviewSessionDocument>({
  application: {
    type: Schema.Types.ObjectId,
    ref: 'JobApplication',
    required: [true, 'Application is required']
  },
  scheduledDate: {
    type: Date,
    required: [true, 'Scheduled date is required']
  },
  interviewType: {
    type: String,
    enum: ['phone', 'video', 'in_person'],
    required: [true, 'Interview type is required']
  },
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'no_show'],
    default: 'scheduled'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [2000, 'Notes cannot exceed 2000 characters']
  },
  feedback: {
    type: String,
    trim: true,
    maxlength: [5000, 'Feedback cannot exceed 5000 characters']
  },
  rating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [10, 'Rating cannot exceed 10']
  },
  duration: {
    type: Number,
    min: [0, 'Duration cannot be negative']
  },
  meetingUrl: {
    type: String,
    trim: true
  },
  interviewerNotes: {
    type: String,
    trim: true,
    maxlength: [3000, 'Interviewer notes cannot exceed 3000 characters']
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

// Indexes
interviewSessionSchema.index({ application: 1 });
interviewSessionSchema.index({ scheduledDate: 1 });
interviewSessionSchema.index({ status: 1 });
interviewSessionSchema.index({ interviewType: 1 });

// Static methods
interviewSessionSchema.statics.findByApplication = function(applicationId: string): Promise<IInterviewSessionDocument[]> {
  return this.find({ application: applicationId })
    .sort({ scheduledDate: -1 });
};

interviewSessionSchema.statics.findUpcoming = function(): Promise<IInterviewSessionDocument[]> {
  return this.find({
    scheduledDate: { $gte: new Date() },
    status: { $in: ['scheduled', 'in_progress'] }
  })
    .populate('application')
    .sort({ scheduledDate: 1 });
};

export const InterviewSession = mongoose.model<IInterviewSessionDocument, IInterviewSessionModel>('InterviewSession', interviewSessionSchema);
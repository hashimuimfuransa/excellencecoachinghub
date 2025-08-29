import mongoose, { Document, Schema } from 'mongoose';

export interface ICVDraft extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  cvData: {
    personalInfo: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      location: string;
      linkedIn?: string;
      website?: string;
      professionalSummary: string;
    };
    experiences: Array<{
      id: string;
      jobTitle: string;
      company: string;
      location: string;
      startDate: string;
      endDate?: string;
      isCurrentJob: boolean;
      responsibilities: string[];
      achievements: string[];
    }>;
    education: Array<{
      id: string;
      degree: string;
      institution: string;
      location: string;
      graduationDate: string;
      gpa?: string;
      relevantCourses?: string[];
    }>;
    skills: Array<{
      id: string;
      name: string;
      level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
      category: 'Technical' | 'Soft' | 'Language' | 'Other';
    }>;
    projects?: any[];
    certifications?: any[];
    awards?: any[];
    languages?: any[];
    customSections?: any[];
  };
  templateId?: string;
  lastModified: Date;
  isPublic: boolean;
  viewCount: number;
  downloadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const CVDraftSchema = new Schema<ICVDraft>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  cvData: {
    personalInfo: {
      firstName: { type: String, required: true, trim: true },
      lastName: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true, lowercase: true },
      phone: { type: String, trim: true },
      location: { type: String, trim: true },
      linkedIn: { type: String, trim: true },
      website: { type: String, trim: true },
      professionalSummary: { type: String, trim: true },
    },
    experiences: [{
      id: { type: String, required: true },
      jobTitle: { type: String, required: true, trim: true },
      company: { type: String, required: true, trim: true },
      location: { type: String, trim: true },
      startDate: { type: String, required: true },
      endDate: { type: String },
      isCurrentJob: { type: Boolean, default: false },
      responsibilities: [{ type: String, trim: true }],
      achievements: [{ type: String, trim: true }],
    }],
    education: [{
      id: { type: String, required: true },
      degree: { type: String, required: true, trim: true },
      institution: { type: String, required: true, trim: true },
      location: { type: String, trim: true },
      graduationDate: { type: String, required: true },
      gpa: { type: String, trim: true },
      relevantCourses: [{ type: String, trim: true }],
    }],
    skills: [{
      id: { type: String, required: true },
      name: { type: String, required: true, trim: true },
      level: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
        default: 'Intermediate',
      },
      category: {
        type: String,
        enum: ['Technical', 'Soft', 'Language', 'Other'],
        default: 'Technical',
      },
    }],
    projects: [Schema.Types.Mixed],
    certifications: [Schema.Types.Mixed],
    awards: [Schema.Types.Mixed],
    languages: [Schema.Types.Mixed],
    customSections: [Schema.Types.Mixed],
  },
  templateId: {
    type: String,
    trim: true,
  },
  lastModified: {
    type: Date,
    default: Date.now,
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
  viewCount: {
    type: Number,
    default: 0,
  },
  downloadCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Indexes for better performance
CVDraftSchema.index({ userId: 1, lastModified: -1 });
CVDraftSchema.index({ isPublic: 1 });

// Instance methods
CVDraftSchema.methods.incrementView = function() {
  this.viewCount += 1;
  return this.save();
};

CVDraftSchema.methods.incrementDownload = function() {
  this.downloadCount += 1;
  return this.save();
};

// Static methods
CVDraftSchema.statics.findByUserId = function(userId: string) {
  return this.find({ userId }).sort({ lastModified: -1 });
};

CVDraftSchema.statics.findPublicCVs = function(limit = 10, skip = 0) {
  return this.find({ isPublic: true })
    .populate('userId', 'firstName lastName')
    .sort({ lastModified: -1 })
    .limit(limit)
    .skip(skip);
};

// Pre-save middleware
CVDraftSchema.pre('save', function(next) {
  if (this.isModified('cvData')) {
    this.lastModified = new Date();
  }
  next();
});

// Virtual for full name
CVDraftSchema.virtual('fullName').get(function() {
  return `${this.cvData.personalInfo.firstName} ${this.cvData.personalInfo.lastName}`;
});

// Transform output
CVDraftSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  },
});

export const CVDraft = mongoose.model<ICVDraft>('CVDraft', CVDraftSchema);
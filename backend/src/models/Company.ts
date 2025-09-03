import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICompanyDocument extends Document {
  name: string;
  description?: string;
  industry: string;
  website?: string;
  logo?: string;
  coverImage?: string;
  location: string;
  size: string; // '1-10', '11-50', '51-200', '201-500', '501-1000', '1001+'
  founded?: number;
  employees: string[]; // Array of User IDs
  followers: string[]; // Array of User IDs who follow this company
  followersCount: number;
  jobsCount: number;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    website?: string;
  };
  isVerified: boolean;
  
  // Company Profile Approval System
  approvalStatus: 'pending' | 'approved' | 'rejected';
  submittedBy?: string; // User ID of who submitted the profile
  submittedAt?: Date;
  reviewedBy?: string; // User ID of super admin who reviewed
  reviewedAt?: Date;
  rejectionReason?: string;
  approvalNotes?: string;
  documents?: Array<{
    type: string;
    url: string;
    name: string;
    uploadedAt: Date;
  }>;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface ICompanyModel extends Model<ICompanyDocument> {
  findSuggestions(userId: string, limit?: number): Promise<ICompanyDocument[]>;
  findByIndustry(industry: string): Promise<ICompanyDocument[]>;
}

const companySchema = new Schema<ICompanyDocument>({
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [200, 'Company name cannot exceed 200 characters'],
    unique: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Company description cannot exceed 2000 characters']
  },
  industry: {
    type: String,
    required: [true, 'Industry is required'],
    trim: true,
    maxlength: [100, 'Industry cannot exceed 100 characters']
  },
  website: {
    type: String,
    trim: true,
    maxlength: [300, 'Website URL cannot exceed 300 characters']
  },
  logo: {
    type: String,
    trim: true
  },
  coverImage: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    required: [true, 'Company location is required'],
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  size: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001+'],
    required: [true, 'Company size is required']
  },
  founded: {
    type: Number,
    min: 1800,
    max: new Date().getFullYear()
  },
  employees: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  followers: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  followersCount: {
    type: Number,
    default: 0,
    min: 0
  },
  jobsCount: {
    type: Number,
    default: 0,
    min: 0
  },
  socialLinks: {
    linkedin: { type: String, trim: true },
    twitter: { type: String, trim: true },
    facebook: { type: String, trim: true },
    website: { type: String, trim: true }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  
  // Company Profile Approval System
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  submittedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  rejectionReason: {
    type: String,
    trim: true,
    maxlength: [1000, 'Rejection reason cannot exceed 1000 characters']
  },
  approvalNotes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Approval notes cannot exceed 1000 characters']
  },
  documents: [{
    type: {
      type: String,
      required: true,
      trim: true
    },
    url: {
      type: String,
      required: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
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
companySchema.index({ name: 1 });
companySchema.index({ industry: 1 });
companySchema.index({ location: 1 });
companySchema.index({ followersCount: -1 });
companySchema.index({ isVerified: 1, followersCount: -1 });
companySchema.index({ approvalStatus: 1 });
companySchema.index({ submittedAt: -1 });
companySchema.index({ submittedBy: 1 });

// Text search index
companySchema.index({ 
  name: 'text', 
  description: 'text', 
  industry: 'text' 
}, {
  weights: {
    name: 10,
    industry: 5,
    description: 1
  }
});

// Static methods
companySchema.statics.findSuggestions = function(userId: string, limit = 10): Promise<ICompanyDocument[]> {
  return this.find({
    followers: { $ne: userId },
    isVerified: true
  })
  .sort({ followersCount: -1, jobsCount: -1 })
  .limit(limit);
};

companySchema.statics.findByIndustry = function(industry: string): Promise<ICompanyDocument[]> {
  return this.find({ industry })
    .sort({ followersCount: -1 })
    .limit(20);
};

export const Company = mongoose.model<ICompanyDocument, ICompanyModel>('Company', companySchema);
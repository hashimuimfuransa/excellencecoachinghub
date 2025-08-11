import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITeacherProfileDocument extends Document {
  userId: mongoose.Types.ObjectId;
  // Personal Information
  phone?: string;
  dateOfBirth?: Date;
  profilePicture?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
  
  // Professional Information
  specialization: string[];
  bio?: string;
  experience: number; // years of experience
  education: {
    degree: string;
    institution: string;
    year: number;
    field?: string;
  }[];
  
  // Certifications and Skills
  certifications: {
    name: string;
    issuer: string;
    issueDate: Date;
    expiryDate?: Date;
    credentialId?: string;
  }[];
  skills: string[];
  languages: string[];
  
  // Teaching Information
  teachingAreas: string[];
  preferredLevels: ('Beginner' | 'Intermediate' | 'Advanced')[];
  hourlyRate?: number;
  availability?: {
    timezone: string;
    schedule: {
      day: string;
      startTime: string;
      endTime: string;
    }[];
  };
  
  // Documents and Verification
  documents: {
    type: 'resume' | 'certificate' | 'id' | 'degree' | 'other';
    filename: string;
    originalName: string;
    url: string;
    uploadedAt: Date;
  }[];
  
  // Social Links
  socialLinks?: {
    linkedin?: string;
    github?: string;
    portfolio?: string;
    website?: string;
  };
  
  // Profile Status
  profileStatus: 'incomplete' | 'pending' | 'approved' | 'rejected';
  submittedAt?: Date;
  reviewedAt?: Date;
  reviewedBy?: mongoose.Types.ObjectId;
  adminFeedback?: string;
  rejectionReason?: string;
  
  // Statistics (calculated fields)
  totalStudents: number;
  activeCourses: number;
  totalCourses: number;
  averageRating: number;
  totalEarnings: number;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface ITeacherProfileModel extends Model<ITeacherProfileDocument> {
  findByUserId(userId: string): Promise<ITeacherProfileDocument | null>;
  findPendingProfiles(): Promise<ITeacherProfileDocument[]>;
  findApprovedProfiles(): Promise<ITeacherProfileDocument[]>;
}

const teacherProfileSchema = new Schema<ITeacherProfileDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Personal Information
  phone: {
    type: String,
    trim: true,
    match: [/^\+?[\d\s\-\(\)]+$/, 'Please provide a valid phone number']
  },
  dateOfBirth: {
    type: Date
  },
  profilePicture: {
    type: String,
    trim: true
  },
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true },
    zipCode: { type: String, trim: true }
  },
  
  // Professional Information
  specialization: [{
    type: String,
    trim: true
  }],
  bio: {
    type: String,
    maxlength: [2000, 'Bio cannot exceed 2000 characters'],
    trim: true
  },
  experience: {
    type: Number,
    default: 0,
    min: [0, 'Experience cannot be negative']
  },
  education: [{
    degree: {
      type: String,
      trim: true
    },
    institution: {
      type: String,
      trim: true
    },
    year: {
      type: Number,
      min: 1950,
      max: new Date().getFullYear() + 10
    },
    field: {
      type: String,
      trim: true
    }
  }],
  
  // Certifications and Skills
  certifications: [{
    name: {
      type: String,
      trim: true
    },
    issuer: {
      type: String,
      trim: true
    },
    issueDate: {
      type: Date
    },
    expiryDate: Date,
    credentialId: {
      type: String,
      trim: true
    }
  }],
  skills: [{
    type: String,
    trim: true
  }],
  languages: [{
    type: String,
    trim: true
  }],
  
  // Teaching Information
  teachingAreas: [{
    type: String,
    trim: true
  }],
  preferredLevels: [{
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced']
  }],
  hourlyRate: {
    type: Number,
    min: [0, 'Hourly rate cannot be negative']
  },
  availability: {
    timezone: {
      type: String,
      default: 'UTC'
    },
    schedule: [{
      day: {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
      },
      startTime: String,
      endTime: String
    }]
  },
  
  // Documents
  documents: [{
    type: {
      type: String,
      enum: ['resume', 'certificate', 'id', 'degree', 'other'],
      required: true
    },
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Social Links
  socialLinks: {
    linkedin: {
      type: String,
      match: [/^https?:\/\/(www\.)?linkedin\.com\/.*/, 'Please provide a valid LinkedIn URL']
    },
    github: {
      type: String,
      match: [/^https?:\/\/(www\.)?github\.com\/.*/, 'Please provide a valid GitHub URL']
    },
    portfolio: {
      type: String,
      match: [/^https?:\/\/.*/, 'Please provide a valid URL']
    },
    website: {
      type: String,
      match: [/^https?:\/\/.*/, 'Please provide a valid URL']
    }
  },
  
  // Profile Status
  profileStatus: {
    type: String,
    enum: ['incomplete', 'pending', 'approved', 'rejected'],
    default: 'incomplete'
  },
  submittedAt: Date,
  reviewedAt: Date,
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  adminFeedback: {
    type: String,
    maxlength: [1000, 'Admin feedback cannot exceed 1000 characters']
  },
  rejectionReason: {
    type: String,
    maxlength: [500, 'Rejection reason cannot exceed 500 characters']
  },
  
  // Statistics
  totalStudents: {
    type: Number,
    default: 0
  },
  activeCourses: {
    type: Number,
    default: 0
  },
  totalCourses: {
    type: Number,
    default: 0
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalEarnings: {
    type: Number,
    default: 0
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

// Indexes (userId index is already created by unique: true in schema)
teacherProfileSchema.index({ profileStatus: 1 });
teacherProfileSchema.index({ specialization: 1 });
teacherProfileSchema.index({ teachingAreas: 1 });
teacherProfileSchema.index({ submittedAt: -1 });
teacherProfileSchema.index({ reviewedAt: -1 });

// Static methods
teacherProfileSchema.statics.findByUserId = function(userId: string): Promise<ITeacherProfileDocument | null> {
  return this.findOne({ userId }).populate('userId', 'firstName lastName email');
};

teacherProfileSchema.statics.findPendingProfiles = function(): Promise<ITeacherProfileDocument[]> {
  return this.find({ profileStatus: 'pending' })
    .populate('userId', 'firstName lastName email')
    .sort({ submittedAt: -1 });
};

teacherProfileSchema.statics.findApprovedProfiles = function(): Promise<ITeacherProfileDocument[]> {
  return this.find({ profileStatus: 'approved' })
    .populate('userId', 'firstName lastName email')
    .sort({ reviewedAt: -1 });
};

export const TeacherProfile = mongoose.model<ITeacherProfileDocument, ITeacherProfileModel>('TeacherProfile', teacherProfileSchema);

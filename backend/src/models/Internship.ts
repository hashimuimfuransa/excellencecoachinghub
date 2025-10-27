import mongoose, { Schema, Document, Model } from 'mongoose';
import { JobStatus, ExperienceLevel, EducationLevel, JobCategory } from '../types';

export interface IInternshipDocument extends Document {
  title: string;
  description: string;
  company: string;
  employer: string; // User ID
  department: string; // Department/Field
  location: string;
  numberOfPositions: number; // Number of people needed
  applicationProcedure: string; // Application procedure details
  internshipPeriod: {
    startDate: Date;
    endDate: Date;
    duration: string; // e.g., "3 months", "6 months"
  };
  isPaid: boolean;
  stipend?: {
    amount: number;
    currency: string;
    frequency: string; // monthly, weekly, etc.
  };
  expectedStartDate: Date;
  expectedEndDate: Date;
  experienceLevel: ExperienceLevel;
  educationLevel: EducationLevel;
  skills: string[];
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  learningObjectives: string[]; // What the intern will learn
  mentorshipProvided: boolean;
  certificateProvided: boolean;
  applicationDeadline?: Date;
  postedDate?: Date;
  status: JobStatus;
  isCurated: boolean;
  curatedBy?: string;
  relatedCourses: string[];
  psychometricTestRequired: boolean;
  psychometricTests: string[];
  applicationsCount: number;
  viewsCount: number;
  workArrangement: string; // remote, hybrid, on-site
  // Contact information
  contactInfo?: {
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
    contactPerson?: string;
    applicationInstructions?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IInternshipModel extends Model<IInternshipDocument> {
  findActiveInternships(): Promise<IInternshipDocument[]>;
  findInternshipsByEmployer(employerId: string): Promise<IInternshipDocument[]>;
  findCuratedInternships(): Promise<IInternshipDocument[]>;
  findInternshipsBySkills(skills: string[]): Promise<IInternshipDocument[]>;
  findInternshipsByEducationLevel(educationLevel: EducationLevel): Promise<IInternshipDocument[]>;
}

const internshipSchema = new Schema<IInternshipDocument>({
  title: {
    type: String,
    required: [true, 'Internship title is required'],
    trim: true,
    maxlength: [200, 'Internship title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Internship description is required'],
    trim: true,
    maxlength: [5000, 'Internship description cannot exceed 5000 characters']
  },
  company: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [200, 'Company name cannot exceed 200 characters']
  },
  employer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Employer is required']
  },
  department: {
    type: String,
    required: [true, 'Department/Field is required'],
    trim: true,
    maxlength: [100, 'Department cannot exceed 100 characters']
  },
  location: {
    type: String,
    required: [true, 'Internship location is required'],
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  numberOfPositions: {
    type: Number,
    required: [true, 'Number of positions is required'],
    min: [1, 'Number of positions must be at least 1'],
    max: [100, 'Number of positions cannot exceed 100']
  },
  applicationProcedure: {
    type: String,
    required: [true, 'Application procedure is required'],
    trim: true,
    maxlength: [2000, 'Application procedure cannot exceed 2000 characters']
  },
  internshipPeriod: {
    startDate: {
      type: Date,
      required: [true, 'Internship start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'Internship end date is required']
    },
    duration: {
      type: String,
      required: [true, 'Internship duration is required'],
      trim: true,
      maxlength: [50, 'Duration cannot exceed 50 characters']
    }
  },
  isPaid: {
    type: Boolean,
    required: [true, 'Payment status is required'],
    default: false
  },
  stipend: {
    amount: {
      type: Number,
      min: [0, 'Stipend amount cannot be negative']
    },
    currency: {
      type: String,
      default: 'USD',
      maxlength: [3, 'Currency code cannot exceed 3 characters']
    },
    frequency: {
      type: String,
      enum: ['monthly', 'weekly', 'biweekly', 'lump_sum'],
      default: 'monthly'
    }
  },
  expectedStartDate: {
    type: Date,
    required: [true, 'Expected start date is required'],
    validate: {
      validator: function(this: IInternshipDocument, value: Date) {
        return value >= new Date();
      },
      message: 'Expected start date must be in the future'
    }
  },
  expectedEndDate: {
    type: Date,
    required: [true, 'Expected end date is required'],
    validate: {
      validator: function(this: IInternshipDocument, value: Date) {
        return value > this.expectedStartDate;
      },
      message: 'Expected end date must be after start date'
    }
  },
  experienceLevel: {
    type: String,
    enum: ExperienceLevel ? Object.values(ExperienceLevel) : ['entry_level', 'mid_level', 'senior_level', 'executive'],
    required: [true, 'Experience level is required']
  },
  educationLevel: {
    type: String,
    enum: EducationLevel ? Object.values(EducationLevel) : ['high_school', 'associate', 'bachelor', 'master', 'doctorate', 'professional'],
    required: [true, 'Education level is required']
  },
  skills: [{
    type: String,
    trim: true,
    maxlength: [1000, 'Skill name cannot exceed 1000 characters']
  }],
  requirements: [{
    type: String,
    trim: true,
    maxlength: [2000, 'Requirement cannot exceed 2000 characters']
  }],
  responsibilities: [{
    type: String,
    trim: true,
    maxlength: [2000, 'Responsibility cannot exceed 2000 characters']
  }],
  benefits: [{
    type: String,
    trim: true,
    maxlength: [1000, 'Benefit cannot exceed 1000 characters']
  }],
  learningObjectives: [{
    type: String,
    trim: true,
    maxlength: [1000, 'Learning objective cannot exceed 1000 characters']
  }],
  mentorshipProvided: {
    type: Boolean,
    default: true
  },
  certificateProvided: {
    type: Boolean,
    default: false
  },
  applicationDeadline: {
    type: Date,
    validate: {
      validator: function(this: IInternshipDocument, value: Date) {
        return !value || value > new Date();
      },
      message: 'Application deadline must be in the future'
    }
  },
  postedDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: JobStatus ? Object.values(JobStatus) : ['draft', 'active', 'paused', 'closed', 'expired'],
    default: JobStatus.DRAFT
  },
  isCurated: {
    type: Boolean,
    default: false
  },
  curatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: function(this: IInternshipDocument) {
      return this.isCurated;
    }
  },
  relatedCourses: [{
    type: Schema.Types.ObjectId,
    ref: 'Course'
  }],
  psychometricTestRequired: {
    type: Boolean,
    default: false
  },
  psychometricTests: [{
    type: Schema.Types.ObjectId,
    ref: 'PsychometricTest'
  }],
  applicationsCount: {
    type: Number,
    default: 0,
    min: [0, 'Applications count cannot be negative']
  },
  viewsCount: {
    type: Number,
    default: 0,
    min: [0, 'Views count cannot be negative']
  },
  workArrangement: {
    type: String,
    enum: ['remote', 'hybrid', 'on-site'],
    default: 'on-site'
  },
  contactInfo: {
    email: {
      type: String,
      trim: true,
      maxlength: [200, 'Contact email cannot exceed 200 characters'],
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address']
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [50, 'Contact phone cannot exceed 50 characters']
    },
    website: {
      type: String,
      trim: true,
      maxlength: [300, 'Website URL cannot exceed 300 characters']
    },
    address: {
      type: String,
      trim: true,
      maxlength: [500, 'Address cannot exceed 500 characters']
    },
    contactPerson: {
      type: String,
      trim: true,
      maxlength: [100, 'Contact person name cannot exceed 100 characters']
    },
    applicationInstructions: {
      type: String,
      trim: true,
      maxlength: [1000, 'Application instructions cannot exceed 1000 characters']
    }
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
internshipSchema.index({ status: 1 });
internshipSchema.index({ employer: 1 });
internshipSchema.index({ isCurated: 1 });
internshipSchema.index({ skills: 1 });
internshipSchema.index({ educationLevel: 1 });
internshipSchema.index({ experienceLevel: 1 });
internshipSchema.index({ createdAt: -1 });
internshipSchema.index({ applicationDeadline: 1 });
internshipSchema.index({ expectedStartDate: 1 });
internshipSchema.index({ department: 1 });
internshipSchema.index({ isPaid: 1 });

// Compound indexes
internshipSchema.index({ status: 1, educationLevel: 1 });
internshipSchema.index({ status: 1, isCurated: 1 });
internshipSchema.index({ status: 1, createdAt: -1 });
internshipSchema.index({ status: 1, expectedStartDate: 1 });
internshipSchema.index({ status: 1, isPaid: 1 });

// Text indexes for search functionality
internshipSchema.index({ 
  title: 'text', 
  description: 'text', 
  company: 'text',
  department: 'text'
}, {
  weights: {
    title: 10,
    company: 5,
    department: 3,
    description: 1
  }
});

// Virtual for checking if internship is expired
internshipSchema.virtual('isExpired').get(function(this: IInternshipDocument) {
  return this.applicationDeadline && this.applicationDeadline < new Date();
});

// Pre-save middleware to update status if expired
internshipSchema.pre<IInternshipDocument>('save', function(next) {
  if (this.applicationDeadline && this.applicationDeadline < new Date() && this.status === JobStatus.ACTIVE) {
    this.status = JobStatus.EXPIRED;
  }
  next();
});

// Static methods
internshipSchema.statics.findActiveInternships = function(): Promise<IInternshipDocument[]> {
  return this.find({ 
    status: JobStatus.ACTIVE,
    $or: [
      { applicationDeadline: { $exists: false } },
      { applicationDeadline: { $gt: new Date() } }
    ]
  }).populate('employer', 'firstName lastName company')
    .populate('relatedCourses', 'title description')
    .sort({ createdAt: -1 });
};

internshipSchema.statics.findInternshipsByEmployer = function(employerId: string): Promise<IInternshipDocument[]> {
  return this.find({ employer: employerId })
    .populate('relatedCourses', 'title description')
    .sort({ createdAt: -1 });
};

internshipSchema.statics.findCuratedInternships = function(): Promise<IInternshipDocument[]> {
  return this.find({ 
    isCurated: true,
    status: JobStatus.ACTIVE,
    $or: [
      { applicationDeadline: { $exists: false } },
      { applicationDeadline: { $gt: new Date() } }
    ]
  }).populate('curatedBy', 'firstName lastName')
    .populate('relatedCourses', 'title description')
    .sort({ createdAt: -1 });
};

internshipSchema.statics.findInternshipsBySkills = function(skills: string[]): Promise<IInternshipDocument[]> {
  return this.find({
    status: JobStatus.ACTIVE,
    skills: { $in: skills },
    $or: [
      { applicationDeadline: { $exists: false } },
      { applicationDeadline: { $gt: new Date() } }
    ]
  }).populate('employer', 'firstName lastName company')
    .populate('relatedCourses', 'title description')
    .sort({ createdAt: -1 });
};

internshipSchema.statics.findInternshipsByEducationLevel = function(educationLevel: EducationLevel): Promise<IInternshipDocument[]> {
  // Find internships that require this education level or lower
  const educationHierarchy = [
    EducationLevel.HIGH_SCHOOL,
    EducationLevel.ASSOCIATE,
    EducationLevel.BACHELOR,
    EducationLevel.MASTER,
    EducationLevel.DOCTORATE,
    EducationLevel.PROFESSIONAL
  ];
  
  const userLevelIndex = educationHierarchy.indexOf(educationLevel);
  const eligibleLevels = educationHierarchy.slice(0, userLevelIndex + 1);
  
  return this.find({
    status: JobStatus.ACTIVE,
    educationLevel: { $in: eligibleLevels },
    $or: [
      { applicationDeadline: { $exists: false } },
      { applicationDeadline: { $gt: new Date() } }
    ]
  }).populate('employer', 'firstName lastName company')
    .populate('relatedCourses', 'title description')
    .sort({ createdAt: -1 });
};

export const Internship = mongoose.model<IInternshipDocument, IInternshipModel>('Internship', internshipSchema);
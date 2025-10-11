import mongoose, { Schema, Document, Model } from 'mongoose';
import { JobStatus, JobType, ExperienceLevel, EducationLevel, JobCategory } from '../types';

export interface IJobDocument extends Document {
  title: string;
  description: string;
  company: string;
  employer: string; // User ID
  location: string;
  jobType: JobType;
  category?: JobCategory;
  experienceLevel: ExperienceLevel;
  educationLevel: EducationLevel;
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  skills: string[];
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
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
  isExternalJob: boolean;
  externalApplicationUrl?: string;
  externalJobSource?: string;
  externalJobId?: string;
  // Contact information for external jobs
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

export interface IJobModel extends Model<IJobDocument> {
  findActiveJobs(): Promise<IJobDocument[]>;
  findJobsByEmployer(employerId: string): Promise<IJobDocument[]>;
  findCuratedJobs(): Promise<IJobDocument[]>;
  findJobsBySkills(skills: string[]): Promise<IJobDocument[]>;
  findJobsByEducationLevel(educationLevel: EducationLevel): Promise<IJobDocument[]>;
  deleteExpiredJobs(): Promise<{ deletedCount: number; deletedJobs: IJobDocument[] }>;
}

const jobSchema = new Schema<IJobDocument>({
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    maxlength: [200, 'Job title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Job description is required'],
    trim: true,
    maxlength: [5000, 'Job description cannot exceed 5000 characters']
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
  location: {
    type: String,
    required: [true, 'Job location is required'],
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  jobType: {
    type: String,
    enum: JobType ? Object.values(JobType) : ['full_time', 'part_time', 'contract', 'internship', 'freelance'],
    required: [true, 'Job type is required']
  },
  category: {
    type: String,
    enum: JobCategory ? Object.values(JobCategory) : ['jobs', 'tenders', 'trainings', 'internships', 'scholarships', 'access_to_finance'],
    default: JobCategory ? JobCategory.JOBS : 'jobs'
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
  salary: {
    min: {
      type: Number,
      min: [0, 'Minimum salary cannot be negative']
    },
    max: {
      type: Number,
      min: [0, 'Maximum salary cannot be negative']
    },
    currency: {
      type: String,
      default: 'USD',
      maxlength: [3, 'Currency code cannot exceed 3 characters']
    }
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
  applicationDeadline: {
    type: Date,
    validate: {
      validator: function(this: IJobDocument, value: Date) {
        // Allow expired deadlines for external jobs (they might be historical data)
        // Only enforce future deadlines for manually created jobs
        if (!value) return true;
        
        if (this.isExternalJob) {
          // For external jobs, allow any deadline date (past or future)
          return true;
        }
        
        // For internal jobs, deadline must be in the future
        return value > new Date();
      },
      message: 'Application deadline must be in the future (except for external jobs)'
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
    required: function(this: IJobDocument) {
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
  isExternalJob: {
    type: Boolean,
    default: false
  },
  externalApplicationUrl: {
    type: String,
    trim: true,
    maxlength: [2000, 'External application URL cannot exceed 2000 characters']
  },
  externalJobSource: {
    type: String,
    trim: true,
    maxlength: [200, 'External job source cannot exceed 200 characters']
  },
  externalJobId: {
    type: String,
    trim: true,
    maxlength: [200, 'External job ID cannot exceed 200 characters']
  },
  contactInfo: {
    email: {
      type: String,
      trim: true,
      maxlength: [200, 'Contact email cannot exceed 200 characters'],
      validate: {
        validator: function(value: string) {
          // Allow empty/undefined values, only validate if email is provided
          if (!value || value.trim() === '') return true;
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        },
        message: 'Please provide a valid email address'
      }
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
jobSchema.index({ status: 1 });
jobSchema.index({ employer: 1 });
jobSchema.index({ isCurated: 1 });
jobSchema.index({ skills: 1 });
jobSchema.index({ educationLevel: 1 });
jobSchema.index({ jobType: 1 });
jobSchema.index({ experienceLevel: 1 });
jobSchema.index({ createdAt: -1 });
jobSchema.index({ applicationDeadline: 1 });
jobSchema.index({ isExternalJob: 1 });
jobSchema.index({ externalJobSource: 1, externalJobId: 1 }, { unique: true, sparse: true });

// Compound indexes
jobSchema.index({ status: 1, educationLevel: 1 });
jobSchema.index({ status: 1, isCurated: 1 });
jobSchema.index({ status: 1, createdAt: -1 }); // For active jobs sorted by date
jobSchema.index({ status: 1, jobType: 1, createdAt: -1 }); // For filtered job type queries
jobSchema.index({ status: 1, experienceLevel: 1, createdAt: -1 }); // For experience level queries

// Text indexes for search functionality
jobSchema.index({ 
  title: 'text', 
  description: 'text', 
  company: 'text' 
}, {
  weights: {
    title: 10,
    company: 5,
    description: 1
  }
});

// Virtual for checking if job is expired
jobSchema.virtual('isExpired').get(function(this: IJobDocument) {
  return this.applicationDeadline && this.applicationDeadline < new Date();
});

// Pre-save middleware to update status if expired
jobSchema.pre<IJobDocument>('save', function(next) {
  if (this.applicationDeadline && this.applicationDeadline < new Date() && this.status === JobStatus.ACTIVE) {
    this.status = JobStatus.EXPIRED;
  }
  next();
});

// Static methods
jobSchema.statics.findActiveJobs = function(): Promise<IJobDocument[]> {
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

jobSchema.statics.findJobsByEmployer = function(employerId: string): Promise<IJobDocument[]> {
  return this.find({ employer: employerId })
    .populate('relatedCourses', 'title description')
    .sort({ createdAt: -1 });
};

jobSchema.statics.findCuratedJobs = function(): Promise<IJobDocument[]> {
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

jobSchema.statics.findJobsBySkills = function(skills: string[]): Promise<IJobDocument[]> {
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

jobSchema.statics.findJobsByEducationLevel = function(educationLevel: EducationLevel): Promise<IJobDocument[]> {
  // Find jobs that require this education level or lower
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

// Static method to immediately delete expired jobs
jobSchema.statics.deleteExpiredJobs = async function(): Promise<{ deletedCount: number; deletedJobs: IJobDocument[] }> {
  const now = new Date();
  
  // Find jobs that have passed their application deadline
  const expiredJobs = await this.find({
    applicationDeadline: { $exists: true, $lt: now }
  }).select('_id title company applicationDeadline');
  
  if (expiredJobs.length === 0) {
    console.log('📦 No expired jobs to delete');
    return { deletedCount: 0, deletedJobs: [] };
  }
  
  const jobIds = expiredJobs.map(job => job._id);
  
  // Import JobApplication here to avoid circular dependency
  const { JobApplication } = await import('./JobApplication');
  
  // Delete associated job applications first
  const applicationDeleteResult = await JobApplication.deleteMany({
    jobId: { $in: jobIds }
  });
  
  // Delete the expired jobs using deleteMany with explicit filter
  const jobDeleteResult = await this.deleteMany({
    _id: { $in: jobIds }
  });
  
  // Verify deletion by checking if jobs still exist
  const remainingJobs = await this.countDocuments({
    _id: { $in: jobIds }
  });
  
  if (remainingJobs > 0) {
    console.error(`❌ WARNING: ${remainingJobs} expired jobs were not deleted properly!`);
    // Try force deletion
    await this.deleteMany({
      _id: { $in: jobIds }
    }, { force: true });
  }
  
  console.log(`🗑️ Immediately deleted ${jobDeleteResult.deletedCount} expired jobs from database`);
  console.log(`📝 Deleted ${applicationDeleteResult.deletedCount} associated job applications`);
  
  // Log details for audit
  for (const job of expiredJobs) {
    console.log(`🗂️ Deleted expired job: "${job.title}" at ${job.company} (deadline: ${job.applicationDeadline})`);
  }
  
  // Final verification
  const finalCheck = await this.countDocuments({
    applicationDeadline: { $exists: true, $lt: now }
  });
  
  if (finalCheck === 0) {
    console.log('✅ SUCCESS: All expired jobs have been completely removed from the database');
  } else {
    console.error(`❌ ERROR: ${finalCheck} expired jobs still remain in the database after deletion attempt`);
  }
  
  return { 
    deletedCount: jobDeleteResult.deletedCount, 
    deletedJobs: expiredJobs 
  };
};

export const Job = mongoose.model<IJobDocument, IJobModel>('Job', jobSchema);
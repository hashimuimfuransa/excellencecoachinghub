import mongoose, { Schema, Document, Model } from 'mongoose';
import { JobType } from '../types/job';

export interface IJobSeekerProfileDocument extends Document {
  user: string;
  // Personal Information
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: string;
  nationality?: string;
  location?: string;
  address?: string;
  bio?: string;
  
  // Professional Information
  jobTitle?: string;
  company?: string;
  industry?: string;
  department?: string;
  employmentStatus?: string;
  experienceLevel?: string;
  yearsOfExperience?: number;
  noticePeriod?: string;
  summary?: string;
  currentSalary?: number;
  expectedSalary?: number;
  preferredJobType?: string;
  workPreference?: string;
  
  // Documents
  cvFile?: string;
  resumeFile?: string;
  portfolioFiles?: string[];
  
  // Legacy fields (keeping for backward compatibility)
  resume: string;
  skills: string[];
  experience: {
    company: string;
    position: string;
    duration: string;
    description: string;
    startDate?: Date;
    endDate?: Date;
    current?: boolean;
  }[];
  education: {
    institution: string;
    degree: string;
    field: string;
    year: number;
    startDate?: Date;
    endDate?: Date;
    grade?: string;
    description?: string;
  }[];
  certifications: string[];
  interests: string[];
  preferredJobTypes: JobType[];
  preferredLocations: string[];
  salaryExpectation?: {
    min: number;
    max: number;
    currency: string;
  };
  availability: Date;
  
  // Social Media Links
  socialLinks?: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
    youtube?: string;
    website?: string;
    portfolio?: string;
    behance?: string;
    dribbble?: string;
  };
  
  // Legacy social fields (keeping for backward compatibility)
  linkedInProfile?: string;
  portfolioUrl?: string;
  
  // Additional Skills and Preferences
  languages?: {
    language: string;
    proficiency: string;
  }[];
  
  // Job Preferences
  jobPreferences?: {
    preferredIndustries?: string[];
    preferredCompanySizes?: string[];
    preferredWorkEnvironments?: string[];
    willingToRelocate?: boolean;
    remoteWorkPreference?: string;
    travelWillingness?: string;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

export interface IJobSeekerProfileModel extends Model<IJobSeekerProfileDocument> {
  findBySkills(skills: string[]): Promise<IJobSeekerProfileDocument[]>;
  findByLocation(location: string): Promise<IJobSeekerProfileDocument[]>;
  findByJobType(jobType: JobType): Promise<IJobSeekerProfileDocument[]>;
  findAvailableCandidates(): Promise<IJobSeekerProfileDocument[]>;
}

const experienceSchema = new Schema({
  company: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [200, 'Company name cannot exceed 200 characters']
  },
  position: {
    type: String,
    required: [true, 'Position is required'],
    trim: true,
    maxlength: [200, 'Position cannot exceed 200 characters']
  },
  duration: {
    type: String,
    required: [true, 'Duration is required'],
    trim: true,
    maxlength: [100, 'Duration cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  current: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const educationSchema = new Schema({
  institution: {
    type: String,
    required: [true, 'Institution name is required'],
    trim: true,
    maxlength: [200, 'Institution name cannot exceed 200 characters']
  },
  degree: {
    type: String,
    required: [true, 'Degree is required'],
    trim: true,
    maxlength: [200, 'Degree cannot exceed 200 characters']
  },
  field: {
    type: String,
    required: [true, 'Field of study is required'],
    trim: true,
    maxlength: [200, 'Field cannot exceed 200 characters']
  },
  year: {
    type: Number,
    required: [true, 'Graduation year is required'],
    min: [1950, 'Year must be after 1950'],
    max: [new Date().getFullYear() + 10, 'Year cannot be more than 10 years in the future']
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  grade: {
    type: String,
    trim: true,
    maxlength: [50, 'Grade cannot exceed 50 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  }
}, { _id: false });

const jobSeekerProfileSchema = new Schema<IJobSeekerProfileDocument>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
    unique: true
  },
  
  // Personal Information
  firstName: {
    type: String,
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true,
    maxlength: [20, 'Phone number cannot exceed 20 characters']
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say'],
    trim: true
  },
  nationality: {
    type: String,
    trim: true,
    maxlength: [100, 'Nationality cannot exceed 100 characters']
  },
  location: {
    type: String,
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  address: {
    type: String,
    trim: true,
    maxlength: [500, 'Address cannot exceed 500 characters']
  },
  bio: {
    type: String,
    trim: true,
    maxlength: [2000, 'Bio cannot exceed 2000 characters']
  },
  
  // Professional Information
  jobTitle: {
    type: String,
    trim: true,
    maxlength: [200, 'Job title cannot exceed 200 characters']
  },
  company: {
    type: String,
    trim: true,
    maxlength: [200, 'Company name cannot exceed 200 characters']
  },
  industry: {
    type: String,
    trim: true,
    maxlength: [100, 'Industry cannot exceed 100 characters']
  },
  department: {
    type: String,
    trim: true,
    maxlength: [100, 'Department cannot exceed 100 characters']
  },
  employmentStatus: {
    type: String,
    enum: ['employed', 'unemployed', 'student', 'freelancer', 'self_employed'],
    trim: true
  },
  experienceLevel: {
    type: String,
    enum: ['entry_level', 'mid_level', 'senior_level', 'executive'],
    trim: true
  },
  yearsOfExperience: {
    type: Number,
    min: [0, 'Years of experience cannot be negative'],
    max: [50, 'Years of experience cannot exceed 50']
  },
  noticePeriod: {
    type: String,
    trim: true,
    maxlength: [100, 'Notice period cannot exceed 100 characters']
  },
  summary: {
    type: String,
    trim: true,
    maxlength: [3000, 'Summary cannot exceed 3000 characters']
  },
  currentSalary: {
    type: Number,
    min: [0, 'Current salary cannot be negative']
  },
  expectedSalary: {
    type: Number,
    min: [0, 'Expected salary cannot be negative']
  },
  preferredJobType: {
    type: String,
    enum: ['full_time', 'part_time', 'contract', 'internship', 'freelance'],
    trim: true
  },
  workPreference: {
    type: String,
    enum: ['remote', 'onsite', 'hybrid', 'flexible'],
    trim: true
  },
  
  // Documents
  cvFile: {
    type: String,
    trim: true
  },
  resumeFile: {
    type: String,
    trim: true
  },
  portfolioFiles: [{
    type: String,
    trim: true
  }],
  
  // Legacy fields (keeping for backward compatibility)
  resume: {
    type: String,
    required: [true, 'Resume is required'],
    trim: true
  },
  skills: [{
    type: String,
    trim: true,
    maxlength: [100, 'Skill name cannot exceed 100 characters']
  }],
  experience: {
    type: [experienceSchema],
    default: []
  },
  education: {
    type: [educationSchema],
    default: []
  },
  certifications: [{
    type: Schema.Types.ObjectId,
    ref: 'JobCertificate'
  }],
  interests: [{
    type: String,
    trim: true,
    maxlength: [100, 'Interest cannot exceed 100 characters']
  }],
  preferredJobTypes: [{
    type: String,
    enum: JobType ? Object.values(JobType) : ['full_time', 'part_time', 'contract', 'internship', 'freelance']
  }],
  preferredLocations: [{
    type: String,
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters']
  }],
  salaryExpectation: {
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
  availability: {
    type: Date,
    required: [true, 'Availability date is required']
  },
  linkedInProfile: {
    type: String,
    trim: true,
    validate: {
      validator: function(value: string) {
        if (!value) return true;
        return /^https:\/\/(www\.)?linkedin\.com\/in\//.test(value);
      },
      message: 'Please provide a valid LinkedIn profile URL'
    }
  },
  portfolioUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function(value: string) {
        if (!value) return true;
        return /^https?:\/\/.+/.test(value);
      },
      message: 'Please provide a valid portfolio URL'
    }
  },
  
  // Social Media Links
  socialLinks: {
    linkedin: {
      type: String,
      trim: true,
      validate: {
        validator: function(value: string) {
          if (!value) return true;
          return /^https:\/\/(www\.)?linkedin\.com\/in\//.test(value);
        },
        message: 'Please provide a valid LinkedIn profile URL'
      }
    },
    github: {
      type: String,
      trim: true,
      validate: {
        validator: function(value: string) {
          if (!value) return true;
          return /^https:\/\/(www\.)?github\.com\//.test(value);
        },
        message: 'Please provide a valid GitHub profile URL'
      }
    },
    twitter: {
      type: String,
      trim: true,
      validate: {
        validator: function(value: string) {
          if (!value) return true;
          return /^https:\/\/(www\.)?(twitter\.com|x\.com)\//.test(value);
        },
        message: 'Please provide a valid Twitter/X profile URL'
      }
    },
    facebook: {
      type: String,
      trim: true,
      validate: {
        validator: function(value: string) {
          if (!value) return true;
          return /^https:\/\/(www\.)?facebook\.com\//.test(value);
        },
        message: 'Please provide a valid Facebook profile URL'
      }
    },
    instagram: {
      type: String,
      trim: true,
      validate: {
        validator: function(value: string) {
          if (!value) return true;
          return /^https:\/\/(www\.)?instagram\.com\//.test(value);
        },
        message: 'Please provide a valid Instagram profile URL'
      }
    },
    youtube: {
      type: String,
      trim: true,
      validate: {
        validator: function(value: string) {
          if (!value) return true;
          return /^https:\/\/(www\.)?youtube\.com\//.test(value);
        },
        message: 'Please provide a valid YouTube channel URL'
      }
    },
    website: {
      type: String,
      trim: true,
      validate: {
        validator: function(value: string) {
          if (!value) return true;
          return /^https?:\/\/.+/.test(value);
        },
        message: 'Please provide a valid website URL'
      }
    },
    portfolio: {
      type: String,
      trim: true,
      validate: {
        validator: function(value: string) {
          if (!value) return true;
          return /^https?:\/\/.+/.test(value);
        },
        message: 'Please provide a valid portfolio URL'
      }
    },
    behance: {
      type: String,
      trim: true,
      validate: {
        validator: function(value: string) {
          if (!value) return true;
          return /^https:\/\/(www\.)?behance\.net\//.test(value);
        },
        message: 'Please provide a valid Behance profile URL'
      }
    },
    dribbble: {
      type: String,
      trim: true,
      validate: {
        validator: function(value: string) {
          if (!value) return true;
          return /^https:\/\/(www\.)?dribbble\.com\//.test(value);
        },
        message: 'Please provide a valid Dribbble profile URL'
      }
    }
  },
  
  // Languages
  languages: [{
    language: {
      type: String,
      required: [true, 'Language name is required'],
      trim: true,
      maxlength: [50, 'Language name cannot exceed 50 characters']
    },
    proficiency: {
      type: String,
      required: [true, 'Language proficiency is required'],
      enum: ['beginner', 'intermediate', 'advanced', 'native'],
      trim: true
    }
  }],
  
  // Job Preferences
  jobPreferences: {
    preferredIndustries: [{
      type: String,
      trim: true,
      maxlength: [100, 'Industry name cannot exceed 100 characters']
    }],
    preferredCompanySizes: [{
      type: String,
      enum: ['startup', 'small', 'medium', 'large', 'enterprise'],
      trim: true
    }],
    preferredWorkEnvironments: [{
      type: String,
      enum: ['corporate', 'startup', 'agency', 'nonprofit', 'government', 'remote_first'],
      trim: true
    }],
    willingToRelocate: {
      type: Boolean,
      default: false
    },
    remoteWorkPreference: {
      type: String,
      enum: ['remote_only', 'hybrid', 'onsite_only', 'flexible'],
      trim: true
    },
    travelWillingness: {
      type: String,
      enum: ['none', 'occasional', 'frequent', 'extensive'],
      trim: true
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
jobSeekerProfileSchema.index({ user: 1 });
jobSeekerProfileSchema.index({ skills: 1 });
jobSeekerProfileSchema.index({ preferredLocations: 1 });
jobSeekerProfileSchema.index({ preferredJobTypes: 1 });
jobSeekerProfileSchema.index({ availability: 1 });
jobSeekerProfileSchema.index({ createdAt: -1 });

// Compound indexes
jobSeekerProfileSchema.index({ skills: 1, availability: 1 });
jobSeekerProfileSchema.index({ preferredJobTypes: 1, preferredLocations: 1 });

// Virtual for years of experience
jobSeekerProfileSchema.virtual('totalExperienceYears').get(function(this: IJobSeekerProfileDocument) {
  if (!this.experience || this.experience.length === 0) return 0;
  
  // Simple calculation - count unique companies and estimate years
  const uniqueCompanies = new Set(this.experience.map(exp => exp.company));
  return uniqueCompanies.size * 2; // Rough estimate
});

// Virtual for education level
jobSeekerProfileSchema.virtual('highestEducation').get(function(this: IJobSeekerProfileDocument) {
  if (!this.education || this.education.length === 0) return 'Not specified';
  
  const educationLevels = ['Certificate', 'Diploma', 'Associate', 'Bachelor', 'Master', 'PhD', 'Doctorate'];
  let highest = 'Not specified';
  
  this.education.forEach(edu => {
    educationLevels.forEach(level => {
      if (edu.degree.toLowerCase().includes(level.toLowerCase())) {
        if (educationLevels.indexOf(level) > educationLevels.indexOf(highest)) {
          highest = level;
        }
      }
    });
  });
  
  return highest;
});

// Static methods
jobSeekerProfileSchema.statics.findBySkills = function(skills: string[]): Promise<IJobSeekerProfileDocument[]> {
  return this.find({ skills: { $in: skills } })
    .populate('user', 'firstName lastName email avatar')
    .populate('certifications')
    .sort({ createdAt: -1 });
};

jobSeekerProfileSchema.statics.findByLocation = function(location: string): Promise<IJobSeekerProfileDocument[]> {
  return this.find({ 
    preferredLocations: { $regex: new RegExp(location, 'i') }
  })
    .populate('user', 'firstName lastName email avatar')
    .populate('certifications')
    .sort({ createdAt: -1 });
};

jobSeekerProfileSchema.statics.findByJobType = function(jobType: JobType): Promise<IJobSeekerProfileDocument[]> {
  return this.find({ preferredJobTypes: jobType })
    .populate('user', 'firstName lastName email avatar')
    .populate('certifications')
    .sort({ createdAt: -1 });
};

jobSeekerProfileSchema.statics.findAvailableCandidates = function(): Promise<IJobSeekerProfileDocument[]> {
  return this.find({ availability: { $lte: new Date() } })
    .populate('user', 'firstName lastName email avatar')
    .populate('certifications')
    .sort({ createdAt: -1 });
};

export const JobSeekerProfile = mongoose.model<IJobSeekerProfileDocument, IJobSeekerProfileModel>('JobSeekerProfile', jobSeekerProfileSchema);
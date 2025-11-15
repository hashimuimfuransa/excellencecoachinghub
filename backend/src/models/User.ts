
import mongoose, { Schema, Document, Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { UserRole } from '../types';

// User document interface extending the shared IUser interface
export interface IUserDocument extends Document {
  email: string;
  password?: string; // Optional for Google OAuth users
  firstName: string;
  lastName?: string;
  role: UserRole;
  userType?: 'student' | 'job_seeker' | 'employer';
  avatar?: string;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  isActive: boolean;
  lastLogin?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  // Google OAuth fields
  googleId?: string;
  provider?: string;
  registrationCompleted?: boolean;
  // User preferences
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  theme?: string;
  language?: string;
  level?: string;
  // Email subscription preferences
  jobRecommendationEmails?: boolean;
  unsubscribeToken?: string;
  // Job Portal fields
  company?: string; // For employers
  jobTitle?: string; // For employers
  
  // Job Seeker Profile fields
  bio?: string;
  phone?: string;
  location?: string;
  profilePicture?: string;
  resume?: string;
  cvFile?: string;
  skills?: string[];
  experience?: Array<{
    _id?: string;
    company: string;
    position: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    description?: string;
    location?: string;
    achievements?: string[];
    employmentType?: string;
    industry?: string;
    responsibilities?: string[];
    technologies?: string[];
  }>;
  education?: Array<{
    _id?: string;
    institution: string;
    degree: string;
    fieldOfStudy: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    gpa?: number;
    description?: string;
    achievements?: string[];
  }>;
  certifications?: Array<{
    _id?: string;
    name: string;
    issuer: string;
    issueDate: string;
    expiryDate?: string;
    credentialId?: string;
    credentialUrl?: string;
    description?: string;
  }>;
  languages?: Array<{
    name: string;
    proficiency: string;
  }>;
  socialLinks?: {
    linkedin?: string;
    github?: string;
    portfolio?: string;
    twitter?: string;
    website?: string;
  };
  jobPreferences?: {
    jobTypes?: string[];
    preferredJobTypes?: string[];
    salaryRange?: {
      min: number;
      max: number;
      currency: string;
    };
    locations?: string[];
    preferredLocations?: string[];
    remoteWork?: boolean;
    willingToRelocate?: boolean;
    industries?: string[];
    preferredIndustries?: string[];
    experienceLevel?: string;
  };
  employmentStatus?: string;
  experienceLevel?: string;
  yearsOfExperience?: number;
  noticePeriod?: string;
  summary?: string;
  currentSalary?: number;
  expectedSalary?: number;
  preferredJobType?: string;
  workPreference?: string;
  dateOfBirth?: string;
  gender?: string;
  nationality?: string;
  address?: string;
  industry?: string;
  department?: string;
  idNumber?: string;
  passport?: string;
  cvFile?: string;
  
  // Profile completion tracking
  profileCompletion?: {
    percentage: number;
    status: string;
    missingFields: string[];
    lastUpdated: string;
  };
  lastProfileUpdate?: string;
  
  // Statistics
  applicationCount?: number;
  savedJobsCount?: number;
  certificatesCount?: number;
  testsCompletedCount?: number;
  interviewsCount?: number;
  
  // Chat system fields
  isOnline?: boolean;
  lastSeen?: Date;
  
  // Privacy settings
  privacySettings?: {
    profileVisibility?: string; // 'public', 'connections', 'private'
    contactInfoVisibility?: string; // 'public', 'connections', 'private'
    experienceVisibility?: string; // 'public', 'connections', 'private'
    educationVisibility?: string; // 'public', 'connections', 'private'
    skillsVisibility?: string; // 'public', 'connections', 'private'
    allowMessagesFrom?: string; // 'everyone', 'connections', 'nobody'
    showOnlineStatus?: boolean;
    pushNotifications?: boolean;
    profileIndexing?: boolean; // Allow search engines to index profile
  };
  
  // Employer-specific fields
  savedCandidates?: Array<{
    candidateId: mongoose.Types.ObjectId;
    savedAt: Date;
    notes?: string;
    tags?: string[];
  }>;
  
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateEmailVerificationToken(): string;
  generatePasswordResetToken(): string;
  generateUnsubscribeToken(): string;
  isLocked(): boolean;
  incLoginAttempts(): Promise<IUserDocument>;
}

// User model interface
export interface IUserModel extends Model<IUserDocument> {
  findByEmail(email: string): Promise<IUserDocument | null>;
  findActiveUsers(): Promise<IUserDocument[]>;
  findByRole(role: UserRole): Promise<IUserDocument[]>;
}

// User schema
const userSchema = new Schema<IUserDocument>({
  email: {
    type: String,
    required: false, // Make email optional
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'Please provide a valid email address'
    ]
  },
  password: {
    type: String,
    required: function(this: IUserDocument) {
      // Password is required only if not using Google OAuth
      return !this.googleId;
    },
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false // Don't include password in queries by default
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: false,
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  role: {
    type: String,
    enum: UserRole ? Object.values(UserRole) : ['admin', 'super_admin', 'teacher', 'student', 'professional', 'employer'],
    required: [true, 'User role is required'],
    default: UserRole.STUDENT
  },
  userType: {
    type: String,
    enum: ['student', 'job_seeker', 'employer'],
    required: false
  },
  avatar: {
    type: String,
    default: null
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    select: false
  },
  emailVerificationExpires: {
    type: Date,
    select: false
  },
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    select: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  loginAttempts: {
    type: Number,
    default: 0,
    select: false
  },
  lockUntil: {
    type: Date,
    select: false
  },
  // Google OAuth fields
  googleId: {
    type: String,
    unique: true,
    sparse: true // Allows multiple null values
  },
  provider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  registrationCompleted: {
    type: Boolean,
    default: true // For regular users, false for Google OAuth users until role selection
  },
  // User preferences
  emailNotifications: {
    type: Boolean,
    default: true
  },
  pushNotifications: {
    type: Boolean,
    default: true
  },
  theme: {
    type: String,
    enum: ['light', 'dark'],
    default: 'light'
  },
  language: {
    type: String,
    default: 'en'
  },
  level: {
    type: String,
    default: ''
  },
  // Email subscription preferences
  jobRecommendationEmails: {
    type: Boolean,
    default: true
  },
  unsubscribeToken: {
    type: String,
    unique: true,
    sparse: true
  },
  // Job Portal fields
  company: {
    type: String,
    trim: true,
    maxlength: [200, 'Company name cannot exceed 200 characters']
  },
  jobTitle: {
    type: String,
    trim: true,
    maxlength: [200, 'Job title cannot exceed 200 characters']
  },
  
  // Job Seeker Profile fields
  bio: {
    type: String,
    trim: true,
    maxlength: [1000, 'Bio cannot exceed 1000 characters']
  },
  phone: {
    type: String,
    trim: true,
    maxlength: [20, 'Phone number cannot exceed 20 characters']
  },
  location: {
    type: String,
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  profilePicture: {
    type: String,
    trim: true
  },
  resume: {
    type: String,
    trim: true
  },
  cvFile: {
    type: String,
    trim: true
  },
  skills: [{
    type: String,
    trim: true
  }],
  experience: [{
    _id: { type: String },
    company: { type: String, trim: true },
    position: { type: String, trim: true },
    startDate: { type: String },
    endDate: { type: String },
    current: { type: Boolean, default: false },
    description: { type: String, trim: true },
    location: { type: String, trim: true },
    achievements: [{ type: String, trim: true }],
    employmentType: { type: String, trim: true },
    industry: { type: String, trim: true },
    responsibilities: [{ type: String, trim: true }],
    technologies: [{ type: String, trim: true }]
  }],
  education: [{
    _id: { type: String },
    institution: { type: String, trim: true },
    degree: { type: String, trim: true },
    fieldOfStudy: { type: String, trim: true },
    startDate: { type: String },
    endDate: { type: String },
    current: { type: Boolean, default: false },
    gpa: { type: Number, min: 0, max: 4 },
    description: { type: String, trim: true },
    achievements: [{ type: String, trim: true }]
  }],
  certifications: [{
    _id: { type: String },
    name: { type: String, trim: true },
    issuer: { type: String, trim: true },
    issueDate: { type: String },
    expiryDate: { type: String },
    credentialId: { type: String, trim: true },
    credentialUrl: { type: String, trim: true },
    description: { type: String, trim: true }
  }],
  languages: [{
    name: { type: String, trim: true },
    proficiency: { type: String, trim: true }
  }],
  socialLinks: {
    linkedin: { type: String, trim: true },
    github: { type: String, trim: true },
    portfolio: { type: String, trim: true },
    twitter: { type: String, trim: true },
    website: { type: String, trim: true }
  },
  jobPreferences: {
    jobTypes: [{ type: String, trim: true }],
    preferredJobTypes: [{ type: String, trim: true }],
    salaryRange: {
      min: { type: Number, min: 0 },
      max: { type: Number, min: 0 },
      currency: { type: String, default: 'USD', trim: true }
    },
    locations: [{ type: String, trim: true }],
    preferredLocations: [{ type: String, trim: true }],
    remoteWork: { type: Boolean, default: false },
    willingToRelocate: { type: Boolean, default: false },
    industries: [{ type: String, trim: true }],
    preferredIndustries: [{ type: String, trim: true }],
    experienceLevel: { type: String, trim: true }
  },
  employmentStatus: {
    type: String,
    trim: true
  },
  experienceLevel: {
    type: String,
    trim: true
  },
  yearsOfExperience: {
    type: Number,
    min: 0
  },
  noticePeriod: {
    type: String,
    trim: true
  },
  summary: {
    type: String,
    trim: true,
    maxlength: [2000, 'Summary cannot exceed 2000 characters']
  },
  currentSalary: {
    type: Number,
    min: 0
  },
  expectedSalary: {
    type: Number,
    min: 0
  },
  preferredJobType: {
    type: String,
    trim: true
  },
  workPreference: {
    type: String,
    trim: true
  },
  dateOfBirth: {
    type: String,
    trim: true
  },
  gender: {
    type: String,
    trim: true
  },
  nationality: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  industry: {
    type: String,
    trim: true
  },
  department: {
    type: String,
    trim: true
  },
  idNumber: {
    type: String,
    trim: true,
    maxlength: [50, 'ID number cannot exceed 50 characters']
  },
  passport: {
    type: String,
    trim: true,
    maxlength: [50, 'Passport number cannot exceed 50 characters']
  },
  cvFile: {
    type: String,
    trim: true
  },
  
  // Profile completion tracking
  profileCompletion: {
    percentage: { type: Number, default: 0, min: 0, max: 100 },
    status: { type: String, default: 'incomplete' },
    missingFields: [{ type: String }],
    lastUpdated: { type: String }
  },
  lastProfileUpdate: {
    type: String
  },
  
  // Statistics
  applicationCount: { type: Number, default: 0, min: 0 },
  savedJobsCount: { type: Number, default: 0, min: 0 },
  certificatesCount: { type: Number, default: 0, min: 0 },
  testsCompletedCount: { type: Number, default: 0, min: 0 },
  interviewsCount: { type: Number, default: 0, min: 0 },
  
  // Chat system fields
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },
  
  // Privacy settings
  privacySettings: {
    profileVisibility: { 
      type: String, 
      enum: ['public', 'connections', 'private'], 
      default: 'public' 
    },
    contactInfoVisibility: { 
      type: String, 
      enum: ['public', 'connections', 'private'], 
      default: 'connections' 
    },
    experienceVisibility: { 
      type: String, 
      enum: ['public', 'connections', 'private'], 
      default: 'public' 
    },
    educationVisibility: { 
      type: String, 
      enum: ['public', 'connections', 'private'], 
      default: 'public' 
    },
    skillsVisibility: { 
      type: String, 
      enum: ['public', 'connections', 'private'], 
      default: 'public' 
    },
    allowMessagesFrom: { 
      type: String, 
      enum: ['everyone', 'connections', 'nobody'], 
      default: 'everyone' 
    },
    showOnlineStatus: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
    profileIndexing: { type: Boolean, default: true }
  },
  
  // Employer-specific fields
  savedCandidates: [{
    candidateId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    savedAt: { type: Date, default: Date.now },
    notes: { type: String, maxlength: 1000 },
    tags: [{ type: String, maxlength: 50 }]
  }]
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.emailVerificationToken;
      delete ret.emailVerificationExpires;
      delete ret.passwordResetToken;
      delete ret.passwordResetExpires;
      delete ret.loginAttempts;
      delete ret.lockUntil;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for performance (email index is already created by unique: true in schema)
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastLogin: -1 });

// Virtual for full name
userSchema.virtual('fullName').get(function(this: IUserDocument) {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save middleware to hash password
userSchema.pre<IUserDocument>('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance method to compare password
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to generate email verification token
userSchema.methods.generateEmailVerificationToken = function(): string {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  
  this.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
  return token;
};

// Instance method to generate password reset token
userSchema.methods.generatePasswordResetToken = function(): string {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
  this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  
  return token;
};

// Instance method to generate unsubscribe token
userSchema.methods.generateUnsubscribeToken = function(): string {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  
  this.unsubscribeToken = crypto.createHash('sha256').update(token).digest('hex');
  
  return token;
};

// Instance method to check if account is locked (disabled for development)
userSchema.methods.isLocked = function(): boolean {
  return false; // Account locking disabled
};

// Instance method to increment login attempts (disabled for development)
userSchema.methods.incLoginAttempts = function(): Promise<IUserDocument> {
  // Login attempt tracking disabled - return resolved promise
  return Promise.resolve(this);
};

// Static method to find user by email
userSchema.statics.findByEmail = function(email: string): Promise<IUserDocument | null> {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find active users
userSchema.statics.findActiveUsers = function(): Promise<IUserDocument[]> {
  return this.find({ isActive: true });
};

// Static method to find users by role
userSchema.statics.findByRole = function(role: UserRole): Promise<IUserDocument[]> {
  return this.find({ role, isActive: true });
};

// Create and export the model
export const User = mongoose.model<IUserDocument, IUserModel>('User', userSchema);

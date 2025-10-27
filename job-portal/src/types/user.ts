// Comprehensive user types for job portal
export enum UserRole {
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
  TEACHER = 'teacher',
  STUDENT = 'student',
  PROFESSIONAL = 'professional',
  EMPLOYER = 'employer',
  JOB_SEEKER = 'job_seeker'
}

export enum ProfileCompletionStatus {
  INCOMPLETE = 'incomplete',
  BASIC = 'basic',
  INTERMEDIATE = 'intermediate',
  COMPLETE = 'complete'
}

export enum EmploymentStatus {
  EMPLOYED = 'employed',
  UNEMPLOYED = 'unemployed',
  STUDENT = 'student',
  FREELANCER = 'freelancer',
  SELF_EMPLOYED = 'self_employed'
}

export enum ExperienceLevel {
  ENTRY_LEVEL = 'entry_level',
  MID_LEVEL = 'mid_level',
  SENIOR_LEVEL = 'senior_level',
  EXECUTIVE = 'executive'
}

export enum EducationLevel {
  HIGH_SCHOOL = 'high_school',
  ASSOCIATE = 'associate',
  BACHELOR = 'bachelor',
  MASTER = 'master',
  DOCTORATE = 'doctorate',
  PROFESSIONAL = 'professional'
}

export enum JobType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  CONTRACT = 'contract',
  INTERNSHIP = 'internship',
  FREELANCE = 'freelance'
}

export interface User {
  _id: string;
  id?: string; // Add id property as optional for backward compatibility
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  userType?: 'student' | 'job_seeker' | 'employer';
  avatar?: string;
  profilePicture?: string;
  
  // Basic Profile Information
  phone?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  nationality?: string;
  location?: string;
  idNumber?: string;
  passport?: string;
  address?: string;
  
  // Professional Information
  jobTitle?: string;
  company?: string;
  bio?: string;
  summary?: string; // Professional summary
  currentSalary?: number;
  expectedSalary?: {
    min: number;
    max: number;
    currency: string;
  };
  employmentStatus?: EmploymentStatus;
  experienceLevel?: ExperienceLevel;
  noticePeriod?: string; // e.g., "immediate", "1 month", "2 months"
  
  // Skills and Expertise
  skills?: string[];
  technicalSkills?: {
    skill: string;
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    yearsOfExperience?: number;
  }[];
  softSkills?: string[];
  languages?: {
    language: string;
    proficiency: 'basic' | 'conversational' | 'fluent' | 'native';
  }[];
  
  // Work Experience
  experience?: WorkExperience[];
  
  // Education
  education?: Education[];
  highestEducation?: EducationLevel;
  
  // Certifications and Achievements
  certifications?: Certification[];
  achievements?: Achievement[];
  awards?: Award[];
  
  // Job Preferences
  jobPreferences?: {
    preferredJobTypes?: JobType[];
    preferredLocations?: string[];
    remoteWork?: boolean;
    willingToRelocate?: boolean;
    travelRequirement?: 'none' | 'occasional' | 'frequent' | 'extensive';
    preferredIndustries?: string[];
    preferredCompanySize?: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  };
  
  // Documents
  cvFile?: string; // CV file path or URL
  coverLetter?: string;
  portfolio?: string;
  
  // Social Links
  socialLinks?: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    portfolio?: string;
    website?: string;
    behance?: string;
    dribbble?: string;
  };
  
  // Profile Completion
  profileCompletion?: {
    percentage: number;
    status: ProfileCompletionStatus;
    missingFields: string[];
    lastUpdated: string;
  };
  
  // Verification Status
  verification?: {
    email: boolean;
    phone: boolean;
    identity: boolean;
    education: boolean;
    employment: boolean;
  };
  
  // Activity and Engagement
  isActive: boolean;
  lastLogin?: string;
  lastProfileUpdate?: string;
  profileViews?: number;
  searchAppearances?: number;
  
  // Statistics/counts for profile display
  applicationCount?: number;
  savedJobsCount?: number;
  certificatesCount?: number;
  testsCompletedCount?: number;
  interviewsCount?: number;
  
  // Settings
  privacySettings?: {
    profileVisibility: 'public' | 'employers' | 'private';
    showEmail: boolean;
    showPhone: boolean;
    showLocation: boolean;
    showSalary: boolean;
    allowMessages: boolean;
    allowJobAlerts: boolean;
    allowRecruiterContact: boolean;
  };
  
  // Notification preferences
  notifications?: {
    email: boolean;
    push: boolean;
    sms: boolean;
    jobAlerts: boolean;
    applicationUpdates: boolean;
    interviewReminders: boolean;
    profileViews: boolean;
    newMessages: boolean;
  };
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface WorkExperience {
  _id?: string;
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description: string;
  location?: string;
  achievements?: string[];
  employmentType?: JobType;
  industry?: string;
  companySize?: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  responsibilities?: string[];
  technologies?: string[];
  salary?: {
    amount: number;
    currency: string;
  };
}

export interface Education {
  _id?: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  gpa?: string;
  description?: string;
  achievements?: string[];
  level: EducationLevel;
  location?: string;
  honors?: string[];
  relevantCoursework?: string[];
  thesis?: string;
}

export interface Certification {
  _id?: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
  description?: string;
  skills?: string[];
  verified?: boolean;
}

export interface Achievement {
  _id?: string;
  title: string;
  description: string;
  date: string;
  category: 'academic' | 'professional' | 'personal' | 'volunteer';
  organization?: string;
  url?: string;
  skills?: string[];
}

export interface Award {
  _id?: string;
  title: string;
  issuer: string;
  date: string;
  description?: string;
  category: 'academic' | 'professional' | 'industry' | 'community';
  level?: 'local' | 'regional' | 'national' | 'international';
  url?: string;
}

// Profile completion requirements
export interface ProfileCompletionRequirements {
  basic: {
    fields: string[];
    weight: number;
  };
  intermediate: {
    fields: string[];
    weight: number;
  };
  complete: {
    fields: string[];
    weight: number;
  };
}

// Profile validation result
export interface ProfileValidationResult {
  isValid: boolean;
  completionPercentage: number;
  status: ProfileCompletionStatus;
  missingFields: string[];
  recommendations: string[];
  canAccessFeatures: {
    psychometricTests: boolean;
    aiInterviews: boolean;
    premiumJobs: boolean;
  };
  completedSections: {
    basic: boolean;
    contact: boolean;
    personal: boolean;
    professional: boolean;
    education: boolean;
    experience: boolean;
    skills: boolean;
    preferences: boolean;
    documents: boolean;
  };
}
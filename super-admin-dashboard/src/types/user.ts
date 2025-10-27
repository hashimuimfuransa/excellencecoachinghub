// User types for Super Admin Dashboard
export const enum UserRole {
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
  TEACHER = 'teacher',
  STUDENT = 'student',
  PROFESSIONAL = 'professional',
  EMPLOYER = 'employer',
  JOB_SEEKER = 'job_seeker'
}

export interface ProfileCompletion {
  percentage: number;
  status: 'incomplete' | 'basic' | 'good' | 'excellent' | 'complete';
}

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  avatar?: string;
  profilePicture?: string;
  company?: string;
  jobTitle?: string;
  phone?: string;
  location?: string;
  bio?: string;
  website?: string;
  linkedIn?: string;
  github?: string;
  skills?: string[];
  experience?: WorkExperience[];
  education?: Education[];
  socialLinks?: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    portfolio?: string;
  };
  profileCompletion?: ProfileCompletion;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  
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
    allowMessages: boolean;
    allowJobAlerts: boolean;
  };
  
  // Notification preferences
  notifications?: {
    email: boolean;
    push: boolean;
    sms: boolean;
    jobAlerts: boolean;
    applicationUpdates: boolean;
    interviewReminders: boolean;
  };
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
}
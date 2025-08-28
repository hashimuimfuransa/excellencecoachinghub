// ExJobNet specific types and enums
export enum UserRole {
  ADMIN = 'admin',
  TEACHER = 'teacher',
  STUDENT = 'student',
  PROFESSIONAL = 'professional',
  EMPLOYER = 'employer',
  JOB_SEEKER = 'job_seeker'
}

export enum JobStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  CLOSED = 'closed',
  EXPIRED = 'expired'
}

export enum JobType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  CONTRACT = 'contract',
  INTERNSHIP = 'internship',
  FREELANCE = 'freelance'
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

export enum ApplicationStatus {
  APPLIED = 'applied',
  UNDER_REVIEW = 'under_review',
  SHORTLISTED = 'shortlisted',
  INTERVIEW_SCHEDULED = 'interview_scheduled',
  INTERVIEWED = 'interviewed',
  OFFERED = 'offered',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn'
}

export enum PsychometricTestType {
  PERSONALITY = 'personality',
  COGNITIVE = 'cognitive',
  APTITUDE = 'aptitude',
  SKILLS = 'skills',
  BEHAVIORAL = 'behavioral'
}

export enum InterviewType {
  TECHNICAL = 'technical',
  BEHAVIORAL = 'behavioral',
  CASE_STUDY = 'case_study',
  GENERAL = 'general'
}

export enum CertificateType {
  JOB_PREPARATION = 'job_preparation',
  COURSE_COMPLETION = 'course_completion',
  SKILL_VERIFICATION = 'skill_verification',
  SKILL_ASSESSMENT = 'skill_assessment',
  INTERVIEW_READINESS = 'interview_readiness',
  INTERVIEW_EXCELLENCE = 'interview_excellence',
  PSYCHOMETRIC_ACHIEVEMENT = 'psychometric_achievement'
}

// ExJobNet specific types
export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  avatar?: string;
  company?: string;
  jobTitle?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface JobSeekerProfile {
  _id: string;
  user: User;
  resume: string;
  skills: string[];
  experience: Experience[];
  education: Education[];
  certifications: JobCertificate[];
  interests: string[];
  preferredJobTypes: JobType[];
  preferredLocations: string[];
  salaryExpectation?: SalaryExpectation;
  availability: string;
  linkedInProfile?: string;
  portfolioUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentProfile {
  _id: string;
  user: User;
  age?: number;
  educationLevel: EducationLevel;
  completedCourses: Course[];
  certificates: JobCertificate[];
  jobInterests: string[];
  careerGoals: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Experience {
  company: string;
  position: string;
  duration: string;
  description: string;
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  year: number;
}

export interface SalaryExpectation {
  min: number;
  max: number;
  currency: string;
}

export interface Job {
  _id: string;
  title: string;
  description: string;
  company: string;
  location: string;
  jobType: JobType;
  experienceLevel: ExperienceLevel;
  educationLevel: EducationLevel;
  skills: string[];
  salary?: SalaryExpectation;
  benefits: string[];
  requirements: string[];
  responsibilities: string[];
  applicationDeadline?: string;
  status: JobStatus;
  employer: User;
  relatedCourses: Course[];
  psychometricTests: PsychometricTest[];
  isCurated: boolean;
  curatedBy?: User;
  applicationsCount: number;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  _id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  duration?: number;
  instructor?: User;
  createdAt: string;
  updatedAt: string;
}

// AI Interview types (moved up to avoid forward reference issues)
export interface AIInterviewQuestion {
  _id: string;
  question: string;
  type: InterviewType;
  expectedKeywords: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number;
}

export interface AIInterviewResponse {
  questionId: string;
  response: string;
  audioUrl?: string;
  score: number;
  feedback: string;
  keywordsFound: string[];
  responseTime: number;
}

export interface AIInterview {
  _id: string;
  user: User;
  job?: Job;
  type: InterviewType;
  questions: AIInterviewQuestion[];
  responses: AIInterviewResponse[];
  overallScore: number;
  feedback: string;
  recommendations: string[];
  strengths: string[];
  areasForImprovement: string[];
  duration: number;
  completedAt?: string;
  createdAt: string;
}

export interface JobApplication {
  _id: string;
  job: Job;
  applicant: User;
  resume: string;
  coverLetter?: string;
  status: ApplicationStatus;
  psychometricTestResults: PsychometricTestResult[];
  interviewResults: AIInterview[];
  certificates: JobCertificate[];
  notes?: string;
  appliedAt: string;
  updatedAt: string;
}

export interface PsychometricTest {
  _id: string;
  title: string;
  description: string;
  type: PsychometricTestType;
  questions: PsychometricQuestion[];
  timeLimit: number;
  industry?: string;
  jobRole?: string;
  isActive: boolean;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
}

export interface PsychometricQuestion {
  _id: string;
  question: string;
  type: 'multiple_choice' | 'scale' | 'text' | 'scenario';
  options?: string[];
  correctAnswer?: string;
  traits?: string[];
  weight: number;
  scaleRange?: { min: number; max: number };
}

export interface PsychometricTestResult {
  _id: string;
  test?: PsychometricTest; // Optional for generated tests
  user: User;
  job?: Job;
  answers: Record<string, any>;
  scores: Record<string, number>;
  overallScore: number;
  interpretation: string;
  recommendations: string[];
  timeSpent: number;
  completedAt: string;
  createdAt: string;
  grade?: string;
  detailedAnalysis?: Record<string, any>;
  testMetadata?: {
    testId: string;
    title: string;
    description: string;
    type: string;
    jobSpecific?: boolean;
    industry?: string;
    jobRole?: string;
  };
}

export interface JobCertificate {
  _id: string;
  user: User;
  type: CertificateType;
  title: string;
  description: string;
  skills: string[];
  issuedBy: string;
  verificationCode: string;
  isVerified: boolean;
  relatedJob?: Job;
  relatedCourse?: Course;
  psychometricTestResults: PsychometricTestResult[];
  interviewResults: AIInterview[];
  issuedAt: string;
  expiresAt?: string;
  createdAt: string;
}

export interface JobCourseMatch {
  _id: string;
  job: Job;
  course: Course;
  relevanceScore: number;
  matchingSkills: string[];
  createdBy: User;
  createdAt: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Form types
export interface JobSeekerProfileForm {
  resume: string;
  skills: string[];
  experience: Experience[];
  education: Education[];
  interests: string[];
  preferredJobTypes: JobType[];
  preferredLocations: string[];
  salaryExpectation?: SalaryExpectation;
  availability: string;
  linkedInProfile?: string;
  portfolioUrl?: string;
}

export interface StudentProfileForm {
  age?: number;
  educationLevel: EducationLevel;
  jobInterests: string[];
  careerGoals: string[];
}

export interface JobForm {
  title: string;
  description: string;
  company: string;
  location: string;
  jobType: JobType;
  experienceLevel: ExperienceLevel;
  educationLevel: EducationLevel;
  skills: string[];
  salary?: SalaryExpectation;
  benefits: string[];
  requirements: string[];
  responsibilities: string[];
  applicationDeadline?: string;
  relatedCourses: string[];
  psychometricTests: string[];
}

export interface JobApplicationForm {
  resume: string;
  coverLetter?: string;
}

// Filter types
export interface JobFilters {
  status?: JobStatus;
  jobType?: JobType;
  experienceLevel?: ExperienceLevel;
  educationLevel?: EducationLevel;
  location?: string;
  skills?: string[];
  isCurated?: boolean;
  search?: string;
}

export interface ApplicationFilters {
  status?: ApplicationStatus;
  jobId?: string;
}

// Dashboard types
export interface DashboardStats {
  totalJobs: number;
  totalApplications: number;
  totalUsers: number;
  totalCertificates: number;
  recentJobs: Job[];
  recentApplications: JobApplication[];
  topSkills: { skill: string; count: number }[];
  placementRate: number;
}

export interface EmployerStats {
  totalJobs: number;
  totalApplications: number;
  activeJobs: number;
  qualifiedCandidates: number;
  recentApplications: JobApplication[];
  topSkills: { skill: string; count: number }[];
}

export interface StudentStats {
  completedCourses: number;
  certificates: number;
  applications: number;
  testResults: number;
  recommendedJobs: Job[];
  skillProgress: { skill: string; level: number }[];
}

// Navigation types
export interface NavItem {
  label: string;
  path: string;
  icon?: React.ComponentType;
  roles?: UserRole[];
  children?: NavItem[];
}

// Theme types
export interface ThemeConfig {
  mode: 'light' | 'dark';
  primaryColor: string;
  secondaryColor: string;
}


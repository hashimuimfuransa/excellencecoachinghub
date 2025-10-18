import type { User } from './user';
import type { Job } from './job';
import type { Course } from './course';
import type { PsychometricTest } from './test';

export const enum ApplicationStatus {
  APPLIED = 'applied',
  UNDER_REVIEW = 'under_review',
  SHORTLISTED = 'shortlisted',
  INTERVIEW_SCHEDULED = 'interview_scheduled',
  INTERVIEWED = 'interviewed',
  OFFERED = 'offered',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn'
}

export const enum InterviewType {
  TECHNICAL = 'technical',
  BEHAVIORAL = 'behavioral',
  CASE_STUDY = 'case_study',
  GENERAL = 'general'
}

export const enum CertificateType {
  JOB_PREPARATION = 'job_preparation',
  COURSE_COMPLETION = 'course_completion',
  SKILL_VERIFICATION = 'skill_verification',
  INTERVIEW_READINESS = 'interview_readiness'
}

export interface JobApplication {
  id: Key;
  jobTitle: ReactNode;
  experience: ReactNode;
  expectedSalary: any;
  education: ReactNode;
  availableFrom: ReactNode;
  reviewedAt: any;
  interviewScore: any;
  skills: any;
  reviewerNotes: any;
  rejectionReason: any;
  applicantEmail: ReactNode;
  _id: string;
  job: Job;
  applicant: User;
  resume: string;
  coverLetter?: string;
  status: ApplicationStatus;
  notes?: string;
  appliedAt: string;
  updatedAt: string;
}

export interface AIInterview {
  _id: string;
  user: User;
  job?: Job;
  type: InterviewType;
  overallScore: number;
  feedback: string;
  recommendations: string[];
  strengths: string[];
  areasForImprovement: string[];
  duration: number;
  completedAt?: string;
  createdAt: string;
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
  issuedAt: string;
  expiresAt?: string;
  createdAt: string;
}

export interface PaymentRequest {
  _id: string;
  userId: string;
  userEmail: string;
  userName: string;
  jobId: string;
  jobTitle: string;
  company: string;
  testType: string;
  questionCount: number;
  estimatedDuration: number;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  adminNotes?: string;
  approvedAt?: string;
  approvedBy?: string;
  paymentAmount?: number;
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
}
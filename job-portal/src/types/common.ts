import type { User } from './user';
import type { Job } from './job';
import type { Course } from './course';

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
  INTERVIEW_READINESS = 'interview_readiness'
}

export interface JobApplication {
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
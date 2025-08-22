import type { User } from './user';

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
  isCurated: boolean;
  curatedBy?: User;
  applicationsCount: number;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
}
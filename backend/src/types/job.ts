// Job-related enums and types
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

export enum JobCategory {
  JOBS = 'jobs',
  TENDERS = 'tenders',
  TRAININGS = 'trainings',
  INTERNSHIPS = 'internships',
  SCHOLARSHIPS = 'scholarships',
  ACCESS_TO_FINANCE = 'access_to_finance'
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
  HIRED = 'hired',
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
  GENERAL = 'general',
  TECHNICAL = 'technical',
  BEHAVIORAL = 'behavioral',
  CASE_STUDY = 'case_study'
}

export enum CertificateType {
  COURSE_COMPLETION = 'course_completion',
  SKILL_ASSESSMENT = 'skill_assessment',
  JOB_PREPARATION = 'job_preparation',
  INTERVIEW_EXCELLENCE = 'interview_excellence',
  PSYCHOMETRIC_ACHIEVEMENT = 'psychometric_achievement'
}
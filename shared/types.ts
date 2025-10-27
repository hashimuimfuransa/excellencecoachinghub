// Shared TypeScript types for Excellence Coaching Hub

export enum UserRole {
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
  TEACHER = 'teacher',
  STUDENT = 'student',
  PROFESSIONAL = 'professional',
  EMPLOYER = 'employer',
  JOB_SEEKER = 'job_seeker'
}

export enum CourseStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ARCHIVED = 'archived'
}

export enum QuizType {
  MULTIPLE_CHOICE = 'multiple_choice',
  TRUE_FALSE = 'true_false',
  SHORT_ANSWER = 'short_answer',
  ESSAY = 'essay',
  FILL_IN_BLANK = 'fill_in_blank'
}

export enum ExamStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum ProctoringEventType {
  FACE_NOT_DETECTED = 'face_not_detected',
  MULTIPLE_FACES = 'multiple_faces',
  LOOKING_AWAY = 'looking_away',
  SUSPICIOUS_MOVEMENT = 'suspicious_movement',
  AUDIO_DETECTED = 'audio_detected',
  WINDOW_FOCUS_LOST = 'window_focus_lost'
}

export enum NotificationType {
  COURSE_ENROLLMENT = 'course_enrollment',
  ASSIGNMENT_DUE = 'assignment_due',
  GRADE_POSTED = 'grade_posted',
  COURSE_UPDATE = 'course_update',
  EXAM_REMINDER = 'exam_reminder',
  PROCTORING_ALERT = 'proctoring_alert',
  TEACHER_PROFILE_PENDING = 'teacher_profile_pending',
  TEACHER_PROFILE_APPROVED = 'teacher_profile_approved',
  TEACHER_PROFILE_REJECTED = 'teacher_profile_rejected',
  COURSE_PENDING_APPROVAL = 'course_pending_approval',
  COURSE_APPROVED = 'course_approved',
  COURSE_REJECTED = 'course_rejected',
  LIVE_SESSION_SCHEDULED = 'live_session_scheduled',
  LIVE_SESSION_STARTING = 'live_session_starting',
  LIVE_SESSION_LIVE = 'live_session_live',
  LIVE_SESSION_ENDED = 'live_session_ended',
  LIVE_SESSION_CANCELLED = 'live_session_cancelled',
  LIVE_SESSION_RECORDED = 'live_session_recorded',
  SYSTEM_MAINTENANCE = 'system_maintenance',
  SECURITY_ALERT = 'security_alert',
  PAYMENT_SUCCESS = 'payment_success',
  PAYMENT_FAILED = 'payment_failed',
  GENERAL = 'general'
}

export enum BadgeType {
  COURSE_COMPLETION = 'course_completion',
  QUIZ_MASTER = 'quiz_master',
  PERFECT_ATTENDANCE = 'perfect_attendance',
  EARLY_BIRD = 'early_bird',
  STREAK_KEEPER = 'streak_keeper'
}

// Base User Interface
export interface IUser {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatar?: string;
  idNumber?: string;
  passport?: string;
  isEmailVerified: boolean;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Course Interface
export interface ICourse {
  _id: string;
  title: string;
  description: string;
  instructor: string; // User ID
  status: CourseStatus;
  thumbnail?: string;
  category: string;
  tags: string[];
  duration: number; // in hours
  level: 'beginner' | 'intermediate' | 'advanced';
  price: number;
  enrollmentCount: number;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
}

// Quiz Question Interface
export interface IQuizQuestion {
  _id: string;
  question: string;
  type: QuizType;
  options?: string[]; // for multiple choice
  correctAnswer: string | string[];
  explanation?: string;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

// Quiz Interface
export interface IQuiz {
  _id: string;
  title: string;
  description?: string;
  course: string; // Course ID
  questions: IQuizQuestion[];
  timeLimit?: number; // in minutes
  attempts: number;
  passingScore: number;
  isProctored: boolean;
  createdBy: string; // User ID
  createdAt: Date;
  updatedAt: Date;
}

// Exam Attempt Interface
export interface IExamAttempt {
  _id: string;
  student: string; // User ID
  quiz: string; // Quiz ID
  answers: Record<string, any>;
  score: number;
  startTime: Date;
  endTime?: Date;
  status: ExamStatus;
  proctoringData?: IProctoringSession;
  aiGraded: boolean;
  teacherReviewed: boolean;
  feedback?: string;
}

// Proctoring Session Interface
export interface IProctoringSession {
  _id: string;
  examAttempt: string; // Exam Attempt ID
  student: string; // User ID
  startTime: Date;
  endTime?: Date;
  events: IProctoringEvent[];
  videoRecording?: string; // file path
  screenshots: string[]; // file paths
  alertCount: number;
  suspiciousActivityScore: number;
}

// Proctoring Event Interface
export interface IProctoringEvent {
  _id: string;
  type: ProctoringEventType;
  timestamp: Date;
  confidence: number;
  description: string;
  screenshot?: string;
  metadata?: Record<string, any>;
}

// Notification Interface
export interface INotification {
  _id: string;
  recipient: string; // User ID
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: Date;
}

// Badge Interface
export interface IBadge {
  _id: string;
  name: string;
  description: string;
  type: BadgeType;
  icon: string;
  criteria: Record<string, any>;
  points: number;
}

// User Progress Interface
export interface IUserProgress {
  _id: string;
  user: string; // User ID
  course: string; // Course ID
  completedLessons: string[];
  completedQuizzes: string[];
  totalTimeSpent: number; // in minutes
  progressPercentage: number;
  lastAccessed: Date;
  badges: string[]; // Badge IDs
  totalPoints: number;
}

// Live Session Interface
export interface ILiveSession {
  _id: string;
  title: string;
  course: string; // Course ID
  instructor: string; // User ID
  scheduledTime: Date;
  duration: number; // in minutes
  meetingUrl?: string;
  participants: string[]; // User IDs
  isRecorded: boolean;
  recordingStatus?: 'not_started' | 'recording' | 'completed' | 'failed';
  recordingUrl?: string;
  recordingSize?: number;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Socket Event Types
export interface SocketEvents {
  // Authentication
  'user:join': (userId: string) => void;
  'user:leave': (userId: string) => void;
  
  // Proctoring
  'proctoring:alert': (data: IProctoringEvent) => void;
  'proctoring:start': (sessionId: string) => void;
  'proctoring:end': (sessionId: string) => void;
  
  // Live Sessions
  'session:join': (sessionId: string, userId: string) => void;
  'session:leave': (sessionId: string, userId: string) => void;
  'session:hand-raise': (sessionId: string, userId: string) => void;
  'session:emoji': (sessionId: string, userId: string, emoji: string) => void;
  
  // Notifications
  'notification:new': (notification: INotification) => void;
  'notification:read': (notificationId: string) => void;
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface CourseForm {
  title: string;
  description: string;
  category: string;
  tags: string[];
  level: 'beginner' | 'intermediate' | 'advanced';
  price: number;
  duration: number;
}

export interface QuizForm {
  title: string;
  description?: string;
  timeLimit?: number;
  attempts: number;
  passingScore: number;
  isProctored: boolean;
  questions: Omit<IQuizQuestion, '_id'>[];
}

// Job Portal Types
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
  INTERVIEW_READINESS = 'interview_readiness'
}

// Job Interface
export interface IJob {
  _id: string;
  title: string;
  description: string;
  company: string;
  employer: string; // User ID
  location: string;
  jobType: JobType;
  experienceLevel: ExperienceLevel;
  educationLevel: EducationLevel;
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  skills: string[];
  requirements: string[];
  benefits: string[];
  applicationDeadline?: Date;
  status: JobStatus;
  isCurated: boolean; // True if added by Super Admin
  curatedBy?: string; // Super Admin User ID
  relatedCourses: string[]; // Course IDs
  psychometricTestRequired: boolean;
  psychometricTests: string[]; // PsychometricTest IDs
  applicationsCount: number;
  viewsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Job Application Interface
export interface IJobApplication {
  _id: string;
  job: string; // Job ID
  applicant: string; // User ID
  resume: string; // File path or URL
  coverLetter?: string;
  status: ApplicationStatus;
  appliedAt: Date;
  psychometricTestResults: string[]; // PsychometricTestResult IDs
  interviewResults: string[]; // InterviewResult IDs
  certificates: string[]; // Certificate IDs
  notes?: string; // Employer notes
  updatedAt: Date;
}

// Psychometric Test Interface
export interface IPsychometricTest {
  _id: string;
  title: string;
  description: string;
  type: PsychometricTestType;
  questions: IPsychometricQuestion[];
  timeLimit: number; // in minutes
  industry?: string;
  jobRole?: string;
  createdBy: string; // Super Admin User ID
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Psychometric Question Interface
export interface IPsychometricQuestion {
  _id: string;
  question: string;
  type: 'multiple_choice' | 'scale' | 'text' | 'scenario';
  options?: string[];
  scaleRange?: { min: number; max: number; labels: string[] };
  correctAnswer?: string | number;
  traits?: string[]; // Personality traits this question measures
  weight: number; // Importance weight
}

// Psychometric Test Result Interface
export interface IPsychometricTestResult {
  _id: string;
  test: string; // PsychometricTest ID
  user: string; // User ID
  job?: string; // Job ID (if taken for specific job)
  answers: Record<string, any>;
  scores: Record<string, number>; // Trait scores
  overallScore: number;
  interpretation: string;
  recommendations: string[];
  completedAt: Date;
  timeSpent: number; // in minutes
}

// AI Interview Interface
export interface IAIInterview {
  _id: string;
  user: string; // User ID
  job?: string; // Job ID (if for specific job)
  type: InterviewType;
  questions: IAIInterviewQuestion[];
  responses: IAIInterviewResponse[];
  overallScore: number;
  feedback: string;
  recommendations: string[];
  strengths: string[];
  areasForImprovement: string[];
  completedAt: Date;
  duration: number; // in minutes
}

// AI Interview Question Interface
export interface IAIInterviewQuestion {
  _id: string;
  question: string;
  type: InterviewType;
  expectedKeywords: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit?: number; // in seconds
}

// AI Interview Response Interface
export interface IAIInterviewResponse {
  questionId: string;
  response: string;
  audioUrl?: string; // If voice response
  score: number;
  feedback: string;
  keywordsFound: string[];
  responseTime: number; // in seconds
}

// Job Certificate Interface
export interface IJobCertificate {
  _id: string;
  user: string; // User ID
  type: CertificateType;
  title: string;
  description: string;
  skills: string[];
  issuedBy: string; // System or User ID
  issuedAt: Date;
  expiresAt?: Date;
  verificationCode: string;
  isVerified: boolean;
  relatedJob?: string; // Job ID
  relatedCourse?: string; // Course ID
  psychometricTestResults?: string[]; // PsychometricTestResult IDs
  interviewResults?: string[]; // AIInterview IDs
}

// User Profile Extension for Job Seekers
export interface IJobSeekerProfile {
  _id: string;
  user: string; // User ID
  resume: string; // File path or URL
  skills: string[];
  experience: {
    company: string;
    position: string;
    duration: string;
    description: string;
  }[];
  education: {
    institution: string;
    degree: string;
    field: string;
    year: number;
  }[];
  certifications: string[]; // Certificate IDs
  interests: string[];
  preferredJobTypes: JobType[];
  preferredLocations: string[];
  salaryExpectation?: {
    min: number;
    max: number;
    currency: string;
  };
  availability: Date;
  linkedInProfile?: string;
  portfolioUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Student Profile Extension
export interface IStudentProfile {
  _id: string;
  user: string; // User ID
  age?: number;
  educationLevel: EducationLevel;
  completedCourses: string[]; // Course IDs
  certificates: string[]; // Certificate IDs
  jobInterests: string[];
  careerGoals: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Job-Course Matching Interface
export interface IJobCourseMatch {
  _id: string;
  job: string; // Job ID
  course: string; // Course ID
  relevanceScore: number; // 0-100
  matchingSkills: string[];
  createdBy: string; // Super Admin User ID
  createdAt: Date;
}

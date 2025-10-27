// Shared TypeScript types for Excellence Coaching Hub

export enum UserRole {
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
  TEACHER = 'teacher',
  STUDENT = 'student',
  JOB_SEEKER = 'job_seeker',
  PROFESSIONAL = 'professional'
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
  COURSE_REJECTED = 'course_rejected'
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
  isEmailVerified: boolean;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Student Profile Interface
export interface IStudentProfile {
  _id: string;
  userId: string | {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  
  // Personal Information
  dateOfBirth?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  phone?: string;
  address?: IAddress;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  };
  
  // Academic Information
  currentEducationLevel?: 'high_school' | 'undergraduate' | 'graduate' | 'postgraduate' | 'other';
  schoolName?: string;
  fieldOfStudy?: string;
  graduationYear?: number;
  gpa?: number;
  academicInterests?: string[];
  
  // Career Information
  careerGoals?: string;
  preferredCareerPath?: string[];
  workExperience?: IWorkExperience[];
  skills?: string[];
  languages?: string[];
  
  // Learning Preferences
  preferredLearningStyle?: 'visual' | 'auditory' | 'kinesthetic' | 'reading_writing';
  studySchedule?: {
    preferredTime: string;
    studyHoursPerWeek: number;
    availableDays: string[];
  };
  learningGoals?: string[];
  
  // Profile Status
  profileCompletionPercentage: number;
  isProfileComplete: boolean;
  lastUpdated: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

// Address Interface
export interface IAddress {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  sector?: string;
  cell?: string;
  village?: string;
}

// Work Experience Interface
export interface IWorkExperience {
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  description?: string;
  isCurrent: boolean;
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
  recordingUrl?: string;
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

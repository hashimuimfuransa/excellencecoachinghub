export declare enum UserRole {
    ADMIN = "admin",
    TEACHER = "teacher",
    STUDENT = "student"
}
export declare enum CourseStatus {
    DRAFT = "draft",
    PENDING_APPROVAL = "pending_approval",
    APPROVED = "approved",
    REJECTED = "rejected",
    ARCHIVED = "archived"
}
export declare enum QuizType {
    MULTIPLE_CHOICE = "multiple_choice",
    TRUE_FALSE = "true_false",
    SHORT_ANSWER = "short_answer",
    ESSAY = "essay",
    FILL_IN_BLANK = "fill_in_blank"
}
export declare enum ExamStatus {
    SCHEDULED = "scheduled",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    CANCELLED = "cancelled"
}
export declare enum ProctoringEventType {
    FACE_NOT_DETECTED = "face_not_detected",
    MULTIPLE_FACES = "multiple_faces",
    LOOKING_AWAY = "looking_away",
    SUSPICIOUS_MOVEMENT = "suspicious_movement",
    AUDIO_DETECTED = "audio_detected",
    WINDOW_FOCUS_LOST = "window_focus_lost"
}
export declare enum NotificationType {
    COURSE_ENROLLMENT = "course_enrollment",
    ASSIGNMENT_DUE = "assignment_due",
    GRADE_POSTED = "grade_posted",
    COURSE_UPDATE = "course_update",
    EXAM_REMINDER = "exam_reminder",
    PROCTORING_ALERT = "proctoring_alert",
    TEACHER_PROFILE_PENDING = "teacher_profile_pending",
    TEACHER_PROFILE_APPROVED = "teacher_profile_approved",
    TEACHER_PROFILE_REJECTED = "teacher_profile_rejected",
    COURSE_PENDING_APPROVAL = "course_pending_approval",
    COURSE_APPROVED = "course_approved",
    COURSE_REJECTED = "course_rejected",
    LIVE_SESSION_SCHEDULED = "live_session_scheduled",
    LIVE_SESSION_STARTING = "live_session_starting",
    LIVE_SESSION_LIVE = "live_session_live",
    LIVE_SESSION_ENDED = "live_session_ended",
    LIVE_SESSION_CANCELLED = "live_session_cancelled",
    LIVE_SESSION_RECORDED = "live_session_recorded",
    SYSTEM_MAINTENANCE = "system_maintenance",
    SECURITY_ALERT = "security_alert",
    PAYMENT_SUCCESS = "payment_success",
    PAYMENT_FAILED = "payment_failed",
    GENERAL = "general"
}
export declare enum BadgeType {
    COURSE_COMPLETION = "course_completion",
    QUIZ_MASTER = "quiz_master",
    PERFECT_ATTENDANCE = "perfect_attendance",
    EARLY_BIRD = "early_bird",
    STREAK_KEEPER = "streak_keeper"
}
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
export interface ICourse {
    _id: string;
    title: string;
    description: string;
    instructor: string;
    status: CourseStatus;
    thumbnail?: string;
    category: string;
    tags: string[];
    duration: number;
    level: 'beginner' | 'intermediate' | 'advanced';
    price: number;
    enrollmentCount: number;
    rating: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface IQuizQuestion {
    _id: string;
    question: string;
    type: QuizType;
    options?: string[];
    correctAnswer: string | string[];
    explanation?: string;
    points: number;
    difficulty: 'easy' | 'medium' | 'hard';
}
export interface IQuiz {
    _id: string;
    title: string;
    description?: string;
    course: string;
    questions: IQuizQuestion[];
    timeLimit?: number;
    attempts: number;
    passingScore: number;
    isProctored: boolean;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface IExamAttempt {
    _id: string;
    student: string;
    quiz: string;
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
export interface IProctoringSession {
    _id: string;
    examAttempt: string;
    student: string;
    startTime: Date;
    endTime?: Date;
    events: IProctoringEvent[];
    videoRecording?: string;
    screenshots: string[];
    alertCount: number;
    suspiciousActivityScore: number;
}
export interface IProctoringEvent {
    _id: string;
    type: ProctoringEventType;
    timestamp: Date;
    confidence: number;
    description: string;
    screenshot?: string;
    metadata?: Record<string, any>;
}
export interface INotification {
    _id: string;
    recipient: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, any>;
    isRead: boolean;
    createdAt: Date;
}
export interface IBadge {
    _id: string;
    name: string;
    description: string;
    type: BadgeType;
    icon: string;
    criteria: Record<string, any>;
    points: number;
}
export interface IUserProgress {
    _id: string;
    user: string;
    course: string;
    completedLessons: string[];
    completedQuizzes: string[];
    totalTimeSpent: number;
    progressPercentage: number;
    lastAccessed: Date;
    badges: string[];
    totalPoints: number;
}
export interface ILiveSession {
    _id: string;
    title: string;
    course: string;
    instructor: string;
    scheduledTime: Date;
    duration: number;
    meetingUrl?: string;
    participants: string[];
    isRecorded: boolean;
    recordingStatus?: 'not_started' | 'recording' | 'completed' | 'failed';
    recordingUrl?: string;
    recordingSize?: number;
    status: 'scheduled' | 'live' | 'ended' | 'cancelled';
}
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
export interface SocketEvents {
    'user:join': (userId: string) => void;
    'user:leave': (userId: string) => void;
    'proctoring:alert': (data: IProctoringEvent) => void;
    'proctoring:start': (sessionId: string) => void;
    'proctoring:end': (sessionId: string) => void;
    'session:join': (sessionId: string, userId: string) => void;
    'session:leave': (sessionId: string, userId: string) => void;
    'session:hand-raise': (sessionId: string, userId: string) => void;
    'session:emoji': (sessionId: string, userId: string, emoji: string) => void;
    'notification:new': (notification: INotification) => void;
    'notification:read': (notificationId: string) => void;
}
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
//# sourceMappingURL=types.d.ts.map
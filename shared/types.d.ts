export declare enum UserRole {
    ADMIN = "admin",
    SUPER_ADMIN = "super_admin",
    TEACHER = "teacher",
    STUDENT = "student",
    PROFESSIONAL = "professional",
    EMPLOYER = "employer",
    JOB_SEEKER = "job_seeker"
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
    idNumber?: string;
    passport?: string;
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
export declare enum JobStatus {
    DRAFT = "draft",
    ACTIVE = "active",
    PAUSED = "paused",
    CLOSED = "closed",
    EXPIRED = "expired"
}
export declare enum JobType {
    FULL_TIME = "full_time",
    PART_TIME = "part_time",
    CONTRACT = "contract",
    INTERNSHIP = "internship",
    FREELANCE = "freelance"
}
export declare enum ExperienceLevel {
    ENTRY_LEVEL = "entry_level",
    MID_LEVEL = "mid_level",
    SENIOR_LEVEL = "senior_level",
    EXECUTIVE = "executive"
}
export declare enum EducationLevel {
    HIGH_SCHOOL = "high_school",
    ASSOCIATE = "associate",
    BACHELOR = "bachelor",
    MASTER = "master",
    DOCTORATE = "doctorate",
    PROFESSIONAL = "professional"
}
export declare enum ApplicationStatus {
    APPLIED = "applied",
    UNDER_REVIEW = "under_review",
    SHORTLISTED = "shortlisted",
    INTERVIEW_SCHEDULED = "interview_scheduled",
    INTERVIEWED = "interviewed",
    OFFERED = "offered",
    REJECTED = "rejected",
    WITHDRAWN = "withdrawn"
}
export declare enum PsychometricTestType {
    PERSONALITY = "personality",
    COGNITIVE = "cognitive",
    APTITUDE = "aptitude",
    SKILLS = "skills",
    BEHAVIORAL = "behavioral"
}
export declare enum InterviewType {
    TECHNICAL = "technical",
    BEHAVIORAL = "behavioral",
    CASE_STUDY = "case_study",
    GENERAL = "general"
}
export declare enum CertificateType {
    JOB_PREPARATION = "job_preparation",
    COURSE_COMPLETION = "course_completion",
    SKILL_VERIFICATION = "skill_verification",
    INTERVIEW_READINESS = "interview_readiness"
}
export interface IJob {
    _id: string;
    title: string;
    description: string;
    company: string;
    employer: string;
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
    isCurated: boolean;
    curatedBy?: string;
    relatedCourses: string[];
    psychometricTestRequired: boolean;
    psychometricTests: string[];
    applicationsCount: number;
    viewsCount: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface IJobApplication {
    _id: string;
    job: string;
    applicant: string;
    resume: string;
    coverLetter?: string;
    status: ApplicationStatus;
    appliedAt: Date;
    psychometricTestResults: string[];
    interviewResults: string[];
    certificates: string[];
    notes?: string;
    updatedAt: Date;
}
export interface IPsychometricTest {
    _id: string;
    title: string;
    description: string;
    type: PsychometricTestType;
    questions: IPsychometricQuestion[];
    timeLimit: number;
    industry?: string;
    jobRole?: string;
    createdBy: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface IPsychometricQuestion {
    _id: string;
    question: string;
    type: 'multiple_choice' | 'scale' | 'text' | 'scenario';
    options?: string[];
    scaleRange?: {
        min: number;
        max: number;
        labels: string[];
    };
    correctAnswer?: string | number;
    traits?: string[];
    weight: number;
}
export interface IPsychometricTestResult {
    _id: string;
    test: string;
    user: string;
    job?: string;
    answers: Record<string, any>;
    scores: Record<string, number>;
    overallScore: number;
    interpretation: string;
    recommendations: string[];
    completedAt: Date;
    timeSpent: number;
}
export interface IAIInterview {
    _id: string;
    user: string;
    job?: string;
    type: InterviewType;
    questions: IAIInterviewQuestion[];
    responses: IAIInterviewResponse[];
    overallScore: number;
    feedback: string;
    recommendations: string[];
    strengths: string[];
    areasForImprovement: string[];
    completedAt: Date;
    duration: number;
}
export interface IAIInterviewQuestion {
    _id: string;
    question: string;
    type: InterviewType;
    expectedKeywords: string[];
    difficulty: 'easy' | 'medium' | 'hard';
    timeLimit?: number;
}
export interface IAIInterviewResponse {
    questionId: string;
    response: string;
    audioUrl?: string;
    score: number;
    feedback: string;
    keywordsFound: string[];
    responseTime: number;
}
export interface IJobCertificate {
    _id: string;
    user: string;
    type: CertificateType;
    title: string;
    description: string;
    skills: string[];
    issuedBy: string;
    issuedAt: Date;
    expiresAt?: Date;
    verificationCode: string;
    isVerified: boolean;
    relatedJob?: string;
    relatedCourse?: string;
    psychometricTestResults?: string[];
    interviewResults?: string[];
}
export interface IJobSeekerProfile {
    _id: string;
    user: string;
    resume: string;
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
    certifications: string[];
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
export interface IStudentProfile {
    _id: string;
    user: string;
    age?: number;
    educationLevel: EducationLevel;
    completedCourses: string[];
    certificates: string[];
    jobInterests: string[];
    careerGoals: string[];
    createdAt: Date;
    updatedAt: Date;
}
export interface IJobCourseMatch {
    _id: string;
    job: string;
    course: string;
    relevanceScore: number;
    matchingSkills: string[];
    createdBy: string;
    createdAt: Date;
}
//# sourceMappingURL=types.d.ts.map
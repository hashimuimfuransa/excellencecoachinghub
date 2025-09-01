// Re-export all types from individual type files
export * from './job';

// User roles and general enums
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
  PAYMENT_APPROVED = 'payment_approved',
  PAYMENT_REJECTED = 'payment_rejected',
  GENERAL = 'general'
}

export enum BadgeType {
  COURSE_COMPLETION = 'course_completion',
  QUIZ_MASTER = 'quiz_master',
  PERFECT_ATTENDANCE = 'perfect_attendance',
  EARLY_BIRD = 'early_bird',
  STREAK_KEEPER = 'streak_keeper'
}
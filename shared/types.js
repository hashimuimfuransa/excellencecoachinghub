"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CertificateType = exports.InterviewType = exports.PsychometricTestType = exports.ApplicationStatus = exports.EducationLevel = exports.ExperienceLevel = exports.JobType = exports.JobStatus = exports.BadgeType = exports.NotificationType = exports.ProctoringEventType = exports.ExamStatus = exports.QuizType = exports.CourseStatus = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "admin";
    UserRole["SUPER_ADMIN"] = "super_admin";
    UserRole["TEACHER"] = "teacher";
    UserRole["STUDENT"] = "student";
    UserRole["PROFESSIONAL"] = "professional";
    UserRole["EMPLOYER"] = "employer";
    UserRole["JOB_SEEKER"] = "job_seeker";
})(UserRole || (exports.UserRole = UserRole = {}));
var CourseStatus;
(function (CourseStatus) {
    CourseStatus["DRAFT"] = "draft";
    CourseStatus["PENDING_APPROVAL"] = "pending_approval";
    CourseStatus["APPROVED"] = "approved";
    CourseStatus["REJECTED"] = "rejected";
    CourseStatus["ARCHIVED"] = "archived";
})(CourseStatus || (exports.CourseStatus = CourseStatus = {}));
var QuizType;
(function (QuizType) {
    QuizType["MULTIPLE_CHOICE"] = "multiple_choice";
    QuizType["TRUE_FALSE"] = "true_false";
    QuizType["SHORT_ANSWER"] = "short_answer";
    QuizType["ESSAY"] = "essay";
    QuizType["FILL_IN_BLANK"] = "fill_in_blank";
})(QuizType || (exports.QuizType = QuizType = {}));
var ExamStatus;
(function (ExamStatus) {
    ExamStatus["SCHEDULED"] = "scheduled";
    ExamStatus["IN_PROGRESS"] = "in_progress";
    ExamStatus["COMPLETED"] = "completed";
    ExamStatus["CANCELLED"] = "cancelled";
})(ExamStatus || (exports.ExamStatus = ExamStatus = {}));
var ProctoringEventType;
(function (ProctoringEventType) {
    ProctoringEventType["FACE_NOT_DETECTED"] = "face_not_detected";
    ProctoringEventType["MULTIPLE_FACES"] = "multiple_faces";
    ProctoringEventType["LOOKING_AWAY"] = "looking_away";
    ProctoringEventType["SUSPICIOUS_MOVEMENT"] = "suspicious_movement";
    ProctoringEventType["AUDIO_DETECTED"] = "audio_detected";
    ProctoringEventType["WINDOW_FOCUS_LOST"] = "window_focus_lost";
})(ProctoringEventType || (exports.ProctoringEventType = ProctoringEventType = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["COURSE_ENROLLMENT"] = "course_enrollment";
    NotificationType["ASSIGNMENT_DUE"] = "assignment_due";
    NotificationType["GRADE_POSTED"] = "grade_posted";
    NotificationType["COURSE_UPDATE"] = "course_update";
    NotificationType["EXAM_REMINDER"] = "exam_reminder";
    NotificationType["PROCTORING_ALERT"] = "proctoring_alert";
    NotificationType["TEACHER_PROFILE_PENDING"] = "teacher_profile_pending";
    NotificationType["TEACHER_PROFILE_APPROVED"] = "teacher_profile_approved";
    NotificationType["TEACHER_PROFILE_REJECTED"] = "teacher_profile_rejected";
    NotificationType["COURSE_PENDING_APPROVAL"] = "course_pending_approval";
    NotificationType["COURSE_APPROVED"] = "course_approved";
    NotificationType["COURSE_REJECTED"] = "course_rejected";
    NotificationType["LIVE_SESSION_SCHEDULED"] = "live_session_scheduled";
    NotificationType["LIVE_SESSION_STARTING"] = "live_session_starting";
    NotificationType["LIVE_SESSION_LIVE"] = "live_session_live";
    NotificationType["LIVE_SESSION_ENDED"] = "live_session_ended";
    NotificationType["LIVE_SESSION_CANCELLED"] = "live_session_cancelled";
    NotificationType["LIVE_SESSION_RECORDED"] = "live_session_recorded";
    NotificationType["SYSTEM_MAINTENANCE"] = "system_maintenance";
    NotificationType["SECURITY_ALERT"] = "security_alert";
    NotificationType["PAYMENT_SUCCESS"] = "payment_success";
    NotificationType["PAYMENT_FAILED"] = "payment_failed";
    NotificationType["GENERAL"] = "general";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
var BadgeType;
(function (BadgeType) {
    BadgeType["COURSE_COMPLETION"] = "course_completion";
    BadgeType["QUIZ_MASTER"] = "quiz_master";
    BadgeType["PERFECT_ATTENDANCE"] = "perfect_attendance";
    BadgeType["EARLY_BIRD"] = "early_bird";
    BadgeType["STREAK_KEEPER"] = "streak_keeper";
})(BadgeType || (exports.BadgeType = BadgeType = {}));
var JobStatus;
(function (JobStatus) {
    JobStatus["DRAFT"] = "draft";
    JobStatus["ACTIVE"] = "active";
    JobStatus["PAUSED"] = "paused";
    JobStatus["CLOSED"] = "closed";
    JobStatus["EXPIRED"] = "expired";
})(JobStatus || (exports.JobStatus = JobStatus = {}));
var JobType;
(function (JobType) {
    JobType["FULL_TIME"] = "full_time";
    JobType["PART_TIME"] = "part_time";
    JobType["CONTRACT"] = "contract";
    JobType["INTERNSHIP"] = "internship";
    JobType["FREELANCE"] = "freelance";
})(JobType || (exports.JobType = JobType = {}));
var ExperienceLevel;
(function (ExperienceLevel) {
    ExperienceLevel["ENTRY_LEVEL"] = "entry_level";
    ExperienceLevel["MID_LEVEL"] = "mid_level";
    ExperienceLevel["SENIOR_LEVEL"] = "senior_level";
    ExperienceLevel["EXECUTIVE"] = "executive";
})(ExperienceLevel || (exports.ExperienceLevel = ExperienceLevel = {}));
var EducationLevel;
(function (EducationLevel) {
    EducationLevel["HIGH_SCHOOL"] = "high_school";
    EducationLevel["ASSOCIATE"] = "associate";
    EducationLevel["BACHELOR"] = "bachelor";
    EducationLevel["MASTER"] = "master";
    EducationLevel["DOCTORATE"] = "doctorate";
    EducationLevel["PROFESSIONAL"] = "professional";
})(EducationLevel || (exports.EducationLevel = EducationLevel = {}));
var ApplicationStatus;
(function (ApplicationStatus) {
    ApplicationStatus["APPLIED"] = "applied";
    ApplicationStatus["UNDER_REVIEW"] = "under_review";
    ApplicationStatus["SHORTLISTED"] = "shortlisted";
    ApplicationStatus["INTERVIEW_SCHEDULED"] = "interview_scheduled";
    ApplicationStatus["INTERVIEWED"] = "interviewed";
    ApplicationStatus["OFFERED"] = "offered";
    ApplicationStatus["REJECTED"] = "rejected";
    ApplicationStatus["WITHDRAWN"] = "withdrawn";
})(ApplicationStatus || (exports.ApplicationStatus = ApplicationStatus = {}));
var PsychometricTestType;
(function (PsychometricTestType) {
    PsychometricTestType["PERSONALITY"] = "personality";
    PsychometricTestType["COGNITIVE"] = "cognitive";
    PsychometricTestType["APTITUDE"] = "aptitude";
    PsychometricTestType["SKILLS"] = "skills";
    PsychometricTestType["BEHAVIORAL"] = "behavioral";
})(PsychometricTestType || (exports.PsychometricTestType = PsychometricTestType = {}));
var InterviewType;
(function (InterviewType) {
    InterviewType["TECHNICAL"] = "technical";
    InterviewType["BEHAVIORAL"] = "behavioral";
    InterviewType["CASE_STUDY"] = "case_study";
    InterviewType["GENERAL"] = "general";
})(InterviewType || (exports.InterviewType = InterviewType = {}));
var CertificateType;
(function (CertificateType) {
    CertificateType["JOB_PREPARATION"] = "job_preparation";
    CertificateType["COURSE_COMPLETION"] = "course_completion";
    CertificateType["SKILL_VERIFICATION"] = "skill_verification";
    CertificateType["INTERVIEW_READINESS"] = "interview_readiness";
})(CertificateType || (exports.CertificateType = CertificateType = {}));
//# sourceMappingURL=types.js.map
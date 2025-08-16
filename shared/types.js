"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BadgeType = exports.NotificationType = exports.ProctoringEventType = exports.ExamStatus = exports.QuizType = exports.CourseStatus = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "admin";
    UserRole["TEACHER"] = "teacher";
    UserRole["STUDENT"] = "student";
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
//# sourceMappingURL=types.js.map
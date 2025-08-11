// Export all models from a central location
export { User, IUserDocument, IUserModel } from './User';
export { Course, ICourseDocument, ICourseModel, ICourseContent } from './Course';
export { Quiz, IQuizDocument, IQuizModel, IQuizQuestionDocument } from './Quiz';
export { ExamAttempt, IExamAttemptDocument, IExamAttemptModel } from './ExamAttempt';
export { ProctoringSession, IProctoringSessionDocument, IProctoringSessionModel, IProctoringEventDocument } from './ProctoringSession';
export { Notification, INotificationDocument, INotificationModel } from './Notification';
export { Badge, IBadgeDocument, IBadgeModel } from './Badge';
export { UserBadge, IUserBadgeDocument, IUserBadgeModel } from './UserBadge';
export { Enrollment, IEnrollmentDocument, IEnrollmentModel } from './Enrollment';
export { QuizAttempt, IQuizAttemptDocument, IQuizAttemptModel } from './QuizAttempt';
export { UserProgress, IUserProgressDocument, IUserProgressModel } from './UserProgress';
export { LiveSession, ILiveSessionDocument, ILiveSessionModel } from './LiveSession';
export { Attendance, IAttendanceDocument, IAttendanceModel } from './Attendance';
export { Assessment, IAssessmentDocument, IAssessmentModel } from './Assessment';
export { AssessmentSubmission, IAssessmentSubmissionDocument, IAssessmentSubmissionModel } from './AssessmentSubmission';
export { CourseNotes, ICourseNotesDocument, ICourseNotesModel } from './CourseNotes';
export { ReadingProgress, IReadingProgressDocument, IReadingProgressModel } from './ReadingProgress';
export { VideoProctoringSession, IVideoProctoringSessionDocument, IVideoProctoringSessionModel, IVideoViolation } from './VideoProctoringSession';
export { default as Feedback, IFeedback } from './Feedback';
export { default as VideoProvider, IVideoProvider } from './VideoProvider';
export { default as Certificate, ICertificate } from './Certificate';

// Re-export shared types for convenience
export {
  UserRole,
  CourseStatus,
  QuizType,
  ExamStatus,
  ProctoringEventType,
  NotificationType,
  BadgeType
} from '../../../shared/types';

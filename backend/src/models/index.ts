// Export all models from a central location
export { User, IUserDocument, IUserModel } from './User';
export { Course, ICourseDocument, ICourseModel, ICourseContent } from './Course';
export { Quiz, IQuizDocument, IQuizModel, IQuizQuestionDocument } from './Quiz';
export { ExamAttempt, IExamAttemptDocument, IExamAttemptModel } from './ExamAttempt';
export { ProctoringSession, IProctoringSessionDocument, IProctoringSessionModel, IProctoringEventDocument } from './ProctoringSession';
export { Notification, INotificationDocument, INotificationModel } from './Notification';
export { PushSubscription, IPushSubscription } from './PushSubscription';
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
export { Week, IWeekDocument } from './Week';
export { StudentProgress, WeekProgress, IStudentProgressDocument, IWeekProgressDocument } from './StudentProgress';
export { VideoProctoringSession, IVideoProctoringSessionDocument, IVideoProctoringSessionModel, IVideoViolation } from './VideoProctoringSession';
export { default as Feedback, IFeedback } from './Feedback';
export { default as VideoProvider, IVideoProvider } from './VideoProvider';
export { default as Certificate, ICertificate } from './Certificate';
export { default as RecordedSession, IRecordedSession } from './RecordedSession';
export { default as UploadedVideo, IUploadedVideo } from './UploadedVideo';
export { Assignment, AssignmentSubmission, IAssignment, IAssignmentSubmission } from './Assignment';
export { EmailEvent, IEmailEvent } from './EmailEvent';
export { default as EmailTracker, IEmailTracker, EmailType } from './EmailTracker';
export { Annotation, IAnnotation } from './Annotation';
export { Announcement, IAnnouncementDocument, IAnnouncementModel } from './Announcement';

// Past Papers Models
export { PastPaper, IPastPaperDocument, IPastPaperModel } from './PastPaper';
export { PastPaperAttempt, IPastPaperAttemptDocument, IPastPaperAttemptModel } from './PastPaperAttempt';

// Job Portal Models
export { Job, IJobDocument, IJobModel } from './Job';
export { Internship, IInternshipDocument, IInternshipModel } from './Internship';
export { JobApplication, IJobApplicationDocument, IJobApplicationModel } from './JobApplication';
export { PsychometricTest, IPsychometricTestDocument, IPsychometricTestModel, IPsychometricQuestionDocument } from './PsychometricTest';
export { PsychometricTestResult, IPsychometricTestResultDocument, IPsychometricTestResultModel } from './PsychometricTestResult';
export { GeneratedPsychometricTest, IGeneratedPsychometricTestDocument, IGeneratedPsychometricTestModel } from './GeneratedPsychometricTest';
export { TestPurchase, ITestPurchaseDocument, ITestPurchaseModel } from './TestPurchase';
export { TestSession, ITestSessionDocument, ITestSessionModel } from './TestSession';
export { AIInterview, IAIInterviewDocument, IAIInterviewModel, IAIInterviewQuestionDocument, IAIInterviewResponseDocument } from './AIInterview';
export { JobCertificate, IJobCertificateDocument, IJobCertificateModel } from './JobCertificate';
export { JobSeekerProfile, IJobSeekerProfileDocument, IJobSeekerProfileModel } from './JobSeekerProfile';
export { StudentProfile, IStudentProfileDocument, IStudentProfileModel } from './StudentProfile';
export { JobCourseMatch, IJobCourseMatchDocument, IJobCourseMatchModel } from './JobCourseMatch';
export { InterviewSession, IInterviewSessionDocument, IInterviewSessionModel } from './InterviewSession';
export { TestRequest, ITestRequestDocument, ITestRequestModel } from './TestRequest';
export { SmartTest, ISmartTest, ISmartTestQuestion } from './SmartTest';
export { SmartTestResult, ISmartTestResult, ISmartTestDetailedResult, ISmartTestFeedback } from './SmartTestResult';

// Social Network Models
export { Post, IPostDocument, IPostModel } from './Post';
export { Comment, ICommentDocument, ICommentModel } from './Comment';
export { Connection, IConnectionDocument, IConnectionModel } from './Connection';
export { Company, ICompanyDocument, ICompanyModel } from './Company';
export { Event, IEventDocument, IEventModel } from './Event';
export { CareerInsight, ICareerInsightDocument, ICareerInsightModel } from './CareerInsight';
export { Story, IStory } from './Story';

// Chat Models
export { Chat, ChatMessage, IChat, IChatMessage } from './Chat';

// Re-export shared types for convenience
export {
  UserRole,
  CourseStatus,
  QuizType,
  ExamStatus,
  ProctoringEventType,
  NotificationType,
  BadgeType,
  // Job Portal Types
  JobStatus,
  JobType,
  ExperienceLevel,
  EducationLevel,
  ApplicationStatus,
  PsychometricTestType,
  InterviewType,
  CertificateType
} from '../types';

import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Box } from '@mui/material';

// Import components
import Layout from './components/Layout/Layout';
import PublicLayout from './components/Layout/PublicLayout';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import RouteHandler from './components/Router/RouteHandler';

// Import pages
import HomePage from './pages/Home/HomePage';
import AboutPage from './pages/About/AboutPage';
import ContactPage from './pages/Contact/ContactPage';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import EmailVerificationPage from './pages/Auth/EmailVerificationPage';
import ForgotPasswordPage from './pages/Auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/Auth/ResetPasswordPage';
import TestEmailPage from './pages/Auth/TestEmailPage';
import EmailSystemDemo from './pages/Auth/EmailSystemDemo';



import AdminDashboard from './pages/Admin/AdminDashboard';
import TeacherDashboard from './pages/Teacher/TeacherDashboard';
import TeacherProfile from './pages/Teacher/TeacherProfile';
import TeacherProfileComplete from './pages/Teacher/TeacherProfileComplete';
import TeacherCourses from './pages/Teacher/TeacherCourses';
import CourseManagement from './pages/Teacher/CourseManagement';
import MaterialView from './pages/Student/MaterialView';
import StudentQuizPage from './pages/Student/QuizPage';
import CertificatePage from './pages/Student/CertificatePage';
import StudentCourseView from './pages/Student/StudentCourseView';
import CourseContent from './pages/Student/CourseContent';
import TeacherStudents from './pages/Teacher/TeacherStudents';
import TeacherAnalytics from './pages/Teacher/TeacherAnalytics';
import CreateCourse from './pages/Teacher/CreateCourse';
import LiveSessions from './pages/Teacher/LiveSessions';
import CreateLiveSession from './pages/Teacher/CreateLiveSession';
import LiveSessionRoom from './pages/Teacher/LiveSessionRoom';
import TestPage from './pages/Teacher/TestPage';
import TeacherSettings from './pages/Teacher/TeacherSettings';
import StudentManagement from './pages/Teacher/StudentManagement';
import CourseMaterials from './pages/Teacher/CourseMaterials';
import RecordedSessionDetails from './pages/Teacher/RecordedSessionDetails';
import StudentDashboard from './pages/Student/StudentDashboard';
import Overview from './pages/Student/Overview';
import StudentCourses from './pages/Student/StudentCourses';
import Assessments from './pages/Student/Assessments';
import TakeAssessment from './pages/Student/TakeAssessment';
import EnhancedAssessments from './pages/Student/EnhancedAssessments';
import UnifiedLearningPage from './pages/Student/UnifiedLearningPage';
import TeacherCourseDashboard from './pages/Teacher/TeacherCourseDashboard';
import ContentStructureEditor from './pages/Teacher/ContentStructureEditor';
import CourseEnrollmentSystem from './components/Course/CourseEnrollmentSystem';
import CommunityRouter from './pages/Community/CommunityRouter';
import EnhancedTakeAssessmentStudent from './pages/Student/EnhancedTakeAssessment';
import EnhancedTakeAssessmentWithProctoring from './pages/Student/EnhancedTakeAssessmentWithProctoring';
import ProctoringTest from './pages/Test/ProctoringTest';
import AssessmentProctoringTest from './pages/Test/AssessmentProctoringTest';
import StudentLiveSessions from './pages/Student/LiveSessions';
import StudentLiveSessionRoom from './pages/Student/LiveSessionRoom';
import Progress from './pages/Student/Progress';
import AIAssistantPage from './pages/Student/AIAssistantPage';
import StudentSettings from './pages/Student/StudentSettings';
import RecordedSessionsPage from './pages/Student/RecordedSessionsPage';
import CourseViewPage from './pages/Student/CourseViewPage';
import CourseMaterialPage from './pages/Student/CourseMaterialPage';

import EnhancedCourseViewPage from './pages/Student/EnhancedCourseViewPage';
import EnhancedVideoSessionPage from './pages/Student/EnhancedVideoSessionPage';
import CourseEnrollmentPage from './pages/Student/CourseEnrollmentPage';
import NotesPreviewPage from './pages/Teacher/NotesPreviewPage';
import CourseAssignmentsPage from './pages/Student/CourseAssignmentsPage';
import CourseAssessmentsPage from './pages/Student/CourseAssessmentsPage';
import CourseAnnouncementsPage from './pages/Student/CourseAnnouncementsPage';
import TakeAssessmentStandalone from './pages/Assessment/TakeAssessment';
import EnhancedTakeAssessment from './pages/Assessment/EnhancedTakeAssessment';
import AssessmentResults from './pages/Assessment/AssessmentResults';
import EnhancedWorkOnAssignment from './pages/Assignment/EnhancedWorkOnAssignment';
import EnhancedTakeAssignment from './pages/Assignment/EnhancedTakeAssignment';
import TakeExamNew from './pages/Assignment/TakeExam';
import AssignmentResults from './pages/Assignment/AssignmentResults';
import EnhancedAssignmentPage from './pages/Student/EnhancedAssignmentPage';
import CoursesPage from './pages/Courses/CoursesPage';
import CourseDetailPage from './pages/Courses/CourseDetailPage';
import QuizPage from './pages/Quiz/QuizPage';
import TakeExamPage from './pages/Exam/TakeExamPage';
import ExamResultsPage from './pages/Exam/ExamResultsPage';
import ExamListPage from './pages/Exam/ExamListPage';
import ExamTestPage from './pages/Test/ExamTestPage';
import ProfilePage from './pages/Profile/ProfilePage';
import NotificationPage from './pages/Notifications/NotificationPage';
import NotFoundPage from './pages/NotFound/NotFoundPage';
import ProctoringDashboard from './pages/Admin/ProctoringDashboard';
import ProctoringMonitoring from './pages/Admin/ProctoringMonitoring';
import GradesAndLeaderboard from './pages/Student/GradesAndLeaderboard';
import StudentLeaderboard from './pages/Student/StudentLeaderboard';
import TeacherGradesLeaderboard from './pages/Teacher/TeacherGradesLeaderboard';
import AssignmentGradingDashboard from './pages/Teacher/AssignmentGradingDashboard';
import AssignmentView from './pages/Student/AssignmentView';

// Career Guidance Pages
import CareerGuidancePage from './pages/Career/CareerGuidancePage';
import CareerAssessmentFlow from './pages/Career/CareerAssessmentFlow';
import CareerAssessmentResults from './pages/CareerAssessment/CareerAssessmentResults';
import StudentOpportunitiesPage from './pages/Student/StudentOpportunities';


// Import hooks
import { useAuth } from './hooks/useAuth';
import { UserRole } from './shared/types';
// EmailJS removed - now using backend SendGrid service

const App: React.FC = () => {
  const { user, loading } = useAuth();

  // EmailJS removed - now using backend SendGrid service
  React.useEffect(() => {
    console.log('📧 Email service now handled entirely by backend SendGrid');
  }, []);

  // Handle unhandled promise rejections
  React.useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      // Prevent the default browser behavior
      event.preventDefault();
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        Loading...
      </Box>
    );
  }

  return (
    <>
      <RouteHandler />
      <Routes>
        {/* Auth routes (no layout) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<EmailVerificationPage />} />
        <Route path="/test-email" element={<TestEmailPage />} />
        <Route path="/email-demo" element={<EmailSystemDemo />} />
        <Route path="/test-assessment-proctoring" element={<AssessmentProctoringTest />} />



      {/* Public routes with public layout */}
      <Route path="/" element={<PublicLayout />}>
        <Route index element={user ? <Navigate to="/dashboard" replace /> : <HomePage />} />
        <Route path="courses" element={<CoursesPage />} />
        <Route path="courses/:id" element={<CourseDetailPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="help" element={<div>Help Center - Coming Soon</div>} />
        <Route path="privacy" element={<div>Privacy Policy - Coming Soon</div>} />
        <Route path="terms" element={<div>Terms of Service - Coming Soon</div>} />
      </Route>

      {/* Community routes with standalone layout (no public navbar/footer) */}
      <Route path="community/*" element={<CommunityRouter />} />

      {/* Protected dashboard routes with authenticated layout */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard routes based on user role */}
        <Route
          index
          element={
            user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN ? (
              <Navigate to="/dashboard/admin" replace />
            ) : user?.role === UserRole.TEACHER ? (
              <Navigate to="/dashboard/teacher" replace />
            ) : (
              <Navigate to="/dashboard/student" replace />
            )
          }
        />

        {/* Role-specific dashboards */}
        <Route
          path="admin/*"
          element={
            <ProtectedRoute requiredRole={UserRole.ADMIN}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        


        <Route
          path="teacher"
          element={
            <ProtectedRoute requiredRole={UserRole.TEACHER}>
              <Outlet />
            </ProtectedRoute>
          }
        >
          <Route index element={<TeacherDashboard />} />
          <Route path="profile" element={<TeacherProfile />} />
          <Route path="profile/complete" element={<TeacherProfileComplete />} />
          <Route path="profile/edit" element={<TeacherProfileComplete />} />
          
          {/* Teacher routes */}
          <Route path="courses" element={<TeacherCourses />} />
          <Route path="courses/create" element={<CreateCourse />} />
          <Route path="courses/:courseId/manage" element={<CourseManagement />} />
          <Route path="courses/:id/content" element={<ContentStructureEditor />} />
          <Route path="courses/:courseId/materials" element={<CourseMaterials />} />
          <Route path="live-sessions" element={<LiveSessions />} />
          <Route path="live-sessions/create" element={<CreateLiveSession />} />
          <Route path="live-sessions/:id/room" element={<LiveSessionRoom />} />
          <Route path="students" element={<TeacherStudents />} />
          <Route path="student-management" element={<StudentManagement />} />
          <Route path="analytics" element={<TeacherAnalytics />} />
          <Route path="recorded-session/:sessionId" element={<RecordedSessionDetails />} />
          <Route path="grades" element={<TeacherGradesLeaderboard />} />
          <Route path="grades/:courseId" element={<TeacherGradesLeaderboard />} />
          <Route path="assignments/:assignmentId/grading" element={<AssignmentGradingDashboard />} />
          <Route path="settings" element={<TeacherSettings />} />
          <Route path="test" element={<TestPage />} />
        </Route>

        {/* Student Dashboard Routes */}
        <Route
          path="student"
          element={
            <ProtectedRoute requiredRole={UserRole.STUDENT}>
              <Outlet />
            </ProtectedRoute>
          }
        >
          <Route index element={<StudentDashboard />} />
          <Route path="overview" element={<Overview />} />
          <Route path="courses" element={<StudentCourses />} />
          <Route path="course-content" element={<CourseContent />} />
          <Route path="course-content/:id" element={<CourseContent />} />
          {/* Learning Page Route */}
          <Route path="course/:id/learn" element={<UnifiedLearningPage />} />
          <Route path="course/:id/weeks" element={<StudentCourseView />} />
          <Route path="course/:courseId/materials/:materialId" element={<MaterialView />} />
          <Route path="course/:id/enroll" element={<CourseEnrollmentSystem courseId="" onEnrollmentComplete={() => {}} />} />
          <Route path="course/:id/material" element={<CourseMaterialPage />} />
          <Route path="course/:id/live-sessions" element={<StudentLiveSessions />} />
          <Route path="course/:id/announcements" element={<CourseAnnouncementsPage />} />
          <Route path="course/:id" element={<CourseViewPage />} />
          <Route path="quiz/:quizId" element={<StudentQuizPage />} />
          <Route path="certificate/:certificateId" element={<CertificatePage />} />
          <Route path="assignment/:assignmentId" element={<TakeExamNew />} />
          <Route path="assignment/:assignmentId/enhanced" element={<TakeExamNew />} />
          <Route path="assignment/:assignmentId/results" element={<AssignmentResults />} />
          <Route path="assignments/:assignmentId" element={<AssignmentView />} />
          <Route path="live-sessions" element={<StudentLiveSessions />} />
          <Route path="live-sessions/:sessionId/room" element={<StudentLiveSessionRoom />} />
          <Route path="progress" element={<Progress />} />
          <Route path="ai-assistant" element={<AIAssistantPage />} />
          <Route path="recorded-sessions" element={<RecordedSessionsPage />} />
          <Route path="grades" element={<GradesAndLeaderboard />} />
          <Route path="leaderboard" element={<StudentLeaderboard />} />
          <Route path="career" element={<CareerGuidancePage />} />
          <Route path="career/assessment/:assessmentId" element={<CareerAssessmentFlow />} />
          <Route path="career/assessment/:assessmentId/results" element={<CareerAssessmentResults />} />
          <Route path="opportunities" element={<StudentOpportunitiesPage />} />
          <Route path="settings" element={<StudentSettings />} />
        </Route>

        {/* Common protected routes */}
        <Route path="notifications" element={<NotificationPage />} />
        <Route path="quiz/:id" element={<QuizPage />} />
        <Route path="exams" element={<ExamListPage />} />
        <Route path="exam/:examId/take" element={<TakeExamPage />} />
        <Route path="exam/:examId/results" element={<ExamResultsPage />} />
        <Route path="exam-test" element={<ExamTestPage />} />
        {/* Profile route removed - using direct navigation */}
        <Route path="courses/:id/content" element={<CourseContent />} />
      </Route>

      {/* Full-screen routes (outside dashboard layout) */}
      {/* Live Sessions Page (outside dashboard) */}
      <Route
        path="/live-sessions"
        element={
          <ProtectedRoute requiredRole={UserRole.STUDENT}>
            <StudentLiveSessions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/video-session/student/:sessionId"
        element={
          <ProtectedRoute requiredRole={UserRole.STUDENT}>
            <StudentLiveSessionRoom />
          </ProtectedRoute>
        }
      />
      <Route
        path="/video-session/teacher/:sessionId"
        element={
          <ProtectedRoute requiredRole={UserRole.TEACHER}>
            <LiveSessionRoom />
          </ProtectedRoute>
        }
      />
      <Route
        path="/enhanced-notes/:id"
        element={
          <ProtectedRoute requiredRole={UserRole.STUDENT}>
            <CourseMaterialPage />
          </ProtectedRoute>
        }
      />
      {/* Course Enrollment Page (outside dashboard) */}
      <Route
        path="/courses"
        element={
          <ProtectedRoute requiredRole={UserRole.STUDENT}>
            <CourseEnrollmentPage />
          </ProtectedRoute>
        }
      />
      {/* Course Enrollment Page (outside dashboard) */}
      <Route
        path="/course/:id/enroll"
        element={
          <ProtectedRoute requiredRole={UserRole.STUDENT}>
            <CourseEnrollmentPage />
          </ProtectedRoute>
        }
      />
      {/* Enhanced Course View (outside dashboard) */}
      <Route
        path="/course/:id"
        element={
          <ProtectedRoute requiredRole={UserRole.STUDENT}>
            <EnhancedCourseViewPage />
          </ProtectedRoute>
        }
      />
      {/* Enhanced Video Sessions (outside dashboard) */}
      <Route
        path="/video-sessions/:courseId"
        element={
          <ProtectedRoute requiredRole={UserRole.STUDENT}>
            <EnhancedVideoSessionPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/video-sessions/:courseId/:sessionId"
        element={
          <ProtectedRoute requiredRole={UserRole.STUDENT}>
            <EnhancedVideoSessionPage />
          </ProtectedRoute>
        }
      />
      
      {/* Standalone Assessment and Assignment Pages */}
      <Route
        path="/course/:id/assignments"
        element={
          <ProtectedRoute requiredRole={UserRole.STUDENT}>
            <CourseAssignmentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/course/:id/assessments"
        element={
          <ProtectedRoute requiredRole={UserRole.STUDENT}>
            <CourseAssessmentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/assessments"
        element={
          <ProtectedRoute requiredRole={UserRole.STUDENT}>
            <Assessments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/enhanced-assessments"
        element={
          <ProtectedRoute requiredRole={UserRole.STUDENT}>
            <EnhancedAssessments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/assessment/:assessmentId/take"
        element={
          <ProtectedRoute requiredRole={UserRole.STUDENT}>
            <EnhancedTakeAssessment />
          </ProtectedRoute>
        }
      />
      <Route
        path="/enhanced-assessment/:assessmentId"
        element={
          <ProtectedRoute requiredRole={UserRole.STUDENT}>
            <EnhancedTakeAssessmentStudent />
          </ProtectedRoute>
        }
      />
      <Route
        path="/assessments/:assessmentId/take"
        element={
          <ProtectedRoute requiredRole={UserRole.STUDENT}>
            <TakeAssessment />
          </ProtectedRoute>
        }
      />
      <Route
        path="/proctored-assessment/:id/take"
        element={
          <ProtectedRoute requiredRole={UserRole.STUDENT}>
            <EnhancedTakeAssessmentWithProctoring />
          </ProtectedRoute>
        }
      />
      <Route
        path="/proctoring-test"
        element={
          <ProtectedRoute>
            <ProctoringTest />
          </ProtectedRoute>
        }
      />
      <Route
        path="/assessment/:assessmentId/results"
        element={
          <ProtectedRoute requiredRole={UserRole.STUDENT}>
            <AssessmentResults />
          </ProtectedRoute>
        }
      />
      <Route
        path="/assignment/:assignmentId/work"
        element={
          <ProtectedRoute requiredRole={UserRole.STUDENT}>
            <TakeExamNew />
          </ProtectedRoute>
        }
      />
      <Route
        path="/assignment/:assignmentId/take"
        element={
          <ProtectedRoute requiredRole={UserRole.STUDENT}>
            <TakeExamNew />
          </ProtectedRoute>
        }
      />
      <Route
        path="/assignment/:assignmentId/results"
        element={
          <ProtectedRoute requiredRole={UserRole.STUDENT}>
            <AssignmentResults />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/notes-preview/:noteId"
        element={
          <ProtectedRoute requiredRole={UserRole.TEACHER}>
            <NotesPreviewPage />
          </ProtectedRoute>
        }
      />
      
      {/* Standalone Student Courses Page - Outside Dashboard Layout */}
      <Route
        path="/courses"
        element={
          <ProtectedRoute requiredRole={UserRole.STUDENT}>
            <StudentCourses />
          </ProtectedRoute>
        }
      />
      
      {/* 404 route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </>
  );
};

export default App;

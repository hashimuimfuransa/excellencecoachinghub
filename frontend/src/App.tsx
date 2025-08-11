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
import TeacherCourses from './pages/Teacher/TeacherCourses';
import CourseManagement from './pages/Teacher/CourseManagement';
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
import StudentDashboard from './pages/Student/StudentDashboard';
import Overview from './pages/Student/Overview';
import StudentCourses from './pages/Student/StudentCourses';
import Assessments from './pages/Student/Assessments';
import TakeAssessment from './pages/Student/TakeAssessment';
import EnhancedAssessments from './pages/Student/EnhancedAssessments';
import EnhancedTakeAssessment from './pages/Student/EnhancedTakeAssessment';
import StudentLiveSessions from './pages/Student/LiveSessions';
import StudentLiveSessionRoom from './pages/Student/LiveSessionRoom';
import Progress from './pages/Student/Progress';
import AIAssistantPage from './pages/Student/AIAssistantPage';
import StudentSettings from './pages/Student/StudentSettings';
import RecordedSessionsPage from './pages/Student/RecordedSessionsPage';
import CoursesPage from './pages/Courses/CoursesPage';
import CourseDetailPage from './pages/Courses/CourseDetailPage';
import QuizPage from './pages/Quiz/QuizPage';
import ProfilePage from './pages/Profile/ProfilePage';
import NotificationPage from './pages/Notifications/NotificationPage';
import NotFoundPage from './pages/NotFound/NotFoundPage';

// Import hooks
import { useAuth } from './hooks/useAuth';
import { UserRole } from './shared/types';
import { initEmailJS } from './services/emailjsService';

const App: React.FC = () => {
  const { user, loading } = useAuth();

  // Initialize EmailJS on app start
  React.useEffect(() => {
    initEmailJS();
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
            user?.role === UserRole.ADMIN ? (
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
          <Route path="courses" element={<TeacherCourses />} />
          <Route path="courses/create" element={<CreateCourse />} />
          <Route path="courses/:id/manage" element={<CourseManagement />} />
          <Route path="courses/:courseId/materials" element={<CourseMaterials />} />
          <Route path="live-sessions" element={<LiveSessions />} />
          <Route path="live-sessions/create" element={<CreateLiveSession />} />
          <Route path="live-sessions/:id/room" element={<LiveSessionRoom />} />
          <Route path="students" element={<TeacherStudents />} />
          <Route path="student-management" element={<StudentManagement />} />
          <Route path="analytics" element={<TeacherAnalytics />} />
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
          <Route path="assessments" element={<Assessments />} />
          <Route path="assessments/:assessmentId/take" element={<TakeAssessment />} />
          <Route path="enhanced-assessments" element={<EnhancedAssessments />} />
          <Route path="enhanced-assessment/:assessmentId" element={<EnhancedTakeAssessment />} />
          <Route path="live-sessions" element={<StudentLiveSessions />} />
          <Route path="live-sessions/:sessionId/room" element={<StudentLiveSessionRoom />} />
          <Route path="progress" element={<Progress />} />
          <Route path="ai-assistant" element={<AIAssistantPage />} />
          <Route path="recorded-sessions" element={<RecordedSessionsPage />} />
          <Route path="settings" element={<StudentSettings />} />
        </Route>

        {/* Common protected routes */}
        <Route path="notifications" element={<NotificationPage />} />
        <Route path="quiz/:id" element={<QuizPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="courses/:id/content" element={<CourseContent />} />
      </Route>

      {/* 404 route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </>
  );
};

export default App;

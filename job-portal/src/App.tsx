import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, UserRole } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { GlobalVideoProvider } from './contexts/GlobalVideoContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
// EmailJS removed - now using backend SendGrid service
import { pushNotificationService } from './services/pushNotificationService';
import { jobEmailService } from './services/jobEmailService';
import EmailApiHandler from './components/EmailApiHandler';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import all pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import JobsPage from './pages/ModernJobsPage';
import JobDetailsPage from './pages/JobDetailsPage';
import ApplicationsPage from './pages/ApplicationsPage';
import ApplicationDetailsPage from './pages/ApplicationDetailsPage';
import ImprovedProfilePage from './pages/ImprovedProfilePage';
import MinimizedProfilePage from './pages/MinimizedProfilePage';
import ProfileEditPage from './pages/ProfileEditPage';
import SummaryProfilePage from './pages/SummaryProfilePage';
import ProfessionalProfilePage from './pages/ProfessionalProfilePage';
import ModernProfilePage from './pages/ModernProfilePage';
import SavedJobsPage from './pages/SavedJobsPage';
import CertificatesPage from './pages/CertificatesPage';
import CoursesPage from './pages/CoursesPage';
import AIInterviewsPage from './pages/AIInterviewsPage';
import StandaloneInterviewPage from './pages/StandaloneInterviewPage';
import PsychometricTestsPage from './pages/PsychometricTestsPage';
import TestTakingPage from './pages/TestTakingPage';
import TestPage from './pages/TestPage';
import FreeTestPage from './pages/FreeTestPage';
import TestDetailsPage from './pages/TestDetailsPage';
import SavedCardsManager from './components/SavedCardsManager';
import CreateJobPage from './pages/CreateJobPage';
import CreateInternshipPage from './pages/CreateInternshipPage';
import EmployerJobsPage from './pages/EmployerJobsPage';
import EmployerInternshipsPage from './pages/EmployerInternshipsPage';
import EmployerCandidatesPage from './pages/EmployerCandidatesPage';

import JobApplicationsPage from './pages/JobApplicationsPage';
import PsychometricResultsPage from './pages/PsychometricResultsPage';
import InterviewResultsPage from './pages/InterviewResultsPage';
import InterviewFeedbackPage from './pages/InterviewFeedbackPage';
import InterviewHistoryPage from './pages/InterviewHistoryPage';
import AllJobsPage from './pages/AllJobsPage';
import InternshipsPage from './pages/InternshipsPage';
import SkillsPage from './pages/SkillsPage';
import EmployerTalentPoolPage from './pages/EmployerTalentPoolPage';
import EmployerSavedCandidatesPage from './pages/EmployerSavedCandidatesPage';
import EmployerHiredPage from './pages/EmployerHiredPage';
import EmployerInterviewsPage from './pages/EmployerInterviewsPage';
import EmployerAnalyticsPage from './pages/EmployerAnalyticsPage';
import EmployerCompanyProfilePage from './pages/EmployerCompanyProfilePage';
import EmployerProfilePage from './pages/EmployerProfilePage';
// import CompaniesPage from './pages/CompaniesPage';  // Removed - Companies page no longer available
import SupportPage from './pages/SupportPage';
import CareerGuidancePage from './pages/CareerGuidancePage';
import JobPreparationPage from './pages/JobPreparationPage';
import CareerAssessmentFlow from './pages/CareerAssessmentFlow';
import CareerAssessmentResultsPage from './pages/CareerAssessmentResultsPage';
import CVUploadTest from './components/CVUploadTest';
import SimplifiedTestTaking from './pages/SimplifiedTestTaking';
import SimplifiedTestResult from './pages/SimplifiedTestResult';
import SmartTestPage from './pages/SmartTestPage';
import TakeSmartTestPage from './pages/TakeSmartTestPage';
import SmartTestResultsPage from './pages/SmartTestResultsPage';
import QuickApplyPage from './pages/QuickApplyPage';
import EnhancedCVBuilderPage from './pages/EnhancedCVBuilderPage';
import SimpleCVBuilderPage from './pages/SimpleCVBuilderPage';
import OptimizedCVBuilderPage from './pages/OptimizedCVBuilderPage';

// Smart Home component
import SmartHome from './components/SmartHome';

// Social Network pages
import SocialNetworkPage from './pages/SocialNetworkPage';
import ViewStoriesPage from './pages/ViewStoriesPage';
import NetworkPage from './pages/NetworkPage';
import NotificationsPage from './pages/NotificationsPage';
import SearchPage from './pages/SearchPage';

// Career Insights page
import CareerInsightsPage from './pages/CareerInsightsPage';

// Chat components
import FloatingChatButton from './components/chat/FloatingChatButton';
import MessagesPage from './pages/MessagesPage';

// Debug components
import StoryDebugger from './components/debug/StoryDebugger';

function App() {
  // Initialize services on app start
  useEffect(() => {
    // EmailJS removed - now using backend SendGrid service
    console.log('📧 Email service now handled entirely by backend SendGrid');
    
    // Initialize push notifications
    pushNotificationService.init().catch(console.error);
    
    // Start job email service for periodic checking
    jobEmailService.start();
    console.log('🚀 Job email service started automatically');
    
    // Cleanup function to stop service when app unmounts
    return () => {
      jobEmailService.stop();
    };
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <GlobalVideoProvider>
          <EmailApiHandler isActive={true} />
          <Router>
          <Routes>
            {/* Smart Home Route - redirects authenticated users to network */}
            <Route path="/" element={<SmartHome />} />
            <Route path="/jobs" element={<AllJobsPage />} />
            <Route 
              path="/jobs/:id" 
              element={
                <ProtectedRoute>
                  <JobDetailsPage />
                </ProtectedRoute>
              } 
            />
            <Route path="/internships" element={<InternshipsPage />} />
            <Route path="/skills" element={<SkillsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            {/* <Route path="/companies" element={<CompaniesPage />} /> */}  {/* Removed - Companies page no longer available */}
            <Route path="/support" element={<SupportPage />} />
            <Route path="/home" element={<HomePage />} />
            
            {/* CV Upload Test - Public for testing */}
            <Route path="/cv-upload-test" element={<CVUploadTest />} />
            
            {/* Test Pages - Standalone */}
            <Route 
              path="/test/:testId" 
              element={
                <ProtectedRoute>
                  <TestPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/test/free/:categoryId" 
              element={
                <ProtectedRoute>
                  <FreeTestPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/test/details/:categoryId" 
              element={
                <ProtectedRoute>
                  <TestDetailsPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Psychometric Test Taking - Standalone (outside dashboard for full screen) */}
            <Route 
              path="/take-psychometric-test" 
              element={
                <ProtectedRoute>
                  <SimplifiedTestTaking />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/take-psychometric-test/:sessionId" 
              element={
                <ProtectedRoute>
                  <SimplifiedTestTaking />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/psychometric-test-result" 
              element={
                <ProtectedRoute>
                  <SimplifiedTestResult />
                </ProtectedRoute>
              } 
            />
            
            {/* Smart Test Taking - Standalone (outside dashboard for full screen) */}
            <Route 
              path="/take-smart-test" 
              element={
                <ProtectedRoute>
                  <TakeSmartTestPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Protected Routes with MainLayout */}
            <Route 
              path="/app" 
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              {/* Default redirect to community page (network) */}
              <Route index element={<Navigate to="network" replace />} />
              
              {/* Jobs */}
              <Route path="jobs" element={<JobsPage />} />
              <Route path="jobs/all" element={<AllJobsPage />} />
              <Route path="jobs/:id" element={<JobDetailsPage />} />
              <Route path="jobs/:jobId/apply" element={<QuickApplyPage />} />
              <Route path="saved-jobs" element={<SavedJobsPage />} />
              
              {/* Internships and Skills */}
              <Route path="internships" element={<InternshipsPage />} />
              <Route path="skills" element={<SkillsPage />} />
              
              {/* Applications */}
              <Route path="applications" element={<ApplicationsPage />} />
              <Route path="applications/:id" element={<ApplicationDetailsPage />} />
              
              {/* Profile */}
              <Route path="profile" element={<ModernProfilePage />} />
              <Route path="profile/edit" element={<ProfileEditPage />} />
              <Route path="profile/view/:userId" element={<SummaryProfilePage />} />
              <Route path="profile/simple" element={<ImprovedProfilePage />} />
              <Route path="profile/minimized" element={<MinimizedProfilePage />} />
              <Route 
                path="profile/professional" 
                element={
                  <ProtectedRoute roles={[UserRole.PROFESSIONAL, UserRole.JOB_SEEKER]}>
                    <ProfessionalProfilePage />
                  </ProtectedRoute>
                } 
              />
              
              {/* Learning & Development */}
              <Route path="certificates" element={<CertificatesPage />} />
              <Route path="courses" element={<CoursesPage />} />
              <Route path="interviews" element={<AIInterviewsPage />} />
              <Route path="interviews/history" element={<InterviewHistoryPage />} />
              <Route path="interviews/feedback/:sessionId" element={<InterviewFeedbackPage />} />
              <Route path="interviews/results/:sessionId" element={<InterviewResultsPage />} />
              <Route path="tests" element={<PsychometricTestsPage />} />
              <Route path="tests/saved" element={<SavedCardsManager />} />
              <Route path="test-results" element={<PsychometricResultsPage />} />
              <Route path="cv-builder" element={<OptimizedCVBuilderPage />} />
              <Route path="cv-builder-enhanced" element={<EnhancedCVBuilderPage />} />
              <Route path="cv-builder-simple" element={<SimpleCVBuilderPage />} />
              
              {/* Social Network */}
              <Route path="network" element={<SocialNetworkPage />} />
              <Route path="stories" element={<ViewStoriesPage />} />
              <Route path="connections" element={<NetworkPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="messages" element={<MessagesPage />} />
              <Route path="search" element={<SearchPage />} />
              
              {/* Debug Routes (Development only) */}
              <Route path="debug/stories" element={<StoryDebugger />} />
              
              {/* Career Insights */}
              <Route path="career-insights" element={<CareerInsightsPage />} />
              
              {/* Test Routes moved to standalone for full screen experience */}
              
              <Route path="career-guidance" element={<CareerGuidancePage />} />
              <Route path="job-preparation" element={<JobPreparationPage />} />
              <Route path="smart-tests" element={<SmartTestPage />} />
              <Route path="smart-test-results" element={<SmartTestResultsPage />} />
              <Route path="career/assessment/:assessmentId" element={<CareerAssessmentFlow />} />
              <Route path="career/assessment/:assessmentId/results" element={<CareerAssessmentResultsPage />} />
              
              {/* Employer Only Routes */}
              <Route 
                path="jobs/create" 
                element={
                  <ProtectedRoute roles={[UserRole.EMPLOYER]}>
                    <CreateJobPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="internships/create" 
                element={
                  <ProtectedRoute roles={[UserRole.EMPLOYER]}>
                    <CreateInternshipPage />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="employer/jobs" 
                element={
                  <ProtectedRoute roles={[UserRole.EMPLOYER]}>
                    <EmployerJobsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="employer/internships" 
                element={
                  <ProtectedRoute roles={[UserRole.EMPLOYER]}>
                    <EmployerInternshipsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="employer/candidates" 
                element={
                  <ProtectedRoute roles={[UserRole.EMPLOYER]}>
                    <EmployerCandidatesPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="employer/jobs/:jobId/applications" 
                element={
                  <ProtectedRoute roles={[UserRole.EMPLOYER]}>
                    <JobApplicationsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="employer/candidates/:candidateId" 
                element={
                  <ProtectedRoute roles={[UserRole.EMPLOYER]}>
                    <EmployerCandidatesPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="employer/talent-pool" 
                element={
                  <ProtectedRoute roles={[UserRole.EMPLOYER]}>
                    <EmployerTalentPoolPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="employer/saved-candidates" 
                element={
                  <ProtectedRoute roles={[UserRole.EMPLOYER]}>
                    <EmployerSavedCandidatesPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="employer/hired" 
                element={
                  <ProtectedRoute roles={[UserRole.EMPLOYER]}>
                    <EmployerHiredPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="employer/interviews" 
                element={
                  <ProtectedRoute roles={[UserRole.EMPLOYER]}>
                    <EmployerInterviewsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="employer/analytics" 
                element={
                  <ProtectedRoute roles={[UserRole.EMPLOYER]}>
                    <EmployerAnalyticsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="employer/company-profile" 
                element={
                  <ProtectedRoute roles={[UserRole.EMPLOYER]}>
                    <EmployerCompanyProfilePage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="employer/profile" 
                element={
                  <ProtectedRoute roles={[UserRole.EMPLOYER]}>
                    <EmployerProfilePage />
                  </ProtectedRoute>
                } 
              />
            </Route>
            
            {/* Standalone Test Taking Page - Full Screen (Outside MainLayout) */}
            <Route 
              path="/test-taking" 
              element={
                <ProtectedRoute>
                  <TestTakingPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Standalone Interview Page - Full Screen (Outside MainLayout) */}
            <Route 
              path="/interview/:sessionId" 
              element={
                <ProtectedRoute>
                  <StandaloneInterviewPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Legacy dashboard route redirect - redirect to network page for general users */}
            <Route path="/dashboard" element={<Navigate to="/app/network" replace />} />
            
            {/* Debug Routes (Development only) - Outside authentication */}
            <Route path="/debug/stories" element={<StoryDebugger />} />
            
            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          
          {/* Floating Chat Button */}
          <FloatingChatButton />
          
          {/* Toast Notifications */}
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </Router>
        </GlobalVideoProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
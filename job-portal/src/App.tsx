import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, UserRole } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';

// Import all pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import JobsPage from './pages/JobsPage';
import JobDetailsPage from './pages/JobDetailsPage';
import ApplicationsPage from './pages/ApplicationsPage';
import ApplicationDetailsPage from './pages/ApplicationDetailsPage';
import ProfilePage from './pages/ProfilePage';
import ProfileSettingsPage from './pages/ProfileSettingsPage';
import ProfessionalProfilePage from './pages/ProfessionalProfilePage';
import SavedJobsPage from './pages/SavedJobsPage';
import CertificatesPage from './pages/CertificatesPage';
import CoursesPage from './pages/CoursesPage';
import AIInterviewsPage from './pages/AIInterviewsPage';
import PsychometricTestsPage from './pages/PsychometricTestsPage';
import TestPage from './pages/TestPage';
import FreeTestPage from './pages/FreeTestPage';
import TestDetailsPage from './pages/TestDetailsPage';
import CreateJobPage from './pages/CreateJobPage';
import EmployerJobsPage from './pages/EmployerJobsPage';
import EmployerCandidatesPage from './pages/EmployerCandidatesPage';
import TestResultsPage from './pages/TestResultsPage';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
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
            
            {/* Protected Routes with MainLayout */}
            <Route 
              path="/app" 
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              {/* Dashboard */}
              <Route path="dashboard" element={<DashboardPage />} />
              
              {/* Jobs */}
              <Route path="jobs" element={<JobsPage />} />
              <Route path="jobs/:id" element={<JobDetailsPage />} />
              <Route path="saved-jobs" element={<SavedJobsPage />} />
              
              {/* Applications */}
              <Route path="applications" element={<ApplicationsPage />} />
              <Route path="applications/:id" element={<ApplicationDetailsPage />} />
              
              {/* Profile */}
              <Route path="profile" element={<ProfilePage />} />
              <Route path="profile/settings" element={<ProfileSettingsPage />} />
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
              <Route path="tests" element={<PsychometricTestsPage />} />
              <Route path="test-results" element={<TestResultsPage />} />
              
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
                path="employer/jobs" 
                element={
                  <ProtectedRoute roles={[UserRole.EMPLOYER]}>
                    <EmployerJobsPage />
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
            </Route>
            
            {/* Legacy dashboard route redirect */}
            <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
            
            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
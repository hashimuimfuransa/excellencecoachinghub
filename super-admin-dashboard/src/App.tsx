import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, UserRole } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
// EmailJS removed - now using backend SendGrid service

// Super Admin Pages
import AllUsersPage from './pages/SuperAdmin/AllUsersPage';
import UserAnalyticsPage from './pages/SuperAdmin/UserAnalyticsPage';
import JobSeekerManagementPage from './pages/SuperAdmin/JobSeekerManagementPage';
import JobsManagementPage from './pages/SuperAdmin/JobsManagementPage';
import ApplicationsManagementPage from './pages/SuperAdmin/ApplicationsManagementPage';
import CoursesManagementPage from './pages/SuperAdmin/CoursesManagementPage';
import PsychometricTestManagementPage from './pages/SuperAdmin/PsychometricTestManagementPage';
import SmartTestManagementPage from './pages/SmartTestManagementPage';
import AIInterviewManagementPage from './pages/SuperAdmin/AIInterviewManagementPage';
import PastPapersManagementPage from './pages/SuperAdmin/PastPapersManagementPage';
import CertificatesManagementPage from './pages/SuperAdmin/CertificatesManagementPage';
import SystemAnalyticsPage from './pages/SuperAdmin/SystemAnalyticsPage';
import SystemSettingsPage from './pages/SuperAdmin/SystemSettingsPage';
import SystemHealthPage from './pages/SuperAdmin/SystemHealthPage';
import PerformanceReportsPage from './pages/SuperAdmin/PerformanceReportsPage';
import UsageStatisticsPage from './pages/SuperAdmin/UsageStatisticsPage';
import CompanyProfileApprovalPage from './pages/SuperAdmin/CompanyProfileApprovalPage';
import EmailEventsPage from './pages/SuperAdmin/EmailEventsPage';

function App() {
  // EmailJS removed - now using backend SendGrid service
  useEffect(() => {
    console.log('📧 Email service now handled entirely by backend SendGrid');
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Protected admin routes */}
            <Route path="/" element={<ProtectedRoute roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN]}><AdminLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<SuperAdminDashboard />} />
              
              {/* User Management */}
              <Route path="users" element={<AllUsersPage />} />
              <Route path="user-analytics" element={<UserAnalyticsPage />} />
              <Route path="job-seekers" element={<JobSeekerManagementPage />} />
              
              {/* Content Management */}
              <Route path="jobs" element={<JobsManagementPage />} />
              <Route path="applications" element={<ApplicationsManagementPage />} />
              <Route path="company-profiles" element={<CompanyProfileApprovalPage />} />
              <Route path="courses" element={<CoursesManagementPage />} />
              <Route path="psychometric-tests" element={<PsychometricTestManagementPage />} />
              <Route path="smart-tests" element={<SmartTestManagementPage />} />
              <Route path="ai-interviews" element={<AIInterviewManagementPage />} />
              <Route path="past-papers" element={<PastPapersManagementPage />} />
              <Route path="certificates" element={<CertificatesManagementPage />} />
              
              {/* System Management */}
              <Route path="system-analytics" element={<SystemAnalyticsPage />} />
              <Route path="system-settings" element={<SystemSettingsPage />} />
              <Route path="system-health" element={<SystemHealthPage />} />
              <Route path="email-events" element={<EmailEventsPage />} />
              
              {/* Analytics */}
              <Route path="performance" element={<PerformanceReportsPage />} />
              <Route path="usage-stats" element={<UsageStatisticsPage />} />
            </Route>
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Context Providers
import { AuthProvider } from './contexts/AuthContext';
import { CustomThemeProvider, useThemeContext } from './contexts/ThemeContext';
// EmailJS removed - now using backend SendGrid service

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import PostLoginPage from './pages/PostLoginPage';
import GoogleTestPage from './pages/GoogleTestPage';
import RoleSelectionPage from './pages/RoleSelectionPage';

const AppContent: React.FC = () => {
  const { theme, isDarkMode } = useThemeContext();
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            
            {/* Post-login Route */}
            <Route path="/dashboard" element={<PostLoginPage />} />
            
            {/* Role Selection Route */}
            <Route path="/select-role" element={<RoleSelectionPage />} />
            
            {/* Test Route */}
            <Route path="/test-google" element={<GoogleTestPage />} />
            
            {/* Redirect routes for platform links */}
            <Route 
              path="/elearning" 
              element={<RedirectComponent url="https://elearning.excellencecoachinghub.com" />} 
            />
            <Route 
              path="/jobs" 
              element={<RedirectComponent url="https://exjobnet.com" />} 
            />
            
            {/* Catch all route - redirect to home */}
            <Route path="*" element={<HomePage />} />
          </Routes>
        </Router>
        
        {/* Toast Notifications */}
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme={isDarkMode ? "dark" : "light"}
          toastStyle={{
            borderRadius: '12px',
            fontFamily: theme.typography.fontFamily,
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  );
};

const App: React.FC = () => {
  // EmailJS removed - now using backend SendGrid service
  useEffect(() => {
    console.log('📧 Email service now handled entirely by backend SendGrid');
  }, []);

  return (
    <CustomThemeProvider>
      <AppContent />
    </CustomThemeProvider>
  );
};

// Component to handle external redirects
const RedirectComponent: React.FC<{ url: string }> = ({ url }) => {
  React.useEffect(() => {
    window.open(url, '_blank');
    // Optionally redirect back to homepage
    window.location.href = '/';
  }, [url]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontFamily: 'Inter, sans-serif'
    }}>
      <p>Redirecting to platform...</p>
    </div>
  );
};

export default App;
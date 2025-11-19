import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
  const location = useLocation();
  
  // Safe useAuth hook with error handling
  let authContext = null;
  try {
    authContext = useAuth();
  } catch (error) {
    console.warn('ProtectedRoute: useAuth not available, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const { isAuthenticated, isLoading, user, hasAnyRole } = authContext;

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !hasAnyRole(roles)) {
    return <Navigate to="/app/network" replace />;
  }

  // Check profile completion for job seekers and professionals
  // Redirect to profile page if profile is incomplete
  if (user && (user.role === UserRole.PROFESSIONAL || user.role === UserRole.JOB_SEEKER)) {
    // Simple profile completion check based on available fields in AuthContext User
    // Using a weighted approach similar to the system's existing logic
    const hasBasicInfo = user.firstName && user.lastName && user.email;
    const hasContactInfo = user.phone;
    const hasProfessionalInfo = user.jobTitle;
    
    // Calculate a simple completion score (out of 100)
    // Basic info is most important (40%), contact info is important (30%), professional info adds value (30%)
    const profileCompletion = (hasBasicInfo ? 40 : 0) + (hasContactInfo ? 30 : 0) + (hasProfessionalInfo ? 30 : 0);
    
    // Skip profile check for certain paths that don't require a complete profile
    const skipProfileCheckPaths = [
      '/app/profile',
      '/app/profile/edit',
      '/app/profile/view'
    ];
    
    const shouldSkipProfileCheck = skipProfileCheckPaths.some(path => 
      location.pathname.startsWith(path)
    );
    
    // Redirect to profile edit page if profile completion is less than 60%
    // This matches the threshold used in other parts of the application
    if (!shouldSkipProfileCheck && profileCompletion < 60) {
      return <Navigate to="/app/profile/edit" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
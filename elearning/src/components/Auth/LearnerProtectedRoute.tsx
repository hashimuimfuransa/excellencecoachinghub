import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../shared/types';
import { Box, CircularProgress } from '@mui/material';
import { isLearnerRole, getDashboardPath } from '../../utils/roleUtils';

interface LearnerProtectedRouteProps {
  children: ReactNode;
}

/**
 * ProtectedRoute for learner features that should be accessible to both students and job seekers
 */
const LearnerProtectedRoute: React.FC<LearnerProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
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

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has learner access (student or job seeker)
  if (!isLearnerRole(user.role)) {
    // Redirect to appropriate dashboard based on user role
    const redirectPath = getDashboardPath(user.role);
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};

export default LearnerProtectedRoute;
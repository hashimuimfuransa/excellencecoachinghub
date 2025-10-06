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

  return <>{children}</>;
};

export default ProtectedRoute;
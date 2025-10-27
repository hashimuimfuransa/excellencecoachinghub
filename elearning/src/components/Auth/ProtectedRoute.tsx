import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../shared/types';
import { Box, CircularProgress } from '@mui/material';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
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

  // Check role-based access
  if (requiredRole && user.role !== requiredRole) {
    // Handle super admin as admin for elearning
    const isSuperAdminAsAdmin = user.role === UserRole.SUPER_ADMIN && requiredRole === UserRole.ADMIN;
    
    // Allow job seekers and professionals to access student routes
    const isJobSeekerAccessingStudent = user.role === UserRole.JOB_SEEKER && requiredRole === UserRole.STUDENT;
    const isProfessionalAccessingStudent = user.role === UserRole.PROFESSIONAL && requiredRole === UserRole.STUDENT;
    
    // Allow students to access job seeker routes (for backward compatibility)
    const isStudentAccessingJobSeeker = user.role === UserRole.STUDENT && requiredRole === UserRole.JOB_SEEKER;
    
    if (!isSuperAdminAsAdmin && !isJobSeekerAccessingStudent && !isProfessionalAccessingStudent && !isStudentAccessingJobSeeker) {
      // Redirect to appropriate dashboard based on user role
      const redirectPath = user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN
        ? '/dashboard/admin'
        : user.role === UserRole.TEACHER
        ? '/dashboard/teacher'
        : '/dashboard/student';

      return <Navigate to={redirectPath} replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;

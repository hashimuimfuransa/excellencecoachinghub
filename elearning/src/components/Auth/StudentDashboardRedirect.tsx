import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { loginRedirectService } from '../../services/loginRedirectService';
import { UserRole } from '../../shared/types';
import { isLearnerRole } from '../../utils/roleUtils';

interface StudentDashboardRedirectProps {
  userRole: UserRole;
}

const StudentDashboardRedirect: React.FC<StudentDashboardRedirectProps> = ({ userRole }) => {
  const [redirectPath, setRedirectPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRedirect = async () => {
      try {
        const path = await loginRedirectService.getRedirectPath({
          userRole,
          from: '/dashboard/student'
        });
        setRedirectPath(path);
      } catch (error) {
        console.warn('Error determining redirect path:', error);
        setRedirectPath('/dashboard/student/courses');
      } finally {
        setLoading(false);
      }
    };

    checkRedirect();
  }, [userRole]);

  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="50vh"
        gap={2}
      >
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          Checking your course enrollments...
        </Typography>
      </Box>
    );
  }

  return <Navigate to={redirectPath || '/dashboard/student/courses'} replace />;
};

export default StudentDashboardRedirect;

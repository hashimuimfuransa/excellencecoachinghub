import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { useAuth } from '../../hooks/useAuth';
import { teacherProfileService, ITeacherProfile } from '../../services/teacherProfileService';

interface TeacherProfileGuardProps {
  children: React.ReactNode;
}

const TeacherProfileGuard: React.FC<TeacherProfileGuardProps> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [profile, setProfile] = useState<ITeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Routes that should be accessible even with incomplete profiles
  const allowedRoutes = [
    '/dashboard/teacher/profile/complete',
    '/dashboard/teacher/profile/edit',
    '/teacher/profile-completion',
    '/teacher/profile-complete'
  ];

  const isAllowedRoute = allowedRoutes.some(route => location.pathname.includes(route));

  useEffect(() => {
    if (user?.role === 'teacher') {
      checkProfileStatus();
    } else {
      setLoading(false);
    }
  }, [user]);

  const checkProfileStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const profileData = await teacherProfileService.getMyProfile();
      setProfile(profileData);
    } catch (err) {
      console.error('Error checking teacher profile:', err);
      setError('Failed to check profile status');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    // If there's an error checking profile, allow access but log the error
    console.error('TeacherProfileGuard error:', error);
    return <>{children}</>;
  }

  // If user is not a teacher, allow access
  if (user?.role !== 'teacher') {
    return <>{children}</>;
  }

  // If accessing allowed routes (profile completion/edit), allow access
  if (isAllowedRoute) {
    return <>{children}</>;
  }

  // If no profile exists or profile is incomplete, redirect to completion page
  if (!profile || profile.profileStatus === 'incomplete') {
    return <Navigate to="/teacher/profile-completion" replace />;
  }

  // If profile is pending or rejected, redirect to completion page
  if (profile.profileStatus === 'pending' || profile.profileStatus === 'rejected') {
    return <Navigate to="/teacher/profile-completion" replace />;
  }

  // If profile is approved, allow access to dashboard
  if (profile.profileStatus === 'approved') {
    return <>{children}</>;
  }

  // Default fallback - redirect to completion page
  return <Navigate to="/teacher/profile-completion" replace />;
};

export default TeacherProfileGuard;

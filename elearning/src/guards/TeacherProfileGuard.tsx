import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { teacherProfileService } from '../services/teacherProfileService';
import { TeacherProfileProvider } from '../contexts/TeacherProfileContext';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Chip, 
  CircularProgress, 
  Alert,
  Container,
  Grid
} from '@mui/material';
import { 
  Warning, 
  Schedule, 
  Close, 
  CheckCircle, 
  Edit 
} from '@mui/icons-material';

interface TeacherProfileGuardProps {
  children: React.ReactNode;
}

const TeacherProfileGuard: React.FC<TeacherProfileGuardProps> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const [profileStatus, setProfileStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Allow access to profile-related pages
  const allowedPaths = [
    '/dashboard/teacher/profile',
    '/dashboard/teacher/profile/edit',
    '/dashboard/teacher/profile/complete'
  ];

  const isAllowedPath = allowedPaths.some(path => 
    location.pathname.startsWith(path)
  );

  useEffect(() => {
    const checkProfileStatus = async () => {
      if (!user || user.role !== 'teacher') {
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 TeacherProfileGuard: Checking profile status for user:', user._id);
        const profile = await teacherProfileService.getMyProfile();
        console.log('🔍 TeacherProfileGuard: Profile loaded:', profile);
        setProfileStatus(profile.profileStatus);
      } catch (err: any) {
        console.error('❌ TeacherProfileGuard: Error checking profile status:', err);
        console.error('❌ TeacherProfileGuard: Error details:', {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data
        });
        
        // Handle specific error cases
        if (err.response?.status === 404 || err.message?.includes('Profile not found')) {
          // If no profile exists, treat as incomplete
          console.log('🔍 TeacherProfileGuard: No profile found, treating as incomplete');
          setProfileStatus('incomplete');
        } else if (err.response?.status === 401 || err.message?.includes('User ID not found')) {
          // Authentication issue
          console.log('🔍 TeacherProfileGuard: Authentication issue');
          setError('Authentication required. Please log in again.');
        } else if (err.message?.includes('Unable to connect to server')) {
          // Server connection issue
          console.log('🔍 TeacherProfileGuard: Server connection issue');
          setError('Unable to connect to server. Please check your connection and try again.');
        } else {
          // Other errors - treat as incomplete to allow user to proceed
          console.log('🔍 TeacherProfileGuard: Other error, treating as incomplete');
          setProfileStatus('incomplete');
        }
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      checkProfileStatus();
    }
  }, [user, authLoading]);

  // Show loading spinner
  if (authLoading || loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  // Not a teacher, allow access
  if (!user || user.role !== 'teacher') {
    return <>{children}</>;
  }

  // Error loading profile
  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" icon={<Warning />}>
          {error}
        </Alert>
      </Container>
    );
  }

  // Allow access to profile pages
  if (isAllowedPath) {
    return <>{children}</>;
  }

  // Check profile status and block access if needed
  if (profileStatus !== 'approved') {
    return <ProfileStatusBlock profileStatus={profileStatus || 'incomplete'} />;
  }

  // Profile is approved, allow access
  return (
    <TeacherProfileProvider>
      {children}
    </TeacherProfileProvider>
  );
};

interface ProfileStatusBlockProps {
  profileStatus: string | null;
}

const ProfileStatusBlock: React.FC<ProfileStatusBlockProps> = ({ profileStatus }) => {
  const getStatusInfo = () => {
    const status = profileStatus || 'incomplete';
    switch (status) {
      case 'incomplete':
        return {
          icon: <Edit color="warning" sx={{ fontSize: 48 }} />,
          title: 'Complete Your Teacher Profile',
          message: 'Please complete your teacher profile to access all features.',
          color: 'warning' as const,
          buttonText: 'Complete Profile',
          buttonColor: 'warning' as const,
          link: '/dashboard/teacher/profile/complete'
        };
      case 'pending':
        return {
          icon: <Schedule color="info" sx={{ fontSize: 48 }} />,
          title: 'Profile Under Review',
          message: 'Your teacher profile is being reviewed by our admin team. This typically takes 1-3 business days.',
          color: 'info' as const,
          buttonText: 'View Profile',
          buttonColor: 'info' as const,
          link: '/dashboard/teacher/profile/complete'
        };
      case 'rejected':
        return {
          icon: <Close color="error" sx={{ fontSize: 48 }} />,
          title: 'Profile Needs Updates',
          message: 'Your teacher profile requires some updates before approval. Please review the feedback and resubmit.',
          color: 'error' as const,
          buttonText: 'Update Profile',
          buttonColor: 'error' as const,
          link: '/dashboard/teacher/profile/edit'
        };
      default:
        return {
          icon: <Warning color="disabled" sx={{ fontSize: 48 }} />,
          title: 'Profile Status Unknown',
          message: 'Unable to determine your profile status. Please contact support.',
          color: 'default' as const,
          buttonText: 'View Profile',
          buttonColor: 'primary' as const,
          link: '/dashboard/teacher/profile/complete'
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Container maxWidth="md" sx={{ mt: 8, mb: 4 }}>
      <Grid container justifyContent="center">
        <Grid item xs={12} md={8}>
          <Card elevation={3}>
            <CardContent sx={{ p: 5, textAlign: 'center' }}>
              <Box mb={3}>
                {statusInfo.icon}
              </Box>
              
              <Typography variant="h4" component="h2" gutterBottom>
                {statusInfo.title}
              </Typography>
              
              <Chip 
                label={`Status: ${(profileStatus || 'incomplete').charAt(0).toUpperCase() + (profileStatus || 'incomplete').slice(1)}`}
                color={statusInfo.color}
                sx={{ mb: 3, px: 2, py: 1, fontSize: '1rem' }}
              />
              
              <Typography variant="h6" color="text.secondary" paragraph>
                {statusInfo.message}
              </Typography>

              {(profileStatus || 'incomplete') === 'incomplete' && (
                <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
                  <Typography variant="h6" gutterBottom>📋 Required Information:</Typography>
                  <Box component="ul" sx={{ pl: 2 }}>
                    <li>Personal information (phone, address, national ID)</li>
                    <li>Professional details (specialization, experience)</li>
                    <li>Education and certifications</li>
                    <li>Teaching areas and preferred levels</li>
                    <li>Payment preferences</li>
                    <li>CV upload</li>
                  </Box>
                </Alert>
              )}

              {(profileStatus || 'incomplete') === 'pending' && (
                <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
                  <Typography variant="h6" gutterBottom>⏱️ What's Next:</Typography>
                  <Box component="ul" sx={{ pl: 2 }}>
                    <li>Our admin team is reviewing your profile</li>
                    <li>You'll receive an email notification once reviewed</li>
                    <li>Review typically takes 1-3 business days</li>
                    <li>You can still view your profile details</li>
                  </Box>
                </Alert>
              )}

              {(profileStatus || 'incomplete') === 'rejected' && (
                <Alert severity="warning" sx={{ mb: 3, textAlign: 'left' }}>
                  <Typography variant="h6" gutterBottom>🔄 Next Steps:</Typography>
                  <Box component="ul" sx={{ pl: 2 }}>
                    <li>Review the admin feedback on your profile</li>
                    <li>Make the required updates</li>
                    <li>Resubmit your profile for approval</li>
                    <li>Check your email for detailed feedback</li>
                  </Box>
                </Alert>
              )}

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 4 }}>
                <Button 
                  variant="contained"
                  color={statusInfo.buttonColor}
                  size="large"
                  href={statusInfo.link}
                  sx={{ py: 1.5 }}
                >
                  {statusInfo.buttonText}
                </Button>
                
                <Button 
                  variant="outlined"
                  href="/dashboard/teacher"
                  color="inherit"
                >
                  Back to Dashboard
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default TeacherProfileGuard;
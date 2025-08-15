import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { teacherProfileService } from '../services/teacherProfileService';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  CircularProgress, 
  Alert,
  Container
} from '@mui/material';
import { 
  Warning, 
  CheckCircle 
} from '@mui/icons-material';

interface TeacherApprovalGuardProps {
  children: React.ReactNode;
}

const TeacherApprovalGuard: React.FC<TeacherApprovalGuardProps> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const [profileStatus, setProfileStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkProfileStatus = async () => {
      if (!user || user.role !== 'teacher') {
        setLoading(false);
        return;
      }

      try {
        const response = await teacherProfileService.getMyProfile();
        if (response.success) {
          setProfileStatus(response.data.profile.profileStatus);
        } else {
          setError('Failed to load profile status');
        }
      } catch (err: any) {
        console.error('Error checking profile status:', err);
        setError(err.message || 'Failed to check profile status');
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

  // Profile is approved, allow access
  if (profileStatus === 'approved') {
    return <>{children}</>;
  }

  // Profile not approved, show access denied
  return (
    <Container maxWidth="md" sx={{ mt: 8, mb: 4 }}>
      <Card elevation={3}>
        <CardContent sx={{ p: 5, textAlign: 'center' }}>
          <Warning sx={{ fontSize: 64, color: 'warning.main', mb: 3 }} />
          
          <Typography variant="h4" component="h2" gutterBottom>
            Profile Approval Required
          </Typography>
          
          <Typography variant="h6" color="text.secondary" paragraph>
            You need an approved teacher profile to access this feature.
          </Typography>

          <Typography variant="body1" paragraph>
            Current Status: <strong>{profileStatus?.charAt(0).toUpperCase() + profileStatus?.slice(1)}</strong>
          </Typography>

          {profileStatus === 'incomplete' && (
            <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
              <Typography variant="h6" gutterBottom>Next Steps:</Typography>
              <Typography>
                1. Complete your teacher profile with all required information<br/>
                2. Upload your CV and profile picture<br/>
                3. Submit for admin review<br/>
                4. Wait for approval (1-3 business days)
              </Typography>
            </Alert>
          )}

          {profileStatus === 'pending' && (
            <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
              <Typography variant="h6" gutterBottom>Under Review:</Typography>
              <Typography>
                Your profile is currently being reviewed by our admin team. 
                This typically takes 1-3 business days. You'll receive an email 
                notification once the review is complete.
              </Typography>
            </Alert>
          )}

          {profileStatus === 'rejected' && (
            <Alert severity="warning" sx={{ mb: 3, textAlign: 'left' }}>
              <Typography variant="h6" gutterBottom>Profile Needs Updates:</Typography>
              <Typography>
                Your profile was rejected and needs updates. Please check your 
                profile page for detailed feedback from our admin team and 
                resubmit after making the necessary changes.
              </Typography>
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 4 }}>
            <Button 
              variant="contained"
              size="large"
              href={
                profileStatus === 'incomplete' ? '/dashboard/teacher/profile/complete' :
                profileStatus === 'rejected' ? '/dashboard/teacher/profile/edit' :
                '/dashboard/teacher/profile/complete'
              }
              sx={{ py: 1.5 }}
            >
              {profileStatus === 'incomplete' ? 'Complete Profile' :
               profileStatus === 'rejected' ? 'Update Profile' :
               'View Profile'}
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
    </Container>
  );
};

export default TeacherApprovalGuard;
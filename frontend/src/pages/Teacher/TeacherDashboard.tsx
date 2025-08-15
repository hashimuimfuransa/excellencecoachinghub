import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Alert,
  Button,
  Chip,
  CircularProgress,
  Typography,
  Box,
  Paper
} from '@mui/material';
import {
  Person,
  Schedule,
  CheckCircle,
  Close,
  Edit,
  TrendingUp,
  MenuBook,
  People,
  CalendarToday
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { teacherProfileService } from '../../services/teacherProfileService';
import { Link } from 'react-router-dom';

const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [profileStatus, setProfileStatus] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfileStatus();
  }, []);

  const loadProfileStatus = async () => {
    try {
      const response = await teacherProfileService.getMyProfile();
      if (response.success) {
        setProfile(response.data.profile);
        setProfileStatus(response.data.profile.profileStatus);
      } else {
        setError('Failed to load profile status');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to check profile status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = () => {
    switch (profileStatus) {
      case 'incomplete':
        return {
          icon: <Edit color="warning" />,
          title: 'Profile Incomplete',
          message: 'Complete your profile to start teaching',
          color: 'warning' as const,
          action: 'Complete Profile',
          link: '/dashboard/teacher/profile/complete'
        };
      case 'pending':
        return {
          icon: <Schedule color="info" />,
          title: 'Under Review',
          message: 'Your profile is being reviewed by our team',
          color: 'info' as const,
          action: 'View Profile',
          link: '/dashboard/teacher/profile/complete'
        };
      case 'rejected':
        return {
          icon: <Close color="error" />,
          title: 'Profile Rejected',
          message: 'Please update your profile based on feedback',
          color: 'error' as const,
          action: 'Update Profile',
          link: '/dashboard/teacher/profile/edit'
        };
      case 'approved':
        return {
          icon: <CheckCircle color="success" />,
          title: 'Profile Approved',
          message: 'Welcome! You can now access all teacher features',
          color: 'success' as const,
          action: 'View Profile',
          link: '/dashboard/teacher/profile/complete'
        };
      default:
        return {
          icon: <Person color="disabled" />,
          title: 'Profile Status Unknown',
          message: 'Unable to determine profile status',
          color: 'default' as const,
          action: 'Check Profile',
          link: '/dashboard/teacher/profile/complete'
        };
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Container>
    );
  }

  const statusInfo = getStatusInfo();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Welcome back, {user?.firstName}! 👋
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Here's your teaching dashboard overview
        </Typography>
      </Box>

      {/* Profile Status Card */}
      <Card sx={{ mb: 4, borderLeft: `4px solid ${statusInfo.color === 'warning' ? '#ff9800' : statusInfo.color === 'info' ? '#2196f3' : statusInfo.color === 'error' ? '#f44336' : '#4caf50'}` }}>
        <CardContent>
          <Grid container alignItems="center" spacing={2}>
            <Grid item>
              {statusInfo.icon}
            </Grid>
            <Grid item xs>
              <Typography variant="h6" gutterBottom>
                {statusInfo.title}
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                {statusInfo.message}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Chip 
                  label={`Status: ${profileStatus?.charAt(0).toUpperCase() + profileStatus?.slice(1)}`}
                  color={statusInfo.color}
                  variant="outlined"
                />
                {profile?.submittedAt && (
                  <Typography variant="caption" color="text.secondary">
                    Submitted: {new Date(profile.submittedAt).toLocaleDateString()}
                  </Typography>
                )}
              </Box>
            </Grid>
            <Grid item>
              <Button
                variant="contained"
                color={statusInfo.color}
                component={Link}
                to={statusInfo.link}
              >
                {statusInfo.action}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Rejection Feedback */}
      {profileStatus === 'rejected' && profile?.rejectionReason && (
        <Alert severity="error" sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>Profile Feedback</Typography>
          <Typography paragraph><strong>Reason:</strong> {profile.rejectionReason}</Typography>
          {profile.adminFeedback && (
            <Typography paragraph><strong>Additional Feedback:</strong> {profile.adminFeedback}</Typography>
          )}
          <Typography>
            Please address these issues and resubmit your profile for review.
          </Typography>
        </Alert>
      )}

      {/* Quick Actions */}
      <Typography variant="h4" component="h2" gutterBottom sx={{ mt: 4 }}>
        Quick Actions
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Profile Management */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
            <CardContent>
              <Person sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>Profile</Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Manage your teacher profile
              </Typography>
              <Button
                variant="outlined"
                size="small"
                component={Link}
                to="/dashboard/teacher/profile/complete"
              >
                View Profile
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Courses */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%', 
            textAlign: 'center', 
            p: 2,
            opacity: profileStatus !== 'approved' ? 0.5 : 1
          }}>
            <CardContent>
              <MenuBook sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>Courses</Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Create and manage courses
              </Typography>
              <Button
                variant="outlined"
                size="small"
                component={Link}
                to="/dashboard/teacher/course-management"
                disabled={profileStatus !== 'approved'}
                color="success"
              >
                My Courses
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Students */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%', 
            textAlign: 'center', 
            p: 2,
            opacity: profileStatus !== 'approved' ? 0.5 : 1
          }}>
            <CardContent>
              <People sx={{ fontSize: 48, color: 'info.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>Students</Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Manage your students
              </Typography>
              <Button
                variant="outlined"
                size="small"
                component={Link}
                to="/dashboard/teacher/student-management"
                disabled={profileStatus !== 'approved'}
                color="info"
              >
                View Students
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Analytics */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%', 
            textAlign: 'center', 
            p: 2,
            opacity: profileStatus !== 'approved' ? 0.5 : 1
          }}>
            <CardContent>
              <TrendingUp sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>Analytics</Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                View your teaching stats
              </Typography>
              <Button
                variant="outlined"
                size="small"
                component={Link}
                to="/dashboard/teacher/analytics"
                disabled={profileStatus !== 'approved'}
                color="warning"
              >
                View Analytics
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Profile Completion Guide */}
      {profileStatus === 'incomplete' && (
        <Paper elevation={2} sx={{ p: 4, mt: 4, bgcolor: 'grey.50' }}>
          <Typography variant="h5" gutterBottom>📋 Complete Your Profile</Typography>
          <Typography paragraph>
            To start teaching on our platform, please complete the following steps:
          </Typography>
          <Grid container spacing={3}>
            <Grid item md={6}>
              <Box component="ul" sx={{ pl: 2 }}>
                <li>Personal information (phone, address, national ID)</li>
                <li>Professional details (specialization, experience)</li>
                <li>Education and certifications</li>
              </Box>
            </Grid>
            <Grid item md={6}>
              <Box component="ul" sx={{ pl: 2 }}>
                <li>Teaching areas and preferred levels</li>
                <li>Payment preferences</li>
                <li>Upload your CV and profile picture</li>
              </Box>
            </Grid>
          </Grid>
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Button
              variant="contained"
              size="large"
              component={Link}
              to="/dashboard/teacher/profile/complete"
            >
              Complete Profile Now
            </Button>
          </Box>
        </Paper>
      )}

      {/* Pending Review Info */}
      {profileStatus === 'pending' && (
        <Paper elevation={2} sx={{ p: 4, mt: 4, bgcolor: 'grey.50' }}>
          <Typography variant="h5" gutterBottom>⏱️ Profile Under Review</Typography>
          <Typography paragraph>
            Thank you for submitting your teacher profile! Here's what happens next:
          </Typography>
          <Grid container spacing={3}>
            <Grid item md={6}>
              <Typography variant="h6" gutterBottom>Review Process:</Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                <li>✅ Profile submitted</li>
                <li>🔄 Admin review (1-3 business days)</li>
                <li>📧 Email notification</li>
                <li>🎉 Account activation</li>
              </Box>
            </Grid>
            <Grid item md={6}>
              <Typography variant="h6" gutterBottom>What We're Reviewing:</Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                <li>Professional qualifications</li>
                <li>Teaching experience</li>
                <li>Uploaded documents</li>
                <li>Profile completeness</li>
              </Box>
            </Grid>
          </Grid>
          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography><strong>Estimated Review Time:</strong> 1-3 business days</Typography>
            <Typography><strong>Status:</strong> Your profile is in the review queue</Typography>
            <Typography><strong>Next Step:</strong> You'll receive an email notification once reviewed</Typography>
          </Alert>
        </Paper>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 4 }}>
          {error}
        </Alert>
      )}
    </Container>
  );
};

export default TeacherDashboard;
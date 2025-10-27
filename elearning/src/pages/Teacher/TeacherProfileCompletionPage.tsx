import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { teacherProfileService, ITeacherProfile } from '../../services/teacherProfileService';
import TeacherProfileCompletionLayout from '../../components/Layout/TeacherProfileCompletionLayout';
import TeacherProfileStatus from '../../components/Teacher/TeacherProfileStatus';
import TeacherProfileAction from '../../components/Teacher/TeacherProfileAction';
import TeacherProfilePending from '../../components/Teacher/TeacherProfilePending';

const TeacherProfileCompletionPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ITeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const profileData = await teacherProfileService.getMyProfile();
      setProfile(profileData);
    } catch (err) {
      console.error('Error loading teacher profile:', err);
      setError('Failed to load profile information');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteProfile = () => {
    navigate('/teacher/profile-complete', { replace: true });
  };

  const handleEditProfile = () => {
    navigate('/teacher/profile-complete', { replace: true });
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard/teacher', { replace: true });
  };

  const getCompletionPercentage = (profile: ITeacherProfile): number => {
    const requiredFields = [
      'specialization',
      'bio',
      'experience',
      'education',
      'teachingAreas',
      'hourlyRate'
    ];

    const completedFields = requiredFields.filter(field => {
      const value = profile[field as keyof ITeacherProfile];
      return value && (Array.isArray(value) ? value.length > 0 : true);
    });

    return Math.round((completedFields.length / requiredFields.length) * 100);
  };

  if (loading) {
    return (
      <TeacherProfileCompletionLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      </TeacherProfileCompletionLayout>
    );
  }

  if (error) {
    return (
      <TeacherProfileCompletionLayout>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </TeacherProfileCompletionLayout>
    );
  }

  if (!profile) {
    return (
      <TeacherProfileCompletionLayout>
        <Alert severity="warning" sx={{ mb: 2 }}>
          No profile found. Please complete your teacher profile.
        </Alert>
      </TeacherProfileCompletionLayout>
    );
  }

  const completionPercentage = getCompletionPercentage(profile);
  const profileStatus = profile.profileStatus || 'incomplete';

  return (
    <TeacherProfileCompletionLayout>
      <Box>
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
          Teacher Profile Status
        </Typography>

        {/* Profile Status */}
        <TeacherProfileStatus
          status={profileStatus}
          rejectionReason={profile.rejectionReason}
          completionPercentage={completionPercentage}
        />

        {/* Pending Status Details */}
        {profileStatus === 'pending' && (
          <TeacherProfilePending
            submittedAt={profile.submittedAt}
            estimatedReviewTime="1-2 business days"
          />
        )}

        {/* Action Buttons */}
        <TeacherProfileAction
          status={profileStatus}
          onCompleteProfile={handleCompleteProfile}
          onEditProfile={handleEditProfile}
          onGoToDashboard={handleGoToDashboard}
        />

        {/* Additional Information */}
        <Box mt={3}>
          <Typography variant="body2" color="text.secondary" align="center">
            Need help? Contact our support team at{' '}
            <Typography component="span" color="primary" sx={{ fontWeight: 'bold' }}>
              info@excellencecoachinghub.com
            </Typography>
          </Typography>
        </Box>
      </Box>
    </TeacherProfileCompletionLayout>
  );
};

export default TeacherProfileCompletionPage;

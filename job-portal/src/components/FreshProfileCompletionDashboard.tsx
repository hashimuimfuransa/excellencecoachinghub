import React from 'react';
import ProfileCompletionDashboard from './ProfileCompletionDashboard';
import { User } from '../types/user';
import { useFreshUserData } from '../hooks/useFreshUserData';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';

interface FreshProfileCompletionDashboardProps {
  user: User;
  onEditProfile?: () => void;
  showRecommendations?: boolean;
}

/**
 * A wrapper component that fetches fresh user data and displays profile completion
 * This ensures the profile completion shown is always up-to-date
 */
const FreshProfileCompletionDashboard: React.FC<FreshProfileCompletionDashboardProps> = ({
  user,
  onEditProfile,
  showRecommendations = true
}) => {
  const { freshUser, loading, error } = useFreshUserData(user);

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100px',
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress size={24} />
        <Typography variant="body2" color="textSecondary">
          Loading profile status...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="warning">
        Unable to load latest profile data. Showing cached information.
      </Alert>
    );
  }

  const currentUser = freshUser || user;

  return (
    <ProfileCompletionDashboard
      user={currentUser}
      onEditProfile={onEditProfile}
      showRecommendations={showRecommendations}
    />
  );
};

export default FreshProfileCompletionDashboard;
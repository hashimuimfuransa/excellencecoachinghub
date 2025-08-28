import React, { useState, useEffect } from 'react';
import { Box, CircularProgress, Typography, Container } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';
import ProfileAccessGuard from './ProfileAccessGuard';

interface SimpleProfileGuardProps {
  feature?: 'psychometricTests' | 'aiInterviews' | 'premiumJobs' | 'smartTests';
  children: React.ReactNode;
}

const SimpleProfileGuard: React.FC<SimpleProfileGuardProps> = ({
  feature = 'smartTests',
  children
}) => {
  const { user } = useAuth();
  const [freshUserData, setFreshUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFreshUserData = async () => {
      try {
        if (!user?._id) return;
        
        console.log('🔍 SimpleProfileGuard fetching fresh user data for:', user._id);
        const freshUser = await userService.getUserProfile(user._id);
        console.log('📋 SimpleProfileGuard received fresh user data:', freshUser);
        setFreshUserData(freshUser);
      } catch (error) {
        console.error('❌ Error fetching fresh user data:', error);
        // Fallback to auth user data
        setFreshUserData(user);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchFreshUserData();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading profile data...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <ProfileAccessGuard user={freshUserData || user} feature={feature}>
      {children}
    </ProfileAccessGuard>
  );
};

export default SimpleProfileGuard;
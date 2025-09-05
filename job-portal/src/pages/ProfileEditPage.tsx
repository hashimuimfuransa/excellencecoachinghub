import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Alert,
  LinearProgress,
  IconButton
} from '@mui/material';
import {
  Edit,
  ArrowBack
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';
import type { User } from '../types/user';
import { useNavigate, useParams } from 'react-router-dom';
import ComprehensiveProfileForm from '../components/ComprehensiveProfileForm';

const ProfileEditPage: React.FC = () => {
  const { user, updateUser, setUserData } = useAuth();
  const navigate = useNavigate();
  const { userId } = useParams();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<User | null>(user);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Check if viewing own profile
  const isOwnProfile = !userId || userId === user?._id;
  const targetUserId = userId || user?._id;

  useEffect(() => {
    if (targetUserId) {
      loadUserProfile();
    }
  }, [targetUserId]);

  const loadUserProfile = async () => {
    if (!targetUserId) return;
    
    setLoading(true);
    try {
      const userProfile = await userService.getUserProfile(targetUserId);
      setProfile(userProfile);
    } catch (error) {
      console.error('Error loading profile:', error);
      setErrorMessage('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/app/profile');
  };

  const handleProfileSave = async (updatedData: Partial<User>) => {
    if (!profile?._id) return;

    setLoading(true);
    try {
      const updatedProfile = await userService.updateUserProfile(profile._id, updatedData);
      setProfile(updatedProfile);
      setUserData(updatedProfile);
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Navigate back to profile after successful save
      setTimeout(() => {
        navigate('/app/profile');
      }, 1500);
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrorMessage('Failed to update profile');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2, textAlign: 'center' }}>
          Loading Profile...
        </Typography>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Failed to load profile data</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton 
          onClick={handleBack}
          sx={{ 
            bgcolor: 'background.paper',
            boxShadow: 1,
            '&:hover': { bgcolor: 'grey.100' }
          }}
        >
          <ArrowBack />
        </IconButton>
        <Box>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 0 }}>
            <Edit sx={{ mr: 2, verticalAlign: 'middle', fontSize: 'inherit' }} />
            Complete Your Profile
          </Typography>
          <Typography variant="h6" color="textSecondary">
            Fill out all sections to maximize your job opportunities
          </Typography>
        </Box>
      </Box>

      {/* Alerts */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}
      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrorMessage('')}>
          {errorMessage}
        </Alert>
      )}

      {/* Profile Form */}
      <ComprehensiveProfileForm 
        user={profile}
        onSave={handleProfileSave}
        loading={loading}
      />
    </Container>
  );
};

export default ProfileEditPage;
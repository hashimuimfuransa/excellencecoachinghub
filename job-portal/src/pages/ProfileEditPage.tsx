import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Alert,
  LinearProgress,
  IconButton,
  Button
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
import CVBuilderPopup from '../components/CVBuilderPopup';
import { shouldShowCVBuilderPopup, markCVBuilderDismissed, checkProfileCompletion } from '../utils/profileCompletionUtils';

const ProfileEditPage: React.FC = () => {
  const { user, updateUser, setUserData } = useAuth();
  const navigate = useNavigate();
  const { userId } = useParams();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<User | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showCVBuilderPopup, setShowCVBuilderPopup] = useState(false);

  // Check if viewing own profile
  const isOwnProfile = !userId || userId === user?._id;
  const targetUserId = userId || user?._id;

  useEffect(() => {
    if (targetUserId) {
      loadUserProfile();
    }
  }, [targetUserId]);

  // Check for CV builder popup when profile is loaded
  useEffect(() => {
    if (profile && isOwnProfile) {
      // Show CV builder popup if user doesn't have a CV and profile is reasonably complete
      const shouldShowCV = shouldShowCVBuilderPopup(profile);
      
      if (shouldShowCV) {
        // Delay the popup slightly to let the page load
        const timer = setTimeout(() => {
          setShowCVBuilderPopup(true);
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [profile, isOwnProfile]);

  const loadUserProfile = async () => {
    if (!targetUserId) return;
    
    setLoading(true);
    try {
      const userProfile = await userService.getUserProfile(targetUserId);
      console.log('🔍 Profile Edit Page - Profile data received:', userProfile);
      
      // Debug individual fields
      const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'location', 'jobTitle', 'company', 'bio', 'skills', 'experience', 'education'];
      console.log('🔍 Profile Edit Page - Field analysis:');
      requiredFields.forEach(field => {
        const value = userProfile[field as keyof User];
        const hasValue = value && (!Array.isArray(value) || value.length > 0) && (typeof value !== 'string' || value.trim() !== '');
        console.log(`  ${field}: ${hasValue ? '✅' : '❌'} (${JSON.stringify(value)})`);
      });
      
      const validation = checkProfileCompletion(userProfile);
      console.log('📊 Profile Edit Page - Validation result:', validation);
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

  // CV Builder popup handlers
  const handleCVBuilderClose = () => {
    setShowCVBuilderPopup(false);
    // REMOVED: markCVBuilderDismissed(profile._id) - we want popup to show every time
    console.log('🚫 CV Builder popup closed - will show again on next visit if no CV exists');
  };

  const handleCVBuilderAction = () => {
    setShowCVBuilderPopup(false);
    navigate('/app/cv-builder');
  };

  const handleCVBuilderContinueProfile = () => {
    setShowCVBuilderPopup(false);
    // Stay on the profile page to continue completing it
  };

  const handleProfileSave = async (updatedData: Partial<User>) => {
    if (!profile?._id) return;

    setLoading(true);
    try {
      const updatedProfile = await userService.updateProfile(profile._id, updatedData);
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


      {/* CV Builder Popup */}
      {profile && (
        <CVBuilderPopup
          open={showCVBuilderPopup}
          onClose={handleCVBuilderClose}
          onBuildCV={handleCVBuilderAction}
          onContinueProfile={handleCVBuilderContinueProfile}
          user={profile}
        />
      )}
    </Container>
  );
};

export default ProfileEditPage;
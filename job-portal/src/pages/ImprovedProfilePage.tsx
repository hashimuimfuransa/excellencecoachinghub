import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
  Button,
  TextField,
  Chip,
  Divider,
  Alert,
  LinearProgress,
  Paper,
  Stack,
  IconButton,
  Fade,
  useTheme,
  alpha,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Tooltip
} from '@mui/material';
import {
  Person,
  Edit,
  Save,
  Cancel,
  Email,
  Phone,
  LocationOn,
  Work,
  School,
  Upload,
  Star,
  CheckCircle,
  Warning,
  TrendingUp,
  EmojiEvents,
  Visibility,
  Assignment,
  Psychology,
  BusinessCenter,
  Language,
  Timeline
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';
import type { User } from '../types/user';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { validateImageFile, processImage, blobToFile, createImagePreview } from '../utils/imageUtils';

const ImprovedProfilePage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, updateUser, setUserData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [profile, setProfile] = useState<User | null>(user);
  const [editedProfile, setEditedProfile] = useState<Partial<User>>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Calculate profile completion
  const calculateProfileCompletion = () => {
    if (!profile) return { score: 0, completedFields: 0, totalFields: 8 };
    
    const fields = [
      { name: 'firstName', value: profile.firstName, weight: 1 },
      { name: 'lastName', value: profile.lastName, weight: 1 },
      { name: 'email', value: profile.email, weight: 1 },
      { name: 'phone', value: profile.phone, weight: 1 },
      { name: 'location', value: profile.location, weight: 1 },
      { name: 'bio', value: profile.bio, weight: 1 },
      { name: 'skills', value: profile.skills?.length > 0, weight: 1 },
      { name: 'experience', value: profile.experience?.length > 0, weight: 1 }
    ];

    const completedFields = fields.filter(field => field.value).length;
    const score = Math.round((completedFields / fields.length) * 100);

    return {
      score,
      completedFields,
      totalFields: fields.length,
      missingFields: fields.filter(field => !field.value).map(field => field.name)
    };
  };

  const profileCompletion = calculateProfileCompletion();

  // Quick Actions for profile improvement
  const quickActions = [
    {
      id: 'complete-profile',
      title: 'Complete Profile',
      description: 'Fill missing information',
      icon: <Person />,
      color: theme.palette.primary.main,
      action: () => setEditMode(true),
      show: profileCompletion.score < 80
    },
    {
      id: 'take-test',
      title: 'Take Assessment',
      description: 'Boost your profile',
      icon: <Psychology />,
      color: '#9C27B0',
      action: () => navigate('/app/tests'),
      show: true
    },
    {
      id: 'view-applications',
      title: 'My Applications',
      description: 'Track your progress',
      icon: <Assignment />,
      color: theme.palette.info.main,
      action: () => navigate('/app/applications'),
      show: true
    },
    {
      id: 'find-jobs',
      title: 'Find Jobs',
      description: 'Discover opportunities',
      icon: <Work />,
      color: theme.palette.success.main,
      action: () => navigate('/app/jobs'),
      show: true
    }
  ].filter(action => action.show);

  useEffect(() => {
    if (user) {
      // Only update profile state if user data has significantly changed
      // This prevents unnecessary re-renders during profile picture uploads
      setProfile(prevProfile => {
        if (!prevProfile || prevProfile._id !== user._id || 
            prevProfile.firstName !== user.firstName ||
            prevProfile.lastName !== user.lastName ||
            prevProfile.email !== user.email) {
          return user as User;
        }
        // For minor updates like profile picture, merge with existing data
        return {
          ...prevProfile,
          ...user,
          profilePicture: (user as any).profilePicture || prevProfile.profilePicture
        } as User;
      });
      
      setEditedProfile(prevEdited => {
        // Only update edited profile if it's empty or user has changed
        if (!prevEdited.firstName && !prevEdited.lastName) {
          return {
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            phone: (user as any).phone || '',
            location: (user as any).location || '',
            bio: (user as any).bio || ''
          };
        }
        return prevEdited;
      });
    }
  }, [user]);

  // Check for edit query parameter and auto-enable edit mode
  useEffect(() => {
    const shouldEdit = searchParams.get('edit') === 'true';
    if (shouldEdit) {
      setEditMode(true);
      // Clear the edit parameter from URL after setting edit mode
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('edit');
      navigate({ search: newSearchParams.toString() }, { replace: true });
    }
  }, [searchParams, navigate]);

  const handleSaveProfile = async () => {
    if (!profile?._id) return;

    setLoading(true);
    try {
      const updatedProfile = await userService.updateProfile(profile._id, editedProfile);
      setProfile(updatedProfile);
      setUserData(updatedProfile);
      setEditMode(false);
      setSuccessMessage('Profile updated successfully! 🎉');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrorMessage('Failed to update profile');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile?._id) return;

    try {
      // Validate the image file
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setErrorMessage(validation.error || 'Invalid image file');
        setTimeout(() => setErrorMessage(''), 5000);
        // Clear the file input
        event.target.value = '';
        return;
      }

      setUploadingImage(true);
      setErrorMessage('');
      
      // Create preview for immediate UI feedback
      const preview = await createImagePreview(file);
      setImagePreview(preview);

      // Process the image (resize and compress)
      const processedBlob = await processImage(file, {
        maxWidth: 400,
        maxHeight: 400,
        quality: 0.8,
        format: 'image/jpeg'
      });

      // Convert blob back to file
      const processedFile = blobToFile(processedBlob, `profile-${profile._id}.jpg`);
      
      // Create form data for upload
      const formData = new FormData();
      formData.append('profilePicture', processedFile);
      
      // Upload to server
      const updatedProfile = await userService.uploadProfilePicture(profile._id, formData);
      
      // Update local state with the response - preserve existing profile data
      setProfile(prevProfile => ({
        ...prevProfile,
        ...updatedProfile,
        profilePicture: updatedProfile.profilePicture || preview
      }));
      
      // Update auth context with merged data to prevent losing other profile information
      setUserData({
        ...profile,
        ...updatedProfile,
        profilePicture: updatedProfile.profilePicture || preview
      });
      
      setSuccessMessage('Profile picture updated successfully!');
      setTimeout(() => {
        setSuccessMessage('');
        setImagePreview(null);
      }, 3000);
      
      // Clear the file input to allow re-upload of the same file if needed
      event.target.value = '';

    } catch (error) {
      console.error('Error uploading profile picture:', error);
      
      let errorMsg = 'Failed to upload profile picture. Please try again.';
      if (error instanceof Error) {
        errorMsg = error.message;
      }
      
      setErrorMessage(errorMsg);
      setTimeout(() => setErrorMessage(''), 5000);
      
      // Clear the file input on error as well
      event.target.value = '';
      
      // Reset preview on error
      setImagePreview(null);
    } finally {
      setUploadingImage(false);
      // Clear the file input
      event.target.value = '';
    }
  };

  if (!profile) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <LinearProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          👤 My Profile
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Manage your professional information and boost your career
        </Typography>
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

      {/* Profile Action Banner */}
      <Paper 
        sx={{ 
          p: 4, 
          mb: 4, 
          borderRadius: 4,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.08)} 100%)`,
          border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            zIndex: 1
          }
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Box>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Profile Completion: {profileCompletion.score}%
              </Typography>
              <Typography variant="body1" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
                {profileCompletion.completedFields} of {profileCompletion.totalFields} fields completed
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={profileCompletion.score}
                sx={{ 
                  height: 12, 
                  borderRadius: 6,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  mb: 2,
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 6,
                    background: profileCompletion.score >= 80 ? 
                      `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.success.light})` :
                      profileCompletion.score >= 50 ? 
                      `linear-gradient(90deg, ${theme.palette.warning.main}, ${theme.palette.warning.light})` : 
                      `linear-gradient(90deg, ${theme.palette.error.main}, ${theme.palette.error.light})`
                  }
                }} 
              />
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {profileCompletion.score >= 80 && (
                  <Chip
                    icon={<CheckCircle />}
                    label="Profile Complete"
                    color="success"
                    size="small"
                    sx={{ fontWeight: 'medium' }}
                  />
                )}
                <Chip
                  label={`${profileCompletion.score}% Complete`}
                  color={profileCompletion.score >= 80 ? "success" : profileCompletion.score >= 50 ? "warning" : "error"}
                  size="small"
                  variant="outlined"
                />
              </Stack>
            </Box>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
            <Stack spacing={2} alignItems="center">
              {profileCompletion.score >= 80 ? (
                <CheckCircle sx={{ fontSize: 48, color: theme.palette.success.main }} />
              ) : (
                <Warning sx={{ fontSize: 48, color: theme.palette.warning.main }} />
              )}
              <Button
                variant="contained"
                onClick={() => setEditMode(true)}
                startIcon={<Edit />}
                size="large"
                sx={{ 
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  color: 'white',
                  fontWeight: 'bold',
                  px: 3,
                  py: 1.5,
                  borderRadius: 3,
                  boxShadow: `0 4px 15px ${alpha(theme.palette.primary.main, 0.3)}`,
                  '&:hover': {
                    background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                    transform: 'translateY(-2px)',
                    boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                Complete My Profile
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={4}>
        {/* Profile Summary Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: 'fit-content', borderRadius: 3 }}>
            <CardContent sx={{ textAlign: 'center', p: 4 }}>
              <Box sx={{ position: 'relative', display: 'inline-block', mb: 3 }}>
                <Avatar
                  sx={{
                    width: 120,
                    height: 120,
                    mx: 'auto',
                    fontSize: '3rem',
                    border: `4px solid ${theme.palette.primary.main}`,
                    boxShadow: theme.shadows[3],
                    opacity: uploadingImage ? 0.6 : 1,
                    transition: 'opacity 0.3s ease'
                  }}
                  src={imagePreview || profile.profilePicture}
                >
                  {!imagePreview && !profile.profilePicture && `${profile.firstName?.[0] || ''}${profile.lastName?.[0] || ''}`}
                </Avatar>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="profile-picture-upload"
                  type="file"
                  onChange={handleProfilePictureUpload}
                />
                <label htmlFor="profile-picture-upload">
                  <Tooltip title="Upload profile picture">
                    <IconButton
                      component="span"
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        bgcolor: theme.palette.primary.main,
                        color: 'white',
                        '&:hover': { bgcolor: theme.palette.primary.dark },
                        boxShadow: theme.shadows[2]
                      }}
                      size="small"
                    >
                      <Upload />
                    </IconButton>
                  </Tooltip>
                </label>
              </Box>
              
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                {profile.firstName} {profile.lastName}
              </Typography>
              <Typography variant="body1" color="textSecondary" gutterBottom sx={{ mb: 2 }}>
                {profile.email}
              </Typography>
              
              <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 3 }}>
                <Chip
                  label={profile.role?.replace('_', ' ') || 'User'}
                  color="primary"
                  variant="outlined"
                />
                {profileCompletion.score >= 80 && (
                  <Chip
                    icon={<Star />}
                    label="Complete"
                    color="success"
                    variant="outlined"
                  />
                )}
              </Stack>
              
              {!editMode ? (
                <Stack spacing={1}>
                  <Button
                    variant="contained"
                    onClick={() => setEditMode(true)}
                    startIcon={<Edit />}
                    fullWidth
                    size="large"
                    sx={{ 
                      background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                      color: 'white',
                      fontWeight: 'bold',
                      py: 1.5,
                      boxShadow: `0 4px 15px ${alpha(theme.palette.primary.main, 0.3)}`,
                      '&:hover': {
                        background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                        transform: 'translateY(-1px)',
                        boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {profileCompletion.score >= 80 ? '✏️ Update My Profile' : '✏️ Complete My Profile'}
                  </Button>
                  <Typography variant="caption" color="text.secondary" textAlign="center" sx={{ mt: 1 }}>
                    Click to edit your personal information, skills, and experience
                  </Typography>
                </Stack>
              ) : (
                <Stack spacing={1}>
                  <Button
                    variant="contained"
                    onClick={handleSaveProfile}
                    startIcon={<Save />}
                    fullWidth
                    size="large"
                    disabled={loading}
                    color="success"
                    sx={{ fontWeight: 'bold' }}
                  >
                    {loading ? 'Saving Changes...' : 'Save Changes'}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setEditMode(false)}
                    startIcon={<Cancel />}
                    fullWidth
                    size="large"
                    color="error"
                  >
                    Cancel
                  </Button>
                </Stack>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card sx={{ mt: 3, borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                ⚡ Quick Actions
              </Typography>
              <Stack spacing={2}>
                {quickActions.map((action) => (
                  <Button
                    key={action.id}
                    variant="outlined"
                    startIcon={action.icon}
                    onClick={action.action}
                    fullWidth
                    sx={{
                      justifyContent: 'flex-start',
                      color: action.color,
                      borderColor: action.color,
                      '&:hover': {
                        bgcolor: alpha(action.color, 0.1),
                        borderColor: action.color
                      }
                    }}
                  >
                    <Box sx={{ textAlign: 'left' }}>
                      <Typography variant="body2" fontWeight="medium">
                        {action.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {action.description}
                      </Typography>
                    </Box>
                  </Button>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Profile Details */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
                Personal Information
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={editMode ? (editedProfile.firstName || '') : profile.firstName || 'Not provided'}
                    onChange={(e) => setEditedProfile(prev => ({ ...prev, firstName: e.target.value }))}
                    disabled={!editMode}
                    variant={editMode ? "outlined" : "filled"}
                    InputProps={{
                      startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={editMode ? (editedProfile.lastName || '') : profile.lastName || 'Not provided'}
                    onChange={(e) => setEditedProfile(prev => ({ ...prev, lastName: e.target.value }))}
                    disabled={!editMode}
                    variant={editMode ? "outlined" : "filled"}
                    InputProps={{
                      startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    value={profile.email}
                    disabled
                    variant="filled"
                    InputProps={{
                      startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    value={editMode ? (editedProfile.phone || '') : profile.phone || 'Not provided'}
                    onChange={(e) => setEditedProfile(prev => ({ ...prev, phone: e.target.value }))}
                    disabled={!editMode}
                    variant={editMode ? "outlined" : "filled"}
                    InputProps={{
                      startAdornment: <Phone sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Location"
                    value={editMode ? (editedProfile.location || '') : profile.location || 'Not provided'}
                    onChange={(e) => setEditedProfile(prev => ({ ...prev, location: e.target.value }))}
                    disabled={!editMode}
                    variant={editMode ? "outlined" : "filled"}
                    InputProps={{
                      startAdornment: <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Bio / Professional Summary"
                    value={editMode ? (editedProfile.bio || '') : profile.bio || 'Tell us about yourself...'}
                    onChange={(e) => setEditedProfile(prev => ({ ...prev, bio: e.target.value }))}
                    disabled={!editMode}
                    variant={editMode ? "outlined" : "filled"}
                    multiline
                    rows={editMode ? 4 : 3}
                    placeholder="Tell us about your professional background, skills, and career goals..."
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 4 }} />

              {/* Skills Section */}
              <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
                Skills
              </Typography>
              <Box sx={{ mb: 3 }}>
                {profile.skills && profile.skills.length > 0 ? (
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {profile.skills.map((skill, index) => (
                      <Chip
                        key={index}
                        label={skill}
                        color="primary"
                        variant="outlined"
                        sx={{ mb: 1 }}
                      />
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No skills added yet. Add your skills to improve your profile visibility.
                  </Typography>
                )}
              </Box>

              {/* Experience Section */}
              <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
                Experience
              </Typography>
              <Box>
                {profile.experience && profile.experience.length > 0 ? (
                  <Stack spacing={2}>
                    {profile.experience.map((exp, index) => (
                      <Paper key={index} sx={{ p: 2, bgcolor: 'grey.50' }}>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {exp.position} at {exp.company}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {exp.startDate} - {exp.endDate || 'Present'}
                        </Typography>
                        {exp.description && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            {exp.description}
                          </Typography>
                        )}
                      </Paper>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No work experience added yet. Add your experience to showcase your background.
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ImprovedProfilePage;
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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  LinearProgress,
  Tabs,
  Tab,
  Paper,
  Switch,
  FormControlLabel,
  Fade,
  Slide
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
  DateRange,
  Security,
  Notifications,
  Upload,
  Download,
  Visibility,
  VisibilityOff,
  Star,
  BookmarkBorder,
  Assignment,
  EmojiEvents,
  Settings,
  Warning,
  CheckCircle
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';
import type { User } from '../types/user';
import { useLocation } from 'react-router-dom';
import ProfileCompletion from '../components/ProfileCompletion';
import ComprehensiveProfileForm from '../components/ComprehensiveProfileForm';
import { validateProfile } from '../utils/profileValidation';
import { validateProfileSimple } from '../utils/simpleProfileValidation';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ProfilePage: React.FC = () => {
  const { user, updateUser, setUserData } = useAuth();
  const location = useLocation();
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [comprehensiveEditMode, setComprehensiveEditMode] = useState(false);
  const [profile, setProfile] = useState<User | null>(user);
  const [editedProfile, setEditedProfile] = useState<Partial<User>>({});
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [profileValidation, setProfileValidation] = useState<any>(null);

  // Password change form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Privacy settings
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    showEmail: false,
    showPhone: false,
    showLocation: true,
    allowMessages: true,
    allowJobAlerts: true
  });

  // Force component re-mount on location change
  useEffect(() => {
    console.log('🚀 ProfilePage mounted/remounted on location:', location.pathname);
    if (user && location.pathname === '/app/profile') {
      console.log('🔄 ProfilePage initializing for user:', user.email);
      // Reset all states to ensure fresh render
      setLoading(true);
      setProfile(null);
      setProfileValidation(null);
      setEditMode(false);
      setCurrentTab(0);
      loadUserProfile();
    }
  }, [location.key, user]); // Using location.key instead of pathname for better detection

  useEffect(() => {
    if (user) {
      console.log('🔄 ProfilePage user changed, loading profile');
      loadUserProfile();
    }
  }, [user]);

  // Also refresh when the page becomes visible (user navigates back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        console.log('🔄 ProfilePage became visible, refreshing profile');
        loadUserProfile();
      }
    };

    const handleFocus = () => {
      if (user) {
        console.log('🔄 ProfilePage window focused, refreshing profile');
        loadUserProfile();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user]);

  useEffect(() => {
    if (profile) {
      console.log('🔍 ProfilePage validating profile:', profile);
      const validation = validateProfileSimple(profile);
      console.log('📊 ProfilePage validation result:', validation);
      setProfileValidation(validation);
    }
  }, [profile]);

  const loadUserProfile = async () => {
    if (!user?._id) return;
    
    console.log('🔍 ProfilePage loading user profile for:', user._id);
    setLoading(true);
    try {
      const userProfile = await userService.getUserProfile(user._id);
      console.log('📋 ProfilePage loaded user profile:', userProfile);
      setProfile(userProfile);
      setEditedProfile(userProfile);
    } catch (error) {
      console.error('❌ Error loading profile:', error);
      setErrorMessage('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleEditToggle = () => {
    setEditMode(!editMode);
    if (!editMode) {
      setEditedProfile({ ...profile });
    } else {
      setEditedProfile({});
    }
  };

  const handleSaveProfile = async () => {
    if (!profile?._id) return;

    setLoading(true);
    try {
      console.log('🔄 ProfilePage updating profile with data:', editedProfile);
      const updatedProfile = await userService.updateProfile(profile._id, editedProfile);
      console.log('✅ ProfilePage received updated profile:', updatedProfile);
      
      // Update local state with the response
      setProfile(updatedProfile);
      setUserData(updatedProfile);
      
      // Fetch fresh data from the server to ensure we have the latest profile completion
      console.log('🔄 ProfilePage fetching fresh data after update');
      await loadUserProfile();
      
      setEditMode(false);
      setSuccessMessage('Profile updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      setErrorMessage('Failed to update profile');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setErrorMessage('New passwords do not match');
      return;
    }

    if (!profile?._id) return;

    setLoading(true);
    try {
      await userService.changePassword(profile._id, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setPasswordDialog(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setSuccessMessage('Password changed successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error changing password:', error);
      setErrorMessage('Failed to change password');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile?._id) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);
      
      console.log('🔄 ProfilePage uploading profile picture');
      const updatedProfile = await userService.uploadProfilePicture(profile._id, formData);
      console.log('✅ ProfilePage profile picture uploaded:', updatedProfile);
      
      // Update local state with the response
      setProfile(updatedProfile);
      setUserData(updatedProfile);
      
      // Fetch fresh data from the server to ensure we have the latest profile completion
      console.log('🔄 ProfilePage fetching fresh data after picture upload');
      await loadUserProfile();
      
      setSuccessMessage('Profile picture updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('❌ Error uploading profile picture:', error);
      setErrorMessage('Failed to upload profile picture');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleComprehensiveProfileSave = async (updatedData: Partial<User>) => {
    // Use the authenticated user's ID instead of profile ID
    const userId = user?._id || profile?._id;
    
    if (!userId) {
      console.error('No user ID available for update');
      setErrorMessage('Unable to save profile: User not authenticated');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    console.log('🚀 Starting profile save process:', {
      userId: userId,
      profileId: profile?._id,
      dataKeys: Object.keys(updatedData),
      sampleData: {
        firstName: updatedData.firstName,
        lastName: updatedData.lastName,
        email: updatedData.email,
        jobTitle: updatedData.jobTitle
      }
    });

    setLoading(true);
    try {
      const updatedProfile = await userService.updateProfile(userId, updatedData);
      console.log('✅ Profile updated successfully:', updatedProfile);
      
      // Update local state with the response
      setProfile(updatedProfile);
      setUserData(updatedProfile);
      
      // Fetch fresh data from the server to ensure we have the latest profile completion
      console.log('🔄 ProfilePage fetching fresh data after comprehensive update');
      await loadUserProfile();
      
      setComprehensiveEditMode(false);
      setSuccessMessage('Profile updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('❌ Error updating comprehensive profile:', error);
      setErrorMessage('Failed to update profile');
      setTimeout(() => setErrorMessage(''), 3000);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleStartComprehensiveEdit = () => {
    setComprehensiveEditMode(true);
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

  // Show comprehensive profile form if in edit mode
  if (comprehensiveEditMode) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            <Edit sx={{ mr: 2, verticalAlign: 'middle', fontSize: 'inherit' }} />
            Complete Your Profile
          </Typography>
          <Typography variant="h6" color="textSecondary">
            Fill out all sections to maximize your job opportunities
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

        <ComprehensiveProfileForm
          key={`comprehensive-form-${profile?.updatedAt || Date.now()}`}
          user={profile}
          onSave={handleComprehensiveProfileSave}
          onCancel={() => setComprehensiveEditMode(false)}
          loading={loading}
        />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          <Person sx={{ mr: 2, verticalAlign: 'middle', fontSize: 'inherit' }} />
          My Profile
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

      {/* Profile Completion Component */}
      {profileValidation && profile && (
        <Fade in timeout={1000}>
          <Box sx={{ mb: 3 }}>
            <ProfileCompletion
              key={`profile-completion-${profile.updatedAt || Date.now()}`}
              user={profile}
              onEditProfile={handleStartComprehensiveEdit}
              showFeatureAccess={true}
              compact={false}
            />
          </Box>
        </Fade>
      )}

      <Grid container spacing={3}>
        {/* Profile Summary Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ textAlign: 'center', p: 3 }}>
            <CardContent>
              <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
                <Avatar
                  sx={{
                    width: 120,
                    height: 120,
                    mx: 'auto',
                    mb: 2,
                    fontSize: '3rem'
                  }}
                  src={profile.profilePicture}
                >
                  {profile.firstName?.[0]}{profile.lastName?.[0]}
                </Avatar>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="profile-picture-upload"
                  type="file"
                  onChange={handleProfilePictureUpload}
                />
                <label htmlFor="profile-picture-upload">
                  <IconButton
                    component="span"
                    sx={{
                      position: 'absolute',
                      bottom: 16,
                      right: 0,
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': { bgcolor: 'primary.dark' }
                    }}
                    size="small"
                  >
                    <Upload />
                  </IconButton>
                </label>
              </Box>
              
              <Typography variant="h5" gutterBottom>
                {profile.firstName} {profile.lastName}
              </Typography>
              <Typography variant="body1" color="textSecondary" gutterBottom>
                {profile.email}
              </Typography>
              <Chip
                label={profile.role?.replace('_', ' ') || 'User'}
                color="primary"
                sx={{ mb: 2 }}
              />
              
              <Box sx={{ mt: 3 }}>
                <Button
                  variant={editMode ? "outlined" : "contained"}
                  onClick={handleEditToggle}
                  startIcon={editMode ? <Cancel /> : <Edit />}
                  fullWidth
                  sx={{ mb: 1 }}
                >
                  {editMode ? 'Cancel Edit' : 'Edit Profile'}
                </Button>
                {editMode && (
                  <Button
                    variant="contained"
                    onClick={handleSaveProfile}
                    startIcon={<Save />}
                    fullWidth
                    disabled={loading}
                  >
                    Save Changes
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Profile Details */}
        <Grid item xs={12} md={8}>
          <Card>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={currentTab} onChange={handleTabChange}>
                <Tab label="Personal Info" icon={<Person />} />
                <Tab label="Security" icon={<Security />} />
                <Tab label="Privacy" icon={<Settings />} />
                <Tab label="Activity" icon={<Assignment />} />
              </Tabs>
            </Box>

            {/* Personal Information Tab */}
            <TabPanel value={currentTab} index={0}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={editMode ? (editedProfile.firstName || '') : profile.firstName}
                    onChange={(e) => setEditedProfile(prev => ({ ...prev, firstName: e.target.value }))}
                    disabled={!editMode}
                    variant={editMode ? "outlined" : "filled"}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={editMode ? (editedProfile.lastName || '') : profile.lastName}
                    onChange={(e) => setEditedProfile(prev => ({ ...prev, lastName: e.target.value }))}
                    disabled={!editMode}
                    variant={editMode ? "outlined" : "filled"}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={editMode ? (editedProfile.email || '') : profile.email}
                    onChange={(e) => setEditedProfile(prev => ({ ...prev, email: e.target.value }))}
                    disabled={!editMode}
                    variant={editMode ? "outlined" : "filled"}
                    type="email"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={editMode ? (editedProfile.phone || '') : profile.phone || ''}
                    onChange={(e) => setEditedProfile(prev => ({ ...prev, phone: e.target.value }))}
                    disabled={!editMode}
                    variant={editMode ? "outlined" : "filled"}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Location"
                    value={editMode ? (editedProfile.location || '') : profile.location || ''}
                    onChange={(e) => setEditedProfile(prev => ({ ...prev, location: e.target.value }))}
                    disabled={!editMode}
                    variant={editMode ? "outlined" : "filled"}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Bio"
                    multiline
                    rows={4}
                    value={editMode ? (editedProfile.bio || '') : profile.bio || ''}
                    onChange={(e) => setEditedProfile(prev => ({ ...prev, bio: e.target.value }))}
                    disabled={!editMode}
                    variant={editMode ? "outlined" : "filled"}
                  />
                </Grid>
              </Grid>
            </TabPanel>

            {/* Security Tab */}
            <TabPanel value={currentTab} index={1}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Account Security
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <Security />
                    </ListItemIcon>
                    <ListItemText
                      primary="Change Password"
                      secondary="Update your account password"
                    />
                    <Button
                      variant="outlined"
                      onClick={() => setPasswordDialog(true)}
                    >
                      Change
                    </Button>
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemIcon>
                      <DateRange />
                    </ListItemIcon>
                    <ListItemText
                      primary="Last Login"
                      secondary={profile.lastLogin ? new Date(profile.lastLogin).toLocaleString() : 'Never'}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <DateRange />
                    </ListItemIcon>
                    <ListItemText
                      primary="Account Created"
                      secondary={new Date(profile.createdAt).toLocaleString()}
                    />
                  </ListItem>
                </List>
              </Box>
            </TabPanel>

            {/* Privacy Tab */}
            <TabPanel value={currentTab} index={2}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Privacy Settings
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Profile Visibility"
                      secondary="Control who can see your profile"
                    />
                    <FormControl sx={{ minWidth: 120 }}>
                      <Select
                        value={privacySettings.profileVisibility}
                        onChange={(e) => setPrivacySettings(prev => ({ ...prev, profileVisibility: e.target.value }))}
                        size="small"
                      >
                        <MenuItem value="public">Public</MenuItem>
                        <MenuItem value="employers">Employers Only</MenuItem>
                        <MenuItem value="private">Private</MenuItem>
                      </Select>
                    </FormControl>
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText primary="Show Email Address" />
                    <Switch
                      checked={privacySettings.showEmail}
                      onChange={(e) => setPrivacySettings(prev => ({ ...prev, showEmail: e.target.checked }))}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Show Phone Number" />
                    <Switch
                      checked={privacySettings.showPhone}
                      onChange={(e) => setPrivacySettings(prev => ({ ...prev, showPhone: e.target.checked }))}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Show Location" />
                    <Switch
                      checked={privacySettings.showLocation}
                      onChange={(e) => setPrivacySettings(prev => ({ ...prev, showLocation: e.target.checked }))}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Allow Messages" />
                    <Switch
                      checked={privacySettings.allowMessages}
                      onChange={(e) => setPrivacySettings(prev => ({ ...prev, allowMessages: e.target.checked }))}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Job Alert Notifications" />
                    <Switch
                      checked={privacySettings.allowJobAlerts}
                      onChange={(e) => setPrivacySettings(prev => ({ ...prev, allowJobAlerts: e.target.checked }))}
                    />
                  </ListItem>
                </List>
              </Box>
            </TabPanel>

            {/* Activity Tab */}
            <TabPanel value={currentTab} index={3}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Recent Activity
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <Work />
                    </ListItemIcon>
                    <ListItemText
                      primary="Job Applications"
                      secondary={`${profile.applicationCount || 0} applications submitted`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <BookmarkBorder />
                    </ListItemIcon>
                    <ListItemText
                      primary="Saved Jobs"
                      secondary={`${profile.savedJobsCount || 0} jobs bookmarked`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <EmojiEvents />
                    </ListItemIcon>
                    <ListItemText
                      primary="Certificates"
                      secondary={`${profile.certificatesCount || 0} certificates earned`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Assignment />
                    </ListItemIcon>
                    <ListItemText
                      primary="Tests Completed"
                      secondary={`${profile.testsCompletedCount || 0} assessments taken`}
                    />
                  </ListItem>
                </List>
              </Box>
            </TabPanel>
          </Card>
        </Grid>
      </Grid>

      {/* Password Change Dialog */}
      <Dialog open={passwordDialog} onClose={() => setPasswordDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              type="password"
              label="Current Password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              type="password"
              label="New Password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              type="password"
              label="Confirm New Password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialog(false)}>Cancel</Button>
          <Button
            onClick={handlePasswordChange}
            variant="contained"
            disabled={loading || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
          >
            Change Password
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProfilePage;
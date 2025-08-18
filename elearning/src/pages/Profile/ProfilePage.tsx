import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Paper,
  LinearProgress,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  OutlinedInput,
  InputAdornment,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  Edit,
  Save,
  Cancel,
  PhotoCamera,
  Email,
  Person,
  AdminPanelSettings,
  Security,
  Visibility,
  VisibilityOff,
  CalendarToday,
  Badge,
  TrendingUp,
  Settings,
  Notifications,
  Shield,
  Key,
  AccountCircle,
  Dashboard,
  Analytics
} from '@mui/icons-material';

import { useAuth } from '../../hooks/useAuth';
import { userService, UpdateProfileData, ChangePasswordData } from '../../services/userService';
import { IUser } from '../../shared/types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState(0);

  // Profile editing state
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState<UpdateProfileData>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || ''
  });

  // Password change state
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordData, setPasswordData] = useState<ChangePasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Avatar upload state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Profile stats (mock data for now)
  const [profileStats] = useState({
    totalLogins: 156,
    lastLogin: new Date().toISOString(),
    accountAge: 45, // days
    securityScore: 85,
    actionsPerformed: 1234,
    systemsManaged: 8
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      });
    }
  }, [user]);

  // Clear alerts after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleProfileEdit = () => {
    setEditingProfile(true);
  };

  const handleProfileCancel = () => {
    setEditingProfile(false);
    if (user) {
      setProfileData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      });
    }
  };

  const handleProfileSave = async () => {
    try {
      setLoading(true);
      setError(null);

      const updatedUser = await userService.updateProfile(profileData);
      updateUser(updatedUser);
      setEditingProfile(false);
      setSuccess('Profile updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    try {
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setError('New passwords do not match');
        return;
      }

      if (passwordData.newPassword.length < 8) {
        setError('New password must be at least 8 characters long');
        return;
      }

      setLoading(true);
      setError(null);

      await userService.changePassword(passwordData);
      setPasswordDialogOpen(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setSuccess('Password changed successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }

      setError(null);
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;

    try {
      setLoading(true);
      setError(null);

      const result = await userService.uploadAvatar(avatarFile);

      // Update the user context with the new user data from the upload response
      updateUser(result.user);

      // Update local profile data
      setProfileData(prev => ({
        ...prev,
        avatar: result.avatarUrl
      }));

      setAvatarFile(null);
      setAvatarPreview(null);
      setSuccess('Avatar updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload avatar');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSecurityScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  if (!user) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          Admin Profile
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your account settings and preferences
        </Typography>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Profile Overview Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                <Box position="relative" mb={2}>
                  <Avatar
                    src={avatarPreview || user.avatar || undefined}
                    sx={{
                      width: 120,
                      height: 120,
                      mb: 2,
                      border: '4px solid',
                      borderColor: 'primary.main'
                    }}
                  >
                    {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                  </Avatar>
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="avatar-upload"
                    type="file"
                    onChange={handleAvatarChange}
                  />
                  <label htmlFor="avatar-upload">
                    <Tooltip title="Upload new profile picture (Max 5MB, JPG/PNG/GIF/WebP)">
                      <IconButton
                        component="span"
                        sx={{
                          position: 'absolute',
                          bottom: 16,
                          right: -8,
                          backgroundColor: 'primary.main',
                          color: 'white',
                          '&:hover': {
                            backgroundColor: 'primary.dark',
                          },
                        }}
                      >
                        <PhotoCamera />
                      </IconButton>
                    </Tooltip>
                  </label>
                </Box>

                {avatarFile && (
                  <Box mb={2}>
                    <Typography variant="caption" display="block" sx={{ mb: 1 }}>
                      New avatar selected
                    </Typography>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={handleAvatarUpload}
                      disabled={loading}
                      sx={{ mr: 1 }}
                      startIcon={loading ? <CircularProgress size={16} /> : <PhotoCamera />}
                    >
                      {loading ? 'Uploading...' : 'Upload'}
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        setAvatarFile(null);
                        setAvatarPreview(null);
                      }}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                  </Box>
                )}

                <Typography variant="h5" gutterBottom>
                  {user.firstName} {user.lastName}
                </Typography>

                <Chip
                  icon={<AdminPanelSettings />}
                  label="Administrator"
                  color="primary"
                  variant="outlined"
                  sx={{ mb: 2 }}
                />

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {user.email}
                </Typography>

                <Box display="flex" alignItems="center" mt={1}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: user.isEmailVerified ? 'success.main' : 'error.main',
                      mr: 1
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Email {user.isEmailVerified ? 'Verified' : 'Not Verified'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Quick Stats Card */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Account Overview
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <CalendarToday />
                  </ListItemIcon>
                  <ListItemText
                    primary="Member Since"
                    secondary={formatDate(user.createdAt)}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <TrendingUp />
                  </ListItemIcon>
                  <ListItemText
                    primary="Total Logins"
                    secondary={profileStats.totalLogins.toLocaleString()}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Dashboard />
                  </ListItemIcon>
                  <ListItemText
                    primary="Actions Performed"
                    secondary={profileStats.actionsPerformed.toLocaleString()}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Shield />
                  </ListItemIcon>
                  <ListItemText
                    primary="Security Score"
                    secondary={
                      <Box display="flex" alignItems="center" mt={1}>
                        <LinearProgress
                          variant="determinate"
                          value={profileStats.securityScore}
                          color={getSecurityScoreColor(profileStats.securityScore) as any}
                          sx={{ flexGrow: 1, mr: 1 }}
                        />
                        <Typography variant="caption">
                          {profileStats.securityScore}%
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Main Content */}
        <Grid item xs={12} md={8}>
          <Paper>
            <Tabs
              value={currentTab}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
            >
              <Tab icon={<Person />} label="Personal Info" />
              <Tab icon={<Security />} label="Security" />
              <Tab icon={<Settings />} label="Preferences" />
              <Tab icon={<Analytics />} label="Activity" />
            </Tabs>

            {/* Personal Information Tab */}
            <TabPanel value={currentTab} index={0}>
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="h6">Personal Information</Typography>
                  {!editingProfile ? (
                    <Button
                      variant="outlined"
                      startIcon={<Edit />}
                      onClick={handleProfileEdit}
                    >
                      Edit Profile
                    </Button>
                  ) : (
                    <Box>
                      <Button
                        variant="contained"
                        startIcon={<Save />}
                        onClick={handleProfileSave}
                        disabled={loading}
                        sx={{ mr: 1 }}
                      >
                        Save
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<Cancel />}
                        onClick={handleProfileCancel}
                      >
                        Cancel
                      </Button>
                    </Box>
                  )}
                </Box>

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="First Name"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                      disabled={!editingProfile}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Last Name"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                      disabled={!editingProfile}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      disabled={!editingProfile}
                      variant="outlined"
                      type="email"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Role"
                      value="Administrator"
                      disabled
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Account Status"
                      value={user.isActive ? 'Active' : 'Inactive'}
                      disabled
                      variant="outlined"
                    />
                  </Grid>
                </Grid>
              </Box>
            </TabPanel>

            {/* Security Tab */}
            <TabPanel value={currentTab} index={1}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Security Settings
                </Typography>

                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="subtitle1" gutterBottom>
                              Password
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Last changed: {formatDate(user.updatedAt)}
                            </Typography>
                          </Box>
                          <Button
                            variant="outlined"
                            startIcon={<Key />}
                            onClick={() => setPasswordDialogOpen(true)}
                          >
                            Change Password
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="subtitle1" gutterBottom>
                              Email Verification
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Your email address is {user.isEmailVerified ? 'verified' : 'not verified'}
                            </Typography>
                          </Box>
                          <Chip
                            label={user.isEmailVerified ? 'Verified' : 'Not Verified'}
                            color={user.isEmailVerified ? 'success' : 'warning'}
                            icon={user.isEmailVerified ? <Shield /> : <Email />}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          Security Score
                        </Typography>
                        <Box display="flex" alignItems="center" mb={2}>
                          <LinearProgress
                            variant="determinate"
                            value={profileStats.securityScore}
                            color={getSecurityScoreColor(profileStats.securityScore) as any}
                            sx={{ flexGrow: 1, mr: 2 }}
                          />
                          <Typography variant="h6" color={`${getSecurityScoreColor(profileStats.securityScore)}.main`}>
                            {profileStats.securityScore}%
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          Your account security is {profileStats.securityScore >= 80 ? 'excellent' : profileStats.securityScore >= 60 ? 'good' : 'needs improvement'}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            </TabPanel>

            {/* Preferences Tab */}
            <TabPanel value={currentTab} index={2}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Account Preferences
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Customize your account settings and preferences
                </Typography>

                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          Notifications
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Manage how you receive notifications
                        </Typography>
                        <Button variant="outlined" startIcon={<Notifications />}>
                          Configure Notifications
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          System Preferences
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Customize your dashboard and system settings
                        </Typography>
                        <Button variant="outlined" startIcon={<Settings />}>
                          System Settings
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            </TabPanel>

            {/* Activity Tab */}
            <TabPanel value={currentTab} index={3}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Account Activity
                </Typography>

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          Last Login
                        </Typography>
                        <Typography variant="h6" color="primary">
                          {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          Account Created
                        </Typography>
                        <Typography variant="h6" color="primary">
                          {formatDate(user.createdAt)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          Recent Activity
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Activity tracking and detailed logs will be available in future updates
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            </TabPanel>
          </Paper>
        </Grid>
      </Grid>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
              <InputLabel>Current Password</InputLabel>
              <OutlinedInput
                type={showPasswords.current ? 'text' : 'password'}
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      edge="end"
                    >
                      {showPasswords.current ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                }
                label="Current Password"
              />
            </FormControl>

            <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
              <InputLabel>New Password</InputLabel>
              <OutlinedInput
                type={showPasswords.new ? 'text' : 'password'}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      edge="end"
                    >
                      {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                }
                label="New Password"
              />
            </FormControl>

            <FormControl fullWidth variant="outlined">
              <InputLabel>Confirm New Password</InputLabel>
              <OutlinedInput
                type={showPasswords.confirm ? 'text' : 'password'}
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      edge="end"
                    >
                      {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                }
                label="Confirm New Password"
              />
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handlePasswordChange}
            disabled={loading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
          >
            Change Password
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProfilePage;

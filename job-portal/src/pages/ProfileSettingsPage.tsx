import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider,
  FormGroup,
  Checkbox
} from '@mui/material';
import {
  Settings,
  Notifications,
  Security,
  Language,
  Palette,
  Save,
  Cancel,
  Edit,
  Delete,
  Add,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';

const ProfileSettingsPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Notification preferences
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    jobAlerts: true,
    applicationUpdates: true,
    interviewReminders: true,
    marketingEmails: false,
    weeklyDigest: true,
    instantNotifications: false
  });

  // Privacy settings
  const [privacy, setPrivacy] = useState({
    profileVisibility: 'public',
    showEmail: false,
    showPhone: false,
    showLocation: true,
    allowMessages: true,
    allowJobAlerts: true,
    showOnlineStatus: true,
    allowSearchIndexing: true
  });

  // Appearance settings
  const [appearance, setAppearance] = useState({
    theme: 'system',
    language: 'en',
    fontSize: 'medium',
    compactMode: false,
    showAnimations: true
  });

  // Account preferences
  const [preferences, setPreferences] = useState({
    autoSave: true,
    rememberMe: true,
    twoFactorAuth: false,
    sessionTimeout: 30,
    emailFrequency: 'immediate'
  });

  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, action: '', title: '', message: '' });

  useEffect(() => {
    if (user) {
      loadUserSettings();
    }
  }, [user]);

  const loadUserSettings = async () => {
    if (!user?._id) return;
    
    setLoading(true);
    try {
      const [privacySettings, userStats] = await Promise.all([
        userService.getPrivacySettings(user._id),
        userService.getUserStats(user._id)
      ]);
      
      setPrivacy(privacySettings);
      
      // Load other settings from user object or defaults
      if (user.notifications) {
        setNotifications(user.notifications);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setErrorMessage('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    if (!user?._id) return;

    setLoading(true);
    try {
      const updatedUser = await userService.updateProfile(user._id, { notifications });
      updateUser(updatedUser);
      setSuccessMessage('Notification preferences updated successfully');
      setEditingSection(null);
    } catch (error) {
      console.error('Error updating notifications:', error);
      setErrorMessage('Failed to update notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrivacy = async () => {
    if (!user?._id) return;

    setLoading(true);
    try {
      await userService.updatePrivacySettings(user._id, privacy);
      setSuccessMessage('Privacy settings updated successfully');
      setEditingSection(null);
    } catch (error) {
      console.error('Error updating privacy:', error);
      setErrorMessage('Failed to update privacy settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAppearance = async () => {
    if (!user?._id) return;

    setLoading(true);
    try {
      const updatedUser = await userService.updateProfile(user._id, { 
        preferences: { ...user.preferences, appearance }
      });
      updateUser(updatedUser);
      setSuccessMessage('Appearance settings updated successfully');
      setEditingSection(null);
    } catch (error) {
      console.error('Error updating appearance:', error);
      setErrorMessage('Failed to update appearance settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!user?._id) return;

    setLoading(true);
    try {
      const updatedUser = await userService.updateProfile(user._id, { 
        preferences: { ...preferences }
      });
      updateUser(updatedUser);
      setSuccessMessage('Account preferences updated successfully');
      setEditingSection(null);
    } catch (error) {
      console.error('Error updating preferences:', error);
      setErrorMessage('Failed to update account preferences');
    } finally {
      setLoading(false);
    }
  };

  const showConfirmDialog = (action: string, title: string, message: string) => {
    setConfirmDialog({ open: true, action, title, message });
  };

  const handleConfirmAction = () => {
    const { action } = confirmDialog;
    if (action === 'reset') {
      // Reset all settings to defaults
      loadUserSettings();
    } else if (action === 'delete') {
      // Handle account deletion
      console.log('Account deletion requested');
    }
    setConfirmDialog({ open: false, action: '', title: '', message: '' });
  };

  const SettingsSection = ({ title, icon, children, sectionKey, onSave }: any) => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {icon}
            <Typography variant="h6" sx={{ ml: 1 }}>
              {title}
            </Typography>
          </Box>
          {editingSection === sectionKey ? (
            <Box>
              <Button
                onClick={onSave}
                startIcon={<Save />}
                variant="contained"
                size="small"
                sx={{ mr: 1 }}
                disabled={loading}
              >
                Save
              </Button>
              <Button
                onClick={() => setEditingSection(null)}
                startIcon={<Cancel />}
                variant="outlined"
                size="small"
                disabled={loading}
              >
                Cancel
              </Button>
            </Box>
          ) : (
            <Button
              onClick={() => setEditingSection(sectionKey)}
              startIcon={<Edit />}
              variant="outlined"
              size="small"
            >
              Edit
            </Button>
          )}
        </Box>
        {children}
      </CardContent>
    </Card>
  );

  if (loading && !editingSection) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2, textAlign: 'center' }}>
          Loading Settings...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          <Settings sx={{ mr: 2, verticalAlign: 'middle', fontSize: 'inherit' }} />
          Profile Settings
        </Typography>
        <Typography variant="h6" color="textSecondary">
          Customize your account preferences and privacy settings
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

      {/* Notification Settings */}
      <SettingsSection
        title="Notification Preferences"
        icon={<Notifications color="primary" />}
        sectionKey="notifications"
        onSave={handleSaveNotifications}
      >
        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                checked={notifications.email}
                onChange={(e) => setNotifications(prev => ({ ...prev, email: e.target.checked }))}
                disabled={editingSection !== 'notifications'}
              />
            }
            label="Email Notifications"
          />
          <FormControlLabel
            control={
              <Switch
                checked={notifications.push}
                onChange={(e) => setNotifications(prev => ({ ...prev, push: e.target.checked }))}
                disabled={editingSection !== 'notifications'}
              />
            }
            label="Browser Push Notifications"
          />
          <FormControlLabel
            control={
              <Switch
                checked={notifications.sms}
                onChange={(e) => setNotifications(prev => ({ ...prev, sms: e.target.checked }))}
                disabled={editingSection !== 'notifications'}
              />
            }
            label="SMS Notifications"
          />
          <FormControlLabel
            control={
              <Switch
                checked={notifications.jobAlerts}
                onChange={(e) => setNotifications(prev => ({ ...prev, jobAlerts: e.target.checked }))}
                disabled={editingSection !== 'notifications'}
              />
            }
            label="Job Alert Notifications"
          />
          <FormControlLabel
            control={
              <Switch
                checked={notifications.applicationUpdates}
                onChange={(e) => setNotifications(prev => ({ ...prev, applicationUpdates: e.target.checked }))}
                disabled={editingSection !== 'notifications'}
              />
            }
            label="Application Status Updates"
          />
          <FormControlLabel
            control={
              <Switch
                checked={notifications.interviewReminders}
                onChange={(e) => setNotifications(prev => ({ ...prev, interviewReminders: e.target.checked }))}
                disabled={editingSection !== 'notifications'}
              />
            }
            label="Interview Reminders"
          />
        </FormGroup>

        {editingSection === 'notifications' && (
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Email Frequency</InputLabel>
              <Select
                value={preferences.emailFrequency}
                onChange={(e) => setPreferences(prev => ({ ...prev, emailFrequency: e.target.value }))}
                label="Email Frequency"
              >
                <MenuItem value="immediate">Immediate</MenuItem>
                <MenuItem value="daily">Daily Digest</MenuItem>
                <MenuItem value="weekly">Weekly Summary</MenuItem>
                <MenuItem value="never">Never</MenuItem>
              </Select>
            </FormControl>
          </Box>
        )}
      </SettingsSection>

      {/* Privacy Settings */}
      <SettingsSection
        title="Privacy & Visibility"
        icon={<Security color="primary" />}
        sectionKey="privacy"
        onSave={handleSavePrivacy}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Profile Visibility</InputLabel>
              <Select
                value={privacy.profileVisibility}
                onChange={(e) => setPrivacy(prev => ({ ...prev, profileVisibility: e.target.value }))}
                label="Profile Visibility"
                disabled={editingSection !== 'privacy'}
              >
                <MenuItem value="public">Public</MenuItem>
                <MenuItem value="employers">Employers Only</MenuItem>
                <MenuItem value="private">Private</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Box sx={{ mt: 2 }}>
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={privacy.showEmail}
                  onChange={(e) => setPrivacy(prev => ({ ...prev, showEmail: e.target.checked }))}
                  disabled={editingSection !== 'privacy'}
                />
              }
              label="Show Email Address"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={privacy.showPhone}
                  onChange={(e) => setPrivacy(prev => ({ ...prev, showPhone: e.target.checked }))}
                  disabled={editingSection !== 'privacy'}
                />
              }
              label="Show Phone Number"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={privacy.showLocation}
                  onChange={(e) => setPrivacy(prev => ({ ...prev, showLocation: e.target.checked }))}
                  disabled={editingSection !== 'privacy'}
                />
              }
              label="Show Location"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={privacy.allowMessages}
                  onChange={(e) => setPrivacy(prev => ({ ...prev, allowMessages: e.target.checked }))}
                  disabled={editingSection !== 'privacy'}
                />
              }
              label="Allow Direct Messages"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={privacy.showOnlineStatus}
                  onChange={(e) => setPrivacy(prev => ({ ...prev, showOnlineStatus: e.target.checked }))}
                  disabled={editingSection !== 'privacy'}
                />
              }
              label="Show Online Status"
            />
          </FormGroup>
        </Box>
      </SettingsSection>

      {/* Appearance Settings */}
      <SettingsSection
        title="Appearance & Display"
        icon={<Palette color="primary" />}
        sectionKey="appearance"
        onSave={handleSaveAppearance}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Theme</InputLabel>
              <Select
                value={appearance.theme}
                onChange={(e) => setAppearance(prev => ({ ...prev, theme: e.target.value }))}
                label="Theme"
                disabled={editingSection !== 'appearance'}
              >
                <MenuItem value="light">Light</MenuItem>
                <MenuItem value="dark">Dark</MenuItem>
                <MenuItem value="system">System Default</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Language</InputLabel>
              <Select
                value={appearance.language}
                onChange={(e) => setAppearance(prev => ({ ...prev, language: e.target.value }))}
                label="Language"
                disabled={editingSection !== 'appearance'}
              >
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="es">Spanish</MenuItem>
                <MenuItem value="fr">French</MenuItem>
                <MenuItem value="de">German</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Font Size</InputLabel>
              <Select
                value={appearance.fontSize}
                onChange={(e) => setAppearance(prev => ({ ...prev, fontSize: e.target.value }))}
                label="Font Size"
                disabled={editingSection !== 'appearance'}
              >
                <MenuItem value="small">Small</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="large">Large</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Box sx={{ mt: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={appearance.compactMode}
                onChange={(e) => setAppearance(prev => ({ ...prev, compactMode: e.target.checked }))}
                disabled={editingSection !== 'appearance'}
              />
            }
            label="Compact Mode"
          />
          <FormControlLabel
            control={
              <Switch
                checked={appearance.showAnimations}
                onChange={(e) => setAppearance(prev => ({ ...prev, showAnimations: e.target.checked }))}
                disabled={editingSection !== 'appearance'}
              />
            }
            label="Show Animations"
          />
        </Box>
      </SettingsSection>

      {/* Account Preferences */}
      <SettingsSection
        title="Account Preferences"
        icon={<Settings color="primary" />}
        sectionKey="preferences"
        onSave={handleSavePreferences}
      >
        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                checked={preferences.autoSave}
                onChange={(e) => setPreferences(prev => ({ ...prev, autoSave: e.target.checked }))}
                disabled={editingSection !== 'preferences'}
              />
            }
            label="Auto-save form data"
          />
          <FormControlLabel
            control={
              <Switch
                checked={preferences.rememberMe}
                onChange={(e) => setPreferences(prev => ({ ...prev, rememberMe: e.target.checked }))}
                disabled={editingSection !== 'preferences'}
              />
            }
            label="Remember me on this device"
          />
          <FormControlLabel
            control={
              <Switch
                checked={preferences.twoFactorAuth}
                onChange={(e) => setPreferences(prev => ({ ...prev, twoFactorAuth: e.target.checked }))}
                disabled={editingSection !== 'preferences'}
              />
            }
            label="Two-Factor Authentication"
          />
        </FormGroup>

        {editingSection === 'preferences' && (
          <Box sx={{ mt: 2 }}>
            <Typography gutterBottom>Session Timeout (minutes)</Typography>
            <Slider
              value={preferences.sessionTimeout}
              onChange={(e, value) => setPreferences(prev => ({ ...prev, sessionTimeout: value as number }))}
              min={15}
              max={480}
              step={15}
              marks={[
                { value: 15, label: '15m' },
                { value: 60, label: '1h' },
                { value: 240, label: '4h' },
                { value: 480, label: '8h' }
              ]}
              valueLabelDisplay="auto"
            />
          </Box>
        )}
      </SettingsSection>

      {/* Danger Zone */}
      <Card sx={{ mb: 3, border: '1px solid', borderColor: 'error.main' }}>
        <CardContent>
          <Typography variant="h6" color="error" gutterBottom>
            Danger Zone
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="body1">Reset All Settings</Typography>
              <Typography variant="body2" color="textSecondary">
                Reset all settings to default values
              </Typography>
            </Box>
            <Button
              variant="outlined"
              color="warning"
              onClick={() => showConfirmDialog('reset', 'Reset Settings', 'Are you sure you want to reset all settings to defaults?')}
            >
              Reset Settings
            </Button>
          </Box>
          <Divider />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <Box>
              <Typography variant="body1">Delete Account</Typography>
              <Typography variant="body2" color="textSecondary">
                Permanently delete your account and all data
              </Typography>
            </Box>
            <Button
              variant="outlined"
              color="error"
              onClick={() => showConfirmDialog('delete', 'Delete Account', 'Are you sure you want to permanently delete your account? This action cannot be undone.')}
            >
              Delete Account
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Confirm Dialog */}
      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, action: '', title: '', message: '' })}>
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <Typography>{confirmDialog.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false, action: '', title: '', message: '' })}>
            Cancel
          </Button>
          <Button onClick={handleConfirmAction} color="error" variant="contained">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProfileSettingsPage;
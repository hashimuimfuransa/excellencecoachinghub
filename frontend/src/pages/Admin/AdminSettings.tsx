import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Avatar,
  Slider,
  CircularProgress
} from '@mui/material';
import {
  Settings,
  Security,
  Notifications,
  Storage,
  Email,
  Backup,
  Update,
  Shield,
  Speed,
  Save,
  Refresh,
  Warning,
  CheckCircle,
  Info,
  Edit,
  Delete,
  Add
} from '@mui/icons-material';

import { useAuth } from '../../hooks/useAuth';

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
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
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

const AdminSettings: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [hasChanges, setHasChanges] = useState(false);

  // System Settings State
  const [systemSettings, setSystemSettings] = useState({
    siteName: 'Excellence Coaching Hub',
    siteDescription: 'Professional coaching and learning platform',
    maintenanceMode: false,
    registrationEnabled: true,
    emailVerificationRequired: true,
    maxFileUploadSize: 10, // MB
    sessionTimeout: 30, // minutes
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    enableTwoFactor: false,
    enableSocialLogin: false,
    defaultUserRole: 'student',
    autoApproveTeachers: false,
    enableNotifications: true,
    enableEmailNotifications: true,
    enablePushNotifications: false,
    backupFrequency: 'daily',
    logRetentionDays: 30,
    enableAnalytics: true,
    enableCaching: true,
    cacheTimeout: 3600, // seconds
    enableCompression: true,
    enableCDN: false,
    cdnUrl: '',
    smtpHost: '',
    smtpPort: 587,
    smtpUsername: '',
    smtpPassword: '',
    smtpSecure: true,
    cloudinaryEnabled: true,
    cloudinaryCloudName: '',
    cloudinaryApiKey: '',
    stripeEnabled: false,
    stripePublishableKey: '',
    stripeSecretKey: ''
  });

  // Load settings
  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // TODO: Replace with actual API call
      // const response = await adminService.getSystemSettings();
      // setSystemSettings(response.data);
      
      // Mock delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

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

  const handleSettingChange = (key: string, value: any) => {
    setSystemSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // TODO: Replace with actual API call
      // await adminService.updateSystemSettings(systemSettings);
      
      // Mock delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('Settings saved successfully');
      setHasChanges(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSettings = () => {
    loadSettings();
    setHasChanges(false);
  };

  return (
    <Container maxWidth="lg">
      <Box mb={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" gutterBottom>
              Admin Settings
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Configure system settings and preferences
            </Typography>
          </Box>
          <Box display="flex" alignItems="center">
            <Avatar 
              src={user?.avatar || undefined}
              sx={{ mr: 2 }}
            >
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="subtitle2">
                {user?.firstName} {user?.lastName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                System Administrator
              </Typography>
            </Box>
          </Box>
        </Box>
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

      {/* Save/Reset Actions */}
      {hasChanges && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'warning.light', color: 'warning.contrastText' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center">
              <Warning sx={{ mr: 1 }} />
              <Typography variant="body2">
                You have unsaved changes
              </Typography>
            </Box>
            <Box>
              <Button
                variant="outlined"
                size="small"
                onClick={handleResetSettings}
                sx={{ mr: 1, color: 'inherit', borderColor: 'currentColor' }}
              >
                Reset
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={handleSaveSettings}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={16} /> : <Save />}
                sx={{ bgcolor: 'warning.dark', '&:hover': { bgcolor: 'warning.darker' } }}
              >
                Save Changes
              </Button>
            </Box>
          </Box>
        </Paper>
      )}

      <Paper>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<Settings />} label="General" />
          <Tab icon={<Security />} label="Security" />
          <Tab icon={<Email />} label="Email" />
          <Tab icon={<Notifications />} label="Notifications" />
          <Tab icon={<Storage />} label="Storage" />
          <Tab icon={<Speed />} label="Performance" />
        </Tabs>

        {/* General Settings Tab */}
        <TabPanel value={currentTab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Site Configuration
                  </Typography>
                  <Box mb={2}>
                    <TextField
                      fullWidth
                      label="Site Name"
                      value={systemSettings.siteName}
                      onChange={(e) => handleSettingChange('siteName', e.target.value)}
                    />
                  </Box>
                  <Box mb={2}>
                    <TextField
                      fullWidth
                      label="Site Description"
                      multiline
                      rows={3}
                      value={systemSettings.siteDescription}
                      onChange={(e) => handleSettingChange('siteDescription', e.target.value)}
                    />
                  </Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={systemSettings.maintenanceMode}
                        onChange={(e) => handleSettingChange('maintenanceMode', e.target.checked)}
                      />
                    }
                    label="Maintenance Mode"
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    User Registration
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText primary="Enable Registration" />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={systemSettings.registrationEnabled}
                          onChange={(e) => handleSettingChange('registrationEnabled', e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Email Verification Required" />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={systemSettings.emailVerificationRequired}
                          onChange={(e) => handleSettingChange('emailVerificationRequired', e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Auto-approve Teachers" />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={systemSettings.autoApproveTeachers}
                          onChange={(e) => handleSettingChange('autoApproveTeachers', e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                  <Box mt={2}>
                    <FormControl fullWidth>
                      <InputLabel>Default User Role</InputLabel>
                      <Select
                        value={systemSettings.defaultUserRole}
                        label="Default User Role"
                        onChange={(e) => handleSettingChange('defaultUserRole', e.target.value)}
                      >
                        <MenuItem value="student">Student</MenuItem>
                        <MenuItem value="teacher">Teacher</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Security Settings Tab */}
        <TabPanel value={currentTab} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Authentication Settings
                  </Typography>
                  <Box mb={3}>
                    <Typography variant="body2" gutterBottom>
                      Session Timeout (minutes)
                    </Typography>
                    <Slider
                      value={systemSettings.sessionTimeout}
                      onChange={(e, value) => handleSettingChange('sessionTimeout', value)}
                      min={5}
                      max={120}
                      step={5}
                      marks
                      valueLabelDisplay="auto"
                    />
                  </Box>
                  <Box mb={3}>
                    <Typography variant="body2" gutterBottom>
                      Max Login Attempts
                    </Typography>
                    <Slider
                      value={systemSettings.maxLoginAttempts}
                      onChange={(e, value) => handleSettingChange('maxLoginAttempts', value)}
                      min={3}
                      max={10}
                      step={1}
                      marks
                      valueLabelDisplay="auto"
                    />
                  </Box>
                  <Box mb={2}>
                    <Typography variant="body2" gutterBottom>
                      Password Minimum Length
                    </Typography>
                    <Slider
                      value={systemSettings.passwordMinLength}
                      onChange={(e, value) => handleSettingChange('passwordMinLength', value)}
                      min={6}
                      max={20}
                      step={1}
                      marks
                      valueLabelDisplay="auto"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Advanced Security
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText 
                        primary="Two-Factor Authentication" 
                        secondary="Require 2FA for admin accounts"
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={systemSettings.enableTwoFactor}
                          onChange={(e) => handleSettingChange('enableTwoFactor', e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Social Login" 
                        secondary="Enable Google/Facebook login"
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={systemSettings.enableSocialLogin}
                          onChange={(e) => handleSettingChange('enableSocialLogin', e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Email Settings Tab */}
        <TabPanel value={currentTab} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    SMTP Configuration
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="SMTP Host"
                        value={systemSettings.smtpHost}
                        onChange={(e) => handleSettingChange('smtpHost', e.target.value)}
                        placeholder="smtp.gmail.com"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="SMTP Port"
                        type="number"
                        value={systemSettings.smtpPort}
                        onChange={(e) => handleSettingChange('smtpPort', parseInt(e.target.value))}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="SMTP Username"
                        value={systemSettings.smtpUsername}
                        onChange={(e) => handleSettingChange('smtpUsername', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="SMTP Password"
                        type="password"
                        value={systemSettings.smtpPassword}
                        onChange={(e) => handleSettingChange('smtpPassword', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={systemSettings.smtpSecure}
                            onChange={(e) => handleSettingChange('smtpSecure', e.target.checked)}
                          />
                        }
                        label="Use SSL/TLS"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
                <CardActions>
                  <Button variant="outlined" startIcon={<Email />}>
                    Test Email Configuration
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Notifications Settings Tab */}
        <TabPanel value={currentTab} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Notification Settings
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText
                        primary="Enable Notifications"
                        secondary="Master notification toggle"
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={systemSettings.enableNotifications}
                          onChange={(e) => handleSettingChange('enableNotifications', e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Email Notifications"
                        secondary="Send notifications via email"
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={systemSettings.enableEmailNotifications}
                          onChange={(e) => handleSettingChange('enableEmailNotifications', e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Push Notifications"
                        secondary="Browser push notifications"
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={systemSettings.enablePushNotifications}
                          onChange={(e) => handleSettingChange('enablePushNotifications', e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Backup Settings
                  </Typography>
                  <Box mb={2}>
                    <FormControl fullWidth>
                      <InputLabel>Backup Frequency</InputLabel>
                      <Select
                        value={systemSettings.backupFrequency}
                        label="Backup Frequency"
                        onChange={(e) => handleSettingChange('backupFrequency', e.target.value)}
                      >
                        <MenuItem value="hourly">Hourly</MenuItem>
                        <MenuItem value="daily">Daily</MenuItem>
                        <MenuItem value="weekly">Weekly</MenuItem>
                        <MenuItem value="monthly">Monthly</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  <Box mb={2}>
                    <Typography variant="body2" gutterBottom>
                      Log Retention (days)
                    </Typography>
                    <Slider
                      value={systemSettings.logRetentionDays}
                      onChange={(e, value) => handleSettingChange('logRetentionDays', value)}
                      min={7}
                      max={365}
                      step={7}
                      marks={[
                        { value: 7, label: '1w' },
                        { value: 30, label: '1m' },
                        { value: 90, label: '3m' },
                        { value: 365, label: '1y' }
                      ]}
                      valueLabelDisplay="auto"
                    />
                  </Box>
                </CardContent>
                <CardActions>
                  <Button variant="outlined" startIcon={<Backup />}>
                    Create Backup Now
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Storage Settings Tab */}
        <TabPanel value={currentTab} index={4}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    File Upload Settings
                  </Typography>
                  <Box mb={3}>
                    <Typography variant="body2" gutterBottom>
                      Max File Upload Size (MB)
                    </Typography>
                    <Slider
                      value={systemSettings.maxFileUploadSize}
                      onChange={(e, value) => handleSettingChange('maxFileUploadSize', value)}
                      min={1}
                      max={100}
                      step={1}
                      marks={[
                        { value: 1, label: '1MB' },
                        { value: 10, label: '10MB' },
                        { value: 50, label: '50MB' },
                        { value: 100, label: '100MB' }
                      ]}
                      valueLabelDisplay="auto"
                    />
                  </Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={systemSettings.cloudinaryEnabled}
                        onChange={(e) => handleSettingChange('cloudinaryEnabled', e.target.checked)}
                      />
                    }
                    label="Enable Cloudinary Storage"
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    CDN Settings
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={systemSettings.enableCDN}
                        onChange={(e) => handleSettingChange('enableCDN', e.target.checked)}
                      />
                    }
                    label="Enable CDN"
                  />
                  {systemSettings.enableCDN && (
                    <Box mt={2}>
                      <TextField
                        fullWidth
                        label="CDN URL"
                        value={systemSettings.cdnUrl}
                        onChange={(e) => handleSettingChange('cdnUrl', e.target.value)}
                        placeholder="https://cdn.example.com"
                      />
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Performance Settings Tab */}
        <TabPanel value={currentTab} index={5}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Caching Settings
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText
                        primary="Enable Caching"
                        secondary="Improve performance with caching"
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={systemSettings.enableCaching}
                          onChange={(e) => handleSettingChange('enableCaching', e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Enable Compression"
                        secondary="Compress responses for faster loading"
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={systemSettings.enableCompression}
                          onChange={(e) => handleSettingChange('enableCompression', e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Enable Analytics"
                        secondary="Track system performance"
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={systemSettings.enableAnalytics}
                          onChange={(e) => handleSettingChange('enableAnalytics', e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                  {systemSettings.enableCaching && (
                    <Box mt={2}>
                      <Typography variant="body2" gutterBottom>
                        Cache Timeout (seconds)
                      </Typography>
                      <Slider
                        value={systemSettings.cacheTimeout}
                        onChange={(e, value) => handleSettingChange('cacheTimeout', value)}
                        min={300}
                        max={86400}
                        step={300}
                        marks={[
                          { value: 300, label: '5m' },
                          { value: 3600, label: '1h' },
                          { value: 21600, label: '6h' },
                          { value: 86400, label: '24h' }
                        ]}
                        valueLabelDisplay="auto"
                      />
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    System Status
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText primary="Database Status" />
                      <Chip label="Connected" color="success" size="small" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Cache Status" />
                      <Chip
                        label={systemSettings.enableCaching ? "Active" : "Disabled"}
                        color={systemSettings.enableCaching ? "success" : "default"}
                        size="small"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Email Service" />
                      <Chip
                        label={systemSettings.smtpHost ? "Configured" : "Not Configured"}
                        color={systemSettings.smtpHost ? "success" : "warning"}
                        size="small"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Storage Service" />
                      <Chip
                        label={systemSettings.cloudinaryEnabled ? "Cloudinary" : "Local"}
                        color={systemSettings.cloudinaryEnabled ? "success" : "info"}
                        size="small"
                      />
                    </ListItem>
                  </List>
                </CardContent>
                <CardActions>
                  <Button variant="outlined" startIcon={<Refresh />}>
                    Refresh Status
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default AdminSettings;

import React from 'react';
import {
  Box,
  FormGroup,
  FormControlLabel,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Divider,
  Alert,
  Chip,
  Card,
  CardContent,
  Button,
  ButtonGroup
} from '@mui/material';
import { 
  Email, 
  Notifications, 
  Work,
  Security,
  NotificationsOff
} from '@mui/icons-material';
import { NotificationSettings as NotificationSettingsType } from '../../services/settingsService';

interface NotificationSettingsProps {
  settings: NotificationSettingsType;
  onChange: (settings: NotificationSettingsType) => void;
  disabled: boolean;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  settings,
  onChange,
  disabled
}) => {
  const handleChange = (field: keyof NotificationSettingsType, value: any) => {
    onChange({ ...settings, [field]: value });
  };

  const handleDisableAll = () => {
    onChange({
      email: false,
      push: false,
      jobAlerts: false,
      emailFrequency: settings.emailFrequency // Keep current frequency setting
    });
  };

  const handleEnableEssential = () => {
    onChange({
      email: true,
      push: true,
      jobAlerts: true,
      emailFrequency: 'daily' // Set to reasonable default
    });
  };

  const allDisabled = !settings.email && !settings.push && !settings.jobAlerts;
  const hasNotifications = settings.email || settings.push || settings.jobAlerts;

  const NotificationToggle = ({ 
    icon, 
    label, 
    description, 
    field, 
    color = 'primary',
    required = false
  }: {
    icon: React.ReactNode;
    label: string;
    description: string;
    field: keyof NotificationSettingsType;
    color?: 'primary' | 'secondary' | 'success' | 'warning';
    required?: boolean;
  }) => {
    const isEnabled = Boolean(settings[field]);
    const isDisabled = disabled || (required && true); // Required items cannot be disabled completely
    
    return (
      <Card 
        variant="outlined"
        sx={{ 
          mb: 2,
          bgcolor: isEnabled ? `${color}.50` : 'grey.50',
          borderColor: isEnabled ? `${color}.200` : 'grey.200',
          opacity: disabled ? 0.6 : 1,
          transition: 'all 0.2s ease-in-out'
        }}
      >
        <CardContent sx={{ py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ 
              mr: 2, 
              color: isEnabled ? `${color}.main` : 'grey.500',
              display: 'flex',
              alignItems: 'center'
            }}>
              {icon}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {label}
                {required && (
                  <Chip 
                    label="Required" 
                    size="small" 
                    color="error" 
                    sx={{ ml: 1 }} 
                  />
                )}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {description}
              </Typography>
            </Box>
            <Switch
              checked={isEnabled}
              onChange={(e) => handleChange(field, e.target.checked)}
              disabled={isDisabled}
              color={color}
            />
          </Box>
          {!isEnabled && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                {field === 'email' && "You won't receive emails for job updates and account notifications."}
                {field === 'push' && "Browser notifications are disabled. You won't see real-time alerts."}
                {field === 'jobAlerts' && "You won't be notified about new job opportunities matching your profile."}
              </Typography>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Box>
      {/* Master Control */}
      <Alert 
        severity={hasNotifications ? "success" : "warning"} 
        sx={{ mb: 3 }}
        icon={hasNotifications ? <Notifications /> : <NotificationsOff />}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <Box>
            <Typography variant="body2">
              <strong>
                {hasNotifications 
                  ? "Notifications are enabled" 
                  : "All notifications are disabled"}
              </strong>
              <br />
              {hasNotifications 
                ? "You'll receive updates based on your preferences below." 
                : "You won't receive any notifications. Use quick actions or enable settings below."}
            </Typography>
          </Box>
          <ButtonGroup size="small" orientation="vertical" sx={{ ml: 2 }}>
            <Button
              onClick={handleEnableEssential}
              disabled={disabled || (!allDisabled && hasNotifications)}
              variant="outlined"
              color="success"
            >
              Enable Essential
            </Button>
            <Button
              onClick={handleDisableAll}
              disabled={disabled || allDisabled}
              variant="outlined"
              color="warning"
            >
              Disable All
            </Button>
          </ButtonGroup>
        </Box>
      </Alert>

      {/* Essential Notifications Only */}
      <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <Notifications sx={{ mr: 1 }} />
        Essential Notification Settings
      </Typography>
      
      <NotificationToggle
        icon={<Email />}
        label="Email Notifications"
        description="Receive job alerts and important updates via email"
        field="email"
        color="primary"
      />
      
      <NotificationToggle
        icon={<Notifications />}
        label="Browser Notifications"
        description="Show real-time notifications in your browser"
        field="push"
        color="secondary"
      />

      <NotificationToggle
        icon={<Work />}
        label="Job Alerts"
        description="Get notified about new job opportunities matching your profile"
        field="jobAlerts"
        color="success"
      />

      {/* Critical Security Notifications - Always On */}
      <Typography variant="h6" sx={{ mb: 2, mt: 4, display: 'flex', alignItems: 'center' }}>
        <Security sx={{ mr: 1 }} />
        Security Notifications
      </Typography>

      <Card 
        variant="outlined"
        sx={{ 
          mb: 2,
          bgcolor: 'warning.50',
          borderColor: 'warning.200'
        }}
      >
        <CardContent sx={{ py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Security sx={{ mr: 2, color: 'warning.main' }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                Security Alerts
                <Chip 
                  label="Always On" 
                  size="small" 
                  color="warning" 
                  sx={{ ml: 1 }} 
                />
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Critical security notifications cannot be disabled for your account safety
              </Typography>
            </Box>
            <Switch
              checked={true}
              disabled={true}
              color="warning"
            />
          </Box>
        </CardContent>
      </Card>

      {/* Email Frequency Control */}
      {settings.email && (
        <Box sx={{ mt: 3 }}>
          <FormControl fullWidth>
            <InputLabel>Email Frequency</InputLabel>
            <Select
              value={settings.emailFrequency}
              onChange={(e) => handleChange('emailFrequency', e.target.value)}
              label="Email Frequency"
              disabled={disabled}
            >
              <MenuItem value="immediate">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Chip label="Immediate" size="small" color="error" sx={{ mr: 1 }} />
                  Send emails immediately
                </Box>
              </MenuItem>
              <MenuItem value="daily">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Chip label="Daily" size="small" color="warning" sx={{ mr: 1 }} />
                  Once per day at 9 AM
                </Box>
              </MenuItem>
              <MenuItem value="weekly">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Chip label="Weekly" size="small" color="info" sx={{ mr: 1 }} />
                  Weekly digest on Mondays
                </Box>
              </MenuItem>
            </Select>
          </FormControl>
        </Box>
      )}

      {/* Helpful Information */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>Note:</strong> You can change these settings anytime. Security notifications 
          and critical account updates will always be sent regardless of your preferences.
          {!settings.email && !settings.push && !settings.jobAlerts && (
            <><br /><strong>Warning:</strong> With all notifications disabled, you may miss important job opportunities and account updates.</>
          )}
        </Typography>
      </Alert>
    </Box>
  );
};

export default NotificationSettings;
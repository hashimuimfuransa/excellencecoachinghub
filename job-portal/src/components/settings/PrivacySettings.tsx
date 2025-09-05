import React from 'react';
import {
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Switch,
  Typography,
  Alert,
  Chip,
  Paper,
  Divider
} from '@mui/material';
import {
  Public,
  Business,
  Lock,
  Visibility,
  VisibilityOff,
  Email,
  Phone,
  LocationOn,
  Message,
  NotificationsActive,
  Circle,
  Search
} from '@mui/icons-material';
import { PrivacySettings as PrivacySettingsType } from '../../services/settingsService';

interface PrivacySettingsProps {
  settings: PrivacySettingsType;
  onChange: (settings: PrivacySettingsType) => void;
  disabled: boolean;
}

const PrivacySettings: React.FC<PrivacySettingsProps> = ({
  settings,
  onChange,
  disabled
}) => {
  const handleChange = (field: keyof PrivacySettingsType, value: any) => {
    onChange({ ...settings, [field]: value });
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return <Public color="success" />;
      case 'employers':
        return <Business color="warning" />;
      case 'private':
        return <Lock color="error" />;
      default:
        return <Public />;
    }
  };

  const getVisibilityDescription = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return 'Your profile is visible to everyone on the platform';
      case 'employers':
        return 'Only verified employers can view your full profile';
      case 'private':
        return 'Your profile is hidden from search results and other users';
      default:
        return '';
    }
  };

  const PrivacyToggle = ({ 
    icon, 
    label, 
    description, 
    field,
    color = 'primary'
  }: {
    icon: React.ReactNode;
    label: string;
    description: string;
    field: keyof PrivacySettingsType;
    color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  }) => (
    <Paper 
      sx={{ 
        p: 2,
        mb: 1.5,
        border: 1,
        borderColor: settings[field] ? `${color}.200` : 'grey.200',
        bgcolor: settings[field] ? `${color}.50` : 'grey.50',
        transition: 'all 0.2s ease-in-out'
      }}
      elevation={0}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box sx={{ 
          mr: 2, 
          color: settings[field] ? `${color}.main` : 'grey.500',
          display: 'flex',
          alignItems: 'center'
        }}>
          {icon}
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {label}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {description}
          </Typography>
        </Box>
        <Switch
          checked={Boolean(settings[field])}
          onChange={(e) => handleChange(field, e.target.checked)}
          disabled={disabled}
          color={color}
        />
      </Box>
    </Paper>
  );

  return (
    <Box>
      {/* Profile Visibility */}
      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
        <Visibility sx={{ mr: 1 }} />
        Profile Visibility
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'background.default' }}>
        <FormControl fullWidth>
          <InputLabel>Who can see your profile</InputLabel>
          <Select
            value={settings.profileVisibility}
            onChange={(e) => handleChange('profileVisibility', e.target.value)}
            label="Who can see your profile"
            disabled={disabled}
            startAdornment={getVisibilityIcon(settings.profileVisibility)}
          >
            <MenuItem value="public">
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <Public color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="body1">Public</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Everyone can find and view your profile
                  </Typography>
                </Box>
              </Box>
            </MenuItem>
            <MenuItem value="employers">
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <Business color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="body1">Employers Only</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Only verified employers can view your profile
                  </Typography>
                </Box>
              </Box>
            </MenuItem>
            <MenuItem value="private">
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <Lock color="error" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="body1">Private</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Hidden from search results and other users
                  </Typography>
                </Box>
              </Box>
            </MenuItem>
          </Select>
        </FormControl>
        
        <Alert 
          severity={settings.profileVisibility === 'private' ? 'warning' : 'info'} 
          sx={{ mt: 2 }}
        >
          {getVisibilityDescription(settings.profileVisibility)}
        </Alert>
      </Paper>

      <Divider sx={{ my: 3 }} />

      {/* Contact Information Visibility */}
      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
        <Email sx={{ mr: 1 }} />
        Contact Information
      </Typography>

      <PrivacyToggle
        icon={<Email />}
        label="Show Email Address"
        description="Display your email address on your public profile"
        field="showEmail"
        color="primary"
      />
      
      <PrivacyToggle
        icon={<Phone />}
        label="Show Phone Number"
        description="Display your phone number to potential employers"
        field="showPhone"
        color="secondary"
      />
      
      <PrivacyToggle
        icon={<LocationOn />}
        label="Show Location"
        description="Display your location for location-based job matching"
        field="showLocation"
        color="success"
      />

      <Divider sx={{ my: 3 }} />

      {/* Communication Preferences */}
      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
        <Message sx={{ mr: 1 }} />
        Communication & Activity
      </Typography>

      <PrivacyToggle
        icon={<Message />}
        label="Allow Direct Messages"
        description="Let other users send you direct messages"
        field="allowMessages"
        color="primary"
      />
      
      <PrivacyToggle
        icon={<NotificationsActive />}
        label="Allow Job Alerts"
        description="Receive job recommendations based on your profile"
        field="allowJobAlerts"
        color="warning"
      />
      
      <PrivacyToggle
        icon={<Circle />}
        label="Show Online Status"
        description="Display when you're active on the platform"
        field="showOnlineStatus"
        color="success"
      />
      
      <PrivacyToggle
        icon={<Search />}
        label="Allow Search Engine Indexing"
        description="Allow search engines to index your public profile"
        field="allowSearchIndexing"
        color="secondary"
      />

      {/* Privacy Summary */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>Privacy Summary:</strong> Your profile is currently{' '}
          <Chip 
            label={settings.profileVisibility} 
            size="small" 
            color={
              settings.profileVisibility === 'public' ? 'success' :
              settings.profileVisibility === 'employers' ? 'warning' : 'error'
            }
            sx={{ mx: 0.5 }}
          />
          and you have{' '}
          {[settings.showEmail, settings.showPhone, settings.showLocation].filter(Boolean).length} of 3{' '}
          contact details visible.
        </Typography>
      </Alert>
    </Box>
  );
};

export default PrivacySettings;
import React from 'react';
import {
  Box,
  FormControlLabel,
  Switch,
  Typography,
  Paper,
  Alert,
  Slider,
  Divider,
  Chip,
  Grid
} from '@mui/material';
import {
  Save,
  Memory,
  Security,
  Schedule,
  AutoMode,
  VerifiedUser
} from '@mui/icons-material';
import { AccountPreferences as AccountPreferencesType } from '../../services/settingsService';

interface AccountPreferencesProps {
  settings: AccountPreferencesType;
  onChange: (settings: AccountPreferencesType) => void;
  disabled: boolean;
}

const AccountPreferences: React.FC<AccountPreferencesProps> = ({
  settings,
  onChange,
  disabled
}) => {
  const handleChange = (field: keyof AccountPreferencesType, value: any) => {
    onChange({ ...settings, [field]: value });
  };

  const formatSessionTimeout = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minutes`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      if (remainingMinutes === 0) {
        return `${hours} hour${hours > 1 ? 's' : ''}`;
      } else {
        return `${hours}h ${remainingMinutes}m`;
      }
    }
  };

  const PreferenceToggle = ({ 
    icon, 
    label, 
    description, 
    field,
    color = 'primary',
    warning = false
  }: {
    icon: React.ReactNode;
    label: string;
    description: string;
    field: keyof AccountPreferencesType;
    color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
    warning?: boolean;
  }) => (
    <Paper 
      sx={{ 
        p: 2,
        mb: 2,
        border: 1,
        borderColor: warning ? 'warning.200' : (settings[field] ? `${color}.200` : 'grey.200'),
        bgcolor: warning ? 'warning.50' : (settings[field] ? `${color}.50` : 'grey.50'),
        transition: 'all 0.2s ease-in-out'
      }}
      elevation={0}
    >
      <FormControlLabel
        control={
          <Switch
            checked={Boolean(settings[field])}
            onChange={(e) => handleChange(field, e.target.checked)}
            disabled={disabled}
            color={color}
          />
        }
        label={
          <Box sx={{ ml: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Box sx={{ 
                mr: 2, 
                color: settings[field] ? `${color}.main` : 'grey.500',
                display: 'flex',
                alignItems: 'center'
              }}>
                {icon}
              </Box>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {label}
              </Typography>
            </Box>
            <Typography variant="body2" color="textSecondary">
              {description}
            </Typography>
          </Box>
        }
      />
      {warning && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          <Typography variant="body2">
            This setting affects your account security. Make sure you understand the implications.
          </Typography>
        </Alert>
      )}
    </Paper>
  );

  return (
    <Box>
      {/* Data Management */}
      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
        <Save sx={{ mr: 1 }} />
        Data & Storage
      </Typography>

      <PreferenceToggle
        icon={<AutoMode />}
        label="Auto-save Form Data"
        description="Automatically save your form inputs as you type to prevent data loss"
        field="autoSave"
        color="success"
      />

      <PreferenceToggle
        icon={<Memory />}
        label="Remember Me on This Device"
        description="Stay logged in for faster access (uses secure browser storage)"
        field="rememberMe"
        color="primary"
      />

      <Divider sx={{ my: 3 }} />

      {/* Security Settings */}
      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
        <Security sx={{ mr: 1 }} />
        Security & Authentication
      </Typography>

      <PreferenceToggle
        icon={<VerifiedUser />}
        label="Two-Factor Authentication"
        description="Add an extra layer of security by requiring a second verification step"
        field="twoFactorAuth"
        color="error"
        warning={true}
      />

      <Divider sx={{ my: 3 }} />

      {/* Session Management */}
      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
        <Schedule sx={{ mr: 1 }} />
        Session Management
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
            Session Timeout
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            Automatically log out after a period of inactivity for security
          </Typography>
        </Box>

        <Box sx={{ px: 2 }}>
          <Slider
            value={settings.sessionTimeout}
            onChange={(e, value) => handleChange('sessionTimeout', value as number)}
            min={15}
            max={480}
            step={15}
            disabled={disabled}
            marks={[
              { value: 15, label: '15m' },
              { value: 60, label: '1h' },
              { value: 120, label: '2h' },
              { value: 240, label: '4h' },
              { value: 480, label: '8h' }
            ]}
            valueLabelDisplay="auto"
            valueLabelFormat={formatSessionTimeout}
            sx={{
              '& .MuiSlider-markLabel': {
                fontSize: '0.75rem',
                color: 'text.secondary'
              }
            }}
          />
        </Box>

        <Box sx={{ mt: 2, p: 2, bgcolor: 'info.50', borderRadius: 1 }}>
          <Typography variant="body2" color="info.dark">
            <strong>Current timeout:</strong> {formatSessionTimeout(settings.sessionTimeout)}
            <br />
            You'll be logged out automatically after {formatSessionTimeout(settings.sessionTimeout)} of inactivity.
          </Typography>
        </Box>
      </Paper>

      {/* Account Summary */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>Account Security Status:</strong>
          <br />
          • Auto-save: {settings.autoSave ? '✅ Enabled' : '❌ Disabled'}
          <br />
          • Remember me: {settings.rememberMe ? '✅ Enabled' : '❌ Disabled'}
          <br />
          • Two-factor auth: {settings.twoFactorAuth ? '✅ Enabled' : '❌ Disabled'}
          <br />
          • Session timeout: {formatSessionTimeout(settings.sessionTimeout)}
        </Typography>
      </Alert>

      {/* Security Recommendations */}
      {(!settings.twoFactorAuth || settings.sessionTimeout > 240) && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Security Recommendations:</strong>
            <br />
            {!settings.twoFactorAuth && '• Enable two-factor authentication for better security'}
            {!settings.twoFactorAuth && settings.sessionTimeout > 240 && <br />}
            {settings.sessionTimeout > 240 && '• Consider shorter session timeout for better security'}
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default AccountPreferences;
import React from 'react';
import {
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Typography,
  Paper,
  Alert,
  Chip,
  Divider,
  Slider
} from '@mui/material';
import {
  LightMode,
  DarkMode,
  SettingsBrightness,
  Language,
  FormatSize,
  ViewCompact,
  Animation
} from '@mui/icons-material';
import { AppearanceSettings as AppearanceSettingsType } from '../../services/settingsService';

interface AppearanceSettingsProps {
  settings: AppearanceSettingsType;
  onChange: (settings: AppearanceSettingsType) => void;
  disabled: boolean;
}

const AppearanceSettings: React.FC<AppearanceSettingsProps> = ({
  settings,
  onChange,
  disabled
}) => {
  const handleChange = (field: keyof AppearanceSettingsType, value: any) => {
    onChange({ ...settings, [field]: value });
  };

  const getThemeIcon = (theme: string) => {
    switch (theme) {
      case 'light':
        return <LightMode color="warning" />;
      case 'dark':
        return <DarkMode color="primary" />;
      case 'system':
        return <SettingsBrightness color="action" />;
      default:
        return <SettingsBrightness />;
    }
  };

  const getThemeDescription = (theme: string) => {
    switch (theme) {
      case 'light':
        return 'Always use light theme';
      case 'dark':
        return 'Always use dark theme';
      case 'system':
        return 'Follow your system preference';
      default:
        return '';
    }
  };

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' }
  ];

  const fontSizes = [
    { value: 'small', label: 'Small', description: 'Compact text for more content' },
    { value: 'medium', label: 'Medium', description: 'Standard text size (recommended)' },
    { value: 'large', label: 'Large', description: 'Larger text for better readability' }
  ];

  return (
    <Box>
      {/* Theme Settings */}
      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
        <SettingsBrightness sx={{ mr: 1 }} />
        Theme & Colors
      </Typography>

      <Paper sx={{ p: 3, mb: 3, bgcolor: 'background.default' }}>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Theme Mode</InputLabel>
          <Select
            value={settings.theme}
            onChange={(e) => handleChange('theme', e.target.value)}
            label="Theme Mode"
            disabled={disabled}
            startAdornment={getThemeIcon(settings.theme)}
          >
            <MenuItem value="light">
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <LightMode color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="body1">Light Theme</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Clean and bright interface
                  </Typography>
                </Box>
              </Box>
            </MenuItem>
            <MenuItem value="dark">
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <DarkMode color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="body1">Dark Theme</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Easy on the eyes in low light
                  </Typography>
                </Box>
              </Box>
            </MenuItem>
            <MenuItem value="system">
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <SettingsBrightness color="action" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="body1">System Default</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Match your device settings
                  </Typography>
                </Box>
              </Box>
            </MenuItem>
          </Select>
        </FormControl>

        <Alert 
          severity="info" 
          sx={{ 
            mt: 2,
            bgcolor: settings.theme === 'dark' ? 'grey.900' : 'grey.50'
          }}
        >
          <Typography variant="body2">
            <strong>Current theme:</strong> {getThemeDescription(settings.theme)}
          </Typography>
        </Alert>
      </Paper>

      <Divider sx={{ my: 3 }} />

      {/* Language & Region */}
      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
        <Language sx={{ mr: 1 }} />
        Language & Region
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Interface Language</InputLabel>
            <Select
              value={settings.language}
              onChange={(e) => handleChange('language', e.target.value)}
              label="Interface Language"
              disabled={disabled}
            >
              {languages.map((lang) => (
                <MenuItem key={lang.code} value={lang.code}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography sx={{ mr: 1, fontSize: '1.2rem' }}>
                      {lang.flag}
                    </Typography>
                    <Typography>{lang.name}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* Display Settings */}
      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
        <FormatSize sx={{ mr: 1 }} />
        Display Preferences
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Font Size</InputLabel>
            <Select
              value={settings.fontSize}
              onChange={(e) => handleChange('fontSize', e.target.value)}
              label="Font Size"
              disabled={disabled}
            >
              {fontSizes.map((size) => (
                <MenuItem key={size.value} value={size.value}>
                  <Box>
                    <Typography variant="body1" sx={{ 
                      fontSize: size.value === 'small' ? '0.875rem' : 
                               size.value === 'large' ? '1.125rem' : '1rem' 
                    }}>
                      {size.label}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {size.description}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* UI Behavior */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <ViewCompact sx={{ mr: 1 }} />
          Interface Behavior
        </Typography>

        <Paper sx={{ p: 2, mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.compactMode}
                onChange={(e) => handleChange('compactMode', e.target.checked)}
                disabled={disabled}
                color="primary"
              />
            }
            label={
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  Compact Mode
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Reduce spacing and padding for a denser interface
                </Typography>
              </Box>
            }
          />
        </Paper>

        <Paper sx={{ p: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.showAnimations}
                onChange={(e) => handleChange('showAnimations', e.target.checked)}
                disabled={disabled}
                color="secondary"
              />
            }
            label={
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  Show Animations
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Enable smooth transitions and animations throughout the app
                </Typography>
              </Box>
            }
          />
        </Paper>
      </Box>

      {/* Preview Section */}
      <Alert severity="success" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>Your current setup:</strong> {' '}
          <Chip 
            label={settings.theme} 
            size="small" 
            color="primary" 
            sx={{ mx: 0.5 }} 
          />
          theme with{' '}
          <Chip 
            label={settings.fontSize} 
            size="small" 
            color="secondary" 
            sx={{ mx: 0.5 }} 
          />
          text size
          {settings.compactMode && (
            <span> and <Chip label="compact mode" size="small" sx={{ mx: 0.5 }} /></span>
          )}
        </Typography>
      </Alert>
    </Box>
  );
};

export default AppearanceSettings;
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Switch,
  FormControl,
  FormControlLabel,
  TextField,
  Alert,
  CircularProgress,
  Grid,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  VideoCall,
  Settings,
  CheckCircle,
  Error,
  Refresh,
  Info
} from '@mui/icons-material';
import { apiService } from '../../services/apiService';

interface VideoProvider {
  id: string;
  name: 'agora' | '100ms';
  isActive: boolean;
  config: {
    appId?: string;
    appCertificate?: string;
    templateId?: string;
    channelName?: string;
    uid?: string;
    role?: string;
  };
  fallbackProvider?: 'agora' | '100ms';
  createdAt: string;
  updatedAt: string;
}

interface ProviderStatus {
  activeProvider: {
    name: string;
    isActive: boolean;
    isConfigured: boolean;
  } | null;
  fallbackProvider: {
    name: string;
    isConfigured: boolean;
  } | null;
  lastUpdated: string;
}

const VideoProviderManagement: React.FC = () => {
  const [providers, setProviders] = useState<VideoProvider[]>([]);
  const [status, setStatus] = useState<ProviderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [configDialog, setConfigDialog] = useState<{
    open: boolean;
    provider: VideoProvider | null;
  }>({ open: false, provider: null });
  const [configForm, setConfigForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProviders();
    loadStatus();
  }, []);

  const loadProviders = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/video-providers/all');
      if (response.success) {
        setProviders(response.data.providers);
      }
    } catch (error) {
      console.error('Error loading providers:', error);
      setError('Failed to load video providers');
    } finally {
      setLoading(false);
    }
  };

  const loadStatus = async () => {
    try {
      const response = await apiService.get('/video-providers/status');
      if (response.success) {
        setStatus(response.data);
      }
    } catch (error) {
      console.error('Error loading status:', error);
    }
  };

  const switchProvider = async (providerName: 'agora' | '100ms') => {
    try {
      setLoading(true);
      const response = await apiService.post('/video-providers/switch', {
        providerName
      });
      
      if (response.success) {
        await loadProviders();
        await loadStatus();
        setError(null);
      }
    } catch (error) {
      console.error('Error switching provider:', error);
      setError('Failed to switch video provider');
    } finally {
      setLoading(false);
    }
  };

  const testProvider = async (providerName: 'agora' | '100ms') => {
    try {
      const response = await apiService.get(`/video-providers/test/${providerName}`);
      if (response.success) {
        alert(`${providerName} is ${response.data.isWorking ? 'working' : 'not working'}`);
      }
    } catch (error) {
      console.error('Error testing provider:', error);
      alert(`Failed to test ${providerName}`);
    }
  };

  const openConfigDialog = (provider: VideoProvider) => {
    setConfigDialog({ open: true, provider });
    setConfigForm({
      appId: provider.config.appId || '',
      appCertificate: provider.config.appCertificate || '',
      templateId: provider.config.templateId || '',
      channelName: provider.config.channelName || '',
      uid: provider.config.uid || '',
      role: provider.config.role || 'publisher'
    });
  };

  const saveConfig = async () => {
    if (!configDialog.provider) return;

    try {
      setSaving(true);
      const response = await apiService.put('/video-providers/config', {
        providerName: configDialog.provider.name,
        config: configForm
      });

      if (response.success) {
        await loadProviders();
        setConfigDialog({ open: false, provider: null });
        setError(null);
      }
    } catch (error) {
      console.error('Error saving config:', error);
      setError('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const initializeProviders = async () => {
    try {
      setLoading(true);
      const response = await apiService.post('/video-providers/initialize');
      if (response.success) {
        await loadProviders();
        await loadStatus();
        setError(null);
      }
    } catch (error) {
      console.error('Error initializing providers:', error);
      setError('Failed to initialize providers');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Video Provider Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Status Overview */}
      {status && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Current Status
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="subtitle1">Active Provider:</Typography>
                  {status.activeProvider ? (
                    <Chip
                      icon={status.activeProvider.isConfigured ? <CheckCircle /> : <Error />}
                      label={`${status.activeProvider.name} ${status.activeProvider.isConfigured ? '(Configured)' : '(Not Configured)'}`}
                      color={status.activeProvider.isConfigured ? 'success' : 'error'}
                    />
                  ) : (
                    <Chip label="None" color="default" />
                  )}
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="subtitle1">Fallback Provider:</Typography>
                  {status.fallbackProvider ? (
                    <Chip
                      icon={status.fallbackProvider.isConfigured ? <CheckCircle /> : <Error />}
                      label={`${status.fallbackProvider.name} ${status.fallbackProvider.isConfigured ? '(Configured)' : '(Not Configured)'}`}
                      color={status.fallbackProvider.isConfigured ? 'success' : 'error'}
                    />
                  ) : (
                    <Chip label="None" color="default" />
                  )}
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Provider Cards */}
      <Grid container spacing={3}>
        {providers.map((provider) => (
          <Grid item xs={12} md={6} key={provider.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    {provider.name.toUpperCase()}
                  </Typography>
                  <Chip
                    label={provider.isActive ? 'Active' : 'Inactive'}
                    color={provider.isActive ? 'success' : 'default'}
                    size="small"
                  />
                </Box>

                <Box display="flex" gap={1} mb={2}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => switchProvider(provider.name)}
                    disabled={provider.isActive}
                  >
                    {provider.isActive ? 'Active' : 'Activate'}
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => testProvider(provider.name)}
                  >
                    Test
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => openConfigDialog(provider)}
                  >
                    Configure
                  </Button>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="body2" color="text.secondary">
                  Configuration Status:
                </Typography>
                <Box mt={1}>
                  {provider.name === 'agora' ? (
                    <>
                      <Chip
                        label={`App ID: ${provider.config.appId ? 'Configured' : 'Not Set'}`}
                        size="small"
                        color={provider.config.appId ? 'success' : 'error'}
                        sx={{ mr: 1, mb: 1 }}
                      />
                      <Chip
                        label={`Certificate: ${provider.config.appCertificate ? 'Configured' : 'Not Set'}`}
                        size="small"
                        color={provider.config.appCertificate ? 'success' : 'error'}
                        sx={{ mr: 1, mb: 1 }}
                      />
                    </>
                  ) : (
                    <Chip
                      label={`Template ID: ${provider.config.templateId ? 'Configured' : 'Not Set'}`}
                      size="small"
                      color={provider.config.templateId ? 'success' : 'error'}
                    />
                  )}
                </Box>

                {provider.fallbackProvider && (
                  <Box mt={2}>
                    <Typography variant="body2" color="text.secondary">
                      Fallback: {provider.fallbackProvider.toUpperCase()}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Initialize Button */}
      {providers.length === 0 && (
        <Box mt={3} textAlign="center">
          <Button
            variant="contained"
            onClick={initializeProviders}
            disabled={loading}
          >
            Initialize Video Providers
          </Button>
        </Box>
      )}

      {/* Configuration Dialog */}
      <Dialog
        open={configDialog.open}
        onClose={() => setConfigDialog({ open: false, provider: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Configure {configDialog.provider?.name.toUpperCase()}
        </DialogTitle>
        <DialogContent>
          {configDialog.provider?.name === 'agora' ? (
            <Box mt={2}>
              <TextField
                fullWidth
                label="App ID"
                value={configForm.appId}
                onChange={(e) => setConfigForm({ ...configForm, appId: e.target.value })}
                margin="normal"
              />
              <TextField
                fullWidth
                label="App Certificate"
                value={configForm.appCertificate}
                onChange={(e) => setConfigForm({ ...configForm, appCertificate: e.target.value })}
                margin="normal"
                type="password"
              />
              <TextField
                fullWidth
                label="Channel Name"
                value={configForm.channelName}
                onChange={(e) => setConfigForm({ ...configForm, channelName: e.target.value })}
                margin="normal"
              />
              <TextField
                fullWidth
                label="UID"
                value={configForm.uid}
                onChange={(e) => setConfigForm({ ...configForm, uid: e.target.value })}
                margin="normal"
              />
            </Box>
          ) : (
            <Box mt={2}>
              <TextField
                fullWidth
                label="Template ID"
                value={configForm.templateId}
                onChange={(e) => setConfigForm({ ...configForm, templateId: e.target.value })}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Room ID"
                value={configForm.roomId}
                onChange={(e) => setConfigForm({ ...configForm, roomId: e.target.value })}
                margin="normal"
              />
              <TextField
                fullWidth
                label="User ID"
                value={configForm.userId}
                onChange={(e) => setConfigForm({ ...configForm, userId: e.target.value })}
                margin="normal"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfigDialog({ open: false, provider: null })}
          >
            Cancel
          </Button>
          <Button
            onClick={saveConfig}
            variant="contained"
            disabled={saving}
          >
            {saving ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VideoProviderManagement;

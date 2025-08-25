import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Paper,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge
} from '@mui/material';
import {
  Settings,
  Security,
  Backup,
  Restore,
  Update,
  Build,
  Storage,
  NetworkCheck,
  Speed,
  Memory,
  BugReport,
  Notifications,
  Email,
  Sms,
  CloudUpload,
  CloudDownload,
  Schedule,
  PlayArrow,
  Stop,
  Refresh,
  Delete,
  Edit,
  Add,
  Warning,
  CheckCircle,
  Error,
  Info,
  ExpandMore,
  Download,
  Upload,
  Visibility,
  VisibilityOff,
  Lock,
  LockOpen,
  AdminPanelSettings,
  SecurityOutlined,
  VpnKey,
  Key,
  VerifiedUser,
  Api
} from '@mui/icons-material';
import { superAdminService } from '../../services/superAdminService';

interface SystemConfig {
  maintenance: {
    enabled: boolean;
    message: string;
    scheduledStart?: string;
    scheduledEnd?: string;
  };
  security: {
    twoFactorRequired: boolean;
    passwordMinLength: number;
    sessionTimeout: number;
    maxLoginAttempts: number;
    ipWhitelist: string[];
  };
  notifications: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    pushEnabled: boolean;
    webhookUrl?: string;
  };
  backup: {
    autoBackupEnabled: boolean;
    backupFrequency: string;
    retentionDays: number;
    lastBackup?: string;
  };
  performance: {
    cacheEnabled: boolean;
    compressionEnabled: boolean;
    cdnEnabled: boolean;
    rateLimitEnabled: boolean;
  };
}

interface BackupInfo {
  id: string;
  name: string;
  size: string;
  created: string;
  type: 'manual' | 'automatic';
  status: 'completed' | 'in_progress' | 'failed';
}

interface SystemLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  category: string;
  message: string;
  details?: string;
}

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
      id={`system-tabpanel-${index}`}
      aria-labelledby={`system-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const SystemManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [config, setConfig] = useState<SystemConfig>({
    maintenance: {
      enabled: false,
      message: 'System is under maintenance. Please try again later.'
    },
    security: {
      twoFactorRequired: true,
      passwordMinLength: 8,
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      ipWhitelist: []
    },
    notifications: {
      emailEnabled: true,
      smsEnabled: false,
      pushEnabled: true
    },
    backup: {
      autoBackupEnabled: true,
      backupFrequency: 'daily',
      retentionDays: 30,
      lastBackup: '2024-01-20T02:00:00Z'
    },
    performance: {
      cacheEnabled: true,
      compressionEnabled: true,
      cdnEnabled: true,
      rateLimitEnabled: true
    }
  });

  const [backups, setBackups] = useState<BackupInfo[]>([
    {
      id: '1',
      name: 'Full System Backup - 2024-01-20',
      size: '2.4 GB',
      created: '2024-01-20T02:00:00Z',
      type: 'automatic',
      status: 'completed'
    },
    {
      id: '2',
      name: 'Manual Backup - Pre-Update',
      size: '2.3 GB',
      created: '2024-01-19T14:30:00Z',
      type: 'manual',
      status: 'completed'
    },
    {
      id: '3',
      name: 'Full System Backup - 2024-01-19',
      size: '2.3 GB',
      created: '2024-01-19T02:00:00Z',
      type: 'automatic',
      status: 'completed'
    }
  ]);

  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([
    {
      id: '1',
      timestamp: new Date().toISOString(),
      level: 'info',
      category: 'Authentication',
      message: 'User login successful',
      details: 'User: admin@platform.com, IP: 192.168.1.100'
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      level: 'warning',
      category: 'Performance',
      message: 'High CPU usage detected',
      details: 'CPU usage: 85%, Memory: 74%'
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 600000).toISOString(),
      level: 'error',
      category: 'Database',
      message: 'Connection timeout',
      details: 'Failed to connect to database after 30 seconds'
    }
  ]);

  const [dialogs, setDialogs] = useState({
    backup: false,
    restore: false,
    maintenance: false,
    security: false
  });

  useEffect(() => {
    loadSystemSettings();
  }, []);

  const loadSystemSettings = async () => {
    setLoading(true);
    try {
      const settings = await superAdminService.getSystemSettings();
      setConfig(settings);
    } catch (error) {
      console.error('Error loading system settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleConfigChange = (section: keyof SystemConfig, field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSaveConfig = async () => {
    setLoading(true);
    try {
      await superAdminService.updateSystemSettings(config);
      console.log('Configuration saved:', config);
    } catch (error) {
      console.error('Error saving configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async (name: string) => {
    setLoading(true);
    try {
      // API call to create backup
      await new Promise(resolve => setTimeout(resolve, 3000));
      const newBackup: BackupInfo = {
        id: Date.now().toString(),
        name: name || `Manual Backup - ${new Date().toLocaleDateString()}`,
        size: '2.4 GB',
        created: new Date().toISOString(),
        type: 'manual',
        status: 'completed'
      };
      setBackups(prev => [newBackup, ...prev]);
      setDialogs(prev => ({ ...prev, backup: false }));
    } catch (error) {
      console.error('Error creating backup:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreBackup = async (backupId: string) => {
    if (window.confirm('Are you sure you want to restore this backup? This action cannot be undone.')) {
      setLoading(true);
      try {
        // API call to restore backup
        await new Promise(resolve => setTimeout(resolve, 5000));
        console.log('Backup restored:', backupId);
        setDialogs(prev => ({ ...prev, restore: false }));
      } catch (error) {
        console.error('Error restoring backup:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteBackup = async (backupId: string) => {
    if (window.confirm('Are you sure you want to delete this backup?')) {
      setBackups(prev => prev.filter(b => b.id !== backupId));
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      case 'debug': return 'default';
      default: return 'default';
    }
  };

  const getLogLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return <Error color="error" />;
      case 'warning': return <Warning color="warning" />;
      case 'info': return <Info color="info" />;
      case 'debug': return <BugReport />;
      default: return <Info />;
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          <Settings sx={{ mr: 2, verticalAlign: 'middle' }} />
          System Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            color="warning"
            startIcon={<Build />}
            onClick={() => setDialogs(prev => ({ ...prev, maintenance: true }))}
          >
            Maintenance Mode
          </Button>
          <Button
            variant="contained"
            startIcon={<Backup />}
            onClick={() => setDialogs(prev => ({ ...prev, backup: true }))}
          >
            Create Backup
          </Button>
        </Box>
      </Box>

      {/* System Status Alert */}
      <Alert 
        severity={config.maintenance.enabled ? 'warning' : 'success'}
        sx={{ mb: 3 }}
        action={
          <Button 
            color="inherit" 
            size="small"
            onClick={() => setDialogs(prev => ({ ...prev, maintenance: true }))}
          >
            MANAGE
          </Button>
        }
      >
        <Typography variant="subtitle1">
          System Status: {config.maintenance.enabled ? 'MAINTENANCE MODE' : 'OPERATIONAL'}
        </Typography>
        <Typography variant="body2">
          {config.maintenance.enabled 
            ? 'System is currently in maintenance mode'
            : 'All systems are operational and running normally'
          }
        </Typography>
      </Alert>

      {/* Main Content Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<Settings />} label="General" />
          <Tab icon={<Security />} label="Security" />
          <Tab icon={<Backup />} label="Backup & Restore" />
          <Tab icon={<Speed />} label="Performance" />
          <Tab icon={<Notifications />} label="Notifications" />
          <Tab icon={<BugReport />} label="System Logs" />
        </Tabs>

        {/* General Settings Tab */}
        <TabPanel value={currentTab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <Build sx={{ mr: 1 }} />
                    Maintenance Settings
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.maintenance.enabled}
                        onChange={(e) => handleConfigChange('maintenance', 'enabled', e.target.checked)}
                      />
                    }
                    label="Enable Maintenance Mode"
                  />
                  <TextField
                    fullWidth
                    label="Maintenance Message"
                    multiline
                    rows={3}
                    value={config.maintenance.message}
                    onChange={(e) => handleConfigChange('maintenance', 'message', e.target.value)}
                    sx={{ mt: 2 }}
                  />
                  <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                    <TextField
                      label="Scheduled Start"
                      type="datetime-local"
                      value={config.maintenance.scheduledStart || ''}
                      onChange={(e) => handleConfigChange('maintenance', 'scheduledStart', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      label="Scheduled End"
                      type="datetime-local"
                      value={config.maintenance.scheduledEnd || ''}
                      onChange={(e) => handleConfigChange('maintenance', 'scheduledEnd', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <Update sx={{ mr: 1 }} />
                    System Updates
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircle color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary="System Core"
                        secondary="Version 2.1.4 - Up to date"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Warning color="warning" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Database Schema"
                        secondary="Update available - Version 1.8.2"
                      />
                      <ListItemSecondaryAction>
                        <Button size="small" variant="outlined">
                          Update
                        </Button>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircle color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Security Patches"
                        secondary="All security patches applied"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <Api sx={{ mr: 1 }} />
                    API Configuration
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="API Rate Limit (requests/minute)"
                        type="number"
                        defaultValue={1000}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="API Timeout (seconds)"
                        type="number"
                        defaultValue={30}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={<Switch defaultChecked />}
                        label="Enable API Documentation"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={<Switch defaultChecked />}
                        label="Enable CORS"
                      />
                    </Grid>
                  </Grid>
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
                    <SecurityOutlined sx={{ mr: 1 }} />
                    Authentication Settings
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.security.twoFactorRequired}
                        onChange={(e) => handleConfigChange('security', 'twoFactorRequired', e.target.checked)}
                      />
                    }
                    label="Require Two-Factor Authentication"
                  />
                  <TextField
                    fullWidth
                    label="Minimum Password Length"
                    type="number"
                    value={config.security.passwordMinLength}
                    onChange={(e) => handleConfigChange('security', 'passwordMinLength', parseInt(e.target.value))}
                    sx={{ mt: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Session Timeout (minutes)"
                    type="number"
                    value={config.security.sessionTimeout}
                    onChange={(e) => handleConfigChange('security', 'sessionTimeout', parseInt(e.target.value))}
                    sx={{ mt: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Max Login Attempts"
                    type="number"
                    value={config.security.maxLoginAttempts}
                    onChange={(e) => handleConfigChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
                    sx={{ mt: 2 }}
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <VpnKey sx={{ mr: 1 }} />
                    API Keys & Tokens
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <Key />
                      </ListItemIcon>
                      <ListItemText
                        primary="Master API Key"
                        secondary="Last used: 2 hours ago"
                      />
                      <ListItemSecondaryAction>
                        <IconButton>
                          <Refresh />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Key />
                      </ListItemIcon>
                      <ListItemText
                        primary="Webhook Token"
                        secondary="Active"
                      />
                      <ListItemSecondaryAction>
                        <IconButton>
                          <Edit />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <VerifiedUser />
                      </ListItemIcon>
                      <ListItemText
                        primary="SSL Certificate"
                        secondary="Expires: March 15, 2024"
                      />
                      <ListItemSecondaryAction>
                        <Button size="small" variant="outlined">
                          Renew
                        </Button>
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <NetworkCheck sx={{ mr: 1 }} />
                    IP Whitelist
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <TextField
                      fullWidth
                      label="Add IP Address"
                      placeholder="192.168.1.100"
                    />
                    <Button variant="contained" startIcon={<Add />}>
                      Add
                    </Button>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip label="192.168.1.100" onDelete={() => {}} />
                    <Chip label="10.0.0.1" onDelete={() => {}} />
                    <Chip label="172.16.0.1" onDelete={() => {}} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Backup & Restore Tab */}
        <TabPanel value={currentTab} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <Backup sx={{ mr: 1 }} />
                    Backup Settings
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.backup.autoBackupEnabled}
                        onChange={(e) => handleConfigChange('backup', 'autoBackupEnabled', e.target.checked)}
                      />
                    }
                    label="Enable Automatic Backups"
                  />
                  <FormControl fullWidth sx={{ mt: 2 }}>
                    <InputLabel>Backup Frequency</InputLabel>
                    <Select
                      value={config.backup.backupFrequency}
                      label="Backup Frequency"
                      onChange={(e) => handleConfigChange('backup', 'backupFrequency', e.target.value)}
                    >
                      <MenuItem value="hourly">Hourly</MenuItem>
                      <MenuItem value="daily">Daily</MenuItem>
                      <MenuItem value="weekly">Weekly</MenuItem>
                      <MenuItem value="monthly">Monthly</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    fullWidth
                    label="Retention Period (days)"
                    type="number"
                    value={config.backup.retentionDays}
                    onChange={(e) => handleConfigChange('backup', 'retentionDays', parseInt(e.target.value))}
                    sx={{ mt: 2 }}
                  />
                  {config.backup.lastBackup && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      Last backup: {new Date(config.backup.lastBackup).toLocaleString()}
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <CloudUpload sx={{ mr: 1 }} />
                    Quick Actions
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Button
                      variant="contained"
                      startIcon={<Backup />}
                      onClick={() => setDialogs(prev => ({ ...prev, backup: true }))}
                    >
                      Create Manual Backup
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Restore />}
                      onClick={() => setDialogs(prev => ({ ...prev, restore: true }))}
                    >
                      Restore from Backup
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Download />}
                    >
                      Export System Data
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Upload />}
                    >
                      Import System Data
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <Storage sx={{ mr: 1 }} />
                    Backup History
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>Size</TableCell>
                          <TableCell>Created</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {backups.map((backup) => (
                          <TableRow key={backup.id}>
                            <TableCell>{backup.name}</TableCell>
                            <TableCell>{backup.size}</TableCell>
                            <TableCell>
                              {new Date(backup.created).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={backup.type}
                                color={backup.type === 'manual' ? 'primary' : 'default'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={backup.status}
                                color={backup.status === 'completed' ? 'success' : 'warning'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Tooltip title="Restore">
                                <IconButton
                                  size="small"
                                  onClick={() => handleRestoreBackup(backup.id)}
                                >
                                  <Restore />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Download">
                                <IconButton size="small">
                                  <Download />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDeleteBackup(backup.id)}
                                >
                                  <Delete />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Performance Tab */}
        <TabPanel value={currentTab} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <Speed sx={{ mr: 1 }} />
                    Performance Settings
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.performance.cacheEnabled}
                        onChange={(e) => handleConfigChange('performance', 'cacheEnabled', e.target.checked)}
                      />
                    }
                    label="Enable Caching"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.performance.compressionEnabled}
                        onChange={(e) => handleConfigChange('performance', 'compressionEnabled', e.target.checked)}
                      />
                    }
                    label="Enable Compression"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.performance.cdnEnabled}
                        onChange={(e) => handleConfigChange('performance', 'cdnEnabled', e.target.checked)}
                      />
                    }
                    label="Enable CDN"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.performance.rateLimitEnabled}
                        onChange={(e) => handleConfigChange('performance', 'rateLimitEnabled', e.target.checked)}
                      />
                    }
                    label="Enable Rate Limiting"
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <Memory sx={{ mr: 1 }} />
                    Resource Monitoring
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      CPU Usage: 68%
                    </Typography>
                    <LinearProgress variant="determinate" value={68} />
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      Memory Usage: 74%
                    </Typography>
                    <LinearProgress variant="determinate" value={74} color="warning" />
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      Disk Usage: 45%
                    </Typography>
                    <LinearProgress variant="determinate" value={45} color="success" />
                  </Box>
                  <Box>
                    <Typography variant="body2" gutterBottom>
                      Network I/O: 32%
                    </Typography>
                    <LinearProgress variant="determinate" value={32} color="info" />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Notifications Tab */}
        <TabPanel value={currentTab} index={4}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <Notifications sx={{ mr: 1 }} />
                    Notification Settings
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.notifications.emailEnabled}
                        onChange={(e) => handleConfigChange('notifications', 'emailEnabled', e.target.checked)}
                      />
                    }
                    label="Email Notifications"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.notifications.smsEnabled}
                        onChange={(e) => handleConfigChange('notifications', 'smsEnabled', e.target.checked)}
                      />
                    }
                    label="SMS Notifications"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.notifications.pushEnabled}
                        onChange={(e) => handleConfigChange('notifications', 'pushEnabled', e.target.checked)}
                      />
                    }
                    label="Push Notifications"
                  />
                  <TextField
                    fullWidth
                    label="Webhook URL"
                    value={config.notifications.webhookUrl || ''}
                    onChange={(e) => handleConfigChange('notifications', 'webhookUrl', e.target.value)}
                    sx={{ mt: 2 }}
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <Email sx={{ mr: 1 }} />
                    Email Templates
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText
                        primary="Welcome Email"
                        secondary="Sent to new users"
                      />
                      <ListItemSecondaryAction>
                        <IconButton>
                          <Edit />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Password Reset"
                        secondary="Password recovery emails"
                      />
                      <ListItemSecondaryAction>
                        <IconButton>
                          <Edit />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="System Alerts"
                        secondary="Critical system notifications"
                      />
                      <ListItemSecondaryAction>
                        <IconButton>
                          <Edit />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* System Logs Tab */}
        <TabPanel value={currentTab} index={5}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  <BugReport sx={{ mr: 1 }} />
                  System Logs
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Level</InputLabel>
                    <Select label="Level" defaultValue="">
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="error">Error</MenuItem>
                      <MenuItem value="warning">Warning</MenuItem>
                      <MenuItem value="info">Info</MenuItem>
                      <MenuItem value="debug">Debug</MenuItem>
                    </Select>
                  </FormControl>
                  <Button variant="outlined" startIcon={<Download />}>
                    Export Logs
                  </Button>
                  <IconButton onClick={() => setSystemLogs([])}>
                    <Delete />
                  </IconButton>
                </Box>
              </Box>
              
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>Level</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Message</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {systemLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          {new Date(log.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getLogLevelIcon(log.level)}
                            label={log.level.toUpperCase()}
                            color={getLogLevelColor(log.level) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{log.category}</TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {log.message}
                          </Typography>
                          {log.details && (
                            <Typography variant="caption" color="text.secondary">
                              {log.details}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <IconButton size="small">
                            <Visibility />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </TabPanel>
      </Paper>

      {/* Save Configuration Button */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleSaveConfig}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <Settings />}
        >
          {loading ? 'Saving...' : 'Save Configuration'}
        </Button>
      </Box>

      {/* Dialogs */}
      <Dialog
        open={dialogs.backup}
        onClose={() => setDialogs(prev => ({ ...prev, backup: false }))}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create System Backup</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Backup Name"
            placeholder="Enter backup name..."
            sx={{ mt: 2 }}
          />
          <Alert severity="info" sx={{ mt: 2 }}>
            This will create a complete backup of all system data including users, jobs, courses, and configurations.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogs(prev => ({ ...prev, backup: false }))}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => handleCreateBackup('')}
            disabled={loading}
          >
            Create Backup
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={dialogs.maintenance}
        onClose={() => setDialogs(prev => ({ ...prev, maintenance: false }))}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Maintenance Mode</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Enabling maintenance mode will make the system unavailable to all users except super admins.
          </Alert>
          <FormControlLabel
            control={
              <Switch
                checked={config.maintenance.enabled}
                onChange={(e) => handleConfigChange('maintenance', 'enabled', e.target.checked)}
              />
            }
            label="Enable Maintenance Mode"
          />
          <TextField
            fullWidth
            label="Maintenance Message"
            multiline
            rows={3}
            value={config.maintenance.message}
            onChange={(e) => handleConfigChange('maintenance', 'message', e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogs(prev => ({ ...prev, maintenance: false }))}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              handleSaveConfig();
              setDialogs(prev => ({ ...prev, maintenance: false }));
            }}
          >
            Apply Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SystemManagement;
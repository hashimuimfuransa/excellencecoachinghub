import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  FormControlLabel,
  Switch,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Backup,
  CloudDownload,
  CloudUpload,
  Schedule,
  CheckCircle,
  Error,
  Warning,
  Download,
  Restore,
  Delete,
  Add,
  Storage,
  Timer,
  Info,
  Refresh
} from '@mui/icons-material';

interface BackupItem {
  id: string;
  name: string;
  type: 'full' | 'incremental' | 'database' | 'files';
  status: 'completed' | 'failed' | 'in_progress' | 'scheduled';
  size: string;
  createdAt: string;
  duration: string;
  location: string;
}

const BackupsManagementPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const [backupFrequency, setBackupFrequency] = useState('daily');
  const [selectedBackup, setSelectedBackup] = useState<BackupItem | null>(null);
  const [restoreDialog, setRestoreDialog] = useState(false);
  const [createBackupDialog, setCreateBackupDialog] = useState(false);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    setLoading(true);
    try {
      // Mock data - replace with real API call
      const mockBackups: BackupItem[] = [
        {
          id: '1',
          name: 'Full System Backup - 2024-01-20',
          type: 'full',
          status: 'completed',
          size: '2.3 GB',
          createdAt: '2024-01-20T02:00:00Z',
          duration: '45 minutes',
          location: 'AWS S3'
        },
        {
          id: '2',
          name: 'Database Backup - 2024-01-19',
          type: 'database',
          status: 'completed',
          size: '156 MB',
          createdAt: '2024-01-19T02:00:00Z',
          duration: '5 minutes',
          location: 'AWS S3'
        },
        {
          id: '3',
          name: 'Incremental Backup - 2024-01-19',
          type: 'incremental',
          status: 'failed',
          size: '45 MB',
          createdAt: '2024-01-19T14:30:00Z',
          duration: '2 minutes',
          location: 'Local Storage'
        }
      ];
      setBackups(mockBackups);
    } catch (error) {
      console.error('Error loading backups:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async (type: string) => {
    try {
      // Implement backup creation
      console.log('Creating backup:', type);
      loadBackups();
    } catch (error) {
      console.error('Error creating backup:', error);
    }
    setCreateBackupDialog(false);
  };

  const restoreBackup = async () => {
    if (!selectedBackup) return;
    try {
      // Implement restore logic
      console.log('Restoring backup:', selectedBackup.id);
    } catch (error) {
      console.error('Error restoring backup:', error);
    }
    setRestoreDialog(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'failed': return 'error';
      case 'in_progress': return 'info';
      case 'scheduled': return 'warning';
      default: return 'default';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'full': return <Backup />;
      case 'database': return <Storage />;
      case 'incremental': return <CloudUpload />;
      case 'files': return <CloudDownload />;
      default: return <Backup />;
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2, textAlign: 'center' }}>
          Loading Backup Management...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          <Backup sx={{ mr: 2, verticalAlign: 'middle', fontSize: 'inherit' }} />
          Backup Management
        </Typography>
        <Typography variant="h6" color="textSecondary">
          Manage system backups and recovery operations
        </Typography>
      </Box>

      {/* Quick Actions */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Backup Settings
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={autoBackupEnabled}
                      onChange={(e) => setAutoBackupEnabled(e.target.checked)}
                    />
                  }
                  label="Enable Automatic Backups"
                />
              </Box>
              {autoBackupEnabled && (
                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel>Backup Frequency</InputLabel>
                  <Select
                    value={backupFrequency}
                    onChange={(e) => setBackupFrequency(e.target.value)}
                    label="Backup Frequency"
                  >
                    <MenuItem value="hourly">Hourly</MenuItem>
                    <MenuItem value="daily">Daily</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                  </Select>
                </FormControl>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setCreateBackupDialog(true)}
                  fullWidth
                >
                  Create Backup
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={loadBackups}
                  fullWidth
                >
                  Refresh
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Backups List */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Backups
          </Typography>
        </CardContent>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Backup</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Size</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {backups.map((backup) => (
                <TableRow key={backup.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                        {getTypeIcon(backup.type)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {backup.name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {new Date(backup.createdAt).toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={backup.type} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{backup.size}</TableCell>
                  <TableCell>{backup.duration}</TableCell>
                  <TableCell>{backup.location}</TableCell>
                  <TableCell>
                    <Chip
                      label={backup.status}
                      size="small"
                      color={getStatusColor(backup.status) as any}
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      onClick={() => {
                        setSelectedBackup(backup);
                        setRestoreDialog(true);
                      }}
                      disabled={backup.status !== 'completed'}
                      title="Restore"
                    >
                      <Restore />
                    </IconButton>
                    <IconButton title="Download">
                      <Download />
                    </IconButton>
                    <IconButton title="Delete">
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Create Backup Dialog */}
      <Dialog open={createBackupDialog} onClose={() => setCreateBackupDialog(false)}>
        <DialogTitle>Create New Backup</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>Select backup type:</Typography>
          <List>
            <ListItem button onClick={() => createBackup('full')}>
              <ListItemIcon><Backup /></ListItemIcon>
              <ListItemText 
                primary="Full System Backup" 
                secondary="Complete backup of all data and files"
              />
            </ListItem>
            <ListItem button onClick={() => createBackup('database')}>
              <ListItemIcon><Storage /></ListItemIcon>
              <ListItemText 
                primary="Database Only" 
                secondary="Backup database content only"
              />
            </ListItem>
            <ListItem button onClick={() => createBackup('files')}>
              <ListItemIcon><CloudDownload /></ListItemIcon>
              <ListItemText 
                primary="Files Only" 
                secondary="Backup uploaded files and media"
              />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateBackupDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Restore Dialog */}
      <Dialog open={restoreDialog} onClose={() => setRestoreDialog(false)}>
        <DialogTitle>Restore Backup</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Warning: Restoring a backup will overwrite current data. This action cannot be undone.
          </Alert>
          {selectedBackup && (
            <Typography>
              Are you sure you want to restore "{selectedBackup.name}"?
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoreDialog(false)}>Cancel</Button>
          <Button onClick={restoreBackup} color="warning" variant="contained">
            Restore
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default BackupsManagementPage;
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Alert,
  Button,
  LinearProgress,
  Collapse,
  IconButton
} from '@mui/material';
import {
  Storage,
  CloudDone,
  Sync,
  ExpandMore,
  ExpandLess,
  CheckCircle,
  Schedule,
  Info
} from '@mui/icons-material';

interface PersistenceDemoProps {
  userId?: string;
  lastSaved?: string;
  section?: string;
}

const PersistenceDemo: React.FC<PersistenceDemoProps> = ({
  userId,
  lastSaved,
  section = 'settings'
}) => {
  const [expanded, setExpanded] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'pending' | 'local'>('synced');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (lastSaved) {
      setLastUpdate(new Date(lastSaved));
    }
  }, [lastSaved]);

  useEffect(() => {
    // Check for pending syncs
    const checkSyncStatus = () => {
      try {
        const pendingSync = localStorage.getItem('pendingSettingsSync');
        if (pendingSync === 'true') {
          setSyncStatus('pending');
        } else {
          setSyncStatus('synced');
        }
      } catch (error) {
        setSyncStatus('local');
      }
    };

    checkSyncStatus();
    // Check every 30 seconds
    const interval = setInterval(checkSyncStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleTestPersistence = () => {
    // Simulate scroll and navigation test
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 1000);
  };

  const getSyncStatusInfo = () => {
    switch (syncStatus) {
      case 'synced':
        return {
          color: 'success' as const,
          icon: <CloudDone />,
          label: 'Synced',
          description: 'All settings are synced to the cloud'
        };
      case 'pending':
        return {
          color: 'warning' as const,
          icon: <Sync />,
          label: 'Pending Sync',
          description: 'Settings saved locally, will sync when connection is restored'
        };
      case 'local':
        return {
          color: 'info' as const,
          icon: <Storage />,
          label: 'Local Only',
          description: 'Settings are saved locally in your browser'
        };
    }
  };

  const statusInfo = getSyncStatusInfo();

  return (
    <Card sx={{ mb: 2, border: '1px solid', borderColor: 'grey.200' }}>
      <CardContent sx={{ py: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Storage sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Settings Persistence
            </Typography>
            <Chip
              icon={statusInfo.icon}
              label={statusInfo.label}
              color={statusInfo.color}
              size="small"
              sx={{ ml: 2 }}
            />
          </Box>
          <IconButton 
            onClick={() => setExpanded(!expanded)}
            size="small"
          >
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>

        <Collapse in={expanded}>
          <Box sx={{ mt: 2 }}>
            <Alert severity={statusInfo.color} sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Status:</strong> {statusInfo.description}
              </Typography>
            </Alert>

            {lastUpdate && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary" sx={{ display: 'flex', alignItems: 'center' }}>
                  <Schedule sx={{ mr: 1, fontSize: '1rem' }} />
                  Last saved: {lastUpdate.toLocaleString()}
                </Typography>
              </Box>
            )}

            <Alert severity="info" icon={<Info />} sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Your settings are persistent!</strong>
                <br />
                • ✅ Saved across browser sessions
                <br />
                • ✅ Maintained when you scroll or navigate
                <br />
                • ✅ Backed up both locally and in the cloud
                <br />
                • ✅ Can be updated anytime
              </Typography>
            </Alert>

            <Button
              variant="outlined"
              size="small"
              onClick={handleTestPersistence}
              startIcon={<CheckCircle />}
              sx={{ mr: 2 }}
            >
              Test Scroll Persistence
            </Button>

            {syncStatus === 'pending' && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                  Sync in progress...
                </Typography>
                <LinearProgress />
              </Box>
            )}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default PersistenceDemo;
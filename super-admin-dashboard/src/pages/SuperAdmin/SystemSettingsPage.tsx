import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import { Settings } from '@mui/icons-material';
import SystemManagement from '../../components/SuperAdmin/SystemManagement';

const SystemSettingsPage: React.FC = () => {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ 
        mb: 4, 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: 2,
        p: 3,
        color: 'white'
      }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          <Settings sx={{ mr: 2, verticalAlign: 'middle', fontSize: 'inherit' }} />
          System Settings
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 300 }}>
          Configure system settings, manage backups, and monitor system health
        </Typography>
      </Box>

      {/* System Management Component */}
      <SystemManagement />
    </Container>
  );
};

export default SystemSettingsPage;
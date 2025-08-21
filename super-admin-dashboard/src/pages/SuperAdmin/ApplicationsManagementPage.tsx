import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import { Assignment } from '@mui/icons-material';
import ApplicationManagement from '../../components/SuperAdmin/ApplicationManagement';

const ApplicationsManagementPage: React.FC = () => {
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
          <Assignment sx={{ mr: 2, verticalAlign: 'middle', fontSize: 'inherit' }} />
          Applications Management
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 300 }}>
          Manage job applications, track candidate progress, and review submissions
        </Typography>
      </Box>

      {/* Applications Management Component */}
      <ApplicationManagement />
    </Container>
  );
};

export default ApplicationsManagementPage;
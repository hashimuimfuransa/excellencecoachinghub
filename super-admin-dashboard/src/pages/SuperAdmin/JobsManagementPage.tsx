import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import { Work } from '@mui/icons-material';
import JobManagement from '../../components/SuperAdmin/JobManagement';

const JobsManagementPage: React.FC = () => {
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
          <Work sx={{ mr: 2, verticalAlign: 'middle', fontSize: 'inherit' }} />
          Jobs Management
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 300 }}>
          Manage job postings, track applications, and monitor hiring progress
        </Typography>
      </Box>

      {/* Jobs Management Component */}
      <JobManagement />
    </Container>
  );
};

export default JobsManagementPage;
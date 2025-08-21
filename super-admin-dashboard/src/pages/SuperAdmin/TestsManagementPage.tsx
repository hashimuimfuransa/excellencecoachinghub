import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import { Assessment } from '@mui/icons-material';
import TestManagement from '../../components/SuperAdmin/TestManagement';

const TestsManagementPage: React.FC = () => {
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
          <Assessment sx={{ mr: 2, verticalAlign: 'middle', fontSize: 'inherit' }} />
          Tests Management
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 300 }}>
          Manage psychometric tests, track results, and analyze performance
        </Typography>
      </Box>

      {/* Tests Management Component */}
      <TestManagement />
    </Container>
  );
};

export default TestsManagementPage;
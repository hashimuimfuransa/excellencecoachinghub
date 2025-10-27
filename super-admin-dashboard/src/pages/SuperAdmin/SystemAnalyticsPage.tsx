import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import { TrendingUp } from '@mui/icons-material';
import SystemAnalytics from '../../components/SuperAdmin/SystemAnalytics';

const SystemAnalyticsPage: React.FC = () => {
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
          <TrendingUp sx={{ mr: 2, verticalAlign: 'middle', fontSize: 'inherit' }} />
          System Analytics
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 300 }}>
          Comprehensive system analytics, performance metrics, and insights
        </Typography>
      </Box>

      {/* System Analytics Component */}
      <SystemAnalytics />
    </Container>
  );
};

export default SystemAnalyticsPage;
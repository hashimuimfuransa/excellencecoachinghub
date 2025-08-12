import React from 'react';
import { Typography, Container } from '@mui/material';

const DashboardPage: React.FC = () => {
  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1">
        General dashboard page - will be implemented based on user role
      </Typography>
    </Container>
  );
};

export default DashboardPage;

import React from 'react';
import { Box, AppBar, Toolbar, Typography, Container } from '@mui/material';
import { School } from '@mui/icons-material';

interface TeacherProfileCompletionLayoutProps {
  children: React.ReactNode;
}

const TeacherProfileCompletionLayout: React.FC<TeacherProfileCompletionLayoutProps> = ({ children }) => {
  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <AppBar position="static" elevation={0} sx={{ backgroundColor: '#1976d2' }}>
        <Toolbar>
          <School sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Excellence Coaching Hub - Teacher Portal
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="md" sx={{ py: 4 }}>
        {children}
      </Container>
    </Box>
  );
};

export default TeacherProfileCompletionLayout;

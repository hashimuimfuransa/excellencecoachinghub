import React from 'react';
import { Box, Container, AppBar, Toolbar, Typography, IconButton } from '@mui/material';
import { ArrowBack, School } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface ExamLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBackButton?: boolean;
}

const ExamLayout: React.FC<ExamLayoutProps> = ({ 
  children, 
  title = "Exam Interface",
  showBackButton = true 
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      {/* Minimal Header */}
      <AppBar 
        position="sticky" 
        elevation={1}
        sx={{ 
          backgroundColor: '#1976d2',
          borderBottom: '1px solid #e0e0e0'
        }}
      >
        <Toolbar sx={{ minHeight: '56px !important' }}>
          {showBackButton && (
            <IconButton
              edge="start"
              color="inherit"
              onClick={handleBack}
              sx={{ mr: 2 }}
              aria-label="go back"
            >
              <ArrowBack />
            </IconButton>
          )}
          
          <School sx={{ mr: 1 }} />
          
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontWeight: 600,
              fontSize: '1.1rem'
            }}
          >
            {title}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default ExamLayout;

import React from 'react';
import { Box, AppBar, Toolbar, Typography, Container, IconButton } from '@mui/material';
import { School, ArrowBack, Logout } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface TeacherProfileCompletionLayoutProps {
  children: React.ReactNode;
}

const TeacherProfileCompletionLayout: React.FC<TeacherProfileCompletionLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleBack = () => {
    navigate(-1);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <AppBar position="static" elevation={0} sx={{ backgroundColor: '#1976d2' }}>
        <Toolbar>
          <IconButton
            color="inherit"
            onClick={handleBack}
            sx={{ mr: 2 }}
            title="Go back"
          >
            <ArrowBack />
          </IconButton>
          <School sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Excellence Coaching Hub - Teacher Portal
          </Typography>
          <IconButton
            color="inherit"
            onClick={handleLogout}
            title="Logout"
          >
            <Logout />
          </IconButton>
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

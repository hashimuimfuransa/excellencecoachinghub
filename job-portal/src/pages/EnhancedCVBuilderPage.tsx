import React from 'react';
import { Container, Box, Typography, Paper, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import EnhancedCVBuilder from '../components/enhanced-cv-builder/EnhancedCVBuilder';

const EnhancedCVBuilderPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  const handleClose = () => {
    navigate('/dashboard');
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: 'background.default',
      pb: 0,
    }}>
      <EnhancedCVBuilder onClose={handleClose} />
    </Box>
  );
};

export default EnhancedCVBuilderPage;
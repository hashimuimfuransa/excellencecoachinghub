import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AllJobsPage from '../pages/AllJobsPage';
import { Box, CircularProgress } from '@mui/material';

/**
 * Smart Home component that redirects authenticated users to network page
 * and shows public jobs page to non-authenticated users
 */
const SmartHome: React.FC = () => {
  const { user, isLoading } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // If user is authenticated, redirect to network page
  if (user) {
    return <Navigate to="/app/network" replace />;
  }

  // If user is not authenticated, show public jobs page
  return <AllJobsPage />;
};

export default SmartHome;
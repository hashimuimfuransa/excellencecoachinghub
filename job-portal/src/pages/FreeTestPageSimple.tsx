import React from 'react';
import { Box, Typography, Container } from '@mui/material';
import { useParams, useLocation } from 'react-router-dom';

const FreeTestPage: React.FC = () => {
  const { categoryId } = useParams();
  const location = useLocation();
  
  console.log('FreeTestPage loaded');
  console.log('Category ID:', categoryId);
  console.log('Location state:', location.state);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box textAlign="center">
        <Typography variant="h3" gutterBottom>
          Free Test Page - Working!
        </Typography>
        <Typography variant="h5" color="primary" gutterBottom>
          Category: {categoryId}
        </Typography>
        <Typography variant="body1">
          If you see this page, the navigation is working correctly.
        </Typography>
        <Box sx={{ mt: 3, p: 3, bgcolor: 'grey.100', borderRadius: 2 }}>
          <Typography variant="h6">Debug Info:</Typography>
          <Typography>Category ID: {categoryId}</Typography>
          <Typography>Location state: {JSON.stringify(location.state, null, 2)}</Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default FreeTestPage;
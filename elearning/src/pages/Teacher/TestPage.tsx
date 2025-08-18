import React from 'react';
import { Container, Typography, Box, Button } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';

const TestPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box>
        <Typography variant="h4" gutterBottom>
          Teacher Test Page
        </Typography>
        <Typography variant="body1" gutterBottom>
          Current path: {location.pathname}
        </Typography>
        
        <Box mt={3}>
          <Typography variant="h6" gutterBottom>
            Test Navigation:
          </Typography>
          <Box display="flex" flexDirection="column" gap={2} maxWidth={300}>
            <Button 
              variant="outlined" 
              onClick={() => navigate('/dashboard/teacher')}
            >
              Go to Teacher Dashboard
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => navigate('/dashboard/teacher/profile/complete')}
            >
              Go to Teacher Profile
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => navigate('/dashboard/teacher/courses')}
            >
              Go to Teacher Courses
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => navigate('/dashboard/teacher/students')}
            >
              Go to Teacher Students
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => navigate('/dashboard/teacher/analytics')}
            >
              Go to Teacher Analytics
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => navigate('/dashboard/teacher/courses/create')}
            >
              Go to Create Course
            </Button>
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default TestPage;

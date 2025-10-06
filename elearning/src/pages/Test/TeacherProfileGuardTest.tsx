import React from 'react';
import { Container, Typography, Box, Button } from '@mui/material';
import TeacherProfileGuard from '../../guards/TeacherProfileGuard';

const TeacherProfileGuardTest: React.FC = () => {
  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Teacher Profile Guard Test
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="body1" paragraph>
          This page tests the TeacherProfileGuard component. The guard should:
        </Typography>
        <Box component="ul" sx={{ pl: 2 }}>
          <li>Show profile completion prompt for incomplete profiles</li>
          <li>Show review status for pending profiles</li>
          <li>Show rejection message for rejected profiles</li>
          <li>Allow access for approved profiles</li>
          <li>Handle errors gracefully by treating them as incomplete</li>
        </Box>
      </Box>

      <Box sx={{ p: 3, border: '1px dashed #ccc', borderRadius: 1 }}>
        <Typography variant="h6" gutterBottom>
          Protected Content (Should only show for approved teachers):
        </Typography>
        <Typography variant="body2" color="text.secondary">
          If you can see this content, your teacher profile is approved!
        </Typography>
        <Button 
          variant="contained" 
          sx={{ mt: 2 }}
          onClick={() => window.location.href = '/dashboard/teacher'}
        >
          Go to Teacher Dashboard
        </Button>
      </Box>
    </Container>
  );
};

const TeacherProfileGuardTestPage: React.FC = () => {
  return (
    <TeacherProfileGuard>
      <TeacherProfileGuardTest />
    </TeacherProfileGuard>
  );
};

export default TeacherProfileGuardTestPage;

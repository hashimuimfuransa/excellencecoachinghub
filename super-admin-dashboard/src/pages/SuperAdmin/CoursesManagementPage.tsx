import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import { School } from '@mui/icons-material';
import CourseManagement from '../../components/SuperAdmin/CourseManagement';

const CoursesManagementPage: React.FC = () => {
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
          <School sx={{ mr: 2, verticalAlign: 'middle', fontSize: 'inherit' }} />
          Courses Management
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 300 }}>
          Manage courses, track enrollments, and monitor learning progress
        </Typography>
      </Box>

      {/* Courses Management Component */}
      <CourseManagement />
    </Container>
  );
};

export default CoursesManagementPage;
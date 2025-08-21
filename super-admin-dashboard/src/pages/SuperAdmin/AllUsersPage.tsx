import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import { People } from '@mui/icons-material';
import UserManagement from '../../components/SuperAdmin/UserManagement';

const AllUsersPage: React.FC = () => {
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
          <People sx={{ mr: 2, verticalAlign: 'middle', fontSize: 'inherit' }} />
          Users Management
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 300 }}>
          Manage user accounts, roles, permissions, and monitor user activity
        </Typography>
      </Box>

      {/* Users Management Component */}
      <UserManagement />
    </Container>
  );
};

export default AllUsersPage;
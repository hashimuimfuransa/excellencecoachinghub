import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import { CardMembership } from '@mui/icons-material';
import CertificateManagement from '../../components/SuperAdmin/CertificateManagement';

const CertificatesManagementPage: React.FC = () => {
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
          <CardMembership sx={{ mr: 2, verticalAlign: 'middle', fontSize: 'inherit' }} />
          Certificates Management
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 300 }}>
          Manage certificates, track issuance, and verify authenticity
        </Typography>
      </Box>

      {/* Certificates Management Component */}
      <CertificateManagement />
    </Container>
  );
};

export default CertificatesManagementPage;
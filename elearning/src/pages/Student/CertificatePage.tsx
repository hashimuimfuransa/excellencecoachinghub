import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Stack,
  Paper,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  ArrowBack,
  Download,
  Share,
  Print,
  Verified,
  School,
  CalendarToday,
  Person,
  Grade,
  QrCode,
  CheckCircle
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import CertificateComponent from '../../components/Certificate/CertificateComponent';

interface Certificate {
  _id: string;
  title: string;
  description: string;
  courseName: string;
  studentName: string;
  completionDate: string;
  grade?: number;
  verificationCode: string;
  issuedBy: string;
  certificateUrl?: string;
  isVerified: boolean;
  expiresAt?: string;
}

const CertificatePage: React.FC = () => {
  const { certificateId } = useParams<{ certificateId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  useEffect(() => {
    if (certificateId) {
      loadCertificate();
    }
  }, [certificateId]);

  const loadCertificate = async () => {
    try {
      setLoading(true);
      // Mock certificate data - in real implementation, fetch from API
      const mockCertificate: Certificate = {
        _id: certificateId!,
        title: "Certificate of Completion",
        description: "This certificate is awarded to students who successfully complete the course requirements.",
        courseName: "JavaScript Fundamentals",
        studentName: user?.name || "Student Name",
        completionDate: new Date().toISOString(),
        grade: 85,
        verificationCode: "JSF2024001",
        issuedBy: "Excellence Coaching Hub",
        certificateUrl: undefined, // Will be generated on demand
        isVerified: true,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year from now
      };
      
      setCertificate(mockCertificate);
    } catch (err: any) {
      setError(err.message || 'Failed to load certificate');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (certificate?.certificateUrl) {
      const link = document.createElement('a');
      link.href = certificate.certificateUrl;
      link.download = `${certificate.title}_${certificate.studentName}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Generate certificate PDF
      // In real implementation, this would call an API to generate the certificate
      console.log('Generating certificate PDF...');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    setShareDialogOpen(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => navigate(-1)} startIcon={<ArrowBack />}>
          Go Back
        </Button>
      </Container>
    );
  }

  if (!certificate) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="warning">
          Certificate not found
        </Alert>
        <Button variant="contained" onClick={() => navigate(-1)} startIcon={<ArrowBack />}>
          Go Back
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          variant="outlined"
          onClick={() => navigate(-1)}
          startIcon={<ArrowBack />}
          sx={{ mr: 2 }}
        >
          Go Back
        </Button>
        <Typography variant="h4" sx={{ flex: 1 }}>
          Certificate
        </Typography>
      </Box>

      {/* Certificate Display */}
      <CertificateComponent 
        certificate={certificate} 
        showActions={true}
      />

      {/* Certificate Details */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Certificate Details
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Course Name
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {certificate.courseName}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Student Name
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {certificate.studentName}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Completion Date
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {formatDate(certificate.completionDate)}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Verification Code
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', fontFamily: 'monospace' }}>
                    {certificate.verificationCode}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Issued By
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {certificate.issuedBy}
                  </Typography>
                </Box>
                
                {certificate.grade && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Final Grade
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                      {certificate.grade}%
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Grid>
          </Grid>
          
          {/* Status Indicators */}
          <Box sx={{ mt: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {certificate.isVerified && (
              <Chip 
                icon={<CheckCircle />} 
                label="Verified Certificate" 
                color="success" 
                variant="outlined" 
              />
            )}
            {certificate.expiresAt && new Date(certificate.expiresAt) > new Date() && (
              <Chip 
                label={`Expires ${formatDate(certificate.expiresAt)}`} 
                color="info" 
                variant="outlined" 
              />
            )}
            {certificate.expiresAt && new Date(certificate.expiresAt) <= new Date() && (
              <Chip 
                label="Expired" 
                color="error" 
                variant="outlined" 
              />
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Actions
          </Typography>
          
          <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={handleDownload}
            >
              Download PDF
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<Print />}
              onClick={handlePrint}
            >
              Print Certificate
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<Share />}
              onClick={handleShare}
            >
              Share Certificate
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Share Certificate
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            Share this certificate with others using the verification code or direct link.
          </Typography>
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Verification Code
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Typography variant="body1" sx={{ fontFamily: 'monospace', flex: 1 }}>
                {certificate.verificationCode}
              </Typography>
              <IconButton 
                size="small" 
                onClick={() => copyToClipboard(certificate.verificationCode)}
              >
                <Download />
              </IconButton>
            </Box>
          </Box>
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Certificate Link
            </Typography>
            <Typography variant="body2" color="text.secondary">
              https://excellencecoachinghub.com/certificate/{certificate.verificationCode}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CertificatePage;

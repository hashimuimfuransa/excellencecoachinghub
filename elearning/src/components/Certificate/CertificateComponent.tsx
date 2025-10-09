import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Chip,
  Stack,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Divider,
  Grid,
  Avatar
} from '@mui/material';
import {
  Download,
  Share,
  Print,
  Verified,
  School,
  CalendarToday,
  Person,
  Grade,
  Close,
  QrCode,
  CheckCircle
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';

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

interface CertificateProps {
  certificate: Certificate;
  onClose?: () => void;
  showActions?: boolean;
}

const CertificateComponent: React.FC<CertificateProps> = ({ 
  certificate, 
  onClose, 
  showActions = true 
}) => {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const handleDownload = () => {
    if (certificate.certificateUrl) {
      const link = document.createElement('a');
      link.href = certificate.certificateUrl;
      link.download = `${certificate.title}_${certificate.studentName}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Generate certificate if URL doesn't exist
      setIsGenerating(true);
      // Simulate certificate generation
      setTimeout(() => {
        setIsGenerating(false);
        // In real implementation, this would call an API to generate the certificate
      }, 2000);
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

  const isExpired = certificate.expiresAt && new Date(certificate.expiresAt) < new Date();

  return (
    <Box>
      {/* Certificate Display */}
      <Paper 
        elevation={8}
        sx={{ 
          p: 4, 
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          border: '3px solid #4caf50',
          borderRadius: 2,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            pointerEvents: 'none'
          }
        }}
      >
        {/* Certificate Header */}
        <Box sx={{ textAlign: 'center', mb: 4, position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main' }}>
              <School sx={{ fontSize: 40 }} />
            </Avatar>
          </Box>
          
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            Certificate of Completion
          </Typography>
          
          <Typography variant="h6" color="text.secondary" paragraph>
            This is to certify that
          </Typography>
          
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: 'text.primary' }}>
            {certificate.studentName}
          </Typography>
          
          <Typography variant="body1" color="text.secondary" paragraph>
            has successfully completed the course
          </Typography>
          
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            {certificate.courseName}
          </Typography>
        </Box>

        {/* Certificate Details */}
        <Grid container spacing={3} sx={{ mb: 4, position: 'relative', zIndex: 1 }}>
          <Grid item xs={12} md={6}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Completion Date
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {formatDate(certificate.completionDate)}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Verification Code
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold', fontFamily: 'monospace' }}>
                {certificate.verificationCode}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Grade (if available) */}
        {certificate.grade && (
          <Box sx={{ textAlign: 'center', mb: 4, position: 'relative', zIndex: 1 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Final Grade
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
              {certificate.grade}%
            </Typography>
          </Box>
        )}

        {/* Certificate Footer */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Issued by
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              {certificate.issuedBy}
            </Typography>
          </Box>
          
          <Box sx={{ textAlign: 'center' }}>
            <Verified sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
            <Typography variant="caption" color="text.secondary">
              Verified Certificate
            </Typography>
          </Box>
          
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="subtitle2" color="text.secondary">
              Certificate ID
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold', fontFamily: 'monospace' }}>
              {certificate._id.slice(-8).toUpperCase()}
            </Typography>
          </Box>
        </Box>

        {/* Status Indicators */}
        <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 2 }}>
          <Stack direction="row" spacing={1}>
            {certificate.isVerified && (
              <Chip 
                icon={<CheckCircle />} 
                label="Verified" 
                color="success" 
                size="small" 
              />
            )}
            {isExpired && (
              <Chip 
                label="Expired" 
                color="error" 
                size="small" 
              />
            )}
          </Stack>
        </Box>
      </Paper>

      {/* Actions */}
      {showActions && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Certificate Actions
            </Typography>
            
            <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<Download />}
                onClick={handleDownload}
                disabled={isGenerating}
              >
                {isGenerating ? 'Generating...' : 'Download PDF'}
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

            {isGenerating && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                <CircularProgress size={20} />
                <Typography variant="body2" color="text.secondary">
                  Generating certificate PDF...
                </Typography>
              </Box>
            )}

            {certificate.expiresAt && (
              <Alert severity="info" sx={{ mt: 2 }}>
                This certificate expires on {formatDate(certificate.expiresAt)}
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

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

      {/* Close Button */}
      {onClose && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Button variant="outlined" onClick={onClose}>
            Close
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default CertificateComponent;

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
  Avatar,
  Snackbar
} from '@mui/material';
import {
  Download,
  Print,
  Verified,
  School,
  CalendarToday,
  Person,
  Grade,
  Close,
  QrCode,
  CheckCircle,
  Share,
  ContentCopy
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { downloadCertificatePNG, downloadCertificatePDF } from '../../utils/pdfDownloader';

interface Certificate {
  _id: string;
  title?: string;
  description?: string;
  courseName: string;
  studentName: string;
  completionDate: string;
  grade?: string | number;
  score?: number;
  verificationCode: string;
  certificateNumber?: string;
  issuedBy: string;
  certificateUrl?: string;
  isVerified: boolean;
  expiresAt?: string;
  totalPoints?: number;
  earnedPoints?: number;
  sessionsAttended?: number;
  totalSessions?: number;
  assessmentsCompleted?: number;
  totalAssessments?: number;
  status?: string;
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
  const [generatingFormat, setGeneratingFormat] = useState<'png' | 'pdf' | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleDownload = (format: 'png' | 'pdf') => {
    try {
      setGeneratingFormat(format);
      const completionDateFormatted = formatDate(certificate.completionDate);
      const certificateNumber = certificate.certificateNumber || certificate._id.slice(-8).toUpperCase();
      const gradeLabel = typeof certificate.grade === 'number' ? `${certificate.grade}%` : certificate.grade || 'Pass';
      const scoreValue = typeof certificate.score === 'number'
        ? certificate.score
        : typeof certificate.grade === 'number'
          ? certificate.grade
          : certificate.totalPoints && certificate.totalPoints > 0 && typeof certificate.earnedPoints === 'number'
            ? Math.round((certificate.earnedPoints / certificate.totalPoints) * 100)
            : 0;
      if (format === 'png') {
        downloadCertificatePNG(
          certificate.studentName,
          certificate.courseName,
          completionDateFormatted,
          gradeLabel,
          scoreValue,
          certificateNumber,
          certificate.verificationCode
        );
      } else {
        downloadCertificatePDF(
          certificate.studentName,
          certificate.courseName,
          completionDateFormatted,
          gradeLabel,
          scoreValue,
          certificateNumber,
          certificate.verificationCode
        );
      }
    } catch (error) {
      console.error('❌ Download error:', error);
      alert(`Failed to generate certificate: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setGeneratingFormat(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isExpired = certificate.expiresAt && new Date(certificate.expiresAt) < new Date();

  const handleShare = () => {
    setShareDialogOpen(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  };

  const shareViaEmail = () => {
    const subject = `Certificate: ${certificate.courseName}`;
    const body = `Hi,\n\nI've successfully completed the ${certificate.courseName} course at Excellence Coaching Hub.\n\nVerification Code: ${certificate.verificationCode}\n\nYou can verify this certificate at: https://excellencecoachinghub.com/verify/${certificate.verificationCode}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setShareDialogOpen(false);
  };

  const shareViaLink = () => {
    const shareUrl = `https://excellencecoachinghub.com/certificate/${certificate.verificationCode}`;
    copyToClipboard(shareUrl);
  };

  return (
    <Box sx={{
      p: { xs: 1, sm: 2, md: 3 },
      width: '100%',
      boxSizing: 'border-box',
      '@media print': {
        p: 0,
        backgroundColor: 'white'
      }
    }}>
      {/* Certificate Display */}
      <Paper 
        elevation={12}
        sx={{ 
          p: { xs: 2, sm: 3, md: 5 },
          background: 'linear-gradient(to bottom, #ffffff 0%, #f8f9fa 100%)',
          '@media print': {
            boxShadow: 'none',
            border: 'none',
            background: '#ffffff',
            p: { xs: 1, sm: 2, md: 3 }
          },
          border: '8px solid transparent',
          borderImage: 'linear-gradient(135deg, #2c3e50 0%, #1a1a1a 50%, #2c3e50 100%) 1',
          borderRadius: 1,
          position: 'relative',
          overflow: 'hidden',
          maxWidth: { xs: '100%', md: 900 },
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '8px',
            background: 'linear-gradient(90deg, #2c3e50 0%, #27ae60 50%, #2c3e50 100%)',
            zIndex: 1
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '8px',
            background: 'linear-gradient(90deg, #2c3e50 0%, #27ae60 50%, #2c3e50 100%)',
            zIndex: 1
          }
        }}
      >
        {/* Status Indicators */}
        <Box sx={{ position: 'absolute', top: { xs: 10, sm: 20 }, right: { xs: 10, sm: 20 }, zIndex: 2 }}>
          <Stack direction="row" spacing={1}>
            {certificate.isVerified && (
              <Chip 
                icon={<CheckCircle />} 
                label="Verified" 
                color="success" 
                size="small" 
                sx={{ fontWeight: 'bold' }}
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

        {/* Certificate Header */}
        <Box sx={{ textAlign: 'center', mb: 3, position: 'relative', zIndex: 1, mt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Avatar sx={{ width: { xs: 50, sm: 60, md: 70 }, height: { xs: 50, sm: 60, md: 70 }, bgcolor: '#27ae60', boxShadow: '0 4px 12px rgba(39, 174, 96, 0.3)' }}>
              <School sx={{ fontSize: { xs: 28, md: 40 }, color: 'white' }} />
            </Avatar>
          </Box>
          
          <Typography 
            sx={{ 
              fontSize: { xs: '28px', sm: '36px', md: '48px' },
              fontWeight: 900,
              background: 'linear-gradient(135deg, #2c3e50 0%, #27ae60 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1,
              letterSpacing: { xs: '0px', md: '1px' }
            }}
          >
            Certificate of Completion
          </Typography>
          
          <Divider sx={{ my: 2, borderColor: '#27ae60', borderWidth: 2, width: { xs: '80%', md: '60%' }, mx: 'auto' }} />
          
          <Typography variant="h6" color="text.secondary" paragraph sx={{ fontStyle: 'italic', fontSize: { xs: '14px', md: '16px' } }}>
            This is to certify that
          </Typography>
          
          <Typography 
            variant="h4" 
            gutterBottom 
            sx={{ 
              fontWeight: 900, 
              color: '#2c3e50',
              fontSize: { xs: '22px', sm: '28px', md: '36px' },
              mb: 2,
              textDecoration: 'underline',
              textDecorationColor: '#27ae60',
              textDecorationThickness: '2px',
              textUnderlineOffset: '6px',
              px: { xs: 1, sm: 0 }
            }}
          >
            {certificate.studentName}
          </Typography>
          
          <Typography variant="body1" color="text.secondary" paragraph sx={{ fontSize: { xs: '14px', md: '16px' }, mb: 2, px: { xs: 1, sm: 0 } }}>
            has successfully completed and demonstrated proficiency in
          </Typography>
          
          <Typography 
            variant="h5" 
            gutterBottom 
            sx={{ 
              fontWeight: 800, 
              color: '#27ae60',
              fontSize: { xs: '18px', sm: '24px', md: '28px' },
              mb: 2,
              p: { xs: 1, md: 1.5 },
              backgroundColor: '#f0f8f5',
              borderRadius: 1,
              border: '2px solid #27ae60',
              mx: { xs: 1, sm: 0 }
            }}
          >
            {certificate.courseName}
          </Typography>
        </Box>

        {/* Certificate Key Details - Score and Grade */}
        <Box sx={{ mb: 4, p: { xs: 2, md: 3 }, backgroundColor: '#f0f8f5', borderRadius: 2, border: '2px solid #27ae60', position: 'relative', zIndex: 1, mx: { xs: -2, sm: 0 } }}>
          <Grid container spacing={{ xs: 1, md: 2 }}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ textAlign: 'center' }}>
                <Grade sx={{ color: '#27ae60', fontSize: { xs: 32, md: 45 }, mb: 1 }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5, fontSize: { xs: '12px', md: '14px' } }}>
                  FINAL SCORE
                </Typography>
                <Typography 
                  variant="h2" 
                  sx={{ 
                    fontWeight: 900, 
                    color: '#27ae60',
                    textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    fontSize: { xs: '32px', sm: '40px', md: '48px' }
                  }}
                >
                  {certificate.score ?? 0}%
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: { xs: '12px', md: '14px' } }}>
                  {certificate.earnedPoints ?? 0} / {certificate.totalPoints ?? 100} points
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Box sx={{ textAlign: 'center' }}>
                <Verified sx={{ color: '#27ae60', fontSize: { xs: 32, md: 45 }, mb: 1 }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5, fontSize: { xs: '12px', md: '14px' } }}>
                  GRADE STATUS
                </Typography>
                <Typography 
                  variant="h3" 
                  sx={{ 
                    fontWeight: 900, 
                    color: certificate.grade === 'Pass' ? '#27ae60' : '#e74c3c',
                    fontSize: { xs: '28px', sm: '36px', md: '42px' }
                  }}
                >
                  {certificate.grade ?? 'Pending'}
                </Typography>
                <Chip 
                  label={certificate.isVerified ? 'Verified' : 'Not Verified'}
                  color={certificate.isVerified ? 'success' : 'default'}
                  size="small"
                  sx={{ mt: 1, fontWeight: 600, fontSize: { xs: '11px', md: '12px' } }}
                />
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Certificate Details Grid */}
        <Grid container spacing={{ xs: 1, md: 2 }} sx={{ mb: 4, position: 'relative', zIndex: 1, mx: { xs: -0.5, sm: 0 } }}>
          <Grid item xs={12} sm={6}>
            <Box sx={{ textAlign: 'center', p: { xs: 1, md: 1.5 }, backgroundColor: '#f8f9fa', borderRadius: 1, border: '1px solid #e0e0e0' }}>
              <CalendarToday sx={{ color: '#27ae60', fontSize: { xs: 20, md: 24 }, mb: 0.5 }} />
              <Typography variant="caption" color="text.secondary" gutterBottom sx={{ fontWeight: 600, display: 'block', fontSize: { xs: '11px', md: '12px' } }}>
                COMPLETION DATE
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 700, color: '#2c3e50', fontSize: { xs: '14px', md: '16px' } }}>
                {formatDate(certificate.completionDate)}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box sx={{ textAlign: 'center', p: { xs: 1, md: 1.5 }, backgroundColor: '#f8f9fa', borderRadius: 1, border: '1px solid #e0e0e0' }}>
              <QrCode sx={{ color: '#27ae60', fontSize: { xs: 20, md: 24 }, mb: 0.5 }} />
              <Typography variant="caption" color="text.secondary" gutterBottom sx={{ fontWeight: 600, display: 'block', fontSize: { xs: '11px', md: '12px' } }}>
                CERTIFICATE NUMBER
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'monospace', color: '#2c3e50', fontSize: { xs: '10px', sm: '11px', md: '12px' }, wordBreak: 'break-word' }}>
                {certificate.certificateNumber || certificate._id?.slice(-8).toUpperCase()}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3, borderColor: '#e0e0e0' }} />

        {/* Certificate Footer - Signatures and Issuer */}
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={{ xs: 1, md: 3 }} sx={{ mb: 2, display: { xs: 'none', sm: 'grid' } }}>
            <Grid item xs={12} sm={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Box 
                  sx={{ 
                    height: { xs: '60px', md: '80px' },
                    borderTop: '2px solid #2c3e50',
                    mb: 1,
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center'
                  }}
                >
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '10px', md: '12px' } }}>
                    Signature Line
                  </Typography>
                </Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2c3e50', fontSize: { xs: '12px', md: '14px' } }}>
                  Instructor/Assessor
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Verified sx={{ fontSize: { xs: 35, md: 50 }, color: '#27ae60', opacity: 0.3 }} />
              </Box>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Box 
                  sx={{ 
                    height: { xs: '60px', md: '80px' },
                    borderTop: '2px solid #2c3e50',
                    mb: 1,
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center'
                  }}
                >
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '10px', md: '12px' } }}>
                    Signature Line
                  </Typography>
                </Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2c3e50', fontSize: { xs: '12px', md: '14px' } }}>
                  Official Seal
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: { xs: 2, md: 3 }, borderColor: '#e0e0e0' }} />

          {/* Issued By Section */}
          <Box 
            sx={{ 
              p: { xs: 1.5, md: 2.5 },
              backgroundColor: '#f0f8f5',
              border: '2px solid #27ae60',
              borderRadius: 1,
              textAlign: 'center',
              mb: 2,
              mx: { xs: -2, sm: 0 }
            }}
          >
            <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5, fontSize: { xs: '11px', md: '12px' } }}>
              Issued By
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 900, 
                color: '#2c3e50',
                fontSize: { xs: '14px', sm: '16px', md: '18px' },
                mb: 0.5,
                px: { xs: 1, sm: 0 }
              }}
            >
              Abdala Nzabandora
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 700,
                color: '#27ae60',
                fontSize: { xs: '12px', md: '14px' },
                px: { xs: 1, sm: 0 }
              }}
            >
              Chairman, Excellence Coaching Hub
            </Typography>
          </Box>

          <Grid container spacing={{ xs: 1, md: 2 }} sx={{ textAlign: 'center' }}>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: { xs: '11px', md: '12px' } }}>
                Certificate ID
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'monospace', color: '#2c3e50', fontSize: { xs: '10px', md: '12px' }, wordBreak: 'break-word' }}>
                {certificate._id.slice(-8).toUpperCase()}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                Excellence Coaching Hub © {new Date().getFullYear()}
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Actions */}
      {showActions && (
        <Card sx={{
          mt: 3,
          mx: { xs: 0, md: 'auto' },
          maxWidth: { xs: '100%', md: 900 },
          '@media print': {
            display: 'none'
          }
        }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '16px', md: '20px' } }}>
              Certificate Actions
            </Typography>
            
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={{ xs: 1, md: 2 }} 
              sx={{ flexWrap: 'wrap', gap: { xs: 1, sm: 0 } }}
            >
              <Button
                variant="contained"
                startIcon={<Download />}
                onClick={() => handleDownload('png')}
                disabled={Boolean(generatingFormat)}
                fullWidth={{ xs: true, sm: false }}
                sx={{ fontSize: { xs: '12px', md: '14px' } }}
              >
                {generatingFormat === 'png' ? 'Preparing...' : 'Download PNG'}
              </Button>
              
              <Button
                variant="contained"
                color="secondary"
                startIcon={<Download />}
                onClick={() => handleDownload('pdf')}
                disabled={Boolean(generatingFormat)}
                fullWidth={{ xs: true, sm: false }}
                sx={{ fontSize: { xs: '12px', md: '14px' } }}
              >
                {generatingFormat === 'pdf' ? 'Preparing...' : 'Download PDF'}
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<Print />}
                onClick={handlePrint}
                fullWidth={{ xs: true, sm: false }}
                sx={{ fontSize: { xs: '12px', md: '14px' } }}
              >
                Print Certificate
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<Share />}
                onClick={handleShare}
                fullWidth={{ xs: true, sm: false }}
                sx={{ fontSize: { xs: '12px', md: '14px' } }}
              >
                Share Certificate
              </Button>
            </Stack>

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
              Choose PNG or PDF format for download.
            </Typography>

            {generatingFormat && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                <CircularProgress size={20} />
                <Typography variant="body2" color="text.secondary">
                  {`Preparing ${generatingFormat.toUpperCase()} download...`}
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
        <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Share sx={{ color: '#27ae60' }} />
          Share Your Certificate
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph sx={{ mt: 2 }}>
            Share your achievement with others! Choose a sharing method below.
          </Typography>
          
          <Box sx={{ mt: 3, mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700, mb: 1.5 }}>
              Verification Code
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              gap: 1, 
              alignItems: 'center',
              p: 1.5,
              backgroundColor: '#f0f8f5',
              borderRadius: 1,
              border: '1px solid #27ae60'
            }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontFamily: 'monospace', 
                  flex: 1,
                  fontWeight: 600,
                  color: '#2c3e50'
                }}
              >
                {certificate.verificationCode}
              </Typography>
              <IconButton 
                size="small" 
                onClick={() => copyToClipboard(certificate.verificationCode)}
                sx={{ color: '#27ae60' }}
                title="Copy verification code"
              >
                <ContentCopy fontSize="small" />
              </IconButton>
            </Box>
          </Box>
          
          <Box sx={{ mt: 3, mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700, mb: 1.5 }}>
              Certificate Link
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              gap: 1, 
              alignItems: 'center',
              p: 1.5,
              backgroundColor: '#f0f8f5',
              borderRadius: 1,
              border: '1px solid #27ae60'
            }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontFamily: 'monospace', 
                  flex: 1,
                  fontWeight: 600,
                  color: '#2c3e50',
                  fontSize: '12px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                https://excellencecoachinghub.com/certificate/{certificate.verificationCode}
              </Typography>
              <IconButton 
                size="small" 
                onClick={shareViaLink}
                sx={{ color: '#27ae60' }}
                title="Copy certificate link"
              >
                <ContentCopy fontSize="small" />
              </IconButton>
            </Box>
            {copySuccess && (
              <Typography variant="caption" sx={{ color: '#27ae60', fontWeight: 600, mt: 1, display: 'block' }}>
                ✓ Copied to clipboard
              </Typography>
            )}
          </Box>

          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700, mb: 1.5, mt: 3 }}>
            Share Options
          </Typography>
          <Stack spacing={2}>
            <Button
              variant="contained"
              fullWidth
              onClick={shareViaEmail}
              sx={{ backgroundColor: '#27ae60', '&:hover': { backgroundColor: '#229954' } }}
            >
              Share via Email
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setShareDialogOpen(false)} variant="outlined">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Close Button */}
      {onClose && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, px: { xs: 1, sm: 0 } }}>
          <Button 
            variant="outlined" 
            onClick={onClose}
            fullWidth={{ xs: true, sm: false }}
            sx={{ maxWidth: { sm: '200px' }, fontSize: { xs: '12px', md: '14px' } }}
          >
            Close
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default CertificateComponent;

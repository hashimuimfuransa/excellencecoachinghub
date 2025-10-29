import React, { useState, useEffect, useCallback } from 'react';
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
  ContentCopy,
  CheckCircle
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import enhancedAssessmentService, { type ICertificate } from '../../services/enhancedAssessmentService';
import { courseService } from '../../services/courseService';
import { progressService as courseProgressService } from '../../services/weekService';
import CertificateComponent from '../../components/Certificate/CertificateComponent';
import { downloadCertificatePNG, downloadCertificatePDF } from '../../utils/pdfDownloader';

interface Certificate {
  _id: string;
  title: string;
  description: string;
  courseName: string;
  studentName: string;
  completionDate: string;
  grade?: number;
  score?: number;
  totalPoints?: number;
  earnedPoints?: number;
  certificateNumber?: string;
  verificationCode: string;
  issuedBy: string;
  certificateUrl?: string;
  isVerified: boolean;
  expiresAt?: string;
}

const CertificatePage: React.FC = () => {
  const params = useParams<{ id?: string; certificateId?: string; courseId?: string }>();
  const certificateId = params.certificateId || null;
  const courseId = params.courseId || params.id || null;
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [activeCertificateId, setActiveCertificateId] = useState<string | null>(certificateId);

  const getErrorMessage = useCallback((err: any) => {
    return err?.response?.data?.message || err?.message || 'Failed to load certificate';
  }, []);

  useEffect(() => {
    setActiveCertificateId(certificateId);
  }, [certificateId]);

  const fetchCourseDetails = useCallback(async (id: string) => {
    try {
      return await courseService.getCourseById(id);
    } catch {
      try {
        return await courseService.getPublicCourseById(id);
      } catch {
        return null;
      }
    }
  }, []);

  const buildCertificate = useCallback((data: ICertificate, courseTitle: string): Certificate => {
    const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : 'Student';
    const percentageFromEarned = data.totalPoints && data.totalPoints > 0 && typeof data.earnedPoints === 'number'
      ? Math.round((data.earnedPoints / data.totalPoints) * 100)
      : undefined;
    const percentageFromScore = data.totalPoints && data.totalPoints > 0 && typeof data.score === 'number'
      ? Math.round((data.score / data.totalPoints) * 100)
      : undefined;
    const resolvedPercentage = Number.isFinite(percentageFromEarned as number)
      ? percentageFromEarned
      : Number.isFinite(percentageFromScore as number)
        ? percentageFromScore
        : undefined;

    return {
      _id: data._id,
      title: 'Certificate of Completion',
      description: data.notes || 'This certificate is awarded to students who successfully complete the course requirements.',
      courseName: courseTitle,
      studentName: fullName,
      completionDate: data.completionDate || data.issueDate || new Date().toISOString(),
      grade: typeof resolvedPercentage === 'number' && Number.isFinite(resolvedPercentage) ? resolvedPercentage : undefined,
      score: typeof data.score === 'number' ? data.score : undefined,
      totalPoints: data.totalPoints,
      earnedPoints: data.earnedPoints,
      certificateNumber: data.certificateNumber,
      verificationCode: data.verificationCode || data.certificateNumber,
      issuedBy: data.issuedBy || 'Excellence Coaching Hub',
      certificateUrl: data.pdfUrl,
      isVerified: data.isVerified,
      expiresAt: data.expiryDate
    };
  }, [user]);

  const loadCertificate = useCallback(async () => {
    if (courseId && !user) {
      return;
    }

    if (!certificateId && !courseId) {
      setError('Certificate not found');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (certificateId) {
        const data = await enhancedAssessmentService.getCertificateById(certificateId);
        const course = await fetchCourseDetails(data.courseId);
        setCertificate(buildCertificate(data, course?.title || 'Course Certificate'));
        setActiveCertificateId(data._id);
        return;
      }

      if (!courseId || !user) {
        throw new Error('Course identifier missing');
      }

      const course = await fetchCourseDetails(courseId);
      const certificates = await enhancedAssessmentService.getStudentCertificates();
      let courseCertificate = certificates.find(item => item.courseId === courseId && item.studentId === user._id);

      if (!courseCertificate || courseCertificate.status !== 'issued') {
        let isEligible = false;
        let eligibilityError: any = null;
        let eligibilityUnknown = false;
        let requiresTeacher = false;

        const isForbidden = (err: any) => err?.response?.status === 403;
        const teacherMessage = 'Access denied. Required role: teacher';

        if (user?._id) {
          try {
            const detailedProgress = await enhancedAssessmentService.getStudentCourseProgress(courseId, user._id);
            const requirements = detailedProgress?.progress?.requirements;
            isEligible = Boolean(requirements?.isEligibleForCertificate);
          } catch (err: any) {
            if (isForbidden(err)) {
              eligibilityUnknown = true;
              requiresTeacher = Boolean(err?.message?.includes(teacherMessage));
            } else {
              eligibilityError = err;
            }
          }
        }

        if (!isEligible) {
          try {
            const progress = await enhancedAssessmentService.getCourseProgress(courseId);
            isEligible = Boolean(progress?.isEligibleForCertificate);
          } catch (err: any) {
            if (isForbidden(err)) {
              eligibilityUnknown = true;
              requiresTeacher = requiresTeacher || Boolean(err?.message?.includes(teacherMessage));
            } else if (!eligibilityError) {
              eligibilityError = err;
            }
          }
        }

        if (!isEligible && !requiresTeacher) {
          try {
            const progress = await courseProgressService.getStudentCourseProgress(courseId);
            const percentages = progress?.weekProgresses
              ?.map(item => (typeof item.progressPercentage === 'number' ? item.progressPercentage : null))
              .filter((value): value is number => value !== null && Number.isFinite(value));
            if (percentages && percentages.length > 0) {
              const average = percentages.reduce((sum, value) => sum + value, 0) / percentages.length;
              isEligible = average >= 100;
            }
          } catch (err) {
            if (!eligibilityError) {
              eligibilityError = err;
            }
          }
        }

        if (requiresTeacher) {
          throw new Error('This certificate requires staff approval.');
        }

        if (!isEligible && !eligibilityUnknown) {
          if (eligibilityError) {
            throw eligibilityError;
          }
          throw new Error('Certificate is not yet available for this course.');
        }

        if (eligibilityUnknown) {
          throw new Error('Unable to verify eligibility at this time.');
        }

        const generated = await enhancedAssessmentService.generateCertificate(courseId, user._id);
        courseCertificate = await enhancedAssessmentService.getCertificateById(generated.certificateId);
      }

      setCertificate(buildCertificate(courseCertificate, course?.title || 'Course Certificate'));
      setActiveCertificateId(courseCertificate._id);
    } catch (err: any) {
      setError(getErrorMessage(err));
      setCertificate(null);
    } finally {
      setLoading(false);
    }
  }, [buildCertificate, certificateId, courseId, fetchCourseDetails, getErrorMessage, user]);

  useEffect(() => {
    loadCertificate();
  }, [loadCertificate]);

  const downloadCertificate = (format: 'png' | 'pdf') => {
    if (!certificate) {
      return;
    }

    try {
      const certificateNumber = certificate.certificateNumber || certificate._id?.slice(-8).toUpperCase() || 'CERTIFICATE';
      const completionDateFormatted = formatDate(certificate.completionDate);
      const gradeLabel = typeof certificate.grade === 'number'
        ? `${certificate.grade}%`
        : certificate.grade || 'Pass';
      const scoreValue = typeof certificate.score === 'number'
        ? certificate.score
        : typeof certificate.grade === 'number'
          ? certificate.grade
          : certificate.totalPoints && certificate.totalPoints > 0 && typeof certificate.earnedPoints === 'number'
            ? Math.round((certificate.earnedPoints / certificate.totalPoints) * 100)
            : 0;

      const params: [string, string, string, string, number, string, string] = [
        certificate.studentName,
        certificate.courseName,
        completionDateFormatted,
        gradeLabel,
        scoreValue,
        certificateNumber,
        certificate.verificationCode
      ];

      if (format === 'png') {
        downloadCertificatePNG(...params);
      } else {
        downloadCertificatePDF(...params);
      }
    } catch (err) {
      console.error('Failed to generate certificate download', err);
      alert('Failed to generate certificate download.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    setShareDialogOpen(true);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Unable to copy text to clipboard', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const shareLink = activeCertificateId
    ? `${window.location.origin}/dashboard/student/certificate/${activeCertificateId}`
    : '';

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
        showActions={false}
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
              onClick={() => downloadCertificate('png')}
            >
              Download PNG
            </Button>

            <Button
              variant="contained"
              color="secondary"
              startIcon={<Download />}
              onClick={() => downloadCertificate('pdf')}
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
                <ContentCopy />
              </IconButton>
            </Box>
          </Box>
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Certificate Link
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
              {shareLink || 'Certificate link unavailable'}
            </Typography>
            {shareLink && (
              <Button
                size="small"
                startIcon={<ContentCopy />}
                sx={{ mt: 1 }}
                onClick={() => copyToClipboard(shareLink)}
              >
                Copy Link
              </Button>
            )}
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

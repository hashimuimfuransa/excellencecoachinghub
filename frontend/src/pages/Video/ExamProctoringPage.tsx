import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Paper,
  Breadcrumbs,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import { ArrowBack, Home, Security, Warning, CheckCircle } from '@mui/icons-material';
import { useAuth } from '../../store/AuthContext';
import ExamProctoring from '../../components/Video/ExamProctoring';

interface ViolationData {
  type: 'face_not_detected' | 'multiple_faces' | 'looking_away' | 'suspicious_movement';
  confidence: number;
  timestamp: Date;
  description: string;
}

const ExamProctoringPage: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inProctoring, setInProctoring] = useState(false);
  const [violations, setViolations] = useState<ViolationData[]>([]);
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);

  // Get user role from URL params or user data
  const userRole = (searchParams.get('role') as 'student' | 'admin') || 
                   (user?.role === 'admin' ? 'admin' : 'student');

  // Show consent dialog for students
  useEffect(() => {
    if (userRole === 'student' && !consentGiven) {
      setShowConsentDialog(true);
    }
  }, [userRole, consentGiven]);

  // Handle consent given
  const handleConsentGiven = () => {
    setConsentGiven(true);
    setShowConsentDialog(false);
    setInProctoring(true);
  };

  // Handle consent denied
  const handleConsentDenied = () => {
    setShowConsentDialog(false);
    navigate('/dashboard/student/assessments');
  };

  // Handle joining proctoring
  const handleJoinProctoring = () => {
    if (userRole === 'student' && !consentGiven) {
      setShowConsentDialog(true);
    } else {
      setInProctoring(true);
    }
  };

  // Handle leaving proctoring
  const handleLeaveProctoring = () => {
    setInProctoring(false);
    // Navigate back to appropriate dashboard
    if (userRole === 'student') {
      navigate('/dashboard/student/assessments');
    } else {
      navigate('/dashboard/admin/proctoring');
    }
  };

  // Handle violation detected
  const handleViolationDetected = (violation: ViolationData) => {
    setViolations(prev => [...prev, violation]);
  };

  // Handle back navigation
  const handleBack = () => {
    if (userRole === 'student') {
      navigate('/dashboard/student/assessments');
    } else {
      navigate('/dashboard/admin/proctoring');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
          <Typography variant="h6" sx={{ ml: 2 }}>
            Initializing proctoring...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="h6">Failed to initialize proctoring</Typography>
          <Typography>{error}</Typography>
        </Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={handleBack}
          variant="contained"
        >
          Go Back
        </Button>
      </Container>
    );
  }

  // If user is in proctoring mode, show the proctoring component
  if (inProctoring) {
    return (
      <ExamProctoring
        examId={examId || 'unknown'}
        userRole={userRole}
        onLeave={handleLeaveProctoring}
        onViolationDetected={handleViolationDetected}
      />
    );
  }

  // Show proctoring setup and join button
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          component="button"
          variant="body1"
          onClick={() => navigate('/dashboard')}
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <Home sx={{ mr: 0.5 }} fontSize="inherit" />
          Dashboard
        </Link>
        <Link
          component="button"
          variant="body1"
          onClick={handleBack}
        >
          {userRole === 'student' ? 'Assessments' : 'Proctoring'}
        </Link>
        <Typography color="text.primary">
          Exam Proctoring
        </Typography>
      </Breadcrumbs>

      {/* Back button */}
      <Button
        startIcon={<ArrowBack />}
        onClick={handleBack}
        sx={{ mb: 3 }}
      >
        Back
      </Button>

      {/* Proctoring setup */}
      <Paper sx={{ p: 4, mb: 3 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <Security sx={{ mr: 2, fontSize: 32 }} color="primary" />
          <Typography variant="h4" component="h1">
            Exam Proctoring {userRole === 'student' ? '- Student' : '- Admin Monitor'}
          </Typography>
        </Box>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {userRole === 'student' 
            ? 'AI-powered proctoring will monitor your exam session to ensure academic integrity.'
            : 'Monitor student exam sessions and review proctoring violations in real-time.'
          }
        </Typography>

        {userRole === 'student' && (
          <>
            <Typography variant="h6" gutterBottom>
              Proctoring Requirements
            </Typography>
            <List sx={{ mb: 3 }}>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle color="success" />
                </ListItemIcon>
                <ListItemText
                  primary="Camera Access"
                  secondary="Your camera will be used to monitor your presence and behavior"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle color="success" />
                </ListItemIcon>
                <ListItemText
                  primary="Microphone Access"
                  secondary="Your microphone will be used to detect audio anomalies"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle color="success" />
                </ListItemIcon>
                <ListItemText
                  primary="Face Detection"
                  secondary="AI will ensure only you are present during the exam"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle color="success" />
                </ListItemIcon>
                <ListItemText
                  primary="Gaze Tracking"
                  secondary="Eye movement will be monitored to detect looking away"
                />
              </ListItem>
            </List>

            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Important:</strong> Ensure you are in a quiet, well-lit room with no other people present. 
                Any violations will be recorded and may affect your exam results.
              </Typography>
            </Alert>
          </>
        )}

        {userRole === 'admin' && (
          <>
            <Typography variant="h6" gutterBottom>
              Admin Monitoring Features
            </Typography>
            <List sx={{ mb: 3 }}>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle color="success" />
                </ListItemIcon>
                <ListItemText
                  primary="Real-time Monitoring"
                  secondary="View all student video feeds simultaneously"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle color="success" />
                </ListItemIcon>
                <ListItemText
                  primary="Violation Alerts"
                  secondary="Receive instant notifications when violations are detected"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle color="success" />
                </ListItemIcon>
                <ListItemText
                  primary="Recording Capability"
                  secondary="Sessions are automatically recorded for review"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle color="success" />
                </ListItemIcon>
                <ListItemText
                  primary="Violation Reports"
                  secondary="Generate detailed reports of all detected violations"
                />
              </ListItem>
            </List>
          </>
        )}

        {/* Action button */}
        <Box display="flex" gap={2}>
          <Button
            variant="contained"
            size="large"
            startIcon={<Security />}
            onClick={handleJoinProctoring}
            color="primary"
            sx={{ fontWeight: 'bold' }}
          >
            {userRole === 'student' ? 'Start Proctored Exam' : 'Start Monitoring'}
          </Button>
        </Box>
      </Paper>

      {/* Consent Dialog for Students */}
      <Dialog
        open={showConsentDialog}
        onClose={() => {}} // Prevent closing without consent
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <Security sx={{ mr: 2 }} color="primary" />
            Proctoring Consent Required
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            By proceeding with this proctored exam, you consent to the following:
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon>
                <Warning color="warning" />
              </ListItemIcon>
              <ListItemText
                primary="Video and Audio Recording"
                secondary="Your camera and microphone will be active and recorded during the exam"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Warning color="warning" />
              </ListItemIcon>
              <ListItemText
                primary="AI Behavior Analysis"
                secondary="Artificial intelligence will analyze your behavior for potential violations"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Warning color="warning" />
              </ListItemIcon>
              <ListItemText
                primary="Data Storage"
                secondary="Proctoring data will be stored securely and may be reviewed by instructors"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Warning color="warning" />
              </ListItemIcon>
              <ListItemText
                primary="Academic Integrity"
                secondary="Any detected violations may result in exam penalties or academic consequences"
              />
            </ListItem>
          </List>
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              You must provide consent to proceed with the proctored exam. 
              If you do not consent, you will not be able to take this exam.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleConsentDenied} 
            sx={{
              backgroundColor: '#f44336',
              color: '#ffffff',
              padding: '8px 16px',
              borderRadius: '4px',
              textTransform: 'none',
              fontWeight: 500,
              '&:hover': {
                backgroundColor: '#d32f2f',
              },
            }}
          >
            I Do Not Consent
          </Button>
          <Button 
            onClick={handleConsentGiven} 
            sx={{
              backgroundColor: '#1976d2',
              color: '#ffffff',
              padding: '8px 16px',
              borderRadius: '4px',
              textTransform: 'none',
              fontWeight: 500,
              '&:hover': {
                backgroundColor: '#1565c0',
              },
            }}
          >
            I Consent and Agree
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ExamProctoringPage;

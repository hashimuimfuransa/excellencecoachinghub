import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Divider,
  Stack,
  Avatar,
  Alert,
  AlertTitle,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Skeleton,
  useTheme,
  alpha
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot
} from '@mui/lab';
import {
  ArrowBack,
  Work,
  Business,
  LocationOn,
  AttachMoney,
  Schedule,
  Person,
  Email,
  Phone,
  Download,
  Visibility,
  Edit,
  Delete,
  CheckCircle,
  Cancel,
  AccessTime,
  Assignment,
  Description,
  Share,
  Print,
  Refresh
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';

interface ApplicationDetails {
  _id: string;
  job: {
    _id: string;
    title: string;
    company: string;
    location: string;
    jobType: string;
    salary?: string;
    description: string;
    requirements: string[];
    logo?: string;
  };
  applicant: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    avatar?: string;
  };
  status: 'pending' | 'reviewed' | 'interview' | 'accepted' | 'rejected';
  appliedAt: string;
  coverLetter?: string;
  resume?: string;
  notes?: string;
  timeline: {
    status: string;
    date: string;
    note?: string;
  }[];
  interviewDate?: string;
  feedback?: string;
}

const mockApplication: ApplicationDetails = {
  _id: '1',
  job: {
    _id: 'job1',
    title: 'Senior Frontend Developer',
    company: 'TechCorp Inc.',
    location: 'San Francisco, CA',
    jobType: 'Full-time',
    salary: '$120,000 - $150,000',
    description: 'We are looking for a senior frontend developer to join our team...',
    requirements: [
      '5+ years of React experience',
      'Strong TypeScript skills',
      'Experience with modern build tools',
      'Knowledge of testing frameworks'
    ],
    logo: ''
  },
  applicant: {
    _id: 'user1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@email.com',
    phone: '+1 (555) 123-4567',
    avatar: ''
  },
  status: 'interview',
  appliedAt: '2024-01-15T10:30:00Z',
  coverLetter: 'Dear Hiring Manager,\n\nI am excited to apply for the Senior Frontend Developer position at TechCorp Inc. With over 6 years of experience in React development and a passion for creating exceptional user experiences, I believe I would be a valuable addition to your team.\n\nIn my current role at ABC Company, I have led the development of several high-traffic web applications, implemented modern React patterns, and mentored junior developers. I am particularly excited about the opportunity to work with your innovative team and contribute to TechCorp\'s mission.\n\nThank you for considering my application. I look forward to discussing how my skills and experience can benefit your team.\n\nBest regards,\nJohn Doe',
  resume: 'john_doe_resume.pdf',
  notes: 'Strong candidate with excellent React skills. Good communication during initial screening.',
  timeline: [
    {
      status: 'Applied',
      date: '2024-01-15T10:30:00Z',
      note: 'Application submitted'
    },
    {
      status: 'Reviewed',
      date: '2024-01-16T14:20:00Z',
      note: 'Application reviewed by hiring manager'
    },
    {
      status: 'Interview Scheduled',
      date: '2024-01-18T09:00:00Z',
      note: 'Technical interview scheduled for January 22nd'
    }
  ],
  interviewDate: '2024-01-22T14:00:00Z',
  feedback: 'Candidate showed strong technical skills and good problem-solving abilities.'
};

const ApplicationDetailsPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [application, setApplication] = useState<ApplicationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    fetchApplicationDetails();
  }, [id]);

  const fetchApplicationDetails = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setApplication(mockApplication);
    } catch (error) {
      console.error('Error fetching application details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawApplication = async () => {
    try {
      setWithdrawing(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setWithdrawDialogOpen(false);
      navigate('/app/applications');
    } catch (error) {
      console.error('Error withdrawing application:', error);
    } finally {
      setWithdrawing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'accepted':
        return 'success';
      case 'rejected':
        return 'error';
      case 'interview':
        return 'warning';
      case 'reviewed':
        return 'info';
      case 'pending':
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'accepted':
        return <CheckCircle />;
      case 'rejected':
        return <Cancel />;
      case 'interview':
        return <Person />;
      case 'reviewed':
        return <Visibility />;
      case 'pending':
      default:
        return <Schedule />;
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box mb={4}>
          <Skeleton variant="text" width={200} height={40} />
          <Skeleton variant="text" width={300} height={30} />
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Skeleton variant="rectangular" height={200} />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Skeleton variant="rectangular" height={300} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    );
  }

  if (!application) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error">
          <AlertTitle>Application Not Found</AlertTitle>
          The application you're looking for doesn't exist or has been removed.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      {/* Header */}
      <Box mb={4}>
        <Box display="flex" alignItems="center" mb={2}>
          <IconButton onClick={() => navigate('/app/applications')} sx={{ mr: 1 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Application Details
          </Typography>
        </Box>
        <Typography variant="h6" color="text.secondary">
          Track your application progress and status
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          {/* Job Information */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box display="flex" alignItems="center" mb={3}>
              <Avatar
                src={application.job.logo}
                sx={{ width: 60, height: 60, mr: 2 }}
              >
                <Business />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  {application.job.title}
                </Typography>
                <Typography variant="h6" color="primary.main">
                  {application.job.company}
                </Typography>
              </Box>
            </Box>

            <Stack direction="row" spacing={2} mb={3} flexWrap="wrap">
              <Box display="flex" alignItems="center">
                <LocationOn fontSize="small" color="action" sx={{ mr: 0.5 }} />
                <Typography variant="body2">{application.job.location}</Typography>
              </Box>
              <Box display="flex" alignItems="center">
                <Work fontSize="small" color="action" sx={{ mr: 0.5 }} />
                <Typography variant="body2">{application.job.jobType}</Typography>
              </Box>
              {application.job.salary && (
                <Box display="flex" alignItems="center">
                  <AttachMoney fontSize="small" color="action" sx={{ mr: 0.5 }} />
                  <Typography variant="body2">{application.job.salary}</Typography>
                </Box>
              )}
            </Stack>

            <Typography variant="body1" paragraph>
              {application.job.description}
            </Typography>

            <Typography variant="h6" fontWeight="bold" mb={2}>
              Requirements
            </Typography>
            <Box component="ul" sx={{ pl: 2 }}>
              {application.job.requirements.map((req, index) => (
                <Typography component="li" variant="body2" key={index} sx={{ mb: 0.5 }}>
                  {req}
                </Typography>
              ))}
            </Box>
          </Paper>

          {/* Cover Letter */}
          {application.coverLetter && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                Cover Letter
              </Typography>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                {application.coverLetter}
              </Typography>
            </Paper>
          )}

          {/* Application Timeline */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" mb={3}>
              Application Timeline
            </Typography>
            <Timeline>
              {application.timeline.map((item, index) => (
                <TimelineItem key={index}>
                  <TimelineSeparator>
                    <TimelineDot color="primary">
                      {getStatusIcon(item.status)}
                    </TimelineDot>
                    {index < application.timeline.length - 1 && <TimelineConnector />}
                  </TimelineSeparator>
                  <TimelineContent>
                    <Typography variant="h6" component="span">
                      {item.status}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(item.date).toLocaleDateString()} at{' '}
                      {new Date(item.date).toLocaleTimeString()}
                    </Typography>
                    {item.note && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {item.note}
                      </Typography>
                    )}
                  </TimelineContent>
                </TimelineItem>
              ))}
            </Timeline>
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Application Status */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" mb={2}>
              Application Status
            </Typography>
            <Box display="flex" alignItems="center" mb={2}>
              <Chip
                icon={getStatusIcon(application.status)}
                label={application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                color={getStatusColor(application.status)}
                size="large"
                sx={{ fontWeight: 'bold' }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Applied on {new Date(application.appliedAt).toLocaleDateString()}
            </Typography>
            
            {application.interviewDate && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <AlertTitle>Interview Scheduled</AlertTitle>
                {new Date(application.interviewDate).toLocaleDateString()} at{' '}
                {new Date(application.interviewDate).toLocaleTimeString()}
              </Alert>
            )}

            <Stack spacing={2}>
              <Button
                variant="outlined"
                startIcon={<Visibility />}
                onClick={() => navigate(`/app/jobs/${application.job._id}`)}
                fullWidth
              >
                View Job Posting
              </Button>
              {application.resume && (
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  fullWidth
                >
                  Download Resume
                </Button>
              )}
              <Button
                variant="outlined"
                startIcon={<Share />}
                fullWidth
              >
                Share Application
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Delete />}
                onClick={() => setWithdrawDialogOpen(true)}
                fullWidth
              >
                Withdraw Application
              </Button>
            </Stack>
          </Paper>

          {/* Applicant Information */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" mb={2}>
              Your Information
            </Typography>
            <Box display="flex" alignItems="center" mb={2}>
              <Avatar
                src={application.applicant.avatar}
                sx={{ width: 50, height: 50, mr: 2 }}
              >
                <Person />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight="medium">
                  {application.applicant.firstName} {application.applicant.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Applicant
                </Typography>
              </Box>
            </Box>
            <Stack spacing={1}>
              <Box display="flex" alignItems="center">
                <Email fontSize="small" color="action" sx={{ mr: 1 }} />
                <Typography variant="body2">{application.applicant.email}</Typography>
              </Box>
              {application.applicant.phone && (
                <Box display="flex" alignItems="center">
                  <Phone fontSize="small" color="action" sx={{ mr: 1 }} />
                  <Typography variant="body2">{application.applicant.phone}</Typography>
                </Box>
              )}
            </Stack>
          </Paper>

          {/* Notes */}
          {application.notes && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                Notes
              </Typography>
              <Typography variant="body2">
                {application.notes}
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Withdraw Application Dialog */}
      <Dialog
        open={withdrawDialogOpen}
        onClose={() => setWithdrawDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Withdraw Application</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            Are you sure you want to withdraw your application for {application.job.title} at {application.job.company}?
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason (optional)"
            value={withdrawReason}
            onChange={(e) => setWithdrawReason(e.target.value)}
            placeholder="Please provide a reason for withdrawing your application..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWithdrawDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleWithdrawApplication}
            color="error"
            variant="contained"
            disabled={withdrawing}
            startIcon={withdrawing ? <CircularProgress size={20} /> : <Delete />}
          >
            {withdrawing ? 'Withdrawing...' : 'Withdraw Application'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ApplicationDetailsPage;
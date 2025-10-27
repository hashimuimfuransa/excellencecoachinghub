import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  TextField,
  Card,
  CardContent,
  Divider,
  Alert,
  CircularProgress,
  Grid,
  Chip,
  Avatar,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  alpha
} from '@mui/material';
import {
  Send,
  ArrowBack,
  CheckCircle,
  Work,
  LocationOn,
  AttachMoney,
  Business,
  Person,
  Assignment,
  Close
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { jobService } from '../services/jobService';
import { jobApplicationService } from '../services/jobApplicationService';

interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  skills: string[];
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  jobType: string;
  experienceLevel: string;
  educationLevel: string;
  applicationDeadline?: string;
  createdAt: string;
  updatedAt: string;
  employer: {
    _id: string;
    firstName: string;
    lastName: string;
    company: string;
  };
  applicationsCount: number;
  viewsCount: number;
  isCurated?: boolean;
  isExternalJob?: boolean;
}

const QuickApplyPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { jobId } = useParams<{ jobId: string }>();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [hasApplied, setHasApplied] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);

  useEffect(() => {
    const fetchJobAndCheckApplication = async () => {
      if (!jobId) {
        setError('Job ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch job details
        const jobData = await jobService.getJobById(jobId);
        setJob(jobData);

        // Check if user has already applied
        const alreadyApplied = await jobApplicationService.hasAppliedForJob(jobId);
        setHasApplied(alreadyApplied);

        // Redirect if it's an external job
        if (jobData.isExternalJob) {
          setError('This is an external job. You cannot apply through our platform.');
          return;
        }

      } catch (error) {
        console.error('Error fetching job:', error);
        setError('Failed to load job details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchJobAndCheckApplication();
  }, [jobId]);

  const handleQuickApply = async () => {
    if (!jobId || !user) return;

    try {
      setSubmitting(true);
      setError(null);

      // Create application with user profile as resume
      const applicationData = {
        resume: `${user.firstName} ${user.lastName} - Profile Application`,
        coverLetter: coverLetter.trim() || undefined
      };

      await jobApplicationService.applyForJob(jobId, applicationData);
      
      setHasApplied(true);
      setSuccessDialogOpen(true);
      
    } catch (error: any) {
      console.error('Error applying for job:', error);
      setError(error.message || 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatSalary = (salary?: { min?: number; max?: number; currency?: string }) => {
    if (!salary) return 'Competitive salary';
    if (salary.min && salary.max) {
      return `${salary.currency || '$'} ${salary.min.toLocaleString()} - ${salary.currency || '$'} ${salary.max.toLocaleString()}`;
    }
    return 'Competitive salary';
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={40} />
        </Box>
      </Container>
    );
  }

  if (error || !job) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            {error || 'Job not found'}
          </Typography>
          <Button
            variant="contained"
            startIcon={<ArrowBack />}
            onClick={() => navigate('/app/jobs')}
            sx={{ mt: 2 }}
          >
            Back to Jobs
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Paper sx={{ mb: 3, overflow: 'hidden' }}>
        <Box sx={{ 
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          color: 'white',
          p: 3
        }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/app/jobs')}
            sx={{ 
              color: 'white', 
              mb: 2,
              '&:hover': { bgcolor: alpha('white', 0.1) }
            }}
          >
            Back to Jobs
          </Button>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Quick Apply
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            Apply for {job.title} at {job.company}
          </Typography>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Job Details Card */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <Work />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {job.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {job.company}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Stack spacing={2}>
                <Box display="flex" alignItems="center">
                  <LocationOn sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
                  <Typography variant="body2">{job.location}</Typography>
                </Box>
                
                <Box display="flex" alignItems="center">
                  <AttachMoney sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
                  <Typography variant="body2">{formatSalary(job.salary)}</Typography>
                </Box>

                <Box display="flex" alignItems="center">
                  <Business sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
                  <Typography variant="body2">{job.jobType}</Typography>
                </Box>
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" color="primary" gutterBottom>
                Required Skills:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                {job.skills.slice(0, 5).map((skill, index) => (
                  <Chip
                    key={index}
                    label={skill}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                ))}
                {job.skills.length > 5 && (
                  <Chip
                    label={`+${job.skills.length - 5} more`}
                    size="small"
                    variant="outlined"
                    color="default"
                  />
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Application Form */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Application Details
              </Typography>

              {hasApplied ? (
                <Alert 
                  severity="info" 
                  sx={{ mb: 2 }}
                  icon={<CheckCircle />}
                >
                  You have already applied for this position.
                </Alert>
              ) : (
                <>
                  <Alert severity="info" sx={{ mb: 3 }}>
                    <Typography variant="body2">
                      <strong>Quick Apply</strong> will use your profile information as your resume. 
                      You can add a cover letter below to personalize your application.
                    </Typography>
                  </Alert>

                  <Typography variant="subtitle2" gutterBottom>
                    Cover Letter (Optional)
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={6}
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    placeholder="Write a personalized cover letter to introduce yourself and explain why you're interested in this position..."
                    variant="outlined"
                    sx={{ mb: 3 }}
                  />

                  {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {error}
                    </Alert>
                  )}

                  <Button
                    variant="contained"
                    size="large"
                    startIcon={submitting ? <CircularProgress size={20} /> : <Send />}
                    onClick={handleQuickApply}
                    disabled={submitting || hasApplied}
                    fullWidth
                    sx={{
                      py: 1.5,
                      fontWeight: 600,
                      background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
                      '&:hover': {
                        background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.secondary.dark} 90%)`,
                      }
                    }}
                  >
                    {submitting ? 'Submitting...' : 'Submit Application'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Success Dialog */}
      <Dialog
        open={successDialogOpen}
        onClose={() => setSuccessDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: 'center', pt: 3 }}>
          <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
          <Typography variant="h5" fontWeight="bold">
            Application Submitted!
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', pb: 1 }}>
          <Typography variant="body1" paragraph>
            Your application for <strong>{job.title}</strong> at <strong>{job.company}</strong> has been successfully submitted.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            The employer will review your application and contact you if you're selected for an interview.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, justifyContent: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/app/applications')}
          >
            View My Applications
          </Button>
          <Button
            variant="contained"
            onClick={() => navigate('/app/jobs')}
          >
            Browse More Jobs
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default QuickApplyPage;
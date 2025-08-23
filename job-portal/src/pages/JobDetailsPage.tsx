import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Grid,
  Button,
  Chip,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Card,
  CardContent,
  CardActions,
  Alert,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  useTheme,
  alpha
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowBack,
  LocationOn,
  AttachMoney,
  AccessTime,
  Business,
  Person,
  CheckCircle,
  Send,
  Bookmark,
  BookmarkBorder,
  Share,
  Psychology,
  Quiz,
  School,
  Work,
  Assessment,
  Close,
  MoreVert,
  CalendarToday,
  Group,
  TrendingUp
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { jobService } from '../services/jobService';

// Job types matching backend structure
enum JobType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  CONTRACT = 'contract',
  INTERNSHIP = 'internship',
  FREELANCE = 'freelance'
}

enum ExperienceLevel {
  ENTRY_LEVEL = 'entry_level',
  MID_LEVEL = 'mid_level',
  SENIOR_LEVEL = 'senior_level',
  EXECUTIVE = 'executive'
}

enum JobStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  CLOSED = 'closed',
  EXPIRED = 'expired'
}

interface SalaryExpectation {
  min: number;
  max: number;
  currency: string;
}

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
}

interface Job {
  _id: string;
  title: string;
  description: string;
  company: string;
  location: string;
  jobType: JobType;
  experienceLevel: ExperienceLevel;
  skills: string[];
  salary?: SalaryExpectation;
  benefits: string[];
  requirements: string[];
  responsibilities: string[];
  applicationDeadline?: string;
  status: JobStatus;
  employer: User;
  isCurated: boolean;
  applicationsCount: number;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
}

const JobDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [prepareDialogOpen, setPrepareDialogOpen] = useState(false);
  const [shareMenuAnchor, setShareMenuAnchor] = useState<null | HTMLElement>(null);

  useEffect(() => {
    if (id) {
      fetchJobDetails();
    }
  }, [id]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const jobData = await jobService.getJobById(id!);
      setJob(jobData);
    } catch (error: any) {
      console.error('Error fetching job details:', error);
      setError(error.message || 'Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const formatJobType = (jobType: JobType): string => {
    switch (jobType) {
      case JobType.FULL_TIME:
        return 'Full-time';
      case JobType.PART_TIME:
        return 'Part-time';
      case JobType.CONTRACT:
        return 'Contract';
      case JobType.INTERNSHIP:
        return 'Internship';
      case JobType.FREELANCE:
        return 'Freelance';
      default:
        return jobType;
    }
  };

  const formatExperienceLevel = (level: ExperienceLevel): string => {
    switch (level) {
      case ExperienceLevel.ENTRY_LEVEL:
        return 'Entry-level';
      case ExperienceLevel.MID_LEVEL:
        return 'Mid-level';
      case ExperienceLevel.SENIOR_LEVEL:
        return 'Senior';
      case ExperienceLevel.EXECUTIVE:
        return 'Executive';
      default:
        return level;
    }
  };

  const formatSalary = (salary?: SalaryExpectation): string => {
    if (!salary) return 'Salary not specified';
    return `${salary.currency} ${salary.min.toLocaleString()} - ${salary.max.toLocaleString()}`;
  };

  const getDaysAgo = (dateString: string): string => {
    const daysAgo = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / (1000 * 3600 * 24));
    return daysAgo === 0 ? 'Today' : `${daysAgo} days ago`;
  };

  const handleApply = () => {
    // Always show the apply dialog, authentication is handled within the dialog
    setApplyDialogOpen(true);
  };

  const handlePrepare = () => {
    if (!user) {
      navigate('/login', { 
        state: { from: { pathname: `/jobs/${id}` } }
      });
      return;
    }
    setPrepareDialogOpen(true);
  };

  const handleGetPrepared = (selectedJob: Job) => {
    setApplyDialogOpen(false);
    setPrepareDialogOpen(true);
  };

  const handleSaveJob = () => {
    if (!user) {
      navigate('/login', { 
        state: { from: { pathname: `/jobs/${id}` } }
      });
      return;
    }
    setIsSaved(!isSaved);
    // TODO: Implement save job functionality
  };

  const handleShare = (event: React.MouseEvent<HTMLElement>) => {
    setShareMenuAnchor(event.currentTarget);
  };

  const handleShareClose = () => {
    setShareMenuAnchor(null);
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box mb={3}>
          <Skeleton variant="rectangular" height={60} />
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Skeleton variant="text" height={40} width="80%" />
              <Skeleton variant="text" height={20} width="60%" />
              <Box mt={2}>
                <Skeleton variant="text" height={100} />
                <Skeleton variant="text" height={100} />
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Skeleton variant="rectangular" height={200} />
            </Paper>
          </Grid>
        </Grid>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
          <Button variant="outlined" size="small" onClick={fetchJobDetails} sx={{ ml: 2 }}>
            Retry
          </Button>
        </Alert>
      </Container>
    );
  }

  if (!job) {
    return (
      <Container maxWidth="lg">
        <Alert severity="info">
          Job not found
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      {/* Header */}
      <Box mb={3}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/app/jobs')}
          sx={{ mb: 2 }}
        >
          Back to Jobs
        </Button>
        
        <Paper sx={{ p: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item>
              <Avatar
                sx={{ 
                  width: 80, 
                  height: 80,
                  bgcolor: alpha(theme.palette.primary.main, 0.1)
                }}
              >
                <Business sx={{ fontSize: 40 }} color="primary" />
              </Avatar>
            </Grid>
            <Grid item xs>
              <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
                {job.title}
              </Typography>
              <Typography variant="h6" color="primary.main" gutterBottom>
                {job.company}
              </Typography>
              <Stack direction="row" spacing={2} flexWrap="wrap">
                <Box display="flex" alignItems="center">
                  <LocationOn fontSize="small" color="action" sx={{ mr: 0.5 }} />
                  <Typography variant="body2">{job.location}</Typography>
                </Box>
                {job.salary && (
                  <Box display="flex" alignItems="center">
                    <AttachMoney fontSize="small" color="action" sx={{ mr: 0.5 }} />
                    <Typography variant="body2">{formatSalary(job.salary)}</Typography>
                  </Box>
                )}
                <Box display="flex" alignItems="center">
                  <AccessTime fontSize="small" color="action" sx={{ mr: 0.5 }} />
                  <Typography variant="body2">{getDaysAgo(job.createdAt)}</Typography>
                </Box>
              </Stack>
            </Grid>
            <Grid item>
              <Stack direction="row" spacing={1}>
                {job.isCurated && (
                  <Chip label="Featured" color="primary" />
                )}
                {job.applicationDeadline && new Date(job.applicationDeadline) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && (
                  <Chip label="Urgent" color="error" />
                )}
              </Stack>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          {/* Job Description */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Job Description
            </Typography>
            <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-line' }}>
              {job.description}
            </Typography>
          </Paper>

          {/* Requirements */}
          {job.requirements.length > 0 && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Requirements
              </Typography>
              <List>
                {job.requirements.map((requirement, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <CheckCircle color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={requirement} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}

          {/* Responsibilities */}
          {job.responsibilities.length > 0 && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Responsibilities
              </Typography>
              <List>
                {job.responsibilities.map((responsibility, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <Work color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={responsibility} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}

          {/* Benefits */}
          {job.benefits.length > 0 && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Benefits
              </Typography>
              <List>
                {job.benefits.map((benefit, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText primary={benefit} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Action Buttons */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Stack spacing={2}>
              <Button
                variant="contained"
                size="large"
                startIcon={<Send />}
                onClick={handleApply}
                fullWidth
              >
                Apply Now
              </Button>
              
              <Button
                variant="outlined"
                size="large"
                startIcon={<Psychology />}
                onClick={handlePrepare}
                fullWidth
                color="secondary"
              >
                Prepare for Job
              </Button>

              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  startIcon={user && isSaved ? <Bookmark /> : <BookmarkBorder />}
                  onClick={handleSaveJob}
                  color={user && isSaved ? "primary" : "inherit"}
                  fullWidth
                >
                  {user && isSaved ? 'Saved' : 'Save Job'}
                </Button>
                <IconButton onClick={handleShare}>
                  <Share />
                </IconButton>
              </Stack>
            </Stack>
          </Paper>

          {/* Job Info */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Job Information
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <Work />
                </ListItemIcon>
                <ListItemText 
                  primary="Job Type" 
                  secondary={formatJobType(job.jobType)} 
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <TrendingUp />
                </ListItemIcon>
                <ListItemText 
                  primary="Experience Level" 
                  secondary={formatExperienceLevel(job.experienceLevel)} 
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <Group />
                </ListItemIcon>
                <ListItemText 
                  primary="Applications" 
                  secondary={`${job.applicationsCount} applicants`} 
                />
              </ListItem>
              {job.applicationDeadline && (
                <ListItem>
                  <ListItemIcon>
                    <CalendarToday />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Application Deadline" 
                    secondary={new Date(job.applicationDeadline).toLocaleDateString()} 
                  />
                </ListItem>
              )}
            </List>
          </Paper>

          {/* Skills Required */}
          {job.skills.length > 0 && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Skills Required
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                {job.skills.map((skill, index) => (
                  <Chip key={index} label={skill} variant="outlined" />
                ))}
              </Stack>
            </Paper>
          )}

          {/* Company Info */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              About the Company
            </Typography>
            <Box display="flex" alignItems="center" mb={2}>
              <Avatar sx={{ mr: 2, bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                <Business color="primary" />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  {job.company}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {job.employer.firstName} {job.employer.lastName}
                </Typography>
              </Box>
            </Box>
            <Button variant="outlined" fullWidth>
              View Company Profile
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {/* Apply Dialog */}
      <Dialog open={applyDialogOpen} onClose={() => setApplyDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h5" fontWeight="bold" color="primary.main">
            Ready to Apply for {job?.title}?
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            Before you apply, we recommend getting prepared to increase your chances of success.
            Our preparation program helps you:
          </Typography>
          <Box sx={{ pl: 2, mb: 3 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              • Understand the job requirements better
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              • Prepare for technical and behavioral interviews
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              • Build relevant skills through targeted courses
            </Typography>
            <Typography variant="body2">
              • Practice with mock interviews and assessments
            </Typography>
          </Box>
          <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.info.main, 0.05), border: `1px solid ${alpha(theme.palette.info.main, 0.2)}` }}>
            <Typography variant="body2" color="info.main" fontWeight="medium">
              💡 Candidates who complete our preparation program have 3x higher success rates!
            </Typography>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => {
              if (!user) {
                setApplyDialogOpen(false);
                navigate('/login', { 
                  state: { from: { pathname: `/jobs/${id}` } }
                });
                return;
              }
              handleGetPrepared(job!);
            }}
            sx={{ flex: 1 }}
          >
            Get Prepared First
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              if (!user) {
                setApplyDialogOpen(false);
                navigate('/login', { 
                  state: { from: { pathname: `/jobs/${id}` } }
                });
                return;
              }
              setApplyDialogOpen(false);
              // Redirect to actual application process
              window.open('https://jobs.excellencecoachinghub.com/', '_blank');
            }}
            sx={{ flex: 1 }}
          >
            Apply Now
          </Button>
        </DialogActions>
      </Dialog>

      {/* Prepare Dialog */}
      <Dialog open={prepareDialogOpen} onClose={() => setPrepareDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ textAlign: 'center' }}>
          <Typography variant="h4" fontWeight="bold" color="primary.main">
            Get Prepared for {job?.title}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Choose your preparation path
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card 
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 }
                }}
                onClick={() => {
                  setPrepareDialogOpen(false);
                  navigate('/app/tests');
                }}
              >
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Assessment sx={{ fontSize: 48, color: theme.palette.warning.main, mb: 2 }} />
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Psychometric Tests
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Assess your skills and personality fit for this role
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card 
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 }
                }}
                onClick={() => {
                  setPrepareDialogOpen(false);
                  navigate('/app/interviews');
                }}
              >
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Person sx={{ fontSize: 48, color: theme.palette.success.main, mb: 2 }} />
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Interview Practice
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Practice with AI-powered mock interviews
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card 
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 }
                }}
                onClick={() => {
                  window.open('https://www.elearning.excellencecoachinghub.com/', '_blank');
                  setPrepareDialogOpen(false);
                }}
              >
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <School sx={{ fontSize: 48, color: theme.palette.primary.main, mb: 2 }} />
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Skill Courses
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Learn the skills required for this position
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button
            onClick={() => setPrepareDialogOpen(false)}
            variant="outlined"
          >
            Close
          </Button>
          {!user && (
            <Button
              onClick={() => {
                setPrepareDialogOpen(false);
                navigate('/register');
              }}
              variant="contained"
            >
              Register to Start
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Share Menu */}
      <Menu
        anchorEl={shareMenuAnchor}
        open={Boolean(shareMenuAnchor)}
        onClose={handleShareClose}
      >
        <MenuItem onClick={handleShareClose}>
          Copy Link
        </MenuItem>
        <MenuItem onClick={handleShareClose}>
          Share via Email
        </MenuItem>
        <MenuItem onClick={handleShareClose}>
          Share on LinkedIn
        </MenuItem>
      </Menu>
    </Container>
  );
};

export default JobDetailsPage;
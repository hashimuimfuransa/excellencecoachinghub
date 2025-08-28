import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Paper,
  TextField,
  InputAdornment,
  Chip,
  Avatar,
  Stack,
  useTheme,
  alpha,
  CircularProgress,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  AppBar,
  Toolbar,
  IconButton,
  Pagination,
  Badge,
  Tooltip,
  CardHeader
} from '@mui/material';
import {
  Work,
  LocationOn,
  AttachMoney,
  Schedule,
  Business,
  ArrowForward,
  Search,
  Psychology,
  School,
  Assessment,
  Person,
  CheckCircle,
  FiberNew,
  AccessTime,
  ArrowBack,
  Event,
  Timer,
  StarBorder,
  Star,
  Visibility,
  People,
  WorkspacePremium,
  Send,
  Language,
  Quiz,
  SmartToy,
  Code,
  Engineering,
  TrendingUp,
  Assignment
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import jobService from '../services/jobService';

interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  jobType: string;
  experienceLevel: string;
  educationLevel: string;
  skills: string[];
  status: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  applicationDeadline?: string;
  employer: {
    _id: string;
    firstName: string;
    lastName: string;
    company?: string;
  };
  applicationsCount: number;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
  isCurated: boolean;
  // External job fields
  isExternalJob?: boolean;
  externalApplicationUrl?: string;
  externalJobSource?: string;
  externalJobId?: string;
  contactInfo?: {
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
    contactPerson?: string;
    applicationInstructions?: string;
  };
}

const AllJobsPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [locationFilter, setLocationFilter] = useState(searchParams.get('location') || '');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applicationDialogOpen, setApplicationDialogOpen] = useState(false);
  const [preparationDialogOpen, setPreparationDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalJobs, setTotalJobs] = useState(0);

  useEffect(() => {
    const fetchAllJobs = async () => {
      setLoading(true);
      setError(null);
      try {
        const filters: any = {};
        if (searchTerm) filters.search = searchTerm;
        if (locationFilter) filters.location = locationFilter;
        
        const response = await jobService.getJobs(filters, currentPage, 12);
        setJobs(response.data);
        setTotalPages(response.pagination.pages);
        setTotalJobs(response.pagination.total);
      } catch (error) {
        console.error('Error fetching jobs:', error);
        setError('Failed to fetch jobs. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAllJobs();
  }, [currentPage, searchTerm, locationFilter]);

  const handleApply = (job: Job) => {
    // If it's an external job, redirect to external URL
    if (job.isExternalJob && job.externalApplicationUrl) {
      window.open(job.externalApplicationUrl, '_blank');
      return;
    }
    
    setSelectedJob(job);
    setApplicationDialogOpen(true);
  };

  const handleGetPrepared = (job: Job) => {
    setSelectedJob(job);
    setPreparationDialogOpen(true);
  };

  const handleViewJobDetails = (jobId: string) => {
    // Navigate to public job details page
    navigate(`/jobs/${jobId}`);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    // The search will trigger useEffect due to dependency array
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatSalary = (salary?: { min: number; max: number; currency: string }) => {
    if (!salary) return 'Competitive salary';
    return `${salary.currency} ${salary.min.toLocaleString()} - ${salary.currency} ${salary.max.toLocaleString()}`;
  };

  const isJobNew = (createdAt: string) => {
    const jobDate = new Date(createdAt);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - jobDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffInDays <= 7;
  };

  const isJobUrgent = (applicationDeadline?: string) => {
    if (!applicationDeadline) return false;
    const deadline = new Date(applicationDeadline);
    const now = new Date();
    const diffInDays = Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffInDays <= 7 && diffInDays > 0;
  };

  const formatDeadline = (applicationDeadline?: string) => {
    if (!applicationDeadline) return 'No deadline';
    
    const deadline = new Date(applicationDeadline);
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return 'Expired';
    } else if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Tomorrow';
    } else if (diffDays <= 7) {
      return `${diffDays} days left`;
    } else {
      return deadline.toLocaleDateString();
    }
  };

  const getDeadlineColor = (applicationDeadline?: string) => {
    if (!applicationDeadline) return 'default';
    
    const deadline = new Date(applicationDeadline);
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'error';
    if (diffDays <= 3) return 'error';
    if (diffDays <= 7) return 'warning';
    return 'success';
  };

  const getDaysPosted = (createdAt: string) => {
    const jobDate = new Date(createdAt);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - jobDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays <= 7) return `${diffInDays} days ago`;
    if (diffInDays <= 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  const ApplicationDialog = () => (
    <Dialog
      open={applicationDialogOpen}
      onClose={() => setApplicationDialogOpen(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ fontWeight: 'bold', color: 'primary.main' }}>
        Ready to Apply for {selectedJob?.title}?
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
            setApplicationDialogOpen(false);
            handleGetPrepared(selectedJob!);
          }}
          sx={{ flex: 1 }}
        >
          Get Prepared First
        </Button>
        <Button
          variant="contained"
          onClick={() => {
            setApplicationDialogOpen(false);
            // Redirect to actual application process
            window.open('https://jobs.excellencecoachinghub.com/', '_blank');
          }}
          sx={{ flex: 1 }}
        >
          Apply Now
        </Button>
      </DialogActions>
    </Dialog>
  );

  const PreparationDialog = () => (
    <Dialog
      open={preparationDialogOpen}
      onClose={() => setPreparationDialogOpen(false)}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle sx={{ textAlign: 'center', pb: 1, pt: 3 }}>
        <Box sx={{ fontWeight: 'bold', color: 'primary.main', fontSize: '1.8rem', mb: 1 }}>
          🎯 Get Ready for {selectedJob?.title}
        </Box>
        <Typography variant="subtitle1" color="text.secondary" sx={{ fontSize: '1.1rem' }}>
          Comprehensive preparation to help you excel in this position
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ px: 3, pb: 2 }}>
        {/* Main Assessment Options */}
        <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 'bold' }}>
          🧠 Assessment & Testing
        </Typography>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                border: `2px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                '&:hover': { 
                  transform: 'translateY(-4px)', 
                  boxShadow: `0 8px 25px ${alpha(theme.palette.warning.main, 0.3)}`,
                  border: `2px solid ${theme.palette.warning.main}`
                }
              }}
              onClick={() => {
                setPreparationDialogOpen(false);
                navigate('/app/tests');
              }}
            >
              <CardContent sx={{ textAlign: 'center', p: 2 }}>
                <Assessment sx={{ fontSize: 40, color: theme.palette.warning.main, mb: 1.5 }} />
                <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ fontSize: '1rem' }}>
                  Psychometric Tests
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                  Personality & cognitive assessments
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                border: `2px solid ${alpha(theme.palette.info.main, 0.2)}`,
                '&:hover': { 
                  transform: 'translateY(-4px)', 
                  boxShadow: `0 8px 25px ${alpha(theme.palette.info.main, 0.3)}`,
                  border: `2px solid ${theme.palette.info.main}`
                }
              }}
              onClick={() => {
                setPreparationDialogOpen(false);
                navigate('/app/smart-tests');
              }}
            >
              <CardContent sx={{ textAlign: 'center', p: 2 }}>
                <SmartToy sx={{ fontSize: 40, color: theme.palette.info.main, mb: 1.5 }} />
                <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ fontSize: '1rem' }}>
                  Smart Tests
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                  AI-powered adaptive testing
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                border: `2px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                '&:hover': { 
                  transform: 'translateY(-4px)', 
                  boxShadow: `0 8px 25px ${alpha(theme.palette.secondary.main, 0.3)}`,
                  border: `2px solid ${theme.palette.secondary.main}`
                }
              }}
              onClick={() => {
                setPreparationDialogOpen(false);
                navigate('/app/job-specific-tests');
              }}
            >
              <CardContent sx={{ textAlign: 'center', p: 2 }}>
                <Assignment sx={{ fontSize: 40, color: theme.palette.secondary.main, mb: 1.5 }} />
                <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ fontSize: '1rem' }}>
                  Job-Specific Tests
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                  Role-tailored assessments
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                border: `2px solid ${alpha(theme.palette.success.main, 0.2)}`,
                '&:hover': { 
                  transform: 'translateY(-4px)', 
                  boxShadow: `0 8px 25px ${alpha(theme.palette.success.main, 0.3)}`,
                  border: `2px solid ${theme.palette.success.main}`
                }
              }}
              onClick={() => {
                setPreparationDialogOpen(false);
                navigate('/app/skills-assessment');
              }}
            >
              <CardContent sx={{ textAlign: 'center', p: 2 }}>
                <TrendingUp sx={{ fontSize: 40, color: theme.palette.success.main, mb: 1.5 }} />
                <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ fontSize: '1rem' }}>
                  Skills Assessment
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                  Technical & soft skills evaluation
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Interview & Learning Options */}
        <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 'bold' }}>
          🎤 Interview & Learning
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            <Card 
              sx={{ 
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                border: `2px solid ${alpha(theme.palette.error.main, 0.2)}`,
                '&:hover': { 
                  transform: 'translateY(-4px)', 
                  boxShadow: `0 8px 25px ${alpha(theme.palette.error.main, 0.3)}`,
                  border: `2px solid ${theme.palette.error.main}`
                }
              }}
              onClick={() => {
                setPreparationDialogOpen(false);
                navigate('/app/interviews');
              }}
            >
              <CardContent sx={{ textAlign: 'center', p: 2.5 }}>
                <Person sx={{ fontSize: 45, color: theme.palette.error.main, mb: 1.5 }} />
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Interview Practice
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  AI-powered mock interviews & feedback
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card 
              sx={{ 
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                '&:hover': { 
                  transform: 'translateY(-4px)', 
                  boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.3)}`,
                  border: `2px solid ${theme.palette.primary.main}`
                }
              }}
              onClick={() => {
                window.open('https://www.elearning.excellencecoachinghub.com/', '_blank');
                setPreparationDialogOpen(false);
              }}
            >
              <CardContent sx={{ textAlign: 'center', p: 2.5 }}>
                <School sx={{ fontSize: 45, color: theme.palette.primary.main, mb: 1.5 }} />
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Skill Development
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Learn required skills for this position
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card 
              sx={{ 
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                border: `2px solid ${alpha(theme.palette.success.main, 0.2)}`,
                '&:hover': { 
                  transform: 'translateY(-4px)', 
                  boxShadow: `0 8px 25px ${alpha(theme.palette.success.main, 0.3)}`,
                  border: `2px solid ${theme.palette.success.main}`
                }
              }}
              onClick={() => {
                setPreparationDialogOpen(false);
                navigate('/app/career-guidance');
              }}
            >
              <CardContent sx={{ textAlign: 'center', p: 2.5 }}>
                <Psychology sx={{ fontSize: 45, color: theme.palette.success.main, mb: 1.5 }} />
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Career Guidance
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Get personalized career advice & tips
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Quick Tips */}
        <Box 
          sx={{ 
            mt: 3, 
            p: 2, 
            bgcolor: alpha(theme.palette.info.main, 0.05),
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
          }}
        >
          <Typography variant="body2" color="info.main" fontWeight="bold" sx={{ mb: 1 }}>
            💡 Pro Tip for {selectedJob?.title}:
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Start with our Smart Tests for personalized assessment, then move to job-specific tests based on your results. 
            Complete with interview practice for the best preparation experience!
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 3, pt: 1 }}>
        <Button
          onClick={() => setPreparationDialogOpen(false)}
          variant="outlined"
          sx={{ minWidth: 120 }}
        >
          Close
        </Button>
        <Button
          onClick={() => {
            setPreparationDialogOpen(false);
            navigate('/register');
          }}
          variant="contained"
          sx={{ 
            minWidth: 140,
            background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
            '&:hover': {
              background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.secondary.dark} 90%)`,
            }
          }}
        >
          🚀 Start Preparing
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Navigation Bar */}
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'white', borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar>
          <IconButton
            edge="start"
            onClick={() => navigate('/')}
            sx={{ mr: 2, color: 'primary.main' }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: 'primary.main', fontWeight: 'bold' }}>
            Exjobnet - Jobs
          </Typography>
          <Button
            color="primary"
            onClick={() => navigate('/login')}
            sx={{ mr: 1 }}
          >
            Sign In
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/register')}
          >
            Register
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Enhanced Modern Header with Animation */}
        <Box 
          textAlign="center" 
          mb={6}
          sx={{ 
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: -50,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 150,
              height: 150,
              background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 70%)`,
              borderRadius: '50%',
              zIndex: -1,
            }
          }}
        >
          <Box sx={{ position: 'relative', mb: 4 }}>
            {/* Floating Elements */}
            <Box
              sx={{
                position: 'absolute',
                top: -20,
                right: '20%',
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.warning.main})`,
                opacity: 0.6,
                animation: 'float 6s ease-in-out infinite',
                '@keyframes float': {
                  '0%, 100%': { transform: 'translateY(0px)' },
                  '50%': { transform: 'translateY(-20px)' }
                }
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                top: 10,
                left: '15%',
                width: 25,
                height: 25,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.info.main})`,
                opacity: 0.7,
                animation: 'float 4s ease-in-out infinite',
                animationDelay: '2s'
              }}
            />
            
            <Typography 
              variant="h2" 
              component="h1" 
              fontWeight="900"
              sx={{
                background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                mb: 2,
                position: 'relative',
                fontSize: { xs: '2rem', sm: '3rem', md: '3.75rem' },
                lineHeight: 1.1,
                '&::after': {
                  content: '"💼"',
                  position: 'absolute',
                  right: -60,
                  top: -10,
                  fontSize: '2rem',
                  animation: 'bounce 2s infinite',
                  '@keyframes bounce': {
                    '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
                    '40%': { transform: 'translateY(-10px)' },
                    '60%': { transform: 'translateY(-5px)' }
                  }
                }
              }}
            >
              Discover Your Dream Job
            </Typography>
            
            <Typography 
              variant="h6" 
              color="text.secondary" 
              sx={{ 
                maxWidth: 800, 
                mx: 'auto', 
                mb: 4,
                fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
                lineHeight: 1.6,
                fontWeight: 400
              }}
            >
              🚀 Join thousands of professionals finding amazing career opportunities with our AI-powered job matching platform
            </Typography>
            
            {/* Enhanced Stats with Icons */}
            <Paper
              elevation={0}
              sx={{
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.03)} 0%, ${alpha(theme.palette.secondary.main, 0.03)} 100%)`,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                borderRadius: 4,
                p: 3,
                mt: 4,
                mx: 'auto',
                maxWidth: 800
              }}
            >
              <Stack 
                direction={{ xs: 'column', sm: 'row' }} 
                spacing={{ xs: 3, sm: 4 }} 
                justifyContent="center"
                divider={<Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />}
              >
                <Box textAlign="center" sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                    <Work sx={{ mr: 1, color: theme.palette.primary.main, fontSize: '1.5rem' }} />
                    <Typography variant="h4" fontWeight="bold" color="primary.main">
                      {totalJobs.toLocaleString()}+
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" fontWeight="500">
                    Active Jobs Available
                  </Typography>
                </Box>
                
                <Box textAlign="center" sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                    <Person sx={{ mr: 1, color: theme.palette.success.main, fontSize: '1.5rem' }} />
                    <Typography variant="h4" fontWeight="bold" color="success.main">
                      50k+
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" fontWeight="500">
                    Happy Job Seekers
                  </Typography>
                </Box>
                
                <Box textAlign="center" sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                    <Business sx={{ mr: 1, color: theme.palette.warning.main, fontSize: '1.5rem' }} />
                    <Typography variant="h4" fontWeight="bold" color="warning.main">
                      1,000+
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" fontWeight="500">
                    Trusted Companies
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Box>
        </Box>

      {/* Enhanced Search Filters */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 4, 
          mb: 4, 
          borderRadius: 4,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
        }}
      >
        <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
          🔍 Find Your Perfect Match
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search by job title, company, or keywords"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  background: 'white',
                  '&:hover': {
                    boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`
                  },
                  '&.Mui-focused': {
                    boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`
                  }
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: theme.palette.primary.main }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <Button 
                      variant="contained" 
                      size="small" 
                      onClick={handleSearch}
                      sx={{
                        borderRadius: 2,
                        background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
                        '&:hover': {
                          transform: 'scale(1.02)'
                        }
                      }}
                    >
                      Search
                    </Button>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Enter city, state, or remote"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  background: 'white',
                  '&:hover': {
                    boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`
                  },
                  '&.Mui-focused': {
                    boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`
                  }
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocationOn sx={{ color: theme.palette.primary.main }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Jobs Grid with Enhanced Loading */}
      {loading ? (
        <Grid container spacing={4}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((index) => (
            <Grid item xs={12} md={6} lg={4} key={index}>
              <Card 
                elevation={0}
                sx={{ 
                  height: '100%',
                  borderRadius: 4,
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                }}
              >
                {/* Header Skeleton */}
                <Box sx={{ p: 3, pb: 2, bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Skeleton variant="circular" width={56} height={56} />
                    <Stack spacing={1} alignItems="flex-end">
                      <Skeleton variant="rounded" width={80} height={24} />
                      <Skeleton variant="rounded" width={60} height={20} />
                    </Stack>
                  </Stack>
                </Box>
                
                <CardContent sx={{ p: 3, pt: 2 }}>
                  <Skeleton variant="text" height={32} sx={{ mb: 1 }} />
                  <Skeleton variant="text" height={24} sx={{ mb: 3, width: '70%' }} />
                  
                  <Stack spacing={1.5} sx={{ mb: 3 }}>
                    <Skeleton variant="text" height={20} />
                    <Skeleton variant="text" height={20} />
                    <Skeleton variant="text" height={20} />
                  </Stack>
                  
                  <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
                    <Skeleton variant="rounded" width={50} height={24} />
                    <Skeleton variant="rounded" width={60} height={24} />
                  </Stack>
                  
                  <Stack direction="row" spacing={0.5} sx={{ mb: 3 }}>
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} variant="rounded" width={60} height={24} />
                    ))}
                  </Stack>
                  
                  <Skeleton variant="text" height={20} sx={{ mb: 1 }} />
                  <Skeleton variant="text" height={20} sx={{ width: '80%' }} />
                </CardContent>
                
                <Box sx={{ p: 3, pt: 0 }}>
                  <Stack spacing={2}>
                    <Skeleton variant="rounded" height={42} />
                    <Skeleton variant="rounded" height={46} />
                    <Skeleton variant="rounded" height={36} />
                  </Stack>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Grid container spacing={4}>
          {jobs.map((job) => (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={job._id}>
              <Card 
                elevation={0}
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 4,
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  background: 'white',
                  position: 'relative',
                  overflow: 'visible',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: `0 20px 40px ${alpha(theme.palette.primary.main, 0.15)}`,
                    '& .job-card-header': {
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`
                    }
                  }
                }}
              >
                {/* Premium Header Ribbon */}
                {job.isCurated && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -1,
                      right: 20,
                      bgcolor: 'warning.main',
                      color: 'white',
                      px: 2,
                      py: 0.5,
                      borderRadius: '0 0 8px 8px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      zIndex: 1
                    }}
                  >
                    <WorkspacePremium sx={{ fontSize: '14px' }} />
                    Featured
                  </Box>
                )}

                {/* Card Header with Gradient */}
                <Box
                  className="job-card-header"
                  sx={{
                    background: alpha(theme.palette.primary.main, 0.05),
                    p: 3,
                    pb: 2,
                    transition: 'all 0.3s ease'
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                    <Avatar
                      sx={{ 
                        width: 56, 
                        height: 56, 
                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                        boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`
                      }}
                    >
                      <Business sx={{ color: 'white', fontSize: '24px' }} />
                    </Avatar>
                    
                    <Stack spacing={1} alignItems="flex-end">
                      {/* Application Deadline - PROMINENTLY DISPLAYED */}
                      <Tooltip title="Application Deadline" arrow>
                        <Chip
                          icon={<Timer />}
                          label={formatDeadline(job.applicationDeadline)}
                          size="small"
                          color={getDeadlineColor(job.applicationDeadline) as any}
                          sx={{ 
                            fontWeight: 'bold',
                            fontSize: '0.75rem',
                            '& .MuiChip-icon': {
                              fontSize: '16px'
                            }
                          }}
                        />
                      </Tooltip>
                      
                      <Stack direction="row" spacing={0.5}>
                        {isJobUrgent(job.applicationDeadline) && (
                          <Chip 
                            label="URGENT" 
                            size="small" 
                            color="error" 
                            sx={{ 
                              fontWeight: 'bold', 
                              animation: 'pulse 2s infinite',
                              '@keyframes pulse': {
                                '0%': { opacity: 1 },
                                '50%': { opacity: 0.7 },
                                '100%': { opacity: 1 }
                              }
                            }} 
                          />
                        )}
                        {isJobNew(job.createdAt) && (
                          <Chip icon={<FiberNew />} label="NEW" size="small" color="primary" sx={{ fontWeight: 'bold' }} />
                        )}
                      </Stack>
                    </Stack>
                  </Stack>
                </Box>

                <CardContent sx={{ flex: 1, p: 3, pt: 2 }}>
                  {/* Job Info */}
                  <Typography variant="h5" fontWeight="700" gutterBottom sx={{ mb: 1, lineHeight: 1.2 }}>
                    {job.title}
                  </Typography>
                  
                  <Typography variant="body1" color="text.secondary" gutterBottom sx={{ mb: 1, fontWeight: 500 }}>
                    {job.employer?.company || (job.employer ? `${job.employer.firstName} ${job.employer.lastName}` : 'Unknown Employer')}
                  </Typography>

                  {/* External Job Source Indicator */}
                  {job.isExternalJob && job.externalJobSource && (
                    <Box sx={{ mb: 2 }}>
                      <Chip
                        label={`Source: ${job.externalJobSource}`}
                        size="small"
                        sx={{
                          fontSize: '0.7rem',
                          fontWeight: 'bold',
                          bgcolor: alpha(theme.palette.secondary.main, 0.1),
                          color: theme.palette.secondary.main,
                          border: `1px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
                          '& .MuiChip-label': {
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5
                          }
                        }}
                        icon={<Language sx={{ fontSize: '12px' }} />}
                      />
                    </Box>
                  )}

                  {/* Enhanced Job Details */}
                  <Stack spacing={1.5} sx={{ mb: 3 }}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <LocationOn sx={{ fontSize: '18px', color: theme.palette.primary.main }} />
                      <Typography variant="body2" color="text.primary" fontWeight="500">
                        {job.location}
                      </Typography>
                    </Box>
                    
                    <Box display="flex" alignItems="center" gap={1}>
                      <AttachMoney sx={{ fontSize: '18px', color: theme.palette.success.main }} />
                      <Typography variant="body2" color="text.primary" fontWeight="500">
                        {formatSalary(job.salary)}
                      </Typography>
                    </Box>
                    
                    <Box display="flex" alignItems="center" gap={1}>
                      <Work sx={{ fontSize: '18px', color: theme.palette.info.main }} />
                      <Typography variant="body2" color="text.primary" fontWeight="500">
                        {job.jobType.replace('_', ' ')} • {getDaysPosted(job.createdAt)}
                      </Typography>
                    </Box>

                    {/* Job Stats */}
                    <Box display="flex" alignItems="center" gap={2} pt={1}>
                      <Tooltip title="Views" arrow>
                        <Chip
                          icon={<Visibility />}
                          label={`${job.viewsCount || 0} views`}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      </Tooltip>
                      <Tooltip title="Applications" arrow>
                        <Chip
                          icon={<People />}
                          label={`${job.applicationsCount || 0} applied`}
                          size="small"
                          variant="outlined" 
                          sx={{ fontSize: '0.7rem' }}
                        />
                      </Tooltip>
                    </Box>
                  </Stack>

                  {/* Skills with Better Styling */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="text.primary" fontWeight="600" sx={{ mb: 1 }}>
                      Required Skills:
                    </Typography>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: 0.5 }}>
                      {job.skills && job.skills.slice(0, 4).map((skill) => (
                        <Chip
                          key={skill}
                          label={skill}
                          size="small"
                          sx={{ 
                            fontSize: '0.7rem',
                            background: alpha(theme.palette.primary.main, 0.1),
                            color: theme.palette.primary.main,
                            fontWeight: 'bold',
                            '&:hover': {
                              background: alpha(theme.palette.primary.main, 0.2)
                            }
                          }}
                        />
                      ))}
                      {job.skills && job.skills.length > 4 && (
                        <Chip
                          label={`+${job.skills.length - 4} more`}
                          size="small"
                          variant="outlined"
                          sx={{ 
                            fontSize: '0.7rem',
                            fontWeight: 'bold'
                          }}
                        />
                      )}
                    </Stack>
                  </Box>

                  <Divider sx={{ mb: 2 }} />
                  
                  {/* Description Preview */}
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.5 }}>
                    {job.description ? `${job.description.substring(0, 120)}...` : 'No description available'}
                  </Typography>
                </CardContent>

                {/* Modern Action Buttons */}
                <Box sx={{ p: 3, pt: 0 }}>
                  <Stack spacing={2}>
                    <Button
                      variant="outlined"
                      startIcon={<ArrowForward />}
                      onClick={() => handleViewJobDetails(job._id)}
                      fullWidth
                      sx={{ 
                        fontWeight: 600,
                        borderRadius: 3,
                        py: 1.2,
                        borderWidth: 2,
                        '&:hover': {
                          borderWidth: 2,
                          transform: 'translateY(-1px)',
                          boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`
                        }
                      }}
                    >
                      View Full Details
                    </Button>
                    
                    <Button
                      variant="contained"
                      startIcon={<Send />}
                      onClick={() => handleApply(job)}
                      fullWidth
                      sx={{ 
                        fontWeight: 700,
                        borderRadius: 3,
                        py: 1.5,
                        background: job.isExternalJob 
                          ? `linear-gradient(45deg, ${theme.palette.secondary.main} 30%, ${theme.palette.warning.main} 90%)`
                          : `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
                        boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                        '&:hover': {
                          transform: 'translateY(-1px)',
                          boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.4)}`
                        }
                      }}
                    >
                      {job.isExternalJob && job.externalJobSource 
                        ? `Apply at ${job.externalJobSource}` 
                        : 'Apply Now'
                      }
                    </Button>
                    
                    <Button
                      variant="text"
                      startIcon={<Psychology />}
                      onClick={() => handleGetPrepared(job)}
                      fullWidth
                      sx={{ 
                        fontWeight: 600,
                        color: theme.palette.secondary.main,
                        '&:hover': {
                          background: alpha(theme.palette.secondary.main, 0.1)
                        }
                      }}
                    >
                      🎯 Get Position Ready
                    </Button>
                  </Stack>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Error State */}
      {error && (
        <Box textAlign="center" py={8}>
          <Typography variant="h5" color="error" gutterBottom>
            Error Loading Jobs
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {error}
          </Typography>
          <Button variant="contained" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Box>
      )}

      {/* No Jobs State */}
      {!loading && !error && jobs.length === 0 && (
        <Box textAlign="center" py={8}>
          <Work sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" color="text.secondary" gutterBottom>
            No jobs found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search criteria
          </Typography>
        </Box>
      )}

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Stack spacing={2} alignItems="center">
            <Typography variant="body2" color="text.secondary">
              Showing {jobs.length} of {totalJobs} jobs (Page {currentPage} of {totalPages})
            </Typography>
            <Box sx={{
              '& .MuiPaginationItem-root': {
                fontWeight: 'bold',
                borderRadius: 2,
                '&.Mui-selected': {
                  background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
                  color: 'white',
                  '&:hover': {
                    background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.secondary.dark} 90%)`,
                  }
                }
              }
            }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
              />
            </Box>
          </Stack>
        </Box>
      )}

        <ApplicationDialog />
        <PreparationDialog />
      </Container>
    </Box>
  );
};

export default AllJobsPage;
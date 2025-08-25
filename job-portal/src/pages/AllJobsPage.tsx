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
  Pagination
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
  ArrowBack
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

  const ApplicationDialog = () => (
    <Dialog
      open={applicationDialogOpen}
      onClose={() => setApplicationDialogOpen(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Typography variant="h5" fontWeight="bold" color="primary.main">
          Ready to Apply for {selectedJob?.title}?
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
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ textAlign: 'center' }}>
        <Typography variant="h4" fontWeight="bold" color="primary.main">
          Get Prepared for {selectedJob?.title}
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
                setPreparationDialogOpen(false);
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
                setPreparationDialogOpen(false);
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
                setPreparationDialogOpen(false);
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
          onClick={() => setPreparationDialogOpen(false)}
          variant="outlined"
        >
          Close
        </Button>
        <Button
          onClick={() => {
            setPreparationDialogOpen(false);
            navigate('/register');
          }}
          variant="contained"
        >
          Register to Start
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
            Excellence Coaching Hub - Jobs
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
        {/* Header */}
        <Box textAlign="center" mb={6}>
          <Typography variant="h3" component="h1" fontWeight="bold" color="primary.main" gutterBottom>
            All Available Jobs
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            Find your perfect job from our comprehensive listing of opportunities
          </Typography>
        </Box>

      {/* Search Filters */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search by job title or keyword"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <Button variant="contained" size="small" onClick={handleSearch}>
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
              placeholder="Filter by location"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocationOn />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Jobs Grid */}
      {loading ? (
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((index) => (
            <Grid item xs={12} md={6} lg={4} key={index}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Skeleton variant="rectangular" height={40} sx={{ mb: 2 }} />
                  <Skeleton variant="text" height={32} sx={{ mb: 1 }} />
                  <Skeleton variant="text" height={24} sx={{ mb: 2 }} />
                  <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                    <Skeleton variant="rounded" width={60} height={24} />
                    <Skeleton variant="rounded" width={60} height={24} />
                  </Stack>
                  <Skeleton variant="rectangular" height={36} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Grid container spacing={3}>
          {jobs.map((job) => (
            <Grid item xs={12} md={6} lg={4} key={job._id}>
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}
              >
                <CardContent sx={{ flex: 1, p: 3 }}>
                  {/* Job Header */}
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Avatar
                      sx={{ width: 48, height: 48, bgcolor: alpha(theme.palette.primary.main, 0.1) }}
                    >
                      <Business sx={{ color: theme.palette.primary.main }} />
                    </Avatar>
                    <Stack direction="row" spacing={1}>
                      {isJobUrgent(job.applicationDeadline) && (
                        <Chip label="Urgent" size="small" color="error" />
                      )}
                      {isJobNew(job.createdAt) && (
                        <Chip icon={<FiberNew />} label="New" size="small" color="primary" />
                      )}
                      {job.isCurated && (
                        <Chip label="Curated" size="small" color="success" />
                      )}
                    </Stack>
                  </Box>

                  {/* Job Info */}
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    {job.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {job.employer?.company || (job.employer ? `${job.employer.firstName} ${job.employer.lastName}` : 'Unknown Employer')}
                  </Typography>

                  {/* Job Details */}
                  <Stack spacing={1} sx={{ mb: 2 }}>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <LocationOn sx={{ fontSize: '16px', color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {job.location}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <AttachMoney sx={{ fontSize: '16px', color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {formatSalary(job.salary)}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <AccessTime sx={{ fontSize: '16px', color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {job.jobType.replace('_', ' ')} • Posted {new Date(job.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Stack>

                  {/* Skills */}
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: 0.5, mb: 3 }}>
                    {job.skills && job.skills.slice(0, 3).map((skill) => (
                      <Chip
                        key={skill}
                        label={skill}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem' }}
                      />
                    ))}
                    {job.skills && job.skills.length > 3 && (
                      <Chip
                        label={`+${job.skills.length - 3}`}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem' }}
                      />
                    )}
                  </Stack>

                  <Divider sx={{ mb: 2 }} />
                  
                  {/* Description Preview */}
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    {job.description ? `${job.description.substring(0, 100)}...` : 'No description available'}
                  </Typography>
                </CardContent>

                {/* Action Buttons */}
                <Box sx={{ p: 3, pt: 0 }}>
                  <Stack spacing={2}>
                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={<ArrowForward />}
                      onClick={() => handleViewJobDetails(job._id)}
                      fullWidth
                      sx={{ fontWeight: 500 }}
                    >
                      View Full Job Details
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<CheckCircle />}
                      onClick={() => handleApply(job)}
                      fullWidth
                      sx={{ fontWeight: 600 }}
                    >
                      Apply Now
                    </Button>
                    <Button
                      variant="outlined"
                      color="secondary"
                      startIcon={<Psychology />}
                      onClick={() => handleGetPrepared(job)}
                      fullWidth
                      sx={{ fontWeight: 500 }}
                    >
                      Get Prepared
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
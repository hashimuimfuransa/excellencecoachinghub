import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Stack,
  TextField,
  InputAdornment,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Pagination,
  Paper,
  Avatar,
  Skeleton,
  Alert,
  AlertTitle,
  IconButton,
  Tooltip,
  Divider,
  useTheme,
  alpha,
  Tabs,
  Tab,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Search,
  LocationOn,
  AttachMoney,
  Schedule,
  Business,
  Bookmark,
  BookmarkBorder,
  Share,
  Visibility,
  ArrowForward,
  FilterList,
  Clear,
  Sort,
  Work,
  AccessTime,
  Person,
  TrendingUp,
  Star,
  CheckCircle,
  Send,
  Close,
  Info,
  Warning
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
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



const JobsPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [jobType, setJobType] = useState('all');
  const [experienceLevel, setExperienceLevel] = useState('all');
  const [salaryRange, setSalaryRange] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  useEffect(() => {
    fetchJobs();
  }, [page, tabValue, searchTerm, location, jobType, experienceLevel, sortBy]);

  useEffect(() => {
    // Update URL params when search changes
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (location) params.set('location', location);
    setSearchParams(params);
  }, [searchTerm, location, setSearchParams]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build filters based on current state
      const filters: any = {
        status: JobStatus.ACTIVE
      };
      
      if (searchTerm) filters.search = searchTerm;
      if (location) filters.location = location;
      if (jobType !== 'all') filters.jobType = jobType;
      if (experienceLevel !== 'all') filters.experienceLevel = experienceLevel;
      
      // Handle different tabs
      let response;
      switch (tabValue) {
        case 1: // Featured (Curated)
          response = await jobService.getCuratedJobs(page, itemsPerPage);
          break;
        case 2: // Remote
          filters.location = 'Remote';
          response = await jobService.getJobs(filters, page, itemsPerPage);
          break;
        case 3: // Student Jobs
          response = await jobService.getJobsForStudent(page, itemsPerPage);
          break;
        default: // All Jobs
          response = await jobService.getJobs(filters, page, itemsPerPage);
          break;
      }
      
      if (response.success) {
        setJobs(response.data);
        setTotalPages(response.pagination.pages);
        setTotalJobs(response.pagination.total);
      } else {
        throw new Error('Failed to fetch jobs');
      }
    } catch (error: any) {
      console.error('Error fetching jobs:', error);
      setError(error.message || 'Failed to load jobs. Please try again.');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveJob = (jobId: string) => {
    setSavedJobs(prev => 
      prev.includes(jobId) 
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    );
  };

  const handleApplyJob = (job: Job) => {
    setSelectedJob(job);
    setApplyDialogOpen(true);
  };

  const handleConfirmApply = async () => {
    try {
      // Simulate job application
      await new Promise(resolve => setTimeout(resolve, 1000));
      setApplyDialogOpen(false);
      // Show success message or redirect
      navigate('/app/applications');
    } catch (error) {
      console.error('Error applying to job:', error);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setLocation('');
    setJobType('all');
    setExperienceLevel('all');
    setSalaryRange('all');
    setSortBy('newest');
    setPage(1);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Helper function to format job type for display
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

  // Helper function to format experience level for display
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

  // Helper function to format salary
  const formatSalary = (salary?: SalaryExpectation): string => {
    if (!salary) return 'Salary not specified';
    return `${salary.currency} ${salary.min.toLocaleString()} - ${salary.max.toLocaleString()}`;
  };

  const JobCard: React.FC<{ job: Job }> = ({ job }) => {
    const isSaved = savedJobs.includes(job._id);
    const daysAgo = Math.floor((new Date().getTime() - new Date(job.createdAt).getTime()) / (1000 * 3600 * 24));

    return (
      <Card 
        sx={{ 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: theme.shadows[8]
          },
          position: 'relative'
        }}
      >
        {job.isCurated && (
          <Box sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            height: 4, 
            background: 'linear-gradient(90deg, #4caf50, #2196f3)' 
          }} />
        )}
        
        <CardContent sx={{ flexGrow: 1, p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box display="flex" alignItems="center">
              <Avatar
                sx={{ 
                  width: 48, 
                  height: 48, 
                  mr: 2,
                  bgcolor: alpha(theme.palette.primary.main, 0.1)
                }}
              >
                <Business color="primary" />
              </Avatar>
              <Box>
                <Typography variant="h6" component="h3" fontWeight="bold">
                  {job.title}
                </Typography>
                <Typography variant="subtitle2" color="primary.main">
                  {job.company}
                </Typography>
              </Box>
            </Box>
            <Stack direction="row" spacing={1}>
              {job.isCurated && (
                <Chip label="Featured" color="primary" size="small" />
              )}
              {job.applicationDeadline && new Date(job.applicationDeadline) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && (
                <Chip label="Urgent" color="error" size="small" />
              )}
            </Stack>
          </Box>

          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mb: 2,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {job.description}
          </Typography>

          <Stack direction="row" spacing={2} mb={2} flexWrap="wrap">
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
              <Typography variant="body2">
                {daysAgo === 0 ? 'Today' : `${daysAgo} days ago`}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} mb={2} flexWrap="wrap">
            <Chip label={formatJobType(job.jobType)} size="small" variant="outlined" />
            <Chip label={formatExperienceLevel(job.experienceLevel)} size="small" variant="outlined" />
            {job.skills.slice(0, 2).map(skill => (
              <Chip key={skill} label={skill} size="small" variant="outlined" />
            ))}
            {job.skills.length > 2 && (
              <Chip 
                label={`+${job.skills.length - 2} more`} 
                size="small" 
                variant="outlined" 
              />
            )}
          </Stack>

          {job.applicationsCount && (
            <Box display="flex" alignItems="center" mb={2}>
              <Person fontSize="small" color="action" sx={{ mr: 0.5 }} />
              <Typography variant="body2" color="text.secondary">
                {job.applicationsCount} applicants
              </Typography>
            </Box>
          )}
        </CardContent>

        <CardActions sx={{ p: 3, pt: 0 }}>
          <Button
            variant="contained"
            size="small"
            onClick={() => handleApplyJob(job)}
            startIcon={<Send />}
            sx={{ mr: 1 }}
          >
            Apply Now
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() => navigate(`/app/jobs/${job._id}`)}
            endIcon={<ArrowForward />}
            sx={{ mr: 1 }}
          >
            View Details
          </Button>
          <Tooltip title={isSaved ? "Remove from saved" : "Save job"}>
            <IconButton
              size="small"
              onClick={() => handleSaveJob(job._id)}
              color={isSaved ? "primary" : "default"}
            >
              {isSaved ? <Bookmark /> : <BookmarkBorder />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Share job">
            <IconButton size="small">
              <Share />
            </IconButton>
          </Tooltip>
        </CardActions>
      </Card>
    );
  };

  return (
    <Container maxWidth="xl">
      <Box mb={4}>
        <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
          Find Your Dream Job
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Discover opportunities that match your skills and career goals
        </Typography>
      </Box>

      {/* Search and Filters */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search jobs, companies, or skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocationOn />
                  </InputAdornment>
                )
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Job Type</InputLabel>
              <Select
                value={jobType}
                label="Job Type"
                onChange={(e) => setJobType(e.target.value)}
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value={JobType.FULL_TIME}>Full-time</MenuItem>
                <MenuItem value={JobType.PART_TIME}>Part-time</MenuItem>
                <MenuItem value={JobType.CONTRACT}>Contract</MenuItem>
                <MenuItem value={JobType.INTERNSHIP}>Internship</MenuItem>
                <MenuItem value={JobType.FREELANCE}>Freelance</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Experience</InputLabel>
              <Select
                value={experienceLevel}
                label="Experience"
                onChange={(e) => setExperienceLevel(e.target.value)}
              >
                <MenuItem value="all">All Levels</MenuItem>
                <MenuItem value={ExperienceLevel.ENTRY_LEVEL}>Entry-level</MenuItem>
                <MenuItem value={ExperienceLevel.MID_LEVEL}>Mid-level</MenuItem>
                <MenuItem value={ExperienceLevel.SENIOR_LEVEL}>Senior</MenuItem>
                <MenuItem value={ExperienceLevel.EXECUTIVE}>Executive</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={1}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<Clear />}
              onClick={handleClearFilters}
            >
              Clear
            </Button>
          </Grid>
        </Grid>

        <Box mt={3}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort By"
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <MenuItem value="newest">Newest First</MenuItem>
                  <MenuItem value="oldest">Oldest First</MenuItem>
                  <MenuItem value="salary-high">Highest Salary</MenuItem>
                  <MenuItem value="applications">Most Applied</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary" textAlign="right">
                Showing {jobs.length} of {totalJobs} jobs
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Job Categories Tabs */}
      <Paper sx={{ mb: 4 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            label={
              <Box display="flex" alignItems="center">
                <Work sx={{ mr: 1 }} />
                All Jobs
                <Badge badgeContent={totalJobs} color="primary" sx={{ ml: 1 }} />
              </Box>
            } 
          />
          <Tab 
            label={
              <Box display="flex" alignItems="center">
                <Star sx={{ mr: 1 }} />
                Featured
                <Badge badgeContent={jobs.filter(j => j.isCurated).length} color="secondary" sx={{ ml: 1 }} />
              </Box>
            } 
          />
          <Tab 
            label={
              <Box display="flex" alignItems="center">
                <LocationOn sx={{ mr: 1 }} />
                Remote
                <Badge badgeContent={jobs.filter(j => j.location.toLowerCase().includes('remote')).length} color="success" sx={{ ml: 1 }} />
              </Box>
            } 
          />
          <Tab 
            label={
              <Box display="flex" alignItems="center">
                <Warning sx={{ mr: 1 }} />
                Student Jobs
                <Badge badgeContent={jobs.length} color="error" sx={{ ml: 1 }} />
              </Box>
            } 
          />
        </Tabs>
      </Paper>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
          <Button 
            variant="outlined" 
            size="small" 
            onClick={fetchJobs}
            sx={{ ml: 2 }}
          >
            Retry
          </Button>
        </Alert>
      )}

      {/* Jobs Grid */}
      <Grid container spacing={3}>
        {loading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Skeleton variant="circular" width={48} height={48} sx={{ mr: 2 }} />
                    <Box>
                      <Skeleton variant="text" width={200} height={24} />
                      <Skeleton variant="text" width={150} height={20} />
                    </Box>
                  </Box>
                  <Skeleton variant="text" height={60} />
                  <Skeleton variant="text" height={40} />
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : jobs.length > 0 ? (
          jobs.map((job) => (
            <Grid item xs={12} sm={6} md={4} key={job._id}>
              <JobCard job={job} />
            </Grid>
          ))
        ) : !loading && (
          <Grid item xs={12}>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Work sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No jobs found
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Try adjusting your search criteria or browse different categories.
              </Typography>
              <Button variant="contained" onClick={handleClearFilters}>
                Clear All Filters
              </Button>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={4}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            size="large"
          />
        </Box>
      )}

      {/* Quick Apply Dialog */}
      <Dialog 
        open={applyDialogOpen} 
        onClose={() => setApplyDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h5" fontWeight="bold">
              Apply for Position
            </Typography>
            <IconButton onClick={() => setApplyDialogOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedJob && (
            <Box>
              <Alert severity="info" sx={{ mb: 3 }}>
                <AlertTitle>Quick Apply</AlertTitle>
                Your profile information will be used for this application. Make sure your profile is up to date.
              </Alert>
              
              <Paper sx={{ p: 2, mb: 3 }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar sx={{ mr: 2, bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                    <Business color="primary" />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {selectedJob.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedJob.company} • {selectedJob.location}
                    </Typography>
                  </Box>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  {selectedJob.description.substring(0, 200)}...
                </Typography>
              </Paper>

              <Alert severity="warning" sx={{ mb: 2 }}>
                By applying, you agree to share your profile information with the employer.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setApplyDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleConfirmApply}
            startIcon={<Send />}
          >
            Submit Application
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default JobsPage;
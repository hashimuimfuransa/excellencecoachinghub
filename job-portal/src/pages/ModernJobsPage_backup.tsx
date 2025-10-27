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
  CardHeader,
  Tabs,
  Tab,
  Fade,
  CardActions,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ButtonGroup,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  Backdrop,
  Snackbar,
  Alert,
  useMediaQuery,
  Grow,
  Slide,
  Zoom,
  Breadcrumbs,
  Link,
  Collapse
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
  Assignment,
  Refresh,
  FilterList,
  Gavel,
  MenuBook,
  Money,
  CardGiftcard,
  WorkOutline,
  AccountBalance,
  Groups,
  EmojiEvents,
  Sort,
  ViewList,
  ViewModule,
  GridView,
  ExpandMore,
  TuneRounded,
  Close,
  LocalFireDepartment,
  NewReleases,
  Schedule as ScheduleIcon,
  Public,
  Phone,
  Email,
  Language as WebIcon,
  Launch,
  BookmarkBorder,
  Bookmark,
  Share,
  ContentCopy,
  Description
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import jobService from '../services/jobService';
import { JobCategory } from '../types/job';

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
  category?: JobCategory;
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

const ModernJobsPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [locationFilter, setLocationFilter] = useState(searchParams.get('location') || '');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applicationDialogOpen, setApplicationDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalJobs, setTotalJobs] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<JobCategory | 'all'>('all');
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  
  // New state for modern UI
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'salary' | 'deadline'>('newest');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [jobTypeFilter, setJobTypeFilter] = useState<string>('');
  const [experienceFilter, setExperienceFilter] = useState<string>('');
  const [companyFilter, setCompanyFilter] = useState<string>('');
  const [salaryRange, setSalaryRange] = useState<number[]>([0, 200000]);
  const [showFilters, setShowFilters] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [bookmarkedJobs, setBookmarkedJobs] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [preparationDialogOpen, setPreparationDialogOpen] = useState(false);

  // Helper function to get color from theme
  const getThemeColor = (colorPath: string) => {
    const [palette, shade] = colorPath.split('.');
    return theme.palette[palette as keyof typeof theme.palette][shade as keyof any];
  };

  // Category configuration
  const categories = [
    { 
      key: 'all', 
      label: 'All Opportunities', 
      icon: Work, 
      color: 'primary.main',
      description: 'Browse all available jobs'
    },
    { 
      key: JobCategory.SOFTWARE_ENGINEERING, 
      label: 'Tech & Engineering', 
      icon: Code, 
      color: 'info.main',
      description: 'Software, hardware, and technical roles'
    },
    { 
      key: JobCategory.DATA_SCIENCE, 
      label: 'Data & AI', 
      icon: SmartToy, 
      color: 'secondary.main',
      description: 'Data science, AI, and analytics'
    },
    { 
      key: JobCategory.MARKETING, 
      label: 'Marketing & Sales', 
      icon: TrendingUp, 
      color: 'success.main',
      description: 'Marketing, sales, and growth roles'
    },
    { 
      key: JobCategory.DESIGN, 
      label: 'Design & Creative', 
      icon: Psychology, 
      color: 'warning.main',
      description: 'UI/UX, graphic design, and creative roles'
    },
    { 
      key: JobCategory.FINANCE, 
      label: 'Finance & Banking', 
      icon: AccountBalance, 
      color: 'error.main',
      description: 'Finance, accounting, and banking'
    },
    { 
      key: JobCategory.HEALTHCARE, 
      label: 'Healthcare & Medical', 
      icon: LocalFireDepartment, 
      color: 'primary.dark',
      description: 'Healthcare, medical, and wellness'
    },
    { 
      key: JobCategory.EDUCATION, 
      label: 'Education & Training', 
      icon: School, 
      color: 'info.dark',
      description: 'Teaching, training, and education'
    }
  ];

  // Utility functions
  const formatSalary = (salary?: { min: number; max: number; currency: string }) => {
    if (!salary) return 'Salary not specified';
    const currency = salary.currency || 'USD';
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    
    if (salary.min && salary.max) {
      return `${formatter.format(salary.min)} - ${formatter.format(salary.max)}`;
    } else if (salary.min) {
      return `From ${formatter.format(salary.min)}`;
    } else if (salary.max) {
      return `Up to ${formatter.format(salary.max)}`;
    }
    return 'Competitive salary';
  };

  const getDaysPosted = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Posted today';
    if (diffDays <= 7) return `${diffDays} days ago`;
    if (diffDays <= 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const formatDeadline = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays <= 7) return `${diffDays} days left`;
    if (diffDays <= 30) return `${Math.floor(diffDays / 7)} weeks left`;
    return deadlineDate.toLocaleDateString();
  };

  const getDeadlineColor = (deadline: string): 'error' | 'warning' | 'info' => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'error';
    if (diffDays <= 3) return 'error';
    if (diffDays <= 7) return 'warning';
    return 'info';
  };

  // Fetch jobs with pagination
  const fetchJobs = async (page: number = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        status: 'active'
      });

      // Add filters
      if (searchTerm) params.append('search', searchTerm);
      if (locationFilter) params.append('location', locationFilter);
      if (selectedCategory !== 'all') params.append('category', selectedCategory as string);
      if (jobTypeFilter) params.append('jobType', jobTypeFilter);
      if (experienceFilter) params.append('experienceLevel', experienceFilter);
      if (companyFilter) params.append('company', companyFilter);
      
      // Add sorting
      switch (sortBy) {
        case 'salary':
          params.append('sortBy', 'salary.min');
          params.append('sortOrder', 'desc');
          break;
        case 'deadline':
          params.append('sortBy', 'applicationDeadline');
          params.append('sortOrder', 'asc');
          break;
        case 'oldest':
          params.append('sortBy', 'createdAt');
          params.append('sortOrder', 'asc');
          break;
        default: // newest
          params.append('sortBy', 'createdAt');
          params.append('sortOrder', 'desc');
      }

      const response = await jobService.getJobs(params.toString());
      
      if (response.success) {
        setJobs(response.data);
        setTotalPages(response.pagination?.pages || 1);
        setTotalJobs(response.pagination?.total || 0);
        
        // Calculate category counts
        const counts: Record<string, number> = {};
        response.data.forEach((job: Job) => {
          const category = job.category || 'other';
          counts[category] = (counts[category] || 0) + 1;
        });
        setCategoryCounts(counts);
      } else {
        setError(response.error || 'Failed to fetch jobs');
      }
    } catch (error: any) {
      console.error('Error fetching jobs:', error);
      setError('Failed to load jobs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter jobs based on search and filters
  useEffect(() => {
    let filtered = jobs;

    // Apply client-side filtering for better UX
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(job => 
        job.title.toLowerCase().includes(searchLower) ||
        job.company.toLowerCase().includes(searchLower) ||
        job.location.toLowerCase().includes(searchLower) ||
        job.skills.some(skill => skill.toLowerCase().includes(searchLower))
      );
    }

    // Apply salary filter
    if (salaryRange[0] > 0 || salaryRange[1] < 200000) {
      filtered = filtered.filter(job => {
        if (!job.salary) return salaryRange[0] === 0;
        const jobSalary = job.salary.min || job.salary.max || 0;
        return jobSalary >= salaryRange[0] && jobSalary <= salaryRange[1];
      });
    }

    setFilteredJobs(filtered);
  }, [jobs, searchTerm, locationFilter, salaryRange]);

  // Fetch jobs on filter/sort changes
  useEffect(() => {
    fetchJobs(currentPage);
  }, [selectedCategory, jobTypeFilter, experienceFilter, companyFilter, sortBy]);

  // Handle search with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        fetchJobs(1);
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, locationFilter]);

  // Handle page changes
  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
    fetchJobs(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle job navigation - navigate within the app
  const handleViewFullDetails = (job: Job) => {
    navigate(`/jobs/${job._id}`);
  };

  // Handle bookmark toggle
  const handleBookmarkToggle = async (jobId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/bookmark-job/${jobId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setBookmarkedJobs(prev => {
          const newSet = new Set(prev);
          if (newSet.has(jobId)) {
            newSet.delete(jobId);
            setSnackbarMessage('Job removed from bookmarks');
          } else {
            newSet.add(jobId);
            setSnackbarMessage('Job bookmarked successfully');
          }
          setSnackbarOpen(true);
          return newSet;
        });
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      setSnackbarMessage('Failed to update bookmark');
      setSnackbarOpen(true);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchJobs(currentPage);
    setRefreshing(false);
    setSnackbarMessage('Jobs refreshed successfully');
    setSnackbarOpen(true);
  };

  // Initial data fetch
  useEffect(() => {
    fetchJobs(1);
  }, []);

  if (loading && jobs.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          {Array.from({ length: 12 }).map((_, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
              <Card>
                <CardContent>
                  <Skeleton variant="rectangular" width="100%" height={200} />
                  <Box sx={{ pt: 2 }}>
                    <Skeleton width="80%" />
                    <Skeleton width="60%" />
                    <Skeleton width="40%" />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
    }}>
      {/* Header Section */}
      <Container maxWidth="xl">
        <Box sx={{ py: 4 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography 
                variant="h3" 
                fontWeight="bold"
                sx={{ 
                  mb: 1,
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                Find Your Dream Job
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
                Discover {totalJobs} opportunities from top companies
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack direction="row" spacing={2} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
                <Tooltip title="Refresh Jobs">
                  <IconButton 
                    onClick={handleRefresh}
                    disabled={refreshing}
                    sx={{ 
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
                    }}
                  >
                    <Refresh sx={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
                  </IconButton>
                </Tooltip>
                
                <ToggleButtonGroup
                  value={viewMode}
                  exclusive
                  onChange={(e, newView) => newView && setViewMode(newView)}
                  size="small"
                >
                  <ToggleButton value="grid" aria-label="grid view">
                    <GridView fontSize="small" />
                  </ToggleButton>
                  <ToggleButton value="list" aria-label="list view">
                    <ViewList fontSize="small" />
                  </ToggleButton>
                </ToggleButtonGroup>
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </Container>

      {/* Search and Filter Section */}
      <Container maxWidth="xl" sx={{ mb: 4 }}>
        <Grid container spacing={3}>
          {/* Search Bar */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search jobs, companies, or skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="action" />
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: 2,
                  bgcolor: 'background.paper',
                  '& fieldset': { border: 'none' },
                  boxShadow: `0 2px 10px ${alpha(theme.palette.common.black, 0.1)}`
                }
              }}
            />
          </Grid>

          {/* Location Filter */}
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              placeholder="Location"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocationOn color="action" />
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: 2,
                  bgcolor: 'background.paper',
                  '& fieldset': { border: 'none' },
                  boxShadow: `0 2px 10px ${alpha(theme.palette.common.black, 0.1)}`
                }
              }}
            />
          </Grid>

          {/* Sort and Filter Controls */}
          <Grid item xs={12} md={3}>
            <Stack direction="row" spacing={1}>
              <FormControl fullWidth size="small">
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  sx={{ 
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                    '& fieldset': { border: 'none' },
                    boxShadow: `0 2px 10px ${alpha(theme.palette.common.black, 0.1)}`
                  }}
                >
                  <MenuItem value="newest">Latest Jobs</MenuItem>
                  <MenuItem value="salary">Highest Salary</MenuItem>
                  <MenuItem value="deadline">Deadline Soon</MenuItem>
                  <MenuItem value="oldest">Oldest First</MenuItem>
                </Select>
              </FormControl>
              
              <IconButton
                onClick={() => setShowFilters(!showFilters)}
                sx={{ 
                  bgcolor: showFilters ? 'primary.main' : 'background.paper',
                  color: showFilters ? 'primary.contrastText' : 'action.active',
                  boxShadow: `0 2px 10px ${alpha(theme.palette.common.black, 0.1)}`,
                  '&:hover': {
                    bgcolor: showFilters ? 'primary.dark' : alpha(theme.palette.primary.main, 0.1)
                  }
                }}
              >
                <TuneRounded />
              </IconButton>
            </Stack>
          </Grid>
        </Grid>

        {/* Category Tabs */}
        <Box sx={{ mt: 3, mb: 2 }}>
          <Tabs
            value={selectedCategory}
            onChange={(e, newValue) => setSelectedCategory(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTabs-flexContainer': {
                gap: 1
              },
              '& .MuiTab-root': {
                minHeight: 48,
                borderRadius: 3,
                textTransform: 'none',
                fontWeight: 500,
                border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                bgcolor: 'background.paper',
                color: 'text.secondary',
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  borderColor: 'primary.main'
                }
              }
            }}
          >
            {categories.map((category) => {
              const IconComponent = category.icon;
              const count = categoryCounts[category.key] || 0;
              
              return (
                <Tab
                  key={category.key}
                  value={category.key}
                  label={
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <IconComponent sx={{ fontSize: 18 }} />
                      <span>{category.label}</span>
                      {count > 0 && (
                        <Chip 
                          label={count} 
                          size="small" 
                          sx={{ 
                            height: 20, 
                            fontSize: '0.7rem',
                            bgcolor: selectedCategory === category.key ? 'rgba(255,255,255,0.2)' : alpha(theme.palette.primary.main, 0.1),
                            color: selectedCategory === category.key ? 'inherit' : 'primary.main'
                          }} 
                        />
                      )}
                    </Stack>
                  }
                />
              );
            })}
          </Tabs>
        </Box>
      </Container>

      {/* Jobs Grid/List */}
      <Container maxWidth="xl">
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {!loading && filteredJobs.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No jobs found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try adjusting your search criteria or browse different categories
            </Typography>
          </Box>
        )}

        <Grid container spacing={3}>
          {filteredJobs.map((job, index) => (
            <Grid 
              item 
              xs={12} 
              sm={viewMode === 'grid' ? 6 : 12} 
              md={viewMode === 'grid' ? 4 : 12} 
              lg={viewMode === 'grid' ? 3 : 12}
              key={job._id}
            >
              {viewMode === 'grid' ? (
                // Grid View - Vertical layout
                <Paper
                  sx={{
                    p: 3,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    borderRadius: 3,
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 12px 30px ${alpha(theme.palette.primary.main, 0.15)}`,
                      borderColor: 'primary.main'
                    }
                  }}
                  onClick={() => handleViewFullDetails(job)}
                >
                  {/* Status badges */}
                  {job.isCurated && (
                    <Chip
                      label="Curated"
                      size="small"
                      color="primary"
                      icon={<Star sx={{ fontSize: 14 }} />}
                      sx={{ 
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        fontWeight: 'bold',
                        fontSize: '0.7rem',
                        height: '24px'
                      }}
                    />
                  )}
                  
                  {/* Bookmark button */}
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBookmarkToggle(job._id);
                    }}
                    sx={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      zIndex: 1
                    }}
                  >
                    {bookmarkedJobs.has(job._id) ? <Bookmark color="primary" /> : <BookmarkBorder />}
                  </IconButton>
                  
                  {/* Company logo and job title */}
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    mb: 2,
                    gap: 1.5,
                    mt: 1,
                    width: '100%',
                    maxWidth: '100%',
                    minWidth: 0,
                    overflow: 'hidden'
                  }}>
                    <Avatar 
                      sx={{ 
                        width: 48, 
                        height: 48, 
                        flexShrink: 0,
                        bgcolor: 'primary.main',
                        fontSize: '1.1rem'
                      }}
                    >
                      {job.company?.charAt(0)}
                    </Avatar>
                    <Box sx={{ 
                      minWidth: 0, 
                      flex: 1,
                      width: '100%',
                      maxWidth: '100%',
                      overflow: 'hidden'
                    }}>
                      <Typography 
                        variant="h6" 
                        fontWeight="bold" 
                        sx={{ 
                          fontSize: '1rem',
                          lineHeight: 1.3,
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          wordBreak: 'break-all',
                          overflowWrap: 'anywhere',
                          hyphens: 'auto',
                          mb: 0.5,
                          height: '3.9em',
                          minHeight: '3.9em',
                          width: '100%',
                          maxWidth: '100%',
                          whiteSpace: 'normal'
                        }}
                        title={job.title}
                      >
                        {job.title}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{
                          fontSize: '0.875rem',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          wordBreak: 'break-all',
                          overflowWrap: 'anywhere',
                          hyphens: 'auto',
                          lineHeight: 1.2,
                          height: '2.4em',
                          minHeight: '2.4em',
                          width: '100%',
                          maxWidth: '100%',
                          whiteSpace: 'normal'
                        }}
                        title={job.company}
                      >
                        {job.company}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Job details */}
                  <Box sx={{ mb: 2, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '120px' }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      mb: 1,
                      minHeight: '20px'
                    }}>
                      <LocationOn 
                        fontSize="small" 
                        color="action" 
                        sx={{ mr: 1, fontSize: '1rem', flexShrink: 0 }} 
                      />
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                          fontSize: '0.8rem',
                          display: '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          wordBreak: 'break-word'
                        }}
                      >
                        {job.location}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      mb: 1,
                      minHeight: '20px'
                    }}>
                      <Work 
                        fontSize="small" 
                        color="action" 
                        sx={{ mr: 1, fontSize: '1rem', flexShrink: 0 }} 
                      />
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                          fontSize: '0.8rem',
                          wordBreak: 'break-word'
                        }}
                      >
                        {job.jobType}
                      </Typography>
                    </Box>
                    
                    {job.salary && (
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        mb: 1,
                        minHeight: '20px'
                      }}>
                        <AttachMoney 
                          fontSize="small" 
                          color="action" 
                          sx={{ mr: 1, fontSize: '1rem', flexShrink: 0 }} 
                        />
                        <Typography 
                          variant="body2" 
                          color="success.main" 
                          fontWeight="600"
                          sx={{ 
                            fontSize: '0.8rem',
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            wordBreak: 'break-word'
                          }}
                        >
                          {formatSalary(job.salary)}
                        </Typography>
                      </Box>
                    )}
                    
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      mb: 1,
                      minHeight: '20px'
                    }}>
                      <AccessTime 
                        fontSize="small" 
                        color="action" 
                        sx={{ mr: 1, fontSize: '1rem', flexShrink: 0 }} 
                      />
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                          fontSize: '0.8rem',
                          wordBreak: 'break-word'
                        }}
                      >
                        {getDaysPosted(job.createdAt)}
                      </Typography>
                    </Box>
                  </Box>
                  
                  {/* Deadline section */}
                  {job.applicationDeadline && (
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      mb: 1,
                      minHeight: '20px'
                    }}>
                      <Event 
                        fontSize="small" 
                        color="action" 
                        sx={{ mr: 1, fontSize: '1rem', flexShrink: 0 }} 
                      />
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontSize: '0.8rem',
                          wordBreak: 'break-word',
                          mr: 1
                        }}
                        color="text.secondary"
                      >
                        Deadline: 
                      </Typography>
                      <Chip
                        label={formatDeadline(job.applicationDeadline)}
                        size="small"
                        color={getDeadlineColor(job.applicationDeadline)}
                        variant="filled"
                        sx={{ 
                          fontSize: '0.7rem', 
                          height: 18,
                          fontWeight: 500
                        }}
                      />
                    </Box>
                  )}
                  
                  {/* Skills/tags */}
                  <Box sx={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: 0.5,
                    mb: 2,
                    minHeight: '30px',
                    alignContent: 'flex-start'
                  }}>
                    {job.skills?.slice(0, 2).map((skill, idx) => (
                      <Chip 
                        key={idx} 
                        label={skill} 
                        size="small" 
                        sx={{ 
                          bgcolor: 'primary.light',
                          color: 'primary.dark',
                          fontWeight: 500,
                          fontSize: '0.7rem',
                          height: 22,
                          maxWidth: '100px',
                          '& .MuiChip-label': {
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }
                        }} 
                      />
                    ))}
                  </Box>
                  
                  {/* View Details Button */}
                  <Box sx={{ mt: 'auto', pt: 1 }}>
                    <Button
                      variant="contained"
                      fullWidth
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewFullDetails(job);
                      }}
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        py: 0.8,
                        fontSize: '0.8rem'
                      }}
                    >
                      View Details
                    </Button>
                  </Box>
                </Paper>
              ) : (
                // List View would go here
                <Paper sx={{ p: 3, cursor: 'pointer' }} onClick={() => handleViewFullDetails(job)}>
                  <Typography variant="h6">{job.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{job.company}</Typography>
                </Paper>
              )}
            </Grid>
          ))}
        </Grid>

        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6, mb: 4 }}>
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
        )}
      </Container>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity="success">
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ModernJobsPage; 

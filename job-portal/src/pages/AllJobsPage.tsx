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
import Navbar from '../components/Navbar';
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

const AllJobsPage: React.FC = () => {
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
      icon: <WorkOutline />,
      color: 'primary.main',
      description: 'Browse all available opportunities'
    },
    { 
      key: JobCategory.JOBS, 
      label: 'Jobs', 
      icon: <Work />,
      color: 'primary.main',
      description: 'Full-time, part-time, and contract positions'
    },
    { 
      key: JobCategory.TENDERS, 
      label: 'Tenders', 
      icon: <Gavel />,
      color: 'warning.main',
      description: 'Government and private sector procurement opportunities'
    },
    { 
      key: JobCategory.TRAININGS, 
      label: 'Trainings', 
      icon: <MenuBook />,
      color: 'info.main',
      description: 'Professional development and skill-building programs'
    },
    { 
      key: JobCategory.INTERNSHIPS, 
      label: 'Internships', 
      icon: <Person />,
      color: 'secondary.main',
      description: 'Entry-level and student opportunities'
    },
    { 
      key: JobCategory.SCHOLARSHIPS, 
      label: 'Scholarships', 
      icon: <CardGiftcard />,
      color: 'success.main',
      description: 'Educational funding and scholarship opportunities'
    },
    { 
      key: JobCategory.ACCESS_TO_FINANCE, 
      label: 'Access to Finance', 
      icon: <AccountBalance />,
      color: 'error.main',
      description: 'Funding, loans, and financial support programs'
    }
  ];

  // Filter jobs based on selected category
  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredJobs(jobs);
    } else {
      const filtered = jobs.filter(job => 
        job.category === selectedCategory || 
        // Fallback logic for jobs without category field
        (!job.category && selectedCategory === JobCategory.JOBS)
      );
      setFilteredJobs(filtered);
    }
  }, [jobs, selectedCategory]);

  useEffect(() => {
    const fetchAllJobs = async () => {
      setLoading(true);
      setError(null);
      try {
        const filters: any = {};
        if (searchTerm) filters.search = searchTerm;
        if (locationFilter) filters.location = locationFilter;
        
        // Use 16 items per page (4 rows of 4 jobs each)
        const response = await jobService.getJobs(filters, currentPage, 16);
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

  // Fetch category counts
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await jobService.getJobCategories();
        const counts: Record<string, number> = {};
        let totalCount = 0;
        
        response.forEach((cat: any) => {
          counts[cat.category] = cat.count;
          totalCount += cat.count;
        });
        
        counts.all = totalCount;
        setCategoryCounts(counts);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, [totalJobs]);

  const handleViewFullDetails = (job: Job) => {
    // Redirect to login page for all job details
    navigate('/login');
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

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const filters: any = {};
      if (searchTerm) filters.search = searchTerm;
      if (locationFilter) filters.location = locationFilter;
      
      const response = await jobService.getJobs(filters, currentPage, 16);
      setJobs(response.data);
      setTotalPages(response.pagination.pages);
      setTotalJobs(response.pagination.total);
      setSnackbarMessage('Jobs refreshed successfully');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error refreshing jobs:', error);
      setSnackbarMessage('Failed to refresh jobs');
      setSnackbarOpen(true);
    } finally {
      setRefreshing(false);
    }
  };

  const handleBookmarkToggle = (jobId: string) => {
    setBookmarkedJobs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
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

  const getDaysPosted = (createdAt: string) => {
    const now = new Date();
    const posted = new Date(createdAt);
    const diffTime = Math.abs(now.getTime() - posted.getTime());
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays === 0) {
      if (diffHours === 0) return 'Just now';
      return `${diffHours}h ago`;
    } else if (diffDays === 1) {
      return '1 day ago';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      const weeks = Math.floor(diffDays / 7);
      return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
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

  // New helper functions for modern UI
  const toggleBookmark = (jobId: string) => {
    const newBookmarks = new Set(bookmarkedJobs);
    if (newBookmarks.has(jobId)) {
      newBookmarks.delete(jobId);
      setSnackbarMessage('Job removed from bookmarks');
    } else {
      newBookmarks.add(jobId);
      setSnackbarMessage('Job saved to bookmarks');
    }
    setBookmarkedJobs(newBookmarks);
    setSnackbarOpen(true);
  };

  const copyJobLink = (jobId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/jobs/${jobId}`);
    setSnackbarMessage('Job link copied to clipboard');
    setSnackbarOpen(true);
  };

  const refreshJobs = async () => {
    setRefreshing(true);
    try {
      const filters: any = {};
      if (searchTerm) filters.search = searchTerm;
      if (locationFilter) filters.location = locationFilter;
      if (jobTypeFilter) filters.jobType = jobTypeFilter;
      if (experienceFilter) filters.experienceLevel = experienceFilter;
      if (selectedCategory !== 'all') filters.category = selectedCategory;
      
      const response = await jobService.getJobs(filters, currentPage, 16);
      setJobs(response.data);
      setTotalPages(response.pagination.pages);
      setTotalJobs(response.pagination.total);
      setSnackbarMessage('Jobs refreshed successfully');
    } catch (error) {
      setSnackbarMessage('Failed to refresh jobs');
    } finally {
      setRefreshing(false);
      setSnackbarOpen(true);
    }
  };

  const sortJobs = (jobs: Job[]) => {
    return [...jobs].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'salary':
          const aSalary = a.salary?.max || 0;
          const bSalary = b.salary?.max || 0;
          return bSalary - aSalary;
        case 'deadline':
          if (!a.applicationDeadline && !b.applicationDeadline) return 0;
          if (!a.applicationDeadline) return 1;
          if (!b.applicationDeadline) return -1;
          return new Date(a.applicationDeadline).getTime() - new Date(b.applicationDeadline).getTime();
        default:
          return 0;
      }
    });
  };

  const displayJobs = sortJobs(filteredJobs);

  const ApplicationDialog = () => (
    <Dialog
      open={applicationDialogOpen}
      onClose={() => setApplicationDialogOpen(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ fontWeight: 'bold', color: 'primary.main' }}>
        Interested in {selectedJob?.title}?
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" paragraph>
          Before exploring this opportunity further, we recommend getting prepared to increase your chances of success.
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
      <DialogActions sx={{ p: 3 }}>
        <Button
          variant="contained"
          onClick={() => {
            setApplicationDialogOpen(false);
            navigate('/login');
          }}
          fullWidth
        >
          Login to Apply
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Removed PreparationDialog component
  const PreparationDialogPlaceholder = () => (
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
                border: `2px solid ${alpha(theme.palette.success.main, 0.2)}`,
                '&:hover': { 
                  transform: 'translateY(-4px)', 
                  boxShadow: `0 8px 25px ${alpha(theme.palette.success.main, 0.3)}`,
                  border: `2px solid ${theme.palette.success.main}`
                }
              }}
              onClick={() => {
                setPreparationDialogOpen(false);
                navigate('/app/interview-prep');
              }}
            >
              <CardContent sx={{ textAlign: 'center', p: 2 }}>
                <Person sx={{ fontSize: 40, color: theme.palette.success.main, mb: 1.5 }} />
                <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ fontSize: '1rem' }}>
                  Interview Prep
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                  Mock interviews & practice
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
                border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                '&:hover': { 
                  transform: 'translateY(-4px)', 
                  boxShadow: '0 8px 25px ' + alpha(theme.palette.primary.main, 0.3),
                  border: `2px solid ${theme.palette.primary.main}`
                }
              }}
              onClick={() => {
                window.open('https://www.elearning.excellencecoachinghub.com/', '_blank');
              }}
            >
              <CardContent sx={{ textAlign: 'center', p: 2 }}>
                <School sx={{ fontSize: 40, color: theme.palette.primary.main, mb: 1.5 }} />
                <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ fontSize: '1rem' }}>
                  Skills Training
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                  Relevant courses & certifications
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Additional Resources */}
        <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 'bold' }}>
          📚 Additional Resources
        </Typography>
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Psychology />}
              onClick={() => {
                setPreparationDialogOpen(false);
                navigate('/app/career-guidance');
              }}
              sx={{
                fontWeight: 700,
                borderRadius: 2,
                px: 3,
                background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
                boxShadow: '0 4px 12px ' + alpha(theme.palette.primary.main, 0.3),
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 6px 16px ' + alpha(theme.palette.primary.main, 0.4)
                }
              }}
            >
              Register Free
            </Button>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<TrendingUp />}
              onClick={() => {
                window.open('https://excellencecoachinghub.com/career-coaching', '_blank');
              }}
              sx={{ fontWeight: 600, borderRadius: 2, px: 3 }}
            >
              Premium Career Coaching
            </Button>
          </Grid>
        </Grid>

        <Paper sx={{ p: 3, bgcolor: alpha(theme.palette.primary.main, 0.05), border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`, borderRadius: 2 }}>
          <Typography variant="body1" color="primary.main" fontWeight="bold" gutterBottom>
            🌟 Why Choose Our Preparation Program?
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Our comprehensive program combines cutting-edge technology with proven methodologies to maximize your success rate.
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircle sx={{ color: 'success.main', mr: 1, fontSize: 18 }} />
                <Typography variant="body2">3x Higher Success Rate</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircle sx={{ color: 'success.main', mr: 1, fontSize: 18 }} />
                <Typography variant="body2">Personalized Learning Path</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircle sx={{ color: 'success.main', mr: 1, fontSize: 18 }} />
                <Typography variant="body2">Industry Expert Guidance</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircle sx={{ color: 'success.main', mr: 1, fontSize: 18 }} />
                <Typography variant="body2">Real-time Progress Tracking</Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'center' }}>
        <Button
          variant="contained"
          size="large"
          onClick={() => setPreparationDialogOpen(false)}
          sx={{ 
            fontWeight: 'bold',
            borderRadius: 2,
            px: 4,
            py: 1.5
          }}
        >
          Start Preparation Journey
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <>
      <Navbar />
      <Box sx={{ 
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.03)} 0%, ${alpha(theme.palette.secondary.main, 0.03)} 100%)`,
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            radial-gradient(circle at 20% 50%, ${alpha(theme.palette.primary.main, 0.02)} 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, ${alpha(theme.palette.secondary.main, 0.02)} 0%, transparent 50%)
          `,
          pointerEvents: 'none',
          zIndex: 0
        }
      }}>
      <Container maxWidth="xl">


        {/* Ultra-Modern Animated Services Section */}
        <Paper 
          sx={{ 
            mb: 3, 
            p: { xs: 3, md: 4 }, 
            borderRadius: 6,
            background: `
              radial-gradient(circle at 20% 20%, ${alpha(theme.palette.primary.main, 0.05)} 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, ${alpha(theme.palette.secondary.main, 0.05)} 0%, transparent 50%),
              radial-gradient(circle at 40% 60%, ${alpha(theme.palette.success.main, 0.03)} 0%, transparent 50%)
            `,
            backdropFilter: 'blur(30px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '-100%',
              right: 0,
              height: 5,
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main}, ${theme.palette.success.main}, ${theme.palette.warning.main}, ${theme.palette.error.main})`,
              borderRadius: '6px 6px 0 0',
              animation: 'slideShine 8s infinite linear'
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              top: -2,
              left: -2,
              right: -2,
              bottom: -2,
              background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.1)}, ${alpha(theme.palette.success.main, 0.1)})`,
              borderRadius: 8,
              zIndex: -1,
              filter: 'blur(20px)',
              opacity: 0.3
            },
            '@keyframes slideShine': {
              '0%': { left: '-100%' },
              '100%': { left: '100%' }
            }
          }}
        >
          {/* Ultra-Modern Animated Header */}
          <Box sx={{ textAlign: 'center', mb: 5, mt: 2, position: 'relative' }}>
            {/* Floating Background Elements */}
            <Box sx={{ 
              position: 'absolute', 
              top: -10, 
              left: '10%', 
              width: 60, 
              height: 60, 
              borderRadius: '50%', 
              background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.15)} 0%, transparent 70%)`,
              animation: 'float 6s ease-in-out infinite',
              '@keyframes float': {
                '0%, 100%': { transform: 'translateY(0px)' },
                '50%': { transform: 'translateY(-20px)' }
              }
            }} />
            <Box sx={{ 
              position: 'absolute', 
              top: 20, 
              right: '15%', 
              width: 40, 
              height: 40, 
              borderRadius: '50%', 
              background: `radial-gradient(circle, ${alpha(theme.palette.secondary.main, 0.15)} 0%, transparent 70%)`,
              animation: 'float 4s ease-in-out infinite 2s',
              '@keyframes float': {
                '0%, 100%': { transform: 'translateY(0px)' },
                '50%': { transform: 'translateY(-15px)' }
              }
            }} />
            
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 900,
                background: `linear-gradient(45deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 30%, ${theme.palette.success.main} 60%, ${theme.palette.warning.main} 100%)`,
                backgroundSize: '300% 100%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: 'gradientShift 4s ease-in-out infinite',
                mb: 2,
                fontSize: { xs: '1.8rem', md: '2.2rem' },
                letterSpacing: '-0.02em',
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: -5,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 80,
                  height: 3,
                  background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  borderRadius: 2,
                  animation: 'pulse 2s infinite'
                },
                '@keyframes gradientShift': {
                  '0%, 100%': { backgroundPosition: '0% 50%' },
                  '50%': { backgroundPosition: '100% 50%' }
                },
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 1, transform: 'translateX(-50%) scaleX(1)' },
                  '50%': { opacity: 0.7, transform: 'translateX(-50%) scaleX(1.2)' }
                }
              }}
            >
              🚀 Our Professional Services
            </Typography>
            
            <Typography 
              variant="h6" 
              sx={{ 
                maxWidth: 700, 
                mx: 'auto',
                fontSize: { xs: '1rem', md: '1.1rem' },
                color: 'text.secondary',
                lineHeight: 1.6,
                fontWeight: 400,
                opacity: 0.9,
                animation: 'fadeInUp 1s ease-out 0.5s both',
                '@keyframes fadeInUp': {
                  '0%': { opacity: 0, transform: 'translateY(30px)' },
                  '100%': { opacity: 0.9, transform: 'translateY(0)' }
                }
              }}
            >
              Comprehensive tools and professional solutions to accelerate your career growth
            </Typography>
            
            {/* Animated CTA Badge */}
            <Box sx={{ 
              mt: 2, 
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              px: 3,
              py: 1,
              background: `linear-gradient(45deg, ${alpha(theme.palette.success.main, 0.1)}, ${alpha(theme.palette.primary.main, 0.1)})`,
              borderRadius: 25,
              border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
              animation: 'bounce 2s infinite',
              '@keyframes bounce': {
                '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
                '40%': { transform: 'translateY(-5px)' },
                '60%': { transform: 'translateY(-3px)' }
              }
            }}>
              <EmojiEvents sx={{ color: 'warning.main', fontSize: '1.2rem' }} />
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                Choose Your Path to Success
              </Typography>
            </Box>
          </Box>

          {/* Ultra-Advanced Animated Sliding Services */}
          <Box sx={{ position: 'relative', overflow: 'hidden' }}>
            {/* Navigation Controls */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              gap: 2,
              mb: 3
            }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                Swipe to Explore Services
              </Typography>
              <Box sx={{
                display: 'flex',
                gap: 1
              }}>
                {[0, 1, 2, 3, 4, 5].map((dot) => (
                  <Box key={dot} sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: dot === 0 ? theme.palette.primary.main : alpha(theme.palette.primary.main, 0.3),
                    animation: dot === 0 ? 'dotPulse 2s infinite' : 'none',
                    '@keyframes dotPulse': {
                      '0%, 100%': { transform: 'scale(1)' },
                      '50%': { transform: 'scale(1.2)' }
                    }
                  }} />
                ))}
              </Box>
            </Box>
            
            {/* Auto-Sliding Container */}
            <Box
              sx={{
                display: 'flex',
                gap: { xs: 2, md: 3 },
                overflowX: 'auto',
                pb: 3,
                px: 1,
                scrollBehavior: 'smooth',
                maskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
                '&::-webkit-scrollbar': {
                  height: 10,
                },
                '&::-webkit-scrollbar-track': {
                  background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
                  borderRadius: 10,
                  margin: '0 20px'
                },
                '&::-webkit-scrollbar-thumb': {
                  background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main}, ${theme.palette.success.main})`,
                  borderRadius: 10,
                  border: '2px solid transparent',
                  backgroundClip: 'content-box',
                  animation: 'scrollGlow 3s infinite'
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  background: `linear-gradient(90deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark}, ${theme.palette.success.dark})`,
                },
                '@keyframes scrollGlow': {
                  '0%, 100%': { boxShadow: `0 0 5px ${theme.palette.primary.main}` },
                  '50%': { boxShadow: `0 0 15px ${theme.palette.secondary.main}` }
                }
              }}
            >
              {/* AI Interviews - Hyper-Animated Card */}
              <Card sx={{ 
                minWidth: { xs: 220, md: 260 },
                height: 180,
                cursor: 'pointer',
                borderRadius: 4,
                position: 'relative',
                overflow: 'hidden',
                background: `
                  radial-gradient(circle at 30% 20%, ${alpha(theme.palette.secondary.main, 0.15)} 0%, transparent 50%),
                  linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.03)} 100%)
                `,
                border: `2px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                backdropFilter: 'blur(10px)',
                animation: 'cardFloat 6s ease-in-out infinite',
                transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.secondary.main, 0.1)}, transparent)`,
                  transition: 'all 0.6s ease',
                },
                '&:hover': { 
                  transform: 'translateY(-15px) scale(1.05) rotateX(5deg)', 
                  boxShadow: `
                    0 25px 50px ${alpha(theme.palette.secondary.main, 0.4)},
                    0 0 30px ${alpha(theme.palette.secondary.main, 0.2)},
                    inset 0 1px 0 ${alpha('#fff', 0.1)}
                  `,
                  '&::before': {
                    left: '100%'
                  },
                  '& .service-icon': {
                    transform: 'scale(1.3) rotate(360deg)',
                    filter: 'drop-shadow(0 0 20px rgba(156, 39, 176, 0.5))'
                  },
                  '& .service-bg': {
                    transform: 'scale(1.5) rotate(45deg)',
                    opacity: 1
                  },
                  '& .service-glow': {
                    opacity: 0.8,
                    transform: 'scale(1.2)'
                  }
                },
                '@keyframes cardFloat': {
                  '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
                  '33%': { transform: 'translateY(-5px) rotate(0.5deg)' },
                  '66%': { transform: 'translateY(2px) rotate(-0.5deg)' }
                }
              }} onClick={() => navigate('/app/interviews')}>
                {/* Animated Background Elements */}
                <Box className="service-bg" sx={{
                  position: 'absolute',
                  top: -30, right: -30,
                  width: 100, height: 100,
                  borderRadius: '50%',
                  background: `
                    radial-gradient(circle, ${alpha(theme.palette.secondary.main, 0.3)} 0%, transparent 60%),
                    conic-gradient(from 0deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.dark}, ${theme.palette.secondary.main})
                  `,
                  animation: 'bgRotate 8s linear infinite',
                  transition: 'all 0.6s ease',
                  '@keyframes bgRotate': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' }
                  }
                }} />
                
                {/* Glow Effect */}
                <Box className="service-glow" sx={{
                  position: 'absolute',
                  top: 20, left: 20,
                  width: 40, height: 40,
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${alpha(theme.palette.secondary.main, 0.4)} 0%, transparent 70%)`,
                  filter: 'blur(10px)',
                  opacity: 0.6,
                  transition: 'all 0.6s ease'
                }} />

                <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
                  <Box>
                    <SmartToy className="service-icon" sx={{ 
                      fontSize: 50, 
                      color: 'secondary.main', 
                      mb: 2, 
                      transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      filter: 'drop-shadow(0 4px 8px rgba(156, 39, 176, 0.2))'
                    }} />
                    <Typography variant="h6" sx={{ 
                      fontWeight: 800, 
                      color: 'secondary.main', 
                      mb: 1,
                      fontSize: '1.1rem',
                      textShadow: `0 2px 4px ${alpha(theme.palette.secondary.main, 0.3)}`
                    }}>
                      AI Interviews
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ 
                      fontSize: '0.85rem',
                      lineHeight: 1.4,
                      fontWeight: 500
                    }}>
                      Practice with AI-powered mock interviews
                    </Typography>
                  </Box>
                  
                  {/* Animated Progress Bar */}
                  <Box sx={{ 
                    mt: 2,
                    height: 3,
                    background: alpha(theme.palette.secondary.main, 0.2),
                    borderRadius: 2,
                    overflow: 'hidden'
                  }}>
                    <Box sx={{
                      height: '100%',
                      width: '75%',
                      background: `linear-gradient(90deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.light})`,
                      borderRadius: 2,
                      animation: 'progressGlow 2s ease-in-out infinite alternate',
                      '@keyframes progressGlow': {
                        '0%': { boxShadow: '0 0 5px rgba(156, 39, 176, 0.5)' },
                        '100%': { boxShadow: '0 0 15px rgba(156, 39, 176, 0.8)' }
                      }
                    }} />
                  </Box>
                </CardContent>
              </Card>

              {/* Smart Tests - Hyper-Animated Card */}
              <Card sx={{ 
                minWidth: { xs: 220, md: 260 },
                height: 180,
                cursor: 'pointer',
                borderRadius: 4,
                position: 'relative',
                overflow: 'hidden',
                background: `
                  radial-gradient(circle at 30% 20%, ${alpha(theme.palette.info.main, 0.15)} 0%, transparent 50%),
                  linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.08)} 0%, ${alpha(theme.palette.info.main, 0.03)} 100%)
                `,
                border: `2px solid ${alpha(theme.palette.info.main, 0.2)}`,
                backdropFilter: 'blur(10px)',
                animation: 'cardFloat 6s ease-in-out infinite 1s',
                transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                '&:hover': { 
                  transform: 'translateY(-15px) scale(1.05) rotateY(5deg)', 
                  boxShadow: `
                    0 25px 50px ${alpha(theme.palette.info.main, 0.4)},
                    0 0 30px ${alpha(theme.palette.info.main, 0.2)}
                  `,
                  '& .service-icon': {
                    transform: 'scale(1.3) rotate(-360deg)',
                    filter: 'drop-shadow(0 0 20px rgba(2, 136, 209, 0.5))'
                  },
                  '& .service-bg': {
                    transform: 'scale(1.5) rotate(-45deg)',
                    opacity: 1
                  }
                }
              }} onClick={() => navigate('/app/tests')}>
                <Box className="service-bg" sx={{
                  position: 'absolute',
                  top: -30, right: -30,
                  width: 100, height: 100,
                  borderRadius: '50%',
                  background: `conic-gradient(from 45deg, ${theme.palette.info.main}, ${theme.palette.info.light}, ${theme.palette.info.main})`,
                  animation: 'bgRotate 6s linear infinite reverse',
                  transition: 'all 0.6s ease'
                }} />
                
                <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
                  <Box>
                    <Assessment className="service-icon" sx={{ 
                      fontSize: 50, 
                      color: 'info.main', 
                      mb: 2, 
                      transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      filter: 'drop-shadow(0 4px 8px rgba(2, 136, 209, 0.2))'
                    }} />
                    <Typography variant="h6" sx={{ 
                      fontWeight: 800, 
                      color: 'info.main', 
                      mb: 1,
                      fontSize: '1.1rem'
                    }}>
                      Smart Tests
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ 
                      fontSize: '0.85rem',
                      lineHeight: 1.4,
                      fontWeight: 500
                    }}>
                      Advanced psychometric assessments
                    </Typography>
                  </Box>
                  
                  <Box sx={{ 
                    mt: 2,
                    height: 3,
                    background: alpha(theme.palette.info.main, 0.2),
                    borderRadius: 2,
                    overflow: 'hidden'
                  }}>
                    <Box sx={{
                      height: '100%',
                      width: '85%',
                      background: `linear-gradient(90deg, ${theme.palette.info.main}, ${theme.palette.info.light})`,
                      borderRadius: 2,
                      animation: 'progressGlow 2s ease-in-out infinite alternate'
                    }} />
                  </Box>
                </CardContent>
              </Card>

              {/* CV Builder - Hyper-Animated Card */}
              <Card sx={{ 
                minWidth: { xs: 220, md: 260 },
                height: 180,
                cursor: 'pointer',
                borderRadius: 4,
                position: 'relative',
                overflow: 'hidden',
                background: `
                  radial-gradient(circle at 30% 20%, ${alpha(theme.palette.success.main, 0.15)} 0%, transparent 50%),
                  linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.08)} 0%, ${alpha(theme.palette.success.main, 0.03)} 100%)
                `,
                border: `2px solid ${alpha(theme.palette.success.main, 0.2)}`,
                backdropFilter: 'blur(10px)',
                animation: 'cardFloat 6s ease-in-out infinite 2s',
                transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                '&:hover': { 
                  transform: 'translateY(-15px) scale(1.05) rotateZ(2deg)', 
                  boxShadow: `
                    0 25px 50px ${alpha(theme.palette.success.main, 0.4)},
                    0 0 30px ${alpha(theme.palette.success.main, 0.2)}
                  `,
                  '& .service-icon': {
                    transform: 'scale(1.3) rotateY(180deg)',
                    filter: 'drop-shadow(0 0 20px rgba(76, 175, 80, 0.5))'
                  },
                  '& .service-bg': {
                    transform: 'scale(1.5) rotate(90deg)',
                    opacity: 1
                  }
                }
              }} onClick={() => navigate('/app/cv-builder')}>
                <Box className="service-bg" sx={{
                  position: 'absolute',
                  top: -30, right: -30,
                  width: 100, height: 100,
                  background: `linear-gradient(45deg, ${alpha(theme.palette.success.main, 0.3)}, ${alpha(theme.palette.success.light, 0.2)})`,
                  clipPath: 'polygon(0% 0%, 100% 0%, 80% 100%, 0% 80%)',
                  animation: 'bgPulse 4s ease-in-out infinite',
                  transition: 'all 0.6s ease',
                  '@keyframes bgPulse': {
                    '0%, 100%': { transform: 'scale(1) rotate(0deg)' },
                    '50%': { transform: 'scale(1.1) rotate(45deg)' }
                  }
                }} />
                
                <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
                  <Box>
                    <Description className="service-icon" sx={{ 
                      fontSize: 50, 
                      color: 'success.main', 
                      mb: 2, 
                      transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      filter: 'drop-shadow(0 4px 8px rgba(76, 175, 80, 0.2))'
                    }} />
                    <Typography variant="h6" sx={{ 
                      fontWeight: 800, 
                      color: 'success.main', 
                      mb: 1,
                      fontSize: '1.1rem'
                    }}>
                      CV Builder
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ 
                      fontSize: '0.85rem',
                      lineHeight: 1.4,
                      fontWeight: 500
                    }}>
                      Create professional resumes instantly
                    </Typography>
                  </Box>
                  
                  <Box sx={{ 
                    mt: 2,
                    height: 3,
                    background: alpha(theme.palette.success.main, 0.2),
                    borderRadius: 2,
                    overflow: 'hidden'
                  }}>
                    <Box sx={{
                      height: '100%',
                      width: '92%',
                      background: `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.success.light})`,
                      borderRadius: 2,
                      animation: 'progressGlow 2s ease-in-out infinite alternate'
                    }} />
                  </Box>
                </CardContent>
              </Card>

              {/* Career Guidance - Hyper-Animated Card */}
              <Card sx={{ 
                minWidth: { xs: 220, md: 260 },
                height: 180,
                cursor: 'pointer',
                borderRadius: 4,
                position: 'relative',
                overflow: 'hidden',
                background: `
                  radial-gradient(circle at 30% 20%, ${alpha(theme.palette.warning.main, 0.15)} 0%, transparent 50%),
                  linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.08)} 0%, ${alpha(theme.palette.warning.main, 0.03)} 100%)
                `,
                border: `2px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                backdropFilter: 'blur(10px)',
                animation: 'cardFloat 6s ease-in-out infinite 3s',
                transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                '&:hover': { 
                  transform: 'translateY(-15px) scale(1.05) rotateX(-5deg)', 
                  boxShadow: `
                    0 25px 50px ${alpha(theme.palette.warning.main, 0.4)},
                    0 0 30px ${alpha(theme.palette.warning.main, 0.2)}
                  `,
                  '& .service-icon': {
                    transform: 'scale(1.3) rotate(15deg)',
                    filter: 'drop-shadow(0 0 20px rgba(255, 152, 0, 0.5))'
                  },
                  '& .service-bg': {
                    transform: 'scale(1.5) rotate(-90deg)',
                    opacity: 1
                  }
                }
              }} onClick={() => navigate('/app/career-guidance')}>
                <Box className="service-bg" sx={{
                  position: 'absolute',
                  top: -30, left: -30,
                  width: 100, height: 100,
                  background: `radial-gradient(ellipse at center, ${alpha(theme.palette.warning.main, 0.4)} 0%, transparent 60%)`,
                  animation: 'bgWave 5s ease-in-out infinite',
                  transition: 'all 0.6s ease',
                  '@keyframes bgWave': {
                    '0%, 100%': { transform: 'scale(1) skewX(0deg)' },
                    '50%': { transform: 'scale(1.2) skewX(15deg)' }
                  }
                }} />
                
                <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
                  <Box>
                    <Psychology className="service-icon" sx={{ 
                      fontSize: 50, 
                      color: 'warning.main', 
                      mb: 2, 
                      transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      filter: 'drop-shadow(0 4px 8px rgba(255, 152, 0, 0.2))'
                    }} />
                    <Typography variant="h6" sx={{ 
                      fontWeight: 800, 
                      color: 'warning.main', 
                      mb: 1,
                      fontSize: '1.1rem'
                    }}>
                      Career Guidance
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ 
                      fontSize: '0.85rem',
                      lineHeight: 1.4,
                      fontWeight: 500
                    }}>
                      Personalized career path recommendations
                    </Typography>
                  </Box>
                  
                  <Box sx={{ 
                    mt: 2,
                    height: 3,
                    background: alpha(theme.palette.warning.main, 0.2),
                    borderRadius: 2,
                    overflow: 'hidden'
                  }}>
                    <Box sx={{
                      height: '100%',
                      width: '78%',
                      background: `linear-gradient(90deg, ${theme.palette.warning.main}, ${theme.palette.warning.light})`,
                      borderRadius: 2,
                      animation: 'progressGlow 2s ease-in-out infinite alternate'
                    }} />
                  </Box>
                </CardContent>
              </Card>

              {/* Professional Network - Hyper-Animated Card */}
              <Card sx={{ 
                minWidth: { xs: 220, md: 260 },
                height: 180,
                cursor: 'pointer',
                borderRadius: 4,
                position: 'relative',
                overflow: 'hidden',
                background: `
                  radial-gradient(circle at 30% 20%, ${alpha(theme.palette.error.main, 0.15)} 0%, transparent 50%),
                  linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.08)} 0%, ${alpha(theme.palette.error.main, 0.03)} 100%)
                `,
                border: `2px solid ${alpha(theme.palette.error.main, 0.2)}`,
                backdropFilter: 'blur(10px)',
                animation: 'cardFloat 6s ease-in-out infinite 4s',
                transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                '&:hover': { 
                  transform: 'translateY(-15px) scale(1.05) rotateY(-5deg)', 
                  boxShadow: `
                    0 25px 50px ${alpha(theme.palette.error.main, 0.4)},
                    0 0 30px ${alpha(theme.palette.error.main, 0.2)}
                  `,
                  '& .service-icon': {
                    transform: 'scale(1.3) rotate(-15deg)',
                    filter: 'drop-shadow(0 0 20px rgba(244, 67, 54, 0.5))'
                  },
                  '& .service-bg': {
                    transform: 'scale(1.5) rotate(180deg)',
                    opacity: 1
                  }
                }
              }} onClick={() => navigate('/app/network')}>
                <Box className="service-bg" sx={{
                  position: 'absolute',
                  top: -15, right: -15,
                  width: 80, height: 80,
                  background: `conic-gradient(from 180deg, ${theme.palette.error.main}, transparent, ${theme.palette.error.main})`,
                  borderRadius: '50%',
                  animation: 'bgSpin 10s linear infinite',
                  transition: 'all 0.6s ease',
                  '@keyframes bgSpin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' }
                  }
                }} />
                
                <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
                  <Box>
                    <Groups className="service-icon" sx={{ 
                      fontSize: 50, 
                      color: 'error.main', 
                      mb: 2, 
                      transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      filter: 'drop-shadow(0 4px 8px rgba(244, 67, 54, 0.2))'
                    }} />
                    <Typography variant="h6" sx={{ 
                      fontWeight: 800, 
                      color: 'error.main', 
                      mb: 1,
                      fontSize: '1.1rem'
                    }}>
                      Professional Network
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ 
                      fontSize: '0.85rem',
                      lineHeight: 1.4,
                      fontWeight: 500
                    }}>
                      Connect with industry professionals
                    </Typography>
                  </Box>
                  
                  <Box sx={{ 
                    mt: 2,
                    height: 3,
                    background: alpha(theme.palette.error.main, 0.2),
                    borderRadius: 2,
                    overflow: 'hidden'
                  }}>
                    <Box sx={{
                      height: '100%',
                      width: '68%',
                      background: `linear-gradient(90deg, ${theme.palette.error.main}, ${theme.palette.error.light})`,
                      borderRadius: 2,
                      animation: 'progressGlow 2s ease-in-out infinite alternate'
                    }} />
                  </Box>
                </CardContent>
              </Card>

              {/* Learning Hub - Hyper-Animated Card */}
              <Card sx={{ 
                minWidth: { xs: 220, md: 260 },
                height: 180,
                cursor: 'pointer',
                borderRadius: 4,
                position: 'relative',
                overflow: 'hidden',
                background: `
                  radial-gradient(circle at 30% 20%, ${alpha(theme.palette.primary.main, 0.15)} 0%, transparent 50%),
                  linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.main, 0.03)} 100%)
                `,
                border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                backdropFilter: 'blur(10px)',
                animation: 'cardFloat 6s ease-in-out infinite 5s',
                transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                '&:hover': { 
                  transform: 'translateY(-15px) scale(1.05) rotateX(5deg)', 
                  boxShadow: `
                    0 25px 50px ${alpha(theme.palette.primary.main, 0.4)},
                    0 0 30px ${alpha(theme.palette.primary.main, 0.2)}
                  `,
                  '& .service-icon': {
                    transform: 'scale(1.3) rotate(720deg)',
                    filter: 'drop-shadow(0 0 20px rgba(63, 81, 181, 0.5))'
                  },
                  '& .service-bg': {
                    transform: 'scale(1.5) rotate(270deg)',
                    opacity: 1
                  }
                }
              }} onClick={() => navigate('/app/courses')}>
                <Box className="service-bg" sx={{
                  position: 'absolute',
                  top: -20, left: -20,
                  width: 90, height: 90,
                  background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.2)}, transparent 50%, ${alpha(theme.palette.primary.light, 0.3)})`,
                  borderRadius: '30%',
                  animation: 'bgMorph 8s ease-in-out infinite',
                  transition: 'all 0.6s ease',
                  '@keyframes bgMorph': {
                    '0%, 100%': { borderRadius: '30%', transform: 'scale(1)' },
                    '33%': { borderRadius: '50%', transform: 'scale(1.1)' },
                    '66%': { borderRadius: '20%', transform: 'scale(0.9)' }
                  }
                }} />
                
                <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
                  <Box>
                    <School className="service-icon" sx={{ 
                      fontSize: 50, 
                      color: 'primary.main', 
                      mb: 2, 
                      transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      filter: 'drop-shadow(0 4px 8px rgba(63, 81, 181, 0.2))'
                    }} />
                    <Typography variant="h6" sx={{ 
                      fontWeight: 800, 
                      color: 'primary.main', 
                      mb: 1,
                      fontSize: '1.1rem'
                    }}>
                      Learning Hub
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ 
                      fontSize: '0.85rem',
                      lineHeight: 1.4,
                      fontWeight: 500
                    }}>
                      Upskill with expert-led courses
                    </Typography>
                  </Box>
                  
                  <Box sx={{ 
                    mt: 2,
                    height: 3,
                    background: alpha(theme.palette.primary.main, 0.2),
                    borderRadius: 2,
                    overflow: 'hidden'
                  }}>
                    <Box sx={{
                      height: '100%',
                      width: '88%',
                      background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                      borderRadius: 2,
                      animation: 'progressGlow 2s ease-in-out infinite alternate'
                    }} />
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </Paper>

        {/* Enhanced Search and Filter Bar with Category Integration */}
        <Paper 
          sx={{ 
            p: 3, 
            mb: 3,
            borderRadius: 4,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.03)} 0%, ${alpha(theme.palette.secondary.main, 0.03)} 100%)`,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main}, ${theme.palette.success.main})`,
            }
          }}
        >
          {/* Header with integrated category browsing */}
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 700,
                background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 0.5,
                fontSize: { xs: '1.1rem', md: '1.3rem' }
              }}
            >
              🎯 Find Your Next Opportunity
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.85rem', md: '0.95rem' } }}>
              Search across all categories and find opportunities that match your interests
            </Typography>
          </Box>

          {/* Category Pills */}
          <Box sx={{ mb: 3 }}>
            <Stack 
              direction="row" 
              spacing={1} 
              sx={{ 
                overflowX: 'auto',
                pb: 1,
                '&::-webkit-scrollbar': {
                  height: 6,
                },
                '&::-webkit-scrollbar-track': {
                  background: alpha(theme.palette.divider, 0.1),
                  borderRadius: 3,
                },
                '&::-webkit-scrollbar-thumb': {
                  background: theme.palette.primary.main,
                  borderRadius: 3,
                },
              }}
            >
              {categories.map((category) => {
                const isSelected = selectedCategory === category.key;
                const jobCount = categoryCounts[category.key] || 0;
                
                return (
                  <Chip
                    key={category.key}
                    icon={category.icon}
                    label={`${category.label} (${jobCount})`}
                    onClick={() => setSelectedCategory(category.key)}
                    variant={isSelected ? 'filled' : 'outlined'}
                    sx={{
                      minWidth: 'fit-content',
                      height: 32,
                      borderRadius: 4,
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      ...(isSelected ? {
                        background: `linear-gradient(45deg, ${getThemeColor(category.color)} 30%, ${alpha(getThemeColor(category.color), 0.8)} 90%)`,
                        color: 'white',
                        border: 'none',
                        transform: 'scale(1.05)',
                        boxShadow: `0 4px 12px ${alpha(getThemeColor(category.color), 0.4)}`
                      } : {
                        borderColor: alpha(getThemeColor(category.color), 0.3),
                        color: getThemeColor(category.color),
                        '&:hover': {
                          borderColor: getThemeColor(category.color),
                          backgroundColor: alpha(getThemeColor(category.color), 0.05),
                          transform: 'translateY(-1px)'
                        }
                      })
                    }}
                  />
                );
              })}
            </Stack>
          </Box>

          {/* Search Fields */}
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="medium"
                placeholder="Search jobs, companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: 'primary.main', fontSize: '1.2rem' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    backgroundColor: 'background.paper',
                    border: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    '&:hover': {
                      borderColor: alpha(theme.palette.primary.main, 0.3),
                    },
                    '&.Mui-focused': {
                      borderColor: theme.palette.primary.main,
                      boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.1)}`,
                    }
                  },
                  '& .MuiInputBase-input': {
                    fontSize: '1rem',
                    fontWeight: 500
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="medium"
                placeholder="Location"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOn sx={{ color: 'secondary.main', fontSize: '1.2rem' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    backgroundColor: 'background.paper',
                    border: `2px solid ${alpha(theme.palette.secondary.main, 0.1)}`,
                    '&:hover': {
                      borderColor: alpha(theme.palette.secondary.main, 0.3),
                    },
                    '&.Mui-focused': {
                      borderColor: theme.palette.secondary.main,
                      boxShadow: `0 0 0 4px ${alpha(theme.palette.secondary.main, 0.1)}`,
                    }
                  },
                  '& .MuiInputBase-input': {
                    fontSize: '1rem',
                    fontWeight: 500
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={5}>
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleSearch}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Search />}
                  sx={{ 
                    borderRadius: 3,
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '1rem',
                    px: 3,
                    py: 1.5,
                    background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
                    boxShadow: `0 4px 15px ${alpha(theme.palette.primary.main, 0.3)}`,
                    '&:hover': {
                      background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.secondary.dark} 90%)`,
                      boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                      transform: 'translateY(-1px)'
                    },
                    '&:disabled': {
                      background: alpha(theme.palette.action.disabled, 0.12),
                      color: theme.palette.action.disabled
                    }
                  }}
                >
                  {loading ? 'Searching...' : 'Search Jobs'}
                </Button>
                <IconButton
                  onClick={handleRefresh}
                  disabled={refreshing}
                  size="large"
                  sx={{ 
                    borderRadius: 3,
                    width: 48,
                    height: 48,
                    border: `2px solid ${alpha(theme.palette.success.main, 0.2)}`,
                    color: 'success.main',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.success.main, 0.1),
                      borderColor: theme.palette.success.main,
                      transform: 'rotate(180deg)',
                      transition: 'transform 0.6s ease'
                    }
                  }}
                >
                  {refreshing ? (
                    <CircularProgress size={22} color="success" />
                  ) : (
                    <Refresh />
                  )}
                </IconButton>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        {/* Jobs Results Section */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={40} />
          </Box>
        ) : error ? (
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
            <Typography color="error" variant="h6" gutterBottom>
              {error}
            </Typography>
            <Button 
              variant="outlined" 
              onClick={handleRefresh}
              startIcon={<Refresh />}
              sx={{ mt: 2 }}
            >
              Try Again
            </Button>
          </Paper>
        ) : filteredJobs.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No jobs found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try adjusting your search criteria or browse different categories
            </Typography>
          </Paper>
        ) : (
          <>
            {/* Results Header */}
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                {filteredJobs.length} opportunities found
              </Typography>
              <Stack direction="row" spacing={1}>
                <ToggleButtonGroup
                  value={viewMode}
                  exclusive
                  onChange={(e, newMode) => newMode && setViewMode(newMode)}
                  size="small"
                >
                  <ToggleButton value="grid">
                    <ViewModule />
                  </ToggleButton>
                  <ToggleButton value="list">
                    <ViewList />
                  </ToggleButton>
                </ToggleButtonGroup>
              </Stack>
            </Box>

            {/* Jobs Grid/List */}
            <Box
              sx={{
                display: 'grid',
                gap: viewMode === 'grid' ? 2 : 3,
                gridTemplateColumns: viewMode === 'grid' ? {
                  xs: 'repeat(1, 1fr)',
                  sm: 'repeat(2, 1fr)', 
                  md: 'repeat(3, 1fr)',
                  lg: 'repeat(4, 1fr)'
                } : 'repeat(1, 1fr)',
              }}
            >
              {filteredJobs.map((job) => (
                <Box 
                  key={job._id}
                  sx={{
                    minWidth: 0, // Allow shrinking
                    maxWidth: '100%', // Prevent expansion
                    overflow: 'hidden'
                  }}
                >
                  {viewMode === 'grid' ? (
                    // Grid View - Compact like HomePage
                    <Paper 
                      elevation={3} 
                      sx={{ 
                        p: 2.5, 
                        borderRadius: 3,
                        height: 420, // Increased height to accommodate View Details button
                        minHeight: 420, // Ensure minimum height
                        width: '100%', // Full width of grid item
                        maxWidth: '100%', // Prevent expansion
                        minWidth: 0, // Allow shrinking
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        position: 'relative',
                        overflow: 'hidden', // Prevent content overflow
                        boxSizing: 'border-box', // Include padding in width calculation
                        wordWrap: 'break-word', // Force word breaking at paper level
                        overflowWrap: 'break-word', // Additional word breaking
                        '&:hover': {
                          transform: 'translateY(-5px)',
                          boxShadow: '0 12px 20px rgba(0,0,0,0.1)'
                        },
                        '& *': { // Apply word breaking to all children
                          wordWrap: 'break-word',
                          overflowWrap: 'break-word'
                        }
                      }}
                      onClick={() => handleViewFullDetails(job)}
                    >
                      {/* New tag if job is recent */}
                      {isJobNew(job.createdAt) && (
                        <Chip 
                          icon={<FiberNew />} 
                          label="New" 
                          color="primary" 
                          size="small"
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
                        minWidth: 0, // Allow shrinking
                        overflow: 'hidden' // Prevent content overflow
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
                          overflow: 'hidden' // Prevent content from expanding container
                        }}>
                          <Typography 
                            variant="h6" 
                            fontWeight="bold" 
                            sx={{ 
                              fontSize: '1rem',
                              lineHeight: 1.3,
                              display: '-webkit-box',
                              WebkitLineClamp: 3, // Allow up to 3 lines for long titles
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              wordBreak: 'break-all', // Break even within words if necessary
                              overflowWrap: 'anywhere', // Break anywhere to prevent overflow
                              hyphens: 'auto', // Enable hyphenation
                              mb: 0.5,
                              height: '3.9em', // Fixed height for 3 lines (1.3 * 3)
                              minHeight: '3.9em', // Ensure consistent height even for short titles
                              width: '100%', // Full width of container
                              maxWidth: '100%', // Prevent expansion
                              whiteSpace: 'normal' // Allow normal text wrapping
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
                              WebkitLineClamp: 2, // Allow up to 2 lines for company names
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              wordBreak: 'break-all', // Break even within words if necessary
                              overflowWrap: 'anywhere', // Break anywhere to prevent overflow
                              hyphens: 'auto', // Enable hyphenation
                              lineHeight: 1.2,
                              height: '2.4em', // Fixed height for 2 lines (1.2 * 2)
                              minHeight: '2.4em', // Ensure consistent height
                              width: '100%', // Full width of container
                              maxWidth: '100%', // Prevent expansion
                              whiteSpace: 'normal' // Allow normal text wrapping
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
                          minHeight: '20px' // Consistent height for location row
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
                          minHeight: '20px' // Consistent height for job type row
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
                            minHeight: '20px' // Consistent height for salary row
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
                          minHeight: '20px' // Consistent height for time posted row
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
                      
                      {/* Deadline section - visible and prominent */}
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
                            e.stopPropagation(); // Prevent card click
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
                    // List View - Horizontal layout
                    <Card
                      sx={{
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.15)}`,
                          borderColor: 'primary.main'
                        }
                      }}
                      onClick={() => handleViewFullDetails(job)}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'flex-start',
                          mb: 2
                        }}>
                          <Box sx={{ flex: 1, mr: 2 }}>
                            <Typography 
                              variant="h6" 
                              sx={{ 
                                fontWeight: 600, 
                                fontSize: '1.2rem', 
                                mb: 0.5 
                              }}
                            >
                              {job.title}
                            </Typography>
                            <Typography 
                              variant="body1" 
                              color="text.secondary" 
                              sx={{ 
                                mb: 1, 
                                fontSize: '1rem'
                              }}
                            >
                              {job.company}
                            </Typography>
                            
                            <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <LocationOn sx={{ fontSize: '1.1rem', mr: 0.5 }} color="action" />
                                <Typography variant="body2" color="text.secondary">
                                  {job.location}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Work sx={{ fontSize: '1.1rem', mr: 0.5 }} color="action" />
                                <Typography variant="body2" color="text.secondary">
                                  {job.jobType}
                                </Typography>
                              </Box>
                              {job.salary && (
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <AttachMoney sx={{ fontSize: '1.1rem', mr: 0.5 }} color="action" />
                                  <Typography variant="body2" color="success.main" fontWeight="600">
                                    {formatSalary(job.salary)}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                            
                            <Typography 
                              variant="body2" 
                              color="text.secondary" 
                              sx={{ 
                                mb: 1.5,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                              }}
                            >
                              {job.description}
                            </Typography>
                            
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              {job.skills?.slice(0, 4).map((skill, idx) => (
                                <Chip 
                                  key={idx} 
                                  label={skill} 
                                  size="small" 
                                  sx={{ 
                                    bgcolor: 'primary.light',
                                    color: 'primary.dark',
                                    fontWeight: 500
                                  }} 
                                />
                              ))}
                            </Box>
                          </Box>
                          
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBookmarkToggle(job._id);
                              }}
                            >
                              {bookmarkedJobs.has(job._id) ? <Bookmark color="primary" /> : <BookmarkBorder />}
                            </IconButton>
                            
                            {isJobNew(job.createdAt) && (
                              <Chip 
                                icon={<FiberNew />} 
                                label="New" 
                                color="primary" 
                                size="small"
                                sx={{ fontWeight: 'bold' }}
                              />
                            )}
                            
                            {job.applicationDeadline && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                                <Event fontSize="small" color="action" />
                                <Typography 
                                  variant="caption" 
                                  color="text.secondary"
                                  sx={{ fontSize: '0.75rem' }}
                                >
                                  Deadline: 
                                </Typography>
                                <Chip
                                  label={formatDeadline(job.applicationDeadline)}
                                  size="small"
                                  color={getDeadlineColor(job.applicationDeadline)}
                                  variant="filled"
                                  sx={{ fontSize: '0.7rem', height: 20 }}
                                />
                              </Box>
                            )}
                            
                            <Typography 
                              variant="caption" 
                              color="text.secondary"
                              sx={{ mb: 1.5 }}
                            >
                              {getDaysPosted(job.createdAt)}
                            </Typography>
                            
                            {/* View Details Button */}
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewFullDetails(job);
                              }}
                              sx={{
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 600,
                                px: 2,
                                py: 0.5,
                                fontSize: '0.8rem',
                                minWidth: 120
                              }}
                            >
                              View Details
                            </Button>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  )}
                </Box>
              ))}
            </Box>

            {/* Pagination */}
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
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
          </>
        )}

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={() => setSnackbarOpen(false)}
        >
          <Alert severity="success" onClose={() => setSnackbarOpen(false)}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
    </>
  );
};

export default AllJobsPage;
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
  Alert
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


        {/* Services Overview Section */}
        <Paper
          sx={{ 
            p: 1.5, 
            mb: 2, 
            borderRadius: 2,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)',
            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main', mb: 2, textAlign: 'center' }}>
            🌟 Our Complete Career Development Platform
          </Typography>
          
          {/* Services Grid */}
          <Grid container spacing={1}>
            <Grid item xs={6} sm={3} md={2}>
              <Card sx={{ 
                textAlign: 'center', 
                p: 1, 
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': { 
                  transform: 'translateY(-2px)', 
                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`
                }
              }} onClick={() => navigate('/jobs')}>
                <Work sx={{ fontSize: 24, color: 'primary.main', mb: 0.5 }} />
                <Typography variant="caption" fontWeight="bold" display="block" sx={{ fontSize: '0.75rem' }}>
                  Job Portal
                </Typography>
              </Card>
            </Grid>
            
            <Grid item xs={6} sm={3} md={2}>
              <Card sx={{ 
                textAlign: 'center', 
                p: 1, 
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': { 
                  transform: 'translateY(-2px)', 
                  boxShadow: `0 4px 12px ${alpha(theme.palette.secondary.main, 0.2)}`
                }
              }} onClick={() => navigate('/app/interviews')}>
                <SmartToy sx={{ fontSize: 24, color: 'secondary.main', mb: 0.5 }} />
                <Typography variant="caption" fontWeight="bold" display="block" sx={{ fontSize: '0.75rem' }}>
                  AI Interviews
                </Typography>
              </Card>
            </Grid>

            <Grid item xs={6} sm={3} md={2}>
              <Card sx={{ 
                textAlign: 'center', 
                p: 1, 
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': { 
                  transform: 'translateY(-2px)', 
                  boxShadow: `0 4px 12px ${alpha(theme.palette.info.main, 0.2)}`
                }
              }} onClick={() => navigate('/app/tests')}>
                <Assessment sx={{ fontSize: 24, color: 'info.main', mb: 0.5 }} />
                <Typography variant="caption" fontWeight="bold" display="block" sx={{ fontSize: '0.75rem' }}>
                  Psychometric Tests
                </Typography>
              </Card>
            </Grid>

            <Grid item xs={6} sm={3} md={2}>
              <Card sx={{ 
                textAlign: 'center', 
                p: 1, 
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': { 
                  transform: 'translateY(-2px)', 
                  boxShadow: `0 4px 12px ${alpha(theme.palette.success.main, 0.2)}`
                }
              }} onClick={() => navigate('/app/cv-builder')}>
                <Description sx={{ fontSize: 24, color: 'success.main', mb: 0.5 }} />
                <Typography variant="caption" fontWeight="bold" display="block" sx={{ fontSize: '0.75rem' }}>
                  CV Builder
                </Typography>
              </Card>
            </Grid>

            <Grid item xs={6} sm={3} md={2}>
              <Card sx={{ 
                textAlign: 'center', 
                p: 1, 
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': { 
                  transform: 'translateY(-2px)', 
                  boxShadow: `0 4px 12px ${alpha(theme.palette.warning.main, 0.2)}`
                }
              }} onClick={() => navigate('/app/career-guidance')}>
                <Psychology sx={{ fontSize: 24, color: 'warning.main', mb: 0.5 }} />
                <Typography variant="caption" fontWeight="bold" display="block" sx={{ fontSize: '0.75rem' }}>
                  Career Guidance
                </Typography>
              </Card>
            </Grid>

            <Grid item xs={6} sm={3} md={2}>
              <Card sx={{ 
                textAlign: 'center', 
                p: 1, 
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': { 
                  transform: 'translateY(-2px)', 
                  boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.2)}`
                }
              }} onClick={() => navigate('/app/network')}>
                <Groups sx={{ fontSize: 24, color: 'error.main', mb: 0.5 }} />
                <Typography variant="caption" fontWeight="bold" display="block" sx={{ fontSize: '0.75rem' }}>
                  Professional Network
                </Typography>
              </Card>
            </Grid>

            <Grid item xs={6} sm={3} md={2}>
              <Card sx={{ 
                textAlign: 'center', 
                p: 1, 
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': { 
                  transform: 'translateY(-2px)', 
                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`
                }
              }} onClick={() => navigate('/app/courses')}>
                <School sx={{ fontSize: 24, color: 'primary.main', mb: 0.5 }} />
                <Typography variant="caption" fontWeight="bold" display="block" sx={{ fontSize: '0.75rem' }}>
                  Learning Courses
                </Typography>
              </Card>
            </Grid>

            <Grid item xs={6} sm={3} md={2}>
              <Card sx={{ 
                textAlign: 'center', 
                p: 1, 
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': { 
                  transform: 'translateY(-2px)', 
                  boxShadow: `0 4px 12px ${alpha(theme.palette.secondary.main, 0.2)}`
                }
              }} onClick={() => navigate('/app/certificates')}>
                <EmojiEvents sx={{ fontSize: 24, color: 'secondary.main', mb: 0.5 }} />
                <Typography variant="caption" fontWeight="bold" display="block" sx={{ fontSize: '0.75rem' }}>
                  Certificates
                </Typography>
              </Card>
            </Grid>

            <Grid item xs={6} sm={3} md={2}>
              <Card sx={{ 
                textAlign: 'center', 
                p: 1, 
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': { 
                  transform: 'translateY(-2px)', 
                  boxShadow: `0 4px 12px ${alpha(theme.palette.info.main, 0.2)}`
                }
              }} onClick={() => navigate('/app/smart-tests')}>
                <Code sx={{ fontSize: 24, color: 'info.main', mb: 0.5 }} />
                <Typography variant="caption" fontWeight="bold" display="block" sx={{ fontSize: '0.75rem' }}>
                  Smart Tests
                </Typography>
              </Card>
            </Grid>

            <Grid item xs={6} sm={3} md={2}>
              <Card sx={{ 
                textAlign: 'center', 
                p: 1, 
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': { 
                  transform: 'translateY(-2px)', 
                  boxShadow: `0 4px 12px ${alpha(theme.palette.success.main, 0.2)}`
                }
              }} onClick={() => navigate('/app/career-insights')}>
                <TrendingUp sx={{ fontSize: 24, color: 'success.main', mb: 0.5 }} />
                <Typography variant="caption" fontWeight="bold" display="block" sx={{ fontSize: '0.75rem' }}>
                  Career Insights
                </Typography>
              </Card>
            </Grid>

            <Grid item xs={6} sm={3} md={2}>
              <Card sx={{ 
                textAlign: 'center', 
                p: 1, 
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': { 
                  transform: 'translateY(-2px)', 
                  boxShadow: `0 4px 12px ${alpha(theme.palette.warning.main, 0.2)}`
                }
              }} onClick={() => navigate('/app/messages')}>
                <Email sx={{ fontSize: 24, color: 'warning.main', mb: 0.5 }} />
                <Typography variant="caption" fontWeight="bold" display="block" sx={{ fontSize: '0.75rem' }}>
                  Messaging
                </Typography>
              </Card>
            </Grid>

            <Grid item xs={6} sm={3} md={2}>
              <Card sx={{ 
                textAlign: 'center', 
                p: 1, 
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': { 
                  transform: 'translateY(-2px)', 
                  boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.2)}`
                }
              }} onClick={() => navigate('/companies')}>
                <Business sx={{ fontSize: 24, color: 'error.main', mb: 0.5 }} />
                <Typography variant="caption" fontWeight="bold" display="block" sx={{ fontSize: '0.75rem' }}>
                  Company Profiles
                </Typography>
              </Card>
            </Grid>
          </Grid>
        </Paper>

        {/* Category Tabs */}
        <Paper 
          sx={{ 
            mb: 2, 
            borderRadius: 4,
            background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.98)} 100%)`,
            backdropFilter: 'blur(20px)',
            boxShadow: '0 15px 35px rgba(0,0,0,0.08)',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            overflow: 'hidden',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 50%, ${theme.palette.info.main} 100%)`,
            }
          }}
        >
          <Box sx={{ p: 1.5 }}>
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 'bold',
                  background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: '1.1rem'
                }}
              >
                🎯 Browse by Category
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Find opportunities that match your interests
              </Typography>
            </Box>

            {/* Category Tabs for Mobile */}
            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
              <Tabs
                value={selectedCategory}
                onChange={(e, newValue) => setSelectedCategory(newValue)}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
                sx={{
                  '& .MuiTabs-flexContainer': {
                    gap: 1
                  },
                  '& .MuiTab-root': {
                    minWidth: 120,
                    borderRadius: 3,
                    margin: 0.5,
                    fontWeight: 600,
                    textTransform: 'none',
                    transition: 'all 0.3s ease',
                    '&.Mui-selected': {
                      background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
                      color: 'white',
                      transform: 'scale(1.05)'
                    }
                  }
                }}
              >
                {categories.map((category) => {
                  const jobCount = categoryCounts[category.key] || 0;
                  return (
                    <Tab
                      key={category.key}
                      value={category.key}
                      label={`${category.label} (${jobCount})`}
                      icon={category.icon}
                      iconPosition="start"
                    />
                  );
                })}
              </Tabs>
            </Box>

            {/* Category Cards for Desktop */}
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              <Grid container spacing={1.5}>
                {categories.map((category) => {
                  const isSelected = selectedCategory === category.key;
                  const jobCount = categoryCounts[category.key] || 0;
                  
                  return (
                    <Grid item xs={6} sm={4} md={2} key={category.key}>
                      <Card
                        sx={{
                          cursor: 'pointer',
                          textAlign: 'center',
                          p: 2,
                          height: '100%',
                          transition: 'all 0.3s ease',
                          border: isSelected 
                            ? `2px solid ${getThemeColor(category.color)}` 
                            : `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                          backgroundColor: isSelected 
                            ? alpha(getThemeColor(category.color), 0.05)
                            : 'background.paper',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: `0 8px 25px ${alpha(getThemeColor(category.color), 0.2)}`,
                            borderColor: getThemeColor(category.color)
                          }
                        }}
                        onClick={() => setSelectedCategory(category.key)}
                      >
                        <Box sx={{ 
                          color: isSelected ? getThemeColor(category.color) : 'text.secondary',
                          mb: 1.5,
                          fontSize: '2rem'
                        }}>
                          {category.icon}
                        </Box>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 600,
                            color: isSelected ? getThemeColor(category.color) : 'text.primary',
                            mb: 0.5,
                            fontSize: '0.85rem'
                          }}
                        >
                          {category.label}
                        </Typography>
                        <Chip
                          label={jobCount}
                          size="small"
                          sx={{
                            backgroundColor: isSelected 
                              ? alpha(getThemeColor(category.color), 0.2) 
                              : alpha(theme.palette.primary.main, 0.1),
                            color: isSelected ? getThemeColor(category.color) : 'primary.main',
                            fontWeight: 'bold',
                            fontSize: '0.7rem'
                          }}
                        />
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          </Box>
        </Paper>

        {/* Search and Filter Bar */}
        <Paper 
          sx={{ 
            p: 2, 
            mb: 3,
            borderRadius: 3,
            background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search jobs, companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: 'text.secondary', fontSize: '1.1rem' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'background.paper'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                placeholder="Location"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOn sx={{ color: 'text.secondary', fontSize: '1.1rem' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'background.paper'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={5}>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  onClick={handleSearch}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Search />}
                  sx={{ 
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600
                  }}
                >
                  {loading ? 'Searching...' : 'Search'}
                </Button>
                <IconButton
                  onClick={handleRefresh}
                  disabled={refreshing}
                  sx={{ borderRadius: 2 }}
                >
                  {refreshing ? (
                    <CircularProgress size={20} />
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
            <Grid container spacing={viewMode === 'grid' ? 2 : 3}>
              {filteredJobs.map((job) => (
                <Grid 
                  item 
                  xs={12} 
                  sm={viewMode === 'grid' ? 6 : 12}
                  md={viewMode === 'grid' ? 4 : 12}
                  lg={viewMode === 'grid' ? 3 : 12}
                  key={job._id}
                >
                  {viewMode === 'grid' ? (
                    // Grid View - Compact like HomePage
                    <Paper 
                      elevation={3} 
                      sx={{ 
                        p: 2.5, 
                        borderRadius: 3,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        position: 'relative',
                        '&:hover': {
                          transform: 'translateY(-5px)',
                          boxShadow: '0 12px 20px rgba(0,0,0,0.1)'
                        }
                      }}
                      onClick={() => handleViewJobDetails(job._id)}
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
                        mt: 1
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
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography 
                            variant="h6" 
                            fontWeight="bold" 
                            sx={{ 
                              fontSize: '1rem',
                              lineHeight: 1.3,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              wordBreak: 'break-word',
                              mb: 0.25
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
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}
                            title={job.company}
                          >
                            {job.company}
                          </Typography>
                        </Box>
                      </Box>
                      
                      {/* Job details */}
                      <Box sx={{ mb: 2, flex: 1 }}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          mb: 1
                        }}>
                          <LocationOn 
                            fontSize="small" 
                            color="action" 
                            sx={{ mr: 1, fontSize: '1rem' }} 
                          />
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ 
                              fontSize: '0.8rem',
                              display: '-webkit-box',
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}
                          >
                            {job.location}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          mb: 1
                        }}>
                          <Work 
                            fontSize="small" 
                            color="action" 
                            sx={{ mr: 1, fontSize: '1rem' }} 
                          />
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ fontSize: '0.8rem' }}
                          >
                            {job.jobType}
                          </Typography>
                        </Box>
                        
                        {job.salary && (
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            mb: 1
                          }}>
                            <AttachMoney 
                              fontSize="small" 
                              color="action" 
                              sx={{ mr: 1, fontSize: '1rem' }} 
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
                                overflow: 'hidden'
                              }}
                            >
                              {formatSalary(job.salary)}
                            </Typography>
                          </Box>
                        )}
                        
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          mb: 1
                        }}>
                          <AccessTime 
                            fontSize="small" 
                            color="action" 
                            sx={{ mr: 1, fontSize: '1rem' }} 
                          />
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ fontSize: '0.8rem' }}
                          >
                            {getDaysPosted(job.createdAt)}
                          </Typography>
                        </Box>
                      </Box>
                      
                      {/* Skills/tags */}
                      <Box sx={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: 0.5, 
                        mb: 2 
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
                              height: 22
                            }} 
                          />
                        ))}
                        {job.applicationDeadline && (
                          <Chip
                            label={formatDeadline(job.applicationDeadline)}
                            size="small"
                            color={getDeadlineColor(job.applicationDeadline)}
                            variant="filled"
                            sx={{ 
                              fontSize: '0.7rem', 
                              height: 22,
                              fontWeight: 500
                            }}
                          />
                        )}
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
                      onClick={() => handleViewJobDetails(job._id)}
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
                              <Chip
                                label={formatDeadline(job.applicationDeadline)}
                                size="small"
                                color={getDeadlineColor(job.applicationDeadline)}
                                variant="filled"
                              />
                            )}
                            
                            <Typography 
                              variant="caption" 
                              color="text.secondary"
                            >
                              {getDaysPosted(job.createdAt)}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  )}
                </Grid>
              ))}
            </Grid>

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
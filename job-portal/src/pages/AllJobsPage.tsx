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
  ContentCopy
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
  const [preparationDialogOpen, setPreparationDialogOpen] = useState(false);
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
    // If it's an external job, redirect to external URL
    if (job.isExternalJob && job.externalApplicationUrl) {
      window.open(job.externalApplicationUrl, '_blank');
      return;
    }
    
    // For internal jobs, redirect to the company website or default
    if (job.contactInfo?.website) {
      window.open(job.contactInfo.website, '_blank');
    } else {
      // Fallback to the job details page or default website
      window.open('https://jobs.excellencecoachinghub.com/', '_blank');
    }
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
      
      const response = await jobService.getJobs(filters, currentPage, 12);
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
            // Redirect to job portal website
            window.open('https://jobs.excellencecoachinghub.com/', '_blank');
          }}
          sx={{ flex: 1 }}
        >
          View Full Details
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
        {/* Hero Section */}
        <Box sx={{ 
          textAlign: 'center', 
          mb: 3, 
          pt: 2,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `radial-gradient(circle at 30% 20%, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 50%), 
                        radial-gradient(circle at 70% 80%, ${alpha(theme.palette.secondary.main, 0.1)} 0%, transparent 50%)`,
            zIndex: -1
          }
        }}>
          {/* Floating Elements */}
          <Box sx={{ 
            position: 'absolute',
            top: '10%',
            left: '10%',
            opacity: 0.1,
            animation: 'float 6s ease-in-out infinite',
            '@keyframes float': {
              '0%, 100%': { transform: 'translateY(0px)' },
              '50%': { transform: 'translateY(-20px)' }
            }
          }}>
            <Work sx={{ fontSize: 60, color: 'primary.main' }} />
          </Box>
          <Box sx={{ 
            position: 'absolute',
            top: '20%',
            right: '15%',
            opacity: 0.1,
            animation: 'float 8s ease-in-out infinite reverse',
            '@keyframes float': {
              '0%, 100%': { transform: 'translateY(0px)' },
              '50%': { transform: 'translateY(-20px)' }
            }
          }}>
            <TrendingUp sx={{ fontSize: 50, color: 'secondary.main' }} />
          </Box>
          <Box sx={{ 
            position: 'absolute',
            bottom: '10%',
            left: '20%',
            opacity: 0.1,
            animation: 'float 7s ease-in-out infinite',
            '@keyframes float': {
              '0%, 100%': { transform: 'translateY(0px)' },
              '50%': { transform: 'translateY(-20px)' }
            }
          }}>
            <Business sx={{ fontSize: 45, color: 'info.main' }} />
          </Box>

          <Typography 
            variant="h3" 
            component="h1" 
            sx={{ 
              fontWeight: 900,
              mb: 2,
              background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: { xs: '2.5rem', md: '3.5rem' },
              position: 'relative',
              zIndex: 1,
              textShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            🚀 Discover Your Next Career Opportunity
          </Typography>
          
          <Typography 
            variant="h5" 
            color="text.secondary" 
            sx={{ 
              mb: 2, 
              maxWidth: '900px', 
              mx: 'auto',
              fontWeight: 400,
              lineHeight: 1.6,
              fontSize: { xs: '1.1rem', md: '1.3rem' },
              position: 'relative',
              zIndex: 1
            }}
          >
            Explore <Box component="span" sx={{ fontWeight: 'bold', color: 'primary.main' }}>thousands of jobs</Box> from top companies across Africa. Build your professional network with our 
            <Box component="span" sx={{ fontWeight: 'bold', color: 'info.main' }}> community engagement</Box> features, access comprehensive 
            <Box component="span" sx={{ fontWeight: 'bold', color: 'warning.main' }}> job preparation services</Box> including psychometric tests, interview coaching, and skill assessments to increase your success rate by 
            <Box component="span" sx={{ fontWeight: 'bold', color: 'success.main' }}>300%</Box>.
          </Typography>
          
          {/* Key Features */}
          <Stack 
            direction={{ xs: 'column', md: 'row' }} 
            spacing={{ xs: 2, md: 4 }}
            justifyContent="center"
            sx={{ mb: 4, maxWidth: '1000px', mx: 'auto' }}
          >
            <Box sx={{ textAlign: 'center', flex: 1 }}>
              <People sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'info.main', mb: 1 }}>
                Community Networking
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Connect, engage & collaborate
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center', flex: 1 }}>
              <WorkspacePremium sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'warning.main', mb: 1 }}>
                Job Preparation Services
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tests, coaching & skill assessments
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center', flex: 1 }}>
              <TrendingUp sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main', mb: 1 }}>
                Career Growth
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Advanced tools for professional development
              </Typography>
            </Box>
          </Stack>

          {/* Stats Section */}
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={4} 
            justifyContent="center"
            sx={{ mb: 2 }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                {jobs.length || '1000+'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Jobs
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'secondary.main' }}>
                500+
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Companies
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                95%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Success Rate
              </Typography>
            </Box>
          </Stack>

          {/* Action Buttons */}
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={2} 
            justifyContent="center"
            sx={{ mb: 3 }}
          >
            <Button
              variant="contained"
              size="large"
              startIcon={<Groups />}
              onClick={() => navigate('/app/dashboard')}
              sx={{
                fontWeight: 700,
                borderRadius: 3,
                px: 3,
                py: 1.5,
                background: `linear-gradient(45deg, ${theme.palette.info.main} 30%, ${theme.palette.info.dark} 90%)`,
                boxShadow: '0 6px 20px ' + alpha(theme.palette.info.main, 0.4),
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px ' + alpha(theme.palette.info.main, 0.5)
                }
              }}
            >
              Join Community
            </Button>
            
            <Button
              variant="contained"
              size="large"
              startIcon={<WorkspacePremium />}
              onClick={() => navigate('/app/dashboard')}
              sx={{
                fontWeight: 700,
                borderRadius: 3,
                px: 3,
                py: 1.5,
                background: `linear-gradient(45deg, ${theme.palette.warning.main} 30%, ${theme.palette.warning.dark} 90%)`,
                boxShadow: '0 6px 20px ' + alpha(theme.palette.warning.main, 0.4),
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px ' + alpha(theme.palette.warning.main, 0.5)
                }
              }}
            >
              Prepare for Job
            </Button>

            <Button
              variant="contained"
              size="large"
              startIcon={<EmojiEvents />}
              onClick={() => navigate('/app/dashboard')}
              sx={{
                fontWeight: 700,
                borderRadius: 3,
                px: 3,
                py: 1.5,
                background: `linear-gradient(45deg, ${theme.palette.success.main} 30%, ${theme.palette.success.dark} 90%)`,
                boxShadow: '0 6px 20px ' + alpha(theme.palette.success.main, 0.4),
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px ' + alpha(theme.palette.success.main, 0.5)
                }
              }}
            >
              Career Success
            </Button>
          </Stack>

          {/* Start Searching Button */}
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Button
              variant="outlined"
              size="large"
              startIcon={<Search />}
              onClick={() => {
                const searchSection = document.getElementById('job-search-section');
                if (searchSection) {
                  searchSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              sx={{
                fontWeight: 700,
                borderRadius: 50,
                px: 6,
                py: 2,
                borderWidth: 2,
                background: alpha(theme.palette.primary.main, 0.05),
                backdropFilter: 'blur(10px)',
                '&:hover': {
                  borderWidth: 2,
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px ' + alpha(theme.palette.primary.main, 0.3),
                  background: alpha(theme.palette.primary.main, 0.1),
                }
              }}
            >
              🔍 Start Searching for Jobs
            </Button>
          </Box>
        </Box>

        {/* Modern Search Section */}
        <Paper
          id="job-search-section" 
          sx={{ 
            p: { xs: 3, md: 4 }, 
            mb: 3, 
            borderRadius: 6,
            background: `linear-gradient(135deg, 
              ${alpha(theme.palette.background.paper, 0.98)} 0%, 
              ${alpha(theme.palette.background.paper, 1)} 50%,
              ${alpha(theme.palette.primary.main, 0.02)} 100%
            )`,
            backdropFilter: 'blur(25px)',
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 24px 48px rgba(0, 0, 0, 0.4), 0 8px 16px rgba(0, 0, 0, 0.2)'
              : '0 24px 48px rgba(0, 0, 0, 0.12), 0 8px 16px rgba(0, 0, 0, 0.08)',
            border: `1px solid ${alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.2 : 0.1)}`,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 6,
              background: `linear-gradient(90deg, 
                ${theme.palette.primary.main} 0%, 
                ${theme.palette.secondary.main} 30%,
                ${theme.palette.info.main} 60%,
                ${theme.palette.success.main} 100%
              )`,
              boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.3)}`
            }
          }}
        >
          {/* Header Section */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{ 
              display: 'inline-flex',
              alignItems: 'center',
              gap: 2,
              mb: 3,
              p: 3,
              borderRadius: 6,
              background: `linear-gradient(135deg, 
                ${alpha(theme.palette.primary.main, 0.08)} 0%, 
                ${alpha(theme.palette.secondary.main, 0.05)} 100%
              )`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `radial-gradient(circle at 30% 30%, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 70%)`,
                pointerEvents: 'none'
              }
            }}>
              <Search sx={{ 
                fontSize: 36, 
                color: 'primary.main',
                filter: `drop-shadow(0 2px 4px ${alpha(theme.palette.primary.main, 0.3)})`,
                animation: 'pulse 2s ease-in-out infinite',
                '@keyframes pulse': {
                  '0%, 100%': { transform: 'scale(1)' },
                  '50%': { transform: 'scale(1.05)' }
                }
              }} />
              <Box>
                <Typography variant="h4" sx={{ 
                  fontWeight: 900, 
                  color: 'text.primary',
                  mb: 0.5,
                  fontSize: { xs: '1.5rem', md: '2rem' },
                  background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  Find Your Dream Job
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: 'text.secondary',
                  fontWeight: 500,
                  fontSize: '0.95rem'
                }}>
                  AI-powered job matching
                </Typography>
              </Box>
            </Box>
            <Typography variant="h6" color="text.secondary" sx={{ 
              maxWidth: 700, 
              mx: 'auto',
              lineHeight: 1.6,
              fontSize: { xs: '1rem', md: '1.1rem' },
              fontWeight: 400
            }}>
              Search through <Box component="span" sx={{ fontWeight: 700, color: 'primary.main' }}>10,000+</Box> curated 
              opportunities from <Box component="span" sx={{ fontWeight: 700, color: 'info.main' }}>500+</Box> leading 
              companies across Africa and beyond
            </Typography>
          </Box>
          
          {/* Search Form */}
          <Box sx={{ 
            background: alpha(theme.palette.background.paper, 0.5),
            p: 3,
            borderRadius: 4,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.05)'
          }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Job title, keywords, or company"
                  variant="outlined"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="e.g., Software Engineer, Marketing..."
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      backgroundColor: theme.palette.background.paper,
                      fontSize: '1rem',
                      '&:hover': {
                        boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`
                      },
                      '&.Mui-focused': {
                        boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.2)}`
                      }
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: '0.95rem',
                      fontWeight: 500
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ color: 'primary.main', fontSize: '1.2rem' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Location"
                  variant="outlined"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="City, country, or remote"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      backgroundColor: theme.palette.background.paper,
                      fontSize: '1rem',
                      '&:hover': {
                        boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`
                      },
                      '&.Mui-focused': {
                        boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.2)}`
                      }
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: '0.95rem',
                      fontWeight: 500
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOn sx={{ color: 'info.main', fontSize: '1.2rem' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={5}>
                <Stack direction="row" spacing={2}>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={handleSearch}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Search />}
                    sx={{ 
                      fontWeight: 700,
                      borderRadius: 3,
                      py: 2,
                      px: 4,
                      fontSize: '1rem',
                      textTransform: 'none',
                      background: `linear-gradient(45deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                      boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.5)}`,
                        background: `linear-gradient(45deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                      },
                      '&:disabled': {
                        transform: 'none',
                        boxShadow: 'none'
                      }
                    }}
                  >
                    {loading ? 'Searching...' : 'Search Jobs'}
                  </Button>
                  
                  <IconButton
                    onClick={refreshJobs}
                    disabled={refreshing}
                    sx={{
                      borderRadius: 3,
                      border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                      backgroundColor: alpha(theme.palette.primary.main, 0.05),
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        transform: 'rotate(180deg)',
                        transition: 'all 0.3s ease'
                      }
                    }}
                  >
                    {refreshing ? (
                      <CircularProgress size={20} color="primary" />
                    ) : (
                      <Refresh color="primary" />
                    )}
                  </IconButton>
                </Stack>
              </Grid>
            </Grid>

            {/* Quick Search Suggestions */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                Popular searches:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {['Remote Jobs', 'Software Engineer', 'Data Scientist', 'Marketing Manager', 'UI/UX Designer'].map((term) => (
                  <Chip
                    key={term}
                    label={term}
                    size="small"
                    clickable
                    onClick={() => {
                      setSearchTerm(term);
                      setTimeout(handleSearch, 100);
                    }}
                    sx={{
                      borderRadius: 2,
                      fontWeight: 500,
                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                      color: 'primary.main',
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.15),
                        transform: 'translateY(-1px)',
                        boxShadow: `0 4px 8px ${alpha(theme.palette.primary.main, 0.2)}`
                      }
                    }}
                  />
                ))}
              </Stack>
            </Box>
          </Box>
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
                  color: 'text.primary',
                  mb: 0.5
                }}
              >
                🗂️ Browse by Category
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Select a category to explore specific opportunities
              </Typography>
            </Box>

            {/* Responsive Tabs for Mobile */}
            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
              <Tabs
                value={selectedCategory}
                onChange={(_, value) => setSelectedCategory(value)}
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
                    <Grid item xs={12} sm={6} md={4} lg={3} xl={2} key={category.key}>
                      <Card
                        onClick={() => setSelectedCategory(category.key)}
                        sx={{
                          cursor: 'pointer',
                          borderRadius: 3,
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          border: isSelected 
                            ? `2px solid ${theme.palette.primary.main}` 
                            : `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                          background: isSelected
                            ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`
                            : 'transparent',
                          transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                          boxShadow: isSelected 
                            ? `0 8px 24px ${alpha(theme.palette.primary.main, 0.2)}`
                            : '0 2px 8px rgba(0,0,0,0.05)',
                          '&:hover': {
                            transform: 'scale(1.05)',
                            boxShadow: `0 12px 28px ${alpha(theme.palette.primary.main, 0.15)}`,
                            border: `2px solid ${alpha(theme.palette.primary.main, 0.5)}`
                          }
                        }}
                      >
                        <CardContent sx={{ p: 1.5, textAlign: 'center' }}>
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'center',
                              mb: 1,
                              color: isSelected ? theme.palette.primary.main : category.color,
                              transition: 'color 0.3s ease'
                            }}
                          >
                            {React.cloneElement(category.icon, { sx: { fontSize: 24 } })}
                          </Box>
                          
                          <Typography 
                            variant="subtitle2" 
                            sx={{ 
                              fontWeight: 'bold',
                              fontSize: '0.85rem',
                              mb: 0.5,
                              color: isSelected ? theme.palette.primary.main : 'text.primary'
                            }}
                          >
                            {category.label}
                          </Typography>
                          
                          <Chip
                            label={`${jobCount} ${jobCount === 1 ? 'opportunity' : 'opportunities'}`}
                            size="small"
                            variant={isSelected ? 'filled' : 'outlined'}
                            color={isSelected ? 'primary' : 'default'}
                            sx={{
                              fontWeight: 600,
                              fontSize: '0.7rem',
                              borderRadius: 2,
                              transition: 'all 0.3s ease'
                            }}
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>

            {/* Selected Category Info */}
            {selectedCategory !== 'all' && (
              <Fade in={true} timeout={500}>
                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <Paper 
                    sx={{ 
                      p: 2, 
                      backgroundColor: alpha(theme.palette.info.main, 0.05),
                      border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                      borderRadius: 3
                    }}
                  >
                    <Typography variant="body2" color="info.main" fontWeight="medium">
                      📊 Showing {filteredJobs.length} {selectedCategory} opportunities out of {jobs.length} total
                    </Typography>
                  </Paper>
                </Box>
              </Fade>
            )}
          </Box>
        </Paper>

        {/* Loading State */}
        {loading && (
          <Grid container spacing={3}>
            {Array.from(new Array(6)).map((_, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Skeleton variant="rectangular" height={40} sx={{ mb: 2, borderRadius: 1 }} />
                    <Skeleton variant="text" height={30} sx={{ mb: 1 }} />
                    <Skeleton variant="text" height={20} sx={{ mb: 2 }} />
                    <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                      <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 1 }} />
                      <Skeleton variant="rectangular" width={100} height={24} sx={{ borderRadius: 1 }} />
                    </Stack>
                    <Skeleton variant="rectangular" height={40} sx={{ borderRadius: 1 }} />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Modern Jobs Grid */}
        {!loading && filteredJobs.length > 0 && (
          <Grid 
            container 
            spacing={3}
            sx={{ 
              mt: 1,
              mb: 4,
              '& .MuiGrid-item': {
                display: 'flex'
              }
            }}
          >
            {displayJobs.map((job) => (
              <Grid item xs={12} sm={6} lg={4} key={job._id}>
                <Card
                  className="modern-job-card"
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 4,
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                    background: `linear-gradient(145deg, 
                      ${theme.palette.background.paper} 0%, 
                      ${alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.02 : 0.01)} 100%
                    )`,
                    boxShadow: theme.palette.mode === 'dark' 
                      ? '0 8px 32px rgba(0, 0, 0, 0.2), 0 2px 8px rgba(0, 0, 0, 0.1)'
                      : '0 8px 32px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.02)',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translateY(-12px) scale(1.02)',
                      boxShadow: theme.palette.mode === 'dark'
                        ? '0 24px 48px rgba(0, 0, 0, 0.4), 0 8px 16px rgba(0, 0, 0, 0.2)'
                        : '0 24px 48px rgba(0, 0, 0, 0.12), 0 8px 16px rgba(0, 0, 0, 0.06)',
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                      '& .job-card-gradient': {
                        opacity: 1,
                        transform: 'translateX(0%)'
                      },
                      '& .job-card-actions': {
                        transform: 'translateY(0px)',
                        opacity: 1
                      },
                      '& .job-card-avatar': {
                        transform: 'scale(1.1) rotate(5deg)',
                        boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`
                      }
                    }
                  }}
                >
                  {/* Gradient Overlay */}
                  <Box
                    className="job-card-gradient"
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: `linear-gradient(135deg, 
                        ${alpha(theme.palette.primary.main, 0.05)} 0%, 
                        ${alpha(theme.palette.secondary.main, 0.03)} 100%
                      )`,
                      opacity: 0,
                      transform: 'translateX(-100%)',
                      transition: 'all 0.6s ease',
                      zIndex: 0
                    }}
                  />

                  {/* Status Badges */}
                  <Box sx={{ 
                    position: 'absolute', 
                    top: 16, 
                    right: 16, 
                    zIndex: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1
                  }}>
                    {isJobNew(job.createdAt) && (
                      <Chip
                        label="NEW"
                        size="small"
                        icon={<FiberNew sx={{ fontSize: 16 }} />}
                        sx={{ 
                          fontWeight: 700,
                          fontSize: '0.7rem',
                          height: 24,
                          backgroundColor: theme.palette.success.main,
                          color: 'white',
                          boxShadow: `0 4px 12px ${alpha(theme.palette.success.main, 0.4)}`,
                          '& .MuiChip-icon': { color: 'white' }
                        }}
                      />
                    )}
                    {isJobUrgent(job.applicationDeadline) && (
                      <Chip
                        label="URGENT"
                        size="small"
                        icon={<AccessTime sx={{ fontSize: 16 }} />}
                        sx={{ 
                          fontWeight: 700,
                          fontSize: '0.7rem',
                          height: 24,
                          backgroundColor: theme.palette.error.main,
                          color: 'white',
                          boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.4)}`,
                          animation: 'pulse 2s ease-in-out infinite',
                          '& .MuiChip-icon': { color: 'white' },
                          '@keyframes pulse': {
                            '0%, 100%': { transform: 'scale(1)' },
                            '50%': { transform: 'scale(1.05)' }
                          }
                        }}
                      />
                    )}
                  </Box>

                  {/* Bookmark Button */}
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBookmark(job._id);
                    }}
                    sx={{
                      position: 'absolute',
                      top: 16,
                      left: 16,
                      zIndex: 2,
                      backgroundColor: alpha(theme.palette.background.paper, 0.9),
                      backdropFilter: 'blur(10px)',
                      color: bookmarkedJobs.has(job._id) ? 'warning.main' : 'text.secondary',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.background.paper, 1),
                        color: 'warning.main',
                        transform: 'scale(1.1)'
                      }
                    }}
                  >
                    {bookmarkedJobs.has(job._id) ? <Star /> : <StarBorder />}
                  </IconButton>

                  {/* Main Content */}
                  <CardContent sx={{ p: 0, flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
                    {/* Header Section */}
                    <Box sx={{ p: 3, pb: 2 }}>
                      <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ mb: 2 }}>
                        <Avatar
                          className="job-card-avatar"
                          sx={{ 
                            width: 64, 
                            height: 64, 
                            background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.primary.main, 0.1)} 100%)`,
                            border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                            boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.15)}`,
                            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                            backdropFilter: 'blur(10px)'
                          }}
                        >
                          <Work sx={{ 
                            fontSize: 28, 
                            color: 'primary.main',
                            filter: `drop-shadow(0 2px 4px ${alpha(theme.palette.primary.main, 0.2)})`
                          }} />
                        </Avatar>
                        
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography 
                            variant="h6" 
                            onClick={() => handleViewJobDetails(job._id)}
                            sx={{ 
                              fontWeight: 800, 
                              mb: 1,
                              fontSize: '1.2rem',
                              lineHeight: 1.3,
                              color: 'text.primary',
                              cursor: 'pointer',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              height: '3.2rem',
                              transition: 'color 0.2s ease',
                              '&:hover': {
                                color: 'primary.main'
                              }
                            }}
                          >
                            {job.title}
                          </Typography>
                          
                          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                            <Business sx={{ fontSize: 18, color: 'text.secondary' }} />
                            <Typography 
                              variant="subtitle1" 
                              color="text.secondary" 
                              sx={{ 
                                fontWeight: 600,
                                fontSize: '0.95rem',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                flex: 1
                              }}
                            >
                              {job.company}
                            </Typography>
                          </Stack>
                          
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <LocationOn sx={{ fontSize: 18, color: 'info.main' }} />
                            <Typography 
                              variant="body2" 
                              color="text.secondary"
                              sx={{
                                fontWeight: 500,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                flex: 1
                              }}
                            >
                              {job.location}
                            </Typography>
                          </Stack>
                        </Box>
                      </Stack>

                      {/* Job Type & Posted Time */}
                      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                        <Chip
                          label={job.jobType || 'Full-time'}
                          size="small"
                          variant="outlined"
                          sx={{
                            borderRadius: 2,
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            borderColor: alpha(theme.palette.primary.main, 0.3),
                            color: 'primary.main',
                            backgroundColor: alpha(theme.palette.primary.main, 0.05)
                          }}
                        />
                        <Chip
                          label={getDaysPosted(job.createdAt)}
                          size="small"
                          variant="outlined"
                          sx={{
                            borderRadius: 2,
                            fontWeight: 500,
                            fontSize: '0.75rem',
                            borderColor: alpha(theme.palette.text.secondary, 0.3),
                            color: 'text.secondary'
                          }}
                        />
                      </Stack>

                      {/* Deadline Alert - Moved to top */}
                      {job.applicationDeadline && (
                        <Box sx={{ mb: 2 }}>
                          <Alert 
                            severity={getDeadlineColor(job.applicationDeadline) as any}
                            icon={<AccessTime />}
                            sx={{ 
                              borderRadius: 3,
                              fontSize: '0.75rem',
                              py: 0.8,
                              fontWeight: 700,
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                              '& .MuiAlert-message': {
                                fontSize: '0.75rem',
                                fontWeight: 700
                              }
                            }}
                          >
                            ⏰ Deadline: {formatDeadline(job.applicationDeadline)}
                          </Alert>
                        </Box>
                      )}

                      {/* Job Description Preview */}
                      <Box sx={{ mb: 2 }}>
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ 
                            lineHeight: 1.6,
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            height: '4.8rem'
                          }}
                        >
                          {job.description || 'Join our team and take your career to the next level with exciting challenges and growth opportunities.'}
                        </Typography>
                      </Box>

                      {/* Skills Section */}
                      {job.skills && job.skills.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontWeight: 600 }}>
                            Skills Required:
                          </Typography>
                          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ maxHeight: '48px', overflow: 'hidden' }}>
                            {job.skills.slice(0, 3).map((skill, index) => (
                              <Chip
                                key={index}
                                label={skill}
                                size="small"
                                sx={{ 
                                  fontSize: '0.7rem',
                                  height: 22,
                                  borderRadius: 3,
                                  backgroundColor: alpha(theme.palette.info.main, 0.08),
                                  color: 'info.main',
                                  fontWeight: 500,
                                  border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
                                }}
                              />
                            ))}
                            {job.skills.length > 3 && (
                              <Chip
                                label={`+${job.skills.length - 3}`}
                                size="small"
                                sx={{ 
                                  fontSize: '0.7rem',
                                  height: 22,
                                  borderRadius: 3,
                                  backgroundColor: alpha(theme.palette.text.secondary, 0.08),
                                  color: 'text.secondary',
                                  fontWeight: 500
                                }}
                              />
                            )}
                          </Stack>
                        </Box>
                      )}

                      {/* Job Stats & Salary */}
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AttachMoney sx={{ fontSize: 18, color: 'success.main' }} />
                          <Typography 
                            variant="body2" 
                            fontWeight="700"
                            color="success.main"
                            sx={{ fontSize: '0.9rem' }}
                          >
                            {formatSalary(job.salary)}
                          </Typography>
                        </Box>
                        
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Tooltip title="Total applicants">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <People sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary" fontWeight="600">
                                {job.applicationsCount || 0}
                              </Typography>
                            </Box>
                          </Tooltip>
                        </Stack>
                      </Stack>


                    </Box>

                    {/* External Job Indicator */}
                    {job.isExternalJob && job.externalJobSource && (
                      <Box sx={{ mb: 2 }}>
                        <Chip
                          label={`via ${job.externalJobSource}`}
                          size="small"
                          icon={<Language />}
                          sx={{ 
                            fontWeight: 500,
                            borderRadius: 3,
                            backgroundColor: alpha(theme.palette.info.main, 0.08),
                            color: 'info.main',
                            border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                            fontSize: '0.7rem'
                          }}
                        />
                      </Box>
                    )}

                    {/* Spacer for pushing actions to bottom */}
                    <Box sx={{ flex: 1 }} />

                    {/* Action Buttons */}
                    <Box
                      className="job-card-actions"
                      sx={{
                        mt: 'auto',
                        pt: 2,
                        transform: 'translateY(8px)',
                        opacity: 0.7,
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <Stack spacing={1.5}>
                        {/* Get Prepared Button - Now Prominent */}
                        <Button
                          variant="contained"
                          fullWidth
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGetPrepared(job);
                          }}
                          startIcon={<Assignment />}
                          sx={{
                            fontWeight: 700,
                            borderRadius: 3,
                            py: 1.2,
                            px: 3,
                            fontSize: '0.9rem',
                            textTransform: 'none',
                            background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
                            boxShadow: `0 6px 20px ${alpha(theme.palette.warning.main, 0.3)}`,
                            color: 'white',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: `0 8px 25px ${alpha(theme.palette.warning.main, 0.4)}`,
                              background: `linear-gradient(135deg, ${theme.palette.warning.dark} 0%, ${theme.palette.warning.main} 100%)`,
                            }
                          }}
                        >
                          🎯 Get Prepared for This Job
                        </Button>

                        {/* View Details Button */}
                        <Button
                          variant="outlined"
                          fullWidth
                          onClick={() => handleViewFullDetails(job)}
                          startIcon={<ArrowForward />}
                          sx={{
                            fontWeight: 600,
                            borderRadius: 3,
                            py: 1.1,
                            px: 3,
                            fontSize: '0.85rem',
                            textTransform: 'none',
                            borderWidth: 1.5,
                            borderColor: alpha(theme.palette.primary.main, 0.4),
                            backgroundColor: alpha(theme.palette.primary.main, 0.05),
                            '&:hover': {
                              borderWidth: 1.5,
                              borderColor: theme.palette.primary.main,
                              backgroundColor: alpha(theme.palette.primary.main, 0.1),
                              transform: 'translateY(-1px)'
                            }
                          }}
                        >
                          {job.isExternalJob ? 'View on External Site' : 'View Job Details'}
                        </Button>

                        {/* Quick Actions */}
                        <Stack direction="row" spacing={1}>
                          
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              copyJobLink(job._id);
                            }}
                            sx={{
                              borderRadius: 3,
                              border: `1.5px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                              backgroundColor: alpha(theme.palette.primary.main, 0.05),
                              color: 'primary.main',
                              '&:hover': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                borderColor: theme.palette.primary.main,
                                transform: 'translateY(-1px)'
                              }
                            }}
                          >
                            <Send sx={{ fontSize: 18 }} />
                          </IconButton>

                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewJobDetails(job._id);
                            }}
                            sx={{
                              borderRadius: 3,
                              border: `1.5px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
                              backgroundColor: alpha(theme.palette.secondary.main, 0.05),
                              color: 'secondary.main',
                              '&:hover': {
                                backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                                borderColor: theme.palette.secondary.main,
                                transform: 'translateY(-1px)'
                              }
                            }}
                          >
                            <Visibility sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Stack>
                      </Stack>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Error State */}
        {error && (
          <Paper sx={{ 
            textAlign: 'center', 
            py: 8, 
            px: 4,
            borderRadius: 4,
            background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.05)} 0%, ${alpha(theme.palette.error.main, 0.02)} 100%)`,
            border: `1px solid ${alpha(theme.palette.error.main, 0.1)}`
          }}>
            <Box sx={{ 
              mb: 3,
              p: 3,
              borderRadius: '50%',
              background: alpha(theme.palette.error.main, 0.1),
              width: 80,
              height: 80,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto'
            }}>
              <Work sx={{ fontSize: 40, color: 'error.main' }} />
            </Box>
            <Typography variant="h5" color="error" gutterBottom sx={{ fontWeight: 'bold' }}>
              Oops! Something went wrong
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
              {error || 'We encountered an issue while loading the jobs. Please try again.'}
            </Typography>
            <Button 
              variant="contained" 
              color="error"
              size="large"
              onClick={() => window.location.reload()}
              sx={{ 
                fontWeight: 'bold',
                borderRadius: 3,
                px: 4,
                py: 1.5
              }}
            >
              Try Again
            </Button>
          </Paper>
        )}

        {/* No Jobs State */}
        {!loading && !error && jobs.length === 0 && (
          <Paper sx={{ 
            textAlign: 'center', 
            py: 10, 
            px: 4,
            borderRadius: 4,
            background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.03)} 100%)`,
            border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`
          }}>
            <Box sx={{ 
              mb: 4,
              p: 4,
              borderRadius: '50%',
              background: alpha(theme.palette.info.main, 0.1),
              width: 120,
              height: 120,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                inset: -10,
                borderRadius: '50%',
                background: `conic-gradient(from 180deg at 50% 50%, transparent 0deg, ${alpha(theme.palette.info.main, 0.1)} 180deg, transparent 360deg)`,
                animation: 'spin 3s linear infinite'
              },
              '@keyframes spin': {
                from: { transform: 'rotate(0deg)' },
                to: { transform: 'rotate(360deg)' }
              }
            }}>
              <Search sx={{ fontSize: 64, color: 'info.main' }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2, color: 'text.primary' }}>
              🔍 No Jobs Found
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              We couldn't find any jobs matching your criteria
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
              Try adjusting your search terms, location, or check back later for new opportunities. 
              Our job board is updated daily with fresh positions!
            </Typography>
            
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
              <Button
                variant="contained"
                startIcon={<Search />}
                onClick={() => {
                  setSearchTerm('');
                  setLocationFilter('');
                  handleSearch();
                }}
                sx={{ 
                  fontWeight: 'bold',
                  borderRadius: 3,
                  px: 4,
                  py: 1.2
                }}
              >
                Clear Filters
              </Button>
              <Button
                variant="outlined"
                startIcon={<Work />}
                onClick={() => navigate('/jobs')}
                sx={{ 
                  fontWeight: 'bold',
                  borderRadius: 3,
                  px: 4,
                  py: 1.2,
                  borderWidth: 2,
                  '&:hover': { borderWidth: 2 }
                }}
              >
                Browse All Jobs
              </Button>
            </Stack>
          </Paper>
        )}

        {/* Pagination */}
        {!loading && !error && jobs.length > 0 && totalPages > 1 && (
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

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={() => setSnackbarOpen(false)}
            severity="success"
            variant="filled"
            sx={{
              borderRadius: 2,
              fontWeight: 600
            }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Container>
      </Box>
    </>
  );
};

export default AllJobsPage;
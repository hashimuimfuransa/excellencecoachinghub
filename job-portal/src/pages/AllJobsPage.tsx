import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent,
  TextField, 
  InputAdornment, 
  Button, 
  Chip,
  Container,
  Paper,
  Stack,
  Grid,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  Divider,
  alpha,
  useTheme,
  useMediaQuery,
  AppBar,
  Toolbar,
  IconButton,
  Badge,
  Fab,
  Skeleton,
  Avatar,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Slider,
  Tooltip
} from '@mui/material';
import {
  Search,
  LocationOn,
  ViewModule,
  ViewList,
  Refresh,
  Work,
  Business,
  School,
  Code,
  TrendingUp,
  Science,
  Palette,
  LocalHospital,
  AttachMoney,
  Gavel,
  Public,
  FilterList,
  Sort,
  Bookmark,
  Share,
  KeyboardArrowUp,
  Category,
  Assignment,
  Engineering,
  DesignServices,
  Construction,
  AccountBalance,
  LocalShipping,
  Restaurant,
  Hotel,
  Star,
  BookmarkBorder,
  AccessTime,
  Event,
  ArrowForward,
  PostAdd,
  PersonAdd,
  Home,
  Computer,
  Clear,
  Tune,
  Schedule,
  FilterAlt,
  Psychology
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import FloatingChatButton from '../components/chat/FloatingChatButton';
import FloatingContact from '../components/FloatingContact';
import Navbar from '../components/Navbar';
import jobService from '../services/jobService';

// Use the Job interface from the service to ensure compatibility
interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string[];
  benefits: string[];
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  jobType: string; // This will be more flexible to match service
  category?: string;
  skills?: string[];
  skillsRequired?: string[];
  experience?: string;
  experienceLevel?: string;
  educationLevel?: string;
  remote?: boolean;
  urgent?: boolean;
  featured?: boolean;
  applicationDeadline?: string | Date;
  companyLogo?: string;
  companySize?: string;
  companyIndustry?: string;
  companyWebsite?: string;
  contactEmail?: string;
  jobLevel?: string;
  languages?: string[];
  certifications?: string[];
  applicationCount?: number;
  applicationsCount?: number;
  viewCount?: number;
  viewsCount?: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  employerId?: string;
  employer?: any;
  status: string;
  applicationUrl?: string;
  applicationInstructions?: string;
  isCurated?: boolean;
  relatedCourses?: any[];
  psychometricTests?: any[];
}

interface JobCategory {
  category: string;
  count: number;
  displayName: string;
}

type ViewMode = 'grid' | 'list';
type SortOption = 'date' | 'title' | 'company' | 'location';

// Icon mapping for different categories
const getCategoryIcon = (category: string) => {
  const categoryLower = category.toLowerCase();
  const iconMap: { [key: string]: React.ElementType } = {
    'technology': Code,
    'tech': Code,
    'it': Code,
    'design': Palette,
    'marketing': TrendingUp,
    'sales': AttachMoney,
    'finance': Business,
    'banking': AccountBalance,
    'healthcare': LocalHospital,
    'health': LocalHospital,
    'education': School,
    'teaching': School,
    'legal': Gavel,
    'law': Gavel,
    'consulting': Public,
    'science': Science,
    'research': Science,
    'engineering': Engineering,
    'construction': Construction,
    'logistics': LocalShipping,
    'transport': LocalShipping,
    'hospitality': Hotel,
    'restaurant': Restaurant,
    'food': Restaurant,
    'tender': Assignment,
    'procurement': Assignment,
    'government': AccountBalance,
    'public': AccountBalance,
    'service': DesignServices,
    'customer': DesignServices,
  };
  
  // Check for exact matches or partial matches
  for (const [key, icon] of Object.entries(iconMap)) {
    if (categoryLower.includes(key)) {
      return icon;
    }
  }
  
  return Work; // Default icon
};

const AllJobsPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [locationFilter, setLocationFilter] = useState(searchParams.get('location') || '');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [applicationDialogOpen, setApplicationDialogOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  // New filter states
  const [jobTypeFilter, setJobTypeFilter] = useState<string[]>([]);
  const [locationTypeFilter, setLocationTypeFilter] = useState<string[]>([]);
  const [salaryRange, setSalaryRange] = useState<number[]>([0, 200]);
  const [experienceFilter, setExperienceFilter] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch jobs
  const fetchJobs = async (refresh = false) => {
    if (refresh) {
      setError(null);
    }
    setLoading(true);
    
    try {
      // First, get a small batch to determine total count
      const initialResponse = await jobService.getJobs({}, 1, 10);
      const totalJobs = initialResponse.pagination?.total || 0;
      
      // Set a reasonable limit for fetching jobs to avoid performance issues
      const MAX_JOBS_TO_FETCH = 1000; // Reasonable limit to prevent UI lag
      const jobsToFetch = Math.min(totalJobs, MAX_JOBS_TO_FETCH);
      
      // If there are jobs and we have more than 10, fetch all jobs up to the limit
      if (totalJobs > 10) {
        const allJobsResponse = await jobService.getJobs({}, 1, jobsToFetch);
        setJobs(allJobsResponse.data || []);
        setFilteredJobs(allJobsResponse.data || []);
        
        // If we hit the limit, log a message
        if (totalJobs > MAX_JOBS_TO_FETCH) {
          console.log(`Showing first ${MAX_JOBS_TO_FETCH} out of ${totalJobs} total jobs for performance reasons`);
        }
      } else {
        // If 10 or fewer jobs, use the initial response
        setJobs(initialResponse.data || []);
        setFilteredJobs(initialResponse.data || []);
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Failed to load jobs. Please try again.');
      // Set empty arrays to prevent further errors
      setJobs([]);
      setFilteredJobs([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    setCategoriesLoading(true);
    try {
      const fetchedCategories = await jobService.getJobCategories();
      // Ensure categories is always an array
      setCategories(Array.isArray(fetchedCategories) ? fetchedCategories : []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      // Set some default categories if API fails
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchJobs(true);
    fetchCategories();
  };

  // Filter helper functions
  const handleJobTypeToggle = (type: string) => {
    setJobTypeFilter(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleLocationTypeToggle = (type: string) => {
    setLocationTypeFilter(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleExperienceToggle = (exp: string) => {
    setExperienceFilter(prev => 
      prev.includes(exp) 
        ? prev.filter(e => e !== exp)
        : [...prev, exp]
    );
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setLocationFilter('');
    setSelectedCategory('all');
    setJobTypeFilter([]);
    setLocationTypeFilter([]);
    setSalaryRange([0, 200]);
    setExperienceFilter([]);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (searchTerm.trim()) count++;
    if (locationFilter.trim()) count++;
    if (selectedCategory !== 'all') count++;
    if (jobTypeFilter.length > 0) count++;
    if (locationTypeFilter.length > 0) count++;
    if (salaryRange[0] > 0 || salaryRange[1] < 200) count++;
    if (experienceFilter.length > 0) count++;
    return count;
  };

  // Scroll to top handler
  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Monitor scroll position
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Set default view mode based on device type - mobile always uses list view
  useEffect(() => {
    if (isMobile) {
      setViewMode('list');
    } else {
      // Set grid as default for desktop
      setViewMode('grid');
    }
  }, [isMobile]);

  useEffect(() => {
    fetchJobs();
    fetchCategories();
  }, []);

  // Note: We no longer redirect logged-in users automatically
  // This allows logged-in users to browse all jobs if they want to

  // Filter jobs based on search criteria
  useEffect(() => {
    let filtered = jobs;

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(job => 
        job.category && job.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Search term filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(search) ||
        job.company.toLowerCase().includes(search) ||
        job.description.toLowerCase().includes(search) ||
        (job.skillsRequired && job.skillsRequired.some(skill => skill.toLowerCase().includes(search))) ||
        (job.skills && job.skills.some(skill => skill.toLowerCase().includes(search)))
      );
    }

    // Location filter
    if (locationFilter.trim()) {
      const location = locationFilter.toLowerCase();
      filtered = filtered.filter(job =>
        job.location.toLowerCase().includes(location)
      );
    }

    // Job type filter (Full-time, Part-time, etc.)
    if (jobTypeFilter.length > 0) {
      filtered = filtered.filter(job =>
        jobTypeFilter.includes(job.jobType?.toLowerCase() || 'full-time')
      );
    }

    // Location type filter (Remote, On-site, Hybrid)
    if (locationTypeFilter.length > 0) {
      filtered = filtered.filter(job => {
        if (locationTypeFilter.includes('remote') && job.remote) return true;
        if (locationTypeFilter.includes('on-site') && !job.remote) return true;
        if (locationTypeFilter.includes('hybrid') && job.location?.toLowerCase().includes('hybrid')) return true;
        return false;
      });
    }

    // Salary range filter
    if (salaryRange[0] > 0 || salaryRange[1] < 200) {
      filtered = filtered.filter(job => {
        if (!job.salary) return salaryRange[0] === 0; // Include jobs without salary if min is 0
        const jobMin = job.salary.min || 0;
        const jobMax = job.salary.max || jobMin;
        return jobMax >= salaryRange[0] && jobMin <= salaryRange[1];
      });
    }

    // Experience filter
    if (experienceFilter.length > 0) {
      filtered = filtered.filter(job =>
        experienceFilter.some(exp =>
          job.experienceLevel?.toLowerCase().includes(exp) ||
          job.experience?.toLowerCase().includes(exp)
        )
      );
    }

    setFilteredJobs(filtered);
  }, [jobs, searchTerm, locationFilter, selectedCategory, jobTypeFilter, locationTypeFilter, salaryRange, experienceFilter]);

  // Sort jobs
  const sortJobs = (jobsToSort: Job[]) => {
    return [...jobsToSort].sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'company':
          return a.company.localeCompare(b.company);
        case 'location':
          return a.location.localeCompare(b.location);
        case 'date':
        default:
          // Handle both string and Date types for createdAt
          const dateA = typeof a.createdAt === 'string' ? new Date(a.createdAt) : a.createdAt;
          const dateB = typeof b.createdAt === 'string' ? new Date(b.createdAt) : b.createdAt;
          return dateB.getTime() - dateA.getTime();
      }
    });
  };

  const displayJobs = sortJobs(filteredJobs);

  const ApplicationDialog = () => (
    <Dialog
      open={applicationDialogOpen}
      onClose={() => setApplicationDialogOpen(false)}
      maxWidth="md"
      fullWidth
    >
      {/* Application dialog content would go here */}
    </Dialog>
  );

  // Sidebar component
  const FilterSidebar = () => (
    <Paper 
      elevation={2}
      sx={{ 
        height: 'fit-content',
        p: { xs: 2, md: 3 },
        borderRadius: 3,
        position: { xs: 'static', md: 'sticky' },
        top: { xs: 'auto', md: 20 },
        maxHeight: { xs: 'none', md: 'calc(100vh - 40px)' },
        overflowY: { xs: 'visible', md: 'auto' }
      }}
    >
      {/* Filter Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: { xs: 2, md: 3 },
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 1, sm: 0 }
      }}>
        <Typography 
          variant={isMobile ? 'subtitle1' : 'h6'}
          fontWeight="bold" 
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            fontSize: { xs: '1rem', md: '1.25rem' }
          }}
        >
          <FilterAlt sx={{ mr: 1, color: 'primary.main', fontSize: { xs: '1.2rem', md: '1.5rem' } }} />
          Filters
        </Typography>
        {getActiveFiltersCount() > 0 && (
          <Button
            size={isMobile ? 'small' : 'medium'}
            onClick={clearAllFilters}
            startIcon={<Clear fontSize={isMobile ? 'small' : 'medium'} />}
            sx={{ 
              color: 'error.main',
              fontSize: { xs: '0.75rem', md: '0.875rem' },
              '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.1) }
            }}
          >
            Clear ({getActiveFiltersCount()})
          </Button>
        )}
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Location Type Filter - Remote/On-site */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" fontWeight="600" gutterBottom sx={{ color: 'text.primary', mb: 2 }}>
          Work Location
        </Typography>
        <FormGroup>
          {[
            { value: 'remote', label: 'Remote', icon: Computer },
            { value: 'on-site', label: 'On-site', icon: Home },
            { value: 'hybrid', label: 'Hybrid', icon: Work }
          ].map((type) => (
            <FormControlLabel
              key={type.value}
              control={
                <Checkbox
                  checked={locationTypeFilter.includes(type.value)}
                  onChange={() => handleLocationTypeToggle(type.value)}
                  size="small"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <type.icon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  {type.label}
                </Box>
              }
              sx={{ mb: 0.5 }}
            />
          ))}
        </FormGroup>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Job Type Filter */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" fontWeight="600" gutterBottom sx={{ color: 'text.primary', mb: 2 }}>
          Employment Type
        </Typography>
        <FormGroup>
          {[
            'full-time',
            'part-time', 
            'contract',
            'freelance',
            'internship'
          ].map((type) => (
            <FormControlLabel
              key={type}
              control={
                <Checkbox
                  checked={jobTypeFilter.includes(type)}
                  onChange={() => handleJobTypeToggle(type)}
                  size="small"
                />
              }
              label={type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
              sx={{ mb: 0.5 }}
            />
          ))}
        </FormGroup>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Salary Range Filter */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" fontWeight="600" gutterBottom sx={{ color: 'text.primary', mb: 2 }}>
          Salary Range (K USD)
        </Typography>
        <Box sx={{ px: 1 }}>
          <Slider
            value={salaryRange}
            onChange={(_, newValue) => setSalaryRange(newValue as number[])}
            valueLabelDisplay="auto"
            min={0}
            max={200}
            step={10}
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'text.secondary' }}>
            <span>${salaryRange[0]}k</span>
            <span>${salaryRange[1]}k</span>
          </Box>
        </Box>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Experience Level Filter */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" fontWeight="600" gutterBottom sx={{ color: 'text.primary', mb: 2 }}>
          Experience Level
        </Typography>
        <FormGroup>
          {[
            'entry',
            'junior',
            'mid',
            'senior',
            'lead'
          ].map((exp) => (
            <FormControlLabel
              key={exp}
              control={
                <Checkbox
                  checked={experienceFilter.includes(exp)}
                  onChange={() => handleExperienceToggle(exp)}
                  size="small"
                />
              }
              label={exp.charAt(0).toUpperCase() + exp.slice(1) + ' Level'}
              sx={{ mb: 0.5 }}
            />
          ))}
        </FormGroup>
      </Box>
    </Paper>
  );

  return (
    <>
      {/* Navigation Bar - Only show for non-authenticated users */}
      {!user && <Navbar />}
      
      {/* Mobile Filter Drawer */}
      <Drawer
        anchor="left"
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        sx={{ display: { xs: 'block', md: 'none' } }}
        PaperProps={{
          sx: {
            width: { xs: '90vw', sm: '380px' },
            maxWidth: { xs: '90vw', sm: '380px' }
          }
        }}
        ModalProps={{
          keepMounted: true, // Better mobile performance
        }}
      >
        <Box sx={{ p: { xs: 1.5, sm: 2 }, height: '100%', overflowY: 'auto' }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: { xs: 1.5, sm: 2 },
            position: 'sticky',
            top: 0,
            bgcolor: 'background.paper',
            zIndex: 1,
            py: 1
          }}>
            <Typography variant={isMobile ? "subtitle1" : "h6"} fontWeight="bold">
              Filter Jobs
            </Typography>
            <IconButton onClick={() => setSidebarOpen(false)} size="small">
              <Clear fontSize="small" />
            </IconButton>
          </Box>
          <FilterSidebar />
        </Box>
      </Drawer>

      <Box sx={{ 
        minHeight: '100vh', 
        backgroundColor: 'background.default'
      }}>
        {/* Hero Section */}
        <Box sx={{
          minHeight: { xs: '35vh', sm: '40vh', md: '50vh' },
          background: 'linear-gradient(135deg, #4ade80 0%, #16a34a 50%, #14532d 100%)',
          position: 'relative',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          py: { xs: 2, sm: 3, md: 6 },
          px: { xs: 1, sm: 2, md: 0 },
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 40% 80%, rgba(120, 219, 226, 0.3) 0%, transparent 50%)
            `,
            zIndex: 0,
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'url("/find job.jpg")',
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.1,
            zIndex: 0,
          }
        }}>
          <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1, px: { xs: 2, md: 3 } }}>
            <Box sx={{ textAlign: 'center', mb: { xs: 3, md: 4 } }}>
              <Typography
                variant={isMobile ? 'h4' : 'h3'}
                fontWeight="bold"
                sx={{
                  mb: { xs: 1.5, sm: 2 },
                  color: 'white',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  fontSize: { xs: '1.5rem', sm: '2.2rem', md: '3rem' },
                  textAlign: 'center'
                }}
              >
                Find Your Dream Career
              </Typography>
              <Typography
                variant={isMobile ? 'body1' : 'h6'}
                sx={{
                  mb: { xs: 1.5, sm: 2, md: 3 },
                  maxWidth: { xs: '90%', sm: '500px', md: '600px' },
                  mx: 'auto',
                  fontSize: { xs: '0.85rem', sm: '1rem', md: '1.25rem' },
                  color: 'rgba(255,255,255,0.9)',
                  textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                  lineHeight: { xs: 1.3, md: 1.5 },
                  textAlign: 'center',
                  px: { xs: 1, sm: 0 }
                }}
              >
                Discover thousands of opportunities from top companies worldwide
              </Typography>
              
              {/* Quick Action Buttons */}
              <Grid container spacing={{ xs: 1, sm: 1.5, md: 2 }} sx={{ justifyContent: 'center', mb: { xs: 0.5, sm: 1, md: 2 }, px: { xs: 1, sm: 0 } }}>
                <Grid item xs={6} sm={4} md={2}>
                  <Button
                    fullWidth
                    variant="contained"
                    size={isMobile ? 'small' : 'large'}
                    onClick={() => user ? navigate('/jobs/ai-matches') : navigate('/login')}
                    sx={{
                      py: { xs: 1, sm: 1.5, md: 2 },
                      borderRadius: { xs: 2, md: 4 },
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
                      minHeight: { xs: '70px', sm: '80px', md: 'auto' },
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 12px 40px rgba(102, 126, 234, 0.4)',
                      },
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                    startIcon={<Psychology sx={{ fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' } }} />}
                  >
                    <Box>
                      <Typography 
                        variant="button" 
                        fontWeight="bold"
                        sx={{ 
                          fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' },
                          lineHeight: 1.2
                        }}
                      >
                        AI Job Match
                      </Typography>
                      <Typography 
                        variant="caption" 
                        display="block" 
                        sx={{ 
                          opacity: 0.9,
                          fontSize: { xs: '0.55rem', sm: '0.65rem', md: '0.75rem' },
                          lineHeight: 1.1
                        }}
                      >
                        Personalized matches
                      </Typography>
                    </Box>
                  </Button>
                </Grid>
                
                <Grid item xs={6} sm={4} md={2}>
                  <Button
                    fullWidth
                    variant="contained"
                    size={isMobile ? 'small' : 'large'}
                    onClick={() => user ? navigate('/cv-builder') : navigate('/login')}
                    sx={{
                      py: { xs: 1, sm: 1.5, md: 2 },
                      borderRadius: { xs: 2, md: 4 },
                      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                      boxShadow: '0 8px 32px rgba(245, 87, 108, 0.3)',
                      minHeight: { xs: '70px', sm: '80px', md: 'auto' },
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 12px 40px rgba(245, 87, 108, 0.4)',
                      },
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                    startIcon={<Assignment sx={{ fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' } }} />}
                  >
                    <Box>
                      <Typography 
                        variant="button" 
                        fontWeight="bold"
                        sx={{ 
                          fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' },
                          lineHeight: 1.2
                        }}
                      >
                        CV Builder
                      </Typography>
                      <Typography 
                        variant="caption" 
                        display="block" 
                        sx={{ 
                          opacity: 0.9,
                          fontSize: { xs: '0.55rem', sm: '0.65rem', md: '0.75rem' },
                          lineHeight: 1.1
                        }}
                      >
                        Create perfect resume
                      </Typography>
                    </Box>
                  </Button>
                </Grid>

                <Grid item xs={6} sm={4} md={2}>
                  <Button
                    fullWidth
                    variant="contained"
                    size={isMobile ? 'small' : 'large'}
                    onClick={() => user ? navigate('/app/network') : navigate('/login')}
                    sx={{
                      py: { xs: 1, sm: 1.5, md: 2 },
                      borderRadius: { xs: 2, md: 4 },
                      background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                      boxShadow: '0 8px 32px rgba(79, 172, 254, 0.3)',
                      minHeight: { xs: '70px', sm: '80px', md: 'auto' },
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 12px 40px rgba(79, 172, 254, 0.4)',
                      },
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                    startIcon={<PersonAdd sx={{ fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' } }} />}
                  >
                    <Box>
                      <Typography 
                        variant="button" 
                        fontWeight="bold"
                        sx={{ 
                          fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' },
                          lineHeight: 1.2
                        }}
                      >
                        Network
                      </Typography>
                      <Typography 
                        variant="caption" 
                        display="block" 
                        sx={{ 
                          opacity: 0.9,
                          fontSize: { xs: '0.55rem', sm: '0.65rem', md: '0.75rem' },
                          lineHeight: 1.1
                        }}
                      >
                        Connect & grow
                      </Typography>
                    </Box>
                  </Button>
                </Grid>

                <Grid item xs={6} sm={4} md={2}>
                  <Button
                    fullWidth
                    variant="contained"
                    size={isMobile ? 'small' : 'large'}
                    onClick={() => navigate('/register?role=employer')}
                    sx={{
                      py: { xs: 1, sm: 1.5, md: 2 },
                      borderRadius: { xs: 2, md: 4 },
                      background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                      boxShadow: '0 8px 32px rgba(250, 112, 154, 0.3)',
                      minHeight: { xs: '70px', sm: '80px', md: 'auto' },
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 12px 40px rgba(250, 112, 154, 0.4)',
                      },
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                    startIcon={<PostAdd sx={{ fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' } }} />}
                  >
                    <Box>
                      <Typography 
                        variant="button" 
                        fontWeight="bold"
                        sx={{ 
                          fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' },
                          lineHeight: 1.2
                        }}
                      >
                        Post Jobs
                      </Typography>
                      <Typography 
                        variant="caption" 
                        display="block" 
                        sx={{ 
                          opacity: 0.9,
                          fontSize: { xs: '0.55rem', sm: '0.65rem', md: '0.75rem' },
                          lineHeight: 1.1
                        }}
                      >
                        Hire top talent
                      </Typography>
                    </Box>
                  </Button>
                </Grid>

                <Grid item xs={6} sm={4} md={2}>
                  <Button
                    fullWidth
                    variant="contained"
                    size={isMobile ? 'small' : 'large'}
                    onClick={() => user ? navigate('/career-guidance') : navigate('/login')}
                    sx={{
                      py: { xs: 1, sm: 1.5, md: 2 },
                      borderRadius: { xs: 2, md: 4 },
                      background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                      boxShadow: '0 8px 32px rgba(67, 233, 123, 0.3)',
                      minHeight: { xs: '70px', sm: '80px', md: 'auto' },
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 12px 40px rgba(67, 233, 123, 0.4)',
                      },
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                    startIcon={<School sx={{ fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' } }} />}
                  >
                    <Box>
                      <Typography 
                        variant="button" 
                        fontWeight="bold"
                        sx={{ 
                          fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' },
                          lineHeight: 1.2
                        }}
                      >
                        Career Guide
                      </Typography>
                      <Typography 
                        variant="caption" 
                        display="block" 
                        sx={{ 
                          opacity: 0.9,
                          fontSize: { xs: '0.55rem', sm: '0.65rem', md: '0.75rem' },
                          lineHeight: 1.1
                        }}
                      >
                        Expert guidance
                      </Typography>
                    </Box>
                  </Button>
                </Grid>

                <Grid item xs={6} sm={4} md={2}>
                  <Button
                    fullWidth
                    variant="contained"
                    size={isMobile ? 'small' : 'large'}
                    onClick={() => user ? navigate('/exam-preparation') : navigate('/login')}
                    sx={{
                      py: { xs: 1, sm: 1.5, md: 2 },
                      borderRadius: { xs: 2, md: 4 },
                      background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                      boxShadow: '0 8px 32px rgba(168, 237, 234, 0.3)',
                      minHeight: { xs: '70px', sm: '80px', md: 'auto' },
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 12px 40px rgba(168, 237, 234, 0.4)',
                      },
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                    startIcon={<Assignment sx={{ fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' } }} />}
                  >
                    <Box>
                      <Typography 
                        variant="button" 
                        fontWeight="bold"
                        sx={{ 
                          fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' },
                          lineHeight: 1.2
                        }}
                      >
                        Smart Exams
                      </Typography>
                      <Typography 
                        variant="caption" 
                        display="block" 
                        sx={{ 
                          opacity: 0.9,
                          fontSize: { xs: '0.55rem', sm: '0.65rem', md: '0.75rem' },
                          lineHeight: 1.1
                        }}
                      >
                        Exam preparation
                      </Typography>
                    </Box>
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Container>
        </Box>

        {/* Top Search Bar */}
        <Container maxWidth="xl" sx={{ pt: { xs: 1.5, sm: 2, md: 3 }, pb: { xs: 1.5, sm: 2, md: 3 }, px: { xs: 1, sm: 2, md: 3 } }}>
          <Paper 
            elevation={1}
            sx={{ 
              p: { xs: 1.5, sm: 2, md: 3 }, 
              borderRadius: { xs: 2, md: 3 },
              background: `linear-gradient(135deg, 
                ${alpha(theme.palette.primary.main, 0.02)} 0%, 
                ${alpha(theme.palette.background.paper, 1)} 100%)`,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
            }}
          >
            <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder={isMobile ? "Search jobs..." : "Search for jobs, companies, or skills..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search color="action" fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: { xs: 2, md: 3 },
                      fontSize: { xs: '0.85rem', md: '1rem' }
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  placeholder={isMobile ? "Location" : "Location..."}
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOn color="action" fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: { xs: 2, md: 3 },
                      fontSize: { xs: '0.85rem', md: '1rem' }
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    displayEmpty
                    sx={{ 
                      borderRadius: { xs: 2, md: 3 },
                      fontSize: { xs: '0.85rem', md: '1rem' }
                    }}
                  >
                    <MenuItem value="date" sx={{ fontSize: { xs: '0.85rem', md: '1rem' } }}>Latest</MenuItem>
                    <MenuItem value="title" sx={{ fontSize: { xs: '0.85rem', md: '1rem' } }}>Title</MenuItem>
                    <MenuItem value="company" sx={{ fontSize: { xs: '0.85rem', md: '1rem' } }}>Company</MenuItem>
                    <MenuItem value="location" sx={{ fontSize: { xs: '0.85rem', md: '1rem' } }}>Location</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <Stack 
                  direction={{ xs: 'column', sm: 'row' }} 
                  spacing={{ xs: 1, sm: 2 }}
                  sx={{ width: '100%' }}
                >
                  <Button
                    fullWidth={isMobile}
                    variant="outlined"
                    size="small"
                    startIcon={<Tune fontSize="small" />}
                    onClick={() => setSidebarOpen(true)}
                    sx={{ 
                      display: { xs: 'flex', md: 'none' },
                      borderRadius: { xs: 2, md: 3 },
                      fontSize: { xs: '0.8rem', md: '0.875rem' }
                    }}
                  >
                    Filters {getActiveFiltersCount() > 0 && `(${getActiveFiltersCount()})`}
                  </Button>
                  <Button
                    fullWidth={isMobile}
                    variant="contained"
                    size="small"
                    startIcon={<Refresh fontSize="small" />}
                    onClick={handleRefresh}
                    sx={{ 
                      borderRadius: { xs: 2, md: 3 },
                      fontSize: { xs: '0.8rem', md: '0.875rem' }
                    }}
                  >
                    Refresh
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </Paper>
        </Container>

        {/* Main Content with Sidebar Layout */}
        <Container maxWidth="xl" sx={{ pb: { xs: 2, sm: 3, md: 4 }, px: { xs: 0.5, sm: 1, md: 3 } }}>
          <Box sx={{ 
            display: 'flex', 
            gap: { xs: 1, sm: 2, md: 3 }, 
            alignItems: 'flex-start',
            flexDirection: { xs: 'column', md: 'row' }
          }}>
            {/* Sidebar - Desktop Only */}
            <Box sx={{ 
              width: { xs: '100%', md: '25%' },
              display: { xs: 'none', md: 'block' },
              position: 'sticky',
              top: 100,
              flexShrink: 0
            }}>
              <FilterSidebar />
            </Box>

            {/* Main Content Area */}
            <Box sx={{ 
              width: { xs: '100%', md: '75%' },
              flexGrow: 1,
              maxWidth: { xs: '100%', md: 'calc(100% - 300px)' },
              px: { xs: 0.5, sm: 1, md: 2 }
            }}>
              {/* Header with Results Count and View Toggle */}
              <Box sx={{ 
                mb: { xs: 2, md: 3 }, 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: { xs: 'flex-start', md: 'center' },
                flexDirection: { xs: 'column', md: 'row' },
                gap: { xs: 1.5, md: 2 }
              }}>
                <Box>
                  <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ fontWeight: 700, mb: 0.5 }}>
                    {loading ? 'Loading...' : `${filteredJobs.length} Jobs Found`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', md: '0.875rem' } }}>
                    {selectedCategory === 'all' 
                      ? 'Showing all available positions' 
                      : `Filtered by ${selectedCategory}`}
                  </Typography>
                </Box>
                
{!isMobile && (
                  <ToggleButtonGroup
                    value={viewMode}
                    exclusive
                    onChange={(e, newMode) => newMode && setViewMode(newMode)}
                    size="small"
                    sx={{
                      backgroundColor: alpha(theme.palette.background.paper, 0.8),
                      borderRadius: 3,
                      '& .MuiToggleButton-root': {
                        border: 'none',
                        borderRadius: 3,
                        px: { xs: 1.5, md: 2 },
                        py: { xs: 0.5, md: 1 },
                        '&.Mui-selected': {
                          backgroundColor: theme.palette.primary.main,
                          color: 'white',
                        }
                      }
                    }}
                  >
                    <ToggleButton value="grid">
                      <ViewModule />
                    </ToggleButton>
                    <ToggleButton value="list">
                      <ViewList />
                    </ToggleButton>
                  </ToggleButtonGroup>
                )}
              </Box>

              {/* Category Chips */}
              <Box sx={{ mb: { xs: 2, md: 3 } }}>
                <Box sx={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: { xs: 1, md: 1.5 },
                  alignItems: 'center',
                  overflowX: { xs: 'auto', md: 'visible' },
                  pb: { xs: 1, md: 0 },
                  '&::-webkit-scrollbar': {
                    height: 4,
                  },
                  '&::-webkit-scrollbar-track': {
                    backgroundColor: 'transparent',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.3),
                    borderRadius: 2,
                  }
                }}>
                  <Chip
                    label="All Jobs"
                    icon={React.createElement(Work)}
                    variant={selectedCategory === 'all' ? 'filled' : 'outlined'}
                    color={selectedCategory === 'all' ? 'primary' : 'default'}
                    onClick={() => setSelectedCategory('all')}
                    size={theme.breakpoints.down('md') ? 'small' : 'medium'}
                    sx={{ 
                      fontWeight: 600,
                      borderRadius: 20,
                      fontSize: { xs: '0.75rem', md: '0.875rem' },
                      whiteSpace: 'nowrap',
                      '&:hover': { transform: 'scale(1.05)' },
                      transition: 'all 0.2s ease'
                    }}
                  />
                  
                  {Array.isArray(categories) && categories.slice(0, isMobile ? 4 : 8).map((category) => (
                    <Chip
                      key={category.category}
                      label={`${category.displayName} (${category.count})`}
                      icon={React.createElement(getCategoryIcon(category.category))}
                      variant={selectedCategory === category.category ? 'filled' : 'outlined'}
                      color={selectedCategory === category.category ? 'primary' : 'default'}
                      onClick={() => setSelectedCategory(category.category)}
                      size={theme.breakpoints.down('md') ? 'small' : 'medium'}
                      sx={{ 
                        fontWeight: 600,
                        borderRadius: 20,
                        fontSize: { xs: '0.75rem', md: '0.875rem' },
                        whiteSpace: 'nowrap',
                        '&:hover': { transform: 'scale(1.05)' },
                        transition: 'all 0.2s ease'
                      }}
                    />
                  ))}
                </Box>
              </Box>

              {/* Job Listings */}
              {loading ? (
                <Box sx={{ py: { xs: 4, md: 8 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: { xs: 3, md: 4 } }}>
                    <CircularProgress size={isMobile ? 40 : 50} thickness={4} />
                  </Box>
                  <Typography 
                    variant={isMobile ? 'body1' : 'h6'}
                    textAlign="center" 
                    color="text.secondary" 
                    sx={{ mb: { xs: 3, md: 4 } }}
                  >
                    Discovering amazing opportunities for you...
                  </Typography>
                  <Box sx={{ 
                    display: 'grid',
                    gridTemplateColumns: { 
                      xs: '1fr',
                      sm: 'repeat(2, 1fr)',
                      md: 'repeat(2, 1fr)'
                    },
                    gap: { xs: 2, md: 3 }
                  }}>
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <Box key={i}>
                        <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
                          <CardContent>
                            <Skeleton variant="text" width="60%" height={30} />
                            <Skeleton variant="text" width="40%" height={24} />
                            <Skeleton variant="rectangular" width="100%" height={60} sx={{ mt: 2, mb: 2 }} />
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Skeleton variant="rounded" width={60} height={24} />
                              <Skeleton variant="rounded" width={80} height={24} />
                            </Box>
                          </CardContent>
                        </Card>
                      </Box>
                    ))}
                  </Box>
                </Box>
              ) : error ? (
                <Box sx={{ py: 8, textAlign: 'center' }}>
                  <Box sx={{ 
                    p: 6, 
                    borderRadius: 4,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.05)} 0%, ${alpha(theme.palette.error.main, 0.02)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.error.main, 0.1)}`
                  }}>
                    <Typography variant="h4" color="error.main" gutterBottom sx={{ fontWeight: 700 }}>
                      Oops! Something went wrong
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
                      {error}
                    </Typography>
                    <Button 
                      variant="contained" 
                      size="large"
                      onClick={handleRefresh}
                      startIcon={<Refresh />}
                      sx={{
                        borderRadius: 3,
                        px: 4,
                        py: 1.5,
                        background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
                        '&:hover': {
                          background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.secondary.dark} 90%)`,
                        }
                      }}
                    >
                      Try Again
                    </Button>
                  </Box>
                </Box>
              ) : filteredJobs.length === 0 ? (
                <Box sx={{ py: 8, textAlign: 'center' }}>
                  <Box sx={{ 
                    p: 6, 
                    borderRadius: 4,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.05)} 0%, ${alpha(theme.palette.info.main, 0.02)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`
                  }}>
                    <Typography variant="h4" color="text.primary" gutterBottom sx={{ fontWeight: 700 }}>
                      No opportunities found
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
                      We couldn't find any jobs matching your criteria. Try adjusting your search terms or browse different categories to discover new opportunities.
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                      <Button 
                        variant="outlined" 
                        onClick={() => {
                          clearAllFilters();
                        }}
                        sx={{ borderRadius: 3 }}
                      >
                        Clear Filters
                      </Button>
                      <Button 
                        variant="contained" 
                        onClick={handleRefresh}
                        startIcon={<Refresh />}
                        sx={{
                          borderRadius: 3,
                          background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
                        }}
                      >
                        Refresh Results
                      </Button>
                    </Stack>
                  </Box>
                </Box>
              ) : (
                <>
                  {/* Job Grid/List */}
                  <Box sx={{ 
                    display: (isMobile || viewMode === 'list') ? 'flex' : 'grid',
                    flexDirection: (isMobile || viewMode === 'list') ? 'column' : undefined,
                    gridTemplateColumns: (!isMobile && viewMode === 'grid') ? { 
                      sm: 'repeat(2, 1fr)', // Two columns on small tablets
                      md: 'repeat(2, 1fr)', // Two columns on medium screens
                      lg: 'repeat(2, 1fr)', // Two columns on large screens
                      xl: 'repeat(2, 1fr)'  // Two columns on extra large screens
                    } : undefined,
                    gap: { xs: 1, sm: 1.5, md: 2, lg: 3 },
                    maxWidth: '100%',
                    width: '100%'
                  }}>
                    {sortJobs(filteredJobs).map((job) => (
                      <Box 
                        key={job._id}
                        sx={{
                          maxWidth: { xs: '100%', md: '500px' },
                          width: '100%'
                        }}
                      >
                        <Card 
                          sx={{ 
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            borderRadius: { xs: 1.5, sm: 2, md: 3 },
                            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                            background: `linear-gradient(135deg, 
                              ${alpha(theme.palette.background.paper, 1)} 0%, 
                              ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
                            maxWidth: '100%',
                            minHeight: { xs: '180px', sm: '200px', md: '320px' },
                            '&:hover': {
                              transform: { xs: 'translateY(-2px)', sm: 'translateY(-4px)', md: 'translateY(-8px)' },
                              boxShadow: `0 ${isMobile ? '6px 20px' : '12px 40px'} ${alpha(theme.palette.common.black, 0.15)}`,
                              border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
                            }
                          }}
                          onClick={() => user ? navigate(`/app/jobs/${job._id}`) : navigate('/login')}
                        >
                          <CardContent sx={{ 
                            p: { xs: 1.2, sm: 2, md: 3 }, 
                            height: '100%', 
                            display: 'flex', 
                            flexDirection: 'column',
                            '&:last-child': { pb: { xs: 1.2, sm: 2, md: 3 } }
                          }}>
                            {/* Company Logo & Header */}
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 0.8, sm: 1, md: 1.5 } }}>
                              <Avatar
                                sx={{
                                  width: { xs: 24, sm: 28, md: 36 },
                                  height: { xs: 24, sm: 28, md: 36 },
                                  mr: { xs: 0.6, sm: 0.8, md: 1.5 },
                                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                                  color: 'primary.main',
                                  fontWeight: 'bold',
                                  fontSize: { xs: '0.7rem', sm: '0.8rem', md: '1rem' }
                                }}
                              >
                                {job.company.charAt(0).toUpperCase()}
                              </Avatar>
                              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                <Typography variant="h6" sx={{ 
                                  fontWeight: 700, 
                                  mb: 0.3,
                                  fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.95rem' },
                                  lineHeight: 1.1,
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden'
                                }}>
                                  {job.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ 
                                  fontWeight: 500, 
                                  fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.8rem' },
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {job.company}
                                </Typography>
                              </Box>
                            </Box>
                            
                            {/* Location & Job Type with Icons */}
                            <Box sx={{ mb: { xs: 0.8, sm: 1, md: 1.5 } }}>
                              <Stack direction="row" spacing={0.5} sx={{ mb: 0.5, flexWrap: 'wrap', gap: { xs: 0.3, md: 0.5 } }}>
                                <Chip 
                                  icon={<LocationOn sx={{ fontSize: { xs: 10, sm: 12, md: 14 } }} />}
                                  size="small" 
                                  label={job.location}
                                  sx={{ 
                                    bgcolor: alpha(theme.palette.info.main, 0.1),
                                    color: 'info.dark',
                                    fontWeight: 500,
                                    height: { xs: 16, sm: 18, md: 20 },
                                    fontSize: { xs: '0.55rem', sm: '0.6rem', md: '0.7rem' },
                                    '& .MuiChip-label': {
                                      px: { xs: 0.5, md: 1 }
                                    }
                                  }}
                                />
                                {job.remote && (
                                  <Chip 
                                    icon={<Computer sx={{ fontSize: { xs: 10, sm: 12, md: 14 } }} />}
                                    size="small" 
                                    label="Remote" 
                                    sx={{ 
                                      bgcolor: alpha(theme.palette.success.main, 0.1),
                                      color: 'success.dark',
                                      fontWeight: 500,
                                      height: { xs: 16, sm: 18, md: 20 },
                                      fontSize: { xs: '0.55rem', sm: '0.6rem', md: '0.7rem' },
                                      '& .MuiChip-label': {
                                        px: { xs: 0.5, md: 1 }
                                      }
                                    }}
                                  />
                                )}
                                {job.jobType && (
                                  <Chip 
                                    icon={<Work sx={{ fontSize: { xs: 12, md: 14 } }} />}
                                    size="small" 
                                    label={job.jobType}
                                    sx={{ 
                                      bgcolor: alpha(theme.palette.warning.main, 0.1),
                                      color: 'warning.dark',
                                      fontWeight: 500,
                                      height: { xs: 16, sm: 18, md: 20 },
                                      fontSize: { xs: '0.55rem', sm: '0.6rem', md: '0.7rem' },
                                      '& .MuiChip-label': {
                                        px: { xs: 0.5, md: 1 }
                                      }
                                    }}
                                  />
                                )}
                              </Stack>
                              
                              {/* Time posted and Deadline */}
                              <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                mt: 0.5,
                                flexDirection: { xs: 'column', sm: 'row' },
                                alignItems: { xs: 'flex-start', sm: 'center' },
                                gap: { xs: 0.3, sm: 0 }
                              }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Schedule sx={{ fontSize: { xs: 8, sm: 10, md: 12 }, color: 'text.secondary', mr: 0.5 }} />
                                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.55rem', sm: '0.6rem', md: '0.7rem' } }}>
                                    Posted {new Date(job.createdAt).toLocaleDateString()}
                                  </Typography>
                                </Box>
                                {job.applicationDeadline && (
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Event sx={{ fontSize: { xs: 8, sm: 10, md: 12 }, color: 'error.main', mr: 0.5 }} />
                                    <Typography 
                                      variant="caption" 
                                      color="error.main" 
                                      sx={{ fontSize: { xs: '0.55rem', sm: '0.6rem', md: '0.7rem' }, fontWeight: 600 }}
                                    >
                                      Deadline: {new Date(job.applicationDeadline).toLocaleDateString()}
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            </Box>
                            
                            {/* Description */}
                            <Typography 
                              variant="body2" 
                              color="text.secondary" 
                              sx={{ 
                                mb: { xs: 1, sm: 1.2, md: 1.5 },
                                overflow: 'hidden',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                lineHeight: 1.3,
                                fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' },
                                flexGrow: 1
                              }}
                            >
                              {job.description}
                            </Typography>
                            
                            {/* Skills */}
                            {job.skills && job.skills.length > 0 && (
                              <Box sx={{ mb: { xs: 1, sm: 1.2, md: 1.5 } }}>
                                <Stack direction="row" spacing={0.3} sx={{ flexWrap: 'wrap', gap: 0.3 }}>
                                  {job.skills.slice(0, 2).map((skill, index) => (
                                    <Chip
                                      key={index}
                                      label={skill}
                                      size="small"
                                      variant="outlined"
                                      sx={{ 
                                        fontSize: { xs: '0.55rem', sm: '0.6rem', md: '0.65rem' },
                                        height: { xs: 16, sm: 17, md: 18 },
                                        borderColor: alpha(theme.palette.primary.main, 0.3),
                                        color: 'primary.main'
                                      }}
                                    />
                                  ))}
                                  {job.skills.length > 2 && (
                                    <Chip
                                      label={`+${job.skills.length - 2}`}
                                      size="small"
                                      sx={{ 
                                        fontSize: '0.65rem',
                                        height: 18,
                                        bgcolor: alpha(theme.palette.text.secondary, 0.1),
                                        color: 'text.secondary'
                                      }}
                                    />
                                  )}
                                </Stack>
                              </Box>
                            )}
                            
                            {/* Footer with Salary & Apply Button */}
                            <Box sx={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center',
                              mt: 'auto',
                              pt: 1.5,
                              borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                            }}>
                              <Box>
                                {job.salary ? (
                                  <Typography 
                                    variant="body2" 
                                    color="success.main" 
                                    fontWeight="700"
                                    sx={{ display: 'flex', alignItems: 'center', fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.8rem' } }}
                                  >
                                    <AttachMoney sx={{ fontSize: { xs: 12, md: 14 }, mr: 0.3 }} />
                                    ${job.salary.min}k - ${job.salary.max}k
                                  </Typography>
                                ) : (
                                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.8rem' } }}>
                                    Competitive Salary
                                  </Typography>
                                )}
                              </Box>
                              <Button 
                                variant="contained" 
                                size="small"
                                startIcon={<ArrowForward sx={{ fontSize: { xs: 12, md: 14 } }} />}
                                sx={{ 
                                  borderRadius: 1.5,
                                  textTransform: 'none',
                                  fontWeight: 600,
                                  px: { xs: 1, md: 1.5 },
                                  py: { xs: 0.4, md: 0.5 },
                                  fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
                                  minWidth: 'auto',
                                  background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
                                  '&:hover': {
                                    background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.secondary.dark} 90%)`,
                                    transform: 'scale(1.05)'
                                  }
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  user ? navigate(`/app/jobs/${job._id}`) : navigate('/login');
                                }}
                              >
                                Apply
                              </Button>
                            </Box>
                          </CardContent>
                        </Card>
                      </Box>
                    ))}
                  </Box>
                </>
              )}
            </Box>
          </Box>
        </Container>
        
        {/* Scroll to Top Button */}
        {showScrollTop && (
          <Fab
            color="primary"
            size={isMobile ? 'medium' : 'large'}
            onClick={handleScrollTop}
            sx={{
              position: 'fixed',
              bottom: { xs: 20, md: 24 },
              right: { xs: 16, md: 24 },
              zIndex: 1000,
              boxShadow: theme.shadows[8],
              '&:hover': {
                transform: 'scale(1.1)',
              },
              transition: 'transform 0.2s ease-in-out',
            }}
          >
            <KeyboardArrowUp fontSize={isMobile ? 'medium' : 'large'} />
          </Fab>
        )}
        
        {/* Floating Components */}
        <FloatingChatButton />
        <FloatingContact />
      </Box>
    </>
  );
};

export default AllJobsPage;

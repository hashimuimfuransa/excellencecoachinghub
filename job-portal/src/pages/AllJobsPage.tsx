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
  alpha,
  useTheme,
  AppBar,
  Toolbar,
  IconButton,
  Badge,
  Fab,
  Skeleton,
  Avatar
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
  ArrowForward
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
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [applicationDialogOpen, setApplicationDialogOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Fetch jobs
  const fetchJobs = async (refresh = false) => {
    if (refresh) {
      setError(null);
    }
    setLoading(true);
    
    try {
      // Use getJobs method with pagination - get all jobs without strict filters
      const response = await jobService.getJobs({}, 1, 100); // Get first 100 jobs
      setJobs(response.data || []);
      setFilteredJobs(response.data || []);
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

    setFilteredJobs(filtered);
  }, [jobs, searchTerm, locationFilter, selectedCategory]);

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

  return (
    <>
      {/* Navigation Bar - Only show for non-authenticated users */}
      {!user && <Navbar />}
      
      <Box sx={{ 
        minHeight: '100vh', 
        backgroundColor: 'background.default',
        pt: { xs: 1, md: 2 }
      }}>
        {/* Hero Section with Enhanced Search */}
        <Box sx={{
          background: `linear-gradient(135deg, 
            ${alpha(theme.palette.primary.main, 0.08)} 0%, 
            ${alpha(theme.palette.secondary.main, 0.05)} 50%,
            ${alpha(theme.palette.success.main, 0.03)} 100%)`,
          position: 'relative',
          py: { xs: 3, md: 6 },
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `
              radial-gradient(circle at 20% 50%, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, ${alpha(theme.palette.secondary.main, 0.08)} 0%, transparent 50%),
              radial-gradient(circle at 40% 80%, ${alpha(theme.palette.success.main, 0.06)} 0%, transparent 50%)
            `,
            pointerEvents: 'none',
            zIndex: 0
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `linear-gradient(45deg, transparent 49%, ${alpha(theme.palette.divider, 0.05)} 50%, transparent 51%)`,
            pointerEvents: 'none',
            zIndex: 1
          }
        }}>
          <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 2 }}>
            {/* Modern Header with Stats */}
            <Box sx={{ mb: 4, textAlign: 'center' }}>
              <Typography 
                variant="h3" 
                sx={{ 
                  fontWeight: 800,
                  background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 70%, ${theme.palette.success.main} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1,
                  fontSize: { xs: '2rem', md: '3rem' },
                  letterSpacing: '-0.02em'
                }}
              >
                Discover Your Dream Job
              </Typography>
              <Typography 
                variant="h6" 
                color="text.secondary" 
                sx={{ 
                  mb: 3,
                  maxWidth: '600px',
                  mx: 'auto',
                  fontSize: { xs: '1rem', md: '1.2rem' },
                  lineHeight: 1.6
                }}
              >
                Explore opportunities from leading companies across all industries. 
                Find your perfect match from {displayJobs.length} available positions.
              </Typography>
            </Box>

            {/* Enhanced Search and Filter Bar */}
            <Paper 
              elevation={0}
              sx={{ 
                p: { xs: 3, md: 4 }, 
                mb: 4,
                borderRadius: 4,
                background: `linear-gradient(135deg, 
                  ${alpha(theme.palette.background.paper, 0.95)} 0%, 
                  ${alpha(theme.palette.background.paper, 0.98)} 100%)`,
                backdropFilter: 'blur(20px)',
                border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                position: 'relative',
                overflow: 'hidden',
                boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.08)}`,
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 4,
                  background: `linear-gradient(90deg, 
                    ${theme.palette.primary.main}, 
                    ${theme.palette.secondary.main}, 
                    ${theme.palette.success.main})`,
                }
              }}
            >
              {/* Search Controls */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid xs={12} md={5}>
                  <TextField
                    fullWidth
                    placeholder="Search for jobs, companies, or skills..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search color="action" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 3,
                        backgroundColor: alpha(theme.palette.background.default, 0.7),
                        border: `2px solid transparent`,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.background.default, 0.9),
                          border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                        },
                        '&.Mui-focused': {
                          backgroundColor: theme.palette.background.default,
                          border: `2px solid ${theme.palette.primary.main}`,
                          boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.1)}`,
                        }
                      },
                    }}
                  />
                </Grid>
                <Grid xs={12} md={3}>
                  <TextField
                    fullWidth
                    placeholder="Location..."
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationOn color="action" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 3,
                        backgroundColor: alpha(theme.palette.background.default, 0.7),
                        border: `2px solid transparent`,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.background.default, 0.9),
                          border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                        },
                        '&.Mui-focused': {
                          backgroundColor: theme.palette.background.default,
                          border: `2px solid ${theme.palette.primary.main}`,
                          boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.1)}`,
                        }
                      },
                    }}
                  />
                </Grid>
                <Grid xs={12} md={2}>
                  <FormControl fullWidth>
                    <Select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      displayEmpty
                      startAdornment={
                        <InputAdornment position="start">
                          <Sort color="action" />
                        </InputAdornment>
                      }
                      sx={{
                        borderRadius: 3,
                        backgroundColor: alpha(theme.palette.background.default, 0.7),
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.background.default, 0.9),
                        }
                      }}
                    >
                      <MenuItem value="date">Latest</MenuItem>
                      <MenuItem value="title">Title</MenuItem>
                      <MenuItem value="company">Company</MenuItem>
                      <MenuItem value="location">Location</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid xs={12} md={2}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<Refresh />}
                    onClick={handleRefresh}
                    sx={{
                      borderRadius: 3,
                      py: 1.75,
                      background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
                      boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
                      '&:hover': {
                        background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.secondary.dark} 90%)`,
                        boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                        transform: 'translateY(-2px)',
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Refresh
                  </Button>
                </Grid>
              </Grid>

              {/* Real Categories from API */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Category sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="subtitle1" fontWeight="600" color="text.secondary">
                    Browse by Category
                  </Typography>
                  {!categoriesLoading && categories.length > 0 && (
                    <Chip 
                      label={`${categories.length} categories`} 
                      size="small" 
                      color="primary" 
                      sx={{ ml: 1 }}
                    />
                  )}
                </Box>
                
                <Box sx={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: 1.5,
                  justifyContent: { xs: 'center', md: 'flex-start' }
                }}>
                  {/* All Jobs Chip */}
                  <Chip
                    label="All Jobs"
                    icon={React.createElement(Work)}
                    variant={selectedCategory === 'all' ? 'filled' : 'outlined'}
                    color={selectedCategory === 'all' ? 'primary' : 'default'}
                    onClick={() => setSelectedCategory('all')}
                    sx={{ 
                      fontWeight: 600,
                      borderRadius: 20,
                      px: 1,
                      '&:hover': {
                        transform: 'scale(1.05)',
                        boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
                      },
                      transition: 'all 0.2s ease'
                    }}
                  />
                  
                  {/* Loading skeleton for categories */}
                  {categoriesLoading && (
                    <>
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Skeleton key={i} variant="rounded" width={120} height={32} />
                      ))}
                    </>
                  )}
                  
                  {/* Real categories from API */}
                  {Array.isArray(categories) && categories.map((category) => (
                    <Chip
                      key={category.category}
                      label={`${category.displayName} (${category.count})`}
                      icon={React.createElement(getCategoryIcon(category.category))}
                      variant={selectedCategory === category.category ? 'filled' : 'outlined'}
                      color={selectedCategory === category.category ? 'primary' : 'default'}
                      onClick={() => setSelectedCategory(category.category)}
                      sx={{ 
                        fontWeight: 600,
                        borderRadius: 20,
                        px: 1,
                        '&:hover': {
                          transform: 'scale(1.05)',
                          boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
                        },
                        transition: 'all 0.2s ease'
                      }}
                    />
                  ))}
                </Box>
              </Box>
              
              {/* Quick Stats */}
              <Box sx={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: 2, 
                justifyContent: 'center',
                pt: 2,
                borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`
              }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" fontWeight="700" color="primary.main">
                    {displayJobs.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Available Jobs
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" fontWeight="700" color="secondary.main">
                    {categories.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Categories
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" fontWeight="700" color="success.main">
                    {selectedCategory === 'all' ? 'All' : selectedCategory}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Current Filter
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Container>
        </Box>

        {/* Enhanced Jobs Results Section */}
        <Container maxWidth="xl" sx={{ py: 4 }}>
          {loading ? (
            <Box sx={{ py: 8 }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
                <CircularProgress size={50} thickness={4} />
              </Box>
              <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 4 }}>
                Discovering amazing opportunities for you...
              </Typography>
              <Grid container spacing={3}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Grid key={i} item xs={12} md={6} lg={4}>
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
                  </Grid>
                ))}
              </Grid>
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
                      setSearchTerm('');
                      setLocationFilter('');
                      setSelectedCategory('all');
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
              {/* Modern Results Header */}
              <Box sx={{ 
                mb: 4, 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 2 
              }}>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {filteredJobs.length} Amazing Opportunities
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedCategory === 'all' 
                      ? 'Showing all available positions' 
                      : `Filtered by ${selectedCategory}`}
                  </Typography>
                </Box>
                
                <Stack direction="row" spacing={2} alignItems="center">
                  {/* View Toggle */}
                  <ToggleButtonGroup
                    value={viewMode}
                    exclusive
                    onChange={(e, newMode) => newMode && setViewMode(newMode)}
                    sx={{
                      backgroundColor: alpha(theme.palette.background.paper, 0.8),
                      borderRadius: 3,
                      '& .MuiToggleButton-root': {
                        border: 'none',
                        borderRadius: 3,
                        px: 2,
                        py: 1,
                        '&.Mui-selected': {
                          backgroundColor: theme.palette.primary.main,
                          color: 'white',
                          '&:hover': {
                            backgroundColor: theme.palette.primary.dark,
                          }
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
                </Stack>
              </Box>

              {/* Modern Job Cards Grid - Same as ModernJobsPage */}
              <Box
                sx={{
                  display: 'grid',
                  gap: 2,
                  gridTemplateColumns: viewMode === 'grid' ? {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(3, 1fr)',
                    lg: 'repeat(4, 1fr)'
                  } : 'repeat(1, 1fr)',
                }}
              >
                {Array.isArray(displayJobs) && displayJobs.map((job, index) => (
                  <Box 
                    key={job._id}
                    sx={{
                      minWidth: 0, // Allow shrinking
                      maxWidth: '100%', // Prevent expansion
                    }}
                  >
                    {viewMode === 'grid' ? (
                      // Grid View - Vertical layout (same as ModernJobsPage)
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
                        onClick={() => user ? navigate(`/app/jobs/${job._id}`) : navigate('/login', { state: { from: { pathname: `/jobs/${job._id}` } } })}
                      >
                        {/* Status badges */}
                        {job.featured && (
                          <Chip
                            label="Featured"
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
                            // Handle bookmark toggle
                          }}
                          sx={{
                            position: 'absolute',
                            top: 8,
                            left: 8,
                            zIndex: 1
                          }}
                        >
                          <BookmarkBorder />
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
                              {job.jobType || 'Full-time'}
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
                                ${job.salary.min}k - ${job.salary.max}k
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
                              {job.createdAt ? 
                                (() => {
                                  const now = new Date();
                                  const created = new Date(job.createdAt);
                                  const diffTime = Math.abs(now.getTime() - created.getTime());
                                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                  
                                  if (diffDays === 1) return 'Posted today';
                                  if (diffDays <= 7) return `${diffDays} days ago`;
                                  if (diffDays <= 30) return `${Math.floor(diffDays / 7)} weeks ago`;
                                  return `${Math.floor(diffDays / 30)} months ago`;
                                })() :
                                'Recently posted'
                              }
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
                              label={(() => {
                                const now = new Date();
                                const deadlineDate = new Date(job.applicationDeadline);
                                const diffTime = deadlineDate.getTime() - now.getTime();
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                
                                if (diffDays < 0) return 'Expired';
                                if (diffDays === 0) return 'Today';
                                if (diffDays === 1) return 'Tomorrow';
                                if (diffDays <= 7) return `${diffDays} days left`;
                                if (diffDays <= 30) return `${Math.floor(diffDays / 7)} weeks left`;
                                return deadlineDate.toLocaleDateString();
                              })()}
                              size="small"
                              color={(() => {
                                const now = new Date();
                                const deadlineDate = new Date(job.applicationDeadline);
                                const diffTime = deadlineDate.getTime() - now.getTime();
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                
                                if (diffDays < 0) return 'error';
                                if (diffDays <= 3) return 'error';
                                if (diffDays <= 7) return 'warning';
                                return 'info';
                              })()}
                              variant="filled"
                              sx={{ 
                                fontSize: '0.7rem', 
                                height: 18,
                                fontWeight: 500
                              }}
                            />
                          </Box>
                        )}

                        {/* Action buttons */}
                        <Stack direction="row" spacing={1} sx={{ mt: 'auto', pt: 2 }}>
                          <Button
                            variant="contained"
                            size="small"
                            fullWidth
                            startIcon={<ArrowForward />}
                            sx={{ 
                              borderRadius: 2,
                              fontWeight: 600,
                              fontSize: '0.8rem'
                            }}
                          >
                            View Details
                          </Button>
                        </Stack>
                      </Paper>
                    ) : (
                      // List View - Horizontal layout (same as ModernJobsPage)
                      <Paper
                        sx={{
                          p: 3,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                          borderRadius: 3,
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.15)}`,
                            borderColor: 'primary.main'
                          }
                        }}
                        onClick={() => user ? navigate(`/app/jobs/${job._id}`) : navigate('/login', { state: { from: { pathname: `/jobs/${job._id}` } } })}
                      >
                        {/* Company logo */}
                        <Avatar 
                          sx={{ 
                            width: 60, 
                            height: 60, 
                            bgcolor: 'primary.main',
                            fontSize: '1.5rem'
                          }}
                        >
                          {job.company?.charAt(0)}
                        </Avatar>

                        {/* Job info */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography 
                            variant="h6" 
                            fontWeight="bold" 
                            sx={{ mb: 0.5 }}
                          >
                            {job.title}
                          </Typography>
                          <Typography 
                            variant="body1" 
                            color="text.secondary" 
                            sx={{ mb: 1 }}
                          >
                            {job.company}
                          </Typography>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <LocationOn fontSize="small" color="action" />
                              <Typography variant="body2" color="text.secondary">
                                {job.location}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Work fontSize="small" color="action" />
                              <Typography variant="body2" color="text.secondary">
                                {job.jobType || 'Full-time'}
                              </Typography>
                            </Box>
                            {job.salary && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <AttachMoney fontSize="small" color="action" />
                                <Typography variant="body2" color="success.main" fontWeight="600">
                                  ${job.salary.min}k - ${job.salary.max}k
                                </Typography>
                              </Box>
                            )}
                          </Stack>
                        </Box>

                        {/* Action buttons */}
                        <Stack direction="row" spacing={1}>
                          <IconButton size="small">
                            <BookmarkBorder />
                          </IconButton>
                          <Button
                            variant="contained"
                            size="small"
                            endIcon={<ArrowForward />}
                            sx={{ borderRadius: 2, fontWeight: 600 }}
                          >
                            View
                          </Button>
                        </Stack>
                      </Paper>
                    )}
                  </Box>
                ))}
              </Box>
            </>
          )}
        </Container>

        {/* Floating Action Buttons */}
        {showScrollTop && (
          <Fab
            color="primary"
            size="small"
            onClick={handleScrollTop}
            sx={{
              position: 'fixed',
              bottom: 20,
              right: 20,
              zIndex: 1000,
              boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
            }}
          >
            <KeyboardArrowUp />
          </Fab>
        )}

        {/* Chat Button */}
        <FloatingChatButton />

        {/* Contact Us Button */}
        <FloatingContact />

        {/* Application Dialog */}
        <ApplicationDialog />
      </Box>
    </>
  );
};

export default AllJobsPage;
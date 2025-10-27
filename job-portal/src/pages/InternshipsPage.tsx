import React, { useState, useEffect, useMemo } from 'react';
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
import CompactJobFilter from '../components/CompactJobFilter';
import SmartJobSearch, { SearchType } from '../components/SmartJobSearch';
import { useJobFilters, FilterState } from '../hooks/useJobFilters';
import { internshipService } from '../services/internshipService';
import { jobService } from '../services/jobService';

// Use the Internship interface from the service
interface Internship {
  _id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string[];
  benefits: string[];
  stipend?: {
    amount: number;
    currency: string;
  };
  department: string;
  skills: string[];
  experienceLevel: string;
  educationLevel: string;
  workArrangement: 'remote' | 'hybrid' | 'on-site';
  duration: string;
  startDate?: string;
  applicationDeadline?: string;
  contactInfo?: {
    email?: string;
    phone?: string;
    website?: string;
  };
  status: string;
  employer: string;
  applicationsCount: number;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
  isCurated?: boolean;
}

interface JobCategory {
  _id?: string;
  category: string;
  displayName?: string;
  count: number;
}

type ViewMode = 'grid' | 'list';

const InternshipsPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  
  const [internships, setInternships] = useState<Internship[]>([]);
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInternship, setSelectedInternship] = useState<Internship | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [applicationDialogOpen, setApplicationDialogOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Transform internship to job-like format for filtering compatibility
  const transformInternshipForFilters = (internship: Internship) => {
    return {
      _id: internship._id,
      title: internship.title,
      company: internship.company,
      location: internship.location,
      description: internship.description,
      requirements: internship.requirements || [],
      benefits: internship.benefits || [],
      salary: internship.stipend ? {
        min: internship.stipend.amount || 0,
        max: internship.stipend.amount || 0,
        currency: internship.stipend.currency || 'USD'
      } : undefined,
      jobType: 'internship',
      category: 'Internship',
      skills: internship.skills || [],
      skillsRequired: internship.skills || [],
      experience: internship.experienceLevel,
      experienceLevel: internship.experienceLevel,
      educationLevel: internship.educationLevel,
      remote: internship.workArrangement === 'remote',
      urgent: false,
      featured: internship.isCurated || false,
      applicationDeadline: internship.applicationDeadline,
      companyLogo: undefined,
      companySize: undefined,
      companyIndustry: internship.department,
      companyWebsite: internship.contactInfo?.website,
      contactEmail: internship.contactInfo?.email,
      jobLevel: internship.experienceLevel,
      languages: [],
      certifications: [],
      applicationCount: internship.applicationsCount || 0,
      applicationsCount: internship.applicationsCount || 0,
      viewCount: internship.viewsCount || 0,
      viewsCount: internship.viewsCount || 0,
      createdAt: internship.createdAt,
      updatedAt: internship.updatedAt,
      employerId: internship.employer,
      employer: internship.employer,
      status: internship.status,
      applicationUrl: undefined,
      applicationInstructions: undefined,
      isCurated: internship.isCurated || false,
      relatedCourses: [],
      psychometricTests: []
    };
  };

  // Memoize transformed data to prevent infinite re-renders
  const transformedInternships = useMemo(
    () => internships.map(transformInternshipForFilters),
    [internships]
  );

  const transformedCategories = useMemo(
    () => categories.map(cat => ({
      key: cat.category,
      label: cat.displayName || cat.category,
      count: cat.count
    })),
    [categories]
  );

  // Enhanced filtering using the custom hook
  const {
    filters,
    filteredJobs: filteredInternships,
    totalJobs: totalInternships,
    setFilters,
    updateFilter,
    updateSearchTerm,
    updateSearchType,
    clearFilters,
    isLoading: filtersLoading,
    searchSuggestions
  } = useJobFilters({
    initialJobs: transformedInternships,
    categories: transformedCategories,
    syncWithUrl: true
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Transform job to internship format
  const transformJobToInternship = (job: any): Internship => {
    return {
      _id: job._id,
      title: job.title,
      company: job.company,
      location: job.location,
      description: job.description,
      requirements: job.requirements || [],
      benefits: job.benefits || [],
      stipend: job.salary ? {
        amount: job.salary.min || 0,
        currency: job.salary.currency || 'USD'
      } : undefined,
      department: job.category === 'internships' ? 'General' : 'Technology',
      skills: job.skills || [],
      experienceLevel: job.experienceLevel,
      educationLevel: job.educationLevel,
      workArrangement: 'remote',
      numberOfPositions: 1,
      applicationProcedure: 'Apply through the platform',
      internshipPeriod: {
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        duration: '3 months'
      },
      isPaid: job.salary && job.salary.min > 0,
      expectedStartDate: new Date().toISOString(),
      expectedEndDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      learningObjectives: [],
      mentorshipProvided: false,
      certificateProvided: false,
      applicationDeadline: job.applicationDeadline,
      postedDate: job.postedDate,
      status: job.status,
      employer: job.employer,
      isCurated: job.isCurated,
      curatedBy: job.curatedBy,
      relatedCourses: job.relatedCourses || [],
      psychometricTestRequired: job.psychometricTestRequired || false,
      psychometricTests: job.psychometricTests || [],
      applicationsCount: job.applicationsCount || 0,
      viewsCount: job.viewsCount || 0,
      contactInfo: job.contactInfo,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      isFromJobModel: true
    };
  };

  // Fetch internships (from both internship service and job service)
  const fetchInternships = async (refresh = false) => {
    if (refresh) {
      setError(null);
    }
    setLoading(true);
    
    try {
      const MAX_ITEMS_TO_FETCH = 1000;
      
      // Fetch from both sources in parallel
      const [internshipsResponse, jobsResponse] = await Promise.all([
        internshipService.getInternships({ limit: MAX_ITEMS_TO_FETCH }).catch(err => {
          console.warn('Error fetching dedicated internships:', err);
          return { data: [] };
        }),
        jobService.getJobs({ 
          category: 'internships', 
          limit: MAX_ITEMS_TO_FETCH 
        }).catch(err => {
          console.warn('Error fetching internship jobs:', err);
          return { data: [] };
        })
      ]);

      const dedicatedInternships = internshipsResponse.data || [];
      const internshipJobs = jobsResponse.data || [];

      // Transform jobs to internship format
      const transformedJobs = internshipJobs.map(transformJobToInternship);

      // Combine both sources
      const allInternships = [...dedicatedInternships, ...transformedJobs];

      // Sort by creation date (newest first)
      allInternships.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setInternships(allInternships);
      console.log(`Loaded ${allInternships.length} total internships (${dedicatedInternships.length} dedicated + ${transformedJobs.length} from jobs)`);
      
    } catch (err) {
      console.error('Error fetching internships:', err);
      setError('Failed to load internships. Please try again.');
      setInternships([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories (from both internship and job services)
  const fetchCategories = async () => {
    setCategoriesLoading(true);
    try {
      // Fetch categories from both services
      const [internshipCategories, jobCategories] = await Promise.all([
        internshipService.getInternshipCategories().catch(err => {
          console.warn('Error fetching internship categories:', err);
          return [];
        }),
        jobService.getJobCategories().catch(err => {
          console.warn('Error fetching job categories:', err);
          return [];
        })
      ]);

      // Set default internship categories
      const defaultCategories = [
        { category: 'Technology', displayName: 'Technology', count: 0 },
        { category: 'Business', displayName: 'Business', count: 0 },
        { category: 'Marketing', displayName: 'Marketing', count: 0 },
        { category: 'Design', displayName: 'Design', count: 0 },
        { category: 'Engineering', displayName: 'Engineering', count: 0 },
        { category: 'Finance', displayName: 'Finance', count: 0 },
        { category: 'Healthcare', displayName: 'Healthcare', count: 0 },
        { category: 'Education', displayName: 'Education', count: 0 },
        { category: 'Research', displayName: 'Research', count: 0 },
        { category: 'Non-profit', displayName: 'Non-profit', count: 0 }
      ];

      // Merge categories from both sources
      const mergedCategories = [...defaultCategories];
      
      // Add internship categories
      if (Array.isArray(internshipCategories)) {
        internshipCategories.forEach(cat => {
          const existing = mergedCategories.find(m => 
            m.category.toLowerCase() === cat.category?.toLowerCase() ||
            m.category.toLowerCase() === cat.name?.toLowerCase()
          );
          if (existing) {
            existing.count += cat.count || 0;
          } else if (cat.category || cat.name) {
            mergedCategories.push({
              category: cat.category || cat.name,
              displayName: cat.displayName || cat.category || cat.name,
              count: cat.count || 0
            });
          }
        });
      }

      // Add job categories (only relevant ones for internships)
      if (Array.isArray(jobCategories)) {
        jobCategories.forEach(cat => {
          if (cat.category === 'internships' || cat.name === 'internships') {
            // Don't add 'internships' as a category since all items here are internships
            return;
          }
          
          const existing = mergedCategories.find(m => 
            m.category.toLowerCase() === cat.category?.toLowerCase() ||
            m.category.toLowerCase() === cat.name?.toLowerCase()
          );
          if (existing) {
            existing.count += cat.count || 0;
          } else if (cat.category || cat.name) {
            mergedCategories.push({
              category: cat.category || cat.name,
              displayName: cat.displayName || cat.category || cat.name,
              count: cat.count || 0
            });
          }
        });
      }

      setCategories(mergedCategories);
      console.log(`Combined categories from internships and jobs: ${mergedCategories.length} categories`);
      
    } catch (err) {
      console.error('Error fetching categories:', err);
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
    fetchInternships();
    fetchCategories();
  }, []);

  // Get sorted internships based on current filter state
  const getSortedInternships = () => {
    return [...filteredInternships].sort((a, b) => {
      switch (filters.sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'company':
          return a.company.localeCompare(b.company);
        case 'location':
          return a.location.localeCompare(b.location);
        case 'date':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  };

  const sortedInternships = getSortedInternships();

  // Handle scroll to show/hide scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.pageYOffset > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Helper function to count active filters
  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.searchTerm?.trim()) count++;
    if (filters.location?.trim()) count++;
    if (filters.categories?.length > 0) count++;
    if (filters.jobTypes?.length > 0) count++;
    if (filters.experienceLevel?.length > 0) count++;
    if (filters.salaryRange && (filters.salaryRange[0] > 0 || filters.salaryRange[1] < 200)) count++;
    if (filters.workLocation?.length > 0) count++;
    return count;
  };

  return (
    <>
      <Navbar />
      
      {/* Mobile Filter Sidebar */}
      <Drawer
        anchor="left"
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: 320,
            mt: 8
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            Filter Internships
          </Typography>
          
          {/* Location Filter */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Location Filter
            </Typography>
            <FormControl fullWidth size="small">
              <InputLabel>Select Location</InputLabel>
              <Select
                value={filters.location || ''}
                onChange={(e) => updateFilter('location', e.target.value)}
                label="Select Location"
                displayEmpty
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="">All Locations</MenuItem>
                <MenuItem value="Kigali">🇷🇼 Kigali</MenuItem>
                <MenuItem value="Nairobi">🇰🇪 Nairobi</MenuItem>
                <MenuItem value="Lagos">🇳🇬 Lagos</MenuItem>
                <MenuItem value="Cape Town">🇿🇦 Cape Town</MenuItem>
                <MenuItem value="Accra">🇬🇭 Accra</MenuItem>
                <MenuItem value="Kampala">🇺🇬 Kampala</MenuItem>
                <MenuItem value="Dar es Salaam">🇹🇿 Dar es Salaam</MenuItem>
                <MenuItem value="Addis Ababa">🇪🇹 Addis Ababa</MenuItem>
                <MenuItem value="London">🇬🇧 London</MenuItem>
                <MenuItem value="New York">🇺🇸 New York</MenuItem>
                <MenuItem value="Toronto">🇨🇦 Toronto</MenuItem>
                <MenuItem value="Dubai">🇦🇪 Dubai</MenuItem>
                <MenuItem value="Remote">💻 Remote</MenuItem>
                <MenuItem value="International">🌍 International</MenuItem>
              </Select>
            </FormControl>
            {filters.location && (
              <Box sx={{ mt: 1 }}>
                <Chip
                  size="small"
                  label={`📍 ${filters.location}`}
                  onDelete={() => updateFilter('location', '')}
                  color="primary"
                  variant="outlined"
                  sx={{ borderRadius: 2 }}
                />
              </Box>
            )}
          </Box>
          
          <CompactJobFilter
            filters={filters}
            onFilterChange={updateFilter}
            onClearFilters={clearFilters}
            totalJobs={filteredInternships.length}
            isLoading={loading || filtersLoading}
            type="internships"
          />
        </Box>
      </Drawer>

      <Box sx={{ 
        minHeight: '100vh', 
        backgroundColor: 'background.default',
        pb: { xs: 10, md: 4 }
      }}>
        <Container maxWidth="xl" sx={{ pt: { xs: 2, md: 4 }, px: { xs: 1, sm: 2, md: 3 } }}>
          {/* Header Section */}
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography 
              variant="h3" 
              component="h1" 
              sx={{ 
                fontWeight: 800, 
                mb: 2,
                background: 'linear-gradient(45deg, #4caf50 30%, #2e7d32 90%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }
              }}
            >
              Find Your Perfect Internship
            </Typography>
            <Typography 
              variant="h6" 
              color="text.secondary" 
              sx={{ 
                maxWidth: 600, 
                mx: 'auto',
                fontSize: { xs: '1rem', md: '1.25rem' }
              }}
            >
              Discover amazing internship opportunities and kickstart your career journey
            </Typography>
          </Box>

          {/* Desktop Layout */}
          {isDesktop && (
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
              {/* Sidebar Filters */}
              <Box sx={{ 
                width: 320, 
                position: 'sticky',
                top: 100,
                flexShrink: 0
              }}>
                <CompactJobFilter
                  filters={filters}
                  onFilterChange={updateFilter}
                  onClearFilters={clearFilters}
                  totalJobs={filteredInternships.length}
                  isLoading={loading || filtersLoading}
                  type="internships"
                />
              </Box>

              {/* Main Content Area */}
              <Box sx={{ 
                flex: 1,
                minHeight: 800
              }}>
                {/* Search and Controls */}
                <Box sx={{ 
                  mb: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: { xs: 1.5, md: 2 }
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Box>
                      <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ fontWeight: 700, mb: 0.5 }}>
                        {loading ? 'Loading...' : `${filteredInternships.length} Internships Found`}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', md: '0.875rem' } }}>
                        Showing all available internship positions
                      </Typography>
                    </Box>
                    
                    <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
                      {/* Sort Options */}
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Sort by</InputLabel>
                        <Select
                          value={filters.sortBy || 'date'}
                          onChange={(e) => updateFilter('sortBy', e.target.value)}
                          label="Sort by"
                        >
                          <MenuItem value="date">Latest</MenuItem>
                          <MenuItem value="title">Title</MenuItem>
                          <MenuItem value="company">Company</MenuItem>
                          <MenuItem value="location">Location</MenuItem>
                        </Select>
                      </FormControl>

                      {/* View Mode Toggle */}
                      <ToggleButtonGroup
                        value={viewMode}
                        exclusive
                        onChange={(_, newMode) => newMode && setViewMode(newMode)}
                        size="small"
                      >
                        <ToggleButton value="list" aria-label="list view">
                          <ViewList />
                        </ToggleButton>
                        <ToggleButton value="grid" aria-label="grid view">
                          <ViewModule />
                        </ToggleButton>
                      </ToggleButtonGroup>

                      {/* Refresh Button */}
                      <Tooltip title="Refresh internships">
                        <IconButton 
                          onClick={() => fetchInternships(true)} 
                          disabled={loading}
                          sx={{ 
                            color: 'primary.main',
                            '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.08) }
                          }}
                        >
                          <Refresh />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>

                  {/* Enhanced Search with Type Selection */}
                  <SmartJobSearch
                    searchTerm={filters.searchTerm}
                    searchType={filters.searchType}
                    onSearchChange={updateSearchTerm}
                    onSearchTypeChange={updateSearchType}
                    placeholder="Search internships, companies, skills..."
                    size="medium"
                    showSearchType={true}
                    suggestions={searchSuggestions.recentSearches}
                    trendingSearches={searchSuggestions.trendingSearches}
                    popularJobs={searchSuggestions.popularJobs}
                    popularCompanies={searchSuggestions.popularCompanies}
                    popularSkills={searchSuggestions.popularSkills}
                    popularLocations={searchSuggestions.popularLocations}
                    isLoading={loading || filtersLoading}
                  />
                </Box>

                {/* Internships Display */}
                {loading ? (
                  <Grid container spacing={2}>
                    {Array.from({ length: 6 }).map((_, index) => (
                      <Grid item xs={12} md={viewMode === 'grid' ? 6 : 12} key={index}>
                        <Card>
                          <CardContent>
                            <Skeleton variant="text" width="60%" height={32} />
                            <Skeleton variant="text" width="40%" height={24} />
                            <Skeleton variant="text" width="100%" height={80} />
                            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                              <Skeleton variant="rounded" width={80} height={24} />
                              <Skeleton variant="rounded" width={60} height={24} />
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : error ? (
                  <Box sx={{ py: 8, textAlign: 'center' }}>
                    <Typography variant="h6" color="error" gutterBottom>
                      {error}
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<Refresh />}
                      onClick={() => fetchInternships(true)}
                      sx={{ mt: 2 }}
                    >
                      Try Again
                    </Button>
                  </Box>
                ) : filteredInternships.length === 0 ? (
                  <Box sx={{ py: 8, textAlign: 'center' }}>
                    <Box sx={{ 
                      p: 6, 
                      borderRadius: 4,
                      background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.05)} 0%, ${alpha(theme.palette.info.main, 0.02)} 100%)`,
                      border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`
                    }}>
                      <School sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h5" gutterBottom>
                        No internships found
                      </Typography>
                      <Typography variant="body1" color="text.secondary" paragraph>
                        We couldn't find any internships matching your current filters.
                      </Typography>
                      <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 3 }}>
                        <Button
                          variant="outlined"
                          startIcon={<Clear />}
                          onClick={clearFilters}
                        >
                          Clear All Filters
                        </Button>
                        <Button
                          variant="contained"
                          startIcon={<Refresh />}
                          onClick={() => fetchInternships(true)}
                        >
                          Refresh
                        </Button>
                      </Stack>
                    </Box>
                  </Box>
                ) : (
                  <Grid container spacing={3}>
                    {sortedInternships.map((internship) => (
                      <Grid item xs={12} md={viewMode === 'grid' ? 6 : 12} key={internship._id}>
                        <Card 
                          sx={{ 
                            height: '100%',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              boxShadow: theme.shadows[8],
                              transform: 'translateY(-2px)'
                            },
                            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                          }}
                          onClick={() => navigate(`/app/jobs/${internship._id}`)}
                        >
                          <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, lineHeight: 1.3 }}>
                                  {internship.title}
                                </Typography>
                                <Typography variant="body2" color="primary.main" sx={{ fontWeight: 600, mb: 0.5 }}>
                                  {internship.company}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <LocationOn fontSize="small" />
                                  {internship.location}
                                </Typography>
                              </Box>
                              <IconButton size="small" sx={{ color: 'text.secondary' }}>
                                <BookmarkBorder />
                              </IconButton>
                            </Box>

                            <Typography 
                              variant="body2" 
                              color="text.secondary" 
                              sx={{ 
                                mb: 2, 
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                              }}
                            >
                              {internship.description}
                            </Typography>

                            {/* Skills */}
                            {internship.skills && internship.skills.length > 0 && (
                              <Box sx={{ mb: 2 }}>
                                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                                  {internship.skills.slice(0, 3).map((skill, index) => (
                                    <Chip
                                      key={index}
                                      label={skill}
                                      size="small"
                                      variant="outlined"
                                      sx={{ borderRadius: 2 }}
                                    />
                                  ))}
                                  {internship.skills.length > 3 && (
                                    <Chip
                                      label={`+${internship.skills.length - 3} more`}
                                      size="small"
                                      variant="outlined"
                                      color="primary"
                                      sx={{ borderRadius: 2 }}
                                    />
                                  )}
                                </Stack>
                              </Box>
                            )}

                            {/* Footer */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 2, borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                {internship.stipend && (
                                  <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
                                    {internship.stipend.currency} {internship.stipend.amount.toLocaleString()}/month
                                  </Typography>
                                )}
                                <Chip
                                  label="Internship"
                                  size="small"
                                  color="info"
                                  sx={{ borderRadius: 2 }}
                                />
                              </Box>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(internship.createdAt).toLocaleDateString()}
                              </Typography>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Box>
            </Box>
          )}

          {/* Mobile Layout */}
          {!isDesktop && (
            <Box>
              {/* Mobile Header with Filter Button */}
              <Box sx={{ 
                mb: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 2
              }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {loading ? 'Loading...' : `${filteredInternships.length} Internships`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Find your perfect internship
                  </Typography>
                </Box>
                
                <Button
                  variant="outlined"
                  startIcon={<FilterAlt />}
                  onClick={() => setSidebarOpen(true)}
                  sx={{ borderRadius: 2 }}
                  color="primary"
                >
                  Filters {getActiveFiltersCount() > 0 && `(${getActiveFiltersCount()})`}
                </Button>
              </Box>

              {/* Mobile Search */}
              <Box sx={{ mb: 3 }}>
                <SmartJobSearch
                  searchTerm={filters.searchTerm}
                  searchType={filters.searchType}
                  onSearchChange={updateSearchTerm}
                  onSearchTypeChange={updateSearchType}
                  placeholder="Search internships..."
                  size="small"
                  showSearchType={false}
                  suggestions={searchSuggestions.recentSearches}
                  trendingSearches={searchSuggestions.trendingSearches}
                  popularJobs={searchSuggestions.popularJobs}
                  popularCompanies={searchSuggestions.popularCompanies}
                  popularSkills={searchSuggestions.popularSkills}
                  popularLocations={searchSuggestions.popularLocations}
                  isLoading={loading || filtersLoading}
                />
              </Box>

              {/* Mobile Controls */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 3,
                flexWrap: 'wrap',
                gap: 1
              }}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Sort by</InputLabel>
                  <Select
                    value={filters.sortBy || 'date'}
                    onChange={(e) => updateFilter('sortBy', e.target.value)}
                    label="Sort by"
                  >
                    <MenuItem value="date">Latest</MenuItem>
                    <MenuItem value="title">Title</MenuItem>
                    <MenuItem value="company">Company</MenuItem>
                    <MenuItem value="location">Location</MenuItem>
                  </Select>
                </FormControl>

                <ToggleButtonGroup
                  value={viewMode}
                  exclusive
                  onChange={(_, newMode) => newMode && setViewMode(newMode)}
                  size="small"
                >
                  <ToggleButton value="list">
                    <ViewList />
                  </ToggleButton>
                  <ToggleButton value="grid">
                    <ViewModule />
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              {/* Mobile Internships Display */}
              {loading ? (
                <Stack spacing={2}>
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Card key={index}>
                      <CardContent>
                        <Skeleton variant="text" width="60%" height={24} />
                        <Skeleton variant="text" width="40%" height={20} />
                        <Skeleton variant="text" width="100%" height={60} />
                        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                          <Skeleton variant="rounded" width={60} height={20} />
                          <Skeleton variant="rounded" width={50} height={20} />
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              ) : filteredInternships.length === 0 ? (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <School sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    No internships found
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Try adjusting your filters or search terms.
                  </Typography>
                  <Stack direction="row" spacing={2} justifyContent="center">
                    <Button
                      variant="outlined"
                      onClick={clearFilters}
                      size="small"
                    >
                      Clear Filters
                    </Button>
                    <Button
                      variant="contained"
                      onClick={() => fetchInternships(true)}
                      size="small"
                    >
                      Refresh
                    </Button>
                  </Stack>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {sortedInternships.map((internship) => (
                    <Grid item xs={12} sm={viewMode === 'grid' ? 6 : 12} key={internship._id}>
                      <Card 
                        sx={{ 
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            boxShadow: theme.shadows[4],
                          }
                        }}
                        onClick={() => navigate(`/app/jobs/${internship._id}`)}
                      >
                        <CardContent sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                                {internship.title}
                              </Typography>
                              <Typography variant="body2" color="primary.main" sx={{ fontWeight: 500 }}>
                                {internship.company}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                <LocationOn fontSize="small" />
                                {internship.location}
                              </Typography>
                            </Box>
                            <IconButton size="small">
                              <BookmarkBorder />
                            </IconButton>
                          </Box>

                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ 
                              mb: 2, 
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}
                          >
                            {internship.description}
                          </Typography>

                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Stack direction="row" spacing={0.5}>
                              {internship.skills.slice(0, 2).map((skill, index) => (
                                <Chip
                                  key={index}
                                  label={skill}
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontSize: '0.7rem', height: 20 }}
                                />
                              ))}
                            </Stack>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(internship.createdAt).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}
        </Container>
      </Box>

      {/* Scroll to top button */}
      {showScrollTop && (
        <Fab
          size="small"
          color="primary"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={scrollToTop}
        >
          <KeyboardArrowUp />
        </Fab>
      )}

      {/* Floating components */}
      <FloatingChatButton />
      <FloatingContact />
    </>
  );
};

export default InternshipsPage;
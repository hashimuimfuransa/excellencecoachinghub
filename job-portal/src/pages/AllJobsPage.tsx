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
import CompactJobFilter from '../components/CompactJobFilter';
import SmartJobSearch, { SearchType } from '../components/SmartJobSearch';
import { useJobFilters, FilterState } from '../hooks/useJobFilters';
import jobService from '../services/jobService';
import { internshipService } from '../services/internshipService';

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
    'internship': School,
    'intern': School,
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
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [applicationDialogOpen, setApplicationDialogOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Enhanced filtering using the custom hook
  const {
    filters,
    filteredJobs,
    totalJobs,
    setFilters,
    updateFilter,
    updateSearchTerm,
    updateSearchType,
    clearFilters,
    isLoading: filtersLoading,
    searchSuggestions
  } = useJobFilters({
    initialJobs: jobs,
    categories: categories.map(cat => ({
      key: cat.category,
      label: cat.displayName,
      count: cat.count || 0
    })),
    syncWithUrl: true
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Helper function to get the current content type
  const getCurrentContentType = () => {
    const selectedCategories = filters.categories || [];
    const isShowingInternships = selectedCategories.includes('internships') && selectedCategories.length === 1;
    const isShowingJobs = selectedCategories.includes('jobs') && selectedCategories.length === 1;
    
    if (isShowingInternships) return 'internships';
    if (isShowingJobs) return 'jobs';
    return 'opportunities';
  };

  // Helper function to get display text based on current filters
  const getDisplayInfo = () => {
    const selectedCategories = filters.categories || [];
    const isShowingInternships = selectedCategories.includes('internships') && selectedCategories.length === 1;
    const isShowingJobs = selectedCategories.includes('jobs') && selectedCategories.length === 1;
    const isShowingAll = selectedCategories.length === 0 || selectedCategories.includes('all');
    
    if (isShowingInternships) {
      return {
        title: `${filteredJobs.length} Internship${filteredJobs.length === 1 ? '' : 's'} Found`,
        subtitle: 'Showing all available internship opportunities'
      };
    } else if (isShowingJobs) {
      return {
        title: `${filteredJobs.length} Job${filteredJobs.length === 1 ? '' : 's'} Found`,
        subtitle: 'Showing all available job positions'
      };
    } else if (isShowingAll) {
      return {
        title: `${filteredJobs.length} Opportunit${filteredJobs.length === 1 ? 'y' : 'ies'} Found`,
        subtitle: 'Showing all available positions and internships'
      };
    } else {
      // Multiple categories or specific categories selected
      const categoryNames = selectedCategories
        .filter(cat => cat !== 'jobs' && cat !== 'internships')
        .map(cat => cat.charAt(0).toUpperCase() + cat.slice(1))
        .join(', ');
      
      if (categoryNames) {
        return {
          title: `${filteredJobs.length} ${categoryNames} Opportunit${filteredJobs.length === 1 ? 'y' : 'ies'} Found`,
          subtitle: `Showing opportunities in ${categoryNames.toLowerCase()}`
        };
      } else {
        return {
          title: `${filteredJobs.length} Opportunit${filteredJobs.length === 1 ? 'y' : 'ies'} Found`,
          subtitle: 'Showing filtered opportunities'
        };
      }
    }
  };

  // Helper function to transform internship to job format
  const transformInternshipToJob = (internship: any): Job => {
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
      category: 'internships',
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
      createdAt: internship.createdAt || internship.postedDate,
      updatedAt: internship.updatedAt,
      employerId: internship.employer,
      employer: internship.employer,
      status: internship.status,
      applicationUrl: undefined,
      applicationInstructions: internship.applicationProcedure,
      isCurated: internship.isCurated || false,
      relatedCourses: internship.relatedCourses || [],
      psychometricTests: internship.psychometricTests || []
    };
  };

  // Fetch jobs and internships
  const fetchJobs = async (refresh = false) => {
    if (refresh) {
      setError(null);
    }
    setLoading(true);
    
    try {
      const MAX_ITEMS_TO_FETCH = 1000; // Reasonable limit to prevent UI lag
      
      // Fetch jobs and internships in parallel
      const [jobsResponse, internshipsResponse] = await Promise.all([
        // Fetch jobs (including expired jobs to show all available jobs)
        jobService.getJobs({}, 1, MAX_ITEMS_TO_FETCH, undefined, true).catch(err => {
          console.warn('Error fetching jobs:', err);
          return { data: [], pagination: { total: 0 } };
        }),
        // Fetch internships (now includes both dedicated internships and jobs with category 'internships')
        internshipService.getInternships({ limit: MAX_ITEMS_TO_FETCH }).catch(err => {
          console.warn('Error fetching internships:', err);
          return { data: [], pagination: { total: 0 } };
        })
      ]);

      // Filter out jobs with category 'internships' to avoid duplication
      const allJobsData = jobsResponse.data || [];
      const jobs = allJobsData.filter(job => 
        job.category !== 'internships' && 
        job.category !== 'Internship' &&
        job.jobType !== 'internship'
      );
      const internships = internshipsResponse.data || [];
      
      // Transform internships to job format
      const transformedInternships = internships.map(transformInternshipToJob);
      
      // Combine jobs and transformed internships
      const allJobs = [...jobs, ...transformedInternships];
      
      setJobs(allJobs);
      
      const totalCount = jobs.length + internships.length;
      
      console.log(`Loaded ${jobs.length} jobs (excluded ${allJobsData.length - jobs.length} internship jobs) and ${internships.length} internships (${totalCount} total)`);
      
    } catch (err) {
      console.error('Error fetching jobs and internships:', err);
      setError('Failed to load jobs and internships. Please try again.');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    setCategoriesLoading(true);
    try {
      // Fetch both job and internship categories in parallel
      const [jobCategories, internshipCategories] = await Promise.all([
        jobService.getJobCategories().catch(err => {
          console.warn('Error fetching job categories:', err);
          return [];
        }),
        internshipService.getInternshipCategories().catch(err => {
          console.warn('Error fetching internship categories:', err);
          return [];
        })
      ]);

      // Merge categories and ensure Internship category exists
      const combinedCategories = [...(Array.isArray(jobCategories) ? jobCategories : [])];
      
      // Add internship categories if they exist
      if (Array.isArray(internshipCategories)) {
        internshipCategories.forEach(category => {
          if (!combinedCategories.find(c => c.category === category.category)) {
            combinedCategories.push(category);
          }
        });
      }
      
      // Ensure there's always an "Internship" category
      const hasInternshipCategory = combinedCategories.find(c => 
        c.category?.toLowerCase().includes('internship') || 
        c.displayName?.toLowerCase().includes('internship')
      );
      
      if (!hasInternshipCategory) {
        combinedCategories.push({
          category: 'Internship',
          displayName: 'Internship',
          count: 0
        });
      }

      setCategories(combinedCategories);
    } catch (err) {
      console.error('Error fetching categories:', err);
      // Set some default categories including internship if API fails
      setCategories([{
        category: 'Internship',
        displayName: 'Internship',
        count: 0
      }]);
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

  // Update page title based on current filters
  useEffect(() => {
    const displayInfo = getDisplayInfo();
    const selectedCategories = filters.categories || [];
    
    if (selectedCategories.includes('internships') && selectedCategories.length === 1) {
      document.title = 'Internships - ExJobNet';
    } else if (selectedCategories.includes('jobs') && selectedCategories.length === 1) {
      document.title = 'Jobs - ExJobNet';
    } else if (selectedCategories.length === 0) {
      document.title = 'All Opportunities - ExJobNet';
    } else {
      document.title = 'Opportunities - ExJobNet';
    }
  }, [filters.categories, filteredJobs.length]);

  // Note: We no longer redirect logged-in users automatically
  // This allows logged-in users to browse all jobs if they want to



  // Get sorted jobs based on current filter state
  const getSortedJobs = () => {
    return [...filteredJobs].sort((a, b) => {
      switch (filters.sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'company':
          return a.company.localeCompare(b.company);
        case 'location':
          return a.location.localeCompare(b.location);
        case 'salary-high':
          const salaryA = a.salary?.max || 0;
          const salaryB = b.salary?.max || 0;
          return salaryB - salaryA;
        case 'salary-low':
          const salaryMinA = a.salary?.min || 0;
          const salaryMinB = b.salary?.min || 0;
          return salaryMinA - salaryMinB;
        case 'date':
        default:
          // Handle both string and Date types for createdAt
          const dateA = typeof a.createdAt === 'string' ? new Date(a.createdAt) : a.createdAt;
          const dateB = typeof b.createdAt === 'string' ? new Date(b.createdAt) : b.createdAt;
          return dateB.getTime() - dateA.getTime();
      }
    });
  };

  const displayJobs = getSortedJobs();

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




  // Helper function to count active filters based on the new filter system
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
      {/* Navigation Bar - Always show for all users */}
      <Navbar />
      
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
              Filter {getCurrentContentType().charAt(0).toUpperCase() + getCurrentContentType().slice(1)}
            </Typography>
            <IconButton onClick={() => setSidebarOpen(false)} size="small">
              <Clear fontSize="small" />
            </IconButton>
          </Box>
          
          {/* Post Job Section in Sidebar */}
          <Card 
            sx={{ 
              mb: 3, 
              background: 'linear-gradient(45deg, #4caf50 30%, #2e7d32 90%)',
              color: 'white',
              cursor: 'pointer',
              transition: 'transform 0.2s ease',
              '&:hover': {
                transform: 'scale(1.02)',
              }
            }}
            onClick={() => {
              setSidebarOpen(false);
              user ? navigate('/app/jobs/create') : navigate('/register?role=employer');
            }}
          >
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <PostAdd sx={{ fontSize: 28 }} />
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Post a Job
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {user ? "Find the perfect candidates" : "Register as employer"}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
          
          {/* Location Filter for Mobile */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <LocationOn fontSize="small" />
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
                <MenuItem value="">
                  <em>All Locations</em>
                </MenuItem>
                <MenuItem value="Rwanda">🇷🇼 Rwanda</MenuItem>
                <MenuItem value="Kenya">🇰🇪 Kenya</MenuItem>
                <MenuItem value="Uganda">🇺🇬 Uganda</MenuItem>
                <MenuItem value="Tanzania">🇹🇿 Tanzania</MenuItem>
                <MenuItem value="Ethiopia">🇪🇹 Ethiopia</MenuItem>
                <MenuItem value="South Africa">🇿🇦 South Africa</MenuItem>
                <MenuItem value="Nigeria">🇳🇬 Nigeria</MenuItem>
                <MenuItem value="Ghana">🇬🇭 Ghana</MenuItem>
                <MenuItem value="United States">🇺🇸 United States</MenuItem>
                <MenuItem value="United Kingdom">🇬🇧 United Kingdom</MenuItem>
                <MenuItem value="Canada">🇨🇦 Canada</MenuItem>
                <MenuItem value="Germany">🇩🇪 Germany</MenuItem>
                <MenuItem value="France">🇫🇷 France</MenuItem>
                <MenuItem value="Netherlands">🇳🇱 Netherlands</MenuItem>
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
            totalJobs={filteredJobs.length}
            isLoading={loading || filtersLoading}
            type="jobs"
          />
        </Box>
      </Drawer>

      <Box sx={{ 
        minHeight: '100vh', 
        backgroundColor: 'background.default'
      }}>
        {/* Hero Section */}
        <Box sx={{
          minHeight: { xs: '20vh', sm: '25vh', md: '30vh' },
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
                Find Your Dream Jobs
              </Typography>
              <Typography
                variant={isMobile ? 'body1' : 'h6'}
                sx={{
                  mb: { xs: 1.5, sm: 2, md: 2.5 },
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
                Discover opportunities from top companies worldwide
              </Typography>
              
              {/* Small text about services */}
              <Typography
                variant="body2"
                sx={{
                  mb: { xs: 2, sm: 2.5, md: 3 },
                  maxWidth: { xs: '85%', sm: '450px', md: '500px' },
                  mx: 'auto',
                  fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.9rem' },
                  color: 'rgba(255,255,255,0.7)',
                  textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                  lineHeight: { xs: 1.4, md: 1.5 },
                  textAlign: 'center',
                  px: { xs: 1, sm: 0 },
                  fontStyle: 'italic'
                }}
              >
                Plus job preparation services and professional networking to boost your career
              </Typography>
              
              {/* Enhanced Get Started Button */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center',
                mt: { xs: 1, sm: 1.5, md: 2 }
              }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/login')}
                  sx={{
                    px: { xs: 4, sm: 5, md: 6 },
                    py: { xs: 1.8, sm: 2.2, md: 2.8 },
                    borderRadius: 4,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
                    boxShadow: '0 12px 32px rgba(102, 126, 234, 0.4), 0 4px 16px rgba(118, 75, 162, 0.3)',
                    fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem' },
                    fontWeight: 700,
                    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
                    textTransform: 'none',
                    letterSpacing: '-0.02em',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: '-100%',
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                      transition: 'left 0.6s ease',
                    },
                    '&:hover': {
                      transform: 'translateY(-4px) scale(1.05)',
                      boxShadow: '0 20px 48px rgba(102, 126, 234, 0.5), 0 8px 24px rgba(118, 75, 162, 0.4)',
                      background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 50%, #ec4899 100%)',
                      '&::before': {
                        left: '100%',
                      }
                    },
                    '&:active': {
                      transform: 'scale(0.98) translateY(-2px)',
                    }
                  }}
                >
                  Get Started
                </Button>
              </Box>
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
            {/* Location Filter */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', md: 'row' },
                gap: 2,
                alignItems: { xs: 'stretch', md: 'center' }
              }}>
                <Box sx={{ flex: { xs: 1, md: 'none' }, width: { xs: '100%', md: '300px' } }}>
                  <FormControl fullWidth size={isMobile ? 'small' : 'medium'}>
                    <InputLabel sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 0.5,
                      '& .MuiInputLabel-asterisk': { display: 'none' }
                    }}>
                      <LocationOn fontSize="small" />
                      Location
                    </InputLabel>
                    <Select
                      value={filters.location || ''}
                      onChange={(e) => updateFilter('location', e.target.value)}
                      label="Location"
                      displayEmpty
                      sx={{
                        borderRadius: 2,
                        '& .MuiOutlinedInput-root': {
                          '&:hover fieldset': {
                            borderColor: 'primary.main',
                          },
                        }
                      }}
                    >
                      <MenuItem value="">
                        <em>All Locations</em>
                      </MenuItem>
                      <MenuItem value="Rwanda">🇷🇼 Rwanda</MenuItem>
                      <MenuItem value="Kenya">🇰🇪 Kenya</MenuItem>
                      <MenuItem value="Uganda">🇺🇬 Uganda</MenuItem>
                      <MenuItem value="Tanzania">🇹🇿 Tanzania</MenuItem>
                      <MenuItem value="Ethiopia">🇪🇹 Ethiopia</MenuItem>
                      <MenuItem value="South Africa">🇿🇦 South Africa</MenuItem>
                      <MenuItem value="Nigeria">🇳🇬 Nigeria</MenuItem>
                      <MenuItem value="Ghana">🇬🇭 Ghana</MenuItem>
                      <MenuItem value="United States">🇺🇸 United States</MenuItem>
                      <MenuItem value="United Kingdom">🇬🇧 United Kingdom</MenuItem>
                      <MenuItem value="Canada">🇨🇦 Canada</MenuItem>
                      <MenuItem value="Germany">🇩🇪 Germany</MenuItem>
                      <MenuItem value="France">🇫🇷 France</MenuItem>
                      <MenuItem value="Netherlands">🇳🇱 Netherlands</MenuItem>
                      <MenuItem value="Dubai">🇦🇪 Dubai</MenuItem>
                      <MenuItem value="Remote">💻 Remote</MenuItem>
                      <MenuItem value="International">🌍 International</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    {filters.location && (
                      <Chip
                        size="small"
                        label={`📍 ${filters.location}`}
                        onDelete={() => updateFilter('location', '')}
                        color="primary"
                        variant="outlined"
                        sx={{ borderRadius: 2 }}
                      />
                    )}
                    <Typography variant="body2" color="text.secondary">
                      {filters.location ? 
                        `Showing ${getCurrentContentType()} in ${filters.location}` : 
                        `Select a location to filter ${getCurrentContentType()}`
                      }
                    </Typography>
                  </Stack>
                </Box>
              </Box>
            </Box>

            {/* Enhanced Search with Type Selection */}
            <SmartJobSearch
              searchTerm={filters.searchTerm}
              searchType={filters.searchType}
              onSearchChange={updateSearchTerm}
              onSearchTypeChange={updateSearchType}
              placeholder={isMobile ? `Search ${getCurrentContentType()}...` : undefined}
              size={isMobile ? 'small' : 'medium'}
              showSearchType={!isMobile}
              recentSearches={searchSuggestions.recentSearches}
              trendingSearches={searchSuggestions.trendingSearches}
              popularJobs={searchSuggestions.popularJobs}
              popularCompanies={searchSuggestions.popularCompanies}
              popularSkills={searchSuggestions.popularSkills}
              popularLocations={searchSuggestions.popularLocations}
              isLoading={loading || filtersLoading}
            />
            
            {/* Category Filter Tabs */}
            <Box sx={{ mt: 3, mb: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                Browse by Category
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                {[
                  { key: 'all', label: 'All Opportunities', color: 'primary', icon: '🔍' },
                  { key: 'jobs', label: 'Jobs', color: 'primary', icon: '💼' },
                  { key: 'internships', label: 'Internships', color: 'success', icon: '🎓' },
                  { key: 'access_to_finance', label: 'Access to Finance', color: 'warning', icon: '💰' },
                  { key: 'tenders', label: 'Tenders', color: 'error', icon: '📋' },
                  { key: 'trainings', label: 'Trainings', color: 'info', icon: '📚' },
                  { key: 'scholarships', label: 'Scholarships', color: 'secondary', icon: '🎖️' }
                ].map((category) => {
                  const isSelected = filters.categories?.includes(category.key) || (category.key === 'all' && !filters.categories?.length);
                  return (
                    <Chip
                      key={category.key}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <span>{category.icon}</span>
                          {category.label}
                        </Box>
                      }
                      onClick={() => {
                        if (category.key === 'all') {
                          updateFilter('categories', []);
                        } else {
                          const currentCategories = filters.categories || [];
                          const newCategories = currentCategories.includes(category.key)
                            ? currentCategories.filter(c => c !== category.key)
                            : [category.key];
                          updateFilter('categories', newCategories);
                        }
                      }}
                      variant={isSelected ? 'filled' : 'outlined'}
                      color={category.color as any}
                      sx={{
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        borderRadius: 3,
                        height: 36,
                        fontWeight: isSelected ? 700 : 500,
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: `0 6px 20px ${alpha(theme.palette[category.color as keyof typeof theme.palette].main, 0.25)}`
                        },
                        ...(isSelected && {
                          boxShadow: `0 4px 16px ${alpha(theme.palette[category.color as keyof typeof theme.palette].main, 0.3)}`
                        })
                      }}
                    />
                  );
                })}
              </Stack>
            </Box>
            
            <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }} alignItems="center" sx={{ mt: 2 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  Showing {filteredJobs.length.toLocaleString()} of {totalJobs.toLocaleString()} {getCurrentContentType()}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Button
                    variant="outlined"
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
                  <ToggleButtonGroup
                    value={viewMode}
                    exclusive
                    onChange={(_e, newMode) => newMode && setViewMode(newMode)}
                    size="small"
                  >
                    <ToggleButton value="grid">
                      <ViewModule fontSize="small" />
                    </ToggleButton>
                    <ToggleButton value="list">
                      <ViewList fontSize="small" />
                    </ToggleButton>
                  </ToggleButtonGroup>
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
            {/* Enhanced Filters Sidebar - Desktop Only */}
            <Box sx={{ 
              width: { xs: '100%', md: '25%' },
              display: { xs: 'none', md: 'block' },
              position: 'sticky',
              top: 100,
              flexShrink: 0
            }}>
              <CompactJobFilter
                filters={filters}
                onFilterChange={updateFilter}
                onClearFilters={clearFilters}
                totalJobs={filteredJobs.length}
                isLoading={loading || filtersLoading}
                type="jobs"
              />
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <Box>
                    <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ fontWeight: 700, mb: 0.5 }}>
                      {loading ? 'Loading...' : getDisplayInfo().title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', md: '0.875rem' } }}>
                      {getDisplayInfo().subtitle}
                    </Typography>
                  </Box>
                  
                  {/* Mobile Filter Button */}
                  {isMobile && (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<FilterAlt fontSize="small" />}
                      onClick={() => setSidebarOpen(true)}
                      sx={{ 
                        borderRadius: 2,
                        fontSize: '0.8rem'
                      }}
                    >
                      Filters {getActiveFiltersCount() > 0 && `(${getActiveFiltersCount()})`}
                    </Button>
                  )}
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
                      md: 'repeat(2, 1fr)',
                      lg: 'repeat(2, 1fr)',
                      xl: 'repeat(2, 1fr)'
                    },
                    gap: { xs: 2, sm: 1.5, md: 1.5, lg: 2 }
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
                      We couldn't find any {getCurrentContentType()} matching your criteria. Try adjusting your search terms or browse different categories to discover new opportunities.
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                      <Button 
                        variant="outlined" 
                        onClick={() => {
                          clearFilters();
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
                      md: 'repeat(2, 1fr)', // Three columns on medium screens (tablets)
                      lg: 'repeat(2, 1fr)', // Three columns on large screens
                      xl: 'repeat(3, 1fr)'  // Four columns on extra large screens
                    } : undefined,
                    gap: { xs: 1, sm: 1.5, md: 1.5, lg: 2 },
                    maxWidth: '100%',
                    width: '100%'
                  }}>
                    {displayJobs.map((job) => (
                      <Box 
                        key={job._id}
                        sx={{
                          maxWidth: { xs: '100%', sm: '100%', md: '350px', lg: '350px' },
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
                            minHeight: { xs: '180px', sm: '200px', md: '280px' },
                            '&:hover': {
                              transform: { xs: 'translateY(-2px)', sm: 'translateY(-4px)', md: 'translateY(-8px)' },
                              boxShadow: `0 ${isMobile ? '6px 20px' : '12px 40px'} ${alpha(theme.palette.common.black, 0.15)}`,
                              border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
                            }
                          }}
                          onClick={() => user ? navigate(`/app/jobs/${job._id}`) : navigate(`/login?redirect=job&jobId=${job._id}`)}
                        >
                          <CardContent sx={{ 
                            p: { xs: 1.2, sm: 1.5, md: 2 }, 
                            height: '100%', 
                            display: 'flex', 
                            flexDirection: 'column',
                            '&:last-child': { pb: { xs: 1.2, sm: 1.5, md: 2 } }
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
                                  user ? navigate(`/app/jobs/${job._id}`) : navigate(`/login?redirect=job&jobId=${job._id}`);
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
        
        {/* Floating Post Job Button */}
        <Tooltip title={user ? "Post a Job" : "Register as Employer to Post Jobs"} placement="left">
          <Fab
            color="success"
            size={isMobile ? 'medium' : 'large'}
            onClick={() => user ? navigate('/app/jobs/create') : navigate('/register?role=employer')}
            sx={{
              position: 'fixed',
              bottom: { xs: showScrollTop ? 90 : 20, md: showScrollTop ? 100 : 24 },
              right: { xs: 16, md: 24 },
              zIndex: 1000,
              backgroundColor: 'success.main',
              color: 'white',
              boxShadow: '0 8px 32px rgba(76, 175, 80, 0.3)',
              '&:hover': {
                transform: 'scale(1.1)',
                backgroundColor: 'success.dark',
                boxShadow: '0 12px 48px rgba(76, 175, 80, 0.4)',
              },
              transition: 'all 0.3s ease',
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%': {
                  boxShadow: '0 8px 32px rgba(76, 175, 80, 0.3)',
                },
                '50%': {
                  boxShadow: '0 8px 32px rgba(76, 175, 80, 0.6)',
                },
                '100%': {
                  boxShadow: '0 8px 32px rgba(76, 175, 80, 0.3)',
                },
              },
            }}
          >
            <PostAdd fontSize={isMobile ? 'medium' : 'large'} />
          </Fab>
        </Tooltip>

        {/* Scroll to Top Button */}
        {showScrollTop && (
          <Fab
            color="primary"
            size={isMobile ? 'medium' : 'large'}
            onClick={handleScrollTop}
            sx={{
              position: 'fixed',
              bottom: { xs: 160, md: 180 },
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

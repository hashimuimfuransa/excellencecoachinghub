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
import { useAuth, UserRole } from '../contexts/AuthContext';
import { jobService } from '../services/jobService';
import { internshipService } from '../services/internshipService';
import { userService } from '../services/userService';
import { profileService } from '../services/profileService';
import { shouldRequestNewTest } from '../services/simplePsychometricService';
import { JobCategory } from '../types/job';
import { User } from '../types/user';

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
  const { user, hasRole } = useAuth();
  const [searchParams] = useSearchParams();
  
  // Responsive breakpoints
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  
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
  const [selectedCategory, setSelectedCategory] = useState<JobCategory | 'all'>(
    (searchParams.get('category') as JobCategory) || 'all'
  );
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  
  // New state for modern UI
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'salary' | 'deadline'>('newest');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [jobTypeFilter, setJobTypeFilter] = useState<string>('');
  
  // Tab state for different job views
  const [currentTab, setCurrentTab] = useState(0);
  const [aiMatchedJobs, setAiMatchedJobs] = useState<Job[]>([]);
  const [aiJobsLoading, setAiJobsLoading] = useState(false);
  const [aiMeta, setAiMeta] = useState<{
    totalJobsEvaluated: number;
    matchesFound: number;
    userSkillsCount: number;
    averageMatchPercentage: number;
    userProfileSummary?: {
      skills: number;
      education: number;
      experience: number;
      location: string;
    };
  } | null>(null);
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

  // Transform internship to job format (similar to AllJobsPage)
  const transformInternshipToJob = (internship: any): Job => {
    return {
      _id: internship._id,
      title: internship.title,
      company: internship.company,
      location: internship.location,
      salary: internship.stipend ? {
        min: internship.stipend.amount,
        max: internship.stipend.amount,
        currency: internship.stipend.currency
      } : undefined,
      jobType: 'Internship',
      category: JobCategory.INTERNSHIPS,
      experienceLevel: internship.experienceLevel,
      educationLevel: internship.educationLevel,
      skills: internship.skills || [],
      status: internship.status || 'active',
      description: internship.description,
      requirements: internship.requirements || [],
      responsibilities: internship.responsibilities || [],
      benefits: internship.benefits || [],
      applicationDeadline: internship.applicationDeadline,
      employer: {
        _id: internship.employer?._id || '',
        firstName: internship.employer?.firstName || '',
        lastName: internship.employer?.lastName || '',
        company: internship.company
      },
      applicationsCount: internship.applicationsCount || 0,
      viewsCount: internship.viewsCount || 0,
      createdAt: internship.createdAt,
      updatedAt: internship.updatedAt,
      isCurated: internship.isCurated || false,
      contactInfo: internship.contactInfo,
      isExternalJob: false
    };
  };

  // Check if user should request new test instead of accessing jobs
  useEffect(() => {
    const checkTestCompletion = () => {
      if (shouldRequestNewTest()) {
        console.log('🚫 User has completed tests, redirecting to request new test');
        // Show a message and redirect to tests page instead of showing jobs
        setError('You have completed your available tests. Please request a new test from your super admin to access new job opportunities.');
      }
    };

    checkTestCompletion();
  }, []);

  // Category configuration
  const categories = [
    { 
      key: 'all', 
      label: 'All Opportunities', 
      icon: Work, 
      color: 'primary.main',
      description: 'Browse all available opportunities'
    },
    { 
      key: JobCategory.JOBS, 
      label: 'Jobs', 
      icon: WorkOutline, 
      color: 'primary.main',
      description: 'Traditional employment opportunities'
    },
    { 
      key: JobCategory.TENDERS, 
      label: 'Tenders', 
      icon: Gavel, 
      color: 'info.main',
      description: 'Business tenders and procurement opportunities'
    },
    { 
      key: JobCategory.TRAININGS, 
      label: 'Trainings', 
      icon: School, 
      color: 'success.main',
      description: 'Professional development and training programs'
    },
    { 
      key: JobCategory.INTERNSHIPS, 
      label: 'Internships', 
      icon: EmojiEvents, 
      color: 'warning.main',
      description: 'Internship and entry-level opportunities'
    },
    { 
      key: JobCategory.SCHOLARSHIPS, 
      label: 'Scholarships', 
      icon: CardGiftcard, 
      color: 'secondary.main',
      description: 'Educational scholarships and grants'
    },
    { 
      key: JobCategory.ACCESS_TO_FINANCE, 
      label: 'Access to Finance', 
      icon: AccountBalance, 
      color: 'error.main',
      description: 'Funding and financial opportunities'
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

  // Fetch category counts separately
  const fetchCategoryCounts = async () => {
    try {
      // Fetch both jobs and internships in parallel (matching AllJobsPage implementation)
      const [jobsResponse, internshipsResponse] = await Promise.all([
        jobService.getJobs({}, 1, 1000).catch(err => {
          console.warn('Error fetching jobs for counts:', err);
          return { data: [] };
        }),
        internshipService.getInternships({ limit: 1000 }).catch(err => {
          console.warn('Error fetching internships for counts:', err);
          return { data: [] };
        })
      ]);

      const jobs = jobsResponse.data || [];
      const internships = internshipsResponse.data || [];
      
      // Calculate counts for jobs (only active jobs)
      const counts: Record<string, number> = {};
      jobs.filter(job => job.status === 'active').forEach((job: Job) => {
        const category = job.category || 'other';
        counts[category] = (counts[category] || 0) + 1;
      });
      
      // Add internship counts (only active internships)
      const activeInternships = internships.filter(internship => 
        internship.status === 'active' || !internship.status
      );
      counts[JobCategory.INTERNSHIPS] = (counts[JobCategory.INTERNSHIPS] || 0) + activeInternships.length;
      
      setCategoryCounts(counts);
    } catch (error) {
      console.error('Error fetching category counts:', error);
    }
  };

  // Fetch jobs with pagination
  const fetchJobs = async (page: number = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      // Build filter object
      const filters: any = {
        status: 'active'
      };

      // Add filters
      if (searchTerm) filters.search = searchTerm;
      if (locationFilter) filters.location = locationFilter;
      if (selectedCategory !== 'all') filters.category = selectedCategory as string;
      if (jobTypeFilter) filters.jobType = jobTypeFilter;
      if (experienceFilter) filters.experienceLevel = experienceFilter;
      if (companyFilter) filters.company = companyFilter;
      
      // Add sorting
      switch (sortBy) {
        case 'salary':
          filters.sortBy = 'salary.min';
          filters.sortOrder = 'desc';
          break;
        case 'deadline':
          filters.sortBy = 'applicationDeadline';
          filters.sortOrder = 'asc';
          break;
        case 'oldest':
          filters.sortBy = 'createdAt';
          filters.sortOrder = 'asc';
          break;
        default: // newest
          filters.sortBy = 'createdAt';
          filters.sortOrder = 'desc';
      }

      // If internships category is selected, fetch from internship service
      if (selectedCategory === JobCategory.INTERNSHIPS) {
        const internshipFilters: any = {};
        if (searchTerm) internshipFilters.search = searchTerm;
        if (locationFilter) internshipFilters.location = locationFilter;
        if (experienceFilter) internshipFilters.experienceLevel = experienceFilter;
        
        // Fetch all internships first to get accurate counts
        const internshipsResponse = await internshipService.getInternships({
          ...internshipFilters,
          limit: 1000 // Get all internships
        });
        
        const allInternships = internshipsResponse.data || [];
        const transformedInternships = allInternships
          .map(transformInternshipToJob)
          .filter(job => job.status === 'active'); // Only show active internships
        
        // Apply client-side pagination
        const itemsPerPage = 12;
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedInternships = transformedInternships.slice(startIndex, endIndex);
        
        setJobs(paginatedInternships);
        setTotalPages(Math.ceil(transformedInternships.length / itemsPerPage));
        setTotalJobs(transformedInternships.length);
      } else if (selectedCategory === 'all') {
        // For "All Jobs", fetch both jobs and internships (matching AllJobsPage implementation)
        const [jobsResponse, internshipsResponse] = await Promise.all([
          jobService.getJobs({}, 1, 1000).catch(err => {
            console.warn('Error fetching jobs:', err);
            return { success: true, data: [], pagination: { total: 0, pages: 0 } };
          }),
          internshipService.getInternships({ limit: 1000 }).catch(err => {
            console.warn('Error fetching internships:', err);
            return { data: [] };
          })
        ]);

        const allJobsData = jobsResponse.success ? jobsResponse.data : [];
        const allInternships = internshipsResponse.data || [];
        
        // Filter out jobs with category 'internships' to avoid duplication
        const filteredJobs = allJobsData.filter((job: Job) => 
          job.category !== JobCategory.INTERNSHIPS && 
          job.jobType !== 'internship'
        );
        
        // Transform internships to job format and filter by active status
        const transformedInternships = allInternships
          .map(transformInternshipToJob)
          .filter(job => job.status === 'active');
        
        // Combine jobs and internships
        const allJobs = [...filteredJobs, ...transformedInternships];
        
        // Apply client-side filtering
        let filteredAllJobs = allJobs;
        
        // Filter to only show active jobs (matching the original behavior)
        filteredAllJobs = filteredAllJobs.filter(job => job.status === 'active');
        
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          filteredAllJobs = filteredAllJobs.filter(job => 
            job.title.toLowerCase().includes(searchLower) ||
            job.company.toLowerCase().includes(searchLower) ||
            job.location.toLowerCase().includes(searchLower) ||
            job.skills.some(skill => skill.toLowerCase().includes(searchLower))
          );
        }
        
        if (locationFilter) {
          const locationLower = locationFilter.toLowerCase();
          filteredAllJobs = filteredAllJobs.filter(job => 
            job.location.toLowerCase().includes(locationLower)
          );
        }
        
        if (jobTypeFilter) {
          filteredAllJobs = filteredAllJobs.filter(job => 
            job.jobType.toLowerCase() === jobTypeFilter.toLowerCase()
          );
        }
        
        if (experienceFilter) {
          filteredAllJobs = filteredAllJobs.filter(job => 
            job.experienceLevel.toLowerCase() === experienceFilter.toLowerCase()
          );
        }
        
        if (companyFilter) {
          const companyLower = companyFilter.toLowerCase();
          filteredAllJobs = filteredAllJobs.filter(job => 
            job.company.toLowerCase().includes(companyLower)
          );
        }
        
        // Apply client-side pagination
        const itemsPerPage = 12;
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedJobs = filteredAllJobs.slice(startIndex, endIndex);
        
        setJobs(paginatedJobs);
        setTotalPages(Math.ceil(filteredAllJobs.length / itemsPerPage));
        setTotalJobs(filteredAllJobs.length);
      } else {
        // For other specific categories, use job service
        const response = await jobService.getJobs(filters, page, 12);
        
        if (response.success) {
          setJobs(response.data);
          setTotalPages(response.pagination?.pages || 1);
          setTotalJobs(response.pagination?.total || 0);
        } else {
          setError(response.error || 'Failed to fetch jobs');
        }
      }
    } catch (error: any) {
      console.error('Error fetching jobs:', error);
      setError('Failed to load jobs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch AI-matched jobs with fresh profile data
  const fetchAIMatchedJobs = async () => {
    if (!user?._id) return;
    
    setAiJobsLoading(true);
    setError(null);
    
    try {
      console.log('🤖 Fetching enhanced AI-matched jobs for user:', user._id);
      
      // First, fetch fresh user data to ensure we have the most up-to-date profile
      console.log('🔍 Fetching fresh user profile data...');
      const freshUser = await userService.getUserProfile(user._id);
      console.log('📋 Fresh user data received:', freshUser);
      
      // Validate the fresh profile data
      const validation = await profileService.validateUserProfile(freshUser as User);
      console.log('✅ Profile validation result:', validation);
      
      // Check if profile has minimum data for job matching
      if (!validation || validation.completionPercentage < 20) {
        console.log('⚠️ Profile needs basic information for job matching. Completion:', validation?.completionPercentage || 0, '%');
        setSnackbarMessage('Please add basic information (name, email, location) to get job matches.');
        setSnackbarOpen(true);
        setAiMatchedJobs([]);
        setAiJobsLoading(false);
        return;
      }
      
      // Get user skills for basic validation
      const userSkills = (freshUser as User).skills || [];
      const allSkills = [...userSkills];
      
      // Add experience technologies
      const experienceSkills = ((freshUser as User).experience || [])
        .flatMap(exp => exp.technologies || [])
        .filter(tech => tech && tech.trim());
      allSkills.push(...experienceSkills);
      
      console.log('🎯 User skills for matching:', allSkills);
      console.log('🎓 User education:', (freshUser as User).education?.length || 0, 'entries');
      
      // Still call the API even if no skills/education - the backend can handle basic matching
      if (allSkills.length === 0 && (!freshUser.education || freshUser.education.length === 0)) {
        console.log('⚠️ No skills or education found, but will still try basic job matching');
        setSnackbarMessage('Add skills and education to your profile for better job matches.');
        setSnackbarOpen(true);
        // Don't return here - continue to call the API
      }
      
      // Now call the AI matching service
      console.log('🤖 Calling AI matching service...');
      const response = await jobService.getAIMatchedJobs();
      console.log('✅ Enhanced AI-matched jobs response:', response);
      console.log('📊 Matching metadata:', response.meta);
      
      // Ensure we have valid data
      const matchedJobs = response.data || [];
      console.log(`🎯 Found ${matchedJobs.length} AI-matched jobs`);
      console.log('🔍 Jobs details:', matchedJobs.map(job => ({
        id: job._id,
        title: job.title,
        matchPercentage: (job as any).matchPercentage,
        company: job.company,
        location: job.location
      })));
      
      console.log('🔧 Setting AI matched jobs state with:', matchedJobs.length, 'jobs');
      console.log('🔧 Raw response.data:', response.data);
      console.log('🔧 matchedJobs array:', matchedJobs);
      setAiMatchedJobs(matchedJobs);
      setAiMeta(response.meta);
      
      // Debug logging after state set
      setTimeout(() => {
        console.log('🔧 State updated - aiMatchedJobs length should be:', matchedJobs.length);
      }, 100);
      
      console.log('📊 AI matched jobs state after setting:', matchedJobs.length);
      console.log('📊 aiMatchedJobs array:', matchedJobs);
      
      // Show success message with match info
      if (matchedJobs.length > 0) {
        setSnackbarMessage(`Found ${matchedJobs.length} AI-matched jobs! Check the Smart Matches tab.`);
        setSnackbarOpen(true);
      } else {
        setSnackbarMessage('No jobs match your current profile. The AI will try to find similar opportunities.');
        setSnackbarOpen(true);
      }
    } catch (error: any) {
      console.error('❌ Error fetching AI-matched jobs:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to load AI-matched jobs';
      setError(errorMessage);
      setSnackbarMessage(`Error: ${errorMessage}`);
      setSnackbarOpen(true);
      setAiMatchedJobs([]);
      setAiMeta(null);
    } finally {
      setAiJobsLoading(false);
    }
  };

  // Filter jobs based on search and filters
  useEffect(() => {
    let filtered = jobs;

    // Note: Category filtering is handled server-side in fetchJobs()
    // No need to filter by category here as it's already filtered on the server

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

    // Apply location filter
    if (locationFilter) {
      const locationLower = locationFilter.toLowerCase();
      filtered = filtered.filter(job => 
        job.location.toLowerCase().includes(locationLower)
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

  // Handle category change
  const handleCategoryChange = (event: React.SyntheticEvent, newValue: JobCategory | 'all') => {
    setSelectedCategory(newValue);
    setCurrentPage(1); // Reset to first page when category changes
    
    // Update URL parameters
    const newSearchParams = new URLSearchParams(searchParams);
    if (newValue === 'all') {
      newSearchParams.delete('category');
    } else {
      newSearchParams.set('category', newValue);
    }
    navigate({ search: newSearchParams.toString() }, { replace: true });
  };

  // Handle URL parameter changes
  useEffect(() => {
    const categoryFromUrl = searchParams.get('category') as JobCategory;
    if (categoryFromUrl && categoryFromUrl !== selectedCategory) {
      // Validate category exists in our categories list
      const validCategories = ['all', ...categories.map(c => c.key)];
      if (validCategories.includes(categoryFromUrl)) {
        setSelectedCategory(categoryFromUrl);
        setCurrentPage(1);
      }
    }
  }, [searchParams]);

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

  // Fetch AI-matched jobs when AI tab is selected
  useEffect(() => {
    if (currentTab === 1 && user && aiMatchedJobs.length === 0) {
      fetchAIMatchedJobs();
    }
  }, [currentTab, user]);

  // Debug: Monitor AI matched jobs state changes
  useEffect(() => {
    console.log('🔧 aiMatchedJobs state changed:', aiMatchedJobs.length, 'jobs');
    console.log('🔧 Current aiMatchedJobs:', aiMatchedJobs);
  }, [aiMatchedJobs]);

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
    fetchCategoryCounts(); // Fetch category counts separately
  }, []);

  if (loading && jobs.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 }, px: { xs: 2, md: 3 } }}>
        <Box
          sx={{
            display: 'grid',
            gap: { xs: 1.5, sm: 2 },
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(4, 1fr)'
            }
          }}
        >
          {Array.from({ length: 12 }).map((_, index) => (
            <Box key={index} sx={{ minWidth: 0, maxWidth: '100%' }}>
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
            </Box>
          ))}
        </Box>
      </Container>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
    }}>
      {/* Header Section */}
      <Container maxWidth="xl" sx={{ px: { xs: 2, md: 3 } }}>
        <Box sx={{ py: { xs: 4, md: 5 } }}>
          <Grid container spacing={{ xs: 3, md: 4 }} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography 
                variant={{ xs: 'h4', sm: 'h3' }}
                fontWeight="bold"
                sx={{ 
                  mb: 2,
                  fontSize: { xs: '1.75rem', sm: '2.25rem', md: '3rem' },
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                Unlock Your Career Potential
              </Typography>
              <Typography 
                variant="body1"
                color="text.secondary" 
                sx={{ 
                  mb: 3,
                  fontSize: { xs: '0.875rem', md: '1.1rem' },
                  lineHeight: 1.6,
                  maxWidth: '600px'
                }}
              >
                Discover {totalJobs} opportunities tailored to your skills and aspirations. 
                Find your next career move with our intelligent job matching system.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Stack 
                direction={{ xs: 'row', sm: 'row' }} 
                spacing={2} 
                justifyContent={{ xs: 'center', md: 'flex-end' }}
                alignItems="center"
                sx={{ flexWrap: 'wrap', gap: 1 }}
              >
                <Tooltip title="Refresh Jobs">
                  <IconButton 
                    onClick={handleRefresh}
                    disabled={refreshing}
                    size={isMobile ? 'medium' : 'large'}
                    sx={{ 
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      borderRadius: 2,
                      '&:hover': { 
                        bgcolor: alpha(theme.palette.primary.main, 0.2),
                        transform: 'scale(1.05)'
                      },
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Refresh sx={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
                  </IconButton>
                </Tooltip>
                
                <ToggleButtonGroup
                  value={viewMode}
                  exclusive
                  onChange={(e, newView) => newView && setViewMode(newView)}
                  size={isMobile ? 'medium' : 'large'}
                  sx={{ 
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    borderRadius: 2,
                    '& .MuiToggleButton-root': {
                      border: 'none',
                      borderRadius: 2,
                      '&.Mui-selected': {
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText'
                      }
                    }
                  }}
                >
                  <ToggleButton value="grid" aria-label="grid view">
                    <GridView fontSize="small" />
                    {!isMobile && <Typography variant="caption" sx={{ ml: 1 }}>Grid</Typography>}
                  </ToggleButton>
                  <ToggleButton value="list" aria-label="list view">
                    <ViewList fontSize="small" />
                    {!isMobile && <Typography variant="caption" sx={{ ml: 1 }}>List</Typography>}
                  </ToggleButton>
                </ToggleButtonGroup>
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </Container>

      {/* Job View Tabs */}
      <Container maxWidth="xl" sx={{ mb: { xs: 2, md: 3 }, px: { xs: 2, md: 3 } }}>
        <Paper sx={{ 
          borderRadius: 3, 
          overflow: 'hidden',
          boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.08)}`
        }}>
          <Tabs 
            value={currentTab} 
            onChange={(e, newValue) => setCurrentTab(newValue)}
            centered={isDesktop}
            variant={isMobile ? 'scrollable' : 'standard'}
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 'bold',
                minHeight: { xs: 48, md: 64 },
                fontSize: { xs: '0.875rem', md: '1rem' },
                px: { xs: 1, md: 2 }
              },
              '& .MuiTabs-flexContainer': {
                justifyContent: isMobile ? 'flex-start' : 'center'
              }
            }}
          >
            <Tab 
              label="All Jobs" 
              icon={<Work />} 
              iconPosition="start"
              sx={{ gap: 1 }}
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SmartToy />
                  Smart Job Matches
                  {aiMatchedJobs.length > 0 && (
                    <Chip 
                      label={aiMatchedJobs.length} 
                      size="small" 
                      color="success"
                      variant="filled"
                      sx={{ 
                        fontSize: '0.7rem', 
                        height: 20,
                        fontWeight: 'bold'
                      }}
                    />
                  )}
                </Box>
              } 
            />
          </Tabs>
        </Paper>
      </Container>

      {/* Search and Filter Section - Only show for All Jobs tab */}
      {currentTab === 0 && (
        <Container maxWidth="xl" sx={{ mb: { xs: 3, md: 4 }, px: { xs: 2, md: 3 } }}>
          <Paper sx={{ 
            p: { xs: 2, md: 3 }, 
            borderRadius: 3,
            boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.08)}`,
            background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`
          }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}>
              Find Your Perfect Job
            </Typography>
            
            <Grid container spacing={{ xs: 2, md: 3 }}>
              {/* Search Bar */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  placeholder="Search jobs, companies, or skills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  size={isMobile ? 'small' : 'medium'}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search color="primary" fontSize={isMobile ? 'small' : 'medium'} />
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: 2,
                      bgcolor: 'background.paper',
                      '& fieldset': { border: `1px solid ${alpha(theme.palette.divider, 0.2)}` },
                      '&:hover fieldset': { borderColor: 'primary.main' },
                      '&.Mui-focused fieldset': { borderColor: 'primary.main', borderWidth: 2 },
                      fontSize: { xs: '0.875rem', md: '1rem' }
                    }
                  }}
                />
              </Grid>

              {/* Location Filter */}
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  placeholder="Enter location..."
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  size={isMobile ? 'small' : 'medium'}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOn color="primary" fontSize={isMobile ? 'small' : 'medium'} />
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: 2,
                      bgcolor: 'background.paper',
                      '& fieldset': { border: `1px solid ${alpha(theme.palette.divider, 0.2)}` },
                      '&:hover fieldset': { borderColor: 'primary.main' },
                      '&.Mui-focused fieldset': { borderColor: 'primary.main', borderWidth: 2 }
                    }
                  }}
                />
              </Grid>

              {/* Sort and Filter Controls */}
              <Grid item xs={12} sm={6} md={3}>
                <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
                  <FormControl fullWidth size={isMobile ? 'small' : 'medium'}>
                    <InputLabel>Sort by</InputLabel>
                    <Select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      label="Sort by"
                      sx={{ 
                        borderRadius: 2,
                        bgcolor: 'background.paper',
                        '& fieldset': { border: `1px solid ${alpha(theme.palette.divider, 0.2)}` },
                        '&:hover fieldset': { borderColor: 'primary.main' },
                        '&.Mui-focused fieldset': { borderColor: 'primary.main', borderWidth: 2 },
                        fontSize: { xs: '0.875rem', md: '1rem' }
                      }}
                    >
                      <MenuItem value="newest">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <FiberNew fontSize="small" />
                          Latest Jobs
                        </Box>
                      </MenuItem>
                      <MenuItem value="salary">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AttachMoney fontSize="small" />
                          Highest Salary
                        </Box>
                      </MenuItem>
                      <MenuItem value="deadline">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Schedule fontSize="small" />
                          Deadline Soon
                        </Box>
                      </MenuItem>
                      <MenuItem value="oldest">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AccessTime fontSize="small" />
                          Oldest First
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                  
                  <Tooltip title={showFilters ? "Hide filters" : "Show filters"}>
                    <IconButton
                      onClick={() => setShowFilters(!showFilters)}
                      size={isMobile ? 'small' : 'medium'}
                      sx={{ 
                        bgcolor: showFilters ? 'primary.main' : 'background.paper',
                        color: showFilters ? 'primary.contrastText' : 'action.active',
                        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                        borderRadius: 2,
                        '&:hover': {
                          bgcolor: showFilters ? 'primary.dark' : alpha(theme.palette.primary.main, 0.1),
                          borderColor: 'primary.main'
                        }
                      }}
                    >
                      <TuneRounded fontSize={isMobile ? 'small' : 'medium'} />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Grid>
            </Grid>

            {/* Advanced Filters */}
            <Collapse in={showFilters}>
              <Box sx={{ mt: 3, pt: 3, borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: 'text.secondary' }}>
                  Advanced Filters
                </Typography>
                <Grid container spacing={{ xs: 2, md: 3 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size={isMobile ? 'small' : 'medium'}>
                      <InputLabel>Job Type</InputLabel>
                      <Select
                        value={jobTypeFilter}
                        onChange={(e) => setJobTypeFilter(e.target.value)}
                        label="Job Type"
                        sx={{ 
                          borderRadius: 2,
                          bgcolor: 'background.paper',
                          '& fieldset': { border: `1px solid ${alpha(theme.palette.divider, 0.2)}` },
                          '&:hover fieldset': { borderColor: 'primary.main' },
                          '&.Mui-focused fieldset': { borderColor: 'primary.main', borderWidth: 2 }
                        }}
                      >
                        <MenuItem value="">All Types</MenuItem>
                        <MenuItem value="Full-time">Full-time</MenuItem>
                        <MenuItem value="Part-time">Part-time</MenuItem>
                        <MenuItem value="Contract">Contract</MenuItem>
                        <MenuItem value="Internship">Internship</MenuItem>
                        <MenuItem value="Remote">Remote</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size={isMobile ? 'small' : 'medium'}>
                      <InputLabel>Experience Level</InputLabel>
                      <Select
                        value={experienceFilter}
                        onChange={(e) => setExperienceFilter(e.target.value)}
                        label="Experience Level"
                        sx={{ 
                          borderRadius: 2,
                          bgcolor: 'background.paper',
                          '& fieldset': { border: `1px solid ${alpha(theme.palette.divider, 0.2)}` },
                          '&:hover fieldset': { borderColor: 'primary.main' },
                          '&.Mui-focused fieldset': { borderColor: 'primary.main', borderWidth: 2 }
                        }}
                      >
                        <MenuItem value="">All Levels</MenuItem>
                        <MenuItem value="Entry">Entry Level</MenuItem>
                        <MenuItem value="Mid">Mid Level</MenuItem>
                        <MenuItem value="Senior">Senior Level</MenuItem>
                        <MenuItem value="Executive">Executive</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      placeholder="Company name..."
                      value={companyFilter}
                      onChange={(e) => setCompanyFilter(e.target.value)}
                      size={isMobile ? 'small' : 'medium'}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Business color="primary" fontSize={isMobile ? 'small' : 'medium'} />
                          </InputAdornment>
                        ),
                        sx: {
                          borderRadius: 2,
                          bgcolor: 'background.paper',
                          '& fieldset': { border: `1px solid ${alpha(theme.palette.divider, 0.2)}` },
                          '&:hover fieldset': { borderColor: 'primary.main' },
                          '&.Mui-focused fieldset': { borderColor: 'primary.main', borderWidth: 2 }
                        }
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ px: 1 }}>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                        Salary Range: ${salaryRange[0].toLocaleString()} - ${salaryRange[1].toLocaleString()}
                      </Typography>
                      <Slider
                        value={salaryRange}
                        onChange={(e, newValue) => setSalaryRange(newValue as number[])}
                        valueLabelDisplay="auto"
                        min={0}
                        max={200000}
                        step={5000}
                        sx={{
                          color: 'primary.main',
                          '& .MuiSlider-thumb': {
                            width: 20,
                            height: 20,
                          },
                          '& .MuiSlider-track': {
                            height: 6,
                          },
                          '& .MuiSlider-rail': {
                            height: 6,
                            opacity: 0.3,
                          }
                        }}
                      />
                    </Box>
                  </Grid>
                </Grid>

                {/* Clear Filters Button */}
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      setSearchTerm('');
                      setLocationFilter('');
                      setJobTypeFilter('');
                      setExperienceFilter('');
                      setCompanyFilter('');
                      setSalaryRange([0, 200000]);
                    }}
                    startIcon={<Close />}
                    sx={{ textTransform: 'none' }}
                  >
                    Clear All Filters
                  </Button>
                </Box>
              </Box>
            </Collapse>
          </Paper>

          {/* Category Tabs */}
          <Box sx={{ mt: { xs: 2, md: 3 }, mb: { xs: 1, md: 2 } }}>
            <Tabs
              value={selectedCategory}
              onChange={handleCategoryChange}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              sx={{
                '& .MuiTabs-flexContainer': {
                  gap: { xs: 0.5, md: 1 }
                },
                '& .MuiTab-root': {
                  minHeight: { xs: 40, md: 48 },
                  borderRadius: 3,
                  textTransform: 'none',
                  fontWeight: 500,
                  fontSize: { xs: '0.75rem', md: '0.875rem' },
                  px: { xs: 1, md: 2 },
                  border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                  bgcolor: 'background.paper',
                  color: 'text.secondary',
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    borderColor: 'primary.main'
                  }
                },
                '& .MuiTabs-scrollButtons': {
                  color: 'action.active'
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
                        {loading && selectedCategory === category.key ? (
                          <CircularProgress size={18} color="inherit" />
                        ) : (
                          <IconComponent sx={{ fontSize: 18 }} />
                        )}
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
      )}

      {/* Jobs Grid/List */}
      <Container maxWidth="xl" sx={{ px: { xs: 2, md: 3 }, pb: { xs: 4, md: 6 } }}>
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3, 
              borderRadius: 2,
              '& .MuiAlert-message': {
                fontSize: '0.9rem'
              }
            }}
          >
            {error}
          </Alert>
        )}

        {/* AI Matching Statistics - Show when we have AI results */}
        {currentTab === 1 && !aiJobsLoading && aiMeta && (
          <Paper
            sx={{
              p: 3,
              mb: 3,
              background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
              border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <SmartToy sx={{ color: 'success.main', mr: 1, fontSize: 24 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.dark' }}>
                AI Matching Results
              </Typography>
            </Box>
            
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
              gap: 2
            }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                  {aiMeta.matchesFound}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Smart Matches
                </Typography>
              </Box>
              
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  {aiMeta.averageMatchPercentage}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Average Match
                </Typography>
              </Box>
              
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                  {aiMeta.totalJobsEvaluated}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Jobs Analyzed
                </Typography>
              </Box>
              
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                  {aiMeta.userSkillsCount}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Your Skills
                </Typography>
              </Box>
            </Box>
            
            {aiMeta.userProfileSummary && (
              <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>Profile Summary:</strong> {aiMeta.userProfileSummary.skills} skills, {aiMeta.userProfileSummary.experience} work experiences, {aiMeta.userProfileSummary.education} education entries
                  {aiMeta.userProfileSummary.location && aiMeta.userProfileSummary.location !== 'Not specified' && 
                    `, located in ${aiMeta.userProfileSummary.location}`
                  }
                </Typography>
              </Box>
            )}
          </Paper>
        )}

        {currentTab === 0 && !loading && filteredJobs.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No jobs found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try adjusting your search criteria or browse different categories
            </Typography>
          </Box>
        )}

        {currentTab === 1 && !aiJobsLoading && aiMatchedJobs.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Box sx={{ mb: 3 }}>
              <SmartToy sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            </Box>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Smart Matches Found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
              Our AI couldn't find jobs that match your current profile. Complete your profile with skills, 
              experience, and education to get better matches.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button 
                variant="contained" 
                onClick={() => navigate(hasRole(UserRole.EMPLOYER) ? '/app/employer/profile' : '/app/profile')}
                startIcon={<Person />}
              >
                Complete Profile
              </Button>
              <Button 
                variant="outlined" 
                onClick={() => setCurrentTab(0)}
                startIcon={<Work />}
              >
                Browse All Jobs
              </Button>
            </Box>
          </Box>
        )}

        {currentTab === 1 && aiJobsLoading && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <CircularProgress size={40} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              🤖 AI is analyzing jobs for you...
            </Typography>
          </Box>
        )}

        <Box
          sx={{
            display: 'grid',
            gap: { xs: 2, md: 3 },
            gridTemplateColumns: viewMode === 'grid' ? {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(4, 1fr)'
            } : 'repeat(1, 1fr)',
            mt: { xs: 2, md: 3 }
          }}
        >
          {(() => {
            const jobsToShow = currentTab === 0 ? filteredJobs : aiMatchedJobs;
            console.log(`📊 Rendering ${jobsToShow.length} jobs for tab ${currentTab}`, {
              currentTab,
              filteredJobsLength: filteredJobs.length,
              aiMatchedJobsLength: aiMatchedJobs.length,
              jobsToShowLength: jobsToShow.length
            });
            return jobsToShow.map((job, index) => (
            <Box 
              key={job._id}
              sx={{
                minWidth: 0, // Allow shrinking
                maxWidth: '100%', // Prevent expansion
              }}
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
                  {currentTab === 1 && (job as any).matchPercentage && (
                    <Chip
                      label={`${(job as any).matchPercentage}% Match`}
                      size="small"
                      color="success"
                      icon={<SmartToy sx={{ fontSize: 14 }} />}
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
                  {currentTab === 0 && job.isCurated && (
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
                    {currentTab === 0 && job.skills?.slice(0, 2).map((skill, idx) => (
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
                    {currentTab === 1 && (job as any).matchingSkills?.slice(0, 2).map((skill: string, idx: number) => (
                      <Chip 
                        key={idx} 
                        label={skill} 
                        size="small" 
                        icon={<SmartToy sx={{ fontSize: 12 }} />}
                        sx={{ 
                          bgcolor: 'success.light',
                          color: 'success.dark',
                          fontWeight: 500,
                          fontSize: '0.7rem',
                          height: 22,
                          maxWidth: '120px',
                          '& .MuiChip-label': {
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }
                        }} 
                      />
                    ))}
                  </Box>
                  
                  {/* AI Match Explanation - Only for AI matched jobs */}
                  {currentTab === 1 && (job as any).aiExplanation && (
                    <Box sx={{ 
                      mb: 2,
                      p: 1.5,
                      bgcolor: alpha(theme.palette.success.main, 0.08),
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <SmartToy sx={{ fontSize: 14, color: 'success.main', mr: 0.5 }} />
                        <Typography variant="caption" sx={{ fontWeight: 600, color: 'success.main' }}>
                          AI Match Insight
                        </Typography>
                      </Box>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ 
                          fontSize: '0.75rem',
                          lineHeight: 1.3,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {(job as any).aiExplanation}
                      </Typography>
                    </Box>
                  )}
                  
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
            </Box>
          ));
          })()}
        </Box>

        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            mt: { xs: 4, md: 6 }, 
            mb: { xs: 2, md: 4 },
            py: 2
          }}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
              size={isMobile ? "medium" : "large"}
              showFirstButton
              showLastButton
              sx={{
                '& .MuiPaginationItem-root': {
                  borderRadius: 2,
                  fontWeight: 500
                }
              }}
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
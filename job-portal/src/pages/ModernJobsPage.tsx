import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Stack,
  TextField,
  InputAdornment,
  Grid,
  Skeleton,
  Alert,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
  Fade,
  Slide,
  CircularProgress,
  Avatar,
  Divider,
  Paper,
  Switch,
  FormControlLabel,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Zoom
} from '@mui/material';
import {
  Search,
  LocationOn,
  AttachMoney,
  Work,
  Business,
  Send,
  BookmarkBorder,
  Bookmark,
  Share,
  MoreVert,
  TrendingUp,
  Star,
  Schedule,
  Verified,
  FilterList,
  People,
  Sort,
  ViewList,
  ViewModule,
  Clear,
  Refresh,
  Speed,
  NewReleases
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Enhanced Job Interface
interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  skills: string[];
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  jobType: string;
  experienceLevel: string;
  educationLevel: string;
  applicationDeadline?: string;
  createdAt: string;
  updatedAt: string;
  employer: {
    _id: string;
    firstName: string;
    lastName: string;
    company: string;
  };
  applicationsCount?: number;
  viewsCount?: number;
  isCurated?: boolean;
  isUrgent?: boolean;
  isFeatured?: boolean;
  tags?: string[];
  isBookmarked?: boolean;
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

interface JobsState {
  jobs: Job[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  totalJobs: number;
}

interface Filters {
  search: string;
  location: string;
  jobType: string;
  experienceLevel: string;
  salaryMin: number;
  salaryMax: number;
  remote: boolean;
  featured: boolean;
  recent: boolean;
}

const INITIAL_FILTERS: Filters = {
  search: '',
  location: '',
  jobType: '',
  experienceLevel: '',
  salaryMin: 0,
  salaryMax: 0,
  remote: false,
  featured: false,
  recent: false
};

const JOBS_PER_PAGE = 12;
const SKELETON_COUNT = 8;

const ModernJobsPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();

  // State Management
  const [jobsState, setJobsState] = useState<JobsState>({
    jobs: [],
    loading: true,
    error: null,
    hasMore: true,
    totalJobs: 0
  });

  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('recent');
  const [bookmarkedJobs, setBookmarkedJobs] = useState<Set<string>>(new Set());
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [filtersVisible, setFiltersVisible] = useState(false);

  // Debounced search
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout>();
  const debouncedSearch = useCallback(
    (searchTerm: string) => {
      if (searchTimeout) clearTimeout(searchTimeout);
      setSearchTimeout(setTimeout(() => {
        setFilters(prev => ({ ...prev, search: searchTerm }));
        setPage(1);
      }, 300));
    },
    [searchTimeout]
  );

  // Fetch Jobs Function
  const fetchJobs = useCallback(async (pageNum: number = 1, resetJobs: boolean = true) => {
    try {
      if (pageNum === 1) {
        setJobsState(prev => ({ ...prev, loading: true, error: null }));
      }

      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: JOBS_PER_PAGE.toString(),
        status: 'active'
      });

      // Apply filters
      if (filters.search.trim()) params.append('search', filters.search.trim());
      if (filters.location.trim()) params.append('location', filters.location.trim());
      if (filters.jobType) params.append('jobType', filters.jobType);
      if (filters.experienceLevel) params.append('experienceLevel', filters.experienceLevel);
      if (filters.remote) params.append('location', 'Remote');
      if (filters.featured) params.append('isFeatured', 'true');

      // Sorting
      const sortParam = sortBy === 'salary' ? 'salary' : 
                       sortBy === 'views' ? 'viewsCount' : 'createdAt';
      params.append('sortBy', sortParam);
      params.append('sortOrder', sortBy === 'recent' ? 'desc' : 'desc');

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/jobs?${params.toString()}`,
        {
          headers: {
            'Content-Type': 'application/json',
            ...(localStorage.getItem('token') && {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            })
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch jobs: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        const newJobs = data.data || [];
        const totalJobs = data.pagination?.total || 0;
        const totalPages = data.pagination?.pages || 1;

        setJobsState(prev => ({
          ...prev,
          jobs: resetJobs ? newJobs : [...prev.jobs, ...newJobs],
          loading: false,
          error: null,
          hasMore: pageNum < totalPages,
          totalJobs
        }));
      } else {
        throw new Error(data.error || 'Failed to fetch jobs');
      }
    } catch (error: any) {
      console.error('Error fetching jobs:', error);
      setJobsState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to load jobs. Please try again.',
        jobs: resetJobs ? [] : prev.jobs
      }));
    }
  }, [filters, sortBy]);

  // Load more jobs for infinite scroll
  const loadMoreJobs = useCallback(() => {
    if (!jobsState.loading && jobsState.hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchJobs(nextPage, false);
    }
  }, [jobsState.loading, jobsState.hasMore, page, fetchJobs]);

  // Effects
  useEffect(() => {
    fetchJobs(1, true);
  }, [fetchJobs]);

  // Scroll listener for infinite loading
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 1000
      ) {
        loadMoreJobs();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMoreJobs]);

  // Handlers
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(event.target.value);
  };

  const handleFilterChange = (key: keyof Filters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    setPage(1);
    setAnchorEl(null);
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

  const clearAllFilters = () => {
    setFilters(INITIAL_FILTERS);
    setPage(1);
  };

  // Utility functions
  const formatSalary = (salary: Job['salary']) => {
    if (!salary) return null;
    const { min, max, currency = '$' } = salary;
    if (min && max) {
      return `${currency}${(min / 1000).toFixed(0)}k - ${currency}${(max / 1000).toFixed(0)}k`;
    }
    if (min) return `${currency}${(min / 1000).toFixed(0)}k+`;
    return null;
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return 'Just now';
  };

  const formatJobType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Memoized filtered count
  const activeFiltersCount = useMemo(() => {
    return Object.entries(filters).reduce((count, [key, value]) => {
      if (key === 'salaryMin' || key === 'salaryMax') return count;
      if (typeof value === 'boolean') return count + (value ? 1 : 0);
      if (typeof value === 'string') return count + (value.trim() ? 1 : 0);
      return count;
    }, 0);
  }, [filters]);

  // Enhanced Job Card Component
  const JobCard: React.FC<{ job: Job; index: number }> = ({ job, index }) => {
    const isBookmarked = bookmarkedJobs.has(job._id);

    const isJobNew = (createdAt: string) => {
      const jobDate = new Date(createdAt);
      const now = new Date();
      const diffInHours = Math.abs(now.getTime() - jobDate.getTime()) / (1000 * 60 * 60);
      return diffInHours <= 24;
    };

    const isJobUrgent = (createdAt: string) => {
      const jobDate = new Date(createdAt);
      const now = new Date();
      const diffInDays = Math.floor((now.getTime() - jobDate.getTime()) / (1000 * 60 * 60 * 24));
      return diffInDays <= 3;
    };

    return (
      <Zoom in={true} timeout={300 + (index * 50)}>
        <Card
          className="modern-job-card"
          sx={{
            width: '100%',
            minHeight: 280,
            maxHeight: 320,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 3,
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            background: `linear-gradient(145deg, 
              ${theme.palette.background.paper} 0%, 
              ${alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.02 : 0.01)} 100%
            )`,
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 6px 24px rgba(0, 0, 0, 0.2), 0 2px 6px rgba(0, 0, 0, 0.1)'
              : '0 6px 24px rgba(0, 0, 0, 0.06), 0 2px 6px rgba(0, 0, 0, 0.02)',
            cursor: 'pointer',
            '&:hover': {
              transform: 'translateY(-6px) scale(1.01)',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 16px 32px rgba(0, 0, 0, 0.4), 0 6px 12px rgba(0, 0, 0, 0.2)'
                : '0 16px 32px rgba(0, 0, 0, 0.12), 0 6px 12px rgba(0, 0, 0, 0.06)',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
              '& .job-card-actions': {
                transform: 'translateY(0px)',
                opacity: 1
              }
            }
          }}
          onClick={() => navigate(`/app/jobs/${job._id}`)}
        >
          {/* Status Badges - More Compact */}
          <Box sx={{ 
            position: 'absolute', 
            top: 12, 
            right: 12, 
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5
          }}>
            {isJobNew(job.createdAt) && (
              <Chip
                label="NEW"
                size="small"
                icon={<Star sx={{ fontSize: 12 }} />}
                sx={{ 
                  fontWeight: 600,
                  fontSize: '0.6rem',
                  height: 20,
                  backgroundColor: theme.palette.success.main,
                  color: 'white',
                  boxShadow: `0 3px 8px ${alpha(theme.palette.success.main, 0.4)}`,
                  '& .MuiChip-icon': { color: 'white' },
                  '& .MuiChip-label': { px: 0.5 }
                }}
              />
            )}
            {isJobUrgent(job.createdAt) && (
              <Chip
                label="URGENT"
                size="small"
                icon={<Schedule sx={{ fontSize: 12 }} />}
                sx={{ 
                  fontWeight: 600,
                  fontSize: '0.6rem',
                  height: 20,
                  backgroundColor: theme.palette.error.main,
                  color: 'white',
                  boxShadow: `0 3px 8px ${alpha(theme.palette.error.main, 0.4)}`,
                  animation: 'pulse 2s ease-in-out infinite',
                  '& .MuiChip-icon': { color: 'white' },
                  '& .MuiChip-label': { px: 0.5 },
                  '@keyframes pulse': {
                    '0%, 100%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.05)' }
                  }
                }}
              />
            )}
          </Box>

          {/* Bookmark Button - More Compact */}
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleBookmarkToggle(job._id);
            }}
            sx={{
              position: 'absolute',
              top: 12,
              left: 12,
              zIndex: 2,
              width: 32,
              height: 32,
              backgroundColor: alpha(theme.palette.background.paper, 0.9),
              backdropFilter: 'blur(10px)',
              color: isBookmarked ? 'warning.main' : 'text.secondary',
              '&:hover': {
                backgroundColor: alpha(theme.palette.background.paper, 1),
                color: 'warning.main',
                transform: 'scale(1.05)'
              }
            }}
          >
            {isBookmarked ? <Bookmark sx={{ fontSize: 18 }} /> : <BookmarkBorder sx={{ fontSize: 18 }} />}
          </IconButton>

          {/* Main Content */}
          <CardContent sx={{ p: 0, flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
            {/* Header Section - More Compact */}
            <Box sx={{ p: 2, pb: 1.5 }}>
              <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 1.5 }}>
                <Avatar
                  sx={{ 
                    width: 48, 
                    height: 48, 
                    background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.primary.main, 0.1)} 100%)`,
                    border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.15)}`,
                  }}
                >
                  <Work sx={{ 
                    fontSize: 22, 
                    color: 'primary.main',
                  }} />
                </Avatar>
                
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography 
                    variant="h6" 
                    onClick={() => navigate(`/app/jobs/${job._id}`)}
                    sx={{ 
                      fontWeight: 700, 
                      mb: 0.5,
                      fontSize: '1rem',
                      lineHeight: 1.2,
                      color: 'text.primary',
                      cursor: 'pointer',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      height: '2.4rem',
                      transition: 'color 0.2s ease',
                      '&:hover': {
                        color: 'primary.main'
                      }
                    }}
                  >
                    {job.title}
                  </Typography>
                  
                  <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.5 }}>
                    <Business sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ 
                        fontWeight: 500,
                        fontSize: '0.8rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '150px'
                      }}
                    >
                      {job.company}
                    </Typography>
                  </Stack>
                  
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <LocationOn sx={{ fontSize: 14, color: 'info.main' }} />
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{
                        fontWeight: 500,
                        fontSize: '0.8rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {job.location}
                    </Typography>
                  </Stack>
                </Box>
              </Stack>

              {/* Job Type & Posted Time - More Compact */}
              <Stack direction="row" spacing={0.5} sx={{ mb: 1.5 }}>
                <Chip
                  label={formatJobType(job.jobType) || 'Full-time'}
                  size="small"
                  variant="outlined"
                  sx={{
                    borderRadius: 1.5,
                    fontWeight: 500,
                    fontSize: '0.65rem',
                    height: 20,
                    borderColor: alpha(theme.palette.primary.main, 0.3),
                    color: 'primary.main',
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    '& .MuiChip-label': { px: 1 }
                  }}
                />
                <Chip
                  label={getTimeAgo(job.createdAt)}
                  size="small"
                  variant="outlined"
                  sx={{
                    borderRadius: 1.5,
                    fontWeight: 500,
                    fontSize: '0.65rem',
                    height: 20,
                    borderColor: alpha(theme.palette.text.secondary, 0.3),
                    color: 'text.secondary',
                    '& .MuiChip-label': { px: 1 }
                  }}
                />
              </Stack>

              {/* Job Description Preview - More Compact */}
              <Box sx={{ mb: 1.5 }}>
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ 
                    lineHeight: 1.4,
                    fontSize: '0.8rem',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    height: '2.2rem'
                  }}
                >
                  {job.description || 'Join our team and take your career to the next level.'}
                </Typography>
              </Box>

              {/* Skills Section - More Compact */}
              {job.skills && job.skills.length > 0 && (
                <Box sx={{ mb: 1.5 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block', fontWeight: 600, fontSize: '0.65rem' }}>
                    Skills:
                  </Typography>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ maxHeight: '24px', overflow: 'hidden' }}>
                    {job.skills.slice(0, 3).map((skill, index) => (
                      <Chip
                        key={index}
                        label={skill}
                        size="small"
                        sx={{ 
                          fontSize: '0.6rem',
                          height: 18,
                          borderRadius: 2,
                          backgroundColor: alpha(theme.palette.info.main, 0.08),
                          color: 'info.main',
                          fontWeight: 500,
                          border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                          '& .MuiChip-label': { px: 0.75 }
                        }}
                      />
                    ))}
                    {job.skills.length > 3 && (
                      <Chip
                        label={`+${job.skills.length - 3}`}
                        size="small"
                        sx={{ 
                          fontSize: '0.6rem',
                          height: 18,
                          borderRadius: 2,
                          backgroundColor: alpha(theme.palette.text.secondary, 0.08),
                          color: 'text.secondary',
                          fontWeight: 500,
                          '& .MuiChip-label': { px: 0.75 }
                        }}
                      />
                    )}
                  </Stack>
                </Box>
              )}

              {/* Job Stats & Salary - More Compact */}
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                {job.salary && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <AttachMoney sx={{ fontSize: 16, color: 'success.main' }} />
                    <Typography 
                      variant="body2" 
                      fontWeight="600"
                      color="success.main"
                      sx={{ fontSize: '0.8rem' }}
                    >
                      {formatSalary(job.salary)}
                    </Typography>
                  </Box>
                )}
                
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  {job.applicationsCount !== undefined && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <People sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary" fontWeight="500" sx={{ fontSize: '0.7rem' }}>
                        {job.applicationsCount || 0}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Stack>
            </Box>

            {/* Action Buttons - More Compact */}
            <Box
              className="job-card-actions"
              sx={{
                mt: 'auto',
                pt: 1.5,
                px: 2,
                transform: 'translateY(4px)',
                opacity: 0.8,
                transition: 'all 0.3s ease'
              }}
            >
              <Stack spacing={1}>
                {/* View Details Button - More Compact */}
                <Button
                  variant="contained"
                  fullWidth
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/app/jobs/${job._id}`);
                  }}
                  sx={{
                    fontWeight: 600,
                    borderRadius: 2.5,
                    py: 0.8,
                    px: 2,
                    fontSize: '0.75rem',
                    textTransform: 'none',
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                    color: 'white',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.4)}`,
                      background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                    }
                  }}
                >
                  View Details
                </Button>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      </Zoom>
    );
  };

  // Skeleton Cards
  const SkeletonCard = () => (
    <Card sx={{ height: 320, borderRadius: 3 }}>
      <CardContent sx={{ p: 2 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <Skeleton variant="circular" width={44} height={44} sx={{ mr: 2 }} />
          <Box flex={1}>
            <Skeleton variant="text" width="80%" height={28} />
            <Skeleton variant="text" width="60%" height={20} />
          </Box>
        </Box>
        <Stack spacing={1} mb={2}>
          <Skeleton variant="text" width="70%" height={16} />
          <Skeleton variant="text" width="50%" height={16} />
          <Skeleton variant="text" width="60%" height={16} />
        </Stack>
        <Skeleton variant="text" width="100%" height={16} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="90%" height={16} sx={{ mb: 2 }} />
        <Stack direction="row" spacing={1} mb={2}>
          <Skeleton variant="rounded" width={60} height={22} />
          <Skeleton variant="rounded" width={50} height={22} />
          <Skeleton variant="rounded" width={40} height={22} />
        </Stack>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>

      {/* Search & Controls */}
      <Slide in={true} timeout={600} direction="up">
        <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          <Grid container spacing={2} alignItems="center">
            {/* Search */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search jobs, companies, or keywords..."
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search color="action" />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 2, bgcolor: alpha(theme.palette.background.default, 0.5) }
                }}
              />
            </Grid>

            {/* Location */}
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="Location or Remote"
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOn color="action" />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 2, bgcolor: alpha(theme.palette.background.default, 0.5) }
                }}
              />
            </Grid>

            {/* Controls */}
            <Grid item xs={12} md={3}>
              <Stack direction="row" spacing={1}>
                <Tooltip title="Filters">
                  <IconButton
                    onClick={() => setFiltersVisible(!filtersVisible)}
                    color={activeFiltersCount > 0 ? "primary" : "default"}
                    sx={{ position: 'relative' }}
                  >
                    <FilterList />
                    {activeFiltersCount > 0 && (
                      <Chip
                        label={activeFiltersCount}
                        size="small"
                        color="primary"
                        sx={{
                          position: 'absolute',
                          top: -8,
                          right: -8,
                          minWidth: 20,
                          height: 20,
                          fontSize: '0.65rem'
                        }}
                      />
                    )}
                  </IconButton>
                </Tooltip>

                <Tooltip title="Sort">
                  <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
                    <Sort />
                  </IconButton>
                </Tooltip>

                <Tooltip title={`Switch to ${viewMode === 'grid' ? 'list' : 'grid'} view`}>
                  <IconButton onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
                    {viewMode === 'grid' ? <ViewList /> : <ViewModule />}
                  </IconButton>
                </Tooltip>

                <Tooltip title="Refresh">
                  <IconButton
                    onClick={() => {
                      setPage(1);
                      fetchJobs(1, true);
                    }}
                    disabled={jobsState.loading}
                  >
                    {jobsState.loading ? <CircularProgress size={20} /> : <Refresh />}
                  </IconButton>
                </Tooltip>
              </Stack>
            </Grid>
          </Grid>

          {/* Extended Filters */}
          {filtersVisible && (
            <Fade in={filtersVisible}>
              <Box mt={3} pt={3} sx={{ borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={4} md={2}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={filters.remote}
                          onChange={(e) => handleFilterChange('remote', e.target.checked)}
                          size="small"
                        />
                      }
                      label="Remote Only"
                    />
                  </Grid>
                  <Grid item xs={6} sm={4} md={2}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={filters.featured}
                          onChange={(e) => handleFilterChange('featured', e.target.checked)}
                          size="small"
                        />
                      }
                      label="Featured"
                    />
                  </Grid>
                  <Grid item xs={12} sm={4} md={2}>
                    <Button
                      variant="outlined"
                      onClick={clearAllFilters}
                      startIcon={<Clear />}
                      size="small"
                      sx={{ borderRadius: 2, textTransform: 'none' }}
                    >
                      Clear All
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Fade>
          )}
        </Paper>
      </Slide>

      {/* Sort Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{ sx: { borderRadius: 2, minWidth: 200 } }}
      >
        <MenuItem onClick={() => handleSortChange('recent')}>
          <ListItemIcon><NewReleases fontSize="small" /></ListItemIcon>
          <ListItemText>Most Recent</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleSortChange('salary')}>
          <ListItemIcon><AttachMoney fontSize="small" /></ListItemIcon>
          <ListItemText>Highest Salary</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleSortChange('views')}>
          <ListItemIcon><TrendingUp fontSize="small" /></ListItemIcon>
          <ListItemText>Most Popular</ListItemText>
        </MenuItem>
      </Menu>

      {/* Error Alert */}
      {jobsState.error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {jobsState.error}
        </Alert>
      )}

      {/* Jobs Grid */}
      <Box>
        {jobsState.jobs.length > 0 ? (
          <Grid container spacing={3}>
            {jobsState.jobs.map((job, index) => (
              <Grid item xs={12} sm={6} lg={4} key={job._id}>
                <JobCard job={job} index={index} />
              </Grid>
            ))}
          </Grid>
        ) : jobsState.loading ? (
          <Grid container spacing={3}>
            {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
              <Grid item xs={12} sm={6} lg={4} key={index}>
                <SkeletonCard />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 3 }}>
            <Work sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h5" gutterBottom fontWeight="bold">
              No jobs found
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={3}>
              We couldn't find any jobs matching your criteria. Try adjusting your search or filters.
            </Typography>
            <Button
              variant="contained"
              onClick={clearAllFilters}
              startIcon={<Clear />}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              Clear All Filters
            </Button>
          </Paper>
        )}
      </Box>

      {/* Loading More */}
      {jobsState.loading && jobsState.jobs.length > 0 && (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      )}

      {/* Load More Button (fallback for infinite scroll) */}
      {!jobsState.loading && jobsState.hasMore && jobsState.jobs.length > 0 && (
        <Box display="flex" justifyContent="center" mt={4}>
          <Button
            variant="outlined"
            onClick={loadMoreJobs}
            sx={{ borderRadius: 2, textTransform: 'none', px: 4, py: 1.5 }}
          >
            Load More Jobs
          </Button>
        </Box>
      )}
    </Container>
  );
};

export default ModernJobsPage;
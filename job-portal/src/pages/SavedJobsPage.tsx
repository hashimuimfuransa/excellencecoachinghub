import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  IconButton,
  Stack,
  TextField,
  InputAdornment,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Pagination,
  Alert,
  Skeleton,
  Paper,
  Divider,
  Tooltip,
  Badge,
  useTheme,
  alpha
} from '@mui/material';
import {
  Bookmark,
  BookmarkBorder,
  Search,
  FilterList,
  LocationOn,
  AttachMoney,
  Schedule,
  Business,
  Share,
  Visibility,
  ArrowForward,
  Delete,
  Clear,
  Sort,
  ViewList,
  ViewModule
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Mock data for saved jobs (replace with real API calls)
interface SavedJob {
  _id: string;
  title: string;
  company: string;
  location: string;
  jobType: string;
  experienceLevel: string;
  salary?: string;
  savedAt: string;
  status: 'active' | 'closed' | 'expired';
  description: string;
  skills: string[];
  logo?: string;
}

const mockSavedJobs: SavedJob[] = [
  {
    _id: '1',
    title: 'Senior Frontend Developer',
    company: 'TechCorp Inc.',
    location: 'San Francisco, CA',
    jobType: 'Full-time',
    experienceLevel: 'Senior',
    salary: '$120,000 - $150,000',
    savedAt: '2024-01-15T10:30:00Z',
    status: 'active',
    description: 'We are looking for a senior frontend developer to join our team...',
    skills: ['React', 'TypeScript', 'Next.js', 'GraphQL'],
    logo: ''
  },
  {
    _id: '2',
    title: 'Product Manager',
    company: 'Innovation Labs',
    location: 'Remote',
    jobType: 'Full-time',
    experienceLevel: 'Mid-level',
    salary: '$90,000 - $110,000',
    savedAt: '2024-01-14T14:20:00Z',
    status: 'active',
    description: 'Join our product team to drive innovation and growth...',
    skills: ['Product Strategy', 'Agile', 'Analytics', 'Leadership'],
    logo: ''
  },
  {
    _id: '3',
    title: 'UX Designer',
    company: 'Design Studio',
    location: 'New York, NY',
    jobType: 'Contract',
    experienceLevel: 'Mid-level',
    salary: '$80,000 - $100,000',
    savedAt: '2024-01-13T09:15:00Z',
    status: 'closed',
    description: 'Create beautiful and intuitive user experiences...',
    skills: ['Figma', 'User Research', 'Prototyping', 'Design Systems'],
    logo: ''
  }
];

const SavedJobsPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('savedAt');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(9);

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  const fetchSavedJobs = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSavedJobs(mockSavedJobs);
    } catch (error) {
      console.error('Error fetching saved jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsaveJob = (jobId: string) => {
    setSavedJobs(prev => prev.filter(job => job._id !== jobId));
  };

  const handleClearAllFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setSortBy('savedAt');
  };

  // Filter and sort jobs
  const filteredJobs = savedJobs
    .filter(job => {
      const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           job.company.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || job.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'savedAt':
          return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'company':
          return a.company.localeCompare(b.company);
        default:
          return 0;
      }
    });

  // Pagination
  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);
  const paginatedJobs = filteredJobs.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const JobCard: React.FC<{ job: SavedJob }> = ({ job }) => {
    const savedDate = new Date(job.savedAt);
    const daysAgo = Math.floor((new Date().getTime() - savedDate.getTime()) / (1000 * 3600 * 24));

    return (
      <Card 
        sx={{ 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: theme.shadows[8]
          }
        }}
      >
        <CardContent sx={{ flexGrow: 1 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box display="flex" alignItems="center">
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 1,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 2
                }}
              >
                <Business color="primary" />
              </Box>
              <Box>
                <Typography variant="h6" component="h3" fontWeight="bold">
                  {job.title}
                </Typography>
                <Typography variant="subtitle2" color="primary.main">
                  {job.company}
                </Typography>
              </Box>
            </Box>
            <Chip
              label={job.status}
              color={job.status === 'active' ? 'success' : job.status === 'closed' ? 'error' : 'warning'}
              size="small"
            />
          </Box>

          <Stack direction="row" spacing={2} mb={2} flexWrap="wrap">
            <Box display="flex" alignItems="center">
              <LocationOn fontSize="small" color="action" sx={{ mr: 0.5 }} />
              <Typography variant="body2">{job.location}</Typography>
            </Box>
            {job.salary && (
              <Box display="flex" alignItems="center">
                <AttachMoney fontSize="small" color="action" sx={{ mr: 0.5 }} />
                <Typography variant="body2">{job.salary}</Typography>
              </Box>
            )}
            <Box display="flex" alignItems="center">
              <Schedule fontSize="small" color="action" sx={{ mr: 0.5 }} />
              <Typography variant="body2">
                Saved {daysAgo === 0 ? 'today' : `${daysAgo} days ago`}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} mb={2} flexWrap="wrap">
            <Chip label={job.jobType} size="small" variant="outlined" />
            <Chip label={job.experienceLevel} size="small" variant="outlined" />
            {job.skills.slice(0, 2).map(skill => (
              <Chip key={skill} label={skill} size="small" variant="outlined" />
            ))}
            {job.skills.length > 2 && (
              <Chip 
                label={`+${job.skills.length - 2} more`} 
                size="small" 
                variant="outlined" 
              />
            )}
          </Stack>

          <Typography variant="body2" color="text.secondary" sx={{ 
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {job.description}
          </Typography>
        </CardContent>

        <CardActions sx={{ p: 2, pt: 0 }}>
          <Button
            variant="contained"
            size="small"
            onClick={() => navigate(`/app/jobs/${job._id}`)}
            endIcon={<ArrowForward />}
            sx={{ mr: 1 }}
          >
            View Job
          </Button>
          <Tooltip title="Remove from saved">
            <IconButton
              size="small"
              onClick={() => handleUnsaveJob(job._id)}
              color="error"
            >
              <Delete />
            </IconButton>
          </Tooltip>
          <Tooltip title="Share job">
            <IconButton size="small">
              <Share />
            </IconButton>
          </Tooltip>
        </CardActions>
      </Card>
    );
  };

  return (
    <Container maxWidth="xl">
      <Box mb={4}>
        <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
          Saved Jobs
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Keep track of jobs you're interested in
        </Typography>
      </Box>

      {/* Filters and Search */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search saved jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchTerm('')}>
                      <Clear />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                label="Status"
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="closed">Closed</MenuItem>
                <MenuItem value="expired">Expired</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                label="Sort By"
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem value="savedAt">Date Saved</MenuItem>
                <MenuItem value="title">Job Title</MenuItem>
                <MenuItem value="company">Company</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button
                variant="outlined"
                startIcon={<Clear />}
                onClick={handleClearAllFilters}
              >
                Clear Filters
              </Button>
              <Tooltip title="Grid view">
                <IconButton
                  onClick={() => setViewMode('grid')}
                  color={viewMode === 'grid' ? 'primary' : 'default'}
                >
                  <ViewModule />
                </IconButton>
              </Tooltip>
              <Tooltip title="List view">
                <IconButton
                  onClick={() => setViewMode('list')}
                  color={viewMode === 'list' ? 'primary' : 'default'}
                >
                  <ViewList />
                </IconButton>
              </Tooltip>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Results Summary */}
      <Box mb={3}>
        <Typography variant="body1" color="text.secondary">
          {loading ? 'Loading...' : `${filteredJobs.length} saved job${filteredJobs.length !== 1 ? 's' : ''} found`}
        </Typography>
      </Box>

      {/* Jobs Grid/List */}
      {loading ? (
        <Grid container spacing={3}>
          {Array.from({ length: 6 }).map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card>
                <CardContent>
                  <Skeleton variant="rectangular" height={40} sx={{ mb: 2 }} />
                  <Skeleton variant="text" height={30} sx={{ mb: 1 }} />
                  <Skeleton variant="text" height={20} sx={{ mb: 2 }} />
                  <Skeleton variant="text" height={60} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : filteredJobs.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Bookmark sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            No saved jobs found
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            {searchTerm || filterStatus !== 'all' 
              ? 'Try adjusting your filters to see more results.'
              : 'Start saving jobs you\'re interested in to see them here.'
            }
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/app/jobs')}
            startIcon={<Search />}
          >
            Browse Jobs
          </Button>
        </Paper>
      ) : (
        <>
          <Grid container spacing={3}>
            {paginatedJobs.map((job) => (
              <Grid item xs={12} sm={6} md={4} key={job._id}>
                <JobCard job={job} />
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, newPage) => setPage(newPage)}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
};

export default SavedJobsPage;
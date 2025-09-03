import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Avatar,
  Tooltip,
  Alert,
  Skeleton,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Pause as PauseIcon,
  PlayArrow as PlayIcon,
  ContentCopy as CopyIcon,
  Delete as DeleteIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  Work as WorkIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { companyService } from '../services/companyService';

interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  jobType: string;
  experienceLevel: string;
  status: 'draft' | 'active' | 'paused' | 'closed' | 'expired';
  applicationsCount: number;
  viewsCount: number;
  applicationDeadline?: string;
  createdAt: string;
  updatedAt: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`job-tabpanel-${index}`}
      aria-labelledby={`job-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const EmployerJobsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Company profile status
  const [companyProfileStatus, setCompanyProfileStatus] = useState<'approved' | 'pending' | 'rejected' | 'not-submitted' | null>(null);
  const [totalJobs, setTotalJobs] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tabValue, setTabValue] = useState(0);
  
  // Menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  
  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  useEffect(() => {
    checkCompanyProfileStatus();
    fetchJobs();
  }, [page, rowsPerPage, searchQuery, statusFilter]);

  const checkCompanyProfileStatus = async () => {
    try {
      const response = await companyService.getMyCompanyProfileStatus();
      if (response.success && response.data) {
        setCompanyProfileStatus(response.data.approvalStatus);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        setCompanyProfileStatus('not-submitted');
      }
    }
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: rowsPerPage.toString(),
      });

      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/employer/jobs?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }

      const data = await response.json();
      setJobs(data.data);
      setTotalJobs(data.pagination.total);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleJobMenuClick = (event: React.MouseEvent<HTMLElement>, job: Job) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedJob(job);
  };

  const handleJobMenuClose = () => {
    setAnchorEl(null);
    setSelectedJob(null);
  };

  const handleToggleJobStatus = async () => {
    if (!selectedJob) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/employer/jobs/${selectedJob._id}/toggle-status`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update job status');
      }

      // Refresh jobs list
      fetchJobs();
      handleJobMenuClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update job status');
    }
  };

  const handleDuplicateJob = async () => {
    if (!selectedJob) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/employer/jobs/${selectedJob._id}/duplicate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to duplicate job');
      }

      // Refresh jobs list
      fetchJobs();
      handleJobMenuClose();
    } catch (err: any) {
      setError(err.message || 'Failed to duplicate job');
    }
  };

  const handleDeleteJob = async () => {
    if (!selectedJob) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/employer/jobs/${selectedJob._id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete job');
      }

      // Refresh jobs list
      fetchJobs();
      setDeleteDialogOpen(false);
      handleJobMenuClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete job');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'success';
      case 'paused':
        return 'warning';
      case 'draft':
        return 'info';
      case 'closed':
        return 'error';
      case 'expired':
        return 'default';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getJobsByStatus = (status: string) => {
    if (status === 'all') return jobs;
    return jobs.filter(job => job.status === status);
  };

  const getStatusCount = (status: string) => {
    if (status === 'all') return jobs.length;
    return jobs.filter(job => job.status === status).length;
  };

  const JobCard = ({ job }: { job: Job }) => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box flex={1}>
            <Typography variant="h6" gutterBottom>
              {job.title}
            </Typography>
            <Typography color="textSecondary" gutterBottom>
              {job.company} • {job.location}
            </Typography>
            <Box display="flex" gap={1} mb={2}>
              <Chip 
                label={job.status} 
                size="small" 
                color={getStatusColor(job.status) as any}
              />
              <Chip 
                label={job.jobType} 
                size="small" 
                variant="outlined"
              />
              <Chip 
                label={job.experienceLevel} 
                size="small" 
                variant="outlined"
              />
            </Box>
            <Box display="flex" gap={3}>
              <Box display="flex" alignItems="center" gap={0.5}>
                <PeopleIcon fontSize="small" color="action" />
                <Typography variant="body2" color="textSecondary">
                  {job.applicationsCount} applications
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={0.5}>
                <TrendingUpIcon fontSize="small" color="action" />
                <Typography variant="body2" color="textSecondary">
                  {job.viewsCount} views
                </Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                Created {formatDate(job.createdAt)}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={(e) => handleJobMenuClick(e, job)}>
            <MoreVertIcon />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );

  const TableView = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Job Title</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Applications</TableCell>
            <TableCell>Views</TableCell>
            <TableCell>Created</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {jobs.map((job) => (
            <TableRow key={job._id} hover>
              <TableCell>
                <Box>
                  <Typography variant="subtitle2">
                    {job.title}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {job.company} • {job.location}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Chip 
                  label={job.status} 
                  size="small" 
                  color={getStatusColor(job.status) as any}
                />
              </TableCell>
              <TableCell>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <PeopleIcon fontSize="small" color="action" />
                  {job.applicationsCount}
                </Box>
              </TableCell>
              <TableCell>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <TrendingUpIcon fontSize="small" color="action" />
                  {job.viewsCount}
                </Box>
              </TableCell>
              <TableCell>
                {formatDate(job.createdAt)}
              </TableCell>
              <TableCell>
                <IconButton
                  size="small"
                  onClick={(e) => handleJobMenuClick(e, job)}
                >
                  <MoreVertIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={totalJobs}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
      />
    </TableContainer>
  );

  if (loading && jobs.length === 0) {
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          My Jobs
        </Typography>
        <Grid container spacing={2}>
          {[1, 2, 3].map((i) => (
            <Grid item xs={12} key={i}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" width="60%" height={32} />
                  <Skeleton variant="text" width="40%" />
                  <Box display="flex" gap={1} my={2}>
                    <Skeleton variant="rectangular" width={80} height={24} />
                    <Skeleton variant="rectangular" width={80} height={24} />
                  </Box>
                  <Skeleton variant="text" width="80%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          My Jobs
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/app/jobs/create')}
          disabled={companyProfileStatus !== 'approved'}
        >
          Post New Job
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Company Profile Warning Banner */}
      {companyProfileStatus && companyProfileStatus !== 'approved' && (
        <Alert 
          severity={companyProfileStatus === 'not-submitted' ? 'info' : companyProfileStatus === 'pending' ? 'warning' : 'error'} 
          sx={{ mb: 3 }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={() => navigate('/app/employer/company-profile')}
            >
              {companyProfileStatus === 'not-submitted' ? 'Submit Profile' : 
               companyProfileStatus === 'pending' ? 'View Status' : 'Update Profile'}
            </Button>
          }
        >
          <strong>
            {companyProfileStatus === 'not-submitted' ? 'Company Profile Required' :
             companyProfileStatus === 'pending' ? 'Company Profile Under Review' : 'Company Profile Needs Attention'}
          </strong>
          <br />
          {companyProfileStatus === 'not-submitted' ? 
            'You need to submit your company profile for approval before posting new jobs.' :
           companyProfileStatus === 'pending' ? 
            'Your company profile is under review. You cannot post new jobs until it\'s approved.' :
            'Your company profile was rejected. Please review and update it to continue posting jobs.'}
        </Alert>
      )}

      {/* Search and Filters */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            placeholder="Search jobs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Status Filter</InputLabel>
            <Select
              value={statusFilter}
              label="Status Filter"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="paused">Paused</MenuItem>
              <MenuItem value="closed">Closed</MenuItem>
              <MenuItem value="expired">Expired</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={2}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => setFilterDialogOpen(true)}
            sx={{ height: '56px' }}
          >
            Filters
          </Button>
        </Grid>
      </Grid>

      {/* Status Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab 
            label={`All (${getStatusCount('all')})`} 
            onClick={() => setStatusFilter('all')}
          />
          <Tab 
            label={`Active (${getStatusCount('active')})`} 
            onClick={() => setStatusFilter('active')}
          />
          <Tab 
            label={`Draft (${getStatusCount('draft')})`} 
            onClick={() => setStatusFilter('draft')}
          />
          <Tab 
            label={`Paused (${getStatusCount('paused')})`} 
            onClick={() => setStatusFilter('paused')}
          />
        </Tabs>
      </Box>

      {/* Jobs List */}
      {jobs.length === 0 ? (
        <Card>
          <CardContent>
            <Box textAlign="center" py={6}>
              <WorkIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No jobs found
              </Typography>
              <Typography color="textSecondary" gutterBottom>
                {searchQuery || statusFilter !== 'all' 
                  ? "Try adjusting your search criteria"
                  : "Start by creating your first job posting"
                }
              </Typography>
              {!searchQuery && statusFilter === 'all' && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/app/jobs/create')}
                  sx={{ mt: 2 }}
                >
                  Create First Job
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Toggle between card and table view */}
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Button
              size="small"
              onClick={() => setTabValue(tabValue === 0 ? 1 : 0)}
            >
              {tabValue === 0 ? 'Table View' : 'Card View'}
            </Button>
          </Box>

          <TabPanel value={tabValue} index={0}>
            {jobs.map((job) => (
              <JobCard key={job._id} job={job} />
            ))}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <TableView />
          </TabPanel>
        </>
      )}

      {/* Job Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleJobMenuClose}
      >
        <MenuItem onClick={() => {
          navigate(`/app/employer/jobs/${selectedJob?._id}/applications`);
          handleJobMenuClose();
        }}>
          <PeopleIcon fontSize="small" sx={{ mr: 1 }} />
          View Applications ({selectedJob?.applicationsCount || 0})
        </MenuItem>
        <MenuItem onClick={() => {
          navigate(`/app/employer/jobs/${selectedJob?._id}/analytics`);
          handleJobMenuClose();
        }}>
          <AssessmentIcon fontSize="small" sx={{ mr: 1 }} />
          View Analytics
        </MenuItem>
        <MenuItem onClick={() => {
          navigate(`/app/jobs/${selectedJob?._id}`);
          handleJobMenuClose();
        }}>
          <ViewIcon fontSize="small" sx={{ mr: 1 }} />
          View Public Page
        </MenuItem>
        <MenuItem onClick={() => {
          navigate(`/app/jobs/create?duplicate=${selectedJob?._id}`);
          handleJobMenuClose();
        }}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit Job
        </MenuItem>
        <MenuItem onClick={handleDuplicateJob}>
          <CopyIcon fontSize="small" sx={{ mr: 1 }} />
          Duplicate Job
        </MenuItem>
        <MenuItem onClick={handleToggleJobStatus}>
          {selectedJob?.status === 'active' ? (
            <>
              <PauseIcon fontSize="small" sx={{ mr: 1 }} />
              Pause Job
            </>
          ) : (
            <>
              <PlayIcon fontSize="small" sx={{ mr: 1 }} />
              Activate Job
            </>
          )}
        </MenuItem>
        <MenuItem 
          onClick={() => {
            setDeleteDialogOpen(true);
            handleJobMenuClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete Job
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Job</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedJob?.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteJob} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployerJobsPage;
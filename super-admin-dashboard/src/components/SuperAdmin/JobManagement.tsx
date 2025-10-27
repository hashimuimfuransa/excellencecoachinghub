import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Alert,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
  Switch,
  FormControlLabel,
  Badge,
  LinearProgress,
  Avatar
} from '@mui/material';
import {
  Search,
  Add,
  Visibility,
  Edit,
  Delete,
  Block,
  CheckCircle,
  MoreVert,
  Download,
  Business,
  LocationOn,
  Schedule,
  Assignment,
  Info,
  Refresh,
  Star,
  StarBorder,
  Share,
  Archive,
  Create,
  Pause,
  PlayArrow
} from '@mui/icons-material';
import type { Job } from '../../types/job';
import { JobStatus, JobType, ExperienceLevel, EducationLevel } from '../../types/job';
import { superAdminService } from '../../services/superAdminService';

interface JobManagementProps {
  onJobSelect?: (job: Job) => void;
}



interface JobFilter {
  search: string;
  searchType: 'job' | 'company' | 'other';
  status: string;
  type: string;
  experienceLevel: string;
  location: string;
  employer: string;
  dateRange: string;
  featured: boolean;
}

const JobManagement: React.FC<JobManagementProps> = ({ onJobSelect }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [totalJobs, setTotalJobs] = useState(0);


  const [filters, setFilters] = useState<JobFilter>({
    search: '',
    searchType: 'job',
    status: '',
    type: '',
    experienceLevel: '',
    location: '',
    employer: '',
    dateRange: '',
    featured: false
  });

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [jobDialog, setJobDialog] = useState({
    open: false,
    mode: 'view' as 'view' | 'edit' | 'create',
    job: null as Job | null
  });

  const [actionMenu, setActionMenu] = useState<{
    anchorEl: HTMLElement | null;
    job: Job | null;
  }>({ anchorEl: null, job: null });

  const [bulkActions, setBulkActions] = useState({
    selectedJobs: [] as string[],
    selectAll: false
  });

  const [expiredJobsSection, setExpiredJobsSection] = useState({
    show: false,
    loading: false,
    expiredJobs: [] as Job[],
    deletionResult: null as { deletedCount: number; deletedJobs: any[] } | null
  });

  const [showAllJobs, setShowAllJobs] = useState(false);

  useEffect(() => {
    loadJobs();
  }, [page, rowsPerPage, filters, showAllJobs]);

  const loadJobs = async () => {
    setLoading(true);
    try {
      // Build search parameters based on search type
      const searchParams: any = {
        page: page + 1,
        limit: showAllJobs ? 10000 : rowsPerPage,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        showAll: showAllJobs
      };

      // Add search parameter - backend should handle different search types
      if (filters.search) {
        searchParams.search = filters.search;
        // Add search type as a hint to the backend
        searchParams.searchType = filters.searchType;
      }

      if (filters.status) {
        searchParams.status = filters.status;
      }

      const response = await superAdminService.getAllJobs(searchParams);

      console.log('🔍 JobManagement: Raw API response:', response);

      // Handle different possible response structures
      let jobsData: Job[] = [];
      let totalCount = 0;

      if (response) {
        // Check if response has jobs directly
        if (response.jobs && Array.isArray(response.jobs)) {
          jobsData = response.jobs;
          totalCount = response.total || response.jobs.length;
        }
        // Check if response has data.jobs structure
        else if (response.data && response.data.jobs && Array.isArray(response.data.jobs)) {
          jobsData = response.data.jobs;
          totalCount = response.data.total || response.data.jobs.length;
        }
        // Check if response is directly an array
        else if (Array.isArray(response)) {
          jobsData = response;
          totalCount = response.length;
        }
        // Check if response has success and data structure
        else if (response.success && response.data) {
          if (Array.isArray(response.data)) {
            jobsData = response.data;
            totalCount = response.data.length;
          } else if (response.data.jobs) {
            jobsData = response.data.jobs;
            totalCount = response.data.total || response.data.jobs.length;
          }
        }
      }

      console.log('🔍 JobManagement: Extracted jobs data:', jobsData);
      console.log('🔍 JobManagement: Total count:', totalCount);

      setJobs(jobsData);
      setTotalJobs(totalCount);
    } catch (error) {
      console.error('Error loading jobs:', error);
      // Fallback to mock data if API fails
      const mockJobs: Job[] = [
        {
          _id: '1',
          title: 'Senior Full Stack Developer',
          description: 'We are looking for an experienced full stack developer...',
          company: 'TechCorp Inc.',
          location: 'San Francisco, CA',
          jobType: JobType.FULL_TIME,
          experienceLevel: ExperienceLevel.SENIOR_LEVEL,
          educationLevel: EducationLevel.BACHELOR,
          skills: ['React', 'Node.js', 'TypeScript', 'MongoDB'],
          salary: { min: 120000, max: 180000, currency: 'USD' },
          benefits: ['Health Insurance', '401k', 'Remote Work'],
          requirements: ['5+ years experience', 'Strong problem-solving skills'],
          responsibilities: ['Develop web applications', 'Code reviews', 'Mentoring'],
          applicationDeadline: '2024-02-15T23:59:59Z',
          status: JobStatus.ACTIVE,
          employer: {
            _id: 'emp1',
            firstName: 'John',
            lastName: 'Smith',
            email: 'john@techcorp.com',
            role: 'employer' as any,
            isActive: true,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          },
          relatedCourses: [],
          psychometricTests: [],
          isCurated: true,
          applicationsCount: 45,
          viewsCount: 234,
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-20T15:30:00Z'
        },
        {
          _id: '2',
          title: 'Marketing Manager',
          description: 'Join our marketing team to drive growth...',
          company: 'Growth Co.',
          location: 'New York, NY',
          jobType: JobType.FULL_TIME,
          experienceLevel: ExperienceLevel.MID_LEVEL,
          educationLevel: EducationLevel.BACHELOR,
          skills: ['Digital Marketing', 'SEO', 'Analytics', 'Content Strategy'],
          salary: { min: 80000, max: 120000, currency: 'USD' },
          benefits: ['Health Insurance', 'Flexible Hours'],
          requirements: ['3+ years marketing experience', 'Strong analytical skills'],
          responsibilities: ['Campaign management', 'Team leadership', 'Strategy development'],
          applicationDeadline: '2024-02-20T23:59:59Z',
          status: JobStatus.ACTIVE,
          employer: {
            _id: 'emp2',
            firstName: 'Sarah',
            lastName: 'Johnson',
            email: 'sarah@growthco.com',
            role: 'employer' as any,
            isActive: true,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          },
          relatedCourses: [],
          psychometricTests: [],
          isCurated: false,
          applicationsCount: 28,
          viewsCount: 156,
          createdAt: '2024-01-18T09:00:00Z',
          updatedAt: '2024-01-19T14:20:00Z'
        }
      ];

      setJobs(mockJobs);
      setTotalJobs(mockJobs.length);
    } finally {
      setLoading(false);
    }
  };



  const handleFilterChange = (field: keyof JobFilter, value: string | boolean) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(0);
  };

  const handleJobAction = (action: string, job: Job) => {
    setActionMenu({ anchorEl: null, job: null });
    
    switch (action) {
      case 'view':
        setJobDialog({ open: true, mode: 'view', job });
        break;
      case 'edit':
        setJobDialog({ open: true, mode: 'edit', job });
        break;
      case 'activate':
        handleActivateJob(job);
        break;
      case 'pause':
        handlePauseJob(job);
        break;
      case 'archive':
        handleArchiveJob(job);
        break;
      case 'feature':
        handleFeatureJob(job);
        break;
      case 'delete':
        handleDeleteJob(job);
        break;
      case 'duplicate':
        handleDuplicateJob(job);
        break;
    }
  };

  const handleActivateJob = async (job: Job) => {
    try {
      console.log('Activating job:', job.title);
      await superAdminService.updateJob(job._id, { status: JobStatus.ACTIVE });
      console.log('✅ Job activated successfully');
      loadJobs();
    } catch (error) {
      console.error('❌ Error activating job:', error);
      alert('Failed to activate job. Please try again.');
    }
  };

  const handlePauseJob = async (job: Job) => {
    try {
      console.log('Pausing job:', job.title);
      await superAdminService.updateJob(job._id, { status: JobStatus.PAUSED });
      console.log('✅ Job paused successfully');
      loadJobs();
    } catch (error) {
      console.error('❌ Error pausing job:', error);
      alert('Failed to pause job. Please try again.');
    }
  };

  const handleArchiveJob = async (job: Job) => {
    try {
      console.log('Archiving job:', job.title);
      await superAdminService.updateJob(job._id, { status: JobStatus.CLOSED });
      console.log('✅ Job archived successfully');
      loadJobs();
    } catch (error) {
      console.error('❌ Error archiving job:', error);
      alert('Failed to archive job. Please try again.');
    }
  };

  const handleFeatureJob = async (job: Job) => {
    try {
      console.log('Featuring job:', job.title);
      if (job.isCurated) {
        await superAdminService.unfeatureJob(job._id);
        console.log('✅ Job unfeatured successfully');
      } else {
        await superAdminService.featureJob(job._id);
        console.log('✅ Job featured successfully');
      }
      loadJobs();
    } catch (error) {
      console.error('❌ Error featuring/unfeaturing job:', error);
      alert('Failed to update job feature status. Please try again.');
    }
  };

  const handleDeleteJob = async (job: Job) => {
    if (window.confirm(`Are you sure you want to delete "${job.title}"?`)) {
      try {
        console.log('Deleting job:', job.title);
        await superAdminService.deleteJob(job._id);
        console.log('✅ Job deleted successfully');
        loadJobs(); // Reload the jobs list
      } catch (error) {
        console.error('❌ Error deleting job:', error);
        // You might want to show an error message to the user here
        alert('Failed to delete job. Please try again.');
      }
    }
  };

  const handleDuplicateJob = async (job: Job) => {
    try {
      console.log('Duplicating job:', job.title);
      loadJobs();
    } catch (error) {
      console.error('Error duplicating job:', error);
    }
  };

  const handleShowExpiredJobs = async () => {
    setExpiredJobsSection(prev => ({ ...prev, show: true, loading: true }));
    try {
      // Set filter to show only expired jobs
      setFilters(prev => ({ ...prev, status: JobStatus.EXPIRED }));
      
      // Also filter jobs to show only expired ones in current view
      const expiredJobs = jobs.filter(job => {
        if (!job.applicationDeadline) return false;
        const deadline = new Date(job.applicationDeadline);
        const now = new Date();
        return deadline < now;
      });
      setExpiredJobsSection(prev => ({ 
        ...prev, 
        expiredJobs, 
        loading: false 
      }));
    } catch (error) {
      console.error('Error loading expired jobs:', error);
      setExpiredJobsSection(prev => ({ ...prev, loading: false }));
    }
  };

  const handleDeleteAllExpiredJobs = async () => {
    if (!window.confirm('Are you sure you want to delete ALL expired jobs from the database? This action cannot be undone.')) {
      return;
    }

    setExpiredJobsSection(prev => ({ ...prev, loading: true }));
    try {
      console.log('🗑️ Deleting all expired jobs from database...');
      const result = await superAdminService.deleteExpiredJobs();
      
      setExpiredJobsSection(prev => ({ 
        ...prev, 
        deletionResult: result, 
        loading: false 
      }));
      
      console.log(`✅ Successfully deleted ${result.deletedCount} expired jobs from database`);
      
      // Reload the jobs list to reflect changes
      loadJobs();
      
      // Show success message
      alert(`Successfully deleted ${result.deletedCount} expired jobs from the database!`);
      
    } catch (error) {
      console.error('❌ Error deleting expired jobs:', error);
      setExpiredJobsSection(prev => ({ ...prev, loading: false }));
      alert('Failed to delete expired jobs. Please try again.');
    }
  };

  const handleBulkAction = async (action: string) => {
    const selectedJobIds = bulkActions.selectedJobs;
    if (selectedJobIds.length === 0) return;

    try {
      switch (action) {
        case 'activate':
          console.log('Bulk activating jobs:', selectedJobIds);
          await superAdminService.bulkJobAction(selectedJobIds, 'activate');
          console.log('✅ Bulk activation completed');
          break;
        case 'pause':
          console.log('Bulk pausing jobs:', selectedJobIds);
          await superAdminService.bulkJobAction(selectedJobIds, 'pause');
          console.log('✅ Bulk pause completed');
          break;
        case 'archive':
          console.log('Bulk archiving jobs:', selectedJobIds);
          await superAdminService.bulkJobAction(selectedJobIds, 'archive');
          console.log('✅ Bulk archive completed');
          break;
        case 'delete':
          if (window.confirm(`Delete ${selectedJobIds.length} selected jobs? This action cannot be undone.`)) {
            console.log('Bulk deleting jobs:', selectedJobIds);
            await superAdminService.bulkJobAction(selectedJobIds, 'delete');
            console.log('✅ Bulk deletion completed');
          }
          break;
        case 'export':
          console.log('Exporting selected jobs:', selectedJobIds);
          // Export functionality can be implemented later
          break;
      }
      
      loadJobs(); // Reload the jobs list
    } catch (error) {
      console.error('❌ Error in bulk action:', error);
      alert(`Failed to ${action} jobs. Please try again.`);
    } finally {
      setBulkActions({ selectedJobs: [], selectAll: false });
    }
  };

  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case JobStatus.ACTIVE:
        return 'success';
      case JobStatus.DRAFT:
        return 'default';
      case JobStatus.PAUSED:
        return 'warning';
      case JobStatus.CLOSED:
        return 'error';
      case JobStatus.EXPIRED:
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: JobStatus) => {
    switch (status) {
      case JobStatus.ACTIVE:
        return <CheckCircle color="success" />;
      case JobStatus.DRAFT:
        return <Create />;
      case JobStatus.PAUSED:
        return <Pause color="warning" />;
      case JobStatus.CLOSED:
        return <Block color="error" />;
      case JobStatus.EXPIRED:
        return <Schedule color="error" />;
      default:
        return <Info />;
    }
  };

  const formatSalary = (salary: any) => {
    if (!salary) return 'Not specified';
    return `$${salary.min.toLocaleString()} - $${salary.max.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };



  return (
    <Box>




      {/* Filters and Actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              placeholder={`Search ${filters.searchType === 'job' ? 'jobs' : filters.searchType === 'company' ? 'companies' : 'other'}...`}
              variant="outlined"
              size="small"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              sx={{ minWidth: 250 }}
            />
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Search By</InputLabel>
              <Select
                value={filters.searchType}
                label="Search By"
                onChange={(e) => handleFilterChange('searchType', e.target.value)}
              >
                <MenuItem value="job">Job</MenuItem>
                <MenuItem value="company">Company</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value={JobStatus.ACTIVE}>Active</MenuItem>
                <MenuItem value={JobStatus.DRAFT}>Draft</MenuItem>
                <MenuItem value={JobStatus.PAUSED}>Paused</MenuItem>
                <MenuItem value={JobStatus.CLOSED}>Closed</MenuItem>
                <MenuItem value={JobStatus.EXPIRED}>Expired</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={filters.type}
                label="Type"
                onChange={(e) => handleFilterChange('type', e.target.value)}
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value={JobType.FULL_TIME}>Full Time</MenuItem>
                <MenuItem value={JobType.PART_TIME}>Part Time</MenuItem>
                <MenuItem value={JobType.CONTRACT}>Contract</MenuItem>
                <MenuItem value={JobType.INTERNSHIP}>Internship</MenuItem>
                <MenuItem value={JobType.FREELANCE}>Freelance</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={filters.featured}
                  onChange={(e) => handleFilterChange('featured', e.target.checked)}
                />
              }
              label="Featured Only"
            />

            <Box sx={{ flexGrow: 1 }} />

            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setJobDialog({ open: true, mode: 'create', job: null })}
            >
              Create Job
            </Button>

            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={() => handleBulkAction('export')}
            >
              Export
            </Button>

            <Button
              variant="outlined"
              color="warning"
              startIcon={<Schedule />}
              onClick={handleShowExpiredJobs}
            >
              Manage Expired Jobs
            </Button>

            <IconButton onClick={loadJobs}>
              <Refresh />
            </IconButton>
          </Box>

          {/* Bulk Actions */}
          {bulkActions.selectedJobs.length > 0 && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography>
                  {bulkActions.selectedJobs.length} job(s) selected
                </Typography>
                <Button size="small" onClick={() => handleBulkAction('activate')}>
                  Activate
                </Button>
                <Button size="small" onClick={() => handleBulkAction('pause')}>
                  Pause
                </Button>
                <Button size="small" onClick={() => handleBulkAction('archive')}>
                  Archive
                </Button>
                <Button size="small" color="error" onClick={() => handleBulkAction('delete')}>
                  Delete
                </Button>
                <Button size="small" onClick={() => setBulkActions({ selectedJobs: [], selectAll: false })}>
                  Clear
                </Button>
              </Box>
            </Alert>
          )}

          {/* Expired Jobs Management Section */}
          {expiredJobsSection.show && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    🗑️ Expired Jobs Management
                  </Typography>
                  <Typography variant="body2">
                    {expiredJobsSection.loading 
                      ? 'Loading expired jobs...' 
                      : `Found ${expiredJobsSection.expiredJobs.length} expired jobs in the current view`
                    }
                  </Typography>
                  {expiredJobsSection.deletionResult && (
                    <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                      ✅ Successfully deleted {expiredJobsSection.deletionResult.deletedCount} expired jobs from database
                    </Typography>
                  )}
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<Delete />}
                    onClick={handleDeleteAllExpiredJobs}
                    disabled={expiredJobsSection.loading || expiredJobsSection.expiredJobs.length === 0}
                  >
                    {expiredJobsSection.loading ? 'Deleting...' : 'Delete All Expired Jobs'}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setExpiredJobsSection(prev => ({ ...prev, show: false }))}
                  >
                    Close
                  </Button>
                </Box>
              </Box>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Jobs Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          {loading && <LinearProgress />}
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Switch
                      checked={bulkActions.selectAll}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setBulkActions({
                          selectAll: checked,
                          selectedJobs: checked && Array.isArray(jobs) ? jobs.map(j => j._id) : []
                        });
                      }}
                    />
                  </TableCell>
                  <TableCell>Job</TableCell>
                  <TableCell>Company</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Applications</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.isArray(jobs) && jobs.map((job) => {
                  // Check if job is expired
                  const isExpired = job.applicationDeadline && new Date(job.applicationDeadline) < new Date();
                  
                  return (
                    <TableRow 
                      key={job._id} 
                      hover
                      sx={{
                        backgroundColor: isExpired ? 'rgba(255, 152, 0, 0.1)' : 'inherit',
                        '&:hover': {
                          backgroundColor: isExpired ? 'rgba(255, 152, 0, 0.15)' : 'inherit'
                        }
                      }}
                    >
                    <TableCell padding="checkbox">
                      <Switch
                        checked={bulkActions.selectedJobs.includes(job._id)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setBulkActions(prev => ({
                            selectAll: false,
                            selectedJobs: checked
                              ? [...prev.selectedJobs, job._id]
                              : prev.selectedJobs.filter(id => id !== job._id)
                          }));
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle2">
                              {job.title}
                            </Typography>
                            {job.isCurated && (
                              <Tooltip title="Featured Job">
                                <Star color="warning" fontSize="small" />
                              </Tooltip>
                            )}
                            {isExpired && (
                              <Tooltip title="Expired Job">
                                <Schedule color="error" fontSize="small" />
                              </Tooltip>
                            )}
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {job.jobType.replace('_', ' ')} • {job.experienceLevel.replace('_', ' ')}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            <LocationOn fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                            {job.location}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 1, width: 32, height: 32 }}>
                          <Business />
                        </Avatar>
                        <Box>
                          <Typography variant="body2">
                            {job.company}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {job.employer ? `${job.employer.firstName} ${job.employer.lastName}` : 'Unknown Employer'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(job.status)}
                        label={job.status.replace('_', ' ').toUpperCase()}
                        color={getStatusColor(job.status) as any}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Badge badgeContent={job.applicationsCount} color="primary">
                          <Assignment />
                        </Badge>
                        <Typography variant="body2" color="text.secondary">
                          {job.viewsCount} views
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(job.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleJobAction('view', job)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Job">
                          <IconButton
                            size="small"
                            onClick={() => handleJobAction('edit', job)}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <IconButton
                          size="small"
                          onClick={(e) => setActionMenu({ anchorEl: e.currentTarget, job })}
                        >
                          <MoreVert />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={totalJobs}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </CardContent>
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenu.anchorEl}
        open={Boolean(actionMenu.anchorEl)}
        onClose={() => setActionMenu({ anchorEl: null, job: null })}
      >
        <MenuItem onClick={() => handleJobAction('view', actionMenu.job!)}>
          <ListItemIcon><Visibility /></ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleJobAction('edit', actionMenu.job!)}>
          <ListItemIcon><Edit /></ListItemIcon>
          <ListItemText>Edit Job</ListItemText>
        </MenuItem>
        <Divider />
        {actionMenu.job?.status === JobStatus.ACTIVE ? (
          <MenuItem onClick={() => handleJobAction('pause', actionMenu.job!)}>
            <ListItemIcon><Pause /></ListItemIcon>
            <ListItemText>Pause Job</ListItemText>
          </MenuItem>
        ) : (
          <MenuItem onClick={() => handleJobAction('activate', actionMenu.job!)}>
            <ListItemIcon><PlayArrow /></ListItemIcon>
            <ListItemText>Activate Job</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={() => handleJobAction('feature', actionMenu.job!)}>
          <ListItemIcon>{actionMenu.job?.isCurated ? <StarBorder /> : <Star />}</ListItemIcon>
          <ListItemText>{actionMenu.job?.isCurated ? 'Unfeature' : 'Feature'}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleJobAction('duplicate', actionMenu.job!)}>
          <ListItemIcon><Share /></ListItemIcon>
          <ListItemText>Duplicate</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleJobAction('archive', actionMenu.job!)}>
          <ListItemIcon><Archive /></ListItemIcon>
          <ListItemText>Archive</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleJobAction('delete', actionMenu.job!)} sx={{ color: 'error.main' }}>
          <ListItemIcon><Delete color="error" /></ListItemIcon>
          <ListItemText>Delete Job</ListItemText>
        </MenuItem>
      </Menu>

      {/* Job Dialog */}
      <Dialog
        open={jobDialog.open}
        onClose={() => setJobDialog({ open: false, mode: 'view', job: null })}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          {jobDialog.mode === 'create' ? 'Create New Job' :
           jobDialog.mode === 'edit' ? 'Edit Job' : 'Job Details'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Job Title"
                variant="outlined"
                defaultValue={jobDialog.job?.title}
                disabled={jobDialog.mode === 'view'}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Company"
                variant="outlined"
                defaultValue={jobDialog.job?.company}
                disabled={jobDialog.mode === 'view'}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location"
                variant="outlined"
                defaultValue={jobDialog.job?.location}
                disabled={jobDialog.mode === 'view'}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Job Type</InputLabel>
                <Select
                  label="Job Type"
                  defaultValue={jobDialog.job?.jobType || ''}
                  disabled={jobDialog.mode === 'view'}
                >
                  <MenuItem value={JobType.FULL_TIME}>Full Time</MenuItem>
                  <MenuItem value={JobType.PART_TIME}>Part Time</MenuItem>
                  <MenuItem value={JobType.CONTRACT}>Contract</MenuItem>
                  <MenuItem value={JobType.INTERNSHIP}>Internship</MenuItem>
                  <MenuItem value={JobType.FREELANCE}>Freelance</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Experience Level</InputLabel>
                <Select
                  label="Experience Level"
                  defaultValue={jobDialog.job?.experienceLevel || ''}
                  disabled={jobDialog.mode === 'view'}
                >
                  <MenuItem value={ExperienceLevel.ENTRY_LEVEL}>Entry Level</MenuItem>
                  <MenuItem value={ExperienceLevel.MID_LEVEL}>Mid Level</MenuItem>
                  <MenuItem value={ExperienceLevel.SENIOR_LEVEL}>Senior Level</MenuItem>
                  <MenuItem value={ExperienceLevel.EXECUTIVE}>Executive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={4}
                variant="outlined"
                defaultValue={jobDialog.job?.description}
                disabled={jobDialog.mode === 'view'}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Min Salary"
                type="number"
                variant="outlined"
                defaultValue={jobDialog.job?.salary?.min}
                disabled={jobDialog.mode === 'view'}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Max Salary"
                type="number"
                variant="outlined"
                defaultValue={jobDialog.job?.salary?.max}
                disabled={jobDialog.mode === 'view'}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    defaultChecked={jobDialog.job?.isCurated}
                    disabled={jobDialog.mode === 'view'}
                  />
                }
                label="Featured Job"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setJobDialog({ open: false, mode: 'view', job: null })}>
            Cancel
          </Button>
          {jobDialog.mode !== 'view' && (
            <Button variant="contained">
              {jobDialog.mode === 'create' ? 'Create Job' : 'Save Changes'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default JobManagement;
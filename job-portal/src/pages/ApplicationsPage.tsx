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
  Stack,
  TextField,
  InputAdornment,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Pagination,
  Paper,
  Avatar,
  Skeleton,
  Alert,
  IconButton,
  Tooltip,
  Divider,
  useTheme,
  alpha,
  Tabs,
  Tab,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemAvatar,
  LinearProgress
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot
} from '@mui/lab';
import {
  Search,
  LocationOn,
  AttachMoney,
  Schedule,
  Business,
  Visibility,
  ArrowForward,
  FilterList,
  Clear,
  Sort,
  Work,
  AccessTime,
  Person,
  CheckCircle,
  Cancel,
  HourglassEmpty,
  Send,
  Close,
  Info,
  Warning,
  Edit,
  Delete,
  Refresh,
  GetApp,
  Share,
  Star,
  StarBorder,
  Assignment,
  CalendarToday,
  Phone,
  Email,
  VideoCall
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { jobApplicationService } from '../services/jobApplicationService';
import { ApplicationStatus } from '../types';
import type { JobApplication } from '../types';



const ApplicationsPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await jobApplicationService.getUserApplications();
      setApplications(data);
    } catch (error) {
      console.error('Error fetching applications:', error);
      setError('Failed to load applications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (application: JobApplication) => {
    setSelectedApplication(application);
    setDetailsDialogOpen(true);
  };

  const handleWithdrawApplication = async (applicationId: string) => {
    try {
      await jobApplicationService.withdrawApplication(applicationId);
      // Refresh applications after withdrawal
      await fetchApplications();
    } catch (error) {
      console.error('Error withdrawing application:', error);
      setError('Failed to withdraw application. Please try again.');
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setPage(1);
  };

  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case ApplicationStatus.APPLIED:
        return 'warning';
      case ApplicationStatus.UNDER_REVIEW:
        return 'info';
      case ApplicationStatus.SHORTLISTED:
        return 'primary';
      case ApplicationStatus.INTERVIEW_SCHEDULED:
        return 'primary';
      case ApplicationStatus.INTERVIEWED:
        return 'primary';
      case ApplicationStatus.OFFERED:
        return 'success';
      case ApplicationStatus.REJECTED:
        return 'error';
      case ApplicationStatus.WITHDRAWN:
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: ApplicationStatus) => {
    switch (status) {
      case ApplicationStatus.APPLIED:
        return <HourglassEmpty />;
      case ApplicationStatus.UNDER_REVIEW:
        return <Visibility />;
      case ApplicationStatus.SHORTLISTED:
        return <CheckCircle />;
      case ApplicationStatus.INTERVIEW_SCHEDULED:
        return <Person />;
      case ApplicationStatus.INTERVIEWED:
        return <Person />;
      case ApplicationStatus.OFFERED:
        return <CheckCircle />;
      case ApplicationStatus.REJECTED:
        return <Cancel />;
      case ApplicationStatus.WITHDRAWN:
        return <Cancel />;
      default:
        return <Assignment />;
    }
  };

  const getStatusLabel = (status: ApplicationStatus) => {
    switch (status) {
      case ApplicationStatus.APPLIED:
        return 'Applied';
      case ApplicationStatus.UNDER_REVIEW:
        return 'Under Review';
      case ApplicationStatus.SHORTLISTED:
        return 'Shortlisted';
      case ApplicationStatus.INTERVIEW_SCHEDULED:
        return 'Interview Scheduled';
      case ApplicationStatus.INTERVIEWED:
        return 'Interviewed';
      case ApplicationStatus.OFFERED:
        return 'Offered';
      case ApplicationStatus.REJECTED:
        return 'Rejected';
      case ApplicationStatus.WITHDRAWN:
        return 'Withdrawn';
      default:
        return status;
    }
  };

  // Filter applications based on tab
  const getFilteredApplicationsByTab = () => {
    switch (tabValue) {
      case 1: // Active
        return applications.filter(app => [
          ApplicationStatus.APPLIED, 
          ApplicationStatus.UNDER_REVIEW, 
          ApplicationStatus.SHORTLISTED,
          ApplicationStatus.INTERVIEW_SCHEDULED,
          ApplicationStatus.INTERVIEWED
        ].includes(app.status));
      case 2: // Interviews
        return applications.filter(app => [
          ApplicationStatus.INTERVIEW_SCHEDULED,
          ApplicationStatus.INTERVIEWED
        ].includes(app.status));
      case 3: // Offers
        return applications.filter(app => app.status === ApplicationStatus.OFFERED);
      case 4: // Closed
        return applications.filter(app => [
          ApplicationStatus.REJECTED, 
          ApplicationStatus.WITHDRAWN
        ].includes(app.status));
      default: // All
        return applications;
    }
  };

  // Apply additional filters
  const filteredApplications = getFilteredApplicationsByTab()
    .filter(app => {
      const matchesSearch = app.job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           app.job.company.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime();
        case 'oldest':
          return new Date(a.appliedAt).getTime() - new Date(b.appliedAt).getTime();
        case 'updated':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'company':
          return a.job.company.localeCompare(b.job.company);
        default:
          return 0;
      }
    });

  // Pagination
  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);
  const paginatedApplications = filteredApplications.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const ApplicationCard: React.FC<{ application: JobApplication }> = ({ application }) => {
    const daysAgo = Math.floor((new Date().getTime() - new Date(application.appliedAt).getTime()) / (1000 * 3600 * 24));
    const lastUpdatedDays = Math.floor((new Date().getTime() - new Date(application.updatedAt).getTime()) / (1000 * 3600 * 24));

    return (
      <Card 
        sx={{ 
          mb: 2,
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: theme.shadows[4]
          }
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <Box display="flex" alignItems="center">
                <Avatar
                  sx={{ 
                    width: 48, 
                    height: 48, 
                    mr: 2,
                    bgcolor: alpha(theme.palette.primary.main, 0.1)
                  }}
                >
                  <Business color="primary" />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {application.job.title}
                  </Typography>
                  <Typography variant="body2" color="primary.main">
                    {application.job.company}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {application.job.location}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <Box textAlign="center">
                <Chip
                  icon={getStatusIcon(application.status)}
                  label={getStatusLabel(application.status)}
                  color={getStatusColor(application.status)}
                  sx={{ mb: 1 }}
                />
                <Typography variant="body2" color="text.secondary">
                  Status
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <Box textAlign="center">
                <Typography variant="body2" fontWeight="medium">
                  {application.job.jobType}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Job Type
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <Box textAlign="center">
                <Typography variant="body2" fontWeight="medium">
                  {daysAgo === 0 ? 'Today' : `${daysAgo} days ago`}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Applied
                </Typography>
                {lastUpdatedDays !== daysAgo && (
                  <Typography variant="caption" color="text.secondary">
                    Updated {lastUpdatedDays === 0 ? 'today' : `${lastUpdatedDays} days ago`}
                  </Typography>
                )}
              </Box>
            </Grid>

            <Grid item xs={12} sm={12} md={2}>
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Tooltip title="View Details">
                  <IconButton
                    size="small"
                    onClick={() => handleViewDetails(application)}
                  >
                    <Visibility />
                  </IconButton>
                </Tooltip>
                <Tooltip title="View Job">
                  <IconButton
                    size="small"
                    onClick={() => navigate(`/app/jobs/${application.job._id}`)}
                  >
                    <ArrowForward />
                  </IconButton>
                </Tooltip>
                {[ApplicationStatus.APPLIED, ApplicationStatus.UNDER_REVIEW].includes(application.status) && (
                  <Tooltip title="Withdraw Application">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleWithdrawApplication(application._id)}
                    >
                      <Cancel />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
            </Grid>
          </Grid>

          {application.notes && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Notes:</strong> {application.notes}
              </Typography>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  };

  const ApplicationDetailsDialog = () => {
    if (!selectedApplication) return null;

    return (
      <Dialog 
        open={detailsDialogOpen} 
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h5" fontWeight="bold">
                Application Details
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedApplication.job.title} at {selectedApplication.job.company}
              </Typography>
            </Box>
            <IconButton onClick={() => setDetailsDialogOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Job Information
                </Typography>
                <Stack spacing={1}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Position:</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {selectedApplication.job.title}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Company:</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {selectedApplication.job.company}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Location:</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {selectedApplication.job.location}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Job Type:</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {selectedApplication.job.jobType}
                    </Typography>
                  </Box>
                  {selectedApplication.job.salary && (
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">Salary:</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {selectedApplication.job.salary}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Application Status
                </Typography>
                <Stack spacing={2}>
                  <Box display="flex" alignItems="center">
                    <Chip
                      icon={getStatusIcon(selectedApplication.status)}
                      label={selectedApplication.status ? selectedApplication.status.charAt(0).toUpperCase() + selectedApplication.status.slice(1) : 'Unknown'}
                      color={getStatusColor(selectedApplication.status)}
                    />
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Applied:</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {new Date(selectedApplication.appliedAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Last Updated:</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {new Date(selectedApplication.lastUpdated).toLocaleDateString()}
                    </Typography>
                  </Box>
                  {selectedApplication.priority && (
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">Priority:</Typography>
                      <Chip
                        label={selectedApplication.priority.charAt(0).toUpperCase() + selectedApplication.priority.slice(1)}
                        color={getPriorityColor(selectedApplication.priority)}
                        size="small"
                      />
                    </Box>
                  )}
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Source:</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {selectedApplication.source ? selectedApplication.source.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Direct Application'}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>

            {selectedApplication.interviewDate && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Interview Information
                  </Typography>
                  <Stack spacing={1}>
                    <Box display="flex" alignItems="center">
                      <CalendarToday sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {new Date(selectedApplication.interviewDate).toLocaleDateString()} at{' '}
                        {new Date(selectedApplication.interviewDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </Box>
                    {selectedApplication.interviewType && (
                      <Box display="flex" alignItems="center">
                        {selectedApplication.interviewType === 'video' && <VideoCall sx={{ mr: 1, color: 'text.secondary' }} />}
                        {selectedApplication.interviewType === 'phone' && <Phone sx={{ mr: 1, color: 'text.secondary' }} />}
                        {selectedApplication.interviewType === 'in-person' && <Person sx={{ mr: 1, color: 'text.secondary' }} />}
                        <Typography variant="body2">
                          {selectedApplication.interviewType.charAt(0).toUpperCase() + selectedApplication.interviewType.slice(1)} Interview
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </Paper>
              </Grid>
            )}

            {selectedApplication.salaryOffered && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom color="success.main">
                    Offer Details
                  </Typography>
                  <Typography variant="body2">
                    <strong>Salary Offered:</strong> {selectedApplication.salaryOffered}
                  </Typography>
                </Paper>
              </Grid>
            )}

            {selectedApplication.feedback && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Feedback
                  </Typography>
                  <Typography variant="body2">
                    {selectedApplication.feedback}
                  </Typography>
                </Paper>
              </Grid>
            )}

            {selectedApplication.notes && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    My Notes
                  </Typography>
                  <Typography variant="body2">
                    {selectedApplication.notes}
                  </Typography>
                </Paper>
              </Grid>
            )}

            {selectedApplication.nextSteps && (
              <Grid item xs={12}>
                <Alert severity="info">
                  <Typography variant="body2">
                    <strong>Next Steps:</strong> {selectedApplication.nextSteps}
                  </Typography>
                </Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDetailsDialogOpen(false)}>
            Close
          </Button>
          <Button 
            variant="outlined" 
            onClick={() => navigate(`/app/jobs/${selectedApplication.job._id}`)}
            startIcon={<ArrowForward />}
          >
            View Job
          </Button>
          {selectedApplication.status === 'offered' && (
            <Button 
              variant="contained" 
              color="success"
              startIcon={<CheckCircle />}
            >
              Accept Offer
            </Button>
          )}
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Container maxWidth="xl">
      <Box mb={4}>
        <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
          My Applications
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Track and manage your job applications
        </Typography>
      </Box>

      {/* Summary Stats */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h3" color="primary.main" fontWeight="bold">
              {applications.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Applications
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h3" color="warning.main" fontWeight="bold">
              {applications.filter(app => [
                ApplicationStatus.APPLIED, 
                ApplicationStatus.UNDER_REVIEW, 
                ApplicationStatus.SHORTLISTED,
                ApplicationStatus.INTERVIEW_SCHEDULED,
                ApplicationStatus.INTERVIEWED
              ].includes(app.status)).length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Active Applications
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h3" color="info.main" fontWeight="bold">
              {applications.filter(app => [
                ApplicationStatus.INTERVIEW_SCHEDULED,
                ApplicationStatus.INTERVIEWED
              ].includes(app.status)).length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Interviews Scheduled
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h3" color="success.main" fontWeight="bold">
              {applications.filter(app => app.status === ApplicationStatus.OFFERED).length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Offers Received
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search applications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value={ApplicationStatus.APPLIED}>Applied</MenuItem>
                <MenuItem value={ApplicationStatus.UNDER_REVIEW}>Under Review</MenuItem>
                <MenuItem value={ApplicationStatus.SHORTLISTED}>Shortlisted</MenuItem>
                <MenuItem value={ApplicationStatus.INTERVIEW_SCHEDULED}>Interview Scheduled</MenuItem>
                <MenuItem value={ApplicationStatus.INTERVIEWED}>Interviewed</MenuItem>
                <MenuItem value={ApplicationStatus.OFFERED}>Offered</MenuItem>
                <MenuItem value={ApplicationStatus.REJECTED}>Rejected</MenuItem>
                <MenuItem value={ApplicationStatus.WITHDRAWN}>Withdrawn</MenuItem>
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
                <MenuItem value="newest">Newest First</MenuItem>
                <MenuItem value="oldest">Oldest First</MenuItem>
                <MenuItem value="updated">Recently Updated</MenuItem>
                <MenuItem value="company">Company Name</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<Clear />}
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setSortBy('newest');
              }}
            >
              Clear
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ mb: 4 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            label={
              <Box display="flex" alignItems="center">
                <Assignment sx={{ mr: 1 }} />
                All Applications
                <Badge badgeContent={applications.length} color="primary" sx={{ ml: 1 }} />
              </Box>
            } 
          />
          <Tab 
            label={
              <Box display="flex" alignItems="center">
                <HourglassEmpty sx={{ mr: 1 }} />
                Active
                <Badge 
                  badgeContent={applications.filter(app => [
                    ApplicationStatus.APPLIED, 
                    ApplicationStatus.UNDER_REVIEW, 
                    ApplicationStatus.SHORTLISTED,
                    ApplicationStatus.INTERVIEW_SCHEDULED,
                    ApplicationStatus.INTERVIEWED
                  ].includes(app.status)).length} 
                  color="warning" 
                  sx={{ ml: 1 }} 
                />
              </Box>
            } 
          />
          <Tab 
            label={
              <Box display="flex" alignItems="center">
                <Person sx={{ mr: 1 }} />
                Interviews
                <Badge 
                  badgeContent={applications.filter(app => [
                    ApplicationStatus.INTERVIEW_SCHEDULED,
                    ApplicationStatus.INTERVIEWED
                  ].includes(app.status)).length} 
                  color="info" 
                  sx={{ ml: 1 }} 
                />
              </Box>
            } 
          />
          <Tab 
            label={
              <Box display="flex" alignItems="center">
                <CheckCircle sx={{ mr: 1 }} />
                Offers
                <Badge 
                  badgeContent={applications.filter(app => app.status === ApplicationStatus.OFFERED).length} 
                  color="success" 
                  sx={{ ml: 1 }} 
                />
              </Box>
            } 
          />
          <Tab 
            label={
              <Box display="flex" alignItems="center">
                <Cancel sx={{ mr: 1 }} />
                Closed
                <Badge 
                  badgeContent={applications.filter(app => [
                    ApplicationStatus.REJECTED, 
                    ApplicationStatus.WITHDRAWN
                  ].includes(app.status)).length} 
                  color="error" 
                  sx={{ ml: 1 }} 
                />
              </Box>
            } 
          />
        </Tabs>
      </Paper>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Applications List */}
      <Box>
        {loading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <Card key={index} sx={{ mb: 2 }}>
              <CardContent>
                <Grid container spacing={3} alignItems="center">
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center">
                      <Skeleton variant="circular" width={48} height={48} sx={{ mr: 2 }} />
                      <Box>
                        <Skeleton variant="text" width={200} height={24} />
                        <Skeleton variant="text" width={150} height={20} />
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Skeleton variant="text" height={40} />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))
        ) : paginatedApplications.length > 0 ? (
          paginatedApplications.map((application) => (
            <ApplicationCard key={application._id} application={application} />
          ))
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Assignment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No applications found
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              {tabValue === 0 
                ? "You haven't applied to any jobs yet. Start exploring opportunities!"
                : "No applications match your current filter criteria."
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
        )}
      </Box>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={4}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(event, value) => setPage(value)}
            color="primary"
            size="large"
          />
        </Box>
      )}

      <ApplicationDetailsDialog />
    </Container>
  );
};

export default ApplicationsPage;
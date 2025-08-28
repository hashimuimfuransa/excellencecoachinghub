import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  LinearProgress,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Alert,
  Skeleton
} from '@mui/material';
import FloatingContact from '../components/FloatingContact';
import {
  Add as AddIcon,
  Work as WorkIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Pause as PauseIcon,
  PlayArrow as PlayIcon,
  Delete as DeleteIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface DashboardStats {
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  pendingApplications: number;
  shortlistedApplications: number;
}

interface RecentJob {
  _id: string;
  title: string;
  company: string;
  status: string;
  applicationsCount: number;
  createdAt: string;
}

interface RecentApplication {
  _id: string;
  applicant: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
  job: {
    _id: string;
    title: string;
  };
  status: string;
  appliedAt: string;
}

interface DashboardData {
  statistics: DashboardStats;
  recentJobs: RecentJob[];
  recentApplications: RecentApplication[];
}

const EmployerDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedJob, setSelectedJob] = useState<RecentJob | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/employer/dashboard`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      setDashboardData(data.data);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleJobMenuClick = (event: React.MouseEvent<HTMLElement>, job: RecentJob) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedJob(job);
  };

  const handleJobMenuClose = () => {
    setAnchorEl(null);
    setSelectedJob(null);
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
      default:
        return 'default';
    }
  };

  const getApplicationStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'applied':
        return 'info';
      case 'shortlisted':
        return 'success';
      case 'interview_scheduled':
        return 'warning';
      case 'rejected':
        return 'error';
      case 'offered':
        return 'success';
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

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Employer Dashboard
        </Typography>
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="40%" height={40} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Employer Dashboard
        </Typography>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  if (!dashboardData) return null;

  const { statistics, recentJobs, recentApplications } = dashboardData;

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Welcome back, {user?.firstName}!
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/app/jobs/create')}
        >
          Post New Job
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="overline">
                    Total Jobs
                  </Typography>
                  <Typography variant="h4">
                    {statistics.totalJobs}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <WorkIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="overline">
                    Active Jobs
                  </Typography>
                  <Typography variant="h4">
                    {statistics.activeJobs}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <TrendingUpIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="overline">
                    Total Applications
                  </Typography>
                  <Typography variant="h4">
                    {statistics.totalApplications}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <PeopleIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="overline">
                    Pending Reviews
                  </Typography>
                  <Typography variant="h4">
                    {statistics.pendingApplications}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <ScheduleIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Recent Jobs */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Recent Jobs</Typography>
                <Button
                  size="small"
                  onClick={() => navigate('/app/employer/jobs')}
                >
                  View All
                </Button>
              </Box>
              
              {recentJobs.length === 0 ? (
                <Typography color="textSecondary" textAlign="center" py={4}>
                  No jobs posted yet. Create your first job posting!
                </Typography>
              ) : (
                <List>
                  {recentJobs.slice(0, 5).map((job, index) => (
                    <React.Fragment key={job._id}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <WorkIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={job.title}
                          secondary={
                            <Box>
                              <Typography variant="body2" color="textSecondary">
                                {job.company}
                              </Typography>
                              <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                                <Chip
                                  label={job.status}
                                  size="small"
                                  color={getStatusColor(job.status) as any}
                                />
                                <Typography variant="caption" color="textSecondary">
                                  {job.applicationsCount} applications
                                </Typography>
                              </Box>
                            </Box>
                          }
                        />
                        <IconButton
                          size="small"
                          onClick={(e) => handleJobMenuClick(e, job)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </ListItem>
                      {index < recentJobs.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Applications */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Recent Applications</Typography>
                <Button
                  size="small"
                  onClick={() => navigate('/app/employer/candidates')}
                >
                  View All
                </Button>
              </Box>
              
              {recentApplications.length === 0 ? (
                <Typography color="textSecondary" textAlign="center" py={4}>
                  No applications received yet.
                </Typography>
              ) : (
                <List>
                  {recentApplications.slice(0, 5).map((application, index) => (
                    <React.Fragment key={application._id}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar src={application.applicant.avatar}>
                            <PersonIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={`${application.applicant.firstName} ${application.applicant.lastName}`}
                          secondary={
                            <Box>
                              <Typography variant="body2" color="textSecondary">
                                Applied for: {application.job.title}
                              </Typography>
                              <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                                <Chip
                                  label={application.status}
                                  size="small"
                                  color={getApplicationStatusColor(application.status) as any}
                                />
                                <Typography variant="caption" color="textSecondary">
                                  {formatDate(application.appliedAt)}
                                </Typography>
                              </Box>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < recentApplications.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Job Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleJobMenuClose}
      >
        <MenuItem onClick={() => {
          navigate(`/app/employer/jobs/${selectedJob?._id}`);
          handleJobMenuClose();
        }}>
          <ViewIcon fontSize="small" sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={() => {
          navigate(`/app/employer/jobs/${selectedJob?._id}/edit`);
          handleJobMenuClose();
        }}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit Job
        </MenuItem>
        <MenuItem onClick={() => {
          // TODO: Implement toggle job status
          handleJobMenuClose();
        }}>
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
        <Divider />
        <MenuItem onClick={() => {
          // TODO: Implement delete job
          handleJobMenuClose();
        }} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete Job
        </MenuItem>
      </Menu>
      
      {/* Floating Contact Component */}
      <FloatingContact />
    </Box>
  );
};

export default EmployerDashboardPage;
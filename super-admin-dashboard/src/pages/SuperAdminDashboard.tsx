import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Avatar,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,

  Alert,
  LinearProgress,
  Tooltip,
  Badge,
  Switch,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction
} from '@mui/material';
import {
  People,
  Work,
  School,
  Psychology,
  RecordVoiceOver,
  CardMembership,
  Block,
  CheckCircle,
  Warning,
  Error,
  Visibility,
  Edit,
  Delete,
  Add,
  FilterList,
  Search,
  Download,
  Upload,
  Refresh,
  MoreVert,
  TrendingUp,
  TrendingDown,
  PersonAdd,
  WorkOutline,
  SchoolOutlined,
  NotificationImportant,
  Security,
  AdminPanelSettings,
  SupervisorAccount,
  ManageAccounts,
  Assessment,
  QuestionAnswer,
  BusinessCenter,
  Group,
  Assignment,
  Timeline,
  BarChart,
  PieChart,
  ShowChart,
  Info,
  Schedule
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import type { User } from '../types/user';
import { UserRole } from '../types/user';
import type { Job } from '../types/job';
import type { Course } from '../types/course';
import type { PsychometricTest } from '../types/test';
import type { JobApplication, AIInterview, JobCertificate } from '../types/common';

import { superAdminService, type DashboardStats, type SystemAlert, type RecentActivity } from '../services/superAdminService';

// Interfaces moved to service file

const SuperAdminDashboard: React.FC = () => {
  const { user, hasAnyRole } = useAuth();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalJobs: 0,
    totalApplications: 0,
    totalCourses: 0,
    totalTests: 0,
    totalInterviews: 0,
    totalCertificates: 0,
    activeUsers: 0,
    pendingApplications: 0,
    systemHealth: 'good',
    usersByRole: {},
    jobsByStatus: {},
    applicationsByStatus: {},
    monthlyGrowth: {
      users: 0,
      jobs: 0,
      applications: 0
    }
  });

  // Sample data - replace with actual API calls
  const [users, setUsers] = useState<User[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [tests, setTests] = useState<PsychometricTest[]>([]);
  const [interviews, setInterviews] = useState<AIInterview[]>([]);
  const [certificates, setCertificates] = useState<JobCertificate[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  // Dialog states
  const [userDialog, setUserDialog] = useState({ open: false, user: null as User | null, mode: 'view' as 'view' | 'edit' | 'create' });
  const [jobDialog, setJobDialog] = useState({ open: false, job: null as Job | null, mode: 'view' as 'view' | 'edit' });
  const [systemDialog, setSystemDialog] = useState({ open: false, type: 'backup' as 'backup' | 'maintenance' | 'settings' });

  useEffect(() => {
    loadDashboardData();
  }, []);



  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load all dashboard data including entity lists for tabs
      const [
        dashboardStats, 
        alerts, 
        activity, 
        usersResponse, 
        jobsResponse, 
        applicationsResponse,
        coursesResponse,
        testsResponse,
        certificatesResponse
      ] = await Promise.all([
        superAdminService.getDashboardStats(),
        superAdminService.getSystemAlerts(),
        superAdminService.getRecentActivity(10),
        superAdminService.getAllUsers({ page: 1, limit: 10, sortBy: 'createdAt', sortOrder: 'desc' }),
        superAdminService.getAllJobs({ page: 1, limit: 10, sortBy: 'createdAt', sortOrder: 'desc' }),
        superAdminService.getAllApplications({ page: 1, limit: 10, sortBy: 'createdAt', sortOrder: 'desc' }),
        superAdminService.getAllCourses({ page: 1, limit: 10, sortBy: 'createdAt', sortOrder: 'desc' }),
        superAdminService.getAllTests({ page: 1, limit: 10, sortBy: 'createdAt', sortOrder: 'desc' }),
        superAdminService.getAllCertificates({ page: 1, limit: 10, sortBy: 'createdAt', sortOrder: 'desc' })
      ]);

      // Update state with loaded data
      setStats(dashboardStats);
      setSystemAlerts(alerts || []);
      setRecentActivity(activity || []);
      
      // Helper function to extract data from various response structures
      const extractData = (response: any, dataKey: string) => {
        if (!response) return [];
        
        // Check if response has data directly
        if (response[dataKey] && Array.isArray(response[dataKey])) {
          return response[dataKey];
        }
        // Check if response has data.dataKey structure
        else if (response.data && response.data[dataKey] && Array.isArray(response.data[dataKey])) {
          return response.data[dataKey];
        }
        // Check if response is directly an array
        else if (Array.isArray(response)) {
          return response;
        }
        // Check if response has success and data structure
        else if (response.success && response.data) {
          if (Array.isArray(response.data)) {
            return response.data;
          } else if (response.data[dataKey]) {
            return response.data[dataKey];
          }
        }
        
        return [];
      };
      
      // Set entity data for tabs with robust data extraction
      setUsers(extractData(usersResponse, 'users'));
      setJobs(extractData(jobsResponse, 'jobs'));
      setApplications(extractData(applicationsResponse, 'applications'));
      setCourses(extractData(coursesResponse, 'courses'));
      setTests(extractData(testsResponse, 'tests'));
      setCertificates(extractData(certificatesResponse, 'certificates'));

    } catch (error) {
      console.error('Error in loadDashboardData:', error);
      // If everything fails, ensure we have minimal working state
      setStats({
        totalUsers: 0,
        totalJobs: 0,
        totalApplications: 0,
        totalCourses: 0,
        totalTests: 0,
        totalInterviews: 0,
        totalCertificates: 0,
        activeUsers: 0,
        pendingApplications: 0,
        systemHealth: 'warning',
        usersByRole: {},
        jobsByStatus: {},
        applicationsByStatus: {},
        monthlyGrowth: {
          users: 0,
          jobs: 0,
          applications: 0
        }
      });
      setSystemAlerts([]);
      setRecentActivity([]);
      setUsers([]);
      setJobs([]);
      setApplications([]);
      setCourses([]);
      setTests([]);
      setCertificates([]);
    } finally {
      setLoading(false);
    }
  };



  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'success';
      case 'good': return 'info';
      case 'warning': return 'warning';
      case 'critical': return 'error';
      default: return 'info';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'excellent': return <CheckCircle color="success" />;
      case 'good': return <CheckCircle color="info" />;
      case 'warning': return <Warning color="warning" />;
      case 'critical': return <Error color="error" />;
      default: return <CheckCircle color="info" />;
    }
  };

  const StatCard = ({ title, value, icon, color, trend }: any) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom variant="overline">
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {(value ?? 0).toLocaleString()}
            </Typography>
            {trend && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                {trend > 0 ? (
                  <TrendingUp color="success" fontSize="small" />
                ) : (
                  <TrendingDown color="error" fontSize="small" />
                )}
                <Typography
                  variant="body2"
                  color={trend > 0 ? 'success.main' : 'error.main'}
                  sx={{ ml: 0.5 }}
                >
                  {Math.abs(trend)}%
                </Typography>
              </Box>
            )}
          </Box>
          <Avatar sx={{ bgcolor: `${color}.main`, width: 56, height: 56 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2, textAlign: 'center' }}>
          Loading Super Admin Dashboard...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ 
        mb: 4, 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: 2,
        p: 3,
        color: 'white'
      }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          <AdminPanelSettings sx={{ mr: 2, verticalAlign: 'middle', fontSize: 'inherit' }} />
          Super Admin Dashboard
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 300 }}>
          Complete system control and monitoring • Real-time insights and management
        </Typography>
        <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Chip 
            label={`${stats.totalUsers?.toLocaleString() || 0} Users`} 
            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 'bold' }}
          />
          <Chip 
            label={`${stats.totalJobs?.toLocaleString() || 0} Jobs`} 
            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 'bold' }}
          />
          <Chip 
            label={`${stats.totalApplications?.toLocaleString() || 0} Applications`} 
            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 'bold' }}
          />
          <Chip 
            label={`System: ${stats.systemHealth?.toUpperCase()}`} 
            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 'bold' }}
          />
        </Box>

      </Box>

      {/* System Health Alert */}
      <Alert 
        severity={getHealthColor(stats.systemHealth) as any}
        icon={getHealthIcon(stats.systemHealth)}
        sx={{ mb: 3 }}
        action={
          <Button color="inherit" size="small" onClick={() => setSystemDialog({ open: true, type: 'settings' })}>
            MANAGE
          </Button>
        }
      >
        <Typography variant="subtitle1">
          System Health: {stats.systemHealth?.toUpperCase() || 'UNKNOWN'}
        </Typography>
        <Typography variant="body2">
          All systems operational. {Array.isArray(systemAlerts) ? systemAlerts.filter(a => !a.isRead).length : 0} unread alerts.
        </Typography>
      </Alert>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={<People />}
            color="primary"
            trend={stats.monthlyGrowth?.users && stats.monthlyGrowth.users > 0 ? Math.round((stats.monthlyGrowth.users / stats.totalUsers) * 100) : 0}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Jobs"
            value={stats.totalJobs}
            icon={<Work />}
            color="success"
            trend={stats.monthlyGrowth?.jobs && stats.monthlyGrowth.jobs > 0 ? Math.round((stats.monthlyGrowth.jobs / stats.totalJobs) * 100) : 0}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Applications"
            value={stats.totalApplications}
            icon={<Assignment />}
            color="info"
            trend={stats.monthlyGrowth?.applications && stats.monthlyGrowth.applications > 0 ? Math.round((stats.monthlyGrowth.applications / stats.totalApplications) * 100) : 0}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Certificates"
            value={stats.totalCertificates}
            icon={<CardMembership />}
            color="warning"
            trend={15}
          />
        </Grid>
      </Grid>

      {/* Additional Stats Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="inherit" gutterBottom variant="overline" sx={{ opacity: 0.8 }}>
                    Active Users
                  </Typography>
                  <Typography variant="h4" component="div">
                    {(stats.activeUsers ?? 0).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                    {stats.activeUsers && stats.totalUsers ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}% of total
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <CheckCircle />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="inherit" gutterBottom variant="overline" sx={{ opacity: 0.8 }}>
                    Pending Applications
                  </Typography>
                  <Typography variant="h4" component="div">
                    {(stats.pendingApplications ?? 0).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                    Require attention
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <Schedule />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="inherit" gutterBottom variant="overline" sx={{ opacity: 0.8 }}>
                    Total Courses
                  </Typography>
                  <Typography variant="h4" component="div">
                    {(stats.totalCourses ?? 0).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                    Learning content
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <School />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="inherit" gutterBottom variant="overline" sx={{ opacity: 0.8 }}>
                    AI Interviews
                  </Typography>
                  <Typography variant="h4" component="div">
                    {(stats.totalInterviews ?? 0).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                    Conducted
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <RecordVoiceOver />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <List>
                    {Array.isArray(recentActivity) && recentActivity.map((activity, index) => {
                      const getActivityIcon = (type: string) => {
                        switch (type) {
                          case 'user_registered':
                            return <PersonAdd />;
                          case 'job_posted':
                            return <Work />;
                          case 'certificate_issued':
                            return <CardMembership />;
                          case 'application_submitted':
                            return <Assignment />;
                          case 'course_created':
                            return <School />;
                          case 'test_completed':
                            return <Psychology />;
                          default:
                            return <Info />;
                        }
                      };

                      const getActivityColor = (type: string) => {
                        switch (type) {
                          case 'user_registered':
                            return 'success.main';
                          case 'job_posted':
                            return 'info.main';
                          case 'certificate_issued':
                            return 'warning.main';
                          case 'application_submitted':
                            return 'primary.main';
                          case 'course_created':
                            return 'secondary.main';
                          case 'test_completed':
                            return 'error.main';
                          default:
                            return 'grey.500';
                        }
                      };

                      const getTimeAgo = (timestamp: string) => {
                        const now = new Date();
                        const activityTime = new Date(timestamp);
                        const diffInMinutes = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60));
                        
                        if (diffInMinutes < 1) return 'Just now';
                        if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
                        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
                        return `${Math.floor(diffInMinutes / 1440)} days ago`;
                      };

                      return (
                        <ListItem key={activity.id || `activity-${index}`}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: getActivityColor(activity.type) }}>
                              {getActivityIcon(activity.type)}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={activity.title}
                            secondary={`${activity.description} - ${getTimeAgo(activity.timestamp)}`}
                          />
                        </ListItem>
                      );
                    })}
                    {(!Array.isArray(recentActivity) || recentActivity.length === 0) && (
                      <ListItem>
                        <ListItemText
                          primary="No recent activity"
                          secondary="Activity will appear here as users interact with the system"
                        />
                      </ListItem>
                    )}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    System Alerts
                  </Typography>
                  <List>
                    {Array.isArray(systemAlerts) && systemAlerts.map((alert, index) => {
                      const getAlertIcon = (type: string) => {
                        switch (type) {
                          case 'error':
                            return <Error />;
                          case 'warning':
                            return <Warning />;
                          case 'info':
                            return <Info />;
                          case 'success':
                            return <CheckCircle />;
                          default:
                            return <Info />;
                        }
                      };

                      const getAlertColor = (type: string) => {
                        switch (type) {
                          case 'error':
                            return 'error.main';
                          case 'warning':
                            return 'warning.main';
                          case 'info':
                            return 'info.main';
                          case 'success':
                            return 'success.main';
                          default:
                            return 'grey.500';
                        }
                      };

                      return (
                        <ListItem key={alert.id} divider={index < systemAlerts.length - 1}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: getAlertColor(alert.type) }}>
                              {getAlertIcon(alert.type)}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={alert.title}
                            secondary={
                              <Box>
                                <Typography variant="body2" color="textSecondary">
                                  {alert.message}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {new Date(alert.timestamp).toLocaleString()}
                                </Typography>
                              </Box>
                            }
                          />
                          <ListItemSecondaryAction>
                            <Chip 
                              label={alert.priority} 
                              size="small" 
                              color={alert.priority === 'critical' ? 'error' : alert.priority === 'high' ? 'warning' : 'default'}
                            />
                          </ListItemSecondaryAction>
                        </ListItem>
                      );
                    })}
                    {(!Array.isArray(systemAlerts) || systemAlerts.length === 0) && (
                      <ListItem>
                        <ListItemText
                          primary="No system alerts"
                          secondary="System is running smoothly"
                        />
                      </ListItem>
                    )}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

      {/* User Dialog */}
      <Dialog
        open={userDialog.open}
        onClose={() => setUserDialog({ open: false, user: null, mode: 'view' })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {userDialog.mode === 'create' ? 'Create User' : 
           userDialog.mode === 'edit' ? 'Edit User' : 'User Details'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                variant="outlined"
                disabled={userDialog.mode === 'view'}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                variant="outlined"
                disabled={userDialog.mode === 'view'}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                variant="outlined"
                disabled={userDialog.mode === 'view'}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  label="Role"
                  disabled={userDialog.mode === 'view'}
                >
                  <MenuItem value="job_seeker">Job Seeker</MenuItem>
                  <MenuItem value="employer">Employer</MenuItem>
                  <MenuItem value="teacher">Teacher</MenuItem>
                  <MenuItem value="student">Student</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  label="Status"
                  disabled={userDialog.mode === 'view'}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="suspended">Suspended</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDialog({ open: false, user: null, mode: 'view' })}>
            Cancel
          </Button>
          {userDialog.mode !== 'view' && (
            <Button variant="contained">
              {userDialog.mode === 'create' ? 'Create' : 'Save'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* System Dialog */}
      <Dialog
        open={systemDialog.open}
        onClose={() => setSystemDialog({ open: false, type: 'backup' })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {systemDialog.type === 'backup' ? 'System Backup' :
           systemDialog.type === 'maintenance' ? 'Maintenance Mode' : 'System Settings'}
        </DialogTitle>
        <DialogContent>
          {systemDialog.type === 'backup' && (
            <Box>
              <Typography paragraph>
                Create a complete backup of the system including:
              </Typography>
              <List>
                <ListItem>• User data and profiles</ListItem>
                <ListItem>• Job postings and applications</ListItem>
                <ListItem>• Course content and enrollments</ListItem>
                <ListItem>• Test results and certificates</ListItem>
                <ListItem>• System configurations</ListItem>
              </List>
            </Box>
          )}
          {systemDialog.type === 'maintenance' && (
            <Box>
              <Alert severity="warning" sx={{ mb: 2 }}>
                Maintenance mode will make the system unavailable to users.
              </Alert>
              <Typography paragraph>
                Enable maintenance mode to perform system updates safely.
              </Typography>
              <FormControlLabel
                control={<Switch />}
                label="Enable maintenance mode"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSystemDialog({ open: false, type: 'backup' })}>
            Cancel
          </Button>
          <Button variant="contained" color="primary">
            {systemDialog.type === 'backup' ? 'Create Backup' :
             systemDialog.type === 'maintenance' ? 'Apply' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SuperAdminDashboard;
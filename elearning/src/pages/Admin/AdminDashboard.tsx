import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';

// Import all admin page components
import UserManagement from './UserManagement';
import TeacherManagement from './TeacherManagement';
import StudentManagement from './StudentManagement';
import CourseManagement from './CourseManagement';
import AnalyticsReports from './AnalyticsReports';
import ProctoringMonitoring from './ProctoringMonitoring';
import AISettings from './AISettings';
import AdminSettings from './AdminSettings';
import SupportFeedback from './SupportFeedback';
import AdminProfile from './AdminProfile';
import RecordingsManagement from './RecordingsManagement';
import AdminLeaderboard from './AdminLeaderboard';
import AdminCourseDetailsView from '../../components/Admin/AdminCourseDetailsView';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  LinearProgress,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
  styled,
  Paper,
  Stack
} from '@mui/material';
import {
  People,
  School,
  Assignment,
  TrendingUp,
  Warning,
  CheckCircle,
  Schedule,
  BarChart,
  Security
} from '@mui/icons-material';
import { useAuth } from '../../store/AuthContext';
import { useNavigate } from 'react-router-dom';
import ResponsiveDashboard from '../../components/Layout/ResponsiveDashboard';
import { useResponsive, getCardDimensions, getButtonSize } from '../../utils/responsive';
import {
  analyticsService,
  DashboardAnalytics,
  SystemAlert,
  PendingApproval
} from '../../services/analyticsService';
import { IUser } from '../../shared/types';

// Responsive styled components
const ResponsiveCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[8],
  },
  [theme.breakpoints.down('sm')]: {
    '&:hover': {
      transform: 'none',
      boxShadow: theme.shadows[2],
    },
  },
}));

const ResponsiveCardContent = styled(CardContent)(({ theme }) => ({
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'column',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1.5),
    '&:last-child': {
      paddingBottom: theme.spacing(1.5),
    },
  },
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(2),
    '&:last-child': {
      paddingBottom: theme.spacing(2),
    },
  },
}));

const StatsCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  textAlign: 'center',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  background: `linear-gradient(135deg, ${theme.palette.primary.main}15, ${theme.palette.secondary.main}15)`,
  border: `1px solid ${theme.palette.divider}`,
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1.5),
    '&:hover': {
      transform: 'none',
    },
  },
}));

const ResponsiveButton = styled(Button)(({ theme }) => ({
  [theme.breakpoints.down('sm')]: {
    fontSize: '0.75rem',
    padding: theme.spacing(0.5, 1),
    minWidth: 'auto',
  },
  [theme.breakpoints.up('sm')]: {
    fontSize: '0.875rem',
    padding: theme.spacing(1, 2),
  },
}));

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const cardDimensions = getCardDimensions();
  const buttonSize = getButtonSize(isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop');

  // State for dashboard data
  const [dashboardData, setDashboardData] = useState<DashboardAnalytics | null>(null);
  const [recentUsers, setRecentUsers] = useState<IUser[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [analytics, users, alerts, approvals] = await Promise.all([
          analyticsService.getDashboardAnalytics(),
          analyticsService.getRecentUsers(5),
          analyticsService.getSystemAlerts(),
          analyticsService.getPendingApprovals()
        ]);

        setDashboardData(analytics);
        setRecentUsers(users);
        setSystemAlerts(alerts);
        setPendingApprovals(approvals);

      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const DashboardOverview = () => {
    if (loading) {
      return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        </Container>
      );
    }

    if (error) {
      return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        </Container>
      );
    }

    if (!dashboardData) {
      return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="warning" sx={{ mb: 4 }}>
            No dashboard data available
          </Alert>
        </Container>
      );
    }

    return (
      <ResponsiveDashboard>
        {/* Header */}
        <Box sx={{ 
          mb: { xs: 2, sm: 2, md: 3 },
          textAlign: { xs: 'center', sm: 'left' }
        }}>
          <Typography 
            variant={isMobile ? "h5" : "h4"} 
            component="h1" 
            sx={{ 
              fontWeight: 700,
              mb: 1,
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
            }}
          >
            Admin Dashboard
          </Typography>
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
          >
            Welcome back, {user?.firstName}! Here's what's happening on your platform.
          </Typography>
        </Box>

      {/* Stats Cards */}
      <Grid container spacing={{ xs: 2, sm: 2, md: 3 }} sx={{ mb: { xs: 2, sm: 3 } }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <People color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{dashboardData.stats.totalUsers}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Users
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <School color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{dashboardData.stats.totalCourses}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Courses
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Assignment color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{dashboardData.stats.totalQuizzes}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Assessments
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TrendingUp color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{dashboardData.stats.systemHealth}%</Typography>
                  <Typography variant="body2" color="text.secondary">
                    System Health
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Users */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Recent Users</Typography>
                <Button size="small" onClick={() => navigate('/dashboard/admin/users')}>
                  View All
                </Button>
              </Box>
              {recentUsers.length === 0 ? (
                <Box
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                  py={4}
                  sx={{ color: 'text.secondary' }}
                >
                  <People sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                  <Typography variant="h6" gutterBottom>
                    No Recent Users
                  </Typography>
                  <Typography variant="body2" textAlign="center">
                    No new users have joined recently.
                  </Typography>
                </Box>
              ) : (
                <List>
                  {recentUsers.map((user, index) => (
                    <React.Fragment key={user._id}>
                      <ListItem disablePadding>
                        <ListItemAvatar>
                          <Avatar src={user.avatar}>
                            {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={`${user.firstName} ${user.lastName}`}
                          secondary={`${user.email} • ${user.role}`}
                        />
                        <Chip
                          label={user.isEmailVerified ? 'verified' : 'pending'}
                          size="small"
                          color={user.isEmailVerified ? 'success' : 'warning'}
                        />
                      </ListItem>
                      {index < recentUsers.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* System Alerts */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Alerts
              </Typography>
              {systemAlerts.length === 0 ? (
                <Box
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                  py={4}
                  sx={{ color: 'text.secondary' }}
                >
                  <CheckCircle sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                  <Typography variant="h6" gutterBottom>
                    All Systems Normal
                  </Typography>
                  <Typography variant="body2" textAlign="center">
                    No system alerts at this time.
                  </Typography>
                </Box>
              ) : (
                <List>
                  {systemAlerts.map((alert, index) => (
                    <React.Fragment key={alert.id}>
                      <ListItem disablePadding>
                        <ListItemAvatar>
                          <Avatar sx={{
                            bgcolor: alert.type === 'warning' ? 'warning.main' :
                                     alert.type === 'success' ? 'success.main' : 'info.main'
                          }}>
                            {alert.type === 'warning' ? <Warning /> :
                             alert.type === 'success' ? <CheckCircle /> : <Schedule />}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={alert.message}
                          secondary={new Date(alert.timestamp).toLocaleString()}
                        />
                      </ListItem>
                      {index < systemAlerts.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Pending Approvals */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Pending Approvals</Typography>
                <Chip label={dashboardData.stats.pendingApprovals} color="warning" />
              </Box>
              {pendingApprovals.length === 0 ? (
                <Box
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                  py={4}
                  sx={{ color: 'text.secondary' }}
                >
                  <Assignment sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                  <Typography variant="h6" gutterBottom>
                    No Pending Approvals
                  </Typography>
                  <Typography variant="body2" textAlign="center">
                    All applications and submissions have been processed.
                  </Typography>
                </Box>
              ) : (
                <List>
                  {pendingApprovals.map((item, index) => (
                    <React.Fragment key={item.id}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            {item.type === 'teacher' ? <People /> : <School />}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={item.name}
                          secondary={
                            item.type === 'teacher'
                              ? `Teacher Application • ${item.subject || 'Subject not specified'}`
                              : `Course Submission • ${item.instructor || 'Instructor not specified'}`
                          }
                        />
                        <Box>
                          <Button
                            variant="contained"
                            size="small"
                            sx={{ mr: 1 }}
                            onClick={() => navigate(
                              item.type === 'teacher'
                                ? '/dashboard/admin/teachers'
                                : '/dashboard/admin/courses'
                            )}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => navigate(
                              item.type === 'teacher'
                                ? '/dashboard/admin/teachers'
                                : '/dashboard/admin/courses'
                            )}
                          >
                            Review
                          </Button>
                        </Box>
                      </ListItem>
                      {index < pendingApprovals.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<People />}
                    onClick={() => navigate('/dashboard/admin/users')}
                  >
                    Manage Users
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<School />}
                    onClick={() => navigate('/dashboard/admin/courses')}
                  >
                    Manage Courses
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<BarChart />}
                    onClick={() => navigate('/dashboard/admin/analytics')}
                  >
                    View Analytics
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Assignment />}
                    onClick={() => navigate('/dashboard/admin/settings')}
                  >
                    System Settings
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<Security />}
                    onClick={() => navigate('/dashboard/admin/proctoring')}
                    color="error"
                  >
                    Monitor Exams
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </ResponsiveDashboard>
    );
  };

  return (
    <Routes>
      <Route path="/" element={<DashboardOverview />} />
      <Route path="/users" element={<UserManagement />} />
      <Route path="/teachers" element={<TeacherManagement />} />
      <Route path="/students" element={<StudentManagement />} />
      <Route path="/courses" element={<CourseManagement />} />
      <Route path="/courses/:courseId/details" element={<AdminCourseDetailsView />} />
      <Route path="/analytics" element={<AnalyticsReports />} />
      <Route path="/leaderboard" element={<AdminLeaderboard />} />
      <Route path="/proctoring" element={<ProctoringMonitoring />} />
      <Route path="/ai-settings" element={<AISettings />} />
      <Route path="/recordings" element={<RecordingsManagement />} />
      <Route path="/settings" element={<AdminSettings />} />
      <Route path="/support" element={<SupportFeedback />} />
      <Route path="/profile" element={<AdminProfile />} />
    </Routes>
  );
};

export default AdminDashboard;

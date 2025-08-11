import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import TeacherLiveSessions from './LiveSessions';
import TeacherLiveSessionRoom from './LiveSessionRoom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Button,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
  useTheme,
  useMediaQuery,
  styled,
  Paper,
  Stack
} from '@mui/material';
import {
  School,
  Quiz,
  VideoCall,
  TrendingUp,
  Assignment,
  EmojiEvents,
  PlayArrow,
  History,
  ManageAccounts,
  Add,
  Refresh
} from '@mui/icons-material';
import { useAuth } from '../../store/AuthContext';
import { courseService, ICourse } from '../../services/courseService';
import { liveSessionService, ILiveSession } from '../../services/liveSessionService';
import { teacherProfileService } from '../../services/teacherProfileService';
import { CourseStatus } from '../../shared/types';
import ResponsiveDashboard from '../../components/Layout/ResponsiveDashboard';
import { useResponsive, getCardDimensions, getButtonSize } from '../../utils/responsive';
import { getCourseImageUrl } from '../../utils/courseImageGenerator';

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

// Interface for teacher dashboard data
interface TeacherDashboardData {
  courses: ICourse[];
  upcomingSessions: ILiveSession[];
  completedSessions: ILiveSession[];
  stats: {
    totalStudents: number;
    activeCourses: number;
    totalSessions: number;
    completedSessions: number;
    averageRating: number;
  };
}

const TeacherDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const cardDimensions = getCardDimensions();
  const buttonSize = getButtonSize(isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop');

  // State for dashboard data
  const [dashboardData, setDashboardData] = useState<TeacherDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    if (!user || user.role !== 'teacher') return;

    try {
      setLoading(true);
      setError(null);

      // Fetch teacher's courses
      const coursesResponse = await courseService.getTeacherCourses({
        instructor: user._id,
        limit: 10
      });

      // Fetch upcoming live sessions
      const upcomingSessionsResponse = await liveSessionService.getTeacherSessions({
        status: 'scheduled',
        limit: 5
      });

      // Fetch completed sessions for stats
      const completedSessionsResponse = await liveSessionService.getTeacherSessions({
        status: 'ended',
        limit: 5
      });

      // Calculate stats
      const totalStudents = coursesResponse.courses.reduce((sum, course) => sum + (course.enrollmentCount || 0), 0);
      const activeCourses = coursesResponse.courses.filter(course => course.status === CourseStatus.APPROVED).length;
      const totalSessions = upcomingSessionsResponse.pagination?.totalSessions || 0;
      const completedSessions = completedSessionsResponse.pagination?.totalSessions || 0;

      setDashboardData({
        courses: coursesResponse.courses,
        upcomingSessions: upcomingSessionsResponse.sessions,
        completedSessions: completedSessionsResponse.sessions,
        stats: {
          totalStudents,
          activeCourses,
          totalSessions: totalSessions + completedSessions,
          completedSessions,
          averageRating: 4.8 // This would come from course ratings in a real implementation
        }
      });
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, [user]);

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
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button variant="contained" onClick={fetchDashboardData} startIcon={<Refresh />}>
            Retry
          </Button>
        </Container>
      );
    }

    if (!dashboardData) {
      return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="info">No data available</Alert>
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
          Teacher Dashboard
        </Typography>
        <Typography 
          variant="body1" 
          color="text.secondary"
          sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
        >
          Welcome back, {user?.firstName}! Here's an overview of your teaching activities.
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={{ xs: 2, sm: 2, md: 3 }} sx={{ mb: { xs: 2, sm: 3 } }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <School color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{dashboardData.stats.totalStudents}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Students
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
                <Quiz color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{dashboardData.stats.activeCourses}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Courses
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
                <VideoCall color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{dashboardData.stats.totalSessions}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Live Sessions
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
                <EmojiEvents color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{dashboardData.stats.averageRating}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Average Rating
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* My Courses */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">My Courses</Typography>
                <Box>
                  <Button
                    size="small"
                    startIcon={<ManageAccounts />}
                    onClick={() => navigate('/dashboard/teacher/courses')}
                    sx={{ mr: 1 }}
                  >
                    Manage Courses
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => navigate('/dashboard/teacher/courses/create')}
                  >
                    Create Course
                  </Button>
                </Box>
              </Box>
              {dashboardData.courses.length === 0 ? (
                <Box
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                  py={4}
                  sx={{ color: 'text.secondary' }}
                >
                  <School sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                  <Typography variant="h6" gutterBottom>
                    No Courses Yet
                  </Typography>
                  <Typography variant="body2" textAlign="center" mb={2}>
                    Create your first course to start teaching students.
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => navigate('/dashboard/teacher/courses/create')}
                  >
                    Create Your First Course
                  </Button>
                </Box>
              ) : (
                dashboardData.courses.slice(0, 3).map((course, index) => (
                  <Box key={course._id} mb={2}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="subtitle1">{course.title}</Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip
                          label={`${course.enrollmentCount || 0} students`}
                          size="small"
                          color="primary"
                        />
                        <Chip
                          label={course.status}
                          size="small"
                          color={
                            course.status === CourseStatus.APPROVED ? 'success' :
                            course.status === CourseStatus.PENDING_APPROVAL ? 'warning' :
                            'default'
                          }
                        />
                      </Box>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.random() * 100} // Mock completion rate - would come from analytics
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {course.category} • {course.level} • Created: {new Date(course.createdAt).toLocaleDateString()}
                    </Typography>
                    {index < Math.min(dashboardData.courses.length - 1, 2) && <Divider sx={{ mt: 2 }} />}
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Live Sessions */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Upcoming Sessions</Typography>
                <Box>
                  <Button
                    size="small"
                    startIcon={<History />}
                    onClick={() => navigate('/dashboard/teacher/live-sessions?tab=completed')}
                    sx={{ mr: 1 }}
                  >
                    View History
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => navigate('/dashboard/teacher/live-sessions/create')}
                  >
                    Schedule
                  </Button>
                </Box>
              </Box>
              {dashboardData.upcomingSessions.length === 0 ? (
                <Box
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                  py={4}
                  sx={{ color: 'text.secondary' }}
                >
                  <VideoCall sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                  <Typography variant="h6" gutterBottom>
                    No Upcoming Sessions
                  </Typography>
                  <Typography variant="body2" textAlign="center" mb={2}>
                    Schedule a live session to engage with your students.
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => navigate('/dashboard/teacher/live-sessions/create')}
                  >
                    Schedule Session
                  </Button>
                </Box>
              ) : (
                <List>
                  {dashboardData.upcomingSessions.map((session, index) => (
                    <React.Fragment key={session._id}>
                      <ListItem disablePadding>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <VideoCall />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={session.title}
                          secondary={`${new Date(session.scheduledTime).toLocaleString()} • ${session.participants?.length || 0} registered`}
                        />
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/dashboard/teacher/live-sessions/${session._id}`)}
                          title="View Session"
                        >
                          <PlayArrow />
                        </IconButton>
                      </ListItem>
                      {index < dashboardData.upcomingSessions.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Session Statistics */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Session Statistics
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="primary">
                      {dashboardData.stats.totalSessions}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Sessions
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="success.main">
                      {dashboardData.stats.completedSessions}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Completed Sessions
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="info.main">
                      {dashboardData.upcomingSessions.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Upcoming Sessions
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="warning.main">
                      {dashboardData.completedSessions.filter(s => s.isRecorded).length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Recorded Sessions
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
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
                    startIcon={<School />}
                    onClick={() => navigate('/dashboard/teacher/courses/create')}
                  >
                    Create Course
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<ManageAccounts />}
                    onClick={() => navigate('/dashboard/teacher/courses')}
                  >
                    Manage Courses
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<VideoCall />}
                    onClick={() => navigate('/dashboard/teacher/live-sessions/create')}
                  >
                    Schedule Session
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<VideoCall />}
                    onClick={() => navigate('/dashboard/teacher/live-sessions')}
                    color="primary"
                  >
                    Start Live Class
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<History />}
                    onClick={() => navigate('/dashboard/teacher/live-sessions')}
                  >
                    View Sessions
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
      <Route path="/live-sessions/*" element={<TeacherLiveSessions />} />
      <Route path="/live-session/:sessionId" element={<TeacherLiveSessionRoom />} />
    </Routes>
  );
};

export default TeacherDashboard;

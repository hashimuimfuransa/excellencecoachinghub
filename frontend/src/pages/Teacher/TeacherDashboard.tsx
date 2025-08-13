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
  padding: theme.spacing(3),
  textAlign: 'center',
  height: '100%',
  minHeight: '140px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  background: `linear-gradient(135deg, ${theme.palette.primary.main}08, ${theme.palette.secondary.main}08)`,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.spacing(2),
  transition: 'all 0.3s ease-in-out',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
    background: `linear-gradient(135deg, ${theme.palette.primary.main}12, ${theme.palette.secondary.main}12)`,
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
    minHeight: '120px',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: theme.shadows[4],
    },
  },
  [theme.breakpoints.up('lg')]: {
    padding: theme.spacing(3.5),
    minHeight: '160px',
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
      <Grid container spacing={{ xs: 2, sm: 3, md: 4 }} sx={{ mb: { xs: 3, sm: 4, md: 5 } }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard elevation={2}>
            <School 
              color="primary" 
              sx={{ 
                fontSize: { xs: '2.5rem', sm: '3rem', md: '3.5rem' },
                mb: { xs: 1, sm: 1.5 }
              }} 
            />
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 700,
                color: 'primary.main',
                mb: 0.5,
                fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.5rem' }
              }}
            >
              {dashboardData.stats.totalStudents}
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{ 
                fontWeight: 500,
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }}
            >
              Total Students
            </Typography>
          </StatsCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard elevation={2}>
            <Quiz 
              color="success" 
              sx={{ 
                fontSize: { xs: '2.5rem', sm: '3rem', md: '3.5rem' },
                mb: { xs: 1, sm: 1.5 }
              }} 
            />
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 700,
                color: 'success.main',
                mb: 0.5,
                fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.5rem' }
              }}
            >
              {dashboardData.stats.activeCourses}
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{ 
                fontWeight: 500,
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }}
            >
              Active Courses
            </Typography>
          </StatsCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard elevation={2}>
            <VideoCall 
              color="info" 
              sx={{ 
                fontSize: { xs: '2.5rem', sm: '3rem', md: '3.5rem' },
                mb: { xs: 1, sm: 1.5 }
              }} 
            />
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 700,
                color: 'info.main',
                mb: 0.5,
                fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.5rem' }
              }}
            >
              {dashboardData.stats.totalSessions}
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{ 
                fontWeight: 500,
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }}
            >
              Live Sessions
            </Typography>
          </StatsCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard elevation={2}>
            <EmojiEvents 
              color="warning" 
              sx={{ 
                fontSize: { xs: '2.5rem', sm: '3rem', md: '3.5rem' },
                mb: { xs: 1, sm: 1.5 }
              }} 
            />
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 700,
                color: 'warning.main',
                mb: 0.5,
                fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.5rem' }
              }}
            >
              {dashboardData.stats.averageRating}
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{ 
                fontWeight: 500,
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }}
            >
              Average Rating
            </Typography>
          </StatsCard>
        </Grid>
      </Grid>

      <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
        {/* My Courses */}
        <Grid item xs={12} md={8}>
          <ResponsiveCard elevation={3}>
            <ResponsiveCardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
              <Stack 
                direction={{ xs: 'column', sm: 'row' }} 
                justifyContent="space-between" 
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                spacing={{ xs: 2, sm: 1 }}
                sx={{ mb: { xs: 2, sm: 3 } }}
              >
                <Typography 
                  variant={isMobile ? "h6" : "h5"} 
                  sx={{ 
                    fontWeight: 600,
                    color: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <School sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
                  My Courses
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                  <Button
                    size="medium"
                    variant="outlined"
                    startIcon={<ManageAccounts />}
                    onClick={() => navigate('/dashboard/teacher/course-management')}
                    sx={{ 
                      minWidth: { xs: '160px', sm: '140px', md: '160px' },
                      height: { xs: '48px', sm: '44px', md: '48px' },
                      fontSize: { xs: '0.9rem', sm: '0.875rem', md: '0.95rem' },
                      fontWeight: 600,
                      borderColor: 'primary.main',
                      color: 'primary.main',
                      borderWidth: 2,
                      px: { xs: 2, sm: 1.5, md: 2 },
                      '&:hover': {
                        borderColor: 'primary.dark',
                        backgroundColor: 'primary.main',
                        color: 'white',
                        borderWidth: 2,
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 8px rgba(33, 150, 243, 0.3)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Course Management
                  </Button>
                  <Button
                    size="medium"
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => navigate('/dashboard/teacher/courses/create')}
                    sx={{
                      minWidth: { xs: '160px', sm: '140px', md: '160px' },
                      height: { xs: '48px', sm: '44px', md: '48px' },
                      fontSize: { xs: '0.9rem', sm: '0.875rem', md: '0.95rem' },
                      fontWeight: 600,
                      px: { xs: 2, sm: 1.5, md: 2 },
                      background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                      boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #2196F3 60%, #21CBF3 100%)',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 8px 2px rgba(33, 203, 243, .4)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Create Course
                  </Button>
                </Stack>
              </Stack>
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
                    <Box 
                      sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        justifyContent: 'space-between',
                        alignItems: { xs: 'flex-start', sm: 'center' },
                        gap: { xs: 2, sm: 1 },
                        mb: 1
                      }}
                    >
                      <Typography 
                        variant="subtitle1" 
                        sx={{ 
                          fontWeight: 600,
                          flex: 1,
                          minWidth: 0
                        }}
                      >
                        {course.title}
                      </Typography>
                      <Box 
                        sx={{
                          display: 'flex',
                          flexDirection: { xs: 'column', sm: 'row' },
                          alignItems: { xs: 'stretch', sm: 'center' },
                          gap: { xs: 1, sm: 1 },
                          width: { xs: '100%', sm: 'auto' }
                        }}
                      >
                        <Box 
                          sx={{
                            display: 'flex',
                            gap: 1,
                            justifyContent: { xs: 'space-between', sm: 'flex-end' },
                            alignItems: 'center'
                          }}
                        >
                          <Chip
                            label={`${course.enrollmentCount || 0} students`}
                            size="small"
                            color="primary"
                            sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' } }}
                          />
                          <Chip
                            label={course.status}
                            size="small"
                            color={
                              course.status === CourseStatus.APPROVED ? 'success' :
                              course.status === CourseStatus.PENDING_APPROVAL ? 'warning' :
                              'default'
                            }
                            sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' } }}
                          />
                        </Box>
                        <Button
                          size="medium"
                          variant="contained"
                          color="primary"
                          onClick={() => navigate(`/course-management/${course._id}`)}
                          sx={{ 
                            minWidth: { xs: '140px', sm: '120px', md: '140px' },
                            height: { xs: '44px', sm: '40px', md: '44px' },
                            fontSize: { xs: '0.9rem', sm: '0.875rem', md: '0.9rem' },
                            fontWeight: 600,
                            px: { xs: 2, sm: 1.5, md: 2 },
                            background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
                            boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
                            '&:hover': {
                              background: 'linear-gradient(45deg, #FE6B8B 60%, #FF8E53 100%)',
                              transform: 'translateY(-1px)',
                              boxShadow: '0 4px 8px 2px rgba(255, 105, 135, .4)'
                            },
                            transition: 'all 0.3s ease'
                          }}
                        >
                          Manage Course
                        </Button>
                      </Box>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.random() * 100} // Mock completion rate - would come from analytics
                      sx={{ 
                        mb: 1,
                        height: { xs: 6, sm: 4 },
                        borderRadius: 1
                      }}
                    />
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.875rem', sm: '0.8125rem' } }}
                    >
                      {course.category} • {course.level} • Created: {new Date(course.createdAt).toLocaleDateString()}
                    </Typography>
                    {index < Math.min(dashboardData.courses.length - 1, 2) && <Divider sx={{ mt: 2 }} />}
                  </Box>
                ))
              )}
            </ResponsiveCardContent>
          </ResponsiveCard>
        </Grid>

        {/* Upcoming Live Sessions */}
        <Grid item xs={12} md={4}>
          <ResponsiveCard elevation={3}>
            <ResponsiveCardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
              <Stack 
                direction={{ xs: 'column', sm: 'row', md: 'column' }} 
                justifyContent="space-between" 
                alignItems={{ xs: 'flex-start', sm: 'center', md: 'flex-start' }}
                spacing={{ xs: 2, sm: 1, md: 2 }}
                sx={{ mb: { xs: 2, sm: 3 } }}
              >
                <Typography 
                  variant={isMobile ? "h6" : "h5"} 
                  sx={{ 
                    fontWeight: 600,
                    color: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <VideoCall sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
                  Upcoming Sessions
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row', md: 'column' }} spacing={1} sx={{ width: { xs: '100%', sm: 'auto', md: '100%' } }}>
                  <Button
                    size="medium"
                    startIcon={<History />}
                    onClick={() => navigate('/dashboard/teacher/live-sessions?tab=completed')}
                    sx={{ 
                      minWidth: { xs: '140px', sm: '120px', md: '140px' },
                      height: { xs: '44px', sm: '40px', md: '44px' },
                      fontSize: { xs: '0.9rem', sm: '0.875rem', md: '0.9rem' },
                      fontWeight: 600,
                      px: { xs: 2, sm: 1.5, md: 2 },
                      color: 'text.secondary',
                      '&:hover': {
                        backgroundColor: 'action.hover',
                        transform: 'translateY(-1px)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    View History
                  </Button>
                  <Button
                    size="medium"
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => navigate('/dashboard/teacher/live-sessions/create')}
                    sx={{
                      minWidth: { xs: '140px', sm: '120px', md: '140px' },
                      height: { xs: '44px', sm: '40px', md: '44px' },
                      fontSize: { xs: '0.9rem', sm: '0.875rem', md: '0.9rem' },
                      fontWeight: 600,
                      px: { xs: 2, sm: 1.5, md: 2 },
                      background: 'linear-gradient(45deg, #FF6B6B 30%, #FF8E53 90%)',
                      boxShadow: '0 3px 5px 2px rgba(255, 107, 107, .3)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #FF6B6B 60%, #FF8E53 100%)',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 8px 2px rgba(255, 107, 107, .4)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Schedule Session
                  </Button>
                </Stack>
              </Stack>
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
            </ResponsiveCardContent>
          </ResponsiveCard>
        </Grid>

        {/* Session Statistics */}
        <Grid item xs={12}>
          <ResponsiveCard elevation={3}>
            <ResponsiveCardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
              <Typography 
                variant={isMobile ? "h6" : "h5"} 
                gutterBottom
                sx={{ 
                  fontWeight: 600,
                  color: 'primary.main',
                  mb: { xs: 2, sm: 3 },
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <TrendingUp sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
                Session Statistics
              </Typography>
              <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
                <Grid item xs={6} sm={6} md={3}>
                  <Box 
                    textAlign="center"
                    sx={{
                      p: { xs: 2, sm: 3 },
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.1), rgba(33, 150, 243, 0.05))',
                      border: '1px solid rgba(33, 150, 243, 0.2)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(33, 150, 243, 0.15)'
                      }
                    }}
                  >
                    <Typography 
                      variant={isMobile ? "h5" : "h4"} 
                      color="primary"
                      sx={{ fontWeight: 700, mb: 1 }}
                    >
                      {dashboardData.stats.totalSessions}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      Total Sessions
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={6} md={3}>
                  <Box 
                    textAlign="center"
                    sx={{
                      p: { xs: 2, sm: 3 },
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(76, 175, 80, 0.05))',
                      border: '1px solid rgba(76, 175, 80, 0.2)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(76, 175, 80, 0.15)'
                      }
                    }}
                  >
                    <Typography 
                      variant={isMobile ? "h5" : "h4"} 
                      color="success.main"
                      sx={{ fontWeight: 700, mb: 1 }}
                    >
                      {dashboardData.stats.completedSessions}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      Completed Sessions
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={6} md={3}>
                  <Box 
                    textAlign="center"
                    sx={{
                      p: { xs: 2, sm: 3 },
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.1), rgba(33, 150, 243, 0.05))',
                      border: '1px solid rgba(33, 150, 243, 0.2)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(33, 150, 243, 0.15)'
                      }
                    }}
                  >
                    <Typography 
                      variant={isMobile ? "h5" : "h4"} 
                      color="info.main"
                      sx={{ fontWeight: 700, mb: 1 }}
                    >
                      {dashboardData.upcomingSessions.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      Upcoming Sessions
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={6} md={3}>
                  <Box 
                    textAlign="center"
                    sx={{
                      p: { xs: 2, sm: 3 },
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.1), rgba(255, 152, 0, 0.05))',
                      border: '1px solid rgba(255, 152, 0, 0.2)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(255, 152, 0, 0.15)'
                      }
                    }}
                  >
                    <Typography 
                      variant={isMobile ? "h5" : "h4"} 
                      color="warning.main"
                      sx={{ fontWeight: 700, mb: 1 }}
                    >
                      {dashboardData.completedSessions.filter(s => s.isRecorded).length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      Recorded Sessions
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </ResponsiveCardContent>
          </ResponsiveCard>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <ResponsiveCard elevation={3}>
            <ResponsiveCardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
              <Typography 
                variant={isMobile ? "h6" : "h5"} 
                gutterBottom
                sx={{ 
                  fontWeight: 600,
                  color: 'primary.main',
                  mb: { xs: 2, sm: 3 },
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <Assignment sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
                Quick Actions
              </Typography>
              <Grid container spacing={{ xs: 2, sm: 3, md: 3 }}>
                <Grid item xs={12} sm={6} md={4} lg={2.4}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<School />}
                    onClick={() => navigate('/dashboard/teacher/courses/create')}
                    sx={{
                      height: { xs: '64px', sm: '72px', md: '80px', lg: '88px' },
                      fontSize: { xs: '0.95rem', sm: '1.05rem', md: '1.15rem', lg: '1.2rem' },
                      fontWeight: 600,
                      px: { xs: 2, sm: 2.5, md: 3 },
                      borderColor: 'primary.main',
                      color: 'primary.main',
                      borderWidth: 2,
                      '&:hover': {
                        borderColor: 'primary.dark',
                        backgroundColor: 'primary.main',
                        color: 'white',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 16px rgba(33, 150, 243, 0.4)',
                        borderWidth: 2
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Create Course
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={4} lg={2.4}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<ManageAccounts />}
                    onClick={() => navigate('/dashboard/teacher/courses')}
                    sx={{
                      height: { xs: '64px', sm: '72px', md: '80px', lg: '88px' },
                      fontSize: { xs: '0.95rem', sm: '1.05rem', md: '1.15rem', lg: '1.2rem' },
                      fontWeight: 600,
                      px: { xs: 2, sm: 2.5, md: 3 },
                      borderColor: 'success.main',
                      color: 'success.main',
                      borderWidth: 2,
                      '&:hover': {
                        borderColor: 'success.dark',
                        backgroundColor: 'success.main',
                        color: 'white',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 16px rgba(76, 175, 80, 0.4)',
                        borderWidth: 2
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Manage Courses
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={4} lg={2.4}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<VideoCall />}
                    onClick={() => navigate('/dashboard/teacher/live-sessions/create')}
                    sx={{
                      height: { xs: '64px', sm: '72px', md: '80px', lg: '88px' },
                      fontSize: { xs: '0.95rem', sm: '1.05rem', md: '1.15rem', lg: '1.2rem' },
                      fontWeight: 600,
                      px: { xs: 2, sm: 2.5, md: 3 },
                      borderColor: 'info.main',
                      color: 'info.main',
                      borderWidth: 2,
                      '&:hover': {
                        borderColor: 'info.dark',
                        backgroundColor: 'info.main',
                        color: 'white',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 16px rgba(33, 150, 243, 0.4)',
                        borderWidth: 2
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Schedule Session
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={4} lg={2.4}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<VideoCall />}
                    onClick={() => navigate('/dashboard/teacher/live-sessions')}
                    sx={{
                      height: { xs: '64px', sm: '72px', md: '80px', lg: '88px' },
                      fontSize: { xs: '0.95rem', sm: '1.05rem', md: '1.15rem', lg: '1.2rem' },
                      fontWeight: 600,
                      px: { xs: 2, sm: 2.5, md: 3 },
                      background: 'linear-gradient(45deg, #FF6B6B 30%, #FF8E53 90%)',
                      boxShadow: '0 4px 8px 2px rgba(255, 107, 107, .3)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #FF6B6B 60%, #FF8E53 100%)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 20px rgba(255, 107, 107, .5)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Start Live Class
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={4} lg={2.4}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<History />}
                    onClick={() => navigate('/dashboard/teacher/live-sessions')}
                    sx={{
                      height: { xs: '64px', sm: '72px', md: '80px', lg: '88px' },
                      fontSize: { xs: '0.95rem', sm: '1.05rem', md: '1.15rem', lg: '1.2rem' },
                      fontWeight: 600,
                      px: { xs: 2, sm: 2.5, md: 3 },
                      borderColor: 'warning.main',
                      color: 'warning.main',
                      borderWidth: 2,
                      '&:hover': {
                        borderColor: 'warning.dark',
                        backgroundColor: 'warning.main',
                        color: 'white',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 16px rgba(255, 152, 0, 0.4)',
                        borderWidth: 2
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    View Sessions
                  </Button>
                </Grid>
              </Grid>
            </ResponsiveCardContent>
          </ResponsiveCard>
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

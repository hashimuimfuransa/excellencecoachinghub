import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Assignment,
  Quiz,
  EmojiEvents,
  VideoCall,
  PlayArrow,
  TrendingUp,
  Notifications
} from '@mui/icons-material';

import { useAuth } from '../../store/AuthContext';
import { courseService, ICourse } from '../../services/courseService';
import { assessmentService, IAssessment } from '../../services/assessmentService';
import { enhancedAssessmentService, IEnhancedAssessment } from '../../services/enhancedAssessmentService';
import { liveSessionService, ILiveSession } from '../../services/liveSessionService';
import { enrollmentService, IEnrollment } from '../../services/enrollmentService';
import { getCourseImageUrl } from '../../utils/courseImageGenerator';
import RecordedSessions from '../../components/Student/RecordedSessions';
import ResponsiveDashboard from '../../components/Layout/ResponsiveDashboard';
import { useResponsive, getCardDimensions, getButtonSize } from '../../utils/responsive';

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

// Interface for student dashboard data
interface StudentDashboardData {
  enrolledCourses: ICourse[];
  upcomingAssessments: IAssessment[];
  enhancedAssessments: IEnhancedAssessment[];
  upcomingSessions: ILiveSession[];
  enrollments: IEnrollment[];
  stats: {
    totalCourses: number;
    completedCourses: number;
    upcomingAssessments: number;
    enhancedAssessments: number;
    upcomingSessions: number;
    averageProgress: number;
    certificatesEarned: number;
  };
}

const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const cardDimensions = getCardDimensions();
  const buttonSize = getButtonSize(isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop');

  // State for dashboard data
  const [dashboardData, setDashboardData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    if (!user || user.role !== 'student') return;

    try {
      setLoading(true);
      setError(null);

      // Fetch enrolled courses
      const coursesResponse = await courseService.getEnrolledCourses({
        limit: 10
      });

      // Fetch enrollments with progress
      const enrollmentsResponse = await enrollmentService.getMyEnrollments();

      // Fetch upcoming assessments
      const assessmentsResponse = await assessmentService.getStudentAssessments({
        status: 'available',
        limit: 5
      });

      // Fetch enhanced assessments
      const enhancedAssessmentsResponse = await enhancedAssessmentService.getStudentAssessments({
        status: 'published',
        limit: 5
      });

      // Fetch upcoming live sessions for student
      const sessionsResponse = await liveSessionService.getStudentSessions({
        limit: 5
      });

      // Calculate stats
      const totalCourses = coursesResponse.courses?.length || 0;
      const completedCourses = enrollmentsResponse.enrollments?.filter(
        (enrollment: IEnrollment) => enrollment.progress?.totalProgress >= 100
      ).length || 0;
      const averageProgress = enrollmentsResponse.enrollments?.length > 0
        ? Math.round(
            enrollmentsResponse.enrollments.reduce(
              (sum: number, enrollment: IEnrollment) => sum + (enrollment.progress?.totalProgress || 0),
              0
            ) / enrollmentsResponse.enrollments.length
          )
        : 0;

      const stats = {
        totalCourses,
        completedCourses,
        upcomingAssessments: assessmentsResponse.assessments?.length || 0,
        enhancedAssessments: enhancedAssessmentsResponse.assessments?.length || 0,
        upcomingSessions: sessionsResponse.sessions?.length || 0,
        averageProgress,
        certificatesEarned: completedCourses // Assuming certificates are earned for completed courses
      };

      setDashboardData({
        enrolledCourses: coursesResponse.courses || [],
        upcomingAssessments: assessmentsResponse.assessments || [],
        enhancedAssessments: enhancedAssessmentsResponse.assessments || [],
        upcomingSessions: sessionsResponse.sessions || [],
        enrollments: enrollmentsResponse.enrollments || [],
        stats
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

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
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={fetchDashboardData}>
            Retry
          </Button>
        }>
          {error}
        </Alert>
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
        mb: { xs: 2, sm: 3, md: 4 },
        textAlign: { xs: 'center', sm: 'left' }
      }}>
        <Typography 
          variant={isMobile ? "h5" : "h4"} 
          component="h1" 
          gutterBottom
          sx={{ 
            fontWeight: 600,
            color: 'primary.main',
            mb: { xs: 1, sm: 2 }
          }}
        >
          Welcome back, {user?.firstName}!
        </Typography>
        <Typography 
          variant={isMobile ? "body2" : "body1"} 
          color="text.secondary"
          sx={{ 
            maxWidth: { xs: '100%', sm: '80%', md: '60%' },
            mx: { xs: 'auto', sm: 0 }
          }}
        >
          Continue your learning journey and achieve your goals.
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={{ xs: 2, sm: 2, md: 3 }} sx={{ mb: { xs: 3, sm: 4 } }}>
        <Grid item xs={6} sm={3} md={3}>
          <StatsCard elevation={isMobile ? 1 : 2}>
            <School 
              color="primary" 
              sx={{ 
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
                mb: { xs: 0.5, sm: 1 }
              }} 
            />
            <Typography 
              variant={isMobile ? "h6" : "h4"} 
              sx={{ 
                fontWeight: 700,
                color: 'primary.main',
                mb: 0.5,
                fontSize: { xs: '1.1rem', sm: '1.5rem', md: '2rem' }
              }}
            >
              {dashboardData.stats.totalCourses}
            </Typography>
            <Typography 
              variant={isMobile ? "caption" : "body2"} 
              color="text.secondary"
              sx={{ 
                fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' },
                textAlign: 'center',
                lineHeight: 1.2
              }}
            >
              Enrolled Courses
            </Typography>
          </StatsCard>
        </Grid>

        <Grid item xs={6} sm={3} md={3}>
          <StatsCard elevation={isMobile ? 1 : 2}>
            <Assignment 
              color="warning" 
              sx={{ 
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
                mb: { xs: 0.5, sm: 1 }
              }} 
            />
            <Typography 
              variant={isMobile ? "h6" : "h4"} 
              sx={{ 
                fontWeight: 700,
                color: 'warning.main',
                mb: 0.5,
                fontSize: { xs: '1.1rem', sm: '1.5rem', md: '2rem' }
              }}
            >
              {dashboardData.stats.upcomingAssessments}
            </Typography>
            <Typography 
              variant={isMobile ? "caption" : "body2"} 
              color="text.secondary"
              sx={{ 
                fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' },
                textAlign: 'center',
                lineHeight: 1.2
              }}
            >
              Pending Assessments
            </Typography>
          </StatsCard>
        </Grid>

        <Grid item xs={6} sm={3} md={3}>
          <StatsCard elevation={isMobile ? 1 : 2}>
            <Quiz 
              color="secondary" 
              sx={{ 
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
                mb: { xs: 0.5, sm: 1 }
              }} 
            />
            <Typography 
              variant={isMobile ? "h6" : "h4"} 
              sx={{ 
                fontWeight: 700,
                color: 'secondary.main',
                mb: 0.5,
                fontSize: { xs: '1.1rem', sm: '1.5rem', md: '2rem' }
              }}
            >
              {dashboardData.stats.enhancedAssessments}
            </Typography>
            <Typography 
              variant={isMobile ? "caption" : "body2"} 
              color="text.secondary"
              sx={{ 
                fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' },
                textAlign: 'center',
                lineHeight: 1.2
              }}
            >
              Enhanced Tests
            </Typography>
          </StatsCard>
        </Grid>

        <Grid item xs={6} sm={3} md={3}>
          <StatsCard elevation={isMobile ? 1 : 2}>
            <TrendingUp 
              color="success" 
              sx={{ 
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
                mb: { xs: 0.5, sm: 1 }
              }} 
            />
            <Typography 
              variant={isMobile ? "h6" : "h4"} 
              sx={{ 
                fontWeight: 700,
                color: 'success.main',
                mb: 0.5,
                fontSize: { xs: '1.1rem', sm: '1.5rem', md: '2rem' }
              }}
            >
              {dashboardData.stats.averageProgress}%
            </Typography>
            <Typography 
              variant={isMobile ? "caption" : "body2"} 
              color="text.secondary"
              sx={{ 
                fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' },
                textAlign: 'center',
                lineHeight: 1.2
              }}
            >
              Avg Progress
            </Typography>
          </StatsCard>
        </Grid>
      </Grid>

      {/* Main Content */}
      <Grid container spacing={{ xs: 2, sm: 2, md: 3 }}>
        {/* My Courses */}
        <Grid item xs={12} lg={8}>
          <ResponsiveCard>
            <ResponsiveCardContent>
              <Stack 
                direction={{ xs: 'column', sm: 'row' }} 
                justifyContent="space-between" 
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                spacing={{ xs: 1, sm: 2 }}
                sx={{ mb: { xs: 2, sm: 3 } }}
              >
                <Typography 
                  variant={isMobile ? "h6" : "h5"} 
                  sx={{ 
                    fontWeight: 600,
                    color: 'primary.main'
                  }}
                >
                  My Courses
                </Typography>
                <ResponsiveButton 
                  size={buttonSize}
                  variant="outlined"
                  onClick={() => navigate('/courses')}
                  sx={{ 
                    minWidth: { xs: '100%', sm: 'auto' },
                    alignSelf: { xs: 'stretch', sm: 'auto' }
                  }}
                >
                  View All
                </ResponsiveButton>
              </Stack>

              {dashboardData.enrolledCourses.length === 0 ? (
                <Box
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                  py={{ xs: 3, sm: 4 }}
                  sx={{ color: 'text.secondary' }}
                >
                  <School sx={{ fontSize: { xs: 36, sm: 48 }, mb: 2, opacity: 0.5 }} />
                  <Typography variant={isMobile ? "subtitle1" : "h6"} gutterBottom>
                    No Enrolled Courses
                  </Typography>
                  <Typography 
                    variant="body2" 
                    textAlign="center" 
                    mb={2}
                    sx={{ maxWidth: '80%' }}
                  >
                    Start your learning journey by enrolling in a course.
                  </Typography>
                  <ResponsiveButton
                    variant="contained"
                    startIcon={<School />}
                    onClick={() => navigate('/courses')}
                    size={buttonSize}
                  >
                    Browse Courses
                  </ResponsiveButton>
                </Box>
              ) : (
                <Stack spacing={2}>
                  {dashboardData.enrolledCourses.slice(0, 3).map((course, index) => {
                    const enrollment = dashboardData.enrollments.find(e => e.course._id === course._id);
                    return (
                      <Box key={course._id}>
                        <Stack 
                          direction={{ xs: 'column', sm: 'row' }} 
                          spacing={{ xs: 1, sm: 2 }}
                          alignItems={{ xs: 'flex-start', sm: 'center' }}
                        >
                          <Avatar
                            src={getCourseImageUrl(course)}
                            sx={{ 
                              width: { xs: 40, sm: 56 }, 
                              height: { xs: 40, sm: 56 },
                              alignSelf: { xs: 'center', sm: 'flex-start' }
                            }}
                          >
                            <School />
                          </Avatar>
                          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Typography 
                              variant={isMobile ? "subtitle2" : "subtitle1"} 
                              sx={{ 
                                fontWeight: 600,
                                mb: 0.5,
                                textAlign: { xs: 'center', sm: 'left' }
                              }}
                            >
                              {course.title}
                            </Typography>
                            <Typography 
                              variant="body2" 
                              color="text.secondary"
                              sx={{ 
                                mb: 1,
                                textAlign: { xs: 'center', sm: 'left' }
                              }}
                            >
                              {course.instructor?.firstName} {course.instructor?.lastName} • {course.category}
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={enrollment?.progress?.totalProgress || 0}
                              sx={{ 
                                height: { xs: 6, sm: 8 },
                                borderRadius: 1,
                                backgroundColor: 'grey.200'
                              }}
                            />
                            <Typography 
                              variant="caption" 
                              color="text.secondary"
                              sx={{ 
                                mt: 0.5,
                                display: 'block',
                                textAlign: { xs: 'center', sm: 'left' }
                              }}
                            >
                              {enrollment?.progress?.totalProgress || 0}% Complete
                            </Typography>
                          </Box>
                          <ResponsiveButton
                            size={buttonSize}
                            variant="outlined"
                            onClick={() => navigate(`/dashboard/student/course/${course._id}`)}
                            sx={{ 
                              minWidth: { xs: '100%', sm: 'auto' },
                              mt: { xs: 1, sm: 0 }
                            }}
                          >
                            Continue
                          </ResponsiveButton>
                        </Stack>
                        {index < Math.min(dashboardData.enrolledCourses.length - 1, 2) && (
                          <Divider sx={{ mt: 2 }} />
                        )}
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </ResponsiveCardContent>
          </ResponsiveCard>
        </Grid>

        {/* Quick Actions & Upcoming Sessions */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={{ xs: 2, sm: 2, md: 3 }}>
            {/* Upcoming Sessions */}
            <ResponsiveCard>
              <ResponsiveCardContent>
                <Typography 
                  variant={isMobile ? "h6" : "h5"} 
                  sx={{ 
                    fontWeight: 600,
                    color: 'primary.main',
                    mb: { xs: 2, sm: 3 }
                  }}
                >
                  Upcoming Sessions
                </Typography>
                {dashboardData.upcomingSessions.length === 0 ? (
                  <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    py={{ xs: 2, sm: 3 }}
                    sx={{ color: 'text.secondary' }}
                  >
                    <VideoCall sx={{ fontSize: { xs: 32, sm: 40 }, mb: 1, opacity: 0.5 }} />
                    <Typography variant="body2" textAlign="center">
                      No upcoming sessions
                    </Typography>
                  </Box>
                ) : (
                  <List sx={{ p: 0 }}>
                    {dashboardData.upcomingSessions.slice(0, 3).map((session, index) => (
                      <React.Fragment key={session._id}>
                        <ListItem 
                          disablePadding
                          sx={{ 
                            flexDirection: { xs: 'column', sm: 'row' },
                            alignItems: { xs: 'flex-start', sm: 'center' },
                            py: 1
                          }}
                        >
                          <ListItemAvatar sx={{ alignSelf: { xs: 'center', sm: 'flex-start' } }}>
                            <Avatar sx={{ bgcolor: 'info.main' }}>
                              <VideoCall />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={session.title}
                            secondary={new Date(session.scheduledTime).toLocaleString()}
                            sx={{ 
                              textAlign: { xs: 'center', sm: 'left' },
                              mb: { xs: 1, sm: 0 }
                            }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/video/live-class/${session._id}?role=student`)}
                            title="Join Live Class"
                            sx={{ 
                              alignSelf: { xs: 'center', sm: 'flex-start' }
                            }}
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

            {/* Recorded Sessions */}
            <ResponsiveCard>
              <ResponsiveCardContent>
                <Typography 
                  variant={isMobile ? "h6" : "h5"} 
                  sx={{ 
                    fontWeight: 600,
                    color: 'primary.main',
                    mb: { xs: 2, sm: 3 }
                  }}
                >
                  Recorded Sessions
                </Typography>
                <RecordedSessions />
              </ResponsiveCardContent>
            </ResponsiveCard>
          </Stack>
        </Grid>
      </Grid>
    </ResponsiveDashboard>
  );
};

export default StudentDashboard;

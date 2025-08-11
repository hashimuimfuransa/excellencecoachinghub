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
  padding: theme.spacing(1.5),
  textAlign: 'center',
  height: '100%',
  minHeight: '100px',
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
    padding: theme.spacing(1.25),
    minHeight: '80px',
    '&:hover': {
      transform: 'none',
    },
  },
  [theme.breakpoints.up('lg')]: {
    padding: theme.spacing(1.75),
    minHeight: '110px',
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

      // Use Promise.allSettled to handle partial failures gracefully
      const [
        coursesResult,
        enrollmentsResult,
        assessmentsResult,
        enhancedAssessmentsResult,
        sessionsResult
      ] = await Promise.allSettled([
        courseService.getEnrolledCourses({ limit: 10 }),
        enrollmentService.getMyEnrollments(),
        assessmentService.getStudentAssessments({ status: 'available', limit: 5 }),
        enhancedAssessmentService.getStudentAssessments({ status: 'published', limit: 5 }),
        liveSessionService.getStudentSessions({ limit: 5 })
      ]);

      // Extract data with fallbacks
      const coursesData = coursesResult.status === 'fulfilled' ? coursesResult.value : { courses: [] };
      const enrollmentsData = enrollmentsResult.status === 'fulfilled' ? enrollmentsResult.value : { enrollments: [] };
      const assessmentsData = assessmentsResult.status === 'fulfilled' ? assessmentsResult.value : { assessments: [] };
      const enhancedAssessmentsData = enhancedAssessmentsResult.status === 'fulfilled' ? enhancedAssessmentsResult.value : { assessments: [] };
      const sessionsData = sessionsResult.status === 'fulfilled' ? sessionsResult.value : { sessions: [] };

      // Log any failures
      if (coursesResult.status === 'rejected') {
        console.error('Failed to load courses:', coursesResult.reason);
      }
      if (enrollmentsResult.status === 'rejected') {
        console.error('Failed to load enrollments:', enrollmentsResult.reason);
      }
      if (assessmentsResult.status === 'rejected') {
        console.error('Failed to load assessments:', assessmentsResult.reason);
      }
      if (enhancedAssessmentsResult.status === 'rejected') {
        console.error('Failed to load enhanced assessments:', enhancedAssessmentsResult.reason);
      }
      if (sessionsResult.status === 'rejected') {
        console.error('Failed to load sessions:', sessionsResult.reason);
      }

      // Calculate stats
      const totalCourses = coursesData.courses?.length || 0;
      const enrollments = enrollmentsData.enrollments || [];
      const completedCourses = enrollments.filter(
        (enrollment: IEnrollment) => enrollment.progress >= 100
      ).length;
      const averageProgress = enrollments.length > 0
        ? Math.round(
            enrollments.reduce<number>(
              (sum: number, enrollment: IEnrollment) => sum + (enrollment.progress || 0),
              0
            ) / enrollments.length
          )
        : 0;

      const stats = {
        totalCourses,
        completedCourses,
        upcomingAssessments: assessmentsData.assessments?.length || 0,
        enhancedAssessments: enhancedAssessmentsData.assessments?.length || 0,
        upcomingSessions: sessionsData.sessions?.length || 0,
        averageProgress,
        certificatesEarned: completedCourses // Assuming certificates are earned for completed courses
      };

      setDashboardData({
        enrolledCourses: coursesData.courses || [],
        upcomingAssessments: assessmentsData.assessments || [],
        enhancedAssessments: enhancedAssessmentsData.assessments || [],
        upcomingSessions: sessionsData.sessions || [],
        enrollments: enrollments,
        stats
      });

      // Check if all requests failed
      const allFailed = [
        coursesResult,
        enrollmentsResult,
        assessmentsResult,
        enhancedAssessmentsResult,
        sessionsResult
      ].every(result => result.status === 'rejected');

      if (allFailed) {
        setError('Unable to load dashboard data. Please check your connection and try again.');
      } else {
        // Show partial success message if some requests failed
        const failedCount = [
          coursesResult,
          enrollmentsResult,
          assessmentsResult,
          enhancedAssessmentsResult,
          sessionsResult
        ].filter(result => result.status === 'rejected').length;

        if (failedCount > 0) {
          console.warn(`${failedCount} out of 5 dashboard data requests failed, but showing available data`);
        }
      }

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
        mb: { xs: 2, sm: 2, md: 3 },
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
      <Grid container spacing={{ xs: 2, sm: 2, md: 3 }} sx={{ mb: { xs: 2, sm: 3 } }}>
        <Grid item xs={6} sm={3} md={3}>
          <StatsCard elevation={isMobile ? 1 : 2}>
            <School 
              color="primary" 
              sx={{ 
                fontSize: { xs: '1.5rem', sm: '1.8rem', md: '2rem' },
                mb: { xs: 0.5, sm: 0.75 }
              }} 
            />
            <Typography 
              variant={isMobile ? "h6" : "h4"} 
              sx={{ 
                fontWeight: 700,
                color: 'primary.main',
                mb: 0.25,
                fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' }
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
                sx={{ mb: { xs: 1.5, sm: 2 } }}
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
                  onClick={() => navigate('/dashboard/student/courses')}
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
                  py={{ xs: 2, sm: 3 }}
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
                    onClick={() => navigate('/dashboard/student/courses')}
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
                              value={enrollment?.progress || 0}
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
                              {enrollment?.progress || 0}% Complete
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
          <Stack spacing={{ xs: 1.5, sm: 2, md: 2.5 }}>
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
                    py={{ xs: 1.5, sm: 2 }}
                    sx={{ color: 'text.secondary' }}
                  >
                    <VideoCall sx={{ fontSize: { xs: 28, sm: 32 }, mb: 1, opacity: 0.5 }} />
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

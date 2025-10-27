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
  Notifications,
  Person,
  Description,
  Assessment
} from '@mui/icons-material';

import { useAuth } from '../../store/AuthContext';
import { isLearnerRole } from '../../utils/roleUtils';
import { courseService, ICourse } from '../../services/courseService';
import { assessmentService, IAssessment } from '../../services/assessmentService';
import { enhancedAssessmentService, IEnhancedAssessment } from '../../services/enhancedAssessmentService';
import { liveSessionService, ILiveSession } from '../../services/liveSessionService';
import { recordedSessionService, IRecordedSession } from '../../services/recordedSessionService';
import { enrollmentService, IEnrollment } from '../../services/enrollmentService';
import { getCourseImageUrl } from '../../utils/courseImageGenerator';
import RecordedSessions from '../../components/Student/RecordedSessions';
import ResponsiveDashboard from '../../components/Layout/ResponsiveDashboard';
import { useResponsive, getCardDimensions, getButtonSize } from '../../utils/responsive';
import careerGuidanceService from '../../services/careerGuidanceService';

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
  padding: theme.spacing(2.5),
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
    padding: theme.spacing(3),
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

// Interface for student dashboard data
interface StudentDashboardData {
  enrolledCourses: ICourse[];
  upcomingAssessments: IAssessment[];
  enhancedAssessments: IEnhancedAssessment[];
  upcomingSessions: ILiveSession[];
  recordedSessions: IRecordedSession[];
  enrollments: IEnrollment[];
  stats: {
    totalCourses: number;
    completedCourses: number;
    upcomingAssessments: number;
    enhancedAssessments: number;
    upcomingSessions: number;
    recordedSessions: number;
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

  // Fetch dashboard data with rate limiting protection
  const fetchDashboardData = async () => {
    if (!user || !isLearnerRole(user.role)) return;

    try {
      setLoading(true);
      setError(null);

      // Use Promise.allSettled to handle partial failures gracefully
      // Add delays between API calls to prevent rate limiting
      const [
        coursesResult,
        enrollmentsResult,
        assessmentsResult,
        enhancedAssessmentsResult,
        sessionsResult,
        recordedSessionsResult
      ] = await Promise.allSettled([
        courseService.getEnrolledCourses({ limit: 10 }),
        enrollmentService.getMyEnrollments({ limit: 10 }),
        assessmentService.getStudentAssessments({ status: 'available', limit: 5 }),
        enhancedAssessmentService.getStudentAssessments({ status: 'published', limit: 5 }),
        liveSessionService.getStudentSessions({ limit: 5 }),
        recordedSessionService.getAllRecordedSessionsForStudent() // Get all recorded sessions for enrolled courses
      ]);

      // Extract data with fallbacks
      const coursesData = coursesResult.status === 'fulfilled' ? coursesResult.value : { courses: [] };
      const enrollmentsData = enrollmentsResult.status === 'fulfilled' ? enrollmentsResult.value : { enrollments: [] };
      const assessmentsData = assessmentsResult.status === 'fulfilled' ? assessmentsResult.value : { assessments: [] };
      const enhancedAssessmentsData = enhancedAssessmentsResult.status === 'fulfilled' ? enhancedAssessmentsResult.value : { assessments: [] };
      const sessionsData = sessionsResult.status === 'fulfilled' ? sessionsResult.value : { sessions: [] };
      const recordedSessionsData = recordedSessionsResult.status === 'fulfilled' ? recordedSessionsResult.value : { data: [] };

      // Debug logging for live sessions
      console.log('🔍 Live Sessions Debug:', {
        sessionsResultStatus: sessionsResult.status,
        sessionsResultValue: sessionsResult.status === 'fulfilled' ? sessionsResult.value : sessionsResult.reason,
        sessionsData: sessionsData,
        sessionsCount: sessionsData.sessions?.length || 0
      });

      // Log any failures, but don't show rate limiting errors to users
      if (coursesResult.status === 'rejected') {
        const error = coursesResult.reason;
        if (!error?.message?.includes('429') && !error?.message?.includes('Too Many Requests')) {
          console.error('Failed to load courses:', error);
        }
      }
      if (enrollmentsResult.status === 'rejected') {
        const error = enrollmentsResult.reason;
        if (!error?.message?.includes('429') && !error?.message?.includes('Too Many Requests')) {
          console.error('Failed to load enrollments:', error);
        }
      }
      if (assessmentsResult.status === 'rejected') {
        const error = assessmentsResult.reason;
        if (!error?.message?.includes('429') && !error?.message?.includes('Too Many Requests')) {
          console.error('Failed to load assessments:', error);
        }
      }
      if (enhancedAssessmentsResult.status === 'rejected') {
        const error = enhancedAssessmentsResult.reason;
        if (!error?.message?.includes('429') && !error?.message?.includes('Too Many Requests')) {
          console.error('Failed to load enhanced assessments:', error);
        }
      }
      if (sessionsResult.status === 'rejected') {
        const error = sessionsResult.reason;
        if (!error?.message?.includes('429') && !error?.message?.includes('Too Many Requests')) {
          console.error('Failed to load sessions:', error);
        }
      }

      // Calculate stats
      const totalCourses = coursesData.courses?.length || 0;
      const enrollments: IEnrollment[] = enrollmentsData.enrollments || [];
      const completedCourses = enrollments.filter(
        (enrollment) => enrollment.progress?.totalProgress >= 100
      ).length;
      const averageProgress = enrollments.length > 0
        ? Math.round(
            enrollments.reduce(
              (sum, enrollment) => sum + (enrollment.progress?.totalProgress || 0),
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
        recordedSessions: recordedSessionsData.data?.length || 0,
        averageProgress,
        certificatesEarned: completedCourses // Assuming certificates are earned for completed courses
      };

      setDashboardData({
        enrolledCourses: coursesData.courses || [],
        upcomingAssessments: assessmentsData.assessments || [],
        enhancedAssessments: enhancedAssessmentsData.assessments || [],
        upcomingSessions: sessionsData.sessions || [],
        recordedSessions: recordedSessionsData.data || [],
        enrollments: enrollments,
        stats
      });

      // Check if student has no enrolled courses - redirect to course enrollment
      if (totalCourses === 0 && enrollments.length === 0) {
        navigate('/dashboard/student/courses');
        return;
      }

      // Check if all requests failed (excluding rate limiting errors)
      const allFailed = [
        coursesResult,
        enrollmentsResult,
        assessmentsResult,
        enhancedAssessmentsResult,
        sessionsResult,
        recordedSessionsResult
      ].every(result => {
        if (result.status === 'rejected') {
          const error = result.reason;
          // Don't count rate limiting errors as failures
          return !error?.message?.includes('429') && !error?.message?.includes('Too Many Requests');
        }
        return false;
      });

      if (allFailed) {
        setError('Unable to load dashboard data. Please check your connection and try again.');
      } else {
        // Show partial success message if some requests failed (excluding rate limiting)
        const failedCount = [
          coursesResult,
          enrollmentsResult,
          assessmentsResult,
          enhancedAssessmentsResult,
          sessionsResult
        ].filter(result => {
          if (result.status === 'rejected') {
            const error = result.reason;
            // Don't count rate limiting errors as failures
            return !error?.message?.includes('429') && !error?.message?.includes('Too Many Requests');
          }
          return false;
        }).length;

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
      {/* Enhanced Mobile-Responsive Welcome Section */}
      <Box sx={{ 
        mb: { xs: 3, sm: 4, md: 5 },
        textAlign: { xs: 'center', sm: 'left' },
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background decoration for mobile */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: { xs: '100px', sm: '150px', md: '200px' },
          height: { xs: '100px', sm: '150px', md: '200px' },
          background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.1), rgba(33, 203, 243, 0.1))',
          borderRadius: '50%',
          transform: 'translate(30%, -30%)',
          zIndex: 0,
          display: { xs: 'block', md: 'none' }
        }} />
        
        {/* Main welcome content */}
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography 
            variant={isMobile ? "h4" : "h3"} 
            component="h1" 
            gutterBottom
            sx={{ 
              fontWeight: 700,
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: { xs: 1, sm: 2 },
              fontSize: { xs: '1.75rem', sm: '2.2rem', md: '2.5rem' },
              lineHeight: { xs: 1.2, sm: 1.3 },
              textAlign: { xs: 'center', sm: 'left' }
            }}
          >
            Welcome back, {user?.firstName}! 🎓
          </Typography>
          
          <Typography 
            variant={isMobile ? "body1" : "h6"} 
            color="text.secondary"
            sx={{ 
              maxWidth: { xs: '100%', sm: '85%', md: '75%' },
              mx: { xs: 'auto', sm: 0 },
              mb: { xs: 2, sm: 3 },
              fontWeight: 400,
              lineHeight: { xs: 1.5, sm: 1.6 },
              fontSize: { xs: '0.95rem', sm: '1rem', md: '1.1rem' },
              textAlign: { xs: 'center', sm: 'left' }
            }}
          >
            {dashboardData.stats.totalCourses === 0 
              ? "Ready to start your learning journey? Explore our courses and begin your path to excellence!"
              : "Continue your learning journey and unlock your potential. Every step counts towards your success!"
            }
          </Typography>
          
          {/* Direct Profile Access Button */}
          <Box sx={{ 
            mb: { xs: 3, sm: 4 },
            display: 'flex',
            justifyContent: { xs: 'center', sm: 'flex-start' },
            gap: 2
          }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<Person />}
              onClick={() => {
                console.log('🔍 Direct Profile Access from Dashboard');
                // Open profile modal directly
                window.dispatchEvent(new CustomEvent('openProfileModal'));
              }}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontWeight: 600,
                px: 3,
                py: 1.5,
                borderRadius: 2,
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                  boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
                  transform: 'translateY(-2px)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              Go to Profile
            </Button>
          </Box>
          
          {/* Enhanced Quick Action Guide */}
          {dashboardData.stats.totalCourses > 0 && (
            <Box sx={{ 
              mt: { xs: 2, sm: 3 }, 
              p: { xs: 2.5, sm: 3, md: 3.5 }, 
              background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.08), rgba(33, 203, 243, 0.08))',
              borderRadius: { xs: 2, sm: 3 },
              border: '1px solid rgba(33, 150, 243, 0.2)',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: { xs: '0 2px 8px rgba(33, 150, 243, 0.1)', sm: '0 4px 16px rgba(33, 150, 243, 0.15)' },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: 'linear-gradient(90deg, #2196F3, #21CBF3)',
              }
            }}>
              <Typography 
                variant={isMobile ? "subtitle1" : "h6"} 
                sx={{ 
                  fontWeight: 600, 
                  mb: { xs: 2, sm: 2.5 },
                  color: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: { xs: 'center', sm: 'flex-start' },
                  gap: 1,
                  fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' }
                }}
              >
                🎯 What would you like to do today?
              </Typography>
              
              <Stack 
                direction={{ xs: 'column', sm: 'row' }} 
                spacing={{ xs: 1.5, sm: 2 }}
                sx={{ 
                  alignItems: { xs: 'stretch', sm: 'center' },
                  justifyContent: { xs: 'center', sm: 'flex-start' }
                }}
              >
                <ResponsiveButton 
                  size={buttonSize}
                  variant="outlined" 
                  onClick={() => navigate('/courses')}
                  sx={{ 
                    bgcolor: 'white',
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    minHeight: { xs: '44px', sm: '40px' },
                    fontSize: { xs: '0.85rem', sm: '0.9rem' },
                    fontWeight: 600,
                    borderRadius: { xs: 2, sm: 2.5 },
                    '&:hover': {
                      bgcolor: 'primary.main',
                      color: 'white',
                      transform: { xs: 'none', sm: 'translateY(-2px)' },
                      boxShadow: { xs: '0 2px 8px rgba(33, 150, 243, 0.3)', sm: '0 4px 12px rgba(33, 150, 243, 0.3)' }
                    },
                    transition: 'all 0.3s ease',
                    '&:active': {
                      transform: 'scale(0.98)'
                    }
                  }}
                >
                  📚 Study Materials
                </ResponsiveButton>
                
                <ResponsiveButton 
                  size={buttonSize}
                  variant="outlined" 
                  onClick={() => navigate('/past-papers')}
                  sx={{ 
                    bgcolor: 'white',
                    borderColor: 'secondary.main',
                    color: 'secondary.main',
                    minHeight: { xs: '44px', sm: '40px' },
                    fontSize: { xs: '0.85rem', sm: '0.9rem' },
                    fontWeight: 600,
                    borderRadius: { xs: 2, sm: 2.5 },
                    '&:hover': {
                      bgcolor: 'secondary.main',
                      color: 'white',
                      transform: { xs: 'none', sm: 'translateY(-2px)' },
                      boxShadow: { xs: '0 2px 8px rgba(156, 39, 176, 0.3)', sm: '0 4px 12px rgba(156, 39, 176, 0.3)' }
                    },
                    transition: 'all 0.3s ease',
                    '&:active': {
                      transform: 'scale(0.98)'
                    }
                  }}
                >
                  📝 Past Papers
                </ResponsiveButton>
                
                <ResponsiveButton 
                  size={buttonSize}
                  variant="outlined" 
                  onClick={() => navigate('/dashboard/student/assessments')}
                  sx={{ 
                    bgcolor: 'white',
                    borderColor: 'warning.main',
                    color: 'warning.main',
                    minHeight: { xs: '44px', sm: '40px' },
                    fontSize: { xs: '0.85rem', sm: '0.9rem' },
                    fontWeight: 600,
                    borderRadius: { xs: 2, sm: 2.5 },
                    '&:hover': {
                      bgcolor: 'warning.main',
                      color: 'white',
                      transform: { xs: 'none', sm: 'translateY(-2px)' },
                      boxShadow: { xs: '0 2px 8px rgba(255, 152, 0, 0.3)', sm: '0 4px 12px rgba(255, 152, 0, 0.3)' }
                    },
                    transition: 'all 0.3s ease',
                    '&:active': {
                      transform: 'scale(0.98)'
                    }
                  }}
                >
                  📝 Take Tests
                </ResponsiveButton>
                
                <ResponsiveButton 
                  size={buttonSize}
                  variant="outlined" 
                  onClick={() => navigate('/dashboard/student/live-sessions')}
                  sx={{ 
                    bgcolor: 'white',
                    borderColor: 'success.main',
                    color: 'success.main',
                    minHeight: { xs: '44px', sm: '40px' },
                    fontSize: { xs: '0.85rem', sm: '0.9rem' },
                    fontWeight: 600,
                    borderRadius: { xs: 2, sm: 2.5 },
                    '&:hover': {
                      bgcolor: 'success.main',
                      color: 'white',
                      transform: { xs: 'none', sm: 'translateY(-2px)' },
                      boxShadow: { xs: '0 2px 8px rgba(76, 175, 80, 0.3)', sm: '0 4px 12px rgba(76, 175, 80, 0.3)' }
                    },
                    transition: 'all 0.3s ease',
                    '&:active': {
                      transform: 'scale(0.98)'
                    }
                  }}
                >
                  🎥 Live Sessions
                </ResponsiveButton>
              </Stack>
            </Box>
          )}
          
          {/* New user onboarding section */}
          {dashboardData.stats.totalCourses === 0 && (
            <Box sx={{ 
              mt: { xs: 3, sm: 4 }, 
              p: { xs: 2.5, sm: 3, md: 3.5 }, 
              background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.08), rgba(139, 195, 74, 0.08))',
              borderRadius: { xs: 2, sm: 3 },
              border: '1px solid rgba(76, 175, 80, 0.2)',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: { xs: '0 2px 8px rgba(76, 175, 80, 0.1)', sm: '0 4px 16px rgba(76, 175, 80, 0.15)' },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: 'linear-gradient(90deg, #4CAF50, #8BC34A)',
              }
            }}>
              <Typography 
                variant={isMobile ? "subtitle1" : "h6"} 
                sx={{ 
                  fontWeight: 600, 
                  mb: { xs: 2, sm: 2.5 },
                  color: 'success.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: { xs: 'center', sm: 'flex-start' },
                  gap: 1,
                  fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' }
                }}
              >
                🚀 Ready to get started?
              </Typography>
              
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ 
                  mb: { xs: 2, sm: 2.5 },
                  textAlign: { xs: 'center', sm: 'left' },
                  lineHeight: 1.6,
                  fontSize: { xs: '0.9rem', sm: '1rem' }
                }}
              >
                Browse our comprehensive course catalog and start your learning journey today. 
                Choose from programming, business, design, and many more subjects.
              </Typography>
              
              <Box sx={{ 
                display: 'flex', 
                justifyContent: { xs: 'center', sm: 'flex-start' },
                gap: 2,
                flexWrap: 'wrap'
              }}>
                <ResponsiveButton 
                  size={buttonSize}
                  variant="contained" 
                  onClick={() => navigate('/courses')}
                  sx={{ 
                    bgcolor: 'success.main',
                    color: 'white',
                    minHeight: { xs: '44px', sm: '40px' },
                    fontSize: { xs: '0.9rem', sm: '1rem' },
                    fontWeight: 600,
                    borderRadius: { xs: 2, sm: 2.5 },
                    px: { xs: 3, sm: 4 },
                    '&:hover': {
                      bgcolor: 'success.dark',
                      transform: { xs: 'none', sm: 'translateY(-2px)' },
                      boxShadow: { xs: '0 2px 8px rgba(76, 175, 80, 0.3)', sm: '0 4px 12px rgba(76, 175, 80, 0.3)' }
                    },
                    transition: 'all 0.3s ease',
                    '&:active': {
                      transform: 'scale(0.98)'
                    }
                  }}
                >
                  Browse Courses
                </ResponsiveButton>
                
                <ResponsiveButton 
                  size={buttonSize}
                  variant="outlined" 
                  onClick={() => navigate('/dashboard/student/career')}
                  sx={{ 
                    borderColor: 'success.main',
                    color: 'success.main',
                    minHeight: { xs: '44px', sm: '40px' },
                    fontSize: { xs: '0.9rem', sm: '1rem' },
                    fontWeight: 600,
                    borderRadius: { xs: 2, sm: 2.5 },
                    px: { xs: 3, sm: 4 },
                    '&:hover': {
                      bgcolor: 'success.main',
                      color: 'white',
                      transform: { xs: 'none', sm: 'translateY(-2px)' },
                      boxShadow: { xs: '0 2px 8px rgba(76, 175, 80, 0.3)', sm: '0 4px 12px rgba(76, 175, 80, 0.3)' }
                    },
                    transition: 'all 0.3s ease',
                    '&:active': {
                      transform: 'scale(0.98)'
                    }
                  }}
                >
                  Career Guidance
                </ResponsiveButton>
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {/* Enhanced Mobile-Responsive Stats Cards */}
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }} sx={{ mb: { xs: 3, sm: 4, md: 5 } }}>
        <Grid item xs={6} sm={6} md={3}>
          <StatsCard elevation={3}>
            <School 
              color="primary" 
              sx={{ 
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                mb: { xs: 0.5, sm: 1 }
              }} 
            />
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 700,
                color: 'primary.main',
                mb: 0.5,
                fontSize: { xs: '1.5rem', sm: '1.8rem', md: '2.2rem' }
              }}
            >
              {dashboardData.stats.totalCourses}
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ 
                fontWeight: 500,
                fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
                textAlign: 'center',
                lineHeight: 1.2,
                px: { xs: 0.5, sm: 0 }
              }}
            >
              Enrolled Courses
            </Typography>
          </StatsCard>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <StatsCard elevation={3}>
            <Assignment 
              color="warning" 
              sx={{ 
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                mb: { xs: 0.5, sm: 1 }
              }} 
            />
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 700,
                color: 'warning.main',
                mb: 0.5,
                fontSize: { xs: '1.5rem', sm: '1.8rem', md: '2.2rem' }
              }}
            >
              {dashboardData.stats.upcomingAssessments}
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ 
                fontWeight: 500,
                fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
                textAlign: 'center',
                lineHeight: 1.2,
                px: { xs: 0.5, sm: 0 }
              }}
            >
              Pending Assessments
            </Typography>
          </StatsCard>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <StatsCard elevation={3}>
            <Quiz 
              color="secondary" 
              sx={{ 
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                mb: { xs: 0.5, sm: 1 }
              }} 
            />
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 700,
                color: 'secondary.main',
                mb: 0.5,
                fontSize: { xs: '1.5rem', sm: '1.8rem', md: '2.2rem' }
              }}
            >
              {dashboardData.stats.enhancedAssessments}
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ 
                fontWeight: 500,
                fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
                textAlign: 'center',
                lineHeight: 1.2,
                px: { xs: 0.5, sm: 0 }
              }}
            >
              Enhanced Tests
            </Typography>
          </StatsCard>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <StatsCard elevation={3}>
            <TrendingUp 
              color="success" 
              sx={{ 
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                mb: { xs: 0.5, sm: 1 }
              }} 
            />
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 700,
                color: 'success.main',
                mb: 0.5,
                fontSize: { xs: '1.5rem', sm: '1.8rem', md: '2.2rem' }
              }}
            >
              {dashboardData.stats.averageProgress}%
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ 
                fontWeight: 500,
                fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
                textAlign: 'center',
                lineHeight: 1.2,
                px: { xs: 0.5, sm: 0 }
              }}
            >
              Avg Progress
            </Typography>
          </StatsCard>
        </Grid>
      </Grid>

      {/* Enhanced Mobile-Responsive Main Content */}
      <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
        {/* My Courses - Full width on mobile, 8/12 on larger screens */}
        <Grid item xs={12} lg={8}>
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
                <ResponsiveButton 
                  size={buttonSize}
                  variant="outlined"
                  onClick={() => navigate('/courses')}
                  sx={{ 
                    minWidth: { xs: '100%', sm: 'auto' },
                    alignSelf: { xs: 'stretch', sm: 'auto' },
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    '&:hover': {
                      borderColor: 'primary.dark',
                      backgroundColor: 'primary.main',
                      color: 'white',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  View All Courses
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
                    onClick={() => navigate('/courses')}
                    size={buttonSize}
                  >
                    Browse Courses
                  </ResponsiveButton>
                </Box>
              ) : (
                <Stack spacing={{ xs: 2.5, sm: 2 }}>
                  {dashboardData.enrolledCourses.slice(0, 3).map((course, index) => {
                    const enrollment = dashboardData.enrollments.find(e => e.course._id === course._id);
                    return (
                      <Box key={course._id}>
                        <Stack 
                          direction={{ xs: 'column', sm: 'row' }} 
                          spacing={{ xs: 2, sm: 2 }}
                          alignItems={{ xs: 'stretch', sm: 'center' }}
                          sx={{
                            p: { xs: 2, sm: 0 },
                            borderRadius: { xs: 2, sm: 0 },
                            bgcolor: { xs: 'grey.50', sm: 'transparent' },
                            border: { xs: '1px solid', sm: 'none' },
                            borderColor: { xs: 'grey.200', sm: 'transparent' }
                          }}
                        >
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: { xs: 2, sm: 2 },
                            mb: { xs: 1, sm: 0 }
                          }}>
                            <Avatar
                              src={getCourseImageUrl(course)}
                              sx={{ 
                                width: { xs: 48, sm: 56 }, 
                                height: { xs: 48, sm: 56 },
                                flexShrink: 0
                              }}
                            >
                              <School />
                            </Avatar>
                            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                              <Typography 
                                variant={isMobile ? "subtitle1" : "subtitle1"} 
                                sx={{ 
                                  fontWeight: 600,
                                  mb: 0.5,
                                  fontSize: { xs: '0.95rem', sm: '1rem' },
                                  lineHeight: 1.3
                                }}
                              >
                                {course.title}
                              </Typography>
                              <Typography 
                                variant="body2" 
                                color="text.secondary"
                                sx={{ 
                                  mb: 1,
                                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                                  lineHeight: 1.4
                                }}
                              >
                                {course.instructor?.firstName} {course.instructor?.lastName} • {course.category}
                              </Typography>
                            </Box>
                          </Box>
                          
                          <Box sx={{ width: '100%' }}>
                            <Box sx={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center',
                              mb: 1
                            }}>
                              <Typography 
                                variant="caption" 
                                color="text.secondary"
                                sx={{ 
                                  fontSize: { xs: '0.75rem', sm: '0.8rem' },
                                  fontWeight: 500
                                }}
                              >
                                Progress
                              </Typography>
                              <Typography 
                                variant="caption" 
                                color="primary.main"
                                sx={{ 
                                  fontSize: { xs: '0.75rem', sm: '0.8rem' },
                                  fontWeight: 600
                                }}
                              >
                                {enrollment?.progress?.totalProgress || 0}%
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={enrollment?.progress?.totalProgress || 0}
                              sx={{ 
                                height: { xs: 8, sm: 8 },
                                borderRadius: 1,
                                backgroundColor: 'grey.200',
                                mb: { xs: 2, sm: 1 }
                              }}
                            />
                            <ResponsiveButton
                              size={buttonSize}
                              variant="contained"
                              onClick={() => navigate(`/course/${course._id}/hub`)}
                              sx={{ 
                                width: '100%',
                                fontSize: { xs: '0.85rem', sm: '0.9rem' },
                                py: { xs: 1, sm: 0.75 },
                                borderRadius: { xs: 2, sm: 1.5 },
                                textTransform: 'none',
                                fontWeight: 600
                              }}
                            >
                              Continue Learning
                            </ResponsiveButton>
                          </Box>
                        </Stack>
                        {index < Math.min(dashboardData.enrolledCourses.length - 1, 2) && (
                          <Divider sx={{ mt: { xs: 2, sm: 2 } }} />
                        )}
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </ResponsiveCardContent>
          </ResponsiveCard>
        </Grid>

        {/* Enhanced Mobile-Responsive Sidebar */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={{ xs: 2, sm: 3, md: 3 }}>
            {/* Upcoming Sessions */}
            <ResponsiveCard elevation={3}>
              <ResponsiveCardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
                <Typography 
                  variant={isMobile ? "h6" : "h5"} 
                  sx={{ 
                    fontWeight: 600,
                    color: 'primary.main',
                    mb: { xs: 2, sm: 3 },
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    fontSize: { xs: '1.1rem', sm: '1.25rem' }
                  }}
                >
                  <VideoCall sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
                  Upcoming Sessions
                </Typography>
                {dashboardData.upcomingSessions.length === 0 ? (
                  <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    py={{ xs: 2, sm: 2.5 }}
                    sx={{ color: 'text.secondary' }}
                  >
                    <VideoCall sx={{ fontSize: { xs: 32, sm: 36 }, mb: 1.5, opacity: 0.5 }} />
                    <Typography 
                      variant="body2" 
                      textAlign="center"
                      sx={{ fontSize: { xs: '0.85rem', sm: '0.9rem' } }}
                    >
                      No upcoming sessions
                    </Typography>
                  </Box>
                ) : (
                  <Stack spacing={1.5}>
                    {dashboardData.upcomingSessions.slice(0, 3).map((session, index) => (
                      <Box
                        key={session._id}
                        sx={{
                          p: { xs: 2, sm: 1.5 },
                          borderRadius: 2,
                          bgcolor: { xs: 'grey.50', sm: 'transparent' },
                          border: { xs: '1px solid', sm: 'none' },
                          borderColor: { xs: 'grey.200', sm: 'transparent' },
                          '&:hover': {
                            bgcolor: { xs: 'grey.100', sm: 'action.hover' }
                          },
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <Stack 
                          direction={{ xs: 'column', sm: 'row' }} 
                          spacing={{ xs: 1.5, sm: 1 }}
                          alignItems={{ xs: 'stretch', sm: 'center' }}
                        >
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: { xs: 1.5, sm: 1 },
                            mb: { xs: 1, sm: 0 }
                          }}>
                            <Avatar sx={{ 
                              bgcolor: 'info.main',
                              width: { xs: 36, sm: 32 },
                              height: { xs: 36, sm: 32 }
                            }}>
                              <VideoCall sx={{ fontSize: { xs: '1.1rem', sm: '1rem' } }} />
                            </Avatar>
                            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                              <Typography 
                                variant="subtitle2" 
                                sx={{ 
                                  fontWeight: 600,
                                  fontSize: { xs: '0.9rem', sm: '0.875rem' },
                                  lineHeight: 1.3,
                                  mb: 0.5
                                }}
                              >
                                {session.title}
                              </Typography>
                              <Typography 
                                variant="caption" 
                                color="text.secondary"
                                sx={{ 
                                  fontSize: { xs: '0.75rem', sm: '0.7rem' },
                                  display: 'block'
                                }}
                              >
                                {new Date(session.scheduledTime).toLocaleString()}
                              </Typography>
                            </Box>
                          </Box>
                          
                          <ResponsiveButton
                            size="small"
                            variant="contained"
                            startIcon={<PlayArrow sx={{ fontSize: { xs: '1rem', sm: '0.9rem' } }} />}
                            onClick={() => navigate(`/dashboard/student/live-sessions/${session._id}/room`)}
                            sx={{ 
                              width: { xs: '100%', sm: 'auto' },
                              fontSize: { xs: '0.8rem', sm: '0.75rem' },
                              py: { xs: 0.75, sm: 0.5 },
                              px: { xs: 2, sm: 1.5 },
                              borderRadius: { xs: 2, sm: 1.5 },
                              textTransform: 'none',
                              fontWeight: 600,
                              minHeight: { xs: '36px', sm: '32px' }
                            }}
                          >
                            Join
                          </ResponsiveButton>
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                )}
              </ResponsiveCardContent>
            </ResponsiveCard>
          </Stack>
        </Grid>

        {/* Recorded Sessions - Full Width Section */}
        <Grid item xs={12}>
          <ResponsiveCard elevation={3}>
            <ResponsiveCardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
              <Typography 
                variant={isMobile ? "h6" : "h5"} 
                sx={{ 
                  fontWeight: 600,
                  color: 'primary.main',
                  mb: { xs: 2, sm: 3 },
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <PlayArrow sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
                Recorded Sessions
              </Typography>
              <RecordedSessions maxItems={6} />
            </ResponsiveCardContent>
          </ResponsiveCard>
        </Grid>

        {/* Enhanced Mobile-Responsive Job Portal Section */}
        <Grid item xs={12} sx={{ mt: { xs: 3, sm: 4 } }}>
          <Paper 
            elevation={4}
            sx={{ 
              p: { xs: 2.5, sm: 3, md: 4 },
              borderRadius: { xs: 2, sm: 3 },
              background: 'linear-gradient(135deg, #6a1b9a08, #4a148c15)',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, #6a1b9a, #4a148c)',
              }
            }}
          >
            <Grid container spacing={{ xs: 2, sm: 3 }} alignItems="center">
              <Grid item xs={12} md={7}>
                <Typography 
                  variant={isMobile ? "h6" : "h4"} 
                  component="h2" 
                  sx={{ 
                    fontWeight: 700,
                    color: '#6a1b9a',
                    mb: { xs: 1.5, sm: 2 },
                    fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' },
                    lineHeight: 1.3
                  }}
                >
                  Ready to Start Your Career Journey?
                </Typography>
                <Typography 
                  variant="body2" 
                  paragraph 
                  sx={{ 
                    mb: { xs: 2, sm: 3 },
                    fontSize: { xs: '0.9rem', sm: '1rem' },
                    lineHeight: 1.6
                  }}
                >
                  As a student of Excellence Coaching Hub, you have exclusive access to our Job Portal. 
                  Find internships, part-time positions, and full-time career opportunities that match your skills and interests.
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: { xs: 1, sm: 1.5 }, 
                  mb: { xs: 2, sm: 3 },
                  justifyContent: { xs: 'center', md: 'flex-start' }
                }}>
                  <Chip 
                    icon={<School sx={{ fontSize: { xs: '1rem', sm: '1.1rem' } }} />} 
                    label="Student-Friendly Jobs" 
                    sx={{ 
                      bgcolor: '#f3e5f5', 
                      color: '#6a1b9a',
                      fontSize: { xs: '0.75rem', sm: '0.8rem' },
                      height: { xs: 28, sm: 32 }
                    }}
                  />
                  <Chip 
                    icon={<Assignment sx={{ fontSize: { xs: '1rem', sm: '1.1rem' } }} />} 
                    label="Internship Opportunities" 
                    sx={{ 
                      bgcolor: '#f3e5f5', 
                      color: '#6a1b9a',
                      fontSize: { xs: '0.75rem', sm: '0.8rem' },
                      height: { xs: 28, sm: 32 }
                    }}
                  />
                  <Chip 
                    icon={<EmojiEvents sx={{ fontSize: { xs: '1rem', sm: '1.1rem' } }} />} 
                    label="Career Development" 
                    sx={{ 
                      bgcolor: '#f3e5f5', 
                      color: '#6a1b9a',
                      fontSize: { xs: '0.75rem', sm: '0.8rem' },
                      height: { xs: 28, sm: 32 }
                    }}
                  />
                </Box>
                <Stack 
                  direction={{ xs: 'column', sm: 'row' }} 
                  spacing={{ xs: 1.5, sm: 2 }}
                  sx={{ 
                    alignItems: { xs: 'stretch', sm: 'center' },
                    justifyContent: { xs: 'center', md: 'flex-start' }
                  }}
                >
                  <Button 
                    variant="contained" 
                    size={buttonSize}
                    sx={{ 
                      bgcolor: '#6a1b9a', 
                      '&:hover': { bgcolor: '#4a148c' },
                      px: { xs: 3, sm: 4 },
                      py: { xs: 1.25, sm: 1.5 },
                      fontSize: { xs: '0.9rem', sm: '1rem' },
                      fontWeight: 600,
                      borderRadius: { xs: 2, sm: 2.5 },
                      textTransform: 'none',
                      minHeight: { xs: '44px', sm: '40px' }
                    }}
                    onClick={() => window.open('/job-portal/app/dashboard', '_blank')}
                  >
                    Explore Job Portal
                  </Button>
                  <Button 
                    variant="outlined" 
                    size={buttonSize}
                    sx={{ 
                      borderColor: '#6a1b9a', 
                      color: '#6a1b9a',
                      '&:hover': { 
                        borderColor: '#4a148c', 
                        color: '#4a148c',
                        bgcolor: '#f3e5f5'
                      },
                      px: { xs: 3, sm: 4 },
                      py: { xs: 1.25, sm: 1.5 },
                      fontSize: { xs: '0.9rem', sm: '1rem' },
                      fontWeight: 600,
                      borderRadius: { xs: 2, sm: 2.5 },
                      textTransform: 'none',
                      minHeight: { xs: '44px', sm: '40px' }
                    }}
                    onClick={() => window.open('/job-portal/app/profile', '_blank')}
                  >
                    Complete Job Profile
                  </Button>
                </Stack>
              </Grid>
              <Grid item xs={12} md={5} sx={{ 
                display: 'flex', 
                justifyContent: 'center',
                alignItems: 'center',
                mt: { xs: 2, md: 0 }
              }}>
                <Box 
                  component="img"
                  src="/assets/images/job-portal-promo.png"
                  alt="Job Portal"
                  sx={{ 
                    maxWidth: '100%',
                    height: 'auto',
                    maxHeight: { xs: '180px', sm: '220px', md: '280px' },
                    borderRadius: { xs: 1.5, sm: 2 },
                    boxShadow: { xs: 2, sm: 3 },
                    display: { xs: 'block', sm: 'block' }
                  }}
                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                    // Fallback if image doesn't exist
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
      
    </ResponsiveDashboard>
  );
};

export default StudentDashboard;

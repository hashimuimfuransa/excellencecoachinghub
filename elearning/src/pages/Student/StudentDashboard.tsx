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
import CareerGuidancePopup from '../../components/Career/CareerGuidancePopup';
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
  
  // Career guidance popup state
  const [showCareerPopup, setShowCareerPopup] = useState(false);
  const [hasCheckedCareerTest, setHasCheckedCareerTest] = useState(false);

  // Fetch dashboard data with rate limiting protection
  const fetchDashboardData = async () => {
    if (!user || user.role !== 'student') return;

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
        sessionsResult
      ] = await Promise.allSettled([
        courseService.getEnrolledCourses({ limit: 10 }),
        enrollmentService.getMyEnrollments({ limit: 10 }),
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

      // Check if student has no enrolled courses - redirect to course enrollment
      if (totalCourses === 0 && enrollments.length === 0) {
        navigate('/courses');
        return;
      }

      // Check if all requests failed (excluding rate limiting errors)
      const allFailed = [
        coursesResult,
        enrollmentsResult,
        assessmentsResult,
        enhancedAssessmentsResult,
        sessionsResult
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

  // Check for career test completion and show popup
  useEffect(() => {
    const checkCareerTestStatus = async () => {
      if (!user || user.role !== 'student' || hasCheckedCareerTest) return;
      
      // Check if user has dismissed the popup in this session
      const dismissedInSession = sessionStorage.getItem('careerPopupDismissed');
      if (dismissedInSession) {
        setHasCheckedCareerTest(true);
        return;
      }

      try {
        const hasCompletedTest = await careerGuidanceService.checkHasCompletedCareerTest();
        
        // Only show popup if user hasn't completed career test and has some courses enrolled
        if (!hasCompletedTest && dashboardData?.stats.totalCourses > 0) {
          // Add a slight delay to ensure dashboard has loaded
          setTimeout(() => {
            setShowCareerPopup(true);
            setHasCheckedCareerTest(true);
          }, 2000);
        } else {
          setHasCheckedCareerTest(true);
        }
      } catch (error) {
        console.error('Error checking career test status:', error);
        setHasCheckedCareerTest(true);
      }
    };

    if (dashboardData && !loading && !error) {
      checkCareerTestStatus();
    }
  }, [user, dashboardData, loading, error, hasCheckedCareerTest]);

  const handleCareerPopupClose = () => {
    setShowCareerPopup(false);
    sessionStorage.setItem('careerPopupDismissed', 'true');
  };

  const handleTakeCareerTest = () => {
    navigate('/dashboard/student/career');
  };

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
                  onClick={() => navigate('/dashboard/student/courses')}
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

      {/* Stats Cards */}
      <Grid container spacing={{ xs: 2, sm: 3, md: 4 }} sx={{ mb: { xs: 3, sm: 4, md: 5 } }}>
        <Grid item xs={6} sm={3} md={3}>
          <StatsCard elevation={3}>
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
              {dashboardData.stats.totalCourses}
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{ 
                fontWeight: 500,
                fontSize: { xs: '0.875rem', sm: '1rem' },
                textAlign: 'center',
                lineHeight: 1.2
              }}
            >
              Enrolled Courses
            </Typography>
          </StatsCard>
        </Grid>

        <Grid item xs={6} sm={3} md={3}>
          <StatsCard elevation={3}>
            <Assignment 
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
              {dashboardData.stats.upcomingAssessments}
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{ 
                fontWeight: 500,
                fontSize: { xs: '0.875rem', sm: '1rem' },
                textAlign: 'center',
                lineHeight: 1.2
              }}
            >
              Pending Assessments
            </Typography>
          </StatsCard>
        </Grid>

        <Grid item xs={6} sm={3} md={3}>
          <StatsCard elevation={3}>
            <Quiz 
              color="secondary" 
              sx={{ 
                fontSize: { xs: '2.5rem', sm: '3rem', md: '3.5rem' },
                mb: { xs: 1, sm: 1.5 }
              }} 
            />
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 700,
                color: 'secondary.main',
                mb: 0.5,
                fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.5rem' }
              }}
            >
              {dashboardData.stats.enhancedAssessments}
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{ 
                fontWeight: 500,
                fontSize: { xs: '0.875rem', sm: '1rem' },
                textAlign: 'center',
                lineHeight: 1.2
              }}
            >
              Enhanced Tests
            </Typography>
          </StatsCard>
        </Grid>

        <Grid item xs={6} sm={3} md={3}>
          <StatsCard elevation={3}>
            <TrendingUp 
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
              {dashboardData.stats.averageProgress}%
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{ 
                fontWeight: 500,
                fontSize: { xs: '0.875rem', sm: '1rem' },
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
      <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
        {/* My Courses */}
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
                  onClick={() => navigate('/dashboard/student/courses')}
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
                            onClick={() => navigate(`/course/${course._id}/learn`)}
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
                    gap: 1
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

        {/* Job Portal Integration Section */}
        <Grid item xs={12} sx={{ mt: 4 }}>
          <Paper 
            elevation={4}
            sx={{ 
              p: { xs: 3, sm: 4 },
              borderRadius: 3,
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
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={7}>
                <Typography 
                  variant={isMobile ? "h5" : "h4"} 
                  component="h2" 
                  sx={{ 
                    fontWeight: 700,
                    color: '#6a1b9a',
                    mb: 2
                  }}
                >
                  Ready to Start Your Career Journey?
                </Typography>
                <Typography variant="body1" paragraph sx={{ mb: 3 }}>
                  As a student of Excellence Coaching Hub, you have exclusive access to our Job Portal. 
                  Find internships, part-time positions, and full-time career opportunities that match your skills and interests.
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                  <Chip 
                    icon={<School />} 
                    label="Student-Friendly Jobs" 
                    sx={{ bgcolor: '#f3e5f5', color: '#6a1b9a' }}
                  />
                  <Chip 
                    icon={<Assignment />} 
                    label="Internship Opportunities" 
                    sx={{ bgcolor: '#f3e5f5', color: '#6a1b9a' }}
                  />
                  <Chip 
                    icon={<EmojiEvents />} 
                    label="Career Development" 
                    sx={{ bgcolor: '#f3e5f5', color: '#6a1b9a' }}
                  />
                </Box>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Button 
                    variant="contained" 
                    size={buttonSize}
                    sx={{ 
                      bgcolor: '#6a1b9a', 
                      '&:hover': { bgcolor: '#4a148c' },
                      px: { xs: 3, sm: 4 },
                      py: { xs: 1, sm: 1.5 }
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
                      '&:hover': { borderColor: '#4a148c', color: '#4a148c' },
                      px: { xs: 3, sm: 4 },
                      py: { xs: 1, sm: 1.5 }
                    }}
                    onClick={() => window.open('/job-portal/app/profile', '_blank')}
                  >
                    Complete Job Profile
                  </Button>
                </Stack>
              </Grid>
              <Grid item xs={12} md={5} sx={{ display: 'flex', justifyContent: 'center' }}>
                <Box 
                  component="img"
                  src="/assets/images/job-portal-promo.png"
                  alt="Job Portal"
                  sx={{ 
                    maxWidth: '100%',
                    height: 'auto',
                    maxHeight: { xs: '200px', sm: '250px', md: '300px' },
                    borderRadius: 2,
                    boxShadow: 3,
                    display: { xs: 'none', sm: 'block' }
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
      
      {/* Career Guidance Popup */}
      <CareerGuidancePopup
        open={showCareerPopup}
        onClose={handleCareerPopupClose}
        onTakeCareerTest={handleTakeCareerTest}
        userFirstName={user?.firstName}
      />
    </ResponsiveDashboard>
  );
};

export default StudentDashboard;

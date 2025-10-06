import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  Avatar,
  Paper,
  Divider,
  LinearProgress,
  Container,
  AppBar,
  Toolbar,
  IconButton,
  Fab,
  Zoom,
  useTheme,
  useMediaQuery,
  styled,
  Stack,
  Badge,
  Tooltip
} from '@mui/material';
import {
  ArrowBack,
  MenuBook,
  VideoCall,
  Assignment,
  Quiz,
  Announcement,
  Schedule,
  Person,
  PlayArrow,
  CheckCircle,
  RadioButtonUnchecked,
  School,
  LiveTv,
  NotificationsActive,
  Star,
  EmojiEvents,
  TrendingUp,
  Psychology,
  AutoAwesome,
  Lightbulb,
  Speed,
  BookmarkBorder,
  Bookmark,
  Share,
  Print,
  Fullscreen,
  Home,
  Dashboard,
  Celebration,
  LocalFireDepartment,
  Diamond
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { courseService, ICourse } from '../../services/courseService';
import { enrollmentService } from '../../services/enrollmentService';
import { assessmentService } from '../../services/assessmentService';
import { announcementService } from '../../services/announcementService';
import { liveSessionService, ILiveSession } from '../../services/liveSessionService';
import { progressService } from '../../services/progressService';

// Styled components for enhanced UI
const GradientBackground = styled(Box)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main}15, ${theme.palette.secondary.main}15)`,
  minHeight: '100vh',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '300px',
    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    zIndex: -1,
  }
}));

const FloatingCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(3),
  boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 30px 60px rgba(0,0,0,0.15)',
  }
}));

const ActionCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  cursor: 'pointer',
  transition: 'all 0.3s ease-in-out',
  background: `linear-gradient(135deg, ${theme.palette.background.paper}, ${theme.palette.grey[50]})`,
  border: `2px solid transparent`,
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
    borderColor: theme.palette.primary.main,
    background: `linear-gradient(135deg, ${theme.palette.primary.light}10, ${theme.palette.secondary.light}10)`,
  }
}));

const StatsChip = styled(Chip)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  fontWeight: 600,
  padding: theme.spacing(0.5, 1),
  '& .MuiChip-icon': {
    fontSize: '1.2rem',
  }
}));

interface CourseStats {
  totalNotes: number;
  completedNotes: number;
  totalAssignments: number;
  completedAssignments: number;
  totalQuizzes: number;
  completedQuizzes: number;
  upcomingLiveSessions: number;
  unreadAnnouncements: number;
}

const EnhancedCourseViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State management
  const [course, setCourse] = useState<ICourse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollmentDetails, setEnrollmentDetails] = useState<any>(null);
  const [courseStats, setCourseStats] = useState<CourseStats>({
    totalNotes: 0,
    completedNotes: 0,
    totalAssignments: 0,
    completedAssignments: 0,
    totalQuizzes: 0,
    completedQuizzes: 0,
    upcomingLiveSessions: 0,
    unreadAnnouncements: 0
  });
  const [recentAnnouncements, setRecentAnnouncements] = useState<any[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<ILiveSession[]>([]);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  // Load course data and stats
  useEffect(() => {
    const loadCourseData = async () => {
      if (!user || !id) {
        setError('Please log in to access course content');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Load course details
        const courseData = await courseService.getPublicCourseById(id);
        setCourse(courseData);

        // Check if student is enrolled
        if (user.role === 'student') {
          try {
            const enrollmentData = await enrollmentService.getEnrollmentDetailsQuietly(id);
            const enrolled = !!enrollmentData;
            setIsEnrolled(enrolled);
            setEnrollmentDetails(enrollmentData);

            if (enrolled) {
              // Load course statistics
              await loadCourseStats();
              await loadRecentAnnouncements();
              await loadUpcomingSessions();
            }
          } catch (enrollmentError: any) {
            console.error('Enrollment check failed:', enrollmentError);
            setIsEnrolled(false);
          }
        } else {
          setError('Only enrolled students can access course content');
        }
      } catch (err: any) {
        console.error('Course data loading failed:', err);
        setError(err.message || 'Failed to load course data');
      } finally {
        setLoading(false);
      }
    };

    loadCourseData();
  }, [id, user]);

  // Load course statistics
  const loadCourseStats = async () => {
    if (!id) return;

    try {
      // Get progress data
      const progressData = await progressService.getCourseProgressQuietly(id);
      
      // Get assessments
      const assessments = await assessmentService.getCourseAssessments(id);
      
      // Get live sessions
      const sessions = await liveSessionService.getCourseSessions(id);
      
      // Get announcements
      const announcements = await announcementService.getCourseAnnouncements(id);

      // Calculate stats
      const assessmentsArray = Array.isArray(assessments) ? assessments : [];
      const sessionsArray = Array.isArray(sessions) ? sessions : [];
      const announcementsArray = Array.isArray(announcements) ? announcements : [];
      const courseContentArray = Array.isArray(course?.content) ? course.content : [];
      
      const stats: CourseStats = {
        totalNotes: courseContentArray.filter(c => c.type === 'document').length || 0,
        completedNotes: progressData?.completedLessons?.length || 0,
        totalAssignments: assessmentsArray.filter((a: any) => a.type === 'assignment').length || 0,
        completedAssignments: 0,
        totalQuizzes: assessmentsArray.filter((a: any) => a.type === 'quiz').length || 0,
        completedQuizzes: 0,
        upcomingLiveSessions: sessionsArray.filter((s: any) => 
          s.status === 'scheduled' && new Date(s.scheduledTime) > new Date()
        ).length || 0,
        unreadAnnouncements: announcementsArray.filter((a: any) => !a.isRead).length || 0
      };

      setCourseStats(stats);
    } catch (error) {
      console.error('Failed to load course stats:', error);
    }
  };

  // Load recent announcements
  const loadRecentAnnouncements = async () => {
    if (!id) return;

    try {
      const announcements = await announcementService.getCourseAnnouncements(id, 3);
      setRecentAnnouncements(announcements || []);
    } catch (error) {
      console.error('Failed to load announcements:', error);
    }
  };

  // Load upcoming sessions
  const loadUpcomingSessions = async () => {
    if (!id) return;

    try {
      const sessions = await liveSessionService.getCourseSessions(id);
      const sessionsArray = Array.isArray(sessions) ? sessions : [];
      const upcoming = sessionsArray.filter((s: any) => 
        s.status === 'scheduled' && new Date(s.scheduledTime) > new Date()
      ).slice(0, 3);
      setUpcomingSessions(upcoming);
    } catch (error) {
      console.error('Failed to load upcoming sessions:', error);
    }
  };

  // Calculate overall progress
  const getOverallProgress = () => {
    const totalItems = courseStats.totalNotes + courseStats.totalAssignments + courseStats.totalQuizzes;
    const completedItems = courseStats.completedNotes + courseStats.completedAssignments + courseStats.completedQuizzes;
    return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  };

  // Navigation handlers
  const handleNotesView = () => {
    navigate(`/dashboard/student/course/${id}/material`);
  };

  const handleLiveSessionsView = () => {
    navigate('/live-sessions');
  };

  const handleAssignmentsView = () => {
    navigate(`/course/${id}/assignments`);
  };

  const handleAssessmentsView = () => {
    navigate(`/course/${id}/assessments`);
  };

  const handleAnnouncementsView = () => {
    navigate(`/dashboard/student/course/${id}/announcements`);
  };

  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
  };

  const handleEnroll = async () => {
    if (!id) return;
    
    try {
      setEnrolling(true);
      await enrollmentService.enrollInCourse(id);
      setIsEnrolled(true);
      // Reload the page data
      window.location.reload();
    } catch (err: any) {
      setError(err.message || 'Failed to enroll in course');
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <GradientBackground>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <CircularProgress size={60} thickness={4} />
          <Typography variant="h6" sx={{ ml: 2, color: 'white' }}>
            Loading your course...
          </Typography>
        </Box>
      </GradientBackground>
    );
  }

  if (error || !course) {
    return (
      <GradientBackground>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error || 'Course not found'}
          </Alert>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/courses')}
            variant="contained"
            sx={{ borderRadius: 2 }}
          >
            Back to My Courses
          </Button>
        </Container>
      </GradientBackground>
    );
  }

  if (!isEnrolled) {
    return (
      <GradientBackground>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
            You need to be enrolled in this course to access the content.
          </Alert>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              onClick={handleEnroll}
              variant="contained"
              disabled={enrolling}
              startIcon={enrolling ? <CircularProgress size={20} /> : <School />}
              sx={{ borderRadius: 2 }}
            >
              {enrolling ? 'Enrolling...' : 'Enroll in Course'}
            </Button>
            <Button
              onClick={() => navigate('/courses')}
              variant="outlined"
              sx={{ borderRadius: 2 }}
            >
              Browse All Courses
            </Button>
          </Box>
        </Container>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      {/* Custom App Bar */}
      <AppBar position="fixed" sx={{ bgcolor: 'transparent', backdropFilter: 'blur(10px)' }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate('/courses')}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {course.title}
          </Typography>
          <IconButton color="inherit" onClick={() => navigate('/dashboard')}>
            <Dashboard />
          </IconButton>
          <IconButton color="inherit" onClick={() => navigate('/')}>
            <Home />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ pt: 12, pb: isMobile ? 12 : 4 }}>
        {/* Course Header */}
        <FloatingCard sx={{ mb: 4, bgcolor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)' }}>
          <CardContent sx={{ p: 4 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={8}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    sx={{ 
                      width: 80, 
                      height: 80, 
                      bgcolor: 'primary.main',
                      mr: 3,
                      boxShadow: 3
                    }}
                  >
                    <School sx={{ fontSize: 40 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h3" gutterBottom sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {course.title}
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                      with {course.instructor?.firstName} {course.instructor?.lastName}
                    </Typography>
                  </Box>
                </Box>

                <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.6 }}>
                  {course.description}
                </Typography>

                <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
                  <StatsChip 
                    label={course.category} 
                    color="primary" 
                    icon={<School />}
                  />
                  <StatsChip 
                    label={course.level} 
                    color="secondary" 
                    icon={<TrendingUp />}
                  />
                  <StatsChip 
                    label={`${course.duration}h`} 
                    color="info" 
                    icon={<Schedule />}
                  />
                </Stack>

                {/* Progress Section */}
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Your Progress
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {getOverallProgress()}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={getOverallProgress()} 
                    sx={{ 
                      height: 12, 
                      borderRadius: 6,
                      bgcolor: 'grey.200',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 6,
                        background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                      }
                    }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Enrolled: {new Date(enrollmentDetails?.enrollmentDate || enrollmentDetails?.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" gutterBottom>
                    Course Stats
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
                        <Typography variant="h4" color="primary.main" sx={{ fontWeight: 700 }}>
                          {courseStats.completedNotes}
                        </Typography>
                        <Typography variant="caption">Notes Read</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
                        <Typography variant="h4" color="secondary.main" sx={{ fontWeight: 700 }}>
                          {courseStats.upcomingLiveSessions}
                        </Typography>
                        <Typography variant="caption">Live Sessions</Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </FloatingCard>

        {/* Learning Paths */}
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'white', mb: 4, textAlign: 'center' }}>
          🚀 Choose Your Learning Adventure
        </Typography>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Enhanced Course Material Path */}
          <Grid item xs={12} md={6}>
            <Card 
              onClick={handleNotesView}
              sx={{ 
                cursor: 'pointer',
                borderRadius: 4,
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 20px 40px rgba(102, 126, 234, 0.3)',
                '&:hover': {
                  transform: 'translateY(-12px) scale(1.02)',
                  boxShadow: '0 30px 60px rgba(102, 126, 234, 0.4)',
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                  opacity: 0,
                  transition: 'opacity 0.3s ease',
                },
                '&:hover::before': {
                  opacity: 1
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: -50,
                  right: -50,
                  width: 100,
                  height: 100,
                  background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
                  borderRadius: '50%',
                  transition: 'all 0.3s ease',
                },
                '&:hover::after': {
                  transform: 'scale(1.5)',
                  opacity: 0.8
                }
              }}
            >
              <CardContent sx={{ textAlign: 'center', py: 5, position: 'relative', zIndex: 1 }}>
                <Box sx={{ position: 'relative', mb: 3 }}>
                  <Box sx={{ 
                    display: 'inline-flex',
                    p: 3,
                    borderRadius: '50%',
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    mb: 2
                  }}>
                    <MenuBook sx={{ fontSize: 60, color: 'white' }} />
                  </Box>
                  <Zoom in={true}>
                    <Fab
                      size="small"
                      sx={{ 
                        position: 'absolute', 
                        top: -5, 
                        right: -5,
                        bgcolor: 'rgba(255, 255, 255, 0.9)',
                        color: 'primary.main',
                        '&:hover': {
                          bgcolor: 'white'
                        }
                      }}
                    >
                      <AutoAwesome />
                    </Fab>
                  </Zoom>
                </Box>
                
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'white', mb: 2 }}>
                  📚 Course Material
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.9)', mb: 3, px: 2, fontSize: '1.1rem' }}>
                  Dive into comprehensive course materials with advanced reading features, voice narration, and interactive learning tools
                </Typography>
                
                {/* Price Display */}
                {course?.notesPrice !== undefined && course.notesPrice > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Chip
                      label={`$${course.notesPrice.toFixed(2)}`}
                      sx={{ 
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        px: 2,
                        py: 1,
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        backdropFilter: 'blur(10px)'
                      }}
                    />
                  </Box>
                )}
                
                <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 4, flexWrap: 'wrap', gap: 1 }}>
                  <Chip 
                    label={`${courseStats.completedNotes}/${courseStats.totalNotes} Sections`}
                    icon={courseStats.completedNotes === courseStats.totalNotes ? <CheckCircle /> : <RadioButtonUnchecked />}
                    sx={{
                      bgcolor: courseStats.completedNotes === courseStats.totalNotes ? 'rgba(76, 175, 80, 0.9)' : 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      fontWeight: 600,
                      '& .MuiChip-icon': { color: 'white' }
                    }}
                  />
                  <Chip 
                    label="Voice Reader" 
                    icon={<Psychology />}
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      fontWeight: 600,
                      '& .MuiChip-icon': { color: 'white' }
                    }}
                  />
                </Stack>
                
                <Button 
                  variant="contained" 
                  size="large"
                  startIcon={<PlayArrow />}
                  sx={{ 
                    borderRadius: 4,
                    px: 5,
                    py: 2,
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    textTransform: 'none',
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    backdropFilter: 'blur(10px)',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.3)',
                      transform: 'scale(1.05)',
                      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3)',
                    },
                  }}
                >
                  Start Learning
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Enhanced Live Sessions Path */}
          <Grid item xs={12} md={6}>
            <Card 
              onClick={handleLiveSessionsView}
              sx={{ 
                cursor: 'pointer',
                borderRadius: 4,
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 20px 40px rgba(255, 107, 107, 0.3)',
                '&:hover': {
                  transform: 'translateY(-12px) scale(1.02)',
                  boxShadow: '0 30px 60px rgba(255, 107, 107, 0.4)',
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                  opacity: 0,
                  transition: 'opacity 0.3s ease',
                },
                '&:hover::before': {
                  opacity: 1
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: -50,
                  right: -50,
                  width: 100,
                  height: 100,
                  background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
                  borderRadius: '50%',
                  transition: 'all 0.3s ease',
                },
                '&:hover::after': {
                  transform: 'scale(1.5)',
                  opacity: 0.8
                }
              }}
            >
              <CardContent sx={{ textAlign: 'center', py: 5, position: 'relative', zIndex: 1 }}>
                <Box sx={{ position: 'relative', mb: 3 }}>
                  <Box sx={{ 
                    display: 'inline-flex',
                    p: 3,
                    borderRadius: '50%',
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    mb: 2
                  }}>
                    <VideoCall sx={{ fontSize: 60, color: 'white' }} />
                  </Box>
                  <Zoom in={true}>
                    <Fab
                      size="small"
                      sx={{ 
                        position: 'absolute', 
                        top: -5, 
                        right: -5,
                        bgcolor: 'rgba(255, 255, 255, 0.9)',
                        color: 'error.main',
                        '&:hover': {
                          bgcolor: 'white'
                        }
                      }}
                    >
                      <LiveTv />
                    </Fab>
                  </Zoom>
                </Box>
                
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'white', mb: 2 }}>
                  🎥 Live Sessions
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.9)', mb: 3, px: 2, fontSize: '1.1rem' }}>
                  Join interactive live classes, participate in real-time discussions, and connect with your instructor
                </Typography>
                
                {/* Price Display */}
                {course?.liveSessionPrice !== undefined && course.liveSessionPrice > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Chip
                      label={`$${course.liveSessionPrice.toFixed(2)}`}
                      sx={{ 
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        px: 2,
                        py: 1,
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        backdropFilter: 'blur(10px)'
                      }}
                    />
                  </Box>
                )}
                
                <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 4, flexWrap: 'wrap', gap: 1 }}>
                  <Chip 
                    label={`${courseStats.upcomingLiveSessions} Upcoming`}
                    icon={<Schedule />}
                    sx={{
                      bgcolor: courseStats.upcomingLiveSessions > 0 ? 'rgba(76, 175, 80, 0.9)' : 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      fontWeight: 600,
                      '& .MuiChip-icon': { color: 'white' }
                    }}
                  />
                  <Chip 
                    label="HD Quality" 
                    icon={<Diamond />}
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      fontWeight: 600,
                      '& .MuiChip-icon': { color: 'white' }
                    }}
                  />
                </Stack>
                
                <Button 
                  variant="contained" 
                  size="large"
                  startIcon={<VideoCall />}
                  sx={{ 
                    borderRadius: 4,
                    px: 5,
                    py: 2,
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    textTransform: 'none',
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    backdropFilter: 'blur(10px)',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.3)',
                      transform: 'scale(1.05)',
                      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3)',
                    },
                  }}
                >
                  Join Sessions
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Mobile-First Assessment Section */}
        {isMobile && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, color: 'white', mb: 3, textAlign: 'center' }}>
              📝 Take Assessments
            </Typography>
            
            {/* Assessment Info Card */}
            <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Quiz sx={{ fontSize: 60, color: 'warning.main', mb: 2 }} />
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                  Assessments Available
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Test your knowledge with quizzes and exams
                </Typography>
                <Badge badgeContent={courseStats.totalQuizzes} color="warning" sx={{ mb: 2 }}>
                  <Chip 
                    label={`${courseStats.totalQuizzes} Available`} 
                    color="warning" 
                    size="large"
                    sx={{ fontSize: '1rem', py: 2 }}
                  />
                </Badge>
              </CardContent>
            </Card>

            {/* Clear Start Button Below Card */}
            <Box sx={{ px: 2 }}>
              <Button 
                variant="contained" 
                size="large"
                startIcon={<Quiz />}
                fullWidth
                onClick={handleAssessmentsView}
                sx={{ 
                  borderRadius: 4,
                  py: 2.5,
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  textTransform: 'none',
                  background: `linear-gradient(45deg, ${theme.palette.warning.main}, ${theme.palette.warning.dark})`,
                  boxShadow: '0 8px 24px rgba(255, 152, 0, 0.4)',
                  '&:hover': {
                    background: `linear-gradient(45deg, ${theme.palette.warning.dark}, ${theme.palette.warning.main})`,
                    boxShadow: '0 12px 32px rgba(255, 152, 0, 0.6)',
                    transform: 'translateY(-2px)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                🚀 Start Assessment Now
              </Button>
            </Box>
          </Box>
        )}

        {/* Mobile Assessment Call-to-Action */}
        {isMobile && (
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'white', mb: 2 }}>
              Ready to Test Your Knowledge? 🎯
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', mb: 4, fontSize: '1.1rem' }}>
              Take assessments to evaluate your understanding and track your progress
            </Typography>
            
            <Box sx={{ maxWidth: 400, mx: 'auto' }}>
              <Button 
                variant="contained" 
                size="large"
                startIcon={<Quiz />}
                fullWidth
                onClick={handleAssessmentsView}
                sx={{ 
                  borderRadius: 5,
                  py: 3,
                  fontSize: '1.3rem',
                  fontWeight: 800,
                  textTransform: 'none',
                  background: `linear-gradient(135deg, ${theme.palette.warning.main}, ${theme.palette.error.main})`,
                  boxShadow: '0 12px 40px rgba(255, 152, 0, 0.5)',
                  border: '2px solid rgba(255,255,255,0.2)',
                  '&:hover': {
                    background: `linear-gradient(135deg, ${theme.palette.error.main}, ${theme.palette.warning.main})`,
                    boxShadow: '0 16px 48px rgba(255, 152, 0, 0.7)',
                    transform: 'translateY(-4px) scale(1.02)'
                  },
                  transition: 'all 0.4s ease'
                }}
              >
                🏆 Start Assessment
              </Button>
            </Box>
          </Box>
        )}

        {/* Additional Learning Options */}
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <ActionCard onClick={handleAssessmentsView} sx={{ height: '100%', display: isMobile ? 'none' : 'block' }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Quiz sx={{ fontSize: 50, color: 'warning.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  📝 Assessments
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Test your knowledge
                </Typography>
                <Badge badgeContent={courseStats.totalQuizzes} color="warning" sx={{ mt: 2 }}>
                  <Button size="small" variant="outlined">View All</Button>
                </Badge>
              </CardContent>
            </ActionCard>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <ActionCard onClick={handleAssignmentsView} sx={{ height: '100%' }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Assignment sx={{ fontSize: 50, color: 'info.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  📋 Assignments
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Complete tasks
                </Typography>
                <Badge badgeContent={courseStats.totalAssignments} color="info" sx={{ mt: 2 }}>
                  <Button size="small" variant="outlined">View All</Button>
                </Badge>
              </CardContent>
            </ActionCard>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <ActionCard onClick={handleAnnouncementsView} sx={{ height: '100%' }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Announcement sx={{ fontSize: 50, color: 'success.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  📢 Announcements
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Stay updated
                </Typography>
                <Badge badgeContent={courseStats.unreadAnnouncements} color="error" sx={{ mt: 2 }}>
                  <Button size="small" variant="outlined">View All</Button>
                </Badge>
              </CardContent>
            </ActionCard>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <ActionCard onClick={() => navigate('/dashboard/student/progress')} sx={{ height: '100%' }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <EmojiEvents sx={{ fontSize: 50, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  🏆 Progress
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Track achievements
                </Typography>
                <Button size="small" variant="outlined" sx={{ mt: 2 }}>
                  View Stats
                </Button>
              </CardContent>
            </ActionCard>
          </Grid>
        </Grid>

        {/* Floating Action Buttons */}
        <Box sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1000 }}>
          <Stack spacing={2}>
            {/* Mobile Assessment FAB */}
            {isMobile && (
              <Tooltip title="Start Assessment" placement="left">
                <Fab 
                  color="warning" 
                  onClick={handleAssessmentsView}
                  size="large"
                  sx={{ 
                    background: `linear-gradient(45deg, ${theme.palette.warning.main}, ${theme.palette.warning.dark})`,
                    '&:hover': {
                      background: `linear-gradient(45deg, ${theme.palette.warning.dark}, ${theme.palette.warning.main})`,
                    }
                  }}
                >
                  <Quiz />
                </Fab>
              </Tooltip>
            )}
            <Tooltip title="Bookmark Course" placement="left">
              <Fab 
                color={isBookmarked ? "secondary" : "default"} 
                onClick={toggleBookmark}
                size="medium"
              >
                {isBookmarked ? <Bookmark /> : <BookmarkBorder />}
              </Fab>
            </Tooltip>
            <Tooltip title="Share Course" placement="left">
              <Fab color="primary" size="medium">
                <Share />
              </Fab>
            </Tooltip>
          </Stack>
        </Box>

        {/* Mobile Sticky Bottom Bar */}
        {isMobile && (
          <Paper 
            sx={{ 
              position: 'fixed', 
              bottom: 0, 
              left: 0, 
              right: 0, 
              zIndex: 1100,
              borderRadius: '20px 20px 0 0',
              p: 2,
              background: `linear-gradient(135deg, ${theme.palette.background.paper}, ${theme.palette.grey[50]})`,
              backdropFilter: 'blur(10px)',
              borderTop: `1px solid ${theme.palette.divider}`
            }}
            elevation={8}
          >
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={<Quiz />}
                  onClick={handleAssessmentsView}
                  sx={{
                    borderRadius: 3,
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 600,
                    background: `linear-gradient(45deg, ${theme.palette.warning.main}, ${theme.palette.warning.dark})`,
                    '&:hover': {
                      background: `linear-gradient(45deg, ${theme.palette.warning.dark}, ${theme.palette.warning.main})`,
                    }
                  }}
                >
                  Assessments
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  startIcon={<MenuBook />}
                  onClick={handleNotesView}
                  sx={{
                    borderRadius: 3,
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 600,
                  }}
                >
                  Study Notes
                </Button>
              </Grid>
            </Grid>
          </Paper>
        )}
      </Container>
    </GradientBackground>
  );
};

export default EnhancedCourseViewPage;
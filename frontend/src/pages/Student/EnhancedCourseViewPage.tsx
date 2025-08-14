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
    navigate(`/enhanced-notes/${id}`);
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
            onClick={() => navigate('/dashboard/student/courses')}
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
            onClick={() => navigate('/dashboard/student/courses')}
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

      <Container maxWidth="lg" sx={{ pt: 12, pb: 4 }}>
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
          {/* Enhanced Notes Study Path */}
          <Grid item xs={12} md={6}>
            <ActionCard onClick={handleNotesView}>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Box sx={{ position: 'relative', mb: 3 }}>
                  <MenuBook sx={{ fontSize: 80, color: 'primary.main' }} />
                  <Zoom in={true}>
                    <Fab
                      size="small"
                      color="secondary"
                      sx={{ position: 'absolute', top: -10, right: -10 }}
                    >
                      <AutoAwesome />
                    </Fab>
                  </Zoom>
                </Box>
                
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'primary.main' }}>
                  📚 Interactive Study
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph sx={{ fontSize: '1.1rem' }}>
                  Dive into course materials with AI-powered quizzes, progress tracking, and gamified learning experience
                </Typography>
                
                <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 3 }}>
                  <StatsChip 
                    label={`${courseStats.completedNotes}/${courseStats.totalNotes} Completed`}
                    color={courseStats.completedNotes === courseStats.totalNotes ? 'success' : 'warning'}
                    icon={courseStats.completedNotes === courseStats.totalNotes ? <CheckCircle /> : <RadioButtonUnchecked />}
                  />
                  <StatsChip 
                    label="AI Quizzes" 
                    color="info" 
                    icon={<Psychology />}
                  />
                </Stack>
                
                <Button 
                  variant="contained" 
                  size="large"
                  startIcon={<PlayArrow />}
                  sx={{ 
                    borderRadius: 3,
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`
                  }}
                >
                  Start Learning
                </Button>
              </CardContent>
            </ActionCard>
          </Grid>

          {/* Enhanced Live Sessions Path */}
          <Grid item xs={12} md={6}>
            <ActionCard onClick={handleLiveSessionsView}>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Box sx={{ position: 'relative', mb: 3 }}>
                  <VideoCall sx={{ fontSize: 80, color: 'secondary.main' }} />
                  <Zoom in={true}>
                    <Fab
                      size="small"
                      color="error"
                      sx={{ position: 'absolute', top: -10, right: -10 }}
                    >
                      <LiveTv />
                    </Fab>
                  </Zoom>
                </Box>
                
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'secondary.main' }}>
                  🎥 Live Sessions
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph sx={{ fontSize: '1.1rem' }}>
                  Join interactive live classes, participate in real-time discussions, and connect with your instructor
                </Typography>
                
                <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 3 }}>
                  <StatsChip 
                    label={`${courseStats.upcomingLiveSessions} Upcoming`}
                    color={courseStats.upcomingLiveSessions > 0 ? 'success' : 'default'}
                    icon={<Schedule />}
                  />
                  <StatsChip 
                    label="HD Quality" 
                    color="info" 
                    icon={<Diamond />}
                  />
                </Stack>
                
                <Button 
                  variant="contained" 
                  size="large"
                  startIcon={<VideoCall />}
                  sx={{ 
                    borderRadius: 3,
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    background: `linear-gradient(45deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.dark})`
                  }}
                >
                  Join Sessions
                </Button>
              </CardContent>
            </ActionCard>
          </Grid>
        </Grid>

        {/* Additional Learning Options */}
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <ActionCard onClick={handleAssessmentsView} sx={{ height: '100%' }}>
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
      </Container>
    </GradientBackground>
  );
};

export default EnhancedCourseViewPage;
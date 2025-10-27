import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  LinearProgress,
  Chip,
  Avatar,
  IconButton,
  Tabs,
  Tab,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  CircularProgress,
  Badge,
  Tooltip,
  Stack,
  useTheme,
  alpha,
  styled
} from '@mui/material';
import {
  School,
  People,
  VideoCall,
  Assignment,
  Quiz,
  Analytics,
  Settings,
  Edit,
  Add,
  Visibility,
  VisibilityOff,
  TrendingUp,
  EmojiEvents,
  Schedule,
  AccessTime,
  CheckCircle,
  Warning,
  Info,
  Group,
  Person,
  Grade,
  Assessment,
  LiveTv,
  Description,
  MenuBook,
  Psychology,
  Computer,
  Business,
  DesignServices,
  Language,
  Science,
  Engineering,
  HealthAndSafety,
  Attractions,
  MusicNote,
  Palette,
  Build,
  Biotech,
  AccountBalance,
  Restaurant,
  DirectionsCar,
  Flight,
  Hotel,
  ShoppingCart,
  Pets,
  Nature,
  WbSunny,
  Cloud,
  Water,
  Eco,
  Recycling,
  Park,
  Forest,
  Beach,
  Mountain,
  City,
  Home,
  Work,
  Favorite,
  ThumbUp,
  Comment,
  Share,
  Bookmark,
  MoreVert,
  Refresh,
  Search,
  FilterList,
  Sort,
  ViewList,
  ViewModule,
  Fullscreen,
  VolumeUp,
  VolumeOff,
  ClosedCaption,
  Speed,
  Replay,
  SkipNext,
  SkipPrevious,
  Pause,
  Stop,
  RecordVoiceOver,
  Mic,
  MicOff,
  Videocam,
  VideocamOff,
  ScreenShare,
  StopScreenShare,
  ChatBubble,
  People as PeopleIcon,
  HandRaise,
  Poll,
  QrCode,
  Link,
  ContentCopy,
  OpenInNew,
  GetApp,
  CloudDownload,
  CloudUpload,
  Sync,
  SyncProblem,
  Error,
  Cancel,
  Close,
  Done,
  DoneAll,
  Send,
  Reply,
  Forward,
  Archive,
  Unarchive,
  Flag,
  Report,
  Block,
  Unblock,
  PersonAdd,
  PersonRemove,
  GroupAdd,
  GroupRemove,
  AdminPanelSettings,
  Security,
  PrivacyTip,
  Verified,
  VerifiedUser,
  Gavel,
  Balance,
  Scale,
  GpsFixed,
  LocationOn,
  MyLocation,
  Directions,
  Map,
  Terrain,
  Satellite,
  Streetview,
  Timeline,
  History,
  Event,
  EventNote,
  EventAvailable,
  EventBusy,
  Today,
  DateRange,
  CalendarMonth,
  CalendarViewDay,
  CalendarViewWeek,
  CalendarViewMonth,
  CalendarToday,
  Timer,
  HourglassEmpty,
  HourglassFull,
  WatchLater,
  Update,
  Cached,
  Autorenew,
  Loop,
  Shuffle,
  Repeat,
  RepeatOne,
  FastRewind,
  FastForward,
  FirstPage,
  LastPage,
  NavigateBefore,
  NavigateNext,
  ArrowBack,
  ArrowForward,
  ArrowUpward,
  ArrowDownward,
  ArrowLeft,
  ArrowRight,
  KeyboardArrowUp,
  KeyboardArrowDown,
  KeyboardArrowLeft,
  KeyboardArrowRight,
  ExpandLess,
  ExpandMore,
  UnfoldMore,
  UnfoldLess,
  ZoomIn,
  ZoomOut,
  FitScreen,
  AspectRatio,
  Crop,
  CropFree,
  CropSquare,
  CropPortrait,
  CropLandscape,
  CropRotate,
  RotateLeft,
  RotateRight,
  Flip,
  Transform,
  Straighten,
  Tune,
  Filter,
  FilterAlt,
  SortByAlpha
} from '@mui/icons-material';

import { useAuth } from '../../hooks/useAuth';
import { courseService, ICourse } from '../../services/courseService';
import { liveSessionService, ILiveSession } from '../../services/liveSessionService';
import { enrollmentService, IEnrollment } from '../../services/enrollmentService';
import { UserRole } from '../../shared/types';
import ResponsiveDashboard from '../../components/Layout/ResponsiveDashboard';
import { useResponsive } from '../../utils/responsive';

// Styled Components with defensive theme handling
const DashboardCard = styled(Card)(({ theme }) => {
  // Defensive theme handling
  const primaryColor = theme?.palette?.primary?.main || '#22c55e';
  const spacing = theme?.spacing || ((value: number) => `${value * 8}px`);
  
  return {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: spacing(2),
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    border: `1px solid ${alpha(primaryColor, 0.1)}`,
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: `0 12px 40px ${alpha(primaryColor, 0.15)}`,
      borderColor: primaryColor,
    },
  };
});

const StatsCard = styled(Card)(({ theme }) => {
  // Defensive theme handling
  const primaryColor = theme?.palette?.primary?.main || '#22c55e';
  const secondaryColor = theme?.palette?.secondary?.main || '#dc004e';
  const spacing = theme?.spacing || ((value: number) => `${value * 8}px`);
  const shadows = theme?.shadows || ['none', 'none', 'none', 'none', 'none', 'none', 'none', 'none', 'none'];
  
  return {
    background: `linear-gradient(135deg, ${primaryColor}08, ${secondaryColor}08)`,
    border: `1px solid ${alpha(primaryColor, 0.2)}`,
    borderRadius: spacing(2),
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: shadows[8] || '0 4px 8px rgba(0,0,0,0.1)',
    },
  };
});

// Interfaces
interface CourseStats {
  totalStudents: number;
  activeStudents: number;
  completedStudents: number;
  averageProgress: number;
  totalSessions: number;
  upcomingSessions: number;
  totalAssignments: number;
  pendingAssignments: number;
  averageGrade: number;
  engagementScore: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`teacher-tabpanel-${index}`}
      aria-labelledby={`teacher-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const TeacherCourseDashboard: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const { isMobile, isTablet, isDesktop } = useResponsive();

  // State management
  const [course, setCourse] = useState<ICourse | null>(null);
  const [enrollments, setEnrollments] = useState<IEnrollment[]>([]);
  const [liveSessions, setLiveSessions] = useState<ILiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState(0);

  // Course statistics
  const [courseStats, setCourseStats] = useState<CourseStats>({
    totalStudents: 0,
    activeStudents: 0,
    completedStudents: 0,
    averageProgress: 0,
    totalSessions: 0,
    upcomingSessions: 0,
    totalAssignments: 0,
    pendingAssignments: 0,
    averageGrade: 0,
    engagementScore: 0
  });

  // Load course data
  useEffect(() => {
    const loadCourseData = async () => {
      if (!courseId || !user) return;

      try {
        setLoading(true);
        setError(null);

        // Load course data
        const [courseData, enrollmentsData, sessionsData] = await Promise.allSettled([
          courseService.getCourseById(courseId),
          enrollmentService.getCourseEnrollments(courseId),
          liveSessionService.getCourseSessions(courseId)
        ]);

        if (courseData.status === 'fulfilled') {
          setCourse(courseData.value);
        }

        if (enrollmentsData.status === 'fulfilled') {
          setEnrollments(enrollmentsData.value.enrollments || []);
        }

        if (sessionsData.status === 'fulfilled') {
          setLiveSessions(sessionsData.value.sessions || []);
        }

        // Calculate statistics
        calculateCourseStats();

      } catch (err) {
        console.error('Error loading course data:', err);
        setError('Failed to load course data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadCourseData();
  }, [courseId, user]);

  // Calculate course statistics
  const calculateCourseStats = () => {
    const totalStudents = enrollments.length;
    const activeStudents = enrollments.filter(e => e.status === 'active').length;
    const completedStudents = enrollments.filter(e => e.progress?.totalProgress >= 100).length;
    const averageProgress = totalStudents > 0 
      ? Math.round(enrollments.reduce((sum, e) => sum + (e.progress?.totalProgress || 0), 0) / totalStudents)
      : 0;
    
    const totalSessions = liveSessions.length;
    const upcomingSessions = liveSessions.filter(s => 
      new Date(s.scheduledTime) > new Date() && s.status === 'scheduled'
    ).length;

    setCourseStats({
      totalStudents,
      activeStudents,
      completedStudents,
      averageProgress,
      totalSessions,
      upcomingSessions,
      totalAssignments: 0, // TODO: Implement assignments
      pendingAssignments: 0, // TODO: Implement assignments
      averageGrade: 0, // TODO: Implement grading
      engagementScore: Math.round((activeStudents / totalStudents) * 100) || 0
    });
  };

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  // Handle navigation
  const handleNavigateToContent = () => {
    navigate(`/teacher/course/${courseId}/content`);
  };

  const handleNavigateToStudents = () => {
    navigate(`/teacher/course/${courseId}/students`);
  };

  const handleNavigateToSessions = () => {
    navigate(`/teacher/course/${courseId}/sessions`);
  };

  const handleNavigateToAnalytics = () => {
    navigate(`/teacher/course/${courseId}/analytics`);
  };

  if (loading) {
    return (
      <ResponsiveDashboard>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ ml: 2 }}>
              Loading course dashboard...
            </Typography>
          </Box>
        </Container>
      </ResponsiveDashboard>
    );
  }

  if (error) {
    return (
      <ResponsiveDashboard>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="error" action={
            <Button color="inherit" size="small" onClick={() => window.location.reload()}>
              Retry
            </Button>
          }>
            {error}
          </Alert>
        </Container>
      </ResponsiveDashboard>
    );
  }

  if (!course) {
    return (
      <ResponsiveDashboard>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="info">
            Course not found. Please check the URL and try again.
          </Alert>
        </Container>
      </ResponsiveDashboard>
    );
  }

  return (
    <ResponsiveDashboard>
      <Container maxWidth="xl" sx={{ py: 2 }}>
        {/* Header Section */}
        <Box sx={{ mb: 4 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                {course.title} - Teacher Dashboard
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                {course.description}
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <Chip
                  icon={<School />}
                  label={course.category}
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  label={course.level}
                  color="secondary"
                  variant="outlined"
                />
                <Chip
                  label={`${courseStats.totalStudents} Students`}
                  color="info"
                  variant="outlined"
                />
              </Stack>
            </Grid>
            <Grid item xs={12} md={4}>
              <Stack direction="row" spacing={2}>
                <Button
                  variant="outlined"
                  startIcon={<Edit />}
                  onClick={handleNavigateToContent}
                >
                  Edit Content
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Settings />}
                >
                  Settings
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard>
              <CardContent sx={{ textAlign: 'center' }}>
                <People sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  {courseStats.totalStudents}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Students
                </Typography>
              </CardContent>
            </StatsCard>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard>
              <CardContent sx={{ textAlign: 'center' }}>
                <TrendingUp sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                  {courseStats.averageProgress}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Average Progress
                </Typography>
              </CardContent>
            </StatsCard>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard>
              <CardContent sx={{ textAlign: 'center' }}>
                <VideoCall sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                  {courseStats.upcomingSessions}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Upcoming Sessions
                </Typography>
              </CardContent>
            </StatsCard>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard>
              <CardContent sx={{ textAlign: 'center' }}>
                <EmojiEvents sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'error.main' }}>
                  {courseStats.engagementScore}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Engagement Score
                </Typography>
              </CardContent>
            </StatsCard>
          </Grid>
        </Grid>

        {/* Main Content */}
        <Grid container spacing={3}>
          {/* Quick Actions */}
          <Grid item xs={12} md={4}>
            <DashboardCard>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Quick Actions
                </Typography>
                <Stack spacing={2}>
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={handleNavigateToContent}
                    fullWidth
                  >
                    Add Content
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<VideoCall />}
                    onClick={handleNavigateToSessions}
                    fullWidth
                  >
                    Create Live Session
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Assignment />}
                    fullWidth
                  >
                    Create Assignment
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Quiz />}
                    fullWidth
                  >
                    Create Quiz
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Analytics />}
                    onClick={handleNavigateToAnalytics}
                    fullWidth
                  >
                    View Analytics
                  </Button>
                </Stack>
              </CardContent>
            </DashboardCard>
          </Grid>

          {/* Main Dashboard Content */}
          <Grid item xs={12} md={8}>
            <DashboardCard>
              <CardContent>
                {/* Navigation Tabs */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                  <Tabs
                    value={currentTab}
                    onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                  >
                    <Tab
                      icon={<People />}
                      label="Students"
                      iconPosition="start"
                    />
                    <Tab
                      icon={<VideoCall />}
                      label="Sessions"
                      iconPosition="start"
                    />
                    <Tab
                      icon={<Assignment />}
                      label="Assignments"
                      iconPosition="start"
                    />
                    <Tab
                      icon={<Analytics />}
                      label="Analytics"
                      iconPosition="start"
                    />
                  </Tabs>
                </Box>

                {/* Tab Content */}
                <TabPanel value={currentTab} index={0}>
                  {/* Students Tab */}
                  <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Course Students
                      </Typography>
                      <Button
                        variant="outlined"
                        startIcon={<People />}
                        onClick={handleNavigateToStudents}
                      >
                        Manage Students
                      </Button>
                    </Stack>
                    
                    {enrollments.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <People sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">
                          No students enrolled yet
                        </Typography>
                      </Box>
                    ) : (
                      <List>
                        {enrollments.slice(0, 5).map((enrollment, index) => (
                          <React.Fragment key={enrollment._id}>
                            <ListItem>
                              <ListItemIcon>
                                <Avatar>
                                  <Person />
                                </Avatar>
                              </ListItemIcon>
                              <ListItemText
                                primary={`${enrollment.student.firstName} ${enrollment.student.lastName}`}
                                secondary={
                                  <Box>
                                    <Typography variant="body2" color="text.secondary">
                                      {enrollment.student.email}
                                    </Typography>
                                    <Box sx={{ mt: 1 }}>
                                      <LinearProgress
                                        variant="determinate"
                                        value={enrollment.progress?.totalProgress || 0}
                                        sx={{ height: 4, borderRadius: 2 }}
                                      />
                                      <Typography variant="caption" color="text.secondary">
                                        {enrollment.progress?.totalProgress || 0}% Complete
                                      </Typography>
                                    </Box>
                                  </Box>
                                }
                              />
                              <Chip
                                label={enrollment.status}
                                color={enrollment.status === 'active' ? 'success' : 'default'}
                                size="small"
                              />
                            </ListItem>
                            {index < Math.min(enrollments.length - 1, 4) && <Divider />}
                          </React.Fragment>
                        ))}
                      </List>
                    )}
                  </Box>
                </TabPanel>

                <TabPanel value={currentTab} index={1}>
                  {/* Sessions Tab */}
                  <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Live Sessions
                      </Typography>
                      <Button
                        variant="outlined"
                        startIcon={<Add />}
                        onClick={handleNavigateToSessions}
                      >
                        Create Session
                      </Button>
                    </Stack>
                    
                    {liveSessions.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <VideoCall sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">
                          No live sessions scheduled
                        </Typography>
                      </Box>
                    ) : (
                      <List>
                        {liveSessions.slice(0, 5).map((session, index) => (
                          <React.Fragment key={session._id}>
                            <ListItem>
                              <ListItemIcon>
                                <Avatar sx={{ bgcolor: 'primary.main' }}>
                                  <VideoCall />
                                </Avatar>
                              </ListItemIcon>
                              <ListItemText
                                primary={session.title}
                                secondary={
                                  <Box>
                                    <Typography variant="body2" color="text.secondary">
                                      {new Date(session.scheduledTime).toLocaleDateString()} at{' '}
                                      {new Date(session.scheduledTime).toLocaleTimeString()}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      Duration: {session.duration} minutes
                                    </Typography>
                                  </Box>
                                }
                              />
                              <Chip
                                label={session.status}
                                color={
                                  session.status === 'live' ? 'error' :
                                  session.status === 'scheduled' ? 'warning' : 'default'
                                }
                                size="small"
                              />
                            </ListItem>
                            {index < Math.min(liveSessions.length - 1, 4) && <Divider />}
                          </React.Fragment>
                        ))}
                      </List>
                    )}
                  </Box>
                </TabPanel>

                <TabPanel value={currentTab} index={2}>
                  {/* Assignments Tab */}
                  <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Assignments
                      </Typography>
                      <Button
                        variant="outlined"
                        startIcon={<Add />}
                      >
                        Create Assignment
                      </Button>
                    </Stack>
                    
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Assignment sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
                      <Typography variant="h6" color="text.secondary">
                        No assignments created yet
                      </Typography>
                    </Box>
                  </Box>
                </TabPanel>

                <TabPanel value={currentTab} index={3}>
                  {/* Analytics Tab */}
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                      Course Analytics
                    </Typography>
                    
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <Paper sx={{ p: 3, textAlign: 'center' }}>
                          <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
                            {courseStats.activeStudents}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Active Students
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Paper sx={{ p: 3, textAlign: 'center' }}>
                          <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main', mb: 1 }}>
                            {courseStats.completedStudents}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Completed Students
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Box>
                </TabPanel>
              </CardContent>
            </DashboardCard>
          </Grid>
        </Grid>
      </Container>
    </ResponsiveDashboard>
  );
};

export default TeacherCourseDashboard;

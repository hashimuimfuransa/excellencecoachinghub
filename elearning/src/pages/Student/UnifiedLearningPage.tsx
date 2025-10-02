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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  useTheme,
  alpha,
  styled
} from '@mui/material';
import {
  PlayArrow,
  VideoCall,
  MenuBook,
  Assignment,
  Quiz,
  EmojiEvents,
  TrendingUp,
  School,
  Person,
  Schedule,
  CheckCircle,
  Lock,
  Star,
  Bookmark,
  Share,
  Download,
  Chat,
  Notifications,
  Settings,
  ExpandMore,
  ExpandLess,
  Add,
  Edit,
  Delete,
  Visibility,
  VisibilityOff,
  LiveTv,
  OndemandVideo,
  Description,
  Code,
  Image,
  AudioFile,
  AttachFile,
  Timer,
  Grade,
  Analytics,
  Group,
  CalendarToday,
  AccessTime,
  LocalLibrary,
  Psychology,
  AutoStories,
  Lightbulb,
  Rocket,
  Diamond,
  WorkspacePremium,
  MilitaryTech,
  PsychologyAlt,
  Science,
  Computer,
  Business,
  DesignServices,
  Language,
  Sports,
  MusicNote,
  Palette,
  Build,
  Biotech,
  AccountBalance,
  Engineering,
  HealthAndSafety,
  Restaurant,
  DirectionsCar,
  Flight,
  Hotel,
  ShoppingCart,
  Attractions,
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
  School as SchoolIcon,
  Favorite,
  ThumbUp,
  Comment,
  Share as ShareIcon,
  BookmarkBorder,
  Bookmark as BookmarkFilled,
  MoreVert,
  Refresh,
  Search,
  FilterList,
  Sort,
  ViewList,
  ViewModule,
  Fullscreen,
  FullscreenExit,
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
  ChatBubbleOutline,
  People,
  PeopleOutline,
  HandRaise,
  RaiseHand,
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
  Warning,
  Info,
  CheckCircleOutline,
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
  Schedule as ScheduleIcon,
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
  CalendarToday as CalendarTodayIcon,
  AccessTime as AccessTimeIcon,
  Timer as TimerIcon,
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
  SkipPrevious as SkipPreviousIcon,
  SkipNext as SkipNextIcon,
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
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
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
  FilterList as FilterListIcon,
  SortByAlpha,
  SortByAlpha as SortByAlphaIcon,
  SortByAlpha as SortByAlphaIcon2,
  SortByAlpha as SortByAlphaIcon3,
  SortByAlpha as SortByAlphaIcon4,
  SortByAlpha as SortByAlphaIcon5,
  SortByAlpha as SortByAlphaIcon6,
  SortByAlpha as SortByAlphaIcon7,
  SortByAlpha as SortByAlphaIcon8,
  SortByAlpha as SortByAlphaIcon9,
  SortByAlpha as SortByAlphaIcon10
} from '@mui/icons-material';

import { useAuth } from '../../hooks/useAuth';
import { courseService, ICourse } from '../../services/courseService';
import { liveSessionService, ILiveSession } from '../../services/liveSessionService';
import { enrollmentService, IEnrollment } from '../../services/enrollmentService';
import { courseContentService, ICourseContent } from '../../services/courseContentService';
import { courseNotesService, CourseNotes } from '../../services/courseNotesService';
import { assessmentService, IAssessment } from '../../services/assessmentService';
import { UserRole } from '../../shared/types';
import ResponsiveDashboard from '../../components/Layout/ResponsiveDashboard';
import { useResponsive } from '../../utils/responsive';

// Styled Components
const LearningCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: theme.spacing(2),
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.15)}`,
    borderColor: theme.palette.primary.main,
  },
}));

const ProgressCard = styled(Card)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main}08, ${theme.palette.secondary.main}08)`,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  borderRadius: theme.spacing(2),
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[8],
  },
}));

const GamificationCard = styled(Card)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.warning.main}08, ${theme.palette.error.main}08)`,
  border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
  borderRadius: theme.spacing(2),
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: `linear-gradient(90deg, ${theme.palette.warning.main}, ${theme.palette.error.main})`,
  },
}));

const VideoPlayer = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  height: '400px',
  backgroundColor: '#000',
  borderRadius: theme.spacing(2),
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const ContentSidebar = styled(Paper)(({ theme }) => ({
  height: '100%',
  borderRadius: theme.spacing(2),
  overflow: 'hidden',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
}));

// Interfaces
interface LearningProgress {
  totalLessons: number;
  completedLessons: number;
  totalTime: number;
  completedTime: number;
  currentStreak: number;
  longestStreak: number;
  points: number;
  level: number;
  achievements: Achievement[];
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
  points: number;
}

interface Chapter {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
  isUnlocked: boolean;
  progress: number;
}

interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'document' | 'quiz' | 'assignment' | 'live' | 'interactive';
  duration: number;
  isCompleted: boolean;
  isLocked: boolean;
  points: number;
  content?: any;
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
      id={`learning-tabpanel-${index}`}
      aria-labelledby={`learning-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const UnifiedLearningPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const { isMobile, isTablet, isDesktop } = useResponsive();

  // State management
  const [course, setCourse] = useState<ICourse | null>(null);
  const [enrollment, setEnrollment] = useState<IEnrollment | null>(null);
  const [liveSessions, setLiveSessions] = useState<ILiveSession[]>([]);
  const [courseContent, setCourseContent] = useState<ICourseContent[]>([]);
  const [courseNotes, setCourseNotes] = useState<CourseNotes | null>(null);
  const [assessments, setAssessments] = useState<IAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI State
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [showLiveSession, setShowLiveSession] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showChat, setShowChat] = useState(false);

  // Gamification State
  const [learningProgress, setLearningProgress] = useState<LearningProgress>({
    totalLessons: 0,
    completedLessons: 0,
    totalTime: 0,
    completedTime: 0,
    currentStreak: 0,
    longestStreak: 0,
    points: 0,
    level: 1,
    achievements: []
  });

  // Chapters and Lessons Structure
  const [chapters, setChapters] = useState<Chapter[]>([]);

  // Load course data
  useEffect(() => {
    const loadCourseData = async () => {
      if (!courseId || !user) return;

      try {
        setLoading(true);
        setError(null);

        // Load all course-related data in parallel
        const [
          courseData,
          enrollmentData,
          liveSessionsData,
          contentData,
          notesData,
          assessmentsData
        ] = await Promise.allSettled([
          courseService.getCourseById(courseId),
          enrollmentService.getEnrollmentByCourse(courseId),
          liveSessionService.getCourseSessions(courseId),
          courseContentService.getCourseContent(courseId),
          courseNotesService.getCourseNotes(courseId),
          assessmentService.getCourseAssessments(courseId)
        ]);

        // Process results
        if (courseData.status === 'fulfilled') {
          setCourse(courseData.value);
        }

        if (enrollmentData.status === 'fulfilled') {
          setEnrollment(enrollmentData.value);
        }

        if (liveSessionsData.status === 'fulfilled') {
          setLiveSessions(liveSessionsData.value.sessions || []);
        }

        if (contentData.status === 'fulfilled') {
          setCourseContent(contentData.value.content || []);
        }

        if (notesData.status === 'fulfilled') {
          setCourseNotes(notesData.value);
        }

        if (assessmentsData.status === 'fulfilled') {
          setAssessments(assessmentsData.value.assessments || []);
        }

        // Generate chapters structure
        generateChaptersStructure();

      } catch (err) {
        console.error('Error loading course data:', err);
        setError('Failed to load course data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadCourseData();
  }, [courseId, user]);

  // Generate chapters structure from course content
  const generateChaptersStructure = () => {
    // This would be replaced with actual course structure from backend
    const mockChapters: Chapter[] = [
      {
        id: 'chapter-1',
        title: 'Introduction to the Course',
        description: 'Get started with the fundamentals',
        isUnlocked: true,
        progress: 75,
        lessons: [
          {
            id: 'lesson-1-1',
            title: 'Welcome and Course Overview',
            type: 'video',
            duration: 15,
            isCompleted: true,
            isLocked: false,
            points: 10
          },
          {
            id: 'lesson-1-2',
            title: 'Setting Up Your Environment',
            type: 'document',
            duration: 20,
            isCompleted: true,
            isLocked: false,
            points: 15
          },
          {
            id: 'lesson-1-3',
            title: 'First Quiz',
            type: 'quiz',
            duration: 10,
            isCompleted: false,
            isLocked: false,
            points: 25
          }
        ]
      },
      {
        id: 'chapter-2',
        title: 'Core Concepts',
        description: 'Learn the essential concepts',
        isUnlocked: true,
        progress: 40,
        lessons: [
          {
            id: 'lesson-2-1',
            title: 'Understanding the Basics',
            type: 'video',
            duration: 30,
            isCompleted: true,
            isLocked: false,
            points: 20
          },
          {
            id: 'lesson-2-2',
            title: 'Live Session: Q&A',
            type: 'live',
            duration: 60,
            isCompleted: false,
            isLocked: false,
            points: 30
          },
          {
            id: 'lesson-2-3',
            title: 'Practice Assignment',
            type: 'assignment',
            duration: 45,
            isCompleted: false,
            isLocked: false,
            points: 50
          }
        ]
      },
      {
        id: 'chapter-3',
        title: 'Advanced Topics',
        description: 'Dive deeper into advanced concepts',
        isUnlocked: false,
        progress: 0,
        lessons: [
          {
            id: 'lesson-3-1',
            title: 'Advanced Techniques',
            type: 'video',
            duration: 45,
            isCompleted: false,
            isLocked: true,
            points: 40
          },
          {
            id: 'lesson-3-2',
            title: 'Interactive Workshop',
            type: 'interactive',
            duration: 90,
            isCompleted: false,
            isLocked: true,
            points: 60
          }
        ]
      }
    ];

    setChapters(mockChapters);
  };

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  // Handle lesson selection
  const handleLessonSelect = (lessonId: string) => {
    setSelectedLesson(lessonId);
    // Load lesson content based on type
  };

  // Handle live session join
  const handleJoinLiveSession = (sessionId: string) => {
    navigate(`/video/live-class/${sessionId}?role=student`);
  };

  // Calculate overall progress
  const calculateProgress = () => {
    if (chapters.length === 0) return 0;
    const totalLessons = chapters.reduce((sum, chapter) => sum + chapter.lessons.length, 0);
    const completedLessons = chapters.reduce(
      (sum, chapter) => sum + chapter.lessons.filter(lesson => lesson.isCompleted).length,
      0
    );
    return totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  };

  // Get lesson icon based on type
  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'video': return <OndemandVideo />;
      case 'document': return <Description />;
      case 'quiz': return <Quiz />;
      case 'assignment': return <Assignment />;
      case 'live': return <LiveTv />;
      case 'interactive': return <Psychology />;
      default: return <MenuBook />;
    }
  };

  // Get lesson color based on type
  const getLessonColor = (type: string) => {
    switch (type) {
      case 'video': return 'primary';
      case 'document': return 'info';
      case 'quiz': return 'warning';
      case 'assignment': return 'secondary';
      case 'live': return 'error';
      case 'interactive': return 'success';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <ResponsiveDashboard>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ ml: 2 }}>
              Loading your learning experience...
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

  const overallProgress = calculateProgress();

  return (
    <ResponsiveDashboard>
      <Container maxWidth="xl" sx={{ py: 2 }}>
        {/* Header Section */}
        <Box sx={{ mb: 4 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                {course.title}
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                {course.description}
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <Chip
                  icon={<Person />}
                  label={`${course.instructor.firstName} ${course.instructor.lastName}`}
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  label={course.category}
                  color="secondary"
                  variant="outlined"
                />
                <Chip
                  label={course.level}
                  color="info"
                  variant="outlined"
                />
              </Stack>
            </Grid>
            <Grid item xs={12} md={4}>
              <ProgressCard>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
                    {overallProgress}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Course Progress
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={overallProgress}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </CardContent>
              </ProgressCard>
            </Grid>
          </Grid>
        </Box>

        {/* Gamification Bar */}
        <GamificationCard sx={{ mb: 4 }}>
          <CardContent>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                    {learningProgress.points}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Points Earned
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'error.main' }}>
                    Level {learningProgress.level}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Current Level
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                    {learningProgress.currentStreak}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Day Streak
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                    {learningProgress.achievements.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Achievements
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </GamificationCard>

        {/* Main Content */}
        <Grid container spacing={3}>
          {/* Left Sidebar - Course Content */}
          <Grid item xs={12} lg={4}>
            <ContentSidebar>
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Course Content
                </Typography>
              </Box>
              <Box sx={{ maxHeight: '600px', overflowY: 'auto' }}>
                {chapters.map((chapter, chapterIndex) => (
                  <Box key={chapter.id} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Box
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        backgroundColor: selectedChapter === chapter.id ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.05)
                        }
                      }}
                      onClick={() => setSelectedChapter(selectedChapter === chapter.id ? null : chapter.id)}
                    >
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            Chapter {chapterIndex + 1}: {chapter.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {chapter.description}
                          </Typography>
                          <Box sx={{ mt: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={chapter.progress}
                              sx={{ height: 4, borderRadius: 2 }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {chapter.progress}% Complete
                            </Typography>
                          </Box>
                        </Box>
                        <IconButton size="small">
                          {selectedChapter === chapter.id ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                      </Stack>
                    </Box>
                    
                    {selectedChapter === chapter.id && (
                      <Box sx={{ pl: 2, pr: 2, pb: 2 }}>
                        <List dense>
                          {chapter.lessons.map((lesson, lessonIndex) => (
                            <ListItem
                              key={lesson.id}
                              sx={{
                                cursor: 'pointer',
                                borderRadius: 1,
                                mb: 0.5,
                                backgroundColor: selectedLesson === lesson.id ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                                '&:hover': {
                                  backgroundColor: alpha(theme.palette.primary.main, 0.05)
                                }
                              }}
                              onClick={() => !lesson.isLocked && handleLessonSelect(lesson.id)}
                            >
                              <ListItemIcon>
                                {lesson.isLocked ? (
                                  <Lock color="disabled" />
                                ) : lesson.isCompleted ? (
                                  <CheckCircle color="success" />
                                ) : (
                                  getLessonIcon(lesson.type)
                                )}
                              </ListItemIcon>
                              <ListItemText
                                primary={
                                  <Stack direction="row" alignItems="center" spacing={1}>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                      {lesson.title}
                                    </Typography>
                                    <Chip
                                      label={`${lesson.points}pts`}
                                      size="small"
                                      color={getLessonColor(lesson.type) as any}
                                      variant="outlined"
                                    />
                                  </Stack>
                                }
                                secondary={
                                  <Stack direction="row" alignItems="center" spacing={1}>
                                    <Typography variant="caption" color="text.secondary">
                                      {lesson.duration} min
                                    </Typography>
                                    <Chip
                                      label={lesson.type}
                                      size="small"
                                      color={getLessonColor(lesson.type) as any}
                                      variant="filled"
                                    />
                                  </Stack>
                                }
                              />
                              {lesson.type === 'live' && !lesson.isLocked && (
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleJoinLiveSession(lesson.id);
                                  }}
                                >
                                  <VideoCall color="error" />
                                </IconButton>
                              )}
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
            </ContentSidebar>
          </Grid>

          {/* Main Content Area */}
          <Grid item xs={12} lg={8}>
            <LearningCard>
              <CardContent sx={{ flexGrow: 1 }}>
                {/* Navigation Tabs */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                  <Tabs
                    value={currentTab}
                    onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                  >
                    <Tab
                      icon={<MenuBook />}
                      label="Learning"
                      iconPosition="start"
                    />
                    <Tab
                      icon={<LiveTv />}
                      label="Live Sessions"
                      iconPosition="start"
                    />
                    <Tab
                      icon={<Description />}
                      label="Notes"
                      iconPosition="start"
                    />
                    <Tab
                      icon={<Quiz />}
                      label="Assessments"
                      iconPosition="start"
                    />
                    <Tab
                      icon={<Analytics />}
                      label="Progress"
                      iconPosition="start"
                    />
                    <Tab
                      icon={<Chat />}
                      label="Discussion"
                      iconPosition="start"
                    />
                  </Tabs>
                </Box>

                {/* Tab Content */}
                <TabPanel value={currentTab} index={0}>
                  {/* Learning Content */}
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <School sx={{ fontSize: 80, color: 'primary.main', opacity: 0.7, mb: 2 }} />
                    <Typography variant="h5" gutterBottom>
                      Select a lesson to start learning
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Choose from the course content on the left to begin your learning journey
                    </Typography>
                  </Box>
                </TabPanel>

                <TabPanel value={currentTab} index={1}>
                  {/* Live Sessions */}
                  <Box>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                      Upcoming Live Sessions
                    </Typography>
                    {liveSessions.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <VideoCall sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">
                          No live sessions scheduled
                        </Typography>
                      </Box>
                    ) : (
                      <Grid container spacing={2}>
                        {liveSessions.map((session) => (
                          <Grid item xs={12} sm={6} key={session._id}>
                            <Card>
                              <CardContent>
                                <Typography variant="h6" gutterBottom>
                                  {session.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                  {session.description}
                                </Typography>
                                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                                  <Chip
                                    icon={<Schedule />}
                                    label={new Date(session.scheduledTime).toLocaleDateString()}
                                    size="small"
                                  />
                                  <Chip
                                    icon={<AccessTime />}
                                    label={`${session.duration} min`}
                                    size="small"
                                  />
                                </Stack>
                                <Button
                                  variant="contained"
                                  startIcon={<VideoCall />}
                                  onClick={() => handleJoinLiveSession(session._id)}
                                  fullWidth
                                >
                                  Join Session
                                </Button>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    )}
                  </Box>
                </TabPanel>

                <TabPanel value={currentTab} index={2}>
                  {/* Course Notes */}
                  <Box>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                      Course Notes
                    </Typography>
                    {courseNotes ? (
                      <Box>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                          {courseNotes.content}
                        </Typography>
                        <Button
                          variant="outlined"
                          startIcon={<Download />}
                          sx={{ mt: 2 }}
                        >
                          Download Notes
                        </Button>
                      </Box>
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Description sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">
                          No notes available yet
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </TabPanel>

                <TabPanel value={currentTab} index={3}>
                  {/* Assessments */}
                  <Box>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                      Course Assessments
                    </Typography>
                    {assessments.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Quiz sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">
                          No assessments available
                        </Typography>
                      </Box>
                    ) : (
                      <Grid container spacing={2}>
                        {assessments.map((assessment) => (
                          <Grid item xs={12} sm={6} key={assessment._id}>
                            <Card>
                              <CardContent>
                                <Typography variant="h6" gutterBottom>
                                  {assessment.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                  {assessment.description}
                                </Typography>
                                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                                  <Chip
                                    label={assessment.type}
                                    size="small"
                                    color="primary"
                                  />
                                  <Chip
                                    icon={<Timer />}
                                    label={`${assessment.timeLimit} min`}
                                    size="small"
                                  />
                                </Stack>
                                <Button
                                  variant="contained"
                                  startIcon={<Quiz />}
                                  fullWidth
                                >
                                  Take Assessment
                                </Button>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    )}
                  </Box>
                </TabPanel>

                <TabPanel value={currentTab} index={4}>
                  {/* Progress Analytics */}
                  <Box>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                      Your Learning Progress
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6} md={3}>
                        <ProgressCard>
                          <CardContent sx={{ textAlign: 'center' }}>
                            <TrendingUp sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                            <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                              {overallProgress}%
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Overall Progress
                            </Typography>
                          </CardContent>
                        </ProgressCard>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <ProgressCard>
                          <CardContent sx={{ textAlign: 'center' }}>
                            <CheckCircle sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                              {learningProgress.completedLessons}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Lessons Completed
                            </Typography>
                          </CardContent>
                        </ProgressCard>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <ProgressCard>
                          <CardContent sx={{ textAlign: 'center' }}>
                            <AccessTime sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                            <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                              {Math.round(learningProgress.completedTime / 60)}h
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Time Spent
                            </Typography>
                          </CardContent>
                        </ProgressCard>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <ProgressCard>
                          <CardContent sx={{ textAlign: 'center' }}>
                            <EmojiEvents sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                            <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                              {learningProgress.achievements.length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Achievements
                            </Typography>
                          </CardContent>
                        </ProgressCard>
                      </Grid>
                    </Grid>
                  </Box>
                </TabPanel>

                <TabPanel value={currentTab} index={5}>
                  {/* Discussion */}
                  <Box>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                      Course Discussion
                    </Typography>
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Chat sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
                      <Typography variant="h6" color="text.secondary">
                        Discussion feature coming soon
                      </Typography>
                    </Box>
                  </Box>
                </TabPanel>
              </CardContent>
            </LearningCard>
          </Grid>
        </Grid>
      </Container>
    </ResponsiveDashboard>
  );
};

export default UnifiedLearningPage;

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Stack,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  alpha,
  styled
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Schedule,
  Warning,
  Grade,
  Assignment,
  Quiz,
  VideoCall,
  Description,
  Psychology,
  MenuBook,
  Analytics,
  BarChart,
  PieChart,
  Timeline,
  CalendarToday,
  AccessTime,
  EmojiEvents,
  Star,
  StarBorder,
  Bookmark,
  BookmarkBorder,
  Share,
  Download,
  Upload,
  Sync,
  Refresh,
  Search,
  FilterList,
  Sort,
  ViewList,
  ViewModule,
  Fullscreen,
  FullscreenExit,
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
  SortByAlpha,
  ArrowUpward,
  ArrowDownward,
  ArrowBack,
  ArrowForward,
  KeyboardArrowUp,
  KeyboardArrowDown,
  KeyboardArrowLeft,
  KeyboardArrowRight,
  ExpandLess,
  ExpandMore,
  UnfoldMore,
  UnfoldLess,
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
  CalendarToday as CalendarTodayIcon,
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
  School,
  People,
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
  Bookmark as BookmarkIcon,
  MoreVert,
  ContentCopy,
  OpenInNew,
  GetApp,
  CloudUpload,
  CloudDownload,
  SyncProblem,
  Error,
  Info
} from '@mui/icons-material';

// Styled Components
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

const ProgressBar = styled(LinearProgress)(({ theme }) => ({
  height: 8,
  borderRadius: 4,
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  '& .MuiLinearProgress-bar': {
    borderRadius: 4,
    background: `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.success.light})`,
  },
}));

// Interfaces
interface LessonProgress {
  id: string;
  title: string;
  type: 'video' | 'document' | 'quiz' | 'assignment' | 'live' | 'interactive';
  completed: boolean;
  score?: number;
  timeSpent: number; // in minutes
  lastAccessed: string;
  attempts: number;
}

interface ChapterProgress {
  id: string;
  title: string;
  lessons: LessonProgress[];
  completedLessons: number;
  totalLessons: number;
  progress: number;
}

interface StudentProgress {
  studentId: string;
  studentName: string;
  studentEmail: string;
  overallProgress: number;
  totalTimeSpent: number;
  averageScore: number;
  chapters: ChapterProgress[];
  recentActivity: Activity[];
  achievements: Achievement[];
  lastActive: string;
}

interface Activity {
  id: string;
  type: 'lesson_completed' | 'quiz_taken' | 'assignment_submitted' | 'live_session_attended';
  title: string;
  timestamp: string;
  score?: number;
  points?: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string;
  points: number;
}

interface StudentProgressTrackerProps {
  studentId: string;
  courseId: string;
}

const StudentProgressTracker: React.FC<StudentProgressTrackerProps> = ({
  studentId,
  courseId
}) => {
  const theme = useTheme();
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<LessonProgress | null>(null);
  const [grade, setGrade] = useState(0);
  const [feedback, setFeedback] = useState('');

  // Load student progress
  useEffect(() => {
    const loadStudentProgress = async () => {
      try {
        setLoading(true);
        setError(null);

        // Mock data - replace with actual API call
        const mockProgress: StudentProgress = {
          studentId,
          studentName: 'John Doe',
          studentEmail: 'john.doe@example.com',
          overallProgress: 75,
          totalTimeSpent: 1250, // minutes
          averageScore: 85,
          lastActive: new Date().toISOString(),
          chapters: [
            {
              id: 'chapter-1',
              title: 'Introduction to the Course',
              completedLessons: 2,
              totalLessons: 3,
              progress: 67,
              lessons: [
                {
                  id: 'lesson-1-1',
                  title: 'Welcome and Course Overview',
                  type: 'video',
                  completed: true,
                  timeSpent: 15,
                  lastAccessed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                  attempts: 1
                },
                {
                  id: 'lesson-1-2',
                  title: 'Setting Up Your Environment',
                  type: 'document',
                  completed: true,
                  timeSpent: 20,
                  lastAccessed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                  attempts: 1
                },
                {
                  id: 'lesson-1-3',
                  title: 'First Quiz',
                  type: 'quiz',
                  completed: false,
                  score: 0,
                  timeSpent: 0,
                  lastAccessed: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                  attempts: 0
                }
              ]
            },
            {
              id: 'chapter-2',
              title: 'Core Concepts',
              completedLessons: 1,
              totalLessons: 2,
              progress: 50,
              lessons: [
                {
                  id: 'lesson-2-1',
                  title: 'Understanding the Basics',
                  type: 'video',
                  completed: true,
                  timeSpent: 30,
                  lastAccessed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                  attempts: 1
                },
                {
                  id: 'lesson-2-2',
                  title: 'Live Session: Q&A',
                  type: 'live',
                  completed: false,
                  timeSpent: 0,
                  lastAccessed: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                  attempts: 0
                }
              ]
            }
          ],
          recentActivity: [
            {
              id: 'activity-1',
              type: 'lesson_completed',
              title: 'Setting Up Your Environment',
              timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
              points: 15
            },
            {
              id: 'activity-2',
              type: 'quiz_taken',
              title: 'Understanding the Basics Quiz',
              timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              score: 85,
              points: 20
            },
            {
              id: 'activity-3',
              type: 'live_session_attended',
              title: 'Live Session: Q&A',
              timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
              points: 30
            }
          ],
          achievements: [
            {
              id: 'achievement-1',
              title: 'First Steps',
              description: 'Completed your first lesson',
              icon: '🎯',
              unlockedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
              points: 10
            },
            {
              id: 'achievement-2',
              title: 'Quiz Master',
              description: 'Scored 80% or higher on a quiz',
              icon: '🏆',
              unlockedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              points: 25
            }
          ]
        };

        setProgress(mockProgress);
      } catch (err) {
        console.error('Error loading student progress:', err);
        setError('Failed to load student progress');
      } finally {
        setLoading(false);
      }
    };

    loadStudentProgress();
  }, [studentId, courseId]);

  // Handle grade submission
  const handleGradeSubmit = async () => {
    try {
      // TODO: Implement API call to submit grade
      console.log('Submitting grade:', { lessonId: selectedLesson?.id, grade, feedback });
      setGradeDialogOpen(false);
      setGrade(0);
      setFeedback('');
    } catch (err) {
      console.error('Error submitting grade:', err);
    }
  };

  // Get lesson icon
  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'video': return <VideoCall />;
      case 'document': return <Description />;
      case 'quiz': return <Quiz />;
      case 'assignment': return <Assignment />;
      case 'live': return <VideoCall />;
      case 'interactive': return <Psychology />;
      default: return <MenuBook />;
    }
  };

  // Get lesson color
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

  // Format time spent
  const formatTimeSpent = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading student progress...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        {error}
      </Alert>
    );
  }

  if (!progress) {
    return (
      <Alert severity="info">
        No progress data available
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ width: 60, height: 60 }}>
              {progress.studentName.split(' ').map(n => n[0]).join('')}
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {progress.studentName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {progress.studentEmail}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Last active: {formatDate(progress.lastActive)}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {progress.overallProgress}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Overall Progress
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Progress Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <ProgressCard>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUp sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                {progress.overallProgress}%
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
              <AccessTime sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                {formatTimeSpent(progress.totalTimeSpent)}
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
              <Grade sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                {progress.averageScore}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Average Score
              </Typography>
            </CardContent>
          </ProgressCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <ProgressCard>
            <CardContent sx={{ textAlign: 'center' }}>
              <EmojiEvents sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'error.main' }}>
                {progress.achievements.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Achievements
              </Typography>
            </CardContent>
          </ProgressCard>
        </Grid>
      </Grid>

      {/* Chapter Progress */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            Chapter Progress
          </Typography>
          <Stack spacing={2}>
            {progress.chapters.map((chapter) => (
              <Paper key={chapter.id} sx={{ p: 2 }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      {chapter.title}
                    </Typography>
                    <Box sx={{ mb: 1 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          {chapter.completedLessons} / {chapter.totalLessons} lessons completed
                        </Typography>
                        <Typography variant="body2" color="primary.main">
                          {chapter.progress}%
                        </Typography>
                      </Stack>
                      <ProgressBar
                        variant="determinate"
                        value={chapter.progress}
                      />
                    </Box>
                  </Box>
                  <Button
                    variant="outlined"
                    onClick={() => setSelectedChapter(selectedChapter === chapter.id ? null : chapter.id)}
                  >
                    {selectedChapter === chapter.id ? 'Hide' : 'Show'} Details
                  </Button>
                </Stack>
                
                {selectedChapter === chapter.id && (
                  <Box sx={{ mt: 2 }}>
                    <List dense>
                      {chapter.lessons.map((lesson) => (
                        <ListItem key={lesson.id}>
                          <ListItemIcon>
                            {getLessonIcon(lesson.type)}
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {lesson.title}
                                </Typography>
                                <Chip
                                  label={lesson.type}
                                  size="small"
                                  color={getLessonColor(lesson.type) as any}
                                  variant="outlined"
                                />
                                {lesson.completed && <CheckCircle color="success" />}
                              </Stack>
                            }
                            secondary={
                              <Stack direction="row" spacing={2}>
                                <Typography variant="caption" color="text.secondary">
                                  Time: {formatTimeSpent(lesson.timeSpent)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Last accessed: {formatDate(lesson.lastAccessed)}
                                </Typography>
                                {lesson.score !== undefined && (
                                  <Typography variant="caption" color="text.secondary">
                                    Score: {lesson.score}%
                                  </Typography>
                                )}
                              </Stack>
                            }
                          />
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedLesson(lesson);
                              setGradeDialogOpen(true);
                            }}
                          >
                            <Grade />
                          </IconButton>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </Paper>
            ))}
          </Stack>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            Recent Activity
          </Typography>
          <List>
            {progress.recentActivity.map((activity, index) => (
              <React.Fragment key={activity.id}>
                <ListItem>
                  <ListItemIcon>
                    {activity.type === 'lesson_completed' && <CheckCircle color="success" />}
                    {activity.type === 'quiz_taken' && <Quiz color="warning" />}
                    {activity.type === 'assignment_submitted' && <Assignment color="secondary" />}
                    {activity.type === 'live_session_attended' && <VideoCall color="error" />}
                  </ListItemIcon>
                  <ListItemText
                    primary={activity.title}
                    secondary={
                      <Stack direction="row" spacing={2}>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(activity.timestamp)}
                        </Typography>
                        {activity.score !== undefined && (
                          <Typography variant="caption" color="text.secondary">
                            Score: {activity.score}%
                          </Typography>
                        )}
                        {activity.points !== undefined && (
                          <Typography variant="caption" color="text.secondary">
                            Points: {activity.points}
                          </Typography>
                        )}
                      </Stack>
                    }
                  />
                </ListItem>
                {index < progress.recentActivity.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            Achievements
          </Typography>
          <Grid container spacing={2}>
            {progress.achievements.map((achievement) => (
              <Grid item xs={12} sm={6} md={4} key={achievement.id}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    {achievement.icon}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    {achievement.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {achievement.description}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Unlocked: {formatDate(achievement.unlockedAt)}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Grade Dialog */}
      <Dialog open={gradeDialogOpen} onClose={() => setGradeDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Grade Lesson: {selectedLesson?.title}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Grade (0-100)"
              type="number"
              value={grade}
              onChange={(e) => setGrade(parseInt(e.target.value) || 0)}
              fullWidth
              inputProps={{ min: 0, max: 100 }}
            />
            <TextField
              label="Feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              fullWidth
              multiline
              rows={4}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGradeDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleGradeSubmit} variant="contained">Submit Grade</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentProgressTracker;

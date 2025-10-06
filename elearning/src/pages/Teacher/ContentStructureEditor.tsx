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
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  useTheme,
  alpha,
  styled
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  DragIndicator,
  ExpandMore,
  VideoCall,
  Description,
  Quiz,
  Assignment,
  LiveTv,
  Psychology,
  MenuBook,
  Save,
  Cancel,
  Visibility,
  VisibilityOff,
  Lock,
  LockOpen,
  Schedule,
  AccessTime,
  Grade,
  Star,
  Bookmark,
  Share,
  Download,
  Upload,
  CloudUpload,
  CloudDownload,
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
  UnfoldMore,
  UnfoldLess,
  CheckCircle,
  Warning,
  Info,
  Error,
  Cancel as CancelIcon,
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
  School,
  People,
  Analytics,
  Settings,
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
  SyncProblem
} from '@mui/icons-material';

import { useAuth } from '../../hooks/useAuth';
import { courseService, ICourse } from '../../services/courseService';
import { UserRole } from '../../shared/types';
import ResponsiveDashboard from '../../components/Layout/ResponsiveDashboard';
import { useResponsive } from '../../utils/responsive';

// Styled Components with defensive theme handling
const EditorCard = styled(Card)(({ theme }) => {
  // Defensive theme handling
  const primaryColor = theme?.palette?.primary?.main || '#22c55e';
  const spacing = theme?.spacing || ((value: number) => `${value * 8}px`);
  
  return {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: spacing(2),
    border: `1px solid ${alpha(primaryColor, 0.1)}`,
  };
});

const ChapterCard = styled(Paper)(({ theme }) => {
  // Defensive theme handling
  const primaryColor = theme?.palette?.primary?.main || '#22c55e';
  const dividerColor = theme?.palette?.divider || '#e2e8f0';
  const spacing = theme?.spacing || ((value: number) => `${value * 8}px`);
  const shadows = theme?.shadows || ['none', 'none', 'none', 'none', 'none'];
  
  return {
    marginBottom: spacing(2),
    borderRadius: spacing(2),
    border: `1px solid ${alpha(dividerColor, 0.1)}`,
    '&:hover': {
      borderColor: primaryColor,
      boxShadow: shadows[4] || '0 2px 4px rgba(0,0,0,0.1)',
    },
  };
});

// Interfaces
interface Chapter {
  id: string;
  title: string;
  description: string;
  order: number;
  isPublished: boolean;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'document' | 'quiz' | 'assignment' | 'live' | 'interactive';
  duration: number;
  order: number;
  isPublished: boolean;
  isLocked: boolean;
  points: number;
  content?: any;
}

interface ContentStructureEditorProps {
  courseId: string;
}

const ContentStructureEditor: React.FC<ContentStructureEditorProps> = ({ courseId }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const { isMobile, isTablet, isDesktop } = useResponsive();

  // State management
  const [course, setCourse] = useState<ICourse | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Dialog states
  const [chapterDialogOpen, setChapterDialogOpen] = useState(false);
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);

  // Form states
  const [chapterForm, setChapterForm] = useState({
    title: '',
    description: '',
    isPublished: false
  });

  const [lessonForm, setLessonForm] = useState({
    title: '',
    description: '',
    type: 'video' as Lesson['type'],
    duration: 0,
    isPublished: false,
    isLocked: false,
    points: 0
  });

  // Load course data
  useEffect(() => {
    const loadCourseData = async () => {
      if (!courseId || !user) return;

      try {
        setLoading(true);
        setError(null);

        const courseData = await courseService.getCourseById(courseId);
        setCourse(courseData);

        // Load chapters structure (mock data for now)
        loadChaptersStructure();

      } catch (err) {
        console.error('Error loading course data:', err);
        setError('Failed to load course data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadCourseData();
  }, [courseId, user]);

  // Load chapters structure
  const loadChaptersStructure = () => {
    // Mock data - replace with actual API call
    const mockChapters: Chapter[] = [
      {
        id: 'chapter-1',
        title: 'Introduction to the Course',
        description: 'Get started with the fundamentals',
        order: 1,
        isPublished: true,
        lessons: [
          {
            id: 'lesson-1-1',
            title: 'Welcome and Course Overview',
            description: 'Introduction to the course content and objectives',
            type: 'video',
            duration: 15,
            order: 1,
            isPublished: true,
            isLocked: false,
            points: 10
          },
          {
            id: 'lesson-1-2',
            title: 'Setting Up Your Environment',
            description: 'Learn how to set up your development environment',
            type: 'document',
            duration: 20,
            order: 2,
            isPublished: true,
            isLocked: false,
            points: 15
          },
          {
            id: 'lesson-1-3',
            title: 'First Quiz',
            description: 'Test your understanding of the basics',
            type: 'quiz',
            duration: 10,
            order: 3,
            isPublished: false,
            isLocked: false,
            points: 25
          }
        ]
      },
      {
        id: 'chapter-2',
        title: 'Core Concepts',
        description: 'Learn the essential concepts',
        order: 2,
        isPublished: true,
        lessons: [
          {
            id: 'lesson-2-1',
            title: 'Understanding the Basics',
            description: 'Deep dive into fundamental concepts',
            type: 'video',
            duration: 30,
            order: 1,
            isPublished: true,
            isLocked: false,
            points: 20
          },
          {
            id: 'lesson-2-2',
            title: 'Live Session: Q&A',
            description: 'Interactive Q&A session with the instructor',
            type: 'live',
            duration: 60,
            order: 2,
            isPublished: true,
            isLocked: false,
            points: 30
          }
        ]
      },
      {
        id: 'chapter-3',
        title: 'Advanced Topics',
        description: 'Dive deeper into advanced concepts',
        order: 3,
        isPublished: false,
        lessons: [
          {
            id: 'lesson-3-1',
            title: 'Advanced Techniques',
            description: 'Master advanced techniques and best practices',
            type: 'video',
            duration: 45,
            order: 1,
            isPublished: false,
            isLocked: true,
            points: 40
          }
        ]
      }
    ];

    setChapters(mockChapters);
  };

  // Handle chapter operations
  const handleAddChapter = () => {
    setEditingChapter(null);
    setChapterForm({ title: '', description: '', isPublished: false });
    setChapterDialogOpen(true);
  };

  const handleEditChapter = (chapter: Chapter) => {
    setEditingChapter(chapter);
    setChapterForm({
      title: chapter.title,
      description: chapter.description,
      isPublished: chapter.isPublished
    });
    setChapterDialogOpen(true);
  };

  const handleDeleteChapter = (chapterId: string) => {
    setChapters(chapters.filter(chapter => chapter.id !== chapterId));
  };

  const handleSaveChapter = () => {
    if (editingChapter) {
      // Update existing chapter
      setChapters(chapters.map(chapter => 
        chapter.id === editingChapter.id 
          ? { ...chapter, ...chapterForm }
          : chapter
      ));
    } else {
      // Add new chapter
      const newChapter: Chapter = {
        id: `chapter-${Date.now()}`,
        ...chapterForm,
        order: chapters.length + 1,
        lessons: []
      };
      setChapters([...chapters, newChapter]);
    }
    setChapterDialogOpen(false);
  };

  // Handle lesson operations
  const handleAddLesson = (chapterId: string) => {
    setSelectedChapterId(chapterId);
    setEditingLesson(null);
    setLessonForm({
      title: '',
      description: '',
      type: 'video',
      duration: 0,
      isPublished: false,
      isLocked: false,
      points: 0
    });
    setLessonDialogOpen(true);
  };

  const handleEditLesson = (lesson: Lesson, chapterId: string) => {
    setSelectedChapterId(chapterId);
    setEditingLesson(lesson);
    setLessonForm({
      title: lesson.title,
      description: lesson.description,
      type: lesson.type,
      duration: lesson.duration,
      isPublished: lesson.isPublished,
      isLocked: lesson.isLocked,
      points: lesson.points
    });
    setLessonDialogOpen(true);
  };

  const handleDeleteLesson = (lessonId: string, chapterId: string) => {
    setChapters(chapters.map(chapter => 
      chapter.id === chapterId 
        ? { ...chapter, lessons: chapter.lessons.filter(lesson => lesson.id !== lessonId) }
        : chapter
    ));
  };

  const handleSaveLesson = () => {
    if (!selectedChapterId) return;

    if (editingLesson) {
      // Update existing lesson
      setChapters(chapters.map(chapter => 
        chapter.id === selectedChapterId 
          ? { 
              ...chapter, 
              lessons: chapter.lessons.map(lesson => 
                lesson.id === editingLesson.id 
                  ? { ...lesson, ...lessonForm }
                  : lesson
              )
            }
          : chapter
      ));
    } else {
      // Add new lesson
      const newLesson: Lesson = {
        id: `lesson-${Date.now()}`,
        ...lessonForm,
        order: chapters.find(c => c.id === selectedChapterId)?.lessons.length || 0 + 1
      };
      setChapters(chapters.map(chapter => 
        chapter.id === selectedChapterId 
          ? { ...chapter, lessons: [...chapter.lessons, newLesson] }
          : chapter
      ));
    }
    setLessonDialogOpen(false);
  };

  // Get lesson icon based on type
  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'video': return <VideoCall />;
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

  // Save structure
  const handleSaveStructure = async () => {
    try {
      setSaving(true);
      // TODO: Implement API call to save structure
      console.log('Saving structure:', chapters);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaving(false);
    } catch (err) {
      console.error('Error saving structure:', err);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ResponsiveDashboard>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ ml: 2 }}>
              Loading content structure...
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

  return (
    <ResponsiveDashboard>
      <Container maxWidth="xl" sx={{ py: 2 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                Content Structure Editor
              </Typography>
              <Typography variant="h6" color="text.secondary">
                {course?.title} - Organize your course content
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Stack direction="row" spacing={2}>
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={handleAddChapter}
                >
                  Add Chapter
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={handleSaveStructure}
                  disabled={saving}
                >
                  {saving ? <CircularProgress size={20} /> : 'Save Structure'}
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Box>

        {/* Content Structure */}
        <Box sx={{ mb: 4 }}>
          {chapters.length === 0 ? (
            <Paper sx={{ p: 6, textAlign: 'center' }}>
              <School sx={{ fontSize: 80, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                No chapters created yet
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Start building your course by adding chapters and lessons
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleAddChapter}
              >
                Create First Chapter
              </Button>
            </Paper>
          ) : (
            <Stack spacing={2}>
              {chapters.map((chapter, chapterIndex) => (
                <ChapterCard key={chapter.id}>
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Chapter {chapterIndex + 1}: {chapter.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {chapter.description}
                          </Typography>
                          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                            <Chip
                              label={chapter.isPublished ? 'Published' : 'Draft'}
                              color={chapter.isPublished ? 'success' : 'default'}
                              size="small"
                            />
                            <Chip
                              label={`${chapter.lessons.length} lessons`}
                              size="small"
                              variant="outlined"
                            />
                          </Stack>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Edit Chapter">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditChapter(chapter);
                              }}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Chapter">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteChapter(chapter.id);
                              }}
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box sx={{ width: '100%' }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            Lessons
                          </Typography>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Add />}
                            onClick={() => handleAddLesson(chapter.id)}
                          >
                            Add Lesson
                          </Button>
                        </Stack>
                        
                        {chapter.lessons.length === 0 ? (
                          <Box sx={{ textAlign: 'center', py: 3 }}>
                            <Typography variant="body2" color="text.secondary">
                              No lessons in this chapter yet
                            </Typography>
                          </Box>
                        ) : (
                          <List dense>
                            {chapter.lessons.map((lesson, lessonIndex) => (
                              <ListItem
                                key={lesson.id}
                                sx={{
                                  border: 1,
                                  borderColor: 'divider',
                                  borderRadius: 1,
                                  mb: 1,
                                  backgroundColor: 'background.paper'
                                }}
                              >
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
                                      {lesson.isLocked && <Lock color="disabled" />}
                                      {!lesson.isPublished && <VisibilityOff color="disabled" />}
                                    </Stack>
                                  }
                                  secondary={
                                    <Box>
                                      <Typography variant="caption" color="text.secondary">
                                        {lesson.description}
                                      </Typography>
                                      <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                                        <Chip
                                          label={`${lesson.duration} min`}
                                          size="small"
                                          variant="outlined"
                                        />
                                        <Chip
                                          label={`${lesson.points} pts`}
                                          size="small"
                                          variant="outlined"
                                        />
                                        <Chip
                                          label={lesson.isPublished ? 'Published' : 'Draft'}
                                          size="small"
                                          color={lesson.isPublished ? 'success' : 'default'}
                                        />
                                      </Stack>
                                    </Box>
                                  }
                                />
                                <ListItemSecondaryAction>
                                  <Stack direction="row" spacing={1}>
                                    <Tooltip title="Edit Lesson">
                                      <IconButton
                                        size="small"
                                        onClick={() => handleEditLesson(lesson, chapter.id)}
                                      >
                                        <Edit />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete Lesson">
                                      <IconButton
                                        size="small"
                                        onClick={() => handleDeleteLesson(lesson.id, chapter.id)}
                                      >
                                        <Delete />
                                      </IconButton>
                                    </Tooltip>
                                  </Stack>
                                </ListItemSecondaryAction>
                              </ListItem>
                            ))}
                          </List>
                        )}
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                </ChapterCard>
              ))}
            </Stack>
          )}
        </Box>

        {/* Chapter Dialog */}
        <Dialog open={chapterDialogOpen} onClose={() => setChapterDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingChapter ? 'Edit Chapter' : 'Add New Chapter'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <TextField
                label="Chapter Title"
                value={chapterForm.title}
                onChange={(e) => setChapterForm({ ...chapterForm, title: e.target.value })}
                fullWidth
                required
              />
              <TextField
                label="Description"
                value={chapterForm.description}
                onChange={(e) => setChapterForm({ ...chapterForm, description: e.target.value })}
                fullWidth
                multiline
                rows={3}
              />
              <FormControl>
                <InputLabel>Status</InputLabel>
                <Select
                  value={chapterForm.isPublished ? 'published' : 'draft'}
                  onChange={(e) => setChapterForm({ ...chapterForm, isPublished: e.target.value === 'published' })}
                >
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="published">Published</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setChapterDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveChapter} variant="contained">Save</Button>
          </DialogActions>
        </Dialog>

        {/* Lesson Dialog */}
        <Dialog open={lessonDialogOpen} onClose={() => setLessonDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingLesson ? 'Edit Lesson' : 'Add New Lesson'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <TextField
                label="Lesson Title"
                value={lessonForm.title}
                onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                fullWidth
                required
              />
              <TextField
                label="Description"
                value={lessonForm.description}
                onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                fullWidth
                multiline
                rows={3}
              />
              <FormControl fullWidth>
                <InputLabel>Lesson Type</InputLabel>
                <Select
                  value={lessonForm.type}
                  onChange={(e) => setLessonForm({ ...lessonForm, type: e.target.value as Lesson['type'] })}
                >
                  <MenuItem value="video">Video</MenuItem>
                  <MenuItem value="document">Document</MenuItem>
                  <MenuItem value="quiz">Quiz</MenuItem>
                  <MenuItem value="assignment">Assignment</MenuItem>
                  <MenuItem value="live">Live Session</MenuItem>
                  <MenuItem value="interactive">Interactive</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Duration (minutes)"
                type="number"
                value={lessonForm.duration}
                onChange={(e) => setLessonForm({ ...lessonForm, duration: parseInt(e.target.value) || 0 })}
                fullWidth
              />
              <TextField
                label="Points"
                type="number"
                value={lessonForm.points}
                onChange={(e) => setLessonForm({ ...lessonForm, points: parseInt(e.target.value) || 0 })}
                fullWidth
              />
              <Stack direction="row" spacing={2}>
                <FormControl>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={lessonForm.isPublished ? 'published' : 'draft'}
                    onChange={(e) => setLessonForm({ ...lessonForm, isPublished: e.target.value === 'published' })}
                  >
                    <MenuItem value="draft">Draft</MenuItem>
                    <MenuItem value="published">Published</MenuItem>
                  </Select>
                </FormControl>
                <FormControl>
                  <InputLabel>Access</InputLabel>
                  <Select
                    value={lessonForm.isLocked ? 'locked' : 'unlocked'}
                    onChange={(e) => setLessonForm({ ...lessonForm, isLocked: e.target.value === 'locked' })}
                  >
                    <MenuItem value="unlocked">Unlocked</MenuItem>
                    <MenuItem value="locked">Locked</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setLessonDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveLesson} variant="contained">Save</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </ResponsiveDashboard>
  );
};

export default ContentStructureEditor;

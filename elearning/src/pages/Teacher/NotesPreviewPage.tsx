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
  Paper,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  LinearProgress,
  IconButton,
  Tooltip,
  Badge,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Fab,
  Avatar,
  Stack,
  Container,
  AppBar,
  Toolbar,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  ArrowBack,
  MenuBook,
  Quiz,
  CheckCircle,
  RadioButtonUnchecked,
  PlayArrow,
  EmojiEvents,
  Star,
  TrendingUp,
  Psychology,
  AutoAwesome,
  Timer,
  School,
  Lightbulb,
  Speed,
  Assignment,
  BookmarkBorder,
  Bookmark,
  Share,
  Print,
  Fullscreen,
  FullscreenExit,
  VolumeUp,
  Pause,
  SkipNext,
  SkipPrevious,
  Close,
  Celebration,
  LocalFireDepartment,
  Diamond,
  Bolt,
  Favorite,
  ThumbUp,
  Edit,
  Visibility,
  Warning
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { courseNotesService } from '../../services/courseNotesService';

interface NoteSection {
  id: string;
  title: string;
  content: string;
  order: number;
  estimatedReadTime: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  keyPoints?: string[];
}

interface CourseNote {
  _id: string;
  title: string;
  description: string;
  chapter: number;
  sections: NoteSection[];
  isPublished: boolean;
  totalEstimatedTime: number;
  createdAt: string;
  updatedAt: string;
  course: {
    _id: string;
    title: string;
  };
}

const NotesPreviewPage: React.FC = () => {
  const { noteId } = useParams<{ noteId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // State management
  const [courseNote, setCourseNote] = useState<CourseNote | null>(null);
  const [currentSection, setCurrentSection] = useState<NoteSection | null>(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);

  // Load course note
  useEffect(() => {
    const loadCourseNote = async () => {
      if (!user || !noteId) {
        setError('Invalid note ID or user not authenticated');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Load course note by ID
        const noteData = await courseNotesService.getNotesById(noteId);
        console.log('Course note data:', noteData);
        
        if (noteData) {
          setCourseNote(noteData);
          if (noteData.sections && noteData.sections.length > 0) {
            setCurrentSection(noteData.sections[0]);
            setCurrentSectionIndex(0);
          } else {
            console.log('No sections found in course note');
          }
        } else {
          setError('Course note not found');
        }

      } catch (err: any) {
        console.error('Course note loading failed:', err);
        setError(err.message || 'Failed to load course note');
      } finally {
        setLoading(false);
      }
    };

    loadCourseNote();
  }, [noteId, user]);

  // Calculate estimated reading time
  const calculateReadTime = (content: string): number => {
    const wordsPerMinute = 200;
    const wordCount = content.split(' ').length;
    return Math.ceil(wordCount / wordsPerMinute);
  };

  // Extract key points from content
  const extractKeyPoints = (content: string): string[] => {
    const sentences = content.split('.').filter(s => s.trim().length > 20);
    return sentences.slice(0, 3).map(s => s.trim());
  };

  // Navigate to section
  const navigateToSection = (section: NoteSection, index: number) => {
    setCurrentSection(section);
    setCurrentSectionIndex(index);
    setReadingProgress(0);
  };

  // Navigate to previous section
  const goToPreviousSection = () => {
    if (currentSectionIndex > 0 && courseNote?.sections) {
      const prevSection = courseNote.sections[currentSectionIndex - 1];
      navigateToSection(prevSection, currentSectionIndex - 1);
    }
  };

  // Navigate to next section
  const goToNextSection = () => {
    if (currentSectionIndex < (courseNote?.sections.length || 0) - 1 && courseNote?.sections) {
      const nextSection = courseNote.sections[currentSectionIndex + 1];
      navigateToSection(nextSection, currentSectionIndex + 1);
    }
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'error';
      default: return 'default';
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button
          variant="contained"
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
        >
          Go Back
        </Button>
      </Container>
    );
  }

  if (!courseNote) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          Course note not found
        </Alert>
        <Button
          variant="contained"
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
        >
          Go Back
        </Button>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Header */}
      <AppBar position="sticky" sx={{ bgcolor: 'white', color: 'text.primary', boxShadow: 1 }}>
        <Toolbar>
          <IconButton
            edge="start"
            onClick={() => navigate(-1)}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          
          <Box sx={{ flexGrow: 1 }}>
            <Breadcrumbs>
              <Link
                component="button"
                variant="body2"
                onClick={() => navigate('/dashboard/teacher')}
                sx={{ textDecoration: 'none' }}
              >
                Dashboard
              </Link>
              <Link
                component="button"
                variant="body2"
                onClick={() => navigate(-1)}
                sx={{ textDecoration: 'none' }}
              >
                Course Management
              </Link>
              <Typography variant="body2" color="text.primary">
                Notes Preview
              </Typography>
            </Breadcrumbs>
            <Typography variant="h6" sx={{ mt: 0.5 }}>
              {courseNote?.title || 'Course Notes'} - Chapter {courseNote?.chapter || 1}
            </Typography>
          </Box>

          <Alert severity="info" sx={{ mr: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Visibility />
              Teacher Preview Mode
            </Box>
          </Alert>

          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={() => navigate(`/dashboard/teacher/courses/${courseNote?.course?._id || ''}`)}
            sx={{ mr: 1 }}
          >
            Edit Notes
          </Button>

          <IconButton onClick={toggleFullscreen}>
            {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth={isFullscreen ? false : "xl"} sx={{ py: 3 }}>
        <Grid container spacing={3}>
          {/* Sidebar - Table of Contents */}
          <Grid item xs={12} md={3}>
            <Card sx={{ position: 'sticky', top: 100, maxHeight: 'calc(100vh - 120px)', overflow: 'auto' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MenuBook color="primary" />
                  Table of Contents
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Progress: {currentSectionIndex + 1} of {courseNote.sections?.length || 0} sections
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={((currentSectionIndex + 1) / (courseNote.sections?.length || 1)) * 100}
                    sx={{ mt: 1 }}
                  />
                </Box>

                <List dense>
                  {courseNote.sections?.map((section, index) => (
                    <ListItem key={section.id} disablePadding>
                      <ListItemButton
                        selected={currentSectionIndex === index}
                        onClick={() => navigateToSection(section, index)}
                        sx={{
                          borderRadius: 1,
                          mb: 0.5,
                          '&.Mui-selected': {
                            bgcolor: 'primary.light',
                            color: 'primary.contrastText',
                            '&:hover': {
                              bgcolor: 'primary.main',
                            }
                          }
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          {currentSectionIndex === index ? (
                            <PlayArrow color="inherit" />
                          ) : currentSectionIndex > index ? (
                            <CheckCircle color="success" />
                          ) : (
                            <RadioButtonUnchecked />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={section.title}
                          secondary={`${section.estimatedReadTime || calculateReadTime(section.content)} min read`}
                          primaryTypographyProps={{
                            variant: 'body2',
                            fontWeight: currentSectionIndex === index ? 'bold' : 'normal'
                          }}
                          secondaryTypographyProps={{
                            variant: 'caption'
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  )) || []}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Main Content */}
          <Grid item xs={12} md={9}>
            {currentSection && courseNote?.sections && courseNote.sections.length > 0 ? (
              <Card sx={{ mb: 3 }}>
                <CardContent sx={{ p: 4 }}>
                  {/* Section Header */}
                  <Box sx={{ mb: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', flex: 1 }}>
                        {currentSection.title}
                      </Typography>
                      <Chip
                        label={`${currentSection.estimatedReadTime || calculateReadTime(currentSection.content)} min read`}
                        icon={<Timer />}
                        variant="outlined"
                      />
                      {currentSection.difficulty && (
                        <Chip
                          label={currentSection.difficulty}
                          color={getDifficultyColor(currentSection.difficulty) as any}
                          size="small"
                        />
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        Section {currentSectionIndex + 1} of {courseNote.sections?.length || 0}
                      </Typography>
                      <Divider orientation="vertical" flexItem />
                      <Typography variant="body2" color="text.secondary">
                        Chapter {courseNote?.chapter || 1}
                      </Typography>
                    </Box>

                    <LinearProgress
                      variant="determinate"
                      value={readingProgress}
                      sx={{ height: 6, borderRadius: 3, mb: 2 }}
                    />
                  </Box>

                  {/* Section Content */}
                  <Box sx={{ mb: 4 }}>
                    <Typography
                      variant="body1"
                      sx={{
                        lineHeight: 1.8,
                        fontSize: '1.1rem',
                        color: 'text.primary',
                        '& p': { mb: 2 },
                        '& h1, & h2, & h3, & h4, & h5, & h6': { 
                          mt: 3, 
                          mb: 2, 
                          fontWeight: 'bold' 
                        },
                        '& ul, & ol': { 
                          pl: 3, 
                          mb: 2 
                        },
                        '& li': { 
                          mb: 1 
                        },
                        '& blockquote': {
                          borderLeft: '4px solid',
                          borderColor: 'primary.main',
                          pl: 2,
                          ml: 0,
                          fontStyle: 'italic',
                          bgcolor: 'grey.50',
                          p: 2,
                          borderRadius: 1
                        }
                      }}
                      dangerouslySetInnerHTML={{ __html: currentSection.content }}
                    />
                  </Box>

                  {/* Key Points */}
                  {currentSection.keyPoints && currentSection.keyPoints.length > 0 && (
                    <Paper sx={{ p: 3, mb: 4, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Lightbulb />
                        Key Points
                      </Typography>
                      <List dense>
                        {currentSection.keyPoints.map((point, index) => (
                          <ListItem key={index} sx={{ py: 0.5 }}>
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              <Star color="inherit" fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary={point} />
                          </ListItem>
                        ))}
                      </List>
                    </Paper>
                  )}

                  {/* Navigation */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4 }}>
                    <Button
                      variant="outlined"
                      startIcon={<SkipPrevious />}
                      onClick={goToPreviousSection}
                      disabled={currentSectionIndex === 0}
                    >
                      Previous Section
                    </Button>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Button
                        variant="outlined"
                        startIcon={<Quiz />}
                        onClick={() => {
                          // Mock quiz generation for preview
                          alert('In student view, this would generate an AI quiz based on the section content.');
                        }}
                      >
                        Generate Quiz
                      </Button>
                      
                      <Button
                        variant="contained"
                        onClick={() => {
                          // Mock completion for preview
                          setReadingProgress(100);
                          setTimeout(() => {
                            if (currentSectionIndex < (courseNote.sections?.length || 0) - 1) {
                              goToNextSection();
                            } else {
                              alert('Congratulations! You have completed all sections.');
                            }
                          }, 1000);
                        }}
                        startIcon={<CheckCircle />}
                      >
                        Mark as Complete
                      </Button>
                    </Box>

                    <Button
                      variant="outlined"
                      endIcon={<SkipNext />}
                      onClick={goToNextSection}
                      disabled={currentSectionIndex === (courseNote.sections?.length || 0) - 1}
                    >
                      Next Section
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            ) : (
              <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
                <MenuBook sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Sections Available
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  This course note doesn't have any sections yet.
                </Typography>
              </Paper>
            )}

            {/* Course Info */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  About This Course Note
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {courseNote?.description || 'No description available'}
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="primary.main" fontWeight="bold">
                        {courseNote.sections?.length || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Sections
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="primary.main" fontWeight="bold">
                        {courseNote.totalEstimatedTime || courseNote.sections?.reduce((total, section) => 
                          total + (section.estimatedReadTime || calculateReadTime(section.content)), 0
                        ) || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Minutes
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="primary.main" fontWeight="bold">
                        {courseNote.chapter}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Chapter
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Chip
                        label={courseNote.isPublished ? 'Published' : 'Draft'}
                        color={courseNote.isPublished ? 'success' : 'warning'}
                        variant="filled"
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Status
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Floating Action Button for Quick Actions */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => navigate(`/dashboard/teacher/courses/${courseNote?.course?._id || ''}`)}
      >
        <Edit />
      </Fab>
    </Box>
  );
};

export default NotesPreviewPage;
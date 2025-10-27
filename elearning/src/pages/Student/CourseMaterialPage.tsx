import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  Badge,
  Fab,
  Drawer,
  AppBar,
  Toolbar,
  useTheme,
  useMediaQuery,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Skeleton,
  Stack,
  Avatar,
  CardActions,
  Collapse,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Breadcrumbs,
  Link,
  Snackbar
} from '@mui/material';
import {
  ArrowBack,
  MenuBook,
  CheckCircle,
  RadioButtonUnchecked,
  ExpandMore,
  PlayArrow,
  PauseCircle,
  VolumeUp,
  VolumeOff,
  Speed,
  Translate,
  Settings,
  Bookmark,
  BookmarkBorder,
  Share,
  Print,
  Fullscreen,
  FullscreenExit,
  Menu,
  Close,
  RecordVoiceOver,
  Stop,
  NavigateNext,
  NavigateBefore,
  Timer,
  Lightbulb,
  Quiz,
  Assignment,
  School,
  TrendingUp,
  Visibility,
  VisibilityOff,
  DarkMode,
  LightMode,
  FontDownload,
  TextFields,
  AutoStories,
  Psychology,
  Star,
  StarBorder,
  Notes,
  ExpandLess,
  Home
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { courseService, ICourse } from '../../services/courseService';
import { courseNotesService } from '../../services/courseNotesService';
import { progressService } from '../../services/progressService';

interface MaterialSection {
  id: string;
  title: string;
  content: string;
  order: number;
  isCompleted: boolean;
  estimatedReadTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  keyPoints: string[];
  summary?: string;
  tags?: string[];
}

interface ReadingPreferences {
  fontSize: number;
  fontFamily: string;
  theme: 'light' | 'dark' | 'sepia';
  voiceEnabled: boolean;
  voiceRate: number;
  voicePitch: number;
  voiceVolume: number;
  selectedVoice: string;
  autoScroll: boolean;
  highlightEnabled: boolean;
  focusMode: boolean;
  lineHeight: number;
}

const CourseMaterialPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  
  // Refs
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // State management
  const [course, setCourse] = useState<ICourse | null>(null);
  const [materialSections, setMaterialSections] = useState<MaterialSection[]>([]);
  const [currentSection, setCurrentSection] = useState<MaterialSection | null>(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [fullscreen, setFullscreen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [showProgress, setShowProgress] = useState(true);
  const [activeStep, setActiveStep] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  // Voice & Reading State
  const [isReading, setIsReading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [readingProgress, setReadingProgress] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  
  // Reading Preferences with enhanced options
  const [preferences, setPreferences] = useState<ReadingPreferences>({
    fontSize: 16,
    fontFamily: 'Inter',
    theme: 'light',
    voiceEnabled: true,
    voiceRate: 1,
    voicePitch: 1,
    voiceVolume: 1,
    selectedVoice: '',
    autoScroll: true,
    highlightEnabled: true,
    focusMode: false,
    lineHeight: 1.8
  });

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      setAvailableVoices(voices);
      if (voices.length > 0 && !preferences.selectedVoice) {
        const englishVoice = voices.find(voice => voice.lang.startsWith('en')) || voices[0];
        setPreferences(prev => ({ ...prev, selectedVoice: englishVoice.name }));
      }
    };

    loadVoices();
    speechSynthesis.addEventListener('voiceschanged', loadVoices);
    
    return () => {
      speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

  // Reading time tracker
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentSection && !loading) {
      interval = setInterval(() => {
        setReadingTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentSection, loading]);

  // Load course material
  useEffect(() => {
    const loadCourseMaterial = async () => {
      if (!user || !id) {
        setError('Please log in to access course material');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Load course details
        const courseData = await courseService.getCourseById(id);
        setCourse(courseData);

        // Load course notes/material
        const notesResponse = await courseNotesService.getCourseNotes(id);
        
        if (notesResponse && notesResponse.courseNotes && notesResponse.courseNotes.length > 0) {
          const sections: MaterialSection[] = notesResponse.courseNotes.flatMap((note: any) => 
            note.sections?.map((section: any, index: number) => ({
              id: `${note._id}_${index}`,
              title: section.title || `Section ${index + 1}`,
              content: section.content || '',
              order: section.order || index,
              isCompleted: section.isCompleted || false,
              estimatedReadTime: Math.ceil((section.content?.length || 0) / 200),
              difficulty: section.difficulty || 'medium',
              keyPoints: section.keyPoints || [],
              summary: section.summary || '',
              tags: section.tags || []
            })) || []
          );
          
          setMaterialSections(sections);
          if (sections.length > 0) {
            setCurrentSection(sections[0]);
            setCurrentSectionIndex(0);
          }
        } else if (notesResponse && notesResponse.sections && notesResponse.sections.length > 0) {
          const sections: MaterialSection[] = notesResponse.sections.map((section: any, index: number) => ({
            id: section._id || `section_${index}`,
            title: section.title || `Section ${index + 1}`,
            content: section.content || '',
            order: section.order || index,
            isCompleted: section.isCompleted || false,
            estimatedReadTime: Math.ceil((section.content?.length || 0) / 200),
            difficulty: section.difficulty || 'medium',
            keyPoints: section.keyPoints || [],
            summary: section.summary || '',
            tags: section.tags || []
          }));
          
          setMaterialSections(sections);
          if (sections.length > 0) {
            setCurrentSection(sections[0]);
            setCurrentSectionIndex(0);
          }
        } else {
          console.log('No course material found for course:', id);
          setMaterialSections([]);
        }

      } catch (err: any) {
        console.error('Error loading course material:', err);
        setError(err.message || 'Failed to load course material');
      } finally {
        setLoading(false);
      }
    };

    loadCourseMaterial();
  }, [user, id]);

  // Voice synthesis functions
  const startReading = (text?: string) => {
    if (!preferences.voiceEnabled) return;
    
    const textToRead = text || currentSection?.content || '';
    if (!textToRead) return;

    speechSynthesis.cancel();

    const cleanText = textToRead.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    const selectedVoice = availableVoices.find(voice => voice.name === preferences.selectedVoice);
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    utterance.rate = preferences.voiceRate;
    utterance.pitch = preferences.voicePitch;
    utterance.volume = preferences.voiceVolume;

    utterance.onstart = () => {
      setIsReading(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsReading(false);
      setIsPaused(false);
      setReadingProgress(100);
    };

    utterance.onerror = () => {
      setIsReading(false);
      setIsPaused(false);
    };

    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        const progress = (event.charIndex / cleanText.length) * 100;
        setReadingProgress(progress);
      }
    };

    speechSynthesisRef.current = utterance;
    speechSynthesis.speak(utterance);
  };

  const pauseReading = () => {
    if (speechSynthesis.speaking && !speechSynthesis.paused) {
      speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const resumeReading = () => {
    if (speechSynthesis.paused) {
      speechSynthesis.resume();
      setIsPaused(false);
    }
  };

  const stopReading = () => {
    speechSynthesis.cancel();
    setIsReading(false);
    setIsPaused(false);
    setReadingProgress(0);
  };

  // Navigation functions
  const goToSection = (index: number) => {
    if (index >= 0 && index < materialSections.length) {
      setCurrentSection(materialSections[index]);
      setCurrentSectionIndex(index);
      setActiveStep(index);
      stopReading();
      setReadingProgress(0);
      setReadingTime(0);
      if (isMobile) {
        setSidebarOpen(false);
      }
      
      // Scroll to top of content
      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }
    }
  };

  const nextSection = () => {
    if (currentSectionIndex < materialSections.length - 1) {
      goToSection(currentSectionIndex + 1);
    }
  };

  const previousSection = () => {
    if (currentSectionIndex > 0) {
      goToSection(currentSectionIndex - 1);
    }
  };

  // Mark section as completed
  const markSectionCompleted = async () => {
    if (!currentSection) return;
    
    try {
      const updatedSections = materialSections.map(section =>
        section.id === currentSection.id ? { ...section, isCompleted: true } : section
      );
      setMaterialSections(updatedSections);
      setCurrentSection({ ...currentSection, isCompleted: true });
      
      await progressService.updateReadingProgress(currentSection.id, true);
      
      setSnackbarMessage('Section marked as completed! 🎉');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error updating progress:', error);
      setSnackbarMessage('Failed to update progress');
      setSnackbarOpen(true);
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!fullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setFullscreen(!fullscreen);
  };

  // Get theme colors based on preference
  const getThemeColors = () => {
    switch (preferences.theme) {
      case 'dark':
        return {
          background: '#121212',
          paper: '#1e1e1e',
          text: '#ffffff',
          secondary: '#b0b0b0'
        };
      case 'sepia':
        return {
          background: '#f4f1ea',
          paper: '#faf8f1',
          text: '#5c4b37',
          secondary: '#8b7355'
        };
      default:
        return {
          background: '#fafafa',
          paper: '#ffffff',
          text: '#333333',
          secondary: '#666666'
        };
    }
  };

  const themeColors = getThemeColors();

  // Enhanced sidebar with better organization
  const renderSidebar = () => (
    <Box sx={{ 
      width: isMobile ? '100%' : 320, 
      height: '100%', 
      bgcolor: themeColors.paper,
      borderRight: `1px solid ${theme.palette.divider}`
    }}>
      {/* Course Header */}
      <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
            <School />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: themeColors.text }}>
              Course Material
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {course?.title}
            </Typography>
          </Box>
        </Box>
        
        {/* Progress Overview */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Progress
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: themeColors.text }}>
              {materialSections.filter(s => s.isCompleted).length}/{materialSections.length}
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={(materialSections.filter(s => s.isCompleted).length / materialSections.length) * 100}
            sx={{ 
              height: 8, 
              borderRadius: 4,
              bgcolor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)'
              }
            }}
          />
        </Box>

        {/* Quick Stats */}
        <Grid container spacing={1}>
          <Grid item xs={4}>
            <Paper sx={{ p: 1, textAlign: 'center', bgcolor: 'primary.50' }}>
              <Typography variant="caption" color="primary.main" sx={{ fontWeight: 600 }}>
                {Math.round(materialSections.reduce((acc, s) => acc + s.estimatedReadTime, 0))}m
              </Typography>
              <Typography variant="caption" display="block" color="text.secondary">
                Total
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={4}>
            <Paper sx={{ p: 1, textAlign: 'center', bgcolor: 'success.50' }}>
              <Typography variant="caption" color="success.main" sx={{ fontWeight: 600 }}>
                {materialSections.filter(s => s.isCompleted).length}
              </Typography>
              <Typography variant="caption" display="block" color="text.secondary">
                Done
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={4}>
            <Paper sx={{ p: 1, textAlign: 'center', bgcolor: 'warning.50' }}>
              <Typography variant="caption" color="warning.main" sx={{ fontWeight: 600 }}>
                {materialSections.length - materialSections.filter(s => s.isCompleted).length}
              </Typography>
              <Typography variant="caption" display="block" color="text.secondary">
                Left
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
      
      {/* Section List */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {materialSections.map((section, index) => (
          <ListItemButton
            key={section.id}
            selected={index === currentSectionIndex}
            onClick={() => goToSection(index)}
            sx={{ 
              px: 3,
              py: 2,
              borderLeft: index === currentSectionIndex ? 4 : 0,
              borderColor: 'primary.main',
              '&.Mui-selected': {
                bgcolor: 'primary.50',
                '&:hover': {
                  bgcolor: 'primary.100'
                }
              },
              '&:hover': {
                bgcolor: 'grey.50'
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              {section.isCompleted ? (
                <CheckCircle sx={{ color: 'success.main' }} />
              ) : (
                <RadioButtonUnchecked color="action" />
              )}
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="body2" sx={{ fontWeight: index === currentSectionIndex ? 600 : 400 }}>
                  {section.title}
                </Typography>
              }
              secondary={
                <Box sx={{ mt: 0.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Chip 
                      label={`${section.estimatedReadTime}min`}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.7rem', height: 20 }}
                    />
                    <Chip 
                      label={section.difficulty} 
                      size="small" 
                      color={
                        section.difficulty === 'easy' ? 'success' : 
                        section.difficulty === 'medium' ? 'warning' : 'error'
                      }
                      sx={{ fontSize: '0.7rem', height: 20 }}
                    />
                  </Box>
                  {section.tags && section.tags.length > 0 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {section.tags.slice(0, 2).map((tag, tagIndex) => (
                        <Chip
                          key={tagIndex}
                          label={tag}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.6rem', height: 16 }}
                        />
                      ))}
                    </Box>
                  )}
                </Box>
              }
            />
          </ListItemButton>
        ))}
      </Box>
    </Box>
  );

  // Enhanced settings panel
  const renderSettings = () => (
    <Drawer
      anchor="right"
      open={settingsOpen}
      onClose={() => setSettingsOpen(false)}
      PaperProps={{ 
        sx: { 
          width: isMobile ? '100%' : 400,
          bgcolor: themeColors.paper
        } 
      }}
    >
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h6" sx={{ color: themeColors.text }}>Reading Settings</Typography>
          <IconButton onClick={() => setSettingsOpen(false)}>
            <Close />
          </IconButton>
        </Box>

        {/* Display Settings */}
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: themeColors.text }}>
          Display
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <Typography gutterBottom>Font Size</Typography>
          <Slider
            value={preferences.fontSize}
            onChange={(_, value) => setPreferences(prev => ({ ...prev, fontSize: value as number }))}
            min={12}
            max={28}
            marks={[
              { value: 12, label: 'S' },
              { value: 16, label: 'M' },
              { value: 20, label: 'L' },
              { value: 24, label: 'XL' },
              { value: 28, label: 'XXL' }
            ]}
            valueLabelDisplay="auto"
          />
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography gutterBottom>Line Height</Typography>
          <Slider
            value={preferences.lineHeight}
            onChange={(_, value) => setPreferences(prev => ({ ...prev, lineHeight: value as number }))}
            min={1.2}
            max={2.5}
            step={0.1}
            marks={[
              { value: 1.2, label: 'Tight' },
              { value: 1.8, label: 'Normal' },
              { value: 2.5, label: 'Loose' }
            ]}
            valueLabelDisplay="auto"
          />
        </Box>

        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Font Family</InputLabel>
          <Select
            value={preferences.fontFamily}
            onChange={(e) => setPreferences(prev => ({ ...prev, fontFamily: e.target.value }))}
          >
            <MenuItem value="Inter">Inter (Modern)</MenuItem>
            <MenuItem value="Georgia">Georgia (Serif)</MenuItem>
            <MenuItem value="Arial">Arial (Sans-serif)</MenuItem>
            <MenuItem value="Times New Roman">Times New Roman</MenuItem>
            <MenuItem value="Roboto">Roboto</MenuItem>
            <MenuItem value="Open Sans">Open Sans</MenuItem>
          </Select>
        </FormControl>

        {/* Theme Selection */}
        <Box sx={{ mb: 3 }}>
          <Typography gutterBottom>Theme</Typography>
          <Grid container spacing={1}>
            {[
              { value: 'light', label: 'Light', icon: <LightMode /> },
              { value: 'dark', label: 'Dark', icon: <DarkMode /> },
              { value: 'sepia', label: 'Sepia', icon: <AutoStories /> }
            ].map((themeOption) => (
              <Grid item xs={4} key={themeOption.value}>
                <Button
                  fullWidth
                  variant={preferences.theme === themeOption.value ? 'contained' : 'outlined'}
                  onClick={() => setPreferences(prev => ({ ...prev, theme: themeOption.value as any }))}
                  startIcon={themeOption.icon}
                  sx={{ py: 1 }}
                >
                  {themeOption.label}
                </Button>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Reading Features */}
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: themeColors.text }}>
          Reading Features
        </Typography>

        <FormControlLabel
          control={
            <Switch
              checked={preferences.focusMode}
              onChange={(e) => setPreferences(prev => ({ ...prev, focusMode: e.target.checked }))}
            />
          }
          label="Focus Mode"
          sx={{ mb: 1 }}
        />

        <FormControlLabel
          control={
            <Switch
              checked={preferences.highlightEnabled}
              onChange={(e) => setPreferences(prev => ({ ...prev, highlightEnabled: e.target.checked }))}
            />
          }
          label="Text Highlighting"
          sx={{ mb: 2 }}
        />

        <Divider sx={{ my: 2 }} />

        {/* Voice Settings */}
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: themeColors.text }}>
          Voice Reader
        </Typography>
        
        <FormControlLabel
          control={
            <Switch
              checked={preferences.voiceEnabled}
              onChange={(e) => setPreferences(prev => ({ ...prev, voiceEnabled: e.target.checked }))}
            />
          }
          label="Enable Voice Reading"
          sx={{ mb: 2 }}
        />

        {preferences.voiceEnabled && (
          <>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Voice</InputLabel>
              <Select
                value={preferences.selectedVoice}
                onChange={(e) => setPreferences(prev => ({ ...prev, selectedVoice: e.target.value }))}
              >
                {availableVoices.map((voice) => (
                  <MenuItem key={voice.name} value={voice.name}>
                    {voice.name} ({voice.lang})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ mb: 2 }}>
              <Typography gutterBottom>Speech Rate</Typography>
              <Slider
                value={preferences.voiceRate}
                onChange={(_, value) => setPreferences(prev => ({ ...prev, voiceRate: value as number }))}
                min={0.5}
                max={2}
                step={0.1}
                marks={[
                  { value: 0.5, label: 'Slow' },
                  { value: 1, label: 'Normal' },
                  { value: 2, label: 'Fast' }
                ]}
                valueLabelDisplay="auto"
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography gutterBottom>Voice Pitch</Typography>
              <Slider
                value={preferences.voicePitch}
                onChange={(_, value) => setPreferences(prev => ({ ...prev, voicePitch: value as number }))}
                min={0.5}
                max={2}
                step={0.1}
                marks={[
                  { value: 0.5, label: 'Low' },
                  { value: 1, label: 'Normal' },
                  { value: 2, label: 'High' }
                ]}
                valueLabelDisplay="auto"
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography gutterBottom>Volume</Typography>
              <Slider
                value={preferences.voiceVolume}
                onChange={(_, value) => setPreferences(prev => ({ ...prev, voiceVolume: value as number }))}
                min={0}
                max={1}
                step={0.1}
                marks={[
                  { value: 0, label: 'Mute' },
                  { value: 0.5, label: '50%' },
                  { value: 1, label: '100%' }
                ]}
                valueLabelDisplay="auto"
              />
            </Box>
          </>
        )}
      </Box>
    </Drawer>
  );

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        bgcolor: themeColors.background
      }}>
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" sx={{ mt: 2, color: themeColors.text }}>
          Loading course material...
        </Typography>
        <Box sx={{ mt: 2, width: 300 }}>
          <Skeleton variant="text" height={40} />
          <Skeleton variant="text" height={30} />
          <Skeleton variant="rectangular" height={200} sx={{ mt: 1 }} />
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          variant="outlined"
        >
          Go Back
        </Button>
      </Container>
    );
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      height: '100vh', 
      bgcolor: themeColors.background,
      color: themeColors.text,
      position: 'relative',
      '&::before': preferences.theme === 'light' ? {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '300px',
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
        zIndex: -1,
      } : {}
    }}>
      {/* Mobile App Bar */}
      {isMobile && (
        <AppBar 
          position="fixed" 
          sx={{ 
            zIndex: theme.zIndex.drawer + 1,
            background: preferences.theme === 'light' 
              ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.95) 0%, rgba(118, 75, 162, 0.95) 100%)'
              : themeColors.paper,
            backdropFilter: 'blur(20px)',
            color: preferences.theme === 'light' ? 'white' : themeColors.text,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            borderBottom: `1px solid ${theme.palette.divider}`
          }}
        >
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setSidebarOpen(true)}
              sx={{ mr: 2 }}
            >
              <Menu />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
              {currentSection?.title || 'Course Material'}
            </Typography>
            <IconButton color="inherit" onClick={() => setSettingsOpen(true)}>
              <Settings />
            </IconButton>
          </Toolbar>
        </AppBar>
      )}

      {/* Sidebar */}
      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: isMobile ? '100%' : 320,
            boxSizing: 'border-box',
            mt: isMobile ? 8 : 0,
            bgcolor: themeColors.paper,
            borderRight: `1px solid ${theme.palette.divider}`
          }
        }}
      >
        {renderSidebar()}
      </Drawer>

      {/* Main Content */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: 'column',
          mt: isMobile ? 8 : 0,
          bgcolor: preferences.focusMode ? themeColors.paper : themeColors.background,
          transition: 'all 0.3s ease'
        }}
      >
        {/* Desktop Header */}
        {!isMobile && (
          <Paper 
            elevation={0}
            sx={{ 
              p: 3, 
              borderBottom: 1, 
              borderColor: 'divider', 
              background: preferences.theme === 'light' 
                ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)'
                : themeColors.paper,
              backdropFilter: 'blur(20px)',
              borderRadius: 0
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton 
                  onClick={() => navigate(-1)} 
                  sx={{ 
                    mr: 2,
                    bgcolor: 'primary.50',
                    '&:hover': { bgcolor: 'primary.100' }
                  }}
                >
                  <ArrowBack />
                </IconButton>
                <Breadcrumbs 
                  separator={<NavigateNext fontSize="small" />}
                  sx={{ 
                    '& .MuiBreadcrumbs-separator': { 
                      color: 'primary.main' 
                    }
                  }}
                >
                  <Link 
                    color="inherit" 
                    href="#" 
                    onClick={() => navigate('/courses')}
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      textDecoration: 'none',
                      '&:hover': { color: 'primary.main' }
                    }}
                  >
                    <Home sx={{ mr: 0.5 }} fontSize="inherit" />
                    Courses
                  </Link>
                  <Link 
                    color="inherit" 
                    href="#" 
                    onClick={() => navigate(`/dashboard/student/course/${id}`)}
                    sx={{ 
                      textDecoration: 'none',
                      '&:hover': { color: 'primary.main' }
                    }}
                  >
                    {course?.title}
                  </Link>
                  <Typography color="primary.main" sx={{ fontWeight: 600 }}>
                    Material
                  </Typography>
                </Breadcrumbs>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Tooltip title="Reading Time">
                  <Chip 
                    icon={<Timer />} 
                    label={`${Math.floor(readingTime / 60)}:${(readingTime % 60).toString().padStart(2, '0')}`}
                    variant="outlined"
                    size="small"
                    sx={{ 
                      bgcolor: 'primary.50',
                      borderColor: 'primary.200',
                      color: 'primary.main',
                      fontWeight: 600
                    }}
                  />
                </Tooltip>
                <Tooltip title={bookmarked ? "Remove Bookmark" : "Bookmark"}>
                  <IconButton 
                    onClick={() => setBookmarked(!bookmarked)}
                    sx={{ 
                      bgcolor: bookmarked ? 'primary.50' : 'transparent',
                      '&:hover': { bgcolor: 'primary.100' }
                    }}
                  >
                    {bookmarked ? <Bookmark color="primary" /> : <BookmarkBorder />}
                  </IconButton>
                </Tooltip>
                <Tooltip title={fullscreen ? "Exit Fullscreen" : "Fullscreen"}>
                  <IconButton 
                    onClick={toggleFullscreen}
                    sx={{ '&:hover': { bgcolor: 'primary.50' } }}
                  >
                    {fullscreen ? <FullscreenExit /> : <Fullscreen />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Settings">
                  <IconButton 
                    onClick={() => setSettingsOpen(true)}
                    sx={{ '&:hover': { bgcolor: 'primary.50' } }}
                  >
                    <Settings />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Paper>
        )}

        {/* Content Area */}
        <Box 
          ref={contentRef}
          sx={{ 
            flexGrow: 1, 
            overflow: 'auto', 
            position: 'relative',
            px: preferences.focusMode ? 0 : 2,
            py: preferences.focusMode ? 0 : 2
          }}
        >
          {currentSection ? (
            <Container 
              maxWidth={preferences.focusMode ? false : "lg"} 
              sx={{ 
                py: preferences.focusMode ? 4 : 3,
                px: preferences.focusMode ? 8 : 3,
                maxWidth: preferences.focusMode ? '800px' : undefined,
                mx: 'auto'
              }}
            >
              {/* Section Header */}
              <Card 
                elevation={preferences.focusMode ? 0 : 2}
                sx={{ 
                  mb: 4, 
                  bgcolor: themeColors.paper,
                  border: preferences.focusMode ? 'none' : `1px solid ${theme.palette.divider}`,
                  borderRadius: preferences.focusMode ? 0 : 2
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography 
                        variant="h3" 
                        sx={{ 
                          fontSize: preferences.fontSize + 16,
                          fontFamily: preferences.fontFamily,
                          fontWeight: 700,
                          color: themeColors.text,
                          mb: 2,
                          lineHeight: 1.2
                        }}
                      >
                        {currentSection.title}
                      </Typography>
                      
                      {currentSection.summary && (
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            color: themeColors.secondary,
                            fontSize: preferences.fontSize + 2,
                            fontStyle: 'italic',
                            mb: 2
                          }}
                        >
                          {currentSection.summary}
                        </Typography>
                      )}
                    </Box>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                      <Chip 
                        label={currentSection.difficulty} 
                        color={
                          currentSection.difficulty === 'easy' ? 'success' : 
                          currentSection.difficulty === 'medium' ? 'warning' : 'error'
                        }
                        sx={{ fontWeight: 600 }}
                      />
                      {currentSection.isCompleted && (
                        <Chip 
                          icon={<CheckCircle />} 
                          label="Completed" 
                          color="success"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </Box>
                  
                  {/* Section Meta Info */}
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Timer color="primary" />
                        <Typography variant="body2" color="text.secondary">
                          {currentSection.estimatedReadTime} min read
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Psychology color="primary" />
                        <Typography variant="body2" color="text.secondary">
                          {currentSection.difficulty} level
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Notes color="primary" />
                        <Typography variant="body2" color="text.secondary">
                          Section {currentSectionIndex + 1} of {materialSections.length}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TrendingUp color="primary" />
                        <Typography variant="body2" color="text.secondary">
                          {Math.round((materialSections.filter(s => s.isCompleted).length / materialSections.length) * 100)}% complete
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  {/* Tags */}
                  {currentSection.tags && currentSection.tags.length > 0 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                      {currentSection.tags.map((tag, index) => (
                        <Chip
                          key={index}
                          label={tag}
                          size="small"
                          variant="outlined"
                          sx={{ borderRadius: 2 }}
                        />
                      ))}
                    </Box>
                  )}

                  {/* Voice Controls */}
                  {preferences.voiceEnabled && (
                    <Paper 
                      elevation={0}
                      sx={{ 
                        p: 3,
                        bgcolor: 'primary.50',
                        border: '1px solid',
                        borderColor: 'primary.200',
                        borderRadius: 2,
                        mb: 3
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <VolumeUp color="primary" />
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                            Voice Reader:
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {!isReading ? (
                            <Button
                              startIcon={<PlayArrow />}
                              onClick={() => startReading()}
                              variant="contained"
                              size="small"
                              color="primary"
                              sx={{ borderRadius: 2 }}
                            >
                              Read Aloud
                            </Button>
                          ) : (
                            <>
                              {!isPaused ? (
                                <Button
                                  startIcon={<PauseCircle />}
                                  onClick={pauseReading}
                                  variant="contained"
                                  size="small"
                                  color="warning"
                                  sx={{ borderRadius: 2 }}
                                >
                                  Pause
                                </Button>
                              ) : (
                                <Button
                                  startIcon={<PlayArrow />}
                                  onClick={resumeReading}
                                  variant="contained"
                                  size="small"
                                  color="success"
                                  sx={{ borderRadius: 2 }}
                                >
                                  Resume
                                </Button>
                              )}
                              <Button
                                startIcon={<Stop />}
                                onClick={stopReading}
                                variant="contained"
                                size="small"
                                color="error"
                                sx={{ borderRadius: 2 }}
                              >
                                Stop
                              </Button>
                            </>
                          )}
                        </Box>
                        
                        {isReading && (
                          <Box sx={{ flexGrow: 1, minWidth: 200 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                              Reading Progress: {Math.round(readingProgress)}%
                            </Typography>
                            <LinearProgress 
                              variant="determinate" 
                              value={readingProgress} 
                              sx={{ 
                                height: 8, 
                                borderRadius: 4,
                                bgcolor: 'grey.200',
                                '& .MuiLinearProgress-bar': {
                                  borderRadius: 4,
                                  background: 'linear-gradient(45deg, #4caf50 30%, #8bc34a 90%)'
                                }
                              }}
                            />
                          </Box>
                        )}
                      </Box>
                    </Paper>
                  )}
                </CardContent>
              </Card>

              {/* Section Content */}
              <Card 
                elevation={preferences.focusMode ? 0 : 1}
                sx={{ 
                  mb: 4, 
                  bgcolor: themeColors.paper,
                  border: preferences.focusMode ? 'none' : `1px solid ${theme.palette.divider}`,
                  borderRadius: preferences.focusMode ? 0 : 2
                }}
              >
                <CardContent sx={{ p: preferences.focusMode ? 0 : 4 }}>
                  <Typography
                    variant="body1"
                    sx={{
                      fontSize: preferences.fontSize,
                      fontFamily: preferences.fontFamily,
                      lineHeight: preferences.lineHeight,
                      color: themeColors.text,
                      '& p': { mb: 3 },
                      '& h1, & h2, & h3, & h4, & h5, & h6': { 
                        mt: 4, 
                        mb: 2, 
                        fontWeight: 600,
                        color: themeColors.text
                      },
                      '& ul, & ol': { pl: 4, mb: 3 },
                      '& li': { mb: 1.5 },
                      '& blockquote': {
                        borderLeft: '4px solid',
                        borderColor: 'primary.main',
                        pl: 3,
                        py: 1,
                        bgcolor: 'primary.50',
                        fontStyle: 'italic',
                        mb: 3
                      },
                      '& code': {
                        bgcolor: 'grey.100',
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        fontFamily: 'monospace'
                      },
                      '& pre': {
                        bgcolor: 'grey.100',
                        p: 2,
                        borderRadius: 2,
                        overflow: 'auto',
                        mb: 3
                      }
                    }}
                    dangerouslySetInnerHTML={{ __html: currentSection.content }}
                  />
                </CardContent>
              </Card>

              {/* Key Points */}
              {currentSection.keyPoints && currentSection.keyPoints.length > 0 && (
                <Card 
                  elevation={preferences.focusMode ? 0 : 1}
                  sx={{ 
                    mb: 4, 
                    bgcolor: 'warning.50',
                    border: '1px solid',
                    borderColor: 'warning.200'
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Lightbulb sx={{ color: 'warning.main', mr: 1 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600, color: 'warning.dark' }}>
                        Key Points
                      </Typography>
                    </Box>
                    <List>
                      {currentSection.keyPoints.map((point, index) => (
                        <ListItem key={index} sx={{ py: 1 }}>
                          <ListItemIcon>
                            <Avatar sx={{ bgcolor: 'warning.main', width: 32, height: 32 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: 'white' }}>
                                {index + 1}
                              </Typography>
                            </Avatar>
                          </ListItemIcon>
                          <ListItemText 
                            primary={point}
                            sx={{
                              '& .MuiListItemText-primary': {
                                fontSize: preferences.fontSize,
                                fontFamily: preferences.fontFamily,
                                color: 'warning.dark'
                              }
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              )}

              {/* Navigation */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mt: 6,
                flexWrap: 'wrap',
                gap: 2
              }}>
                <Button
                  startIcon={<NavigateBefore />}
                  onClick={previousSection}
                  disabled={currentSectionIndex === 0}
                  variant="outlined"
                  size="large"
                  sx={{ borderRadius: 3, px: 3 }}
                >
                  Previous Section
                </Button>

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  {!currentSection.isCompleted && (
                    <Button
                      startIcon={<CheckCircle />}
                      onClick={markSectionCompleted}
                      variant="contained"
                      color="success"
                      size="large"
                      sx={{ borderRadius: 3, px: 3 }}
                    >
                      Mark Complete
                    </Button>
                  )}
                  
                  <Typography variant="body2" color="text.secondary">
                    {currentSectionIndex + 1} of {materialSections.length}
                  </Typography>
                </Box>

                <Button
                  endIcon={<NavigateNext />}
                  onClick={nextSection}
                  disabled={currentSectionIndex === materialSections.length - 1}
                  variant="outlined"
                  size="large"
                  sx={{ borderRadius: 3, px: 3 }}
                >
                  Next Section
                </Button>
              </Box>
            </Container>
          ) : (
            <Box 
              display="flex" 
              flexDirection="column" 
              justifyContent="center" 
              alignItems="center" 
              height="100%" 
              sx={{ p: 4 }}
            >
              <Avatar sx={{ width: 120, height: 120, bgcolor: 'primary.50', mb: 3 }}>
                <MenuBook sx={{ fontSize: 64, color: 'primary.main' }} />
              </Avatar>
              <Typography variant="h4" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
                No Course Material Available
              </Typography>
              <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 4, maxWidth: 500 }}>
                This course doesn't have any material sections yet. Please check back later or contact your instructor for more information.
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<ArrowBack />}
                onClick={() => navigate(-1)}
                size="large"
                sx={{ borderRadius: 3, px: 4 }}
              >
                Go Back to Course
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      {/* Mobile FAB for voice controls */}
      {isMobile && preferences.voiceEnabled && currentSection && (
        <Fab
          color={isReading ? "error" : "primary"}
          size="large"
          sx={{ 
            position: 'fixed', 
            bottom: 24, 
            right: 24,
            boxShadow: 6,
            '&:hover': {
              transform: 'scale(1.1)',
              transition: 'transform 0.2s'
            }
          }}
          onClick={() => isReading ? stopReading() : startReading()}
        >
          {isReading ? <Stop /> : <RecordVoiceOver />}
        </Fab>
      )}

      {/* Settings Drawer */}
      {renderSettings()}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default CourseMaterialPage;
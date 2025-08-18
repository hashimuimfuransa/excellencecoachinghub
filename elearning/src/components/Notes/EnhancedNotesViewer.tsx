import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Button,
  LinearProgress,
  Chip,
  Card,
  CardContent,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Switch,
  FormControlLabel,
  Alert,
  Divider,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Stop,
  VolumeUp,
  VolumeOff,
  Timer,
  Settings,
  NavigateNext,
  NavigateBefore,
  BookmarkBorder,
  Bookmark,
  Speed,
  Language,
  AccessTime,
  CheckCircle,
  Coffee,
  School,
  Lightbulb
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// Styled components
const StudyTimerCard = styled(Card)(({ theme }) => ({
  position: 'fixed',
  top: 20,
  right: 20,
  zIndex: 1000,
  minWidth: 200,
  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
  color: 'white',
  '& .MuiCardContent-root': {
    padding: theme.spacing(2),
    '&:last-child': {
      paddingBottom: theme.spacing(2)
    }
  }
}));

const NotesContainer = styled(Paper)(({ theme }) => ({
  maxWidth: 800,
  margin: '0 auto',
  padding: theme.spacing(3),
  marginBottom: theme.spacing(10), // Space for floating timer
  background: theme.palette.background.paper,
  borderRadius: theme.spacing(2),
  boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
}));

const SectionCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  borderRadius: theme.spacing(1.5),
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
  }
}));

const ProgressBar = styled(LinearProgress)(({ theme }) => ({
  height: 8,
  borderRadius: 4,
  backgroundColor: theme.palette.grey[200],
  '& .MuiLinearProgress-bar': {
    borderRadius: 4,
    background: `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.primary.main})`
  }
}));

const FloatingControls = styled(Box)(({ theme }) => ({
  position: 'fixed',
  bottom: 20,
  left: '50%',
  transform: 'translateX(-50%)',
  display: 'flex',
  gap: theme.spacing(1),
  background: theme.palette.background.paper,
  padding: theme.spacing(1),
  borderRadius: theme.spacing(3),
  boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
  zIndex: 1000
}));

interface NotesSection {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'file';
  estimatedReadTime?: number;
  hasAudioNarration?: boolean;
  audioLanguage?: string;
  audioSpeed?: number;
}

interface NotesData {
  _id: string;
  title: string;
  description?: string;
  sections: NotesSection[];
  timerEnabled: boolean;
  recommendedStudyTime: number;
  breakInterval?: number;
  audioSettings: {
    defaultLanguage: string;
    defaultSpeed: number;
    enableAutoPlay: boolean;
  };
}

interface EnhancedNotesViewerProps {
  notes: NotesData;
  onComplete?: () => void;
  onBookmark?: (sectionId: string) => void;
  bookmarkedSections?: string[];
}

const EnhancedNotesViewer: React.FC<EnhancedNotesViewerProps> = ({
  notes,
  onComplete,
  onBookmark,
  bookmarkedSections = []
}) => {
  // Timer states
  const [studyTime, setStudyTime] = useState(0); // in seconds
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showBreakDialog, setShowBreakDialog] = useState(false);
  const [completedSections, setCompletedSections] = useState<string[]>([]);
  
  // Audio states
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [audioSettings, setAudioSettings] = useState({
    language: notes.audioSettings.defaultLanguage,
    speed: notes.audioSettings.defaultSpeed,
    autoPlay: notes.audioSettings.enableAutoPlay
  });
  const [showSettings, setShowSettings] = useState(false);
  
  // Progress states
  const [readingProgress, setReadingProgress] = useState(0);
  const [sectionProgress, setSectionProgress] = useState<{ [key: string]: boolean }>({});
  
  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const breakTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer effects
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setStudyTime(prev => {
          const newTime = prev + 1;
          
          // Check for break interval
          if (notes.breakInterval && newTime % (notes.breakInterval * 60) === 0) {
            setShowBreakDialog(true);
            setIsTimerRunning(false);
          }
          
          return newTime;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerRunning, notes.breakInterval]);

  // Speech synthesis setup
  useEffect(() => {
    return () => {
      if (speechRef.current) {
        speechSynthesis.cancel();
      }
    };
  }, []);

  // Auto-start timer when component mounts
  useEffect(() => {
    if (notes.timerEnabled) {
      setIsTimerRunning(true);
    }
  }, [notes.timerEnabled]);

  // Format time display
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Text-to-speech functionality
  const speakText = (text: string, section?: NotesSection) => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = section?.audioLanguage || audioSettings.language;
      utterance.rate = section?.audioSpeed || audioSettings.speed;
      
      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => {
        setIsPlaying(false);
        if (audioSettings.autoPlay && currentSection < notes.sections.length - 1) {
          setCurrentSection(prev => prev + 1);
        }
      };
      utterance.onerror = () => setIsPlaying(false);
      
      speechRef.current = utterance;
      speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    speechSynthesis.cancel();
    setIsPlaying(false);
  };

  const toggleSpeaking = () => {
    if (isPlaying) {
      stopSpeaking();
    } else {
      const section = notes.sections[currentSection];
      if (section) {
        speakText(section.content, section);
      }
    }
  };

  // Section navigation
  const goToSection = (index: number) => {
    if (index >= 0 && index < notes.sections.length) {
      setCurrentSection(index);
      stopSpeaking();
    }
  };

  // Mark section as completed
  const markSectionComplete = (sectionId: string) => {
    if (!completedSections.includes(sectionId)) {
      const newCompleted = [...completedSections, sectionId];
      setCompletedSections(newCompleted);
      
      // Update progress
      const progress = (newCompleted.length / notes.sections.length) * 100;
      setReadingProgress(progress);
      
      // Check if all sections completed
      if (newCompleted.length === notes.sections.length && onComplete) {
        onComplete();
      }
    }
  };

  // Break dialog handlers
  const handleBreakAccept = () => {
    setShowBreakDialog(false);
    // Start a 5-minute break timer
    breakTimerRef.current = setTimeout(() => {
      setIsTimerRunning(true);
    }, 5 * 60 * 1000);
  };

  const handleBreakDecline = () => {
    setShowBreakDialog(false);
    setIsTimerRunning(true);
  };

  const currentSectionData = notes.sections[currentSection];
  const isCurrentSectionCompleted = completedSections.includes(currentSectionData?.id);
  const isCurrentSectionBookmarked = bookmarkedSections.includes(currentSectionData?.id);

  return (
    <Box sx={{ pb: 10 }}>
      {/* Study Timer Card */}
      {notes.timerEnabled && (
        <StudyTimerCard>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
              <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Timer fontSize="small" />
                Study Time
              </Typography>
              <IconButton
                size="small"
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                sx={{ color: 'white' }}
              >
                {isTimerRunning ? <Pause /> : <PlayArrow />}
              </IconButton>
            </Box>
            <Typography variant="h6" sx={{ fontFamily: 'monospace', textAlign: 'center' }}>
              {formatTime(studyTime)}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8, textAlign: 'center', display: 'block' }}>
              Target: {formatTime(notes.recommendedStudyTime * 60)}
            </Typography>
            <ProgressBar
              variant="determinate"
              value={Math.min((studyTime / (notes.recommendedStudyTime * 60)) * 100, 100)}
              sx={{ mt: 1 }}
            />
          </CardContent>
        </StudyTimerCard>
      )}

      {/* Main Notes Container */}
      <NotesContainer>
        {/* Header */}
        <Box mb={4}>
          <Typography variant="h4" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
            {notes.title}
          </Typography>
          {notes.description && (
            <Typography variant="body1" color="text.secondary" paragraph>
              {notes.description}
            </Typography>
          )}
          
          {/* Progress Overview */}
          <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <School color="primary" />
                  Learning Progress
                </Typography>
                <Chip
                  label={`${completedSections.length}/${notes.sections.length} sections`}
                  color="primary"
                  variant="outlined"
                />
              </Box>
              <ProgressBar
                variant="determinate"
                value={readingProgress}
                sx={{ mb: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                {readingProgress.toFixed(0)}% Complete
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Current Section */}
        {currentSectionData && (
          <SectionCard>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="between" mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Chip
                    label={`Section ${currentSection + 1}`}
                    color="primary"
                    size="small"
                  />
                  {currentSectionData.estimatedReadTime && (
                    <Chip
                      icon={<AccessTime />}
                      label={`${currentSectionData.estimatedReadTime} min`}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>
                <Box display="flex" gap={1}>
                  <Tooltip title={isCurrentSectionBookmarked ? "Remove bookmark" : "Add bookmark"}>
                    <IconButton
                      onClick={() => onBookmark?.(currentSectionData.id)}
                      color={isCurrentSectionBookmarked ? "primary" : "default"}
                    >
                      {isCurrentSectionBookmarked ? <Bookmark /> : <BookmarkBorder />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={isCurrentSectionCompleted ? "Completed" : "Mark as complete"}>
                    <IconButton
                      onClick={() => markSectionComplete(currentSectionData.id)}
                      color={isCurrentSectionCompleted ? "success" : "default"}
                    >
                      <CheckCircle />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              <Typography variant="h5" gutterBottom sx={{ color: 'primary.main', mb: 3 }}>
                {currentSectionData.title}
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  lineHeight: 1.8,
                  fontSize: '1.1rem',
                  color: 'text.primary',
                  '& p': { mb: 2 },
                  '& strong': { color: 'primary.main' },
                  '& em': { color: 'secondary.main' }
                }}
                dangerouslySetInnerHTML={{ __html: currentSectionData.content }}
              />

              {/* Audio Controls for Text-to-Speech */}
              {currentSectionData.hasAudioNarration !== false && (
                <Box mt={3} p={2} sx={{ bgcolor: 'grey.50', borderRadius: 2 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <VolumeUp color="primary" />
                    Audio Narration
                  </Typography>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Button
                      variant={isPlaying ? "contained" : "outlined"}
                      onClick={toggleSpeaking}
                      startIcon={isPlaying ? <Pause /> : <PlayArrow />}
                      color="primary"
                    >
                      {isPlaying ? 'Pause' : 'Listen'}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={stopSpeaking}
                      startIcon={<Stop />}
                      disabled={!isPlaying}
                    >
                      Stop
                    </Button>
                    <Chip
                      icon={<Language />}
                      label={audioSettings.language}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      icon={<Speed />}
                      label={`${audioSettings.speed}x`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </Box>
              )}
            </CardContent>
          </SectionCard>
        )}

        {/* Motivational Messages */}
        {completedSections.length > 0 && (
          <Alert severity="success" sx={{ mb: 3 }}>
            <Box display="flex" alignItems="center" gap={1}>
              <Lightbulb />
              <Typography>
                Great progress! You've completed {completedSections.length} section{completedSections.length > 1 ? 's' : ''}. 
                {readingProgress >= 100 ? ' 🎉 Congratulations on completing all sections!' : ' Keep going!'}
              </Typography>
            </Box>
          </Alert>
        )}
      </NotesContainer>

      {/* Floating Navigation Controls */}
      <FloatingControls>
        <Tooltip title="Previous Section">
          <IconButton
            onClick={() => goToSection(currentSection - 1)}
            disabled={currentSection === 0}
            color="primary"
          >
            <NavigateBefore />
          </IconButton>
        </Tooltip>
        
        <Chip
          label={`${currentSection + 1} / ${notes.sections.length}`}
          color="primary"
          variant="outlined"
        />
        
        <Tooltip title="Next Section">
          <IconButton
            onClick={() => goToSection(currentSection + 1)}
            disabled={currentSection === notes.sections.length - 1}
            color="primary"
          >
            <NavigateNext />
          </IconButton>
        </Tooltip>
        
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
        
        <Tooltip title="Audio Settings">
          <IconButton onClick={() => setShowSettings(true)} color="primary">
            <Settings />
          </IconButton>
        </Tooltip>
      </FloatingControls>

      {/* Break Time Dialog */}
      <Dialog open={showBreakDialog} onClose={() => setShowBreakDialog(false)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Coffee color="primary" />
          Time for a Break!
        </DialogTitle>
        <DialogContent>
          <Typography paragraph>
            You've been studying for {notes.breakInterval} minutes. Research shows that taking regular breaks 
            improves learning and retention. Would you like to take a 5-minute break?
          </Typography>
          <Alert severity="info">
            <Typography variant="body2">
              💡 During your break, try to step away from the screen, stretch, or get some fresh air!
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleBreakDecline} color="primary">
            Continue Studying
          </Button>
          <Button onClick={handleBreakAccept} variant="contained" color="primary">
            Take Break (5 min)
          </Button>
        </DialogActions>
      </Dialog>

      {/* Audio Settings Dialog */}
      <Dialog open={showSettings} onClose={() => setShowSettings(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Audio Settings</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Language</InputLabel>
              <Select
                value={audioSettings.language}
                label="Language"
                onChange={(e) => setAudioSettings(prev => ({ ...prev, language: e.target.value }))}
              >
                <MenuItem value="en-US">English (US)</MenuItem>
                <MenuItem value="en-GB">English (UK)</MenuItem>
                <MenuItem value="es-ES">Spanish</MenuItem>
                <MenuItem value="fr-FR">French</MenuItem>
                <MenuItem value="de-DE">German</MenuItem>
                <MenuItem value="it-IT">Italian</MenuItem>
                <MenuItem value="pt-BR">Portuguese</MenuItem>
                <MenuItem value="ru-RU">Russian</MenuItem>
                <MenuItem value="ja-JP">Japanese</MenuItem>
                <MenuItem value="ko-KR">Korean</MenuItem>
                <MenuItem value="zh-CN">Chinese (Simplified)</MenuItem>
              </Select>
            </FormControl>

            <Typography gutterBottom>Speech Speed</Typography>
            <Slider
              value={audioSettings.speed}
              onChange={(_, value) => setAudioSettings(prev => ({ ...prev, speed: value as number }))}
              min={0.5}
              max={2.0}
              step={0.1}
              marks={[
                { value: 0.5, label: '0.5x' },
                { value: 1.0, label: '1x' },
                { value: 1.5, label: '1.5x' },
                { value: 2.0, label: '2x' }
              ]}
              valueLabelDisplay="auto"
              sx={{ mb: 3 }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={audioSettings.autoPlay}
                  onChange={(e) => setAudioSettings(prev => ({ ...prev, autoPlay: e.target.checked }))}
                />
              }
              label="Auto-play next section"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSettings(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EnhancedNotesViewer;
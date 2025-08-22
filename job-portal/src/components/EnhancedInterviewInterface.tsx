import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  Paper,
  LinearProgress,
  IconButton,
  CircularProgress,
  Alert,
  Chip,
  Stack,
  Grid,
  Card,
  CardContent,
  Fade,
  Zoom,
  useTheme,
  useMediaQuery,
  Container,
  Divider
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Stop,
  Mic,
  MicOff,
  VolumeUp,
  VolumeOff,
  ArrowForward,
  CheckCircle,
  Close,
  Psychology,
  Timer,
  Star,
  Fullscreen,
  FullscreenExit,
  RecordVoiceOver,
  KeyboardArrowRight
} from '@mui/icons-material';
import { QuickInterviewSession, QuickInterviewQuestion, quickInterviewService } from '../services/quickInterviewService';
import { avatarTalkService } from '../services/avatarTalkService';

interface EnhancedInterviewInterfaceProps {
  open: boolean;
  onClose: () => void;
  session: QuickInterviewSession | null;
  onComplete?: (results: any) => void;
}

export const EnhancedInterviewInterface: React.FC<EnhancedInterviewInterfaceProps> = ({
  open,
  onClose,
  session: initialSession,
  onComplete
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // State management
  const [session, setSession] = useState<QuickInterviewSession | null>(initialSession);
  const [currentQuestion, setCurrentQuestion] = useState<QuickInterviewQuestion | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [questionTime, setQuestionTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [recordingVolume, setRecordingVolume] = useState(0);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  
  // Media refs
  const avatarVideoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const questionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const volumeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize session and load first question
  useEffect(() => {
    if (open && session) {
      initializeInterview();
    }
    return () => {
      cleanup();
    };
  }, [open, session]);

  // Session timer effect
  useEffect(() => {
    if (session && session.status === 'in_progress') {
      const totalDuration = session.totalDuration;
      setTimeRemaining(totalDuration);
      
      sessionTimerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleCompleteInterview();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
    };
  }, [session?.status]);

  // Question timer effect
  useEffect(() => {
    if (currentQuestion && questionTime > 0) {
      questionTimerRef.current = setTimeout(() => {
        setQuestionTime(prev => prev - 1);
      }, 1000);
    }

    return () => {
      if (questionTimerRef.current) {
        clearTimeout(questionTimerRef.current);
      }
    };
  }, [questionTime, currentQuestion]);

  const cleanup = useCallback(() => {
    // Stop all timers
    if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    if (questionTimerRef.current) clearTimeout(questionTimerRef.current);
    if (volumeIntervalRef.current) clearInterval(volumeIntervalRef.current);
    
    // Stop recording
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    
    // Clean up audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  }, [isRecording]);

  const initializeInterview = async () => {
    if (!session) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Load the first question
      await loadCurrentQuestion();
      
      // Show welcome message if available
      if (session.welcomeMessage) {
        playAvatarVideo(session.welcomeMessage);
      } else {
        setShowWelcome(false);
      }
      
    } catch (error) {
      console.error('Failed to initialize interview:', error);
      setError('Failed to load interview. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCurrentQuestion = async () => {
    if (!session) return;
    
    try {
      setAvatarLoading(true);
      const question = await quickInterviewService.getNextQuestion(session.id);
      
      if (question) {
        setCurrentQuestion(question);
        setQuestionTime(question.expectedDuration);
        
        // Auto-play question avatar if available
        if (question.avatarResponse?.mp4_url) {
          setTimeout(() => {
            playAvatarVideo(question.avatarResponse!.mp4_url!);
          }, showWelcome ? 3000 : 500);
        }
      } else {
        // No more questions, complete the interview
        handleCompleteInterview();
      }
    } catch (error) {
      console.error('Failed to load question:', error);
      setError('Failed to load question. Please try again.');
    } finally {
      setAvatarLoading(false);
    }
  };

  const playAvatarVideo = (videoUrl: string) => {
    if (avatarVideoRef.current) {
      avatarVideoRef.current.src = videoUrl;
      avatarVideoRef.current.play()
        .then(() => {
          setIsPlaying(true);
          setShowWelcome(false);
        })
        .catch(error => {
          console.warn('Failed to play avatar video:', error);
          setIsPlaying(false);
        });
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      
      // Setup audio context for volume monitoring
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      // Start volume monitoring
      monitorVolume();
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      recordingChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        recordingChunksRef.current.push(event.data);
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordingChunksRef.current, { type: 'audio/wav' });
        // Here you could process the recorded audio
        console.log('Recording completed:', blob.size, 'bytes');
        
        // Stop volume monitoring
        if (volumeIntervalRef.current) {
          clearInterval(volumeIntervalRef.current);
        }
        
        // Clean up stream
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      setError('Failed to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingVolume(0);
    }
  };

  const monitorVolume = () => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    volumeIntervalRef.current = setInterval(() => {
      if (analyserRef.current) {
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setRecordingVolume(average / 255 * 100);
      }
    }, 100);
  };

  const handleNextQuestion = async () => {
    if (!session) return;
    
    setIsLoading(true);
    stopRecording();
    
    try {
      const hasMore = await quickInterviewService.moveToNextQuestion(session.id);
      
      if (hasMore) {
        await loadCurrentQuestion();
      } else {
        handleCompleteInterview();
      }
    } catch (error) {
      console.error('Failed to move to next question:', error);
      setError('Failed to load next question.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteInterview = async () => {
    if (!session) return;
    
    setIsLoading(true);
    cleanup();
    
    try {
      const results = await quickInterviewService.completeSession(session.id);
      onComplete?.(results);
    } catch (error) {
      console.error('Failed to complete interview:', error);
      setError('Failed to complete interview.');
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressColor = () => {
    if (timeRemaining > session!.totalDuration * 0.5) return 'success';
    if (timeRemaining > session!.totalDuration * 0.2) return 'warning';
    return 'error';
  };

  if (!session || !currentQuestion) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogContent sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress size={40} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Preparing your interview...
          </Typography>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullWidth
      fullScreen={isFullscreen || isMobile}
      PaperProps={{
        sx: {
          width: isFullscreen ? '100vw' : isMobile ? '100vw' : '90vw',
          height: isFullscreen ? '100vh' : isMobile ? '100vh' : '90vh',
          maxWidth: 'none',
          maxHeight: 'none',
          m: isFullscreen || isMobile ? 0 : 2,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          overflow: 'hidden'
        }
      }}
    >
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}
      >
        {/* Header */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: 0
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={2}>
              <Psychology color="primary" />
              <Typography variant="h6" color="primary" fontWeight="bold">
                {session.isTestInterview ? 'Practice Interview' : `${session.jobContext?.title} Interview`}
              </Typography>
              {!session.isTestInterview && (
                <Chip 
                  label={session.jobContext?.company} 
                  color="primary" 
                  variant="outlined" 
                  size="small" 
                />
              )}
            </Box>
            
            <Box display="flex" alignItems="center" gap={2}>
              <Chip
                icon={<Timer />}
                label={formatTime(timeRemaining)}
                color={getProgressColor()}
                variant="filled"
              />
              
              <IconButton onClick={toggleFullscreen} size="small">
                {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
              </IconButton>
              
              <IconButton onClick={onClose} size="small">
                <Close />
              </IconButton>
            </Box>
          </Box>
          
          {/* Progress Bar */}
          <Box sx={{ mt: 1 }}>
            <LinearProgress
              variant="determinate"
              value={((session.totalDuration - timeRemaining) / session.totalDuration) * 100}
              color={getProgressColor()}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        </Paper>

        {/* Main Content */}
        <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <Grid container sx={{ height: '100%' }}>
            {/* Avatar Section */}
            <Grid 
              item 
              xs={12} 
              md={6} 
              sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                background: 'rgba(0, 0, 0, 0.7)',
                position: 'relative'
              }}
            >
              <Box
                sx={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Avatar Video */}
                <video
                  ref={avatarVideoRef}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: theme.spacing(2)
                  }}
                  onEnded={() => setIsPlaying(false)}
                  poster="/api/placeholder/400/600"
                  controls={false}
                />
                
                {/* Avatar Loading */}
                {avatarLoading && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      background: 'rgba(0, 0, 0, 0.8)',
                      borderRadius: 2,
                      p: 3,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 2
                    }}
                  >
                    <CircularProgress size={40} sx={{ color: 'white' }} />
                    <Typography color="white" variant="body2">
                      Generating avatar response...
                    </Typography>
                  </Box>
                )}
                
                {/* Welcome Message */}
                {showWelcome && (
                  <Fade in={showWelcome}>
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 20,
                        left: 20,
                        right: 20,
                        background: 'rgba(0, 0, 0, 0.8)',
                        borderRadius: 2,
                        p: 2
                      }}
                    >
                      <Typography color="white" variant="h6" textAlign="center">
                        Welcome to your interview!
                      </Typography>
                    </Box>
                  </Fade>
                )}
              </Box>
            </Grid>

            {/* Interview Panel */}
            <Grid 
              item 
              xs={12} 
              md={6} 
              sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <Container sx={{ py: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Question Section */}
                <Card 
                  elevation={3} 
                  sx={{ 
                    mb: 3, 
                    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                >
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="between" mb={2}>
                      <Typography variant="overline" color="textSecondary" fontWeight="bold">
                        Question {currentQuestion.questionNumber || session.currentQuestionIndex + 1} 
                        {currentQuestion.totalQuestions && ` of ${currentQuestion.totalQuestions}`}
                      </Typography>
                      
                      {questionTime > 0 && (
                        <Chip
                          icon={<Timer />}
                          label={formatTime(questionTime)}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      )}
                    </Box>
                    
                    <Typography variant="h6" sx={{ lineHeight: 1.6, mb: 2 }}>
                      {currentQuestion.text}
                    </Typography>
                    
                    <Box display="flex" gap={1}>
                      <Chip 
                        label={currentQuestion.category} 
                        size="small" 
                        color="primary" 
                        variant="outlined" 
                      />
                      {currentQuestion.type && (
                        <Chip 
                          label={currentQuestion.type} 
                          size="small" 
                          color="secondary" 
                          variant="outlined" 
                        />
                      )}
                    </Box>
                  </CardContent>
                </Card>

                {/* Recording Section */}
                <Card elevation={3} sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                      <RecordVoiceOver color="primary" />
                      Your Response
                    </Typography>
                    
                    {/* Volume Indicator */}
                    {isRecording && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          Recording... Speak clearly
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={recordingVolume}
                          sx={{ 
                            height: 8, 
                            borderRadius: 4,
                            backgroundColor: 'rgba(76, 175, 80, 0.2)',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: recordingVolume > 70 ? '#f44336' : recordingVolume > 40 ? '#ff9800' : '#4caf50'
                            }
                          }}
                        />
                      </Box>
                    )}
                    
                    {/* Recording Controls */}
                    <Box display="flex" alignItems="center" gap={2} justifyContent="center">
                      {!isRecording ? (
                        <Button
                          variant="contained"
                          startIcon={<Mic />}
                          onClick={startRecording}
                          size="large"
                          sx={{
                            background: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)',
                            boxShadow: '0 3px 5px 2px rgba(76, 175, 80, .3)',
                            px: 4
                          }}
                        >
                          Start Recording
                        </Button>
                      ) : (
                        <Button
                          variant="contained"
                          startIcon={<MicOff />}
                          onClick={stopRecording}
                          color="error"
                          size="large"
                          sx={{ px: 4 }}
                        >
                          Stop Recording
                        </Button>
                      )}
                      
                      <Button
                        variant="outlined"
                        endIcon={<KeyboardArrowRight />}
                        onClick={handleNextQuestion}
                        disabled={isLoading}
                        size="large"
                        sx={{ px: 4 }}
                      >
                        {isLoading ? 'Loading...' : 'Next Question'}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>

                {/* Tips Section */}
                <Card elevation={2} sx={{ background: 'rgba(33, 150, 243, 0.05)' }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="primary" gutterBottom display="flex" alignItems="center" gap={1}>
                      <Star />
                      Interview Tips
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      • Speak clearly and maintain good eye contact with the camera
                      • Take your time to think before answering
                      • Use specific examples from your experience
                      • Keep answers concise but comprehensive
                    </Typography>
                  </CardContent>
                </Card>
              </Container>
            </Grid>
          </Grid>
        </Box>

        {/* Error Display */}
        {error && (
          <Alert 
            severity="error" 
            onClose={() => setError(null)}
            sx={{ m: 2, mt: 0 }}
          >
            {error}
          </Alert>
        )}
      </Box>
    </Dialog>
  );
};

export default EnhancedInterviewInterface;
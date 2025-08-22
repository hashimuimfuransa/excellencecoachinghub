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
  Card,
  CardContent,
  Fade,
  useTheme,
  useMediaQuery,
  Container,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Stop,
  Mic,
  MicOff,
  ArrowForward,
  CheckCircle,
  Close,
  Timer,
  Star,
  Fullscreen,
  FullscreenExit,
  RecordVoiceOver,
  Psychology,
  EmojiEvents,
  TrendingUp,
  Lightbulb,
  VolumeUp
} from '@mui/icons-material';
import { QuickInterviewSession, QuickInterviewQuestion, quickInterviewService } from '../services/quickInterviewService';

interface QuickTestInterviewInterfaceProps {
  open: boolean;
  onClose: () => void;
  session: QuickInterviewSession | null;
  onComplete?: (results: any) => void;
}

export const QuickTestInterviewInterface: React.FC<QuickTestInterviewInterfaceProps> = ({
  open,
  onClose,
  session: initialSession,
  onComplete
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State management
  const [session, setSession] = useState<QuickInterviewSession | null>(initialSession);
  const [currentQuestion, setCurrentQuestion] = useState<QuickInterviewQuestion | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(180); // 3 minutes for test
  const [questionTime, setQuestionTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [recordingVolume, setRecordingVolume] = useState(0);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  
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
      initializeTestInterview();
    }
    return () => {
      cleanup();
    };
  }, [open, session]);

  // Session timer effect (3 minutes countdown)
  useEffect(() => {
    if (hasStarted && session) {
      sessionTimerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleCompleteTest();
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
  }, [hasStarted]);

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

  const initializeTestInterview = async () => {
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
      console.error('Failed to initialize test interview:', error);
      setError('Failed to load test interview. Please try again.');
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
        
        // Auto-play question avatar if available - prioritize stream_url for faster loading
        const videoUrl = question.avatarResponse?.stream_url || question.avatarResponse?.mp4_url;
        if (videoUrl) {
          console.log('🎬 Test question has avatar video, preparing to play:', {
            hasStream: !!question.avatarResponse?.stream_url,
            hasMp4: !!question.avatarResponse?.mp4_url,
            using: videoUrl.includes('stream') ? 'stream_url' : 'mp4_url'
          });
          
          setTimeout(() => {
            playAvatarVideo(videoUrl);
          }, showWelcome ? 3000 : 500);
        } else {
          console.warn('⚠️ Test question has no avatar video available');
        }
      } else {
        // No more questions, complete the test
        handleCompleteTest();
      }
    } catch (error) {
      console.error('Failed to load question:', error);
      setError('Failed to load question. Please try again.');
    } finally {
      setAvatarLoading(false);
    }
  };

  const playAvatarVideo = (videoUrl: string) => {
    console.log('🎬 Playing test avatar video:', videoUrl);
    
    if (avatarVideoRef.current && videoUrl) {
      setAvatarLoading(true);
      setIsPlaying(false);
      
      // Set video source
      avatarVideoRef.current.src = videoUrl;
      
      // Load and play the video
      avatarVideoRef.current.load(); // Ensure video is loaded
      
      const playPromise = avatarVideoRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('✅ Test avatar video playing successfully');
            setIsPlaying(true);
            setShowWelcome(false);
            setAvatarLoading(false);
            if (!hasStarted) {
              setHasStarted(true); // Start the timer when first video plays
            }
          })
          .catch(error => {
            console.warn('❌ Failed to play test avatar video:', error);
            setIsPlaying(false);
            setAvatarLoading(false);
            if (!hasStarted) {
              setHasStarted(true); // Start anyway if video fails
            }
          });
      }
    } else {
      console.warn('⚠️ No video URL or video element not available');
      if (!hasStarted) {
        setHasStarted(true);
      }
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
        console.log('Test recording completed:', blob.size, 'bytes');
        
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
      setCurrentQuestionIndex(prev => prev + 1);
      
      if (hasMore) {
        await loadCurrentQuestion();
      } else {
        handleCompleteTest();
      }
    } catch (error) {
      console.error('Failed to move to next question:', error);
      setError('Failed to load next question.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteTest = async () => {
    if (!session) return;
    
    setIsLoading(true);
    cleanup();
    
    try {
      const results = await quickInterviewService.completeSession(session.id);
      onComplete?.(results);
    } catch (error) {
      console.error('Failed to complete test interview:', error);
      setError('Failed to complete test interview.');
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  const startTestNow = () => {
    setHasStarted(true);
    setShowWelcome(false);
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
    if (timeRemaining > 120) return 'success';
    if (timeRemaining > 60) return 'warning';
    return 'error';
  };

  if (!session || !currentQuestion) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogContent sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress size={40} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Preparing your 3-minute test interview...
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
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          overflow: 'hidden'
        }
      }}
    >
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          '& @keyframes pulse': {
            '0%': {
              opacity: 1,
              transform: 'scale(1)'
            },
            '50%': {
              opacity: 0.7,
              transform: 'scale(1.1)'
            },
            '100%': {
              opacity: 1,
              transform: 'scale(1)'
            }
          }
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
              <EmojiEvents sx={{ color: '#4facfe' }} />
              <Typography variant="h6" sx={{ color: '#4facfe' }} fontWeight="bold">
                3-Minute Test Interview
              </Typography>
              <Chip 
                label="FREE Practice" 
                sx={{ 
                  background: 'linear-gradient(45deg, #4facfe 30%, #00f2fe 90%)',
                  color: 'white',
                  fontWeight: 'bold'
                }}
                size="small" 
              />
            </Box>
            
            <Box display="flex" alignItems="center" gap={2}>
              <Chip
                icon={<Timer />}
                label={formatTime(timeRemaining)}
                color={getProgressColor()}
                variant="filled"
                sx={{ fontWeight: 'bold' }}
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
              value={((180 - timeRemaining) / 180) * 100}
              sx={{ 
                height: 8, 
                borderRadius: 4,
                background: 'rgba(255, 255, 255, 0.3)',
                '& .MuiLinearProgress-bar': {
                  background: getProgressColor() === 'success' 
                    ? 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)'
                    : getProgressColor() === 'warning'
                    ? 'linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)'
                    : 'linear-gradient(45deg, #f44336 30%, #ef5350 90%)'
                }
              }}
            />
          </Box>
        </Paper>

        {!hasStarted ? (
          /* Welcome Screen */
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              p: 4
            }}
          >
            <Card 
              elevation={8} 
              sx={{ 
                maxWidth: 600, 
                p: 4, 
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: 4
              }}
            >
              <Psychology sx={{ fontSize: 60, color: '#4facfe', mb: 2 }} />
              <Typography variant="h4" fontWeight="bold" color="#4facfe" gutterBottom>
                Ready for your Test Interview?
              </Typography>
              <Typography variant="h6" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
                Practice with our AI interviewer - 3 minutes, 3 questions
              </Typography>
              
              <List sx={{ textAlign: 'left', mb: 3 }}>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText primary="Quick 3-minute practice session" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText primary="AI-powered interview with realistic avatar" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText primary="Immediate feedback and scoring" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText primary="No payment required - completely free" />
                </ListItem>
              </List>

              <Button
                variant="contained"
                size="large"
                startIcon={<PlayArrow />}
                onClick={startTestNow}
                sx={{
                  px: 6,
                  py: 2,
                  fontSize: '1.2rem',
                  background: 'linear-gradient(45deg, #4facfe 30%, #00f2fe 90%)',
                  boxShadow: '0 8px 25px rgba(79, 172, 254, 0.4)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #4facfe 60%, #00f2fe 100%)',
                    boxShadow: '0 12px 35px rgba(79, 172, 254, 0.6)',
                  }
                }}
              >
                Start Test Interview
              </Button>
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Make sure your microphone is working and you're in a quiet environment
              </Typography>
            </Card>
          </Box>
        ) : (
          /* Interview Interface */
          <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            <Box sx={{ display: 'flex', width: '100%', height: '100%' }}>
              {/* Avatar Section */}
              <Box
                sx={{
                  flex: isMobile ? 1 : 0.6,
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'rgba(0, 0, 0, 0.8)',
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
                  {/* Avatar Video Container */}
                  <Box
                    sx={{
                      width: '100%',
                      height: '100%',
                      position: 'relative',
                      background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
                      borderRadius: isMobile ? 0 : theme.spacing(2),
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {/* Default Avatar Background */}
                    {((!currentQuestion?.avatarResponse?.mp4_url && !currentQuestion?.avatarResponse?.stream_url) || avatarLoading || showWelcome || !isPlaying) && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
                          color: 'white',
                          zIndex: 1
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 120,
                            height: 120,
                            mb: 3,
                            background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
                            fontSize: '3rem'
                          }}
                        >
                          🎓
                        </Avatar>
                        {avatarLoading ? (
                          <>
                            <CircularProgress size={40} sx={{ color: '#4caf50', mb: 2 }} />
                            <Typography variant="h6" textAlign="center">
                              Preparing your test interviewer...
                            </Typography>
                          </>
                        ) : showWelcome ? (
                          <>
                            <Typography variant="h5" fontWeight="bold" mb={2} textAlign="center">
                              Welcome to Quick Test
                            </Typography>
                            <Typography variant="body1" textAlign="center" sx={{ opacity: 0.8 }}>
                              Get ready for your 3-minute practice session
                            </Typography>
                          </>
                        ) : (
                          <>
                            <Typography variant="h5" fontWeight="bold" mb={2} textAlign="center">
                              Test Interviewer
                            </Typography>
                            <Typography variant="body1" textAlign="center" sx={{ opacity: 0.8 }}>
                              Ready for your next question
                            </Typography>
                          </>
                        )}
                      </Box>
                    )}

                    {/* Avatar Video */}
                    <video
                      ref={avatarVideoRef}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        position: 'relative',
                        zIndex: 2
                      }}
                      onEnded={() => setIsPlaying(false)}
                      onLoadStart={() => setAvatarLoading(true)}
                      onCanPlay={() => setAvatarLoading(false)}
                      onError={() => {
                        setAvatarLoading(false);
                        console.error('Avatar video failed to load');
                      }}
                      controls={false}
                      playsInline
                      preload="auto"
                    />

                    {/* Speaking Indicator */}
                    {isPlaying && (
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 20,
                          left: 20,
                          background: 'rgba(76, 175, 80, 0.9)',
                          borderRadius: 2,
                          px: 2,
                          py: 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          zIndex: 3
                        }}
                      >
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            background: '#4caf50',
                            borderRadius: '50%',
                            animation: 'pulse 1s infinite'
                          }}
                        />
                        <Typography variant="caption" color="white" fontWeight="bold">
                          Speaking...
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  
                  {/* Question Counter */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 20,
                      left: 20,
                      background: 'rgba(79, 172, 254, 0.9)',
                      borderRadius: 2,
                      px: 2,
                      py: 1
                    }}
                  >
                    <Typography color="white" variant="h6" fontWeight="bold">
                      {currentQuestionIndex + 1} / 3
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Question Panel */}
              {!isMobile && (
                <Box
                  sx={{
                    flex: 0.4,
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <Container sx={{ py: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* Question */}
                    <Card elevation={4} sx={{ mb: 3, background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' }}>
                      <CardContent>
                        <Typography variant="overline" color="#4facfe" fontWeight="bold" gutterBottom>
                          Test Question {currentQuestionIndex + 1}
                        </Typography>
                        
                        <Typography variant="h6" sx={{ lineHeight: 1.6, mb: 2 }}>
                          {currentQuestion.text}
                        </Typography>
                        
                        <Chip 
                          label={currentQuestion.category} 
                          size="small" 
                          sx={{ 
                            background: 'rgba(79, 172, 254, 0.1)',
                            color: '#4facfe'
                          }}
                        />
                      </CardContent>
                    </Card>

                    {/* Recording Controls */}
                    <Card elevation={3} sx={{ mb: 3 }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                          <RecordVoiceOver color="primary" />
                          Your Answer
                        </Typography>
                        
                        {/* Volume Indicator */}
                        {isRecording && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="success.main" gutterBottom fontWeight="bold">
                              🎤 Recording... Speak clearly
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={recordingVolume}
                              sx={{ 
                                height: 10, 
                                borderRadius: 5,
                                backgroundColor: 'rgba(76, 175, 80, 0.2)',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: recordingVolume > 70 ? '#f44336' : recordingVolume > 40 ? '#ff9800' : '#4caf50'
                                }
                              }}
                            />
                          </Box>
                        )}
                        
                        {/* Controls */}
                        <Stack direction="row" spacing={2} justifyContent="center">
                          {!isRecording ? (
                            <Button
                              variant="contained"
                              startIcon={<Mic />}
                              onClick={startRecording}
                              size="large"
                              sx={{
                                background: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)',
                                flex: 1
                              }}
                            >
                              Record Answer
                            </Button>
                          ) : (
                            <Button
                              variant="contained"
                              startIcon={<Stop />}
                              onClick={stopRecording}
                              color="error"
                              size="large"
                              sx={{ flex: 1 }}
                            >
                              Stop Recording
                            </Button>
                          )}
                          
                          <Button
                            variant="outlined"
                            endIcon={<ArrowForward />}
                            onClick={handleNextQuestion}
                            disabled={isLoading}
                            size="large"
                          >
                            {currentQuestionIndex === 2 ? 'Finish' : 'Next'}
                          </Button>
                        </Stack>
                      </CardContent>
                    </Card>

                    {/* Quick Tips */}
                    <Card elevation={2} sx={{ background: 'rgba(79, 172, 254, 0.05)' }}>
                      <CardContent>
                        <Typography variant="subtitle2" sx={{ color: '#4facfe' }} gutterBottom display="flex" alignItems="center" gap={1}>
                          <Lightbulb />
                          Quick Tips
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          • This is just practice - relax and be yourself
                          • Speak for 30-60 seconds per question
                          • Focus on showing your personality and skills
                        </Typography>
                      </CardContent>
                    </Card>
                  </Container>
                </Box>
              )}
            </Box>
          </Box>
        )}

        {/* Mobile Question Overlay */}
        {isMobile && hasStarted && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              p: 2
            }}
          >
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Question {currentQuestionIndex + 1}:
            </Typography>
            <Typography variant="body1" gutterBottom>
              {currentQuestion.text}
            </Typography>
            
            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              {!isRecording ? (
                <Button
                  variant="contained"
                  startIcon={<Mic />}
                  onClick={startRecording}
                  size="small"
                  sx={{
                    background: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)',
                    flex: 1
                  }}
                >
                  Record
                </Button>
              ) : (
                <Button
                  variant="contained"
                  startIcon={<Stop />}
                  onClick={stopRecording}
                  color="error"
                  size="small"
                  sx={{ flex: 1 }}
                >
                  Stop
                </Button>
              )}
              
              <Button
                variant="outlined"
                onClick={handleNextQuestion}
                disabled={isLoading}
                size="small"
              >
                {currentQuestionIndex === 2 ? 'Finish' : 'Next'}
              </Button>
            </Stack>
          </Box>
        )}

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

export default QuickTestInterviewInterface;
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
  Grid,
  Avatar,
  useTheme,
  useMediaQuery,
  Container,
  List,
  ListItem,
  ListItemText,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Rating,
  TextField,
  ToggleButton,
  ToggleButtonGroup
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
  Work,
  Business,
  School,
  TrendingUp,
  Psychology,
  ExpandMore,
  Assessment,
  EmojiEvents,
  Keyboard,
  Send
} from '@mui/icons-material';
import { QuickInterviewSession, QuickInterviewQuestion, optimizedQuickInterviewService } from '../services/optimizedQuickInterviewService';

interface JobInterviewInterfaceProps {
  open: boolean;
  onClose: () => void;
  session: QuickInterviewSession | null;
  onComplete?: (results: any) => void;
}

export const JobInterviewInterface: React.FC<JobInterviewInterfaceProps> = ({
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
  const [timeRemaining, setTimeRemaining] = useState(900); // 15 minutes for job interview
  const [questionTime, setQuestionTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [recordingVolume, setRecordingVolume] = useState(0);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [showJobInfo, setShowJobInfo] = useState(true);
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');
  const [textAnswer, setTextAnswer] = useState('');
  
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
      initializeJobInterview();
    }
    return () => {
      cleanup();
    };
  }, [open, session]);

  // Session timer effect (15 minutes countdown)
  useEffect(() => {
    if (hasStarted && session) {
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
  }, [hasStarted]);

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

  const initializeJobInterview = async () => {
    if (!session) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Skip welcome intro for faster start - questions are pre-generated
      setShowWelcome(false);
      
      // Load the first question (now instant since pre-generated)
      await loadCurrentQuestion();
      
    } catch (error) {
      console.error('Failed to initialize job interview:', error);
      setError('Failed to load job interview. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCurrentQuestion = async () => {
    if (!session) return;
    
    try {
      setAvatarLoading(true);
      const question = session.questions[currentQuestionIndex]; // Questions are pre-generated
      
      if (question) {
        setCurrentQuestion(question);
        setQuestionTime(question.expectedDuration);
        
        // Auto-play question avatar immediately (pre-generated for instant access)
        const videoUrl = question.avatarResponse?.stream_url || question.avatarResponse?.mp4_url;
        if (videoUrl) {
          console.log('🎬 Playing pre-generated question avatar:', {
            questionNumber: session.currentQuestionIndex + 1,
            hasStream: !!question.avatarResponse?.stream_url,
            hasMp4: !!question.avatarResponse?.mp4_url,
            using: videoUrl.includes('stream') ? 'stream_url' : 'mp4_url'
          });
          
          // Play immediately - no delay needed since questions are pre-generated
          playAvatarVideo(videoUrl);
        } else {
          console.warn('⚠️ Question has no avatar video available, showing text-only');
          setAvatarLoading(false);
          if (!hasStarted) {
            setHasStarted(true);
          }
        }
      } else {
        // No more questions, complete the interview
        handleCompleteInterview();
      }
    } catch (error) {
      console.error('Failed to load question:', error);
      setError('Failed to load question. Please try again.');
    } finally {
      if (!question?.avatarResponse) {
        setAvatarLoading(false);
      }
    }
  };

  const playAvatarVideo = (videoUrl: string) => {
    console.log('🎬 Playing avatar video:', videoUrl);
    
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
            console.log('✅ Avatar video playing successfully');
            setIsPlaying(true);
            setShowWelcome(false);
            setAvatarLoading(false);
            if (!hasStarted) {
              setHasStarted(true);
            }
          })
          .catch(error => {
            console.warn('❌ Failed to play avatar video:', error);
            setIsPlaying(false);
            setAvatarLoading(false);
            if (!hasStarted) {
              setHasStarted(true);
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
        console.log('Job interview recording completed:', blob.size, 'bytes');
        
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
    setTextAnswer(''); // Clear text answer when moving to next question
    
    try {
      const hasMore = currentQuestionIndex + 1 < session.questions.length;
      setCurrentQuestionIndex(prev => prev + 1);
      
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
      const results = await optimizedQuickInterviewService.completeSession(session.id, allResponses);
      onComplete?.(results);
    } catch (error) {
      console.error('Failed to complete job interview:', error);
      setError('Failed to complete job interview.');
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  const startInterviewNow = async () => {
    setShowJobInfo(false);
    setIsLoading(true);
    
    try {
      // Start optimized session with pre-generated questions
      await optimizedQuickInterviewService.startSession(session?.id || '');
      setHasStarted(true);
      setShowWelcome(false);
      
      // Load the first question (instant since pre-generated)
      await loadCurrentQuestion();
    } catch (error) {
      console.error('Failed to start optimized interview:', error);
      setError('Failed to start interview. Please try again.');
    } finally {
      setIsLoading(false);
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
    if (timeRemaining > 600) return 'success'; // > 10 minutes
    if (timeRemaining > 300) return 'warning'; // > 5 minutes
    return 'error';
  };

  if (!session) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogContent sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress size={40} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Preparing your job interview...
          </Typography>
        </DialogContent>
      </Dialog>
    );
  }

  const job = session.jobContext;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullWidth
      fullScreen={isFullscreen || isMobile}
      PaperProps={{
        sx: {
          width: isFullscreen ? '100vw' : isMobile ? '100vw' : '95vw',
          height: isFullscreen ? '100vh' : isMobile ? '100vh' : '95vh',
          maxWidth: 'none',
          maxHeight: 'none',
          m: isFullscreen || isMobile ? 0 : 1,
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
          <Box display="flex" alignItems="center" justifyContent="between" flexWrap="wrap">
            <Box display="flex" alignItems="center" gap={2} flex={1}>
              <Work sx={{ color: '#667eea' }} />
              <Typography variant="h6" sx={{ color: '#667eea' }} fontWeight="bold" noWrap>
                {job?.title} Interview
              </Typography>
              <Chip 
                label={job?.company} 
                sx={{ 
                  background: 'rgba(102, 126, 234, 0.1)',
                  color: '#667eea'
                }}
                size="small" 
              />
              <Chip 
                label={`${session.difficulty?.toUpperCase()} Level`} 
                color="secondary"
                size="small" 
              />
            </Box>
            
            <Box display="flex" alignItems="center" gap={2}>
              {hasStarted && (
                <Chip
                  icon={<Timer />}
                  label={formatTime(timeRemaining)}
                  color={getProgressColor()}
                  variant="filled"
                  sx={{ fontWeight: 'bold' }}
                />
              )}
              
              <IconButton onClick={toggleFullscreen} size="small">
                {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
              </IconButton>
              
              <IconButton onClick={onClose} size="small">
                <Close />
              </IconButton>
            </Box>
          </Box>
          
          {/* Progress Bar */}
          {hasStarted && (
            <Box sx={{ mt: 1 }}>
              <LinearProgress
                variant="determinate"
                value={((900 - timeRemaining) / 900) * 100}
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
          )}
        </Paper>

        {showJobInfo ? (
          /* Job Information Screen */
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              p: 3,
              overflow: 'auto'
            }}
          >
            <Container maxWidth="md">
              <Card 
                elevation={8} 
                sx={{ 
                  p: 4, 
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 4
                }}
              >
                <Box textAlign="center" mb={4}>
                  <Avatar 
                    sx={{ 
                      width: 80, 
                      height: 80, 
                      mx: 'auto', 
                      mb: 2,
                      background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)'
                    }}
                  >
                    <Business fontSize="large" />
                  </Avatar>
                  <Typography variant="h4" fontWeight="bold" color="#667eea" gutterBottom>
                    {job?.title}
                  </Typography>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    at {job?.company}
                  </Typography>
                  
                  <Box display="flex" justifyContent="center" gap={1} mt={2}>
                    <Chip label={`${session.difficulty} Level`} color="primary" />
                    <Chip label="15 minutes" color="secondary" />
                    <Chip label="5 questions" color="success" />
                  </Box>
                </Box>

                <Grid container spacing={3} sx={{ mb: 4 }}>
                  {/* Job Description */}
                  {job?.description && (
                    <Grid item xs={12}>
                      <Accordion defaultExpanded>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                          <Typography variant="h6" display="flex" alignItems="center" gap={1}>
                            <Assessment color="primary" />
                            Job Description
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
                            {job.description}
                          </Typography>
                        </AccordionDetails>
                      </Accordion>
                    </Grid>
                  )}

                  {/* Requirements */}
                  {job?.requirements && (
                    <Grid item xs={12} md={6}>
                      <Card sx={{ height: '100%', background: 'rgba(102, 126, 234, 0.05)' }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                            <School color="primary" />
                            Requirements
                          </Typography>
                          <List dense>
                            {(Array.isArray(job.requirements) ? job.requirements : [job.requirements]).map((req: string, index: number) => (
                              <ListItem key={index} sx={{ pl: 0 }}>
                                <ListItemText 
                                  primary={`• ${req}`}
                                  primaryTypographyProps={{ variant: 'body2' }}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}

                  {/* Skills */}
                  {job?.skills && (
                    <Grid item xs={12} md={6}>
                      <Card sx={{ height: '100%', background: 'rgba(118, 75, 162, 0.05)' }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                            <TrendingUp color="secondary" />
                            Skills Needed
                          </Typography>
                          <Box display="flex" flexWrap="wrap" gap={1}>
                            {(Array.isArray(job.skills) ? job.skills : job.skills.split(',')).map((skill: string, index: number) => (
                              <Chip 
                                key={index} 
                                label={skill.trim()} 
                                size="small" 
                                variant="outlined"
                                color="secondary"
                              />
                            ))}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}
                </Grid>

                {/* Interview Tips */}
                <Card sx={{ mb: 4, background: 'rgba(76, 175, 80, 0.05)' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                      <Psychology color="success" />
                      Interview Strategy
                    </Typography>
                    <List dense>
                      <ListItem sx={{ pl: 0 }}>
                        <ListItemText 
                          primary="• Prepare specific examples related to this role and company"
                          primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                        />
                      </ListItem>
                      <ListItem sx={{ pl: 0 }}>
                        <ListItemText 
                          primary="• Show how your experience matches the job requirements"
                          primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                        />
                      </ListItem>
                      <ListItem sx={{ pl: 0 }}>
                        <ListItemText 
                          primary="• Be ready to discuss challenges and achievements"
                          primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                        />
                      </ListItem>
                      <ListItem sx={{ pl: 0 }}>
                        <ListItemText 
                          primary="• Ask thoughtful questions about the role and company"
                          primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>

                <Box textAlign="center">
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <PlayArrow />}
                    onClick={startInterviewNow}
                    disabled={isLoading}
                    sx={{
                      px: 6,
                      py: 2,
                      fontSize: '1.2rem',
                      background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                      boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #667eea 60%, #764ba2 100%)',
                        boxShadow: '0 12px 35px rgba(102, 126, 234, 0.6)',
                      },
                      '&:disabled': {
                        background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                        opacity: 0.7
                      }
                    }}
                  >
                    {isLoading ? 'Preparing Questions...' : 'Start Interview Now'}
                  </Button>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    {isLoading ? 'Optimizing questions and AI avatars for seamless experience...' : `This interview will be tailored specifically to the ${job?.title} role`}
                  </Typography>
                </Box>
              </Card>
            </Container>
          </Box>
        ) : (
          /* Interview Interface */
          <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            <Grid container sx={{ height: '100%' }}>
              {/* Avatar Section */}
              <Grid 
                item 
                xs={12} 
                md={7} 
                sx={{ 
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
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: isMobile ? 0 : theme.spacing(2),
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {/* Default Avatar Background */}
                    {((!currentQuestion?.avatarResponse?.mp4_url && !currentQuestion?.avatarResponse?.stream_url) || avatarLoading || !isPlaying) && (
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
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            fontSize: '3rem'
                          }}
                        >
                          👤
                        </Avatar>
                        {isLoading ? (
                          <>
                            <CircularProgress size={40} sx={{ color: '#667eea', mb: 2 }} />
                            <Typography variant="h6" textAlign="center" mb={1}>
                              Preparing Your Interview...
                            </Typography>
                            <Typography variant="body2" textAlign="center" sx={{ opacity: 0.8, px: 2 }}>
                              Questions and AI avatars are being optimized for seamless experience
                            </Typography>
                          </>
                        ) : avatarLoading ? (
                          <>
                            <CircularProgress size={40} sx={{ color: '#667eea', mb: 2 }} />
                            <Typography variant="h6" textAlign="center">
                              Loading Question...
                            </Typography>
                          </>
                        ) : (
                          <>
                            <Typography variant="h5" fontWeight="bold" mb={2} textAlign="center">
                              AI Interviewer
                            </Typography>
                            <Typography variant="body1" textAlign="center" sx={{ opacity: 0.8 }}>
                              Questions are ready! Starting interview...
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
                      background: 'rgba(102, 126, 234, 0.9)',
                      borderRadius: 2,
                      px: 3,
                      py: 1
                    }}
                  >
                    <Typography color="white" variant="h6" fontWeight="bold">
                      Question {currentQuestionIndex + 1} / 5
                    </Typography>
                  </Box>
                  
                  {/* Company Info */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 20,
                      right: 20,
                      background: 'rgba(0, 0, 0, 0.7)',
                      borderRadius: 2,
                      px: 2,
                      py: 1
                    }}
                  >
                    <Typography color="white" variant="body2" fontWeight="bold">
                      {job?.company}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              {/* Question Panel */}
              <Grid 
                item 
                xs={12} 
                md={5} 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <Container sx={{ py: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {currentQuestion && (
                    <>
                      {/* Question */}
                      <Card elevation={4} sx={{ mb: 3, background: 'linear-gradient(135deg, #e8eaf6 0%, #c5cae9 100%)' }}>
                        <CardContent>
                          <Box display="flex" alignItems="center" justifyContent="between" mb={2}>
                            <Typography variant="overline" sx={{ color: '#667eea' }} fontWeight="bold">
                              {currentQuestion.category} Question
                            </Typography>
                            {questionTime > 0 && (
                              <Chip
                                icon={<Timer />}
                                label={`${Math.floor(questionTime / 60)}:${(questionTime % 60).toString().padStart(2, '0')}`}
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
                              sx={{ 
                                background: 'rgba(102, 126, 234, 0.1)',
                                color: '#667eea'
                              }}
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

                      {/* Recording Controls */}
                      <Card elevation={3} sx={{ mb: 3 }}>
                        <CardContent>
                          <Box display="flex" alignItems="center" justifyContent="between" mb={2}>
                            <Typography variant="h6" display="flex" alignItems="center" gap={1}>
                              {inputMode === 'voice' ? <RecordVoiceOver color="primary" /> : <Keyboard color="primary" />}
                              Your Response
                            </Typography>
                            
                            <ToggleButtonGroup
                              value={inputMode}
                              exclusive
                              onChange={(e, newMode) => newMode && setInputMode(newMode)}
                              size="small"
                              aria-label="response input mode"
                            >
                              <ToggleButton value="voice" aria-label="voice response">
                                <Mic fontSize="small" />
                              </ToggleButton>
                              <ToggleButton value="text" aria-label="text response">
                                <Keyboard fontSize="small" />
                              </ToggleButton>
                            </ToggleButtonGroup>
                          </Box>
                          
                          {inputMode === 'voice' ? (
                            <>
                              {/* Volume Indicator */}
                              {isRecording && (
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="body2" color="success.main" gutterBottom fontWeight="bold">
                                    🎤 Recording... Speak confidently
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
                            </>
                          ) : (
                            <Box sx={{ mb: 2 }}>
                              <TextField
                                fullWidth
                                multiline
                                rows={4}
                                value={textAnswer}
                                onChange={(e) => setTextAnswer(e.target.value)}
                                placeholder="Type your answer here... Be specific and provide examples when possible."
                                variant="outlined"
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    backgroundColor: 'rgba(102, 126, 234, 0.05)'
                                  }
                                }}
                              />
                              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                Characters: {textAnswer.length} | Words: {textAnswer.trim().split(/\s+/).filter(word => word.length > 0).length}
                              </Typography>
                            </Box>
                          )}
                          
                          {/* Controls */}
                          <Stack direction="row" spacing={2} justifyContent="center">
                            {inputMode === 'voice' ? (
                              !isRecording ? (
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
                              )
                            ) : (
                              <Button
                                variant="contained"
                                startIcon={<Send />}
                                onClick={() => {
                                  if (textAnswer.trim()) {
                                    console.log('Text answer submitted:', textAnswer);
                                    setTextAnswer(''); // Clear the answer
                                  }
                                }}
                                disabled={!textAnswer.trim()}
                                size="large"
                                sx={{
                                  background: 'linear-gradient(45deg, #2196f3 30%, #64b5f6 90%)',
                                  flex: 1
                                }}
                              >
                                Submit Answer
                              </Button>
                            )}
                            
                            <Button
                              variant="outlined"
                              endIcon={<ArrowForward />}
                              onClick={handleNextQuestion}
                              disabled={isLoading}
                              size="large"
                            >
                              {currentQuestionIndex === 4 ? 'Complete' : 'Next'}
                            </Button>
                          </Stack>
                        </CardContent>
                      </Card>
                    </>
                  )}

                  {/* Interview Progress */}
                  <Card elevation={2} sx={{ background: 'rgba(102, 126, 234, 0.05)' }}>
                    <CardContent>
                      <Typography variant="subtitle2" sx={{ color: '#667eea' }} gutterBottom display="flex" alignItems="center" gap={1}>
                        <EmojiEvents />
                        Interview Progress
                      </Typography>
                      <Box display="flex" justifyContent="between" alignItems="center" mb={1}>
                        <Typography variant="body2" color="text.secondary">
                          Questions Completed
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {currentQuestionIndex} / 5
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={(currentQuestionIndex / 5) * 100} 
                        sx={{ 
                          height: 8, 
                          borderRadius: 4,
                          backgroundColor: 'rgba(102, 126, 234, 0.2)',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: '#667eea'
                          }
                        }}
                      />
                    </CardContent>
                  </Card>
                </Container>
              </Grid>
            </Grid>
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

export default JobInterviewInterface;
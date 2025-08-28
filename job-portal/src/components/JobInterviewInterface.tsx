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
import { speechToTextService, SpeechToTextResult } from '../services/speechToTextService';
import StreamingAvatarVideo from './StreamingAvatarVideo';

// Add Web Speech API types
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
      isFinal: boolean;
    };
    length: number;
  };
}

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
  
  // Debug: Log initial session
  React.useEffect(() => {
    if (initialSession) {
      console.log('🚀 Job Interview Session initialized:', {
        id: initialSession.id,
        totalQuestions: initialSession.questions.length,
        questions: initialSession.questions.map((q, i) => ({ 
          index: i, 
          id: q.id, 
          questionNumber: q.questionNumber,
          text: q.text.substring(0, 80) + '...' 
        }))
      });
    }
  }, [initialSession]);
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
  const [currentAvatarText, setCurrentAvatarText] = useState("Welcome to your job interview! I'm your AI interviewer and I'll be conducting this comprehensive interview today. This interview will assess your qualifications, experience, and fit for the position. Are you ready to begin?");
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState(0);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [awaitingNextQuestion, setAwaitingNextQuestion] = useState(false);
  const [useRealTimeTranscription, setUseRealTimeTranscription] = useState(true);
  const [showingCompletionMessage, setShowingCompletionMessage] = useState(false);
  const [allResponses, setAllResponses] = useState<any[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  // Media refs
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
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(console.error);
    }
    
    // Stop real-time transcription
    stopRealTimeTranscription();
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

  const loadCurrentQuestion = async (questionIndex?: number) => {
    if (!session) return;
    
    // Use provided index or current state index
    const indexToLoad = questionIndex !== undefined ? questionIndex : currentQuestionIndex;
    
    let question = null;
    try {
      // Debug: Log session information
      console.log('🔍 Loading question - Index to load:', indexToLoad);
      console.log('🔍 Current state index:', currentQuestionIndex);
      console.log('🔍 Total questions in session:', session.questions.length);
      console.log('🔍 All questions:', session.questions.map((q, i) => ({ index: i, id: q.id, text: q.text.substring(0, 50) + '...' })));
      
      // Only show avatar loading, don't hide other content
      setAvatarLoading(true);
      question = session.questions[indexToLoad]; // Questions are pre-generated
      
      if (question) {
        console.log('🎯 Loaded question:', { index: indexToLoad, id: question.id, text: question.text });
        setCurrentQuestion(question);
        setQuestionTime(question.expectedDuration);
        
        // Set the avatar text to speak the question
        setCurrentAvatarText(question.text);
        console.log('🎬 Updated job interview avatar text for question:', question.text);
        if (!hasStarted) {
          setHasStarted(true);
        }
        
        // Give avatar some time to prepare before removing loading state
        setTimeout(() => {
          setAvatarLoading(false);
        }, 2000); // 2 second loading state to show preparation
      } else {
        // No more questions, complete the interview
        console.log('❌ No question found at index:', indexToLoad);
        setAvatarLoading(false);
        handleCompleteInterview();
      }
    } catch (error) {
      console.error('Failed to load question:', error);
      setError('Failed to load question. Please try again.');
      setAvatarLoading(false);
    }
  };

  const startRealTimeTranscription = () => {
    if (!useRealTimeTranscription) return;

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        console.log('⚠️ Real-time speech recognition not supported in this browser');
        return;
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        console.log('🎙️ Real-time speech recognition started');
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        // Update current transcript with both final and interim results
        setCurrentTranscript(finalTranscript + interimTranscript);
      };

      recognition.onerror = (event) => {
        console.error('Real-time speech recognition error:', event.error);
      };

      recognition.onend = () => {
        console.log('🎙️ Real-time speech recognition ended');
      };

      recognition.start();
    } catch (error) {
      console.error('Failed to start real-time transcription:', error);
    }
  };

  const stopRealTimeTranscription = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
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
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      mediaRecorderRef.current = mediaRecorder;
      recordingChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        recordingChunksRef.current.push(event.data);
      };
      
      mediaRecorder.onstop = async () => {
        const blob = new Blob(recordingChunksRef.current, { type: 'audio/webm' });
        console.log('🎙️ Job interview recording completed:', blob.size, 'bytes');
        
        // Stop volume monitoring (if not already stopped)
        if (volumeIntervalRef.current) {
          clearInterval(volumeIntervalRef.current);
          volumeIntervalRef.current = null;
        }
        
        // Clean up stream
        stream.getTracks().forEach(track => track.stop());
        
        // Clean up audio context
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close().catch(console.error);
        }
        
        // Process the audio recording
        await handleRecordingComplete(blob);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingStartTime(Date.now());
      setCurrentTranscript('');
      
      // Start real-time transcription
      startRealTimeTranscription();
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
      setIsProcessingAudio(true);
      
      // Stop real-time transcription
      stopRealTimeTranscription();
      
      // Clean up volume monitoring
      if (volumeIntervalRef.current) {
        clearInterval(volumeIntervalRef.current);
        volumeIntervalRef.current = null;
      }
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

  const handleRecordingComplete = async (audioBlob: Blob) => {
    if (!currentQuestion || !session) return;

    setIsProcessingAudio(true);
    setAwaitingNextQuestion(true);

    try {
      console.log('🎙️ Processing job interview recording...');
      
      const recordingDuration = Date.now() - recordingStartTime;
      const response = {
        questionId: currentQuestion.id,
        audioBlob,
        transcript: currentTranscript,
        duration: recordingDuration,
        timestamp: new Date().toISOString()
      };

      // Add to responses
      setAllResponses(prev => [...prev, response]);

      console.log('✅ Job interview recording processed successfully');
      
      // Check if there are more questions and set appropriate avatar message
      const hasMoreQuestions = currentQuestionIndex + 1 < session.questions.length;
      
      if (hasMoreQuestions) {
        setCurrentAvatarText("Thank you for your response. I'm analyzing your answer and preparing the next question.");
        
        // Delay processing state removal to allow avatar to speak
        setTimeout(() => {
          setIsProcessingAudio(false);
        }, 1500);
        
        // Keep awaitingNextQuestion true so avatar onVideoEnd will handle the transition
        // Add fallback timeout in case avatar doesn't trigger the transition
        setTimeout(async () => {
          if (awaitingNextQuestion) {
            console.log('⏰ Fallback: Auto-moving to next question after timeout');
            await handleNextQuestion();
            setAwaitingNextQuestion(false);
            setCurrentTranscript('');
          }
        }, 8000); // 8 second fallback timeout
      } else {
        // This is the last question - prepare completion
        setCurrentAvatarText("Thank you for your final response. I'm now preparing your interview results.");
        
        setTimeout(() => {
          setIsProcessingAudio(false);
          setAwaitingNextQuestion(false);
          setCurrentTranscript('');
          
          // Trigger completion flow after a brief delay
          setTimeout(() => {
            showInterviewCompletionMessage();
          }, 1000);
        }, 1500);
      }

    } catch (error) {
      console.error('Failed to process job interview recording:', error);
      setError('Failed to process your response. Please try again.');
      setIsProcessingAudio(false);
      setAwaitingNextQuestion(false);
    }
  };

  const handleNextQuestion = async () => {
    if (!session) return;
    
    console.log('🔄 Moving to next question - Current index before increment:', currentQuestionIndex);
    console.log('🔄 Total questions available:', session.questions.length);
    
    setIsLoading(true);
    stopRecording();
    setTextAnswer(''); // Clear text answer when moving to next question
    
    try {
      const nextIndex = currentQuestionIndex + 1;
      const hasMore = nextIndex < session.questions.length;
      
      console.log('🔄 Next index will be:', nextIndex, 'Has more questions:', hasMore);
      
      setCurrentQuestionIndex(nextIndex);
      
      if (hasMore) {
        console.log('✅ Moving to next question at index:', nextIndex);
        await loadCurrentQuestion(nextIndex);
      } else {
        // Show completion message with avatar before closing
        console.log('🏁 No more questions - showing completion');
        showInterviewCompletionMessage();
      }
    } catch (error) {
      console.error('Failed to move to next question:', error);
      setError('Failed to load next question.');
    } finally {
      setIsLoading(false);
    }
  };

  const showInterviewCompletionMessage = () => {
    console.log('🎯 Showing job interview completion message');
    setShowingCompletionMessage(true);
    setAwaitingNextQuestion(false);
    setCurrentTranscript('');
    
    // Avatar completion message for job interview
    const completionMessage = "Excellent! You have successfully completed your comprehensive job interview. I have thoroughly analyzed all your responses and am now preparing your detailed performance evaluation and personalized feedback. Your complete interview assessment report will be ready shortly. Thank you for your time and thoughtful responses!";
    
    setCurrentAvatarText(completionMessage);
    
    console.log('🎬 Avatar will announce job interview completion');
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
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={2}>
              <Work sx={{ color: '#667eea' }} />
              <Typography variant="h6" sx={{ color: '#667eea' }} fontWeight="bold">
                Job Interview - {job?.title}
              </Typography>
              <Chip 
                label={`${job?.company}`} 
                sx={{ 
                  background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                  color: 'white',
                  fontWeight: 'bold'
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
                  {/* Avatar Loading State */}
                  {avatarLoading && (
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
                        background: 'rgba(0, 0, 0, 0.9)',
                        backdropFilter: 'blur(10px)',
                        zIndex: 10
                      }}
                    >
                      <CircularProgress size={60} sx={{ mb: 3, color: '#667eea' }} />
                      <Typography variant="h6" color="white" gutterBottom>
                        Preparing AI Interviewer...
                      </Typography>
                      <Typography variant="body2" color="rgba(255, 255, 255, 0.7)" textAlign="center">
                        Setting up your personalized interview experience
                      </Typography>
                    </Box>
                  )}
                  
                  {/* Streaming Avatar Video */}
                  <Box
                    sx={{
                      width: '100%',
                      height: '100%',
                      borderRadius: isMobile ? 0 : theme.spacing(2),
                      overflow: 'hidden',
                      opacity: avatarLoading ? 0.3 : 1,
                      transition: 'opacity 0.3s ease'
                    }}
                  >
                    <StreamingAvatarVideo
                      text={currentAvatarText}
                      avatar="european_woman"
                      emotion="serious"
                      language="en"
                      autoPlay={true}
                      onVideoStart={() => {
                        console.log('🎬 Job interview avatar started');
                        setIsPlaying(true);
                        setShowWelcome(false);
                        setAvatarLoading(false);
                        if (!hasStarted) {
                          setHasStarted(true);
                        }
                      }}
                      onVideoEnd={() => {
                        console.log('🎬 Job interview avatar ended');
                        setIsPlaying(false);
                        
                        // If showing completion message, complete the interview
                        if (showingCompletionMessage) {
                          console.log('🎬 Avatar finished completion message, completing interview');
                          setTimeout(() => {
                            handleCompleteInterview();
                          }, 1500); // Slightly longer delay for completion
                          return;
                        }
                        
                        // If we're awaiting next question and avatar finished speaking, move to next question
                        if (awaitingNextQuestion) {
                          console.log('🎬 Avatar finished analysis message, moving to next question');
                          setTimeout(async () => {
                            await handleNextQuestion();
                            setAwaitingNextQuestion(false);
                            setCurrentTranscript('');
                          }, 1000); // Small delay to ensure smooth transition
                        }
                      }}
                      onError={(error) => {
                        console.error('Job interview avatar error:', error);
                        setError(`Avatar error: ${error}`);
                        setAvatarLoading(false);
                        if (!hasStarted) {
                          setHasStarted(true);
                        }
                      }}
                    />
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
                    <Card elevation={4} sx={{ mb: 3, background: 'linear-gradient(135deg, #e8eaf6 0%, #c5cae9 100%)' }}>
                      <CardContent>
                        <Typography variant="overline" sx={{ color: '#667eea' }} fontWeight="bold" gutterBottom>
                          Job Interview Question {currentQuestionIndex + 1}
                        </Typography>
                        
                        <Typography variant="h6" sx={{ lineHeight: 1.6, mb: 2 }}>
                          {currentQuestion ? currentQuestion.text : 'Preparing your personalized interview question...'}
                        </Typography>
                        
                        {currentQuestion ? (
                          <Chip 
                            label={currentQuestion.category} 
                            size="small" 
                            sx={{ 
                              background: 'rgba(102, 126, 234, 0.1)',
                              color: '#667eea'
                            }}
                          />
                        ) : (
                          <Box display="flex" alignItems="center" gap={1}>
                            <CircularProgress size={16} sx={{ color: '#667eea' }} />
                            <Typography variant="body2" color="text.secondary">
                              Loading question...
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>

                  {/* Recording Controls - Always Visible */}
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
                              🎤 Recording... Speak clearly and confidently
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

                        {/* Real-time transcript display */}
                        {currentTranscript && (
                          <Box sx={{ mb: 2, p: 2, bgcolor: 'rgba(76, 175, 80, 0.1)', borderRadius: 1, border: '1px solid rgba(76, 175, 80, 0.3)' }}>
                            <Typography variant="body2" color="success.main" fontWeight="bold" gutterBottom>
                              📝 Live Transcript:
                            </Typography>
                            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                              {currentTranscript}
                            </Typography>
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
                              disabled={isProcessingAudio || awaitingNextQuestion || !currentQuestion}
                              sx={{
                                background: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)',
                                flex: 1
                              }}
                            >
                              {!currentQuestion ? 'Loading Question...' : isProcessingAudio ? 'Processing...' : 'Record Answer'}
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
                            disabled={isLoading || isProcessingAudio || awaitingNextQuestion || !currentQuestion}
                            size="large"
                          >
                            {currentQuestionIndex === 4 ? 'Finish' : 'Next'}
                          </Button>
                        </Stack>
                      </CardContent>
                    </Card>

                  {/* Audio Processing Status - Always Visible When Active */}
                  {(isProcessingAudio || awaitingNextQuestion || showingCompletionMessage) && (
                    <Card elevation={3} sx={{ mb: 3, border: showingCompletionMessage ? '2px solid #ff9800' : 'none' }}>
                      <CardContent>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <CircularProgress size={24} color={showingCompletionMessage ? "warning" : "primary"} />
                          <Typography variant="body2">
                            {showingCompletionMessage 
                              ? '🎯 Finalizing your job interview results and preparing comprehensive feedback...'
                              : isProcessingAudio 
                                ? '🎙️ Processing your audio response...' 
                                : '🤖 AI is analyzing your response and preparing the next question...'}
                          </Typography>
                        </Stack>
                      </CardContent>
                    </Card>
                  )}

                  {/* Current Transcript Display */}
                  {currentTranscript && (
                    <Card elevation={3} sx={{ mb: 3, border: '2px solid #4caf50' }}>
                      <CardContent>
                        <Typography variant="subtitle2" color="success.main" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CheckCircle fontSize="small" />
                          Your Response (Transcribed):
                        </Typography>
                        <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                          "{currentTranscript}"
                        </Typography>
                      </CardContent>
                    </Card>
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
              </Box>
            )}
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
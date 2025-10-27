import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  LinearProgress,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  Stack,
  Fade,
  Slide,
  Avatar,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  Backdrop
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Mic,
  MicOff,
  Send,
  VolumeUp,
  VolumeOff,
  Close,
  FullscreenExit,
  Psychology,
  Timer,
  CheckCircle,
  RecordVoiceOver,
  Stop
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { InterviewSession, InterviewQuestion, InterviewResult, InterviewResponse, modernInterviewService } from '../services/modernInterviewService';

interface ModernInterviewInterfaceProps {
  open: boolean;
  onClose: () => void;
  session: InterviewSession;
  onComplete: (result: InterviewResult) => void;
}

const ModernInterviewInterface: React.FC<ModernInterviewInterfaceProps> = ({
  open,
  onClose,
  session,
  onComplete
}) => {
  const theme = useTheme();
  
  // Core states
  const [currentQuestion, setCurrentQuestion] = useState<InterviewQuestion | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(session.totalDuration);
  const [interviewPhase, setInterviewPhase] = useState<'loading' | 'avatar-intro' | 'question' | 'recording' | 'processing' | 'completed'>('loading');
  
  // Avatar states
  const [isAvatarReady, setIsAvatarReady] = useState(false);
  const [isAvatarPlaying, setIsAvatarPlaying] = useState(false);
  const [avatarVideoUrl, setAvatarVideoUrl] = useState<string | null>(null);
  
  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingLevel, setRecordingLevel] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [responseMode, setResponseMode] = useState<'voice' | 'text'>('voice');
  const [textResponse, setTextResponse] = useState('');
  
  // System states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userResponses, setUserResponses] = useState<InterviewResponse[]>([]);
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize fullscreen mode when opening
  useEffect(() => {
    if (open) {
      // Request fullscreen
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(console.warn);
      }
      
      // Initialize interview
      initializeInterview();
    } else {
      // Exit fullscreen when closing
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(console.warn);
      }
    }

    return () => {
      // Cleanup
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(console.warn);
      }
      cleanupResources();
    };
  }, [open]);

  // Timer for interview duration
  useEffect(() => {
    if (interviewPhase === 'question' || interviewPhase === 'recording') {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleCompleteInterview();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [interviewPhase]);

  const cleanupResources = useCallback(() => {
    // Stop recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    
    // Stop speech recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    
    // Stop audio analysis
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.warn);
    }
  }, []);

  const initializeInterview = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Start session
      if (session.status === 'ready') {
        await modernInterviewService.startInterviewSession(session.id);
      }
      
      // Pre-load avatar introduction
      await loadAvatarIntroduction();
      
      setInterviewPhase('avatar-intro');
    } catch (error) {
      console.error('Failed to initialize interview:', error);
      setError('Failed to initialize interview');
    } finally {
      setLoading(false);
    }
  };

  const loadAvatarIntroduction = async () => {
    try {
      // Load introduction avatar video (you can customize this)
      const introVideoUrl = "https://vz-79dd5ecb-b78.b-cdn.net/4cf67446-a5ac-4b5b-b21b-c0fdcf30c4db/renditions/720p.mp4";
      setAvatarVideoUrl(introVideoUrl);
      
      // Pre-load the video
      if (videoRef.current) {
        videoRef.current.src = introVideoUrl;
        videoRef.current.load();
        
        // Wait for video to be ready
        videoRef.current.oncanplaythrough = () => {
          setIsAvatarReady(true);
          // Auto-play introduction
          playAvatarIntro();
        };
      }
    } catch (error) {
      console.error('Failed to load avatar introduction:', error);
      // Continue without avatar
      setIsAvatarReady(true);
    }
  };

  const playAvatarIntro = async () => {
    if (videoRef.current && isAvatarReady) {
      try {
        setIsAvatarPlaying(true);
        await videoRef.current.play();
        
        // After intro, load first question
        videoRef.current.onended = () => {
          setIsAvatarPlaying(false);
          loadFirstQuestion();
        };
      } catch (error) {
        console.error('Failed to play avatar intro:', error);
        // Skip to first question
        loadFirstQuestion();
      }
    } else {
      // Skip to first question if avatar not ready
      loadFirstQuestion();
    }
  };

  const loadFirstQuestion = async () => {
    try {
      setLoading(true);
      const question = await modernInterviewService.getNextQuestion(session.id);
      
      if (question) {
        setCurrentQuestion(question);
        setCurrentQuestionIndex(1);
        
        // For modern interview service, we don't have avatarResponse.mp4_url
        // Just proceed to question phase  
        setInterviewPhase('question');
      } else {
        handleCompleteInterview();
      }
    } catch (error) {
      console.error('Failed to load question:', error);
      setError('Failed to load question');
    } finally {
      setLoading(false);
    }
  };

  const playQuestionAvatar = async () => {
    if (videoRef.current) {
      try {
        setIsAvatarPlaying(true);
        setInterviewPhase('question');
        await videoRef.current.play();
        
        videoRef.current.onended = () => {
          setIsAvatarPlaying(false);
          // Avatar finished, user can now respond
        };
      } catch (error) {
        console.error('Failed to play question avatar:', error);
        setIsAvatarPlaying(false);
      }
    }
  };

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Set up media recorder
      mediaRecorderRef.current = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];
      
      // Set up audio level detection
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      source.connect(analyserRef.current);
      
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const updateLevel = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / bufferLength;
          setRecordingLevel(average);
          animationFrameRef.current = requestAnimationFrame(updateLevel);
        }
      };
      updateLevel();
      
      // Set up speech recognition
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        recognitionRef.current = recognition;
        
        recognition.onresult = (event: any) => {
          let finalTranscript = '';
          let interimTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }
          
          setTranscript(finalTranscript + interimTranscript);
        };
        
        recognition.start();
      }
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setInterviewPhase('recording');
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      setError('Failed to access microphone. Please check permissions.');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    setIsRecording(false);
    setRecordingLevel(0);
    setInterviewPhase('processing');
    
    // Process response after a brief delay
    setTimeout(() => {
      handleSubmitResponse();
    }, 1000);
  }, []);

  const handleSubmitResponse = async () => {
    try {
      const response = responseMode === 'voice' ? transcript : textResponse;
      
      if (!response.trim()) {
        setError('Please provide a response before submitting');
        setInterviewPhase('question');
        return;
      }
      
      // Save response
      const newResponse: InterviewResponse = {
        questionId: currentQuestion?.id || '',
        question: currentQuestion?.question || '',
        answer: response,
        timestamp: new Date(),
        duration: 0,
        confidence: 1
      };
      
      setUserResponses(prev => [...prev, newResponse]);
      
      // Submit to backend
      await modernInterviewService.submitResponse(session.id, newResponse);
      
      // Clear current response
      setTranscript('');
      setTextResponse('');
      
      // Load next question or complete
      loadNextQuestion();
      
    } catch (error) {
      console.error('Failed to submit response:', error);
      setError('Failed to submit response');
      setInterviewPhase('question');
    }
  };

  const loadNextQuestion = async () => {
    try {
      setLoading(true);
      const question = await modernInterviewService.getNextQuestion(session.id);
      
      if (question) {
        setCurrentQuestion(question);
        setCurrentQuestionIndex(prev => prev + 1);
        
        // For modern interview service, we don't have avatarResponse.mp4_url
        // Just proceed to question phase
        setInterviewPhase('question');
      } else {
        handleCompleteInterview();
      }
    } catch (error) {
      console.error('Failed to load next question:', error);
      setError('Failed to load next question');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteInterview = async () => {
    try {
      setLoading(true);
      setInterviewPhase('completed');
      
      const result = await modernInterviewService.completeInterview(session.id, userResponses);
      onComplete(result);
      
    } catch (error) {
      console.error('Failed to complete interview:', error);
      setError('Failed to complete interview');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    cleanupResources();
    onClose();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!open) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullScreen
      PaperProps={{
        style: {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }
      }}
    >
      <DialogContent sx={{ p: 0, height: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ 
          p: 2, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          background: 'rgba(0,0,0,0.2)',
          backdropFilter: 'blur(10px)'
        }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
              <Psychology />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                AI Interview - {session.jobTitle}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Question {currentQuestionIndex} • {formatTime(timeRemaining)} remaining
              </Typography>
            </Box>
          </Box>
          
          <Box display="flex" alignItems="center" gap={2}>
            <Chip 
              label={interviewPhase.replace('-', ' ').toUpperCase()} 
              color="primary" 
              variant="filled"
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
            />
            <IconButton onClick={handleClose} sx={{ color: 'white' }}>
              <FullscreenExit />
            </IconButton>
          </Box>
        </Box>

        {/* Progress Bar */}
        <LinearProgress 
          variant="determinate" 
          value={(currentQuestionIndex / Math.max(session.questions.length, 5)) * 100}
          sx={{ 
            height: 6,
            '& .MuiLinearProgress-bar': {
              background: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)'
            }
          }}
        />

        {/* Main Content */}
        <Box sx={{ flex: 1, display: 'flex', height: 'calc(100vh - 120px)' }}>
          {/* Avatar Side */}
          <Box sx={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: 4,
            background: 'rgba(0,0,0,0.1)'
          }}>
            {/* Avatar Video Container */}
            <Card sx={{ 
              width: '100%', 
              maxWidth: 500, 
              aspectRatio: '16/9',
              background: 'rgba(0,0,0,0.3)',
              backdropFilter: 'blur(10px)',
              border: '2px solid rgba(255,255,255,0.2)',
              borderRadius: 4,
              overflow: 'hidden',
              position: 'relative'
            }}>
              {avatarVideoUrl ? (
                <video
                  ref={videoRef}
                  width="100%"
                  height="100%"
                  style={{ objectFit: 'cover' }}
                  muted={false}
                  onLoadedData={() => setIsAvatarReady(true)}
                />
              ) : (
                <Box sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: 2
                }}>
                  <Avatar sx={{ 
                    width: 80, 
                    height: 80, 
                    bgcolor: 'rgba(255,255,255,0.2)' 
                  }}>
                    <Psychology sx={{ fontSize: 40 }} />
                  </Avatar>
                  <Typography variant="h6" align="center">
                    AI Interviewer
                  </Typography>
                  {loading && <CircularProgress color="inherit" />}
                </Box>
              )}
              
              {/* Avatar Status Indicator */}
              {isAvatarPlaying && (
                <Box sx={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  bgcolor: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  px: 2,
                  py: 1,
                  borderRadius: 2
                }}>
                  <RecordVoiceOver sx={{ fontSize: 16 }} />
                  <Typography variant="caption">Speaking...</Typography>
                </Box>
              )}
            </Card>

            {/* Avatar Controls */}
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <IconButton 
                onClick={() => {
                  if (videoRef.current) {
                    if (isAvatarPlaying) {
                      videoRef.current.pause();
                      setIsAvatarPlaying(false);
                    } else {
                      videoRef.current.play();
                      setIsAvatarPlaying(true);
                    }
                  }
                }}
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                }}
              >
                {isAvatarPlaying ? <Pause /> : <PlayArrow />}
              </IconButton>
              <IconButton 
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                }}
              >
                <VolumeUp />
              </IconButton>
            </Box>
          </Box>

          {/* Response Side */}
          <Box sx={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column',
            p: 4
          }}>
            {/* Question */}
            <Card sx={{ 
              mb: 4, 
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <CardContent>
                {currentQuestion ? (
                  <>
                    <Typography variant="h5" gutterBottom fontWeight="bold">
                      {currentQuestion.question}
                    </Typography>
                    <Stack direction="row" gap={1} mt={2}>
                      <Chip 
                        label={currentQuestion.type} 
                        size="small" 
                        sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                      />
                      <Chip 
                        label={currentQuestion.difficulty} 
                        size="small" 
                        color={currentQuestion.difficulty === 'hard' ? 'error' : 'warning'}
                      />
                      <Chip 
                        label={`${currentQuestion.expectedDuration}s expected`} 
                        size="small" 
                        sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                      />
                    </Stack>
                  </>
                ) : (
                  <Box display="flex" alignItems="center" gap={2}>
                    <CircularProgress size={24} />
                    <Typography>Loading question...</Typography>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Response Input */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {interviewPhase === 'loading' && (
                <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                  <CircularProgress size={48} />
                  <Typography>Initializing interview...</Typography>
                </Box>
              )}

              {interviewPhase === 'avatar-intro' && (
                <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                  <Typography variant="h6">Welcome to your AI Interview!</Typography>
                  <Typography align="center">
                    Please wait while our AI interviewer introduces the session...
                  </Typography>
                </Box>
              )}

              {(interviewPhase === 'question' || interviewPhase === 'recording') && (
                <>
                  {/* Response Mode Toggle */}
                  <Stack direction="row" spacing={2} mb={3}>
                    <Button
                      variant={responseMode === 'voice' ? 'contained' : 'outlined'}
                      onClick={() => setResponseMode('voice')}
                      startIcon={<Mic />}
                      sx={{ 
                        color: responseMode === 'voice' ? 'white' : 'rgba(255,255,255,0.7)',
                        borderColor: 'rgba(255,255,255,0.3)'
                      }}
                    >
                      Voice Response
                    </Button>
                    <Button
                      variant={responseMode === 'text' ? 'contained' : 'outlined'}
                      onClick={() => setResponseMode('text')}
                      startIcon={<Send />}
                      sx={{ 
                        color: responseMode === 'text' ? 'white' : 'rgba(255,255,255,0.7)',
                        borderColor: 'rgba(255,255,255,0.3)'
                      }}
                    >
                      Text Response
                    </Button>
                  </Stack>

                  {responseMode === 'voice' ? (
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {/* Recording Status */}
                      <Card sx={{ 
                        background: isRecording ? 'rgba(244, 67, 54, 0.2)' : 'rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(10px)',
                        border: `2px solid ${isRecording ? '#f44336' : 'rgba(255,255,255,0.2)'}`,
                        textAlign: 'center'
                      }}>
                        <CardContent>
                          <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                            <IconButton
                              onClick={isRecording ? stopRecording : startRecording}
                              sx={{ 
                                width: 80,
                                height: 80,
                                bgcolor: isRecording ? '#f44336' : '#4caf50',
                                color: 'white',
                                '&:hover': {
                                  bgcolor: isRecording ? '#d32f2f' : '#388e3c',
                                  transform: 'scale(1.1)'
                                },
                                transition: 'all 0.2s ease'
                              }}
                            >
                              {isRecording ? <Stop sx={{ fontSize: 32 }} /> : <Mic sx={{ fontSize: 32 }} />}
                            </IconButton>
                            
                            <Typography variant="h6">
                              {isRecording ? 'Recording... Click to stop' : 'Click to start recording'}
                            </Typography>
                            
                            {isRecording && (
                              <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography variant="body2">Level:</Typography>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={recordingLevel} 
                                  sx={{ flex: 1, height: 8, borderRadius: 4 }}
                                />
                              </Box>
                            )}
                          </Box>
                        </CardContent>
                      </Card>

                      {/* Live Transcript */}
                      {transcript && (
                        <Card sx={{ 
                          background: 'rgba(255,255,255,0.1)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          flex: 1
                        }}>
                          <CardContent>
                            <Typography variant="subtitle1" gutterBottom>
                              Live Transcript:
                            </Typography>
                            <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
                              "{transcript}"
                            </Typography>
                          </CardContent>
                        </Card>
                      )}
                    </Box>
                  ) : (
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <TextField
                        multiline
                        rows={8}
                        variant="outlined"
                        placeholder="Type your response here..."
                        value={textResponse}
                        onChange={(e) => setTextResponse(e.target.value)}
                        sx={{
                          flex: 1,
                          '& .MuiOutlinedInput-root': {
                            color: 'white',
                            '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                            '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' },
                            '&.Mui-focused fieldset': { borderColor: 'white' }
                          },
                          '& .MuiInputBase-input': {
                            color: 'white'
                          },
                          '& .MuiInputBase-input::placeholder': {
                            color: 'rgba(255,255,255,0.7)'
                          }
                        }}
                      />
                      
                      <Button
                        variant="contained"
                        size="large"
                        onClick={handleSubmitResponse}
                        disabled={!textResponse.trim()}
                        startIcon={<Send />}
                        sx={{
                          bgcolor: '#4caf50',
                          '&:hover': { bgcolor: '#388e3c' },
                          '&:disabled': { bgcolor: 'rgba(255,255,255,0.1)' }
                        }}
                      >
                        Submit Response
                      </Button>
                    </Box>
                  )}
                </>
              )}

              {interviewPhase === 'processing' && (
                <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                  <CircularProgress size={48} />
                  <Typography>Processing your response...</Typography>
                </Box>
              )}

              {interviewPhase === 'completed' && (
                <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                  <CheckCircle sx={{ fontSize: 64, color: '#4caf50' }} />
                  <Typography variant="h5">Interview Completed!</Typography>
                  <Typography align="center">
                    Thank you for participating. Your results are being processed...
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Error Display */}
            {error && (
              <Alert 
                severity="error" 
                onClose={() => setError(null)}
                sx={{ 
                  mt: 2,
                  bgcolor: 'rgba(244, 67, 54, 0.2)',
                  color: 'white',
                  '& .MuiAlert-icon': { color: '#f44336' }
                }}
              >
                {error}
              </Alert>
            )}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ModernInterviewInterface;
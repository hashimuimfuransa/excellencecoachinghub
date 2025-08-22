import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  Stack,
  LinearProgress,
  Paper,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Fab,
  useTheme,
  Avatar,
  Card,
  CardContent,
  Divider,
  Stepper,
  Step,
  StepLabel,
  Slide,
  Zoom,
  Fade
} from '@mui/material';
import {
  Mic,
  MicOff,
  Send,
  Close,
  PlayArrow,
  Pause,
  VolumeUp,
  Refresh,
  CheckCircle,
  Psychology,
  Timer,
  SmartToy
} from '@mui/icons-material';
import {
  InterviewSession,
  InterviewResponse,
  InterviewResult,
  modernInterviewService
} from '../services/modernInterviewService';
import { AvatarTalkResponse } from '../services/avatarTalkService';

interface AvatarInterviewInterfaceProps {
  session: InterviewSession;
  open: boolean;
  onClose: () => void;
  onComplete: (result: InterviewResult) => void;
}

interface InterviewState {
  currentQuestionIndex: number;
  responses: InterviewResponse[];
  timeRemaining: number;
  isRecording: boolean;
  isPlaying: boolean;
  currentAvatarVideo?: AvatarTalkResponse;
  textResponse: string;
  processingVideo: boolean;
  sessionStarted: boolean;
  showInstructions: boolean;
}

const AvatarInterviewInterface: React.FC<AvatarInterviewInterfaceProps> = ({
  session,
  open,
  onClose,
  onComplete
}) => {
  const theme = useTheme();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [state, setState] = useState<InterviewState>({
    currentQuestionIndex: -1, // -1 means showing welcome message
    responses: [],
    timeRemaining: session.totalDuration,
    isRecording: false,
    isPlaying: false,
    textResponse: '',
    processingVideo: false,
    sessionStarted: false,
    showInstructions: true
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && !state.sessionStarted) {
      initializeInterview();
    }
  }, [open]);

  useEffect(() => {
    if (state.sessionStarted && state.timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setState(prev => ({
          ...prev,
          timeRemaining: Math.max(0, prev.timeRemaining - 1)
        }));
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.sessionStarted, state.timeRemaining]);

  useEffect(() => {
    if (state.timeRemaining === 0 && state.sessionStarted) {
      handleTimeUp();
    }
  }, [state.timeRemaining]);

  const initializeInterview = async () => {
    try {
      setError(null);
      setState(prev => ({ ...prev, processingVideo: true }));

      // Generate welcome video
      const welcomeVideo = await modernInterviewService.generateWelcomeVideo(session.jobTitle);
      
      setState(prev => ({
        ...prev,
        currentAvatarVideo: welcomeVideo,
        processingVideo: false
      }));

    } catch (error) {
      console.error('Failed to initialize interview:', error);
      setError('Failed to load interview. Please try again.');
      setState(prev => ({ ...prev, processingVideo: false }));
    }
  };

  const startInterview = async () => {
    setState(prev => ({
      ...prev,
      sessionStarted: true,
      showInstructions: false,
      currentQuestionIndex: 0,
      processingVideo: true
    }));

    try {
      // Load first question video
      const firstQuestion = session.questions[0];
      const questionVideo = await modernInterviewService.generateQuestionVideo(firstQuestion);
      
      setState(prev => ({
        ...prev,
        currentAvatarVideo: questionVideo,
        processingVideo: false
      }));

    } catch (error) {
      console.error('Failed to load question video:', error);
      setError('Failed to load question video. Please try again.');
      setState(prev => ({ ...prev, processingVideo: false }));
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        handleRecordingComplete(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      
      setState(prev => ({ ...prev, isRecording: true }));
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      setError('Failed to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.stop();
      setState(prev => ({ ...prev, isRecording: false }));
    }
  };

  const handleRecordingComplete = async (audioBlob: Blob) => {
    const currentQuestion = session.questions[state.currentQuestionIndex];
    if (!currentQuestion) return;

    const response: InterviewResponse = {
      questionId: currentQuestion.id,
      question: currentQuestion.question,
      answer: 'Voice response', // We'd need speech-to-text for actual transcription
      audioBlob,
      timestamp: new Date(),
      duration: 60, // This would be calculated from actual recording time
      confidence: 0.8 // This would come from speech recognition
    };

    await submitResponse(response);
  };

  const handleTextSubmit = async () => {
    if (!state.textResponse.trim()) return;

    const currentQuestion = session.questions[state.currentQuestionIndex];
    if (!currentQuestion) return;

    const response: InterviewResponse = {
      questionId: currentQuestion.id,
      question: currentQuestion.question,
      answer: state.textResponse,
      timestamp: new Date(),
      duration: 45, // Estimated time
      confidence: 1.0 // Text responses have full confidence
    };

    setState(prev => ({ ...prev, textResponse: '' }));
    await submitResponse(response);
  };

  const submitResponse = async (response: InterviewResponse) => {
    try {
      setState(prev => ({
        ...prev,
        responses: [...prev.responses, response],
        processingVideo: true
      }));

      // Submit response to backend
      await modernInterviewService.submitResponse(session.id, response);

      // Check if this was the last question
      const isLastQuestion = state.currentQuestionIndex === session.questions.length - 1;

      if (isLastQuestion) {
        // Generate completion video
        const completionVideo = await modernInterviewService.generateAcknowledgmentVideo(true);
        setState(prev => ({
          ...prev,
          currentAvatarVideo: completionVideo,
          processingVideo: false
        }));
        
        // Complete interview after a short delay
        setTimeout(() => {
          completeInterview([...state.responses, response]);
        }, 3000);
        
      } else {
        // Move to next question
        const nextQuestionIndex = state.currentQuestionIndex + 1;
        const nextQuestion = session.questions[nextQuestionIndex];
        
        // Generate acknowledgment and then next question
        const ackVideo = await modernInterviewService.generateAcknowledgmentVideo(false);
        setState(prev => ({
          ...prev,
          currentAvatarVideo: ackVideo,
          processingVideo: false
        }));
        
        // After showing acknowledgment, load next question
        setTimeout(async () => {
          try {
            const questionVideo = await modernInterviewService.generateQuestionVideo(nextQuestion);
            setState(prev => ({
              ...prev,
              currentQuestionIndex: nextQuestionIndex,
              currentAvatarVideo: questionVideo
            }));
          } catch (error) {
            console.error('Failed to load next question:', error);
            setError('Failed to load next question. Please try again.');
          }
        }, 2000);
      }

    } catch (error) {
      console.error('Failed to submit response:', error);
      setError('Failed to submit response. Please try again.');
      setState(prev => ({ ...prev, processingVideo: false }));
    }
  };

  const completeInterview = async (allResponses: InterviewResponse[]) => {
    try {
      const result = await modernInterviewService.completeInterview(session.id, allResponses);
      onComplete(result);
    } catch (error) {
      console.error('Failed to complete interview:', error);
      setError('Interview completed but failed to process results.');
    }
  };

  const handleTimeUp = () => {
    if (state.isRecording) {
      stopRecording();
    }
    completeInterview(state.responses);
  };

  const playAvatarVideo = () => {
    if (videoRef.current && state.currentAvatarVideo?.mp4_url) {
      videoRef.current.play();
      setState(prev => ({ ...prev, isPlaying: true }));
    }
  };

  const currentQuestion = state.currentQuestionIndex >= 0 ? session.questions[state.currentQuestionIndex] : null;
  const progress = ((state.currentQuestionIndex + 1) / session.questions.length) * 100;
  const timePercentage = (state.timeRemaining / session.totalDuration) * 100;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={window.innerWidth < 768}
      PaperProps={{
        sx: {
          borderRadius: { xs: 0, sm: 3 },
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          minHeight: { xs: '100vh', sm: '80vh' }
        }
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ height: { xs: '100vh', sm: '80vh' }, display: 'flex', flexDirection: 'column' }}>
          
          {/* Header */}
          <Box sx={{ p: 3, borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <SmartToy />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                    AI Interview - {session.jobTitle}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    {state.sessionStarted ? `Question ${state.currentQuestionIndex + 1} of ${session.questions.length}` : 'Welcome'}
                  </Typography>
                </Box>
              </Stack>
              
              <Stack direction="row" alignItems="center" spacing={2}>
                <Chip
                  icon={<Timer />}
                  label={`${Math.floor(state.timeRemaining / 60)}:${String(state.timeRemaining % 60).padStart(2, '0')}`}
                  color={state.timeRemaining < 60 ? 'error' : 'primary'}
                  variant="outlined"
                  sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
                />
                <IconButton onClick={onClose} sx={{ color: 'white' }}>
                  <Close />
                </IconButton>
              </Stack>
            </Stack>
            
            {/* Progress Bar */}
            {state.sessionStarted && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={progress}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#4caf50'
                    }
                  }}
                />
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', mt: 0.5, display: 'block' }}>
                  Progress: {Math.round(progress)}%
                </Typography>
              </Box>
            )}
          </Box>

          {/* Main Content */}
          <Box sx={{ flexGrow: 1, p: 3, display: 'flex', flexDirection: 'column' }}>
            
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {/* Avatar Video Section */}
            <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 3 }}>
              <Card
                elevation={8}
                sx={{
                  maxWidth: 500,
                  width: '100%',
                  borderRadius: 3,
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  {state.processingVideo ? (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                      <CircularProgress size={60} sx={{ color: 'white', mb: 2 }} />
                      <Typography variant="body1" sx={{ color: 'white' }}>
                        Loading AI Interviewer...
                      </Typography>
                    </Box>
                  ) : state.currentAvatarVideo?.mp4_url ? (
                    <Box sx={{ textAlign: 'center' }}>
                      <video
                        ref={videoRef}
                        width="100%"
                        height="300"
                        controls
                        autoPlay
                        style={{ borderRadius: '12px' }}
                        onEnded={() => setState(prev => ({ ...prev, isPlaying: false }))}
                      >
                        <source src={state.currentAvatarVideo.mp4_url} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                      <Avatar sx={{ mx: 'auto', mb: 2, width: 80, height: 80, bgcolor: 'primary.main' }}>
                        <SmartToy sx={{ fontSize: 40 }} />
                      </Avatar>
                      <Typography variant="body1" sx={{ color: 'white' }}>
                        AI Interviewer Ready
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Box>

            {/* Instructions or Question */}
            <Box sx={{ mb: 3 }}>
              {state.showInstructions ? (
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    background: 'rgba(255,255,255,0.9)',
                    textAlign: 'center'
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    Welcome to Your AI Interview!
                  </Typography>
                  <Typography variant="body1" paragraph>
                    This is a {session.totalDuration / 60}-minute interview for the {session.jobTitle} position.
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    You can respond using voice recording or by typing your answers.
                    Make sure your microphone is working if you plan to use voice responses.
                  </Typography>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<PlayArrow />}
                    onClick={startInterview}
                    sx={{ mt: 3 }}
                  >
                    Start Interview
                  </Button>
                </Paper>
              ) : currentQuestion ? (
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    background: 'rgba(255,255,255,0.9)'
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                    <Chip
                      label={currentQuestion.type.toUpperCase()}
                      color={
                        currentQuestion.type === 'technical' ? 'primary' :
                        currentQuestion.type === 'behavioral' ? 'secondary' : 'info'
                      }
                      size="small"
                    />
                    <Chip
                      label={currentQuestion.difficulty.toUpperCase()}
                      color={
                        currentQuestion.difficulty === 'easy' ? 'success' :
                        currentQuestion.difficulty === 'medium' ? 'warning' : 'error'
                      }
                      size="small"
                      variant="outlined"
                    />
                  </Stack>
                  
                  <Typography variant="h6" gutterBottom>
                    {currentQuestion.question}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary">
                    Expected duration: ~{currentQuestion.expectedDuration} seconds
                  </Typography>
                </Paper>
              ) : null}
            </Box>

            {/* Response Controls */}
            {state.sessionStarted && currentQuestion && (
              <Box>
                <Stack spacing={2}>
                  {/* Voice Recording */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)'
                    }}
                  >
                    <Stack direction="row" alignItems="center" justifyContent="center" spacing={2}>
                      <Typography variant="body2" sx={{ color: 'white' }}>
                        Voice Response:
                      </Typography>
                      <Button
                        variant={state.isRecording ? "contained" : "outlined"}
                        color={state.isRecording ? "error" : "primary"}
                        startIcon={state.isRecording ? <MicOff /> : <Mic />}
                        onClick={state.isRecording ? stopRecording : startRecording}
                        sx={{ color: state.isRecording ? 'white' : 'rgba(255,255,255,0.9)' }}
                      >
                        {state.isRecording ? 'Stop Recording' : 'Start Recording'}
                      </Button>
                    </Stack>
                  </Paper>

                  <Divider sx={{ color: 'rgba(255,255,255,0.3)' }}>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      OR
                    </Typography>
                  </Divider>

                  {/* Text Response */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      background: 'rgba(255,255,255,0.9)'
                    }}
                  >
                    <Box component="textarea"
                      value={state.textResponse}
                      onChange={(e) => setState(prev => ({ ...prev, textResponse: e.target.value }))}
                      placeholder="Type your answer here..."
                      style={{
                        width: '100%',
                        minHeight: '100px',
                        border: 'none',
                        outline: 'none',
                        resize: 'vertical',
                        fontFamily: 'inherit',
                        fontSize: '16px',
                        padding: '8px',
                        borderRadius: '8px',
                        backgroundColor: 'transparent'
                      }}
                    />
                    
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        {state.textResponse.length} characters
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<Send />}
                        onClick={handleTextSubmit}
                        disabled={!state.textResponse.trim()}
                      >
                        Submit Answer
                      </Button>
                    </Stack>
                  </Paper>
                </Stack>
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default AvatarInterviewInterface;
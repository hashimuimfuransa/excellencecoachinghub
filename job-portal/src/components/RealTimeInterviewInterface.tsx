/**
 * Real-Time Interview Interface
 * Live video chat interview experience using D-ID Real-Time API
 */

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
  TextField,
  Stack,
  Fade,
  Card,
  CardContent,
  Avatar,
  Chip,
  Divider
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Mic,
  MicOff,
  Send,
  Close,
  FullscreenExit,
  VolumeUp,
  VolumeOff,
  VideoCall,
  RecordVoiceOver,
  Psychology,
  Timer,
  CheckCircle,
  Stop
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { QuickInterviewSession, QuickInterviewQuestion, QuickInterviewResult, quickInterviewService } from '../services/quickInterviewService';
import { avatarResponseHandler, AvatarResponse } from '../services/avatarResponseHandler';
import { didRealTimeService } from '../services/didRealTimeService';

interface RealTimeInterviewInterfaceProps {
  open: boolean;
  onClose: () => void;
  session: QuickInterviewSession;
  onComplete: (result: QuickInterviewResult) => void;
}

interface InterviewState {
  phase: 'welcome' | 'question' | 'response' | 'processing' | 'completed';
  currentQuestion: QuickInterviewQuestion | null;
  currentQuestionIndex: number;
  isRecording: boolean;
  isPlaying: boolean;
  timeRemaining: number;
  avatarResponse: AvatarResponse | null;
  userResponse: string;
  isProcessing: boolean;
  error: string | null;
  didSessionId: string | null;
  streamActive: boolean;
}

const RealTimeInterviewInterface: React.FC<RealTimeInterviewInterfaceProps> = ({
  open,
  onClose,
  session,
  onComplete
}) => {
  const theme = useTheme();
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<ReadableStream<Uint8Array> | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // State
  const [state, setState] = useState<InterviewState>({
    phase: 'welcome',
    currentQuestion: null,
    currentQuestionIndex: 0,
    isRecording: false,
    isPlaying: false,
    timeRemaining: session.totalDuration,
    avatarResponse: null,
    userResponse: '',
    isProcessing: false,
    error: null,
    didSessionId: null,
    streamActive: false
  });

  // Initialize interview
  useEffect(() => {
    if (open) {
      initializeInterview();
    }
    
    return () => {
      cleanup();
    };
  }, [open]);

  // Timer effect
  useEffect(() => {
    if (state.phase === 'question' && state.timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setState(prev => ({
          ...prev,
          timeRemaining: prev.timeRemaining - 1
        }));
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.phase, state.timeRemaining]);

  const initializeInterview = async () => {
    try {
      setState(prev => ({ ...prev, isProcessing: true, error: null }));
      
      // Generate welcome message
      const welcomeResponse = await avatarResponseHandler.generateWelcomeMessage(session.jobTitle);
      setState(prev => ({ 
        ...prev, 
        avatarResponse: welcomeResponse,
        phase: 'welcome',
        isProcessing: false
      }));
      
      // Start D-ID stream if available
      if (welcomeResponse.avatar === 'did') {
        await startDIDStream(welcomeResponse);
      }
      
    } catch (error) {
      console.error('Failed to initialize interview:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to initialize interview',
        isProcessing: false
      }));
    }
  };

  const startDIDStream = async (response: AvatarResponse) => {
    try {
      if (response.avatar === 'did' && didRealTimeService.isConfigured()) {
        // Create D-ID session and start streaming
        const didResponse = await didRealTimeService.generateInterviewResponse(response.text);
        
        if (didResponse.success && didResponse.session_id) {
          setState(prev => ({ 
            ...prev, 
            didSessionId: didResponse.session_id,
            streamActive: true
          }));
          
          // Start video stream
          const stream = await didRealTimeService.streamVideo(didResponse.session_id);
          await playVideoStream(stream);
        }
      }
    } catch (error) {
      console.error('Failed to start D-ID stream:', error);
      // Fallback to regular video playback
      setState(prev => ({ ...prev, streamActive: false }));
    }
  };

  const playVideoStream = async (stream: ReadableStream<Uint8Array>) => {
    try {
      const reader = stream.getReader();
      const chunks: Uint8Array[] = [];
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      
      // Combine chunks into video blob
      const videoBlob = new Blob(chunks, { type: 'video/mp4' });
      const videoUrl = URL.createObjectURL(videoBlob);
      
      if (videoRef.current) {
        videoRef.current.src = videoUrl;
        await videoRef.current.play();
        setState(prev => ({ ...prev, isPlaying: true }));
      }
      
    } catch (error) {
      console.error('Failed to play video stream:', error);
    }
  };

  const loadNextQuestion = async () => {
    try {
      setState(prev => ({ ...prev, isProcessing: true, error: null }));
      
      const question = await quickInterviewService.getNextQuestion(session.id);
      
      if (question) {
        // Generate avatar response for the question
        const avatarResponse = await avatarResponseHandler.processQuestion(question.text);
        
        setState(prev => ({
          ...prev,
          currentQuestion: question,
          currentQuestionIndex: prev.currentQuestionIndex + 1,
          avatarResponse,
          phase: 'question',
          isProcessing: false,
          userResponse: ''
        }));
        
        // Start D-ID stream if available
        if (avatarResponse.avatar === 'did') {
          await startDIDStream(avatarResponse);
        }
        
      } else {
        // No more questions, complete interview
        handleCompleteInterview();
      }
    } catch (error) {
      console.error('Failed to load question:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to load question',
        isProcessing: false
      }));
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await processAudioResponse(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      
      setState(prev => ({ ...prev, isRecording: true }));
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      setState(prev => ({ ...prev, error: 'Failed to access microphone' }));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.stop();
      setState(prev => ({ ...prev, isRecording: false }));
    }
  };

  const processAudioResponse = async (audioBlob: Blob) => {
    try {
      setState(prev => ({ ...prev, isProcessing: true, phase: 'processing' }));
      
      // Convert audio to text (you would implement speech-to-text here)
      const responseText = await convertAudioToText(audioBlob);
      
      setState(prev => ({ 
        ...prev, 
        userResponse: responseText,
        isProcessing: false,
        phase: 'response'
      }));
      
      // Generate acknowledgment
      const acknowledgment = await avatarResponseHandler.generateAcknowledgment(
        state.currentQuestionIndex >= session.questions.length - 1
      );
      
      setState(prev => ({ ...prev, avatarResponse: acknowledgment }));
      
      // Auto-advance to next question after acknowledgment
      setTimeout(() => {
        if (state.currentQuestionIndex < session.questions.length - 1) {
          loadNextQuestion();
        } else {
          handleCompleteInterview();
        }
      }, 3000);
      
    } catch (error) {
      console.error('Failed to process audio response:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to process response',
        isProcessing: false
      }));
    }
  };

  const convertAudioToText = async (audioBlob: Blob): Promise<string> => {
    // This is a placeholder - you would implement actual speech-to-text here
    // For now, return a mock response
    return "This is a mock response. In a real implementation, this would be converted from audio to text using a speech-to-text service.";
  };

  const handleCompleteInterview = async () => {
    try {
      setState(prev => ({ ...prev, isProcessing: true, phase: 'completed' }));
      
      // Generate final results
      const result = await quickInterviewService.completeSession(session.id, {
        responses: [], // You would collect actual responses here
        totalTime: session.totalDuration - state.timeRemaining,
        completedAt: new Date().toISOString()
      });
      
      onComplete(result);
      
    } catch (error) {
      console.error('Failed to complete interview:', error);
      setState(prev => ({ ...prev, error: 'Failed to complete interview' }));
    }
  };

  const cleanup = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    if (state.didSessionId) {
      didRealTimeService.stopStream(state.didSessionId);
    }
    
    if (streamRef.current) {
      streamRef.current.cancel();
    }
  };

  const handleClose = () => {
    cleanup();
    onClose();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPhaseTitle = (): string => {
    switch (state.phase) {
      case 'welcome': return 'Welcome to Your Interview';
      case 'question': return 'Question Time';
      case 'response': return 'Processing Response';
      case 'processing': return 'Processing...';
      case 'completed': return 'Interview Complete';
      default: return 'Interview';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      fullScreen
      PaperProps={{
        sx: {
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
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              {getPhaseTitle()}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              {session.jobTitle} • Question {state.currentQuestionIndex + 1} of {session.questions.length}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip 
              icon={<Timer />} 
              label={formatTime(state.timeRemaining)} 
              color="primary" 
              variant="outlined"
              sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
            />
            <IconButton onClick={handleClose} sx={{ color: 'white' }}>
              <Close />
            </IconButton>
          </Box>
        </Box>

        {/* Main Content */}
        <Box sx={{ flex: 1, display: 'flex', p: 2, gap: 2 }}>
          {/* Avatar Video Section */}
          <Card sx={{ flex: 1, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              {state.avatarResponse && (
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Avatar sx={{ width: 120, height: 120, mb: 2, bgcolor: 'primary.main' }}>
                    <VideoCall sx={{ fontSize: 60 }} />
                  </Avatar>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    AI Interviewer
                  </Typography>
                  <Chip 
                    label={state.avatarResponse.avatar === 'did' ? 'D-ID Real-Time' : 'TalkAvatar'} 
                    color={state.avatarResponse.avatar === 'did' ? 'success' : 'warning'}
                    size="small"
                  />
                </Box>
              )}

              {/* Video Player */}
              <Box sx={{ width: '100%', maxWidth: 600, mb: 3 }}>
                <video
                  ref={videoRef}
                  style={{ 
                    width: '100%', 
                    height: 'auto', 
                    borderRadius: 12,
                    background: 'rgba(0,0,0,0.1)'
                  }}
                  controls={false}
                  autoPlay
                  muted
                />
              </Box>

              {/* Avatar Response Text */}
              {state.avatarResponse && (
                <Paper sx={{ 
                  p: 2, 
                  maxWidth: 600, 
                  background: 'rgba(255,255,255,0.1)', 
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}>
                  <Typography variant="body1" sx={{ textAlign: 'center', lineHeight: 1.6 }}>
                    {state.avatarResponse.text}
                  </Typography>
                </Paper>
              )}

              {/* Loading State */}
              {state.isProcessing && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                  <CircularProgress size={24} sx={{ color: 'white' }} />
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Processing...
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Controls Section */}
          <Card sx={{ width: 300, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, textAlign: 'center' }}>
                Interview Controls
              </Typography>

              {/* Current Question */}
              {state.currentQuestion && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, opacity: 0.8 }}>
                    Current Question:
                  </Typography>
                  <Paper sx={{ p: 2, background: 'rgba(255,255,255,0.1)' }}>
                    <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                      {state.currentQuestion.text}
                    </Typography>
                  </Paper>
                </Box>
              )}

              {/* Recording Controls */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, textAlign: 'center' }}>
                  Your Response
                </Typography>
                
                {state.phase === 'question' && (
                  <Stack spacing={2} alignItems="center">
                    {!state.isRecording ? (
                      <Button
                        variant="contained"
                        startIcon={<Mic />}
                        onClick={startRecording}
                        sx={{ 
                          width: '100%',
                          background: 'linear-gradient(45deg, #ff6b6b, #ee5a24)',
                          '&:hover': {
                            background: 'linear-gradient(45deg, #ff5252, #d63031)'
                          }
                        }}
                      >
                        Start Recording
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        startIcon={<Stop />}
                        onClick={stopRecording}
                        sx={{ 
                          width: '100%',
                          background: 'linear-gradient(45deg, #00b894, #00a085)',
                          '&:hover': {
                            background: 'linear-gradient(45deg, #00a085, #00b894)'
                          }
                        }}
                      >
                        Stop Recording
                      </Button>
                    )}
                  </Stack>
                )}

                {/* User Response Display */}
                {state.userResponse && (
                  <Paper sx={{ p: 2, mt: 2, background: 'rgba(255,255,255,0.1)' }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, opacity: 0.8 }}>
                      Your Response:
                    </Typography>
                    <Typography variant="body2">
                      {state.userResponse}
                    </Typography>
                  </Paper>
                )}
              </Box>

              {/* Progress */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, textAlign: 'center' }}>
                  Progress
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={(state.currentQuestionIndex / session.questions.length) * 100}
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    '& .MuiLinearProgress-bar': {
                      background: 'linear-gradient(45deg, #00b894, #00a085)'
                    }
                  }}
                />
                <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 1, opacity: 0.8 }}>
                  {state.currentQuestionIndex} of {session.questions.length} questions
                </Typography>
              </Box>

              {/* Error Display */}
              {state.error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {state.error}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default RealTimeInterviewInterface;

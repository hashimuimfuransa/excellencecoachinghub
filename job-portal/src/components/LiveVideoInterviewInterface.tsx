/**
 * Live Video Interview Interface
 * Zoom-like real-time video conversation with AI avatar using D-ID Real-Time API
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Stack,
  Avatar,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  Tooltip,
  Badge,
  Divider,
  Grid,
  Switch,
  FormControlLabel,
  Slider
} from '@mui/material';
import {
  Videocam,
  VideocamOff,
  Mic,
  MicOff,
  VolumeUp,
  VolumeOff,
  Close,
  Fullscreen,
  FullscreenExit,
  Settings,
  RecordVoiceOver,
  Psychology,
  Timer,
  CheckCircle,
  Stop,
  PlayArrow,
  Pause,
  FiberManualRecord,
  StopCircle,
  VideoLibrary,
  Chat,
  ScreenShare,
  MoreVert,
  Person,
  Group
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { QuickInterviewSession, QuickInterviewQuestion, QuickInterviewResult, quickInterviewService } from '../services/quickInterviewService';
import { avatarResponseHandler, AvatarResponse } from '../services/avatarResponseHandler';
import { didRealTimeService } from '../services/didRealTimeService';

interface LiveVideoInterviewInterfaceProps {
  open: boolean;
  onClose: () => void;
  session: QuickInterviewSession;
  onComplete: (result: QuickInterviewResult) => void;
}

interface VideoCallState {
  isConnected: boolean;
  isMuted: boolean;
  isVideoOn: boolean;
  isAvatarSpeaking: boolean;
  isUserSpeaking: boolean;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
  callDuration: number;
  participants: number;
}

const LiveVideoInterviewInterface: React.FC<LiveVideoInterviewInterfaceProps> = ({
  open,
  onClose,
  session,
  onComplete
}) => {
  const theme = useTheme();
  
  // Video call states
  const [callState, setCallState] = useState<VideoCallState>({
    isConnected: false,
    isMuted: false,
    isVideoOn: true,
    isAvatarSpeaking: false,
    isUserSpeaking: false,
    connectionQuality: 'excellent',
    callDuration: 0,
    participants: 2 // User + Avatar
  });

  // Interview states
  const [currentQuestion, setCurrentQuestion] = useState<QuickInterviewQuestion | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [interviewPhase, setInterviewPhase] = useState<'connecting' | 'welcome' | 'question' | 'response' | 'completed'>('connecting');
  const [timeRemaining, setTimeRemaining] = useState(session.totalDuration);
  
  // D-ID Real-Time states
  const [didSessionId, setDidSessionId] = useState<string | null>(null);
  const [avatarResponse, setAvatarResponse] = useState<AvatarResponse | null>(null);
  const [streamActive, setStreamActive] = useState(false);
  
  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  // UI states
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Refs
  const avatarVideoRef = useRef<HTMLVideoElement>(null);
  const userVideoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize video call
  useEffect(() => {
    if (open) {
      initializeVideoCall();
    }
    
    return () => {
      cleanup();
    };
  }, [open]);

  // Call duration timer
  useEffect(() => {
    if (callState.isConnected) {
      callTimerRef.current = setInterval(() => {
        setCallState(prev => ({
          ...prev,
          callDuration: prev.callDuration + 1
        }));
      }, 1000);
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    }

    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, [callState.isConnected]);

  const initializeVideoCall = async () => {
    try {
      setLoading(true);
      setError(null);
      setInterviewPhase('connecting');
      
      console.log('🎥 Initializing live video interview...');
      
      // Request user's camera and microphone
      const userStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: { echoCancellation: true, noiseSuppression: true }
      });
      
      mediaStreamRef.current = userStream;
      
      // Set up user video
      if (userVideoRef.current) {
        userVideoRef.current.srcObject = userStream;
      }
      
      // Connect to D-ID Real-Time API
      await connectToDIDAvatar();
      
      setCallState(prev => ({ ...prev, isConnected: true }));
      setInterviewPhase('welcome');
      
      console.log('✅ Live video interview initialized');
      
    } catch (error) {
      console.error('Failed to initialize video call:', error);
      setError('Failed to start video call. Please check your camera and microphone permissions.');
    } finally {
      setLoading(false);
    }
  };

  const connectToDIDAvatar = async () => {
    try {
      console.log('🤖 Connecting to D-ID Real-Time Avatar...');
      
      // Generate welcome message
      const welcomeResponse = await avatarResponseHandler.generateWelcomeMessage(session.jobTitle);
      setAvatarResponse(welcomeResponse);
      
      if (welcomeResponse.avatar === 'did') {
        // Start D-ID Real-Time streaming
        const didResponse = await didRealTimeService.generateInterviewResponse(welcomeResponse.text);
        
        if (didResponse.success && didResponse.session_id) {
          setDidSessionId(didResponse.session_id);
          setStreamActive(true);
          
          // Start video stream
          const stream = await didRealTimeService.streamVideo(didResponse.session_id);
          await playAvatarVideoStream(stream);
          
          setCallState(prev => ({ ...prev, isAvatarSpeaking: true }));
          
          // Auto-advance after welcome
          setTimeout(() => {
            setInterviewPhase('question');
            loadNextQuestion();
          }, 5000);
        }
      } else {
        throw new Error('D-ID Real-Time API not available');
      }
      
    } catch (error) {
      console.error('Failed to connect to D-ID avatar:', error);
      throw error;
    }
  };

  const playAvatarVideoStream = async (stream: ReadableStream<Uint8Array>) => {
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
      
      if (avatarVideoRef.current) {
        avatarVideoRef.current.src = videoUrl;
        await avatarVideoRef.current.play();
        
        avatarVideoRef.current.onended = () => {
          setCallState(prev => ({ ...prev, isAvatarSpeaking: false }));
        };
      }
      
    } catch (error) {
      console.error('Failed to play avatar video stream:', error);
    }
  };

  const loadNextQuestion = async () => {
    try {
      setLoading(true);
      
      const question = await quickInterviewService.getNextQuestion(session.id);
      
      if (question) {
        setCurrentQuestion(question);
        setCurrentQuestionIndex(prev => prev + 1);
        
        // Generate avatar response for question
        const avatarResponse = await avatarResponseHandler.processQuestion(question.text);
        setAvatarResponse(avatarResponse);
        
        if (avatarResponse.avatar === 'did') {
          // Start D-ID streaming for question
          const didResponse = await didRealTimeService.generateInterviewResponse(avatarResponse.text);
          
          if (didResponse.success && didResponse.session_id) {
            setDidSessionId(didResponse.session_id);
            
            const stream = await didRealTimeService.streamVideo(didResponse.session_id);
            await playAvatarVideoStream(stream);
            
            setCallState(prev => ({ ...prev, isAvatarSpeaking: true }));
            setInterviewPhase('response');
          }
        }
        
      } else {
        // No more questions, complete interview
        handleCompleteInterview();
      }
      
    } catch (error) {
      console.error('Failed to load question:', error);
      setError('Failed to load question');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteInterview = async () => {
    try {
      setInterviewPhase('completed');
      
      // Generate completion message
      const completionResponse = await avatarResponseHandler.generateAcknowledgment(true);
      setAvatarResponse(completionResponse);
      
      // Complete the session
      const result = await quickInterviewService.completeSession(session.id, {
        responses: [],
        totalTime: session.totalDuration - timeRemaining,
        completedAt: new Date().toISOString()
      });
      
      setTimeout(() => {
        onComplete(result);
      }, 3000);
      
    } catch (error) {
      console.error('Failed to complete interview:', error);
      setError('Failed to complete interview');
    }
  };

  const toggleMute = () => {
    if (mediaStreamRef.current) {
      const audioTracks = mediaStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = callState.isMuted;
      });
      
      setCallState(prev => ({ ...prev, isMuted: !prev.isMuted }));
    }
  };

  const toggleVideo = () => {
    if (mediaStreamRef.current) {
      const videoTracks = mediaStreamRef.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = callState.isVideoOn;
      });
      
      setCallState(prev => ({ ...prev, isVideoOn: !prev.isVideoOn }));
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    setRecordingDuration(0);
    
    recordingTimerRef.current = setInterval(() => {
      setRecordingDuration(prev => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
  };

  const cleanup = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (didSessionId) {
      didRealTimeService.stopStream(didSessionId);
    }
    
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
    }
    
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getConnectionQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return '#4caf50';
      case 'good': return '#8bc34a';
      case 'fair': return '#ff9800';
      case 'poor': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullWidth
      fullScreen
      PaperProps={{
        sx: {
          background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
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
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(0,0,0,0.2)'
        }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              Live Video Interview
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              {session.jobTitle} • Question {currentQuestionIndex + 1} of {session.questions.length}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Connection Quality */}
            <Chip 
              icon={<CheckCircle />} 
              label={callState.connectionQuality}
              sx={{ 
                backgroundColor: getConnectionQualityColor(callState.connectionQuality),
                color: 'white'
              }}
            />
            
            {/* Call Duration */}
            <Chip 
              icon={<Timer />} 
              label={formatTime(callState.callDuration)} 
              color="primary" 
              variant="outlined"
              sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
            />
            
            {/* Participants */}
            <Chip 
              icon={<Group />} 
              label={`${callState.participants} participants`} 
              color="secondary" 
              variant="outlined"
              sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
            />
            
            <IconButton onClick={onClose} sx={{ color: 'white' }}>
              <Close />
            </IconButton>
          </Box>
        </Box>

        {/* Main Video Area */}
        <Box sx={{ flex: 1, display: 'flex', position: 'relative' }}>
          {/* Avatar Video (Main) */}
          <Box sx={{ 
            flex: 1, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.3)',
            position: 'relative'
          }}>
            {loading && interviewPhase === 'connecting' ? (
              <Box sx={{ textAlign: 'center' }}>
                <CircularProgress size={60} sx={{ color: 'white', mb: 2 }} />
                <Typography variant="h6" sx={{ color: 'white' }}>
                  Connecting to AI Interviewer...
                </Typography>
              </Box>
            ) : (
              <>
                <video
                  ref={avatarVideoRef}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: 8
                  }}
                  autoPlay
                  muted={false}
                  playsInline
                />
                
                {/* Avatar Speaking Indicator */}
                {callState.isAvatarSpeaking && (
                  <Box sx={{
                    position: 'absolute',
                    bottom: 20,
                    left: 20,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    padding: '8px 16px',
                    borderRadius: 2
                  }}>
                    <Box sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: '#4caf50',
                      animation: 'pulse 1.5s ease-in-out infinite',
                      '@keyframes pulse': {
                        '0%': { opacity: 1 },
                        '50%': { opacity: 0.5 },
                        '100%': { opacity: 1 }
                      }
                    }} />
                    <Typography variant="body2" sx={{ color: 'white' }}>
                      AI Interviewer is speaking
                    </Typography>
                  </Box>
                )}
                
                {/* Service Indicator */}
                {avatarResponse && (
                  <Box sx={{ 
                    position: 'absolute',
                    top: 20,
                    right: 20
                  }}>
                    <Chip 
                      label={avatarResponse.avatar === 'did' ? 'D-ID Real-Time' : 'TalkAvatar'} 
                      color={avatarResponse.avatar === 'did' ? 'success' : 'warning'}
                      size="small"
                      sx={{ 
                        backgroundColor: avatarResponse.avatar === 'did' ? 'rgba(34, 197, 94, 0.9)' : 'rgba(245, 158, 11, 0.9)',
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                  </Box>
                )}
              </>
            )}
          </Box>

          {/* User Video (Picture-in-Picture) */}
          <Box sx={{
            position: 'absolute',
            top: 20,
            right: 20,
            width: 200,
            height: 150,
            borderRadius: 2,
            overflow: 'hidden',
            border: '2px solid rgba(255,255,255,0.3)',
            background: 'rgba(0,0,0,0.5)'
          }}>
            <video
              ref={userVideoRef}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
              autoPlay
              muted
              playsInline
            />
            
            {/* User Speaking Indicator */}
            {callState.isUserSpeaking && (
              <Box sx={{
                position: 'absolute',
                bottom: 5,
                left: 5,
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: '#4caf50',
                animation: 'pulse 1.5s ease-in-out infinite'
              }} />
            )}
          </Box>
        </Box>

        {/* Controls */}
        {showControls && (
          <Box sx={{
            p: 2,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 2
          }}>
            {/* Mute/Unmute */}
            <Tooltip title={callState.isMuted ? 'Unmute' : 'Mute'}>
              <IconButton
                onClick={toggleMute}
                sx={{
                  backgroundColor: callState.isMuted ? '#f44336' : 'rgba(255,255,255,0.1)',
                  color: 'white',
                  '&:hover': { backgroundColor: callState.isMuted ? '#d32f2f' : 'rgba(255,255,255,0.2)' }
                }}
              >
                {callState.isMuted ? <MicOff /> : <Mic />}
              </IconButton>
            </Tooltip>

            {/* Video On/Off */}
            <Tooltip title={callState.isVideoOn ? 'Turn off camera' : 'Turn on camera'}>
              <IconButton
                onClick={toggleVideo}
                sx={{
                  backgroundColor: !callState.isVideoOn ? '#f44336' : 'rgba(255,255,255,0.1)',
                  color: 'white',
                  '&:hover': { backgroundColor: !callState.isVideoOn ? '#d32f2f' : 'rgba(255,255,255,0.2)' }
                }}
              >
                {callState.isVideoOn ? <Videocam /> : <VideocamOff />}
              </IconButton>
            </Tooltip>

            {/* Recording */}
            {!isRecording ? (
              <Tooltip title="Start recording">
                <IconButton
                  onClick={startRecording}
                  sx={{
                    backgroundColor: '#f44336',
                    color: 'white',
                    '&:hover': { backgroundColor: '#d32f2f' }
                  }}
                >
                  <FiberManualRecord />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title="Stop recording">
                <IconButton
                  onClick={stopRecording}
                  sx={{
                    backgroundColor: '#f44336',
                    color: 'white',
                    '&:hover': { backgroundColor: '#d32f2f' }
                  }}
                >
                  <StopCircle />
                </IconButton>
              </Tooltip>
            )}

            {/* Recording Duration */}
            {isRecording && (
              <Chip
                icon={<FiberManualRecord />}
                label={`REC ${formatTime(recordingDuration)}`}
                color="error"
                size="small"
                sx={{ 
                  backgroundColor: '#f44336',
                  color: 'white',
                  fontWeight: 'bold',
                  animation: 'recordingPulse 2s ease-in-out infinite',
                  '@keyframes recordingPulse': {
                    '0%': { opacity: 1 },
                    '50%': { opacity: 0.7 },
                    '100%': { opacity: 1 }
                  }
                }}
              />
            )}

            {/* Settings */}
            <Tooltip title="Settings">
              <IconButton
                onClick={() => setShowSettings(!showSettings)}
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' }
                }}
              >
                <Settings />
              </IconButton>
            </Tooltip>

            {/* Fullscreen */}
            <Tooltip title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
              <IconButton
                onClick={() => setIsFullscreen(!isFullscreen)}
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' }
                }}
              >
                {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
              </IconButton>
            </Tooltip>
          </Box>
        )}

        {/* Current Question Display */}
        {currentQuestion && interviewPhase === 'response' && (
          <Box sx={{
            position: 'absolute',
            bottom: 100,
            left: 20,
            right: 20,
            background: 'rgba(0,0,0,0.8)',
            padding: 2,
            borderRadius: 2,
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <Typography variant="h6" sx={{ mb: 1, color: 'white' }}>
              Question {currentQuestionIndex + 1}
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)' }}>
              {currentQuestion.text}
            </Typography>
          </Box>
        )}

        {/* Error Display */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              position: 'absolute',
              top: 20,
              left: 20,
              right: 20,
              zIndex: 1000
            }}
          >
            {error}
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LiveVideoInterviewInterface;

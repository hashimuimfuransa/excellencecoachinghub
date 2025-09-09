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
  ListItemText,
  Avatar
} from '@mui/material';
import { SafeSlideUp } from '../utils/transitionFix';
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
  const [currentAvatarText, setCurrentAvatarText] = useState("Welcome to your quick interview test! This is a 3-minute assessment to help you practice your interview skills. I'll ask you a few questions to evaluate your responses. Are you ready to begin?");
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState(0);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [awaitingNextQuestion, setAwaitingNextQuestion] = useState(false);
  const [useRealTimeTranscription, setUseRealTimeTranscription] = useState(true);
  const [showingCompletionMessage, setShowingCompletionMessage] = useState(false);
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
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(console.error);
    }
    
    // Stop real-time transcription
    stopRealTimeTranscription();
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
        // Welcome message is already set in initial state
        console.log('🎬 Welcome message ready for streaming avatar');
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
        
        // Set the avatar text to speak the question
        setCurrentAvatarText(question.text);
        console.log('🎬 Updated avatar text for question:', question.text);
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
        console.log('🎙️ Test recording completed:', blob.size, 'bytes');
        
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
    try {
      console.log('🎙️ Processing quick test audio recording...', {
        size: audioBlob.size,
        type: audioBlob.type,
        questionIndex: currentQuestionIndex
      });

      // Calculate recording duration
      const recordingDuration = (Date.now() - recordingStartTime) / 1000;

      // Use real-time transcript if available, otherwise fall back to API
      let finalTranscript = currentTranscript.trim();
      let confidence = 0.9; // Higher confidence for real-time transcription

      if (!finalTranscript || finalTranscript.length < 5) {
        console.log('🔄 Real-time transcript insufficient, trying backend API...');
        
        try {
          const transcriptionResult: SpeechToTextResult = await speechToTextService.transcribeAudio(audioBlob, {
            language: 'en-US',
            enableWordTimestamps: true,
            enhancedModel: true
          });
          
          finalTranscript = transcriptionResult.transcript;
          confidence = transcriptionResult.confidence || 0.8;
          
          console.log('✅ Backend transcription completed:', transcriptionResult);
        } catch (error) {
          console.error('Backend transcription failed:', error);
          finalTranscript = '[Audio response recorded - transcription unavailable]';
          confidence = 0.5;
        }
      } else {
        console.log('✅ Using real-time transcript:', { transcript: finalTranscript, length: finalTranscript.length });
      }

      // Update state with final transcript
      setCurrentTranscript(finalTranscript);
      setIsProcessingAudio(false);
      setAwaitingNextQuestion(true);

      // Submit response to the quick interview service
      if (currentQuestion) {
        const response = {
          questionId: currentQuestion.id,
          answer: finalTranscript,
          audioBlob,
          duration: recordingDuration,
          confidence,
          timestamp: new Date()
        };

        console.log('📤 Submitting quick test response:', {
          question: currentQuestion.text.substring(0, 50),
          answerLength: response.answer.length,
          confidence: response.confidence
        });

        // Submit and automatically move to next question or show completion
        setTimeout(async () => {
          try {
            await quickInterviewService.submitQuickResponse(session!.id, response);
            
            // Check if this is the last question (index 2 for 3 questions: 0, 1, 2)
            const isLastQuestion = currentQuestionIndex >= 2;
            
            if (isLastQuestion) {
              // Show completion processing message
              setCurrentAvatarText("Thank you for that final response. I'm now analyzing all your answers and preparing your comprehensive interview results...");
              setShowingCompletionMessage(true);
              setAwaitingNextQuestion(false);
            } else {
              // Show processing message for next question
              setCurrentAvatarText("Thank you for that response. I'm analyzing your answer and preparing the next question...");
            }
            
            // The next action will be triggered by the onVideoEnd callback
          } catch (error) {
            console.error('Failed to submit quick test response:', error);
            setError('Failed to submit your response. Please try again.');
            setIsProcessingAudio(false);
            setAwaitingNextQuestion(false);
          }
        }, 1000);
      }

    } catch (error) {
      console.error('❌ Quick test audio processing failed:', error);
      
      // Fallback: handle without transcription
      setIsProcessingAudio(false);
      setAwaitingNextQuestion(false);
      setError('Audio processing failed. Please try recording again or use text input.');
    }
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
        // Show completion message with avatar before closing
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
    console.log('🎯 Showing interview completion message');
    setShowingCompletionMessage(true);
    setAwaitingNextQuestion(false);
    setCurrentTranscript('');
    
    // Avatar completion message
    const completionMessage = "Congratulations! You have successfully completed your interview assessment. I have analyzed all your responses and will now prepare your detailed results and feedback. Your interview performance report will be available shortly. Thank you for participating in this interview!";
    
    setCurrentAvatarText(completionMessage);
    
    console.log('🎬 Avatar will announce interview completion');
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
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth TransitionComponent={SafeSlideUp}>
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
      TransitionComponent={SafeSlideUp}
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
                  {/* Streaming Avatar Video */}
                  <Box
                    sx={{
                      width: '100%',
                      height: '100%',
                      borderRadius: isMobile ? 0 : theme.spacing(2),
                      overflow: 'hidden'
                    }}
                  >
                    <StreamingAvatarVideo
                      text={currentAvatarText}
                      avatar="european_woman"
                      emotion="happy"
                      language="en"
                      autoPlay={true}
                      onVideoStart={() => {
                        console.log('🎬 Quick test avatar started');
                        setIsPlaying(true);
                        setShowWelcome(false);
                        setAvatarLoading(false);
                        if (!hasStarted) {
                          setHasStarted(true);
                        }
                      }}
                      onVideoEnd={() => {
                        console.log('🎬 Quick test avatar ended');
                        setIsPlaying(false);
                        
                        // If showing completion message, complete the test
                        if (showingCompletionMessage) {
                          console.log('🎬 Avatar finished completion message, completing test');
                          setTimeout(() => {
                            handleCompleteTest();
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
                        console.error('Quick test avatar error:', error);
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
                              disabled={isProcessingAudio || awaitingNextQuestion}
                              sx={{
                                background: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)',
                                flex: 1
                              }}
                            >
                              {isProcessingAudio ? 'Processing...' : 'Record Answer'}
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
                            disabled={isLoading || isProcessingAudio || awaitingNextQuestion}
                            size="large"
                          >
                            {currentQuestionIndex === 2 ? 'Finish' : 'Next'}
                          </Button>
                        </Stack>
                      </CardContent>
                    </Card>

                    {/* Audio Processing Status */}
                    {(isProcessingAudio || awaitingNextQuestion || showingCompletionMessage) && (
                      <Card elevation={3} sx={{ mb: 3, border: showingCompletionMessage ? '2px solid #ff9800' : 'none' }}>
                        <CardContent>
                          <Stack direction="row" alignItems="center" spacing={2}>
                            <CircularProgress size={24} color={showingCompletionMessage ? "warning" : "primary"} />
                            <Typography variant="body2">
                              {showingCompletionMessage 
                                ? '🎯 Finalizing your interview results and preparing detailed feedback...'
                                : isProcessingAudio 
                                  ? '🎙️ Processing your audio response...' 
                                  : '🤖 AI is analyzing your response and preparing next question...'}
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
            
            {/* Audio Processing Status - Mobile */}
            {(isProcessingAudio || awaitingNextQuestion || showingCompletionMessage) && (
              <Box sx={{ 
                mt: 2, 
                mb: 2, 
                p: 2, 
                borderRadius: 2, 
                bgcolor: showingCompletionMessage ? 'rgba(255, 152, 0, 0.1)' : 'rgba(33, 150, 243, 0.1)',
                border: showingCompletionMessage ? '1px solid #ff9800' : 'none'
              }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <CircularProgress size={20} color={showingCompletionMessage ? "warning" : "primary"} />
                  <Typography variant="body2" fontSize="0.8rem">
                    {showingCompletionMessage 
                      ? '🎯 Preparing results...'
                      : isProcessingAudio 
                        ? '🎙️ Processing audio...' 
                        : '🤖 Preparing next question...'}
                  </Typography>
                </Stack>
              </Box>
            )}

            {/* Current Transcript - Mobile */}
            {currentTranscript && (
              <Box sx={{ mt: 2, mb: 2, p: 2, borderRadius: 2, bgcolor: 'rgba(76, 175, 80, 0.1)', border: '1px solid #4caf50' }}>
                <Typography variant="caption" color="success.main" sx={{ mb: 1, display: 'block', fontWeight: 'bold' }}>
                  Your Response:
                </Typography>
                <Typography variant="body2" sx={{ fontStyle: 'italic', fontSize: '0.8rem' }}>
                  "{currentTranscript.length > 100 ? currentTranscript.substring(0, 100) + '...' : currentTranscript}"
                </Typography>
              </Box>
            )}
            
            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              {!isRecording ? (
                <Button
                  variant="contained"
                  startIcon={<Mic />}
                  onClick={startRecording}
                  size="small"
                  disabled={isProcessingAudio || awaitingNextQuestion}
                  sx={{
                    background: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)',
                    flex: 1
                  }}
                >
                  {isProcessingAudio ? 'Processing...' : 'Record'}
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
                disabled={isLoading || isProcessingAudio || awaitingNextQuestion}
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
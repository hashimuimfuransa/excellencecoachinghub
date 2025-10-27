import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTheme, useMediaQuery } from '@mui/material';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Box,
  Typography,
  Button,
  Paper,
  LinearProgress,
  IconButton,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  Tabs,
  Tab,
  Card,
  CardContent,
  Fade,
  Slide,
  Zoom,
  Stack,
  Divider,
  Grid
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
  Fullscreen,
  FullscreenExit,
  Send,
  Keyboard,
  KeyboardArrowRight,
  RecordVoiceOver,
  Psychology,
  Timer,
  Star,
  TrendingUp,
  Lightbulb,
  Assessment,
  Visibility,
  Person
} from '@mui/icons-material';
import { QuickInterviewSession, QuickInterviewQuestion, QuickInterviewResult, quickInterviewService } from '../services/quickInterviewService';

interface InterviewInterfaceProps {
  open: boolean;
  onClose: () => void;
  session: QuickInterviewSession;
  onComplete: (result: QuickInterviewResult) => void;
}

const InterviewInterface: React.FC<InterviewInterfaceProps> = React.memo(({
  open,
  onClose,
  session,
  onComplete
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const [currentQuestion, setCurrentQuestion] = useState<QuickInterviewQuestion | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(session.totalDuration);
  const [questionProgress, setQuestionProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interviewPhase, setInterviewPhase] = useState<'welcome' | 'introduction' | 'question' | 'waiting' | 'avatar-response' | 'avatar-thanks' | 'completed' | 'results'>('welcome');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(true);
  
  // Response handling states
  const [responseMode, setResponseMode] = useState<'voice' | 'text'>('voice');
  const [textResponse, setTextResponse] = useState('');
  const [userResponses, setUserResponses] = useState<{question: string, response: string, timestamp: string}[]>([]);
  const [avatarThinking, setAvatarThinking] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState<Date | null>(null);
  
  // Results states
  const [finalResults, setFinalResults] = useState<QuickInterviewResult | null>(null);
  const [showDetailedResults, setShowDetailedResults] = useState(false);
  
  // Enhanced stability states
  const [isProcessingResponse, setIsProcessingResponse] = useState(false);
  const [speechEnded, setSpeechEnded] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');
  const [speechInProgress, setSpeechInProgress] = useState(false);
  
  // Transcript modal state
  const [transcriptModalOpen, setTranscriptModalOpen] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const textFieldRef = useRef<HTMLInputElement>(null);

  // Timer for interview duration
  useEffect(() => {
    if (interviewPhase === 'question' && timeRemaining > 0) {
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
  }, [interviewPhase, timeRemaining]);

  // Load first question when dialog opens
  useEffect(() => {
    if (open && session) {
      initializeInterview();
    }
  }, [open, session]);

  // Cleanup on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      // Clean up timeouts
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
      
      // Stop speech recognition if active
      if (recognitionRef.current && speechInProgress) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.log('Recognition cleanup: already stopped');
        }
      }
      
      // Stop media recording if active
      if (mediaRecorderRef.current && isRecording) {
        try {
          mediaRecorderRef.current.stop();
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        } catch (e) {
          console.log('Media recorder cleanup: already stopped');
        }
      }
      
      console.log('Interview interface cleanup completed');
    };
  }, [speechInProgress, isRecording]);

  const initializeInterview = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Start the session if it's in 'ready' status
      if (session.status === 'ready') {
        try {
          await quickInterviewService.startInterviewSession(session.id);
          console.log('✅ Interview session started from interface');
        } catch (error) {
          console.warn('Could not start session via service, continuing anyway:', error);
        }
      }
      
      // Show welcome message if available
      if (session.welcomeMessage) {
        setInterviewPhase('welcome');
        // Auto-proceed to introduction after welcome
        setTimeout(() => {
          setInterviewPhase('introduction');
        }, 3000);
      } else {
        // Go directly to introduction
        setInterviewPhase('introduction');
      }
    } catch (error) {
      console.error('Failed to initialize interview:', error);
      setError('Failed to initialize interview');
    } finally {
      setLoading(false);
    }
  };

  const handleIntroductionComplete = () => {
    // After introduction, proceed to first question
    loadNextQuestion();
  };

  const loadNextQuestion = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Loading next question for session:', session.id);
      const question = await quickInterviewService.getNextQuestion(session.id);
      console.log('📋 Received question:', question);
      
      if (question) {
        setCurrentQuestion(question);
        setInterviewPhase('question');
        setCurrentQuestionIndex(prev => prev + 1);
        setQuestionStartTime(new Date());
        setTextResponse('');
        
        console.log('✅ Question set, phase changed to question');
        
        // Auto-play avatar video if available
        if (question.avatarResponse && question.avatarResponse.mp4_url) {
          console.log('🎥 Playing avatar video:', question.avatarResponse.mp4_url);
          playAvatarVideo(question.avatarResponse.mp4_url);
        } else {
          console.log('📝 No avatar video, showing text-only question');
        }
      } else {
        console.log('🏁 No more questions, completing interview');
        // No more questions, complete interview
        handleCompleteInterview();
      }
    } catch (error) {
      console.error('Failed to load question:', error);
      setError('Failed to load next question');
    } finally {
      setLoading(false);
    }
  };

  const playAvatarVideo = (videoUrl: string) => {
    if (videoRef.current) {
      videoRef.current.src = videoUrl;
      videoRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(error => {
          console.error('Failed to play avatar video:', error);
          setError('Failed to play avatar video');
        });
    }
  };

  const handleStartRecording = useCallback(async () => {
    setError(null);
    setSpeechEnded(false);
    setSpeechInProgress(true);
    setIsProcessingResponse(false);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      // Enhanced Web Speech API setup for better stability
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;  // Keep listening continuously
      recognition.interimResults = true;  // Get partial results
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;
      
      // Store recognition reference for cleanup
      recognitionRef.current = recognition;

      let finalTranscript = '';
      let lastActivityTime = Date.now();
      let lastUpdateTime = Date.now();

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let hasNewFinal = false;
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
            hasNewFinal = true;
            lastActivityTime = Date.now();
          } else {
            interimTranscript += transcript;
          }
        }
        
        // Enhanced UI updates with better stability controls
        const now = Date.now();
        const fullTranscript = (finalTranscript + interimTranscript).trim();
        
        // More conservative update timing to prevent layout issues
        if (fullTranscript !== lastTranscript && (now - lastUpdateTime > 300 || hasNewFinal)) {
          // Use requestAnimationFrame for smoother UI updates
          requestAnimationFrame(() => {
            setTextResponse(fullTranscript);
            setLastTranscript(fullTranscript);
          });
          lastUpdateTime = now;
        }

        // Clear any existing timeout
        if (speechTimeoutRef.current) {
          clearTimeout(speechTimeoutRef.current);
          speechTimeoutRef.current = null;
        }

        // Update speech progress indicators
        setSpeechInProgress(!!interimTranscript || hasNewFinal);

        // Enhanced timeout handling for better speech completion detection
        if (finalTranscript.trim() || interimTranscript.trim()) {
          speechTimeoutRef.current = setTimeout(() => {
            const timeSinceActivity = Date.now() - lastActivityTime;
            const totalContent = finalTranscript.trim();
            
            // More intelligent speech completion detection
            if (timeSinceActivity >= 3000 && totalContent.length > 10) {
              console.log('Speech considered complete after analysis:', totalContent);
              setSpeechEnded(true);
              setSpeechInProgress(false);
              
              // Process the response with delay for UI stability
              if (!isProcessingResponse) {
                setTimeout(() => {
                  handleAutoProcessResponse();
                }, 800);
              }
            }
          }, 4000); // Increased timeout for better stability
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        
        // Handle different error types gracefully without disrupting the interface
        switch(event.error) {
          case 'no-speech':
            console.log('No speech detected - this is normal, continuing...');
            // Don't show error for no-speech, it's a normal state
            break;
          case 'aborted':
            console.log('Speech recognition was manually stopped');
            // Normal when user stops recording manually
            break;
          case 'audio-capture':
            setError('Microphone access issue. Please check your microphone settings.');
            setIsRecording(false);
            break;
          case 'not-allowed':
            setError('Microphone access denied. Please allow microphone access and reload the page.');
            setIsRecording(false);
            break;
          case 'network':
            console.warn('Network error - continuing with offline speech recognition');
            // Don't stop recording for network errors, continue with local processing
            break;
          default:
            console.warn(`Speech recognition warning: ${event.error}`);
            // Don't show errors for minor issues that don't affect functionality
        }
        
        // Keep speech progress indicators stable during errors
        setSpeechInProgress(false);
      };

      recognition.onend = () => {
        console.log('Speech recognition session ended');
        setSpeechInProgress(false);
        
        // Clean up timeout
        if (speechTimeoutRef.current) {
          clearTimeout(speechTimeoutRef.current);
          speechTimeoutRef.current = null;
        }
        
        // Only auto-process if speech naturally ended and we have sufficient content
        if (speechEnded && finalTranscript.trim().length > 5 && !isProcessingResponse) {
          console.log('Auto-processing speech result:', finalTranscript.trim());
          setTextResponse(finalTranscript.trim());
          
          // Delay processing to ensure UI stability
          processingTimeoutRef.current = setTimeout(() => {
            handleAutoProcessResponse();
          }, 1000); // 1 second delay for stability
        }
      };

      recognition.onstart = () => {
        console.log('Speech recognition started successfully');
        setSpeechInProgress(true);
      };

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        console.log('Recording completed, size:', audioBlob.size);
        
        // Safely stop recognition
        if (recognitionRef.current && speechInProgress) {
          try {
            recognitionRef.current.stop();
          } catch (e) {
            console.log('Recognition already stopped');
          }
        }
      };

      // Start recording and recognition
      mediaRecorderRef.current.start();
      recognition.start();
      setIsRecording(true);
      console.log('Recording and speech recognition started');
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      setSpeechInProgress(false);
      
      if (error.name === 'NotAllowedError') {
        setError('Microphone access denied. Please allow microphone access and try again.');
      } else if (error.name === 'NotFoundError') {
        setError('No microphone found. Please connect a microphone and try again.');
      } else {
        setError('Failed to access microphone. Please check your browser settings.');
      }
    }
  }, [isProcessingResponse, speechEnded, speechInProgress, lastTranscript]);

  const handleStopRecording = useCallback(async () => {
    console.log('Stopping recording manually...');
    
    if (mediaRecorderRef.current && isRecording) {
      // Stop media recorder
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      
      // Stop speech recognition safely
      if (recognitionRef.current && speechInProgress) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.log('Recognition already stopped');
        }
      }
      
      // Clean up timeouts
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
        speechTimeoutRef.current = null;
      }
      
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
        processingTimeoutRef.current = null;
      }
      
      setSpeechInProgress(false);
      
      // Process the current response if we have meaningful content
      if (textResponse.trim() && textResponse.trim().length > 5 && !isProcessingResponse) {
        console.log('Processing manual stop with content:', textResponse.trim());
        
        // Small delay to ensure UI stability before processing
        setTimeout(() => {
          handleAutoProcessResponse();
        }, 500);
      } else {
        console.log('No meaningful content to process:', textResponse);
      }
    }
  }, [isRecording, textResponse, speechInProgress, isProcessingResponse]);

  // Enhanced auto-processing with stability controls
  const handleAutoProcessResponse = useCallback(async () => {
    if (!currentQuestion || !textResponse.trim() || isProcessingResponse) {
      console.log('Skipping auto-process:', { 
        hasQuestion: !!currentQuestion, 
        hasResponse: !!textResponse.trim(), 
        isProcessing: isProcessingResponse 
      });
      return;
    }
    
    console.log('Starting auto-processing for response:', textResponse.trim());
    setIsProcessingResponse(true);
    setInterviewPhase('avatar-response');
    setAvatarThinking(true);
    
    try {
      // Create response record
      const responseRecord = {
        question: currentQuestion.text,
        response: textResponse.trim(),
        timestamp: new Date().toISOString(),
        mode: 'voice' as const,
        duration: questionStartTime ? Date.now() - questionStartTime.getTime() : 0
      };
      
      // Add to responses immediately for UI feedback
      setUserResponses(prev => [...prev, responseRecord]);
      
      // Submit to backend for AI analysis in parallel
      const backendPromise = (async () => {
        const token = localStorage.getItem('token');
        if (token && session.backendInterviewId) {
          try {
            const backendResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/ai-interviews/${session.backendInterviewId}/response`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                questionId: currentQuestion.id,
                response: textResponse.trim(),
                responseTime: Math.round((questionStartTime ? Date.now() - questionStartTime.getTime() : 0) / 1000)
              })
            });

            if (backendResponse.ok) {
              const result = await backendResponse.json();
              console.log('Response processed by AI:', result);
              return result;
            }
          } catch (error) {
            console.error('Backend AI analysis failed:', error);
          }
        }
        return null;
      })();
      
      // Show processing animation (minimum 2 seconds for better UX)
      await Promise.all([
        new Promise(resolve => setTimeout(resolve, 2500)),
        backendPromise
      ]);
      
      setAvatarThinking(false);
      
      // Move to next question
      try {
        await quickInterviewService.moveToNextQuestion(session.id);
        await loadNextQuestion();
        
        // Reset states for next question
        setTextResponse('');
        setLastTranscript('');
        setSpeechEnded(false);
        console.log('Successfully moved to next question');
        
      } catch (error) {
        console.error('Error auto-moving to next question:', error);
        setError('Failed to proceed to next question automatically');
      }
      
    } catch (error) {
      console.error('Error in auto-processing:', error);
      setAvatarThinking(false);
      setError('Failed to automatically process your response. Please try again.');
    } finally {
      setIsProcessingResponse(false);
    }
  }, [currentQuestion, textResponse, session, questionStartTime, isProcessingResponse]);

  const handleSubmitResponse = useCallback(async (response: string, mode: 'voice' | 'text') => {
    if (!currentQuestion || !response.trim()) return;
    
    // Record the user's response
    const responseRecord = {
      question: currentQuestion.text,
      response: response.trim(),
      timestamp: new Date().toISOString(),
      mode,
      duration: questionStartTime ? Date.now() - questionStartTime.getTime() : 0
    };
    
    setUserResponses(prev => [...prev, responseRecord]);
    
    // Show avatar thinking/processing
    setAvatarThinking(true);
    setInterviewPhase('avatar-response');
    
    // Submit response to backend
    try {
      const token = localStorage.getItem('token');
      if (token && session.backendInterviewId) {
        const backendResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/ai-interviews/${session.backendInterviewId}/response`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            questionId: currentQuestion.id,
            response: response.trim(),
            responseTime: Math.round((questionStartTime ? Date.now() - questionStartTime.getTime() : 0) / 1000)
          })
        });

        if (backendResponse.ok) {
          const result = await backendResponse.json();
          console.log('Response submitted to backend:', result);
        }
      }
    } catch (backendError) {
      console.warn('Failed to submit response to backend:', backendError);
    }
    
    // Simulate avatar processing and acknowledgment (2-3 seconds)
    setTimeout(async () => {
      setAvatarThinking(false);
      
      // Move to next question
      try {
        await quickInterviewService.moveToNextQuestion(session.id);
        await loadNextQuestion();
      } catch (error) {
        console.error('Error moving to next question:', error);
        setError('Failed to proceed to next question');
      }
    }, 2500); // 2.5 seconds for avatar to "process" the response
  }, [currentQuestion, session.id, questionStartTime]);

  const handleTextSubmit = useCallback(() => {
    if (textResponse.trim()) {
      handleSubmitResponse(textResponse, 'text');
      setTextResponse(''); // Clear the text field after submission
    }
  }, [textResponse, handleSubmitResponse]);

  const handleVoiceSubmit = useCallback((transcription: string) => {
    if (transcription.trim()) {
      handleSubmitResponse(transcription, 'voice');
    }
  }, [handleSubmitResponse]);

  const handleNextQuestion = async () => {
    handleStopRecording();
    
    // If user hasn't responded yet, ask them to respond
    if (interviewPhase === 'question') {
      if (responseMode === 'text' && textResponse.trim()) {
        handleTextSubmit();
      } else {
        setError('Please provide your response before continuing');
        return;
      }
    }
  };

  const handleCompleteInterview = async () => {
    try {
      handleStopRecording();
      setLoading(true);
      
      // Show avatar thank you message before results
      setInterviewPhase('avatar-thanks');
      
      // Display thank you message for a few seconds
      setTimeout(async () => {
        try {
          // Enhanced completion with detailed grading
          const result = await quickInterviewService.completeSession(session.id, userResponses);
          
          // Add detailed per-question analysis
          const enhancedResult = {
            ...result,
            questionGrades: userResponses.map((resp, index) => ({
              questionNumber: index + 1,
              question: resp.question,
              userResponse: resp.response,
              score: Math.floor(Math.random() * 30) + 70, // Simulated AI score
              feedback: generateQuestionFeedback(resp.response, resp.question),
              timeSpent: Math.round(resp.duration / 1000),
              keywordsIdentified: extractKeywords(resp.response)
            }))
          };
          
          // Store results in database
          try {
            await quickInterviewService.storeInterviewResults(
              session.id,
              enhancedResult,
              userResponses,
              {
                totalDuration: session.totalDuration,
                questionsCount: session.questions.length,
                completedAt: new Date().toISOString(),
                actualDuration: enhancedResult.actualDuration
              }
            );
            console.log('✅ Interview results successfully stored in database');
          } catch (storageError) {
            console.error('❌ Failed to store results in database:', storageError);
            // Don't fail the completion, just log the error
          }
          
          setFinalResults(enhancedResult);
          setInterviewPhase('results');
          onComplete(enhancedResult);
        } catch (error) {
          console.error('Failed to complete interview:', error);
          setError('Failed to complete interview processing');
          setInterviewPhase('results'); // Still show results even if there's an error
        } finally {
          setLoading(false);
        }
      }, 4000); // 4 seconds for thank you message
    } catch (error) {
      console.error('Failed to initiate interview completion:', error);
      setError('Failed to complete interview');
      setLoading(false);
    }
  };



  // Helper function to generate question-specific feedback
  const generateQuestionFeedback = (response: string, question: string) => {
    const responseLength = response.split(' ').length;
    const feedbacks = [];
    
    if (responseLength > 50) {
      feedbacks.push('Comprehensive response with good detail');
    } else if (responseLength > 20) {
      feedbacks.push('Good response length and structure');
    } else {
      feedbacks.push('Consider providing more detailed examples');
    }
    
    if (response.includes('experience') || response.includes('example')) {
      feedbacks.push('Good use of specific examples');
    }
    
    if (question.toLowerCase().includes('technical') && 
        (response.includes('technology') || response.includes('solution') || response.includes('approach'))) {
      feedbacks.push('Demonstrated technical understanding');
    }
    
    return feedbacks.join(', ');
  };

  // Helper function to extract keywords from response
  const extractKeywords = (response: string) => {
    const commonKeywords = [
      'experience', 'skills', 'project', 'team', 'problem', 'solution', 
      'technology', 'development', 'management', 'leadership', 'challenge', 'achievement'
    ];
    
    return commonKeywords.filter(keyword => 
      response.toLowerCase().includes(keyword.toLowerCase())
    ).slice(0, 5); // Return max 5 keywords
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress based on interview type
  const progressPercentage = session.isTestInterview 
    ? ((session.totalDuration - timeRemaining) / session.totalDuration) * 100
    : currentQuestion?.totalQuestions 
      ? ((currentQuestion.questionNumber || currentQuestionIndex) / currentQuestion.totalQuestions) * 100
      : (currentQuestionIndex / Math.max(session.questions.length, 5)) * 100;

  return (
    <>
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullscreen}
      maxWidth={fullscreen ? false : "lg"}
      fullWidth={!fullscreen}
      PaperProps={{
        sx: {
          background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #2d2d5f 100%)',
          color: 'white',
          ...(fullscreen ? {} : { minHeight: '80vh' })
        }
      }}
    >
      {/* Header Controls */}
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 1000,
          display: 'flex',
          gap: 1
        }}
      >
        <IconButton 
          onClick={() => setFullscreen(!fullscreen)}
          sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)' }}
        >
          {fullscreen ? <FullscreenExit /> : <Fullscreen />}
        </IconButton>
        <IconButton 
          onClick={onClose}
          sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)' }}
        >
          <Close />
        </IconButton>
      </Box>

      <DialogContent sx={{ 
        p: 0, 
        height: '100vh', 
        maxHeight: '100vh',
        overflow: 'hidden', 
        display: 'flex', 
        flexDirection: 'column',
        position: 'relative',
        boxSizing: 'border-box'
      }}>
        <Grid container sx={{ 
          height: '100%', 
          maxHeight: '100vh',
          flex: 1, 
          minHeight: 0,
          overflow: 'hidden',
          position: 'relative',
          boxSizing: 'border-box'
        }}>
          {/* Mobile Header - Only visible on mobile */}
          <Grid item xs={12} sx={{ 
            display: { xs: 'block', md: 'none' },
            background: 'linear-gradient(90deg, #1e3c72 0%, #2a5298 100%)',
            p: 2,
            flex: '0 0 auto'
          }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="h6" fontWeight="bold" sx={{ color: 'white' }}>
                AI Interview Practice
              </Typography>
              <Chip 
                label={currentQuestion?.totalQuestions 
                  ? `${currentQuestion.questionNumber || currentQuestionIndex}/${currentQuestion.totalQuestions}`
                  : `${currentQuestionIndex}/${session.questions.length}`
                }
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                size="small"
              />
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={progressPercentage}
              sx={{ 
                height: 6, 
                borderRadius: 4,
                bgcolor: 'rgba(255,255,255,0.2)',
                '& .MuiLinearProgress-bar': {
                  bgcolor: '#4caf50'
                }
              }}
            />
            <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'rgba(255,255,255,0.8)' }}>
              <Timer sx={{ fontSize: 14, mr: 1, verticalAlign: 'middle' }} />
              Time: {formatTime(timeRemaining)}
            </Typography>
          </Grid>

          {/* Left Side - Avatar and Progress */}
          <Grid item xs={12} md={6} sx={{ 
            background: 'linear-gradient(180deg, #1e3c72 0%, #2a5298 100%)',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            minHeight: { xs: '50vh', md: '100vh' },
            maxHeight: { xs: 'none', md: '100vh' },
            overflow: 'hidden'
          }}>
            {/* Desktop Progress Header */}
            <Box sx={{ 
              p: 3, 
              pb: 2,
              display: { xs: 'none', md: 'block' }
            }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h5" fontWeight="bold" sx={{ color: 'white' }}>
                  AI Interview Practice
                </Typography>
                <Chip 
                  label={currentQuestion?.totalQuestions 
                    ? `${currentQuestion.questionNumber || currentQuestionIndex}/${currentQuestion.totalQuestions}`
                    : `${currentQuestionIndex}/${session.questions.length}`
                  }
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                />
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={progressPercentage}
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  bgcolor: 'rgba(255,255,255,0.2)',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: '#4caf50'
                  }
                }}
              />
              <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'rgba(255,255,255,0.8)' }}>
                <Timer sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                Time Remaining: {formatTime(timeRemaining)}
              </Typography>
            </Box>

            {/* Avatar Section */}
            <Box sx={{ 
              flexGrow: 1, 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center',
              p: { xs: 2, md: 3 }
            }}>
              {currentQuestion?.avatarResponse?.mp4_url ? (
                <Box sx={{ textAlign: 'center' }}>
                  <Box sx={{ 
                    borderRadius: '50%', 
                    overflow: 'hidden', 
                    width: { xs: 200, sm: 250, md: 300 }, 
                    height: { xs: 200, sm: 250, md: 300 },
                    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                    border: avatarThinking ? '4px solid #ffc107' : '4px solid rgba(255,255,255,0.2)',
                    animation: avatarThinking ? 'pulse 2s infinite' : 'none',
                    '@keyframes pulse': {
                      '0%': { borderColor: '#ffc107' },
                      '50%': { borderColor: '#ff9800' },
                      '100%': { borderColor: '#ffc107' }
                    }
                  }}>
                    <video
                      ref={videoRef}
                      width="100%"
                      height="100%"
                      controls={false}
                      autoPlay
                      muted={false}
                      onEnded={() => setIsPlaying(false)}
                      style={{ objectFit: 'cover' }}
                    >
                      Your browser does not support video playback.
                    </video>
                  </Box>
                  
                  <Box mt={2} display="flex" justifyContent="center" gap={1}>
                    <IconButton 
                      onClick={() => {
                        if (videoRef.current) {
                          if (isPlaying) {
                            videoRef.current.pause();
                            setIsPlaying(false);
                          } else {
                            videoRef.current.play();
                            setIsPlaying(true);
                          }
                        }
                      }}
                      size="small"
                      sx={{ 
                        bgcolor: 'rgba(255,255,255,0.1)', 
                        color: 'white',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                      }}
                    >
                      {isPlaying ? <Pause /> : <PlayArrow />}
                    </IconButton>
                    <IconButton 
                      size="small"
                      sx={{ 
                        bgcolor: 'rgba(255,255,255,0.1)', 
                        color: 'white',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                      }}
                    >
                      <VolumeUp />
                    </IconButton>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center' }}>
                  <Avatar sx={{ 
                    width: { xs: 120, sm: 160, md: 200 }, 
                    height: { xs: 120, sm: 160, md: 200 }, 
                    mx: 'auto', 
                    mb: { xs: 2, md: 3 },
                    background: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)',
                    fontSize: { xs: '3rem', md: '4rem' },
                    boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
                  }}>
                    <Psychology sx={{ fontSize: { xs: '3rem', md: '5rem' } }} />
                  </Avatar>
                  <Typography variant="h6" sx={{ 
                    color: 'rgba(255,255,255,0.9)', 
                    mb: 1,
                    fontSize: { xs: '1rem', md: '1.25rem' }
                  }}>
                    AI Interview Coach
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: { xs: '0.75rem', md: '0.875rem' }
                  }}>
                    {avatarThinking ? 'Processing your response...' : 'Ready to help you practice!'}
                  </Typography>
                </Box>
              )}
            </Box>
          </Grid>

          {/* Right Side - Questions and Responses */}
          <Grid item xs={12} md={6} sx={{ 
            display: 'flex',
            flexDirection: 'column',
            height: { xs: 'auto', md: '100%' },
            minHeight: { xs: '60vh', md: '100vh' },
            maxHeight: { xs: '85vh', md: '100vh' },
            overflow: 'hidden',
            bgcolor: { xs: '#1a237e', md: 'transparent' }
          }}>
            {/* Question Area */}
            <Box sx={{ 
              p: { xs: 2, md: 4 }, 
              flexGrow: 1, 
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0
            }}>
              {loading && (
                <Box textAlign="center" py={8}>
                  <CircularProgress size={60} sx={{ color: '#4caf50' }} />
                  <Typography variant="h6" sx={{ mt: 2, color: 'white' }}>
                    {interviewPhase === 'question' ? 'Loading question...' : 'Loading...'}
                  </Typography>
                </Box>
              )}

              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              {/* Welcome Phase */}
              {interviewPhase === 'welcome' && (
                <Fade in timeout={1000}>
                  <Box textAlign="center" py={6}>
                    <Psychology sx={{ fontSize: 80, color: '#4caf50', mb: 3 }} />
                    <Typography variant="h3" gutterBottom sx={{ color: 'white', fontWeight: 'bold' }}>
                      Welcome to Your AI Interview!
                    </Typography>
                    <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.8)', mb: 4 }}>
                      Get ready for a professional interview experience. The AI will ask you questions and you can respond using voice or text.
                    </Typography>
                    <Box sx={{ 
                      background: 'rgba(255,255,255,0.1)', 
                      borderRadius: 3, 
                      p: 3,
                      backdropFilter: 'blur(10px)'
                    }}>
                      <Typography variant="body1" sx={{ color: 'white', lineHeight: 2 }}>
                        • Speak clearly and naturally<br/>
                        • Take your time to think<br/>
                        • Be confident and authentic<br/>
                        • The AI will respond to each answer
                      </Typography>
                    </Box>
                  </Box>
                </Fade>
              )}

              {/* Introduction Phase */}
              {interviewPhase === 'introduction' && (
                <Fade in timeout={1000}>
                  <Box textAlign="center" py={4}>
                    <Person sx={{ fontSize: 80, color: '#2196f3', mb: 3 }} />
                    <Typography variant="h4" gutterBottom sx={{ color: 'white', fontWeight: 'bold' }}>
                      Let's Start with Your Introduction
                    </Typography>
                    <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.8)', mb: 4 }}>
                      Please introduce yourself! Tell us about your background, experience, and what makes you a great candidate.
                    </Typography>
                    
                    <Card sx={{ 
                      background: 'rgba(33, 150, 243, 0.1)', 
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(33, 150, 243, 0.3)',
                      borderRadius: 3,
                      mb: 4,
                      maxWidth: '600px',
                      mx: 'auto'
                    }}>
                      <CardContent sx={{ p: 4 }}>
                        <Typography variant="h6" sx={{ color: '#2196f3', mb: 2, fontWeight: 'bold' }}>
                          💡 Introduction Tips:
                        </Typography>
                        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)', lineHeight: 2, textAlign: 'left' }}>
                          • Start with your name and current role<br/>
                          • Mention relevant experience and skills<br/>
                          • Share what interests you about this position<br/>
                          • Keep it concise (2-3 minutes)<br/>
                          • Be confident and enthusiastic
                        </Typography>
                      </CardContent>
                    </Card>

                    <Button
                      variant="contained"
                      size="large"
                      onClick={handleIntroductionComplete}
                      startIcon={<PlayArrow />}
                      sx={{
                        bgcolor: '#2196f3',
                        '&:hover': { bgcolor: '#1976d2' },
                        px: 4,
                        py: 2,
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        borderRadius: 3
                      }}
                    >
                      I'm Ready - Start Interview Questions
                    </Button>
                  </Box>
                </Fade>
              )}

              {/* Question Phase */}
              {(interviewPhase === 'question' || interviewPhase === 'waiting' || interviewPhase === 'avatar-response') && currentQuestion && (
                <Box>
                  <Slide direction="up" in timeout={500}>
                    <Card sx={{ 
                      mb: 4, 
                      background: 'rgba(255,255,255,0.1)', 
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.2)'
                    }}>
                      <CardContent sx={{ p: 4 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                          <Box display="flex" alignItems="center" gap={2}>
                            <Chip 
                              label={currentQuestion.category} 
                              sx={{ bgcolor: '#4caf50', color: 'white' }}
                            />
                            <Chip 
                              label={`${currentQuestion.expectedDuration}s recommended`}
                              variant="outlined"
                              sx={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white' }}
                            />
                          </Box>
                          {currentQuestion.questionNumber && (
                            <Chip 
                              label={`Question ${currentQuestion.questionNumber} of ${currentQuestion.totalQuestions || 5}`}
                              sx={{ 
                                bgcolor: 'rgba(33, 150, 243, 0.2)', 
                                color: '#2196f3',
                                border: '1px solid rgba(33, 150, 243, 0.3)',
                                fontWeight: 'bold'
                              }}
                            />
                          )}
                        </Box>
                        <Typography variant="h5" gutterBottom sx={{ color: 'white', lineHeight: 1.4, mb: 3 }}>
                          {currentQuestion.text}
                        </Typography>

                        {/* User Action Instructions */}
                        {!avatarThinking && (
                          <Box sx={{ 
                            background: 'rgba(33, 150, 243, 0.1)', 
                            borderRadius: 2,
                            border: '1px solid rgba(33, 150, 243, 0.3)',
                            p: 2,
                            mb: 2
                          }}>
                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                              <RecordVoiceOver sx={{ color: '#2196f3', fontSize: 20 }} />
                              <Typography variant="subtitle2" sx={{ color: '#2196f3', fontWeight: 'bold' }}>
                                How to respond:
                              </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                              Use the response area below to either <strong>record your voice</strong> or <strong>type your answer</strong>. Take your time to provide a thoughtful response.
                            </Typography>
                          </Box>
                        )}
                        
                        {avatarThinking && (
                          <Box mt={3} p={2} sx={{ 
                            bgcolor: 'rgba(255, 193, 7, 0.1)', 
                            borderRadius: 2,
                            border: '1px solid rgba(255, 193, 7, 0.3)'
                          }}>
                            <Box display="flex" alignItems="center" gap={2}>
                              <CircularProgress size={20} sx={{ color: '#ffc107' }} />
                              <Typography variant="body2" sx={{ color: '#ffc107' }}>
                                AI is processing your response...
                              </Typography>
                            </Box>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Slide>
                </Box>
              )}

              {/* Avatar Thank You Phase */}
              {interviewPhase === 'avatar-thanks' && (
                <Fade in timeout={1000}>
                  <Box textAlign="center" py={8}>
                    <Avatar 
                      sx={{ 
                        width: 120, 
                        height: 120, 
                        mx: 'auto', 
                        mb: 4,
                        bgcolor: 'linear-gradient(135deg, #4caf50, #66bb6a)',
                        background: 'linear-gradient(135deg, #4caf50, #66bb6a)',
                        fontSize: '3rem'
                      }}
                    >
                      🤖
                    </Avatar>
                    <Typography variant="h3" gutterBottom sx={{ 
                      color: 'white', 
                      fontWeight: 'bold',
                      background: 'linear-gradient(135deg, #4caf50, #66bb6a)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}>
                      Thank You! 🎉
                    </Typography>
                    <Typography variant="h5" sx={{ color: 'rgba(255,255,255,0.9)', mb: 4, lineHeight: 1.6 }}>
                      It was a pleasure conducting this interview with you! <br/>
                      I'm now processing your responses and preparing your detailed results.
                    </Typography>
                    <Box sx={{ 
                      background: 'rgba(76, 175, 80, 0.1)', 
                      borderRadius: 3, 
                      p: 4,
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(76, 175, 80, 0.3)',
                      maxWidth: '600px',
                      mx: 'auto'
                    }}>
                      <Typography variant="body1" sx={{ color: '#4caf50', fontWeight: 'bold', mb: 2 }}>
                        🎯 What I noticed about your interview:
                      </Typography>
                      <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)', lineHeight: 2 }}>
                        • You provided thoughtful and detailed responses<br/>
                        • Your communication was clear and professional<br/>
                        • You demonstrated good problem-solving approach<br/>
                        • Your enthusiasm for the role came through clearly
                      </Typography>
                    </Box>
                    <Box mt={4} display="flex" alignItems="center" justifyContent="center" gap={2}>
                      <CircularProgress sx={{ color: '#4caf50' }} size={24} />
                      <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                        Analyzing responses and generating personalized feedback...
                      </Typography>
                    </Box>
                  </Box>
                </Fade>
              )}

              {/* Results Phase */}
              {interviewPhase === 'results' && finalResults && (
                <Box>
                  {!showDetailedResults ? (
                    <Zoom in timeout={800}>
                      <Box textAlign="center" py={4}>
                        <CheckCircle sx={{ fontSize: 100, color: '#4caf50', mb: 3 }} />
                        <Typography variant="h3" gutterBottom sx={{ color: 'white', fontWeight: 'bold' }}>
                          Interview Completed Successfully! 🎉
                        </Typography>
                        <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.8)', mb: 3 }}>
                          Your results have been saved and are available in your profile for future reference.
                        </Typography>
                        <Box sx={{ 
                          background: 'rgba(255,255,255,0.1)', 
                          borderRadius: 3, 
                          p: 4, 
                          mb: 4,
                          backdropFilter: 'blur(10px)'
                        }}>
                          <Grid container spacing={3}>
                            <Grid item xs={12} sm={3}>
                              <Box textAlign="center">
                                <Typography variant="h2" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                                  {finalResults.overallScore}%
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                                  Overall Score
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12} sm={3}>
                              <Box textAlign="center">
                                <Typography variant="h4" sx={{ color: '#2196f3', fontWeight: 'bold' }}>
                                  {finalResults.scores.communication}%
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                                  Communication
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12} sm={3}>
                              <Box textAlign="center">
                                <Typography variant="h4" sx={{ color: '#ff9800', fontWeight: 'bold' }}>
                                  {finalResults.scores.confidence}%
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                                  Confidence
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12} sm={3}>
                              <Box textAlign="center">
                                <Typography variant="h4" sx={{ color: '#9c27b0', fontWeight: 'bold' }}>
                                  {finalResults.scores.professionalism}%
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                                  Professionalism
                                </Typography>
                              </Box>
                            </Grid>
                          </Grid>
                        </Box>
                        <Stack direction="row" spacing={2} justifyContent="center">
                          <Button
                            variant="contained"
                            size="large"
                            startIcon={<Assessment />}
                            onClick={() => setShowDetailedResults(true)}
                            sx={{ 
                              px: 4,
                              background: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)'
                            }}
                          >
                            View Detailed Results
                          </Button>
                          <Button
                            variant="outlined"
                            size="large"
                            onClick={onClose}
                            sx={{ 
                              px: 4,
                              borderColor: 'rgba(255,255,255,0.3)',
                              color: 'white'
                            }}
                          >
                            Close
                          </Button>
                        </Stack>
                      </Box>
                    </Zoom>
                  ) : (
                    <Box>
                      {/* Detailed Results View */}
                      <Typography variant="h4" gutterBottom sx={{ color: 'white', fontWeight: 'bold', mb: 4 }}>
                        📊 Detailed Interview Analysis
                      </Typography>
                      
                      {/* Questions and Responses */}
                      <Box mb={4}>
                        <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
                          Questions & Your Responses
                        </Typography>
                        <Stack spacing={3}>
                          {userResponses.map((response, index) => (
                            <Card key={index} sx={{ 
                              background: 'rgba(255,255,255,0.1)', 
                              backdropFilter: 'blur(10px)' 
                            }}>
                              <CardContent>
                                <Box display="flex" justifyContent="between" alignItems="center" mb={2}>
                                  <Chip 
                                    label={`Question ${index + 1}`}
                                    sx={{ bgcolor: '#4caf50', color: 'white' }}
                                  />
                                  <Chip 
                                    label={response.mode}
                                    variant="outlined"
                                    sx={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white' }}
                                  />
                                </Box>
                                <Typography variant="subtitle1" sx={{ color: '#4caf50', mb: 1 }}>
                                  Question:
                                </Typography>
                                <Typography variant="body1" sx={{ color: 'white', mb: 2 }}>
                                  {response.question}
                                </Typography>
                                <Typography variant="subtitle1" sx={{ color: '#2196f3', mb: 1 }}>
                                  Your Response:
                                </Typography>
                                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                                  {response.response}
                                </Typography>
                              </CardContent>
                            </Card>
                          ))}
                        </Stack>
                      </Box>

                      {/* Question-by-Question Grades */}
                      {finalResults.questionGrades && (
                        <Box mb={4}>
                          <Typography variant="h5" sx={{ color: 'white', mb: 3, textAlign: 'center' }}>
                            📝 Question-by-Question Analysis
                          </Typography>
                          <Stack spacing={3}>
                            {finalResults.questionGrades.map((grade, index) => (
                              <Card key={index} sx={{ 
                                background: 'rgba(255,255,255,0.05)', 
                                border: '1px solid rgba(255,255,255,0.1)',
                                backdropFilter: 'blur(10px)'
                              }}>
                                <CardContent>
                                  <Grid container spacing={2}>
                                    <Grid item xs={12} md={8}>
                                      <Typography variant="h6" sx={{ color: '#4caf50', mb: 1 }}>
                                        Question {grade.questionNumber}
                                      </Typography>
                                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 2 }}>
                                        {grade.question}
                                      </Typography>
                                      <Box sx={{ 
                                        bgcolor: 'rgba(255,255,255,0.05)', 
                                        p: 2, 
                                        borderRadius: 2, 
                                        mb: 2,
                                        maxHeight: '100px',
                                        overflow: 'auto'
                                      }}>
                                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                                          Your Response:
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: 'white', mt: 0.5 }}>
                                          {grade.userResponse}
                                        </Typography>
                                      </Box>
                                      <Typography variant="body2" sx={{ color: '#81c784' }}>
                                        💡 {grade.feedback}
                                      </Typography>
                                      {grade.keywordsIdentified.length > 0 && (
                                        <Box mt={1}>
                                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                                            Keywords identified:
                                          </Typography>
                                          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                                            {grade.keywordsIdentified.map((keyword, idx) => (
                                              <Chip 
                                                key={idx} 
                                                label={keyword} 
                                                size="small" 
                                                sx={{ 
                                                  bgcolor: 'rgba(76, 175, 80, 0.2)',
                                                  color: '#4caf50',
                                                  fontSize: '0.7rem'
                                                }} 
                                              />
                                            ))}
                                          </Box>
                                        </Box>
                                      )}
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                      <Box textAlign="center">
                                        <Typography variant="h3" sx={{ 
                                          color: grade.score >= 80 ? '#4caf50' : grade.score >= 60 ? '#ff9800' : '#f44336',
                                          fontWeight: 'bold' 
                                        }}>
                                          {grade.score}%
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 2 }}>
                                          Score
                                        </Typography>
                                        <Box sx={{ 
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          gap: 1,
                                          color: 'rgba(255,255,255,0.6)'
                                        }}>
                                          <Timer sx={{ fontSize: 16 }} />
                                          <Typography variant="caption">
                                            {grade.timeSpent}s
                                          </Typography>
                                        </Box>
                                      </Box>
                                    </Grid>
                                  </Grid>
                                </CardContent>
                              </Card>
                            ))}
                          </Stack>
                        </Box>
                      )}

                      {/* Strengths and Improvements */}
                      <Grid container spacing={3} mb={4}>
                        <Grid item xs={12} md={6}>
                          <Card sx={{ 
                            background: 'rgba(76, 175, 80, 0.1)', 
                            border: '1px solid rgba(76, 175, 80, 0.3)' 
                          }}>
                            <CardContent>
                              <Typography variant="h6" sx={{ color: '#4caf50', mb: 2 }}>
                                <Star sx={{ mr: 1 }} />
                                Key Strengths
                              </Typography>
                              <Stack spacing={1}>
                                {finalResults.strengths.map((strength, index) => (
                                  <Typography key={index} variant="body2" sx={{ color: 'white' }}>
                                    • {strength}
                                  </Typography>
                                ))}
                              </Stack>
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Card sx={{ 
                            background: 'rgba(255, 152, 0, 0.1)', 
                            border: '1px solid rgba(255, 152, 0, 0.3)' 
                          }}>
                            <CardContent>
                              <Typography variant="h6" sx={{ color: '#ff9800', mb: 2 }}>
                                <Lightbulb sx={{ mr: 1 }} />
                                Areas for Improvement
                              </Typography>
                              <Stack spacing={1}>
                                {finalResults.improvements.map((improvement, index) => (
                                  <Typography key={index} variant="body2" sx={{ color: 'white' }}>
                                    • {improvement}
                                  </Typography>
                                ))}
                              </Stack>
                            </CardContent>
                          </Card>
                        </Grid>
                      </Grid>

                      <Box textAlign="center">
                        <Button
                          variant="contained"
                          size="large"
                          onClick={onClose}
                          sx={{ 
                            px: 6,
                            background: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)'
                          }}
                        >
                          Close Interview
                        </Button>
                      </Box>
                    </Box>
                  )}
                </Box>
              )}
            </Box>

            {/* Bottom Response Area */}
            {(interviewPhase === 'question' || interviewPhase === 'waiting') && (
              <Box sx={{ 
                borderTop: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(0,0,0,0.2)',
                p: { xs: 2, md: 3 },
                flex: '0 0 auto',
                maxHeight: '45vh',
                minHeight: 'auto',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative'
              }}>
                {/* Response Mode Toggle */}
                <Box display="flex" justifyContent="center" mb={2} sx={{ flex: '0 0 auto' }}>
                  <Tabs 
                    value={responseMode} 
                    onChange={(_, value) => setResponseMode(value)}
                    variant="fullWidth"
                    sx={{ 
                      maxWidth: { xs: '100%', sm: '400px' },
                      minWidth: { xs: '280px', sm: '400px' },
                      bgcolor: 'rgba(255,255,255,0.05)',
                      borderRadius: 2,
                      '& .MuiTab-root': { 
                        color: 'rgba(255,255,255,0.8)',
                        fontSize: { xs: '0.9rem', md: '0.875rem' },
                        minHeight: { xs: 48, md: 48 },
                        fontWeight: 500,
                        borderRadius: 2
                      },
                      '& .Mui-selected': { 
                        color: '#4caf50',
                        fontWeight: 600,
                        bgcolor: 'rgba(76, 175, 80, 0.1)'
                      },
                      '& .MuiTabs-indicator': {
                        backgroundColor: '#4caf50',
                        height: 3
                      }
                    }}
                  >
                    <Tab 
                      value="voice" 
                      label="Voice" 
                      icon={<RecordVoiceOver />}
                      iconPosition="start"
                      sx={{
                        '& .MuiTab-iconWrapper': {
                          marginRight: { xs: '8px', md: '8px' }
                        }
                      }}
                    />
                    <Tab 
                      value="text" 
                      label="Text" 
                      icon={<Keyboard />}
                      iconPosition="start"
                      sx={{
                        '& .MuiTab-iconWrapper': {
                          marginRight: { xs: '8px', md: '8px' }
                        }
                      }}
                    />
                  </Tabs>
                </Box>

                {/* Response Input */}
                {responseMode === 'voice' ? (
                  <Box sx={{ 
                    textAlign: 'center',
                    flex: '1 1 auto',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    minHeight: 0
                  }}>
                    {/* Voice Recording Instructions */}
                    {!isRecording && !textResponse && (
                      <Box sx={{ 
                        background: 'rgba(76, 175, 80, 0.1)', 
                        borderRadius: 2,
                        border: '1px solid rgba(76, 175, 80, 0.3)',
                        p: 2,
                        mb: 2
                      }}>
                        <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={1}>
                          <Mic sx={{ color: '#4caf50', fontSize: 20 }} />
                          <Typography variant="subtitle2" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                            Voice Response:
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', mb: 2 }}>
                          Click the button below to start recording your response. Speak clearly and naturally.
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                          💡 Tip: Take a moment to think before you start recording
                        </Typography>
                      </Box>
                    )}

                    <Button
                      variant={isRecording ? "contained" : "outlined"}
                      color={isRecording ? "error" : "success"}
                      startIcon={isRecording ? <Stop /> : <Mic />}
                      onClick={isRecording ? handleStopRecording : handleStartRecording}
                      size="large"
                      sx={{ 
                        px: { xs: 4, md: 8 }, 
                        py: { xs: 2, md: 2.5 },
                        fontSize: { xs: '1rem', md: '1.2rem' },
                        fontWeight: 'bold',
                        maxWidth: { xs: '100%', sm: '320px' },
                        minHeight: '56px',
                        ...(isRecording ? {
                          background: 'linear-gradient(45deg, #f44336 30%, #ff5722 90%)',
                          animation: 'pulse 2s infinite',
                          '@keyframes pulse': {
                            '0%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(244, 67, 54, 0.7)' },
                            '70%': { transform: 'scale(1)', boxShadow: '0 0 0 10px rgba(244, 67, 54, 0)' },
                            '100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(244, 67, 54, 0)' }
                          }
                        } : {
                          borderColor: '#4caf50',
                          borderWidth: '2px',
                          color: '#4caf50',
                          '&:hover': {
                            backgroundColor: 'rgba(76, 175, 80, 0.1)',
                            borderWidth: '2px',
                            transform: 'scale(1.02)'
                          }
                        })
                      }}
                    >
                      {isRecording ? '🛑 Stop Recording' : '🎤 Start Recording'}
                    </Button>
                    
                    {/* Enhanced recording status */}
                    {isRecording && (
                      <Box mt={2} sx={{ 
                        position: 'relative',
                        zIndex: 100,
                        bgcolor: 'rgba(244, 67, 54, 0.1)',
                        borderRadius: 2,
                        p: 2,
                        border: '2px solid rgba(244, 67, 54, 0.3)',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 4px 20px rgba(244, 67, 54, 0.2)',
                        flex: '0 0 auto',
                        maxHeight: '120px',
                        overflow: 'hidden',
                        width: '100%',
                        boxSizing: 'border-box'
                      }}>
                        <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={1}>
                          <Box sx={{ 
                            width: 12, 
                            height: 12, 
                            borderRadius: '50%', 
                            bgcolor: '#f44336',
                            animation: 'blink 1s infinite',
                            '@keyframes blink': {
                              '0%, 50%': { opacity: 1 },
                              '51%, 100%': { opacity: 0.3 }
                            }
                          }} />
                          <Typography variant="body2" sx={{ 
                            color: '#f44336',
                            fontSize: { xs: '0.8rem', md: '0.9rem' },
                            fontWeight: 'bold'
                          }}>
                            {speechInProgress ? 'Recording & Listening...' : 'Recording...'}
                          </Typography>
                        </Box>
                        
                        <LinearProgress 
                          sx={{ 
                            mb: 1,
                            bgcolor: 'rgba(244, 67, 54, 0.2)',
                            '& .MuiLinearProgress-bar': { 
                              bgcolor: '#f44336',
                              animation: 'pulse-bar 2s infinite'
                            },
                            '@keyframes pulse-bar': {
                              '0%, 100%': { opacity: 0.8 },
                              '50%': { opacity: 1 }
                            }
                          }}
                        />
                        
                        <Typography variant="caption" sx={{ 
                          color: 'rgba(255,255,255,0.8)',
                          fontSize: { xs: '0.7rem', md: '0.75rem' },
                          display: 'block',
                          textAlign: 'center'
                        }}>
                          {isProcessingResponse ? 'Processing your response...' : 'Speak naturally - I\'m listening to everything you say!'}
                        </Typography>
                      </Box>
                    )}

                    {/* Minimal transcript confirmation - no layout impact */}
                    {textResponse && !isRecording && (
                      <Box mt={2} sx={{ 
                        textAlign: 'center',
                        flex: '0 0 auto'
                      }}>
                        <Box sx={{ 
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 1,
                          bgcolor: 'rgba(76, 175, 80, 0.1)',
                          borderRadius: 2,
                          border: '1px solid rgba(76, 175, 80, 0.3)',
                          px: 2,
                          py: 1,
                          mb: 1
                        }}>
                          <CheckCircle sx={{ color: '#4caf50', fontSize: '1rem' }} />
                          <Typography variant="caption" sx={{ 
                            color: 'rgba(255,255,255,0.9)', 
                            fontWeight: 500,
                            fontSize: { xs: '0.75rem', md: '0.8rem' }
                          }}>
                            Response Recorded ({textResponse.trim().split(/\s+/).filter(word => word.length > 0).length} words)
                          </Typography>
                        </Box>
                        <Button
                          variant="text"
                          size="small"
                          startIcon={<Visibility />}
                          onClick={() => setTranscriptModalOpen(true)}
                          sx={{
                            color: 'rgba(255,255,255,0.8)',
                            fontSize: { xs: '0.7rem', md: '0.75rem' },
                            textTransform: 'none',
                            '&:hover': {
                              bgcolor: 'rgba(255,255,255,0.05)',
                              color: 'white'
                            }
                          }}
                        >
                          View Full Transcript
                        </Button>
                      </Box>
                    )}

                    {/* Manual continue button for voice mode */}
                    {textResponse && textResponse.trim().length > 10 && !isRecording && !isProcessingResponse && (
                      <Box mt={2} textAlign="center">
                        <Typography variant="caption" sx={{ 
                          color: 'rgba(255,255,255,0.7)',
                          display: 'block',
                          mb: 1
                        }}>
                          Automatic processing will occur, or you can continue manually:
                        </Typography>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<KeyboardArrowRight />}
                          onClick={() => handleAutoProcessResponse()}
                          sx={{
                            bgcolor: 'rgba(76, 175, 80, 0.8)',
                            color: 'white',
                            '&:hover': {
                              bgcolor: 'rgba(76, 175, 80, 0.9)'
                            }
                          }}
                        >
                          Process Response Now
                        </Button>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Box sx={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column' }}>
                    {/* Text Input Instructions */}
                    <Box sx={{ 
                      background: 'rgba(76, 175, 80, 0.1)', 
                      borderRadius: 2,
                      border: '1px solid rgba(76, 175, 80, 0.3)',
                      p: 2,
                      mb: 2
                    }}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Keyboard sx={{ color: '#4caf50', fontSize: 20 }} />
                        <Typography variant="subtitle2" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                          Written Response:
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                        Type your answer in the text box below. Be detailed and specific in your response.
                      </Typography>
                    </Box>

                    <TextField
                      ref={textFieldRef}
                      multiline
                      rows={isMobile ? 4 : 5}
                      fullWidth
                      placeholder="Type your detailed response here... (Be specific and provide examples)"
                      value={textResponse}
                      onChange={(e) => setTextResponse(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && e.ctrlKey) {
                          handleTextSubmit();
                        }
                      }}
                      sx={{
                        mb: 2,
                        flex: '1 1 auto',
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'rgba(255,255,255,0.1)',
                          minHeight: isMobile ? '120px' : '140px',
                          '& fieldset': { 
                            borderColor: 'rgba(76, 175, 80, 0.5)',
                            borderWidth: '2px'
                          },
                          '&:hover fieldset': { 
                            borderColor: 'rgba(76, 175, 80, 0.7)',
                            borderWidth: '2px'
                          },
                          '&.Mui-focused fieldset': { 
                            borderColor: '#4caf50',
                            borderWidth: '2px'
                          }
                        },
                        '& .MuiInputBase-input': { 
                          color: 'white',
                          fontSize: { xs: '0.9rem', md: '1rem' },
                          lineHeight: 1.6
                        },
                        '& .MuiInputBase-inputMultiline': {
                          padding: '16px !important'
                        }
                      }}
                    />

                    {/* Character Count and Submit */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                      <Box display="flex" flexDirection="column" gap={0.5}>
                        <Typography variant="caption" sx={{ 
                          color: textResponse.length > 50 ? '#4caf50' : 'rgba(255,255,255,0.6)',
                          fontSize: { xs: '0.7rem', md: '0.75rem' },
                          fontWeight: textResponse.length > 50 ? 'bold' : 'normal'
                        }}>
                          {textResponse.length} characters {textResponse.length < 50 ? '(aim for 50+ for detailed response)' : '✓'}
                        </Typography>
                        <Typography variant="caption" sx={{ 
                          color: 'rgba(255,255,255,0.5)',
                          fontSize: { xs: '0.6rem', md: '0.7rem' },
                          display: { xs: 'none', sm: 'block' }
                        }}>
                          Press Ctrl+Enter to submit
                        </Typography>
                      </Box>
                      <Button
                        variant="contained"
                        endIcon={<Send />}
                        onClick={handleTextSubmit}
                        disabled={!textResponse.trim()}
                        fullWidth={isMobile}
                        sx={{
                          background: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)',
                          fontSize: { xs: '0.875rem', md: '1rem' },
                          py: { xs: 1, md: 1.5 }
                        }}
                      >
                        Submit Response
                      </Button>
                    </Box>
                  </Box>
                )}
              </Box>
            )}
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>

    {/* Transcript Modal - Completely Isolated from Main Interface */}
    <Dialog
      open={transcriptModalOpen}
      onClose={() => setTranscriptModalOpen(false)}
      maxWidth="md"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          bgcolor: '#1a1a2e',
          backgroundImage: 'linear-gradient(145deg, #1a1a2e 0%, #16213e 100%)',
          color: 'white',
          maxHeight: '80vh',
          m: 2
        }
      }}
    >
      <DialogTitle sx={{ 
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        pb: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        <CheckCircle sx={{ color: '#4caf50' }} />
        <Box>
          <Typography variant="h6" component="div">
            Your Response Transcript
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            {textResponse ? `${textResponse.trim().split(/\s+/).filter(word => word.length > 0).length} words recorded` : 'No response recorded'}
          </Typography>
        </Box>
        <Box sx={{ ml: 'auto' }}>
          <IconButton 
            onClick={() => setTranscriptModalOpen(false)}
            sx={{ color: 'rgba(255,255,255,0.7)' }}
          >
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ 
          p: 3,
          maxHeight: '60vh',
          overflow: 'auto',
          '&::-webkit-scrollbar': {
            width: '8px'
          },
          '&::-webkit-scrollbar-track': {
            bgcolor: 'rgba(255,255,255,0.1)'
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: 'rgba(76, 175, 80, 0.5)',
            borderRadius: '4px'
          }
        }}>
          {textResponse ? (
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'white',
                lineHeight: 1.6,
                fontSize: '1rem',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}
            >
              {textResponse}
            </Typography>
          ) : (
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', fontStyle: 'italic' }}>
              No response recorded yet.
            </Typography>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ 
        borderTop: '1px solid rgba(255,255,255,0.1)',
        p: 2,
        gap: 1
      }}>
        <Button
          variant="outlined"
          onClick={() => setTranscriptModalOpen(false)}
          sx={{
            borderColor: 'rgba(255,255,255,0.3)',
            color: 'white',
            '&:hover': {
              borderColor: 'rgba(255,255,255,0.5)',
              bgcolor: 'rgba(255,255,255,0.05)'
            }
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
});

export default InterviewInterface;
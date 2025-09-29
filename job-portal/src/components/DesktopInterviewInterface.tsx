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
  DialogActions,
  DialogTitle,
  Backdrop,
  Container,
  Grid,
  Divider,
  Tooltip,
  Badge,
  Switch,
  FormControlLabel
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
  Stop,
  Videocam,
  VideocamOff,
  Keyboard,
  ArrowForward,
  Assessment,
  TrendingUp,
  Star,
  Lightbulb,
  Person,
  Schedule,
  BookmarkBorder,
  Visibility,
  VisibilityOff,
  Speed,
  WorkspacePremium,
  FiberManualRecord,
  StopCircle,
  VideoLibrary
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { QuickInterviewSession, QuickInterviewQuestion, QuickInterviewResult, quickInterviewService } from '../services/quickInterviewService';
import { avatarTalkService, AvatarTalkResponse } from '../services/avatarTalkService';
import { avatarResponseHandler, AvatarResponse } from '../services/avatarResponseHandler';
import { didRealTimeService } from '../services/didRealTimeService';

interface DesktopInterviewInterfaceProps {
  open: boolean;
  onClose: () => void;
  session: QuickInterviewSession;
  onComplete: (result: QuickInterviewResult) => void;
}

const DesktopInterviewInterface: React.FC<DesktopInterviewInterfaceProps> = ({
  open,
  onClose,
  session,
  onComplete
}) => {
  const theme = useTheme();
  
  // Core interview states
  const [currentQuestion, setCurrentQuestion] = useState<QuickInterviewQuestion | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(session?.totalDuration || 900);
  const [questionStartTime, setQuestionStartTime] = useState<Date | null>(null);
  const [interviewPhase, setInterviewPhase] = useState<'welcome' | 'briefing' | 'question' | 'recording' | 'processing' | 'completed' | 'results'>('welcome');
  
  // Audio/Video states
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [responseMode, setResponseMode] = useState<'voice' | 'text'>('voice');
  const [recordingVolume, setRecordingVolume] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [textResponse, setTextResponse] = useState('');
  
  // UI states
  const [avatarThinking, setAvatarThinking] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showTips, setShowTips] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarSilent, setAvatarSilent] = useState(false);
  
  // Avatar video states
  const [avatarVideoUrl, setAvatarVideoUrl] = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [currentAvatarPhase, setCurrentAvatarPhase] = useState<string | null>(null);
  const [avatarVideoPlayed, setAvatarVideoPlayed] = useState(false);
  const [showRepeatButton, setShowRepeatButton] = useState(false);
  
  // D-ID Real-Time API states
  const [didSessionId, setDidSessionId] = useState<string | null>(null);
  const [streamActive, setStreamActive] = useState(false);
  const [avatarResponse, setAvatarResponse] = useState<AvatarResponse | null>(null);
  const [useDIDRealTime, setUseDIDRealTime] = useState(true); // Default to D-ID Real-Time
  const [liveVideoMode, setLiveVideoMode] = useState(true); // Enable Zoom-like live video mode
  
  // User video states
  const [userVideoStream, setUserVideoStream] = useState<MediaStream | null>(null);
  const [showUserVideo, setShowUserVideo] = useState(true);
  
  // Recording states
  const [isRecordingSession, setIsRecordingSession] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState<Date | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [sessionRecordingId, setSessionRecordingId] = useState<string | null>(null);
  const [recordingQuality, setRecordingQuality] = useState<'low' | 'medium' | 'high'>('high');
  const [showRecordingControls, setShowRecordingControls] = useState(true);
  const [avatarFinishedSpeaking, setAvatarFinishedSpeaking] = useState(false);
  const [pendingNextAction, setPendingNextAction] = useState<(() => void) | null>(null);
  const [canUserRespond, setCanUserRespond] = useState(false);
  
  // Results states
  const [finalResults, setFinalResults] = useState<QuickInterviewResult | null>(null);
  const [userResponses, setUserResponses] = useState<{question: string, response: string, duration: number}[]>([]);
  
  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  
  // Recording refs
  const sessionRecorderRef = useRef<MediaRecorder | null>(null);
  const sessionStreamRef = useRef<MediaStream | null>(null);
  const sessionChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Check for desktop environment
  const isDesktop = window.innerWidth >= 1024;
  const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
  
  // Initialize desktop warning
  useEffect(() => {
    if (!isDesktop && !isTablet) {
      setError('This interview interface is designed for desktop and laptop devices for the best experience. Please use a computer with a wide screen for your interview.');
    }
  }, [isDesktop, isTablet]);

  // Initialize user video when component opens
  useEffect(() => {
    if (open && liveVideoMode) {
      initializeUserVideo();
    }
    
    return () => {
      // Cleanup user video stream
      if (userVideoStream) {
        userVideoStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [open, liveVideoMode]);

  // Timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timeRemaining > 0 && interviewPhase !== 'completed' && interviewPhase !== 'results') {
      timer = setInterval(() => {
        setTimeRemaining(prev => Math.max(0, prev - 1));
      }, 1000);
    } else if (timeRemaining === 0 && interviewPhase !== 'completed' && interviewPhase !== 'results') {
      // Auto-submit when time runs out
      if (interviewPhase === 'recording') {
        stopRecording();
      } else if (interviewPhase === 'question') {
        completeInterview();
      }
    }
    return () => clearInterval(timer);
  }, [timeRemaining, interviewPhase]);

  // Recording duration timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRecording && recordingStartTime) {
      timer = setInterval(() => {
        setRecordingDuration(Math.floor((Date.now() - recordingStartTime.getTime()) / 1000));
      }, 1000);
    } else {
      setRecordingDuration(0);
    }
    return () => clearInterval(timer);
  }, [isRecording, recordingStartTime]);

  // Initialize interview
  useEffect(() => {
    if (open && session && isDesktop) {
      initializeInterview();
    }
  }, [open, session, isDesktop]);

  // Handle avatar finishing speaking
  useEffect(() => {
    if (avatarFinishedSpeaking && pendingNextAction) {
      console.log('🎤 Avatar finished speaking, executing next action');
      pendingNextAction();
      setPendingNextAction(null);
      setAvatarFinishedSpeaking(false);
    }
  }, [avatarFinishedSpeaking, pendingNextAction]);

  // Avatar video generation based on interview phase
  useEffect(() => {
    if (!open || avatarSilent) return;

    // Don't generate avatar video during recording phase
    if (interviewPhase === 'recording') {
      return;
    }

    switch (interviewPhase) {
      case 'welcome':
        console.log('🎥 Welcome phase - generating welcome video with D-ID priority');
        generateWelcomeVideo();
        setCanUserRespond(true); // Allow user to proceed from welcome
        break;
      case 'question':
        if (currentQuestion) {
          console.log('🎥 Question phase - generating question video with D-ID priority');
          generateQuestionVideo(currentQuestion.text, currentQuestion.type || 'general');
          // Set up callback to allow user to respond after avatar finishes speaking
          setPendingNextAction(() => {
            console.log('🎤 Question video finished, user can now respond');
            setCanUserRespond(true);
          });
        }
        break;
      case 'completed':
        console.log('🎥 Completed phase - generating acknowledgment video with D-ID priority');
        generateAcknowledgmentVideo(true);
        break;
      case 'results':
        if (finalResults) {
          console.log('🎥 Results phase - generating results video with D-ID priority');
          generateResultsVideo(finalResults.overallScore, finalResults.feedback);
        }
        break;
    }
  }, [interviewPhase, currentQuestion, finalResults, open, avatarSilent]);

  // Generate acknowledgment after processing response - now handled in processResponse function

  const initializeInterview = async () => {
    try {
      setLoading(true);
      
      // Start the session if needed
      if (session.status === 'ready') {
        await quickInterviewService.startSession(session.id);
      }
      
      // Initialize audio context
      if (responseMode === 'voice') {
        await initializeAudio();
      }
      
      setInterviewPhase('welcome');
      setCanUserRespond(true); // Allow user to proceed from welcome
      setTimeout(() => {
        setInterviewPhase('briefing');
      }, 2000);
      
    } catch (error) {
      console.error('Failed to initialize interview:', error);
      setError('Failed to initialize interview session');
    } finally {
      setLoading(false);
    }
  };

  const initializeAudio = async () => {
    try {
      // Check if microphone is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone access not supported');
      }

      // Request microphone permission first
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create audio context
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      // Connect microphone stream to analyser
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      // Configure analyser
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;
      
      // Setup speech recognition
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';
        
        recognitionRef.current.onresult = (event: any) => {
          let interimTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              setTranscript(prev => prev + transcript + ' ');
            } else {
              interimTranscript += transcript;
            }
          }
          if (interimTranscript) {
            setTranscript(interimTranscript);
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          if (event.error === 'not-allowed') {
            setError('Microphone permission denied. Please allow microphone access.');
          } else if (event.error === 'network') {
            console.warn('Speech recognition network error - continuing without speech recognition');
            // Don't set error for network issues, just continue without speech recognition
          } else {
            console.warn('Speech recognition error:', event.error);
          }
        };

        recognitionRef.current.onend = () => {
          // Restart recognition if we're still recording
          if (isRecording && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (e) {
              console.log('Speech recognition already started');
            }
          }
        };
      } else {
        console.warn('Speech recognition not supported in this browser');
      }
      
      // Stop the initial stream as we'll get a new one when recording starts
      stream.getTracks().forEach(track => track.stop());
      
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          setError('Microphone access denied. Please allow microphone access and refresh the page.');
        } else if (error.name === 'NotFoundError') {
          setError('No microphone found. Please connect a microphone and try again.');
        } else {
          setError('Failed to initialize microphone. Please check your audio settings.');
        }
      }
    }
  };

  const startRecording = async () => {
    try {
      // Clear any previous error
      setError(null);
      
      // Get microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      // Setup media recorder
      mediaRecorderRef.current = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        console.log('Recording stopped, audio blob created:', audioBlob.size, 'bytes');
      };
      
      mediaRecorderRef.current.start(1000); // Record in 1-second chunks
      
      // Connect stream to analyser for volume monitoring
      if (audioContextRef.current && analyserRef.current) {
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);
        monitorAudioLevels();
      }
      
      // Start speech recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.log('Speech recognition already started or failed to start');
        }
      }
      
      setIsRecording(true);
      setInterviewPhase('recording');
      setRecordingStartTime(new Date());
      setAvatarSilent(true); // Stop avatar from talking during recording
      setTranscript(''); // Clear previous transcript
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          setError('Microphone access denied. Please allow microphone access and try again.');
        } else if (error.name === 'NotFoundError') {
          setError('No microphone found. Please connect a microphone and try again.');
        } else {
          setError('Failed to start recording. Please check your microphone and try again.');
        }
      } else {
        setError('Failed to start recording. Please try again.');
      }
    }
  };

  const monitorAudioLevels = () => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    const updateLevel = () => {
      if (analyser && isRecording) {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        setRecordingVolume(average);
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      }
    };
    
    updateLevel();
  };

  const stopRecording = () => {
    try {
      // Stop media recorder
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      
      // Stop speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      
      // Stop audio level monitoring
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      setIsRecording(false);
      setRecordingVolume(0);
      setRecordingStartTime(null);
      
      // Process the response after a short delay to ensure transcript is finalized
      setTimeout(() => {
        processResponse();
      }, 500);
      
    } catch (error) {
      console.error('Error stopping recording:', error);
      setIsRecording(false);
      setRecordingVolume(0);
      processResponse();
    }
  };

  const processResponse = async () => {
    setLoading(true);
    setAvatarThinking(true);
    setInterviewPhase('processing');
    setAvatarSilent(false); // Allow avatar to talk again for acknowledgment
    
    try {
      const response = textResponse || transcript || "No response provided";
      const duration = questionStartTime ? Date.now() - questionStartTime.getTime() : 0;
      
      // Save user response
      const newResponse = {
        question: currentQuestion?.text || '',
        response: response,
        duration: duration
      };
      setUserResponses(prev => [...prev, newResponse]);
      
      // Process response with AI
      if (currentQuestion) {
        // Submit response and generate real feedback
        await quickInterviewService.submitQuickResponse(session.id, {
          questionId: currentQuestion.id,
          answer: response,
          duration: duration,
          confidence: 0.8, // Default confidence level
          timestamp: new Date()
        });
        
        // Generate real AI feedback for this response
        const feedback = await quickInterviewService.generateRealFeedback(
          currentQuestion.text,
          response,
          duration
        );
        
        console.log('🎯 Real AI Feedback Generated:', feedback);
        
        // Generate acknowledgment video with processing message
        const isLastQuestion = currentQuestionIndex >= session.questions.length - 1;
        if (isLastQuestion) {
          await generateAcknowledgmentVideo(true, feedback);
        } else {
          await generateAcknowledgmentVideo(false, feedback);
        }
        
        // Set up the next action to be executed when avatar finishes speaking
        setPendingNextAction(() => {
          if (currentQuestionIndex < session.questions.length - 1) {
            loadNextQuestion();
          } else {
            completeInterview();
          }
        });
        
        console.log('🎤 Waiting for avatar to finish speaking before proceeding...');
      }
      
    } catch (error) {
      console.error('Failed to process response:', error);
      setError('Failed to process your response');
    } finally {
      setLoading(false);
      setAvatarThinking(false);
    }
  };

  const loadNextQuestion = () => {
    if (currentQuestionIndex < session.questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setCurrentQuestion(session.questions[nextIndex]);
      setInterviewPhase('question');
      setTranscript('');
      setTextResponse('');
      setQuestionStartTime(new Date());
      setShowTips(false);
      setAvatarSilent(false); // Allow avatar to talk for next question
      setAvatarVideoPlayed(false); // Reset video played state
      setShowRepeatButton(false); // Hide repeat button
      setCanUserRespond(false); // Reset user response state
    }
  };

  const completeInterview = async () => {
    setLoading(true);
    
    try {
      // Generate comprehensive results using real AI scoring
      const results = await quickInterviewService.completeSession(session.id, {
        responses: userResponses,
        totalDuration: Math.round((new Date().getTime() - new Date(session.startTime).getTime()) / 1000)
      });
      
      console.log('🎯 Real Interview Results:', results);
      
      setFinalResults(results);
      setInterviewPhase('completed');
      
      // Wait a moment then show results
      setTimeout(() => {
        setInterviewPhase('results');
        
        // Generate results video with real feedback
        generateResultsVideo(results.overallScore, results.feedback.join(' '));
      }, 2000);
      
    } catch (error) {
      console.error('Error completing interview:', error);
      setError('Failed to complete interview');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteInterview = () => {
    if (interviewPhase === 'recording') {
      stopRecording();
    } else if (interviewPhase === 'question') {
      completeInterview();
    }
  };

  const handleClose = () => {
    if (isRecording) {
      stopRecording();
    }
    
    // Stop session recording if active
    if (isRecordingSession) {
      stopSessionRecording();
    }
    
    // Cleanup D-ID session if active
    if (didSessionId) {
      didRealTimeService.stopStream(didSessionId);
      setDidSessionId(null);
      setStreamActive(false);
    }
    
    // Clear any video URLs
    if (avatarVideoUrl) {
      URL.revokeObjectURL(avatarVideoUrl);
    }
    
    // Clear recording intervals
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
    
    onClose();
  };

  // Avatar video generation functions with D-ID Real-Time API integration
  const generateAvatarVideo = async (text: string, emotion: string = 'neutral', cacheKey?: string) => {
    try {
      setAvatarLoading(true);
      setAvatarError(null);
      setAvatarVideoPlayed(false);
      setShowRepeatButton(false);
      
      // Try D-ID Real-Time API first (primary service)
      if (useDIDRealTime && didRealTimeService.isConfigured()) {
        console.log('🎥 Using D-ID Real-Time API (Primary) for:', text.substring(0, 50) + '...');
        
        try {
          const avatarResponse = await avatarResponseHandler.processQuestion(text);
          setAvatarResponse(avatarResponse);
          
          if (avatarResponse.avatar === 'did') {
            // Use D-ID Real-Time streaming
            await startDIDVideo(avatarResponse);
            if (cacheKey) {
              setCurrentAvatarPhase(cacheKey);
            }
            console.log('✅ D-ID Real-Time streaming started successfully');
            return;
          } else {
            console.log('🔄 D-ID service unavailable, falling back to TalkAvatar');
            setUseDIDRealTime(false);
          }
        } catch (error) {
          console.error('❌ D-ID Real-Time API failed:', error);
          console.log('🔄 Falling back to TalkAvatar due to D-ID error');
          setUseDIDRealTime(false);
        }
      }
      
      // Fallback to TalkAvatar service
      if (!avatarTalkService.isConfigured()) {
        console.warn('Avatar Talk service not configured');
        setAvatarError('No avatar service available');
        return;
      }
      
      const response = await avatarTalkService.generateVideo({
        text,
        avatar: 'european_woman',
        emotion,
        language: 'en'
      });

      if (response.success && response.mp4_url) {
        setAvatarVideoUrl(response.mp4_url);
        if (cacheKey) {
          setCurrentAvatarPhase(cacheKey);
        }
      } else {
        console.error('AvatarTalk API error:', response.error);
        setAvatarError(response.error || 'Failed to generate avatar video');
        
        // If it's a 500 error, try with a shorter, simpler message
        if (response.error && response.error.includes('500')) {
          console.log('🔄 Retrying with shorter message due to 500 error');
          const shortText = text.length > 100 ? text.substring(0, 100) + '...' : text;
          const retryResponse = await avatarTalkService.generateVideo({
            text: shortText,
            avatar: 'european_woman',
            emotion: 'neutral', // Use neutral emotion for retry
            language: 'en'
          });
          
          if (retryResponse.success && retryResponse.mp4_url) {
            setAvatarVideoUrl(retryResponse.mp4_url);
            setAvatarError(null);
            if (cacheKey) {
              setCurrentAvatarPhase(cacheKey);
            }
          }
        }
      }
    } catch (error) {
      console.error('Avatar video generation error:', error);
      setAvatarError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setAvatarLoading(false);
    }
  };

  // Start D-ID video generation (non-streaming)
  const startDIDVideo = async (response: AvatarResponse) => {
    try {
      console.log('🎬 Starting D-ID video generation for:', response.text.substring(0, 50) + '...');
      console.log('🔧 D-ID service configured:', didRealTimeService.isConfigured());
      console.log('🤖 Avatar response:', response.avatar);
      
      if (response.avatar === 'did' && didRealTimeService.isConfigured()) {
        console.log('✅ Conditions met for D-ID video generation');
        
        const didResponse = await didRealTimeService.generateInterviewResponse(response.text);
        console.log('📡 D-ID API response:', didResponse);
        
        if (didResponse.success && didResponse.session_id) {
          setDidSessionId(didResponse.session_id);
          setStreamActive(true);
          
          console.log('✅ D-ID talk created:', didResponse.session_id);
          
          // Get video URL and play it
          const videoUrl = await didRealTimeService.getVideoUrl(didResponse.session_id);
          await playDIDVideo(videoUrl);
          
          console.log('🎥 D-ID video loaded successfully');
        } else {
          console.error('❌ D-ID talk creation failed:', didResponse);
          throw new Error('D-ID talk creation failed');
        }
      } else {
        console.warn('⚠️ D-ID conditions not met - avatar:', response.avatar, 'configured:', didRealTimeService.isConfigured());
        throw new Error('D-ID conditions not met');
      }
    } catch (error) {
      console.error('❌ Failed to start D-ID video:', error);
      setStreamActive(false);
      setUseDIDRealTime(false);
      throw error;
    }
  };

  // Play D-ID video from URL
  const playDIDVideo = async (videoUrl: string) => {
    try {
      console.log('🎥 Playing D-ID video from URL:', videoUrl);
      
      if (videoRef.current) {
        videoRef.current.src = videoUrl;
        videoRef.current.load();
        
        // Wait for video to be ready
        await new Promise((resolve, reject) => {
          if (!videoRef.current) {
            reject(new Error('Video element not available'));
            return;
          }
          
          const handleCanPlay = () => {
            videoRef.current?.removeEventListener('canplay', handleCanPlay);
            videoRef.current?.removeEventListener('error', handleError);
            resolve(void 0);
          };
          
          const handleError = () => {
            videoRef.current?.removeEventListener('canplay', handleCanPlay);
            videoRef.current?.removeEventListener('error', handleError);
            reject(new Error('Failed to load video'));
          };
          
          videoRef.current.addEventListener('canplay', handleCanPlay);
          videoRef.current.addEventListener('error', handleError);
        });
        
        // Play the video
        await videoRef.current.play();
        setIsPlaying(true);
        setAvatarVideoPlayed(true);
        console.log('✅ D-ID video playing successfully');
      }
    } catch (error) {
      console.error('❌ Failed to play D-ID video:', error);
      throw error;
    }
  };

  // Recording functions
  const startSessionRecording = async () => {
    try {
      console.log('🎥 Starting session recording...');
      
      // Request screen and audio capture
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: recordingQuality === 'high' ? 1920 : recordingQuality === 'medium' ? 1280 : 640,
          height: recordingQuality === 'high' ? 1080 : recordingQuality === 'medium' ? 720 : 480,
          frameRate: recordingQuality === 'high' ? 30 : recordingQuality === 'medium' ? 24 : 15
        },
        audio: true
      });

      // If no audio from screen capture, get microphone audio separately
      if (!stream.getAudioTracks().length) {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        
        audioStream.getAudioTracks().forEach(track => {
          stream.addTrack(track);
        });
      }

      sessionStreamRef.current = stream;
      sessionChunksRef.current = [];

      // Setup MediaRecorder
      const mimeType = recordingQuality === 'high' 
        ? 'video/webm;codecs=vp9,opus' 
        : recordingQuality === 'medium' 
        ? 'video/webm;codecs=vp9,opus' 
        : 'video/webm;codecs=vp8,opus';

      sessionRecorderRef.current = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: recordingQuality === 'high' ? 5000000 : recordingQuality === 'medium' ? 2000000 : 500000,
        audioBitsPerSecond: recordingQuality === 'high' ? 256000 : recordingQuality === 'medium' ? 128000 : 64000
      });

      sessionRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          sessionChunksRef.current.push(event.data);
        }
      };

      sessionRecorderRef.current.onstop = () => {
        processSessionRecording();
      };

      // Start recording
      sessionRecorderRef.current.start(1000); // Collect data every second
      
      // Generate recording ID
      const recordingId = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setSessionRecordingId(recordingId);
      
      // Set recording state
      setIsRecordingSession(true);
      setRecordingStartTime(new Date());
      setRecordingDuration(0);
      
      // Start duration timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      console.log('✅ Session recording started:', recordingId);

    } catch (error) {
      console.error('Failed to start session recording:', error);
      setError('Failed to start recording. Please check your permissions.');
    }
  };

  const stopSessionRecording = async () => {
    if (!sessionRecorderRef.current || !isRecordingSession) {
      console.warn('No active session recording to stop');
      return;
    }

    try {
      console.log('🛑 Stopping session recording...');
      
      // Stop the recording
      sessionRecorderRef.current.stop();
      
      // Stop all tracks
      if (sessionStreamRef.current) {
        sessionStreamRef.current.getTracks().forEach(track => track.stop());
      }

      // Clear interval
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }

      setIsRecordingSession(false);
      console.log('✅ Session recording stopped');

    } catch (error) {
      console.error('Failed to stop session recording:', error);
      setError('Failed to stop recording');
    }
  };

  const processSessionRecording = async () => {
    if (!sessionRecordingId || sessionChunksRef.current.length === 0) {
      console.warn('No recording data to process');
      return;
    }

    try {
      console.log('🔄 Processing session recording...');
      
      // Create video blob
      const videoBlob = new Blob(sessionChunksRef.current, { type: 'video/webm' });
      
      // Generate thumbnail
      const thumbnailUrl = await generateVideoThumbnail(videoBlob);
      
      // Create recording object
      const recording = {
        id: sessionRecordingId,
        sessionId: session.id,
        userId: session.userId,
        jobTitle: session.jobTitle || 'Interview',
        startTime: recordingStartTime,
        endTime: new Date(),
        duration: recordingDuration,
        videoBlob,
        thumbnailUrl,
        avatarService: avatarResponse?.avatar || 'talkavatar',
        quality: recordingQuality,
        questions: [], // Will be populated during interview
        userResponses: [] // Will be populated during interview
      };

      // Save recording (you would implement this based on your backend)
      await saveRecordingToBackend(recording);
      
      console.log('✅ Session recording processed successfully');

    } catch (error) {
      console.error('Failed to process session recording:', error);
      setError('Failed to process recording');
    }
  };

  const generateVideoThumbnail = async (videoBlob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      video.onloadeddata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        video.currentTime = Math.min(1, video.duration / 2);
      };

      video.onseeked = () => {
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumbnail = canvas.toDataURL('image/jpeg', 0.7);
          resolve(thumbnail);
        } else {
          reject(new Error('Canvas context not available'));
        }
        
        URL.revokeObjectURL(video.src);
      };

      video.onerror = () => {
        reject(new Error('Failed to generate thumbnail'));
        URL.revokeObjectURL(video.src);
      };

      video.src = URL.createObjectURL(videoBlob);
      video.load();
    });
  };

  const saveRecordingToBackend = async (recording: any) => {
    try {
      // Convert video blob to file
      const videoFile = new File([recording.videoBlob], `interview_${recording.id}.webm`, {
        type: 'video/webm'
      });

      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('recording', JSON.stringify({
        ...recording,
        videoBlob: undefined // Remove blob from JSON
      }));

      const response = await fetch('/api/recordings/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📁 Recording saved:', data.recordingId);

    } catch (error) {
      console.error('Failed to save recording:', error);
      // Store locally as fallback
      localStorage.setItem(`recording_${recording.id}`, JSON.stringify(recording));
    }
  };

  const formatRecordingTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Initialize user video for live mode
  const initializeUserVideo = async () => {
    try {
      console.log('🎥 Initializing user video for live mode...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240 },
        audio: false // We'll handle audio separately for recording
      });
      setUserVideoStream(stream);
      console.log('✅ User video initialized');
    } catch (error) {
      console.error('Failed to initialize user video:', error);
      setShowUserVideo(false);
    }
  };

  const generateWelcomeVideo = async () => {
    try {
      console.log('🎥 Generating welcome video with D-ID Real-Time API (Primary)');
      console.log('📋 Session job title:', session.jobTitle);
      console.log('🔧 D-ID configured:', didRealTimeService.isConfigured());
      console.log('🔧 TalkAvatar configured:', avatarTalkService.isConfigured());
      
      const welcomeResponse = await avatarResponseHandler.generateWelcomeMessage(session.jobTitle);
      setAvatarResponse(welcomeResponse);
      
      console.log('🤖 Avatar response received:', welcomeResponse);
      
      if (welcomeResponse.avatar === 'did') {
        console.log('✅ Using D-ID Real-Time for welcome video');
        await startDIDVideo(welcomeResponse);
        setCurrentAvatarPhase('welcome');
      } else {
        console.log('🔄 D-ID unavailable, using TalkAvatar for welcome video');
        await generateAvatarVideo(
          welcomeResponse.text,
          'happy',
          'welcome'
        );
      }
    } catch (error) {
      console.error('❌ Failed to generate welcome video with D-ID:', error);
      console.log('🔄 Falling back to TalkAvatar for welcome video');
      // Fallback to original method
      await generateAvatarVideo(
        `Hello and welcome to your AI interview for ${session.jobTitle || 'this position'}. I'm your virtual interviewer and I'll be conducting this interview today. Please make sure you're in a quiet environment and your microphone is working properly. We'll start with a few questions to assess your qualifications for this role. Are you ready to begin?`,
        'happy',
        'welcome'
      );
    }
  };

  const generateQuestionVideo = async (question: string, questionType: string = 'general') => {
    const emotion = questionType === 'behavioral' ? 'happy' : questionType === 'technical' ? 'serious' : 'neutral';
    await generateAvatarVideo(question, emotion, 'question');
  };

  const generateAcknowledgmentVideo = async (isLast: boolean = false, feedback?: any) => {
    let message = '';
    
    if (isLast) {
      message = "Thank you for completing the interview! I'm now analyzing all your responses to provide you with detailed feedback and recommendations.";
      try {
        await generateAvatarVideo(message, 'happy', 'acknowledgment');
      } catch (error) {
        console.error('Final acknowledgment video failed:', error);
        // Continue anyway - don't block the flow
      }
    } else {
      // First, tell user that answer is being processed
      const processingMessage = "Thank you for your response! I'm now processing your answer and analyzing it. Please give me a moment to prepare the next question.";
      
      try {
        await generateAvatarVideo(processingMessage, 'happy', 'processing');
        
        // Wait a bit for the processing message to be heard
        await new Promise(resolve => setTimeout(resolve, 5000)); // Increased from 3000 to 5000ms
        
        // Then give feedback-based acknowledgment
        if (feedback && feedback.score) {
          if (feedback.score >= 80) {
            message = "Excellent response! Your answer shows strong understanding. Let's move on to the next question.";
          } else if (feedback.score >= 60) {
            message = "Good response! I can see you put thought into your answer. Here's your next question.";
          } else {
            message = "Thank you for your response! I've noted your answer. Let's continue with the next question.";
          }
        } else {
          const acknowledgments = [
            "I've processed your response. Let me prepare the next question for you.",
            "Your answer has been analyzed. Moving on to the next question.",
            "Thank you for that response. Here's your next question.",
            "I've reviewed your answer. Let's continue with the next question."
          ];
          message = acknowledgments[Math.floor(Math.random() * acknowledgments.length)];
        }
        
        await generateAvatarVideo(message, 'happy', 'acknowledgment');
        
        // Wait for acknowledgment video to complete before setting up next action
        await new Promise(resolve => setTimeout(resolve, 2000)); // Give time for acknowledgment to start playing
        
      } catch (error) {
        console.error('AvatarTalk API error:', error);
        // Fallback message if avatar generation fails
        console.log('🔄 Avatar generation failed, using fallback message');
        message = "Thank you for your response! I'm processing your answer and preparing the next question.";
        
        try {
          await generateAvatarVideo(message, 'happy', 'acknowledgment');
        } catch (fallbackError) {
          console.error('Fallback avatar generation also failed:', fallbackError);
          // If all avatar generation fails, just continue with the flow
          console.log('🔄 All avatar generation failed, continuing without avatar video');
        }
      }
    }
  };

  const generateResultsVideo = async (score: number, feedback: string) => {
    const scoreText = score >= 85 ? "excellent" : score >= 75 ? "good" : score >= 65 ? "satisfactory" : "needs improvement";
    
    const resultsText = `Congratulations on completing the interview! Your overall performance was ${scoreText} with a score of ${score} out of 100. ${feedback} I hope this interview experience was valuable for you. Best of luck with your application!`;
    
    await generateAvatarVideo(resultsText, 'happy', 'results');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    if (!session || session.questions.length === 0) return 0;
    return ((currentQuestionIndex + 1) / session.questions.length) * 100;
  };

  const getTips = () => [
    "Speak clearly and at a moderate pace",
    "Use specific examples from your experience",
    "Structure your answer: situation, action, result",
    "Be honest and authentic in your responses",
    "Don't rush - take time to think before responding"
  ];

  // Render mobile warning
  if (!isDesktop && !isTablet) {
    return (
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            p: 3
          }
        }}
      >
        <DialogContent sx={{ textAlign: 'center', pt: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
            📱 Device Recommendation
          </Typography>
          <Typography variant="h6" sx={{ mb: 3, opacity: 0.9 }}>
            For the best interview experience, please use this interview on a desktop computer or laptop with a wide screen.
          </Typography>
          <Paper sx={{ p: 3, mb: 3, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              <strong>Why desktop?</strong>
            </Typography>
            <Stack spacing={1}>
              <Typography variant="body2">• Better visual layout for interview questions</Typography>
              <Typography variant="body2">• More comfortable typing and recording setup</Typography>
              <Typography variant="body2">• Professional interview environment</Typography>
              <Typography variant="body2">• Full-screen experience without distractions</Typography>
            </Stack>
          </Paper>
          <Alert severity="info" sx={{ mb: 3, backgroundColor: 'rgba(255,255,255,0.1)', color: 'white' }}>
            You can still access your interview history and results on mobile devices.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleClose}
            sx={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: 'white',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' },
              px: 4,
              py: 1.5
            }}
            startIcon={<Close />}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  // Render desktop interface
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#f8fafc',
        zIndex: 9999,
        overflow: 'hidden',
        fontFamily: '"Inter", "Roboto", sans-serif'
      }}
    >
      {/* Header */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 70,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          px: 4,
          zIndex: 100,
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, fontSize: '1.2rem' }}>
            {session?.position || 'AI Interview'} - Question {currentQuestionIndex + 1} of {session?.questions.length || 0}
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 0.5 }}>
            Time remaining: {formatTime(timeRemaining)}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Live Video Mode Toggle */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={liveVideoMode}
                  onChange={(e) => {
                    setLiveVideoMode(e.target.checked);
                    if (e.target.checked) {
                      initializeUserVideo();
                    } else {
                      if (userVideoStream) {
                        userVideoStream.getTracks().forEach(track => track.stop());
                        setUserVideoStream(null);
                      }
                    }
                  }}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#4caf50',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#4caf50',
                    },
                  }}
                />
              }
              label={
                <Chip
                  icon={<Videocam />}
                  label={liveVideoMode ? 'Live Video Mode' : 'Standard Mode'}
                  color={liveVideoMode ? 'success' : 'default'}
                  size="small"
                  sx={{ 
                    backgroundColor: liveVideoMode ? 'rgba(34, 197, 94, 0.9)' : 'rgba(255,255,255,0.1)',
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                />
              }
              sx={{ m: 0 }}
            />
          </Box>

          {/* Session Recording Controls */}
          {showRecordingControls && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {!isRecordingSession ? (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<FiberManualRecord />}
                  onClick={startSessionRecording}
                  sx={{
                    backgroundColor: '#ef4444',
                    color: 'white',
                    '&:hover': { backgroundColor: '#dc2626' },
                    fontSize: '0.75rem',
                    px: 2,
                    py: 0.5
                  }}
                >
                  Record Session
                </Button>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    icon={<FiberManualRecord />}
                    label={`REC ${formatRecordingTime(recordingDuration)}`}
                    color="error"
                    size="small"
                    sx={{ 
                      backgroundColor: '#ef4444',
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
                  <IconButton
                    size="small"
                    onClick={stopSessionRecording}
                    sx={{
                      color: 'white',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' }
                    }}
                  >
                    <StopCircle />
                  </IconButton>
                </Box>
              )}
            </Box>
          )}
          
          <LinearProgress
            variant="determinate"
            value={getProgressPercentage()}
            sx={{
              width: 150,
              height: 6,
              borderRadius: 3,
              backgroundColor: 'rgba(255,255,255,0.2)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: 'white',
                borderRadius: 3
              }
            }}
          />
          
          <IconButton
            onClick={handleClose}
            sx={{ 
              color: 'white',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
            }}
          >
            <Close />
          </IconButton>
        </Box>
      </Box>

      {/* Main Content */}
      <Container maxWidth={false} sx={{ pt: 9, pb: 3, height: '100vh', overflow: 'auto' }}>
        <Grid container spacing={1.5} sx={{ height: '100%' }}>
          {/* Left Panel - AI Avatar */}
          <Grid item xs={12} sm={6} md={6} lg={7} xl={7}>
            <Paper sx={{ 
              p: 2, 
              height: '100%',
              backgroundColor: 'white', 
              borderRadius: 4,
              textAlign: 'center',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              border: '1px solid #e2e8f0'
            }}>
              {/* Avatar Section */}
              <Box sx={{ mb: 3 }}>
                <Typography variant={{ xs: 'h6', sm: 'h6', md: 'h5' }} sx={{ fontWeight: 'bold', color: '#1e293b', mb: 2 }}>
                  Your AI Interviewer
                </Typography>
                
                <Box sx={{ 
                  position: 'relative',
                  width: '100%',
                  maxWidth: { xs: 280, sm: 320, md: 360 },
                  height: { xs: 200, sm: 220, md: 260 },
                  backgroundColor: '#1e293b',
                  borderRadius: 4,
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                  mb: 2
                }}>
                  {avatarLoading && (
                    <Box sx={{ 
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(30, 41, 59, 0.8)',
                      zIndex: 2
                    }}>
                      <CircularProgress sx={{ color: 'white', mr: 2 }} />
                      <Typography sx={{ color: 'white', fontSize: '1rem' }}>
                        Generating avatar...
                      </Typography>
                    </Box>
                  )}
                  
                  {/* Avatar Service Status */}
                  {avatarResponse && (
                    <Box sx={{ 
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      zIndex: 3
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
                  
                  {avatarError && (
                    <Box sx={{ 
                      textAlign: 'center',
                      color: 'white',
                      p: 3
                    }}>
                      <Typography variant="h6" sx={{ color: '#ef4444', mb: 2 }}>
                        Avatar Error
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#ef4444' }}>
                        {avatarError}
                      </Typography>
                    </Box>
                  )}
                  
                  {avatarVideoUrl && !avatarLoading ? (
                    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
                      <video
                        src={avatarVideoUrl}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        autoPlay
                        loop={false}
                        muted={false}
                        controls={false}
                        onEnded={() => {
                          setAvatarVideoPlayed(true);
                          setShowRepeatButton(true);
                          setAvatarFinishedSpeaking(true);
                          console.log('🎬 Avatar video ended, ready for next action');
                        }}
                        onError={(e) => {
                          console.error('Video playback error:', e);
                          setAvatarError('Failed to load avatar video');
                        }}
                      />
                      
                      {/* Live Video Controls Overlay */}
                      {liveVideoMode && (
                        <Box sx={{
                          position: 'absolute',
                          bottom: 20,
                          left: 20,
                          right: 20,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          background: 'rgba(0,0,0,0.7)',
                          padding: '12px 16px',
                          borderRadius: 2,
                          backdropFilter: 'blur(10px)'
                        }}>
                          {/* Left side - Avatar speaking indicator */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {isPlaying && (
                              <>
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
                              </>
                            )}
                          </Box>
                          
                          {/* Right side - Live video controls */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconButton
                              size="small"
                              sx={{
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                color: 'white',
                                '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' }
                              }}
                            >
                              <VolumeUp />
                            </IconButton>
                            
                            <IconButton
                              size="small"
                              sx={{
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                color: 'white',
                                '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' }
                              }}
                            >
                              <Fullscreen />
                            </IconButton>
                          </Box>
                        </Box>
                      )}
                      
                      {/* User Video Preview (Picture-in-Picture) */}
                      {liveVideoMode && showUserVideo && userVideoStream && (
                        <Box sx={{
                          position: 'absolute',
                          top: 20,
                          right: 20,
                          width: 200,
                          height: 150,
                          borderRadius: 2,
                          overflow: 'hidden',
                          border: '2px solid rgba(255,255,255,0.3)',
                          background: 'rgba(0,0,0,0.5)',
                          zIndex: 10
                        }}>
                          <video
                            ref={(video) => {
                              if (video && userVideoStream) {
                                video.srcObject = userVideoStream;
                              }
                            }}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                            autoPlay
                            muted
                            playsInline
                          />
                          
                          {/* User video controls */}
                          <Box sx={{
                            position: 'absolute',
                            bottom: 5,
                            left: 5,
                            right: 5,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <Typography variant="caption" sx={{ color: 'white', fontSize: '0.7rem' }}>
                              You
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => setShowUserVideo(false)}
                              sx={{
                                backgroundColor: 'rgba(0,0,0,0.5)',
                                color: 'white',
                                width: 20,
                                height: 20,
                                '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' }
                              }}
                            >
                              <Close sx={{ fontSize: 12 }} />
                            </IconButton>
                          </Box>
                        </Box>
                      )}
                      
                      {showRepeatButton && (
                        <Box sx={{
                          position: 'absolute',
                          bottom: 10,
                          right: 10,
                          zIndex: 3
                        }}>
                          <IconButton
                            onClick={() => {
                              const video = document.querySelector('video');
                              if (video) {
                                video.currentTime = 0;
                                video.play();
                                setShowRepeatButton(false);
                              }
                            }}
                            sx={{
                              backgroundColor: 'rgba(0,0,0,0.7)',
                              color: 'white',
                              '&:hover': {
                                backgroundColor: 'rgba(0,0,0,0.9)'
                              }
                            }}
                            size="small"
                          >
                            <PlayArrow sx={{ fontSize: 20 }} />
                          </IconButton>
                        </Box>
                      )}
                    </Box>
                  ) : !avatarLoading && !avatarError && (
                    <Box sx={{ 
                      textAlign: 'center',
                      color: 'white',
                      p: 3
                    }}>
                      <Avatar sx={{ 
                        width: { xs: 70, sm: 80, md: 100 }, 
                        height: { xs: 70, sm: 80, md: 100 }, 
                        backgroundColor: '#667eea',
                        mx: 'auto',
                        mb: 2
                      }}>
                        <Person sx={{ fontSize: { xs: 35, sm: 40, md: 50 } }} />
                      </Avatar>
                      <Typography variant="h6" sx={{ mb: 1 }}>
                        AI Interviewer
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        Your interviewer will appear here
                      </Typography>
                    </Box>
                  )}
                </Box>
                
                {(currentAvatarPhase || avatarSilent) && (
                  <Chip
                    label={
                      avatarSilent ? 'Listening to your response' :
                      currentAvatarPhase === 'welcome' ? 'Welcoming you' :
                      currentAvatarPhase === 'question' ? 'Asking question' :
                      currentAvatarPhase === 'acknowledgment' ? 'Processing response' :
                      currentAvatarPhase === 'results' ? 'Presenting results' : 'Ready'
                    }
                    sx={{ 
                      backgroundColor: avatarSilent ? '#10b981' : '#667eea',
                      color: 'white',
                      fontWeight: 'bold',
                      px: 2,
                      py: 1
                    }}
                  />
                )}
              </Box>

              {/* Response Mode Selection */}
              <Box sx={{ mt: 1 }}>
                <Typography variant={{ xs: 'body1', sm: 'h6', md: 'h6' }} sx={{ fontWeight: 'bold', mb: 1.5, color: '#1e293b' }}>
                  Response Mode
                </Typography>
                <Stack spacing={1.5}>
                  <Button
                    variant={responseMode === 'voice' ? 'contained' : 'outlined'}
                    onClick={() => setResponseMode('voice')}
                    startIcon={<Mic />}
                    fullWidth
                    disabled={!canUserRespond}
                    sx={{ 
                      py: { xs: 0.8, sm: 1, md: 1 },
                      fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
                      backgroundColor: responseMode === 'voice' ? '#667eea' : 'transparent',
                      borderColor: '#667eea',
                      color: responseMode === 'voice' ? 'white' : '#667eea',
                      '&:hover': {
                        backgroundColor: responseMode === 'voice' ? '#5a67d8' : 'rgba(102, 126, 234, 0.1)'
                      }
                    }}
                  >
                    Voice Response
                  </Button>
                  <Button
                    variant={responseMode === 'text' ? 'contained' : 'outlined'}
                    onClick={() => setResponseMode('text')}
                    startIcon={<Keyboard />}
                    fullWidth
                    disabled={!canUserRespond}
                    sx={{ 
                      py: { xs: 0.8, sm: 1, md: 1 },
                      fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
                      backgroundColor: responseMode === 'text' ? '#667eea' : 'transparent',
                      borderColor: '#667eea',
                      color: responseMode === 'text' ? 'white' : '#667eea',
                      '&:hover': {
                        backgroundColor: responseMode === 'text' ? '#5a67d8' : 'rgba(102, 126, 234, 0.1)'
                      }
                    }}
                  >
                    Text Response
                  </Button>
                </Stack>
              </Box>
            </Paper>
          </Grid>

          {/* Right Panel - Question & Response */}
          <Grid item xs={12} sm={6} md={6} lg={5} xl={5}>
              <Paper
                sx={{
                  p: 1.5,
                  height: '100%',
                  backgroundColor: 'white',
                  borderRadius: 4,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden'
                }}
              >
              {/* Interview Welcome */}
              {interviewPhase === 'welcome' && (
                <Fade in={true}>
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
                      Welcome to Your AI Interview
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
                      Get ready for a professional interview experience
                    </Typography>
                    <Box sx={{ mt: 3 }}>
                      <CircularProgress size={40} />
                    </Box>
                  </Box>
                </Fade>
              )}

              {/* Interview Briefing */}
              {interviewPhase === 'briefing' && (
                <Slide direction="up" in={true}>
                  <Box sx={{ py: 2 }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                      Interview Instructions
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2, fontSize: '0.9rem', lineHeight: 1.5 }}>
                      You'll be asked {session.questions.length} questions about your experience and skills. 
                      Take your time to provide thoughtful responses.
                    </Typography>
                    <Paper sx={{ p: 2, backgroundColor: '#f0f9ff', borderRadius: 2 }}>
                      <Typography variant="body2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold' }}>
                        <Lightbulb sx={{ color: 'orange', fontSize: 18 }} />
                        Pro Tips
                      </Typography>
                      <Stack spacing={0.6}>
                        {getTips().slice(0, 3).map((tip, index) => (
                          <Typography key={index} variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.8rem' }}>
                            <ArrowForward sx={{ fontSize: 12, color: 'primary.main' }} />
                            {tip}
                          </Typography>
                        ))}
                      </Stack>
                    </Paper>
                    <Button
                      variant="contained"
                      size="medium"
                      onClick={() => {
                        setCurrentQuestion(session.questions[0]);
                        setInterviewPhase('question');
                        setQuestionStartTime(new Date());
                        setAvatarVideoPlayed(false);
                        setShowRepeatButton(false);
                        setCanUserRespond(false); // Reset to wait for avatar to finish speaking
                      }}
                      sx={{
                        mt: 3,
                        px: 4,
                        py: 1.2,
                        fontSize: '1rem',
                        background: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)',
                        boxShadow: '0 3px 5px 2px rgba(76, 175, 30, .3)',
                      }}
                      startIcon={<ArrowForward />}
                    >
                      Start Interview
                    </Button>
                  </Box>
                </Slide>
              )}

              {/* Question Phase */}
              {(interviewPhase === 'question' || interviewPhase === 'recording') && currentQuestion && (
                <Fade in={true}>
                  <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {/* Question Display */}
                    <Box sx={{ mb: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#1e293b', fontSize: { xs: '0.8rem', sm: '0.85rem', md: '0.9rem' } }}>
                          Question {currentQuestionIndex + 1} of {session.questions.length}
                        </Typography>
                        <Chip
                          icon={<Timer />}
                          label={`${formatTime(Math.floor((Date.now() - (questionStartTime?.getTime() || 0)) / 1000))}`}
                          size="small"
                          sx={{ backgroundColor: '#667eea', color: 'white' }}
                        />
                      </Box>
                      
                      <Paper sx={{ 
                        p: 1, 
                        backgroundColor: '#f8fafc', 
                        borderRadius: 3,
                        border: '1px solid #e2e8f0'
                      }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 500, 
                            lineHeight: 1.3, 
                            color: '#1e293b',
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                            hyphens: 'auto',
                            whiteSpace: 'normal',
                            fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' },
                            maxWidth: '100%',
                            textAlign: 'left'
                          }}
                        >
                          {currentQuestion.text}
                        </Typography>
                      </Paper>
                    </Box>

                    {/* Response Area */}
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1.5, color: '#1e293b', fontSize: { xs: '0.8rem', sm: '0.85rem', md: '0.9rem' } }}>
                        Your Response
                      </Typography>

                      {/* Voice Response */}
                      {responseMode === 'voice' && (
                        <Box sx={{ textAlign: 'center' }}>
                          {/* Recording Status Indicator */}
                          {isRecording && (
                            <Box sx={{ 
                              mb: 2, 
                              p: 2, 
                              backgroundColor: '#fef2f2', 
                              borderRadius: 3, 
                              border: '2px solid #ef4444',
                              animation: 'recordingPulse 2s ease-in-out infinite'
                            }}>
                              <Typography variant="h6" sx={{ 
                                color: '#ef4444', 
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 1
                              }}>
                                🔴 LIVE RECORDING - {formatTime(recordingDuration)}
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#dc2626', mt: 0.5 }}>
                                Speak clearly into your microphone
                              </Typography>
                            </Box>
                          )}
                          <Paper
                            sx={{
                              p: 1.5,
                              backgroundColor: isRecording ? '#fef2f2' : '#f0f9ff',
                              border: `3px solid ${isRecording ? '#ef4444' : '#667eea'}`,
                              borderRadius: 4,
                              mb: 1.5,
                              boxShadow: isRecording ? '0 0 20px rgba(239, 68, 68, 0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
                              animation: isRecording ? 'recordingPulse 2s ease-in-out infinite' : 'none',
                              '@keyframes recordingPulse': {
                                '0%': { 
                                  boxShadow: '0 0 20px rgba(239, 68, 68, 0.3)',
                                  borderColor: '#ef4444'
                                },
                                '50%': { 
                                  boxShadow: '0 0 30px rgba(239, 68, 68, 0.6)',
                                  borderColor: '#dc2626'
                                },
                                '100%': { 
                                  boxShadow: '0 0 20px rgba(239, 68, 68, 0.3)',
                                  borderColor: '#ef4444'
                                }
                              }
                            }}
                          >
                            <IconButton
                              onClick={isRecording ? stopRecording : startRecording}
                              size="large"
                              disabled={loading || !canUserRespond}
                              sx={{
                                width: { xs: 50, sm: 55, md: 60 },
                                height: { xs: 50, sm: 55, md: 60 },
                                backgroundColor: isRecording ? '#ef4444' : loading ? '#94a3b8' : '#667eea',
                                color: 'white',
                                mb: 1.5,
                                animation: isRecording ? 'pulse 1.5s ease-in-out infinite' : 'none',
                                '@keyframes pulse': {
                                  '0%': { transform: 'scale(1)' },
                                  '50%': { transform: 'scale(1.05)' },
                                  '100%': { transform: 'scale(1)' }
                                },
                                '&:hover': {
                                  backgroundColor: isRecording ? '#dc2626' : loading ? '#94a3b8' : '#5a67d8'
                                },
                                '&:disabled': {
                                  backgroundColor: '#94a3b8',
                                  color: '#64748b'
                                }
                              }}
                            >
                              {loading ? (
                                <CircularProgress size={20} sx={{ color: 'white' }} />
                              ) : isRecording ? (
                                <Stop sx={{ fontSize: { xs: 25, sm: 28, md: 30 } }} />
                              ) : (
                                <Mic sx={{ fontSize: { xs: 25, sm: 28, md: 30 } }} />
                              )}
                            </IconButton>
                            
                            <Typography variant="body1" sx={{ 
                              fontWeight: 'bold', 
                              mb: 2, 
                              fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
                              color: isRecording ? '#ef4444' : '#1e293b',
                              textAlign: 'center'
                            }}>
                              {isRecording ? '🔴 RECORDING - Click RED Button to Stop' : '🎤 Click to Record Your Answer'}
                            </Typography>

                            {/* Large Stop Button when Recording */}
                            {isRecording && (
                              <Button
                                variant="contained"
                                size="large"
                                onClick={stopRecording}
                                sx={{
                                  mt: 2,
                                  px: 4,
                                  py: 2,
                                  fontSize: '1.2rem',
                                  fontWeight: 'bold',
                                  backgroundColor: '#ef4444',
                                  color: 'white',
                                  borderRadius: 3,
                                  boxShadow: '0 4px 20px rgba(239, 68, 68, 0.4)',
                                  animation: 'pulse 1.5s ease-in-out infinite',
                                  '&:hover': {
                                    backgroundColor: '#dc2626',
                                    boxShadow: '0 6px 25px rgba(239, 68, 68, 0.6)'
                                  }
                                }}
                                startIcon={<Stop sx={{ fontSize: 30 }} />}
                              >
                                STOP RECORDING
                              </Button>
                            )}

                            {recordingVolume > 0 && (
                              <Box sx={{ 
                                height: 12, 
                                backgroundColor: '#e2e8f0', 
                                borderRadius: 6, 
                                overflow: 'hidden', 
                                mb: 2,
                                maxWidth: 200,
                                mx: 'auto'
                              }}>
                                <Box
                                  sx={{
                                    height: '100%',
                                    width: `${(recordingVolume / 255) * 100}%`,
                                    background: 'linear-gradient(90deg, #667eea, #5a67d8)',
                                    transition: 'width 0.1s ease'
                                  }}
                                />
                              </Box>
                            )}

                            {transcript && (
                              <Paper sx={{ 
                                p: 3, 
                                backgroundColor: 'white', 
                                borderRadius: 3, 
                                mt: 3,
                                border: '1px solid #e2e8f0'
                              }}>
                                <Typography variant="body1" sx={{ fontStyle: 'italic', color: '#64748b' }}>
                                  "{transcript}"
                                </Typography>
                              </Paper>
                            )}
                          </Paper>
                        </Box>
                      )}

                      {/* Text Response */}
                      {responseMode === 'text' && (
                        <TextField
                          multiline
                          rows={4}
                          fullWidth
                          placeholder="Type your response here..."
                          value={textResponse}
                          onChange={(e) => setTextResponse(e.target.value)}
                          disabled={!canUserRespond}
                          sx={{
                            mb: 1.5,
                            '& .MuiOutlinedInput-root': {
                              backgroundColor: '#f8fafc',
                              borderRadius: 3,
                              fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' },
                              lineHeight: 1.4,
                              border: '1px solid #e2e8f0'
                            }
                          }}
                        />
                      )}

                      {/* Submit Button */}
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Button
                          variant="contained"
                          size="large"
                          onClick={processResponse}
                          disabled={(!transcript && !textResponse && !isRecording) || !canUserRespond}
                          sx={{
                            px: { xs: 4, sm: 5, md: 6 },
                            py: { xs: 1.5, sm: 1.8, md: 2 },
                            fontSize: { xs: '0.8rem', sm: '0.85rem', md: '0.9rem' },
                            backgroundColor: '#667eea',
                            borderRadius: 3,
                            '&:hover': {
                              backgroundColor: '#5a67d8'
                            },
                            '&:disabled': {
                              backgroundColor: '#cbd5e1',
                              color: '#94a3b8'
                            }
                          }}
                          startIcon={<Send />}
                        >
                          Submit Answer
                        </Button>
                      </Box>
                    </Box>
                  </Box>
                </Fade>
              )}

              {/* Processing Phase */}
              {interviewPhase === 'processing' && (
                <Fade in={true}>
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Box sx={{ position: 'relative', mb: 4 }}>
                      <CircularProgress size={100} thickness={3} />
                      <Box
                        sx={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          backgroundColor: '#4caf50',
                          borderRadius: '50%',
                          width: 40,
                          height: 40,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Psychology sx={{ color: 'white', fontSize: 24 }} />
                      </Box>
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2 }}>
                      Processing Your Response
                    </Typography>
                    <Typography variant="h6" sx={{ color: 'text.secondary' }}>
                      Our AI is analyzing your answer...
                    </Typography>
                  </Box>
                </Fade>
              )}

              {/* Completed Phase */}
              {interviewPhase === 'completed' && (
                <Fade in={true}>
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Box sx={{ mb: 4 }}>
                      <Avatar
                        sx={{
                          width: 120,
                          height: 120,
                          backgroundColor: '#4caf50',
                          color: 'white',
                          mx: 'auto',
                          mb: 3
                        }}
                      >
                        <CheckCircle sx={{ fontSize: 60 }} />
                      </Avatar>
                    </Box>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 3 }}>
                      Interview Completed!
                    </Typography>
                    <Typography variant="h6" sx={{ color: 'text.secondary', mb: 4 }}>
                      Thank you for completing the interview. Your responses are being analyzed.
                    </Typography>
                  </Box>
                </Fade>
              )}

              {/* Results Phase */}
              {interviewPhase === 'results' && finalResults && (
                <Fade in={true}>
                  <Box sx={{ py: 4 }}>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', textAlign: 'center', mb: 4 }}>
                      Interview Results
                    </Typography>
                    
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <Card sx={{ p: 3, backgroundColor: '#e8f5e8', borderRadius: 3 }}>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Star sx={{ color: 'orange' }} />
                            Overall Score: {finalResults.overallScore || 'N/A'}%
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={finalResults.overallScore || 0}
                            sx={{ height: 12, borderRadius: 6, mb: 2 }}
                          />
                        </Card>
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <Card sx={{ p: 3, backgroundColor: '#e3f2fd', borderRadius: 3 }}>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                            Questions Answered: {userResponses.length} / {session.questions.length}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Average response time: {finalResults.averageResponseTime || 'N/A'}
                          </Typography>
                        </Card>
                      </Grid>
                    </Grid>

                    {/* Recommendations */}
                    {finalResults.feedback && (
                      <Paper sx={{ p: 4, mt: 4, backgroundColor: '#f8f9fa', borderRadius: 3 }}>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
                          Recommendations
                        </Typography>
                        <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                          {finalResults.feedback}
                        </Typography>
                      </Paper>
                    )}

                    <Box sx={{ textAlign: 'center', mt: 6 }}>
                      <Button
                        variant="contained"
                        size="large"
                        onClick={() => {
                          onComplete(finalResults);
                          handleClose();
                        }}
                        sx={{
                          px: 6,
                          py: 2,
                          fontSize: '1.2rem',
                          background: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)',
                          boxShadow: '0 3px 5px 2px rgba(76, 175, 30, .3)',
                        }}
                        startIcon={<CheckCircle />}
                      >
                        Finish Interview
                      </Button>
                    </Box>
                  </Box>
                </Fade>
              )}
            </Paper>

            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ borderRadius: 3, mt: 2 }}>
                {error}
              </Alert>
            )}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default DesktopInterviewInterface;

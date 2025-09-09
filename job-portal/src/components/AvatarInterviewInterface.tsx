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
import { speechToTextService, SpeechToTextResult } from '../services/speechToTextService';
import { interviewStorageService } from '../services/interviewStorageService';
import StreamingAvatarVideo from './StreamingAvatarVideo';

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
  currentAvatarText: string; // Text for streaming avatar
  textResponse: string;
  processingVideo: boolean;
  sessionStarted: boolean;
  showInstructions: boolean;
  isProcessingAudio: boolean;
  recordingStartTime: number;
  currentTranscript: string;
  awaitingNextQuestion: boolean;
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

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [state, setState] = useState<InterviewState>({
    currentQuestionIndex: -1, // -1 means showing welcome message
    responses: [],
    timeRemaining: session.totalDuration,
    isRecording: false,
    isPlaying: false,
    currentAvatarText: `Hello and welcome to your AI interview for ${session.jobTitle}. I'm your virtual interviewer and I'll be conducting this interview today. Please make sure you're in a quiet environment and your microphone is working properly. We'll start with a few questions to assess your qualifications for this role. Are you ready to begin?`,
    textResponse: '',
    processingVideo: false,
    sessionStarted: false,
    showInstructions: true,
    isProcessingAudio: false,
    recordingStartTime: 0,
    currentTranscript: '',
    awaitingNextQuestion: false
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
      // No need to set processingVideo since streaming avatar shows immediately
      console.log('🎬 Interview initialized with streaming avatar');
      
      // The welcome text is already set in the initial state
      // Streaming avatar will start immediately when component renders
      
    } catch (error) {
      console.error('Failed to initialize interview:', error);
      setError('Failed to load interview. Please try again.');
    }
  };

  const startInterview = async () => {
    const firstQuestion = session.questions[0];
    
    setState(prev => ({
      ...prev,
      sessionStarted: true,
      showInstructions: false,
      currentQuestionIndex: 0,
      currentAvatarText: firstQuestion.text
    }));

    console.log('🎯 Starting interview with first question:', firstQuestion.text);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100 // High quality audio
        } 
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus' // High quality codec
      });
      
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleRecordingComplete(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      
      setState(prev => ({ 
        ...prev, 
        isRecording: true,
        recordingStartTime: Date.now(),
        currentTranscript: ''
      }));
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      setError('Failed to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.stop();
      setState(prev => ({ 
        ...prev, 
        isRecording: false,
        isProcessingAudio: true 
      }));
    }
  };

  const handleRecordingComplete = async (audioBlob: Blob) => {
    const currentQuestion = session.questions[state.currentQuestionIndex];
    if (!currentQuestion) return;

    try {
      console.log('🎙️ Processing recorded audio...', {
        size: audioBlob.size,
        type: audioBlob.type,
        questionIndex: state.currentQuestionIndex
      });

      // Calculate recording duration
      const recordingDuration = (Date.now() - state.recordingStartTime) / 1000;

      // Convert speech to text using AI
      const transcriptionResult: SpeechToTextResult = await speechToTextService.transcribeAudio(audioBlob, {
        language: 'en-US',
        enableWordTimestamps: true,
        enhancedModel: true
      });

      console.log('✅ Audio transcription completed:', transcriptionResult);

      // Save recording to storage service
      try {
        await interviewStorageService.saveInterviewRecording(
          session.id,
          currentQuestion.id,
          currentQuestion.question,
          audioBlob,
          recordingDuration,
          transcriptionResult.transcript,
          transcriptionResult.confidence || 0.8
        );
        console.log('✅ Recording saved to storage');
      } catch (storageError) {
        console.error('❌ Failed to save recording:', storageError);
        // Continue with interview even if storage fails
      }

      // Update state with transcript
      setState(prev => ({ 
        ...prev, 
        currentTranscript: transcriptionResult.transcript,
        isProcessingAudio: false
      }));

      // Create response with transcribed text
      const response: InterviewResponse = {
        questionId: currentQuestion.id,
        question: currentQuestion.question,
        answer: transcriptionResult.transcript || '[Audio response - transcription unavailable]',
        audioBlob,
        timestamp: new Date(),
        duration: recordingDuration,
        confidence: transcriptionResult.confidence || 0.8
      };

      // Submit response and get AI feedback
      await submitResponse(response);

    } catch (error) {
      console.error('❌ Audio processing failed:', error);
      
      // Fallback: create response without transcription
      const fallbackResponse: InterviewResponse = {
        questionId: currentQuestion.id,
        question: currentQuestion.question,
        answer: '[Audio response recorded - processing error]',
        audioBlob,
        timestamp: new Date(),
        duration: (Date.now() - state.recordingStartTime) / 1000,
        confidence: 0.5
      };

      setState(prev => ({ ...prev, isProcessingAudio: false }));
      await submitResponse(fallbackResponse);
    }
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
        processingVideo: true,
        awaitingNextQuestion: true
      }));

      // Submit response to backend for AI analysis and feedback
      console.log('📤 Submitting response for AI analysis...', {
        question: response.question.substring(0, 50),
        answerLength: response.answer.length,
        confidence: response.confidence
      });

      await modernInterviewService.submitResponse(session.id, response);

      // Check if this was the last question
      const isLastQuestion = state.currentQuestionIndex === session.questions.length - 1;

      if (isLastQuestion) {
        // Show completion message with streaming avatar
        const completionText = "Thank you for your response. That concludes our interview. I'm now processing your answers and will provide you with detailed feedback shortly. Please wait while I analyze your responses...";
        setState(prev => ({
          ...prev,
          currentAvatarText: completionText,
          processingVideo: false,
          awaitingNextQuestion: false
        }));
        
        // Complete interview and get AI feedback
        setTimeout(async () => {
          try {
            console.log('🤖 Getting AI feedback for completed interview...');
            await completeInterview([...state.responses, response]);
          } catch (error) {
            console.error('Failed to complete interview:', error);
            setError('Interview completed but failed to get AI feedback.');
          }
        }, 4000);
        
      } else {
        // Show acknowledgment message with AI processing feedback
        const processingText = `Thank you for that response. I'm analyzing your answer and preparing personalized feedback. Let me move to the next question...`;
        setState(prev => ({
          ...prev,
          currentAvatarText: processingText,
          processingVideo: false
        }));
        
        // Automatically move to next question after AI processing
        setTimeout(() => {
          const nextQuestionIndex = state.currentQuestionIndex + 1;
          const nextQuestion = session.questions[nextQuestionIndex];
          
          console.log('➡️ Moving to next question automatically:', {
            nextIndex: nextQuestionIndex,
            questionText: nextQuestion.text.substring(0, 50)
          });
          
          setState(prev => ({
            ...prev,
            currentQuestionIndex: nextQuestionIndex,
            currentAvatarText: nextQuestion.text,
            awaitingNextQuestion: false,
            currentTranscript: '' // Clear previous transcript
          }));
        }, 4500); // Slightly longer to show processing message
      }

    } catch (error) {
      console.error('Failed to submit response:', error);
      setError('Failed to submit response. Please try again.');
      setState(prev => ({ 
        ...prev, 
        processingVideo: false,
        awaitingNextQuestion: false,
        isProcessingAudio: false
      }));
    }
  };

  const completeInterview = async (allResponses: InterviewResponse[]) => {
    try {
      const result = await modernInterviewService.completeInterview(session.id, allResponses);
      
      // Save complete interview to history with recording
      try {
        const totalDuration = allResponses.reduce((total, response) => total + response.duration, 0);
        await interviewStorageService.saveInterviewToHistory(
          session.id,
          session.jobTitle,
          'Practice Interview', // Default company for practice interviews
          allResponses.length,
          totalDuration,
          result.score,
          result.overallFeedback,
          'completed',
          'european_woman', // European woman avatar
          'practice'
        );
        console.log('✅ Complete interview saved to history');
      } catch (historyError) {
        console.error('❌ Failed to save interview to history:', historyError);
        // Continue even if history save fails
      }
      
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
                  <StreamingAvatarVideo
                    text={state.currentAvatarText}
                    avatar="european_woman"
                    emotion="happy"
                    language="en"
                    autoPlay={true}
                    onVideoStart={() => {
                      console.log('🎬 Avatar video started');
                      setState(prev => ({ ...prev, isPlaying: true }));
                    }}
                    onVideoEnd={() => {
                      console.log('🎬 Avatar video ended');
                      setState(prev => ({ ...prev, isPlaying: false }));
                    }}
                    onError={(error) => {
                      console.error('Avatar video error:', error);
                      setError(`Avatar error: ${error}`);
                    }}
                  />
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

            {/* Audio Processing Status */}
            {(state.isProcessingAudio || state.awaitingNextQuestion) && (
              <Box sx={{ mb: 3 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    background: 'rgba(33, 150, 243, 0.1)',
                    border: '1px solid rgba(33, 150, 243, 0.3)'
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <CircularProgress size={24} color="primary" />
                    <Typography variant="body2">
                      {state.isProcessingAudio 
                        ? '🎙️ Processing your audio response...' 
                        : '🤖 AI is analyzing your response and preparing next question...'}
                    </Typography>
                  </Stack>
                </Paper>
              </Box>
            )}

            {/* Current Transcript Display */}
            {state.currentTranscript && (
              <Box sx={{ mb: 3 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    background: 'rgba(76, 175, 80, 0.1)',
                    border: '1px solid rgba(76, 175, 80, 0.3)'
                  }}
                >
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    Your Response (Transcribed):
                  </Typography>
                  <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                    "{state.currentTranscript}"
                  </Typography>
                </Paper>
              </Box>
            )}

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
                        disabled={state.isProcessingAudio || state.awaitingNextQuestion}
                        sx={{ 
                          color: state.isRecording ? 'white' : 'rgba(255,255,255,0.9)',
                          minWidth: '160px'
                        }}
                      >
                        {state.isProcessingAudio 
                          ? 'Processing...' 
                          : state.isRecording 
                            ? 'Stop Recording' 
                            : 'Start Recording'}
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
                        disabled={!state.textResponse.trim() || state.isProcessingAudio || state.awaitingNextQuestion}
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
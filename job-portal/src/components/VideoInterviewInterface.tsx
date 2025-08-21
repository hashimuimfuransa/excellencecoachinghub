import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Stack,
  Chip,
  Alert,
  AlertTitle,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  alpha
} from '@mui/material';
import {
  Videocam,
  VideocamOff,
  Mic,
  MicOff,
  PlayArrow,
  Pause,
  Stop,
  SkipNext,
  Replay,
  VolumeUp,
  Timer,
  Psychology,
  CheckCircle,
  Star,
  TrendingUp,
  Lightbulb,
  EmojiEvents,
  Close,
  RecordVoiceOver,
  Feedback
} from '@mui/icons-material';

interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  skills: string[];
  requirements: string[];
  responsibilities: string[];
}

interface InterviewQuestion {
  _id: string;
  question: string;
  type: 'behavioral' | 'technical' | 'situational' | 'general';
  expectedDuration: number; // in seconds
  followUpQuestions?: string[];
  tips?: string[];
}

interface InterviewSession {
  _id: string;
  job: Job;
  questions: InterviewQuestion[];
  totalDuration: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

interface InterviewResult {
  _id: string;
  session: InterviewSession;
  answers: Record<string, any>;
  scores: {
    communication: number;
    confidence: number;
    technical: number;
    clarity: number;
    relevance: number;
  };
  overallScore: number;
  feedback: string[];
  recommendations: string[];
  completedAt: string;
  timeSpent: number;
}

interface VideoInterviewInterfaceProps {
  session: InterviewSession;
  onComplete: (result: InterviewResult) => void;
  onClose: () => void;
}

const VideoInterviewInterface: React.FC<VideoInterviewInterfaceProps> = ({
  session,
  onComplete,
  onClose
}) => {
  const theme = useTheme();
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Interview state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [totalTimeSpent, setTotalTimeSpent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  
  // Media state
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  
  // UI state
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [interviewCompleted, setInterviewCompleted] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [result, setResult] = useState<InterviewResult | null>(null);

  const currentQuestion = session.questions[currentQuestionIndex];

  useEffect(() => {
    initializeMedia();
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording && !isPaused && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleNextQuestion();
            return 0;
          }
          return prev - 1;
        });
        setTotalTimeSpent(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, isPaused, timeRemaining]);

  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      setMediaStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing media devices:', error);
    }
  };

  const startInterview = () => {
    setInterviewStarted(true);
    setCurrentQuestionIndex(0);
    setTimeRemaining(currentQuestion.expectedDuration);
    startRecording();
  };

  const startRecording = () => {
    if (mediaStream) {
      recordedChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(mediaStream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Save answer for current question
      const recordedBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      setAnswers(prev => ({
        ...prev,
        [currentQuestion._id]: {
          videoBlob: recordedBlob,
          duration: currentQuestion.expectedDuration - timeRemaining,
          timestamp: new Date().toISOString()
        }
      }));
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
      } else {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
      }
    }
  };

  const handleNextQuestion = () => {
    stopRecording();
    
    if (currentQuestionIndex < session.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setTimeRemaining(session.questions[currentQuestionIndex + 1].expectedDuration);
      setTimeout(() => startRecording(), 1000);
    } else {
      completeInterview();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      stopRecording();
      setCurrentQuestionIndex(prev => prev - 1);
      setTimeRemaining(session.questions[currentQuestionIndex - 1].expectedDuration);
      setTimeout(() => startRecording(), 1000);
    }
  };

  const completeInterview = async () => {
    stopRecording();
    setInterviewCompleted(true);
    
    // Simulate analysis and scoring
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const mockResult: InterviewResult = {
      _id: Date.now().toString(),
      session,
      answers,
      scores: {
        communication: Math.floor(Math.random() * 30) + 70,
        confidence: Math.floor(Math.random() * 30) + 70,
        technical: Math.floor(Math.random() * 30) + 70,
        clarity: Math.floor(Math.random() * 30) + 70,
        relevance: Math.floor(Math.random() * 30) + 70
      },
      overallScore: Math.floor(Math.random() * 30) + 70,
      feedback: [
        'Strong communication skills demonstrated throughout the interview',
        'Good technical knowledge relevant to the position',
        'Clear and concise responses to behavioral questions',
        'Showed enthusiasm and genuine interest in the role'
      ],
      recommendations: [
        'Practice more technical scenarios specific to the role',
        'Work on providing more specific examples in behavioral questions',
        'Consider preparing questions about company culture',
        'Continue developing leadership experience'
      ],
      completedAt: new Date().toISOString(),
      timeSpent: totalTimeSpent
    };
    
    setResult(mockResult);
  };

  const toggleVideo = () => {
    if (mediaStream) {
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (mediaStream) {
      const audioTrack = mediaStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getQuestionTypeColor = (type: string) => {
    switch (type) {
      case 'behavioral': return '#4caf50';
      case 'technical': return '#2196f3';
      case 'situational': return '#ff9800';
      case 'general': return '#9c27b0';
      default: return '#757575';
    }
  };

  if (interviewCompleted && result) {
    return (
      <Dialog open fullScreen>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h4" fontWeight="bold">
            Interview Complete!
          </Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ maxWidth: 1200, mx: 'auto', py: 4 }}>
            <Alert severity="success" sx={{ mb: 4 }}>
              <AlertTitle>Congratulations!</AlertTitle>
              You've successfully completed the interview for {session.job.title} at {session.job.company}.
            </Alert>

            <Grid container spacing={4}>
              {/* Overall Score */}
              <Grid item xs={12} md={4}>
                <Card sx={{ textAlign: 'center', p: 3 }}>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      mx: 'auto',
                      mb: 2,
                      bgcolor: 'primary.main',
                      fontSize: '2rem'
                    }}
                  >
                    {result.overallScore}%
                  </Avatar>
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    Overall Score
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Based on communication, technical skills, and interview performance
                  </Typography>
                </Card>
              </Grid>

              {/* Score Breakdown */}
              <Grid item xs={12} md={8}>
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Performance Breakdown
                  </Typography>
                  <Stack spacing={2}>
                    {Object.entries(result.scores).map(([skill, score]) => (
                      <Box key={skill}>
                        <Box display="flex" justifyContent="space-between" mb={0.5}>
                          <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                            {skill.replace(/([A-Z])/g, ' $1').trim()}
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {score}%
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={score} 
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                    ))}
                  </Stack>
                </Card>
              </Grid>

              {/* Feedback */}
              <Grid item xs={12} md={6}>
                <Card sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom color="success.main">
                    Positive Feedback
                  </Typography>
                  <List dense>
                    {result.feedback.map((feedback, index) => (
                      <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 24 }}>
                          <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={feedback}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Card>
              </Grid>

              {/* Recommendations */}
              <Grid item xs={12} md={6}>
                <Card sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom color="primary.main">
                    Recommendations
                  </Typography>
                  <List dense>
                    {result.recommendations.map((recommendation, index) => (
                      <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 24 }}>
                          <Lightbulb sx={{ fontSize: 16, color: 'primary.main' }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={recommendation}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Card>
              </Grid>

              {/* Interview Stats */}
              <Grid item xs={12}>
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Interview Statistics
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={3}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="primary.main" fontWeight="bold">
                          {session.questions.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Questions Answered
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="success.main" fontWeight="bold">
                          {formatTime(result.timeSpent)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Time
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="warning.main" fontWeight="bold">
                          {session.difficulty}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Difficulty Level
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="info.main" fontWeight="bold">
                          {new Date(result.completedAt).toLocaleDateString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Completed On
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={onClose} size="large">
            Close
          </Button>
          <Button 
            variant="contained" 
            onClick={() => onComplete(result)}
            size="large"
            startIcon={<EmojiEvents />}
          >
            Save Results
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open fullScreen>
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Paper sx={{ p: 2, borderRadius: 0 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h6" fontWeight="bold">
                {session.job.title} Interview
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {session.job.company} • Question {currentQuestionIndex + 1} of {session.questions.length}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={2}>
              {interviewStarted && (
                <Chip
                  icon={<Timer />}
                  label={formatTime(timeRemaining)}
                  color={timeRemaining < 30 ? 'error' : 'primary'}
                  variant="outlined"
                />
              )}
              <IconButton onClick={onClose} color="error">
                <Close />
              </IconButton>
            </Box>
          </Box>
        </Paper>

        {/* Main Content */}
        <Box sx={{ flex: 1, display: 'flex' }}>
          {/* Video Panel */}
          <Box sx={{ flex: 1, p: 3, display: 'flex', flexDirection: 'column' }}>
            <Paper sx={{ flex: 1, p: 2, display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ flex: 1, position: 'relative', mb: 2 }}>
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: 8,
                    backgroundColor: '#000'
                  }}
                />
                {isRecording && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      display: 'flex',
                      alignItems: 'center',
                      bgcolor: 'error.main',
                      color: 'white',
                      px: 2,
                      py: 1,
                      borderRadius: 2
                    }}
                  >
                    <RecordVoiceOver sx={{ mr: 1, fontSize: 16 }} />
                    <Typography variant="body2">Recording</Typography>
                  </Box>
                )}
              </Box>

              {/* Video Controls */}
              <Box display="flex" justifyContent="center" gap={2}>
                <IconButton
                  onClick={toggleVideo}
                  color={videoEnabled ? 'primary' : 'error'}
                  sx={{ bgcolor: alpha(videoEnabled ? theme.palette.primary.main : theme.palette.error.main, 0.1) }}
                >
                  {videoEnabled ? <Videocam /> : <VideocamOff />}
                </IconButton>
                <IconButton
                  onClick={toggleAudio}
                  color={audioEnabled ? 'primary' : 'error'}
                  sx={{ bgcolor: alpha(audioEnabled ? theme.palette.primary.main : theme.palette.error.main, 0.1) }}
                >
                  {audioEnabled ? <Mic /> : <MicOff />}
                </IconButton>
                {interviewStarted && (
                  <>
                    <IconButton
                      onClick={pauseRecording}
                      color="warning"
                      disabled={!isRecording}
                    >
                      {isPaused ? <PlayArrow /> : <Pause />}
                    </IconButton>
                    <IconButton
                      onClick={handleNextQuestion}
                      color="success"
                      disabled={!isRecording}
                    >
                      <SkipNext />
                    </IconButton>
                  </>
                )}
              </Box>
            </Paper>
          </Box>

          {/* Question Panel */}
          <Box sx={{ width: 400, p: 3, borderLeft: 1, borderColor: 'divider' }}>
            {!interviewStarted ? (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Psychology sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  Ready to Start?
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  This interview will consist of {session.questions.length} questions. 
                  Take your time and answer as naturally as possible.
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<PlayArrow />}
                  onClick={startInterview}
                  fullWidth
                >
                  Start Interview
                </Button>
              </Paper>
            ) : (
              <Stack spacing={3}>
                {/* Progress */}
                <Paper sx={{ p: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Progress
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={(currentQuestionIndex / session.questions.length) * 100}
                    sx={{ height: 8, borderRadius: 4, mb: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {currentQuestionIndex + 1} of {session.questions.length} questions
                  </Typography>
                </Paper>

                {/* Current Question */}
                <Paper sx={{ p: 3 }}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Chip
                      label={currentQuestion.type}
                      size="small"
                      sx={{ 
                        bgcolor: alpha(getQuestionTypeColor(currentQuestion.type), 0.1),
                        color: getQuestionTypeColor(currentQuestion.type)
                      }}
                    />
                  </Box>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    {currentQuestion.question}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Suggested time: {formatTime(currentQuestion.expectedDuration)}
                  </Typography>
                </Paper>

                {/* Tips */}
                {currentQuestion.tips && (
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                      💡 Tips for this question:
                    </Typography>
                    <List dense>
                      {currentQuestion.tips.map((tip, index) => (
                        <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 20 }}>
                            <Star sx={{ fontSize: 14, color: 'warning.main' }} />
                          </ListItemIcon>
                          <ListItemText 
                            primary={tip}
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                )}

                {/* Navigation */}
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="outlined"
                    onClick={handlePreviousQuestion}
                    disabled={currentQuestionIndex === 0}
                    fullWidth
                  >
                    Previous
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleNextQuestion}
                    fullWidth
                  >
                    {currentQuestionIndex === session.questions.length - 1 ? 'Finish' : 'Next'}
                  </Button>
                </Stack>
              </Stack>
            )}
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
};

export default VideoInterviewInterface;
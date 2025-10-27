import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Stack,
  Paper,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  AlertTitle,
  Skeleton,
  useTheme,
  alpha,
  Tabs,
  Tab,
  Badge,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  Divider,
  LinearProgress,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import ProfileAccessGuard from '../components/ProfileAccessGuard';
import InterviewInterface from '../components/InterviewInterface';
import QuickTestInterviewInterface from '../components/QuickTestInterviewInterface';
import JobInterviewInterface from '../components/JobInterviewInterface';
import EnhancedInterviewInterface from '../components/EnhancedInterviewInterface';
import { userService } from '../services/userService';
import {
  Psychology,
  PlayArrow,
  Stop,
  Mic,
  MicOff,
  Videocam,
  VideocamOff,
  Assessment,
  Star,
  CheckCircle,
  Schedule,
  Person,
  Business,
  TrendingUp,
  Lightbulb,
  School,
  EmojiEvents,
  Refresh,
  Download,
  Share,
  Close,
  Info,
  Warning,
  ExpandMore,
  Timer,
  QuestionAnswer,
  Feedback,
  Analytics,
  Speed,
  VolumeUp,
  Pause,
  SkipNext,
  Replay,
  RecordVoiceOver,
  SmartToy,
  AutoAwesome,
  Visibility,
  RocketLaunch
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { aiInterviewService, AIInterview, InterviewType } from '../services/aiInterviewService';
import { jobService } from '../services/jobService';
import { interviewService, InterviewSession, InterviewResult, InterviewQuestion } from '../services/interviewService';
import { optimizedQuickInterviewService, QuickInterviewSession, QuickInterviewResult } from '../services/optimizedQuickInterviewService';
import { paidInterviewService, PaidInterviewSession, PaidInterviewResult } from '../services/paidInterviewService';
import { paymentService, PaymentMethod, PaymentResponse } from '../services/paymentService';
import { avatarTalkService } from '../services/avatarTalkService';

// Interfaces
interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  skills: string[];
  requirements: string[];
  responsibilities: string[];
  experienceLevel: string;
  jobType: string;
}

interface PsychometricTestResult {
  _id: string;
  test: any;
  user: string;
  job?: Job;
  answers: Record<string, any>;
  scores: Record<string, number>;
  overallScore: number;
  interpretation: string;
  recommendations: string[];
  timeSpent: number;
  createdAt: string;
}

interface InterviewSession {
  _id: string;
  title: string;
  category: string;
  difficulty: string;
  duration: number;
  questions: number;
  description: string;
}

interface InterviewResult {
  sessionId: string;
  overallScore: number;
  scores: {
    communication: number;
    technical: number;
  };
}

interface MockQuestion {
  expectedDuration: number;
}

const interviewTypes = [
  { value: InterviewType.GENERAL, label: 'General Interview', description: 'Basic interview questions about your background and motivation' },
  { value: InterviewType.TECHNICAL, label: 'Technical Interview', description: 'Technical questions related to your field and skills' },
  { value: InterviewType.BEHAVIORAL, label: 'Behavioral Interview', description: 'Situational questions about your past experiences and behavior' },
  { value: InterviewType.CASE_STUDY, label: 'Case Study Interview', description: 'Problem-solving scenarios and analytical thinking questions' }
];

// Mock data

const mockQuestions: MockQuestion[] = [
  { expectedDuration: 120 },
  { expectedDuration: 180 },
  { expectedDuration: 150 }
];

const AIInterviewsPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Get data from psychometric test navigation
  const locationState = location.state as {
    selectedJob?: Job;
    completedPsychometricTest?: boolean;
    testResult?: PsychometricTestResult;
  } | null;
  
  const [interviews, setInterviews] = useState<AIInterview[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [interviewSessions, setInterviewSessions] = useState<InterviewSession[]>([]);
  const [interviewResults, setInterviewResults] = useState<InterviewResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [generatingSession, setGeneratingSession] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [freshUserData, setFreshUserData] = useState<any>(null);
  const [tabValue, setTabValue] = useState(0);
  const [selectedType, setSelectedType] = useState<InterviewType | 'all'>('all');
  const [selectedJob, setSelectedJob] = useState<Job | null>(locationState?.selectedJob || null);
  const [psychometricTestResult, setPsychometricTestResult] = useState<PsychometricTestResult | null>(locationState?.testResult || null);
  const [jobSelectionOpen, setJobSelectionOpen] = useState(!locationState?.selectedJob);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  
  // Interview session states
  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const [selectedInterviewType, setSelectedInterviewType] = useState<InterviewType>(InterviewType.GENERAL);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<AIInterview | null>(null);
  
  // Interview session states
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSession, setSelectedSession] = useState<InterviewSession | null>(null);
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(120);
  const [isRecording, setIsRecording] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [sessionResult, setSessionResult] = useState<any>(null);
  
  // Quick Interview (Free 3-minute test) states
  const [quickInterviewOpen, setQuickInterviewOpen] = useState(false);
  const [quickSession, setQuickSession] = useState<QuickInterviewSession | null>(null);
  const [quickInterviewLoading, setQuickInterviewLoading] = useState(false);
  const [quickInterviewResults, setQuickInterviewResults] = useState<QuickInterviewResult[]>([]);
  
  // Paid Interview states
  const [paidInterviewOpen, setPaidInterviewOpen] = useState(false);
  const [paidSession, setPaidSession] = useState<PaidInterviewSession | null>(null);
  const [paidInterviewLoading, setPaidInterviewLoading] = useState(false);
  const [paidInterviewResults, setPaidInterviewResults] = useState<PaidInterviewResult[]>([]);
  
  // Interview Interface states
  const [interviewInterfaceOpen, setInterviewInterfaceOpen] = useState(false);
  const [activeInterviewSession, setActiveInterviewSession] = useState<QuickInterviewSession | null>(null);
  
  // Job-specific interview interface states
  const [jobInterviewInterfaceOpen, setJobInterviewInterfaceOpen] = useState(false);
  const [activeJobInterviewSession, setActiveJobInterviewSession] = useState<QuickInterviewSession | null>(null);
  
  // Quick results dialog states
  const [quickResultDialogOpen, setQuickResultDialogOpen] = useState(false);
  const [selectedQuickResult, setSelectedQuickResult] = useState<QuickInterviewResult | null>(null);

  useEffect(() => {
    fetchInterviews();
    fetchJobs();
    fetchInterviewResults();
    if (user?._id) {
      fetchFreshUserData();
    }
    
    // Show welcome message if coming from psychometric test
    if (locationState?.completedPsychometricTest && locationState?.selectedJob) {
      console.log('User completed psychometric test for:', locationState.selectedJob.title);
    }
  }, [user, locationState]);

  useEffect(() => {
    if (selectedJob) {
      generateInterviewSession();
    }
  }, [selectedJob, selectedDifficulty]);

  const fetchFreshUserData = async () => {
    try {
      if (!user?._id) return;
      
      console.log('🔍 AIInterviews fetching fresh user data for:', user._id);
      const freshUser = await userService.getUserProfile(user._id);
      console.log('📋 AIInterviews received fresh user data:', freshUser);
      setFreshUserData(freshUser);
    } catch (error) {
      console.error('❌ Error fetching fresh user data:', error);
      // Fallback to auth user data
      setFreshUserData(user);
    }
  };

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await aiInterviewService.getUserInterviews();
      setInterviews(data);
    } catch (error) {
      console.error('Error fetching interviews:', error);
      setError('Failed to load interviews. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    try {
      setLoadingJobs(true);
      const response = await jobService.getJobs({ status: 'active' });
      setJobs(response.data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setJobs([]);
    } finally {
      setLoadingJobs(false);
    }
  };

  const fetchInterviewResults = async () => {
    try {
      // Fetch traditional AI interview results
      const results = await interviewService.getUserInterviewResults();
      setInterviewResults(results);
      
      // Fetch quick interview results from database
      try {
        // Quick results are now stored locally only
        const localResults = JSON.parse(localStorage.getItem('interview_results') || '[]');
        setQuickInterviewResults(localResults);
        
        // Also fetch from backend database
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        if (token) {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/quick-interviews/my-results`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              // Merge with local results, giving preference to backend data
              const combinedResults = [...data.data];
              // Add any local-only results that aren't in backend
              quickResults.forEach(localResult => {
                if (!combinedResults.find(r => r.sessionId === localResult.sessionId)) {
                  combinedResults.push(localResult);
                }
              });
              setQuickInterviewResults(combinedResults);
              console.log('📊 Fetched', combinedResults.length, 'quick interview results from database');
            }
          }
        }
      } catch (quickError) {
        console.error('Error fetching quick interview results:', quickError);
        // Fallback to local results only
        const localResults = JSON.parse(localStorage.getItem('interview_results') || '[]');
        setQuickInterviewResults(localResults);
      }
    } catch (error) {
      console.error('Error fetching interview results:', error);
    }
  };

  const generateInterviewSession = async () => {
    if (!selectedJob) return;
    
    try {
      setGeneratingSession(true);
      // Pass the full job object to avoid API call issues
      const session = await interviewService.generateInterviewSessionWithJob(selectedJob, selectedDifficulty);
      setInterviewSessions([session]);
    } catch (error) {
      console.error('Error generating interview session:', error);
      setError('Failed to generate interview session');
    } finally {
      setGeneratingSession(false);
    }
  };

  const preGenerateJobInterview = async (job: Job) => {
    try {
      console.log('🎯 Pre-generating interview questions for:', job.title);
      setGeneratingSession(true);
      
      // Create optimized job interview session with pre-generated questions
      const jobSession = await optimizedQuickInterviewService.createJobInterviewSession(
        job,
        selectedDifficulty.toLowerCase() as 'easy' | 'medium' | 'hard',
        user?._id || ''
      );
      
      // Store the pre-generated session
      setActiveJobInterviewSession(jobSession);
      
      console.log('✅ Interview questions pre-generated and ready!');
      setError('✅ Interview questions generated! Ready to start your interview.');
      
    } catch (error) {
      console.error('Failed to pre-generate interview:', error);
      setError('Failed to generate interview questions. Please try again.');
    } finally {
      setGeneratingSession(false);
    }
  };

  const handleJobSelection = async (job: Job) => {
    console.log('🎯 Job selected:', job);
    
    // Validate job object
    if (!job) {
      console.error('❌ No job provided to handleJobSelection');
      setError('Invalid job selection');
      return;
    }
    
    if (!job.title || !job.company) {
      console.error('❌ Job missing required fields:', { title: job.title, company: job.company });
      setError('Job is missing required information (title or company)');
      return;
    }
    
    console.log('✅ Valid job selected:', { 
      id: job._id, 
      title: job.title, 
      company: job.company 
    });
    
    setSelectedJob(job);
    setJobSelectionOpen(false);
    
    // Pre-generate interview session with questions when job is selected
    await preGenerateJobInterview(job);
  };

  const handleStartInterview = async (session: InterviewSession) => {
    try {
      // Use pre-generated interview session if available
      if (activeJobInterviewSession) {
        console.log('✅ Using pre-generated interview session');
        setJobInterviewInterfaceOpen(true);
        return;
      }
      
      // Fallback: if no pre-generated session, create one now
      setGeneratingSession(true);
      const jobToUse = selectedJob || session.job;
      
      if (!jobToUse) {
        setError('No job information available for this interview');
        return;
      }
      
      const jobSession = await optimizedQuickInterviewService.createJobInterviewSession(
        jobToUse,
        session.difficulty as 'easy' | 'medium' | 'hard' || 'medium',
        user?._id || ''
      );
      
      setActiveJobInterviewSession(jobSession);
      setJobInterviewInterfaceOpen(true);
      
      console.log('✅ Fallback job interview session created');
    } catch (error) {
      console.error('Failed to start job interview:', error);
      setError('Failed to start the interview. Please try again.');
    } finally {
      setGeneratingSession(false);
    }
  };

  const handleStartSession = (session: InterviewSession) => {
    setSelectedSession(session);
    setSessionDialogOpen(true);
  };

  const handleBeginInterview = () => {
    setInterviewStarted(true);
    setCurrentQuestion(0);
    setTimeRemaining(selectedSession?.questions[0]?.expectedDuration || 120);
  };

  const handleNextQuestion = () => {
    if (selectedSession && currentQuestion < selectedSession.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setTimeRemaining(selectedSession.questions[currentQuestion + 1]?.expectedDuration || 120);
      setIsRecording(false);
    } else {
      handleCompleteSession();
    }
  };

  const handleCompleteSession = async () => {
    if (!selectedSession) return;
    
    try {
      // Simulate session completion and scoring
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Analyze the interview performance
      const analysis = await interviewService.analyzeInterviewPerformance({}, selectedSession.questions);
      
      const result: InterviewResult = {
        _id: Date.now().toString(),
        session: selectedSession,
        user: user!._id,
        answers: {}, // In real implementation, this would contain recorded answers
        scores: analysis.scores,
        overallScore: analysis.overallScore,
        feedback: analysis.feedback,
        recommendations: analysis.recommendations,
        completedAt: new Date().toISOString(),
        timeSpent: selectedSession.totalDuration
      };
      
      // Save the result
      const savedResult = await interviewService.saveInterviewResult(result);
      
      setSessionResult(savedResult);
      setInterviewResults(prev => [...prev, savedResult]);
      setSessionCompleted(true);
    } catch (error) {
      console.error('Error completing session:', error);
    }
  };

  const handleCloseSession = () => {
    setSessionDialogOpen(false);
    setInterviewStarted(false);
    setSessionCompleted(false);
    setSelectedSession(null);
    setSessionResult(null);
    setCurrentQuestion(0);
    setTimeRemaining(0);
    setIsRecording(false);
  };

  // Quick Interview (Free 3-minute test) handlers
  const handleStartQuickInterview = async () => {
    if (!user?._id) return;
    
    try {
      setQuickInterviewLoading(true);
      const session = await optimizedQuickInterviewService.createTestInterviewSession(user._id);
      setQuickSession(session);
      setQuickInterviewOpen(true);
    } catch (error) {
      console.error('Error starting quick interview:', error);
      setError('Failed to start quick interview test');
    } finally {
      setQuickInterviewLoading(false);
    }
  };

  const handleCloseQuickInterview = () => {
    setQuickInterviewOpen(false);
    setQuickSession(null);
  };

  // Paid Interview handlers
  const handleStartPaidInterview = async (jobId: string, difficulty: 'Easy' | 'Medium' | 'Hard') => {
    if (!user?._id) return;
    
    try {
      setPaidInterviewLoading(true);
      const session = await paidInterviewService.createJobSpecificSession(jobId, user._id, difficulty);
      setPaidSession(session);
      setPaidInterviewOpen(true);
    } catch (error) {
      console.error('Error starting paid interview:', error);
      setError('Failed to start paid interview');
    } finally {
      setPaidInterviewLoading(false);
    }
  };

  const handleClosePaidInterview = () => {
    setPaidInterviewOpen(false);
    setPaidSession(null);
  };

  // Interview Interface handlers
  const handleInterviewComplete = (result: QuickInterviewResult) => {
    console.log('Interview completed with result:', result);
    setQuickInterviewResults(prev => [...prev, result]);
    
    // Show success message
    setError(`🎉 Interview completed! Overall Score: ${result.overallScore}%. Communication: ${result.scores.communication}%, Confidence: ${result.scores.confidence}%, Professionalism: ${result.scores.professionalism}%`);
    
    // Close interface and clear session only after completion
    setInterviewInterfaceOpen(false);
    setActiveInterviewSession(null);
  };

  const handleCloseInterviewInterface = () => {
    // Only close the interface, keep session if interview is still in progress
    if (activeInterviewSession?.status === 'completed') {
      setActiveInterviewSession(null);
    }
    setInterviewInterfaceOpen(false);
  };

  // Job-specific interview completion handler
  const handleJobInterviewComplete = (result: QuickInterviewResult) => {
    console.log('Job-specific interview completed:', result);
    
    // Convert the result to InterviewResult format for the traditional interview results
    const interviewResult: InterviewResult = {
      _id: result.sessionId,
      session: {
        _id: result.sessionId,
        title: `${selectedJob?.title || 'Job'} Interview Practice`,
        description: result.feedback.join(' '),
        job: selectedJob || {
          _id: 'default',
          title: activeJobInterviewSession?.jobTitle || 'Practice',
          company: activeJobInterviewSession?.jobCompany || 'Company'
        },
        questions: activeJobInterviewSession?.questions.map(q => ({
          _id: q.id,
          question: q.text,
          type: q.type,
          expectedDuration: q.expectedDuration,
          tips: []
        })) || [],
        totalDuration: result.actualDuration,
        difficulty: result.sessionId.includes('easy') ? 'Easy' : result.sessionId.includes('hard') ? 'Hard' : 'Medium',
        type: 'mixed',
        createdAt: result.completedAt
      },
      user: user?._id || '',
      answers: {},
      scores: result.scores,
      overallScore: result.overallScore,
      feedback: result.feedback,
      recommendations: result.recommendations,
      completedAt: result.completedAt,
      timeSpent: result.actualDuration
    };
    
    setInterviewResults(prev => [interviewResult, ...prev]);
    setJobInterviewInterfaceOpen(false);
    setActiveJobInterviewSession(null);
    
    // Show success message
    setError(`🎉 ${selectedJob?.title || 'Job'} interview completed! Overall Score: ${result.overallScore}%. Check your results below.`);
  };

  const handleCloseJobInterviewInterface = () => {
    if (activeJobInterviewSession?.status === 'completed') {
      setActiveJobInterviewSession(null);
    }
    setJobInterviewInterfaceOpen(false);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'technical':
        return '#2196f3';
      case 'behavioral':
        return '#4caf50';
      case 'case-study':
        return '#ff9800';
      case 'general':
        return '#9c27b0';
      default:
        return '#757575';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'success';
      case 'Medium':
        return 'warning';
      case 'Hard':
        return 'error';
      default:
        return 'default';
    }
  };



  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };



  // Legacy InterviewDialog - now replaced by InterviewInterface component
  const InterviewDialog = () => {
    // This component is now deprecated in favor of the InterviewInterface
    // All job-specific interviews now use the advanced avatar interface
    return null;
  };

  const LegacyInterviewDialog = () => {
    if (!selectedSession) return null;

    const progress = selectedSession.questions.length > 0 ? ((currentQuestion + 1) / selectedSession.questions.length) * 100 : 0;
    const currentQ = selectedSession.questions[currentQuestion];

    return (
      <Dialog 
        open={sessionDialogOpen} 
        onClose={handleCloseSession}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { minHeight: '80vh' }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h5" fontWeight="bold">
              {selectedSession.title || `${selectedJob?.title || 'Interview'} Practice Session`}
            </Typography>
            {interviewStarted && !sessionCompleted && (
              <Typography variant="body2" color="text.secondary">
                Question {currentQuestion + 1} of {selectedSession.questions.length}
              </Typography>
            )}
          </Box>
          <IconButton onClick={handleCloseSession}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          {!interviewStarted && !sessionCompleted && (
            <Box>
              <Alert severity="info" sx={{ mb: 3 }}>
                <AlertTitle>Interview Practice Session</AlertTitle>
                This interview will analyze your responses and provide detailed feedback. 
                Make sure you're in a quiet environment and have a good internet connection.
              </Alert>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Session Details
                    </Typography>
                    <Stack spacing={2}>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2">Duration:</Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {Math.floor(selectedSession.totalDuration / 60)} minutes
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2">Questions:</Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {selectedSession.questions.length}
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2">Job Role:</Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {selectedSession.job?.title || selectedJob?.title || 'General Interview Practice'}
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2">Difficulty:</Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {selectedSession.difficulty}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      What to Expect
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemIcon>
                          <SmartToy color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="AI-powered analysis"
                          secondary="Real-time feedback on your responses"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <Analytics color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Detailed scoring"
                          secondary="Communication, technical, and confidence metrics"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <Lightbulb color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Personalized tips"
                          secondary="Actionable recommendations for improvement"
                        />
                      </ListItem>
                    </List>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}

          {interviewStarted && !sessionCompleted && currentQ && (
            <Box>
              <Box mb={3}>
                <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4 }} />
                <Box display="flex" justifyContent="space-between" mt={1}>
                  <Typography variant="body2" color="text.secondary">
                    Progress: {Math.round(progress)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Time remaining: {formatTime(timeRemaining)}
                  </Typography>
                </Box>
              </Box>

              <Paper sx={{ p: 4, mb: 3, textAlign: 'center' }}>
                <Typography variant="h5" gutterBottom>
                  {currentQ.question}
                </Typography>
                
                <Box display="flex" justifyContent="center" alignItems="center" my={4}>
                  <Box
                    sx={{
                      width: 120,
                      height: 120,
                      borderRadius: '50%',
                      bgcolor: isRecording ? 'error.main' : 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'scale(1.05)'
                      }
                    }}
                    onClick={() => setIsRecording(!isRecording)}
                  >
                    {isRecording ? (
                      <Stop sx={{ fontSize: 48, color: 'white' }} />
                    ) : (
                      <Mic sx={{ fontSize: 48, color: 'white' }} />
                    )}
                  </Box>
                </Box>

                <Typography variant="body1" color="text.secondary" gutterBottom>
                  {isRecording ? 'Recording your response...' : 'Click to start recording your answer'}
                </Typography>

                {currentQ.tips && (
                  <Accordion sx={{ mt: 3 }}>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography variant="subtitle2">💡 Tips for this question</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List dense>
                        {currentQ.tips.map((tip, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              <Lightbulb fontSize="small" color="primary" />
                            </ListItemIcon>
                            <ListItemText primary={tip} />
                          </ListItem>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                )}
              </Paper>
            </Box>
          )}

          {sessionCompleted && sessionResult && (
            <Box>
              <Alert severity="success" sx={{ mb: 3 }}>
                <AlertTitle>Interview Completed!</AlertTitle>
                Great job! Here's your detailed performance analysis.
              </Alert>

              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="h2" color="primary.main" fontWeight="bold">
                      {sessionResult.overallScore}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Overall Score
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={8}>
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Detailed Scores
                    </Typography>
                    <Grid container spacing={2}>
                      {Object.entries(sessionResult.scores).map(([key, value]) => (
                        <Grid item xs={6} key={key}>
                          <Box>
                            <Box display="flex" justifyContent="space-between" mb={0.5}>
                              <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                                {key}
                              </Typography>
                              <Typography variant="body2" fontWeight="medium">
                                {value}%
                              </Typography>
                            </Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={value} 
                              sx={{ height: 6, borderRadius: 3 }}
                            />
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom color="success.main">
                      Your Strengths
                    </Typography>
                    <List dense>
                      {sessionResult.strengths.map((strength, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <CheckCircle fontSize="small" color="success" />
                          </ListItemIcon>
                          <ListItemText primary={strength} />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom color="warning.main">
                      Areas for Improvement
                    </Typography>
                    <List dense>
                      {sessionResult.improvements.map((improvement, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <TrendingUp fontSize="small" color="warning" />
                          </ListItemIcon>
                          <ListItemText primary={improvement} />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom color="primary.main">
                      AI Recommendations
                    </Typography>
                    <List dense>
                      {sessionResult.recommendations.map((recommendation, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <AutoAwesome fontSize="small" color="primary" />
                          </ListItemIcon>
                          <ListItemText primary={recommendation} />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Detailed Feedback
                    </Typography>
                    <List dense>
                      {sessionResult.feedback.map((feedback, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <Feedback fontSize="small" color="info" />
                          </ListItemIcon>
                          <ListItemText primary={feedback} />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          {!interviewStarted && !sessionCompleted && (
            <>
              <Button onClick={handleCloseSession}>Cancel</Button>
              <Button variant="contained" onClick={handleBeginInterview} startIcon={<PlayArrow />}>
                Start Interview
              </Button>
            </>
          )}

          {interviewStarted && !sessionCompleted && (
            <>
              <Button onClick={handleCloseSession} color="error">
                End Interview
              </Button>
              <Button 
                variant="contained" 
                onClick={handleNextQuestion}
                startIcon={currentQuestion === mockQuestions.length - 1 ? <CheckCircle /> : <SkipNext />}
              >
                {currentQuestion === mockQuestions.length - 1 ? 'Complete Interview' : 'Next Question'}
              </Button>
            </>
          )}

          {sessionCompleted && (
            <>
              <Button onClick={handleCloseSession}>Close</Button>
              <Button variant="outlined" startIcon={<Download />}>
                Download Report
              </Button>
              <Button variant="outlined" startIcon={<Share />}>
                Share Results
              </Button>
              <Button variant="contained" onClick={() => {
                handleCloseSession();
                handleStartSession(selectedSession);
              }}>
                Practice Again
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    );
  };

  // Quick Interview Dialog (Free 3-minute test)
  const QuickInterviewDialog = () => {
    if (!quickSession) return null;

    return (
      <Dialog 
        open={quickInterviewOpen} 
        onClose={handleCloseQuickInterview}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { minHeight: '60vh' }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h5" fontWeight="bold">
              🎯 FREE 3-Minute Interview Test
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Practice with AI Avatar • Get Instant Feedback
            </Typography>
          </Box>
          <IconButton onClick={handleCloseQuickInterview}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            <AlertTitle>Welcome to Your Free Interview Test!</AlertTitle>
            This is a 3-minute practice session with our AI avatar interviewer. You'll be asked 3 general interview questions 
            and receive instant feedback on your communication style, confidence, and professional presentation.
          </Alert>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, bgcolor: 'grey.50' }}>
                <Typography variant="h6" gutterBottom color="primary">
                  🤖 What to Expect
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="AI avatar will ask you questions" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="3 general interview questions" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Approximately 3 minutes total" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Instant feedback and scoring" />
                  </ListItem>
                </List>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, bgcolor: 'success.50' }}>
                <Typography variant="h6" gutterBottom color="success.main">
                  💡 Tips for Success
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <Star color="success" />
                    </ListItemIcon>
                    <ListItemText primary="Maintain eye contact with camera" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Star color="success" />
                    </ListItemIcon>
                    <ListItemText primary="Speak clearly and confidently" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Star color="success" />
                    </ListItemIcon>
                    <ListItemText primary="Keep responses concise" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Star color="success" />
                    </ListItemIcon>
                    <ListItemText primary="Show enthusiasm and positivity" />
                  </ListItem>
                </List>
              </Paper>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, p: 2, bgcolor: 'warning.50', borderRadius: 2 }}>
            <Typography variant="body2" color="warning.main" fontWeight="bold">
              📝 Note: This is a free demonstration of our interview system. 
              For job-specific interview practice with detailed analytics, select a job position and access our premium features.
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={handleCloseQuickInterview}
            variant="outlined"
          >
            Maybe Later
          </Button>
          <Button
            variant="contained"
            startIcon={quickInterviewLoading ? <CircularProgress size={20} color="inherit" /> : <RocketLaunch />}
            disabled={quickInterviewLoading}
            onClick={async () => {
              try {
                setQuickInterviewLoading(true);
                if (quickSession) {
                  const startedSession = await optimizedQuickInterviewService.startSession(quickSession.id);
                  console.log('Quick interview started:', startedSession);
                  
                  // Close the quick interview dialog
                  handleCloseQuickInterview();
                  
                  // Open the interview interface
                  setActiveInterviewSession(startedSession);
                  setInterviewInterfaceOpen(true);
                }
              } catch (error) {
                console.error('Error starting quick interview:', error);
                setError(`Failed to start interview session: ${error.message}`);
              } finally {
                setQuickInterviewLoading(false);
              }
            }}
            size="large"
            sx={{ 
              px: 4,
              background: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)',
              boxShadow: '0 3px 5px 2px rgba(76, 175, 80, .3)',
            }}
          >
            {quickInterviewLoading ? 'Starting Interview...' : 'Start Interview Now'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Job Selection Dialog
  const JobSelectionDialog = () => (
    <Dialog 
      open={jobSelectionOpen} 
      onClose={() => setJobSelectionOpen(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Typography variant="h5" fontWeight="bold">
          Select a Job for Interview Practice
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Choose a job position to practice interviews tailored to the role requirements
        </Typography>
      </DialogTitle>
      <DialogContent>
        {loadingJobs ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={2}>
            {jobs.map((job) => (
              <Grid item xs={12} sm={6} key={job._id}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: theme.shadows[4]
                    }
                  }}
                  onClick={() => handleJobSelection(job)}
                >
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Business sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6" fontWeight="bold">
                        {job.title}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {job.company} • {job.location}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {job.description.substring(0, 100)}...
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {job.skills.slice(0, 3).map((skill, index) => (
                        <Chip key={index} label={skill} size="small" />
                      ))}
                      {job.skills.length > 3 && (
                        <Chip label={`+${job.skills.length - 3} more`} size="small" variant="outlined" />
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setJobSelectionOpen(false)}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );

  if (!user) {
    return null;
  }

  return (
    <ProfileAccessGuard user={freshUserData || user} feature="aiInterviews">
      <Container maxWidth="xl">
        <Box mb={4}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box>
              <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
                Smart Interview Practice
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Practice with intelligent interviews and get instant feedback to improve your skills
              </Typography>
            </Box>
            {!selectedJob && (
              <Button
                variant="contained"
                size="large"
                startIcon={<Business />}
                onClick={() => setJobSelectionOpen(true)}
                sx={{ 
                  px: 4, 
                  py: 2,
                  background: 'linear-gradient(45deg, #2196f3 30%, #21cbf3 90%)',
                  boxShadow: '0 3px 5px 2px rgba(33, 150, 243, .3)',
                }}
              >
                Select Job
              </Button>
            )}
          </Box>
          
          {/* Selected Job & Psychometric Test Results */}
          {selectedJob && (
            <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)' }}>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={8}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Business sx={{ mr: 2, color: 'primary.main', fontSize: 32 }} />
                    <Box>
                      <Typography variant="h5" fontWeight="bold">
                        {selectedJob.title}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        {selectedJob.company} • {selectedJob.location}
                      </Typography>
                    </Box>
                  </Box>
                  {psychometricTestResult && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                      <AlertTitle>Psychometric Assessment Completed!</AlertTitle>
                      Overall Score: {psychometricTestResult.overallScore}% - Ready for interview practice
                    </Alert>
                  )}
                </Grid>
                <Grid item xs={12} md={4}>
                  <Stack spacing={2}>
                    <Button
                      variant="outlined"
                      startIcon={<Business />}
                      onClick={() => setJobSelectionOpen(true)}
                      fullWidth
                    >
                      Change Job
                    </Button>
                    {psychometricTestResult && (
                      <Button
                        variant="contained"
                        startIcon={<Psychology />}
                        onClick={() => navigate('/app/psychometric-tests')}
                        fullWidth
                      >
                        View Test Results
                      </Button>
                    )}
                  </Stack>
                </Grid>
              </Grid>
            </Paper>
          )}
        </Box>

        {/* FREE 3-Minute Test Interview Section */}
        <Paper sx={{ 
          p: 4, 
          mb: 4, 
          background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
          color: 'white',
          borderRadius: 3
        }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Box>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar
                    sx={{ 
                      width: 64, 
                      height: 64, 
                      mr: 3,
                      bgcolor: 'rgba(255,255,255,0.2)',
                      fontSize: '2rem'
                    }}
                  >
                    🎯
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>
                      FREE 3-Minute Interview Test
                    </Typography>
                    <Typography variant="h6" sx={{ opacity: 0.9 }}>
                      Practice with AI-Powered Avatar • No Job Selection Required
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body1" sx={{ opacity: 0.8, mb: 2 }}>
                  Test our interview system for FREE! Get instant feedback on your interview skills with our AI-powered avatar interviewer. 
                  Perfect for practicing your introduction, communication style, and confidence.
                </Typography>
                <Stack direction="row" spacing={2} mb={2}>
                  <Chip 
                    label="100% Free" 
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.2)', 
                      color: 'white',
                      fontWeight: 'bold'
                    }} 
                  />
                  <Chip 
                    label="3 Minutes" 
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.2)', 
                      color: 'white',
                      fontWeight: 'bold'
                    }} 
                  />
                  <Chip 
                    label="AI Avatar" 
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.2)', 
                      color: 'white',
                      fontWeight: 'bold'
                    }} 
                  />
                  <Chip 
                    label="Instant Feedback" 
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.2)', 
                      color: 'white',
                      fontWeight: 'bold'
                    }} 
                  />
                </Stack>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Stack spacing={2} alignItems="center">
                <Button
                  variant="contained"
                  size="large"
                  startIcon={quickInterviewLoading ? <CircularProgress size={20} color="inherit" /> : <PlayArrow />}
                  disabled={quickInterviewLoading}
                  onClick={handleStartQuickInterview}
                  sx={{ 
                    bgcolor: 'white', 
                    color: 'primary.main',
                    px: 4,
                    py: 2,
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    borderRadius: 3,
                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                    '&:hover': { 
                      bgcolor: 'grey.100',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(0,0,0,0.3)'
                    },
                    transition: 'all 0.3s'
                  }}
                  fullWidth
                >
                  {quickInterviewLoading ? 'Preparing...' : 'Start Free Test'}
                </Button>
                <Typography variant="body2" sx={{ opacity: 0.8, textAlign: 'center' }}>
                  No registration required • Available 24/7
                </Typography>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

      {/* Stats Summary */}
      {interviewResults.length > 0 && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Your Progress
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="primary.main" fontWeight="bold">
                  {interviewResults.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Interviews Completed
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="success.main" fontWeight="bold">
                  {interviewResults.length > 0 ? Math.round(interviewResults.reduce((acc, result) => acc + result.overallScore, 0) / interviewResults.length) : 0}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Average Score
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="warning.main" fontWeight="bold">
                  {interviewResults.length > 0 ? Math.round(interviewResults.reduce((acc, result) => acc + result.scores.communication, 0) / interviewResults.length) : 0}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Communication Score
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="info.main" fontWeight="bold">
                  {interviewResults.length > 0 ? Math.round(interviewResults.reduce((acc, result) => acc + result.scores.technical, 0) / interviewResults.length) : 0}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Technical Score
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Filter Interview Sessions
        </Typography>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                label="Category"
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <MenuItem value="all">All Categories</MenuItem>
                <MenuItem value="technical">Technical</MenuItem>
                <MenuItem value="behavioral">Behavioral</MenuItem>
                <MenuItem value="case-study">Case Study</MenuItem>
                <MenuItem value="general">General</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <InputLabel>Difficulty</InputLabel>
              <Select
                value={selectedDifficulty}
                label="Difficulty"
                onChange={(e) => setSelectedDifficulty(e.target.value as 'Easy' | 'Medium' | 'Hard')}
              >
                <MenuItem value="Easy">Easy</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="Hard">Hard</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => {
                setSelectedCategory('all');
                setSelectedDifficulty('Medium');
              }}
            >
              Reset to Medium
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ mb: 4 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            label={
              <Box display="flex" alignItems="center">
                <Psychology sx={{ mr: 1 }} />
                All Sessions
                <Badge badgeContent={interviewSessions.length} color="primary" sx={{ ml: 1 }} />
              </Box>
            } 
          />
          <Tab 
            label={
              <Box display="flex" alignItems="center">
                <Assessment sx={{ mr: 1 }} />
                My Results
                <Badge badgeContent={interviewResults.length} color="success" sx={{ ml: 1 }} />
              </Box>
            } 
          />
          <Tab 
            label={
              <Box display="flex" alignItems="center">
                🎯
                <Typography sx={{ ml: 1, mr: 1 }}>Free Tests</Typography>
                <Badge badgeContent={quickInterviewResults.length} color="success" sx={{ ml: 1 }} />
              </Box>
            } 
          />
        </Tabs>
      </Paper>

      {/* Content */}
      {tabValue === 0 && (
        <Box>
          {!selectedJob ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Business sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Select a Job to Start Interview Practice
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Choose a job position to generate personalized interview questions based on the role requirements.
              </Typography>
              <Button
                variant="contained"
                onClick={() => setJobSelectionOpen(true)}
                startIcon={<Business />}
                size="large"
              >
                Select Job Position
              </Button>
            </Paper>
          ) : generatingSession ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <CircularProgress size={60} sx={{ mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Generating Interview Questions...
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Creating personalized questions for {selectedJob.title} at {selectedJob.company}
              </Typography>
            </Paper>
          ) : interviewSessions.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Psychology sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Interview Sessions Available
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Try selecting a different job or difficulty level.
              </Typography>
              <Button
                variant="contained"
                onClick={() => setJobSelectionOpen(true)}
                startIcon={<Business />}
              >
                Select Different Job
              </Button>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {interviewSessions.map((session) => (
                <Grid item xs={12} key={session._id}>
                  <Card sx={{ 
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: theme.shadows[4]
                    }
                  }}>
                    <CardContent sx={{ p: 4 }}>
                      <Grid container spacing={3} alignItems="center">
                        <Grid item xs={12} md={8}>
                          <Box display="flex" alignItems="center" mb={2}>
                            <Avatar
                              sx={{ 
                                width: 56, 
                                height: 56, 
                                mr: 3,
                                bgcolor: 'primary.main'
                              }}
                            >
                              <Psychology sx={{ fontSize: 28 }} />
                            </Avatar>
                            <Box>
                              <Typography variant="h5" fontWeight="bold" gutterBottom>
                                {session.title}
                              </Typography>
                              <Typography variant="body1" color="text.secondary" gutterBottom>
                                {session.description}
                              </Typography>
                              <Stack direction="row" spacing={2} mt={1}>
                                <Chip 
                                  label={`${session.questions.length} Questions`}
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                />
                                <Chip 
                                  label={`${Math.floor(session.totalDuration / 60)} Minutes`}
                                  size="small"
                                  color="secondary"
                                  variant="outlined"
                                />
                                <Chip 
                                  label={session.difficulty}
                                  size="small"
                                  color={session.difficulty === 'Easy' ? 'success' : session.difficulty === 'Medium' ? 'warning' : 'error'}
                                  variant="outlined"
                                />
                              </Stack>
                            </Box>
                          </Box>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Stack spacing={2}>
                            <Button
                              variant="contained"
                              size="large"
                              startIcon={paidInterviewLoading ? <CircularProgress size={20} color="inherit" /> : <PlayArrow />}
                              disabled={paidInterviewLoading}
                              onClick={() => handleStartInterview(session)}
                              fullWidth
                              sx={{ 
                                py: 1.5,
                                background: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)',
                                boxShadow: '0 3px 5px 2px rgba(76, 175, 80, .3)',
                              }}
                            >
                              {paidInterviewLoading ? 'Starting...' : 'Start Interview'}
                            </Button>
                            <Typography variant="body2" color="text.secondary" textAlign="center">
                              Estimated time: {Math.floor(session.totalDuration / 60)} minutes
                            </Typography>
                          </Stack>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {tabValue === 1 && (
        <Box>
          {interviewResults.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Assessment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No interview results yet
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Complete your first interview to see detailed performance analytics.
              </Typography>
              <Button
                variant="contained"
                onClick={() => setTabValue(0)}
                startIcon={<PlayArrow />}
              >
                Start Your First Interview
              </Button>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {interviewResults.map((result) => (
                <Grid item xs={12} key={result._id}>
                  <Card>
                    <CardContent>
                      <Grid container spacing={3} alignItems="center">
                        <Grid item xs={12} sm={6}>
                          <Box display="flex" alignItems="center">
                            <Avatar
                              sx={{ 
                                width: 48, 
                                height: 48, 
                                mr: 2,
                                bgcolor: alpha(getCategoryColor(result.session.type), 0.1)
                              }}
                            >
                              <Psychology sx={{ color: getCategoryColor(result.session.type) }} />
                            </Avatar>
                            <Box>
                              <Typography variant="h6" fontWeight="bold">
                                {result.session.title}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Completed {new Date(result.completedAt).toLocaleDateString()}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {result.session.job?.title || 'General Practice'} at {result.session.job?.company || 'Interview Training'}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <Box textAlign="center">
                            <Typography variant="h4" color="primary.main" fontWeight="bold">
                              {result.overallScore}%
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Overall Score
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <Stack spacing={1}>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<Visibility />}
                              fullWidth
                            >
                              View Details
                            </Button>
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<Refresh />}
                              fullWidth
                              onClick={() => handleStartInterview(result.session)}
                            >
                              Practice Again
                            </Button>
                          </Stack>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {tabValue === 2 && (
        <Box>
          {quickInterviewResults.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Box sx={{ mb: 2, fontSize: '4rem' }}>🎯</Box>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No free interview tests completed yet
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Take your first free 3-minute interview test to see how our AI avatar interviewer works and get instant feedback.
              </Typography>
              <Button
                variant="contained"
                onClick={handleStartQuickInterview}
                startIcon={quickInterviewLoading ? <CircularProgress size={20} color="inherit" /> : <PlayArrow />}
                disabled={quickInterviewLoading}
                size="large"
                sx={{ 
                  background: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)',
                  boxShadow: '0 3px 5px 2px rgba(76, 175, 80, .3)',
                }}
              >
                {quickInterviewLoading ? 'Preparing Test...' : 'Take Free Test Now'}
              </Button>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {quickInterviewResults.map((result) => (
                <Grid item xs={12} key={result.sessionId}>
                  <Card>
                    <CardContent>
                      <Grid container spacing={3} alignItems="center">
                        <Grid item xs={12} sm={6}>
                          <Box display="flex" alignItems="center">
                            <Avatar
                              sx={{ 
                                width: 48, 
                                height: 48, 
                                mr: 2,
                                bgcolor: 'success.light'
                              }}
                            >
                              🎯
                            </Avatar>
                            <Box>
                              <Typography variant="h6" fontWeight="bold">
                                Free 3-Minute Interview Test
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Completed {new Date(result.completedAt).toLocaleDateString()}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Duration: {Math.floor(result.actualDuration / 60)}m {result.actualDuration % 60}s
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <Box textAlign="center">
                            <Typography variant="h4" color="success.main" fontWeight="bold">
                              {result.overallScore}%
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Overall Score
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <Stack spacing={1}>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<Visibility />}
                              fullWidth
                              onClick={() => {
                                setSelectedQuickResult(result);
                                setQuickResultDialogOpen(true);
                              }}
                            >
                              View Results
                            </Button>
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={quickInterviewLoading ? <CircularProgress size={16} color="inherit" /> : <Refresh />}
                              disabled={quickInterviewLoading}
                              fullWidth
                              onClick={handleStartQuickInterview}
                              sx={{ 
                                background: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)'
                              }}
                            >
                              {quickInterviewLoading ? 'Preparing...' : 'Take Another Test'}
                            </Button>
                          </Stack>
                        </Grid>
                      </Grid>
                      
                      {/* Quick feedback preview */}
                      <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <strong>Key Strengths:</strong>
                        </Typography>
                        <Typography variant="body2">
                          {result.strengths.slice(0, 2).join(', ')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mt: 1 }}>
                          <strong>Improvement Areas:</strong>
                        </Typography>
                        <Typography variant="body2">
                          {result.improvements.slice(0, 2).join(', ')}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      <QuickInterviewDialog />
      <JobSelectionDialog />
      <InterviewDialog />
      
      {/* Quick Test Interview Interface */}
      {activeInterviewSession && activeInterviewSession.isTestInterview && (
        <QuickTestInterviewInterface
          key={`quick-test-${activeInterviewSession.id}`}
          open={interviewInterfaceOpen}
          onClose={handleCloseInterviewInterface}
          session={activeInterviewSession}
          onComplete={handleInterviewComplete}
        />
      )}

      {/* Job-Specific Interview Interface */}
      {activeJobInterviewSession && (
        <JobInterviewInterface
          key={`job-interview-${activeJobInterviewSession.id}`}
          open={jobInterviewInterfaceOpen}
          onClose={handleCloseJobInterviewInterface}
          session={activeJobInterviewSession}
          onComplete={handleJobInterviewComplete}
        />
      )}

      {/* Enhanced Interview Interface (Fallback) */}
      {activeInterviewSession && !activeInterviewSession.isTestInterview && !activeJobInterviewSession && (
        <EnhancedInterviewInterface
          key={`enhanced-interview-${activeInterviewSession.id}`}
          open={interviewInterfaceOpen}
          onClose={handleCloseInterviewInterface}
          session={activeInterviewSession}
          onComplete={handleInterviewComplete}
        />
      )}

      {/* Quick Interview Results Details Dialog */}
      <Dialog
        open={quickResultDialogOpen}
        onClose={() => setQuickResultDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'rgba(0,0,0,0.1)', 
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Box display="flex" alignItems="center">
            <Assessment sx={{ mr: 2, fontSize: 32 }} />
            <Box>
              <Typography variant="h5" fontWeight="bold">
                Detailed Interview Results
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Free 3-Minute Test • {selectedQuickResult ? new Date(selectedQuickResult.completedAt).toLocaleDateString() : ''}
              </Typography>
            </Box>
          </Box>
          <IconButton 
            onClick={() => setQuickResultDialogOpen(false)}
            sx={{ color: 'white' }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ p: 0 }}>
          {selectedQuickResult && (
            <Box p={4}>
              {/* Overall Score */}
              <Box textAlign="center" mb={4}>
                <Typography variant="h2" fontWeight="bold" sx={{ 
                  background: 'linear-gradient(45deg, #4caf50, #66bb6a)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  {selectedQuickResult.overallScore}%
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9 }}>
                  Overall Performance Score
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.7, mt: 1 }}>
                  Duration: {Math.floor(selectedQuickResult.actualDuration / 60)}m {selectedQuickResult.actualDuration % 60}s
                </Typography>
              </Box>

              {/* Score Breakdown */}
              <Grid container spacing={3} mb={4}>
                {Object.entries(selectedQuickResult.scores).map(([category, score]) => (
                  <Grid item xs={6} sm={4} key={category}>
                    <Paper sx={{ 
                      p: 2, 
                      textAlign: 'center',
                      background: 'rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.2)'
                    }}>
                      <Typography variant="h4" color="#4caf50" fontWeight="bold">
                        {score}%
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        textTransform: 'capitalize', 
                        color: 'rgba(255,255,255,0.9)' 
                      }}>
                        {category.replace(/([A-Z])/g, ' $1').trim()}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>

              {/* Question-by-Question Analysis */}
              {selectedQuickResult.questionGrades && (
                <Box mb={4}>
                  <Typography variant="h6" gutterBottom sx={{ 
                    color: 'white',
                    borderBottom: '2px solid rgba(255,255,255,0.3)',
                    pb: 1
                  }}>
                    📋 Question Analysis
                  </Typography>
                  <Grid container spacing={2}>
                    {selectedQuickResult.questionGrades.map((grade, index) => (
                      <Grid item xs={12} key={index}>
                        <Paper sx={{ 
                          p: 3,
                          background: 'rgba(255,255,255,0.08)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255,255,255,0.15)'
                        }}>
                          <Box display="flex" alignItems="center" justifyContent="between" mb={2}>
                            <Typography variant="h6" color="#4caf50">
                              Question {grade.questionNumber}
                            </Typography>
                            <Chip 
                              label={`${grade.score}%`}
                              sx={{ 
                                bgcolor: grade.score >= 80 ? '#4caf50' : grade.score >= 60 ? '#ff9800' : '#f44336',
                                color: 'white',
                                fontWeight: 'bold'
                              }}
                            />
                          </Box>
                          <Typography variant="body1" sx={{ mb: 2, fontStyle: 'italic' }}>
                            "{grade.question}"
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 1 }}>
                            <strong>Your Response:</strong> "{grade.userResponse?.substring(0, 100)}..."
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#66bb6a' }}>
                            <strong>Feedback:</strong> {grade.feedback}
                          </Typography>
                          <Box display="flex" gap={2} mt={1}>
                            <Typography variant="caption" sx={{ opacity: 0.7 }}>
                              ⏱️ {grade.timeSpent}s
                            </Typography>
                            {grade.keywordsIdentified?.length > 0 && (
                              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                                🎯 Keywords: {grade.keywordsIdentified.slice(0, 3).join(', ')}
                              </Typography>
                            )}
                          </Box>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              {/* Feedback Sections */}
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ 
                    p: 3, 
                    background: 'rgba(76, 175, 80, 0.1)',
                    border: '1px solid rgba(76, 175, 80, 0.3)'
                  }}>
                    <Typography variant="h6" gutterBottom sx={{ color: '#4caf50' }}>
                      💪 Your Strengths
                    </Typography>
                    {selectedQuickResult.strengths.map((strength, index) => (
                      <Typography key={index} variant="body2" sx={{ mb: 1, opacity: 0.9 }}>
                        • {strength}
                      </Typography>
                    ))}
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Paper sx={{ 
                    p: 3, 
                    background: 'rgba(255, 193, 7, 0.1)',
                    border: '1px solid rgba(255, 193, 7, 0.3)'
                  }}>
                    <Typography variant="h6" gutterBottom sx={{ color: '#ffc107' }}>
                      🎯 Areas to Improve
                    </Typography>
                    {selectedQuickResult.improvements.map((improvement, index) => (
                      <Typography key={index} variant="body2" sx={{ mb: 1, opacity: 0.9 }}>
                        • {improvement}
                      </Typography>
                    ))}
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Paper sx={{ 
                    p: 3, 
                    background: 'rgba(33, 150, 243, 0.1)',
                    border: '1px solid rgba(33, 150, 243, 0.3)'
                  }}>
                    <Typography variant="h6" gutterBottom sx={{ color: '#2196f3' }}>
                      💡 Recommendations
                    </Typography>
                    {selectedQuickResult.recommendations.map((rec, index) => (
                      <Typography key={index} variant="body2" sx={{ mb: 1, opacity: 0.9 }}>
                        • {rec}
                      </Typography>
                    ))}
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      </Container>
    </ProfileAccessGuard>
  );
};

export default AIInterviewsPage;
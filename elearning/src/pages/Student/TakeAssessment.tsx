import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  TextField,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Chip,
  IconButton,
  Tooltip,
  Paper,
  Grid,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Divider,
  AppBar,
  Toolbar,
  Stack,
  Badge,
  Drawer,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Timer,
  Security,
  Warning,
  Send,
  Save,
  Fullscreen,
  FullscreenExit,
  NavigateBefore,
  NavigateNext,
  Videocam,
  VideocamOff,
  ScreenShare,
  ExpandMore,
  CheckCircle,
  RadioButtonUnchecked,
  Assignment,
  Quiz,
  Menu,
  Close,
  Flag,
  BookmarkBorder,
  Bookmark,
  Visibility,
  VisibilityOff,
  Psychology,
  Shield,
  CameraAlt,
  Mic,
  MicOff
} from '@mui/icons-material';
import ProctoringMonitor, { ProctoringViolation, ProctoringStatus } from '../../components/Proctoring/ProctoringMonitor';
import SpecialCharacterInput from '../../components/SpecialCharacterInput';
import { assessmentService, IAssessment, IQuestion } from '../../services/assessmentService';

interface AssessmentAnswer {
  questionId: string;
  answer: string | string[];
  timeSpent: number;
  flagged?: boolean;
  bookmarked?: boolean;
  visited?: boolean;
}

interface QuestionSection {
  id: string;
  title: string;
  description?: string;
  questions: IQuestion[];
  timeLimit?: number;
  instructions?: string;
}

interface AssessmentProgress {
  totalQuestions: number;
  answeredQuestions: number;
  flaggedQuestions: number;
  bookmarkedQuestions: number;
  currentSection: number;
  sectionsCompleted: number;
}

const TakeAssessment: React.FC = () => {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // State management
  const [assessment, setAssessment] = useState<IAssessment | null>(null);
  const [answers, setAnswers] = useState<{ [key: string]: AssessmentAnswer }>({});
  const [sections, setSections] = useState<QuestionSection[]>([]);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [sectionTimeRemaining, setSectionTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [proctoringActive, setProctoringActive] = useState(false);
  const [proctoringStatus, setProctoringStatus] = useState<ProctoringStatus | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [warningDialogOpen, setWarningDialogOpen] = useState(false);
  const [autoSubmitWarning, setAutoSubmitWarning] = useState(false);
  const [navigationDrawerOpen, setNavigationDrawerOpen] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [cameraPermission, setCameraPermission] = useState(false);
  const [microphonePermission, setMicrophonePermission] = useState(false);
  const [screenSharePermission, setScreenSharePermission] = useState(false);
  const [systemCheckComplete, setSystemCheckComplete] = useState(false);
  const [progress, setProgress] = useState<AssessmentProgress>({
    totalQuestions: 0,
    answeredQuestions: 0,
    flaggedQuestions: 0,
    bookmarkedQuestions: 0,
    currentSection: 0,
    sectionsCompleted: 0
  });

  // Redirect to proctored interface
  useEffect(() => {
    if (assessmentId) {
      navigate(`/proctored-assessment/${assessmentId}/take`, {
        state: location.state,
        replace: true
      });
    }
  }, [assessmentId, navigate, location.state]);

  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sectionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const questionStartTimeRef = useRef<number>(Date.now());
  const submissionRef = useRef<string | null>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // System check and permissions
  const checkSystemRequirements = async () => {
    try {
      // Check camera permission
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setCameraPermission(true);
        webcamStreamRef.current = stream;
      } catch (error) {
        setCameraPermission(false);
        console.error('Camera permission denied:', error);
      }

      // Check microphone permission
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setMicrophonePermission(true);
        stream.getTracks().forEach(track => track.stop());
      } catch (error) {
        setMicrophonePermission(false);
        console.error('Microphone permission denied:', error);
      }

      // Check screen share capability
      try {
        // @ts-ignore
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        setScreenSharePermission(true);
        screenStreamRef.current = stream;
      } catch (error) {
        setScreenSharePermission(false);
        console.error('Screen share permission denied:', error);
      }

      setSystemCheckComplete(true);
    } catch (error) {
      console.error('System check failed:', error);
      setError('System requirements check failed. Please ensure camera and microphone access.');
    }
  };

  // Enter fullscreen mode
  const enterFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      }
    } catch (error) {
      console.error('Failed to enter fullscreen:', error);
      setError('Fullscreen mode is required for this assessment.');
    }
  };

  // Exit fullscreen mode
  const exitFullscreen = async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Failed to exit fullscreen:', error);
    }
  };

  // Handle fullscreen change
  const handleFullscreenChange = () => {
    const isCurrentlyFullscreen = !!document.fullscreenElement;
    setIsFullscreen(isCurrentlyFullscreen);
    
    if (!isCurrentlyFullscreen && proctoringActive) {
      setWarningDialogOpen(true);
    }
  };

  // Organize questions into sections
  const organizeQuestionsIntoSections = (questions: IQuestion[]): QuestionSection[] => {
    // Group questions by section or create default sections
    const sectionsMap = new Map<string, IQuestion[]>();
    
    questions.forEach(question => {
      const sectionKey = question.section || 'General';
      if (!sectionsMap.has(sectionKey)) {
        sectionsMap.set(sectionKey, []);
      }
      sectionsMap.get(sectionKey)!.push(question);
    });

    return Array.from(sectionsMap.entries()).map(([title, sectionQuestions], index) => ({
      id: `section-${index}`,
      title,
      questions: sectionQuestions,
      instructions: `Section ${index + 1}: ${title}`
    }));
  };

  // Calculate progress
  const calculateProgress = useCallback(() => {
    const totalQuestions = sections.reduce((sum, section) => sum + section.questions.length, 0);
    const answeredQuestions = Object.values(answers).filter(answer => 
      Array.isArray(answer.answer) ? answer.answer.length > 0 : answer.answer !== ''
    ).length;
    const flaggedQuestions = Object.values(answers).filter(answer => answer.flagged).length;
    const bookmarkedQuestions = Object.values(answers).filter(answer => answer.bookmarked).length;

    setProgress({
      totalQuestions,
      answeredQuestions,
      flaggedQuestions,
      bookmarkedQuestions,
      currentSection: currentSectionIndex,
      sectionsCompleted: sections.filter((_, index) => index < currentSectionIndex).length
    });
  }, [answers, sections, currentSectionIndex]);

  // Load assessment
  useEffect(() => {
    if (!assessmentId) return;

    const loadAssessment = async () => {
      try {
        setLoading(true);
        const data = await assessmentService.getAssessmentById(assessmentId);
        setAssessment(data);
        
        // Organize questions into sections
        const organizedSections = organizeQuestionsIntoSections(data.questions);
        setSections(organizedSections);
        
        // Initialize answers
        const initialAnswers: { [key: string]: AssessmentAnswer } = {};
        data.questions.forEach((question: IQuestion) => {
          const questionId = question._id || question.id;
          initialAnswers[questionId] = {
            questionId: questionId,
            answer: question.type === 'multiple_choice_multiple' ? [] : '',
            timeSpent: 0,
            visited: false,
            flagged: false,
            bookmarked: false
          };
        });
        setAnswers(initialAnswers);

        // Set timer if time limit exists
        if (data.timeLimit) {
          setTimeRemaining(data.timeLimit * 60); // Convert minutes to seconds
        }

        // Enable proctoring if required
        if (data.proctoringEnabled || data.requireProctoring) {
          setProctoringActive(true);
          // Check system requirements first
          await checkSystemRequirements();
          // Request fullscreen after system check
          if (systemCheckComplete) {
            await enterFullscreen();
          }
        }

      } catch (err: any) {
        setError(err.message || 'Failed to load assessment');
      } finally {
        setLoading(false);
      }
    };

    loadAssessment();
  }, [assessmentId]);

  // Progress calculation effect
  useEffect(() => {
    calculateProgress();
  }, [calculateProgress]);

  // Fullscreen event listeners
  useEffect(() => {
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (webcamStreamRef.current) {
        webcamStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (sectionTimerRef.current) {
        clearInterval(sectionTimerRef.current);
      }
    };
  }, []);

  // Timer effect
  useEffect(() => {
    if (timeRemaining > 0 && assessment) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Auto-submit when time runs out
            handleSubmit(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [timeRemaining, assessment]);

  // Handle answer changes
  const handleAnswerChange = useCallback((questionId: string, answer: string | string[]) => {
    const currentTime = Date.now();
    const timeSpent = currentTime - questionStartTimeRef.current;

    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        answer,
        timeSpent: prev[questionId].timeSpent + timeSpent
      }
    }));

    questionStartTimeRef.current = currentTime;
  }, []);

  // Enhanced navigation functions
  const navigateToQuestion = (sectionIndex: number, questionIndex: number) => {
    const currentTime = Date.now();
    const timeSpent = currentTime - questionStartTimeRef.current;
    
    // Update time spent on current question
    const currentSection = sections[currentSectionIndex];
    if (currentSection?.questions[currentQuestionIndex]) {
      const question = currentSection.questions[currentQuestionIndex];
      const questionId = question._id || question.id;
      setAnswers(prev => ({
        ...prev,
        [questionId]: {
          ...prev[questionId],
          timeSpent: prev[questionId].timeSpent + timeSpent,
          visited: true
        }
      }));
    }

    setCurrentSectionIndex(sectionIndex);
    setCurrentQuestionIndex(questionIndex);
    questionStartTimeRef.current = Date.now();
  };

  const navigateToNextQuestion = () => {
    const currentSection = sections[currentSectionIndex];
    if (!currentSection) return;

    if (currentQuestionIndex < currentSection.questions.length - 1) {
      navigateToQuestion(currentSectionIndex, currentQuestionIndex + 1);
    } else if (currentSectionIndex < sections.length - 1) {
      navigateToQuestion(currentSectionIndex + 1, 0);
    }
  };

  const navigateToPrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      navigateToQuestion(currentSectionIndex, currentQuestionIndex - 1);
    } else if (currentSectionIndex > 0) {
      const prevSection = sections[currentSectionIndex - 1];
      navigateToQuestion(currentSectionIndex - 1, prevSection.questions.length - 1);
    }
  };

  const toggleQuestionFlag = (questionId: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        flagged: !prev[questionId].flagged
      }
    }));
  };

  const toggleQuestionBookmark = (questionId: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        bookmarked: !prev[questionId].bookmarked
      }
    }));
  };

  // Get current question
  const getCurrentQuestion = () => {
    const currentSection = sections[currentSectionIndex];
    return currentSection?.questions[currentQuestionIndex] || null;
  };

  // Get global question index
  const getGlobalQuestionIndex = () => {
    let globalIndex = 0;
    for (let i = 0; i < currentSectionIndex; i++) {
      globalIndex += sections[i].questions.length;
    }
    return globalIndex + currentQuestionIndex;
  };

  // Handle proctoring violations
  const handleProctoringViolation = useCallback((violation: ProctoringViolation) => {
    console.log('Proctoring violation:', violation);
    
    // Check if too many violations occurred
    if (proctoringStatus && proctoringStatus.warningCount >= 3) {
      setAutoSubmitWarning(true);
      // Auto-submit after 10 seconds
      setTimeout(() => {
        handleSubmit(true);
      }, 10000);
    }
  }, [proctoringStatus]);

  // Handle proctoring status changes
  const handleProctoringStatusChange = useCallback((status: ProctoringStatus) => {
    setProctoringStatus(status);
  }, []);

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  // Handle assessment submission
  const handleSubmit = async (autoSubmit = false) => {
    if (!assessment || !assessmentId) return;

    try {
      setSubmitting(true);

      // Prepare submission data
      const submissionData = {
        assessmentId,
        answers: Object.values(answers),
        totalTimeSpent: Object.values(answers).reduce((total, answer) => total + answer.timeSpent, 0),
        proctoringData: proctoringStatus ? {
          violations: proctoringStatus.violations,
          warningCount: proctoringStatus.warningCount
        } : undefined,
        isAutoSubmitted: autoSubmit
      };

      const result = await assessmentService.submitAssessment(submissionData);
      const submissionId = result.submissionId || result._id;
      submissionRef.current = submissionId;

      // Disable proctoring
      setProctoringActive(false);

      // Exit fullscreen
      if (document.fullscreenElement) {
        document.exitFullscreen?.();
      }

      // Navigate to results
      navigate(`/dashboard/student/assessments/${assessmentId}/result/${submissionId}`);

    } catch (err: any) {
      setError(err.message || 'Failed to submit assessment');
    } finally {
      setSubmitting(false);
      setShowSubmitDialog(false);
    }
  };

  // Format time display
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Render question based on type
  const renderQuestion = (question: IQuestion, answer: AssessmentAnswer) => {
    const questionId = question._id || question.id;

    switch (question.type) {
      case 'multiple_choice':
        return (
          <RadioGroup
            value={answer.answer as string}
            onChange={(e) => handleAnswerChange(questionId, e.target.value)}
          >
            {question.options?.map((option, index) => (
              <FormControlLabel
                key={index}
                value={option}
                control={<Radio />}
                label={option}
              />
            ))}
          </RadioGroup>
        );

      case 'multiple_choice_multiple':
        return (
          <Box>
            {question.options?.map((option, index) => (
              <FormControlLabel
                key={index}
                control={
                  <Checkbox
                    checked={(answer.answer as string[]).includes(option)}
                    onChange={(e) => {
                      const currentAnswers = answer.answer as string[];
                      const newAnswers = e.target.checked
                        ? [...currentAnswers, option]
                        : currentAnswers.filter(a => a !== option);
                      handleAnswerChange(questionId, newAnswers);
                    }}
                  />
                }
                label={option}
              />
            ))}
          </Box>
        );

      case 'short_answer':
        return (
          <TextField
            fullWidth
            multiline
            rows={3}
            value={answer.answer as string}
            onChange={(e) => handleAnswerChange(questionId, e.target.value)}
            placeholder="Enter your answer..."
          />
        );

      case 'essay':
        return (
          <TextField
            fullWidth
            multiline
            rows={8}
            value={answer.answer as string}
            onChange={(e) => handleAnswerChange(questionId, e.target.value)}
            placeholder="Write your essay here..."
          />
        );

      case 'mathematical':
        return (
          <SpecialCharacterInput
            value={answer.answer as string}
            onChange={(value) => handleAnswerChange(questionId, value)}
            placeholder="Enter your mathematical answer..."
          />
        );

      default:
        return (
          <TextField
            fullWidth
            value={answer.answer as string}
            onChange={(e) => handleAnswerChange(questionId, e.target.value)}
            placeholder="Enter your answer..."
          />
        );
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <Typography>Loading assessment...</Typography>
        </Box>
      </Container>
    );
  }

  if (error || !assessment) {
    return (
      <Container maxWidth="md">
        <Alert severity="error" sx={{ mt: 4 }}>
          {error || 'Assessment not found'}
        </Alert>
      </Container>
    );
  }

  // System check dialog
  if (proctoringActive && !systemCheckComplete) {
    return (
      <Dialog open={true} maxWidth="md" fullWidth>
        <DialogTitle sx={{ textAlign: 'center' }}>
          <Shield color="primary" sx={{ fontSize: 40, mb: 1 }} />
          <Typography variant="h5">System Requirements Check</Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 3, textAlign: 'center' }}>
            This assessment requires proctoring. Please ensure all system requirements are met.
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Card sx={{ 
                textAlign: 'center', 
                p: 2,
                border: '2px solid',
                borderColor: cameraPermission ? 'success.main' : 'error.main'
              }}>
                <CameraAlt sx={{ 
                  fontSize: 40, 
                  color: cameraPermission ? 'success.main' : 'error.main',
                  mb: 1 
                }} />
                <Typography variant="h6">Camera</Typography>
                <Typography variant="body2" color="text.secondary">
                  {cameraPermission ? 'Enabled' : 'Required'}
                </Typography>
                {cameraPermission ? (
                  <CheckCircle color="success" />
                ) : (
                  <Cancel color="error" />
                )}
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Card sx={{ 
                textAlign: 'center', 
                p: 2,
                border: '2px solid',
                borderColor: microphonePermission ? 'success.main' : 'error.main'
              }}>
                <Mic sx={{ 
                  fontSize: 40, 
                  color: microphonePermission ? 'success.main' : 'error.main',
                  mb: 1 
                }} />
                <Typography variant="h6">Microphone</Typography>
                <Typography variant="body2" color="text.secondary">
                  {microphonePermission ? 'Enabled' : 'Required'}
                </Typography>
                {microphonePermission ? (
                  <CheckCircle color="success" />
                ) : (
                  <Cancel color="error" />
                )}
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Card sx={{ 
                textAlign: 'center', 
                p: 2,
                border: '2px solid',
                borderColor: 'info.main'
              }}>
                <Fullscreen sx={{ 
                  fontSize: 40, 
                  color: 'info.main',
                  mb: 1 
                }} />
                <Typography variant="h6">Fullscreen</Typography>
                <Typography variant="body2" color="text.secondary">
                  Will be enabled
                </Typography>
                <CheckCircle color="info" />
              </Card>
            </Grid>
          </Grid>

          <Alert severity="warning" sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Important Proctoring Guidelines:
            </Typography>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li>Keep your face visible to the camera at all times</li>
              <li>Do not switch tabs or minimize the browser window</li>
              <li>Do not use external devices or applications</li>
              <li>Maintain a quiet environment</li>
              <li>Any violations will be recorded and may result in assessment termination</li>
            </ul>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button 
            onClick={checkSystemRequirements}
            variant="contained"
            size="large"
            startIcon={<Security />}
          >
            Check System & Start Assessment
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  const currentQuestion = getCurrentQuestion();
  const globalQuestionIndex = getGlobalQuestionIndex();
  const totalQuestions = sections.reduce((sum, section) => sum + section.questions.length, 0);
  const progressPercentage = totalQuestions > 0 ? ((globalQuestionIndex + 1) / totalQuestions) * 100 : 0;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Proctoring Monitor */}
      {proctoringActive && (
        <ProctoringMonitor
          assessmentId={assessmentId!}
          isActive={proctoringActive}
          onViolation={handleProctoringViolation}
          onStatusChange={handleProctoringStatusChange}
        />
      )}

      {/* Enhanced Header with Navigation */}
      <AppBar position="static" elevation={1} sx={{ bgcolor: 'white', color: 'text.primary' }}>
        <Toolbar>
          <IconButton
            edge="start"
            onClick={() => setNavigationDrawerOpen(true)}
            sx={{ mr: 2 }}
          >
            <Menu />
          </IconButton>
          
          <Typography variant="h6" sx={{ flexGrow: 1, color: 'primary.main' }}>
            {assessment.title}
          </Typography>
          
          <Stack direction="row" spacing={1} alignItems="center">
            {timeRemaining > 0 && (
              <Chip
                icon={<Timer />}
                label={formatTime(timeRemaining)}
                color={timeRemaining < 300 ? 'error' : 'primary'}
                variant="outlined"
              />
            )}
            
            {proctoringActive && (
              <Tooltip title="Proctoring Active - AI Monitoring">
                <Chip
                  icon={<Psychology />}
                  label="AI Proctored"
                  color="warning"
                  variant="outlined"
                />
              </Tooltip>
            )}
            
            <Chip
              label={`${progress.answeredQuestions}/${progress.totalQuestions}`}
              color="info"
              variant="outlined"
            />
            
            {progress.flaggedQuestions > 0 && (
              <Badge badgeContent={progress.flaggedQuestions} color="error">
                <Flag color="action" />
              </Badge>
            )}
            
            {progress.bookmarkedQuestions > 0 && (
              <Badge badgeContent={progress.bookmarkedQuestions} color="primary">
                <Bookmark color="action" />
              </Badge>
            )}
            
            <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
              <IconButton onClick={toggleFullscreen} color="primary">
                {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
              </IconButton>
            </Tooltip>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Navigation Drawer */}
      <Drawer
        anchor="left"
        open={navigationDrawerOpen}
        onClose={() => setNavigationDrawerOpen(false)}
        sx={{ '& .MuiDrawer-paper': { width: 350, p: 2 } }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Assessment Navigation</Typography>
          <IconButton onClick={() => setNavigationDrawerOpen(false)}>
            <Close />
          </IconButton>
        </Box>
        
        <Divider sx={{ mb: 2 }} />
        
        {/* Progress Overview */}
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'primary.50' }}>
          <Typography variant="subtitle2" gutterBottom>Progress Overview</Typography>
          <LinearProgress 
            variant="determinate" 
            value={progressPercentage} 
            sx={{ mb: 1, height: 8, borderRadius: 4 }}
          />
          <Typography variant="body2" color="text.secondary">
            {Math.round(progressPercentage)}% Complete ({progress.answeredQuestions}/{progress.totalQuestions} answered)
          </Typography>
        </Paper>
        
        {/* Section Navigation */}
        {sections.map((section, sectionIndex) => (
          <Accordion key={section.id} expanded={sectionIndex === currentSectionIndex}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <Assignment sx={{ mr: 1 }} />
                <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                  {section.title}
                </Typography>
                <Chip 
                  label={`${section.questions.filter(q => {
                    const qId = q._id || q.id;
                    const answer = answers[qId];
                    return Array.isArray(answer?.answer) ? answer.answer.length > 0 : answer?.answer !== '';
                  }).length}/${section.questions.length}`}
                  size="small"
                  color={sectionIndex === currentSectionIndex ? 'primary' : 'default'}
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <List dense>
                {section.questions.map((question, questionIndex) => {
                  const questionId = question._id || question.id;
                  const answer = answers[questionId];
                  const isAnswered = Array.isArray(answer?.answer) ? answer.answer.length > 0 : answer?.answer !== '';
                  const isCurrent = sectionIndex === currentSectionIndex && questionIndex === currentQuestionIndex;
                  
                  return (
                    <ListItem key={questionId} disablePadding>
                      <ListItemButton
                        selected={isCurrent}
                        onClick={() => navigateToQuestion(sectionIndex, questionIndex)}
                      >
                        <ListItemIcon>
                          {isAnswered ? (
                            <CheckCircle color="success" />
                          ) : (
                            <RadioButtonUnchecked color="action" />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={`Q${questionIndex + 1}`}
                          secondary={question.question.substring(0, 50) + '...'}
                        />
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {answer?.flagged && <Flag color="error" fontSize="small" />}
                          {answer?.bookmarked && <Bookmark color="primary" fontSize="small" />}
                        </Box>
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            </AccordionDetails>
          </Accordion>
        ))}
      </Drawer>

      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          {/* Main Question Area */}
          <Grid item xs={12} lg={9}>
            {/* Section Header */}
            {sections[currentSectionIndex] && (
              <Card sx={{ mb: 2, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
                <CardContent sx={{ py: 2 }}>
                  <Typography variant="h6" color="primary.main">
                    Section {currentSectionIndex + 1}: {sections[currentSectionIndex].title}
                  </Typography>
                  {sections[currentSectionIndex].instructions && (
                    <Typography variant="body2" color="text.secondary">
                      {sections[currentSectionIndex].instructions}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Question Card */}
            {currentQuestion && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" sx={{ flexGrow: 1, pr: 2 }}>
                      Question {globalQuestionIndex + 1}: {currentQuestion.question}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {currentQuestion.points && (
                        <Chip
                          label={`${currentQuestion.points} pts`}
                          size="small"
                          color="primary"
                        />
                      )}
                      
                      <Tooltip title="Flag for Review">
                        <IconButton
                          size="small"
                          onClick={() => toggleQuestionFlag(currentQuestion._id || currentQuestion.id)}
                          color={answers[currentQuestion._id || currentQuestion.id]?.flagged ? 'error' : 'default'}
                        >
                          <Flag />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Bookmark">
                        <IconButton
                          size="small"
                          onClick={() => toggleQuestionBookmark(currentQuestion._id || currentQuestion.id)}
                          color={answers[currentQuestion._id || currentQuestion.id]?.bookmarked ? 'primary' : 'default'}
                        >
                          {answers[currentQuestion._id || currentQuestion.id]?.bookmarked ? <Bookmark /> : <BookmarkBorder />}
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>

                  <Divider sx={{ mb: 3 }} />

                  <Box sx={{ mt: 3 }}>
                    {renderQuestion(currentQuestion, answers[currentQuestion._id || currentQuestion.id])}
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Navigation Controls */}
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Button
                    variant="outlined"
                    startIcon={<NavigateBefore />}
                    onClick={navigateToPrevQuestion}
                    disabled={currentSectionIndex === 0 && currentQuestionIndex === 0}
                  >
                    Previous
                  </Button>

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<Save />}
                      onClick={() => {/* Auto-save functionality */}}
                    >
                      Save Progress
                    </Button>

                    {globalQuestionIndex === totalQuestions - 1 ? (
                      <Button
                        variant="contained"
                        startIcon={<Send />}
                        onClick={() => setShowSubmitDialog(true)}
                        disabled={submitting}
                        color="success"
                        size="large"
                      >
                        Submit Assessment
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        endIcon={<NavigateNext />}
                        onClick={navigateToNextQuestion}
                      >
                        Next Question
                      </Button>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} lg={3}>
            {/* Progress Card */}
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Analytics sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Progress
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Overall Progress
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={progressPercentage} 
                    sx={{ height: 8, borderRadius: 4, mb: 1 }}
                  />
                  <Typography variant="body2">
                    {Math.round(progressPercentage)}% Complete
                  </Typography>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="success.main">
                        {progress.answeredQuestions}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Answered
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="text.secondary">
                        {progress.totalQuestions - progress.answeredQuestions}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Remaining
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {progress.flaggedQuestions > 0 && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      {progress.flaggedQuestions} question(s) flagged for review
                    </Typography>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Proctoring Status */}
            {proctoringActive && proctoringStatus && (
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <Shield sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Proctoring Status
                  </Typography>
                  
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Videocam sx={{ mr: 1, color: 'success.main' }} />
                      <Typography variant="body2">Camera: Active</Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Psychology sx={{ mr: 1, color: 'info.main' }} />
                      <Typography variant="body2">AI Monitoring: Active</Typography>
                    </Box>
                    
                    {proctoringStatus.warningCount > 0 && (
                      <Alert severity="warning" size="small">
                        {proctoringStatus.warningCount} violation(s) detected
                      </Alert>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Actions
                </Typography>
                
                <Stack spacing={1}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Visibility />}
                    onClick={() => setShowInstructions(!showInstructions)}
                  >
                    {showInstructions ? 'Hide' : 'Show'} Instructions
                  </Button>
                  
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Flag />}
                    disabled={progress.flaggedQuestions === 0}
                  >
                    Review Flagged ({progress.flaggedQuestions})
                  </Button>
                  
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Bookmark />}
                    disabled={progress.bookmarkedQuestions === 0}
                  >
                    Bookmarked ({progress.bookmarkedQuestions})
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Auto-submit Warning */}
        {autoSubmitWarning && (
          <Alert severity="error" sx={{ mt: 2 }}>
            <Typography variant="h6">Warning: Too Many Violations Detected</Typography>
            <Typography>
              Your assessment will be automatically submitted in 10 seconds due to multiple proctoring violations.
            </Typography>
          </Alert>
        )}
      </Container>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitDialog} onClose={() => setShowSubmitDialog(false)}>
        <DialogTitle>Submit Assessment</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to submit your assessment? You cannot make changes after submission.
          </Typography>
          {proctoringStatus && proctoringStatus.warningCount > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Note: {proctoringStatus.warningCount} proctoring violations were recorded during this assessment.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSubmitDialog(false)}>Cancel</Button>
          <Button onClick={() => handleSubmit()} variant="contained" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TakeAssessment;

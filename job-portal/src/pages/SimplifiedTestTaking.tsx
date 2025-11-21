import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  LinearProgress,
  RadioGroup,
  FormControlLabel,
  Radio,
  Paper,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Stack,
  useTheme,
  alpha,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Fade,
  Slide,
  IconButton,
  Toolbar,
  AppBar
} from '@mui/material';
import {
  AccessTime,
  CheckCircle,
  Warning,
  Psychology,
  Assignment,
  Timer,
  Info,
  KeyboardArrowRight,
  KeyboardArrowLeft,
  ExitToApp,
  Fullscreen,
  FullscreenExit,
  QuestionAnswer,
  ArrowBack
} from '@mui/icons-material';
import { simplePsychometricService } from '../services/simplePsychometricService';

interface Question {
  id: number;
  question: string;
  options: string[];
  category: string;
}

interface TestData {
  sessionId: string;
  questions: Question[];
  timeLimit: number;
  startedAt: string;
  job: {
    _id: string;
    title: string;
    company: string;
    industry: string;
  };
}

interface TestInstructions {
  title: string;
  duration: string;
  questionCount: number;
  instructions: string[];
  tips: string[];
}

const SimplifiedTestTaking: React.FC = () => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  
  const [testData, setTestData] = useState<TestData | null>(null);
  const [currentScreen, setCurrentScreen] = useState<'instructions' | 'test' | 'loading'>('loading');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [instructionsComplete, setInstructionsComplete] = useState(false);

  // Test instructions
  const testInstructions: TestInstructions = {
    title: testData?.job?.title ? `${testData.job.title} Assessment` : 'Psychometric Assessment',
    duration: testData ? `${testData.timeLimit} minutes` : '45 minutes',
    questionCount: testData?.questions?.length || 0,
    instructions: [
      'Read each question carefully before selecting your answer',
      'Choose the option that best represents your response',
      'You can navigate between questions using the Previous and Next buttons',
      'Your progress is automatically saved as you complete questions',
      'The timer will show your remaining time at the top of the screen',
      'Submit your test when you have completed all questions'
    ],
    tips: [
      'Answer honestly - there are no right or wrong answers for personality questions',
      'Trust your first instinct when answering',
      'Manage your time effectively - you have approximately 2-3 minutes per question',
      'Review your answers before submitting if time permits',
      'Stay calm and focused throughout the assessment'
    ]
  };
  
  useEffect(() => {
    // Initialize test session from navigation state or start new session
    const initializeTest = async () => {
      try {
        setCurrentScreen('loading');
        
        if (location.state && location.state.testData) {
          // Test data passed via navigation
          const data = location.state.testData;
          console.log('📊 Test data from navigation:', data);
          setTestData(data);
          setAnswers(new Array(data.questions.length).fill(-1));
          
          // Calculate time remaining
          const startTime = new Date(data.startedAt).getTime();
          const timeLimit = data.timeLimit * 60 * 1000;
          const elapsed = Date.now() - startTime;
          const remaining = Math.max(0, timeLimit - elapsed);
          setTimeRemaining(Math.floor(remaining / 1000));
          
          setCurrentScreen('instructions');
        } else {
          // Try to get session from URL params
          const sessionId = params.sessionId || new URLSearchParams(location.search).get('session');
          
          if (sessionId) {
            // Start test session from backend
            await startTestSession(sessionId);
          } else {
            // No valid test data or session
            console.error('No test data or session found');
            navigate('/app/tests', { replace: true });
            return;
          }
        }
      } catch (error) {
        console.error('Error initializing test:', error);
        navigate('/app/tests', { replace: true });
      }
    };

    initializeTest();
  }, [location.state, location.search, navigate, params.sessionId]);

  const startTestSession = async (sessionId: string) => {
    try {
      console.log('🚀 Starting test session:', sessionId);
      
      // Make API call to start the test session
      const response = await fetch(`/api/psychometric-tests/start/${sessionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to start test session');
      }

      const result = await response.json();
      console.log('✅ Test session started:', result);
      
      if (result.success) {
        const testData = result.data;
        setTestData(testData);
        setAnswers(new Array(testData.questions.length).fill(-1));
        
        // Calculate time remaining
        const startTime = new Date(testData.startedAt).getTime();
        const timeLimit = testData.timeLimit * 60 * 1000;
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, timeLimit - elapsed);
        setTimeRemaining(Math.floor(remaining / 1000));
        
        setCurrentScreen('instructions');
      } else {
        throw new Error(result.error || 'Failed to start test');
      }
    } catch (error) {
      console.error('Error starting test session:', error);
      throw error;
    }
  };

  useEffect(() => {
    // Timer countdown
    if (timeRemaining > 0 && !testCompleted && currentScreen === 'test') {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Time's up - auto submit
            handleSubmitTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [timeRemaining, testCompleted, currentScreen]);

  // Enable/disable fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Fullscreen toggle failed:', error);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (testData && currentQuestion < testData.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSubmitTest = async () => {
    if (!testData) return;
    
    setSubmitting(true);
    
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📝 Submitting test answers (attempt ${attempt}/${maxRetries}):`, {
          sessionId: testData.sessionId,
          answers: answers,
          timeSpent: (testData.timeLimit * 60) - timeRemaining
        });

        // Use the API service instead of raw fetch for better error handling
        const result = await simplePsychometricService.submitSimpleTest(
          testData.sessionId,
          answers,
          (testData.timeLimit * 60) - timeRemaining
        );
        
        console.log('✅ Test submitted successfully:', result);
        console.log('📊 Grading information:', {
          score: result.score,
          grade: result.grade,
          correctAnswers: result.correctAnswers,
          totalQuestions: result.totalQuestions
        });
        
        setTestCompleted(true);
        
        // Navigate to standalone results page
        navigate('/psychometric-test-result', {
          state: {
            result: result,
            testData,
            returnUrl: '/app/tests'
          }
        });
        
        // Success - break out of retry loop
        setSubmitting(false);
        setShowConfirmDialog(false);
        return;
        
      } catch (error: any) {
        console.error(`❌ Test submission attempt ${attempt} failed:`, error);
        
        const isLastAttempt = attempt === maxRetries;
        const isRetryableError = 
          error.message?.includes('JSON') || 
          error.message?.includes('Unexpected end of JSON input') ||
          error.message?.includes('Server returned empty response') ||
          error.message?.includes('Server returned invalid JSON response') ||
          error.message?.includes('Network connection failed') ||
          error.message?.includes('Server is temporarily unavailable') ||
          error.message?.includes('Failed to fetch') ||
          error.message?.includes('Server returned invalid response format') ||
          error.message?.includes('The server response could not be processed');
        
        if (isLastAttempt || !isRetryableError) {
          // Show detailed error message on final failure
          let userMessage = 'Failed to submit test.';
          
          if (error.message?.includes('JSON') || 
              error.message?.includes('Unexpected end of JSON input') ||
              error.message?.includes('Server returned empty response') ||
              error.message?.includes('Server returned invalid JSON response') ||
              error.message?.includes('Server returned invalid response format') ||
              error.message?.includes('The server response could not be processed')) {
            userMessage = 'Test submission failed due to a server communication issue. Your answers may have been saved. Please try refreshing the page or contact support if the problem persists.';
          } else if (error.message?.includes('Network connection failed') || 
                     error.message?.includes('Failed to fetch')) {
            userMessage = 'Network connection failed. Please check your internet connection and try again.';
          } else {
            userMessage = `Test submission failed: ${error.message}. Please try again.`;
          }
          
          console.error('❌ Final submission failure after', attempt, 'attempts');
          alert(userMessage);
          setSubmitting(false);
          setShowConfirmDialog(false);
          return;
        }
        
        // Wait before retrying with exponential backoff
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`⏳ Retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // This should never be reached due to the return statements above
    console.error('❌ Test submission failed after all retry attempts');
    alert('Test submission failed after multiple attempts. Please try again later.');
    setSubmitting(false);
    setShowConfirmDialog(false);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getAnsweredCount = (): number => {
    return answers.filter(answer => answer !== -1).length;
  };

  const getTimeColor = () => {
    if (!testData) return 'success';
    const percentage = timeRemaining / (testData.timeLimit * 60);
    if (percentage > 0.5) return 'success';
    if (percentage > 0.2) return 'warning';
    return 'error';
  };

  const handleStartTest = () => {
    setInstructionsComplete(true);
    setCurrentScreen('test');
  };

  const handleExitTest = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    navigate('/app/tests', { replace: true });
  };

  // Loading screen
  if (currentScreen === 'loading') {
    return (
      <Box sx={{ 
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default'
      }}>
        <Box textAlign="center">
          <Psychology sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Loading Assessment...
          </Typography>
          <LinearProgress sx={{ width: 300, mt: 2 }} />
        </Box>
      </Box>
    );
  }

  // Instructions screen
  if (currentScreen === 'instructions' && testData) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        bgcolor: 'background.default',
        position: 'relative'
      }}>
        {/* Full screen toggle */}
        <IconButton
          onClick={toggleFullscreen}
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 1000,
            bgcolor: alpha(theme.palette.background.paper, 0.9),
            '&:hover': {
              bgcolor: alpha(theme.palette.background.paper, 1)
            }
          }}
        >
          {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
        </IconButton>

        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Fade in timeout={800}>
            <Card elevation={4} sx={{ 
              borderRadius: 3,
              overflow: 'hidden',
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`
            }}>
              {/* Header */}
              <CardContent sx={{ 
                bgcolor: 'primary.main', 
                color: 'white',
                textAlign: 'center',
                py: 4
              }}>
                <Psychology sx={{ fontSize: 48, mb: 2 }} />
                <Typography variant="h3" fontWeight="bold" gutterBottom>
                  {testInstructions.title}
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9 }}>
                  {testData.job?.company} • {testData.job?.industry}
                </Typography>
                
                <Stack direction="row" spacing={3} justifyContent="center" sx={{ mt: 3 }}>
                  <Chip
                    icon={<Timer />}
                    label={`${testInstructions.duration}`}
                    variant="outlined"
                    sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
                  />
                  <Chip
                    icon={<QuestionAnswer />}
                    label={`${testInstructions.questionCount} Questions`}
                    variant="outlined"
                    sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
                  />
                </Stack>
              </CardContent>

              <CardContent sx={{ p: 4 }}>
                <Stack spacing={4}>
                  {/* Instructions */}
                  <Box>
                    <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      color: 'primary.main'
                    }}>
                      <Assignment sx={{ mr: 1 }} />
                      Instructions
                    </Typography>
                    <List>
                      {testInstructions.instructions.map((instruction, index) => (
                        <ListItem key={index} sx={{ pl: 0 }}>
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            <Avatar sx={{ 
                              width: 24, 
                              height: 24, 
                              bgcolor: 'primary.main',
                              fontSize: '0.8rem'
                            }}>
                              {index + 1}
                            </Avatar>
                          </ListItemIcon>
                          <ListItemText primary={instruction} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>

                  <Divider />

                  {/* Tips */}
                  <Box>
                    <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      color: 'secondary.main'
                    }}>
                      <Info sx={{ mr: 1 }} />
                      Helpful Tips
                    </Typography>
                    <List>
                      {testInstructions.tips.map((tip, index) => (
                        <ListItem key={index} sx={{ pl: 0 }}>
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            <CheckCircle sx={{ color: 'success.main', fontSize: 24 }} />
                          </ListItemIcon>
                          <ListItemText primary={tip} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>

                  {/* Start Button */}
                  <Box sx={{ textAlign: 'center', mt: 4 }}>
                    <Stack direction="row" spacing={2} justifyContent="center">
                      <Button
                        variant="outlined"
                        size="large"
                        startIcon={<ExitToApp />}
                        onClick={() => setShowExitDialog(true)}
                        sx={{ minWidth: 150 }}
                      >
                        Exit Assessment
                      </Button>
                      <Button
                        variant="contained"
                        size="large"
                        endIcon={<KeyboardArrowRight />}
                        onClick={handleStartTest}
                        sx={{ 
                          minWidth: 200,
                          py: 1.5,
                          fontSize: '1.1rem',
                          fontWeight: 'bold'
                        }}
                      >
                        Start Assessment
                      </Button>
                    </Stack>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Fade>
        </Container>

        {/* Exit Dialog */}
        <Dialog open={showExitDialog} onClose={() => setShowExitDialog(false)}>
          <DialogTitle>Exit Assessment</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to exit? You will lose your progress and may need to restart the assessment.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowExitDialog(false)}>Stay</Button>
            <Button onClick={handleExitTest} color="error" variant="contained">
              Exit
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  // Test screen
  if (currentScreen === 'test' && testData) {
    if (!testData.questions || testData.questions.length === 0) {
      return (
        <Container maxWidth="md" sx={{ py: 4, minHeight: '100vh' }}>
          <Alert severity="error">
            Invalid test data. Please restart the assessment.
          </Alert>
        </Container>
      );
    }

    const currentQ = testData.questions[currentQuestion];
    const progress = ((currentQuestion + 1) / testData.questions.length) * 100;
    const isLastQuestion = currentQuestion === testData.questions.length - 1;

    return (
      <Box sx={{ 
        minHeight: '100vh',
        bgcolor: 'background.default',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 1, sm: 2, md: 3 }
      }}>
        {/* Header with timer and progress - Fixed at top */}
        <Box sx={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          zIndex: 1200,
          bgcolor: 'primary.main',
          color: 'white',
          p: 1
        }}>
          <Toolbar sx={{ minHeight: '56px !important', px: { xs: 1, sm: 2 } }}>
            <IconButton
              onClick={() => navigate(-1)}
              sx={{ 
                color: 'white', 
                mr: 1,
                p: 0.5,
                '&:hover': {
                  bgcolor: alpha(theme.palette.common.white, 0.1)
                }
              }}
            >
              <ArrowBack />
            </IconButton>
            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, minWidth: 0 }}>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography 
                  variant="subtitle1" 
                  fontWeight="bold"
                  noWrap
                  sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }}
                >
                  {testData.job?.title || 'Assessment'} Assessment
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ opacity: 0.9, display: { xs: 'none', sm: 'block' } }}
                >
                  {testData.job?.company || 'Company'} • {testData.job?.industry || 'Industry'}
                </Typography>
              </Box>
              
              <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
                <Box display="flex" alignItems="center">
                  <AccessTime sx={{ mr: 0.5, fontSize: 16 }} />
                  <Typography 
                    variant="subtitle2" 
                    fontWeight="bold"
                    sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }}
                  >
                    {formatTime(timeRemaining)}
                  </Typography>
                </Box>
                <Chip
                  label={`${getAnsweredCount()}/${testData.questions.length}`}
                  size="small"
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    color: 'white',
                    fontSize: { xs: '0.6rem', sm: '0.75rem' },
                    height: { xs: 20, sm: 24 },
                    px: 0.5
                  }}
                />
                <IconButton
                  onClick={toggleFullscreen}
                  sx={{ color: 'white', p: 0.5 }}
                >
                  {isFullscreen ? <FullscreenExit sx={{ fontSize: 18 }} /> : <Fullscreen sx={{ fontSize: 18 }} />}
                </IconButton>
              </Stack>
            </Box>
          </Toolbar>
          
          {/* Progress bar */}
          <LinearProgress 
            variant="determinate" 
            value={progress}
            sx={{ 
              height: 3,
              bgcolor: alpha(theme.palette.common.white, 0.2),
              '& .MuiLinearProgress-bar': {
                bgcolor: theme.palette.secondary.main
              }
            }}
          />
        </Box>

        {/* Main content - Centered and responsive */}
        <Container 
          maxWidth="md" 
          sx={{ 
            py: 8, 
            width: '100%',
            mt: '56px', // Account for fixed header
            mb: '56px' // Account for fixed footer
          }}
        >
          <Slide direction="left" in mountOnEnter unmountOnExit key={currentQuestion}>
            <Card 
              elevation={8} 
              sx={{ 
                borderRadius: { xs: 2, sm: 3 }, 
                overflow: 'hidden',
                maxWidth: '100%',
                mx: 'auto'
              }}
            >
              {/* Question header */}
              <CardContent sx={{ 
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                borderBottom: `2px solid ${theme.palette.primary.main}`,
                py: 1.5,
                px: 2
              }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography 
                    variant="subtitle1" 
                    color="primary" 
                    fontWeight="bold"
                    sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
                  >
                    Question {currentQuestion + 1} of {testData.questions.length}
                  </Typography>
                  <Chip 
                    label={currentQ?.category || 'General'} 
                    size="small"
                    sx={{ 
                      bgcolor: theme.palette.primary.main,
                      color: 'white',
                      fontSize: { xs: '0.6rem', sm: '0.75rem' },
                      height: { xs: 20, sm: 24 }
                    }}
                  />
                </Stack>
              </CardContent>

              {/* Question content */}
              <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
                <Typography 
                  variant="h6" 
                  gutterBottom 
                  sx={{ 
                    lineHeight: 1.5,
                    mb: 3,
                    fontWeight: 500,
                    fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' }
                  }}
                >
                  {currentQ?.question}
                </Typography>

                {/* Answer options - Responsive grid */}
                <RadioGroup
                  value={answers[currentQuestion] !== undefined ? answers[currentQuestion] : ''}
                  onChange={(e) => handleAnswerSelect(parseInt(e.target.value))}
                >
                  <Box sx={{ 
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr', md: '1fr' },
                    gap: { xs: 1.5, sm: 2 },
                    mt: 2
                  }}>
                    {currentQ?.options?.map((option, index) => (
                      <FormControlLabel
                        key={index}
                        value={index}
                        control={<Radio size="small" />}
                        label={
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontSize: { xs: '0.9rem', sm: '1rem' }, 
                              py: 0.5,
                              lineHeight: 1.4
                            }}
                          >
                            {option}
                          </Typography>
                        }
                        sx={{
                          border: answers[currentQuestion] === index 
                            ? `2px solid ${theme.palette.primary.main}`
                            : `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                          borderRadius: 1.5,
                          p: { xs: 1, sm: 1.5 },
                          m: 0,
                          transition: 'all 0.3s ease',
                          bgcolor: answers[currentQuestion] === index 
                            ? alpha(theme.palette.primary.main, 0.1)
                            : 'transparent',
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.05),
                            borderColor: theme.palette.primary.main
                          },
                          alignItems: 'flex-start'
                        }}
                      />
                    )) || []}
                  </Box>
                </RadioGroup>
              </CardContent>
            </Card>
          </Slide>
        </Container>

        {/* Navigation - Fixed at bottom */}
        <Box sx={{ 
          position: 'fixed', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          zIndex: 1200,
          bgcolor: alpha(theme.palette.grey[50], 0.9),
          backdropFilter: 'blur(10px)',
          borderTop: `1px solid ${theme.palette.divider}`,
          p: 1
        }}>
          <Container maxWidth="md">
            <Stack 
              direction="row" 
              justifyContent="space-between" 
              alignItems="center"
              spacing={1}
            >
              <Button
                startIcon={<KeyboardArrowLeft />}
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
                variant="outlined"
                size="small"
                sx={{ 
                  minWidth: { xs: '80px', sm: '100px' },
                  fontSize: { xs: '0.7rem', sm: '0.875rem' },
                  py: 0.5,
                  px: 1
                }}
              >
Previous
              </Button>

              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              >
                {currentQuestion + 1} / {testData.questions.length}
              </Typography>

              {isLastQuestion ? (
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => setShowConfirmDialog(true)}
                  disabled={getAnsweredCount() === 0}
                  sx={{ 
                    bgcolor: 'success.main',
                    '&:hover': { bgcolor: 'success.dark' },
                    minWidth: { xs: '80px', sm: '120px' },
                    fontSize: { xs: '0.7rem', sm: '0.875rem' },
                    py: 0.5,
                    px: 1
                  }}
                >
                  Submit
                </Button>
              ) : (
                <Button
                  endIcon={<KeyboardArrowRight />}
                  onClick={handleNext}
                  variant="contained"
                  size="small"
                  disabled={answers[currentQuestion] === -1}
                  sx={{ 
                    minWidth: { xs: '80px', sm: '100px' },
                    fontSize: { xs: '0.7rem', sm: '0.875rem' },
                    py: 0.5,
                    px: 1
                  }}
                >
Next
                </Button>
              )}
            </Stack>
          </Container>
        </Box>

        {/* Submit confirmation dialog */}
        <Dialog
          open={showConfirmDialog}
          onClose={() => !submitting && setShowConfirmDialog(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Submit Assessment</DialogTitle>
          <DialogContent>
            <Typography gutterBottom>
              Are you sure you want to submit your assessment?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You have answered {getAnsweredCount()} out of {testData.questions.length} questions.
              {getAnsweredCount() < testData.questions.length && 
                ' Unanswered questions will be marked as skipped.'}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setShowConfirmDialog(false)}
              disabled={submitting}
              size="small"
            >
              Review Answers
            </Button>
            <Button
              onClick={handleSubmitTest}
              variant="contained"
              disabled={submitting}
              size="small"
              sx={{ 
                bgcolor: 'success.main',
                '&:hover': { bgcolor: 'success.dark' }
              }}
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  // Fallback
  return (
    <Container maxWidth="md" sx={{ py: 4, minHeight: '100vh' }}>
      <Alert severity="info">
        Loading assessment...
      </Alert>
    </Container>
  );
};

export default SimplifiedTestTaking;
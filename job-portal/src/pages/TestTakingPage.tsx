import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  LinearProgress,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Psychology,
  Timer,
  CheckCircle,
  ExitToApp,
  KeyboardArrowRight,
  Fullscreen,
  FullscreenExit
} from '@mui/icons-material';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { simplePsychometricService, SimpleTestSession } from '../services/simplePsychometricService';

const TestTakingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const fullscreenRef = useRef<HTMLDivElement>(null);
  
  // Debug new tab detection
  const isNewTab = document.referrer === '' || window.opener !== null;
  const isDirectAccess = !document.referrer;
  
  // Get test session ID from URL params with multiple fallbacks for new tab compatibility
  const sessionId = searchParams.get('sessionId') || 
                   searchParams.get('session') || 
                   searchParams.get('id') ||
                   searchParams.get('testSessionId');
  const jobTitle = searchParams.get('jobTitle') || 'Psychometric Test';
  const company = searchParams.get('company') || '';
  
  // Log tab opening context for debugging
  console.log('🔍 Test page loaded:', {
    isNewTab,
    isDirectAccess,
    hasOpener: window.opener !== null,
    referrer: document.referrer,
    currentUrl: window.location.href,
    urlParams: Object.fromEntries(searchParams.entries()),
    sessionIdFromUrl: sessionId
  });

  // States
  const [currentSession, setCurrentSession] = useState<SimpleTestSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(true);

  useEffect(() => {
    console.log('🔍 Session validation in new tab:', {
      sessionId: sessionId,
      sessionIdType: typeof sessionId,
      isValidString: sessionId && sessionId !== 'undefined' && sessionId !== 'null' && sessionId.trim() !== '',
      urlSearchParams: window.location.search,
      allUrlParams: Object.fromEntries(searchParams.entries()),
      isNewTab,
      isDirectAccess
    });
    
    // Try to recover session ID from different sources if main attempt failed
    let recoveredSessionId = sessionId;
    
    if (!recoveredSessionId || recoveredSessionId === 'undefined' || recoveredSessionId === 'null' || recoveredSessionId.trim() === '') {
      // Try to get from URL hash (in case it's passed as #sessionId=...)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      recoveredSessionId = hashParams.get('sessionId') || hashParams.get('session');
      
      // Try to get from sessionStorage (if it was stored there previously)
      if (!recoveredSessionId) {
        recoveredSessionId = sessionStorage.getItem('currentTestSessionId');
        console.log('🔄 Attempting to recover session ID from sessionStorage:', recoveredSessionId);
      }
      
      // Try to get from localStorage as last resort
      if (!recoveredSessionId) {
        recoveredSessionId = localStorage.getItem('currentTestSessionId');
        console.log('🔄 Attempting to recover session ID from localStorage:', recoveredSessionId);
      }
    }
    
    if (recoveredSessionId && recoveredSessionId !== 'undefined' && recoveredSessionId !== 'null' && recoveredSessionId.trim() !== '') {
      // Validate ObjectId format
      if (!/^[0-9a-fA-F]{24}$/.test(recoveredSessionId)) {
        console.error('❌ Invalid session ID format:', recoveredSessionId);
        setError(`Invalid test session ID format. Expected 24-character ObjectId, got: "${recoveredSessionId}". Please start a test from the main page.`);
        setLoading(false);
        return;
      }
      
      // Store the recovered session ID for future use
      if (recoveredSessionId !== sessionId) {
        sessionStorage.setItem('currentTestSessionId', recoveredSessionId);
        console.log('✅ Recovered session ID stored for future use:', recoveredSessionId);
      }
      
      // Set the active session ID and load the session
      setActiveSessionId(recoveredSessionId);
      loadTestSession(recoveredSessionId);
    } else {
      console.error('❌ No valid session ID found after recovery attempts:', { 
        originalSessionId: sessionId, 
        recoveredSessionId,
        type: typeof recoveredSessionId
      });
      setError('No test session found. Please start a test from the main page.');
      setLoading(false);
    }
  }, [sessionId, isNewTab, isDirectAccess]);

  useEffect(() => {
    let interval: any;
    if (timeRemaining > 0 && currentSession) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleTestSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timeRemaining, currentSession]);

  // Prevent browser navigation during test
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Are you sure you want to leave? Your test progress will be lost.';
    };

    const handlePopstate = (e: PopStateEvent) => {
      if (window.confirm('Are you sure you want to leave the test? Your progress will be lost.')) {
        // Allow navigation
        return;
      } else {
        window.history.pushState(null, '', window.location.href);
      }
    };

    // Add history entry to prevent back navigation
    window.history.pushState(null, '', window.location.href);
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopstate);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopstate);
    };
  }, []);

  // Function to enter full-screen mode
  const enterFullscreen = () => {
    const element = fullscreenRef.current;
    if (!element) return;

    try {
      if (element.requestFullscreen) {
        element.requestFullscreen();
      } else if ((element as any).mozRequestFullScreen) { // Firefox
        (element as any).mozRequestFullScreen();
      } else if ((element as any).webkitRequestFullscreen) { // Chrome, Safari and Opera
        (element as any).webkitRequestFullscreen();
      } else if ((element as any).msRequestFullscreen) { // IE/Edge
        (element as any).msRequestFullscreen();
      }
    } catch (error) {
      console.error('Error entering fullscreen:', error);
    }
  };

  // Function to exit full-screen mode
  const exitFullscreen = () => {
    try {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).mozCancelFullScreen) { // Firefox
        (document as any).mozCancelFullScreen();
      } else if ((document as any).webkitExitFullscreen) { // Chrome, Safari and Opera
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) { // IE/Edge
        (document as any).msExitFullscreen();
      }
    } catch (error) {
      console.error('Error exiting fullscreen:', error);
    }
  };

  // Function to toggle fullscreen mode
  const toggleFullscreen = () => {
    if (isFullscreen) {
      exitFullscreen();
      setIsFullscreen(false);
    } else {
      enterFullscreen();
      setIsFullscreen(true);
    }
  };

  // Listen for fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Enter fullscreen when component mounts
  useEffect(() => {
    // Add a small delay to ensure the DOM is fully rendered
    const timer = setTimeout(() => {
      enterFullscreen();
    }, 300);
    
    return () => {
      clearTimeout(timer);
      exitFullscreen();
    };
  }, []);

  // Enter fullscreen when test session is loaded
  useEffect(() => {
    if (currentSession && fullscreenRef.current) {
      // Add a small delay to ensure the DOM is fully rendered
      const timer = setTimeout(() => {
        enterFullscreen();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [currentSession]);

  const loadTestSession = async (sessionIdToLoad?: string) => {
    try {
      setLoading(true);
      const sessionIdToUse = sessionIdToLoad || activeSessionId || sessionId;
      
      console.log('🔍 Loading test session:', {
        sessionIdToUse: sessionIdToUse,
        sessionIdToLoad: sessionIdToLoad,
        activeSessionId: activeSessionId,
        originalSessionId: sessionId,
        sessionIdType: typeof sessionIdToUse
      });
      
      if (!sessionIdToUse) {
        throw new Error('No valid session ID available for loading test session');
      }
      
      const session = await simplePsychometricService.getTestSession(sessionIdToUse);
      console.log('✅ Test session loaded:', {
        sessionId: session.sessionId,
        questionsCount: session.questions.length,
        timeLimit: session.timeLimit
        // Note: SimpleTestSession doesn't have status and isCompleted properties
      });
      
      // Check if test is already completed - prevent retaking
      // Note: Simple service handles this on the backend, so we'll just proceed
      // In a real implementation, you might want to check localStorage or make an API call
      
      setCurrentSession(session);
      setAnswers(new Array(session.questions.length).fill(-1));
      setTimeRemaining(session.timeLimit * 60);
    } catch (error: any) {
      console.error('❌ Failed to load test session:', error);
      setError(error.message || 'Failed to load test session');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < currentSession!.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleTestSubmit = async () => {
    if (!currentSession) return;
    
    const sessionIdToUse = activeSessionId || sessionId;
    if (!sessionIdToUse) {
      setError('No valid session ID found for test submission');
      return;
    }
    
    setSubmitting(true);
    console.log('🚀 Submitting test:', {
      activeSessionId: activeSessionId,
      urlSessionId: sessionId,
      currentSessionId: currentSession.sessionId,
      sessionIdToUse: sessionIdToUse,
      sessionIdType: typeof sessionIdToUse,
      answers: answers,
      answersLength: answers.length
    });
    
    try {
      // Get job and test type information for proper tracking
      const jobId = currentSession?.job?._id || searchParams.get('jobId');
      const testType = (searchParams.get('testType') as 'free' | 'premium') || 'premium'; // Default to premium for psychometric tests
      
      const result = await simplePsychometricService.submitSimpleTest(
        sessionIdToUse,
        answers,
        undefined, // timeSpent - will be calculated automatically
        jobId,
        testType
      );
      
      console.log('✅ Test submitted successfully, showing results in same tab:', result);
      
      // Store result in session storage as backup
      sessionStorage.setItem('testResult', JSON.stringify(result));
      
      // Show results in the same tab instead of redirecting
      setTestResult(result);
      setShowResults(true);
      setSubmitting(false);
      
      // Clear the stored session ID since test is completed
      sessionStorage.removeItem('currentTestSessionId');
      localStorage.removeItem('currentTestSessionId');
    } catch (error: any) {
      console.error('❌ Test submission error:', error);
      setError(error.message || 'Failed to submit test');
      setSubmitting(false);
    }
  };

  const handleExitTest = () => {
    if (window.confirm('Are you sure you want to exit the test? Your progress will be lost.')) {
      window.close(); // Close the tab/window
      // Fallback: navigate back to main page
      setTimeout(() => {
        window.location.href = '/tests';
      }, 100);
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Box
        sx={{
          height: '100vh',
          width: '100vw',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 50%, #90caf9 100%)'
        }}
      >
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6">Loading Test...</Typography>
        </Paper>
      </Box>
    );
  }

  if (error) {
    const isAlreadyCompleted = error.includes('already been completed');
    
    return (
      <Box
        sx={{
          height: '100vh',
          width: '100vw',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 50%, #90caf9 100%)'
        }}
      >
        <Paper sx={{ p: 4, maxWidth: 500, textAlign: 'center' }}>
          <Alert severity={isAlreadyCompleted ? 'warning' : 'error'} sx={{ mb: 3 }}>
            {error}
          </Alert>
          
          {isAlreadyCompleted && (
            <Box sx={{ mb: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                <strong>What happens next?</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                • You can view your existing test results
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                • If you need to retake the test, contact your super admin
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Each test can only be taken once for fairness
              </Typography>
            </Box>
          )}
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            {isAlreadyCompleted && (
              <>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => {
                    const sessionIdToUse = activeSessionId || sessionId;
                    window.location.href = `/app/test-results${sessionIdToUse ? `?sessionId=${sessionIdToUse}` : ''}`;
                  }}
                  sx={{ px: 3 }}
                >
                  View My Results
                </Button>
                
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => {
                    // Navigate to psychometric tests page to request new test
                    window.location.href = '/app/tests';
                  }}
                  sx={{ px: 3, backgroundColor: '#ff9800' }}
                >
                  Request New Test
                </Button>
              </>
            )}
            
            <Button
              variant="outlined"
              onClick={() => {
                // Close tab first, fallback to tests page
                window.close();
                setTimeout(() => {
                  window.location.href = '/app/tests';
                }, 100);
              }}
              sx={{ px: 3 }}
            >
              {isAlreadyCompleted ? 'Close' : 'Back to Tests'}
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  }

  if (!currentSession) return null;

  const currentQuestion = currentSession.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / currentSession.questions.length) * 100;

  return (
    <div ref={fullscreenRef} style={{ 
      backgroundColor: '#f5f5f5', 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <Box sx={{ 
        width: '100%', 
        maxWidth: '1200px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        <Paper 
          elevation={12} 
          sx={{ 
            p: { xs: 1, md: 2 }, 
            width: '100%',
            maxWidth: '1200px',
            minHeight: '750px',
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '95vh',
            height: '95vh'
          }}
        >
          {/* Header with Exit Button */}
          <Box sx={{ mb: 2 }}>
            {/* Top Bar with Exit Button and Fullscreen Toggle */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              mb: 2,
              p: 1.5,
              bgcolor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 2,
              backdropFilter: 'blur(10px)'
            }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                ExJobNet - Assessment Center
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={toggleFullscreen}
                  startIcon={isFullscreen ? <FullscreenExit /> : <Fullscreen />}
                  sx={{ 
                    borderRadius: 2,
                    px: 1.5,
                    py: 0.5,
                    fontSize: '0.75rem',
                    minWidth: 'auto'
                  }}
                >
                  {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={handleExitTest}
                  startIcon={<ExitToApp />}
                  sx={{ 
                    borderRadius: 2,
                    px: 2,
                    py: 0.5,
                    fontSize: '0.75rem'
                  }}
                >
                  Exit
                </Button>
              </Box>
            </Box>

            {/* Main Title Section */}
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography variant="h5" sx={{ 
                fontWeight: 600, 
                color: 'primary.main',
                mb: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                fontSize: { xs: '1.25rem', md: '1.5rem' }
              }}>
                <Psychology sx={{ fontSize: { xs: 24, md: 30 } }} />
                Psychometric Assessment
              </Typography>
              
              <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 400, fontSize: '0.9rem' }}>
                {jobTitle} {company && `- ${company}`}
              </Typography>
            </Box>

            {/* Progress and Timer Section */}
            <Paper elevation={2} sx={{ p: 2, borderRadius: 2, mb: 2, bgcolor: 'rgba(255, 255, 255, 0.9)' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="subtitle1" fontWeight={500} color="primary.main" sx={{ fontSize: '1rem' }}>
                    Question {currentQuestionIndex + 1} of {currentSession.questions.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    {currentQuestion.category && `Category: ${currentQuestion.category}`}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Timer sx={{ color: timeRemaining < 300 ? 'error.main' : 'success.main', fontSize: 20 }} />
                  <Box>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        color: timeRemaining < 300 ? 'error.main' : 'success.main',
                        fontWeight: 600,
                        fontSize: '1.1rem'
                      }}
                    >
                      {formatTime(timeRemaining)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      Time Remaining
                    </Typography>
                  </Box>
                </Box>
              </Box>
              
              <LinearProgress 
                variant="determinate" 
                value={progress} 
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  bgcolor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                    background: 'linear-gradient(90deg, #4caf50 0%, #8bc34a 100%)'
                  }
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                <Typography variant="caption" color="success.main" sx={{ fontSize: '0.75rem' }}>
                  {Math.round(progress)}% Complete
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                  {currentSession.questions.length - currentQuestionIndex - 1} questions left
                </Typography>
              </Box>
            </Paper>
          </Box>

          {/* Question Display - Centered and Responsive */}
          <Paper 
            elevation={4} 
            sx={{ 
              p: { xs: 2, md: 3 }, 
              mb: 3, 
              borderRadius: 3, 
              bgcolor: 'background.paper',
              minHeight: '300px',
              display: 'flex',
              flexDirection: 'column',
              flexGrow: 1,
              overflow: 'auto'
            }}
          >
            {/* Question Text */}
            <Box sx={{ flex: 1, mb: 3 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 3, 
                  lineHeight: 1.5,
                  fontSize: { xs: '1.1rem', md: '1.25rem', lg: '1.4rem' },
                  fontWeight: 500,
                  textAlign: 'left',
                  color: 'primary.dark'
                }}
              >
                {currentQuestion.question}
              </Typography>
            </Box>

            {/* Answer Options - Responsive Grid */}
            <FormControl component="fieldset" sx={{ width: '100%' }}>
              <RadioGroup
                value={answers[currentQuestionIndex]}
                onChange={(e) => handleAnswerSelect(parseInt(e.target.value))}
                sx={{ gap: 2 }}
              >
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: { xs: '1fr', sm: '1fr', md: '1fr 1fr' }, 
                  gap: 2 
                }}>
                  {currentQuestion.options.map((option, index) => (
                    <Paper
                      key={index}
                      elevation={answers[currentQuestionIndex] === index ? 4 : 1}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: answers[currentQuestionIndex] === index ? '2px solid' : '1px solid',
                        borderColor: answers[currentQuestionIndex] === index ? 'primary.main' : 'divider',
                        bgcolor: answers[currentQuestionIndex] === index ? 'primary.50' : 'background.paper',
                        transition: 'all 0.2s ease-in-out',
                        cursor: 'pointer',
                        minHeight: '60px',
                        display: 'flex',
                        alignItems: 'center',
                        '&:hover': {
                          elevation: 3,
                          borderColor: 'primary.main',
                          transform: 'translateY(-1px)',
                          bgcolor: answers[currentQuestionIndex] === index ? 'primary.100' : 'primary.25'
                        }
                      }}
                      onClick={() => handleAnswerSelect(index)}
                    >
                      <FormControlLabel
                        value={index}
                        control={
                          <Radio 
                            sx={{ 
                              mr: 2,
                              transform: 'scale(1.1)'
                            }} 
                          />
                        }
                        label={
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontSize: { xs: '0.9rem', md: '1rem' },
                              lineHeight: 1.4,
                              fontWeight: answers[currentQuestionIndex] === index ? 500 : 400
                            }}
                          >
                            {option}
                          </Typography>
                        }
                        sx={{ 
                          width: '100%', 
                          margin: 0,
                          alignItems: 'center'
                        }}
                      />
                    </Paper>
                  ))}
                </Box>
              </RadioGroup>
            </FormControl>
          </Paper>

          {/* Navigation - Centered and Responsive */}
          <Paper elevation={3} sx={{ 
            p: 2, 
            borderRadius: 2, 
            bgcolor: 'grey.50',
            flexShrink: 0
          }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              flexWrap: { xs: 'wrap', sm: 'nowrap' },
              gap: { xs: 1, sm: 2 }
            }}>
              <Button
                variant="outlined"
                size="medium"
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                sx={{ 
                  px: { xs: 2, sm: 3 }, 
                  py: 1.5, 
                  fontSize: '0.9rem',
                  borderRadius: 2,
                  minWidth: { xs: '80px', sm: '100px' }
                }}
              >
                Previous
              </Button>

              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                gap: 0.5,
                flex: { xs: '1 1 100%', sm: '0 1 auto' },
                my: { xs: 1, sm: 0 }
              }}>
                <Typography variant="subtitle2" color="text.primary" sx={{ fontWeight: 500, fontSize: '0.9rem' }}>
                  Progress: {answers.filter(a => a !== -1).length} / {currentSession.questions.length}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="caption" color="success.main" sx={{ fontSize: '0.75rem' }}>
                    ✓ {answers.filter(a => a !== -1).length} Answered
                  </Typography>
                  <Typography variant="caption" color="warning.main" sx={{ fontSize: '0.75rem' }}>
                    ⏳ {currentSession.questions.length - answers.filter(a => a !== -1).length} Remaining
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                {currentQuestionIndex === currentSession.questions.length - 1 ? (
                  <Button
                    variant="contained"
                    color="success"
                    size="medium"
                    onClick={handleTestSubmit}
                    disabled={submitting || answers[currentQuestionIndex] === -1}
                    startIcon={submitting ? <CircularProgress size={16} /> : <CheckCircle />}
                    sx={{ 
                      px: { xs: 2, sm: 3 }, 
                      py: 1.5, 
                      fontSize: '0.9rem',
                      borderRadius: 2,
                      minWidth: { xs: '100px', sm: '120px' }
                    }}
                  >
                    {submitting ? 'Submitting...' : 'Submit'}
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    size="medium"
                    onClick={handleNextQuestion}
                    disabled={answers[currentQuestionIndex] === -1}
                    endIcon={<KeyboardArrowRight />}
                    sx={{ 
                      px: { xs: 2, sm: 3 }, 
                      py: 1.5, 
                      fontSize: '0.9rem',
                      borderRadius: 2,
                      minWidth: { xs: '80px', sm: '100px' }
                    }}
                  >
                    Next
                  </Button>
                )}
              </Box>
            </Box>
          </Paper>
        </Paper>
      </Box>
      
      {/* Results Modal - Shows in same tab after test submission */}
      {showResults && testResult && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
        >
          <Paper
            sx={{
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              p: 4,
              borderRadius: 3,
              textAlign: 'center',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              position: 'relative'
            }}
          >
            <Box sx={{ mb: 3 }}>
              <CheckCircle sx={{ fontSize: 64, color: '#4CAF50', mb: 2 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                Test Completed!
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9, mb: 3 }}>
                Congratulations on completing the psychometric test
              </Typography>
            </Box>

            <Box sx={{ mb: 4, textAlign: 'left' }}>
              <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
                Your Results
              </Typography>
              
              {testResult.scores && Object.keys(testResult.scores).length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                    Personality Scores:
                  </Typography>
                  {Object.entries(testResult.scores).map(([trait, score]: [string, any]) => (
                    <Box key={trait} sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                        {trait}:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {typeof score === 'number' ? `${score}/5` : score}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}

              {testResult.jobMatch && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                    Job Match Score:
                  </Typography>
                  <Typography variant="h5" sx={{ color: '#4CAF50', fontWeight: 'bold' }}>
                    {typeof testResult.jobMatch === 'number' 
                      ? `${testResult.jobMatch}%`
                      : testResult.jobMatch}
                  </Typography>
                </Box>
              )}

              {testResult.feedback && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                    Feedback:
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    background: 'rgba(255, 255, 255, 0.1)',
                    p: 2,
                    borderRadius: 2,
                    lineHeight: 1.6
                  }}>
                    {testResult.feedback}
                  </Typography>
                </Box>
              )}
            </Box>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                color="success"
                onClick={() => {
                  // Navigate to detailed test results page with the session/result ID
                  const sessionIdToUse = activeSessionId || sessionId;
                  window.location.href = `/app/test-results?sessionId=${sessionIdToUse}&resultId=${testResult?.resultId || testResult?._id}`;
                }}
                sx={{
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                  fontWeight: 'bold',
                  backgroundColor: '#4CAF50',
                  '&:hover': {
                    backgroundColor: '#45a049'
                  }
                }}
              >
                View Detailed Results
              </Button>
              
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  // Navigate to tests page to request new test - NOT to jobs
                  window.location.href = '/app/tests';
                }}
                sx={{
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                  fontWeight: 'bold',
                  backgroundColor: '#2196F3',
                  '&:hover': {
                    backgroundColor: '#1976D2'
                  }
                }}
              >
                Request New Test
              </Button>
              
              <Button
                variant="outlined"
                onClick={() => {
                  // Close the current tab
                  window.close();
                  // Fallback if tab can't be closed
                  setTimeout(() => {
                    window.location.href = '/app/tests';
                  }, 100);
                }}
                sx={{
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                  color: 'white',
                  borderColor: 'white',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                Close Tab
              </Button>
            </Box>
          </Paper>
        </Box>
      )}
    </div>
  );
};

export default TestTakingPage;
import React, { useState, useEffect } from 'react';
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
  ExitToApp
} from '@mui/icons-material';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { simplePsychometricService, SimpleTestSession } from '../services/simplePsychometricService';

const TestTakingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Get test session ID from URL params
  const sessionId = searchParams.get('sessionId');
  const jobTitle = searchParams.get('jobTitle') || 'Psychometric Test';
  const company = searchParams.get('company') || '';

  // States
  const [currentSession, setCurrentSession] = useState<SimpleTestSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId && sessionId !== 'undefined' && sessionId.trim() !== '') {
      // Validate ObjectId format
      if (!/^[0-9a-fA-F]{24}$/.test(sessionId)) {
        setError('Invalid test session ID. Please start a test from the main page.');
        setLoading(false);
        return;
      }
      loadTestSession();
    } else {
      setError('No test session found. Please start a test from the main page.');
      setLoading(false);
    }
  }, [sessionId]);

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

  const loadTestSession = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading test session:', {
        sessionId: sessionId,
        sessionIdType: typeof sessionId
      });
      
      const session = await simplePsychometricService.getTestSession(sessionId!);
      console.log('✅ Test session loaded:', {
        sessionId: session.sessionId,
        questionsCount: session.questions.length,
        timeLimit: session.timeLimit
      });
      
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
    
    setSubmitting(true);
    console.log('🚀 Submitting test:', {
      sessionId: currentSession.sessionId,
      sessionIdType: typeof currentSession.sessionId,
      answers: answers,
      answersLength: answers.length
    });
    
    try {
      const result = await simplePsychometricService.submitSimpleTest(
        currentSession.sessionId,
        answers
      );
      
      // Store result in session storage for results page
      sessionStorage.setItem('testResult', JSON.stringify(result));
      
      // Navigate to results page
      window.location.href = `/test-results?fromTest=true`;
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
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
          <Button
            variant="contained"
            onClick={() => window.location.href = '/tests'}
          >
            Back to Tests
          </Button>
        </Paper>
      </Box>
    );
  }

  if (!currentSession) return null;

  const currentQuestion = currentSession.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / currentSession.questions.length) * 100;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 50%, #90caf9 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <Box sx={{ 
        width: '100%', 
        maxWidth: '1400px',
        display: 'flex',
        justifyContent: 'center'
      }}>
        <Paper 
          elevation={12} 
          sx={{ 
            p: { xs: 2, md: 3 }, 
            width: '100%',
            maxWidth: '1400px',
            minHeight: '600px',
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
          }}
        >
          {/* Header with Exit Button */}
          <Box sx={{ mb: 2 }}>
            {/* Top Bar with Exit Button */}
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
                Excellence Coaching Hub - Assessment Center
              </Typography>
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

          {/* Question Display */}
          <Paper 
            elevation={4} 
            sx={{ 
              p: { xs: 2, md: 3 }, 
              mb: 3, 
              borderRadius: 3, 
              bgcolor: 'background.paper',
              minHeight: '350px',
              display: 'flex',
              flexDirection: 'column'
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

            {/* Answer Options */}
            <FormControl component="fieldset" sx={{ width: '100%' }}>
              <RadioGroup
                value={answers[currentQuestionIndex]}
                onChange={(e) => handleAnswerSelect(parseInt(e.target.value))}
                sx={{ gap: 2 }}
              >
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
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

          {/* Navigation */}
          <Paper elevation={3} sx={{ p: 2, borderRadius: 2, bgcolor: 'grey.50' }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2
            }}>
              <Button
                variant="outlined"
                size="medium"
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                sx={{ 
                  px: 3, 
                  py: 1.5, 
                  fontSize: '0.9rem',
                  borderRadius: 2,
                  minWidth: '100px'
                }}
              >
                Previous
              </Button>

              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                gap: 0.5
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
                      px: 3, 
                      py: 1.5, 
                      fontSize: '0.9rem',
                      borderRadius: 2,
                      minWidth: '120px'
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
                    sx={{ 
                      px: 3, 
                      py: 1.5, 
                      fontSize: '0.9rem',
                      borderRadius: 2,
                      minWidth: '100px'
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
    </Box>
  );
};

export default TestTakingPage;
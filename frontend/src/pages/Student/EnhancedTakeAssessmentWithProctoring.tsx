import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
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
  Paper,
  Grid,
  AppBar,
  Toolbar,
  Stack,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Timer,
  Save,
  Send,
  Warning,
  CheckCircle,
  NavigateNext,
  NavigateBefore,
  Flag,
  Security,
  Fullscreen,
  FullscreenExit
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { assessmentService, IAssessment } from '../../services/assessmentService';
import EnhancedAssessmentInterface from '../../components/Assessment/EnhancedAssessmentInterface';

// Custom Button component that completely avoids theme access issues
const SafeButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'contained' | 'outlined' | 'text';
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  disabled?: boolean;
  fullWidth?: boolean;
  size?: 'small' | 'medium' | 'large';
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  sx?: any;
  className?: string;
}> = ({ 
  children, 
  onClick, 
  variant = 'contained', 
  color = 'primary', 
  disabled = false,
  fullWidth = false,
  size = 'medium',
  startIcon,
  endIcon,
  sx = {},
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const colorMap = {
    primary: { main: '#1976d2', dark: '#1565c0', light: '#42a5f5', contrastText: '#ffffff' },
    secondary: { main: '#dc004e', dark: '#9a0036', light: '#ff5983', contrastText: '#ffffff' },
    success: { main: '#4caf50', dark: '#388e3c', light: '#81c784', contrastText: '#ffffff' },
    error: { main: '#f44336', dark: '#d32f2f', light: '#e57373', contrastText: '#ffffff' },
    warning: { main: '#ff9800', dark: '#f57c00', light: '#ffb74d', contrastText: '#000000' },
    info: { main: '#2196f3', dark: '#1976d2', light: '#64b5f6', contrastText: '#ffffff' }
  };

  const getButtonStyles = (): React.CSSProperties => {
    const colorScheme = colorMap[color];
    
    const baseStyles: React.CSSProperties = {
      padding: size === 'small' ? '6px 12px' : size === 'large' ? '12px 24px' : '8px 16px',
      borderRadius: '4px',
      textTransform: 'none',
      fontWeight: 500,
      fontSize: size === 'small' ? '0.8125rem' : size === 'large' ? '0.9375rem' : '0.875rem',
      minWidth: size === 'small' ? '64px' : '80px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      border: 'none',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      width: fullWidth ? '100%' : 'auto',
      transition: 'all 0.2s ease-in-out',
      fontFamily: 'inherit',
      outline: 'none',
      textDecoration: 'none',
      boxSizing: 'border-box',
      userSelect: 'none',
      ...sx
    };

    if (disabled) {
      return {
        ...baseStyles,
        backgroundColor: '#e0e0e0',
        color: '#9e9e9e',
        opacity: 0.6,
        cursor: 'not-allowed'
      };
    }

    if (variant === 'contained') {
      return {
        ...baseStyles,
        backgroundColor: isHovered ? colorScheme.dark : colorScheme.main,
        color: colorScheme.contrastText,
        boxShadow: isHovered ? '0 2px 8px rgba(0,0,0,0.15)' : '0 1px 3px rgba(0,0,0,0.12)'
      };
    } else if (variant === 'outlined') {
      return {
        ...baseStyles,
        backgroundColor: isHovered ? `${colorScheme.main}08` : 'transparent',
        color: colorScheme.main,
        border: `1px solid ${colorScheme.main}`,
        borderColor: isHovered ? colorScheme.dark : colorScheme.main
      };
    } else {
      return {
        ...baseStyles,
        backgroundColor: isHovered ? `${colorScheme.main}08` : 'transparent',
        color: colorScheme.main
      };
    }
  };

  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={getButtonStyles()}
      disabled={disabled}
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {startIcon && <span style={{ display: 'flex', alignItems: 'center' }}>{startIcon}</span>}
      {children}
      {endIcon && <span style={{ display: 'flex', alignItems: 'center' }}>{endIcon}</span>}
    </button>
  );
};

interface Question {
  _id: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay' | 'fill_in_blank';
  question: string;
  options?: string[];
  correctAnswer?: string | string[];
  points: number;
  explanation?: string;
}

interface Answer {
  questionId: string;
  answer: string | string[];
  timeSpent?: number;
}

const EnhancedTakeAssessmentWithProctoring: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Assessment data
  const [assessment, setAssessment] = useState<IAssessment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saving' | 'saved' | 'error' | null>(null);
  
  // Proctoring state
  const [violations, setViolations] = useState<string[]>([]);
  const [assessmentStarted, setAssessmentStarted] = useState(false);

  // Load assessment data
  useEffect(() => {
    if (id) {
      loadAssessment();
    }
  }, [id]);

  // Timer effect
  useEffect(() => {
    if (timeRemaining !== null && timeRemaining > 0 && assessmentStarted) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 1) {
            handleAutoSubmit('Time expired');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeRemaining, assessmentStarted]);

  // Auto-save effect
  useEffect(() => {
    if (assessmentStarted && answers.length > 0) {
      const autoSaveTimer = setTimeout(() => {
        autoSaveProgress();
      }, 30000); // Auto-save every 30 seconds

      return () => clearTimeout(autoSaveTimer);
    }
  }, [answers, assessmentStarted]);

  const loadAssessment = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get assessment data from location state or fetch from API
      const assessmentData = location.state?.assessment;
      if (assessmentData) {
        setAssessment(assessmentData);
        setQuestions(assessmentData.questions || []);
        
        // Initialize answers array
        const initialAnswers = (assessmentData.questions || []).map((q: Question) => ({
          questionId: q._id,
          answer: q.type === 'multiple_choice' ? '' : q.type === 'fill_in_blank' ? [] : '',
          timeSpent: 0
        }));
        setAnswers(initialAnswers);

        // Set time limit
        if (assessmentData.timeLimit) {
          setTimeRemaining(assessmentData.timeLimit * 60); // Convert minutes to seconds
        }
      } else {
        // Fetch from API if not in state
        const response = await assessmentService.getAssessment(id!);
        setAssessment(response.assessment);
        setQuestions(response.assessment.questions || []);
        
        const initialAnswers = (response.assessment.questions || []).map((q: Question) => ({
          questionId: q._id,
          answer: q.type === 'multiple_choice' ? '' : q.type === 'fill_in_blank' ? [] : '',
          timeSpent: 0
        }));
        setAnswers(initialAnswers);

        if (response.assessment.timeLimit) {
          setTimeRemaining(response.assessment.timeLimit * 60);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load assessment');
    } finally {
      setLoading(false);
    }
  };

  const handleAssessmentStart = () => {
    setAssessmentStarted(true);
  };

  const handleViolation = (violation: string) => {
    setViolations(prev => [...prev, violation]);
  };

  const handleAnswerChange = (questionId: string, answer: string | string[]) => {
    setAnswers(prev => prev.map(a => 
      a.questionId === questionId ? { ...a, answer } : a
    ));
    setAutoSaveStatus(null);
  };

  const autoSaveProgress = async () => {
    if (!assessment || !user) return;

    try {
      setAutoSaveStatus('saving');
      
      // Save current progress
      await assessmentService.saveAssessmentProgress(assessment._id, {
        answers,
        currentQuestionIndex,
        timeRemaining,
        violations
      });
      
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus(null), 3000);
    } catch (error) {
      setAutoSaveStatus('error');
      console.error('Auto-save failed:', error);
    }
  };

  const handleAutoSubmit = async (reason: string) => {
    if (submitting) return;

    try {
      setSubmitting(true);
      
      await assessmentService.submitAssessment(assessment!._id, {
        answers,
        submissionType: 'auto',
        autoSubmitReason: reason,
        violations,
        timeSpent: assessment?.timeLimit ? (assessment.timeLimit * 60 - (timeRemaining || 0)) : 0
      });

      navigate('/dashboard/student/assessments', {
        state: { 
          message: `Assessment auto-submitted: ${reason}`,
          severity: 'warning'
        }
      });
    } catch (error) {
      console.error('Auto-submit failed:', error);
      setError('Failed to auto-submit assessment');
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;

    try {
      setSubmitting(true);
      
      await assessmentService.submitAssessment(assessment!._id, {
        answers,
        submissionType: 'manual',
        violations,
        timeSpent: assessment?.timeLimit ? (assessment.timeLimit * 60 - (timeRemaining || 0)) : 0
      });

      navigate('/dashboard/student/assessments', {
        state: { 
          message: 'Assessment submitted successfully!',
          severity: 'success'
        }
      });
    } catch (error: any) {
      setError(error.message || 'Failed to submit assessment');
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = (): 'error' | 'warning' | 'primary' => {
    if (!timeRemaining || !assessment?.timeLimit) return 'primary';
    const percentRemaining = timeRemaining / (assessment.timeLimit * 60);
    if (percentRemaining < 0.1) return 'error';
    if (percentRemaining < 0.25) return 'warning';
    return 'primary';
  };

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers.find(a => a.questionId === currentQuestion?._id);
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <LinearProgress sx={{ width: '100%', maxWidth: 400 }} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 4 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  if (!assessment || !user) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 4 }}>
          Assessment not found or user not authenticated.
        </Alert>
      </Container>
    );
  }

  return (
    <EnhancedAssessmentInterface
      assessmentId={assessment._id}
      studentId={user.id}
      assessmentTitle={assessment.title}
      onStart={handleAssessmentStart}
      onViolation={handleViolation}
    >
      {/* Assessment Header */}
      <AppBar position="sticky" color="default" elevation={1}>
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" noWrap>
                {assessment.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Question {currentQuestionIndex + 1} of {questions.length}
              </Typography>
            </Box>
            
            {/* Timer */}
            {timeRemaining !== null && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Timer sx={{ 
                  color: getTimeColor() === 'error' ? '#f44336' : 
                         getTimeColor() === 'warning' ? '#ff9800' : '#1976d2' 
                }} />
                <Typography 
                  variant="h6" 
                  color={getTimeColor() === 'error' ? 'error.main' : 'text.primary'}
                  sx={{ minWidth: 80, textAlign: 'center' }}
                >
                  {formatTime(timeRemaining)}
                </Typography>
              </Box>
            )}

            {/* Auto-save status */}
            {autoSaveStatus && (
              <Tooltip title={
                autoSaveStatus === 'saving' ? 'Saving...' :
                autoSaveStatus === 'saved' ? 'Progress saved' :
                'Save failed'
              }>
                <Chip
                  size="small"
                  icon={
                    autoSaveStatus === 'saving' ? <Timer /> :
                    autoSaveStatus === 'saved' ? <CheckCircle /> :
                    <Warning />
                  }
                  label={
                    autoSaveStatus === 'saving' ? 'Saving' :
                    autoSaveStatus === 'saved' ? 'Saved' :
                    'Error'
                  }
                  sx={{ 
                    ml: 1,
                    backgroundColor: autoSaveStatus === 'saving' ? '#e0e0e0' :
                                   autoSaveStatus === 'saved' ? '#4caf50' : '#f44336',
                    color: autoSaveStatus === 'saving' ? '#666666' : '#ffffff'
                  }}
                />
              </Tooltip>
            )}

            {/* Violations indicator */}
            {violations.length > 0 && (
              <Tooltip title={`${violations.length} violation(s) detected`}>
                <Chip
                  size="small"
                  icon={<Flag />}
                  label={violations.length}
                  sx={{ 
                    ml: 1,
                    backgroundColor: '#f44336',
                    color: '#ffffff'
                  }}
                />
              </Tooltip>
            )}
          </Box>
        </Toolbar>
        
        {/* Progress bar */}
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{ height: 4 }}
        />
      </AppBar>

      {/* Question Content */}
      <Container maxWidth="lg" sx={{ py: 3 }}>
        {currentQuestion && (
          <Card>
            <CardContent sx={{ p: 4 }}>
              {/* Question */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h5" gutterBottom>
                  Question {currentQuestionIndex + 1}
                </Typography>
                <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
                  {currentQuestion.question}
                </Typography>
                <Chip 
                  label={`${currentQuestion.points} point${currentQuestion.points !== 1 ? 's' : ''}`}
                  size="small"
                  variant="outlined"
                  sx={{
                    borderColor: '#1976d2',
                    color: '#1976d2'
                  }}
                />
              </Box>

              {/* Answer Input */}
              <Box sx={{ mb: 4 }}>
                {currentQuestion.type === 'multiple_choice' && (
                  <RadioGroup
                    value={currentAnswer?.answer || ''}
                    onChange={(e) => handleAnswerChange(currentQuestion._id, e.target.value)}
                  >
                    {currentQuestion.options?.map((option, index) => (
                      <FormControlLabel
                        key={index}
                        value={option}
                        control={<Radio />}
                        label={option}
                        sx={{ mb: 1 }}
                      />
                    ))}
                  </RadioGroup>
                )}

                {currentQuestion.type === 'true_false' && (
                  <RadioGroup
                    value={currentAnswer?.answer || ''}
                    onChange={(e) => handleAnswerChange(currentQuestion._id, e.target.value)}
                  >
                    <FormControlLabel value="true" control={<Radio />} label="True" />
                    <FormControlLabel value="false" control={<Radio />} label="False" />
                  </RadioGroup>
                )}

                {(currentQuestion.type === 'short_answer' || currentQuestion.type === 'essay') && (
                  <TextField
                    fullWidth
                    multiline
                    rows={currentQuestion.type === 'essay' ? 8 : 3}
                    value={currentAnswer?.answer || ''}
                    onChange={(e) => handleAnswerChange(currentQuestion._id, e.target.value)}
                    placeholder="Enter your answer here..."
                    variant="outlined"
                  />
                )}

                {currentQuestion.type === 'fill_in_blank' && (
                  <TextField
                    fullWidth
                    value={Array.isArray(currentAnswer?.answer) ? currentAnswer.answer.join(', ') : currentAnswer?.answer || ''}
                    onChange={(e) => handleAnswerChange(currentQuestion._id, e.target.value.split(', '))}
                    placeholder="Enter your answers separated by commas..."
                    variant="outlined"
                  />
                )}
              </Box>

              {/* Navigation */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <SafeButton
                  startIcon={<NavigateBefore />}
                  onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentQuestionIndex === 0}
                  variant="outlined"
                >
                  Previous
                </SafeButton>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <SafeButton
                    startIcon={<Save />}
                    onClick={autoSaveProgress}
                    disabled={autoSaveStatus === 'saving'}
                    variant="outlined"
                  >
                    Save Progress
                  </SafeButton>

                  {currentQuestionIndex === questions.length - 1 ? (
                    <SafeButton
                      startIcon={<Send />}
                      onClick={() => setShowSubmitDialog(true)}
                      disabled={submitting}
                      color="success"
                    >
                      Submit Assessment
                    </SafeButton>
                  ) : (
                    <SafeButton
                      variant="contained"
                      endIcon={<NavigateNext />}
                      onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                    >
                      Next
                    </SafeButton>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Question Navigator */}
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Question Navigator
            </Typography>
            <Grid container spacing={1}>
              {questions.map((_, index) => {
                const hasAnswer = answers[index]?.answer && 
                  (Array.isArray(answers[index].answer) ? 
                    answers[index].answer.length > 0 : 
                    answers[index].answer.toString().trim() !== '');
                
                return (
                  <Grid item key={index}>
                    <SafeButton
                      variant={index === currentQuestionIndex ? 'contained' : 'outlined'}
                      color={hasAnswer ? 'success' : 'primary'}
                      size="small"
                      onClick={() => setCurrentQuestionIndex(index)}
                      sx={{ minWidth: 40 }}
                    >
                      {index + 1}
                    </SafeButton>
                  </Grid>
                );
              })}
            </Grid>
          </CardContent>
        </Card>
      </Container>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitDialog} onClose={() => setShowSubmitDialog(false)}>
        <DialogTitle>Submit Assessment</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Are you sure you want to submit your assessment? This action cannot be undone.
          </Typography>
          
          {violations.length > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                <strong>Proctoring Violations Detected:</strong>
              </Typography>
              <Typography variant="body2">
                {violations.length} violation(s) were recorded during this assessment.
              </Typography>
            </Alert>
          )}

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Questions answered: {answers.filter(a => 
                a.answer && (Array.isArray(a.answer) ? a.answer.length > 0 : a.answer.toString().trim() !== '')
              ).length} of {questions.length}
            </Typography>
            {timeRemaining !== null && (
              <Typography variant="body2" color="text.secondary">
                Time remaining: {formatTime(timeRemaining)}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <SafeButton onClick={() => setShowSubmitDialog(false)} variant="outlined">
            Cancel
          </SafeButton>
          <SafeButton 
            onClick={handleSubmit} 
            variant="contained" 
            color="success"
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Assessment'}
          </SafeButton>
        </DialogActions>
      </Dialog>
    </EnhancedAssessmentInterface>
  );
};

export default EnhancedTakeAssessmentWithProctoring;
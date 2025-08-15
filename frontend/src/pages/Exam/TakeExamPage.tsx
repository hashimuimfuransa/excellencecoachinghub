import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  AppBar,
  Toolbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  Stack,
  Paper,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  TextField,
  Tooltip,
  Badge,
  Drawer,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Timer,
  Assignment,
  NavigateBefore,
  NavigateNext,
  Send,
  Save,
  Flag,
  Bookmark,
  BookmarkBorder,
  Menu,
  Close,
  Warning,
  CheckCircle,
  RadioButtonUnchecked,
  Fullscreen,
  FullscreenExit,
  Security,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';

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

// Custom IconButton component that completely avoids theme access issues
const SafeIconButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  color?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  sx?: any;
  className?: string;
}> = ({ 
  children, 
  onClick, 
  color = 'primary', 
  disabled = false,
  size = 'medium',
  sx = {},
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const colorMap = {
    inherit: { main: '#ffffff', dark: '#f5f5f5', light: '#ffffff', contrastText: '#000000' },
    primary: { main: '#1976d2', dark: '#1565c0', light: '#42a5f5', contrastText: '#ffffff' },
    secondary: { main: '#dc004e', dark: '#9a0036', light: '#ff5983', contrastText: '#ffffff' },
    success: { main: '#4caf50', dark: '#388e3c', light: '#81c784', contrastText: '#ffffff' },
    error: { main: '#f44336', dark: '#d32f2f', light: '#e57373', contrastText: '#ffffff' },
    warning: { main: '#ff9800', dark: '#f57c00', light: '#ffb74d', contrastText: '#000000' },
    info: { main: '#2196f3', dark: '#1976d2', light: '#64b5f6', contrastText: '#ffffff' }
  };

  const getIconButtonStyles = (): React.CSSProperties => {
    const colorScheme = colorMap[color];
    
    const baseStyles: React.CSSProperties = {
      padding: size === 'small' ? '4px' : size === 'large' ? '12px' : '8px',
      borderRadius: '50%',
      cursor: disabled ? 'not-allowed' : 'pointer',
      border: 'none',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: size === 'small' ? '32px' : size === 'large' ? '48px' : '40px',
      height: size === 'small' ? '32px' : size === 'large' ? '48px' : '40px',
      transition: 'all 0.2s ease-in-out',
      fontFamily: 'inherit',
      outline: 'none',
      textDecoration: 'none',
      boxSizing: 'border-box',
      userSelect: 'none',
      backgroundColor: 'transparent',
      ...sx
    };

    if (disabled) {
      return {
        ...baseStyles,
        color: '#9e9e9e',
        opacity: 0.6,
        cursor: 'not-allowed'
      };
    }

    return {
      ...baseStyles,
      color: color === 'inherit' ? 'inherit' : colorScheme.main,
      backgroundColor: isHovered ? `${colorScheme.main}12` : 'transparent'
    };
  };

  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={getIconButtonStyles()}
      disabled={disabled}
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </button>
  );
};

// Safe Radio component that avoids theme issues
const SafeRadio: React.FC<{
  checked?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  value?: string;
  name?: string;
  disabled?: boolean;
}> = ({ checked = false, onChange, value, name, disabled = false }) => {
  return (
    <input
      type="radio"
      checked={checked}
      onChange={onChange}
      value={value}
      name={name}
      disabled={disabled}
      style={{
        width: '20px',
        height: '20px',
        margin: '0 8px 0 0',
        cursor: disabled ? 'not-allowed' : 'pointer'
      }}
    />
  );
};

// Safe Checkbox component that avoids theme issues
const SafeCheckbox: React.FC<{
  checked?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  value?: string;
  name?: string;
  disabled?: boolean;
}> = ({ checked = false, onChange, value, name, disabled = false }) => {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      value={value}
      name={name}
      disabled={disabled}
      style={{
        width: '20px',
        height: '20px',
        margin: '0 8px 0 0',
        cursor: disabled ? 'not-allowed' : 'pointer'
      }}
    />
  );
};

interface Question {
  id: string;
  type: 'multiple_choice' | 'multiple_select' | 'text' | 'essay';
  question: string;
  options?: string[];
  points: number;
  section?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface ExamAnswer {
  questionId: string;
  answer: string | string[];
  timeSpent: number;
  flagged: boolean;
  bookmarked: boolean;
  visited: boolean;
}

interface ExamData {
  id: string;
  title: string;
  description: string;
  timeLimit: number; // in minutes
  totalPoints: number;
  questions: Question[];
  instructions: string;
  allowReview: boolean;
  shuffleQuestions: boolean;
  proctoringEnabled: boolean;
}

const TakeExamPage: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State management
  const [exam, setExam] = useState<ExamData | null>(null);
  const [answers, setAnswers] = useState<{ [key: string]: ExamAnswer }>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [navigationDrawerOpen, setNavigationDrawerOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [examStarted, setExamStarted] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const questionStartTimeRef = useRef<number>(Date.now());
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);

  // Mock exam data - replace with actual API call
  const mockExamData: ExamData = {
    id: examId || '1',
    title: 'Advanced Mathematics Final Exam',
    description: 'Comprehensive final examination covering all topics from the semester',
    timeLimit: 120, // 2 hours
    totalPoints: 100,
    allowReview: true,
    shuffleQuestions: false,
    proctoringEnabled: false,
    instructions: `
      Welcome to your final examination. Please read the following instructions carefully:
      
      1. You have 2 hours to complete this exam
      2. The exam consists of 25 questions worth 100 points total
      3. You can navigate between questions using the navigation panel
      4. Your answers are automatically saved every 30 seconds
      5. You can flag questions for review and bookmark important ones
      6. Once you submit, you cannot make changes
      7. Ensure you have a stable internet connection
      8. Do not refresh the page or close the browser
      
      Good luck!
    `,
    questions: [
      {
        id: '1',
        type: 'multiple_choice',
        question: 'What is the derivative of f(x) = x² + 3x + 2?',
        options: ['2x + 3', 'x² + 3', '2x + 2', 'x + 3'],
        points: 4,
        section: 'Calculus',
        difficulty: 'easy'
      },
      {
        id: '2',
        type: 'multiple_select',
        question: 'Which of the following are prime numbers? (Select all that apply)',
        options: ['17', '21', '23', '25', '29'],
        points: 6,
        section: 'Number Theory',
        difficulty: 'medium'
      },
      {
        id: '3',
        type: 'text',
        question: 'Solve for x: 2x + 5 = 13',
        points: 5,
        section: 'Algebra',
        difficulty: 'easy'
      },
      {
        id: '4',
        type: 'essay',
        question: 'Explain the fundamental theorem of calculus and provide an example of its application.',
        points: 15,
        section: 'Calculus',
        difficulty: 'hard'
      },
      {
        id: '5',
        type: 'multiple_choice',
        question: 'What is the area of a circle with radius 5?',
        options: ['25π', '10π', '5π', '50π'],
        points: 4,
        section: 'Geometry',
        difficulty: 'medium'
      }
    ]
  };

  // Load exam data
  useEffect(() => {
    const loadExam = async () => {
      try {
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setExam(mockExamData);
        setTimeRemaining(mockExamData.timeLimit * 60); // Convert to seconds
        
        // Initialize answers
        const initialAnswers: { [key: string]: ExamAnswer } = {};
        mockExamData.questions.forEach(question => {
          initialAnswers[question.id] = {
            questionId: question.id,
            answer: question.type === 'multiple_select' ? [] : '',
            timeSpent: 0,
            flagged: false,
            bookmarked: false,
            visited: false
          };
        });
        setAnswers(initialAnswers);
        
      } catch (err: any) {
        setError(err.message || 'Failed to load exam');
      } finally {
        setLoading(false);
      }
    };

    if (examId) {
      loadExam();
    }
  }, [examId]);

  // Timer effect
  useEffect(() => {
    if (timeRemaining > 0 && examStarted && exam) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleSubmit(true); // Auto-submit
            return 0;
          }
          if (prev <= 300) { // 5 minutes warning
            // Show warning
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
  }, [timeRemaining, examStarted, exam]);

  // Auto-save effect
  useEffect(() => {
    if (examStarted && exam) {
      autoSaveRef.current = setInterval(() => {
        handleAutoSave();
      }, 30000); // Auto-save every 30 seconds

      return () => {
        if (autoSaveRef.current) {
          clearInterval(autoSaveRef.current);
        }
      };
    }
  }, [examStarted, exam, answers]);

  // Format time remaining
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle answer changes
  const handleAnswerChange = useCallback((questionId: string, answer: string | string[]) => {
    const currentTime = Date.now();
    const timeSpent = currentTime - questionStartTimeRef.current;

    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        answer,
        timeSpent: prev[questionId].timeSpent + timeSpent,
        visited: true
      }
    }));

    questionStartTimeRef.current = currentTime;
  }, []);

  // Handle question navigation
  const handleQuestionNavigation = (index: number) => {
    if (exam && index >= 0 && index < exam.questions.length) {
      // Mark current question as visited
      const currentQuestion = exam.questions[currentQuestionIndex];
      if (currentQuestion) {
        setAnswers(prev => ({
          ...prev,
          [currentQuestion.id]: {
            ...prev[currentQuestion.id],
            visited: true
          }
        }));
      }

      setCurrentQuestionIndex(index);
      questionStartTimeRef.current = Date.now();
      
      if (isMobile) {
        setNavigationDrawerOpen(false);
      }
    }
  };

  // Handle flag/bookmark
  const handleFlagQuestion = (questionId: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        flagged: !prev[questionId].flagged
      }
    }));
  };

  const handleBookmarkQuestion = (questionId: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        bookmarked: !prev[questionId].bookmarked
      }
    }));
  };

  // Auto-save functionality
  const handleAutoSave = async () => {
    try {
      setAutoSaveStatus('saving');
      // Simulate API call to save answers
      await new Promise(resolve => setTimeout(resolve, 500));
      setAutoSaveStatus('saved');
    } catch (error) {
      setAutoSaveStatus('error');
    }
  };

  // Handle exam submission
  const handleSubmit = async (autoSubmit = false) => {
    try {
      setSubmitting(true);
      
      // Calculate final results
      const totalAnswered = Object.values(answers).filter(answer => 
        Array.isArray(answer.answer) ? answer.answer.length > 0 : answer.answer !== ''
      ).length;

      // Simulate API submission
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Navigate to results page
      navigate(`/dashboard/exam/${examId}/results`, {
        state: {
          answers,
          totalQuestions: exam?.questions.length || 0,
          totalAnswered,
          autoSubmit
        }
      });
      
    } catch (error) {
      setError('Failed to submit exam. Please try again.');
      setSubmitting(false);
    }
  };

  // Start exam
  const handleStartExam = () => {
    setExamStarted(true);
    setShowInstructions(false);
    questionStartTimeRef.current = Date.now();
  };

  // Fullscreen handlers
  const toggleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Fullscreen toggle failed:', error);
    }
  };

  // Calculate progress
  const getProgress = () => {
    if (!exam) return { answered: 0, total: 0, percentage: 0 };
    
    const answered = Object.values(answers).filter(answer => 
      Array.isArray(answer.answer) ? answer.answer.length > 0 : answer.answer !== ''
    ).length;
    
    return {
      answered,
      total: exam.questions.length,
      percentage: (answered / exam.questions.length) * 100
    };
  };

  // Render question based on type
  const renderQuestion = (question: Question) => {
    const answer = answers[question.id];
    
    switch (question.type) {
      case 'multiple_choice':
        return (
          <Box>
            {question.options?.map((option, index) => (
              <Box key={index} sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                <SafeRadio
                  checked={answer?.answer === option}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  value={option}
                  name={`question-${question.id}`}
                />
                <Typography variant="body1" sx={{ ml: 1 }}>
                  {option}
                </Typography>
              </Box>
            ))}
          </Box>
        );

      case 'multiple_select':
        return (
          <Box>
            {question.options?.map((option, index) => (
              <Box key={index} sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                <SafeCheckbox
                  checked={Array.isArray(answer?.answer) && answer.answer.includes(option)}
                  onChange={(e) => {
                    const currentAnswers = Array.isArray(answer?.answer) ? answer.answer : [];
                    const newAnswers = e.target.checked
                      ? [...currentAnswers, option]
                      : currentAnswers.filter(a => a !== option);
                    handleAnswerChange(question.id, newAnswers);
                  }}
                />
                <Typography variant="body1" sx={{ ml: 1 }}>
                  {option}
                </Typography>
              </Box>
            ))}
          </Box>
        );

      case 'text':
        return (
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Enter your answer..."
            value={answer?.answer || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            multiline={question.type === 'essay'}
            rows={question.type === 'essay' ? 6 : 1}
          />
        );

      case 'essay':
        return (
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Write your essay here..."
            value={answer?.answer || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            multiline
            rows={8}
          />
        );

      default:
        return <Typography>Unsupported question type</Typography>;
    }
  };

  // Loading state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography variant="h6">Loading exam...</Typography>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <SafeButton onClick={() => navigate(-1)}>
          Go Back
        </SafeButton>
      </Container>
    );
  }

  // No exam data
  if (!exam) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="warning">
          Exam not found
        </Alert>
      </Container>
    );
  }

  // Instructions screen
  if (showInstructions && !examStarted) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Box textAlign="center" mb={3}>
              <Assignment sx={{ fontSize: 48, color: '#1976d2', mb: 2 }} />
              <Typography variant="h4" gutterBottom>
                {exam.title}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {exam.description}
              </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Timer sx={{ fontSize: 32, color: '#ff9800', mb: 1 }} />
                  <Typography variant="h6">Time Limit</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {exam.timeLimit} minutes
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Assignment sx={{ fontSize: 32, color: '#2196f3', mb: 1 }} />
                  <Typography variant="h6">Questions</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {exam.questions.length} questions ({exam.totalPoints} points)
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Instructions
              </Typography>
              <Typography 
                variant="body2" 
                component="pre" 
                sx={{ 
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'inherit',
                  backgroundColor: '#f5f5f5',
                  p: 2,
                  borderRadius: 1
                }}
              >
                {exam.instructions}
              </Typography>
            </Box>

            <Box textAlign="center">
              <SafeButton
                onClick={handleStartExam}
                size="large"
                startIcon={<Assignment />}
              >
                Start Exam
              </SafeButton>
            </Box>
          </CardContent>
        </Card>
      </Container>
    );
  }

  const currentQuestion = exam.questions[currentQuestionIndex];
  const progress = getProgress();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <SafeIconButton
            color="inherit"
            onClick={() => setNavigationDrawerOpen(true)}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <Menu />
          </SafeIconButton>

          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {exam.title}
          </Typography>

          <Stack direction="row" spacing={2} alignItems="center">
            {/* Auto-save status */}
            <Tooltip title={`Auto-save: ${autoSaveStatus}`}>
              <Chip
                size="small"
                label={autoSaveStatus === 'saving' ? 'Saving...' : 'Saved'}
                color={autoSaveStatus === 'error' ? 'error' : 'success'}
                variant="outlined"
              />
            </Tooltip>

            {/* Timer */}
            <Chip
              icon={<Timer />}
              label={formatTime(timeRemaining)}
              color={timeRemaining < 300 ? 'error' : 'default'}
              variant="filled"
            />

            {/* Fullscreen toggle */}
            <SafeIconButton color="inherit" onClick={toggleFullscreen}>
              {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
            </SafeIconButton>
          </Stack>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: 'flex', flexGrow: 1, mt: 8 }}>
        {/* Navigation Sidebar */}
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={isMobile ? navigationDrawerOpen : true}
          onClose={() => setNavigationDrawerOpen(false)}
          sx={{
            width: 280,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: 280,
              boxSizing: 'border-box',
              mt: 8
            }
          }}
        >
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Question Navigation
            </Typography>
            
            {/* Progress */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Progress: {progress.answered}/{progress.total} answered
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={progress.percentage} 
                sx={{ mb: 1 }}
              />
            </Box>

            {/* Question list */}
            <List dense>
              {exam.questions.map((question, index) => {
                const answer = answers[question.id];
                const isAnswered = Array.isArray(answer?.answer) 
                  ? answer.answer.length > 0 
                  : answer?.answer !== '';
                const isCurrent = index === currentQuestionIndex;

                return (
                  <ListItem
                    key={question.id}
                    disablePadding
                    sx={{ mb: 0.5 }}
                  >
                    <Box
                      onClick={() => handleQuestionNavigation(index)}
                      sx={{
                        width: '100%',
                        p: 1,
                        borderRadius: 1,
                        border: isCurrent ? '2px solid #1976d2' : '1px solid #e0e0e0',
                        backgroundColor: isCurrent ? '#e3f2fd' : 'transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        '&:hover': {
                          backgroundColor: '#f5f5f5'
                        }
                      }}
                    >
                      <Box sx={{ minWidth: 36, mr: 1 }}>
                        {isAnswered ? (
                          <CheckCircle sx={{ color: '#4caf50' }} />
                        ) : (
                          <RadioButtonUnchecked sx={{ color: '#bdbdbd' }} />
                        )}
                      </Box>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body2" fontWeight={isCurrent ? 600 : 400}>
                          Q{index + 1}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {question.points} pts
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={0.5}>
                        {answer?.flagged && (
                          <Flag sx={{ color: '#f44336', fontSize: 16 }} />
                        )}
                        {answer?.bookmarked && (
                          <Bookmark sx={{ color: '#ff9800', fontSize: 16 }} />
                        )}
                      </Stack>
                    </Box>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        </Drawer>

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: { md: `calc(100% - 280px)` }
          }}
        >
          <Container maxWidth="lg">
            {/* Question Header */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box>
                    <Typography variant="h5" gutterBottom>
                      Question {currentQuestionIndex + 1} of {exam.questions.length}
                    </Typography>
                    <Stack direction="row" spacing={1} mb={2}>
                      <Chip 
                        size="small" 
                        label={`${currentQuestion.points} points`} 
                        color="primary" 
                      />
                      {currentQuestion.section && (
                        <Chip 
                          size="small" 
                          label={currentQuestion.section} 
                          variant="outlined" 
                        />
                      )}
                      {currentQuestion.difficulty && (
                        <Chip 
                          size="small" 
                          label={currentQuestion.difficulty} 
                          color={
                            currentQuestion.difficulty === 'easy' ? 'success' :
                            currentQuestion.difficulty === 'medium' ? 'warning' : 'error'
                          }
                          variant="outlined"
                        />
                      )}
                    </Stack>
                  </Box>
                  
                  <Stack direction="row" spacing={1}>
                    <SafeIconButton
                      onClick={() => handleFlagQuestion(currentQuestion.id)}
                      color={answers[currentQuestion.id]?.flagged ? 'error' : 'primary'}
                      sx={{ color: answers[currentQuestion.id]?.flagged ? '#f44336' : '#bdbdbd' }}
                    >
                      <Flag />
                    </SafeIconButton>
                    <SafeIconButton
                      onClick={() => handleBookmarkQuestion(currentQuestion.id)}
                      color={answers[currentQuestion.id]?.bookmarked ? 'warning' : 'primary'}
                      sx={{ color: answers[currentQuestion.id]?.bookmarked ? '#ff9800' : '#bdbdbd' }}
                    >
                      {answers[currentQuestion.id]?.bookmarked ? <Bookmark /> : <BookmarkBorder />}
                    </SafeIconButton>
                  </Stack>
                </Box>

                <Typography variant="body1" sx={{ mb: 3, fontSize: '1.1rem', lineHeight: 1.6 }}>
                  {currentQuestion.question}
                </Typography>

                {renderQuestion(currentQuestion)}
              </CardContent>
            </Card>

            {/* Navigation Controls */}
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <SafeButton
                onClick={() => handleQuestionNavigation(currentQuestionIndex - 1)}
                disabled={currentQuestionIndex === 0}
                startIcon={<NavigateBefore />}
                variant="outlined"
              >
                Previous
              </SafeButton>

              <Stack direction="row" spacing={2}>
                <SafeButton
                  onClick={handleAutoSave}
                  variant="outlined"
                  startIcon={<Save />}
                  disabled={autoSaveStatus === 'saving'}
                >
                  Save Progress
                </SafeButton>

                {currentQuestionIndex === exam.questions.length - 1 ? (
                  <SafeButton
                    onClick={() => setShowSubmitDialog(true)}
                    color="success"
                    startIcon={<Send />}
                  >
                    Submit Exam
                  </SafeButton>
                ) : (
                  <SafeButton
                    onClick={() => handleQuestionNavigation(currentQuestionIndex + 1)}
                    endIcon={<NavigateNext />}
                  >
                    Next
                  </SafeButton>
                )}
              </Stack>
            </Box>
          </Container>
        </Box>
      </Box>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitDialog} onClose={() => setShowSubmitDialog(false)}>
        <DialogTitle>Submit Exam</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Are you sure you want to submit your exam? You cannot make changes after submission.
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              • Answered: {progress.answered}/{progress.total} questions
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Time remaining: {formatTime(timeRemaining)}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <SafeButton 
            onClick={() => setShowSubmitDialog(false)}
            variant="outlined"
          >
            Cancel
          </SafeButton>
          <SafeButton
            onClick={() => handleSubmit()}
            color="success"
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Exam'}
          </SafeButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TakeExamPage;
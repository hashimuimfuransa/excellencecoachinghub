import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  LinearProgress,
  Alert,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Schedule,
  Assignment,
  TrendingUp,
  ExpandMore,
  Flag,
  Bookmark,
  Home,
  Print,
  Share,
  Download
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
  const [isHovered, setIsHovered] = React.useState(false);

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

interface ExamResults {
  examId: string;
  examTitle: string;
  studentName: string;
  submissionTime: string;
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  score: number;
  maxScore: number;
  percentage: number;
  timeSpent: number;
  timeLimit: number;
  grade: string;
  passed: boolean;
  autoSubmitted: boolean;
  questionResults: QuestionResult[];
}

interface QuestionResult {
  questionId: string;
  question: string;
  type: string;
  correctAnswer: string | string[];
  studentAnswer: string | string[];
  isCorrect: boolean;
  points: number;
  maxPoints: number;
  timeSpent: number;
  flagged: boolean;
  bookmarked: boolean;
  section?: string;
  difficulty?: string;
}

const ExamResultsPage: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  const [results, setResults] = useState<ExamResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock results data - replace with actual API call
  const mockResults: ExamResults = {
    examId: examId || '1',
    examTitle: 'Advanced Mathematics Final Exam',
    studentName: 'John Doe',
    submissionTime: new Date().toISOString(),
    totalQuestions: 5,
    answeredQuestions: 4,
    correctAnswers: 3,
    score: 78,
    maxScore: 100,
    percentage: 78,
    timeSpent: 85 * 60, // 85 minutes in seconds
    timeLimit: 120 * 60, // 120 minutes in seconds
    grade: 'B+',
    passed: true,
    autoSubmitted: location.state?.autoSubmit || false,
    questionResults: [
      {
        questionId: '1',
        question: 'What is the derivative of f(x) = x² + 3x + 2?',
        type: 'multiple_choice',
        correctAnswer: '2x + 3',
        studentAnswer: '2x + 3',
        isCorrect: true,
        points: 4,
        maxPoints: 4,
        timeSpent: 120,
        flagged: false,
        bookmarked: false,
        section: 'Calculus',
        difficulty: 'easy'
      },
      {
        questionId: '2',
        question: 'Which of the following are prime numbers? (Select all that apply)',
        type: 'multiple_select',
        correctAnswer: ['17', '23', '29'],
        studentAnswer: ['17', '23'],
        isCorrect: false,
        points: 4,
        maxPoints: 6,
        timeSpent: 180,
        flagged: true,
        bookmarked: false,
        section: 'Number Theory',
        difficulty: 'medium'
      },
      {
        questionId: '3',
        question: 'Solve for x: 2x + 5 = 13',
        type: 'text',
        correctAnswer: '4',
        studentAnswer: '4',
        isCorrect: true,
        points: 5,
        maxPoints: 5,
        timeSpent: 90,
        flagged: false,
        bookmarked: true,
        section: 'Algebra',
        difficulty: 'easy'
      },
      {
        questionId: '4',
        question: 'Explain the fundamental theorem of calculus and provide an example of its application.',
        type: 'essay',
        correctAnswer: 'Sample answer about fundamental theorem...',
        studentAnswer: 'The fundamental theorem of calculus states...',
        isCorrect: true,
        points: 12,
        maxPoints: 15,
        timeSpent: 900,
        flagged: false,
        bookmarked: true,
        section: 'Calculus',
        difficulty: 'hard'
      },
      {
        questionId: '5',
        question: 'What is the area of a circle with radius 5?',
        type: 'multiple_choice',
        correctAnswer: '25π',
        studentAnswer: '',
        isCorrect: false,
        points: 0,
        maxPoints: 4,
        timeSpent: 0,
        flagged: false,
        bookmarked: false,
        section: 'Geometry',
        difficulty: 'medium'
      }
    ]
  };

  useEffect(() => {
    const loadResults = async () => {
      try {
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        setResults(mockResults);
      } catch (err: any) {
        setError(err.message || 'Failed to load exam results');
      } finally {
        setLoading(false);
      }
    };

    if (examId) {
      loadResults();
    }
  }, [examId]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'success';
    if (percentage >= 80) return 'info';
    if (percentage >= 70) return 'warning';
    return 'error';
  };

  const getPerformanceMessage = (percentage: number) => {
    if (percentage >= 90) return 'Excellent work! Outstanding performance.';
    if (percentage >= 80) return 'Great job! Very good performance.';
    if (percentage >= 70) return 'Good work! Solid performance.';
    if (percentage >= 60) return 'Fair performance. Room for improvement.';
    return 'Needs improvement. Consider reviewing the material.';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography variant="h6">Loading results...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <SafeButton onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </SafeButton>
      </Container>
    );
  }

  if (!results) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="warning">
          Results not found
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box textAlign="center" mb={4}>
        <Assignment sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
        <Typography variant="h3" gutterBottom>
          Exam Results
        </Typography>
        <Typography variant="h5" color="text.secondary" gutterBottom>
          {results.examTitle}
        </Typography>
        {results.autoSubmitted && (
          <Alert severity="info" sx={{ mt: 2, maxWidth: 600, mx: 'auto' }}>
            This exam was automatically submitted due to time expiration.
          </Alert>
        )}
      </Box>

      {/* Overall Results */}
      <Card sx={{ mb: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <Grid container spacing={4}>
            {/* Score */}
            <Grid item xs={12} md={4}>
              <Box textAlign="center">
                <Typography variant="h2" color={`${getGradeColor(results.percentage)}.main`} gutterBottom>
                  {results.percentage}%
                </Typography>
                <Typography variant="h4" gutterBottom>
                  {results.grade}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {results.score} / {results.maxScore} points
                </Typography>
              </Box>
            </Grid>

            {/* Performance Indicator */}
            <Grid item xs={12} md={8}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Performance Summary
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={results.percentage}
                  color={getGradeColor(results.percentage)}
                  sx={{ height: 12, borderRadius: 6, mb: 2 }}
                />
                <Typography variant="body1" gutterBottom>
                  {getPerformanceMessage(results.percentage)}
                </Typography>
                <Chip
                  label={results.passed ? 'PASSED' : 'FAILED'}
                  color={results.passed ? 'success' : 'error'}
                  size="large"
                  sx={{ mt: 1 }}
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <CheckCircle sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
            <Typography variant="h4" color="success.main">
              {results.correctAnswers}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Correct Answers
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Assignment sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
            <Typography variant="h4" color="info.main">
              {results.answeredQuestions}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Questions Answered
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Schedule sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
            <Typography variant="h4" color="warning.main">
              {formatTime(results.timeSpent)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Time Spent
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <TrendingUp sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
            <Typography variant="h4" color="primary.main">
              {Math.round((results.answeredQuestions / results.totalQuestions) * 100)}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Completion Rate
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Question-by-Question Results */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Question-by-Question Results
          </Typography>
          <Divider sx={{ mb: 3 }} />

          {results.questionResults.map((result, index) => (
            <Accordion key={result.questionId} sx={{ mb: 1 }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box display="flex" alignItems="center" width="100%">
                  <Box display="flex" alignItems="center" mr={2}>
                    {result.isCorrect ? (
                      <CheckCircle color="success" />
                    ) : (
                      <Cancel color="error" />
                    )}
                  </Box>
                  
                  <Box flexGrow={1}>
                    <Typography variant="subtitle1">
                      Question {index + 1}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {result.points} / {result.maxPoints} points
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1}>
                    {result.section && (
                      <Chip size="small" label={result.section} variant="outlined" />
                    )}
                    {result.difficulty && (
                      <Chip 
                        size="small" 
                        label={result.difficulty}
                        color={
                          result.difficulty === 'easy' ? 'success' :
                          result.difficulty === 'medium' ? 'warning' : 'error'
                        }
                        variant="outlined"
                      />
                    )}
                    {result.flagged && <Flag color="error" fontSize="small" />}
                    {result.bookmarked && <Bookmark color="warning" fontSize="small" />}
                  </Stack>
                </Box>
              </AccordionSummary>
              
              <AccordionDetails>
                <Box>
                  <Typography variant="body1" gutterBottom sx={{ fontWeight: 500 }}>
                    {result.question}
                  </Typography>

                  <Grid container spacing={2} sx={{ mt: 2 }}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="success.main" gutterBottom>
                        Correct Answer:
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        backgroundColor: 'success.light', 
                        p: 1, 
                        borderRadius: 1,
                        color: 'success.contrastText'
                      }}>
                        {Array.isArray(result.correctAnswer) 
                          ? result.correctAnswer.join(', ') 
                          : result.correctAnswer}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Typography 
                        variant="subtitle2" 
                        color={result.isCorrect ? 'success.main' : 'error.main'} 
                        gutterBottom
                      >
                        Your Answer:
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        backgroundColor: result.isCorrect ? 'success.light' : 'error.light',
                        p: 1, 
                        borderRadius: 1,
                        color: result.isCorrect ? 'success.contrastText' : 'error.contrastText'
                      }}>
                        {result.studentAnswer 
                          ? (Array.isArray(result.studentAnswer) 
                              ? result.studentAnswer.join(', ') 
                              : result.studentAnswer)
                          : 'No answer provided'}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Box mt={2}>
                    <Typography variant="body2" color="text.secondary">
                      Time spent: {formatTime(result.timeSpent)}
                    </Typography>
                  </Box>
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </CardContent>
      </Card>

      {/* Actions */}
      <Box display="flex" justifyContent="center" gap={2} flexWrap="wrap">
        <SafeButton
          onClick={() => navigate('/dashboard')}
          startIcon={<Home />}
          size="large"
        >
          Back to Dashboard
        </SafeButton>
        
        <SafeButton
          onClick={() => window.print()}
          variant="outlined"
          startIcon={<Print />}
          size="large"
        >
          Print Results
        </SafeButton>

        <SafeButton
          onClick={() => {
            // Implement download functionality
            console.log('Download results');
          }}
          variant="outlined"
          startIcon={<Download />}
          size="large"
        >
          Download PDF
        </SafeButton>
      </Box>

      {/* Submission Details */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Submission Details
          </Typography>
          <List>
            <ListItem>
              <ListItemText
                primary="Student"
                secondary={results.studentName}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Submission Time"
                secondary={new Date(results.submissionTime).toLocaleString()}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Time Limit"
                secondary={formatTime(results.timeLimit)}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Time Used"
                secondary={formatTime(results.timeSpent)}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Submission Type"
                secondary={results.autoSubmitted ? 'Auto-submitted (Time expired)' : 'Manual submission'}
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>
    </Container>
  );
};

export default ExamResultsPage;
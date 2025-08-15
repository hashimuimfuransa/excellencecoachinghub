import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Box,
  Chip,
  Stack,
  Paper
} from '@mui/material';
import {
  Assignment,
  Schedule,
  Quiz,
  School,
  PlayArrow
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

interface ExamInfo {
  id: string;
  title: string;
  description: string;
  course: string;
  timeLimit: number;
  totalQuestions: number;
  totalPoints: number;
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'available' | 'completed' | 'locked';
  dueDate?: string;
}

const ExamListPage: React.FC = () => {
  const navigate = useNavigate();

  // Mock exam data
  const exams: ExamInfo[] = [
    {
      id: '1',
      title: 'Advanced Mathematics Final Exam',
      description: 'Comprehensive final examination covering all topics from the semester including calculus, algebra, and geometry.',
      course: 'Advanced Mathematics',
      timeLimit: 120,
      totalQuestions: 25,
      totalPoints: 100,
      difficulty: 'hard',
      status: 'available',
      dueDate: '2024-12-20'
    },
    {
      id: '2',
      title: 'Physics Midterm Exam',
      description: 'Midterm examination covering mechanics, thermodynamics, and wave physics.',
      course: 'Physics 101',
      timeLimit: 90,
      totalQuestions: 20,
      totalPoints: 80,
      difficulty: 'medium',
      status: 'available',
      dueDate: '2024-12-15'
    },
    {
      id: '3',
      title: 'Chemistry Quiz',
      description: 'Quick assessment on organic chemistry fundamentals.',
      course: 'Organic Chemistry',
      timeLimit: 45,
      totalQuestions: 15,
      totalPoints: 60,
      difficulty: 'easy',
      status: 'completed'
    },
    {
      id: '4',
      title: 'Computer Science Final',
      description: 'Final examination covering algorithms, data structures, and programming concepts.',
      course: 'Computer Science 201',
      timeLimit: 150,
      totalQuestions: 30,
      totalPoints: 120,
      difficulty: 'hard',
      status: 'locked',
      dueDate: '2024-12-25'
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'error';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'primary';
      case 'completed': return 'success';
      case 'locked': return 'default';
      default: return 'default';
    }
  };

  const handleTakeExam = (examId: string) => {
    navigate(`/dashboard/exam/${examId}/take`);
  };

  const handleViewResults = (examId: string) => {
    navigate(`/dashboard/exam/${examId}/results`);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box textAlign="center" mb={4}>
        <Assignment sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
        <Typography variant="h3" gutterBottom>
          Available Exams
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Select an exam to begin or view your results
        </Typography>
      </Box>

      {/* Exam Cards */}
      <Grid container spacing={3}>
        {exams.map((exam) => (
          <Grid item xs={12} md={6} key={exam.id}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1, p: 3 }}>
                {/* Header */}
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box flexGrow={1}>
                    <Typography variant="h5" gutterBottom>
                      {exam.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <School sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                      {exam.course}
                    </Typography>
                  </Box>
                  <Chip
                    label={exam.status.toUpperCase()}
                    color={getStatusColor(exam.status)}
                    size="small"
                  />
                </Box>

                {/* Description */}
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {exam.description}
                </Typography>

                {/* Exam Details */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: 'grey.50' }}>
                      <Schedule sx={{ fontSize: 24, color: 'warning.main', mb: 0.5 }} />
                      <Typography variant="body2" fontWeight={500}>
                        {exam.timeLimit} min
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Time Limit
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: 'grey.50' }}>
                      <Quiz sx={{ fontSize: 24, color: 'info.main', mb: 0.5 }} />
                      <Typography variant="body2" fontWeight={500}>
                        {exam.totalQuestions}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Questions
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>

                {/* Tags */}
                <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
                  <Chip
                    size="small"
                    label={exam.difficulty}
                    color={getDifficultyColor(exam.difficulty)}
                    variant="outlined"
                  />
                  <Chip
                    size="small"
                    label={`${exam.totalPoints} points`}
                    variant="outlined"
                  />
                  {exam.dueDate && (
                    <Chip
                      size="small"
                      label={`Due: ${new Date(exam.dueDate).toLocaleDateString()}`}
                      variant="outlined"
                      color="warning"
                    />
                  )}
                </Stack>

                {/* Actions */}
                <Box>
                  {exam.status === 'available' && (
                    <SafeButton
                      onClick={() => handleTakeExam(exam.id)}
                      fullWidth
                      size="large"
                      startIcon={<PlayArrow />}
                    >
                      Take Exam
                    </SafeButton>
                  )}
                  
                  {exam.status === 'completed' && (
                    <SafeButton
                      onClick={() => handleViewResults(exam.id)}
                      fullWidth
                      size="large"
                      color="success"
                      startIcon={<Assignment />}
                    >
                      View Results
                    </SafeButton>
                  )}
                  
                  {exam.status === 'locked' && (
                    <SafeButton
                      disabled
                      fullWidth
                      size="large"
                      variant="outlined"
                    >
                      Not Available Yet
                    </SafeButton>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Demo Instructions */}
      <Box mt={6} textAlign="center">
        <Paper sx={{ p: 3, backgroundColor: 'info.light', color: 'info.contrastText' }}>
          <Typography variant="h6" gutterBottom>
            Demo Instructions
          </Typography>
          <Typography variant="body2">
            This is a demonstration of the exam system. Click "Take Exam" on the first exam to see the full exam interface,
            or "View Results" on the completed exam to see the results page.
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default ExamListPage;
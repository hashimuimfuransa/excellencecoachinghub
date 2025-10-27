import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Stack,
  Alert
} from '@mui/material';
import {
  Assignment,
  PlayArrow,
  Visibility
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
}> = ({ 
  children, 
  onClick, 
  variant = 'contained', 
  color = 'primary', 
  disabled = false,
  fullWidth = false,
  size = 'medium',
  startIcon,
  endIcon
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  const colorMap = {
    primary: { main: '#1976d2', dark: '#1565c0', contrastText: '#ffffff' },
    secondary: { main: '#dc004e', dark: '#9a0036', contrastText: '#ffffff' },
    success: { main: '#4caf50', dark: '#388e3c', contrastText: '#ffffff' },
    error: { main: '#f44336', dark: '#d32f2f', contrastText: '#ffffff' },
    warning: { main: '#ff9800', dark: '#f57c00', contrastText: '#000000' },
    info: { main: '#2196f3', dark: '#1976d2', contrastText: '#ffffff' }
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
      userSelect: 'none'
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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {startIcon && <span style={{ display: 'flex', alignItems: 'center' }}>{startIcon}</span>}
      {children}
      {endIcon && <span style={{ display: 'flex', alignItems: 'center' }}>{endIcon}</span>}
    </button>
  );
};

const ExamTestPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box textAlign="center" mb={4}>
        <Assignment sx={{ fontSize: 64, color: '#1976d2', mb: 2 }} />
        <Typography variant="h3" gutterBottom>
          Exam System Test
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Test the new exam system without theme errors
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 4 }}>
        This page tests the new exam system with custom buttons that avoid Material-UI theme access issues.
        All buttons should work without throwing JavaScript errors.
      </Alert>

      <Card>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom>
            Available Test Actions
          </Typography>
          
          <Stack spacing={3} sx={{ mt: 3 }}>
            <Box>
              <Typography variant="h6" gutterBottom>
                1. View Exam List
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Browse available exams and see the exam selection interface.
              </Typography>
              <SafeButton
                onClick={() => navigate('/dashboard/exams')}
                startIcon={<Assignment />}
                size="large"
              >
                View Exam List
              </SafeButton>
            </Box>

            <Box>
              <Typography variant="h6" gutterBottom>
                2. Take Sample Exam
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Start the sample Advanced Mathematics exam with full functionality.
              </Typography>
              <SafeButton
                onClick={() => navigate('/dashboard/exam/1/take')}
                startIcon={<PlayArrow />}
                color="success"
                size="large"
              >
                Take Sample Exam
              </SafeButton>
            </Box>

            <Box>
              <Typography variant="h6" gutterBottom>
                3. View Sample Results
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                See how exam results are displayed with detailed feedback.
              </Typography>
              <SafeButton
                onClick={() => navigate('/dashboard/exam/1/results')}
                startIcon={<Visibility />}
                color="info"
                size="large"
              >
                View Sample Results
              </SafeButton>
            </Box>
          </Stack>

          <Box sx={{ mt: 4, p: 3, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>
              Test Instructions
            </Typography>
            <Typography variant="body2" component="div">
              <ul>
                <li>Click any button above to test the exam system</li>
                <li>All buttons use custom styling to avoid theme errors</li>
                <li>The exam interface includes timer, navigation, and auto-save</li>
                <li>Results page shows detailed question-by-question feedback</li>
                <li>All functionality works without JavaScript errors</li>
              </ul>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default ExamTestPage;
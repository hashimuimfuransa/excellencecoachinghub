import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Stack,
  LinearProgress,
  Avatar,
  Chip,
  IconButton,
  useTheme,
  alpha,
  Stepper,
  Step,
  StepLabel,
  Paper
} from '@mui/material';
import {
  Person,
  Work,
  School,
  CheckCircle,
  ArrowForward,
  Close,
  EmojiEvents,
  Psychology,
  MenuBook
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface WelcomeSetupCardProps {
  onDismiss?: () => void;
}

const WelcomeSetupCard: React.FC<WelcomeSetupCardProps> = ({ onDismiss }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);

  const setupSteps = [
    {
      id: 'profile',
      title: 'Complete Your Profile',
      description: 'Add your basic information and contact details',
      icon: <Person />,
      action: () => navigate('/app/profile'),
      completed: false
    },
    {
      id: 'experience',
      title: 'Add Experience',
      description: 'Share your work experience and skills',
      icon: <Work />,
      action: () => navigate('/app/profile'),
      completed: false
    },
    {
      id: 'education',
      title: 'Education & Certifications',
      description: 'Add your educational background',
      icon: <School />,
      action: () => navigate('/app/profile'),
      completed: false
    }
  ];

  const quickActions = [
    {
      title: 'Take Career Assessment',
      description: 'Discover your ideal career path',
      icon: <Psychology />,
      color: theme.palette.primary.main,
      action: () => navigate('/app/career-guidance')
    },
    {
      title: 'Start Learning',
      description: 'Explore our course catalog',
      icon: <MenuBook />,
      color: theme.palette.secondary.main,
      action: () => window.open('https://www.elearning.excellencecoachinghub.com/', '_blank')
    },
    {
      title: 'Practice Interviews',
      description: 'Prepare with AI mock interviews',
      icon: <EmojiEvents />,
      color: theme.palette.success.main,
      action: () => navigate('/app/interviews')
    }
  ];

  return (
    <Card 
      sx={{ 
        mb: 4,
        borderRadius: 3,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        position: 'relative',
        overflow: 'visible'
      }}
    >
      {onDismiss && (
        <IconButton
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 1
          }}
          onClick={onDismiss}
        >
          <Close />
        </IconButton>
      )}

      <CardContent sx={{ p: 4 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <Avatar
            sx={{
              width: 60,
              height: 60,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main,
              mr: 2
            }}
          >
            <CheckCircle sx={{ fontSize: 28 }} />
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight="bold" color="primary.main" gutterBottom>
              Welcome to your career journey, {user?.firstName}! 🎉
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Let's get your profile set up to help you find the perfect opportunities
            </Typography>
          </Box>
        </Box>

        {/* Progress Indicator */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: alpha(theme.palette.background.paper, 0.7) }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Profile Setup Progress
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={33} 
            sx={{ 
              height: 8, 
              borderRadius: 4,
              mb: 1,
              bgcolor: alpha(theme.palette.grey[300], 0.3)
            }} 
          />
          <Typography variant="body2" color="text.secondary">
            33% complete • 3 steps remaining
          </Typography>
        </Paper>

        {/* Setup Steps */}
        <Typography variant="h6" fontWeight="bold" gutterBottom mb={2}>
          Quick Setup Steps
        </Typography>
        <Stack spacing={2} mb={4}>
          {setupSteps.map((step, index) => (
            <Paper
              key={step.id}
              sx={{
                p: 2,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                '&:hover': {
                  boxShadow: theme.shadows[4],
                  border: `1px solid ${theme.palette.primary.main}`,
                }
              }}
              onClick={step.action}
            >
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar
                  sx={{
                    bgcolor: step.completed 
                      ? theme.palette.success.main 
                      : alpha(theme.palette.primary.main, 0.1),
                    color: step.completed 
                      ? 'white' 
                      : theme.palette.primary.main,
                    width: 40,
                    height: 40
                  }}
                >
                  {step.completed ? <CheckCircle /> : step.icon}
                </Avatar>
                <Box flex={1}>
                  <Typography variant="subtitle1" fontWeight="medium">
                    {step.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {step.description}
                  </Typography>
                </Box>
                <ArrowForward sx={{ color: 'text.secondary' }} />
              </Stack>
            </Paper>
          ))}
        </Stack>

        {/* Quick Actions */}
        <Typography variant="h6" fontWeight="bold" gutterBottom mb={2}>
          Get Started Today
        </Typography>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          {quickActions.map((action, index) => (
            <Card
              key={index}
              sx={{
                flex: 1,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                border: `1px solid ${alpha(action.color, 0.2)}`,
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: `0 8px 25px ${alpha(action.color, 0.3)}`,
                  border: `1px solid ${action.color}`
                }
              }}
              onClick={action.action}
            >
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Avatar
                  sx={{
                    bgcolor: alpha(action.color, 0.1),
                    color: action.color,
                    mx: 'auto',
                    mb: 2,
                    width: 48,
                    height: 48
                  }}
                >
                  {action.icon}
                </Avatar>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  {action.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {action.description}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Stack>

        {/* Call to Action */}
        <Box textAlign="center" mt={4}>
          <Button
            variant="contained"
            size="large"
            startIcon={<Person />}
            onClick={() => navigate('/app/profile')}
            sx={{
              borderRadius: 3,
              px: 4,
              py: 1.5,
              textTransform: 'none',
              fontWeight: 600,
              background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
            }}
          >
            Complete My Profile
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default WelcomeSetupCard;
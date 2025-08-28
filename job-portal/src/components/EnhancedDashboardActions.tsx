import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Paper,
  Stack,
  useTheme,
  alpha,
  Chip,
  Avatar
} from '@mui/material';
import {
  Psychology,
  Lightbulb,
  PlayArrow,
  Search,
  Assignment,
  Person,
  Bookmark,
  EmojiEvents,
  Timeline,
  School,
  TrendingUp,
  Speed,
  WorkHistory,
  Quiz,
  Edit,
  CheckCircle,
  Warning
} from '@mui/icons-material';

interface ActionCardProps {
  action: {
    id: string;
    title: string;
    description: string;
    icon: React.ReactElement;
    color: string;
    badge?: number | string;
    priority?: 'high' | 'medium' | 'low';
    action: () => void;
  };
}

const PrimaryActionCard: React.FC<ActionCardProps> = ({ action }) => {
  const theme = useTheme();
  
  return (
    <Card
      sx={{
        height: '100%',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        border: `2px solid ${alpha(action.color, 0.2)}`,
        borderRadius: 3,
        position: 'relative',
        overflow: 'visible',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: `0 12px 40px ${alpha(action.color, 0.3)}`,
          border: `2px solid ${action.color}`
        }
      }}
      onClick={action.action}
    >
      <CardContent sx={{ p: 3, textAlign: 'center', position: 'relative' }}>
        {action.badge && (
          <Chip
            label={action.badge}
            size="small"
            color="error"
            sx={{
              position: 'absolute',
              top: -8,
              right: -8,
              minWidth: 24,
              height: 24,
              '& .MuiChip-label': { px: 1, fontSize: '0.75rem', fontWeight: 'bold' }
            }}
          />
        )}
        
        <Avatar
          sx={{
            width: 64,
            height: 64,
            bgcolor: alpha(action.color, 0.1),
            color: action.color,
            mx: 'auto',
            mb: 2,
            border: `3px solid ${alpha(action.color, 0.3)}`
          }}
        >
          {action.icon}
        </Avatar>
        
        <Typography variant="h6" fontWeight="bold" gutterBottom color={action.color}>
          {action.title}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {action.description}
        </Typography>
        
        <Button
          variant="contained"
          size="small"
          sx={{
            background: `linear-gradient(135deg, ${action.color} 0%, ${alpha(action.color, 0.8)} 100%)`,
            '&:hover': { 
              background: `linear-gradient(135deg, ${action.color} 0%, ${alpha(action.color, 0.9)} 100%)`,
              transform: 'translateY(-2px)',
              boxShadow: `0 8px 25px ${alpha(action.color, 0.4)}`
            },
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 'bold',
            transition: 'all 0.3s ease',
            boxShadow: `0 4px 15px ${alpha(action.color, 0.3)}`
          }}
        >
          Get Started
        </Button>
      </CardContent>
    </Card>
  );
};

const QuickActionCard: React.FC<ActionCardProps> = ({ action }) => {
  const theme = useTheme();
  
  return (
    <Card
      sx={{
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        border: `1px solid ${alpha(action.color, 0.2)}`,
        borderRadius: 2,
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[4],
          bgcolor: alpha(action.color, 0.05)
        }
      }}
      onClick={action.action}
    >
      <CardContent sx={{ p: 2, textAlign: 'center' }}>
        <Avatar
          sx={{
            width: 40,
            height: 40,
            bgcolor: alpha(action.color, 0.1),
            color: action.color,
            mx: 'auto',
            mb: 1
          }}
        >
          {action.icon}
        </Avatar>
        
        <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
          {action.title}
        </Typography>
        
        <Typography variant="caption" color="text.secondary">
          {action.description}
        </Typography>
        
        {action.badge && (
          <Chip
            label={action.badge}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ mt: 1, fontSize: '0.7rem' }}
          />
        )}
      </CardContent>
    </Card>
  );
};

interface EnhancedDashboardActionsProps {
  stats: {
    totalApplications: number;
    interviewsScheduled: number;
    savedJobs: number;
    profileViews: number;
    skillMatchingJobs: number;
  };
  profileCompletion?: {
    score: number;
    isComplete: boolean;
  };
  onNavigate: (path: string, context?: string) => void;
}

const EnhancedDashboardActions: React.FC<EnhancedDashboardActionsProps> = ({ 
  stats, 
  profileCompletion,
  onNavigate 
}) => {
  const theme = useTheme();

  // Essential actions for job seekers - most important features first
  const primaryActions = [
    {
      id: 'psychometric-test',
      title: 'Psychometric Test',
      description: 'Assess your cognitive abilities',
      icon: <Psychology />,
      color: '#9C27B0',
      action: () => onNavigate('/app/tests', 'psychometric test'),
      badge: '3 Tests',
      priority: 'high' as const
    },
    {
      id: 'smart-test',
      title: 'Smart Job Test',
      description: 'AI-powered job matching',
      icon: <Lightbulb />,
      color: '#FF9800',
      action: () => onNavigate('/app/smart-tests', 'smart test'),
      badge: 'New',
      priority: 'high' as const
    },
    {
      id: 'ai-interview',
      title: 'Practice Interview',
      description: 'AI-powered interview prep',
      icon: <PlayArrow />,
      color: '#4CAF50',
      action: () => onNavigate('/app/interviews', 'ai interview'),
      badge: '5 Questions',
      priority: 'high' as const
    },
    {
      id: 'browse-jobs',
      title: 'Browse Jobs',
      description: 'Find your perfect match',
      icon: <Search />,
      color: theme.palette.primary.main,
      action: () => onNavigate('/app/jobs', 'browse jobs'),
      badge: stats.skillMatchingJobs > 0 ? `${stats.skillMatchingJobs} Matches` : 'Hot',
      priority: 'high' as const
    }
  ];

  // Secondary quick access actions
  const quickActions = [
    {
      id: 'my-profile',
      title: 'My Profile',
      description: 'Complete profile',
      icon: <Person />,
      color: theme.palette.success.main,
      action: () => onNavigate('/app/profile', 'profile')
    },
    {
      id: 'applications',
      title: 'Applications',
      description: 'Track progress',
      icon: <Assignment />,
      color: theme.palette.info.main,
      action: () => onNavigate('/app/applications', 'applications'),
      badge: stats.totalApplications > 0 ? stats.totalApplications : undefined
    },
    {
      id: 'saved-jobs',
      title: 'Saved Jobs',
      description: 'Your bookmarks',
      icon: <Bookmark />,
      color: '#E91E63',
      action: () => onNavigate('/app/saved-jobs', 'saved jobs'),
      badge: stats.savedJobs > 0 ? stats.savedJobs : undefined
    },
    {
      id: 'test-results',
      title: 'Results',
      description: 'View achievements',
      icon: <EmojiEvents />,
      color: '#795548',
      action: () => onNavigate('/app/test-results', 'test results')
    },
    {
      id: 'career-guide',
      title: 'Career Guide',
      description: 'Get insights',
      icon: <Timeline />,
      color: '#607D8B',
      action: () => onNavigate('/app/career-guidance', 'career guidance')
    },
    {
      id: 'certificates',
      title: 'Certificates',
      description: 'View credentials',
      icon: <School />,
      color: '#FF5722',
      action: () => onNavigate('/app/certificates', 'certificates')
    }
  ];

  return (
    <>
      {/* Main Action Section */}
      <Paper 
        sx={{ 
          p: 4, 
          mb: 4, 
          borderRadius: 4,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
          border: `2px solid ${alpha(theme.palette.primary.main, 0.15)}`,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            zIndex: 1
          }
        }}
      >
        <Box textAlign="center" mb={4}>
          <Typography 
            variant="h3" 
            fontWeight="bold" 
            gutterBottom
            sx={{
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1
            }}
          >
            🚀 Boost Your Career
          </Typography>
          <Typography variant="h5" color="text.secondary" sx={{ fontWeight: 'medium', mb: 2 }}>
            Essential tools designed for your success
          </Typography>
          <Box sx={{ 
            width: 80, 
            height: 4, 
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            borderRadius: 2,
            mx: 'auto'
          }} />
        </Box>
        
        <Grid container spacing={3} justifyContent="center">
          {primaryActions.map((action) => (
            <Grid item xs={12} sm={6} md={3} key={action.id}>
              <PrimaryActionCard action={action} />
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Quick Access Grid */}
      <Paper sx={{ 
        p: 4, 
        mb: 4, 
        borderRadius: 3,
        bgcolor: alpha(theme.palette.grey[50], 0.5),
        border: `1px solid ${alpha(theme.palette.grey[300], 0.3)}`,
        boxShadow: `0 2px 20px ${alpha(theme.palette.grey[500], 0.1)}`
      }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
          <Box>
            <Typography variant="h5" fontWeight="bold" sx={{ 
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              ⚡ Quick Access
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Shortcuts to your important tools
            </Typography>
          </Box>
          <Chip
            icon={<TrendingUp />}
            label="All Tools"
            color="primary"
            variant="outlined"
            size="small"
            sx={{ fontWeight: 'medium' }}
          />
        </Stack>
        
        <Grid container spacing={2}>
          {quickActions.map((action) => (
            <Grid item xs={6} sm={4} md={2} key={action.id}>
              <QuickActionCard action={action} />
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Conditional Helper Section - Only show if profile is incomplete */}
      {profileCompletion && !profileCompletion.isComplete && (
        <Paper 
          sx={{ 
            p: 4, 
            mb: 2,
            borderRadius: 4,
            background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.08)} 0%, ${alpha(theme.palette.info.light, 0.05)} 100%)`,
            border: `2px solid ${alpha(theme.palette.info.main, 0.2)}`,
            position: 'relative',
            overflow: 'hidden',
            boxShadow: `0 4px 20px ${alpha(theme.palette.info.main, 0.15)}`,
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: `linear-gradient(90deg, ${theme.palette.info.main}, ${theme.palette.info.light})`,
              zIndex: 1
            }
          }}
        >
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={{ xs: 2, sm: 3 }} 
            alignItems={{ xs: 'center', sm: 'flex-start' }}
            textAlign={{ xs: 'center', sm: 'left' }}
          >
            <Avatar 
              sx={{ 
                bgcolor: theme.palette.info.main, 
                width: 64, 
                height: 64,
                boxShadow: `0 4px 15px ${alpha(theme.palette.info.main, 0.3)}`,
                border: `3px solid ${alpha(theme.palette.info.main, 0.2)}`
              }}
            >
              <Speed sx={{ fontSize: 32 }} />
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography 
                variant="h5" 
                fontWeight="bold" 
                gutterBottom
                sx={{
                  color: theme.palette.info.dark,
                  mb: 1
                }}
              >
                💡 Complete Your Profile to Unlock Opportunities
              </Typography>
              <Typography 
                variant="body1" 
                color="text.secondary" 
                sx={{ 
                  lineHeight: 1.6,
                  mb: 2
                }}
              >
                A complete profile increases your job match accuracy by 75% and makes you 
                3x more likely to be contacted by employers. You're {profileCompletion.score}% complete!
              </Typography>
              <Stack 
                direction={{ xs: 'column', sm: 'row' }} 
                spacing={1} 
                alignItems={{ xs: 'stretch', sm: 'center' }}
              >
                <Chip
                  icon={<Warning />}
                  label={`${profileCompletion.score}% Complete`}
                  color="info"
                  variant="outlined"
                  size="small"
                  sx={{ fontWeight: 'medium' }}
                />
                <Chip
                  icon={<TrendingUp />}
                  label="Boost Visibility"
                  color="info"
                  variant="filled"
                  size="small"
                  sx={{ fontWeight: 'medium' }}
                />
              </Stack>
            </Box>
            <Box sx={{ flexShrink: 0 }}>
              <Button
                variant="contained"
                color="info"
                onClick={() => onNavigate('/app/profile?edit=true', 'complete profile')}
                startIcon={<Person />}
                sx={{ 
                  borderRadius: 3, 
                  textTransform: 'none',
                  fontWeight: 'bold',
                  px: 3,
                  py: 1,
                  boxShadow: `0 3px 12px ${alpha(theme.palette.info.main, 0.3)}`,
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 6px 20px ${alpha(theme.palette.info.main, 0.4)}`
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                Complete Profile
              </Button>
            </Box>
          </Stack>
        </Paper>
      )}

      {/* Success Section - Show when profile is complete */}
      {profileCompletion && profileCompletion.isComplete && (
        <Paper 
          sx={{ 
            p: 4, 
            mb: 2,
            borderRadius: 4,
            background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.08)} 0%, ${alpha(theme.palette.success.light, 0.05)} 100%)`,
            border: `2px solid ${alpha(theme.palette.success.main, 0.2)}`,
            position: 'relative',
            overflow: 'hidden',
            boxShadow: `0 4px 20px ${alpha(theme.palette.success.main, 0.15)}`,
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.success.light})`,
              zIndex: 1
            }
          }}
        >
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={{ xs: 2, sm: 3 }} 
            alignItems={{ xs: 'center', sm: 'flex-start' }}
            textAlign={{ xs: 'center', sm: 'left' }}
          >
            <Avatar 
              sx={{ 
                bgcolor: theme.palette.success.main, 
                width: 64, 
                height: 64,
                boxShadow: `0 4px 15px ${alpha(theme.palette.success.main, 0.3)}`,
                border: `3px solid ${alpha(theme.palette.success.main, 0.2)}`
              }}
            >
              <EmojiEvents sx={{ fontSize: 32 }} />
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography 
                variant="h5" 
                fontWeight="bold" 
                gutterBottom
                sx={{
                  color: theme.palette.success.dark,
                  mb: 1
                }}
              >
                🎉 Excellent! Your Profile is Complete
              </Typography>
              <Typography 
                variant="body1" 
                color="text.secondary" 
                sx={{ 
                  lineHeight: 1.6,
                  mb: 2
                }}
              >
                You're all set to receive the best job matches and opportunities. 
                Keep your profile updated for even better results and higher visibility!
              </Typography>
              <Stack 
                direction={{ xs: 'column', sm: 'row' }} 
                spacing={1} 
                alignItems={{ xs: 'stretch', sm: 'center' }}
              >
                <Chip
                  icon={<CheckCircle />}
                  label="Profile 100% Complete"
                  color="success"
                  variant="outlined"
                  size="small"
                  sx={{ fontWeight: 'medium' }}
                />
                <Chip
                  icon={<TrendingUp />}
                  label="Enhanced Visibility"
                  color="success"
                  variant="filled"
                  size="small"
                  sx={{ fontWeight: 'medium' }}
                />
              </Stack>
            </Box>
            <Box sx={{ flexShrink: 0 }}>
              <Button
                variant="contained"
                color="success"
                onClick={() => onNavigate('/app/profile?edit=true', 'update profile')}
                startIcon={<Edit />}
                sx={{ 
                  borderRadius: 3, 
                  textTransform: 'none',
                  fontWeight: 'bold',
                  px: 3,
                  py: 1,
                  boxShadow: `0 3px 12px ${alpha(theme.palette.success.main, 0.3)}`,
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 6px 20px ${alpha(theme.palette.success.main, 0.4)}`
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                Update Profile
              </Button>
            </Box>
          </Stack>
        </Paper>
      )}
    </>
  );
};

export default EnhancedDashboardActions;
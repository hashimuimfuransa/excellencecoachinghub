import React from 'react';
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
  useTheme,
  alpha,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Person,
  Work,
  School,
  CheckCircle,
  ArrowForward,
  Close,
  Star,
  TrendingUp,
  Visibility,
  Business,
  Phone,
  Email,
  LocationOn,
  Assignment,
  Edit
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useFreshUserData } from '../hooks/useFreshUserData';
import { validateProfileSimple } from '../utils/simpleProfileValidation';

interface ProfileSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactElement;
  completed: boolean;
  completionScore: number;
  action: () => void;
  priority: 'high' | 'medium' | 'low';
}

interface ModernProfileCompletionProps {
  user: any;
  onEditProfile: () => void;
  onDismiss?: () => void;
}

const ModernProfileCompletion: React.FC<ModernProfileCompletionProps> = ({
  user,
  onEditProfile,
  onDismiss
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { freshUser, loading, error } = useFreshUserData(user);

  // Show loading state while fetching fresh data
  if (loading) {
    return (
      <Card sx={{ mb: 4, borderRadius: 3 }}>
        <CardContent sx={{ p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress />
            <Typography color="textSecondary">
              Loading your profile status...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const currentUser = freshUser || user;
  console.log('🔍 ModernProfileCompletion using user data:', currentUser);
  
  // Use consistent validation logic from validateProfileSimple
  const validationResult = validateProfileSimple(currentUser);
  const completionPercentage = validationResult.completionPercentage;
  
  console.log('📊 ModernProfileCompletion completion percentage:', completionPercentage);

  const profileSections: ProfileSection[] = [
    {
      id: 'basic',
      title: 'Basic Information',
      description: 'Name, contact details, and location',
      icon: <Person />,
      completed: !!(currentUser?.firstName && currentUser?.lastName && currentUser?.phone && currentUser?.location),
      completionScore: 25,
      action: () => window.location.href = '/app/profile?edit=true',
      priority: 'high'
    },
    {
      id: 'experience',
      title: 'Work Experience',
      description: 'Add your professional background',
      icon: <Work />,
      completed: !!(currentUser?.experience?.length > 0),
      completionScore: 30,
      action: () => window.location.href = '/app/profile?edit=true',
      priority: 'high'
    },
    {
      id: 'skills',
      title: 'Skills & Expertise',
      description: 'Showcase your technical and soft skills',
      icon: <Star />,
      completed: !!(currentUser?.skills?.length > 2),
      completionScore: 25,
      action: () => window.location.href = '/app/profile?edit=true',
      priority: 'medium'
    },
    {
      id: 'education',
      title: 'Education',
      description: 'Academic background and certifications',
      icon: <School />,
      completed: !!(currentUser?.education?.length > 0),
      completionScore: 20,
      action: () => window.location.href = '/app/profile?edit=true',
      priority: 'medium'
    }
  ];

  const incompleteHighPriority = profileSections.filter(
    section => !section.completed && section.priority === 'high'
  );

  const getProfileStrength = (percentage: number) => {
    if (percentage >= 80) return { text: 'Excellent', color: theme.palette.success.main };
    if (percentage >= 60) return { text: 'Good', color: theme.palette.info.main };
    if (percentage >= 40) return { text: 'Fair', color: theme.palette.warning.main };
    return { text: 'Needs Work', color: theme.palette.error.main };
  };

  const profileStrength = getProfileStrength(completionPercentage);

  if (completionPercentage >= 90) {
    return null; // Don't show for highly complete profiles
  }

  return (
    <Card
      sx={{
        mb: 4,
        borderRadius: 3,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
        position: 'relative'
      }}
    >
      {onDismiss && (
        <IconButton
          sx={{ position: 'absolute', top: 16, right: 16, zIndex: 1 }}
          onClick={onDismiss}
        >
          <Close />
        </IconButton>
      )}

      <CardContent sx={{ p: 4 }}>
        {/* Header with CTA First */}
        <Grid container spacing={4} alignItems="center" sx={{ mb: 4 }}>
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Avatar
                sx={{
                  width: 60,
                  height: 60,
                  bgcolor: alpha(profileStrength.color, 0.1),
                  color: profileStrength.color,
                  fontSize: '1.5rem',
                  fontWeight: 'bold'
                }}
              >
                {completionPercentage}%
              </Avatar>
              <Box flex={1}>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                  🚀 Boost Your Profile Power
                </Typography>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Complete profiles get 5x more employer views & job matches
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={completionPercentage}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      flex: 1,
                      bgcolor: alpha(theme.palette.grey[300], 0.3),
                      '& .MuiLinearProgress-bar': {
                        bgcolor: profileStrength.color,
                        borderRadius: 4
                      }
                    }}
                  />
                  <Chip 
                    label={profileStrength.text} 
                    size="small" 
                    sx={{ 
                      bgcolor: alpha(profileStrength.color, 0.1),
                      color: profileStrength.color,
                      fontWeight: 'bold'
                    }}
                  />
                </Box>
              </Box>
            </Box>
          </Grid>
          
          {/* Primary CTA Button - Most Prominent */}
          <Grid item xs={12} md={4}>
            <Button
              variant="contained"
              size="large"
              fullWidth
              startIcon={<Edit />}
              onClick={() => window.location.href = '/app/profile'}
              sx={{
                py: 2,
                fontSize: '1.1rem',
                fontWeight: 'bold',
                textTransform: 'none',
                borderRadius: 3,
                background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
                boxShadow: theme.shadows[8],
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: theme.shadows[12],
                }
              }}
            >
              Complete My Profile Now
            </Button>
          </Grid>
        </Grid>

        {/* What's Missing Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
            ⏰ Quick Fixes - Just {profileSections.filter(s => !s.completed).length} steps to complete
          </Typography>
          
          <Grid container spacing={2}>
            {profileSections
              .filter(section => !section.completed)
              .slice(0, 4)
              .map((section) => (
                <Grid item xs={12} sm={6} key={section.id}>
                  <Paper
                    sx={{
                      p: 3,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      borderRadius: 2,
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows[8],
                        border: `1px solid ${theme.palette.primary.main}`,
                      }
                    }}
                    onClick={section.action}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          color: theme.palette.primary.main,
                          width: 40,
                          height: 40
                        }}
                      >
                        {section.icon}
                      </Avatar>
                      <Box flex={1}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {section.title}
                          </Typography>
                          {section.priority === 'high' && (
                            <Chip
                              label="High Priority"
                              size="small"
                              color="error"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                      </Box>
                      <Chip
                        label={`+${section.completionScore}%`}
                        size="small"
                        color="primary"
                        variant="filled"
                        sx={{ fontWeight: 'bold' }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {section.description}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
          </Grid>
        </Box>

        {/* Benefits Row */}
        <Paper
          sx={{
            p: 3,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.success.main, 0.05),
            border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
          }}
        >
          <Typography variant="h6" fontWeight="bold" color="success.main" gutterBottom textAlign="center">
            💡 Why Complete Your Profile?
          </Typography>
          
          <Grid container spacing={3} textAlign="center">
            <Grid item xs={12} md={4}>
              <Box>
                <TrendingUp sx={{ color: 'success.main', fontSize: '2.5rem', mb: 1 }} />
                <Typography variant="h4" fontWeight="bold" color="success.main">
                  5x
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  More Profile Views
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box>
                <Visibility sx={{ color: 'info.main', fontSize: '2.5rem', mb: 1 }} />
                <Typography variant="h4" fontWeight="bold" color="info.main">
                  3x
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Better Job Matches
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box>
                <Business sx={{ color: 'primary.main', fontSize: '2.5rem', mb: 1 }} />
                <Typography variant="h4" fontWeight="bold" color="primary.main">
                  2x
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Recruiter Messages
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </CardContent>
    </Card>
  );
};

export default ModernProfileCompletion;
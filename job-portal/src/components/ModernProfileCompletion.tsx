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
  Tooltip
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

  // Calculate profile completion based on user data
  const calculateCompletion = () => {
    let score = 0;
    let total = 0;

    const checks = [
      { field: user?.firstName, weight: 5 },
      { field: user?.lastName, weight: 5 },
      { field: user?.email, weight: 5 },
      { field: user?.phone, weight: 10 },
      { field: user?.location, weight: 10 },
      { field: user?.bio, weight: 15 },
      { field: user?.skills?.length > 0, weight: 20 },
      { field: user?.experience?.length > 0, weight: 20 },
      { field: user?.education?.length > 0, weight: 10 }
    ];

    checks.forEach(check => {
      total += check.weight;
      if (check.field) {
        score += check.weight;
      }
    });

    return Math.round((score / total) * 100);
  };

  const completionPercentage = calculateCompletion();

  const profileSections: ProfileSection[] = [
    {
      id: 'basic',
      title: 'Basic Information',
      description: 'Name, contact details, and location',
      icon: <Person />,
      completed: !!(user?.firstName && user?.lastName && user?.phone && user?.location),
      completionScore: 25,
      action: onEditProfile,
      priority: 'high'
    },
    {
      id: 'experience',
      title: 'Work Experience',
      description: 'Add your professional background',
      icon: <Work />,
      completed: !!(user?.experience?.length > 0),
      completionScore: 30,
      action: onEditProfile,
      priority: 'high'
    },
    {
      id: 'skills',
      title: 'Skills & Expertise',
      description: 'Showcase your technical and soft skills',
      icon: <Star />,
      completed: !!(user?.skills?.length > 2),
      completionScore: 25,
      action: onEditProfile,
      priority: 'medium'
    },
    {
      id: 'education',
      title: 'Education',
      description: 'Academic background and certifications',
      icon: <School />,
      completed: !!(user?.education?.length > 0),
      completionScore: 20,
      action: onEditProfile,
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
        <Grid container spacing={4} alignItems="center">
          {/* Profile Overview */}
          <Grid item xs={12} md={4}>
            <Box textAlign="center">
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  mx: 'auto',
                  mb: 2,
                  bgcolor: alpha(profileStrength.color, 0.1),
                  color: profileStrength.color,
                  fontSize: '2rem'
                }}
              >
                {completionPercentage}%
              </Avatar>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Profile Strength: {profileStrength.text}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={completionPercentage}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: alpha(theme.palette.grey[300], 0.3),
                  '& .MuiLinearProgress-bar': {
                    bgcolor: profileStrength.color,
                    borderRadius: 4
                  }
                }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {completionPercentage}% Complete
              </Typography>
            </Box>
          </Grid>

          {/* Missing Sections */}
          <Grid item xs={12} md={5}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Complete Your Profile
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              A complete profile gets 5x more views from employers
            </Typography>
            
            <Stack spacing={2}>
              {profileSections
                .filter(section => !section.completed)
                .slice(0, 3)
                .map((section) => (
                  <Paper
                    key={section.id}
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
                    onClick={section.action}
                  >
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Avatar
                        sx={{
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          color: theme.palette.primary.main,
                          width: 32,
                          height: 32
                        }}
                      >
                        {section.icon}
                      </Avatar>
                      <Box flex={1}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography variant="subtitle2" fontWeight="medium">
                            {section.title}
                          </Typography>
                          {section.priority === 'high' && (
                            <Chip
                              label="Important"
                              size="small"
                              color="error"
                              variant="outlined"
                            />
                          )}
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          {section.description}
                        </Typography>
                      </Box>
                      <Chip
                        label={`+${section.completionScore}%`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Stack>
                  </Paper>
                ))}
            </Stack>
          </Grid>

          {/* Benefits & CTA */}
          <Grid item xs={12} md={3}>
            <Paper
              sx={{
                p: 3,
                textAlign: 'center',
                bgcolor: alpha(theme.palette.success.main, 0.05),
                border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
              }}
            >
              <Typography variant="h6" fontWeight="bold" color="success.main" gutterBottom>
                Profile Benefits
              </Typography>
              
              <Stack spacing={1.5} mb={3}>
                <Box display="flex" alignItems="center">
                  <TrendingUp sx={{ color: 'success.main', mr: 1, fontSize: '20px' }} />
                  <Typography variant="body2">
                    5x more profile views
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center">
                  <Visibility sx={{ color: 'info.main', mr: 1, fontSize: '20px' }} />
                  <Typography variant="body2">
                    Better job matches
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center">
                  <Business sx={{ color: 'primary.main', mr: 1, fontSize: '20px' }} />
                  <Typography variant="body2">
                    Recruiter attention
                  </Typography>
                </Box>
              </Stack>

              <Button
                variant="contained"
                fullWidth
                startIcon={<Edit />}
                onClick={onEditProfile}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600
                }}
              >
                Complete Profile
              </Button>
            </Paper>
          </Grid>
        </Grid>

        {/* Quick Stats */}
        {completionPercentage > 50 && (
          <Box
            sx={{
              mt: 3,
              pt: 3,
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`
            }}
          >
            <Grid container spacing={3} textAlign="center">
              <Grid item xs={4}>
                <Typography variant="h4" fontWeight="bold" color="primary.main">
                  {user?.skills?.length || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Skills Listed
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="h4" fontWeight="bold" color="success.main">
                  {user?.experience?.length || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Work Experiences
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="h4" fontWeight="bold" color="info.main">
                  {user?.education?.length || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Education Records
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ModernProfileCompletion;
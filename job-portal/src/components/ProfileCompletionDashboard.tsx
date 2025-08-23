import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Divider,
  Stack,
  Avatar,
  IconButton,
  Tooltip,
  Paper,
  useTheme
} from '@mui/material';
import {
  Person,
  Work,
  School,
  Code,
  Language,
  Phone,
  Email,
  LocationOn,
  CheckCircle,
  Warning,
  Error,
  Info,
  Edit,
  TrendingUp,
  Psychology,
  Quiz,
  Star,
  Lock,
  LockOpen,
  Verified
} from '@mui/icons-material';
import { User } from '../types/user';
import { validateProfile, getFieldDisplayName } from '../utils/profileValidation';
import { validateProfileSimple } from '../utils/simpleProfileValidation';
import { useNavigate } from 'react-router-dom';

interface ProfileCompletionDashboardProps {
  user: User;
  onEditProfile?: () => void;
  showRecommendations?: boolean;
}

const ProfileCompletionDashboard: React.FC<ProfileCompletionDashboardProps> = ({
  user,
  onEditProfile,
  showRecommendations = true
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [validationResult, setValidationResult] = useState<any>(null);

  useEffect(() => {
    if (user) {
      console.log('🔍 ProfileCompletionDashboard received user data:', user);
      // Use simple validation for more accurate results
      const result = validateProfileSimple(user);
      console.log('📊 ProfileCompletionDashboard validation result:', result);
      setValidationResult(result);
    }
  }, [user]);

  if (!validationResult) {
    return null;
  }

  const {
    completionPercentage,
    missingFields,
    completedSections,
    canAccessFeatures,
    recommendations
  } = validationResult;

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'info';
    if (percentage >= 40) return 'warning';
    return 'error';
  };

  const getCompletionIcon = (percentage: number) => {
    if (percentage >= 80) return <CheckCircle color="success" />;
    if (percentage >= 60) return <Info color="info" />;
    if (percentage >= 40) return <Warning color="warning" />;
    return <Error color="error" />;
  };

  const getSectionIcon = (section: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'basic': <Person />,
      'contact': <Email />,
      'professional': <Work />,
      'experience': <Work />,
      'education': <School />,
      'skills': <Code />,
      'languages': <Language />
    };
    return iconMap[section] || <Info />;
  };

  const getFeatureIcon = (feature: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'psychometricTests': <Psychology />,
      'aiInterviews': <Quiz />,
      'premiumJobs': <Star />
    };
    return iconMap[feature] || <Lock />;
  };

  const getFeatureTitle = (feature: string) => {
    const titleMap: Record<string, string> = {
      'psychometricTests': 'Psychometric Tests',
      'aiInterviews': 'AI Interview Practice',
      'premiumJobs': 'Premium Job Opportunities'
    };
    return titleMap[feature] || feature;
  };

  const getFeatureDescription = (feature: string) => {
    const descMap: Record<string, string> = {
      'psychometricTests': 'Assess your personality and cognitive abilities',
      'aiInterviews': 'Practice interviews with AI feedback',
      'premiumJobs': 'Access exclusive job opportunities'
    };
    return descMap[feature] || '';
  };

  const handleFeatureClick = (feature: string) => {
    if (canAccessFeatures[feature]) {
      switch (feature) {
        case 'psychometricTests':
          navigate('/app/psychometric-tests');
          break;
        case 'aiInterviews':
          navigate('/app/interviews');
          break;
        case 'premiumJobs':
          navigate('/app/jobs?premium=true');
          break;
      }
    } else {
      // Show profile completion requirement
      if (onEditProfile) {
        onEditProfile();
      }
    }
  };

  return (
    <Box>
      {/* Main Completion Card */}
      <Card sx={{ mb: 3, background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.secondary.main}15 100%)` }}>
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar
                  src={user.profilePicture}
                  sx={{ width: 64, height: 64 }}
                >
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {user.firstName} {user.lastName}
                  </Typography>
                  <Typography variant="subtitle1" color="textSecondary">
                    {user.jobTitle || 'Job Seeker'}
                  </Typography>
                  {user.location && (
                    <Typography variant="body2" color="textSecondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <LocationOn fontSize="small" />
                      {user.location}
                    </Typography>
                  )}
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                {getCompletionIcon(completionPercentage)}
                <Typography variant="h6" fontWeight="bold">
                  Profile {completionPercentage}% Complete
                </Typography>
                {completionPercentage >= 80 && (
                  <Chip
                    icon={<Verified />}
                    label="Profile Complete"
                    color="success"
                    variant="filled"
                  />
                )}
              </Box>

              <LinearProgress
                variant="determinate"
                value={completionPercentage}
                color={getCompletionColor(completionPercentage)}
                sx={{
                  height: 12,
                  borderRadius: 6,
                  mb: 2,
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 6
                  }
                }}
              />

              <Typography variant="body2" color="textSecondary">
                {completionPercentage < 50 && "Complete your profile to unlock all features and improve job matching."}
                {completionPercentage >= 50 && completionPercentage < 80 && "You're making great progress! Complete a few more sections to unlock premium features."}
                {completionPercentage >= 80 && "Excellent! Your profile is complete and you have access to all features."}
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<Edit />}
                  onClick={() => {
                    console.log('🚀 Complete Profile button clicked - navigating to profile');
                    onEditProfile();
                  }}
                  sx={{ mb: 2, minWidth: 200 }}
                >
                  Complete Profile
                </Button>
                <Typography variant="body2" color="textSecondary">
                  {missingFields.length} fields remaining
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Section Completion Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp />
                Profile Sections
              </Typography>
              <List dense>
                {completedSections && Object.entries(completedSections).map(([section, completed]) => (
                  <ListItem key={section} divider>
                    <ListItemIcon>
                      {getSectionIcon(section)}
                    </ListItemIcon>
                    <ListItemText
                      primary={section.charAt(0).toUpperCase() + section.slice(1)}
                      secondary={completed ? 'Complete' : 'Incomplete'}
                    />
                    {completed ? (
                      <CheckCircle color="success" />
                    ) : (
                      <Error color="error" />
                    )}
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Feature Access Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Star />
                Feature Access
              </Typography>
              <Stack spacing={2}>
                {Object.entries(canAccessFeatures).map(([feature, hasAccess]) => (
                  <Paper
                    key={feature}
                    sx={{
                      p: 2,
                      border: 1,
                      borderColor: hasAccess ? 'success.main' : 'grey.300',
                      bgcolor: hasAccess ? 'success.light' : 'grey.50',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 2
                      }
                    }}
                    onClick={() => handleFeatureClick(feature)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {getFeatureIcon(feature)}
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {getFeatureTitle(feature)}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {getFeatureDescription(feature)}
                          </Typography>
                        </Box>
                      </Box>
                      {hasAccess ? (
                        <LockOpen color="success" />
                      ) : (
                        <Lock color="disabled" />
                      )}
                    </Box>
                  </Paper>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Missing Fields */}
        {missingFields.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Warning color="warning" />
                  Complete These Fields
                </Typography>
                <Grid container spacing={1}>
                  {missingFields.map((field) => (
                    <Grid item key={field}>
                      <Chip
                        label={getFieldDisplayName(field)}
                        variant="outlined"
                        color="warning"
                        size="small"
                        onClick={onEditProfile}
                        clickable
                      />
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Recommendations */}
        {showRecommendations && recommendations.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Info color="info" />
                  Recommendations
                </Typography>
                <List dense>
                  {recommendations.map((recommendation, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <CheckCircle color="info" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={recommendation} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default ProfileCompletionDashboard;
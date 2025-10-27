import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Grid,
  Alert,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Tooltip,
  Avatar
} from '@mui/material';
import {
  CheckCircle,
  Warning,
  Person,
  Work,
  School,
  Code,
  Email,
  Phone,
  Info,
  TrendingUp,
  Psychology,
  Quiz,
  WorkOutline,
  SmartToy,
  Refresh
} from '@mui/icons-material';
import { User } from '../types/user';
import { validateProfileSimple } from '../utils/simpleProfileValidation';
import { getFieldDisplayName } from '../utils/profileValidation';
import { userService } from '../services/userService';

interface ProfileCompletionStatusProps {
  user: User;
  feature?: 'psychometricTests' | 'aiInterviews' | 'premiumJobs' | 'smartTests';
  onRefresh?: () => void;
  showDetailed?: boolean;
}

const ProfileCompletionStatus: React.FC<ProfileCompletionStatusProps> = ({
  user,
  feature = 'smartTests',
  onRefresh,
  showDetailed = true
}) => {
  const [freshUser, setFreshUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFreshUserData = async () => {
      try {
        if (!user?._id) {
          setFreshUser(user);
          setLoading(false);
          return;
        }
        
        console.log('🔍 ProfileCompletionStatus: Fetching fresh user data for:', user._id);
        const freshUserData = await userService.getUserProfile(user._id);
        console.log('📊 ProfileCompletionStatus: Fresh user data received:', freshUserData);
        console.log('📊 ProfileCompletionStatus: Auth user data:', user);
        
        // Debug validation differences
        const freshValidation = validateProfileSimple(freshUserData);
        const authValidation = validateProfileSimple(user);
        console.log('🔍 Fresh validation:', freshValidation);
        console.log('🔍 Auth validation:', authValidation);
        
        setFreshUser(freshUserData);
      } catch (error) {
        console.error('❌ ProfileCompletionStatus: Error fetching fresh user data:', error);
        setFreshUser(user);
      } finally {
        setLoading(false);
      }
    };

    fetchFreshUserData();
  }, [user]);

  if (loading) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 2 }}>
            Loading profile data...
          </Box>
        </CardContent>
      </Card>
    );
  }

  const currentUser = freshUser || user;
  const validationResult = validateProfileSimple(currentUser);
  const completionPercentage = validationResult.completionPercentage;
  
  const getFeatureInfo = (feature: string) => {
    switch (feature) {
      case 'psychometricTests':
        return {
          title: 'Psychometric Tests',
          icon: <Psychology />,
          color: 'primary.main',
          requiredCompletion: 40,
          description: 'Assess your personality and cognitive abilities'
        };
      case 'aiInterviews':
        return {
          title: 'AI Interview Practice',
          icon: <Quiz />,
          color: 'secondary.main',
          requiredCompletion: 60,
          description: 'Practice interviews with AI feedback'
        };
      case 'premiumJobs':
        return {
          title: 'Premium Jobs',
          icon: <WorkOutline />,
          color: 'success.main',
          requiredCompletion: 80,
          description: 'Access exclusive job opportunities'
        };
      case 'smartTests':
        return {
          title: 'Smart Tests',
          icon: <SmartToy />,
          color: 'info.main',
          requiredCompletion: 40,
          description: 'AI-powered job-specific assessments'
        };
      default:
        return {
          title: 'Feature',
          icon: <Info />,
          color: 'grey.500',
          requiredCompletion: 50,
          description: 'Access premium features'
        };
    }
  };

  const featureInfo = getFeatureInfo(feature);
  const canAccessFeature = validationResult.canAccessFeatures[feature];

  // Define field icons
  const getFieldIcon = (field: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'firstName': <Person fontSize="small" />,
      'lastName': <Person fontSize="small" />,
      'email': <Email fontSize="small" />,
      'phone': <Phone fontSize="small" />,
      'jobTitle': <Work fontSize="small" />,
      'experience': <Work fontSize="small" />,
      'education': <School fontSize="small" />,
      'skills': <Code fontSize="small" />
    };
    return iconMap[field] || <Info fontSize="small" />;
  };


  const featureFields = {
    'psychometricTests': ['firstName', 'lastName', 'email', 'skills'],
    'aiInterviews': ['firstName', 'lastName', 'email', 'phone', 'jobTitle', 'experience', 'skills', 'resume'],
    'premiumJobs': ['firstName', 'lastName', 'email', 'phone', 'location', 'jobTitle', 'experience', 'education', 'skills', 'resume'],
    'smartTests': ['firstName', 'lastName', 'email', 'skills', 'jobTitle']
  };

  const requiredFields = featureFields[feature] || [];
  const completedFields = requiredFields.filter(field => checkFieldCompletion(field));
  const missingFields = requiredFields.filter(field => !checkFieldCompletion(field));

  // Updated checkFieldCompletion to use currentUser
  function checkFieldCompletion(field: string) {
    const hasValue = (obj: any, path: string): boolean => {
      const value = path.split('.').reduce((current, key) => {
        return current && current[key] !== undefined ? current[key] : undefined;
      }, obj);
      
      if (value === null || value === undefined) return false;
      if (typeof value === 'string') return value.trim().length > 0;
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'object') {
        return Object.keys(value).some(key => hasValue(value, key));
      }
      return true;
    };

    return hasValue(currentUser, field);
  }

  const getStatusColor = () => {
    if (canAccessFeature) return 'success';
    if (completionPercentage >= featureInfo.requiredCompletion * 0.8) return 'warning';
    return 'error';
  };

  const getStatusIcon = () => {
    if (canAccessFeature) return <CheckCircle />;
    if (completionPercentage >= featureInfo.requiredCompletion * 0.8) return <Warning />;
    return <Warning />;
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: canAccessFeature ? 'success.main' : 'warning.main' }}>
              {featureInfo.icon}
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                Profile Completion Status
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Access to {featureInfo.title}
              </Typography>
            </Box>
          </Box>
          {onRefresh && (
            <Tooltip title="Refresh Profile Data">
              <IconButton onClick={onRefresh} size="small">
                <Refresh />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* Progress Bar */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body1" fontWeight="medium">
              {completionPercentage}% Complete
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Chip
                icon={getStatusIcon()}
                label={canAccessFeature ? 'Access Granted' : `${missingFields.length} Missing`}
                color={getStatusColor()}
                size="small"
                variant={canAccessFeature ? 'filled' : 'outlined'}
              />
              <Chip
                label={`Need ${featureInfo.requiredCompletion}%`}
                color={completionPercentage >= featureInfo.requiredCompletion ? 'success' : 'default'}
                variant="outlined"
                size="small"
              />
            </Box>
          </Box>
          
          <LinearProgress
            variant="determinate"
            value={completionPercentage}
            sx={{
              height: 10,
              borderRadius: 5,
              bgcolor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                borderRadius: 5,
                bgcolor: canAccessFeature ? 'success.main' : 'warning.main'
              }
            }}
          />
        </Box>

        {/* Feature-specific Requirements */}
        <Alert 
          severity={canAccessFeature ? 'success' : 'warning'} 
          sx={{ mb: 2 }}
          icon={getStatusIcon()}
        >
          <Typography variant="body2">
            <strong>{canAccessFeature ? 'Great! ' : ''}</strong>
            {canAccessFeature 
              ? `You have access to ${featureInfo.title}. ${featureInfo.description}`
              : `You need ${featureInfo.requiredCompletion}% profile completion to access ${featureInfo.title}. Missing ${missingFields.length} required field${missingFields.length !== 1 ? 's' : ''}.`
            }
          </Typography>
        </Alert>

        {/* Detailed Field Status */}
        {showDetailed && (
          <Grid container spacing={2}>
            {/* Completed Fields */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom color="success.main">
                ✅ Completed Fields ({completedFields.length})
              </Typography>
              <List dense>
                {completedFields.map((field) => (
                  <ListItem key={field} sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      {getFieldIcon(field)}
                    </ListItemIcon>
                    <ListItemText
                      primary={getFieldDisplayName(field)}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Grid>

            {/* Missing Fields */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom color="error.main">
                ❌ Missing Fields ({missingFields.length})
              </Typography>
              <List dense>
                {missingFields.map((field) => (
                  <ListItem key={field} sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <Warning fontSize="small" color="warning" />
                    </ListItemIcon>
                    <ListItemText
                      primary={getFieldDisplayName(field)}
                      primaryTypographyProps={{ variant: 'body2' }}
                      secondary="Required"
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Grid>
          </Grid>
        )}

        {/* Action Button */}
        {!canAccessFeature && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button
              variant="contained"
              startIcon={<Person />}
              onClick={() => window.location.href = '/app/profile'}
              sx={{ minWidth: 200 }}
            >
              Complete Profile
            </Button>
          </Box>
        )}

        {/* Benefits */}
        {!canAccessFeature && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom color="primary.main">
              Benefits of completing your profile:
            </Typography>
            <List dense>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <TrendingUp fontSize="small" color="success" />
                </ListItemIcon>
                <ListItemText
                  primary="Better Test Personalization"
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <TrendingUp fontSize="small" color="success" />
                </ListItemIcon>
                <ListItemText
                  primary="Improved Job Matching"
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <TrendingUp fontSize="small" color="success" />
                </ListItemIcon>
                <ListItemText
                  primary="Access to Premium Features"
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
            </List>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileCompletionStatus;

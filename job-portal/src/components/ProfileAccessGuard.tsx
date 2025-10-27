import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  Lock,
  Warning,
  CheckCircle,
  ArrowForward,
  Psychology,
  Quiz,
  WorkOutline,
  Person,
  School,
  Code,
  Phone,
  Email,
  SmartToy
} from '@mui/icons-material';
import { User } from '../types/user';
import { validateProfile, getFieldDisplayName } from '../utils/profileValidation';
import { validateProfileSimple } from '../utils/simpleProfileValidation';
import { useNavigate } from 'react-router-dom';
import { useFreshUserData } from '../hooks/useFreshUserData';

interface ProfileAccessGuardProps {
  user: User;
  feature: 'psychometricTests' | 'aiInterviews' | 'premiumJobs' | 'smartTests';
  children: React.ReactNode;
}

const ProfileAccessGuard: React.FC<ProfileAccessGuardProps> = ({
  user,
  feature,
  children
}) => {
  const navigate = useNavigate();
  const { freshUser, loading, error, refetch } = useFreshUserData(user);

  // Show loading state while fetching fresh data
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '200px',
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress />
        <Typography color="textSecondary">
          Checking your latest profile status...
        </Typography>
      </Box>
    );
  }

  const currentUser = freshUser || user;
  console.log('🔍 ProfileAccessGuard validating user for feature:', feature, currentUser);
  const validationResult = validateProfileSimple(currentUser);
  console.log('📊 ProfileAccessGuard validation result:', validationResult);
  const canAccess = validationResult.canAccessFeatures[feature];

  // Show error state if there was an error fetching fresh data
  if (error && !currentUser) {
    return (
      <Box sx={{ py: 4 }}>
        <Card sx={{ maxWidth: 800, mx: 'auto' }}>
          <CardContent sx={{ textAlign: 'center', p: 4 }}>
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
            <Button
              variant="contained"
              onClick={() => refetch()}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  const getFeatureInfo = (feature: string) => {
    switch (feature) {
      case 'psychometricTests':
        return {
          title: 'Psychometric Tests',
          icon: <Psychology sx={{ fontSize: 48, color: 'primary.main' }} />,
          description: 'Assess your personality, cognitive abilities, and work preferences',
          requiredCompletion: 40,
          requiredFields: [
            'firstName', 'lastName', 'email', 'skills'
          ]
        };
      case 'aiInterviews':
        return {
          title: 'AI Interview Practice',
          icon: <Quiz sx={{ fontSize: 48, color: 'secondary.main' }} />,
          description: 'Practice interviews with AI and get personalized feedback',
          requiredCompletion: 70,
          requiredFields: [
            'firstName', 'lastName', 'email', 'phone', 'jobTitle',
            'experience', 'skills', 'resume'
          ]
        };
      case 'premiumJobs':
        return {
          title: 'Premium Job Opportunities',
          icon: <WorkOutline sx={{ fontSize: 48, color: 'success.main' }} />,
          description: 'Access exclusive job opportunities from top employers',
          requiredCompletion: 85,
          requiredFields: [
            'firstName', 'lastName', 'email', 'phone', 'location',
            'jobTitle', 'experience', 'education', 'skills', 'resume',
            'expectedSalary', 'jobPreferences'
          ]
        };
      case 'smartTests':
        return {
          title: 'Smart Job Tests',
          icon: <SmartToy sx={{ fontSize: 48, color: 'info.main' }} />,
          description: 'AI-powered job-specific tests to prepare for your target positions',
          requiredCompletion: 40,
          requiredFields: [
            'firstName', 'lastName', 'email', 'skills', 'jobTitle'
          ]
        };

      default:
        return {
          title: 'Feature',
          icon: <Lock />,
          description: 'Access premium features',
          requiredCompletion: 50,
          requiredFields: []
        };
    }
  };

  const featureInfo = getFeatureInfo(feature);

  // Helper function to check if a field has value
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

  const getMissingFields = () => {
    return featureInfo.requiredFields.filter(field => !hasValue(currentUser, field));
  };

  const getFieldIcon = (field: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'firstName': <Person fontSize="small" />,
      'lastName': <Person fontSize="small" />,
      'email': <Email fontSize="small" />,
      'phone': <Phone fontSize="small" />,
      'jobTitle': <WorkOutline fontSize="small" />,
      'experience': <WorkOutline fontSize="small" />,
      'education': <School fontSize="small" />,
      'skills': <Code fontSize="small" />,
      'resume': <WorkOutline fontSize="small" />
    };
    return iconMap[field] || <ArrowForward fontSize="small" />;
  };

  if (canAccess) {
    return <>{children}</>;
  }

  const missingFields = getMissingFields();
  const completionPercentage = validationResult.completionPercentage;

  return (
    <Box sx={{ py: 4 }}>
      <Card sx={{ maxWidth: 800, mx: 'auto' }}>
        <CardContent sx={{ textAlign: 'center', p: 4 }}>
          {/* Feature Icon */}
          <Box sx={{ mb: 3 }}>
            {featureInfo.icon}
          </Box>

          {/* Title and Description */}
          <Typography variant="h4" gutterBottom fontWeight="bold">
            Complete Your Profile to Access {featureInfo.title}
          </Typography>
          <Typography variant="h6" color="textSecondary" sx={{ mb: 4 }}>
            {featureInfo.description}
          </Typography>

          {/* Current Progress */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 2 }}>
              <Typography variant="h6">
                Profile Completion: {completionPercentage}%
              </Typography>
              <Chip
                label={`Need ${featureInfo.requiredCompletion}%`}
                color={completionPercentage >= featureInfo.requiredCompletion ? 'success' : 'warning'}
                variant={completionPercentage >= featureInfo.requiredCompletion ? 'filled' : 'outlined'}
              />
            </Box>
            <LinearProgress
              variant="determinate"
              value={completionPercentage}
              sx={{
                height: 12,
                borderRadius: 6,
                bgcolor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 6,
                  bgcolor: completionPercentage >= featureInfo.requiredCompletion ? 'success.main' : 'warning.main'
                }
              }}
            />
          </Box>

          {/* Requirements Alert */}
          <Alert 
            severity={completionPercentage >= featureInfo.requiredCompletion ? 'info' : 'warning'} 
            sx={{ mb: 3, textAlign: 'left' }}
          >
            <Typography variant="subtitle2" gutterBottom>
              {completionPercentage >= featureInfo.requiredCompletion 
                ? 'Almost there! Complete the missing fields below:'
                : `You need at least ${featureInfo.requiredCompletion}% profile completion to access ${featureInfo.title}.`
              }
            </Typography>
          </Alert>

          {/* Missing Fields */}
          {missingFields.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Warning color="warning" />
                Missing Required Information
              </Typography>
              <Card variant="outlined">
                <CardContent>
                  <List dense>
                    {missingFields.map((field, index) => (
                      <React.Fragment key={field}>
                        <ListItem>
                          <ListItemIcon>
                            {getFieldIcon(field)}
                          </ListItemIcon>
                          <ListItemText
                            primary={getFieldDisplayName(field)}
                            secondary={`Required for ${featureInfo.title}`}
                          />
                        </ListItem>
                        {index < missingFields.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Box>
          )}

          {/* Benefits of Completion */}
          <Box sx={{ mb: 4, textAlign: 'left' }}>
            <Typography variant="h6" gutterBottom>
              Why Complete Your Profile?
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle color="success" />
                </ListItemIcon>
                <ListItemText
                  primary="Better Job Matching"
                  secondary="Get matched with jobs that fit your skills and preferences"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle color="success" />
                </ListItemIcon>
                <ListItemText
                  primary="Increased Visibility"
                  secondary="Employers can find and contact you directly"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle color="success" />
                </ListItemIcon>
                <ListItemText
                  primary="Access Premium Features"
                  secondary="Unlock psychometric tests, AI interviews, and exclusive jobs"
                />
              </ListItem>
            </List>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<Person />}
              onClick={() => window.location.href = '/app/profile'}
              sx={{ minWidth: 200 }}
            >
              Complete Profile
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => window.location.href = '/app/dashboard'}
            >
              Back to Dashboard
            </Button>
          </Box>

          {/* Help Text */}
          <Typography variant="body2" color="textSecondary" sx={{ mt: 3 }}>
            Need help? Contact our support team for assistance with completing your profile.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ProfileAccessGuard;
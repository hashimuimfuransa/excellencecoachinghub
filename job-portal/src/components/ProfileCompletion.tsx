import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Alert,
  Divider,
  Grid,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  CheckCircle,
  RadioButtonUnchecked,
  Warning,
  Info,
  TrendingUp,
  Psychology,
  Quiz,
  WorkOutline,
  Edit,
  ArrowForward,
  SmartToy
} from '@mui/icons-material';
import { User, ProfileCompletionStatus } from '../types/user';
import { 
  validateProfile, 
  getFieldDisplayName, 
  getCompletionStatusColor, 
  getNextSteps 
} from '../utils/profileValidation';
import { validateProfileSimple } from '../utils/simpleProfileValidation';

interface ProfileCompletionProps {
  user: User;
  onEditProfile?: () => void;
  showFeatureAccess?: boolean;
  compact?: boolean;
}

const ProfileCompletion: React.FC<ProfileCompletionProps> = ({
  user,
  onEditProfile,
  showFeatureAccess = true,
  compact = false
}) => {
  console.log('🔍 ProfileCompletion validating user:', user);
  const validationResult = validateProfileSimple(user);
  console.log('📊 ProfileCompletion validation result:', validationResult);
  const { 
    completionPercentage, 
    status, 
    missingFields, 
    recommendations, 
    canAccessFeatures 
  } = validationResult;

  const statusColor = getCompletionStatusColor(status);
  const nextSteps = getNextSteps(validationResult);

  const getStatusText = (status: ProfileCompletionStatus): string => {
    switch (status) {
      case ProfileCompletionStatus.INCOMPLETE:
        return 'Incomplete';
      case ProfileCompletionStatus.BASIC:
        return 'Basic';
      case ProfileCompletionStatus.INTERMEDIATE:
        return 'Good';
      case ProfileCompletionStatus.COMPLETE:
        return 'Complete';
      default:
        return 'Unknown';
    }
  };

  const getStatusIcon = (status: ProfileCompletionStatus) => {
    switch (status) {
      case ProfileCompletionStatus.INCOMPLETE:
        return <Warning color="error" />;
      case ProfileCompletionStatus.BASIC:
        return <Info color="warning" />;
      case ProfileCompletionStatus.INTERMEDIATE:
        return <TrendingUp color="info" />;
      case ProfileCompletionStatus.COMPLETE:
        return <CheckCircle color="success" />;
      default:
        return <RadioButtonUnchecked />;
    }
  };

  if (compact) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                {getStatusIcon(status)}
                <Typography variant="subtitle2" fontWeight="bold">
                  Profile {completionPercentage}% Complete
                </Typography>
                <Chip 
                  label={getStatusText(status)} 
                  size="small" 
                  sx={{ 
                    bgcolor: statusColor, 
                    color: 'white',
                    fontWeight: 'bold'
                  }} 
                />
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={completionPercentage} 
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  bgcolor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: statusColor,
                    borderRadius: 4
                  }
                }}
              />
            </Box>
            {onEditProfile && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<Edit />}
                onClick={onEditProfile}
              >
                Complete
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {getStatusIcon(status)}
            <Box>
              <Typography variant="h6" fontWeight="bold">
                Profile Completion
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {completionPercentage}% Complete
              </Typography>
            </Box>
          </Box>
          <Chip 
            label={getStatusText(status)} 
            sx={{ 
              bgcolor: statusColor, 
              color: 'white',
              fontWeight: 'bold'
            }} 
          />
        </Box>

        <Box sx={{ mb: 3 }}>
          <LinearProgress 
            variant="determinate" 
            value={completionPercentage} 
            sx={{ 
              height: 12, 
              borderRadius: 6,
              bgcolor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                bgcolor: statusColor,
                borderRadius: 6
              }
            }}
          />
          <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
            {completionPercentage < 40 && 'Complete basic information to improve your profile'}
            {completionPercentage >= 40 && completionPercentage < 70 && 'Good start! Add more details to stand out'}
            {completionPercentage >= 70 && completionPercentage < 90 && 'Great profile! A few more details will make it perfect'}
            {completionPercentage >= 90 && 'Excellent! Your profile is comprehensive and attractive to employers'}
          </Typography>
        </Box>

        {/* Feature Access Status */}
        {showFeatureAccess && (
          <>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Feature Access
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ 
                  p: 2, 
                  border: 1, 
                  borderColor: canAccessFeatures.psychometricTests ? 'success.main' : 'grey.300',
                  borderRadius: 2,
                  bgcolor: canAccessFeatures.psychometricTests ? 'success.50' : 'grey.50'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Psychology fontSize="small" color={canAccessFeatures.psychometricTests ? 'success' : 'disabled'} />
                    <Typography variant="body2" fontWeight="bold">
                      Psychometric Tests
                    </Typography>
                  </Box>
                  <Chip 
                    label={canAccessFeatures.psychometricTests ? 'Available' : 'Locked'} 
                    size="small"
                    color={canAccessFeatures.psychometricTests ? 'success' : 'default'}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ 
                  p: 2, 
                  border: 1, 
                  borderColor: canAccessFeatures.aiInterviews ? 'success.main' : 'grey.300',
                  borderRadius: 2,
                  bgcolor: canAccessFeatures.aiInterviews ? 'success.50' : 'grey.50'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Quiz fontSize="small" color={canAccessFeatures.aiInterviews ? 'success' : 'disabled'} />
                    <Typography variant="body2" fontWeight="bold">
                      AI Interviews
                    </Typography>
                  </Box>
                  <Chip 
                    label={canAccessFeatures.aiInterviews ? 'Available' : 'Locked'} 
                    size="small"
                    color={canAccessFeatures.aiInterviews ? 'success' : 'default'}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ 
                  p: 2, 
                  border: 1, 
                  borderColor: canAccessFeatures.premiumJobs ? 'success.main' : 'grey.300',
                  borderRadius: 2,
                  bgcolor: canAccessFeatures.premiumJobs ? 'success.50' : 'grey.50'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <WorkOutline fontSize="small" color={canAccessFeatures.premiumJobs ? 'success' : 'disabled'} />
                    <Typography variant="body2" fontWeight="bold">
                      Premium Jobs
                    </Typography>
                  </Box>
                  <Chip 
                    label={canAccessFeatures.premiumJobs ? 'Available' : 'Locked'} 
                    size="small"
                    color={canAccessFeatures.premiumJobs ? 'success' : 'default'}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ 
                  p: 2, 
                  border: 1, 
                  borderColor: canAccessFeatures.smartTests ? 'success.main' : 'grey.300',
                  borderRadius: 2,
                  bgcolor: canAccessFeatures.smartTests ? 'success.50' : 'grey.50'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <SmartToy fontSize="small" color={canAccessFeatures.smartTests ? 'success' : 'disabled'} />
                    <Typography variant="body2" fontWeight="bold">
                      Smart Tests
                    </Typography>
                  </Box>
                  <Chip 
                    label={canAccessFeatures.smartTests ? 'Available' : 'Locked'} 
                    size="small"
                    color={canAccessFeatures.smartTests ? 'success' : 'default'}
                  />
                </Box>
              </Grid>
            </Grid>
          </>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Recommendations
            </Typography>
            <List dense sx={{ mb: 2 }}>
              {recommendations.slice(0, 3).map((recommendation, index) => (
                <ListItem key={index} sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <Info fontSize="small" color="info" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={recommendation}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              ))}
            </List>
          </>
        )}

        {/* Next Steps */}
        {nextSteps.length > 0 && (
          <>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Next Steps
            </Typography>
            <List dense sx={{ mb: 2 }}>
              {nextSteps.slice(0, 4).map((step, index) => (
                <ListItem key={index} sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <ArrowForward fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={step}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              ))}
            </List>
          </>
        )}

        {/* Action Button */}
        {onEditProfile && (
          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<Edit />}
              onClick={onEditProfile}
              sx={{ 
                bgcolor: statusColor,
                '&:hover': {
                  bgcolor: statusColor,
                  opacity: 0.9
                }
              }}
            >
              {completionPercentage < 40 ? 'Complete Basic Profile' : 
               completionPercentage < 70 ? 'Improve Profile' : 
               completionPercentage < 80 ? 'Perfect Your Profile' : 
               'Update Profile'}
            </Button>
          </Box>
        )}

        {/* Warning for incomplete profiles */}
        {completionPercentage < 60 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              Complete your profile to access all features and improve your job matching opportunities.
            </Typography>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileCompletion;
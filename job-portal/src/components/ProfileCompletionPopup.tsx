import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Avatar,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  useTheme,
  useMediaQuery,
  alpha,
  Slide,
} from '@mui/material';
import {
  Close,
  Person,
  Work,
  School,
  LocationOn,
  Phone,
  Email,
  ArrowForward,
  CheckCircle,
  Warning,
  Info,
} from '@mui/icons-material';
import { User, ProfileCompletionStatus } from '../types/user';
import { checkProfileCompletion } from '../utils/profileCompletionUtils';

interface ProfileCompletionPopupProps {
  open: boolean;
  onClose: () => void;
  onCompleteProfile: () => void;
  user: User;
}

const ProfileCompletionPopup: React.FC<ProfileCompletionPopupProps> = ({
  open,
  onClose,
  onCompleteProfile,
  user,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const validationResult = checkProfileCompletion(user);
  const { completionPercentage, status, missingFields } = validationResult;
  
  // Generate simple recommendations based on missing fields
  const recommendations = missingFields.map(field => `Add your ${field.toLowerCase()}`);

  const getStatusColor = (status: ProfileCompletionStatus) => {
    switch (status) {
      case ProfileCompletionStatus.INCOMPLETE:
        return theme.palette.error.main;
      case ProfileCompletionStatus.BASIC:
        return theme.palette.warning.main;
      case ProfileCompletionStatus.INTERMEDIATE:
        return theme.palette.info.main;
      case ProfileCompletionStatus.COMPLETE:
        return theme.palette.success.main;
      default:
        return theme.palette.grey[500];
    }
  };

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
        return <CheckCircle color="info" />;
      case ProfileCompletionStatus.COMPLETE:
        return <CheckCircle color="success" />;
      default:
        return <Info />;
    }
  };

  const getFieldIcon = (field: string) => {
    switch (field.toLowerCase()) {
      case 'firstname':
      case 'lastname':
      case 'name':
        return <Person />;
      case 'jobtitle':
      case 'job':
        return <Work />;
      case 'education':
      case 'degree':
        return <School />;
      case 'location':
      case 'address':
        return <LocationOn />;
      case 'phone':
        return <Phone />;
      case 'email':
        return <Email />;
      default:
        return <Info />;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={isMobile ? 'sm' : 'md'}
      fullWidth
      fullScreen={isMobile}
      TransitionComponent={Slide}
      TransitionProps={{ direction: 'up' }}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3,
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%)'
            : 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(248,250,252,0.95) 50%, rgba(240,244,248,0.9) 100%)',
          backdropFilter: 'blur(20px)',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 20px 60px rgba(0,0,0,0.5)'
            : '0 20px 60px rgba(102, 126, 234, 0.2)',
          minHeight: isMobile ? '100vh' : 'auto',
          maxHeight: isMobile ? '100vh' : '90vh',
          overflow: 'hidden',
        }
      }}
    >
      <DialogTitle sx={{ 
        pb: isMobile ? 2 : 1,
        pt: isMobile ? 3 : 2,
        px: isMobile ? 2 : 3,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        position: 'relative',
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 2,
          background: 'linear-gradient(90deg, #4facfe 0%, #00d4ff 100%)',
        }
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 1.5 : 2, flex: 1 }}>
            <Avatar
              src={user?.profilePicture}
              sx={{
                width: isMobile ? 40 : 48,
                height: isMobile ? 40 : 48,
                border: '3px solid rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.2)',
              }}
            >
              {user?.firstName?.charAt(0)?.toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography 
                variant={isMobile ? 'h6' : 'h6'} 
                fontWeight="bold" 
                sx={{ 
                  color: 'white',
                  fontSize: isMobile ? '1.1rem' : '1.25rem',
                  lineHeight: 1.2,
                }}
              >
                Complete Your Profile
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: isMobile ? '0.8rem' : '0.875rem',
                  mt: 0.5,
                }}
              >
                Complete your profile to at least 80% to unlock all features
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={onClose}
            sx={{ 
              color: 'white',
              p: isMobile ? 1 : 1.5,
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.1)',
              }
            }}
          >
            <Close fontSize={isMobile ? 'medium' : 'large'} />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ 
        p: isMobile ? 2 : 3,
        overflow: 'auto',
        flex: 1,
      }}>
        {/* Profile Completion Status */}
        <Box sx={{ mb: isMobile ? 2 : 3 }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: isMobile ? 'flex-start' : 'center', 
            justifyContent: 'space-between', 
            mb: 2,
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 1 : 0,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 1.5 : 2, flex: 1 }}>
              {getStatusIcon(status)}
              <Box>
                <Typography 
                  variant={isMobile ? 'subtitle1' : 'h6'} 
                  fontWeight="bold"
                  sx={{ fontSize: isMobile ? '1rem' : '1.25rem' }}
                >
                  Profile Completion
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ fontSize: isMobile ? '0.8rem' : '0.875rem' }}
                >
                  {completionPercentage}% Complete
                </Typography>
              </Box>
            </Box>
            <Chip
              label={getStatusText(status)}
              sx={{
                backgroundColor: getStatusColor(status),
                color: 'white',
                fontWeight: 'bold',
                fontSize: isMobile ? '0.75rem' : '0.8rem',
                alignSelf: isMobile ? 'flex-start' : 'center',
              }}
            />
          </Box>

          <LinearProgress
            variant="determinate"
            value={completionPercentage}
            sx={{
              height: isMobile ? 8 : 12,
              borderRadius: isMobile ? 4 : 6,
              backgroundColor: alpha(getStatusColor(status), 0.2),
              '& .MuiLinearProgress-bar': {
                backgroundColor: getStatusColor(status),
                borderRadius: isMobile ? 4 : 6,
              }
            }}
          />

          <Typography 
            variant="caption" 
            color="text.secondary" 
            sx={{ 
              mt: 1, 
              display: 'block',
              fontSize: isMobile ? '0.75rem' : '0.8rem',
              lineHeight: 1.4,
            }}
          >
            {completionPercentage < 40 && 'Complete basic information to improve your profile visibility'}
            {completionPercentage >= 40 && completionPercentage < 80 && 'Good start! You need 80% completion to unlock all features'}
            {completionPercentage >= 80 && completionPercentage < 90 && 'Great! You\'ve reached the 80% minimum. A few more details will make it perfect'}
            {completionPercentage >= 90 && 'Excellent! Your profile is comprehensive and attractive to employers'}
          </Typography>
        </Box>

        {/* Missing Fields */}
        {missingFields.length > 0 && (
          <Box sx={{ mb: isMobile ? 2 : 3 }}>
            <Typography 
              variant={isMobile ? 'subtitle2' : 'subtitle1'} 
              fontWeight="bold" 
              gutterBottom
              sx={{ fontSize: isMobile ? '0.9rem' : '1rem' }}
            >
              Complete These Fields
            </Typography>
            <List dense sx={{ maxHeight: isMobile ? 200 : 'none', overflow: 'auto' }}>
              {missingFields.slice(0, isMobile ? 3 : 5).map((field, index) => (
                <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                  <ListItemIcon sx={{ minWidth: isMobile ? 32 : 36 }}>
                    {getFieldIcon(field)}
                  </ListItemIcon>
                  <ListItemText
                    primary={field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}
                    primaryTypographyProps={{ 
                      variant: 'body2',
                      sx: { fontSize: isMobile ? '0.8rem' : '0.875rem' }
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* Benefits */}
        <Box sx={{ 
          p: isMobile ? 1.5 : 2, 
          borderRadius: 2, 
          background: alpha(theme.palette.primary.main, 0.05),
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          mb: isMobile ? 2 : 3
        }}>
          <Typography 
            variant={isMobile ? 'subtitle2' : 'subtitle1'} 
            fontWeight="bold" 
            gutterBottom
            sx={{ fontSize: isMobile ? '0.9rem' : '1rem' }}
          >
            Why Complete Your Profile to 80%?
          </Typography>
          <List dense>
            <ListItem sx={{ py: 0.5, px: 0 }}>
              <ListItemIcon sx={{ minWidth: isMobile ? 32 : 36 }}>
                <CheckCircle color="success" fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Better job matching and recommendations"
                primaryTypographyProps={{ 
                  variant: 'body2',
                  sx: { fontSize: isMobile ? '0.8rem' : '0.875rem' }
                }}
              />
            </ListItem>
            <ListItem sx={{ py: 0.5, px: 0 }}>
              <ListItemIcon sx={{ minWidth: isMobile ? 32 : 36 }}>
                <CheckCircle color="success" fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Increased visibility to employers"
                primaryTypographyProps={{ 
                  variant: 'body2',
                  sx: { fontSize: isMobile ? '0.8rem' : '0.875rem' }
                }}
              />
            </ListItem>
            <ListItem sx={{ py: 0.5, px: 0 }}>
              <ListItemIcon sx={{ minWidth: isMobile ? 32 : 36 }}>
                <CheckCircle color="success" fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Unlock all platform features (requires 80% completion)"
                primaryTypographyProps={{ 
                  variant: 'body2',
                  sx: { fontSize: isMobile ? '0.8rem' : '0.875rem' }
                }}
              />
            </ListItem>
          </List>
        </Box>
      </DialogContent>

      <DialogActions sx={{ 
        p: isMobile ? 2 : 3, 
        pt: 0,
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 1 : 0,
      }}>
        <Button
          onClick={onClose}
          variant="outlined"
          fullWidth={isMobile}
          sx={{ 
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            py: isMobile ? 1.5 : 1,
            fontSize: isMobile ? '0.9rem' : '0.875rem',
          }}
        >
          Maybe Later
        </Button>
        <Button
          onClick={onCompleteProfile}
          variant="contained"
          size="large"
          fullWidth={isMobile}
          endIcon={<ArrowForward />}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 'bold',
            px: isMobile ? 2 : 4,
            py: isMobile ? 1.5 : 1.5,
            fontSize: isMobile ? '0.9rem' : '1rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
              transform: isMobile ? 'none' : 'translateY(-2px)',
              boxShadow: '0 6px 16px rgba(102, 126, 234, 0.4)',
            },
            transition: 'all 0.3s ease',
          }}
        >
          Complete Profile Now
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProfileCompletionPopup;

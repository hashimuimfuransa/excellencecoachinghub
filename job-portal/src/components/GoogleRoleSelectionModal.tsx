import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
  Box,
  Alert,
  Avatar,
  Stack,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  Work as WorkIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Close as CloseIcon,
  School as SchoolIcon
} from '@mui/icons-material';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';

interface GoogleRoleSelectionModalProps {
  open: boolean;
  userData: {
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  } | null;
  onRoleSelect: (role: string, userData: any) => Promise<void>;
  onClose: () => void;
  loading?: boolean;
}

const getRoleOptions = (isDark: boolean) => [
  {
    value: 'professional',
    label: 'Job Seeker',
    description: 'Looking for new opportunities',
    icon: PersonIcon,
    color: isDark ? '#66BB6A' : '#2563eb'
  },
  {
    value: 'employer',
    label: 'Employer',
    description: 'Hiring talented professionals',
    icon: BusinessIcon,
    color: isDark ? '#81C784' : '#059669'
  },
  {
    value: 'student',
    label: 'Student',
    description: 'Learning and seeking educational opportunities',
    icon: SchoolIcon,
    color: isDark ? '#4CAF50' : '#dc2626'
  }
];

const GoogleRoleSelectionModal: React.FC<GoogleRoleSelectionModalProps> = ({
  open,
  userData,
  onRoleSelect,
  onClose,
  loading = false
}) => {
  const [selectedRole, setSelectedRole] = useState<string>('professional');
  const [submitting, setSubmitting] = useState(false);
  const { mode } = useCustomTheme();
  const isDark = mode === 'dark';
  const roleOptions = getRoleOptions(isDark);

  const handleRoleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedRole(event.target.value);
  };

  const handleSubmit = async () => {
    if (!userData || !selectedRole) return;

    try {
      setSubmitting(true);
      await onRoleSelect(selectedRole, userData);
    } catch (error) {
      console.error('Error selecting role:', error);
      // Error handling is done in parent component
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return; // Prevent closing during submission
    onClose();
  };

  if (!userData) return null;

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={submitting}
      PaperProps={{
        sx: {
          background: isDark 
            ? 'linear-gradient(135deg, rgba(30, 30, 30, 0.95) 0%, rgba(45, 45, 45, 0.95) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
          backdropFilter: 'blur(20px)',
          border: isDark 
            ? '1px solid rgba(102, 187, 106, 0.2)' 
            : '1px solid rgba(102, 126, 234, 0.2)',
          borderRadius: 3,
          boxShadow: isDark
            ? '0 8px 32px rgba(0, 0, 0, 0.4)'
            : '0 8px 32px rgba(0, 0, 0, 0.1)',
        }
      }}
    >
      <DialogTitle sx={{ 
        pb: 1,
        background: isDark 
          ? 'linear-gradient(45deg, rgba(102, 187, 106, 0.1) 0%, rgba(129, 199, 132, 0.1) 100%)'
          : 'linear-gradient(45deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
        borderBottom: isDark 
          ? '1px solid rgba(102, 187, 106, 0.2)' 
          : '1px solid rgba(102, 126, 234, 0.2)',
      }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography 
            variant="h6" 
            component="div"
            sx={{
              color: isDark ? '#66BB6A' : '#667eea',
              fontWeight: 700,
            }}
          >
            Complete Your Profile
          </Typography>
          <Button
            onClick={handleClose}
            disabled={submitting}
            size="small"
            sx={{ 
              minWidth: 'auto', 
              p: 0.5,
              color: isDark ? '#66BB6A' : '#667eea',
              '&:hover': {
                backgroundColor: isDark 
                  ? 'rgba(102, 187, 106, 0.1)' 
                  : 'rgba(102, 126, 234, 0.1)',
              }
            }}
          >
            <CloseIcon />
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* User Info */}
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Avatar
            src={userData.avatar}
            sx={{ 
              width: 80, 
              height: 80, 
              mx: 'auto', 
              mb: 2,
              border: 2,
              borderColor: isDark ? '#66BB6A' : '#667eea',
              boxShadow: isDark
                ? '0 4px 20px rgba(102, 187, 106, 0.3)'
                : '0 4px 20px rgba(102, 126, 234, 0.3)',
            }}
          >
            {userData.firstName?.[0]}{userData.lastName?.[0]}
          </Avatar>
          <Typography 
            variant="h6" 
            gutterBottom
            sx={{
              color: isDark ? '#66BB6A' : '#667eea',
              fontWeight: 600,
            }}
          >
            Welcome, {userData.firstName}!
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {userData.email}
          </Typography>
          <Chip
            label="Google Account"
            size="small"
            variant="outlined"
            sx={{
              borderColor: isDark ? '#66BB6A' : '#667eea',
              color: isDark ? '#66BB6A' : '#667eea',
              backgroundColor: isDark 
                ? 'rgba(102, 187, 106, 0.1)' 
                : 'rgba(102, 126, 234, 0.1)',
            }}
          />
        </Box>

        <Alert 
          severity="info" 
          sx={{ 
            mb: 3,
            backgroundColor: isDark 
              ? 'rgba(102, 187, 106, 0.1)' 
              : 'rgba(102, 126, 234, 0.1)',
            borderColor: isDark ? '#66BB6A' : '#667eea',
            color: isDark ? '#66BB6A' : '#667eea',
            '& .MuiAlert-icon': {
              color: isDark ? '#66BB6A' : '#667eea',
            }
          }}
        >
          Please select your account type to complete your registration and access the platform.
        </Alert>

        {/* Role Selection */}
        <Typography 
          variant="subtitle1" 
          gutterBottom 
          sx={{ 
            fontWeight: 600,
            color: isDark ? '#66BB6A' : '#667eea',
          }}
        >
          I am a:
        </Typography>

        <RadioGroup
          value={selectedRole}
          onChange={handleRoleChange}
          sx={{ gap: 1 }}
        >
          {roleOptions.map((role) => {
            const IconComponent = role.icon;
            return (
              <FormControlLabel
                key={role.value}
                value={role.value}
                control={<Radio />}
                label={
                  <Stack direction="row" alignItems="center" spacing={2} sx={{ py: 1 }}>
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: 1,
                        backgroundColor: role.color + '15',
                        color: role.color
                      }}
                    >
                      <IconComponent fontSize="small" />
                    </Box>
                    <Box>
                      <Typography variant="body1" fontWeight="medium">
                        {role.label}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {role.description}
                      </Typography>
                    </Box>
                  </Stack>
                }
                sx={{
                  m: 0,
                  p: 1.5,
                  border: 1,
                  borderColor: selectedRole === role.value ? role.color : (isDark ? 'rgba(102, 187, 106, 0.3)' : 'rgba(102, 126, 234, 0.2)'),
                  borderRadius: 2,
                  backgroundColor: selectedRole === role.value 
                    ? (isDark ? 'rgba(102, 187, 106, 0.15)' : 'rgba(102, 126, 234, 0.08)')
                    : (isDark ? 'rgba(30, 30, 30, 0.5)' : 'rgba(255, 255, 255, 0.5)'),
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: isDark 
                      ? 'rgba(102, 187, 106, 0.1)' 
                      : 'rgba(102, 126, 234, 0.08)',
                    transform: 'translateY(-2px)',
                    boxShadow: isDark
                      ? '0 4px 20px rgba(102, 187, 106, 0.2)'
                      : '0 4px 20px rgba(102, 126, 234, 0.2)',
                  }
                }}
              />
            );
          })}
        </RadioGroup>
      </DialogContent>

      <DialogActions sx={{ 
        p: 3, 
        pt: 2,
        background: isDark 
          ? 'linear-gradient(45deg, rgba(102, 187, 106, 0.05) 0%, rgba(129, 199, 132, 0.05) 100%)'
          : 'linear-gradient(45deg, rgba(102, 126, 234, 0.03) 0%, rgba(118, 75, 162, 0.03) 100%)',
        borderTop: isDark 
          ? '1px solid rgba(102, 187, 106, 0.2)' 
          : '1px solid rgba(102, 126, 234, 0.2)',
      }}>
        <Button 
          onClick={handleClose}
          disabled={submitting}
          sx={{ 
            mr: 1,
            color: isDark ? '#66BB6A' : '#667eea',
            borderColor: isDark ? '#66BB6A' : '#667eea',
            '&:hover': {
              backgroundColor: isDark 
                ? 'rgba(102, 187, 106, 0.1)' 
                : 'rgba(102, 126, 234, 0.1)',
              borderColor: isDark ? '#4CAF50' : '#5a6fd8',
            }
          }}
          variant="outlined"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!selectedRole || submitting}
          startIcon={submitting ? <CircularProgress size={20} /> : null}
          sx={{
            background: isDark
              ? 'linear-gradient(45deg, #66BB6A 30%, #81C784 90%)'
              : 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
            boxShadow: isDark
              ? '0 4px 20px rgba(102, 187, 106, 0.4)'
              : '0 4px 20px rgba(102, 126, 234, 0.4)',
            color: isDark ? '#000000' : '#ffffff',
            fontWeight: 600,
            '&:hover': {
              background: isDark
                ? 'linear-gradient(45deg, #4CAF50 30%, #66BB6A 90%)'
                : 'linear-gradient(45deg, #5a6fd8 30%, #694a9e 90%)',
              transform: 'translateY(-2px)',
              boxShadow: isDark
                ? '0 6px 25px rgba(102, 187, 106, 0.5)'
                : '0 6px 25px rgba(102, 126, 234, 0.5)',
            },
            '&:disabled': {
              background: isDark
                ? 'linear-gradient(45deg, #555555 30%, #333333 90%)'
                : 'linear-gradient(45deg, #ccc 30%, #999 90%)',
              transform: 'none',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
            },
            transition: 'all 0.3s ease'
          }}
        >
          {submitting ? 'Creating Account...' : 'Continue'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GoogleRoleSelectionModal;
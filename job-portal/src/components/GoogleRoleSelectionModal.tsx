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

const roleOptions = [
  {
    value: 'professional',
    label: 'Job Seeker',
    description: 'Looking for new opportunities',
    icon: PersonIcon,
    color: '#2563eb'
  },
  {
    value: 'employer',
    label: 'Employer',
    description: 'Hiring talented professionals',
    icon: BusinessIcon,
    color: '#059669'
  },
  {
    value: 'student',
    label: 'Student',
    description: 'Learning and seeking educational opportunities',
    icon: SchoolIcon,
    color: '#dc2626'
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
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" component="div">
            Complete Your Profile
          </Typography>
          <Button
            onClick={handleClose}
            disabled={submitting}
            size="small"
            sx={{ minWidth: 'auto', p: 0.5 }}
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
              borderColor: 'primary.main'
            }}
          >
            {userData.firstName?.[0]}{userData.lastName?.[0]}
          </Avatar>
          <Typography variant="h6" gutterBottom>
            Welcome, {userData.firstName}!
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {userData.email}
          </Typography>
          <Chip
            label="Google Account"
            size="small"
            color="primary"
            variant="outlined"
          />
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          Please select your account type to complete your registration and access the platform.
        </Alert>

        {/* Role Selection */}
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
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
                  borderColor: selectedRole === role.value ? role.color : 'divider',
                  borderRadius: 1,
                  backgroundColor: selectedRole === role.value ? role.color + '08' : 'transparent',
                  '&:hover': {
                    backgroundColor: role.color + '08'
                  }
                }}
              />
            );
          })}
        </RadioGroup>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button 
          onClick={handleClose}
          disabled={submitting}
          sx={{ mr: 1 }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!selectedRole || submitting}
          startIcon={submitting ? <CircularProgress size={20} /> : null}
        >
          {submitting ? 'Creating Account...' : 'Continue'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GoogleRoleSelectionModal;
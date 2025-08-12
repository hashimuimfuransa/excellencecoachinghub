import React, { useState } from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  CircularProgress,
  Collapse,
  IconButton,
  Typography
} from '@mui/material';
import {
  Close as CloseIcon,
  Email as EmailIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { authService } from '../../services/authService';
import { toast } from 'react-toastify';

interface EmailVerificationBannerProps {
  user: {
    email: string;
    firstName: string;
    isEmailVerified: boolean;
  };
  onVerificationSent?: () => void;
}

const EmailVerificationBanner: React.FC<EmailVerificationBannerProps> = ({
  user,
  onVerificationSent
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Don't show banner if email is already verified
  if (user.isEmailVerified || !isOpen) {
    return null;
  }

  const handleResendVerification = async () => {
    setIsLoading(true);
    try {
      await authService.resendVerification();
      toast.success('Verification email sent! Please check your inbox.');
      onVerificationSent?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to send verification email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <Collapse in={isOpen}>
      <Alert
        severity="warning"
        sx={{
          mb: 2,
          '& .MuiAlert-message': {
            width: '100%'
          }
        }}
        action={
          <IconButton
            aria-label="close"
            color="inherit"
            size="small"
            onClick={handleClose}
          >
            <CloseIcon fontSize="inherit" />
          </IconButton>
        }
      >
        <AlertTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmailIcon fontSize="small" />
            Email Verification Required
          </Box>
        </AlertTitle>
        
        <Typography variant="body2" sx={{ mb: 2 }}>
          Hi {user.firstName}! Please verify your email address ({user.email}) to access all features.
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            size="small"
            startIcon={isLoading ? <CircularProgress size={16} /> : <RefreshIcon />}
            onClick={handleResendVerification}
            disabled={isLoading}
            sx={{
              backgroundColor: 'warning.main',
              color: 'warning.contrastText',
              '&:hover': {
                backgroundColor: 'warning.dark'
              }
            }}
          >
            {isLoading ? 'Sending...' : 'Resend Verification Email'}
          </Button>
        </Box>
      </Alert>
    </Collapse>
  );
};

export default EmailVerificationBanner;

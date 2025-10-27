import React, { useState } from 'react';
import { Button, CircularProgress } from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { googleAuthService } from '../../services/googleAuthService';

interface GoogleAuthButtonProps {
  onSuccess: (result: any) => void;
  onError: (error: string) => void;
  disabled?: boolean;
  variant?: 'login' | 'register';
}

const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  onSuccess,
  onError,
  disabled = false,
  variant = 'login'
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleAuth = async () => {
    if (disabled || isLoading) return;

    setIsLoading(true);
    try {
      const result = await googleAuthService.handleGoogleAuth();
      onSuccess(result);
    } catch (error: any) {
      const errorMessage = error.message || 'Google authentication failed';
      onError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      fullWidth
      variant="outlined"
      size="large"
      onClick={handleGoogleAuth}
      disabled={disabled || isLoading}
      startIcon={
        isLoading ? (
          <CircularProgress size={20} />
        ) : (
          <GoogleIcon />
        )
      }
      sx={{
        py: 1.5,
        borderColor: '#4285f4',
        color: '#4285f4',
        '&:hover': {
          borderColor: '#3367d6',
          backgroundColor: 'rgba(66, 133, 244, 0.04)',
        },
        '&:disabled': {
          borderColor: 'rgba(0, 0, 0, 0.12)',
          color: 'rgba(0, 0, 0, 0.26)',
        }
      }}
    >
      {isLoading 
        ? 'Connecting with Google...' 
        : `${variant === 'login' ? 'Sign in' : 'Sign up'} with Google`
      }
    </Button>
  );
};

export default GoogleAuthButton;
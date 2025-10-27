import React, { useEffect } from 'react';
import {
  Button
} from '@mui/material';
import {
  Google
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

interface MobileGoogleSignInProps {
  onSuccess?: (result: {requiresRoleSelection?: boolean; userData?: any}) => void;
  onError?: (error: string) => void;
  loading?: boolean;
  setLoading?: (loading: boolean) => void;
}

const MobileGoogleSignIn: React.FC<MobileGoogleSignInProps> = ({
  onSuccess,
  onError,
  loading = false,
  setLoading
}) => {
  const { 
    loginWithGoogle, 
    handleGoogleOAuthCallback
  } = useAuth();

  // Handle OAuth callback on component mount
  useEffect(() => {
    const handleCallback = async () => {
      try {
        const result = await handleGoogleOAuthCallback();
        if (result) {
          onSuccess?.(result);
        }
      } catch (error: any) {
        onError?.(error.message);
      }
    };

    // Check if this is an OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('code') && urlParams.has('state')) {
      handleCallback();
    }
  }, [handleGoogleOAuthCallback, onSuccess, onError]);

  const handleGoogleSignIn = async () => {
    try {
      setLoading?.(true);
      const result = await loginWithGoogle();
      onSuccess?.(result);
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      
      // Handle specific Google OAuth errors
      if (error.message?.includes('origin is not allowed') || error.message?.includes('redirect_uri_mismatch')) {
        onError?.('The given origin is not allowed for the given client ID. Please configure your Google OAuth settings.');
      } else {
        onError?.(error.message || 'Google sign-in failed');
      }
    } finally {
      setLoading?.(false);
    }
  };

  return (
    <Button
      fullWidth
      variant="outlined"
      size="large"
      startIcon={<Google />}
      onClick={handleGoogleSignIn}
      disabled={loading}
      sx={{
        py: 1.5,
        borderColor: '#4285f4',
        color: '#4285f4',
        textTransform: 'none',
        fontWeight: 500,
        '&:hover': {
          borderColor: '#3367d6',
          backgroundColor: '#f8f9ff'
        }
      }}
    >
      {loading ? 'Signing in...' : 'Continue with Google'}
    </Button>
  );
};

export default MobileGoogleSignIn;
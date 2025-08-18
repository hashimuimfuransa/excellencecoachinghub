import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Paper
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { authService } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';

const EmailVerificationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  const token = searchParams.get('token');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link. No token provided.');
        return;
      }

      try {
        // Check if this is a frontend verification code
        const pendingCode = localStorage.getItem('pendingVerificationCode');
        const pendingEmail = localStorage.getItem('pendingVerificationEmail');

        console.log('🔍 Verification Debug:');
        console.log('Token from URL:', token);
        console.log('Pending code in localStorage:', pendingCode);
        console.log('Pending email in localStorage:', pendingEmail);
        console.log('Codes match:', pendingCode === token);

        if (pendingCode === token && pendingEmail) {
          // Frontend verification
          setStatus('success');
          setMessage('Your email has been verified successfully!');

          // Clear pending verification
          localStorage.removeItem('pendingVerificationCode');
          localStorage.removeItem('pendingVerificationEmail');

          // Update user verification status
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          user.isEmailVerified = true;
          localStorage.setItem('user', JSON.stringify(user));

          // Refresh user data
          try {
            await refreshUser();
          } catch (error) {
            console.error('Failed to refresh user data:', error);
          }
        } else {
          console.log('❌ Frontend verification failed, trying backend verification');

          // Get current user email for backend verification
          const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
          const userEmail = currentUser.email;

          console.log('🔍 Using email for backend verification:', userEmail);

          // Try backend verification with email
          await authService.verifyEmail(token, userEmail);
          setStatus('success');
          setMessage('Your email has been verified successfully!');

          // Update local user data
          if (currentUser.email) {
            currentUser.isEmailVerified = true;
            localStorage.setItem('user', JSON.stringify(currentUser));
          }

          // Refresh user data to update verification status
          try {
            await refreshUser();
          } catch (error) {
            console.error('Failed to refresh user data:', error);
          }
        }
      } catch (error: any) {
        setStatus('error');
        setMessage(error.message || 'Email verification failed. The link may be expired or invalid.');
      }
    };

    verifyEmail();
  }, [token, refreshUser]);

  const handleContinue = () => {
    navigate('/dashboard');
  };

  const handleResendVerification = async () => {
    try {
      await authService.resendVerification();
      setMessage('A new verification email has been sent to your inbox.');
    } catch (error: any) {
      setMessage(error.message || 'Failed to resend verification email.');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minHeight: '60vh'
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            textAlign: 'center'
          }}
        >
          {status === 'loading' && (
            <>
              <CircularProgress size={60} sx={{ mb: 3 }} />
              <Typography variant="h5" component="h1" gutterBottom>
                Verifying Your Email
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Please wait while we verify your email address...
              </Typography>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircleIcon
                sx={{ fontSize: 60, color: 'success.main', mb: 3 }}
              />
              <Typography variant="h5" component="h1" gutterBottom color="success.main">
                Email Verified!
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {message}
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={handleContinue}
                sx={{ mt: 2 }}
              >
                Continue to Dashboard
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <ErrorIcon
                sx={{ fontSize: 60, color: 'error.main', mb: 3 }}
              />
              <Typography variant="h5" component="h1" gutterBottom color="error.main">
                Verification Failed
              </Typography>
              <Alert severity="error" sx={{ mb: 3, width: '100%' }}>
                {message}
              </Alert>
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Button
                  variant="outlined"
                  startIcon={<EmailIcon />}
                  onClick={handleResendVerification}
                >
                  Resend Verification Email
                </Button>
                <Button
                  variant="contained"
                  onClick={() => navigate('/dashboard')}
                >
                  Go to Dashboard
                </Button>
              </Box>
            </>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default EmailVerificationPage;

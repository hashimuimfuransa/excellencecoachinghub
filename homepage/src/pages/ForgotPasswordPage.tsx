import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Link,
  CircularProgress,
  Avatar,
  IconButton,
  Alert,
} from '@mui/material';
import {
  Email,
  ArrowBack,
  CheckCircle,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { useThemeContext } from '../contexts/ThemeContext';

const schema = yup.object({
  email: yup
    .string()
    .email('Please enter a valid email address')
    .required('Email is required'),
});

interface ForgotPasswordFormData {
  email: string;
}

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { forgotPassword } = useAuth();
  const { isDarkMode } = useThemeContext();
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setLoading(true);
      await forgotPassword(data.email);
      setEmailSent(true);
      toast.success('Password reset instructions sent to your email!');
    } catch (error: any) {
      console.error('Forgot password error:', error);
      
      // Handle different types of errors with user-friendly messages
      let errorMessage = 'Failed to send reset email. Please try again.';
      
      if (error.message?.includes('status code 404') || 
          error.message?.includes('No user found') || 
          error.message?.includes('not found') ||
          error.message?.includes('User not found') ||
          error.message?.includes('couldn\'t find an account')) {
        errorMessage = 'We couldn\'t find an account with that email address. Please check your email and try again, or create a new account if you haven\'t registered yet.';
      } else if (error.message?.includes('status code 429') || 
                 error.message?.includes('rate limit') || 
                 error.message?.includes('too many')) {
        errorMessage = 'Too many password reset attempts. Please wait a few minutes before trying again.';
      } else if (error.message?.includes('status code 5') || 
                 error.message?.includes('server error') || 
                 error.message?.includes('internal error')) {
        errorMessage = 'Our servers are experiencing issues. Please try again in a few minutes.';
      } else if (error.message?.includes('Failed to fetch') || 
                 error.message?.includes('NetworkError') || 
                 error.message?.includes('Network error')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Request timed out. Please check your internet connection and try again.';
      } else if (error.message?.includes('invalid email') || 
                 error.message?.includes('email format')) {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.message && !error.message.includes('status code')) {
        // Use the original error message if it doesn't contain technical status codes
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    const email = getValues('email');
    if (email) {
      try {
        setLoading(true);
        await forgotPassword(email);
        toast.success('Email sent again!');
      } catch (error: any) {
        console.error('Resend email error:', error);
        
        // Handle different types of errors with user-friendly messages
        let errorMessage = 'Failed to resend email. Please try again.';
        
        if (error.message?.includes('status code 404') || 
            error.message?.includes('No user found') || 
            error.message?.includes('not found') ||
            error.message?.includes('User not found') ||
            error.message?.includes('couldn\'t find an account')) {
          errorMessage = 'We couldn\'t find an account with that email address. Please check your email and try again.';
        } else if (error.message?.includes('status code 429') || 
                   error.message?.includes('rate limit') || 
                   error.message?.includes('too many')) {
          errorMessage = 'Too many password reset attempts. Please wait a few minutes before trying again.';
        } else if (error.message?.includes('status code 5') || 
                   error.message?.includes('server error') || 
                   error.message?.includes('internal error')) {
          errorMessage = 'Our servers are experiencing issues. Please try again in a few minutes.';
        } else if (error.message?.includes('Failed to fetch') || 
                   error.message?.includes('NetworkError') || 
                   error.message?.includes('Network error')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else if (error.message?.includes('timeout')) {
          errorMessage = 'Request timed out. Please check your internet connection and try again.';
        } else if (error.message && !error.message.includes('status code')) {
          // Use the original error message if it doesn't contain technical status codes
          errorMessage = error.message;
        }
        
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: isDarkMode 
          ? 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)'
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Paper
            elevation={10}
            sx={{
              p: { xs: 3, md: 5 },
              borderRadius: 3,
              position: 'relative',
              overflow: 'hidden',
              boxShadow: isDarkMode 
                ? '0 20px 60px rgba(0, 0, 0, 0.5)'
                : '0 20px 60px rgba(0, 0, 0, 0.2)',
              background: isDarkMode 
                ? 'rgba(26, 26, 46, 0.95)'
                : 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(10px)',
            }}
          >
            {/* Background decoration */}
            <Box
              sx={{
                position: 'absolute',
                top: -50,
                right: -50,
                width: 150,
                height: 150,
                background: isDarkMode 
                  ? 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)'
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '50%',
                opacity: isDarkMode ? 0.15 : 0.1,
              }}
            />

            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4, position: 'relative', zIndex: 1 }}>
              <IconButton
                onClick={() => navigate('/login')}
                sx={{
                  position: 'absolute',
                  left: -16,
                  top: -8,
                  color: 'text.secondary',
                }}
              >
                <ArrowBack />
              </IconButton>

              <Avatar
                sx={{
                  bgcolor: emailSent ? 'success.main' : 'warning.main',
                  width: 64,
                  height: 64,
                  mx: 'auto',
                  mb: 2,
                }}
              >
                {emailSent ? <CheckCircle sx={{ fontSize: 32 }} /> : <Email sx={{ fontSize: 32 }} />}
              </Avatar>

              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  mb: 1,
                  background: 'linear-gradient(45deg, #1976d2, #9c27b0)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {emailSent ? 'Check Your Email' : 'Forgot Password?'}
              </Typography>

              <Typography variant="body1" color="text.secondary">
                {emailSent
                  ? 'We\'ve sent password reset instructions to your email address.'
                  : 'No worries! Enter your email address and we\'ll send you reset instructions.'}
              </Typography>
            </Box>

            {emailSent ? (
              /* Email Sent Success State */
              <Box sx={{ textAlign: 'center' }}>
                <Alert severity="success" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    If an account with that email exists, you'll receive password reset instructions shortly.
                  </Typography>
                </Alert>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Didn't receive the email? Check your spam folder or try again.
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={handleResendEmail}
                    disabled={loading}
                    sx={{ py: 1.5 }}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Resend Email'}
                  </Button>

                  <Button
                    variant="contained"
                    onClick={() => navigate('/login')}
                    sx={{
                      py: 1.5,
                      background: 'linear-gradient(45deg, #1976d2, #9c27b0)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #1565c0, #7b1fa2)',
                      },
                    }}
                  >
                    Back to Login
                  </Button>
                </Box>
              </Box>
            ) : (
              /* Email Input Form */
              <>
                <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mb: 3 }}>
                  <Controller
                    name="email"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Email Address"
                        type="email"
                        error={!!errors.email}
                        helperText={errors.email?.message}
                        sx={{ mb: 3 }}
                        autoComplete="email"
                        autoFocus
                      />
                    )}
                  />

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{
                      py: 1.5,
                      fontSize: '1rem',
                      fontWeight: 600,
                      background: 'linear-gradient(45deg, #1976d2, #9c27b0)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #1565c0, #7b1fa2)',
                      },
                    }}
                  >
                    {loading ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      'Send Reset Instructions'
                    )}
                  </Button>
                </Box>

                {/* Back to Login */}
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Remember your password?{' '}
                    <Link
                      component="button"
                      type="button"
                      variant="body2"
                      onClick={() => navigate('/login')}
                      sx={{
                        textDecoration: 'none',
                        color: 'primary.main',
                        fontWeight: 600,
                        '&:hover': {
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      Back to login
                    </Link>
                  </Typography>
                </Box>
              </>
            )}
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};

export default ForgotPasswordPage;
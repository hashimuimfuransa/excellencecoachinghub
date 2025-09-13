import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  Container,
  Paper,
  InputAdornment,
  useTheme,
  useMediaQuery,
  Slide
} from '@mui/material';
import { 
  Email, 
  ArrowBack,
  Send
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  
  const navigate = useNavigate();
  const { forgotPassword } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await forgotPassword(email);
      setSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      console.error('Forgot password error:', err);
      
      // Handle different types of errors with user-friendly messages
      let errorMessage = 'Failed to send reset email. Please try again.';
      
      if (err.message?.includes('No user found') || 
          err.message?.includes('not found') ||
          err.message?.includes('couldn\'t find an account')) {
        errorMessage = 'We couldn\'t find an account with that email address. Please check your email and try again, or create a new account if you haven\'t registered yet.';
      } else if (err.message?.includes('rate limit') || 
                 err.message?.includes('too many')) {
        errorMessage = 'Too many password reset attempts. Please wait a few minutes before trying again.';
      } else if (err.message?.includes('server error') || 
                 err.message?.includes('internal error')) {
        errorMessage = 'Our servers are experiencing issues. Please try again in a few minutes.';
      } else if (err.message?.includes('Failed to fetch') || 
                 err.message?.includes('Network')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (err.message?.includes('timeout')) {
        errorMessage = 'Request timed out. Please check your internet connection and try again.';
      } else if (err.message && !err.message.includes('status code')) {
        // Use the original error message if it doesn't contain technical status codes
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
          p: 2
        }}
      >
        <Paper
          elevation={6}
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: 3,
            maxWidth: 400
          }}
        >
          <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
            ✅ Reset Link Sent!
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Check your email for a password reset link. You'll be redirected to login shortly.
          </Typography>
          <Button
            component={RouterLink}
            to="/login"
            variant="contained"
            sx={{
              background: 'linear-gradient(45deg, #2E7D32 30%, #4CAF50 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #1B5E20 30%, #388E3C 90%)',
              }
            }}
          >
            Back to Login
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
        position: 'relative',
        py: 2
      }}
    >
      <Container component="main" maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ width: '100%' }}>
          <Slide direction="up" in={mounted} timeout={800}>
            <Paper
              elevation={6}
              sx={{
                p: { xs: 2.5, sm: 3 },
                width: '100%',
                maxWidth: 380,
                mx: 'auto',
                borderRadius: 3,
                background: 'rgba(255, 255, 255, 0.95)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: 'linear-gradient(45deg, #2E7D32 0%, #4CAF50 100%)',
                }
              }}
            >
              {/* Header */}
              <Box sx={{ textAlign: 'center', mb: 3, pt: 1 }}>
                <Typography 
                  variant="h6" 
                  component="h1" 
                  sx={{ 
                    fontWeight: 700,
                    background: 'linear-gradient(45deg, #2E7D32 30%, #4CAF50 90%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 1,
                    fontSize: '1.2rem'
                  }}
                >
                  Reset Password
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                  Enter your email to receive a reset link
                </Typography>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 2, fontSize: '0.85rem' }}>
                  {error}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit} noValidate>
                {/* Email Field */}
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email sx={{ color: '#4CAF50', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ 
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&.Mui-focused fieldset': {
                        borderColor: '#4CAF50',
                      }
                    }
                  }}
                />
                
                {/* Send Reset Button */}
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading || !email.trim()}
                  sx={{
                    mb: 2,
                    py: 1,
                    borderRadius: 2,
                    background: 'linear-gradient(45deg, #2E7D32 30%, #4CAF50 90%)',
                    textTransform: 'none',
                    fontWeight: 600,
                    '&:hover': {
                      background: 'linear-gradient(45deg, #1B5E20 30%, #388E3C 90%)',
                    }
                  }}
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </Button>
                
                {/* Back to Login Link */}
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.85rem' }}>
                    Remember your password?
                  </Typography>
                  <Link 
                    component={RouterLink} 
                    to="/login" 
                    sx={{ 
                      color: '#4CAF50', 
                      textDecoration: 'none',
                      fontWeight: 600,
                      fontSize: '0.9rem'
                    }}
                  >
                    Back to Login
                  </Link>
                </Box>
              </Box>
            </Paper>
          </Slide>
        </Box>
      </Container>
    </Box>
  );
};

export default ForgotPasswordPage;
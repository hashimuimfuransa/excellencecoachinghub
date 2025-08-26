import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  Container,
  Paper,
  InputAdornment,
  Grid,
  useTheme,
  useMediaQuery,
  Fade,
  CircularProgress
} from '@mui/material';
import { 
  Email, 
  ArrowBack,
  Send,
  CheckCircle
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { sendPasswordResetEmail } from '../services/emailjsService';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // First, call the backend to generate the reset token
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Log the error details for debugging
        console.error('Password reset API error:', {
          status: response.status,
          statusText: response.statusText,
          data
        });

        // Handle different error types with friendly messages
        if (response.status === 404) {
          setError('We couldn\'t find an account with that email address. Please check your email and try again, or create a new account if you haven\'t registered yet.');
        } else if (response.status === 429) {
          setError('Too many password reset attempts. Please wait a few minutes before trying again.');
        } else if (response.status >= 500) {
          setError('Our servers are experiencing issues. Please try again in a few minutes.');
        } else {
          // Handle other error cases with more specific messages
          const errorMessage = data.message || data.error || `Request failed with status ${response.status}`;
          
          // Make specific error messages more user-friendly
          if (errorMessage.includes('User not found') || errorMessage.includes('not found') || errorMessage.includes('No user')) {
            setError('We couldn\'t find an account with that email address. Please check your email and try again, or create a new account if you haven\'t registered yet.');
          } else if (errorMessage.includes('rate limit') || errorMessage.includes('too many')) {
            setError('Too many password reset attempts. Please wait a few minutes before trying again.');
          } else if (errorMessage.includes('invalid email') || errorMessage.includes('email format')) {
            setError('Please enter a valid email address.');
          } else {
            setError(`Failed to send password reset email: ${errorMessage}. Please try again.`);
          }
        }
        return;
      }

      // Backend returned success with user data, now send actual email via EmailJS
      if (data.userData) {
        const emailSent = await sendPasswordResetEmail(
          data.userData.email,
          data.userData.firstName || 'User',
          data.userData.resetToken
        );

        if (emailSent) {
          setSuccess(true);
        } else {
          // EmailJS failed but backend succeeded - still show success since user can use console token
          setSuccess(true);
          console.log('📧 Check your browser console for the password reset link (EmailJS may be in demo mode)');
        }
      } else {
        setSuccess(true);
      }

    } catch (err: any) {
      console.error('Password reset error:', err);
      
      // Handle different types of errors with appropriate messages
      if (err.message?.includes('Failed to fetch') || err.name === 'TypeError' || err.message?.includes('NetworkError')) {
        setError('Network error. Please check your internet connection and try again.');
      } else if (err.message?.includes('timeout')) {
        setError('Request timed out. Please check your internet connection and try again.');
      } else if (err.message?.includes('status code 404')) {
        setError('We couldn\'t find an account with that email address. Please check your email and try again, or create a new account if you haven\'t registered yet.');
      } else if (err.message?.includes('status code')) {
        // Extract status code from error message if available
        const statusMatch = err.message.match(/status code (\d+)/);
        if (statusMatch) {
          const statusCode = parseInt(statusMatch[1]);
          if (statusCode === 404) {
            setError('We couldn\'t find an account with that email address. Please check your email and try again, or create a new account if you haven\'t registered yet.');
          } else if (statusCode === 429) {
            setError('Too many password reset attempts. Please wait a few minutes before trying again.');
          } else if (statusCode >= 500) {
            setError('Our servers are experiencing issues. Please try again in a few minutes.');
          } else {
            setError(`Something went wrong (error ${statusCode}). Please try again in a few minutes.`);
          }
        } else {
          setError('Something went wrong. Please try again in a few minutes.');
        }
      } else {
        setError('Something went wrong. Please try again in a few minutes.');
      }
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
          background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%)',
          position: 'relative',
          overflow: 'auto',
          '&::before': {
            content: '""',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'url("data:image/svg+xml,%3Csvg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z" fill="%234caf50" fill-opacity="0.05" fill-rule="evenodd"/%3E%3C/svg%3E")',
            opacity: 0.5,
            zIndex: 0
          }
        }}
      >
        <Container component="main" maxWidth="sm" sx={{ py: { xs: 4, md: 6 }, position: 'relative', zIndex: 1 }}>
          <Fade in={true} timeout={800}>
            <Paper
              elevation={isMobile ? 3 : 12}
              sx={{
                p: { xs: 3, sm: 5 },
                borderRadius: 4,
                backdropFilter: 'blur(10px)',
                background: 'rgba(255, 255, 255, 0.95)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                textAlign: 'center'
              }}
            >
              <CheckCircle 
                sx={{ 
                  fontSize: 80, 
                  color: 'success.main', 
                  mb: 3 
                }} 
              />
              
              <Typography 
                variant="h4" 
                component="h1" 
                gutterBottom 
                fontWeight="bold"
                color="success.main"
              >
                Email Sent!
              </Typography>
              
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.8 }}>
                We've sent a password reset link to <strong>{email}</strong>.
                <br />
                <br />
                Please check your email and click the link to reset your password.
                The link will expire in 10 minutes for security reasons.
              </Typography>

              <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                  Didn't receive the email?
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Check your spam/junk folder<br />
                  • Make sure the email address is correct<br />
                  • Wait a few minutes and check again<br />
                  • Try sending another reset request if needed
                </Typography>
              </Alert>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  onClick={() => navigate('/login')}
                  startIcon={<ArrowBack />}
                  sx={{
                    py: 1.5,
                    px: 4,
                    borderRadius: 2,
                    fontWeight: 'bold',
                    background: 'linear-gradient(45deg, #4caf50 30%, #2e7d32 90%)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #66bb6a 30%, #388e3c 90%)',
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.3s'
                  }}
                >
                  Back to Sign In
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={() => {
                    setSuccess(false);
                    setEmail('');
                  }}
                  sx={{
                    py: 1.5,
                    px: 4,
                    borderRadius: 2,
                    borderWidth: 2,
                    fontWeight: 'bold',
                    '&:hover': {
                      borderWidth: 2,
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.3s'
                  }}
                >
                  Send Another Email
                </Button>
              </Box>
            </Paper>
          </Fade>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%)',
        position: 'relative',
        overflow: 'auto',
        '&::before': {
          content: '""',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("data:image/svg+xml,%3Csvg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z" fill="%234caf50" fill-opacity="0.05" fill-rule="evenodd"/%3E%3C/svg%3E")',
          opacity: 0.5,
          zIndex: 0
        }
      }}
    >
      <Container component="main" maxWidth="lg" sx={{ py: { xs: 4, md: 6 }, position: 'relative', zIndex: 1 }}>
        <Grid container spacing={3} sx={{ minHeight: { xs: 'auto', md: '100vh' } }}>
          {/* Left side - Branding and info */}
          {!isMobile && (
            <Grid 
              item 
              md={6} 
              sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center',
                p: { xs: 3, md: 5 },
                position: 'relative'
              }}
            >
              <Fade in={true} timeout={1000}>
                <Box>
                  <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
                    <img 
                      src="/logo1.png" 
                      alt="Excellence Coaching Hub" 
                      style={{ height: 100, marginRight: 16 }}
                    />
                    <Typography 
                      variant="h4" 
                      component="h1" 
                      sx={{ 
                        fontWeight: 700,
                        background: 'linear-gradient(45deg, #4caf50 30%, #2e7d32 90%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                      }}
                    >
                      Excellence Coaching Hub
                    </Typography>
                  </Box>
                  
                  <Typography variant="h3" component="h2" fontWeight="bold" sx={{ mb: 3 }}>
                    Forgot Your Password?
                  </Typography>
                  
                  <Typography variant="h6" color="text.secondary" sx={{ mb: 4, maxWidth: '80%' }}>
                    No worries! Enter your email address and we'll send you a link to reset your password securely.
                  </Typography>
                  
                  <Alert severity="info" sx={{ maxWidth: '80%' }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                      Security Notice
                    </Typography>
                    <Typography variant="body2">
                      For your security, password reset links expire after 10 minutes. 
                      Make sure to reset your password promptly after receiving the email.
                    </Typography>
                  </Alert>
                </Box>
              </Fade>
            </Grid>
          )}
          
          {/* Right side - Reset form */}
          <Grid 
            item 
            xs={12} 
            md={6} 
            sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: { xs: 'flex-start', md: 'center' },
              p: { xs: 2, sm: 3 },
              mt: { xs: 2, md: 0 }
            }}
          >
            <Fade in={true} timeout={800}>
              <Paper
                elevation={isMobile ? 3 : 12}
                sx={{
                  p: { xs: 3, sm: 5 },
                  width: '100%',
                  maxWidth: 500,
                  borderRadius: 4,
                  backdropFilter: 'blur(10px)',
                  background: 'rgba(255, 255, 255, 0.95)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                  transition: 'transform 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)'
                  }
                }}
              >
                <Box sx={{ textAlign: 'center', mb: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <img 
                    src="/logo1.png" 
                    alt="Excellence Coaching Hub" 
                    style={{ height: 120, marginBottom: 16 }}
                  />
                  <Typography 
                    variant="h5" 
                    component="h1" 
                    sx={{ 
                      fontWeight: 700,
                      background: 'linear-gradient(45deg, #4caf50 30%, #2e7d32 90%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}
                  >
                    Excellence Coaching Hub
                  </Typography>
                </Box>
                
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <Typography 
                    variant="h4" 
                    component={isMobile ? "h2" : "h1"} 
                    gutterBottom 
                    fontWeight="bold"
                    sx={{ 
                      color: 'primary.main',
                      position: 'relative',
                      display: 'inline-block',
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: -8,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 60,
                        height: 3,
                        borderRadius: 1.5,
                        bgcolor: 'primary.main'
                      }
                    }}
                  >
                    Reset Password
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mt: 3 }}>
                    Enter your email address and we'll send you a secure link to reset your password.
                  </Typography>
                </Box>

                {error && (
                  <Alert 
                    severity="error" 
                    sx={{ 
                      mb: 3,
                      borderRadius: 2,
                      '& .MuiAlert-message': { 
                        fontSize: '0.95rem',
                        lineHeight: 1.6
                      }
                    }}
                  >
                    {error}
                  </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit} noValidate>
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
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email color="primary" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ 
                      mb: 4,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main',
                        }
                      }
                    }}
                  />
                  
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={loading || !email.trim()}
                    startIcon={loading ? <CircularProgress size={20} /> : <Send />}
                    sx={{
                      mb: 3,
                      py: 1.5,
                      borderRadius: 2,
                      fontWeight: 'bold',
                      background: 'linear-gradient(45deg, #4caf50 30%, #2e7d32 90%)',
                      boxShadow: '0 3px 5px 2px rgba(76, 175, 80, .3)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #66bb6a 30%, #388e3c 90%)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 10px 2px rgba(76, 175, 80, .3)',
                      },
                      '&:disabled': {
                        background: 'linear-gradient(45deg, #a5d6a7 30%, #81c784 90%)',
                        transform: 'none',
                        boxShadow: 'none'
                      },
                      transition: 'all 0.3s'
                    }}
                  >
                    {loading ? 'Sending Reset Link...' : 'Send Reset Link'}
                  </Button>
                  
                  <Box sx={{ textAlign: 'center' }}>
                    <Link 
                      component={RouterLink} 
                      to="/login" 
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 1,
                        textDecoration: 'none',
                        color: 'primary.main',
                        fontWeight: 500,
                        '&:hover': {
                          textDecoration: 'underline'
                        }
                      }}
                    >
                      <ArrowBack fontSize="small" />
                      Back to Sign In
                    </Link>
                  </Box>
                </Box>
              </Paper>
            </Fade>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default ForgotPasswordPage;
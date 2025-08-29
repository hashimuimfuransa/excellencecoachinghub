import React, { useState, useEffect } from 'react';
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
  Slide,
  Grow,
  CircularProgress,
  Chip,
  Stack
} from '@mui/material';
import { 
  Email, 
  ArrowBack,
  Send,
  CheckCircle,
  Security,
  Speed,
  Lock,
  Star
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
// EmailJS service is handled by authService now

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Use the updated authService method instead of direct fetch
      const { authService } = await import('../services/authService');
      await authService.forgotPassword(email);
      
      setSuccess(true);

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
          background: 'linear-gradient(135deg, #4ade80 0%, #16a34a 50%, #14532d 100%)',
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
        background: 'linear-gradient(135deg, #4ade80 0%, #16a34a 50%, #14532d 100%)',
        position: 'relative',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        overflow: 'auto',
        '&::before': {
          content: '""',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 20% 50%, rgba(120, 219, 198, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(76, 175, 80, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(46, 125, 50, 0.3) 0%, transparent 50%)
          `,
          zIndex: 0,
        },
        '&::after': {
          content: '""',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("/find job.jpg")',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.1,
          zIndex: 0,
        }
      }}
    >
      <Container component="main" maxWidth="lg" sx={{ py: { xs: 4, md: 6 }, position: 'relative', zIndex: 1 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, minHeight: { xs: 'auto', md: '100vh' }, gap: 3 }}>
          {/* Left side - Branding and info */}
          {!isMobile && (
            <Box 
              sx={{ 
                flex: 1,
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center',
                p: { xs: 3, md: 5 },
                position: 'relative'
              }}
            >
              <Fade in={mounted} timeout={1000}>
                <Box>
                  {/* Logo and Brand */}
                  <Slide direction="right" in={mounted} timeout={800}>
                    <Box sx={{ mb: 6, display: 'flex', alignItems: 'center' }}>
                      <Box
                        sx={{
                          background: 'rgba(255, 255, 255, 0.15)',
                          backdropFilter: 'blur(10px)',
                          borderRadius: 3,
                          p: 2,
                          mr: 3,
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                        }}
                      >
                        <img 
                          src="/exjobnetlogo.png" 
                          alt="ExJobNet" 
                          style={{ height: 80, width: 80, objectFit: 'contain' }}
                        />
                      </Box>
                      <Box>
                        <Typography 
                          variant="h3" 
                          component="h1" 
                          sx={{ 
                            fontWeight: 800,
                            background: 'linear-gradient(45deg, #fff 30%, #e8eaf6 90%)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          }}
                        >
                          ExJobNet
                        </Typography>
                        <Typography variant="subtitle1" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                          Africa's Premier Career Platform
                        </Typography>
                      </Box>
                    </Box>
                  </Slide>
                  
                  {/* Welcome Message */}
                  <Grow in={mounted} timeout={1200}>
                    <Box sx={{ mb: 6 }}>
                      <Typography 
                        variant="h4" 
                        component="h2" 
                        fontWeight="bold" 
                        sx={{ 
                          mb: 3, 
                          color: 'white',
                          textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                        }}
                      >
                        Secure Password Recovery
                      </Typography>
                      
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          mb: 4, 
                          maxWidth: '90%',
                          color: 'rgba(255, 255, 255, 0.9)',
                          lineHeight: 1.6
                        }}
                      >
                        Don't worry! Password recovery is quick and secure. Enter your email address 
                        and we'll send you a secure link to reset your password.
                      </Typography>
                      
                      {/* Security Features */}
                      <Stack direction="column" spacing={2} sx={{ mb: 4, maxWidth: '90%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Security sx={{ color: '#4caf50', fontSize: 24 }} />
                          <Typography variant="body1" color="rgba(255, 255, 255, 0.9)">
                            Enterprise-grade security encryption
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Speed sx={{ color: '#2196f3', fontSize: 24 }} />
                          <Typography variant="body1" color="rgba(255, 255, 255, 0.9)">
                            Quick 2-minute password reset process
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Lock sx={{ color: '#ff9800', fontSize: 24 }} />
                          <Typography variant="body1" color="rgba(255, 255, 255, 0.9)">
                            Secure links expire after 10 minutes
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                  </Grow>
                  
                  {/* Trust Indicators */}
                  <Fade in={mounted} timeout={2000}>
                    <Alert 
                      severity="info" 
                      sx={{ 
                        maxWidth: '90%',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        '& .MuiAlert-icon': {
                          color: '#2196f3'
                        }
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                        🔒 Your Security is Our Priority
                      </Typography>
                      <Typography variant="body2">
                        We use advanced encryption and security protocols to protect your account recovery process.
                      </Typography>
                    </Alert>
                  </Fade>
                </Box>
              </Fade>
            </Box>
          )}
          
          {/* Right side - Reset form */}
          <Box 
            sx={{ 
              flex: 1,
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: { xs: 'flex-start', md: 'center' },
              p: { xs: 2, sm: 3 },
              mt: { xs: 2, md: 0 }
            }}
          >
            <Slide direction="left" in={mounted} timeout={1000}>
              <Paper
                elevation={isMobile ? 8 : 24}
                sx={{
                  p: { xs: 4, sm: 6 },
                  width: '100%',
                  maxWidth: 520,
                  borderRadius: 6,
                  backdropFilter: 'blur(20px)',
                  background: 'rgba(255, 255, 255, 0.98)',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  transition: 'all 0.4s ease-in-out',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    background: 'linear-gradient(45deg, #4ade80 0%, #16a34a 100%)',
                  },
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 30px 80px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.3)',
                  }
                }}
              >
                {/* Back to Login Button */}
                <Box sx={{ position: 'absolute', top: 20, left: 20, zIndex: 10 }}>
                  <Button
                    component={RouterLink}
                    to="/login"
                    startIcon={<ArrowBack />}
                    variant="outlined"
                    size="small"
                    sx={{
                      borderRadius: 3,
                      textTransform: 'none',
                      fontWeight: 600,
                      border: '2px solid rgba(74, 222, 128, 0.2)',
                      color: '#16a34a',
                      backdropFilter: 'blur(10px)',
                      background: 'rgba(255, 255, 255, 0.8)',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 20px rgba(74, 222, 128, 0.3)',
                        border: '2px solid rgba(74, 222, 128, 0.4)',
                        background: 'rgba(255, 255, 255, 0.9)',
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Back to Login
                  </Button>
                </Box>

                {/* Header with Logo and Brand */}
                <Fade in={mounted} timeout={1200}>
                  <Box sx={{ textAlign: 'center', mb: 5, pt: 3 }}>
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 3,
                        p: 2,
                        borderRadius: 4,
                        background: 'linear-gradient(135deg, rgba(74, 222, 128, 0.1) 0%, rgba(22, 163, 74, 0.1) 100%)',
                        border: '1px solid rgba(74, 222, 128, 0.1)',
                      }}
                    >
                      <img 
                        src="/exjobnetlogo.png" 
                        alt="ExJobNet" 
                        style={{ height: 60, width: 60, objectFit: 'contain' }}
                      />
                    </Box>
                    
                    <Typography 
                      variant="h4" 
                      component="h1" 
                      sx={{ 
                        fontWeight: 800,
                        background: 'linear-gradient(45deg, #4ade80 30%, #16a34a 90%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        mb: 1
                      }}
                    >
                      ExJobNet
                    </Typography>
                    
                    <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
                      Africa's Premier Career Platform
                    </Typography>
                    
                    {/* Welcome Message */}
                    <Box sx={{ mb: 4 }}>
                      <Typography 
                        variant="h4" 
                        component="h2" 
                        fontWeight="bold"
                        sx={{ 
                          background: 'linear-gradient(45deg, #333 30%, #666 90%)',
                          backgroundClip: 'text',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          position: 'relative',
                          display: 'inline-block',
                          mb: 2,
                          '&::after': {
                            content: '""',
                            position: 'absolute',
                            bottom: -8,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 100,
                            height: 4,
                            borderRadius: 2,
                            background: 'linear-gradient(45deg, #4ade80 30%, #16a34a 90%)',
                          }
                        }}
                      >
                        Reset Password
                      </Typography>
                      
                      <Typography variant="body1" color="text.secondary" sx={{ mt: 3, maxWidth: 400, mx: 'auto' }}>
                        No worries! Enter your email address and we'll send you a secure link to reset your password.
                      </Typography>
                    </Box>
                    
                    {/* Security Badge */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
                      <Chip
                        icon={<Security sx={{ color: '#16a34a' }} />}
                        label="Bank-level security encryption"
                        variant="outlined"
                        sx={{
                          borderColor: 'rgba(74, 222, 128, 0.3)',
                          color: 'text.secondary',
                          '& .MuiChip-icon': { color: '#16a34a' }
                        }}
                      />
                    </Box>
                  </Box>
                </Fade>

                {error && (
                  <Alert 
                    severity="error" 
                    sx={{ 
                      mb: 3,
                      borderRadius: 3,
                      backgroundColor: 'rgba(244, 67, 54, 0.1)',
                      border: '1px solid rgba(244, 67, 54, 0.2)',
                      '& .MuiAlert-message': { 
                        fontSize: '0.95rem',
                        lineHeight: 1.6
                      }
                    }}
                  >
                    {error}
                  </Alert>
                )}

                <Grow in={mounted} timeout={1500}>
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
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Email sx={{ color: '#16a34a' }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{ 
                        mb: 4,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 3,
                          backgroundColor: 'rgba(74, 222, 128, 0.05)',
                          '& fieldset': {
                            borderColor: 'rgba(74, 222, 128, 0.2)',
                            borderWidth: 2,
                          },
                          '&:hover fieldset': {
                            borderColor: 'rgba(74, 222, 128, 0.4)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#16a34a',
                          },
                          transition: 'all 0.3s ease'
                        },
                        '& .MuiInputLabel-root': {
                          color: '#16a34a',
                          fontWeight: 600,
                          '&.Mui-focused': {
                            color: '#16a34a',
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
                      startIcon={loading ? null : <Send />}
                      sx={{
                        mb: 4,
                        py: 2,
                        borderRadius: 4,
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        background: 'linear-gradient(45deg, #4ade80 30%, #16a34a 90%)',
                        boxShadow: '0 8px 25px rgba(74, 222, 128, 0.4)',
                        textTransform: 'none',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #22c55e 30%, #15803d 90%)',
                          transform: 'translateY(-3px)',
                          boxShadow: '0 12px 35px rgba(74, 222, 128, 0.5)',
                        },
                        '&:disabled': {
                          background: 'linear-gradient(45deg, #ccc 30%, #999 90%)',
                          transform: 'none',
                          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {loading ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box
                            sx={{
                              width: 20,
                              height: 20,
                              border: '2px solid transparent',
                              borderTop: '2px solid #ffffff',
                              borderRadius: '50%',
                              animation: 'spin 1s linear infinite',
                              '@keyframes spin': {
                                '0%': { transform: 'rotate(0deg)' },
                                '100%': { transform: 'rotate(360deg)' },
                              }
                            }}
                          />
                          Sending Reset Link...
                        </Box>
                      ) : 'Send Reset Link'}
                    </Button>
                    
                    {/* Back to Login Link */}
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Remember your password?
                      </Typography>
                      <Button
                        component={RouterLink}
                        to="/login"
                        variant="outlined"
                        startIcon={<ArrowBack />}
                        sx={{
                          px: 4,
                          py: 1.5,
                          borderRadius: 3,
                          borderWidth: 2,
                          fontSize: '1rem',
                          fontWeight: 'bold',
                          textTransform: 'none',
                          borderColor: '#16a34a',
                          color: '#16a34a',
                          background: 'rgba(74, 222, 128, 0.05)',
                          '&:hover': {
                            borderWidth: 2,
                            borderColor: '#15803d',
                            color: '#15803d',
                            background: 'rgba(74, 222, 128, 0.1)',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 8px 25px rgba(74, 222, 128, 0.2)'
                          },
                          transition: 'all 0.3s ease'
                        }}
                      >
                        Back to Sign In
                      </Button>
                    </Box>
                  </Box>
                </Grow>
              </Paper>
            </Slide>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default ForgotPasswordPage;
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
  Divider,
  InputAdornment,
  IconButton,
  Grid,
  useTheme,
  useMediaQuery,
  Avatar,
  Fade
} from '@mui/material';
import { 
  Email, 
  Lock, 
  Visibility, 
  VisibilityOff, 
  Login as LoginIcon,
  PersonAdd
} from '@mui/icons-material';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      // Only navigate on successful login
      navigate(from, { replace: true });
    } catch (err: any) {
      // Extract detailed error message from backend
      const errorData = err.response?.data;
      
      if (errorData) {
        // Use the detailed message from the backend if available
        const errorMessage = errorData.message || errorData.error;
        const suggestion = errorData.details?.suggestion;
        
        if (errorMessage && suggestion) {
          setError(`${errorMessage}\n\n💡 ${suggestion}`);
        } else {
          setError(errorMessage || 'Login failed');
        }
      } else {
        setError(err.message || 'Login failed. Please check your connection and try again.');
      }
      
      // Scroll to error message for better visibility
      setTimeout(() => {
        const errorElement = document.querySelector('[role="alert"]');
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    } finally {
      setLoading(false);
    }
  };
  
  const handleTogglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

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
                    Welcome to Your Career Success Platform
                  </Typography>
                  
                  <Typography variant="h6" color="text.secondary" sx={{ mb: 4, maxWidth: '80%' }}>
                    Sign in to access personalized job recommendations, AI-powered interview coaching, and career development tools.
                  </Typography>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 2,
                    maxWidth: '80%'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'success.light' }}>1</Avatar>
                      <Typography>Access AI-powered job matching</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'success.light' }}>2</Avatar>
                      <Typography>Practice with interview simulations</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'success.light' }}>3</Avatar>
                      <Typography>Track your applications and progress</Typography>
                    </Box>
                  </Box>
                </Box>
              </Fade>
            </Grid>
          )}
          
          {/* Right side - Login form */}
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
                    Sign In
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mt: 3 }}>
                    Welcome back! Please sign in to your account.
                  </Typography>
                </Box>

                {error && (
                  <Alert 
                    severity="error" 
                    sx={{ 
                      mb: 3,
                      borderRadius: 2,
                      '& .MuiAlert-icon': { alignItems: 'flex-start', mt: 0.5 },
                      '& .MuiAlert-message': { 
                        whiteSpace: 'pre-line',
                        fontSize: '0.95rem',
                        lineHeight: 1.5
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
                      mb: 3,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main',
                        }
                      }
                    }}
                  />
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="password"
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock color="primary" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={handleTogglePasswordVisibility}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                    sx={{ 
                      mb: 2,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main',
                        }
                      }
                    }}
                  />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                    <Link component={RouterLink} to="/forgot-password" variant="body2" color="primary.main">
                      Forgot password?
                    </Link>
                  </Box>
                  
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={loading}
                    startIcon={<LoginIcon />}
                    sx={{
                      mt: 1,
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
                      transition: 'all 0.3s'
                    }}
                  >
                    {loading ? 'Signing In...' : 'Sign In'}
                  </Button>
                  
                  <Divider sx={{ my: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      OR
                    </Typography>
                  </Divider>
                  
                  <Button
                    fullWidth
                    variant="outlined"
                    color="primary"
                    component={RouterLink}
                    to="/register"
                    startIcon={<PersonAdd />}
                    sx={{
                      py: 1.5,
                      borderRadius: 2,
                      borderWidth: 2,
                      fontWeight: 'bold',
                      '&:hover': {
                        borderWidth: 2,
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                      },
                      transition: 'all 0.3s'
                    }}
                  >
                    Create New Account
                  </Button>
                </Box>
              </Paper>
            </Fade>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default LoginPage;
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
  IconButton,
  useTheme,
  useMediaQuery,
  Fade,
  Slide,
  Chip,
  Stack,
  Grid,
  Divider,
  CircularProgress
} from '@mui/material';
import { 
  Email, 
  Lock, 
  Visibility, 
  VisibilityOff, 
  Login as LoginIcon,
  Home as HomeIcon,
  Work,
  School,
  Psychology,
  TrendingUp,
  CheckCircle,
  Google
} from '@mui/icons-material';
import { useNavigate, useLocation, Link as RouterLink, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import FloatingContact from '../components/FloatingContact';
import MobileGoogleSignIn from '../components/MobileGoogleSignIn';

import AccountTypeModal from '../components/AccountTypeModal';
import GoogleRoleSelectionModal from '../components/GoogleRoleSelectionModal';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showAccountTypeModal, setShowAccountTypeModal] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showGoogleRoleModal, setShowGoogleRoleModal] = useState(false);
  const [googleUserData, setGoogleUserData] = useState(null);
  
  const { login, loginWithGoogle, registerWithGoogle, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { mode } = useCustomTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [searchParams] = useSearchParams();
  
  // Check for job redirect parameters
  const redirectType = searchParams.get('redirect');
  const jobId = searchParams.get('jobId');
  const from = location.state?.from?.pathname || '/app/network';
  
  // Determine redirect destination
  const getRedirectPath = () => {
    if (redirectType === 'job' && jobId) {
      return `/app/jobs/${jobId}`;
    }
    return from;
  };

  useEffect(() => {
    setMounted(true);
    
    // Check if user is already authenticated and redirect using context
    const checkAuthentication = () => {
      // Only redirect if we're authenticated and not currently loading
      if (!isLoading && isAuthenticated && location.pathname === '/login') {
        // Use setTimeout to prevent immediate navigation loops
        setTimeout(() => {
          navigate(getRedirectPath(), { replace: true });
        }, 100);
      }
    };
    
    // Only check auth once when component mounts and auth context is ready
    if (mounted && !isLoading) {
      checkAuthentication();
    }
  }, [mounted]); // Removed navigate dependency to prevent loops

  // Handle authentication state changes
  useEffect(() => {
    if (!isLoading && isAuthenticated && location.pathname === '/login') {
      navigate(getRedirectPath(), { replace: true });
    }
  }, [isAuthenticated, isLoading, location.pathname, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Prevent multiple submissions
    if (loading) return;
    
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      
      // Small delay to ensure auth state is updated
      setTimeout(() => {
        navigate(getRedirectPath(), { replace: true });
      }, 100);
      
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

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      setError('');

      const result = await loginWithGoogle();
      
      if (result.requiresRoleSelection && result.userData) {
        // Show role selection modal for new Google users
        setGoogleUserData(result.userData);
        setShowGoogleRoleModal(true);
      } else {
        // User already exists and is logged in
        navigate(getRedirectPath(), { replace: true });
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      
      // Provide more specific error messages based on the error
      if (error.message?.includes('cancelled') || error.message?.includes('not completed')) {
        setError('Google sign-in was not completed. Please try again or use a different browser if the issue persists.');
      } else if (error.message?.includes('not configured') || error.message?.includes('Client ID')) {
        setError('Google authentication is not properly configured. Please contact support.');
      } else if (error.message?.includes('origin is not allowed') || error.message?.includes('redirect_uri_mismatch')) {
        setError('The given origin is not allowed for the given client ID. Please configure your Google OAuth settings.');
      } else if (error.message?.includes('popup') || error.message?.includes('blocked') || error.message?.includes('not displayed')) {
        setError('Google sign-in popup was blocked. Please allow popups for this site and try again.');
      } else if (error.message?.includes('not available') || error.message?.includes('timeout')) {
        setError('Google services are temporarily unavailable. Please check your internet connection and try again.');
      } else if (error.message?.includes('FedCM') || error.message?.includes('NetworkError')) {
        setError('There was a network issue with Google sign-in. Please try refreshing the page and signing in again.');
      } else if (error.message?.includes('script') || error.message?.includes('load')) {
        setError('Failed to load Google sign-in. Please check your internet connection and try refreshing the page.');
      } else {
        setError('Unable to sign in with Google. Please try refreshing the page or use email/password instead.');
      }
      
      // Scroll to error message for better visibility
      setTimeout(() => {
        const errorElement = document.querySelector('[role="alert"]');
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleRoleSelection = async (role: string, userData: any) => {
    await registerWithGoogle(userData, role);
    setShowGoogleRoleModal(false);
    navigate(getRedirectPath(), { replace: true });
  };

  const handleCreateAccount = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowAccountTypeModal(true);
  };

  const handleCloseAccountTypeModal = () => {
    setShowAccountTypeModal(false);
  };

  const services = [
    {
      icon: <Work sx={{ fontSize: 20, color: '#ffffff' }} />,
      title: 'Premium Jobs',
      description: 'Access thousands of curated job opportunities from top employers across Africa and beyond.',
      gradient: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)'
    },
    {
      icon: <School sx={{ fontSize: 20, color: '#ffffff' }} />,
      title: 'E-Learning Platform',
      description: 'Enhance your skills with our comprehensive courses designed by industry experts.',
      gradient: 'linear-gradient(135deg, #388E3C 0%, #66BB6A 100%)'
    },
    {
      icon: <Psychology sx={{ fontSize: 20, color: '#ffffff' }} />,
      title: 'Career Coach',
      description: 'Get personalized career guidance and smart job recommendations powered by AI.',
      gradient: 'linear-gradient(135deg, #1B5E20 0%, #43A047 100%)'
    },
    {
      icon: <TrendingUp sx={{ fontSize: 20, color: '#ffffff' }} />,
      title: 'Career Analytics',
      description: 'Track your career progress with detailed insights and performance metrics.',
      gradient: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)'
    },
    {
      icon: <CheckCircle sx={{ fontSize: 20, color: '#ffffff' }} />,
      title: 'Professional Network',
      description: 'Connect with industry professionals and expand your career network.',
      gradient: 'linear-gradient(135deg, #388E3C 0%, #66BB6A 100%)'
    },
    {
      icon: <Work sx={{ fontSize: 20, color: '#ffffff' }} />,
      title: 'Skills Assessment',
      description: 'Evaluate and certify your skills with our comprehensive testing platform.',
      gradient: 'linear-gradient(135deg, #1B5E20 0%, #43A047 100%)'
    }
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: mode === 'dark' 
          ? 'linear-gradient(135deg, #1a3e1a 0%, #2c5f2d 100%)'
          : 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
        position: 'relative',
        py: 2
      }}
    >
      <Container component="main" maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: { xs: 4, md: 6 } }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' }, 
          alignItems: { xs: 'center', md: 'stretch' },
          gap: { xs: 4, md: 6 },
          minHeight: { xs: 'auto', md: '80vh' }
        }}>
          {/* Login form */}
          <Box sx={{ flex: { xs: 1, md: '0 0 45%' }, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Slide direction="left" in={mounted} timeout={1000}>
              <Paper
                elevation={6}
                sx={{
                  p: { xs: 2.5, sm: 3 },
                  width: '100%',
                  maxWidth: 380,
                  borderRadius: 3,
                  background: mode === 'dark' 
                    ? 'rgba(30, 30, 30, 0.95)' 
                    : 'rgba(255, 255, 255, 0.95)',
                  boxShadow: mode === 'dark' 
                    ? '0 4px 20px rgba(0, 0, 0, 0.4)' 
                    : '0 4px 20px rgba(0, 0, 0, 0.1)',
                  border: mode === 'dark' 
                    ? '1px solid rgba(255, 255, 255, 0.1)' 
                    : '1px solid rgba(255, 255, 255, 0.2)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: mode === 'dark'
                      ? 'linear-gradient(45deg, #4CAF50 0%, #66BB6A 100%)'
                      : 'linear-gradient(45deg, #2E7D32 0%, #4CAF50 100%)',
                  }
                }}
              >
                {/* Back to Home Button */}
                <Box sx={{ position: 'absolute', top: 10, right: 10, zIndex: 10 }}>
                  <Button
                    component={RouterLink}
                    to="/"
                    startIcon={<HomeIcon />}
                    variant="text"
                    size="small"
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 500,
                      color: mode === 'dark' ? '#66BB6A' : '#4CAF50',
                      fontSize: '0.7rem',
                      minWidth: 'auto',
                      p: 0.5
                    }}
                  >
                    Home
                  </Button>
                </Box>
                
                {/* Compact Header */}
                <Fade in={mounted} timeout={800}>
                  <Box sx={{ textAlign: 'center', mb: 2, pt: 1 }}>
                    <img 
                      src="/exjobnetlogo.png" 
                      alt="ExJobNet" 
                      style={{ height: 35, width: 35, objectFit: 'contain', marginBottom: 8 }}
                    />
                    <Typography 
                      variant="h6" 
                      component="h1" 
                      sx={{ 
                        fontWeight: 700,
                        background: mode === 'dark'
                          ? 'linear-gradient(45deg, #66BB6A 30%, #81C784 90%)'
                          : 'linear-gradient(45deg, #2E7D32 30%, #4CAF50 90%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        mb: 1,
                        fontSize: '1.2rem'
                      }}
                    >
                      Welcome to ExJobNet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                      Sign in to continue
                    </Typography>
                  </Box>
                </Fade>

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



                <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
                  {/* Email Field */}
                  <TextField
                    required
                    fullWidth
                    id="email"
                    label="Email"
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
                          <Email sx={{ color: mode === 'dark' ? '#66BB6A' : '#4CAF50', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ 
                      mb: 1.5,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&.Mui-focused fieldset': {
                          borderColor: mode === 'dark' ? '#66BB6A' : '#4CAF50',
                        }
                      }
                    }}
                  />
                  
                  {/* Password Field */}
                  <TextField
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
                    size="small"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock sx={{ color: mode === 'dark' ? '#66BB6A' : '#4CAF50', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={handleTogglePasswordVisibility}
                            edge="end"
                            size="small"
                            sx={{ color: mode === 'dark' ? '#66BB6A' : '#4CAF50' }}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                    sx={{ 
                      mb: 1.5,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&.Mui-focused fieldset': {
                          borderColor: mode === 'dark' ? '#66BB6A' : '#4CAF50',
                        }
                      }
                    }}
                    />
                    
                    {/* Forgot Password Link */}
                    <Box sx={{ textAlign: 'right', mb: 1.5 }}>
                      <Link 
                        component={RouterLink} 
                        to="/forgot-password" 
                        variant="body2" 
                        sx={{ color: mode === 'dark' ? '#66BB6A' : '#4CAF50', textDecoration: 'none', fontSize: '0.8rem' }}
                      >
                        Forgot password?
                      </Link>
                    </Box>
                    
                    {/* Sign In Button */}
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      disabled={loading || googleLoading}
                      sx={{
                        mb: 2,
                        py: 1,
                        borderRadius: 2,
                        background: mode === 'dark'
                          ? 'linear-gradient(45deg, #66BB6A 30%, #81C784 90%)'
                          : 'linear-gradient(45deg, #2E7D32 30%, #4CAF50 90%)',
                        textTransform: 'none',
                        fontWeight: 600,
                        color: mode === 'dark' ? '#000000' : '#ffffff',
                        '&:hover': {
                          background: mode === 'dark'
                            ? 'linear-gradient(45deg, #4CAF50 30%, #66BB6A 90%)'
                            : 'linear-gradient(45deg, #1B5E20 30%, #388E3C 90%)',
                        }
                      }}
                    >
                      {loading ? 'Signing In...' : 'Sign In'}
                    </Button>
                    
                    {/* Divider */}
                    <Divider sx={{ my: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                        OR
                      </Typography>
                    </Divider>
                    
                    {/* Mobile-Friendly Google Sign In */}
                    <MobileGoogleSignIn
                      onSuccess={(result) => {
                        if (result.requiresRoleSelection && result.userData) {
                          setGoogleUserData(result.userData);
                          setShowGoogleRoleModal(true);
                        } else {
                          navigate(getRedirectPath(), { replace: true });
                        }
                      }}
                      onError={(error) => {
                        setError(error);
                        // Scroll to error message for better visibility
                        setTimeout(() => {
                          const errorElement = document.querySelector('[role="alert"]');
                          if (errorElement) {
                            errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }
                        }, 100);
                      }}
                      loading={googleLoading}
                      setLoading={setGoogleLoading}
                    />
                    
                    {/* Register Link */}
                    <Box sx={{ textAlign: 'center' }}>
                      <Alert 
                        severity="info" 
                        sx={{ 
                          mb: 2, 
                          bgcolor: mode === 'dark' ? 'rgba(33, 150, 243, 0.1)' : '#f3f8ff', 
                          border: mode === 'dark' ? '1px solid rgba(33, 150, 243, 0.3)' : '1px solid #e3f2fd',
                          '& .MuiAlert-icon': {
                            color: mode === 'dark' ? '#66BB6A' : '#2196f3'
                          }
                        }}
                      >
                        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                          <strong>New to ExJobNet?</strong> You'll need to create an account first to access jobs, courses, and career tools.
                        </Typography>
                      </Alert>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.85rem' }}>
                        Don't have an account?
                      </Typography>
                      <Link 
                        href="#"
                        onClick={handleCreateAccount}
                        sx={{ 
                          color: mode === 'dark' ? '#66BB6A' : '#4CAF50', 
                          textDecoration: 'none',
                          fontWeight: 600,
                          fontSize: '0.9rem',
                          cursor: 'pointer',
                          '&:hover': {
                            textDecoration: 'underline'
                          }
                        }}
                      >
                        Create Your Free Account
                      </Link>
                    </Box>
                  </Box>
              </Paper>
            </Slide>
          </Box>

          {/* Services Section - Only show on desktop */}
          {!isMobile && (
            <Slide direction="right" in={mounted} timeout={1200}>
              <Box sx={{ 
                flex: { xs: 1, md: '0 0 55%' }, 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center',
                p: { xs: 2, md: 4 }
              }}>
                <Box sx={{
                  background: mode === 'dark' 
                    ? 'rgba(30, 30, 30, 0.8)' 
                    : 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 3,
                  p: 4,
                  border: mode === 'dark' 
                    ? '1px solid rgba(255, 255, 255, 0.1)' 
                    : '1px solid rgba(255, 255, 255, 0.2)',
                  height: 'fit-content',
                  maxHeight: '600px',
                  overflow: 'auto'
                }}>
                  {/* Header */}
                  <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Typography 
                      variant="h4" 
                      component="h2" 
                      sx={{ 
                        fontWeight: 700,
                        background: mode === 'dark'
                          ? 'linear-gradient(45deg, #66BB6A 30%, #81C784 90%)'
                          : 'linear-gradient(45deg, #ffffff 30%, #e8f5e8 90%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        mb: 1
                      }}
                    >
                      🚀 ExJobNet Services
                    </Typography>
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        color: mode === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                        fontWeight: 500
                      }}
                    >
                      Your Complete Career Platform
                    </Typography>
                  </Box>

                  {/* Services Grid */}
                  <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, 
                    gap: 2,
                    mb: 3
                  }}>
                    {services.map((service, index) => (
                      <Box
                        key={service.title}
                        sx={{
                          background: mode === 'dark' 
                            ? 'rgba(255, 255, 255, 0.05)' 
                            : 'rgba(255, 255, 255, 0.15)',
                          backdropFilter: 'blur(5px)',
                          borderRadius: 2,
                          p: 2.5,
                          border: mode === 'dark' 
                            ? '1px solid rgba(255, 255, 255, 0.1)' 
                            : '1px solid rgba(255, 255, 255, 0.2)',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-5px)',
                            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
                            background: mode === 'dark' 
                              ? 'rgba(255, 255, 255, 0.1)' 
                              : 'rgba(255, 255, 255, 0.2)',
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                          <Box sx={{ 
                            background: service.gradient,
                            borderRadius: '50%',
                            p: 1,
                            mr: 1.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {service.icon}
                          </Box>
                          <Typography 
                            variant="h6" 
                            sx={{ 
                              fontWeight: 600, 
                              color: mode === 'dark' ? '#ffffff' : 'white',
                              fontSize: '1rem'
                            }}
                          >
                            {service.title}
                          </Typography>
                        </Box>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.8)',
                            lineHeight: 1.4,
                            fontSize: '0.85rem'
                          }}
                        >
                          {service.description}
                        </Typography>
                      </Box>
                    ))}
                  </Box>

                  {/* Call to Action */}
                  <Box sx={{ textAlign: 'center', mt: 3 }}>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        color: mode === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                        fontWeight: 500,
                        mb: 2
                      }}
                    >
                      ✨ Join thousands of professionals who trust ExJobNet
                    </Typography>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      flexWrap: 'wrap',
                      gap: 1
                    }}>
                      <Chip
                        label="10k+ Jobs"
                        size="small"
                        sx={{
                          background: mode === 'dark' 
                            ? 'rgba(76, 175, 80, 0.3)' 
                            : 'rgba(76, 175, 80, 0.2)',
                          color: 'white',
                          fontWeight: 600,
                          border: mode === 'dark' 
                            ? '1px solid rgba(76, 175, 80, 0.5)' 
                            : '1px solid rgba(76, 175, 80, 0.3)'
                        }}
                      />
                      <Chip
                        label="5k+ Companies"
                        size="small"
                        sx={{
                          background: mode === 'dark' 
                            ? 'rgba(33, 150, 243, 0.3)' 
                            : 'rgba(33, 150, 243, 0.2)',
                          color: 'white',
                          fontWeight: 600,
                          border: mode === 'dark' 
                            ? '1px solid rgba(33, 150, 243, 0.5)' 
                            : '1px solid rgba(33, 150, 243, 0.3)'
                        }}
                      />
                      <Chip
                        label="100+ Courses"
                        size="small"
                        sx={{
                          background: mode === 'dark' 
                            ? 'rgba(255, 152, 0, 0.3)' 
                            : 'rgba(255, 152, 0, 0.2)',
                          color: 'white',
                          fontWeight: 600,
                          border: mode === 'dark' 
                            ? '1px solid rgba(255, 152, 0, 0.5)' 
                            : '1px solid rgba(255, 152, 0, 0.3)'
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Slide>
          )}
        </Box>
      </Container>
      
      {/* Floating Contact Button */}
      <FloatingContact />
      
      {/* Account Type Selection Modal */}
      <AccountTypeModal
        open={showAccountTypeModal}
        onClose={handleCloseAccountTypeModal}
        redirectType={redirectType}
        jobId={jobId}
      />
      
      {/* Google Role Selection Modal */}
      <GoogleRoleSelectionModal
        open={showGoogleRoleModal}
        onClose={() => setShowGoogleRoleModal(false)}
        userData={googleUserData}
        onRoleSelect={handleGoogleRoleSelection}
        loading={googleLoading}
      />
    </Box>
  );
};

export default LoginPage;
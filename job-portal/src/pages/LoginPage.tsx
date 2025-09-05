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
  Grid
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
  CheckCircle
} from '@mui/icons-material';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import FloatingContact from '../components/FloatingContact';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const from = location.state?.from?.pathname || '/app/network';

  useEffect(() => {
    setMounted(true);
    
    // Check if user is already authenticated and redirect using context
    const checkAuthentication = () => {
      // Only redirect if we're authenticated and not currently loading
      if (!isLoading && isAuthenticated && location.pathname === '/login') {
        // Use setTimeout to prevent immediate navigation loops
        setTimeout(() => {
          navigate('/app/network', { replace: true });
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
      navigate('/app/network', { replace: true });
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
        navigate(from, { replace: true });
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
        background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
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
                      color: '#4CAF50',
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
                        background: 'linear-gradient(45deg, #2E7D32 30%, #4CAF50 90%)',
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
                          <Email sx={{ color: '#4CAF50', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ 
                      mb: 1.5,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&.Mui-focused fieldset': {
                          borderColor: '#4CAF50',
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
                          <Lock sx={{ color: '#4CAF50', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={handleTogglePasswordVisibility}
                            edge="end"
                            size="small"
                            sx={{ color: '#4CAF50' }}
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
                          borderColor: '#4CAF50',
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
                        sx={{ color: '#4CAF50', textDecoration: 'none', fontSize: '0.8rem' }}
                      >
                        Forgot password?
                      </Link>
                    </Box>
                    
                    {/* Sign In Button */}
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      disabled={loading}
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
                      {loading ? 'Signing In...' : 'Sign In'}
                    </Button>
                    
                    {/* Register Link */}
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.85rem' }}>
                        Don't have an account?
                      </Typography>
                      <Link 
                        component={RouterLink} 
                        to="/register" 
                        sx={{ 
                          color: '#4CAF50', 
                          textDecoration: 'none',
                          fontWeight: 600,
                          fontSize: '0.9rem'
                        }}
                      >
                        Create Account
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
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 3,
                  p: 4,
                  border: '1px solid rgba(255, 255, 255, 0.2)',
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
                        background: 'linear-gradient(45deg, #ffffff 30%, #e8f5e8 90%)',
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
                        color: 'rgba(255, 255, 255, 0.9)',
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
                          background: 'rgba(255, 255, 255, 0.15)',
                          backdropFilter: 'blur(5px)',
                          borderRadius: 2,
                          p: 2.5,
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-5px)',
                            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
                            background: 'rgba(255, 255, 255, 0.2)',
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
                              color: 'white',
                              fontSize: '1rem'
                            }}
                          >
                            {service.title}
                          </Typography>
                        </Box>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: 'rgba(255, 255, 255, 0.8)',
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
                        color: 'rgba(255, 255, 255, 0.9)',
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
                          background: 'rgba(76, 175, 80, 0.2)',
                          color: 'white',
                          fontWeight: 600,
                          border: '1px solid rgba(76, 175, 80, 0.3)'
                        }}
                      />
                      <Chip
                        label="5k+ Companies"
                        size="small"
                        sx={{
                          background: 'rgba(33, 150, 243, 0.2)',
                          color: 'white',
                          fontWeight: 600,
                          border: '1px solid rgba(33, 150, 243, 0.3)'
                        }}
                      />
                      <Chip
                        label="100+ Courses"
                        size="small"
                        sx={{
                          background: 'rgba(255, 152, 0, 0.2)',
                          color: 'white',
                          fontWeight: 600,
                          border: '1px solid rgba(255, 152, 0, 0.3)'
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
    </Box>
  );
};

export default LoginPage;
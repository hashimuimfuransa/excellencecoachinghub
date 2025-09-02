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
  Divider,
  InputAdornment,
  IconButton,
  useTheme,
  useMediaQuery,
  Avatar,
  Fade,
  Slide,
  Grow,
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
  PersonAdd,
  Home as HomeIcon,
  WorkOutline,
  TrendingUp,
  Security,
  Speed,
  Star,
  CheckCircle,
  Assessment,
  Psychology,
  School,
  Business,
  Home
} from '@mui/icons-material';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const from = location.state?.from?.pathname || '/app/network';

  useEffect(() => {
    setMounted(true);
    
    // Check if user is already authenticated and redirect
    const checkAuthentication = async () => {
      try {
        const { default: authService } = await import('../services/authService');
        if (authService.isAuthenticated()) {
          navigate('/app/network', { replace: true });
        }
      } catch (error) {
        // Ignore errors during auth check on login page
        console.log('Auth check skipped on login page');
      }
    };
    
    checkAuthentication();
  }, [navigate]);

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
      icon: <WorkOutline sx={{ fontSize: 24, color: '#4caf50' }} />,
      title: 'Job Portal',
      description: 'Access thousands of job opportunities across Africa',
      category: 'Jobs & Applications'
    },
    {
      icon: <Assessment sx={{ fontSize: 24, color: '#2196f3' }} />,
      title: 'Psychometric Tests',
      description: 'Advanced personality and skills assessments',
      category: 'Testing & Assessment'
    },
       {
      icon: <Assessment sx={{ fontSize: 24, color: '#2196f3' }} />,
      title: 'Smart Exams',
      description: 'Advanced job specific exams',
      category: 'Testing & Assessment'
    },
    {
      icon: <Psychology sx={{ fontSize: 24, color: '#9c27b0' }} />,
      title: 'Interviews',
      description: 'Practice with intelligent interview simulations',
      category: 'Testing & Assessment'
    },
     {
      icon: <PersonAdd sx={{ fontSize: 24, color: '#00bcd4' }} />,
      title: 'CV Builder',
      description: 'Professional resume builder with AI optimization',
      category: 'Career Tools'
    },

   {
      icon: <Security sx={{ fontSize: 24, color: '#607d8b' }} />,
      title: 'Social Network',
      description: 'Professional networking and connections',
      category: 'Professional Network'
    },
    {
      icon: <TrendingUp sx={{ fontSize: 24, color: '#ff9800' }} />,
      title: 'Career Guidance',
      description: 'Personalized career development and insights',
      category: 'Career Development'
    },
    {
      icon: <School sx={{ fontSize: 24, color: '#673ab7' }} />,
      title: 'E-Learning Courses',
      description: 'Professional development courses and certifications',
      category: 'Learning & Growth'
    },
 
    {
      icon: <Business sx={{ fontSize: 24, color: '#795548' }} />,
      title: 'Company Profiles',
      description: 'Discover top companies and their culture',
      category: 'Company Discovery'
    },
  
    {
      icon: <Speed sx={{ fontSize: 24, color: '#ff5722' }} />,
      title: 'Smart Matching',
      description: 'AI-powered job and candidate matching',
      category: 'AI Technology'
    },
    {
      icon: <CheckCircle sx={{ fontSize: 24, color: '#4caf50' }} />,
      title: 'Certificates',
      description: 'Professional certifications and achievements',
      category: 'Credentials'
    },
    {
      icon: <Star sx={{ fontSize: 24, color: '#ffc107' }} />,
      title: 'Career Events',
      description: 'Job fairs, webinars, and networking events',
      category: 'Events & Networking'
    },
    {
      icon: <Home sx={{ fontSize: 24, color: '#3f51b5' }} />,
      title: 'Employer Dashboard',
      description: 'Complete hiring and talent management solution',
      category: 'For Employers'
    }
  ];

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
            radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(120, 219, 226, 0.3) 0%, transparent 50%)
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
                        Transform Your Career Journey
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
                        Join thousands of professionals who trust ExJobNet for personalized career growth, 
                        interactive learning, and meaningful connections.
                      </Typography>
                    </Box>
                  </Grow>
                  
                  {/* Our Complete Services */}
                  <Box sx={{ maxWidth: '100%' }}>
                    <Typography 
                      variant="h5" 
                      fontWeight="bold" 
                      color="white" 
                      sx={{ mb: 3, textAlign: 'center' }}
                    >
                      🌟 Our Complete Services
                    </Typography>
                    
                    {/* Services Grid - Show first 6 most important services */}
                    <Grid container spacing={2} sx={{ mb: 4 }}>
                      {services.slice(0, 6).map((service, index) => (
                        <Grid item xs={12} sm={6} key={service.title}>
                          <Slide 
                            direction="right" 
                            in={mounted} 
                            timeout={1000 + index * 100}
                          >
                            <Box 
                              sx={{ 
                                p: 2,
                                borderRadius: 2,
                                background: 'rgba(255, 255, 255, 0.08)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                transition: 'all 0.3s ease',
                                height: '100%',
                                '&:hover': {
                                  transform: 'translateY(-4px)',
                                  background: 'rgba(255, 255, 255, 0.12)',
                                  boxShadow: '0 8px 32px rgba(255, 255, 255, 0.1)',
                                }
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <Box
                                  sx={{
                                    background: 'rgba(255, 255, 255, 0.15)',
                                    borderRadius: 1.5,
                                    p: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mr: 1.5,
                                    minWidth: 36,
                                    height: 36
                                  }}
                                >
                                  {service.icon}
                                </Box>
                                <Box>
                                  <Typography variant="body1" fontWeight="600" color="white" sx={{ fontSize: '0.95rem' }}>
                                    {service.title}
                                  </Typography>
                                  <Chip 
                                    label={service.category} 
                                    size="small" 
                                    sx={{ 
                                      fontSize: '0.7rem', 
                                      height: 16,
                                      color: 'rgba(255, 255, 255, 0.8)',
                                      background: 'rgba(255, 255, 255, 0.1)',
                                      border: '1px solid rgba(255, 255, 255, 0.15)',
                                      '& .MuiChip-label': { px: 1 }
                                    }} 
                                  />
                                </Box>
                              </Box>
                              <Typography variant="body2" color="rgba(255, 255, 255, 0.75)" sx={{ fontSize: '0.85rem', lineHeight: 1.4 }}>
                                {service.description}
                              </Typography>
                            </Box>
                          </Slide>
                        </Grid>
                      ))}
                    </Grid>

                    {/* Additional Services Summary */}
                    <Fade in={mounted} timeout={2000}>
                      <Box 
                        sx={{ 
                          textAlign: 'center',
                          p: 2.5,
                          borderRadius: 3,
                          background: 'rgba(255, 255, 255, 0.08)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                        }}
                      >
                        <Typography variant="body1" fontWeight="600" color="white" sx={{ mb: 1 }}>
                          And Much More...
                        </Typography>
                        <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" sx={{ gap: 1 }}>
                          {services.slice(6).map((service) => (
                            <Chip 
                              key={service.title}
                              label={service.title} 
                              size="small" 
                              sx={{ 
                                color: 'rgba(255, 255, 255, 0.9)',
                                background: 'rgba(255, 255, 255, 0.12)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                '&:hover': {
                                  background: 'rgba(255, 255, 255, 0.18)',
                                }
                              }} 
                            />
                          ))}
                        </Stack>
                        <Typography variant="body2" color="rgba(255, 255, 255, 0.7)" sx={{ mt: 2 }}>
                          Access all premium features after login
                        </Typography>
                      </Box>
                    </Fade>
                  </Box>
                  
                  {/* Trust Indicators */}
                  <Fade in={mounted} timeout={2000}>
                    <Box sx={{ mt: 4 }}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <CheckCircle sx={{ color: '#4caf50' }} />
                        <Typography variant="body2" color="rgba(255, 255, 255, 0.8)">
                          Trusted by leading companies across Africa
                        </Typography>
                      </Stack>
                    </Box>
                  </Fade>
                </Box>
              </Fade>
            </Box>
          )}
          
          {/* Right side - Login form */}
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
                    background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
                  },
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 30px 80px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.3)',
                  }
                }}
              >
                {/* Back to Home Button */}
                <Box sx={{ position: 'absolute', top: 20, left: 20, zIndex: 10 }}>
                  <Button
                    component={RouterLink}
                    to="/"
                    startIcon={<HomeIcon />}
                    variant="outlined"
                    size="small"
                    sx={{
                      borderRadius: 3,
                      textTransform: 'none',
                      fontWeight: 600,
                      border: '2px solid rgba(102, 126, 234, 0.2)',
                      color: 'primary.main',
                      backdropFilter: 'blur(10px)',
                      background: 'rgba(255, 255, 255, 0.8)',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 20px rgba(102, 126, 234, 0.3)',
                        border: '2px solid rgba(102, 126, 234, 0.4)',
                        background: 'rgba(255, 255, 255, 0.9)',
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Back to Home
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
                        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                        border: '1px solid rgba(102, 126, 234, 0.1)',
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
                        background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
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
                        component={isMobile ? "h2" : "h1"} 
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
                            width: 80,
                            height: 4,
                            borderRadius: 2,
                            background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                          }
                        }}
                      >
                        Welcome Back!
                      </Typography>
                      
                      <Typography variant="body1" color="text.secondary" sx={{ mt: 3, maxWidth: 400, mx: 'auto' }}>
                        Sign in to continue your journey towards career excellence and unlock new opportunities.
                      </Typography>
                    </Box>
                    
                    {/* Trust Badge */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
                      <Chip
                        icon={<Star sx={{ color: '#ffd700' }} />}
                        label="Trusted by 10,000+ professionals"
                        variant="outlined"
                        sx={{
                          borderColor: 'rgba(102, 126, 234, 0.3)',
                          color: 'text.secondary',
                          '& .MuiChip-icon': { color: '#ffd700' }
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
                            <Email sx={{ color: '#667eea' }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{ 
                        mb: 3,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 3,
                          backgroundColor: 'rgba(102, 126, 234, 0.05)',
                          '& fieldset': {
                            borderColor: 'rgba(102, 126, 234, 0.2)',
                            borderWidth: 2,
                          },
                          '&:hover fieldset': {
                            borderColor: 'rgba(102, 126, 234, 0.4)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#667eea',
                          },
                          transition: 'all 0.3s ease'
                        },
                        '& .MuiInputLabel-root': {
                          color: '#667eea',
                          fontWeight: 600,
                          '&.Mui-focused': {
                            color: '#667eea',
                          }
                        }
                      }}
                    />
                    
                    {/* Password Field */}
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
                            <Lock sx={{ color: '#667eea' }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle password visibility"
                              onClick={handleTogglePasswordVisibility}
                              edge="end"
                              sx={{
                                color: '#667eea',
                                '&:hover': {
                                  backgroundColor: 'rgba(102, 126, 234, 0.1)',
                                }
                              }}
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        )
                      }}
                      sx={{ 
                        mb: 2,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 3,
                          backgroundColor: 'rgba(102, 126, 234, 0.05)',
                          '& fieldset': {
                            borderColor: 'rgba(102, 126, 234, 0.2)',
                            borderWidth: 2,
                          },
                          '&:hover fieldset': {
                            borderColor: 'rgba(102, 126, 234, 0.4)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#667eea',
                          },
                          transition: 'all 0.3s ease'
                        },
                        '& .MuiInputLabel-root': {
                          color: '#667eea',
                          fontWeight: 600,
                          '&.Mui-focused': {
                            color: '#667eea',
                          }
                        }
                      }}
                    />
                    
                    {/* Forgot Password Link */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
                      <Link 
                        component={RouterLink} 
                        to="/forgot-password" 
                        variant="body2" 
                        sx={{
                          color: '#667eea',
                          textDecoration: 'none',
                          fontWeight: 600,
                          position: 'relative',
                          '&:hover': {
                            '&::after': {
                              transform: 'scaleX(1)',
                            }
                          },
                          '&::after': {
                            content: '""',
                            position: 'absolute',
                            width: '100%',
                            transform: 'scaleX(0)',
                            height: 2,
                            bottom: -2,
                            left: 0,
                            backgroundColor: '#667eea',
                            transformOrigin: 'bottom right',
                            transition: 'transform 0.25s ease-out',
                          }
                        }}
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
                      startIcon={loading ? null : <LoginIcon />}
                      sx={{
                        mt: 1,
                        mb: 4,
                        py: 2,
                        borderRadius: 4,
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                        boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)',
                        textTransform: 'none',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #5a6fd8 30%, #694a9e 90%)',
                          transform: 'translateY(-3px)',
                          boxShadow: '0 12px 35px rgba(102, 126, 234, 0.5)',
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
                          Signing In...
                        </Box>
                      ) : 'Sign In to Continue'}
                    </Button>
                    
                    {/* Divider */}
                    <Divider sx={{ my: 4 }}>
                      <Typography 
                        variant="body2" 
                        sx={{
                          color: 'text.secondary',
                          fontWeight: 600,
                          px: 3,
                          background: 'rgba(255, 255, 255, 0.8)',
                          backdropFilter: 'blur(10px)',
                          borderRadius: 3,
                          py: 1
                        }}
                      >
                        Don't have an account?
                      </Typography>
                    </Divider>
                    
                    {/* Create Account Button */}
                    <Button
                      fullWidth
                      variant="outlined"
                      component={RouterLink}
                      to="/register"
                      startIcon={<PersonAdd />}
                      sx={{
                        py: 2,
                        borderRadius: 4,
                        borderWidth: 2,
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        textTransform: 'none',
                        borderColor: '#667eea',
                        color: '#667eea',
                        background: 'rgba(102, 126, 234, 0.05)',
                        '&:hover': {
                          borderWidth: 2,
                          borderColor: '#5a6fd8',
                          color: '#5a6fd8',
                          background: 'rgba(102, 126, 234, 0.1)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 25px rgba(102, 126, 234, 0.2)'
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      Create New Account
                    </Button>
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

export default LoginPage;
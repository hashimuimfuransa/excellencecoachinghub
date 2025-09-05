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
      icon: <PersonAdd sx={{ fontSize: 28, color: '#ffffff' }} />,
      title: 'CV Builder',
      description: 'Professional resume builder with AI optimization',
      category: 'Career Tools',
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      bgColor: 'rgba(250, 112, 154, 0.1)'
    },

    {
      icon: <Assessment sx={{ fontSize: 28, color: '#ffffff' }} />,
      title: 'Psychometric Tests',
      description: 'Advanced personality and skills assessments',
      category: 'Testing & Assessment',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      bgColor: 'rgba(240, 147, 251, 0.1)'
    },
    {
      icon: <Assessment sx={{ fontSize: 28, color: '#ffffff' }} />,
      title: 'Smart Exams',
      description: 'Advanced job specific exams',
      category: 'Testing & Assessment',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      bgColor: 'rgba(79, 172, 254, 0.1)'
    },
    {
      icon: <Psychology sx={{ fontSize: 28, color: '#ffffff' }} />,
      title: 'Interviews',
      description: 'Practice with intelligent interview simulations',
      category: 'AI Technology',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      bgColor: 'rgba(67, 233, 123, 0.1)'
    },
  
    {
      icon: <Security sx={{ fontSize: 28, color: '#ffffff' }} />,
      title: 'Social Network',
      description: 'Professional networking and connections',
      category: 'Professional Network',
      gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      bgColor: 'rgba(168, 237, 234, 0.1)'
    },
        {
      icon: <School sx={{ fontSize: 28, color: '#ffffff' }} />,
      title: 'E-Learning Courses',
      description: 'Professional development with learning materials and live sessions',
      category: 'Learning & Growth',
      gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
      bgColor: 'rgba(161, 140, 209, 0.1)'
    },
    {
      icon: <TrendingUp sx={{ fontSize: 28, color: '#ffffff' }} />,
      title: 'Career Guidance',
      description: 'Personalized career development and insights',
      category: 'Career Development',
      gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      bgColor: 'rgba(255, 236, 210, 0.1)'
    },

    {
      icon: <Business sx={{ fontSize: 28, color: '#ffffff' }} />,
      title: 'Company Profiles',
      description: 'Discover top companies and their culture',
      category: 'Company Discovery',
      gradient: 'linear-gradient(135deg, #fad0c4 0%, #ffd1ff 100%)',
      bgColor: 'rgba(250, 208, 196, 0.1)'
    },
    {
      icon: <Speed sx={{ fontSize: 28, color: '#ffffff' }} />,
      title: 'Smart Matching',
      description: 'AI-powered job and candidate matching',
      category: 'AI Technology',
      gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      bgColor: 'rgba(255, 154, 158, 0.1)'
    },
    {
      icon: <CheckCircle sx={{ fontSize: 28, color: '#ffffff' }} />,
      title: 'Certificates',
      description: 'Professional certifications and achievements',
      category: 'Credentials',
      gradient: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
      bgColor: 'rgba(161, 196, 253, 0.1)'
    },
    {
      icon: <Star sx={{ fontSize: 28, color: '#ffffff' }} />,
      title: 'Career Events',
      description: 'Job fairs, webinars, and networking events',
      category: 'Events & Networking',
      gradient: 'linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%)',
      bgColor: 'rgba(255, 234, 167, 0.1)'
    },
    {
      icon: <Home sx={{ fontSize: 28, color: '#ffffff' }} />,
      title: 'Employer Dashboard',
      description: 'Complete hiring and talent management solution',
      category: 'For Employers',
      gradient: 'linear-gradient(135deg, #81ecec 0%, #6c5ce7 100%)',
      bgColor: 'rgba(129, 236, 236, 0.1)'
    }
  ];

  return (
    <Box
      sx={{
        minHeight: { xs: '100vh', sm: 'auto' },
        display: 'flex',
        background: 'linear-gradient(135deg, #4ade80 0%, #16a34a 50%, #14532d 100%)',
        position: 'relative',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        py: { xs: 2, sm: 4 },
        '&::before': {
          content: '""',
          position: 'absolute',
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
          position: 'absolute',
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
      <Container component="main" maxWidth="lg" sx={{ py: { xs: 1, md: 2 }, position: 'relative', zIndex: 1, width: '100%' }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, minHeight: { xs: 'auto', md: 'auto' }, gap: { xs: 1, md: 3 }, alignItems: { xs: 'center', md: 'flex-start' } }}>
          {/* Left side - Branding and info */}
          {!isMobile && (
            <Box 
              sx={{ 
                flex: 1,
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'flex-start',
                p: { xs: 2, md: 3 },
                position: 'relative',
                maxHeight: { sm: '90vh', md: 'auto' },
                overflow: 'auto'
              }}
            >
              <Fade in={mounted} timeout={1000}>
                <Box>
                  {/* Logo and Brand */}
                  <Slide direction="right" in={mounted} timeout={800}>
                    <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                      <Box
                        sx={{
                          background: 'rgba(255, 255, 255, 0.15)',
                          backdropFilter: 'blur(10px)',
                          borderRadius: 3,
                          p: 1.5,
                          mr: 2,
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                        }}
                      >
                        <img 
                          src="/exjobnetlogo.png" 
                          alt="ExJobNet" 
                          style={{ height: 50, width: 50, objectFit: 'contain' }}
                        />
                      </Box>
                      <Box>
                        <Typography 
                          variant="h4" 
                          component="h1" 
                          sx={{ 
                            fontWeight: 800,
                            background: 'linear-gradient(45deg, #fff 30%, #e8eaf6 90%)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            fontSize: { xs: '1.5rem', md: '2rem' }
                          }}
                        >
                          ExJobNet
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem' }}>
                          Africa's Premier Career Platform
                        </Typography>
                      </Box>
                    </Box>
                  </Slide>
                  
                  {/* Welcome Message */}
                  <Grow in={mounted} timeout={1200}>
                    <Box sx={{ mb: 3 }}>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          mb: 2, 
                          maxWidth: '95%',
                          color: 'rgba(255, 255, 255, 0.95)',
                          lineHeight: 1.5,
                          fontSize: { xs: '0.95rem', md: '1.1rem' },
                          fontWeight: 500,
                          textAlign: 'left'
                        }}
                      >
                        Master your job preparation journey and build meaningful professional networks.
                      </Typography>
                    </Box>
                  </Grow>
                  
                  {/* Our Complete Services */}
                  <Box sx={{ maxWidth: '100%' }}>
                    <Typography 
                      variant="h6" 
                      fontWeight="bold" 
                      color="white" 
                      sx={{ 
                        mb: 2, 
                        textAlign: 'left',
                        textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        background: 'linear-gradient(45deg, #fff 30%, #e8eaf6 90%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontSize: { xs: '1.1rem', md: '1.3rem' }
                      }}
                    >
                      🚀 Our Services
                    </Typography>
                    
                    {/* Compact Services Grid - Show only top 4 services */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      {services.slice(0, 4).map((service, index) => (
                        <Grid item xs={6} sm={6} key={service.title}>
                          <Slide 
                            direction="right" 
                            in={mounted} 
                            timeout={1000 + index * 100}
                          >
                            <Box 
                              sx={{ 
                                p: 3,
                                borderRadius: 4,
                                background: service.gradient,
                                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                height: '100%',
                                position: 'relative',
                                overflow: 'hidden',
                                border: '2px solid rgba(255, 255, 255, 0.1)',
                                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
                                cursor: 'pointer',
                                '&:hover': {
                                  transform: 'translateY(-8px) scale(1.02)',
                                  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
                                  '&::before': {
                                    transform: 'scale(1.1)',
                                  }
                                },
                                '&::before': {
                                  content: '""',
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  background: 'rgba(255, 255, 255, 0.05)',
                                  transition: 'transform 0.4s ease',
                                  zIndex: 0
                                }
                              }}
                            >
                              <Box sx={{ position: 'relative', zIndex: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      mr: 2,
                                      width: 50,
                                      height: 50,
                                      borderRadius: '50%',
                                      background: 'rgba(255, 255, 255, 0.15)',
                                      backdropFilter: 'blur(10px)',
                                      border: '2px solid rgba(255, 255, 255, 0.2)'
                                    }}
                                  >
                                    {service.icon}
                                  </Box>
                                  <Box sx={{ flex: 1 }}>
                                    <Typography 
                                      variant="h6" 
                                      fontWeight="700" 
                                      color="white" 
                                      sx={{ 
                                        fontSize: '1.1rem',
                                        mb: 0.5,
                                        textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                                      }}
                                    >
                                      {service.title}
                                    </Typography>
                                    <Chip 
                                      label={service.category} 
                                      size="small" 
                                      sx={{ 
                                        fontSize: '0.75rem', 
                                        height: 22,
                                        color: 'rgba(255, 255, 255, 0.95)',
                                        background: 'rgba(255, 255, 255, 0.15)',
                                        backdropFilter: 'blur(10px)',
                                        border: '1px solid rgba(255, 255, 255, 0.25)',
                                        fontWeight: 600,
                                        '& .MuiChip-label': { px: 1.5 }
                                      }} 
                                    />
                                  </Box>
                                </Box>
                                <Typography 
                                  variant="body2" 
                                  color="rgba(255, 255, 255, 0.9)" 
                                  sx={{ 
                                    fontSize: '0.9rem', 
                                    lineHeight: 1.5,
                                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
                                  }}
                                >
                                  {service.description}
                                </Typography>
                              </Box>
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
                          {services.slice(6).map((service, index) => (
                            <Chip 
                              key={service.title}
                              label={service.title} 
                              size="small" 
                              sx={{ 
                                color: '#ffffff',
                                background: service.gradient,
                                border: '2px solid rgba(255, 255, 255, 0.2)',
                                fontWeight: 600,
                                fontSize: '0.8rem',
                                height: 28,
                                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                                transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                '&:hover': {
                                  transform: 'translateY(-2px) scale(1.05)',
                                  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.2)',
                                  border: '2px solid rgba(255, 255, 255, 0.3)',
                                },
                                '& .MuiChip-label': { 
                                  px: 2,
                                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
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
              alignItems: { xs: 'flex-start', md: 'flex-start' },
              p: { xs: 1, sm: 2 },
              mt: { xs: 1, md: 0 }
            }}
          >
            <Slide direction="left" in={mounted} timeout={1000}>
              <Paper
                elevation={isMobile ? 4 : 12}
                sx={{
                  p: { xs: 3, sm: 4 },
                  width: '100%',
                  maxWidth: 420,
                  borderRadius: 4,
                  backdropFilter: 'blur(15px)',
                  background: 'rgba(255, 255, 255, 0.98)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  transition: 'all 0.3s ease-in-out',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
                  },
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
                  }
                }}
              >
                {/* Back to Home Button */}
                <Box sx={{ position: 'absolute', top: 15, left: 15, zIndex: 10 }}>
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
                      color: 'primary.main',
                      fontSize: '0.8rem',
                      minWidth: 'auto',
                      p: 1,
                      '&:hover': {
                        background: 'rgba(102, 126, 234, 0.08)',
                      },
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Home
                  </Button>
                </Box>
                
                {/* Header with Logo and Brand */}
                <Fade in={mounted} timeout={1200}>
                  <Box sx={{ textAlign: 'center', mb: 3, pt: 2 }}>
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 2,
                        p: 1.5,
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                        border: '1px solid rgba(102, 126, 234, 0.1)',
                      }}
                    >
                      <img 
                        src="/exjobnetlogo.png" 
                        alt="ExJobNet" 
                        style={{ height: 45, width: 45, objectFit: 'contain' }}
                      />
                    </Box>
                    
                    <Typography 
                      variant="h5" 
                      component="h1" 
                      sx={{ 
                        fontWeight: 800,
                        background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        mb: 0.5,
                        fontSize: { xs: '1.3rem', md: '1.5rem' }
                      }}
                    >
                      ExJobNet
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.9rem' }}>
                      Africa's Premier Career Platform
                    </Typography>
                    
                    {/* Welcome Message */}
                    <Typography 
                      variant="h6" 
                      fontWeight="600"
                      sx={{ 
                        color: 'text.primary',
                        mb: 1,
                        fontSize: { xs: '1.1rem', md: '1.2rem' }
                      }}
                    >
                      Welcome Back!
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.85rem' }}>
                      Sign in to continue your career journey
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
                        mb: 2,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          backgroundColor: 'rgba(102, 126, 234, 0.05)',
                          '& fieldset': {
                            borderColor: 'rgba(102, 126, 234, 0.2)',
                            borderWidth: 1,
                          },
                          '&:hover fieldset': {
                            borderColor: 'rgba(102, 126, 234, 0.4)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#667eea',
                          },
                          transition: 'all 0.2s ease'
                        },
                        '& .MuiInputLabel-root': {
                          color: '#667eea',
                          fontWeight: 500,
                          fontSize: '0.9rem',
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
                        mb: 1.5,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          backgroundColor: 'rgba(102, 126, 234, 0.05)',
                          '& fieldset': {
                            borderColor: 'rgba(102, 126, 234, 0.2)',
                            borderWidth: 1,
                          },
                          '&:hover fieldset': {
                            borderColor: 'rgba(102, 126, 234, 0.4)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#667eea',
                          },
                          transition: 'all 0.2s ease'
                        },
                        '& .MuiInputLabel-root': {
                          color: '#667eea',
                          fontWeight: 500,
                          fontSize: '0.9rem',
                          '&.Mui-focused': {
                            color: '#667eea',
                          }
                        }
                      }}
                    />
                    
                    {/* Forgot Password Link */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
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
                        mb: 2,
                        py: 1.5,
                        borderRadius: 3,
                        fontSize: '1rem',
                        fontWeight: 600,
                        background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
                        textTransform: 'none',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #5a6fd8 30%, #694a9e 90%)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
                        },
                        '&:disabled': {
                          background: 'linear-gradient(45deg, #ccc 30%, #999 90%)',
                          transform: 'none',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                        },
                        transition: 'all 0.2s ease'
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
                    <Divider sx={{ my: 2 }}>
                      <Typography 
                        variant="body2" 
                        sx={{
                          color: 'text.secondary',
                          fontWeight: 500,
                          px: 2,
                          background: 'rgba(255, 255, 255, 0.8)',
                          borderRadius: 2,
                          py: 0.5,
                          fontSize: '0.85rem'
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
      
      {/* Floating Contact Button */}
      <FloatingContact />
    </Box>
  );
};

export default LoginPage;
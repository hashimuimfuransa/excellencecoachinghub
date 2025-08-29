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
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  InputAdornment,
  IconButton,
  useTheme,
  useMediaQuery,
  Avatar,
  Fade,
  Slide,
  Grow,
  Stepper,
  Step,
  StepLabel,
  Chip,
  Stack
} from '@mui/material';
import { 
  Email, 
  Lock, 
  Visibility, 
  VisibilityOff, 
  Person, 
  Business, 
  Work,
  ArrowForward,
  ArrowBack,
  HowToReg,
  School,
  PersonAdd,
  Home as HomeIcon
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../contexts/AuthContext';

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    company: '',
    jobTitle: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [mounted, setMounted] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const steps = ['Account Type', 'Personal Information', 'Security'];

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNext = () => {
    if (activeStep === 0 && !formData.role) {
      setError('Please select a role to continue');
      return;
    }
    
    if (activeStep === 1) {
      if (!formData.firstName || !formData.lastName || !formData.email) {
        setError('Please fill in all required fields');
        return;
      }
      
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email address');
        return;
      }
      
      if (formData.role === UserRole.EMPLOYER && (!formData.company || !formData.jobTitle)) {
        setError('Please fill in company and job title');
        return;
      }
    }
    
    setError('');
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...registerData } = formData;
      await register(registerData);
      // Only navigate on successful registration
      navigate('/dashboard');
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
          setError(errorMessage || 'Registration failed');
        }
      } else {
        setError(err.message || 'Registration failed. Please check your connection and try again.');
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
  
  const handleToggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword((prev) => !prev);
  };

  const roleOptions = [
    { 
      value: UserRole.STUDENT, 
      label: 'Student',
      icon: <School />,
      description: 'Access courses, get certified, and find internships or entry-level positions'
    },
    { 
      value: UserRole.PROFESSIONAL, 
      label: 'Job Seeker',
      icon: <Person />,
      description: 'Find jobs matching your skills and experience, prepare for interviews'
    },
    { 
      value: UserRole.EMPLOYER, 
      label: 'Employer',
      icon: <Business />,
      description: 'Post jobs, find qualified candidates, and manage your recruitment process'
    }
  ];

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
        <Slide direction="up" in={mounted} timeout={1000}>
          <Paper
            elevation={isMobile ? 8 : 24}
            sx={{
              p: { xs: 4, sm: 6 },
              width: '100%',
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
                        width: 120,
                        height: 4,
                        borderRadius: 2,
                        background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                      }
                    }}
                  >
                    Join Our Community!
                  </Typography>
                  
                  <Typography variant="body1" color="text.secondary" sx={{ mt: 3, maxWidth: 600, mx: 'auto' }}>
                    Create your account to unlock personalized career opportunities, connect with top employers,
                    and accelerate your professional growth across Africa's dynamic job ecosystem.
                  </Typography>
                </Box>
                
                {/* Benefits Chips */}
                <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" sx={{ mb: 4 }}>
                  <Chip
                    label="Free to Join"
                    size="small"
                    sx={{
                      background: 'linear-gradient(45deg, rgba(76, 175, 80, 0.1) 30%, rgba(46, 125, 50, 0.1) 90%)',
                      color: '#4caf50',
                      border: '1px solid rgba(76, 175, 80, 0.2)',
                      fontWeight: 600
                    }}
                  />
                  <Chip
                    label="Instant Access"
                    size="small"
                    sx={{
                      background: 'linear-gradient(45deg, rgba(33, 150, 243, 0.1) 30%, rgba(21, 101, 192, 0.1) 90%)',
                      color: '#2196f3',
                      border: '1px solid rgba(33, 150, 243, 0.2)',
                      fontWeight: 600
                    }}
                  />
                  <Chip
                    label="10,000+ Jobs"
                    size="small"
                    sx={{
                      background: 'linear-gradient(45deg, rgba(102, 126, 234, 0.1) 30%, rgba(118, 75, 162, 0.1) 90%)',
                      color: '#667eea',
                      border: '1px solid rgba(102, 126, 234, 0.2)',
                      fontWeight: 600
                    }}
                  />
                </Stack>
              </Box>
            </Fade>
            
            <Grow in={mounted} timeout={1500}>
              <Stepper 
                activeStep={activeStep} 
                alternativeLabel 
                sx={{ 
                  mb: 5,
                  '& .MuiStepConnector-root': {
                    top: 22,
                    '&.Mui-completed .MuiStepConnector-line': {
                      borderColor: '#667eea',
                    },
                    '&.Mui-active .MuiStepConnector-line': {
                      borderColor: '#667eea',
                    },
                  },
                  '& .MuiStepLabel-root .Mui-completed': {
                    color: '#667eea',
                  },
                  '& .MuiStepLabel-root .Mui-active': {
                    color: '#667eea',
                  },
                  '& .MuiStepIcon-root': {
                    color: 'rgba(102, 126, 234, 0.2)',
                    '&.Mui-active': {
                      color: '#667eea',
                    },
                    '&.Mui-completed': {
                      color: '#667eea',
                    },
                  }
                }}
              >
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel 
                      sx={{
                        '& .MuiStepLabel-label': {
                          fontWeight: 600,
                          fontSize: '1rem'
                        }
                      }}
                    >
                      {label}
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Grow>

            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 4,
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

            <Box component="form" onSubmit={activeStep === 2 ? handleSubmit : undefined} noValidate>
              {activeStep === 0 && (
                <Slide direction="right" in={mounted} timeout={800}>
                  <Box>
                    <Typography 
                      variant="h5" 
                      gutterBottom 
                      sx={{ 
                        mb: 4, 
                        textAlign: 'center',
                        fontWeight: 700,
                        color: 'text.primary'
                      }}
                    >
                      Choose Your Path to Success
                    </Typography>
                    
                    <Grid container spacing={4}>
                      {roleOptions.map((option, index) => (
                        <Grid item xs={12} md={4} key={option.value}>
                          <Slide direction="up" in={mounted} timeout={1000 + index * 200}>
                            <Paper
                              elevation={formData.role === option.value ? 12 : 3}
                              sx={{
                                p: 4,
                                borderRadius: 4,
                                cursor: 'pointer',
                                border: formData.role === option.value ? 3 : 2,
                                borderColor: formData.role === option.value ? '#667eea' : 'rgba(102, 126, 234, 0.2)',
                                transition: 'all 0.4s ease',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                textAlign: 'center',
                                position: 'relative',
                                overflow: 'hidden',
                                background: formData.role === option.value 
                                  ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)'
                                  : 'rgba(255, 255, 255, 0.9)',
                                '&::before': formData.role === option.value ? {
                                  content: '""',
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  height: 4,
                                  background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
                                } : {},
                                '&:hover': {
                                  transform: 'translateY(-8px)',
                                  boxShadow: '0 15px 40px rgba(102, 126, 234, 0.3)',
                                  borderColor: '#667eea',
                                }
                              }}
                              onClick={() => setFormData({...formData, role: option.value})}
                            >
                              <Avatar
                                sx={{
                                  bgcolor: formData.role === option.value ? '#667eea' : 'rgba(102, 126, 234, 0.1)',
                                  width: 80,
                                  height: 80,
                                  mb: 3,
                                  transition: 'all 0.3s ease',
                                  '& .MuiSvgIcon-root': {
                                    fontSize: '2rem',
                                    color: formData.role === option.value ? 'white' : '#667eea'
                                  }
                                }}
                              >
                                {option.icon}
                              </Avatar>
                              <Typography 
                                variant="h5" 
                                gutterBottom 
                                fontWeight="bold"
                                sx={{
                                  color: formData.role === option.value ? '#667eea' : 'text.primary',
                                  mb: 2
                                }}
                              >
                                {option.label}
                              </Typography>
                              <Typography 
                                variant="body1" 
                                color="text.secondary"
                                sx={{
                                  lineHeight: 1.6,
                                  fontSize: '0.95rem'
                                }}
                              >
                                {option.description}
                              </Typography>
                              
                              {formData.role === option.value && (
                                <Box
                                  sx={{
                                    position: 'absolute',
                                    top: 16,
                                    right: 16,
                                    bgcolor: '#4caf50',
                                    borderRadius: '50%',
                                    width: 24,
                                    height: 24,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: '0.75rem'
                                  }}
                                >
                                  ✓
                                </Box>
                              )}
                            </Paper>
                          </Slide>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </Slide>
              )}
              
              {activeStep === 1 && (
                <Slide direction="left" in={mounted} timeout={800}>
                  <Box>
                    <Typography 
                      variant="h5" 
                      gutterBottom 
                      sx={{ 
                        mb: 4, 
                        textAlign: 'center',
                        fontWeight: 700,
                        color: 'text.primary'
                      }}
                    >
                      Tell Us About Yourself
                    </Typography>
                    
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          required
                          fullWidth
                          id="firstName"
                          label="First Name"
                          name="firstName"
                          autoComplete="given-name"
                          value={formData.firstName}
                          onChange={handleChange}
                          disabled={loading}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Person sx={{ color: '#667eea' }} />
                              </InputAdornment>
                            ),
                          }}
                          sx={{ 
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
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          required
                          fullWidth
                          id="lastName"
                          label="Last Name"
                          name="lastName"
                          autoComplete="family-name"
                          value={formData.lastName}
                          onChange={handleChange}
                          disabled={loading}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Person sx={{ color: '#667eea' }} />
                              </InputAdornment>
                            ),
                          }}
                          sx={{ 
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
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          required
                          fullWidth
                          id="email"
                          label="Email Address"
                          name="email"
                          autoComplete="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          disabled={loading}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Email sx={{ color: '#667eea' }} />
                              </InputAdornment>
                            ),
                          }}
                          sx={{ 
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
                      </Grid>
                      
                      {formData.role === UserRole.EMPLOYER && (
                        <>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              required
                              fullWidth
                              id="company"
                              label="Company"
                              name="company"
                              value={formData.company}
                              onChange={handleChange}
                              disabled={loading}
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <Business sx={{ color: '#667eea' }} />
                                  </InputAdornment>
                                ),
                              }}
                              sx={{ 
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: 2,
                                  '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'primary.main',
                                  }
                                }
                              }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              required
                              fullWidth
                              id="jobTitle"
                              label="Job Title"
                              name="jobTitle"
                              value={formData.jobTitle}
                              onChange={handleChange}
                              disabled={loading}
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <Work sx={{ color: '#667eea' }} />
                                  </InputAdornment>
                                ),
                              }}
                              sx={{ 
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: 2,
                                  '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'primary.main',
                                  }
                                }
                              }}
                            />
                          </Grid>
                        </>
                      )}
                    </Grid>
                  </Box>
                </Slide>
              )}
              
              {activeStep === 2 && (
                <Slide direction="right" in={mounted} timeout={800}>
                  <Box>
                    <Typography 
                      variant="h5" 
                      gutterBottom 
                      sx={{ 
                        mb: 4, 
                        textAlign: 'center',
                        fontWeight: 700,
                        color: 'text.primary'
                      }}
                    >
                      Secure Your Account
                    </Typography>
                    
                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        <TextField
                          required
                          fullWidth
                          name="password"
                          label="Password"
                          type={showPassword ? 'text' : 'password'}
                          id="password"
                          autoComplete="new-password"
                          value={formData.password}
                          onChange={handleChange}
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
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          required
                          fullWidth
                          name="confirmPassword"
                          label="Confirm Password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          id="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
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
                                  onClick={handleToggleConfirmPasswordVisibility}
                                  edge="end"
                                  sx={{
                                    color: '#667eea',
                                    '&:hover': {
                                      backgroundColor: 'rgba(102, 126, 234, 0.1)',
                                    }
                                  }}
                                >
                                  {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                              </InputAdornment>
                            )
                          }}
                          sx={{ 
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
                      </Grid>
                    </Grid>
                    
                    <Box sx={{ mt: 3, mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Password requirements:
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        • At least 6 characters long
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        • Include a mix of letters, numbers, and symbols for better security
                      </Typography>
                    </Box>
                  </Box>
                </Slide>
              )}
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 5 }}>
                <Button
                  variant="outlined"
                  onClick={handleBack}
                  disabled={activeStep === 0 || loading}
                  startIcon={<ArrowBack />}
                  sx={{
                    borderRadius: 3,
                    borderWidth: 2,
                    px: 4,
                    py: 1.5,
                    borderColor: '#667eea',
                    color: '#667eea',
                    fontWeight: 600,
                    '&:hover': {
                      borderWidth: 2,
                      borderColor: '#5a6fd8',
                      color: '#5a6fd8',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(102, 126, 234, 0.2)'
                    },
                    '&:disabled': {
                      borderColor: 'rgba(0, 0, 0, 0.12)',
                      color: 'rgba(0, 0, 0, 0.26)',
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  Back
                </Button>
                
                {activeStep === steps.length - 1 ? (
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? null : <HowToReg />}
                    sx={{
                      px: 4,
                      py: 1.5,
                      borderRadius: 3,
                      fontSize: '1rem',
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
                        Creating Account...
                      </Box>
                    ) : 'Create Account'}
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    endIcon={<ArrowForward />}
                    sx={{
                      px: 4,
                      py: 1.5,
                      borderRadius: 3,
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      textTransform: 'none',
                      background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                      boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #5a6fd8 30%, #694a9e 90%)',
                        transform: 'translateY(-3px)',
                        boxShadow: '0 12px 35px rgba(102, 126, 234, 0.5)',
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Next Step
                  </Button>
                )}
              </Box>
              
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
                  Already have an account?
                </Typography>
              </Divider>
              
              <Box sx={{ textAlign: 'center' }}>
                <Button
                  component={RouterLink}
                  to="/login"
                  variant="outlined"
                  sx={{
                    px: 4,
                    py: 1.5,
                    borderRadius: 3,
                    borderWidth: 2,
                    fontSize: '1rem',
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
                  Sign In Instead
                </Button>
              </Box>
            </Box>
          </Paper>
        </Slide>
      </Container>
    </Box>
  );
};

export default RegisterPage;
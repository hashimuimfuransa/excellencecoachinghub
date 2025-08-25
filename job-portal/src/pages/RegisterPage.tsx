import React, { useState } from 'react';
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
  Stepper,
  Step,
  StepLabel
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
  PersonAdd
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
  
  const { register } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const steps = ['Account Type', 'Personal Information', 'Security'];

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
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("data:image/svg+xml,%3Csvg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z" fill="%234caf50" fill-opacity="0.05" fill-rule="evenodd"/%3E%3C/svg%3E")',
          opacity: 0.5
        }
      }}
    >
      <Container component="main" maxWidth="md" sx={{ py: 4 }}>
        <Fade in={true} timeout={800}>
          <Paper
            elevation={12}
            sx={{
              p: { xs: 3, sm: 5 },
              width: '100%',
              borderRadius: 4,
              backdropFilter: 'blur(10px)',
              background: 'rgba(255, 255, 255, 0.9)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4, justifyContent: 'center' }}>
              <img 
                src="/logo1.png" 
                alt="Excellence Coaching Hub" 
                style={{ height: 120, marginBottom: 16 }}
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
            
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography 
                variant="h4" 
                component="h2" 
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
                Create Your Account
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 3 }}>
                Join our platform to accelerate your career journey
              </Typography>
            </Box>
            
            <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

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
                <Fade in={true} timeout={500}>
                  <Box>
                    <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                      Select your account type:
                    </Typography>
                    
                    <Grid container spacing={3}>
                      {roleOptions.map((option) => (
                        <Grid item xs={12} md={4} key={option.value}>
                          <Paper
                            elevation={formData.role === option.value ? 8 : 1}
                            sx={{
                              p: 3,
                              borderRadius: 3,
                              cursor: 'pointer',
                              border: formData.role === option.value ? 2 : 1,
                              borderColor: formData.role === option.value ? 'primary.main' : 'divider',
                              transition: 'all 0.3s',
                              height: '100%',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              textAlign: 'center',
                              '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                              }
                            }}
                            onClick={() => setFormData({...formData, role: option.value})}
                          >
                            <Avatar
                              sx={{
                                bgcolor: formData.role === option.value ? 'primary.main' : 'grey.200',
                                width: 60,
                                height: 60,
                                mb: 2
                              }}
                            >
                              {option.icon}
                            </Avatar>
                            <Typography variant="h6" gutterBottom fontWeight="bold">
                              {option.label}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {option.description}
                            </Typography>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </Fade>
              )}
              
              {activeStep === 1 && (
                <Fade in={true} timeout={500}>
                  <Box>
                    <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                      Enter your personal information:
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
                                <Person color="primary" />
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
                                <Person color="primary" />
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
                                <Email color="primary" />
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
                                    <Business color="primary" />
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
                                    <Work color="primary" />
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
                </Fade>
              )}
              
              {activeStep === 2 && (
                <Fade in={true} timeout={500}>
                  <Box>
                    <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                      Create a secure password:
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
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'primary.main',
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
                                <Lock color="primary" />
                              </InputAdornment>
                            ),
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  aria-label="toggle password visibility"
                                  onClick={handleToggleConfirmPasswordVisibility}
                                  edge="end"
                                >
                                  {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                              </InputAdornment>
                            )
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
                </Fade>
              )}
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Button
                  variant="outlined"
                  onClick={handleBack}
                  disabled={activeStep === 0 || loading}
                  startIcon={<ArrowBack />}
                  sx={{
                    borderRadius: 2,
                    borderWidth: 2,
                    px: 3,
                    '&:hover': {
                      borderWidth: 2
                    }
                  }}
                >
                  Back
                </Button>
                
                {activeStep === steps.length - 1 ? (
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    startIcon={<HowToReg />}
                    sx={{
                      px: 3,
                      py: 1.2,
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
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    endIcon={<ArrowForward />}
                    sx={{
                      px: 3,
                      py: 1.2,
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
                    Next
                  </Button>
                )}
              </Box>
              
              <Divider sx={{ my: 4 }} />
              
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2">
                  Already have an account?{' '}
                  <Link 
                    component={RouterLink} 
                    to="/login" 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 'bold',
                      color: 'primary.main',
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline'
                      }
                    }}
                  >
                    Sign in here
                  </Link>
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Fade>
      </Container>
    </Box>
  );
};

export default RegisterPage;
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
  Stack,
  CircularProgress
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
  Home as HomeIcon,
  Google
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../contexts/AuthContext';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import FloatingContact from '../components/FloatingContact';
import PasswordValidation, { getPasswordValidationErrors, isPasswordAcceptable } from '../components/PasswordValidation';
import GoogleRoleSelectionModal from '../components/GoogleRoleSelectionModal';
import MobileGoogleSignIn from '../components/MobileGoogleSignIn';

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
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showGoogleRoleModal, setShowGoogleRoleModal] = useState(false);
  const [googleUserData, setGoogleUserData] = useState(null);
  
  const { register, loginWithGoogle, registerWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { mode } = useCustomTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [searchParams] = useSearchParams();
  
  // Check for job redirect parameters
  const redirectType = searchParams.get('redirect');
  const jobId = searchParams.get('jobId');
  
  // Determine redirect destination
  const getRedirectPath = () => {
    if (redirectType === 'job' && jobId) {
      return `/app/jobs/${jobId}`;
    }
    return '/app/network';
  };

  const steps = ['Account Type', 'Personal Information', 'Security'];

  useEffect(() => {
    setMounted(true);
    
    // Check if role parameter is provided (e.g., /register?role=employer)
    const roleParam = searchParams.get('role');
    if (roleParam) {
      let mappedRole = '';
      switch (roleParam) {
        case 'employer':
          mappedRole = UserRole.EMPLOYER;
          break;
        case 'job_seeker':
          mappedRole = UserRole.PROFESSIONAL;
          break;
        case 'student':
          mappedRole = UserRole.STUDENT;
          break;
        default:
          mappedRole = '';
      }
      
      if (mappedRole) {
        setFormData(prev => ({
          ...prev,
          role: mappedRole
        }));
        // Skip to step 1 (Personal Information) since role is already selected
        setActiveStep(1);
      }
    }
  }, [searchParams]);

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

    // Enhanced password validation with tolerance for medium passwords
    if (!isPasswordAcceptable(formData.password)) {
      const passwordErrors = getPasswordValidationErrors(formData.password);
      const errorMessage = "Please improve your password:\n\n" + 
        passwordErrors.map(err => `• ${err}`).join('\n');
      setError(errorMessage);
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...registerData } = formData;
      await register(registerData);
      // Only navigate on successful registration
      navigate(getRedirectPath());
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
        navigate(getRedirectPath());
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      
      // Provide more specific error messages based on the error
      if (error.message?.includes('cancelled') || error.message?.includes('not completed')) {
        setError('Google sign-in was not completed. Please try again or use a different browser if the issue persists.');
      } else if (error.message?.includes('not configured') || error.message?.includes('Client ID')) {
        setError('Google authentication is not properly configured. Please contact support.');
      } else if (error.message?.includes('popup') || error.message?.includes('blocked') || error.message?.includes('not displayed')) {
        setError('Google sign-in popup was blocked. Please allow popups for this site and try again.');
      } else if (error.message?.includes('not available') || error.message?.includes('timeout')) {
        setError('Google services are temporarily unavailable. Please check your internet connection and try again.');
      } else if (error.message?.includes('FedCM') || error.message?.includes('NetworkError')) {
        setError('There was a network issue with Google sign-in. Please try refreshing the page and signing in again.');
      } else if (error.message?.includes('script') || error.message?.includes('load')) {
        setError('Failed to load Google sign-in. Please check your internet connection and try refreshing the page.');
      } else {
        setError('Unable to sign in with Google. Please try refreshing the page or use the form below.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleRoleSelection = async (role: string, userData: any) => {
    await registerWithGoogle(userData, role);
    setShowGoogleRoleModal(false);
    navigate(getRedirectPath());
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
        background: mode === 'dark' 
          ? 'linear-gradient(135deg, #1a3e1a 0%, #2c5f2d 50%, #1a3e1a 100%)'
          : 'linear-gradient(135deg, #4ade80 0%, #16a34a 50%, #14532d 100%)',
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
      <Container component="main" maxWidth="xl" sx={{ py: 2, position: 'relative', zIndex: 1 }}>
        <Slide direction="up" in={mounted} timeout={800}>
          <Paper
            elevation={6}
            sx={{
              p: { xs: 2.5, sm: 4, md: 5 },
              width: '100%',
              maxWidth: { xs: 420, md: 1200 },
              mx: 'auto',
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
              transition: 'all 0.3s ease-in-out',
              position: 'relative',
              overflow: 'hidden',
              minHeight: { md: '80vh' },
              display: 'flex',
              flexDirection: 'column',
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
            
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 2, pt: 1 }}>
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
                Create Account
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                Join ExJobNet and unlock your career potential
              </Typography>
            </Box>
            
            {/* Mobile-Friendly Google Sign Up */}
            <Box sx={{ mb: 3, px: { xs: 2, md: 4 } }}>
              <MobileGoogleSignIn
                onSuccess={(result) => {
                  if (result.requiresRoleSelection && result.userData) {
                    setGoogleUserData(result.userData);
                    setShowGoogleRoleModal(true);
                  } else {
                    navigate(getRedirectPath());
                  }
                }}
                onError={(error) => {
                  setError(error);
                }}
                loading={googleLoading}
                setLoading={setGoogleLoading}
              />
              
              <Divider sx={{ my: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                  OR CREATE ACCOUNT MANUALLY
                </Typography>
              </Divider>
            </Box>


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

            <Box 
              component="form" 
              onSubmit={activeStep === 2 ? handleSubmit : undefined} 
              noValidate
              sx={{ 
                flex: 1,
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                gap: { md: 4 },
                alignItems: { md: 'stretch' }
              }}
            >
              {/* Form content area */}
              <Box sx={{ 
                flex: { md: 1 }, 
                display: 'flex', 
                flexDirection: 'column',
                minHeight: { md: '60vh' },
                justifyContent: 'center'
              }}>
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
                    
                    <Box sx={{ 
                      display: 'grid', 
                      gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                      gap: { xs: 2, md: 3 },
                      justifyItems: 'center'
                    }}>
                      {roleOptions.map((option, index) => (
                        <Box key={option.value}>
                          <Slide direction="up" in={mounted} timeout={1000 + index * 200}>
                            <Paper
                              elevation={formData.role === option.value ? 8 : 2}
                              sx={{
                                p: 2.5,
                                borderRadius: 3,
                                cursor: 'pointer',
                                border: formData.role === option.value ? 2 : 1,
                                borderColor: formData.role === option.value 
                                  ? (mode === 'dark' ? '#66BB6A' : '#667eea') 
                                  : (mode === 'dark' ? 'rgba(102, 187, 106, 0.3)' : 'rgba(102, 126, 234, 0.2)'),
                                transition: 'all 0.3s ease',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                textAlign: 'center',
                                position: 'relative',
                                overflow: 'hidden',
                                background: formData.role === option.value 
                                  ? (mode === 'dark' 
                                      ? 'linear-gradient(135deg, rgba(102, 187, 106, 0.15) 0%, rgba(129, 199, 132, 0.15) 100%)'
                                      : 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)')
                                  : (mode === 'dark' ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)'),
                                '&::before': formData.role === option.value ? {
                                  content: '""',
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  height: 2,
                                  background: mode === 'dark'
                                    ? 'linear-gradient(45deg, #66BB6A 0%, #81C784 100%)'
                                    : 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
                                } : {},
                                '&:hover': {
                                  transform: 'translateY(-4px)',
                                  boxShadow: mode === 'dark'
                                    ? '0 8px 25px rgba(102, 187, 106, 0.3)'
                                    : '0 8px 25px rgba(102, 126, 234, 0.2)',
                                  borderColor: mode === 'dark' ? '#66BB6A' : '#667eea',
                                }
                              }}
                              onClick={() => setFormData({...formData, role: option.value})}
                            >
                              <Avatar
                                sx={{
                                  bgcolor: formData.role === option.value 
                                    ? (mode === 'dark' ? '#66BB6A' : '#667eea')
                                    : (mode === 'dark' ? 'rgba(102, 187, 106, 0.2)' : 'rgba(102, 126, 234, 0.1)'),
                                  width: 50,
                                  height: 50,
                                  mb: 1.5,
                                  transition: 'all 0.3s ease',
                                  boxShadow: formData.role === option.value 
                                    ? (mode === 'dark'
                                        ? '0 4px 20px rgba(102, 187, 106, 0.4)'
                                        : '0 4px 20px rgba(102, 126, 234, 0.4)')
                                    : 'none',
                                  '& .MuiSvgIcon-root': {
                                    fontSize: '1.4rem',
                                    color: formData.role === option.value 
                                      ? 'white' 
                                      : (mode === 'dark' ? '#66BB6A' : '#667eea')
                                  }
                                }}
                              >
                                {option.icon}
                              </Avatar>
                              <Typography 
                                variant="h6" 
                                gutterBottom 
                                fontWeight="600"
                                sx={{
                                  color: formData.role === option.value 
                                    ? (mode === 'dark' ? '#66BB6A' : '#667eea')
                                    : 'text.primary',
                                  mb: 1,
                                  fontSize: '1rem'
                                }}
                              >
                                {option.label}
                              </Typography>
                              <Typography 
                                variant="body2" 
                                color="text.secondary"
                                sx={{
                                  lineHeight: 1.4,
                                  fontSize: '0.8rem'
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
                                    bgcolor: mode === 'dark' ? '#66BB6A' : '#4caf50',
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
                        </Box>
                      ))}
                    </Box>
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
                    
                    <Box sx={{ 
                      display: 'grid', 
                      gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                      gap: { xs: 3, md: 4 }
                    }}>
                      <Box>
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
                                <Person sx={{ color: mode === 'dark' ? '#66BB6A' : '#667eea' }} />
                              </InputAdornment>
                            ),
                          }}
                          sx={{ 
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 3,
                              backgroundColor: mode === 'dark' 
                                ? 'rgba(102, 187, 106, 0.1)' 
                                : 'rgba(102, 126, 234, 0.05)',
                              '& fieldset': {
                                borderColor: mode === 'dark' 
                                  ? 'rgba(102, 187, 106, 0.3)' 
                                  : 'rgba(102, 126, 234, 0.2)',
                                borderWidth: 2,
                              },
                              '&:hover fieldset': {
                                borderColor: mode === 'dark' 
                                  ? 'rgba(102, 187, 106, 0.5)' 
                                  : 'rgba(102, 126, 234, 0.4)',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: mode === 'dark' ? '#66BB6A' : '#667eea',
                              },
                              transition: 'all 0.3s ease'
                            },
                            '& .MuiInputLabel-root': {
                              color: mode === 'dark' ? '#66BB6A' : '#667eea',
                              fontWeight: 600,
                              '&.Mui-focused': {
                                color: mode === 'dark' ? '#66BB6A' : '#667eea',
                              }
                            }
                          }}
                        />
                      </Box>
                      <Box>
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
                                <Person sx={{ color: mode === 'dark' ? '#66BB6A' : '#667eea' }} />
                              </InputAdornment>
                            ),
                          }}
                          sx={{ 
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 3,
                              backgroundColor: mode === 'dark' 
                                ? 'rgba(102, 187, 106, 0.1)' 
                                : 'rgba(102, 126, 234, 0.05)',
                              '& fieldset': {
                                borderColor: mode === 'dark' 
                                  ? 'rgba(102, 187, 106, 0.3)' 
                                  : 'rgba(102, 126, 234, 0.2)',
                                borderWidth: 2,
                              },
                              '&:hover fieldset': {
                                borderColor: mode === 'dark' 
                                  ? 'rgba(102, 187, 106, 0.5)' 
                                  : 'rgba(102, 126, 234, 0.4)',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: mode === 'dark' ? '#66BB6A' : '#667eea',
                              },
                              transition: 'all 0.3s ease'
                            },
                            '& .MuiInputLabel-root': {
                              color: mode === 'dark' ? '#66BB6A' : '#667eea',
                              fontWeight: 600,
                              '&.Mui-focused': {
                                color: mode === 'dark' ? '#66BB6A' : '#667eea',
                              }
                            }
                          }}
                        />
                      </Box>
                      <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
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
                                <Email sx={{ color: mode === 'dark' ? '#66BB6A' : '#667eea' }} />
                              </InputAdornment>
                            ),
                          }}
                          sx={{ 
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 3,
                              backgroundColor: mode === 'dark' 
                                ? 'rgba(102, 187, 106, 0.1)' 
                                : 'rgba(102, 126, 234, 0.05)',
                              '& fieldset': {
                                borderColor: mode === 'dark' 
                                  ? 'rgba(102, 187, 106, 0.3)' 
                                  : 'rgba(102, 126, 234, 0.2)',
                                borderWidth: 2,
                              },
                              '&:hover fieldset': {
                                borderColor: mode === 'dark' 
                                  ? 'rgba(102, 187, 106, 0.5)' 
                                  : 'rgba(102, 126, 234, 0.4)',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: mode === 'dark' ? '#66BB6A' : '#667eea',
                              },
                              transition: 'all 0.3s ease'
                            },
                            '& .MuiInputLabel-root': {
                              color: mode === 'dark' ? '#66BB6A' : '#667eea',
                              fontWeight: 600,
                              '&.Mui-focused': {
                                color: mode === 'dark' ? '#66BB6A' : '#667eea',
                              }
                            }
                          }}
                        />
                      </Box>
                      
                      {formData.role === UserRole.EMPLOYER && (
                        <>
                          <Box>
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
                                    <Business sx={{ color: mode === 'dark' ? '#66BB6A' : '#667eea' }} />
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
                          </Box>
                          <Box>
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
                                    <Work sx={{ color: mode === 'dark' ? '#66BB6A' : '#667eea' }} />
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
                          </Box>
                        </>
                      )}
                    </Box>
                  </Box>
                </Slide>
              )}
              
              {activeStep === 2 && (
                <Slide direction="right" in={mounted} timeout={800}>
                  <Box>
                    <Typography 
                      variant={isMobile ? "h6" : "h5"}
                      gutterBottom 
                      sx={{ 
                        mb: isMobile ? 3 : 4, 
                        textAlign: 'center',
                        fontWeight: 700,
                        color: 'text.primary',
                        fontSize: isMobile ? '1.25rem' : '1.5rem'
                      }}
                    >
                      Secure Your Account
                    </Typography>
                    
                    <Box sx={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      gap: isMobile ? 2 : 3
                    }}>
                      {/* Password Field */}
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
                              <Lock sx={{ 
                                color: mode === 'dark' ? '#66BB6A' : '#667eea',
                                fontSize: isMobile ? '1.2rem' : '1.5rem'
                              }} />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                aria-label="toggle password visibility"
                                onClick={handleTogglePasswordVisibility}
                                edge="end"
                                size={isMobile ? "small" : "medium"}
                                sx={{
                                  color: mode === 'dark' ? '#66BB6A' : '#667eea',
                                  '&:hover': {
                                    backgroundColor: mode === 'dark' 
                                      ? 'rgba(102, 187, 106, 0.1)' 
                                      : 'rgba(102, 126, 234, 0.1)',
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
                            borderRadius: isMobile ? 2 : 3,
                            backgroundColor: mode === 'dark' 
                              ? 'rgba(102, 187, 106, 0.1)' 
                              : 'rgba(102, 126, 234, 0.05)',
                            minHeight: isMobile ? '48px' : '56px',
                            '& fieldset': {
                              borderColor: mode === 'dark' 
                                ? 'rgba(102, 187, 106, 0.3)' 
                                : 'rgba(102, 126, 234, 0.2)',
                              borderWidth: 2,
                            },
                            '&:hover fieldset': {
                              borderColor: mode === 'dark' 
                                ? 'rgba(102, 187, 106, 0.5)' 
                                : 'rgba(102, 126, 234, 0.4)',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: mode === 'dark' ? '#66BB6A' : '#667eea',
                            },
                            transition: 'all 0.3s ease'
                          },
                          '& .MuiInputLabel-root': {
                            color: mode === 'dark' ? '#66BB6A' : '#667eea',
                            fontWeight: 600,
                            fontSize: isMobile ? '0.9rem' : '1rem',
                            '&.Mui-focused': {
                              color: mode === 'dark' ? '#66BB6A' : '#667eea',
                            }
                          }
                        }}
                      />

                      {/* Confirm Password Field */}
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
                              <Lock sx={{ 
                                color: mode === 'dark' ? '#66BB6A' : '#667eea',
                                fontSize: isMobile ? '1.2rem' : '1.5rem'
                              }} />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                aria-label="toggle password visibility"
                                onClick={handleToggleConfirmPasswordVisibility}
                                edge="end"
                                size={isMobile ? "small" : "medium"}
                                sx={{
                                  color: mode === 'dark' ? '#66BB6A' : '#667eea',
                                  '&:hover': {
                                    backgroundColor: mode === 'dark' 
                                      ? 'rgba(102, 187, 106, 0.1)' 
                                      : 'rgba(102, 126, 234, 0.1)',
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
                            borderRadius: isMobile ? 2 : 3,
                            backgroundColor: mode === 'dark' 
                              ? 'rgba(102, 187, 106, 0.1)' 
                              : 'rgba(102, 126, 234, 0.05)',
                            minHeight: isMobile ? '48px' : '56px',
                            '& fieldset': {
                              borderColor: mode === 'dark' 
                                ? 'rgba(102, 187, 106, 0.3)' 
                                : 'rgba(102, 126, 234, 0.2)',
                              borderWidth: 2,
                            },
                            '&:hover fieldset': {
                              borderColor: mode === 'dark' 
                                ? 'rgba(102, 187, 106, 0.5)' 
                                : 'rgba(102, 126, 234, 0.4)',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: mode === 'dark' ? '#66BB6A' : '#667eea',
                            },
                            transition: 'all 0.3s ease'
                          },
                          '& .MuiInputLabel-root': {
                            color: mode === 'dark' ? '#66BB6A' : '#667eea',
                            fontWeight: 600,
                            fontSize: isMobile ? '0.9rem' : '1rem',
                            '&.Mui-focused': {
                              color: mode === 'dark' ? '#66BB6A' : '#667eea',
                            }
                          }
                        }}
                      />

                      {/* Password Validation */}
                      <Box sx={{ mt: isMobile ? 1 : 2 }}>
                        <PasswordValidation 
                          password={formData.password}
                          show={formData.password.length > 0}
                        />
                        {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                          <Alert 
                            severity="error" 
                            sx={{ 
                              mt: 1,
                              fontSize: isMobile ? '0.8rem' : '0.875rem',
                              '& .MuiAlert-message': {
                                fontSize: isMobile ? '0.8rem' : '0.875rem'
                              }
                            }}
                          >
                            Passwords do not match
                          </Alert>
                        )}
                      </Box>
                    </Box>
                  </Box>
                </Slide>
              )}
              </Box>
              
              {/* Navigation Sidebar for desktop */}
              <Box sx={{ 
                display: { xs: 'none', md: 'flex' },
                flexDirection: 'column',
                width: '300px',
                bgcolor: 'rgba(102, 126, 234, 0.05)',
                borderRadius: 2,
                p: 3,
                gap: 3
              }}>
                {/* Progress Steps */}
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#667eea' }}>
                    Registration Progress
                  </Typography>
                  <Stack spacing={2}>
                    {steps.map((step, index) => (
                      <Box 
                        key={step}
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 2,
                          p: 2,
                          borderRadius: 2,
                          bgcolor: index === activeStep ? 'rgba(102, 126, 234, 0.1)' : 'transparent',
                          border: index === activeStep ? '2px solid #667eea' : '2px solid transparent',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <Box sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          bgcolor: index <= activeStep ? '#667eea' : 'rgba(102, 126, 234, 0.2)',
                          color: index <= activeStep ? 'white' : '#667eea',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          fontSize: '0.9rem'
                        }}>
                          {index < activeStep ? '✓' : index + 1}
                        </Box>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            fontWeight: index === activeStep ? 700 : 500,
                            color: index <= activeStep ? '#667eea' : 'text.secondary'
                          }}
                        >
                          {step}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>

                {/* Navigation Buttons for Desktop */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {activeStep === steps.length - 1 ? (
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={loading}
                      startIcon={loading ? null : <HowToReg />}
                      sx={{
                        px: 4,
                        py: 2,
                        borderRadius: 3,
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        background: mode === 'dark'
                          ? 'linear-gradient(45deg, #66BB6A 30%, #81C784 90%)'
                          : 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                        boxShadow: mode === 'dark'
                          ? '0 8px 25px rgba(102, 187, 106, 0.4)'
                          : '0 8px 25px rgba(102, 126, 234, 0.4)',
                        textTransform: 'none',
                        color: mode === 'dark' ? '#000000' : '#ffffff',
                        '&:hover': {
                          background: mode === 'dark'
                            ? 'linear-gradient(45deg, #4CAF50 30%, #66BB6A 90%)'
                            : 'linear-gradient(45deg, #5a6fd8 30%, #694a9e 90%)',
                          transform: 'translateY(-3px)',
                          boxShadow: mode === 'dark'
                            ? '0 12px 35px rgba(102, 187, 106, 0.5)'
                            : '0 12px 35px rgba(102, 126, 234, 0.5)',
                        },
                        '&:disabled': {
                          background: mode === 'dark'
                            ? 'linear-gradient(45deg, #555555 30%, #333333 90%)'
                            : 'linear-gradient(45deg, #ccc 30%, #999 90%)',
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
                        py: 2,
                        borderRadius: 3,
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        textTransform: 'none',
                        background: mode === 'dark'
                          ? 'linear-gradient(45deg, #66BB6A 30%, #81C784 90%)'
                          : 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                        boxShadow: mode === 'dark'
                          ? '0 8px 25px rgba(102, 187, 106, 0.4)'
                          : '0 8px 25px rgba(102, 126, 234, 0.4)',
                        color: mode === 'dark' ? '#000000' : '#ffffff',
                        '&:hover': {
                          background: mode === 'dark'
                            ? 'linear-gradient(45deg, #4CAF50 30%, #66BB6A 90%)'
                            : 'linear-gradient(45deg, #5a6fd8 30%, #694a9e 90%)',
                          transform: 'translateY(-3px)',
                          boxShadow: mode === 'dark'
                            ? '0 12px 35px rgba(102, 187, 106, 0.5)'
                            : '0 12px 35px rgba(102, 126, 234, 0.5)',
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      Next Step
                    </Button>
                  )}
                  
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
                      borderColor: mode === 'dark' ? '#66BB6A' : '#667eea',
                      color: mode === 'dark' ? '#66BB6A' : '#667eea',
                      fontWeight: 600,
                      '&:hover': {
                        borderWidth: 2,
                        borderColor: mode === 'dark' ? '#4CAF50' : '#5a6fd8',
                        color: mode === 'dark' ? '#4CAF50' : '#5a6fd8',
                        transform: 'translateY(-2px)',
                        boxShadow: mode === 'dark'
                          ? '0 8px 25px rgba(102, 187, 106, 0.2)'
                          : '0 8px 25px rgba(102, 126, 234, 0.2)'
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
                </Box>

                {/* Tips */}
                <Box sx={{ mt: 'auto' }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#667eea' }}>
                    Quick Tips
                  </Typography>
                  <Stack spacing={1.5}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <Box sx={{ color: '#4caf50', fontSize: '1rem' }}>💡</Box>
                      <Typography variant="body2" color="text.secondary">
                        Choose your role carefully - it affects the features you'll see
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <Box sx={{ color: mode === 'dark' ? '#66BB6A' : '#4caf50', fontSize: '1rem' }}>🔒</Box>
                      <Typography variant="body2" color="text.secondary">
                        Use a strong password to keep your account secure
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <Box sx={{ color: mode === 'dark' ? '#66BB6A' : '#4caf50', fontSize: '1rem' }}>✨</Box>
                      <Typography variant="body2" color="text.secondary">
                        Complete your profile to get better job matches
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                {/* Sign in link for desktop */}
                <Box sx={{ textAlign: 'center', mt: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Already have an account?
                  </Typography>
                  <Button
                    component={RouterLink}
                    to={redirectType === 'job' && jobId ? `/login?redirect=job&jobId=${jobId}` : "/login"}
                    variant="text"
                    sx={{
                      fontWeight: 600,
                      textTransform: 'none',
                      color: mode === 'dark' ? '#66BB6A' : '#667eea',
                      '&:hover': {
                        color: mode === 'dark' ? '#4CAF50' : '#5a6fd8',
                        textDecoration: 'underline'
                      }
                    }}
                  >
                    Sign In Instead
                  </Button>
                </Box>
              </Box>
            
            {/* Mobile Navigation Buttons */}
            <Box sx={{ 
              display: { xs: 'flex', md: 'none' }, 
              flexDirection: 'column',
              gap: 2,
              mt: 4,
              px: 2
            }}>
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
                    borderColor: mode === 'dark' ? '#66BB6A' : '#667eea',
                    color: mode === 'dark' ? '#66BB6A' : '#667eea',
                    fontWeight: 600,
                    fontSize: '1rem',
                    '&:hover': {
                      borderWidth: 2,
                      borderColor: mode === 'dark' ? '#4CAF50' : '#5a6fd8',
                      color: mode === 'dark' ? '#4CAF50' : '#5a6fd8',
                      transform: 'translateY(-2px)',
                      boxShadow: mode === 'dark'
                        ? '0 8px 25px rgba(102, 187, 106, 0.3)'
                        : '0 8px 25px rgba(102, 126, 234, 0.2)'
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
                      background: mode === 'dark'
                        ? 'linear-gradient(45deg, #66BB6A 30%, #81C784 90%)'
                        : 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                      boxShadow: mode === 'dark'
                        ? '0 8px 25px rgba(102, 187, 106, 0.4)'
                        : '0 8px 25px rgba(102, 126, 234, 0.4)',
                      textTransform: 'none',
                      color: mode === 'dark' ? '#000000' : '#ffffff',
                      '&:hover': {
                        background: mode === 'dark'
                          ? 'linear-gradient(45deg, #4CAF50 30%, #66BB6A 90%)'
                          : 'linear-gradient(45deg, #5a6fd8 30%, #694a9e 90%)',
                        transform: 'translateY(-3px)',
                        boxShadow: mode === 'dark'
                          ? '0 12px 35px rgba(102, 187, 106, 0.5)'
                          : '0 12px 35px rgba(102, 126, 234, 0.5)',
                      },
                      '&:disabled': {
                        background: mode === 'dark'
                          ? 'linear-gradient(45deg, #555555 30%, #333333 90%)'
                          : 'linear-gradient(45deg, #ccc 30%, #999 90%)',
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
                      background: mode === 'dark'
                        ? 'linear-gradient(45deg, #66BB6A 30%, #81C784 90%)'
                        : 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                      boxShadow: mode === 'dark'
                        ? '0 8px 25px rgba(102, 187, 106, 0.4)'
                        : '0 8px 25px rgba(102, 126, 234, 0.4)',
                      color: mode === 'dark' ? '#000000' : '#ffffff',
                      '&:hover': {
                        background: mode === 'dark'
                          ? 'linear-gradient(45deg, #4CAF50 30%, #66BB6A 90%)'
                          : 'linear-gradient(45deg, #5a6fd8 30%, #694a9e 90%)',
                        transform: 'translateY(-3px)',
                        boxShadow: mode === 'dark'
                          ? '0 12px 35px rgba(102, 187, 106, 0.5)'
                          : '0 12px 35px rgba(102, 126, 234, 0.5)',
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Next Step
                  </Button>
                )}
              </Box>
              
              {/* Mobile Sign In Section */}
              <Box sx={{ display: { xs: 'block', md: 'none' } }}>
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
                    to={redirectType === 'job' && jobId ? `/login?redirect=job&jobId=${jobId}` : "/login"}
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
            </Box>
          </Paper>
        </Slide>
      </Container>
      
      {/* Floating Contact Button */}
      <FloatingContact />
      
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

export default RegisterPage;
import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink, useSearchParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Link,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Person,
  PersonAdd,
  Home as HomeIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth';
import { RegisterForm, UserRole } from '../../shared/types';
import GoogleAuthButton from '../../components/Auth/GoogleAuthButton';
import RoleSelectionModal from '../../components/Auth/RoleSelectionModal';
import { googleAuthService } from '../../services/googleAuthService';
import { loginRedirectService } from '../../services/loginRedirectService';

// Type for form validation errors
type RegisterFormErrors = {
  [K in keyof RegisterForm]?: string;
};

const RegisterPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [googleUserData, setGoogleUserData] = useState<any>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [interests, setInterests] = useState<any>(null);

  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [formData, setFormData] = useState<RegisterForm>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: UserRole.STUDENT
  });

  const [errors, setErrors] = useState<RegisterFormErrors>({});

  // Load interests from URL parameters on component mount
  useEffect(() => {
    const interestsParam = searchParams.get('interests');
    if (interestsParam) {
      try {
        const interestsData = JSON.parse(decodeURIComponent(interestsParam));
        setInterests(interestsData);
        console.log('📚 Interests loaded from URL:', interestsData);
      } catch (error) {
        console.error('Error parsing interests from URL:', error);
      }
    }
  }, [searchParams]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof RegisterFormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSelectChange = (event: any) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user makes selection
    if (errors[name as keyof RegisterFormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: RegisterFormErrors = {};
    
    // First name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    } else if (formData.firstName.trim().length > 50) {
      newErrors.firstName = 'First name cannot exceed 50 characters';
    }
    
    // Last name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    } else if (formData.lastName.trim().length > 50) {
      newErrors.lastName = 'Last name cannot exceed 50 characters';
    }
    
    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one lowercase letter, one uppercase letter, and one number';
    }
    
    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    // Role validation
    if (!formData.role) {
      newErrors.role = 'Role is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const registerResult = await register(formData);
      toast.success('Registration successful! Please check your email to verify your account.');
      
      // Check for pending enrollment
      const pendingCourseId = localStorage.getItem('pendingEnrollment');
      if (pendingCourseId && formData.role === UserRole.STUDENT) {
        // Clear the pending enrollment and redirect to course detail page
        localStorage.removeItem('pendingEnrollment');
        navigate(`/courses/${pendingCourseId}`, { replace: true });
        return;
      }
      
      // Use the user data from the register result directly
      try {
        // Get the appropriate redirect path based on user role and enrollments
        const redirectPath = await loginRedirectService.getRedirectPath({
          userRole: formData.role,
          interests,
          from: '/'
        });
        
        navigate(redirectPath, { replace: true });
      } catch (redirectError) {
        console.warn('Error determining redirect path:', redirectError);
        // Fallback to original logic
        if (interests) {
          const interestsParam = encodeURIComponent(JSON.stringify(interests));
          navigate(`/dashboard/student/courses?tab=discover&interests=${interestsParam}`);
        } else {
          navigate('/');
        }
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleToggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleGoogleAuthSuccess = async (result: any) => {
    if (result.requiresRoleSelection && result.googleUserData) {
      // New user - show role selection modal
      setGoogleUserData(result.googleUserData);
      setShowRoleSelection(true);
    } else if (result.user && result.token) {
      // Existing user - direct login success
      toast.success(`Welcome back, ${result.user.firstName}!`);
      
      // Use the user data from the result directly
      try {
        // Get the appropriate redirect path based on user role and enrollments
        const redirectPath = await loginRedirectService.getRedirectPath({
          userRole: result.user?.role || UserRole.STUDENT,
          interests,
          from: '/'
        });
        
        navigate(redirectPath, { replace: true });
      } catch (redirectError) {
        console.warn('Error determining redirect path:', redirectError);
        // Fallback to original logic
        if (interests) {
          const interestsParam = encodeURIComponent(JSON.stringify(interests));
          navigate(`/dashboard/student/courses?tab=discover&interests=${interestsParam}`);
        } else {
          navigate('/');
        }
      }
      
      // Trigger auth context update
      window.location.reload();
    }
  };

  const handleGoogleAuthError = (error: string) => {
    console.error('🔍 Google Auth Error:', error);
    
    // Handle rate limiting errors with user-friendly message
    if (error.includes('429') || error.includes('Too Many Requests') || error.includes('Server is currently busy')) {
      setError('Server is currently busy. Please wait a moment and try again, or use email/password registration.');
    } else {
      setError(error);
    }
  };

  const handleRoleSelectionSubmit = async (role: UserRole) => {
    setIsGoogleLoading(true);
    try {
      const result = await googleAuthService.completeRegistration({
        role,
        platform: 'elearning',
        email: googleUserData?.email || '',
        firstName: googleUserData?.firstName || '',
        lastName: googleUserData?.lastName || '',
        googleId: googleUserData?.googleId || '',
        profilePicture: googleUserData?.profilePicture || '',
        googleUserData
      });

      if (result.user && result.token) {
        toast.success(`Welcome to Excellence Coaching Hub, ${result.user.firstName}!`);
        setShowRoleSelection(false);
        
        // Check for pending enrollment
        const pendingCourseId = localStorage.getItem('pendingEnrollment');
        if (pendingCourseId && role === UserRole.STUDENT) {
          // Clear the pending enrollment and redirect to course detail page
          localStorage.removeItem('pendingEnrollment');
          navigate(`/courses/${pendingCourseId}`, { replace: true });
          return;
        }
        
        // Use the user data from the result directly
        try {
          // Get the appropriate redirect path based on user role and enrollments
          const redirectPath = await loginRedirectService.getRedirectPath({
            userRole: role,
            interests,
            from: '/'
          });
          
          navigate(redirectPath, { replace: true });
        } catch (redirectError) {
          console.warn('Error determining redirect path:', redirectError);
          // Fallback to original logic
          if (interests) {
            const interestsParam = encodeURIComponent(JSON.stringify(interests));
            navigate(`/dashboard/student/courses?tab=discover&interests=${interestsParam}`);
          } else {
            navigate('/');
          }
        }
        
        // Trigger auth context update
        window.location.reload();
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Registration completion failed';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleRoleSelectionClose = () => {
    setShowRoleSelection(false);
    setGoogleUserData(null);
  };

  return (
    <>
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `
          linear-gradient(135deg, #4facfe 0%, #00f2fe 25%, #43e97b 50%, #38f9d7 75%, #667eea 100%),
          linear-gradient(45deg, rgba(0,0,0,0.7) 0%, transparent 50%, rgba(255,255,255,0.1) 100%)
        `,
        backgroundSize: '400% 400%',
        animation: 'gradientShift 15s ease infinite',
        '@keyframes gradientShift': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' }
        },
        position: 'relative',
        overflow: 'hidden',
        py: 4
      }}
    >
      {/* Glassmorphism Background Elements */}
      <Box
        sx={{
          position: 'absolute',
          top: '10%',
          right: '5%',
          width: 180,
          height: 180,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          animation: 'float 12s ease-in-out infinite',
          '@keyframes float': {
            '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
            '50%': { transform: 'translateY(-40px) rotate(180deg)' }
          }
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '15%',
          left: '8%',
          width: 120,
          height: 120,
          borderRadius: 3,
          background: 'rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(15px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          animation: 'float 10s ease-in-out infinite reverse',
          transform: 'rotate(45deg)'
        }}
      />

      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
        <Paper
          elevation={0}
          sx={{
            padding: { xs: 4, md: 6 },
            width: '100%',
            borderRadius: 4,
            position: 'relative',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 30px 80px rgba(0, 0, 0, 0.3)',
            overflow: 'hidden'
          }}
        >
          {/* Decorative Gradient Overlay */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 6,
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 25%, #43e97b 50%, #38f9d7 75%, #667eea 100%)',
              borderTopLeftRadius: 4,
              borderTopRightRadius: 4
            }}
          />

          {/* Back to Home Button */}
          <Box sx={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }}>
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
                borderColor: 'rgba(79, 172, 254, 0.3)',
                color: '#4facfe',
                fontSize: '0.8rem',
                px: 2,
                py: 0.8,
                backdropFilter: 'blur(10px)',
                bgcolor: 'rgba(79, 172, 254, 0.05)',
                '&:hover': {
                  borderColor: '#4facfe',
                  bgcolor: 'rgba(79, 172, 254, 0.1)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(79, 172, 254, 0.2)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              Home
            </Button>
          </Box>

          {/* Header */}
          <Box textAlign="center" mb={4} sx={{ mt: 2 }}>
            <Box sx={{ mb: 3 }}>
              <Box
                sx={{
                  display: 'inline-flex',
                  p: 3,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  mb: 2,
                  boxShadow: '0 15px 35px rgba(79, 172, 254, 0.3)'
                }}
              >
                <PersonAdd sx={{ fontSize: 32, color: 'white' }} />
              </Box>
            </Box>
            
            <Typography
              component="h1"
              variant="h3"
              gutterBottom
              sx={{
                fontWeight: 800,
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 50%, #43e97b 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2
              }}
            >
              Join Excellence
            </Typography>
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                color: 'text.primary',
                fontWeight: 600,
                mb: 1
              }}
            >
              Excellence Coaching Hub
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ opacity: 0.8 }}>
              Create your account and unlock a world of learning opportunities designed to empower your future
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Registration Form */}
          <Box component="form" onSubmit={onSubmit} noValidate>
            {/* Name Fields Row */}
            <Box display="flex" gap={2}>
              {/* First Name Field */}
              <TextField
                name="firstName"
                fullWidth
                label="First Name"
                margin="normal"
                value={formData.firstName}
                onChange={handleInputChange}
                error={!!errors.firstName}
                helperText={errors.firstName}
                disabled={isLoading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    bgcolor: 'rgba(79, 172, 254, 0.02)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      bgcolor: 'rgba(79, 172, 254, 0.05)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(79, 172, 254, 0.1)'
                    },
                    '&.Mui-focused': {
                      bgcolor: 'rgba(79, 172, 254, 0.05)',
                      boxShadow: '0 0 0 3px rgba(79, 172, 254, 0.1)'
                    }
                  },
                  '& .MuiInputLabel-root': {
                    fontWeight: 500
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person sx={{ color: '#4facfe' }} />
                    </InputAdornment>
                  )
                }}
              />

              {/* Last Name Field */}
              <TextField
                name="lastName"
                fullWidth
                label="Last Name"
                margin="normal"
                value={formData.lastName}
                onChange={handleInputChange}
                error={!!errors.lastName}
                helperText={errors.lastName}
                disabled={isLoading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    bgcolor: 'rgba(79, 172, 254, 0.02)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      bgcolor: 'rgba(79, 172, 254, 0.05)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(79, 172, 254, 0.1)'
                    },
                    '&.Mui-focused': {
                      bgcolor: 'rgba(79, 172, 254, 0.05)',
                      boxShadow: '0 0 0 3px rgba(79, 172, 254, 0.1)'
                    }
                  },
                  '& .MuiInputLabel-root': {
                    fontWeight: 500
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person sx={{ color: '#4facfe' }} />
                    </InputAdornment>
                  )
                }}
              />
            </Box>

            {/* Email Field */}
            <TextField
              name="email"
              fullWidth
              label="Email Address"
              type="email"
              margin="normal"
              value={formData.email}
              onChange={handleInputChange}
              error={!!errors.email}
              helperText={errors.email}
              disabled={isLoading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  bgcolor: 'rgba(79, 172, 254, 0.02)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: 'rgba(79, 172, 254, 0.05)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(79, 172, 254, 0.1)'
                  },
                  '&.Mui-focused': {
                    bgcolor: 'rgba(79, 172, 254, 0.05)',
                    boxShadow: '0 0 0 3px rgba(79, 172, 254, 0.1)'
                  }
                },
                '& .MuiInputLabel-root': {
                  fontWeight: 500
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email sx={{ color: '#4facfe' }} />
                  </InputAdornment>
                )
              }}
            />

            {/* Role Selection */}
            <FormControl
              fullWidth
              margin="normal"
              error={!!errors.role}
              disabled={isLoading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  bgcolor: 'rgba(79, 172, 254, 0.02)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: 'rgba(79, 172, 254, 0.05)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(79, 172, 254, 0.1)'
                  },
                  '&.Mui-focused': {
                    bgcolor: 'rgba(79, 172, 254, 0.05)',
                    boxShadow: '0 0 0 3px rgba(79, 172, 254, 0.1)'
                  }
                },
                '& .MuiInputLabel-root': {
                  fontWeight: 500
                }
              }}
            >
              <InputLabel>I am a...</InputLabel>
              <Select
                name="role"
                value={formData.role}
                onChange={handleSelectChange}
                label="I am a..."
              >
                <MenuItem value={UserRole.STUDENT}>🎓 Student / Learner</MenuItem>
                <MenuItem value={UserRole.TEACHER}>👨‍🏫 Teacher / Instructor</MenuItem>
              </Select>
              {errors.role && (
                <FormHelperText>{errors.role}</FormHelperText>
              )}
            </FormControl>

            {/* Password Field */}
            <TextField
              name="password"
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              margin="normal"
              value={formData.password}
              onChange={handleInputChange}
              error={!!errors.password}
              helperText={errors.password}
              disabled={isLoading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  bgcolor: 'rgba(79, 172, 254, 0.02)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: 'rgba(79, 172, 254, 0.05)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(79, 172, 254, 0.1)'
                  },
                  '&.Mui-focused': {
                    bgcolor: 'rgba(79, 172, 254, 0.05)',
                    boxShadow: '0 0 0 3px rgba(79, 172, 254, 0.1)'
                  }
                },
                '& .MuiInputLabel-root': {
                  fontWeight: 500
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: '#4facfe' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleTogglePasswordVisibility}
                      edge="end"
                      disabled={isLoading}
                      sx={{
                        color: '#4facfe',
                        '&:hover': {
                          bgcolor: 'rgba(79, 172, 254, 0.1)'
                        }
                      }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            {/* Confirm Password Field */}
            <TextField
              name="confirmPassword"
              fullWidth
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              margin="normal"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              disabled={isLoading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  bgcolor: 'rgba(79, 172, 254, 0.02)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: 'rgba(79, 172, 254, 0.05)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(79, 172, 254, 0.1)'
                  },
                  '&.Mui-focused': {
                    bgcolor: 'rgba(79, 172, 254, 0.05)',
                    boxShadow: '0 0 0 3px rgba(79, 172, 254, 0.1)'
                  }
                },
                '& .MuiInputLabel-root': {
                  fontWeight: 500
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: '#4facfe' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleToggleConfirmPasswordVisibility}
                      edge="end"
                      disabled={isLoading}
                      sx={{
                        color: '#4facfe',
                        '&:hover': {
                          bgcolor: 'rgba(79, 172, 254, 0.1)'
                        }
                      }}
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <PersonAdd />}
              sx={{
                mt: 4,
                mb: 3,
                py: 2,
                borderRadius: 3,
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                fontSize: '1.1rem',
                fontWeight: 700,
                textTransform: 'none',
                boxShadow: '0 8px 32px rgba(79, 172, 254, 0.4)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4287f5 0%, #00d9fe 100%)',
                  transform: 'translateY(-3px)',
                  boxShadow: '0 12px 40px rgba(79, 172, 254, 0.6)'
                },
                '&:disabled': {
                  background: 'linear-gradient(135deg, #a0a0a0 0%, #808080 100%)',
                  color: 'rgba(255, 255, 255, 0.7)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>

            {/* Google Sign Up */}
            <Divider sx={{ my: 3 }}>
              <Typography variant="body2" color="text.secondary">
                OR
              </Typography>
            </Divider>

            <GoogleAuthButton
              onSuccess={handleGoogleAuthSuccess}
              onError={handleGoogleAuthError}
              disabled={isLoading}
              variant="register"
            />
            
            {/* Retry button for rate limiting */}
            {error && (error.includes('Server is currently busy') || error.includes('429')) && (
              <Button
                variant="outlined"
                fullWidth
                onClick={() => {
                  setError(null);
                  // Retry Google auth after a delay
                  setTimeout(() => {
                    handleGoogleAuth();
                  }, 2000);
                }}
                sx={{ mt: 1 }}
              >
                Retry Google Sign-In
              </Button>
            )}

            {/* Divider */}
            <Divider sx={{ my: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Already have an account?
              </Typography>
            </Divider>

            {/* Login Link */}
            <Button
              component={RouterLink}
              to={interests ? `/login?interests=${encodeURIComponent(JSON.stringify(interests))}` : "/login"}
              fullWidth
              variant="outlined"
              size="large"
              disabled={isLoading}
              sx={{
                py: 2,
                borderRadius: 3,
                borderColor: '#4facfe',
                color: '#4facfe',
                fontSize: '1rem',
                fontWeight: 600,
                textTransform: 'none',
                borderWidth: 2,
                bgcolor: 'rgba(79, 172, 254, 0.05)',
                '&:hover': {
                  borderColor: '#4facfe',
                  bgcolor: 'rgba(79, 172, 254, 0.1)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(79, 172, 254, 0.2)',
                  borderWidth: 2
                },
                transition: 'all 0.3s ease'
              }}
            >
              Sign In to Existing Account
            </Button>
          </Box>
        </Paper>
      </Container>

      {/* Role Selection Modal for new Google users */}
      {googleUserData && (
        <RoleSelectionModal
          open={showRoleSelection}
          onClose={handleRoleSelectionClose}
          onSubmit={handleRoleSelectionSubmit}
          googleUserData={googleUserData}
          isLoading={isGoogleLoading}
        />
      )}
    </Box>
    </>
  );
};

export default RegisterPage;

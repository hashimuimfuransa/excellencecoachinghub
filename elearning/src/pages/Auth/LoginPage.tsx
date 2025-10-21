import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link as RouterLink, useSearchParams } from 'react-router-dom';
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
  Divider
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Login as LoginIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth';
import { LoginForm, UserRole } from '../../shared/types';
import GoogleAuthButton from '../../components/Auth/GoogleAuthButton';
import RoleSelectionModal from '../../components/Auth/RoleSelectionModal';
import { googleAuthService } from '../../services/googleAuthService';
import { loginRedirectService } from '../../services/loginRedirectService';

// Validation rules
const validationRules = {
  email: {
    required: 'Email is required',
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: 'Please enter a valid email address'
    }
  },
  password: {
    required: 'Password is required',
    minLength: { value: 8, message: 'Password must be at least 8 characters' }
  }
};

const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [googleUserData, setGoogleUserData] = useState<any>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [interests, setInterests] = useState<any>(null);

  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Get redirect path from location state
  const from = (location.state as any)?.from?.pathname || '/';

  const [formData, setFormData] = useState<LoginForm>({
    email: '',
    password: ''
  });
  
  const [errors, setErrors] = useState<Partial<LoginForm>>({});

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

  const handleInputChange = (field: keyof LoginForm) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginForm> = {};
    
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.password.trim()) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
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
      const loginResult = await login(formData.email, formData.password);
      toast.success('Login successful!');
      
      // Check for pending enrollment
      const pendingCourseId = localStorage.getItem('pendingEnrollment');
      if (pendingCourseId && loginResult?.user?.role === UserRole.STUDENT) {
        // Clear the pending enrollment and redirect to course detail page
        localStorage.removeItem('pendingEnrollment');
        navigate(`/courses/${pendingCourseId}`, { replace: true });
        return;
      }
      
      // Use the user data from the login result directly
      try {
        console.log('Login result:', loginResult);
        // Get the appropriate redirect path based on user role and enrollments
        const redirectPath = await loginRedirectService.getRedirectPath({
          userRole: loginResult?.user?.role || UserRole.STUDENT,
          interests,
          from
        });
        
        console.log('Redirecting to:', redirectPath);
        navigate(redirectPath, { replace: true });
      } catch (redirectError) {
        console.warn('Error determining redirect path:', redirectError);
        // Fallback to original logic
        if (interests) {
          const interestsParam = encodeURIComponent(JSON.stringify(interests));
          navigate(`/dashboard/student/courses?tab=discover&interests=${interestsParam}`, { replace: true });
        } else {
          navigate(from, { replace: true });
        }
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Login failed. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleGoogleAuthSuccess = async (result: any) => {
    if (result.requiresRoleSelection && result.googleUserData) {
      // New user - show role selection modal
      setGoogleUserData(result.googleUserData);
      setShowRoleSelection(true);
    } else if (result.user && result.token) {
      // Existing user - direct login success
      toast.success(`Welcome back, ${result.user.firstName}!`);
      
      // Check for pending enrollment
      const pendingCourseId = localStorage.getItem('pendingEnrollment');
      if (pendingCourseId && result.user?.role === UserRole.STUDENT) {
        // Clear the pending enrollment and redirect to course detail page
        localStorage.removeItem('pendingEnrollment');
        navigate(`/courses/${pendingCourseId}`, { replace: true });
        return;
      }
      
      // Use the user data from the result directly
      try {
        console.log('Google Auth result:', result);
        // Get the appropriate redirect path based on user role and enrollments
        const redirectPath = await loginRedirectService.getRedirectPath({
          userRole: result.user?.role || UserRole.STUDENT,
          interests,
          from
        });
        
        console.log('Redirecting to:', redirectPath);
        navigate(redirectPath, { replace: true });
      } catch (redirectError) {
        console.warn('Error determining redirect path:', redirectError);
        // Fallback to original logic
        if (interests) {
          const interestsParam = encodeURIComponent(JSON.stringify(interests));
          navigate(`/dashboard/student/courses?tab=discover&interests=${interestsParam}`, { replace: true });
        } else {
          navigate(from, { replace: true });
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
      setError('Server is currently busy. Please wait a moment and try again, or use email/password login.');
    } else {
      setError(error);
    }
  };

  const handleRoleSelectionSubmit = async (role: UserRole) => {
    setIsGoogleLoading(true);
    try {
      console.log('🔍 Role Selection Submit - Selected role:', role);
      console.log('🔍 Role Selection Submit - UserRole.STUDENT:', UserRole.STUDENT);
      console.log('🔍 Role Selection Submit - Role comparison:', role === UserRole.STUDENT);
      
      const result = await googleAuthService.completeRegistration({
        role,
        platform: 'elearning',
        email: googleUserData?.email || '',
        firstName: googleUserData?.firstName || '',
        lastName: googleUserData?.lastName || '',
        googleId: googleUserData?.googleId || '',
        profilePicture: googleUserData?.profilePicture || '',
        googleUserData: {
          ...googleUserData,
          platform: 'elearning'
        }
      });

      console.log('🔍 Role Selection Submit - Result user:', result.user);
      console.log('🔍 Role Selection Submit - Result user role:', result.user?.role);

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
        
        // If interests were provided, redirect to courses with interests
        if (interests) {
          const interestsParam = encodeURIComponent(JSON.stringify(interests));
          navigate(`/dashboard/student/courses?tab=discover&interests=${interestsParam}`, { replace: true });
        } else {
          navigate(from, { replace: true });
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
          linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%),
          linear-gradient(45deg, rgba(0,0,0,0.8) 0%, transparent 50%, rgba(255,255,255,0.1) 100%)
        `,
        backgroundSize: '400% 400%',
        animation: 'gradientShift 12s ease infinite',
        '@keyframes gradientShift': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' }
        },
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Glassmorphism Background Elements */}
      <Box
        sx={{
          position: 'absolute',
          top: '20%',
          right: '10%',
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          animation: 'float 8s ease-in-out infinite',
          '@keyframes float': {
            '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
            '50%': { transform: 'translateY(-30px) rotate(180deg)' }
          }
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '20%',
          left: '15%',
          width: 150,
          height: 150,
          borderRadius: 3,
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(15px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          animation: 'float 10s ease-in-out infinite reverse',
          transform: 'rotate(45deg)'
        }}
      />

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
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
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%)',
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
                borderColor: 'rgba(102, 126, 234, 0.3)',
                color: '#667eea',
                fontSize: '0.8rem',
                px: 2,
                py: 0.8,
                backdropFilter: 'blur(10px)',
                bgcolor: 'rgba(102, 126, 234, 0.05)',
                '&:hover': {
                  borderColor: '#667eea',
                  bgcolor: 'rgba(102, 126, 234, 0.1)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(102, 126, 234, 0.2)'
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
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  mb: 2,
                  boxShadow: '0 15px 35px rgba(102, 126, 234, 0.3)'
                }}
              >
                <LoginIcon sx={{ fontSize: 32, color: 'white' }} />
              </Box>
            </Box>
            
            <Typography
              component="h1"
              variant="h3"
              gutterBottom
              sx={{
                fontWeight: 800,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2
              }}
            >
              Welcome Back
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
              Sign in to continue your learning journey and unlock your potential
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Login Form */}
          <Box component="form" onSubmit={onSubmit}>
            {/* Email Field */}
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              margin="normal"
              value={formData.email}
              onChange={handleInputChange('email')}
              error={!!errors.email}
              helperText={errors.email}
              disabled={isLoading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  bgcolor: 'rgba(102, 126, 234, 0.02)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: 'rgba(102, 126, 234, 0.05)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.1)'
                  },
                  '&.Mui-focused': {
                    bgcolor: 'rgba(102, 126, 234, 0.05)',
                    boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)'
                  }
                },
                '& .MuiInputLabel-root': {
                  fontWeight: 500
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email sx={{ color: '#667eea' }} />
                  </InputAdornment>
                )
              }}
            />

            {/* Password Field */}
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              margin="normal"
              value={formData.password}
              onChange={handleInputChange('password')}
              error={!!errors.password}
              helperText={errors.password}
              disabled={isLoading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  bgcolor: 'rgba(102, 126, 234, 0.02)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: 'rgba(102, 126, 234, 0.05)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.1)'
                  },
                  '&.Mui-focused': {
                    bgcolor: 'rgba(102, 126, 234, 0.05)',
                    boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)'
                  }
                },
                '& .MuiInputLabel-root': {
                  fontWeight: 500
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: '#667eea' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleTogglePasswordVisibility}
                      edge="end"
                      disabled={isLoading}
                      sx={{
                        color: '#667eea',
                        '&:hover': {
                          bgcolor: 'rgba(102, 126, 234, 0.1)'
                        }
                      }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            {/* Forgot Password Link */}
            <Box textAlign="right" mt={1} mb={2}>
              <Link
                component={RouterLink}
                to="/forgot-password"
                variant="body2"
                color="primary"
              >
                Forgot your password?
              </Link>
            </Box>

            {/* Submit Button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
              sx={{
                mt: 3,
                mb: 2,
                py: 2,
                borderRadius: 3,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                fontSize: '1.1rem',
                fontWeight: 700,
                textTransform: 'none',
                boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                  transform: 'translateY(-3px)',
                  boxShadow: '0 12px 40px rgba(102, 126, 234, 0.6)'
                },
                '&:disabled': {
                  background: 'linear-gradient(135deg, #a0a0a0 0%, #808080 100%)',
                  color: 'rgba(255, 255, 255, 0.7)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              {isLoading ? 'Signing In...' : 'Sign In to Your Account'}
            </Button>

            {/* Google Sign In */}
            <Divider sx={{ my: 3 }}>
              <Typography variant="body2" color="text.secondary">
                OR
              </Typography>
            </Divider>

            <GoogleAuthButton
              onSuccess={handleGoogleAuthSuccess}
              onError={handleGoogleAuthError}
              disabled={isLoading}
              variant="login"
            />
            
            {/* Retry button for rate limiting */}
            {error && (error.includes('Server is currently busy') || error.includes('429')) && (
              <Button
                variant="outlined"
                fullWidth
                onClick={() => {
                  setError(null);
                  // Retry by reloading the page to reset Google auth state
                  window.location.reload();
                }}
                sx={{ mt: 1 }}
              >
                Retry Google Sign-In
              </Button>
            )}

            {/* Divider */}
            <Divider sx={{ my: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Don't have an account?
              </Typography>
            </Divider>

            {/* Register Link */}
            <Button
              component={RouterLink}
              to={interests ? `/register?interests=${encodeURIComponent(JSON.stringify(interests))}` : "/register"}
              fullWidth
              variant="outlined"
              size="large"
              disabled={isLoading}
              sx={{
                py: 2,
                borderRadius: 3,
                borderColor: '#667eea',
                color: '#667eea',
                fontSize: '1rem',
                fontWeight: 600,
                textTransform: 'none',
                borderWidth: 2,
                bgcolor: 'rgba(102, 126, 234, 0.05)',
                '&:hover': {
                  borderColor: '#667eea',
                  bgcolor: 'rgba(102, 126, 234, 0.1)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(102, 126, 234, 0.2)',
                  borderWidth: 2
                },
                transition: 'all 0.3s ease'
              }}
            >
              Create New Account
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

export default LoginPage;

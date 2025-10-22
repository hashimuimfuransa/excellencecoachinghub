import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Link,
  Divider,
  IconButton,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Google,
  ArrowBack,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { useThemeContext } from '../contexts/ThemeContext';

const schema = yup.object({
  email: yup
    .string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
});

interface LoginFormData {
  email: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, loginWithGoogle, user } = useAuth();
  const { isDarkMode } = useThemeContext();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const getRedirectUrl = (userRole: string) => {
    if (userRole === 'student' || userRole === 'teacher') {
      return 'https://elearning.excellencecoachinghub.com';
    } else if (userRole === 'job_seeker' || userRole === 'employer') {
      return 'https://exjobnet.com';
    }
    return '/dashboard'; // fallback
  };

  const onSubmit = async (data: LoginFormData) => {
    try {
      setLoading(true);
      await login(data.email, data.password);
      toast.success('Login successful! Welcome back.');
      
      // Redirect based on user role - user will be updated in context after login
      setTimeout(() => {
        const redirectUrl = getRedirectUrl(user?.role || '');
        if (redirectUrl.startsWith('http')) {
          window.location.href = redirectUrl;
        } else {
          navigate(redirectUrl);
        }
      }, 100); // Small delay to ensure user state is updated
    } catch (error: any) {
      toast.error(error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      
      // Show initial loading message
      toast.info('Opening Google sign-in...', { autoClose: 2000 });
      
      const result = await loginWithGoogle();
      
      // Check if user needs to select a role
      if (result.requiresRoleSelection) {
        toast.info('Please select your role to complete registration.');
        navigate('/select-role', { 
          state: { googleUserData: result.googleUserData } 
        });
      } else {
        toast.success('Welcome back! You have successfully signed in with Google.');
        // Redirect based on user role
        setTimeout(() => {
          const redirectUrl = getRedirectUrl(user?.role || '');
          if (redirectUrl.startsWith('http')) {
            window.location.href = redirectUrl;
          } else {
            navigate(redirectUrl);
          }
        }, 100);
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      
      // Show specific error messages based on error type
      if (error.message?.includes('cancelled') || error.message?.includes('closed')) {
        toast.info('Google sign-in was cancelled.');
      } else if (error.message?.includes('configured') || error.message?.includes('Client ID')) {
        toast.error('Google authentication is not properly configured. Please contact support.');
      } else if (error.message?.includes('popup') || error.message?.includes('blocked')) {
        toast.error('Please allow popups for Google sign-in to work properly.');
      } else if (error.message?.includes('network') || error.message?.includes('connection')) {
        toast.error('Network error. Please check your internet connection and try again.');
      } else if (error.message?.includes('not available')) {
        toast.error('Google services are not available. Please try again later.');
      } else {
        toast.error('Unable to sign in with Google. Please try again or use email/password.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: isDarkMode 
          ? 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)'
          : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
        display: 'flex',
        alignItems: 'center',
        py: 4,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated background elements */}
      <Box
        component={motion.div}
        sx={{
          position: 'absolute',
          top: '10%',
          right: '10%',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: isDarkMode 
            ? 'rgba(74, 222, 128, 0.1)'
            : 'rgba(255, 255, 255, 0.05)',
          filter: 'blur(40px)',
          zIndex: 0,
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      <Box
        component={motion.div}
        sx={{
          position: 'absolute',
          bottom: '15%',
          left: '5%',
          width: '250px',
          height: '250px',
          borderRadius: '50%',
          background: isDarkMode 
            ? 'rgba(255, 255, 255, 0.05)'
            : 'rgba(34, 197, 94, 0.1)',
          filter: 'blur(30px)',
          zIndex: 0,
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1,
        }}
      />
      <Container maxWidth="sm">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Paper
            elevation={10}
            sx={{
              p: { xs: 3, md: 5 },
              borderRadius: 3,
              position: 'relative',
              overflow: 'hidden',
              boxShadow: isDarkMode 
                ? '0 20px 60px rgba(0, 0, 0, 0.5)'
                : '0 20px 60px rgba(0, 0, 0, 0.2)',
              background: isDarkMode 
                ? 'rgba(26, 26, 46, 0.95)'
                : 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(10px)',
              zIndex: 1,
            }}
          >
            {/* Background decoration */}
            <Box
              component={motion.div}
              animate={{
                rotate: [0, 360],
              }}
              transition={{
                duration: 40,
                repeat: Infinity,
                ease: 'linear',
              }}
              sx={{
                position: 'absolute',
                top: -80,
                right: -80,
                width: 200,
                height: 200,
                background: isDarkMode 
                  ? 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)'
                  : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                borderRadius: '50%',
                opacity: isDarkMode ? 0.15 : 0.1,
              }}
            />

            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4, position: 'relative', zIndex: 1 }}>
              <IconButton
                onClick={() => navigate('/')}
                sx={{
                  position: 'absolute',
                  left: -16,
                  top: -8,
                  color: 'text.secondary',
                }}
              >
                <ArrowBack />
              </IconButton>

              <Box
                component="img"
                src="/logo1.png"
                alt="Excellence Coaching Hub Logo"
                sx={{
                  height: 110,
                  mx: 'auto',
                  mb: 2,
                  display: 'block',
                }}
              />

              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  mb: 1,
                  background: 'linear-gradient(45deg, #22c55e, #16a34a)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  position: 'relative',
                  display: 'inline-block',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: -8,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '60px',
                    height: '4px',
                    background: 'linear-gradient(45deg, #22c55e, #16a34a)',
                    borderRadius: '2px',
                  }
                }}
              >
                Welcome Back
              </Typography>

              <Typography 
                variant="body1" 
                color="text.secondary"
                sx={{
                  fontSize: '1.1rem',
                  mt: 2,
                  maxWidth: '80%',
                  mx: 'auto',
                }}
              >
                Sign in to continue your learning journey
              </Typography>
            </Box>

            {/* Login Form */}
            <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mb: 3 }}>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Email Address"
                    type="email"
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    sx={{ mb: 3 }}
                    autoComplete="email"
                  />
                )}
              />

              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    error={!!errors.password}
                    helperText={errors.password?.message}
                    sx={{ mb: 3 }}
                    autoComplete="current-password"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />

              <Box sx={{ textAlign: 'right', mb: 3 }}>
                <Link
                  component="button"
                  type="button"
                  variant="body2"
                  onClick={() => navigate('/forgot-password')}
                  sx={{
                    textDecoration: 'none',
                    color: 'primary.main',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  Forgot your password?
                </Link>
              </Box>

              <Button
                component={motion.button}
                whileHover={{ 
                  scale: 1.02,
                  boxShadow: '0 6px 20px rgba(34, 197, 94, 0.4)',
                }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  py: 1.8,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: '30px',
                  background: 'linear-gradient(45deg, #22c55e, #16a34a)',
                  boxShadow: '0 4px 15px rgba(34, 197, 94, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #16a34a, #15803d)',
                  },
                }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Sign In'
                )}
              </Button>
            </Box>

            {/* Social Login */}
            <Box sx={{ mb: 3 }}>
              <Divider sx={{ mb: 3 }}>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ fontWeight: 500 }}
                >
                  OR CONTINUE WITH
                </Typography>
              </Divider>

              <Button
                component={motion.button}
                whileHover={{ 
                  scale: 1.03,
                  boxShadow: '0 4px 12px rgba(219, 68, 55, 0.15)',
                }}
                whileTap={{ scale: 0.97 }}
                fullWidth
                variant="outlined"
                startIcon={googleLoading ? <CircularProgress size={20} /> : <Google sx={{ color: '#DB4437' }} />}
                onClick={handleGoogleLogin}
                disabled={googleLoading || loading}
                sx={{
                  py: 1.5,
                  borderRadius: '30px',
                  borderWidth: '2px',
                  borderColor: 'rgba(219, 68, 55, 0.5)',
                  color: '#DB4437',
                  fontWeight: 500,
                  '&:hover': {
                    borderColor: '#DB4437',
                    bgcolor: 'rgba(219, 68, 55, 0.05)',
                  },
                  '&:disabled': {
                    opacity: 0.6,
                  },
                }}
              >
                {googleLoading ? 'Signing in...' : 'Continue with Google'}
              </Button>
            </Box>

            {/* Register Link */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Don't have an account?{' '}
                <Link
                  component="button"
                  type="button"
                  variant="body2"
                  onClick={() => navigate('/register')}
                  sx={{
                    textDecoration: 'none',
                    color: 'primary.main',
                    fontWeight: 600,
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  Sign up here
                </Link>
              </Typography>
            </Box>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};

export default LoginPage;
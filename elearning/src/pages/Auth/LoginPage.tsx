import React, { useState } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
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

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get redirect path from location state
  const from = (location.state as any)?.from?.pathname || '/';

  const [formData, setFormData] = useState<LoginForm>({
    email: '',
    password: ''
  });
  
  const [errors, setErrors] = useState<Partial<LoginForm>>({});

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
      await login(formData.email, formData.password);
      toast.success('Login successful!');
      navigate(from, { replace: true });
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
      navigate(from, { replace: true });
      
      // Trigger auth context update
      window.location.reload();
    }
  };

  const handleGoogleAuthError = (error: string) => {
    setError(error);
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
        googleUserData: {
          ...googleUserData,
          platform: 'elearning'
        }
      });

      if (result.user && result.token) {
        toast.success(`Welcome to Excellence Coaching Hub, ${result.user.firstName}!`);
        setShowRoleSelection(false);
        navigate(from, { replace: true });
        
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
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minHeight: '80vh'
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            width: '100%',
            borderRadius: 2,
            position: 'relative'
          }}
        >
          {/* Back to Home Button */}
          <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
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
                fontSize: '0.7rem',
                minWidth: 'auto',
                p: 0.5
              }}
            >
              Home
            </Button>
          </Box>

          {/* Header */}
          <Box textAlign="center" mb={3}>
            <Typography
              component="h1"
              variant="h4"
              gutterBottom
              sx={{
                fontWeight: 600,
                color: 'primary.main'
              }}
            >
              Excellence Coaching Hub
            </Typography>
            <Typography variant="h5" gutterBottom>
              Sign In
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Welcome back! Please sign in to your account.
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
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color="action" />
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
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleTogglePasswordVisibility}
                      edge="end"
                      disabled={isLoading}
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
              startIcon={isLoading ? <CircularProgress size={20} /> : <LoginIcon />}
              sx={{
                mt: 2,
                mb: 2,
                py: 1.5
              }}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
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

            {/* Divider */}
            <Divider sx={{ my: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Don't have an account?
              </Typography>
            </Divider>

            {/* Register Link */}
            <Button
              component={RouterLink}
              to="/register"
              fullWidth
              variant="outlined"
              size="large"
              disabled={isLoading}
              sx={{ py: 1.5 }}
            >
              Create New Account
            </Button>
          </Box>
        </Paper>
      </Box>

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
    </Container>
  );
};

export default LoginPage;

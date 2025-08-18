import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link as RouterLink } from 'react-router-dom';
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
  IconButton
} from '@mui/material';
import {
  Lock,
  Visibility,
  VisibilityOff,
  CheckCircle,
  ArrowBack
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { authService } from '../../services/authService';

interface ResetPasswordForm {
  password: string;
  confirmPassword: string;
}

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState<ResetPasswordForm>({
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState<Partial<ResetPasswordForm>>({});

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof ResetPasswordForm]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ResetPasswordForm> = {};
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. No token provided.');
    }
  }, [token]);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!token) {
      setError('Invalid reset token');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await authService.resetPassword(token, formData.password);
      setSuccess(true);
      toast.success('Password reset successful! You are now logged in.');
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to reset password. Please try again.';
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

  if (success) {
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
              textAlign: 'center'
            }}
          >
            <CheckCircle sx={{ fontSize: 60, color: 'success.main', mb: 3 }} />
            
            <Typography variant="h4" gutterBottom color="success.main">
              Password Reset Successful!
            </Typography>
            
            <Typography variant="body1" color="text.secondary" paragraph>
              Your password has been successfully reset. You are now logged in.
            </Typography>
            
            <Typography variant="body2" color="text.secondary" paragraph>
              Redirecting to dashboard...
            </Typography>

            <CircularProgress sx={{ mt: 2 }} />
          </Paper>
        </Box>
      </Container>
    );
  }

  if (!token) {
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
              textAlign: 'center'
            }}
          >
            <Typography variant="h4" gutterBottom color="error.main">
              Invalid Reset Link
            </Typography>
            
            <Typography variant="body1" color="text.secondary" paragraph>
              This password reset link is invalid or has expired.
            </Typography>

            <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                component={RouterLink}
                to="/forgot-password"
              >
                Request New Reset Link
              </Button>
              <Button
                variant="outlined"
                component={RouterLink}
                to="/login"
              >
                Back to Login
              </Button>
            </Box>
          </Paper>
        </Box>
      </Container>
    );
  }

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
            borderRadius: 2
          }}
        >
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
              Reset Password
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Enter your new password below.
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Form */}
          <Box component="form" onSubmit={onSubmit} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="New Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleInputChange}
              error={!!errors.password}
              helperText={errors.password}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock />
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
                ),
              }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm New Password"
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle confirm password visibility"
                      onClick={handleToggleConfirmPasswordVisibility}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isLoading}
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              startIcon={isLoading ? <CircularProgress size={20} /> : <Lock />}
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </Button>

            {/* Links */}
            <Box textAlign="center" mt={2}>
              <Link
                component={RouterLink}
                to="/login"
                variant="body2"
                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}
              >
                <ArrowBack fontSize="small" />
                Back to Login
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default ResetPasswordPage;

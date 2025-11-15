import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
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
  InputAdornment
} from '@mui/material';
import {
  Email,
  ArrowBack,
  Send
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { authService } from '../../services/authService';
import isValid from 'date-fns/isValid';

// Validation rules
const identifierValidation = {
  required: 'Email or phone number is required',
  validate: (value: string) => {
    if (!value) return 'Email or phone number is required';
    
    // Check if it's a valid email
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (emailRegex.test(value)) return true;
    
    // Check if it's a valid phone number (10+ digits, allowing spaces, dashes, parentheses)
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    if (phoneRegex.test(value)) return true;
    
    return 'Please enter a valid email or phone number';
  }
};

interface ForgotPasswordForm {
  identifier: string;
}

const ForgotPasswordPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const [formData, setFormData] = useState<ForgotPasswordForm>({
    identifier: ''
  });
  
  const [errors, setErrors] = useState<Partial<ForgotPasswordForm>>({});

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ identifier: event.target.value });
    // Clear error when user starts typing
    if (errors.identifier) {
      setErrors({});
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ForgotPasswordForm> = {};
    
    if (!formData.identifier.trim()) {
      newErrors.identifier = 'Email or phone number is required';
    } else {
      // Check if it's a valid email
      const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
      // Check if it's a valid phone number (10+ digits, allowing spaces, dashes, parentheses)
      const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
      
      if (!emailRegex.test(formData.identifier) && !phoneRegex.test(formData.identifier)) {
        newErrors.identifier = 'Please enter a valid email or phone number';
      }
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
      await authService.forgotPassword(formData.identifier);
      setSuccess(true);
      toast.success('Password reset email sent! Please check your inbox and spam folder.');
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to send password reset email. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
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
            <Send sx={{ fontSize: 60, color: 'success.main', mb: 3 }} />
            
            <Typography variant="h4" gutterBottom color="success.main">
              Email Sent!
            </Typography>
            
            <Typography variant="body1" color="text.secondary" paragraph>
              We've sent a password reset link to your email address.
              Please check your inbox and follow the instructions to reset your password.
            </Typography>

            <Typography variant="body2" color="text.secondary" paragraph>
              <strong>Note:</strong> The reset link will expire in 1 hour for security reasons.
            </Typography>

            <Typography variant="body2" color="text.secondary" paragraph>
              Didn't receive the email? Check your spam folder or try again.
            </Typography>

            <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="outlined"
                startIcon={<ArrowBack />}
                onClick={() => setSuccess(false)}
              >
                Try Again
              </Button>
              <Button
                variant="contained"
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
              Forgot Password
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Enter your email address and we'll send you a link to reset your password.
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
              id="identifier"
              label="Email or Phone Number"
              name="identifier"
              autoComplete="email"
              autoFocus
              value={formData.identifier}
              onChange={handleInputChange}
              error={!!errors.identifier}
              helperText={errors.identifier}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email />
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={!isValid || isLoading}
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              startIcon={isLoading ? <CircularProgress size={20} /> : <Send />}
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
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

export default ForgotPasswordPage;

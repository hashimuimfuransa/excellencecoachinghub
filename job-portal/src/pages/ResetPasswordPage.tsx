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
  InputAdornment,
  IconButton,
  Grid,
  useTheme,
  useMediaQuery,
  Fade,
  CircularProgress,
  LinearProgress
} from '@mui/material';
import { 
  Lock, 
  Visibility, 
  VisibilityOff,
  ArrowBack,
  CheckCircle,
  Security
} from '@mui/icons-material';
import { useNavigate, useSearchParams, Link as RouterLink } from 'react-router-dom';

const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset.');
    }
  }, [token]);

  useEffect(() => {
    // Calculate password strength
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;
    setPasswordStrength(strength);
  }, [password]);

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 25) return 'error';
    if (passwordStrength < 50) return 'warning';
    if (passwordStrength < 75) return 'info';
    return 'success';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 25) return 'Weak';
    if (passwordStrength < 50) return 'Fair';
    if (passwordStrength < 75) return 'Good';
    return 'Strong';
  };

  const validatePasswords = () => {
    if (!password) {
      setError('Password is required');
      return false;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (passwordStrength < 50) {
      setError('Please choose a stronger password with uppercase letters, numbers, and special characters');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validatePasswords()) {
      return;
    }

    if (!token) {
      setError('Invalid reset token. Please request a new password reset.');
      return;
    }

    setLoading(true);

    try {
      // Use the updated authService method instead of direct fetch
      const { authService } = await import('../services/authService');
      const authResponse = await authService.resetPassword(token, password);
      
      setSuccess(true);
      
      // Navigate to login page after a short delay
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Password reset successful! Please sign in with your new password.' 
          } 
        });
      }, 2000);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          background: 'linear-gradient(135deg, #4ade80 0%, #16a34a 50%, #14532d 100%)',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Container component="main" maxWidth="sm">
          <Fade in={true} timeout={800}>
            <Paper
              elevation={12}
              sx={{
                p: { xs: 3, sm: 5 },
                borderRadius: 4,
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.95)'
              }}
            >
              <CheckCircle 
                sx={{ 
                  fontSize: 80, 
                  color: 'success.main', 
                  mb: 3 
                }} 
              />
              
              <Typography 
                variant="h4" 
                component="h1" 
                gutterBottom 
                fontWeight="bold"
                color="success.main"
              >
                Password Reset Successful!
              </Typography>
              
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.8 }}>
                Your password has been successfully updated. You can now sign in with your new password.
              </Typography>

              <Button
                variant="contained"
                onClick={() => navigate('/login')}
                startIcon={<ArrowBack />}
                size="large"
                sx={{
                  py: 1.5,
                  px: 4,
                  borderRadius: 2,
                  fontWeight: 'bold',
                  background: 'linear-gradient(45deg, #4caf50 30%, #2e7d32 90%)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #66bb6a 30%, #388e3c 90%)',
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.3s'
                }}
              >
                Sign In Now
              </Button>
            </Paper>
          </Fade>
        </Container>
      </Box>
    );
  }

  if (!token) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          background: 'linear-gradient(135deg, #4ade80 0%, #16a34a 50%, #14532d 100%)',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Container component="main" maxWidth="sm">
          <Paper
            elevation={12}
            sx={{
              p: { xs: 3, sm: 5 },
              borderRadius: 4,
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.95)'
            }}
          >
            <Alert severity="error" sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Invalid Reset Link
              </Typography>
              <Typography variant="body2">
                This password reset link is invalid or has expired. Please request a new password reset.
              </Typography>
            </Alert>

            <Button
              variant="contained"
              component={RouterLink}
              to="/forgot-password"
              size="large"
              sx={{
                mr: 2,
                py: 1.5,
                px: 3,
                borderRadius: 2,
                fontWeight: 'bold'
              }}
            >
              Request New Reset
            </Button>

            <Button
              variant="outlined"
              component={RouterLink}
              to="/login"
              size="large"
              sx={{
                py: 1.5,
                px: 3,
                borderRadius: 2,
                fontWeight: 'bold'
              }}
            >
              Back to Sign In
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%)',
        position: 'relative',
        overflow: 'auto'
      }}
    >
      <Container component="main" maxWidth="lg" sx={{ py: { xs: 4, md: 6 }, position: 'relative', zIndex: 1 }}>
        <Grid container spacing={3} sx={{ minHeight: { xs: 'auto', md: '100vh' } }}>
          {/* Left side - Branding */}
          {!isMobile && (
            <Grid 
              item 
              md={6} 
              sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center',
                p: { xs: 3, md: 5 }
              }}
            >
              <Fade in={true} timeout={1000}>
                <Box>
                  <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
                    <img 
                      src="/logo1.png" 
                      alt="Excellence Coaching Hub" 
                      style={{ height: 100, marginRight: 16 }}
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
                  
                  <Typography variant="h3" component="h2" fontWeight="bold" sx={{ mb: 3 }}>
                    Create New Password
                  </Typography>
                  
                  <Typography variant="h6" color="text.secondary" sx={{ mb: 4, maxWidth: '80%' }}>
                    Your new password must be different from previously used passwords and meet our security requirements.
                  </Typography>
                  
                  <Alert severity="info" icon={<Security />} sx={{ maxWidth: '80%' }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                      Password Requirements
                    </Typography>
                    <Typography variant="body2" component="div">
                      • At least 8 characters long<br />
                      • Include uppercase and lowercase letters<br />
                      • Include at least one number<br />
                      • Include at least one special character
                    </Typography>
                  </Alert>
                </Box>
              </Fade>
            </Grid>
          )}
          
          {/* Right side - Reset form */}
          <Grid 
            item 
            xs={12} 
            md={6} 
            sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: { xs: 'flex-start', md: 'center' },
              p: { xs: 2, sm: 3 },
              mt: { xs: 2, md: 0 }
            }}
          >
            <Fade in={true} timeout={800}>
              <Paper
                elevation={isMobile ? 3 : 12}
                sx={{
                  p: { xs: 3, sm: 5 },
                  width: '100%',
                  maxWidth: 500,
                  borderRadius: 4,
                  backdropFilter: 'blur(10px)',
                  background: 'rgba(255, 255, 255, 0.95)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                }}
              >
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <img 
                    src="/logo1.png" 
                    alt="Excellence Coaching Hub" 
                    style={{ height: 120, marginBottom: 16 }}
                  />
                  <Typography 
                    variant="h4" 
                    component="h1" 
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
                    New Password
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mt: 3 }}>
                    Enter your new password below
                  </Typography>
                </Box>

                {error && (
                  <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                    {error}
                  </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit} noValidate>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="password"
                    label="New Password"
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                    sx={{ 
                      mb: 2,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      }
                    }}
                  />

                  {password && (
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Password Strength
                        </Typography>
                        <Typography variant="body2" color={`${getPasswordStrengthColor()}.main`}>
                          {getPasswordStrengthText()}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={passwordStrength}
                        color={getPasswordStrengthColor()}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: 'grey.200'
                        }}
                      />
                    </Box>
                  )}

                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="confirmPassword"
                    label="Confirm New Password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    error={confirmPassword && password !== confirmPassword}
                    helperText={
                      confirmPassword && password !== confirmPassword 
                        ? 'Passwords do not match' 
                        : ''
                    }
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock color="primary" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                    sx={{ 
                      mb: 4,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      }
                    }}
                  />
                  
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={loading || !password || !confirmPassword || password !== confirmPassword}
                    startIcon={loading ? <CircularProgress size={20} /> : <Security />}
                    sx={{
                      mb: 3,
                      py: 1.5,
                      borderRadius: 2,
                      fontWeight: 'bold',
                      background: 'linear-gradient(45deg, #4caf50 30%, #2e7d32 90%)',
                      boxShadow: '0 3px 5px 2px rgba(76, 175, 80, .3)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #66bb6a 30%, #388e3c 90%)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 10px 2px rgba(76, 175, 80, .3)',
                      },
                      '&:disabled': {
                        background: 'linear-gradient(45deg, #a5d6a7 30%, #81c784 90%)',
                        transform: 'none',
                        boxShadow: 'none'
                      },
                      transition: 'all 0.3s'
                    }}
                  >
                    {loading ? 'Updating Password...' : 'Update Password'}
                  </Button>
                  
                  <Box sx={{ textAlign: 'center' }}>
                    <Link 
                      component={RouterLink} 
                      to="/login" 
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 1,
                        textDecoration: 'none',
                        color: 'primary.main',
                        fontWeight: 500,
                        '&:hover': {
                          textDecoration: 'underline'
                        }
                      }}
                    >
                      <ArrowBack fontSize="small" />
                      Back to Sign In
                    </Link>
                  </Box>
                </Box>
              </Paper>
            </Fade>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default ResetPasswordPage;
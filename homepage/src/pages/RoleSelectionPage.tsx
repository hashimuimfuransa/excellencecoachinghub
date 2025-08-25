import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  School,
  Person,
  Work,
  Business,
  CheckCircle,
  ArrowForward,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { simpleGoogleAuth } from '../services/googleAuthSimple';

interface RoleOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  benefits: string[];
}

const RoleSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { updateUser } = useAuth();
  
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Get user data from navigation state (passed from Google auth)
  const googleUserData = location.state?.googleUserData;

  const roleOptions: RoleOption[] = [
    {
      id: 'student',
      title: 'Student',
      description: 'Learn new skills and advance your knowledge',
      icon: <School sx={{ fontSize: 40 }} />,
      color: '#3f51b5',
      benefits: [
        'Access to all courses and tutorials',
        'Progress tracking and certificates',
        'Interactive learning materials',
        'Community support and forums'
      ]
    },
    {
      id: 'teacher',
      title: 'Teacher/Instructor',
      description: 'Share your expertise and teach others',
      icon: <Person sx={{ fontSize: 40 }} />,
      color: '#ff6b6b',
      benefits: [
        'Create and publish courses',
        'Earn from your expertise',
        'Student management tools',
        'Analytics and insights'
      ]
    },
    {
      id: 'professional',
      title: 'Professional',
      description: 'Enhance your career and find opportunities',
      icon: <Work sx={{ fontSize: 40 }} />,
      color: '#4caf50',
      benefits: [
        'Job preparation resources',
        'Resume and portfolio builder',
        'Interview practice sessions',
        'Career guidance and mentoring'
      ]
    },
    {
      id: 'employer',
      title: 'Employer',
      description: 'Hire talent and manage employee development',
      icon: <Business sx={{ fontSize: 40 }} />,
      color: '#ff9800',
      benefits: [
        'Access to qualified candidates',
        'Employee skill development',
        'Team performance tracking',
        'Recruitment and hiring tools'
      ]
    }
  ];

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
  };

  const handleContinue = async () => {
    if (!selectedRole) {
      toast.error('Please select a role to continue');
      return;
    }

    if (!googleUserData) {
      toast.error('User data not found. Please try signing in again.');
      navigate('/login');
      return;
    }

    try {
      setLoading(true);

      // Complete user registration with selected role
      const userData = {
        ...googleUserData,
        role: selectedRole,
        provider: 'google',
        isEmailVerified: true,
        registrationCompleted: true,
        createdAt: new Date().toISOString()
      };

      try {
        // Try to send to backend first
        const response = await apiService.post('/auth/google/complete-registration', userData);

        if (response.success && response.data) {
          // Update user context
          updateUser((response.data as any).user);
          
          // Store updated tokens
          localStorage.setItem('token', (response.data as any).token);
          localStorage.setItem('user', JSON.stringify((response.data as any).user));
          if ((response.data as any).refreshToken) {
            localStorage.setItem('refreshToken', (response.data as any).refreshToken);
          }

          toast.success(`Welcome to Excellence Coaching Hub! Your ${selectedRole} account has been created.`);
          navigate('/dashboard');
          return;
        }
      } catch (backendError: any) {
        console.log('Backend not available, using local storage:', backendError);
        // Continue with local storage approach
      }

      // Fallback: Save user locally and create mock tokens
      simpleGoogleAuth.saveUser(userData);

      // Create mock authentication response
      const authTokens = {
        token: 'google_complete_' + Date.now(),
        refreshToken: 'google_refresh_complete_' + Date.now()
      };

      // Update user context
      updateUser(userData);
      
      // Store authentication data
      localStorage.setItem('token', authTokens.token);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('refreshToken', authTokens.refreshToken);

      toast.success(`Welcome to Excellence Coaching Hub! Your ${selectedRole} account has been created.`);
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Role selection error:', error);
      toast.error(error.message || 'Failed to complete registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Redirect if no Google user data
  React.useEffect(() => {
    if (!googleUserData) {
      toast.error('Please sign in with Google first');
      navigate('/login');
    }
  }, [googleUserData, navigate]);

  if (!googleUserData) {
    return null;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          filter: 'blur(40px)',
          zIndex: 0,
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <Container maxWidth="lg">
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
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
              background: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(10px)',
              zIndex: 1,
            }}
          >
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Box
                component="img"
                src="/logo1.png"
                alt="Excellence Coaching Hub Logo"
                sx={{
                  height: 100,
                  mx: 'auto',
                  mb: 2,
                  display: 'block',
                }}
              />

              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  mb: 2,
                  background: 'linear-gradient(45deg, #667eea, #764ba2)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Choose Your Role
              </Typography>

              {/* User Info */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                <Avatar
                  src={googleUserData.profilePicture}
                  alt={googleUserData.firstName}
                  sx={{ width: 50, height: 50, mr: 2 }}
                />
                <Box sx={{ textAlign: 'left' }}>
                  <Typography variant="h6" fontWeight={600}>
                    {googleUserData.firstName} {googleUserData.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {googleUserData.email}
                  </Typography>
                </Box>
              </Box>

              <Typography 
                variant="body1" 
                color="text.secondary"
                sx={{ maxWidth: '600px', mx: 'auto' }}
              >
                To personalize your experience, please select how you'd like to use Excellence Coaching Hub.
              </Typography>
            </Box>

            {/* Role Options */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {roleOptions.map((role, index) => (
                <Grid item xs={12} md={6} key={role.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    whileHover={{ y: -5 }}
                  >
                    <Card
                      sx={{
                        height: '100%',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        border: selectedRole === role.id ? `3px solid ${role.color}` : '3px solid transparent',
                        transform: selectedRole === role.id ? 'scale(1.02)' : 'scale(1)',
                        boxShadow: selectedRole === role.id 
                          ? `0 10px 30px ${role.color}40` 
                          : '0 5px 15px rgba(0, 0, 0, 0.1)',
                        '&:hover': {
                          boxShadow: `0 10px 25px ${role.color}30`,
                        },
                      }}
                      onClick={() => handleRoleSelect(role.id)}
                    >
                      <CardContent sx={{ p: 3, pb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Box
                            sx={{
                              width: 60,
                              height: 60,
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              bgcolor: `${role.color}15`,
                              color: role.color,
                              mr: 2,
                            }}
                          >
                            {role.icon}
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" fontWeight={700} sx={{ color: role.color }}>
                              {role.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {role.description}
                            </Typography>
                          </Box>
                          {selectedRole === role.id && (
                            <CheckCircle sx={{ color: role.color, fontSize: 30 }} />
                          )}
                        </Box>

                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                            What you get:
                          </Typography>
                          {role.benefits.map((benefit, idx) => (
                            <Chip
                              key={idx}
                              label={benefit}
                              size="small"
                              sx={{
                                m: 0.5,
                                bgcolor: `${role.color}10`,
                                color: role.color,
                                fontSize: '0.75rem',
                              }}
                            />
                          ))}
                        </Box>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>

            {/* Continue Button */}
            <Box sx={{ textAlign: 'center' }}>
              <Button
                variant="contained"
                size="large"
                endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <ArrowForward />}
                onClick={handleContinue}
                disabled={!selectedRole || loading}
                sx={{
                  py: 1.5,
                  px: 4,
                  borderRadius: '30px',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  background: selectedRole 
                    ? `linear-gradient(45deg, ${roleOptions.find(r => r.id === selectedRole)?.color}, ${roleOptions.find(r => r.id === selectedRole)?.color}dd)`
                    : 'linear-gradient(45deg, #ccc, #999)',
                  '&:hover': {
                    background: selectedRole 
                      ? `linear-gradient(45deg, ${roleOptions.find(r => r.id === selectedRole)?.color}dd, ${roleOptions.find(r => r.id === selectedRole)?.color}bb)`
                      : 'linear-gradient(45deg, #ccc, #999)',
                  },
                  '&:disabled': {
                    background: 'linear-gradient(45deg, #ccc, #999)',
                  },
                }}
              >
                {loading ? 'Creating Account...' : 'Continue to Dashboard'}
              </Button>

              {!selectedRole && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Please select a role to continue
                </Typography>
              )}
            </Box>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};

export default RoleSelectionPage;
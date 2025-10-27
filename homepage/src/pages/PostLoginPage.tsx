import React, { useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  CircularProgress,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PostLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const getRedirectUrl = (userRole: string) => {
    if (userRole === 'student' || userRole === 'teacher') {
      return 'https://elearning.excellencecoachinghub.com';
    } else if (userRole === 'job_seeker' || userRole === 'employer') {
      return 'https://exjobnet.com';
    }
    return '/'; // fallback to homepage
  };

  useEffect(() => {
    if (!user) {
      // Redirect to login if not authenticated
      navigate('/login');
      return;
    }

    // Automatically redirect based on user role
    const redirectUrl = getRedirectUrl(user.role);
    if (redirectUrl.startsWith('http')) {
      window.location.href = redirectUrl;
    } else {
      navigate(redirectUrl);
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #3f51b5 0%, #6a1b9a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
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
          background: 'rgba(255, 255, 255, 0.05)',
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
          background: 'rgba(255, 107, 107, 0.1)',
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
          <Box
            sx={{
              textAlign: 'center',
              p: 4,
              borderRadius: 3,
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
              background: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(10px)',
              zIndex: 1,
            }}
          >
              <Box
                component="img"
                src="/logo1.png"
                alt="Excellence Coaching Hub Logo"
                sx={{
                height: 100,
                  mx: 'auto',
                mb: 3,
                  display: 'block',
                }}
              />

              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                mb: 2,
                  background: 'linear-gradient(45deg, #3f51b5, #ff6b6b)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Welcome, {user.firstName}!
              </Typography>

              <Typography 
                variant="h6" 
                color="text.secondary"
              sx={{ mb: 4 }}
            >
              Redirecting you to your platform...
                      </Typography>

            <CircularProgress 
              size={60} 
                          sx={{ 
                color: 'primary.main',
                mb: 2
              }} 
            />

                        <Typography
                          variant="body2"
              color="text.secondary"
            >
              {user.role === 'student' || user.role === 'teacher' 
                ? 'Taking you to our E-Learning platform...'
                : 'Taking you to our Job Portal...'
              }
                        </Typography>
                      </Box>
        </motion.div>
      </Container>
    </Box>
  );
};

export default PostLoginPage;
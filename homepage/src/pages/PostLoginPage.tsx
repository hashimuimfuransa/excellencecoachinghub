import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  CardMedia,
} from '@mui/material';
import {
  School,
  Work,
  ArrowForward,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PostLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleELearningChoice = () => {
    // Redirect to e-learning platform
    window.location.href = 'https://elearning.excellencecoachinghub.com';
  };

  const handleJobPrepChoice = () => {
    // Redirect to job preparation platform
    window.location.href = 'https://jobs.excellencecoachinghub.com';
  };

  if (!user) {
    // Redirect to login if not authenticated
    navigate('/login');
    return null;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #3f51b5 0%, #6a1b9a 100%)',
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
            {/* Welcome Header */}
            <Box sx={{ textAlign: 'center', mb: 6, position: 'relative', zIndex: 1 }}>
              <Box
                component="img"
                src="/logo1.png"
                alt="Excellence Coaching Hub Logo"
                sx={{
                  height: 70,
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
                  background: 'linear-gradient(45deg, #3f51b5, #ff6b6b)',
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
                    background: 'linear-gradient(45deg, #3f51b5, #ff6b6b)',
                    borderRadius: '2px',
                  }
                }}
              >
                Welcome, {user.firstName}!
              </Typography>

              <Typography 
                variant="h6" 
                color="text.secondary"
                sx={{
                  mt: 3,
                  maxWidth: '80%',
                  mx: 'auto',
                }}
              >
                What would you like to do today?
              </Typography>
            </Box>

            {/* Options */}
            <Grid container spacing={4}>
              {/* E-Learning Option */}
              <Grid item xs={12} md={6}>
                <motion.div
                  whileHover={{ y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card
                    sx={{
                      height: '100%',
                      borderRadius: '20px',
                      overflow: 'hidden',
                      boxShadow: '0 10px 30px rgba(63, 81, 181, 0.15)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: '0 15px 40px rgba(63, 81, 181, 0.25)',
                      },
                      cursor: 'pointer',
                    }}
                    onClick={handleELearningChoice}
                  >
                    <CardMedia
                      component="img"
                      height="200"
                      image="/elearning.webp"
                      alt="E-Learning"
                    />
                    <CardContent sx={{ p: 4 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          mb: 2,
                        }}
                      >
                        <Box
                          sx={{
                            width: 50,
                            height: 50,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'linear-gradient(135deg, #3f51b5 0%, #536dfe 100%)',
                            mr: 2,
                          }}
                        >
                          <School sx={{ color: 'white' }} />
                        </Box>
                        <Typography variant="h5" fontWeight={700}>
                          E-Learning
                        </Typography>
                      </Box>
                      
                      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        Access our comprehensive library of courses, tutorials, and learning resources to enhance your skills and knowledge.
                      </Typography>
                      
                      <Button
                        variant="contained"
                        endIcon={<ArrowForward />}
                        sx={{
                          bgcolor: 'primary.main',
                          borderRadius: '30px',
                          px: 3,
                          py: 1.2,
                          '&:hover': {
                            bgcolor: 'primary.dark',
                          },
                        }}
                      >
                        Start Learning
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>

              {/* Job Preparation Option */}
              <Grid item xs={12} md={6}>
                <motion.div
                  whileHover={{ y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card
                    sx={{
                      height: '100%',
                      borderRadius: '20px',
                      overflow: 'hidden',
                      boxShadow: '0 10px 30px rgba(255, 107, 107, 0.15)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: '0 15px 40px rgba(255, 107, 107, 0.25)',
                      },
                      cursor: 'pointer',
                    }}
                    onClick={handleJobPrepChoice}
                  >
                    <CardMedia
                      component="img"
                      height="200"
                      image="/Job-Searching-Online.avif"
                      alt="Job Preparation"
                    />
                    <CardContent sx={{ p: 4 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          mb: 2,
                        }}
                      >
                        <Box
                          sx={{
                            width: 50,
                            height: 50,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'linear-gradient(135deg, #ff6b6b 0%, #ff9e9e 100%)',
                            mr: 2,
                          }}
                        >
                          <Work sx={{ color: 'white' }} />
                        </Box>
                        <Typography variant="h5" fontWeight={700}>
                          Job Preparation
                        </Typography>
                      </Box>
                      
                      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        Prepare for your dream job with our AI-powered interview simulations, resume builder, and job matching services.
                      </Typography>
                      
                      <Button
                        variant="contained"
                        endIcon={<ArrowForward />}
                        sx={{
                          bgcolor: 'secondary.main',
                          borderRadius: '30px',
                          px: 3,
                          py: 1.2,
                          '&:hover': {
                            bgcolor: 'secondary.dark',
                          },
                        }}
                      >
                        Find Jobs
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            </Grid>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};

export default PostLoginPage;
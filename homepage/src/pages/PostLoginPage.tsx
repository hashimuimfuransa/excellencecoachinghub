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
  Chip,
  Stack,
} from '@mui/material';
import {
  School,
  Work,
  ArrowForward,
  Home,
  AutoAwesome,
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

  const handleBackToHome = () => {
    navigate('/');
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
              p: { xs: 2, sm: 3, md: 5 },
              borderRadius: { xs: 2, sm: 3 },
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
              background: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(10px)',
              zIndex: 1,
              mx: { xs: 1, sm: 0 },
            }}
          >
            {/* Back to Home Button */}
            <Box sx={{ position: 'absolute', top: { xs: 12, sm: 16 }, right: { xs: 12, sm: 16 }, zIndex: 2 }}>
              <Button
                component={motion.button}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleBackToHome}
                startIcon={<Home sx={{ fontSize: { xs: 16, sm: 20 } }} />}
                variant="outlined"
                size="small"
                sx={{
                  borderColor: 'rgba(63, 81, 181, 0.3)',
                  color: '#3f51b5',
                  fontWeight: 600,
                  borderRadius: '20px',
                  px: { xs: 1.5, sm: 2 },
                  py: { xs: 0.5, sm: 0.8 },
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  minWidth: { xs: 'auto', sm: '120px' },
                  '&:hover': {
                    borderColor: '#3f51b5',
                    bgcolor: 'rgba(63, 81, 181, 0.05)',
                  },
                }}
              >
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                  Back to Home
                </Box>
                <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                  Home
                </Box>
              </Button>
            </Box>

            {/* Welcome Header */}
            <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 6 }, position: 'relative', zIndex: 1 }}>
              <Box
                component="img"
                src="/logo1.png"
                alt="Excellence Coaching Hub Logo"
                sx={{
                  height: { xs: 80, sm: 100, md: 110 },
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
                  fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
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
                    width: { xs: '40px', sm: '50px', md: '60px' },
                    height: { xs: '3px', md: '4px' },
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
                  maxWidth: { xs: '95%', sm: '85%', md: '80%' },
                  mx: 'auto',
                  fontSize: { xs: '1rem', sm: '1.15rem', md: '1.25rem' },
                  px: { xs: 1, sm: 0 },
                }}
              >
                What would you like to do today?
              </Typography>
            </Box>

            {/* Options */}
            <Grid container spacing={{ xs: 3, md: 4 }}>
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
                    <CardContent sx={{ p: { xs: 2.5, sm: 3, md: 4 } }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          mb: 2,
                        }}
                      >
                        <Box
                          sx={{
                            width: { xs: 40, sm: 45, md: 50 },
                            height: { xs: 40, sm: 45, md: 50 },
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'linear-gradient(135deg, #3f51b5 0%, #536dfe 100%)',
                            mr: { xs: 1.5, sm: 2 },
                          }}
                        >
                          <School sx={{ color: 'white', fontSize: { xs: 20, sm: 22, md: 24 } }} />
                        </Box>
                        <Typography 
                          variant="h5" 
                          fontWeight={700}
                          sx={{ fontSize: { xs: '1.25rem', sm: '1.4rem', md: '1.5rem' } }}
                        >
                          E-Learning
                        </Typography>
                      </Box>
                      
                      <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                        Transform your career with our comprehensive learning ecosystem featuring numerous specialized programs, personalized student coaching, live video coaching sessions with industry experts, interactive assessments, and hands-on projects designed for Africa's digital transformation.
                      </Typography>

                      {/* Programs & Coaching Services */}
                      <Box sx={{ mb: 3 }}>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            mb: 2, 
                            fontWeight: 700, 
                            color: '#3f51b5',
                            fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' }
                          }}
                        >
                          Our Learning Programs & Coaching:
                        </Typography>
                        <Stack 
                          direction="row" 
                          spacing={{ xs: 0.5, sm: 1 }} 
                          flexWrap="wrap" 
                          useFlexGap
                          sx={{ gap: { xs: 0.5, sm: 1 } }}
                        >
                          {[
                            'Tech & Digital Solutions',
                            'Data Analytics & ML',
                            'Business Development',
                            'Accounting & Taxation',
                            'Project Management & PMP',
                            'Executive Leadership',
                            'Professional Certifications',
                            'HR & Legal Compliance',
                            'Financial Management',
                            'Digital Marketing',
                            'Entrepreneurship',
                            'Student Academic Coaching',
                            'Career Transition Coaching',
                            'Personal Development',
                            'Industry-Specific Training',
                            'Soft Skills Development',
                            'Technical Skills Bootcamps',
                            'Professional Writing',
                            'Public Speaking & Presentation',
                            'And Many More Programs...'
                          ].map((program, index) => (
                            <Chip
                              key={index}
                              label={program}
                              size="small"
                              sx={{
                                bgcolor: 'rgba(63, 81, 181, 0.1)',
                                color: '#3f51b5',
                                fontWeight: 600,
                                mb: { xs: 0.5, sm: 1 },
                                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                height: { xs: 24, sm: 32 },
                                '&:hover': {
                                  bgcolor: 'rgba(63, 81, 181, 0.2)',
                                },
                              }}
                            />
                          ))}
                        </Stack>
                      </Box>

                      {/* Coaching Method */}
                      <Box
                        sx={{
                          p: { xs: 2, sm: 2.5 },
                          borderRadius: '12px',
                          bgcolor: 'rgba(63, 81, 181, 0.05)',
                          border: '1px solid rgba(63, 81, 181, 0.1)',
                          mb: 3,
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            color: '#3f51b5',
                            fontWeight: 600,
                            mb: 1,
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: { xs: '0.85rem', sm: '0.9rem' },
                          }}
                        >
                          <AutoAwesome sx={{ mr: 1, fontSize: { xs: 16, sm: 18 } }} />
                          Our Comprehensive Coaching Approach:
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'text.secondary',
                            lineHeight: 1.6,
                            fontSize: { xs: '0.8rem', sm: '0.9rem' },
                          }}
                        >
                          Expert coaches provide personalized one-on-one live video sessions, student academic coaching, career mentoring, skill development guidance, practical assignments, continuous progress monitoring, and comprehensive career guidance across all our diverse programs to ensure your success in your chosen field.
                        </Typography>
                      </Box>
                      
                      <Button
                        variant="contained"
                        endIcon={<ArrowForward />}
                        fullWidth
                        sx={{
                          bgcolor: 'primary.main',
                          borderRadius: '30px',
                          px: { xs: 2, sm: 3 },
                          py: { xs: 1, sm: 1.2 },
                          fontSize: { xs: '0.9rem', sm: '1rem' },
                          fontWeight: { xs: 600, sm: 700 },
                          '&:hover': {
                            bgcolor: 'primary.dark',
                          },
                        }}
                      >
                        Start Learning Journey
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
                    <CardContent sx={{ p: { xs: 2.5, sm: 3, md: 4 } }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          mb: 2,
                        }}
                      >
                        <Box
                          sx={{
                            width: { xs: 40, sm: 45, md: 50 },
                            height: { xs: 40, sm: 45, md: 50 },
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'linear-gradient(135deg, #ff6b6b 0%, #ff9e9e 100%)',
                            mr: { xs: 1.5, sm: 2 },
                          }}
                        >
                          <Work sx={{ color: 'white', fontSize: { xs: 20, sm: 22, md: 24 } }} />
                        </Box>
                        <Typography 
                          variant="h5" 
                          fontWeight={700}
                          sx={{ fontSize: { xs: '1.25rem', sm: '1.4rem', md: '1.5rem' } }}
                        >
                          Job Portal
                        </Typography>
                      </Box>
                      
                      <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                        Accelerate your career success with comprehensive job preparation services including psychometric assessments, live video interview coaching, personalized career guidance, and access to curated job opportunities across Africa and beyond.
                      </Typography>

                      {/* Job Portal Services */}
                      <Box sx={{ mb: 3 }}>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            mb: 2, 
                            fontWeight: 700, 
                            color: '#ff6b6b',
                            fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' }
                          }}
                        >
                          How We Help You:
                        </Typography>
                        <Stack 
                          direction="row" 
                          spacing={{ xs: 0.5, sm: 1 }} 
                          flexWrap="wrap" 
                          useFlexGap
                          sx={{ gap: { xs: 0.5, sm: 1 } }}
                        >
                          {[
                            'Psychometric Assessments',
                            'Interview Coaching',
                            'Resume Optimization',
                            'Career Guidance',
                            'Job Matching',
                            'Salary Negotiation',
                            'LinkedIn Profile Setup',
                            'Career Transition Support'
                          ].map((service, index) => (
                            <Chip
                              key={index}
                              label={service}
                              size="small"
                              sx={{
                                bgcolor: 'rgba(255, 107, 107, 0.1)',
                                color: '#ff6b6b',
                                fontWeight: 600,
                                mb: { xs: 0.5, sm: 1 },
                                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                height: { xs: 24, sm: 32 },
                                '&:hover': {
                                  bgcolor: 'rgba(255, 107, 107, 0.2)',
                                },
                              }}
                            />
                          ))}
                        </Stack>
                      </Box>

                      {/* Coaching Method */}
                      <Box
                        sx={{
                          p: 2.5,
                          borderRadius: '12px',
                          bgcolor: 'rgba(255, 107, 107, 0.05)',
                          border: '1px solid rgba(255, 107, 107, 0.1)',
                          mb: 3,
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            color: '#ff6b6b',
                            fontWeight: 600,
                            mb: 1,
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          <AutoAwesome sx={{ mr: 1, fontSize: 18 }} />
                          Our Career Coaching Approach:
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'text.secondary',
                            lineHeight: 1.6,
                            fontSize: '0.9rem',
                          }}
                        >
                          Career coaches work with you through live video sessions to build confidence, improve interview skills, optimize your professional profile, and provide ongoing support throughout your job search journey.
                        </Typography>
                      </Box>
                      
                      <Button
                        variant="contained"
                        endIcon={<ArrowForward />}
                        fullWidth
                        sx={{
                          bgcolor: 'secondary.main',
                          borderRadius: '30px',
                          px: { xs: 2, sm: 3 },
                          py: { xs: 1, sm: 1.2 },
                          fontSize: { xs: '0.9rem', sm: '1rem' },
                          fontWeight: { xs: 600, sm: 700 },
                          '&:hover': {
                            bgcolor: 'secondary.dark',
                          },
                        }}
                      >
                        Launch Your Career
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
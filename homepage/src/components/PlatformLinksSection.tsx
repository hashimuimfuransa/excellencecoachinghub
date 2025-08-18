import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  useTheme,
  useMediaQuery,
  Avatar,
  Chip,
  Stack,
} from '@mui/material';
import {
  School,
  Work,
  ArrowForward,
  AutoAwesome,
  TrendingUp,
  Groups,
  Assessment,
  Psychology,
  Verified,
  Speed,
} from '@mui/icons-material';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PlatformLinksSection: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const navigate = useNavigate();
  const { user } = useAuth();

  const platforms = [
    {
      title: 'E-Learning Platform',
      description: 'Transform your career with our comprehensive learning ecosystem featuring AI-powered personalization, industry-expert instructors, and hands-on projects.',
      icon: <School />,
      color: '#3f51b5',
      gradient: 'linear-gradient(135deg, #3f51b5 0%, #536dfe 100%)',
      features: [
        'Interactive Video Courses',
        'AI-Powered Learning Paths',
        'Progress Tracking',
        'Peer Collaboration',
        'Expert Instructors',
        'Mobile Learning',
      ],
      buttonText: 'Start Learning',
      buttonColor: 'primary',
      link: 'https://elearning.excellencecoachinghub.com',
    },
    {
      title: 'Job Preparation Platform',
      description: 'Prepare for your dream job with psychometric tests, AI mock interviews, and access to curated job opportunities.',
      icon: <Work />,
      color: '#ff6b6b',
      gradient: 'linear-gradient(135deg, #ff6b6b 0%, #ff9e9e 100%)',
      features: [
        'Psychometric Assessments',
        'AI Mock Interviews',
        'Resume Builder',
        'Job Matching',
        'Interview Coaching',
        'Career Guidance',
      ],
      buttonText: 'Explore Jobs',
      buttonColor: 'secondary',
      link: 'https://jobs.excellencecoachinghub.com',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
      },
    },
  };

  const handlePlatformClick = (link: string) => {
    if (user) {
      // If user is logged in, redirect to the dashboard to choose their path
      navigate('/dashboard');
    } else {
      // If not logged in, redirect to register page
      navigate('/register');
    }
  };

  return (
    <Box
      id="platforms"
      ref={ref}
      sx={{
        py: { xs: 8, md: 12 },
        bgcolor: 'background.default',
        position: 'relative',
      }}
    >
      <Container maxWidth="xl">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          {/* Section Header */}
          <motion.div variants={itemVariants}>
            <Box sx={{ textAlign: 'center', mb: { xs: 4, sm: 6, md: 8 }, px: { xs: 2, sm: 0 } }}>
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 800,
                  mb: 3,
                  fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.75rem', lg: '3rem' },
                  background: 'linear-gradient(45deg, #3f51b5, #ff6b6b)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  position: 'relative',
                  display: 'inline-block',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: -10,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: { xs: '60px', md: '80px' },
                    height: '4px',
                    background: 'linear-gradient(45deg, #3f51b5, #ff6b6b)',
                    borderRadius: '2px',
                  }
                }}
              >
                Our Platforms
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: 'text.secondary',
                  maxWidth: { xs: '100%', sm: '700px', md: '800px' },
                  mx: 'auto',
                  lineHeight: 1.6,
                  fontSize: { xs: '0.95rem', sm: '1.1rem', md: '1.25rem' },
                  px: { xs: 1, sm: 2, md: 0 },
                }}
              >
                Choose your path to success with our specialized platforms designed for Africa's digital transformation
              </Typography>
            </Box>
          </motion.div>

          {/* Platforms Grid */}
          <Grid container spacing={{ xs: 3, sm: 4, md: 4 }} sx={{ mb: { xs: 6, md: 8 } }}>
            {platforms.map((platform, index) => (
              <Grid item xs={12} lg={6} key={index}>
                <motion.div
                  variants={itemVariants}
                  whileHover={{
                    y: -10,
                    transition: { duration: 0.3 },
                  }}
                >
                  <Card
                    sx={{
                      height: '100%',
                      position: 'relative',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      borderRadius: '20px',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
                      background: platform.gradient,
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      '&:hover': {
                        boxShadow: '0 25px 70px rgba(0, 0, 0, 0.25)',
                        transform: 'translateY(-5px)',
                      },
                      '&:before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: `linear-gradient(135deg, ${platform.color}e6 0%, ${platform.color}cc 50%, ${platform.color}e6 100%)`,
                        zIndex: 0,
                      },
                    }}
                  >
                    {/* Enhanced Background Pattern */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: `
                          radial-gradient(circle at 20% 20%, rgba(255,255,255,0.1) 0%, transparent 50%),
                          radial-gradient(circle at 80% 80%, rgba(255,255,255,0.05) 0%, transparent 50%),
                          linear-gradient(135deg, transparent 0%, rgba(0,0,0,0.1) 100%)
                        `,
                        zIndex: 1,
                      }}
                    />

                    {/* Animated Decorative Elements */}
                    <Box
                      component={motion.div}
                      animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.1, 0.2, 0.1],
                      }}
                      transition={{
                        duration: 6,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                      sx={{
                        position: 'absolute',
                        top: -60,
                        right: -60,
                        width: 180,
                        height: 180,
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '50%',
                        filter: 'blur(20px)',
                      }}
                    />
                    <Box
                      component={motion.div}
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.05, 0.15, 0.05],
                      }}
                      transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: 1,
                      }}
                      sx={{
                        position: 'absolute',
                        top: 120,
                        right: -40,
                        width: 120,
                        height: 120,
                        background: 'rgba(255, 255, 255, 0.08)',
                        borderRadius: '50%',
                        filter: 'blur(15px)',
                      }}
                    />

                    <CardContent sx={{ p: { xs: 3, sm: 4, md: 4 }, position: 'relative', zIndex: 10 }}>
                      {/* Header */}
                      <Box sx={{ mb: { xs: 3, md: 4 } }}>
                        <Box
                          component={motion.div}
                          whileHover={{ 
                            scale: 1.05,
                            rotate: 5,
                            transition: { duration: 0.2 }
                          }}
                          sx={{
                            position: 'relative',
                            mb: 3,
                          }}
                        >
                          <Avatar
                            sx={{
                              bgcolor: 'rgba(255, 255, 255, 0.25)',
                              width: { xs: 60, sm: 80 },
                              height: { xs: 60, sm: 80 },
                              backdropFilter: 'blur(10px)',
                              border: '2px solid rgba(255, 255, 255, 0.3)',
                              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)',
                            }}
                          >
                            {React.cloneElement(platform.icon, { 
                              sx: { fontSize: { xs: 28, sm: 36 }, color: 'white' } 
                            })}
                          </Avatar>
                          <Box
                            sx={{
                              position: 'absolute',
                              top: -5,
                              left: '50%',
                              transform: 'translateX(-50%)',
                              width: { xs: 70, sm: 90 },
                              height: { xs: 70, sm: 90 },
                              borderRadius: '50%',
                              background: 'rgba(255, 255, 255, 0.1)',
                              zIndex: -1,
                            }}
                          />
                        </Box>
                        
                        <Typography
                          variant="h4"
                          sx={{
                            fontWeight: 800,
                            color: 'white',
                            mb: 2,
                            textShadow: '0 3px 6px rgba(0, 0, 0, 0.4)',
                            fontSize: { xs: '1.3rem', sm: '1.75rem', md: '2rem' },
                            lineHeight: 1.2,
                          }}
                        >
                          {platform.title}
                        </Typography>
                        
                        <Typography
                          variant="body1"
                          sx={{
                            color: 'white',
                            lineHeight: 1.6,
                            mb: 3,
                            fontWeight: 500,
                            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                            fontSize: { xs: '0.95rem', sm: '1rem', md: '1.1rem' },
                          }}
                        >
                          {platform.description}
                        </Typography>
                      </Box>

                      {/* Features */}
                      <Box sx={{ mb: { xs: 3, md: 4 } }}>
                        <Typography
                          variant="h6"
                          sx={{
                            color: 'white',
                            fontWeight: 700,
                            mb: 2,
                            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                            fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
                          }}
                        >
                          Key Features:
                        </Typography>
                        <Grid container spacing={{ xs: 1, sm: 1.5 }}>
                          {platform.features.map((feature, featureIndex) => (
                            <Grid item xs={12} sm={6} key={featureIndex}>
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  mb: 1,
                                  p: { xs: 0.8, sm: 1 },
                                  borderRadius: '8px',
                                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                  backdropFilter: 'blur(5px)',
                                  border: '1px solid rgba(255, 255, 255, 0.2)',
                                  transition: 'all 0.3s ease',
                                  '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.25)',
                                    transform: 'translateX(3px)',
                                  },
                                }}
                              >
                                <Box
                                  sx={{
                                    width: { xs: 5, sm: 6 },
                                    height: { xs: 5, sm: 6 },
                                    borderRadius: '50%',
                                    bgcolor: 'white',
                                    mr: { xs: 1, sm: 1.5 },
                                    boxShadow: '0 0 8px rgba(255,255,255,0.5)',
                                    flexShrink: 0,
                                  }}
                                />
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: 'white',
                                    fontWeight: 600,
                                    fontSize: { xs: '0.8rem', sm: '0.85rem' },
                                    textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                                    lineHeight: 1.3,
                                  }}
                                >
                                  {feature}
                                </Typography>
                              </Box>
                            </Grid>
                          ))}
                        </Grid>
                      </Box>

                      {/* Action Button */}
                      <Button
                        component={motion.button}
                        whileHover={{ 
                          scale: 1.05,
                          transition: { duration: 0.2 }
                        }}
                        whileTap={{ scale: 0.95 }}
                        variant="contained"
                        size="large"
                        fullWidth
                        endIcon={<ArrowForward />}
                        onClick={() => handlePlatformClick(platform.link)}
                        sx={{
                          bgcolor: 'white',
                          color: platform.color,
                          fontWeight: 700,
                          py: { xs: 1.5, sm: 2 },
                          px: { xs: 3, sm: 4 },
                          borderRadius: '8px',
                          fontSize: { xs: '0.95rem', sm: '1rem', md: '1.1rem' },
                          boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)',
                          border: '2px solid rgba(255, 255, 255, 0.3)',
                          '&:hover': {
                            bgcolor: 'white',
                            transform: 'translateY(-3px)',
                            boxShadow: '0 12px 35px rgba(0, 0, 0, 0.3)',
                            color: platform.color,
                          },
                          '&:active': {
                            transform: 'translateY(-1px)',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                          },
                        }}
                      >
                        {platform.buttonText}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>

          {/* Additional Features Section */}
          <motion.div variants={itemVariants}>
            <Box
              sx={{
                p: { xs: 4, md: 6 },
                background: 'linear-gradient(135deg, #3f51b5 0%, #6a1b9a 100%)',
                borderRadius: '24px',
                textAlign: 'center',
                color: 'white',
                boxShadow: '0 20px 60px rgba(63, 81, 181, 0.25)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Animated background elements */}
              <Box
                component={motion.div}
                sx={{
                  position: 'absolute',
                  top: '-10%',
                  right: '-5%',
                  width: '300px',
                  height: '300px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.05)',
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
                  bottom: '-15%',
                  left: '-10%',
                  width: '250px',
                  height: '250px',
                  borderRadius: '50%',
                  background: 'rgba(255, 107, 107, 0.1)',
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

              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  mb: 4,
                  color: 'white',
                  textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                Integrated Learning Experience
              </Typography>
              
              <Grid container spacing={4} sx={{ position: 'relative', zIndex: 1 }}>
                {[
                  {
                    icon: <AutoAwesome />,
                    title: 'AI-Powered',
                    description: 'Smart recommendations and personalized learning paths',
                    color: '#ff6b6b',
                  },
                  {
                    icon: <Speed />,
                    title: 'Fast Track',
                    description: 'Accelerated programs for quick skill development',
                    color: '#4caf50',
                  },
                  {
                    icon: <Verified />,
                    title: 'Certified',
                    description: 'Industry-recognized certificates and credentials',
                    color: '#ff9800',
                  },
                  {
                    icon: <Groups />,
                    title: 'Community',
                    description: 'Connect with peers and industry professionals',
                    color: '#00bcd4',
                  },
                ].map((feature, index) => (
                  <Grid item xs={12} sm={6} md={3} key={index}>
                    <Box 
                      component={motion.div}
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.3 }}
                      sx={{ 
                        textAlign: 'center',
                        p: 2,
                        borderRadius: '16px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(5px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)',
                      }}
                    >
                      <Avatar
                        sx={{
                          bgcolor: feature.color,
                          width: 64,
                          height: 64,
                          mx: 'auto',
                          mb: 2,
                          border: '3px solid rgba(255, 255, 255, 0.3)',
                          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
                        }}
                      >
                        {React.cloneElement(feature.icon, { sx: { fontSize: 32 } })}
                      </Avatar>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          mb: 1,
                          color: 'white',
                          textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        }}
                      >
                        {feature.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'rgba(255, 255, 255, 0.9)',
                          lineHeight: 1.6,
                          fontWeight: 500,
                        }}
                      >
                        {feature.description}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>

              {/* Call to Action */}
              <Box sx={{ mt: 6 }}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  justifyContent="center"
                >
                  <Button
                    component={motion.button}
                    whileHover={{ 
                      scale: 1.03,
                      boxShadow: '0 6px 20px rgba(255, 107, 107, 0.4)',
                    }}
                    whileTap={{ scale: 0.97 }}
                    variant="contained"
                    size="large"
                    onClick={() => handlePlatformClick('/elearning')}
                    sx={{
                      bgcolor: '#ff6b6b',
                      color: 'white',
                      py: 1.8,
                      px: 4,
                      fontWeight: 600,
                      borderRadius: '30px',
                      boxShadow: '0 4px 15px rgba(255, 107, 107, 0.3)',
                      '&:hover': {
                        bgcolor: '#ff5252',
                      },
                    }}
                  >
                    Start Learning Today
                  </Button>
                  <Button
                    component={motion.button}
                    whileHover={{ 
                      scale: 1.03,
                      boxShadow: '0 4px 12px rgba(255, 255, 255, 0.15)',
                    }}
                    whileTap={{ scale: 0.97 }}
                    variant="outlined"
                    size="large"
                    onClick={() => handlePlatformClick('/jobs')}
                    sx={{
                      borderColor: 'rgba(255, 255, 255, 0.8)',
                      color: 'white',
                      borderWidth: '2px',
                      py: 1.6,
                      px: 4,
                      fontWeight: 600,
                      borderRadius: '30px',
                      backdropFilter: 'blur(5px)',
                      '&:hover': {
                        borderColor: 'rgba(255, 255, 255, 1)',
                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                      },
                    }}
                  >
                    Explore Career Opportunities
                  </Button>
                </Stack>
              </Box>
            </Box>
          </motion.div>
        </motion.div>
      </Container>
    </Box>
  );
};

export default PlatformLinksSection;
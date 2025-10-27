import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Avatar,
  Stack,
} from '@mui/material';
import {
  School,
  Work,
  ArrowForward,
  AutoAwesome,
  Groups,
  Verified,
  Speed,
} from '@mui/icons-material';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useThemeContext } from '../contexts/ThemeContext';

const PlatformLinksSection: React.FC = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDarkMode } = useThemeContext();

  const platforms = [
    {
      title: 'E-Learning Platform',
      description: 'Transform your career with our comprehensive learning ecosystem featuring numerous specialized programs, personalized student coaching, live video coaching sessions with industry experts, interactive assessments, hands-on projects, and career-focused training materials designed for Africa\'s digital transformation.',
      icon: <School />,
      color: '#3f51b5',
      gradient: 'linear-gradient(135deg, #3f51b5 0%, #536dfe 100%)',
      features: [
        'Tech & Digital Solutions Training',
        'Data Analytics & Machine Learning',
        'Business Development & Entrepreneurship',
        'Accounting, Tax & Audit Programs',
        'Project Management & PMP Certification',
        'Executive & Leadership Coaching',
        'Professional Qualification Coaching (CPA, PRINCE2)',
        'HR & Legal Compliance Training',
        'Financial Management & Planning',
        'Digital Marketing & E-commerce',
        'Student Academic Coaching',
        'Career Transition Coaching',
        'Personal Development Programs',
        'Industry-Specific Training',
        'Soft Skills Development',
        'Technical Skills Bootcamps',
        'Live Video Coaching Sessions',
        'Interactive Assessments & Progress Tracking',
        'Hands-on Projects & Real-world Applications',
        'Industry-Expert Instructors & Mentors',
        'Personalized Study Plans & Career Roadmaps',
        'Peer Collaboration & Community Learning',
        'Mobile Learning & Offline Access',
        'Certificate Programs & Industry Recognition',
      ],
      buttonText: 'Start Learning Journey',
      buttonColor: 'primary',
      link: 'https://elearning.excellencecoachinghub.com',
      coachingDetails: 'Our expert coaches provide personalized one-on-one live video sessions, student academic coaching, career mentoring, skill development guidance, practical assignments, continuous progress monitoring, and comprehensive career guidance across all our diverse programs to ensure your success in your chosen field.',
    },
    {
      title: 'exjobnet Portal',
      description: 'Accelerate your career success with comprehensive job preparation services including psychometric assessments, live video interview coaching, personalized career guidance, resume optimization, skill-job matching, and access to curated job opportunities across Africa and beyond.',
      icon: <Work />,
      color: '#22c55e',
      gradient: 'linear-gradient(135deg, #22c55e 0%, #4ade80 100%)',
      features: [
        'Comprehensive Psychometric Assessments',
        'Live Video Interview Coaching Sessions',
        'Personalized Career Guidance & Roadmapping',
        'Professional Resume & CV Builder',
        'Skills-Based Job Matching Algorithm',
        'Interview Preparation & Mock Sessions',
        'Salary Negotiation Coaching',
        'LinkedIn Profile Optimization',
        'Industry-Specific Job Alerts',
        'Career Transition Support',
        'Professional Networking Opportunities',
        'Job Application Tracking System',
        'Employer Branding & Company Research',
        'Career Development Resources',
        'Performance Review Preparation',
        'Work-Life Balance Coaching',
      ],
      buttonText: 'Launch Your Career',
      buttonColor: 'secondary',
      link: 'https://exjobnet.com',
      coachingDetails: 'Our career coaches work with you through live video sessions to build confidence, improve interview skills, optimize your professional profile, and provide ongoing support throughout your job search and career advancement journey.',
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

  const handlePlatformClick = () => {
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
                  background: isDarkMode 
                    ? 'linear-gradient(45deg, #4ade80, #22c55e)'
                    : 'linear-gradient(45deg, #22c55e, #16a34a)',
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
                    background: isDarkMode 
                      ? 'linear-gradient(45deg, #4ade80, #22c55e)'
                      : 'linear-gradient(45deg, #22c55e, #16a34a)',
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
                Choose your pathway to career excellence with our comprehensive platforms featuring live video coaching, expert-led training programs, personalized career guidance, and industry-recognized certifications designed for Africa's digital transformation
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
                      boxShadow: isDarkMode 
                        ? '0 10px 30px rgba(0, 0, 0, 0.4)' 
                        : '0 10px 30px rgba(0, 0, 0, 0.15)',
                      background: platform.gradient,
                      border: isDarkMode 
                        ? '1px solid rgba(255, 255, 255, 0.15)' 
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      '&:hover': {
                        boxShadow: isDarkMode 
                          ? '0 25px 70px rgba(0, 0, 0, 0.6)' 
                          : '0 25px 70px rgba(0, 0, 0, 0.25)',
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
                          What You'll Get:
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

                      {/* Coaching Details Section */}
                      <Box
                        sx={{
                          mb: { xs: 3, md: 4 },
                          p: { xs: 2.5, sm: 3 },
                          borderRadius: '12px',
                          background: 'rgba(255, 255, 255, 0.15)',
                          backdropFilter: 'blur(15px)',
                          border: '1px solid rgba(255, 255, 255, 0.25)',
                          position: 'relative',
                          overflow: 'hidden',
                        }}
                      >
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'linear-gradient(45deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.1) 100%)',
                            zIndex: 0,
                          }}
                        />
                        <Box sx={{ position: 'relative', zIndex: 1 }}>
                          <Typography
                            variant="h6"
                            sx={{
                              color: 'white',
                              fontWeight: 700,
                              mb: 2,
                              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                              fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem' },
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            <AutoAwesome sx={{ mr: 1, fontSize: { xs: 18, sm: 20 } }} />
                            How We Coach You:
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: 'rgba(255, 255, 255, 0.95)',
                              lineHeight: 1.6,
                              fontWeight: 500,
                              fontSize: { xs: '0.85rem', sm: '0.9rem', md: '0.95rem' },
                              textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                            }}
                          >
                            {platform.coachingDetails}
                          </Typography>
                        </Box>
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
                        onClick={() => handlePlatformClick()}
                        sx={{
                          bgcolor: isDarkMode 
                            ? 'rgba(255, 255, 255, 0.95)' 
                            : 'white',
                          color: platform.color,
                          fontWeight: 700,
                          py: { xs: 1.5, sm: 2 },
                          px: { xs: 3, sm: 4 },
                          borderRadius: '8px',
                          fontSize: { xs: '0.95rem', sm: '1rem', md: '1.1rem' },
                          boxShadow: isDarkMode 
                            ? '0 8px 20px rgba(0, 0, 0, 0.4)' 
                            : '0 8px 20px rgba(0, 0, 0, 0.2)',
                          border: '2px solid rgba(255, 255, 255, 0.3)',
                          '&:hover': {
                            bgcolor: isDarkMode 
                              ? 'rgba(255, 255, 255, 0.98)' 
                              : 'white',
                            transform: 'translateY(-3px)',
                            boxShadow: isDarkMode 
                              ? '0 12px 35px rgba(0, 0, 0, 0.5)' 
                              : '0 12px 35px rgba(0, 0, 0, 0.3)',
                            color: platform.color,
                          },
                          '&:active': {
                            transform: 'translateY(-1px)',
                            boxShadow: isDarkMode 
                              ? '0 4px 12px rgba(0, 0, 0, 0.3)' 
                              : '0 4px 12px rgba(0, 0, 0, 0.2)',
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
                background: isDarkMode 
                  ? 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 50%, #5b21b6 100%)'
                  : 'linear-gradient(135deg, #3f51b5 0%, #6a1b9a 100%)',
                borderRadius: '24px',
                textAlign: 'center',
                color: 'white',
                boxShadow: isDarkMode 
                  ? '0 20px 60px rgba(76, 29, 149, 0.4)'
                  : '0 20px 60px rgba(63, 81, 181, 0.25)',
                position: 'relative',
                overflow: 'hidden',
                border: isDarkMode 
                  ? '1px solid rgba(255, 255, 255, 0.1)' 
                  : 'none',
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
                    title: 'Expert-Powered',
                    description: 'Smart recommendations and personalized live coaching sessions',
                    color: '#22c55e',
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
                    onClick={() => handlePlatformClick()}
                    sx={{
                      bgcolor: '#22c55e',
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
                    onClick={() => handlePlatformClick()}
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
import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Stack,
} from '@mui/material';
import {
  PlayArrow,
  ArrowForward,
  School,
  Work,
  TrendingUp,
  AutoAwesome,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useThemeContext } from '../contexts/ThemeContext';
interface HeroSectionProps {
  onGetStarted: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onGetStarted }) => {
  const { isDarkMode } = useThemeContext();

  const stats = [
    { icon: <School />, value: '10,000+', label: 'Students Trained' },
    { icon: <Work />, value: '85%', label: 'Job Placement Rate' },
    { icon: <TrendingUp />, value: '500+', label: 'Partner Companies' },
  ];

  return (
    <Box
      id="hero"
      sx={{
        minHeight: { xs: 'calc(100vh + env(safe-area-inset-bottom))', sm: '100vh' },
        background: isDarkMode 
          ? 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)'
          : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        paddingBottom: { xs: 'env(safe-area-inset-bottom)', sm: 0 },
      }}
    >
      {/* Background Animation */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.4) 0%, transparent 60%),
            radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.2) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(255, 107, 107, 0.2) 0%, transparent 60%)
          `,
        }}
      />
      
      {/* Animated Shapes */}
      <Box
        component={motion.div}
        sx={{
          position: 'absolute',
          top: '10%',
          right: '10%',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.03)',
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
          background: 'rgba(255, 107, 107, 0.05)',
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

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
        <Grid 
          container 
          spacing={{ xs: 2, sm: 3, md: 4 }} 
          alignItems="center" 
          sx={{ 
            minHeight: { xs: '80vh', sm: '85vh', md: '80vh' }, 
            pt: { xs: 8, sm: 10, md: 12 },
            pb: { xs: 6, sm: 8, md: 4 }
          }}
        >
          {/* Left Content */}
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Stack spacing={{ xs: 2, sm: 3 }}>
                {/* Badge */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      bgcolor: 'rgba(255, 255, 255, 0.15)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '50px',
                      px: { xs: 2, sm: 3 },
                      py: { xs: 0.5, sm: 1 },
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'white',
                        fontWeight: 600,
                        fontSize: { xs: '0.8rem', sm: '0.9rem' },
                        textShadow: '0px 1px 2px rgba(0,0,0,0.2)',
                      }}
                    >
                      🌍 Africa's Leading Career Transformation Platform
                    </Typography>
                  </Box>
                </motion.div>

                {/* Main Headline */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                >
                  <Typography
                    variant="h1"
                    component="h1"
                    sx={{
                      color: 'white',
                      fontWeight: 800,
                      lineHeight: { xs: 1.2, md: 1.1 },
                      mb: { xs: 1, sm: 2 },
                      fontSize: { xs: '2rem', sm: '2.8rem', md: '3.5rem', lg: '4rem' },
                      textShadow: '0px 2px 4px rgba(0,0,0,0.2)',
                      textAlign: { xs: 'center', md: 'left' },
                    }}
                  >
                    Transform Careers and Businesses in{' '}
                    <Box
                      component="span"
                      sx={{
                        background: 'linear-gradient(45deg, #FF9E80, #FF6B6B)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        textShadow: 'none',
                      }}
                    >
                      Africa
                    </Box>
                  </Typography>
                </motion.div>

                {/* Subtitle */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                >
                  <Typography
                    variant="h5"
                    component="h2"
                    sx={{
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontWeight: 500,
                      lineHeight: 1.5,
                      mb: { xs: 2, md: 3 },
                      fontSize: { xs: '1rem', sm: '1.2rem', md: '1.4rem', lg: '1.5rem' },
                      textAlign: { xs: 'center', md: 'left' },
                    }}
                  >
                   Excellence Coaching Hub – Business Advisory, Tech Services, Finance & Leadership for Career Growth and Job Readiness
                  </Typography>
                </motion.div>

                {/* Description */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                >
                  <Typography
                    variant="body1"
                    sx={{
                      color: 'rgba(255, 255, 255, 0.85)',
                      fontSize: { xs: '0.95rem', sm: '1rem', md: '1.1rem' },
                      lineHeight: 1.7,
                      mb: { xs: 3, md: 4 },
                      maxWidth: { xs: '100%', md: '520px' },
                      textAlign: { xs: 'center', md: 'left' },
                    }}
                  >
                   We empower individuals, businesses, and organizations with expert training in Business Advisory, Tech Services, Finance, and Leadership. Through practical learning, mentoring, and job preparation, Excellence Coaching Hub equips you with the skills to grow, compete, and succeed across industries.
                  </Typography>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                >
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={{ xs: 2, sm: 3 }}
                    sx={{ mb: { xs: 3, md: 4 }, alignItems: 'center', justifyContent: { xs: 'center', md: 'flex-start' } }}
                  >
                    <Button
                      variant="contained"
                      size="large"
                      endIcon={<ArrowForward />}
                      onClick={onGetStarted}
                      sx={{
                        bgcolor: 'secondary.main',
                        color: 'white',
                        fontWeight: 700,
                        py: { xs: 1.5, sm: 1.8 },
                        px: { xs: 3, sm: 4 },
                        fontSize: { xs: '1rem', sm: '1.1rem' },
                        borderRadius: '8px',
                        minWidth: { xs: 200, sm: 'auto' },
                        boxShadow: '0 8px 25px rgba(255, 107, 107, 0.3)',
                        '&:hover': {
                          bgcolor: 'secondary.dark',
                          transform: 'translateY(-3px)',
                          boxShadow: '0 12px 35px rgba(255, 107, 107, 0.4)',
                        },
                        '&:active': {
                          transform: 'translateY(-1px)',
                          boxShadow: '0 5px 15px rgba(255, 107, 107, 0.4)',
                        },
                      }}
                    >
                      Get Started
                    </Button>
                    <Button
                      variant="outlined"
                      size="large"
                      startIcon={<PlayArrow />}
                      sx={{
                        color: 'white',
                        borderColor: 'white',
                        borderWidth: '2px',
                        fontWeight: 600,
                        py: 1.7,
                        px: 4,
                        fontSize: '1.1rem',
                        borderRadius: '8px',
                        backdropFilter: 'blur(5px)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        '&:hover': {
                          borderColor: 'rgba(255, 255, 255, 0.9)',
                          bgcolor: 'rgba(255, 255, 255, 0.15)',
                          transform: 'translateY(-3px)',
                          boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2)',
                        },
                        '&:active': {
                          transform: 'translateY(-1px)',
                          boxShadow: '0 5px 10px rgba(0, 0, 0, 0.2)',
                        },
                      }}
                    >
                      Watch Demo
                    </Button>
                  </Stack>
                </motion.div>

                {/* Stats */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.7 }}
                >
                  <Box sx={{ mt: { xs: 2, md: 3 }, mb: { xs: 4, md: 2 } }}>
                    <Grid container spacing={{ xs: 2, sm: 3 }}>
                      {stats.map((stat, index) => (
                        <Grid item xs={4} key={index}>
                          <Box sx={{ 
                            textAlign: 'center',
                            py: { xs: 1, sm: 1.5 },
                            px: { xs: 0.5, sm: 1 }
                          }}>
                            <Box
                              sx={{
                                color: 'rgba(255, 255, 255, 0.8)',
                                mb: { xs: 0.5, sm: 1 },
                                display: 'flex',
                                justifyContent: 'center',
                                fontSize: { xs: '1.2rem', sm: '1.5rem' }
                              }}
                            >
                              {stat.icon}
                            </Box>
                            <Typography
                              variant="h6"
                              sx={{
                                color: 'white',
                                fontWeight: 700,
                                fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' },
                                lineHeight: 1.2,
                              }}
                            >
                              {stat.value}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                color: 'rgba(255, 255, 255, 0.7)',
                                fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' },
                                lineHeight: 1.3,
                                mt: 0.5
                              }}
                            >
                              {stat.label}
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </motion.div>
              </Stack>
            </motion.div>
          </Grid>

          {/* Right Content - Illustration/Image */}
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <Box
                sx={{
                  position: 'relative',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: { xs: '300px', md: '500px' },
                }}
              >
                {/* Modern Hero Image with Animation */}
                <Box
                  component={motion.div}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8 }}
                  sx={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {/* Main Image */}
                  <Box
                    component="img"
                    src="/get-a-job-with-online-diploma.png"
                    alt="Excellence Coaching Hub"
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '20px',
                    }}
                  />
                  
                  {/* Overlay with Gradient */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(135deg, rgba(63, 81, 181, 0.2) 0%, rgba(255, 107, 107, 0.2) 100%)',
                      borderRadius: '20px',
                      backdropFilter: 'blur(2px)',
                    }}
                  />
                  
                  {/* Floating Elements */}
                  {[...Array(5)].map((_, i) => (
                    <Box
                      component={motion.div}
                      key={i}
                      sx={{
                        position: 'absolute',
                        width: { xs: '40px', md: '60px' },
                        height: { xs: '40px', md: '60px' },
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.15)',
                        backdropFilter: 'blur(5px)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        top: `${15 + i * 18}%`,
                        left: `${10 + i * 18}%`,
                        zIndex: 2,
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                      }}
                      animate={{
                        y: [0, -15, 0],
                        x: [0, 5, 0],
                        rotate: [0, 5, 0],
                      }}
                      transition={{
                        duration: 4 + i,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: i * 0.5,
                      }}
                    >
                      {i === 0 && <School sx={{ color: 'white', fontSize: { xs: 24, md: 30 } }} />}
                      {i === 1 && <Work sx={{ color: 'white', fontSize: { xs: 24, md: 30 } }} />}
                      {i === 2 && <TrendingUp sx={{ color: 'white', fontSize: { xs: 24, md: 30 } }} />}
                      {i === 3 && <AutoAwesome sx={{ color: 'white', fontSize: { xs: 24, md: 30 } }} />}
                      {i === 4 && <PlayArrow sx={{ color: 'white', fontSize: { xs: 24, md: 30 } }} />}
                    </Box>
                  ))}
                </Box>
              </Box>
            </motion.div>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default HeroSection;
import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
} from '@mui/material';
import {
  Favorite,
  Handshake,
  Security,
  Star,
  Visibility,
  Flag,
} from '@mui/icons-material';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { useThemeContext } from '../contexts/ThemeContext';

const AboutSection: React.FC = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const { isDarkMode } = useThemeContext();

  const values = [
    {
      icon: <Favorite />,
      title: 'Customer-Centered',
      description: 'Our customers\' success drives everything we do. We prioritize your growth and achievement above all else.',
      color: '#e91e63',
    },
    {
      icon: <Handshake />,
      title: 'Partnerships',
      description: 'We believe in trust, collaboration, and building long-term relationships with our students and partners.',
      color: '#2196f3',
    },
    {
      icon: <Security />,
      title: 'Integrity',
      description: 'We uphold honesty and strong moral principles in all our interactions and services.',
      color: '#4caf50',
    },
    {
      icon: <Star />,
      title: 'Professionalism',
      description: 'We maintain high-quality standards in coaching, assessments, and all our educational services.',
      color: '#ff9800',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
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

  return (
    <Box
      id="about"
      ref={ref}
      sx={{
        py: { xs: 6, sm: 8, md: 12 },
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
                    background: 'linear-gradient(45deg, #22c55e, #16a34a)',
                    borderRadius: '2px',
                  }
                }}
              >
                About Excellence Coaching Hub
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: 'text.secondary',
                  maxWidth: { xs: '100%', sm: '700px', md: '800px' },
                  mx: 'auto',
                  lineHeight: 1.7,
                  fontSize: { xs: '1rem', sm: '1.15rem', md: '1.3rem' },
                  px: { xs: 1, sm: 2, md: 0 },
                  fontWeight: 400,
                  textAlign: 'center',
                }}
              >
                Transforming Africa's talent and businesses through innovative coaching,
                training, and advisory services that drive sustainable growth and success
                across the continent and beyond.
              </Typography>
            </Box>
          </motion.div>

          {/* Vision, Mission, Values Grid */}
          <Grid container spacing={{ xs: 3, sm: 4 }} sx={{ mb: { xs: 6, md: 8 } }}>
            {/* Vision */}
            <Grid item xs={12} lg={6}>
              <motion.div variants={itemVariants}>
                <Card
                  sx={{
                    height: '100%',
                    background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)',
                    color: 'white',
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: '24px',
                    boxShadow: '0 20px 40px rgba(30, 64, 175, 0.15)',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    '&:hover': {
                      transform: 'translateY(-12px) scale(1.02)',
                      boxShadow: '0 25px 50px rgba(30, 64, 175, 0.25)',
                    }
                  }}
                >
                  <Box
                    component={motion.div}
                    animate={{
                      rotate: [0, 360],
                    }}
                    transition={{
                      duration: 40,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                    sx={{
                      position: 'absolute',
                      top: -80,
                      right: -80,
                      width: 200,
                      height: 200,
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '50%',
                    }}
                  />
                  <CardContent sx={{ p: 4, position: 'relative', zIndex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Avatar
                        sx={{
                          bgcolor: 'rgba(255, 255, 255, 0.2)',
                          mr: 2,
                          width: 56,
                          height: 56,
                        }}
                      >
                        <Visibility sx={{ fontSize: 28 }} />
                      </Avatar>
                      <Typography variant="h4" sx={{ fontWeight: 600 }}>
                        Vision
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ lineHeight: 1.8, fontSize: '1.1rem', fontWeight: 400 }}>
                      ECH envisages to become a leading African Hub for high quality coaching, 
                      training and advisory services, offering to businesses, organizations, 
                      and individuals the solutions that drive efficiency, growth, adaptability 
                      and success in an ever-changing world.
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>

            {/* Mission */}
            <Grid item xs={12} md={6}>
              <motion.div variants={itemVariants}>
                <Card
                  sx={{
                    height: '100%',
                    background: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)',
                    color: 'white',
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: '24px',
                    boxShadow: '0 20px 40px rgba(5, 150, 105, 0.15)',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    '&:hover': {
                      transform: 'translateY(-12px) scale(1.02)',
                      boxShadow: '0 25px 50px rgba(5, 150, 105, 0.25)',
                    }
                  }}
                >
                  <Box
                    component={motion.div}
                    animate={{
                      rotate: [0, -360],
                    }}
                    transition={{
                      duration: 40,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                    sx={{
                      position: 'absolute',
                      top: -80,
                      right: -80,
                      width: 200,
                      height: 200,
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '50%',
                    }}
                  />
                  <CardContent sx={{ p: 4, position: 'relative', zIndex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Avatar
                        sx={{
                          bgcolor: 'rgba(255, 255, 255, 0.2)',
                          mr: 2,
                          width: 56,
                          height: 56,
                        }}
                      >
                        <Flag sx={{ fontSize: 28 }} />
                      </Avatar>
                      <Typography variant="h4" sx={{ fontWeight: 600 }}>
                        Mission
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ lineHeight: 1.8, fontSize: '1.1rem', fontWeight: 400 }}>
                      ECH is dedicated to providing businesses, organizations, and individuals 
                      across Africa and beyond with high-quality tailor-made coaching, training 
                      and advisory services needed to thrive in a dynamic global landscape.
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          </Grid>

          {/* Values Section */}
          <motion.div variants={itemVariants}>
            <Box sx={{ textAlign: 'center', mb: 6 }}>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 700,
                  mb: 3,
                  color: 'text.primary',
                  fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.5rem' },
                  background: isDarkMode 
                    ? 'linear-gradient(45deg, #4ade80, #22c55e)'
                    : 'linear-gradient(45deg, #22c55e, #16a34a)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Our Core Values
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: 'text.secondary',
                  maxWidth: '600px',
                  mx: 'auto',
                  fontSize: '1.1rem',
                }}
              >
                The principles that guide everything we do
              </Typography>
            </Box>
          </motion.div>

          {/* Values Grid */}
          <Grid container spacing={3}>
            {values.map((value, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <motion.div
                  variants={itemVariants}
                  whileHover={{
                    y: -8,
                    scale: 1.03,
                    transition: { duration: 0.3, ease: "easeOut" },
                  }}
                >
                  <Card
                    sx={{
                      height: '100%',
                      textAlign: 'center',
                      position: 'relative',
                      overflow: 'hidden',
                      borderRadius: '20px',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 0, 0, 0.08)',
                      backdropFilter: 'blur(10px)',
                      background: isDarkMode ? 'rgba(16, 24, 40, 0.9)' : 'rgba(255, 255, 255, 0.95)',
                      '&:hover': {
                        boxShadow: isDarkMode ? '0 20px 50px rgba(0, 0, 0, 0.6)' : '0 20px 50px rgba(0, 0, 0, 0.15)',
                        transform: 'translateY(-8px)',
                        border: `1px solid ${value.color}20`,
                      },
                    }}
                  >
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 6,
                        bgcolor: value.color,
                        borderTopLeftRadius: '16px',
                        borderTopRightRadius: '16px',
                      }}
                    />
                    <CardContent sx={{ p: 4 }}>
                      <Avatar
                        sx={{
                          bgcolor: value.color,
                          width: 64,
                          height: 64,
                          mx: 'auto',
                          mb: 3,
                        }}
                      >
                        {React.cloneElement(value.icon, { sx: { fontSize: 32, color: isDarkMode ? '#fff' : undefined } })}
                      </Avatar>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          mb: 2,
                          color: isDarkMode ? 'grey.100' : 'text.primary',
                        }}
                      >
                        {value.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: isDarkMode ? 'grey.400' : 'text.secondary',
                          lineHeight: 1.6,
                        }}
                      >
                        {value.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>

          {/* Stats Section */}
          <motion.div variants={itemVariants}>
            <Box
              sx={{
                mt: 10,
                p: { xs: 4, md: 6 },
                background: isDarkMode
                  ? 'linear-gradient(135deg, #0b1220 0%, #111827 100%)'
                  : 'linear-gradient(135deg, #3f51b5 0%, #6a1b9a 100%)',
                borderRadius: '24px',
                color: 'white',
                textAlign: 'center',
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
                  position: 'relative',
                  zIndex: 1,
                  textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }}
              >
                Making Impact Across Africa
              </Typography>
              <Grid container spacing={4}>
                {[
                  { number: '15+', label: 'African Countries' },
                  { number: '10,000+', label: 'Students Trained' },
                  { number: '500+', label: 'Partner Companies' },
                  { number: '85%', label: 'Success Rate' },
                ].map((stat, index) => (
                  <Grid item xs={6} md={3} key={index}>
                    <Box
                      component={motion.div}
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.3 }}
                      sx={{
                        p: 2,
                        borderRadius: '16px',
                        background: isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(5px)',
                        border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(255, 255, 255, 0.2)',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Typography
                        variant="h3"
                        sx={{ 
                          fontWeight: 800, 
                          mb: 1,
                          background: 'linear-gradient(45deg, #ffffff, #f0f0f0)',
                          backgroundClip: 'text',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          textShadow: '0 2px 10px rgba(0,0,0,0.1)',
                        }}
                      >
                        {stat.number}
                      </Typography>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          opacity: 0.9,
                          fontWeight: 500,
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
        </motion.div>
      </Container>
    </Box>
  );
};

export default AboutSection;
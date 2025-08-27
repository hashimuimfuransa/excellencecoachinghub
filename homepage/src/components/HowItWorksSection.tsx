import React, { useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
  Avatar,
  Step,
  StepLabel,
  Stepper,
  StepConnector,
  stepConnectorClasses,
  StepIconProps,
} from '@mui/material';
import {
  PersonAdd,
  School,
  Psychology,
  Verified,
  Work,
  CheckCircle,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { motion, useInView } from 'framer-motion';
import { useThemeContext } from '../contexts/ThemeContext';

// Stepper custom connector
const ColorlibConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 22,
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage: 'linear-gradient(95deg, #22c55e 0%, #16a34a 50%, #22c55e 100%)',
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage: 'linear-gradient(95deg, #22c55e 0%, #16a34a 50%, #22c55e 100%)',
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 4,
    border: 0,
    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : '#eaeaf0',
    borderRadius: 2,
    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
  },
}));

// Stepper custom icons
const ColorlibStepIconRoot = styled('div')<{
  ownerState: { completed?: boolean; active?: boolean };
}>(({ theme, ownerState }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[700] : '#e0e0e0',
  zIndex: 1,
  color: '#fff',
  width: 60,
  height: 60,
  display: 'flex',
  borderRadius: '50%',
  justifyContent: 'center',
  alignItems: 'center',
  transition: 'all 0.3s ease',
  border: '2px solid transparent',
  ...(ownerState.active && {
    backgroundImage: 'linear-gradient(136deg, #22c55e 0%, #16a34a 50%, #22c55e 100%)',
    boxShadow: '0 8px 20px rgba(106, 27, 154, 0.3)',
    transform: 'scale(1.1)',
  }),
  ...(ownerState.completed && {
    backgroundImage: 'linear-gradient(136deg, #22c55e 0%, #16a34a 50%, #22c55e 100%)',
    boxShadow: '0 4px 15px rgba(106, 27, 154, 0.2)',
  }),
  '&:hover': {
    transform: 'scale(1.05)',
    boxShadow: '0 6px 15px rgba(0,0,0,0.1)',
  },
}));

function ColorlibStepIcon(props: StepIconProps) {
  const { active, completed, className } = props;

  const icons: { [index: string]: React.ReactElement } = {
    1: <PersonAdd />,
    2: <School />,
    3: <Psychology />,
    4: <Verified />,
    5: <Work />,
  };

  return (
    <ColorlibStepIconRoot ownerState={{ completed, active }} className={className}>
      {icons[String(props.icon)]}
    </ColorlibStepIconRoot>
  );
}

const HowItWorksSection: React.FC = () => {
  const theme = useTheme();
  const { isDarkMode } = useThemeContext();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  // Steps for both individuals & organizations
  const steps = [
    {
      label: 'Register & Create Profile',
      description: 'Sign up as an individual, business, or organization and set your goals.',
      icon: <PersonAdd />,
      color: '#1976d2',
    },
    {
      label: 'Access Training & Courses',
      description: 'Join tailored programs in Business Advisory, Tech, Finance, and Leadership.',
      icon: <School />,
      color: '#2e7d32',
    },
    {
      label: 'Assess & Improve Skills',
      description: 'Use psychometric tools, coaching, and interactive assessments to grow.',
      icon: <Psychology />,
      color: '#ed6c02',
    },
    {
      label: 'Earn Recognized Certificates',
      description: 'Gain secure, blockchain-based certificates that prove your achievements.',
      icon: <Verified />,
      color: '#9c27b0',
    },
    {
      label: 'Achieve Growth & Success',
      description: 'Secure jobs, scale businesses, and build leadership impact across industries.',
      icon: <Work />,
      color: '#d32f2f',
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
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  };

  return (
    <Box
      id="how-it-works"
      ref={ref}
      sx={{
        py: { xs: 6, sm: 8, md: 12 },
        bgcolor: isDarkMode ? '#0f0f23' : 'grey.50',
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
                How It Works
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: 'text.secondary',
                  maxWidth: '800px',
                  mx: 'auto',
                  lineHeight: 1.6,
                }}
              >
                A simple 5-step journey for individuals, businesses, and organizations to succeed
              </Typography>
            </Box>
          </motion.div>

          {/* Desktop Stepper */}
          {!isMobile && (
            <motion.div variants={itemVariants}>
              <Box sx={{ mb: 8 }}>
                <Stepper alternativeLabel activeStep={5} connector={<ColorlibConnector />}>
                  {steps.map((step) => (
                    <Step key={step.label}>
                      <StepLabel StepIconComponent={ColorlibStepIcon}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mt: 2 }}>
                          {step.label}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ color: 'text.secondary', mt: 1, maxWidth: 200 }}
                        >
                          {step.description}
                        </Typography>
                      </StepLabel>
                    </Step>
                  ))}
                </Stepper>
              </Box>
            </motion.div>
          )}

          {/* Mobile/Tablet Cards */}
          <Grid container spacing={3}>
            {steps.map((step, index) => (
              <Grid item xs={12} sm={6} md={isMobile ? 12 : 2.4} key={index}>
                <motion.div
                  variants={itemVariants}
                  whileHover={{ y: -10, transition: { duration: 0.3 } }}
                >
                  <Card
                    sx={{
                      height: '100%',
                      textAlign: 'center',
                      position: 'relative',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      borderRadius: '16px',
                      transition: 'all 0.3s ease',
                      border: isDarkMode 
                        ? '1px solid rgba(255, 255, 255, 0.1)' 
                        : '1px solid rgba(0, 0, 0, 0.05)',
                      background: isDarkMode 
                        ? 'linear-gradient(145deg, rgba(30, 30, 30, 0.9), rgba(40, 40, 40, 0.8))'
                        : 'linear-gradient(145deg, #ffffff, #f8f9fa)',
                      '&:hover': {
                        boxShadow: isDarkMode 
                          ? '0 15px 40px rgba(0, 0, 0, 0.4)' 
                          : '0 15px 40px rgba(0, 0, 0, 0.12)',
                        transform: 'translateY(-5px)',
                      },
                    }}
                  >
                    {/* Step Number */}
                    <Box
                      component={motion.div}
                      whileHover={{ scale: 1.1, rotate: 10 }}
                      transition={{ duration: 0.2 }}
                      sx={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${step.color} 0%, ${step.color}dd 100%)`,
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '1rem',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                        zIndex: 2,
                      }}
                    >
                      {index + 1}
                    </Box>

                    <CardContent sx={{ p: 4, pt: 5 }}>
                      <Box
                        component={motion.div}
                        whileHover={{ scale: 1.05, rotate: [0, 5, 0, -5, 0], transition: { duration: 0.5 } }}
                        sx={{ position: 'relative', mb: 3 }}
                      >
                        <Avatar
                          sx={{
                            background: `linear-gradient(135deg, ${step.color} 0%, ${step.color}dd 100%)`,
                            width: 80,
                            height: 80,
                            mx: 'auto',
                            boxShadow: `0 8px 20px ${step.color}33`,
                            border: isDarkMode 
                              ? '4px solid rgba(40, 40, 40, 0.8)' 
                              : '4px solid white',
                          }}
                        >
                          {React.cloneElement(step.icon, { sx: { fontSize: 36 } })}
                        </Avatar>
                        <Box
                          sx={{
                            position: 'absolute',
                            top: -5,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 90,
                            height: 90,
                            borderRadius: '50%',
                            background: `${step.color}11`,
                            zIndex: -1,
                          }}
                        />
                      </Box>
                      
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                        {step.label}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                        {step.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>

          {/* Why Choose Our Platform Section */}
          <motion.div variants={itemVariants}>
            <Box
              sx={{
                mt: 10,
                p: { xs: 4, md: 6 },
                background: 'linear-gradient(135deg, #3f51b5 0%, #6a1b9a 100%)',
                borderRadius: '24px',
                color: 'white',
                textAlign: 'center',
                boxShadow: '0 20px 60px rgba(63, 81, 181, 0.25)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Animated Background */}
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
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
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
                animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
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
                Why Choose Our Platform?
              </Typography>

              <Grid container spacing={4}>
                {[
                  {
                    icon: <CheckCircle />,
                    title: 'Expert-Led Training',
                    description:
                      'Programs in Business Advisory, Tech Services, Finance, and Leadership with live coaching for individuals, businesses, and organizations.',
                  },
                  {
                    icon: <Verified />,
                    title: 'Verified Blockchain Certificates',
                    description:
                      'Secure, tamper-proof certificates that validate skills and achievements across industries.',
                  },
                  {
                    icon: <Psychology />,
                    title: 'Psychometric & Skills Assessments',
                    description:
                      'Comprehensive tools to identify strengths, improve performance, and guide professional growth.',
                  },
                  {
                    icon: <Work />,
                    title: 'Career & Business Growth',
                    description:
                      'From job placement to business advisory, we drive measurable success for people and enterprises alike.',
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
                        position: 'relative',
                        zIndex: 1,
                        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)',
                      }}
                    >
                      <Avatar
                        sx={{
                          bgcolor: 'rgba(255, 255, 255, 0.2)',
                          width: 70,
                          height: 70,
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
                        sx={{ fontWeight: 700, mb: 1, textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                      >
                        {feature.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ opacity: 0.9, lineHeight: 1.6, fontWeight: 500 }}
                      >
                        {feature.description}
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

export default HowItWorksSection;

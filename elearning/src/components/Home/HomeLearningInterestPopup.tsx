import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  LinearProgress,
  useTheme,
  useMediaQuery,
  Stack,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  RadioGroup,
  Radio,
  FormControlLabel,
  Fade
} from '@mui/material';
import {
  Close,
  ArrowBack,
  ArrowForward,
  School,
  Business,
  Psychology,
  Computer,
  Palette,
  LocalHospital,
  Work,
  Person,
  TrendingUp,
  AccessTime,
  Visibility,
  Handshake,
  Book,
  Group,
  Star,
  Description
} from '@mui/icons-material';
import { styled } from '@mui/system';
import {
  CategoriesStep,
  CareerGoalStep,
  ExperienceLevelStep,
  SpecificInterestsStep,
  TimeCommitmentStep,
  LearningStyleStep
} from './StepContentComponents';

interface HomeLearningInterestPopupProps {
  open: boolean;
  onClose: () => void;
  onComplete: (data: any, type?: 'courses' | 'past-papers') => void;
}

const StyledDialog = styled(Dialog)(({ theme }) => ({
  zIndex: 9999,
  '& .MuiDialog-paper': {
    borderRadius: theme.spacing(3),
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 248, 255, 0.95) 50%, rgba(255, 240, 245, 0.95) 100%)',
    backdropFilter: 'blur(30px)',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    boxShadow: `
      0 25px 50px rgba(0, 0, 0, 0.15),
      0 0 0 1px rgba(255, 255, 255, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.4)
    `,
    maxWidth: '600px',
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    animation: 'dialogSlideIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(45deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 50%, rgba(236, 72, 153, 0.1) 100%)',
      pointerEvents: 'none',
      animation: 'shimmer 3s ease-in-out infinite',
    },
    [theme.breakpoints.down('sm')]: {
      margin: theme.spacing(1),
      height: 'auto',
      maxHeight: '85vh',
      borderRadius: theme.spacing(2),
      width: 'calc(100% - 16px)',
    },
  },
  '@keyframes dialogSlideIn': {
    '0%': {
      opacity: 0,
      transform: 'scale(0.8) translateY(50px)',
    },
    '100%': {
      opacity: 1,
      transform: 'scale(1) translateY(0)',
    },
  },
  '@keyframes shimmer': {
    '0%': { transform: 'translateX(-100%)' },
    '100%': { transform: 'translateX(100%)' },
  },
  '& .MuiDialogTitle-root': {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
    color: 'white',
    padding: theme.spacing(2, 3),
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: '-100%',
      width: '100%',
      height: '100%',
      background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
      animation: 'titleShimmer 2s infinite',
    },
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(1.5, 2),
    },
  },
  '@keyframes titleShimmer': {
    '0%': { left: '-100%' },
    '100%': { left: '100%' },
  },
  '@keyframes textGlow': {
    '0%': { textShadow: '0 0 20px rgba(102, 126, 234, 0.3)' },
    '100%': { textShadow: '0 0 30px rgba(102, 126, 234, 0.6), 0 0 40px rgba(118, 75, 162, 0.4)' },
  },
  '@keyframes fadeInUp': {
    '0%': { opacity: 0, transform: 'translateY(20px)' },
    '100%': { opacity: 1, transform: 'translateY(0)' },
  },
  '@keyframes cardPulse': {
    '0%, 100%': { transform: 'scale(1)' },
    '50%': { transform: 'scale(1.02)' },
  },
  '@keyframes badgePulse': {
    '0%, 100%': { transform: 'scale(1)', boxShadow: '0 4px 12px rgba(233, 30, 99, 0.4)' },
    '50%': { transform: 'scale(1.1)', boxShadow: '0 6px 16px rgba(233, 30, 99, 0.6)' },
  },
  '@keyframes bounce': {
    '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
    '40%': { transform: 'translateY(-10px)' },
    '60%': { transform: 'translateY(-5px)' },
  },
  '@keyframes buttonPulse': {
    '0%, 100%': { transform: 'scale(1)' },
    '50%': { transform: 'scale(1.02)' },
  },
  '& .MuiDialogContent-root': {
    padding: theme.spacing(2.5),
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(1.5),
    },
  },
  '& .MuiDialogActions-root': {
    padding: theme.spacing(1.5, 2.5),
    borderTop: '1px solid rgba(0,0,0,0.05)',
    flexDirection: { xs: 'column', sm: 'row' },
    gap: { xs: 1.5, sm: 0 },
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(1.5),
    },
  },
}));

const StyledChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
  padding: theme.spacing(1),
  fontSize: '1rem',
  fontWeight: 600,
  borderRadius: theme.spacing(1.5),
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
  },
  '&.MuiChip-clickable:active': {
    boxShadow: 'none',
    transform: 'none',
  },
  [theme.breakpoints.down('sm')]: {
    fontSize: '0.85rem',
    padding: theme.spacing(0.75),
    borderRadius: theme.spacing(1),
  },
}));

const HomeLearningInterestPopup: React.FC<HomeLearningInterestPopupProps> = ({ open, onClose, onComplete }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    categories: [] as string[],
    careerGoal: '',
    experienceLevel: '',
    specificInterests: [] as string[],
    timeCommitment: '',
    learningStyle: '',
  });

  const steps = [
    {
      title: "What are your primary learning interests?",
      description: "Select categories that align with your goals.",
      icon: <School sx={{ fontSize: 40, color: 'white' }} />,
    },
    {
      title: "What is your current career goal or status?",
      description: "This helps us tailor recommendations to your professional journey.",
      icon: <TrendingUp sx={{ fontSize: 40, color: 'white' }} />,
    },
    {
      title: "What is your current experience level?",
      description: "This helps us recommend courses suitable for your skill set.",
      icon: <Person sx={{ fontSize: 40, color: 'white' }} />,
    },
    {
      title: "Any specific topics or skills you're interested in?",
      description: "Tell us more about what you want to learn.",
      icon: <Book sx={{ fontSize: 40, color: 'white' }} />,
    },
    {
      title: "How much time can you commit to learning per week?",
      description: "This helps us suggest courses that fit your schedule.",
      icon: <AccessTime sx={{ fontSize: 40, color: 'white' }} />,
    },
    {
      title: "Ready to start learning?",
      description: "Choose how you'd like to begin your learning journey - browse courses or practice with past papers.",
      icon: <School sx={{ fontSize: 40, color: 'white' }} />,
    },
  ];

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleChange = (prop: keyof typeof formData) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [prop]: event.target.value });
  };

  const handleCategoryToggle = (value: string) => {
    setFormData((prev) => {
      const newCategories = prev.categories.includes(value)
        ? prev.categories.filter((cat) => cat !== value)
        : [...prev.categories, value];
      return { ...prev, categories: newCategories };
    });
  };

  const handleSpecificInterestsChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const interestsArray = event.target.value.split(',').map(item => item.trim()).filter(item => item !== '');
    setFormData({ ...formData, specificInterests: interestsArray });
  };

  const handleComplete = (type: 'courses' | 'past-papers' = 'courses') => {
    onComplete(formData, type);
  };

  const isStepValid = () => {
    switch (activeStep) {
      case 0: return formData.categories.length > 0;
      case 1: return !!formData.careerGoal;
      case 2: return !!formData.experienceLevel;
      case 3: return true; // Specific interests are optional
      case 4: return !!formData.timeCommitment;
      case 5: return !!formData.learningStyle;
      default: return true;
    }
  };

  return (
    <StyledDialog
      open={open}
      onClose={onClose}
      TransitionComponent={Fade}
      TransitionProps={{ timeout: 500 }}
      aria-labelledby="home-learning-interest-dialog-title"
    >
      <DialogTitle id="home-learning-interest-dialog-title">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
          }}>
            {steps[activeStep].icon}
          </Box>
          <Typography variant={isMobile ? "h6" : "h5"} component="span" sx={{ fontWeight: 700, color: 'white' }}>
            {steps[activeStep].title}
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <Close />
        </IconButton>
      </DialogTitle>
      <LinearProgress variant="determinate" value={((activeStep + 1) / steps.length) * 100} sx={{ height: 8, bgcolor: 'rgba(0,0,0,0.1)' }} />
      <DialogContent dividers>
        <Fade in={true} key={activeStep} timeout={500}>
          <Box>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3, fontSize: '1.05rem' }}>
              {steps[activeStep].description}
            </Typography>
            
            {/* Render step content based on active step */}
            {activeStep === 0 && (
              <CategoriesStep
                formData={formData}
                onCategoryToggle={handleCategoryToggle}
                onChange={handleChange}
                onSpecificInterestsChange={handleSpecificInterestsChange}
              />
            )}
            {activeStep === 1 && (
              <CareerGoalStep
                formData={formData}
                onCategoryToggle={handleCategoryToggle}
                onChange={handleChange}
                onSpecificInterestsChange={handleSpecificInterestsChange}
              />
            )}
            {activeStep === 2 && (
              <ExperienceLevelStep
                formData={formData}
                onCategoryToggle={handleCategoryToggle}
                onChange={handleChange}
                onSpecificInterestsChange={handleSpecificInterestsChange}
              />
            )}
            {activeStep === 3 && (
              <SpecificInterestsStep
                formData={formData}
                onCategoryToggle={handleCategoryToggle}
                onChange={handleChange}
                onSpecificInterestsChange={handleSpecificInterestsChange}
              />
            )}
            {activeStep === 4 && (
              <TimeCommitmentStep
                formData={formData}
                onCategoryToggle={handleCategoryToggle}
                onChange={handleChange}
                onSpecificInterestsChange={handleSpecificInterestsChange}
              />
            )}
            {activeStep === 5 && (
              <Box sx={{ py: { xs: 1, sm: 2 }, position: 'relative' }}>
                <Typography variant="h6" sx={{ 
                  mb: { xs: 2, sm: 3 }, 
                  fontWeight: 800, 
                  fontSize: { xs: '1.2rem', sm: '1.4rem' },
                  textAlign: 'center',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  animation: 'textGlow 2s ease-in-out infinite alternate',
                  textShadow: '0 0 20px rgba(102, 126, 234, 0.3)',
                }}>
                  🎯 Ready to start your learning journey?
                </Typography>
                
                <Typography variant="body2" sx={{ 
                  mb: { xs: 2, sm: 3 }, 
                  color: '#64748b', 
                  textAlign: 'center',
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                  fontWeight: 500,
                  animation: 'fadeInUp 0.8s ease-out 0.2s both'
                }}>
                  Choose how you'd like to begin based on your preferences
                </Typography>
                
                <Box sx={{ 
                  display: 'flex', 
                  gap: { xs: 1.5, sm: 2 }, 
                  flexDirection: { xs: 'column', sm: 'row' },
                  mb: { xs: 2, sm: 3 }
                }}>
                  {/* Past Papers - Left Side */}
                  <Box 
                    onClick={() => handleComplete('past-papers')}
                    sx={{ 
                      flex: 1,
                      p: { xs: 2.5, sm: 3 }, 
                      border: '3px solid #E91E63', 
                      borderRadius: 3, 
                      textAlign: 'center',
                      background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 50%, #f9a8d4 100%)',
                      position: 'relative',
                      transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      cursor: 'pointer',
                      animation: 'cardPulse 2s ease-in-out infinite',
                      overflow: 'hidden',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(45deg, rgba(233, 30, 99, 0.1) 0%, rgba(240, 147, 212, 0.1) 100%)',
                        opacity: 0,
                        transition: 'opacity 0.3s ease',
                      },
                      '&:hover': {
                        borderColor: '#C2185B',
                        transform: 'translateY(-8px) scale(1.02)',
                        boxShadow: '0 20px 40px rgba(233, 30, 99, 0.3), 0 0 0 1px rgba(233, 30, 99, 0.2)',
                        background: 'linear-gradient(135deg, #fce7f3 0%, #f9a8d4 50%, #f472b6 100%)',
                        '&::before': {
                          opacity: 1,
                        },
                        '& .icon-bounce': {
                          animation: 'bounce 0.6s ease-in-out',
                        }
                      }
                    }}
                  >
                    <Box sx={{
                      position: 'absolute',
                      top: -10,
                      right: -10,
                      background: 'linear-gradient(135deg, #E91E63 0%, #C2185B 100%)',
                      color: 'white',
                      borderRadius: '50%',
                      width: 28,
                      height: 28,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      boxShadow: '0 4px 12px rgba(233, 30, 99, 0.4)',
                      animation: 'badgePulse 1.5s ease-in-out infinite'
                    }}>
                      !
                    </Box>
                    <Description 
                      className="icon-bounce"
                      sx={{ 
                        fontSize: { xs: 36, sm: 44 }, 
                        color: '#E91E63', 
                        mb: 1.5,
                        filter: 'drop-shadow(0 4px 8px rgba(233, 30, 99, 0.3))'
                      }} 
                    />
                    <Typography variant="h6" sx={{ 
                      fontWeight: 800, 
                      mb: 1, 
                      color: '#C2185B', 
                      fontSize: { xs: '1.1rem', sm: '1.2rem' },
                      textShadow: '0 2px 4px rgba(194, 24, 91, 0.2)'
                    }}>
                      Practice Past Papers
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: '#9d174d', 
                      fontSize: { xs: '0.8rem', sm: '0.9rem' },
                      lineHeight: 1.5,
                      fontWeight: 500
                    }}>
                      Test your knowledge with real exam questions and track your progress
                    </Typography>
                  </Box>
                  
                  {/* Courses - Right Side */}
                  <Box 
                    onClick={() => handleComplete('courses')}
                    sx={{ 
                      flex: 1,
                      p: { xs: 2.5, sm: 3 }, 
                      border: '3px solid #4CAF50', 
                      borderRadius: 3, 
                      textAlign: 'center',
                      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)',
                      position: 'relative',
                      transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      cursor: 'pointer',
                      animation: 'cardPulse 2s ease-in-out infinite 0.5s',
                      overflow: 'hidden',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(45deg, rgba(76, 175, 80, 0.1) 0%, rgba(187, 247, 208, 0.1) 100%)',
                        opacity: 0,
                        transition: 'opacity 0.3s ease',
                      },
                      '&:hover': {
                        borderColor: '#388e3c',
                        transform: 'translateY(-8px) scale(1.02)',
                        boxShadow: '0 20px 40px rgba(76, 175, 80, 0.3), 0 0 0 1px rgba(76, 175, 80, 0.2)',
                        background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 50%, #86efac 100%)',
                        '&::before': {
                          opacity: 1,
                        },
                        '& .icon-bounce': {
                          animation: 'bounce 0.6s ease-in-out',
                        }
                      }
                    }}
                  >
                    <School 
                      className="icon-bounce"
                      sx={{ 
                        fontSize: { xs: 36, sm: 44 }, 
                        color: '#4CAF50', 
                        mb: 1.5,
                        filter: 'drop-shadow(0 4px 8px rgba(76, 175, 80, 0.3))'
                      }} 
                    />
                    <Typography variant="h6" sx={{ 
                      fontWeight: 800, 
                      mb: 1, 
                      color: '#2e7d32', 
                      fontSize: { xs: '1.1rem', sm: '1.2rem' },
                      textShadow: '0 2px 4px rgba(46, 125, 50, 0.2)'
                    }}>
                      Browse Courses
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: '#1b5e20', 
                      fontSize: { xs: '0.8rem', sm: '0.9rem' },
                      lineHeight: 1.5,
                      fontWeight: 500
                    }}>
                      Explore structured learning paths with video lessons, assignments, and certificates
                    </Typography>
                  </Box>
                </Box>
                
                <Typography variant="caption" sx={{ 
                  color: '#64748b', 
                  fontStyle: 'italic', 
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  textAlign: 'center',
                  display: 'block'
                }}>
                  💡 Tip: Past papers are great for quick practice, courses for deep learning
                </Typography>
              </Box>
            )}
          </Box>
        </Fade>
      </DialogContent>
      <DialogActions sx={{ flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 2, sm: 0 } }}>
        {activeStep < steps.length - 1 ? (
          <>
            <Button
              onClick={handleBack}
              disabled={activeStep === 0}
              startIcon={<ArrowBack />}
              sx={{ textTransform: 'none', fontWeight: 600, order: { xs: 2, sm: 1 } }}
            >
              Back
            </Button>
            <Box sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }} />
            <Button
              onClick={handleNext}
              disabled={!isStepValid()}
              endIcon={<ArrowForward />}
              variant="contained"
              sx={{ 
                textTransform: 'none', 
                fontWeight: 600,
                background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #5a67d8 30%, #6b46c1 90%)',
                },
                order: { xs: 1, sm: 2 },
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              Next
            </Button>
          </>
        ) : (
          <Box sx={{ display: 'flex', gap: { xs: 1.5, sm: 2 }, flexDirection: { xs: 'column', sm: 'row' }, width: '100%' }}>
            <Button
              onClick={handleBack}
              disabled={activeStep === 0}
              startIcon={<ArrowBack />}
              sx={{ 
                textTransform: 'none', 
                fontWeight: 600,
                order: { xs: 3, sm: 1 },
                width: { xs: '100%', sm: 'auto' },
                py: { xs: 1, sm: 1.2 },
                px: { xs: 2, sm: 2.5 }
              }}
            >
              Back
            </Button>
            {/* Past Papers Button - Left Side */}
            <Button
              onClick={() => handleComplete('past-papers')}
              disabled={!isStepValid()}
              variant="contained"
              startIcon={<Description />}
              sx={{ 
                textTransform: 'none', 
                fontWeight: 800,
                background: 'linear-gradient(135deg, #E91E63 0%, #F06292 50%, #EC4899 100%)',
                border: '3px solid #E91E63',
                boxShadow: '0 8px 25px rgba(233, 30, 99, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                borderRadius: 3,
                position: 'relative',
                overflow: 'hidden',
                animation: 'buttonPulse 2s ease-in-out infinite',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                  transition: 'left 0.5s ease',
                },
                '&:hover': {
                  background: 'linear-gradient(135deg, #C2185B 0%, #E91E63 50%, #F06292 100%)',
                  transform: 'translateY(-3px) scale(1.05)',
                  boxShadow: '0 12px 30px rgba(233, 30, 99, 0.5), 0 0 0 1px rgba(233, 30, 99, 0.3)',
                  '&::before': {
                    left: '100%',
                  }
                },
                minWidth: { xs: '100%', sm: '150px' },
                py: { xs: 1.5, sm: 1.8 },
                px: { xs: 2.5, sm: 3 },
                order: { xs: 1, sm: 2 },
                fontSize: { xs: '0.9rem', sm: '1rem' }
              }}
            >
              Past Papers
            </Button>
            {/* Courses Button - Right Side */}
            <Button
              onClick={() => handleComplete('courses')}
              disabled={!isStepValid()}
              variant="contained"
              startIcon={<School />}
              sx={{ 
                textTransform: 'none', 
                fontWeight: 800,
                background: 'linear-gradient(135deg, #4CAF50 0%, #8BC34A 50%, #66BB6A 100%)',
                border: '3px solid #4CAF50',
                boxShadow: '0 8px 25px rgba(76, 175, 80, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                borderRadius: 3,
                position: 'relative',
                overflow: 'hidden',
                animation: 'buttonPulse 2s ease-in-out infinite 0.3s',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                  transition: 'left 0.5s ease',
                },
                '&:hover': {
                  background: 'linear-gradient(135deg, #388e3c 0%, #4CAF50 50%, #8BC34A 100%)',
                  transform: 'translateY(-3px) scale(1.05)',
                  boxShadow: '0 12px 30px rgba(76, 175, 80, 0.5), 0 0 0 1px rgba(76, 175, 80, 0.3)',
                  '&::before': {
                    left: '100%',
                  }
                },
                minWidth: { xs: '100%', sm: '150px' },
                py: { xs: 1.5, sm: 1.8 },
                px: { xs: 2.5, sm: 3 },
                order: { xs: 2, sm: 3 },
                fontSize: { xs: '0.9rem', sm: '1rem' }
              }}
            >
              Browse Courses
            </Button>
          </Box>
        )}
      </DialogActions>
    </StyledDialog>
  );
};

export default HomeLearningInterestPopup;

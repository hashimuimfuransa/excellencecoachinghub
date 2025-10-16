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
  Star
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
  onComplete: (data: any) => void;
}

const StyledDialog = styled(Dialog)(({ theme }) => ({
  zIndex: 9999,
  '& .MuiDialog-paper': {
    borderRadius: theme.spacing(3),
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(240, 240, 240, 0.95))',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
    maxWidth: '800px',
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    [theme.breakpoints.down('sm')]: {
      margin: 0,
      height: '100%',
      maxHeight: '100%',
      borderRadius: 0,
    },
  },
  '& .MuiDialogTitle-root': {
    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: theme.spacing(2, 3),
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(1.5, 2),
    },
  },
  '& .MuiDialogContent-root': {
    padding: theme.spacing(4),
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(2.5),
    },
  },
  '& .MuiDialogActions-root': {
    padding: theme.spacing(2, 4),
    borderTop: '1px solid rgba(0,0,0,0.05)',
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(1.5, 2),
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
    boxShadow: theme.shadows[4],
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
      title: "What is your preferred learning style?",
      description: "Understanding how you learn best helps us recommend suitable course formats.",
      icon: <Visibility sx={{ fontSize: 40, color: 'white' }} />,
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

  const handleComplete = () => {
    onComplete(formData);
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
      fullScreen={isMobile}
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
              <LearningStyleStep
                formData={formData}
                onCategoryToggle={handleCategoryToggle}
                onChange={handleChange}
                onSpecificInterestsChange={handleSpecificInterestsChange}
              />
            )}
          </Box>
        </Fade>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleBack}
          disabled={activeStep === 0}
          startIcon={<ArrowBack />}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          Back
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        {activeStep < steps.length - 1 ? (
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
              }
            }}
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={handleComplete}
            disabled={!isStepValid()}
            variant="contained"
            sx={{ 
              textTransform: 'none', 
              fontWeight: 600,
              background: 'linear-gradient(45deg, #4CAF50 30%, #8BC34A 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #45a049 30%, #7cb342 90%)',
              }
            }}
          >
            Get My Courses
          </Button>
        )}
      </DialogActions>
    </StyledDialog>
  );
};

export default HomeLearningInterestPopup;

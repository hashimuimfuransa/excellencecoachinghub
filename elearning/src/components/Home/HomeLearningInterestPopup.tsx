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
  SubcategoriesStep
} from './StepContentComponents';

interface HomeLearningInterestPopupProps {
  open: boolean;
  onClose: () => void;
  onComplete: (data: any, type?: 'courses' | 'past-papers') => void;
}

type FormKeys = 'categories' | 'careerGoal' | 'experienceLevel' | 'specificInterests' | 'timeCommitment' | 'learningStyle';

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
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  const steps = [
    {
      title: "What are your primary learning interests?",
      description: "Select a category and then a subcategory to continue.",
      icon: <School sx={{ fontSize: 40, color: 'white' }} />,
    },
    {
      title: "Pick a subcategory",
      description: "Choose the specific coaching area you want.",
      icon: <School sx={{ fontSize: 40, color: 'white' }} />,
    },
  ];

  const handleNext = () => setActiveStep((prevActiveStep) => prevActiveStep + 1);
  const handleBack = () => setActiveStep((prevActiveStep) => prevActiveStep - 1);
  const handleChange = (prop: any) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const key = prop as FormKeys;
    setFormData({ ...formData, [key]: (event.target as HTMLInputElement).value });
  };
  const handleCategoryToggle = (value: string) => {
    setFormData((prev) => {
      const newCategories = prev.categories.includes(value)
        ? prev.categories.filter((cat) => cat !== value)
        : [...prev.categories, value];
      return { ...prev, categories: newCategories };
    });
  };
  const handleSpecificInterestsChange = (_event: any) => {};

  const handleCategorySelectAndGo = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setFormData((prev) => ({ ...prev, categories: [categoryId] }));
    setActiveStep(1);
  };

  const handleSubcategoryAndFinish = (subcategory: string) => {
    const interests = { categories: [selectedCategoryId], specificInterests: [subcategory] };
    localStorage.setItem('learningInterests', JSON.stringify(interests));
    localStorage.setItem('learningInterestsCompleted', 'true');
    onComplete(interests, 'courses');
  };

  const isStepValid = () => {
    switch (activeStep) {
      case 0: return formData.categories.length > 0;
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
            {activeStep === 0 && (
              <CategoriesStep
                formData={formData}
                onCategoryToggle={handleCategorySelectAndGo}
                onChange={handleChange}
                onSpecificInterestsChange={handleSpecificInterestsChange}
              />
            )}
            {activeStep === 1 && (
              <SubcategoriesStep
                selectedCategoryId={selectedCategoryId}
                onSelectSubcategory={handleSubcategoryAndFinish}
              />
            )}
          </Box>
        </Fade>
      </DialogContent>
      <DialogActions>
        {activeStep === 1 ? (
          <Button onClick={handleBack} startIcon={<ArrowBack />} sx={{ textTransform: 'none', fontWeight: 600 }}>
            Back
          </Button>
        ) : (
          <Button onClick={onClose} startIcon={<Close />} sx={{ textTransform: 'none', fontWeight: 600 }}>
            Close
          </Button>
        )}
      </DialogActions>
    </StyledDialog>
  );
};

export default HomeLearningInterestPopup;

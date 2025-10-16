import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  LinearProgress,
  useTheme,
  useMediaQuery,
  styled,
  Paper,
  Avatar,
  Stack
} from '@mui/material';
import {
  Close,
  School,
  Business,
  Work,
  Psychology,
  Computer,
  Palette,
  Science,
  Language,
  LocalHospital,
  Engineering,
  Calculate,
  TrendingUp,
  EmojiEvents,
  CheckCircle,
  ArrowForward,
  ArrowBack
} from '@mui/icons-material';

// Styled components for modern design
const StyledDialog = styled(Dialog)(({ theme }) => ({
  zIndex: 9999,
  '& .MuiDialog-paper': {
    borderRadius: theme.spacing(3),
    maxWidth: '800px',
    width: '100%',
    maxHeight: '90vh',
    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    zIndex: 9999,
  },
  '& .MuiBackdrop-root': {
    zIndex: 9998,
  },
}));

const StepCard = styled(Card)(({ theme, selected }) => ({
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  border: selected ? `2px solid ${theme.palette.primary.main}` : '2px solid transparent',
  background: selected 
    ? `linear-gradient(135deg, ${theme.palette.primary.main}08, ${theme.palette.primary.main}15)`
    : 'white',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
    border: `2px solid ${theme.palette.primary.main}40`,
  },
  '&:active': {
    transform: 'translateY(-2px)',
  },
}));

const InterestChip = styled(Chip)(({ theme, selected }) => ({
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  background: selected 
    ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
    : theme.palette.grey[100],
  color: selected ? 'white' : theme.palette.text.primary,
  fontWeight: selected ? 600 : 500,
  '&:hover': {
    transform: 'scale(1.05)',
    boxShadow: theme.shadows[4],
  },
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  textTransform: 'none',
  fontWeight: 600,
  px: theme.spacing(3),
  py: theme.spacing(1.5),
  fontSize: '1rem',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.2)',
  },
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
}));

// Learning interest data
const learningCategories = [
  {
    id: 'professional',
    title: 'Professional Development',
    description: 'Advance your career with industry-specific skills',
    icon: <Work sx={{ fontSize: 40 }} />,
    color: '#2196F3',
    subcategories: ['Leadership', 'Project Management', 'Communication', 'Team Building', 'Strategic Planning']
  },
  {
    id: 'business',
    title: 'Business & Entrepreneurship',
    description: 'Start and grow your own business venture',
    icon: <Business sx={{ fontSize: 40 }} />,
    color: '#4CAF50',
    subcategories: ['Startup Fundamentals', 'Marketing', 'Finance', 'Operations', 'Sales']
  },
  {
    id: 'academic',
    title: 'Academic Coaching',
    description: 'Excel in your studies and academic pursuits',
    icon: <School sx={{ fontSize: 40 }} />,
    color: '#FF9800',
    subcategories: ['Study Techniques', 'Research Methods', 'Academic Writing', 'Time Management', 'Exam Preparation']
  },
  {
    id: 'technical',
    title: 'Technical Skills',
    description: 'Master cutting-edge technology and programming',
    icon: <Computer sx={{ fontSize: 40 }} />,
    color: '#9C27B0',
    subcategories: ['Programming', 'Data Science', 'Web Development', 'Mobile Apps', 'AI & Machine Learning']
  },
  {
    id: 'creative',
    title: 'Creative Arts',
    description: 'Unleash your creative potential and artistic skills',
    icon: <Palette sx={{ fontSize: 40 }} />,
    color: '#E91E63',
    subcategories: ['Graphic Design', 'Digital Art', 'Photography', 'Video Editing', 'Music Production']
  },
  {
    id: 'healthcare',
    title: 'Healthcare & Medical',
    description: 'Pursue a career in healthcare and medical fields',
    icon: <LocalHospital sx={{ fontSize: 40 }} />,
    color: '#F44336',
    subcategories: ['Nursing', 'Medical Research', 'Public Health', 'Mental Health', 'Healthcare Administration']
  }
];

const careerGoals = [
  { id: 'job_seeker', title: 'Looking for Employment', icon: <Work />, description: 'I want to find a job in my field' },
  { id: 'business_owner', title: 'Running a Business', icon: <Business />, description: 'I own or want to start a business' },
  { id: 'student', title: 'Student', icon: <School />, description: 'I am currently studying' },
  { id: 'career_change', title: 'Career Change', icon: <TrendingUp />, description: 'I want to switch careers' },
  { id: 'skill_upgrade', title: 'Skill Upgrade', icon: <EmojiEvents />, description: 'I want to improve my current skills' }
];

const experienceLevels = [
  { id: 'beginner', title: 'Beginner', description: 'New to this field' },
  { id: 'intermediate', title: 'Intermediate', description: 'Some experience' },
  { id: 'advanced', title: 'Advanced', description: 'Experienced professional' }
];

interface LearningInterestData {
  categories: string[];
  careerGoal: string;
  experienceLevel: string;
  interests: string[];
  timeCommitment: string;
  learningStyle: string;
}

interface LearningInterestPopupProps {
  open: boolean;
  onClose: () => void;
  onComplete: (data: LearningInterestData) => void;
}

const LearningInterestPopup: React.FC<LearningInterestPopupProps> = ({
  open,
  onClose,
  onComplete
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Debug logging
  useEffect(() => {
    console.log('🎯 LearningInterestPopup - Props received:', { open, isMobile });
  }, [open, isMobile]);
  
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<LearningInterestData>({
    categories: [],
    careerGoal: '',
    experienceLevel: '',
    interests: [],
    timeCommitment: '',
    learningStyle: ''
  });

  const steps = [
    'Choose Learning Categories',
    'Career Goals & Status',
    'Experience Level',
    'Specific Interests',
    'Time Commitment',
    'Learning Style'
  ];

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleCategoryToggle = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter(id => id !== categoryId)
        : [...prev.categories, categoryId]
    }));
  };

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleComplete = () => {
    onComplete(formData);
    onClose();
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ mb: 3, textAlign: 'center', fontWeight: 600 }}>
              What areas interest you most?
            </Typography>
            <Grid container spacing={2}>
              {learningCategories.map((category) => (
                <Grid item xs={12} sm={6} md={4} key={category.id}>
                  <StepCard
                    selected={formData.categories.includes(category.id)}
                    onClick={() => handleCategoryToggle(category.id)}
                  >
                    <CardContent sx={{ textAlign: 'center', p: 3 }}>
                      <Avatar
                        sx={{
                          bgcolor: category.color,
                          width: 60,
                          height: 60,
                          mx: 'auto',
                          mb: 2
                        }}
                      >
                        {category.icon}
                      </Avatar>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                        {category.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {category.description}
                      </Typography>
                      {formData.categories.includes(category.id) && (
                        <CheckCircle sx={{ color: 'primary.main', mt: 1 }} />
                      )}
                    </CardContent>
                  </StepCard>
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ mb: 3, textAlign: 'center', fontWeight: 600 }}>
              What's your current career status?
            </Typography>
            <Grid container spacing={2}>
              {careerGoals.map((goal) => (
                <Grid item xs={12} sm={6} key={goal.id}>
                  <StepCard
                    selected={formData.careerGoal === goal.id}
                    onClick={() => setFormData(prev => ({ ...prev, careerGoal: goal.id }))}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {goal.icon}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {goal.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {goal.description}
                          </Typography>
                        </Box>
                        {formData.careerGoal === goal.id && (
                          <CheckCircle sx={{ color: 'primary.main', ml: 'auto' }} />
                        )}
                      </Stack>
                    </CardContent>
                  </StepCard>
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ mb: 3, textAlign: 'center', fontWeight: 600 }}>
              What's your experience level?
            </Typography>
            <Grid container spacing={2}>
              {experienceLevels.map((level) => (
                <Grid item xs={12} sm={4} key={level.id}>
                  <StepCard
                    selected={formData.experienceLevel === level.id}
                    onClick={() => setFormData(prev => ({ ...prev, experienceLevel: level.id }))}
                  >
                    <CardContent sx={{ textAlign: 'center', p: 3 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                        {level.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {level.description}
                      </Typography>
                      {formData.experienceLevel === level.id && (
                        <CheckCircle sx={{ color: 'primary.main', mt: 1 }} />
                      )}
                    </CardContent>
                  </StepCard>
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      case 3:
        const selectedCategories = learningCategories.filter(cat => formData.categories.includes(cat.id));
        const allInterests = selectedCategories.flatMap(cat => cat.subcategories);
        
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ mb: 3, textAlign: 'center', fontWeight: 600 }}>
              Select your specific interests
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'center' }}>
              {allInterests.map((interest) => (
                <InterestChip
                  key={interest}
                  label={interest}
                  selected={formData.interests.includes(interest)}
                  onClick={() => handleInterestToggle(interest)}
                />
              ))}
            </Box>
          </Box>
        );

      case 4:
        const timeOptions = [
          { id: '1-2', title: '1-2 hours/week', description: 'Light learning' },
          { id: '3-5', title: '3-5 hours/week', description: 'Moderate learning' },
          { id: '6-10', title: '6-10 hours/week', description: 'Intensive learning' },
          { id: '10+', title: '10+ hours/week', description: 'Full-time learning' }
        ];

        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ mb: 3, textAlign: 'center', fontWeight: 600 }}>
              How much time can you commit?
            </Typography>
            <Grid container spacing={2}>
              {timeOptions.map((option) => (
                <Grid item xs={12} sm={6} key={option.id}>
                  <StepCard
                    selected={formData.timeCommitment === option.id}
                    onClick={() => setFormData(prev => ({ ...prev, timeCommitment: option.id }))}
                  >
                    <CardContent sx={{ textAlign: 'center', p: 3 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                        {option.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {option.description}
                      </Typography>
                      {formData.timeCommitment === option.id && (
                        <CheckCircle sx={{ color: 'primary.main', mt: 1 }} />
                      )}
                    </CardContent>
                  </StepCard>
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      case 5:
        const learningStyles = [
          { id: 'visual', title: 'Visual Learning', description: 'I learn best with videos, diagrams, and visual content' },
          { id: 'hands-on', title: 'Hands-on Practice', description: 'I prefer practical exercises and projects' },
          { id: 'theoretical', title: 'Theoretical Study', description: 'I enjoy reading and understanding concepts deeply' },
          { id: 'interactive', title: 'Interactive Learning', description: 'I learn best through discussions and collaboration' }
        ];

        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ mb: 3, textAlign: 'center', fontWeight: 600 }}>
              How do you prefer to learn?
            </Typography>
            <Grid container spacing={2}>
              {learningStyles.map((style) => (
                <Grid item xs={12} sm={6} key={style.id}>
                  <StepCard
                    selected={formData.learningStyle === style.id}
                    onClick={() => setFormData(prev => ({ ...prev, learningStyle: style.id }))}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                        {style.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {style.description}
                      </Typography>
                      {formData.learningStyle === style.id && (
                        <CheckCircle sx={{ color: 'primary.main', mt: 1 }} />
                      )}
                    </CardContent>
                  </StepCard>
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      default:
        return 'Unknown step';
    }
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 0: return formData.categories.length > 0;
      case 1: return formData.careerGoal !== '';
      case 2: return formData.experienceLevel !== '';
      case 3: return formData.interests.length > 0;
      case 4: return formData.timeCommitment !== '';
      case 5: return formData.learningStyle !== '';
      default: return false;
    }
  };

  const progress = ((activeStep + 1) / steps.length) * 100;

  console.log('🎯 LearningInterestPopup - About to render:', { open, isMobile, progress });

  return (
    <StyledDialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
    >
      <DialogTitle sx={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        textAlign: 'center',
        py: 3,
        position: 'relative',
        fontSize: '1.5rem',
        fontWeight: 700,
        mb: 1
      }}>
        🎯 Find Your Perfect Course
        <Box sx={{ fontSize: '1rem', opacity: 0.9, mt: 1 }}>
          Let's personalize your learning journey
        </Box>
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 16,
            top: 16,
            color: 'white',
            bgcolor: 'rgba(255, 255, 255, 0.2)',
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.3)',
            }
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {/* Progress Bar */}
        <Box sx={{ px: 3, pt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
              Step {activeStep + 1} of {steps.length}
            </Typography>
            <Typography variant="body2" color="primary.main" sx={{ ml: 'auto', fontWeight: 600 }}>
              {Math.round(progress)}% Complete
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ 
              height: 8, 
              borderRadius: 4,
              bgcolor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                background: 'linear-gradient(90deg, #667eea, #764ba2)'
              }
            }} 
          />
        </Box>

        {/* Stepper */}
        <Box sx={{ px: 3, py: 2 }}>
          <Stepper activeStep={activeStep} orientation={isMobile ? 'vertical' : 'horizontal'}>
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
                {isMobile && (
                  <StepContent>
                    <Box sx={{ mt: 2 }}>
                      {getStepContent(index)}
                    </Box>
                  </StepContent>
                )}
              </Step>
            ))}
          </Stepper>
        </Box>

        {/* Step Content */}
        {!isMobile && (
          <Box sx={{ px: 3, pb: 3 }}>
            {getStepContent(activeStep)}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ 
        p: 3, 
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        borderTop: '1px solid #e2e8f0'
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <ActionButton
            onClick={handleBack}
            disabled={activeStep === 0}
            variant="outlined"
            startIcon={<ArrowBack />}
            sx={{ 
              visibility: activeStep === 0 ? 'hidden' : 'visible',
              borderColor: 'primary.main',
              color: 'primary.main'
            }}
          >
            Back
          </ActionButton>

          <Box sx={{ display: 'flex', gap: 2 }}>
            {activeStep === steps.length - 1 ? (
              <ActionButton
                onClick={handleComplete}
                variant="contained"
                disabled={!isStepValid(activeStep)}
                endIcon={<CheckCircle />}
                sx={{
                  background: 'linear-gradient(135deg, #4CAF50, #45a049)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #45a049, #3d8b40)',
                  }
                }}
              >
                Complete Setup
              </ActionButton>
            ) : (
              <ActionButton
                onClick={handleNext}
                variant="contained"
                disabled={!isStepValid(activeStep)}
                endIcon={<ArrowForward />}
                sx={{
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a6fd8, #6a4190)',
                  }
                }}
              >
                Next
              </ActionButton>
            )}
          </Box>
        </Box>
      </DialogActions>
    </StyledDialog>
  );
};

export default LearningInterestPopup;

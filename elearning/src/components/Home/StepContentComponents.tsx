import React from 'react';
import {
  Box,
  Typography,
  Stack,
  Chip,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio
} from '@mui/material';
import {
  Work,
  Business,
  Psychology,
  Computer,
  Palette,
  LocalHospital
} from '@mui/icons-material';
import { styled } from '@mui/system';

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

interface StepContentProps {
  formData: any;
  onCategoryToggle: (value: string) => void;
  onChange: (prop: string) => (event: any) => void;
  onSpecificInterestsChange: (event: any) => void;
}

export const CategoriesStep: React.FC<StepContentProps> = ({ formData, onCategoryToggle }) => (
  <Box>
    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>Choose up to 3 categories:</Typography>
    <Stack direction="row" flexWrap="wrap" spacing={1} useFlexGap>
      {[
        { label: 'Professional Development', value: 'professional', icon: <Work /> },
        { label: 'Business & Entrepreneurship', value: 'business', icon: <Business /> },
        { label: 'Academic Coaching', value: 'academic', icon: <Psychology /> },
        { label: 'Technical Skills', value: 'technical', icon: <Computer /> },
        { label: 'Creative Arts', value: 'creative', icon: <Palette /> },
        { label: 'Healthcare & Medical', value: 'healthcare', icon: <LocalHospital /> },
      ].map((item) => (
        <StyledChip
          key={item.value}
          label={item.label}
          icon={item.icon}
          color={formData.categories.includes(item.value) ? 'primary' : 'default'}
          variant={formData.categories.includes(item.value) ? 'contained' : 'outlined'}
          onClick={() => onCategoryToggle(item.value)}
        />
      ))}
    </Stack>
  </Box>
);

export const CareerGoalStep: React.FC<StepContentProps> = ({ formData, onChange }) => (
  <Box>
    <RadioGroup
      aria-label="career-goal"
      name="careerGoal"
      value={formData.careerGoal}
      onChange={onChange('careerGoal')}
    >
      {[
        { label: 'Looking for Employment', value: 'employment' },
        { label: 'Running a Business', value: 'business_owner' },
        { label: 'Student', value: 'student' },
        { label: 'Career Change', value: 'career_change' },
        { label: 'Skill Upgrade', value: 'skill_upgrade' },
        { label: 'Just Exploring', value: 'exploring' },
      ].map((item) => (
        <FormControlLabel
          key={item.value}
          value={item.value}
          control={<Radio />}
          label={<Typography variant="body1" sx={{ fontWeight: 500 }}>{item.label}</Typography>}
          sx={{ mb: 1 }}
        />
      ))}
    </RadioGroup>
  </Box>
);

export const ExperienceLevelStep: React.FC<StepContentProps> = ({ formData, onChange }) => (
  <Box>
    <RadioGroup
      aria-label="experience-level"
      name="experienceLevel"
      value={formData.experienceLevel}
      onChange={onChange('experienceLevel')}
    >
      {[
        { label: 'Beginner (New to the field)', value: 'beginner' },
        { label: 'Intermediate (Some experience)', value: 'intermediate' },
        { label: 'Advanced (Experienced professional)', value: 'advanced' },
      ].map((item) => (
        <FormControlLabel
          key={item.value}
          value={item.value}
          control={<Radio />}
          label={<Typography variant="body1" sx={{ fontWeight: 500 }}>{item.label}</Typography>}
          sx={{ mb: 1 }}
        />
      ))}
    </RadioGroup>
  </Box>
);

export const SpecificInterestsStep: React.FC<StepContentProps> = ({ formData, onSpecificInterestsChange }) => (
  <Box>
    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
      Type your interests (e.g., "React", "Digital Marketing", "Financial Modeling"):
    </Typography>
    <TextField
      fullWidth
      variant="outlined"
      placeholder="Add interests, separated by commas"
      value={formData.specificInterests.join(', ')}
      onChange={onSpecificInterestsChange}
      sx={{ mb: 2 }}
    />
    <Typography variant="body2" color="text.secondary">
      These will help us fine-tune your course recommendations.
    </Typography>
  </Box>
);

export const TimeCommitmentStep: React.FC<StepContentProps> = ({ formData, onChange }) => (
  <Box>
    <RadioGroup
      aria-label="time-commitment"
      name="timeCommitment"
      value={formData.timeCommitment}
      onChange={onChange('timeCommitment')}
    >
      {[
        { label: '1-2 hours/week (Light learning)', value: 'light' },
        { label: '3-5 hours/week (Moderate learning)', value: 'moderate' },
        { label: '6-10 hours/week (Intensive learning)', value: 'intensive' },
        { label: '10+ hours/week (Full-time learning)', value: 'full_time' },
      ].map((item) => (
        <FormControlLabel
          key={item.value}
          value={item.value}
          control={<Radio />}
          label={<Typography variant="body1" sx={{ fontWeight: 500 }}>{item.label}</Typography>}
          sx={{ mb: 1 }}
        />
      ))}
    </RadioGroup>
  </Box>
);

export const LearningStyleStep: React.FC<StepContentProps> = ({ formData, onChange }) => (
  <Box>
    <RadioGroup
      aria-label="learning-style"
      name="learningStyle"
      value={formData.learningStyle}
      onChange={onChange('learningStyle')}
    >
      {[
        { label: 'Visual Learning (Videos, diagrams, infographics)', value: 'visual' },
        { label: 'Hands-on Practice (Projects, exercises, labs)', value: 'hands_on' },
        { label: 'Theoretical Study (Reading, lectures, concepts)', value: 'theoretical' },
        { label: 'Interactive Learning (Discussions, collaboration, Q&A)', value: 'interactive' },
      ].map((item) => (
        <FormControlLabel
          key={item.value}
          value={item.value}
          control={<Radio />}
          label={<Typography variant="body1" sx={{ fontWeight: 500 }}>{item.label}</Typography>}
          sx={{ mb: 1 }}
        />
      ))}
    </RadioGroup>
  </Box>
);

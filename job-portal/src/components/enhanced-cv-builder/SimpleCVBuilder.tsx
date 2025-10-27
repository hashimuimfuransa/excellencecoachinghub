import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Paper,
  Typography,
  Container,
  useTheme,
  useMediaQuery,
  LinearProgress,
  TextField,
} from '@mui/material';
import {
  NavigateNext,
  NavigateBefore,
} from '@mui/icons-material';

interface SimplePersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  summary: string;
}

interface SimpleCVData {
  personalInfo: SimplePersonalInfo;
  experience: string;
  education: string;
  skills: string;
}

const initialData: SimpleCVData = {
  personalInfo: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    summary: '',
  },
  experience: '',
  education: '',
  skills: '',
};

const steps = [
  { label: 'Personal Information', description: 'Basic personal details' },
  { label: 'Experience', description: 'Work experience' },
  { label: 'Education', description: 'Educational background' },
  { label: 'Skills', description: 'Technical and soft skills' },
];

const SimpleCVBuilder: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [activeStep, setActiveStep] = useState(0);
  const [cvData, setCVData] = useState<SimpleCVData>(initialData);

  const handleNext = useCallback(() => {
    setActiveStep((prev) => prev + 1);
  }, []);

  const handleBack = useCallback(() => {
    setActiveStep((prev) => prev - 1);
  }, []);

  const handleFieldChange = useCallback((section: keyof SimpleCVData, field: string, value: string) => {
    setCVData(prev => {
      if (section === 'personalInfo') {
        return {
          ...prev,
          personalInfo: {
            ...prev.personalInfo,
            [field]: value,
          }
        };
      }
      return {
        ...prev,
        [section]: value,
      };
    });
  }, []);

  const calculateProgress = useMemo(() => {
    let completed = 0;
    let total = 8; // 5 personal info fields + 3 other sections

    // Check personal info
    if (cvData.personalInfo.firstName) completed++;
    if (cvData.personalInfo.lastName) completed++;
    if (cvData.personalInfo.email) completed++;
    if (cvData.personalInfo.phone) completed++;
    if (cvData.personalInfo.summary) completed++;

    // Check other sections
    if (cvData.experience.trim()) completed++;
    if (cvData.education.trim()) completed++;
    if (cvData.skills.trim()) completed++;

    return (completed / total) * 100;
  }, [cvData]);

  const renderStepContent = useCallback((step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6">Personal Information</Typography>
            <TextField
              label="First Name"
              value={cvData.personalInfo.firstName}
              onChange={(e) => handleFieldChange('personalInfo', 'firstName', e.target.value)}
              fullWidth
            />
            <TextField
              label="Last Name"
              value={cvData.personalInfo.lastName}
              onChange={(e) => handleFieldChange('personalInfo', 'lastName', e.target.value)}
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={cvData.personalInfo.email}
              onChange={(e) => handleFieldChange('personalInfo', 'email', e.target.value)}
              fullWidth
            />
            <TextField
              label="Phone"
              value={cvData.personalInfo.phone}
              onChange={(e) => handleFieldChange('personalInfo', 'phone', e.target.value)}
              fullWidth
            />
            <TextField
              label="Professional Summary"
              value={cvData.personalInfo.summary}
              onChange={(e) => handleFieldChange('personalInfo', 'summary', e.target.value)}
              multiline
              rows={4}
              fullWidth
            />
          </Box>
        );
      case 1:
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>Work Experience</Typography>
            <TextField
              label="Describe your work experience"
              value={cvData.experience}
              onChange={(e) => handleFieldChange('experience', '', e.target.value)}
              multiline
              rows={8}
              fullWidth
              placeholder="List your work experience, including job titles, companies, dates, and key responsibilities..."
            />
          </Box>
        );
      case 2:
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>Education</Typography>
            <TextField
              label="Describe your educational background"
              value={cvData.education}
              onChange={(e) => handleFieldChange('education', '', e.target.value)}
              multiline
              rows={6}
              fullWidth
              placeholder="List your educational qualifications, including degrees, institutions, dates, and relevant achievements..."
            />
          </Box>
        );
      case 3:
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>Skills</Typography>
            <TextField
              label="List your skills"
              value={cvData.skills}
              onChange={(e) => handleFieldChange('skills', '', e.target.value)}
              multiline
              rows={6}
              fullWidth
              placeholder="List your technical skills, soft skills, languages, and any other relevant abilities..."
            />
          </Box>
        );
      default:
        return null;
    }
  }, [cvData, handleFieldChange]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Simple CV Builder
      </Typography>
      
      {/* Progress Bar */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
          Progress: {Math.round(calculateProgress)}%
        </Typography>
        <LinearProgress
          variant="determinate"
          value={calculateProgress}
          sx={{ height: 8, borderRadius: 4 }}
        />
      </Box>

      <Box sx={{ display: 'flex', gap: 3 }}>
        {isMobile ? (
          // Mobile View
          <Box sx={{ width: '100%' }}>
            <Paper sx={{ p: 3, mb: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Step {activeStep + 1}: {steps[activeStep].label}
              </Typography>
              {renderStepContent(activeStep)}
            </Paper>
            
            {/* Navigation */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                onClick={handleBack}
                disabled={activeStep === 0}
                startIcon={<NavigateBefore />}
                fullWidth
              >
                Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={activeStep === steps.length - 1}
                endIcon={<NavigateNext />}
                variant="contained"
                fullWidth
              >
                Next
              </Button>
            </Box>
          </Box>
        ) : (
          // Desktop View
          <Stepper activeStep={activeStep} orientation="vertical" sx={{ width: '100%' }}>
            {steps.map((step, index) => (
              <Step key={step.label}>
                <StepLabel>
                  <Typography variant="subtitle1">{step.label}</Typography>
                </StepLabel>
                <StepContent>
                  <Paper elevation={0} sx={{ p: 3, bgcolor: 'grey.50', mb: 2 }}>
                    {renderStepContent(index)}
                  </Paper>
                  
                  <Box sx={{ mb: 2 }}>
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      disabled={index === steps.length - 1}
                      endIcon={<NavigateNext />}
                      sx={{ mr: 1 }}
                    >
                      {index === steps.length - 1 ? 'Finish' : 'Continue'}
                    </Button>
                    <Button
                      disabled={index === 0}
                      onClick={handleBack}
                      startIcon={<NavigateBefore />}
                    >
                      Back
                    </Button>
                  </Box>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        )}
      </Box>

      {/* Debug Info */}
      <Paper sx={{ p: 2, mt: 3, bgcolor: 'grey.100' }}>
        <Typography variant="subtitle2">Debug Info:</Typography>
        <Typography variant="body2">
          Current Step: {activeStep + 1}/{steps.length}
        </Typography>
        <Typography variant="body2">
          Progress: {Math.round(calculateProgress)}%
        </Typography>
        <Typography variant="body2">
          Data Length: {JSON.stringify(cvData).length} characters
        </Typography>
      </Paper>
    </Container>
  );
};

export default SimpleCVBuilder;
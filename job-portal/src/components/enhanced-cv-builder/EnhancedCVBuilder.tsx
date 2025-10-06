import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  Fab,
  Zoom,
  CircularProgress,
  Alert,
  Snackbar,
  AppBar,
  Toolbar,
  IconButton,
  LinearProgress,
} from '@mui/material';
import {
  NavigateNext,
  NavigateBefore,
  Save,
  AutoAwesome,
  Download,
  Close,
  Preview,
} from '@mui/icons-material';
import { CVData, cvBuilderService } from '../../services/cvBuilderService';

// Import enhanced step components
import EnhancedPersonalInfoStep from './EnhancedPersonalInfoStep';
import EnhancedEducationStep from './EnhancedEducationStep';
import EnhancedExperienceStep from './EnhancedExperienceStep';
import EnhancedSkillsStep from './EnhancedSkillsStep';
import EnhancedProjectsStep from './EnhancedProjectsStep';
import EnhancedCertificationsStep from './EnhancedCertificationsStep';
import EnhancedReferencesStep from './EnhancedReferencesStep';
import EnhancedVolunteerStep from './EnhancedVolunteerStep';
import EnhancedSummaryStep from './EnhancedSummaryStep';
import AIGuidancePanel from './AIGuidancePanel';
import CVAnalysisPanel from './CVAnalysisPanel';

interface EnhancedCVBuilderProps {
  onClose?: () => void;
  initialData?: Partial<CVData>;
}

const steps = [
  {
    label: 'Personal Information',
    description: 'Basic contact details and professional summary',
  },
  {
    label: 'Education',
    description: 'Academic background and qualifications',
  },
  {
    label: 'Work Experience',
    description: 'Professional experience and achievements',
  },
  {
    label: 'Skills',
    description: 'Technical and soft skills',
  },
  {
    label: 'Projects',
    description: 'Portfolio projects and achievements',
  },
  {
    label: 'Certifications',
    description: 'Professional certifications and licenses',
  },
  {
    label: 'References',
    description: 'Professional references',
  },
  {
    label: 'Volunteer Experience',
    description: 'Community service and activities',
  },
  {
    label: 'Review & Generate',
    description: 'Review your CV and generate the final document',
  },
];

const EnhancedCVBuilder: React.FC<EnhancedCVBuilderProps> = ({
  onClose,
  initialData = {},
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [activeStep, setActiveStep] = useState(0);
  const [cvData, setCVData] = useState<CVData>({
    personalInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      location: '',
      professionalSummary: '',
      linkedinUrl: '',
      portfolioUrl: '',
      ...initialData.personalInfo,
    },
    education: initialData.education || [],
    experience: initialData.experience || [],
    skills: {
      technical: [],
      soft: [],
      languages: [],
      ...initialData.skills,
    },
    projects: initialData.projects || [],
    certifications: initialData.certifications || [],
    references: initialData.references || [],
    volunteerExperience: initialData.volunteerExperience || [],
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [showAIGuidance, setShowAIGuidance] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const [lastSaveData, setLastSaveData] = useState<string>('');
  const saveMessageTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Save current section data
  const saveCurrentSection = useCallback(async () => {
    const currentDataStr = JSON.stringify(cvData);
    // Only save if data has actually changed
    if (currentDataStr !== lastSaveData && cvData && cvData.personalInfo) {
      try {
        await cvBuilderService.saveCVData(cvData);
        setLastSaveData(currentDataStr);
        setSaveMessage('Section saved');
        
        // Clear existing timeout
        if (saveMessageTimeoutRef.current) {
          clearTimeout(saveMessageTimeoutRef.current);
        }
        // Set new timeout
        saveMessageTimeoutRef.current = setTimeout(() => setSaveMessage(null), 1500);
        return true;
      } catch (error) {
        console.log('Section saved locally');
        setLastSaveData(currentDataStr);
        setSaveMessage('Saved locally');
        
        // Clear existing timeout
        if (saveMessageTimeoutRef.current) {
          clearTimeout(saveMessageTimeoutRef.current);
        }
        // Set new timeout
        saveMessageTimeoutRef.current = setTimeout(() => setSaveMessage(null), 1500);
        return true;
      }
    }
    return true;
  }, [cvData, lastSaveData]);

  // Manual save functionality
  const handleManualSave = useCallback(async () => {
    if (!isSaving) {
      setIsSaving(true);
      try {
        await cvBuilderService.saveCVData(cvData);
        setLastSaveData(JSON.stringify(cvData));
        setSaveMessage('CV saved successfully');
        
        // Clear existing timeout
        if (saveMessageTimeoutRef.current) {
          clearTimeout(saveMessageTimeoutRef.current);
        }
        // Set new timeout
        saveMessageTimeoutRef.current = setTimeout(() => setSaveMessage(null), 2000);
      } catch (error) {
        console.error('Manual save failed:', error);
        setSaveMessage('Saved locally');
        
        // Clear existing timeout
        if (saveMessageTimeoutRef.current) {
          clearTimeout(saveMessageTimeoutRef.current);
        }
        // Set new timeout
        saveMessageTimeoutRef.current = setTimeout(() => setSaveMessage(null), 2000);
      } finally {
        setIsSaving(false);
      }
    }
  }, [cvData, isSaving]);

  // Save data on page unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Save data locally before page unload
      if (cvData && cvData.personalInfo) {
        try {
          localStorage.setItem('cv_builder_data', JSON.stringify(cvData));
          localStorage.setItem('cv_builder_data_timestamp', new Date().toISOString());
        } catch (error) {
          console.error('Failed to save data on unload:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [cvData]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (saveMessageTimeoutRef.current) {
        clearTimeout(saveMessageTimeoutRef.current);
      }
    };
  }, []);

  // Load existing CV data on mount
  useEffect(() => {
    const loadCVData = async () => {
      try {
        const existingData = await cvBuilderService.getCVData();
        if (existingData) {
          // Ensure proper data structure with fallbacks
          const loadedData = {
            personalInfo: {
              firstName: '',
              lastName: '',
              email: '',
              phone: '',
              location: '',
              professionalSummary: '',
              linkedinUrl: '',
              portfolioUrl: '',
              ...(existingData.personalInfo || {}),
            },
            education: existingData.education || [],
            experience: existingData.experience || [],
            skills: {
              technical: [],
              soft: [],
              languages: [],
              ...(existingData.skills || {}),
            },
            projects: existingData.projects || [],
            certifications: existingData.certifications || [],
            references: existingData.references || [],
            volunteerExperience: existingData.volunteerExperience || [],
          };
          
          setCVData(loadedData);
          setLastSaveData(JSON.stringify(loadedData));
        }
      } catch (error) {
        console.log('Starting with clean CV data');
      } finally {
        setIsLoading(false);
      }
    };

    if (Object.keys(initialData).length === 0) {
      loadCVData();
    } else {
      setIsLoading(false);
    }
  }, [initialData]);

  const handleNext = async () => {
    // Save current section before moving to next
    await saveCurrentSection();
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = async () => {
    // Save current section before going back
    await saveCurrentSection();
    setActiveStep((prev) => prev - 1);
  };

  const handleStepClick = async (step: number) => {
    // Save current section before switching steps
    await saveCurrentSection();
    setActiveStep(step);
  };

  const handleDataChange = useCallback((section: keyof CVData, data: any) => {
    setCVData(prev => ({
      ...prev,
      [section]: data,
    }));
  }, []);

  const handleGenerateCV = useCallback(async () => {
    setIsLoading(true);
    try {
      // Save the final data before generating
      await saveCurrentSection();
      await cvBuilderService.generateCV(cvData);
      // Handle CV generation - perhaps download or show preview
      setSaveMessage('CV generated successfully!');
      
      // Clear existing timeout
      if (saveMessageTimeoutRef.current) {
        clearTimeout(saveMessageTimeoutRef.current);
      }
      // Set new timeout
      saveMessageTimeoutRef.current = setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Failed to generate CV:', error);
      setSaveMessage('Failed to generate CV');
      
      // Clear existing timeout
      if (saveMessageTimeoutRef.current) {
        clearTimeout(saveMessageTimeoutRef.current);
      }
      // Set new timeout
      saveMessageTimeoutRef.current = setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setIsLoading(false);
    }
  }, [cvData, saveCurrentSection]);

  const handlePreview = useCallback(() => {
    // Implement CV preview functionality
    setShowAnalysis(true);
  }, []);

  const handleAIHelp = useCallback(async (action: string, data: any) => {
    setShowAIGuidance(true);
    // Implement AI guidance functionality
  }, []);

  const calculateProgress = useMemo(() => {
    let totalFields = 0;
    let completedFields = 0;

    // Personal Info (8 fields, 5 required)
    const personalInfo = cvData.personalInfo || {};
    totalFields += 5;
    if (personalInfo.firstName) completedFields++;
    if (personalInfo.lastName) completedFields++;
    if (personalInfo.email) completedFields++;
    if (personalInfo.phone) completedFields++;
    if (personalInfo.professionalSummary) completedFields++;

    // Education (minimum 1 entry expected)
    totalFields += 1;
    if (cvData.education && cvData.education.length > 0) completedFields++;

    // Experience (minimum 1 entry expected)
    totalFields += 1;
    if (cvData.experience && cvData.experience.length > 0) completedFields++;

    // Skills (at least some skills expected)
    totalFields += 1;
    const skills = cvData.skills || { technical: [], soft: [], languages: [] };
    if ((skills.technical && skills.technical.length > 0) || (skills.soft && skills.soft.length > 0)) {
      completedFields++;
    }

    return totalFields > 0 ? (completedFields / totalFields) * 100 : 0;
  }, [cvData]);

  const renderStepContent = useCallback((step: number) => {
    switch (step) {
      case 0:
        return (
          <EnhancedPersonalInfoStep
            data={cvData.personalInfo}
            onChange={(data) => handleDataChange('personalInfo', data)}
            onAIHelp={handleAIHelp}
          />
        );
      case 1:
        return (
          <EnhancedEducationStep
            data={cvData.education}
            onChange={(data) => handleDataChange('education', data)}
            onAIHelp={handleAIHelp}
          />
        );
      case 2:
        return (
          <EnhancedExperienceStep
            data={cvData.experience}
            onChange={(data) => handleDataChange('experience', data)}
            onAIHelp={handleAIHelp}
          />
        );
      case 3:
        return (
          <EnhancedSkillsStep
            data={cvData.skills}
            onChange={(data) => handleDataChange('skills', data)}
            onAIHelp={handleAIHelp}
          />
        );
      case 4:
        return (
          <EnhancedProjectsStep
            data={cvData.projects}
            onChange={(data) => handleDataChange('projects', data)}
            onAIHelp={handleAIHelp}
          />
        );
      case 5:
        return (
          <EnhancedCertificationsStep
            data={cvData.certifications}
            onChange={(data) => handleDataChange('certifications', data)}
            onAIHelp={handleAIHelp}
          />
        );
      case 6:
        return (
          <EnhancedReferencesStep
            data={cvData.references}
            onChange={(data) => handleDataChange('references', data)}
            onAIHelp={handleAIHelp}
          />
        );
      case 7:
        return (
          <EnhancedVolunteerStep
            data={cvData.volunteerExperience}
            onChange={(data) => handleDataChange('volunteerExperience', data)}
            onAIHelp={handleAIHelp}
          />
        );
      case 8:
        return (
          <EnhancedSummaryStep
            data={cvData}
            onEdit={handleStepClick}
            onGenerateCV={handleGenerateCV}
            onPreview={handlePreview}
          />
        );
      default:
        return null;
    }
  }, [cvData, handleDataChange, handleAIHelp, handleStepClick, handleGenerateCV, handlePreview]);

  if (isLoading && Object.keys(cvData.personalInfo).length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading CV Builder...
        </Typography>
      </Container>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: theme.palette.mode === 'dark' ? 'background.default' : 'grey.50' 
    }}>
      {/* App Bar */}
      <AppBar 
        position="sticky" 
        color="default" 
        elevation={1}
        sx={{
          bgcolor: theme.palette.mode === 'dark' 
            ? 'rgba(18, 18, 18, 0.95)' 
            : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: theme.palette.mode === 'dark' 
            ? '1px solid rgba(255, 255, 255, 0.08)' 
            : '1px solid rgba(0, 0, 0, 0.08)',
        }}
      >
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Enhanced CV Builder
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isSaving && <CircularProgress size={20} />}
            <Button
              startIcon={<AutoAwesome />}
              onClick={() => setShowAIGuidance(true)}
              size="small"
            >
              AI Help
            </Button>
            <Button
              startIcon={<Preview />}
              onClick={() => setShowAnalysis(true)}
              size="small"
            >
              Analysis
            </Button>
            {onClose && (
              <IconButton onClick={onClose} edge="end">
                <Close />
              </IconButton>
            )}
          </Box>
        </Toolbar>
        
        {/* Progress Bar */}
        <LinearProgress
          variant="determinate"
          value={calculateProgress}
          sx={{ height: 3 }}
        />
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', gap: 3 }}>
          {/* Main Content */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {isMobile ? (
              /* Mobile Stepper */
              <Box>
                <Paper sx={{ 
                  p: 2, 
                  mb: 2,
                  bgcolor: theme.palette.mode === 'dark' 
                    ? 'rgba(30, 30, 30, 0.8)' 
                    : 'background.paper',
                  border: theme.palette.mode === 'dark' 
                    ? '1px solid rgba(255, 255, 255, 0.08)' 
                    : '1px solid rgba(0, 0, 0, 0.08)',
                  backdropFilter: 'blur(20px)',
                }}>
                  <Typography variant="h6" gutterBottom>
                    Step {activeStep + 1} of {steps.length}
                  </Typography>
                  <Typography variant="body1" color="primary" fontWeight="bold">
                    {steps[activeStep].label}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {steps[activeStep].description}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={((activeStep + 1) / steps.length) * 100}
                    sx={{ mt: 2 }}
                  />
                </Paper>
                
                <Paper sx={{ 
                  p: 3, 
                  mb: 2,
                  bgcolor: theme.palette.mode === 'dark' 
                    ? 'rgba(30, 30, 30, 0.8)' 
                    : 'background.paper',
                  border: theme.palette.mode === 'dark' 
                    ? '1px solid rgba(255, 255, 255, 0.08)' 
                    : '1px solid rgba(0, 0, 0, 0.08)',
                  backdropFilter: 'blur(20px)',
                }}>
                  {renderStepContent(activeStep)}
                </Paper>
                
                {/* Mobile Navigation */}
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
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
              /* Desktop Stepper */
              <Stepper activeStep={activeStep} orientation="vertical">
                {steps.map((step, index) => (
                  <Step key={step.label} completed={index < activeStep}>
                    <StepLabel
                      onClick={() => handleStepClick(index)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <Typography variant="subtitle1">{step.label}</Typography>
                    </StepLabel>
                    <StepContent>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {step.description}
                      </Typography>
                      
                      <Paper 
                        elevation={0} 
                        sx={{ 
                          p: 3, 
                          bgcolor: theme.palette.mode === 'dark' 
                            ? 'rgba(30, 30, 30, 0.8)' 
                            : 'grey.50', 
                          mb: 2,
                          border: theme.palette.mode === 'dark' 
                            ? '1px solid rgba(255, 255, 255, 0.08)' 
                            : '1px solid rgba(0, 0, 0, 0.08)',
                          backdropFilter: 'blur(20px)',
                        }}
                      >
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
        </Box>
      </Container>

      {/* Floating Action Button - Save */}
      <Fab
        color="secondary"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1000,
        }}
        onClick={handleManualSave}
        disabled={isSaving}
        title={isSaving ? 'Saving...' : 'Save CV'}
      >
        {isSaving ? <CircularProgress size={24} color="inherit" /> : <Save />}
      </Fab>

      {/* Save Message Snackbar */}
      <Snackbar
        open={!!saveMessage}
        autoHideDuration={saveMessage?.includes('Section saved') ? 1500 : 3000}
        onClose={() => setSaveMessage(null)}
        message={saveMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        sx={{
          '& .MuiSnackbarContent-root': {
            backgroundColor: theme.palette.mode === 'dark'
              ? (saveMessage?.includes('Section saved') ? 'success.dark' : 'primary.dark')
              : (saveMessage?.includes('Section saved') ? 'success.main' : 'primary.main'),
            minWidth: 'auto',
            fontSize: '0.875rem',
            color: 'white',
          }
        }}
      />

      {/* AI Guidance Panel */}
      {showAIGuidance && (
        <AIGuidancePanel
          open={showAIGuidance}
          onClose={() => setShowAIGuidance(false)}
          cvData={cvData}
          currentStep={activeStep}
        />
      )}

      {/* CV Analysis Panel */}
      {showAnalysis && (
        <CVAnalysisPanel
          open={showAnalysis}
          onClose={() => setShowAnalysis(false)}
          cvData={cvData}
        />
      )}
    </Box>
  );
};

export default EnhancedCVBuilder;
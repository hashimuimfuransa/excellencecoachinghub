import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
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
  AppBar,
  Toolbar,
  IconButton,
  Fab,
  Snackbar,
  Alert,
  CircularProgress,
  Zoom,
  Backdrop,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
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

// Import optimized step components (we'll create these)
import OptimizedPersonalInfoStep from './OptimizedPersonalInfoStep';
import OptimizedExperienceStep from './OptimizedExperienceStep';
import OptimizedEducationStep from './OptimizedEducationStep';
import OptimizedSkillsStep from './OptimizedSkillsStep';
import OptimizedProjectsStep from './OptimizedProjectsStep';
import OptimizedCertificationsStep from './OptimizedCertificationsStep';
import OptimizedReferencesStep from './OptimizedReferencesStep';
import OptimizedVolunteerStep from './OptimizedVolunteerStep';
import OptimizedSummaryStep from './OptimizedSummaryStep';
import CVAIAssistant from '../cv-builder/CVAIAssistant';

import { CVData, cvBuilderService } from '../../services/cvBuilderService';

interface OptimizedCVBuilderProps {
  onClose?: () => void;
  initialData?: Partial<CVData>;
}

const defaultCVData: CVData = {
  personalInfo: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    linkedinUrl: '',
    portfolioUrl: '',
    githubUrl: '',
    professionalSummary: '',
  },
  experience: [],
  education: [],
  skills: {
    technical: [],
    soft: [],
    languages: [],
  },
  projects: [],
  certifications: [],
  references: [],
  volunteerExperience: [],
};

const steps = [
  { label: 'Personal Info', description: 'Basic information and summary' },
  { label: 'Experience', description: 'Work history and achievements' },
  { label: 'Education', description: 'Educational background' },
  { label: 'Skills', description: 'Technical and soft skills' },
  { label: 'Projects', description: 'Personal and professional projects' },
  { label: 'Certifications', description: 'Professional certifications' },
  { label: 'References', description: 'Professional references' },
  { label: 'Volunteer Work', description: 'Volunteer experience' },
  { label: 'Summary', description: 'Review and finalize' },
];

const OptimizedCVBuilder: React.FC<OptimizedCVBuilderProps> = ({
  onClose,
  initialData = {},
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Core state
  const [activeStep, setActiveStep] = useState(0);
  const [cvData, setCVData] = useState<CVData>(() => {
    // Deep merge with proper array handling
    const mergedData = { ...defaultCVData };
    if (initialData.personalInfo) {
      mergedData.personalInfo = { ...defaultCVData.personalInfo, ...initialData.personalInfo };
    }
    if (initialData.experience) {
      mergedData.experience = initialData.experience;
    }
    if (initialData.education) {
      mergedData.education = initialData.education;
    }
    if (initialData.skills) {
      mergedData.skills = { ...defaultCVData.skills, ...initialData.skills };
    }
    if (initialData.projects) {
      mergedData.projects = initialData.projects;
    }
    if (initialData.certifications) {
      mergedData.certifications = initialData.certifications;
    }
    if (initialData.references) {
      mergedData.references = initialData.references;
    }
    if (initialData.volunteerExperience) {
      mergedData.volunteerExperience = initialData.volunteerExperience;
    }
    return mergedData;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // UI state
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [showAIGuidance, setShowAIGuidance] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('modern-1');
  
  // Refs for performance optimization
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);



  // Optimized data change handler
  const handleDataChange = useCallback((section: keyof CVData, data: any) => {
    setCVData(prev => ({ ...prev, [section]: data }));
  }, []);

  // Navigation handlers
  const handleNext = useCallback(() => {
    setActiveStep(prev => Math.min(prev + 1, steps.length - 1));
  }, []);

  const handleBack = useCallback(() => {
    setActiveStep(prev => Math.max(prev - 1, 0));
  }, []);

  const handleStepClick = useCallback((step: number) => {
    setActiveStep(step);
  }, []);

  // Manual save
  const handleManualSave = useCallback(async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    try {
      await cvBuilderService.saveCVData(cvData);
      setSaveMessage('CV saved successfully');
      
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => setSaveMessage(null), 2000);
    } catch (error) {
      setSaveMessage('Save failed');
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => setSaveMessage(null), 2000);
    } finally {
      setIsSaving(false);
    }
  }, [cvData, isSaving]);

  // Generate CV with template selection
  const handleGenerateCV = useCallback(async (format: 'pdf' | 'word' = 'pdf', templateId: string = 'modern-1') => {
    setIsLoading(true);
    try {
      // First save the CV data
      await cvBuilderService.saveCVData(cvData);
      
      // Map the data to ensure backend compatibility 
      const exportData = {
        ...cvData,
        // Ensure both experience and experiences are available for backend compatibility
        experiences: cvData.experience || [],
        experience: cvData.experience || []
      };
      
      let blob: Blob;
      let filename: string;
      
      if (format === 'pdf') {
        blob = await cvBuilderService.exportToPDF(exportData, templateId);
        filename = `${cvData.personalInfo.firstName}_${cvData.personalInfo.lastName}_CV.pdf`;
      } else {
        blob = await cvBuilderService.exportToWord(exportData, templateId);
        filename = `${cvData.personalInfo.firstName}_${cvData.personalInfo.lastName}_CV.docx`;
      }
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setSaveMessage(`CV ${format === 'pdf' ? 'PDF' : 'Word document'} downloaded successfully! 📄`);
      
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => setSaveMessage(null), 4000);
    } catch (error) {
      console.error('Error generating CV:', error);
      setSaveMessage(`Failed to generate CV ${format}. Please try again.`);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => setSaveMessage(null), 4000);
    } finally {
      setIsLoading(false);
    }
  }, [cvData]);

  // AI assistance handlers
  const handlePreview = useCallback(async () => {
    setShowAnalysis(true);
    setIsLoading(true);
    try {
      // Get AI analysis of the CV
      const analysis = await cvBuilderService.analyzeCV(cvData);
      // Store analysis for the dialog
      (window as any).cvAnalysis = analysis;
    } catch (error) {
      console.error('Error analyzing CV:', error);
    } finally {
      setIsLoading(false);
    }
  }, [cvData]);

  const handleAIHelp = useCallback(async (action: string, data: any) => {
    setShowAIGuidance(true);
    // Store context for AI assistance
    (window as any).aiContext = { action, data };
  }, []);

  // Progress calculation (memoized)
  const calculateProgress = useMemo(() => {
    let totalFields = 0;
    let completedFields = 0;

    // Personal Info (5 required fields)
    totalFields += 5;
    if (cvData.personalInfo.firstName) completedFields++;
    if (cvData.personalInfo.lastName) completedFields++;
    if (cvData.personalInfo.email) completedFields++;
    if (cvData.personalInfo.phone) completedFields++;
    if (cvData.personalInfo.professionalSummary) completedFields++;

    // Other sections (1 point each)
    totalFields += 4;
    if (cvData.experience?.length > 0) completedFields++;
    if (cvData.education?.length > 0) completedFields++;
    if (cvData.skills && (cvData.skills.technical?.length > 0 || cvData.skills.soft?.length > 0)) completedFields++;
    if (cvData.projects?.length > 0) completedFields++;

    return totalFields > 0 ? (completedFields / totalFields) * 100 : 0;
  }, [cvData]);

  // Step content renderer (memoized)
  const renderStepContent = useCallback((step: number) => {
    const commonProps = {
      onChange: handleDataChange,
      onAIHelp: handleAIHelp,
    };

    switch (step) {
      case 0:
        return (
          <OptimizedPersonalInfoStep
            data={cvData.personalInfo}
            {...commonProps}
          />
        );
      case 1:
        return (
          <OptimizedExperienceStep
            data={cvData.experience || []}
            {...commonProps}
          />
        );
      case 2:
        return (
          <OptimizedEducationStep
            data={cvData.education || []}
            {...commonProps}
          />
        );
      case 3:
        return (
          <OptimizedSkillsStep
            data={cvData.skills || { technical: [], soft: [], languages: [] }}
            {...commonProps}
          />
        );
      case 4:
        return (
          <OptimizedProjectsStep
            data={cvData.projects || []}
            {...commonProps}
          />
        );
      case 5:
        return (
          <OptimizedCertificationsStep
            data={cvData.certifications || []}
            {...commonProps}
          />
        );
      case 6:
        return (
          <OptimizedReferencesStep
            data={cvData.references || []}
            {...commonProps}
          />
        );
      case 7:
        return (
          <OptimizedVolunteerStep
            data={cvData.volunteerExperience || []}
            {...commonProps}
          />
        );
      case 8:
        return (
          <OptimizedSummaryStep
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  // Load initial data and templates
  const hasLoadedData = useRef(false);
  const hasLoadedTemplates = useRef(false);
  
  useEffect(() => {
    const loadTemplates = async () => {
      if (hasLoadedTemplates.current) return;
      hasLoadedTemplates.current = true;
      
      try {
        const templateData = await cvBuilderService.getTemplates();
        setTemplates(templateData);
      } catch (error) {
        console.log('Failed to load templates');
        hasLoadedTemplates.current = false; // Allow retry on error
      }
    };
    
    loadTemplates();
  }, []); // Empty dependency array - only run once

  useEffect(() => {
    const loadSavedData = async () => {
      if (!hasLoadedData.current && Object.keys(initialData).length === 0) {
        hasLoadedData.current = true;
        try {
          const savedData = await cvBuilderService.getCVData();
          if (savedData) {
            setCVData(prevData => {
              // Only update if the current data is still default
              const isDefaultData = prevData.personalInfo.firstName === '' && 
                                   prevData.experience.length === 0;
              return isDefaultData ? savedData : prevData;
            });
          }
        } catch (error) {
          console.log('No saved data found');
        }
      }
    };
    
    if (Object.keys(initialData).length === 0) {
      loadSavedData();
    }
  }, [initialData]);

  // Message listener for AI success messages
  useEffect(() => {
    const handleShowMessage = (event: CustomEvent) => {
      setSaveMessage(event.detail.message);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => setSaveMessage(null), 4000);
    };

    window.addEventListener('showMessage', handleShowMessage as EventListener);
    
    return () => {
      window.removeEventListener('showMessage', handleShowMessage as EventListener);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Store CV data globally for AI components to access
  useEffect(() => {
    (window as any).cvData = cvData;
  }, [cvData]);

  if (isLoading && !cvData.personalInfo.firstName) {
    return (
      <Backdrop open sx={{ zIndex: theme.zIndex.drawer + 1 }}>
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
          <CircularProgress color="primary" />
          <Typography variant="h6" color="white">
            Loading CV Builder...
          </Typography>
        </Box>
      </Backdrop>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: theme.palette.mode === 'dark' ? 'background.default' : 'grey.50' 
    }}>
      {/* Header */}
      <AppBar 
        position="sticky" 
        elevation={1} 
        sx={{ 
          bgcolor: theme.palette.mode === 'dark' 
            ? 'rgba(18, 18, 18, 0.95)' 
            : 'primary.main',
          backdropFilter: 'blur(20px)',
          borderBottom: theme.palette.mode === 'dark' 
            ? '1px solid rgba(255, 255, 255, 0.08)' 
            : 'none',
        }}
      >
        <Toolbar sx={{ px: { xs: 1, sm: 2 } }}>
          {onClose && (
            <IconButton 
              edge="start" 
              color="inherit" 
              onClick={onClose} 
              sx={{ 
                mr: { xs: 1, sm: 2 },
                p: { xs: 0.5, sm: 1 }
              }}
            >
              <Close />
            </IconButton>
          )}
          
          <Typography 
            variant={isMobile ? "subtitle1" : "h6"} 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
              lineHeight: 1.2
            }}
          >
            {isMobile ? steps[activeStep].label : `CV Builder - ${steps[activeStep].label}`}
          </Typography>
          
          <Box display="flex" alignItems="center" gap={{ xs: 0.5, sm: 1 }}>
            {!isMobile && (
              <Typography variant="body2" sx={{ mr: 1 }}>
                {Math.round(calculateProgress)}%
              </Typography>
            )}
            
            <Button
              color="inherit"
              startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <Save />}
              onClick={handleManualSave}
              disabled={isSaving}
              size={isMobile ? "small" : "medium"}
              sx={{
                minWidth: { xs: 'auto', sm: 'auto' },
                px: { xs: 1, sm: 2 },
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }}
            >
              {isSaving ? (isMobile ? '...' : 'Saving...') : (isMobile ? '' : 'Save')}
            </Button>
          </Box>
        </Toolbar>
        
        <LinearProgress
          variant="determinate"
          value={calculateProgress}
          sx={{ 
            height: { xs: 2, sm: 3 }
          }}
        />
        
        {/* Mobile Progress Indicator */}
        {isMobile && (
          <Box sx={{ 
            px: 2, 
            py: 1, 
            bgcolor: theme.palette.mode === 'dark' 
              ? 'rgba(30, 30, 30, 0.8)' 
              : 'primary.dark',
            borderTop: theme.palette.mode === 'dark' 
              ? '1px solid rgba(255, 255, 255, 0.08)' 
              : 'none',
          }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" sx={{ 
                color: theme.palette.mode === 'dark' 
                  ? 'text.primary' 
                  : 'primary.contrastText', 
                opacity: 0.9 
              }}>
                Step {activeStep + 1} of {steps.length}
              </Typography>
              <Typography variant="caption" sx={{ 
                color: theme.palette.mode === 'dark' 
                  ? 'text.primary' 
                  : 'primary.contrastText', 
                fontWeight: 600 
              }}>
                {Math.round(calculateProgress)}% Complete
              </Typography>
            </Box>
          </Box>
        )}
      </AppBar>

      <Container 
        maxWidth="lg" 
        sx={{ 
          py: { xs: 2, sm: 4 }, 
          px: { xs: 1, sm: 2 },
          // Ensure container doesn't overflow on mobile
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
        {isMobile ? (
          // Mobile View
          <Box>
            <Paper sx={{ 
              p: { xs: 2, sm: 3 }, 
              mb: 2,
              borderRadius: { xs: 2, sm: 1 },
              minHeight: 'calc(100vh - 200px)',
              // Ensure mobile paper doesn't overflow
              width: '100%',
              maxWidth: '100%',
              overflow: 'hidden',
              minWidth: 0,
              bgcolor: theme.palette.mode === 'dark' 
                ? 'rgba(30, 30, 30, 0.8)' 
                : 'background.paper',
              border: theme.palette.mode === 'dark' 
                ? '1px solid rgba(255, 255, 255, 0.08)' 
                : '1px solid rgba(0, 0, 0, 0.08)',
              backdropFilter: 'blur(20px)',
              // Ensure text areas inside are properly contained
              '& .MuiTextField-root': {
                maxWidth: '100%',
                minWidth: 0,
              },
              '& .MuiOutlinedInput-root': {
                maxWidth: '100%',
                minWidth: 0,
              }
            }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                  {steps[activeStep].label}
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ 
                  mb: 2,
                  fontSize: { xs: '0.875rem', sm: '0.875rem' },
                  lineHeight: 1.4
                }}>
                  {steps[activeStep].description}
                </Typography>
                
                {/* Mobile Step Navigator */}
                <Box sx={{ 
                  display: 'flex', 
                  overflowX: 'auto',
                  gap: 1,
                  pb: 1,
                  mb: 2,
                  '&::-webkit-scrollbar': {
                    height: 4,
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: 'primary.main',
                    borderRadius: 2,
                  }
                }}>
                  {steps.map((step, index) => (
                    <Chip
                      key={step.label}
                      label={`${index + 1}`}
                      size="small"
                      variant={index === activeStep ? "filled" : "outlined"}
                      color={index === activeStep ? "primary" : "default"}
                      onClick={() => handleStepClick(index)}
                      sx={{ 
                        minWidth: 32,
                        cursor: 'pointer',
                        bgcolor: index < activeStep ? 'success.light' : 
                               index === activeStep ? 'primary.main' : 'grey.200',
                        color: index < activeStep ? 'success.contrastText' : 
                               index === activeStep ? 'primary.contrastText' : 'text.secondary',
                        border: 'none',
                        '&:hover': {
                          bgcolor: index === activeStep ? 'primary.dark' : 'grey.300'
                        }
                      }}
                    />
                  ))}
                </Box>
              </Box>
              
              {renderStepContent(activeStep)}
            </Paper>
            
            {/* Mobile Navigation - Fixed at bottom for better UX */}
            <Paper sx={{ 
              p: 2, 
              position: 'sticky', 
              bottom: { xs: 16, sm: 0 },
              zIndex: 1000,
              borderRadius: { xs: 2, sm: 1 },
              bgcolor: theme.palette.mode === 'dark' 
                ? 'rgba(30, 30, 30, 0.8)' 
                : 'background.paper',
              border: theme.palette.mode === 'dark' 
                ? '1px solid rgba(255, 255, 255, 0.08)' 
                : '1px solid rgba(0, 0, 0, 0.08)',
              backdropFilter: 'blur(20px)',
            }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  onClick={handleBack}
                  disabled={activeStep === 0}
                  startIcon={<NavigateBefore />}
                  variant="outlined"
                  fullWidth
                  sx={{
                    py: { xs: 1.5, sm: 1 },
                    fontSize: { xs: '0.875rem', sm: '0.875rem' }
                  }}
                >
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={activeStep === steps.length - 1}
                  endIcon={<NavigateNext />}
                  variant="contained"
                  fullWidth
                  sx={{
                    py: { xs: 1.5, sm: 1 },
                    fontSize: { xs: '0.875rem', sm: '0.875rem' }
                  }}
                >
                  {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
                </Button>
              </Box>
            </Paper>
          </Box>
        ) : (
          // Desktop View
          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((step, index) => (
              <Step key={step.label}>
                <StepLabel onClick={() => handleStepClick(index)} sx={{ cursor: 'pointer' }}>
                  <Typography variant="subtitle1">{step.label}</Typography>
                </StepLabel>
                <StepContent>
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
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      {step.description}
                    </Typography>
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
                      {index === steps.length - 1 ? 'Complete' : 'Continue'}
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
      </Container>

      {/* Floating Action Buttons - Enhanced for Mobile */}
      <Box sx={{ 
        position: 'fixed', 
        bottom: { xs: 80, sm: 24 }, 
        right: { xs: 16, sm: 24 },
        zIndex: 1200,
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 1
      }}>
        {/* AI Assistant */}
        <Zoom in>
          <Fab
            color="secondary"
            onClick={() => setShowAIGuidance(true)}
            size={isMobile ? "medium" : "large"}
            sx={{
              boxShadow: { xs: 2, sm: 4 },
              '&:hover': {
                transform: 'scale(1.1)',
                transition: 'transform 0.2s ease-in-out'
              }
            }}
          >
            <AutoAwesome />
          </Fab>
        </Zoom>
        
        {/* Download CV Button - Mobile Only Quick Access */}
        {isMobile && (
          <Zoom in style={{ transitionDelay: '100ms' }}>
            <Fab
              color="primary"
              onClick={() => handleExportCV('pdf')}
              size="small"
              sx={{
                boxShadow: 2,
                '&:hover': {
                  transform: 'scale(1.1)',
                  transition: 'transform 0.2s ease-in-out'
                }
              }}
            >
              <Download />
            </Fab>
          </Zoom>
        )}
      </Box>

      {/* Save Message */}
      <Snackbar
        open={!!saveMessage}
        autoHideDuration={null}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity="success" 
          variant="filled"
          sx={{
            bgcolor: theme.palette.mode === 'dark' 
              ? 'success.dark' 
              : 'success.main',
            color: 'white',
          }}
        >
          {saveMessage}
        </Alert>
      </Snackbar>

      {/* AI Guidance Dialog */}
      {showAIGuidance && (
        <CVAIAssistant
          open={showAIGuidance}
          onClose={() => setShowAIGuidance(false)}
          cvData={cvData}
          analysis={(window as any).cvAnalysis || null}
          onUpdateCV={(updatedCV) => {
            setCVData(updatedCV);
            setSaveMessage('CV updated with AI suggestions!');
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = setTimeout(() => setSaveMessage(null), 3000);
          }}
        />
      )}

      {/* Analysis Dialog */}
      <Dialog
        open={showAnalysis}
        onClose={() => setShowAnalysis(false)}
        maxWidth="lg"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            height: '90vh',
            bgcolor: theme.palette.mode === 'dark' 
              ? 'rgba(30, 30, 30, 0.95)' 
              : 'background.paper',
            border: theme.palette.mode === 'dark' 
              ? '1px solid rgba(255, 255, 255, 0.08)' 
              : '1px solid rgba(0, 0, 0, 0.08)',
            backdropFilter: 'blur(20px)',
          }
        }}
      >
        <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">CV Analysis & Preview</Typography>
            <IconButton onClick={() => setShowAnalysis(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Analyzing your CV...</Typography>
              </Box>
            ) : (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  📊 CV Analysis Summary
                </Typography>
                
                {(window as any).cvAnalysis ? (
                  <Box>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Overall Score: {(window as any).cvAnalysis.score}/100
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={(window as any).cvAnalysis.score} 
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>

                    <Typography variant="subtitle1" gutterBottom>
                      💡 Key Suggestions:
                    </Typography>
                    {(window as any).cvAnalysis.suggestions?.map((suggestion: string, index: number) => (
                      <Typography key={index} variant="body2" sx={{ mb: 1, pl: 2 }}>
                        • {suggestion}
                      </Typography>
                    ))}

                    <Box sx={{ mt: 3 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        🎯 Missing Elements:
                      </Typography>
                      {(window as any).cvAnalysis.missingElements?.map((element: string, index: number) => (
                        <Typography key={index} variant="body2" sx={{ mb: 1, pl: 2, color: 'warning.main' }}>
                          • {element}
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                ) : (
                  <Typography color="textSecondary">
                    Click "Preview CV" to analyze your CV and see detailed feedback.
                  </Typography>
                )}
                
                <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<Download />}
                    onClick={() => setShowDownloadOptions(true)}
                    disabled={isLoading}
                  >
                    Download CV
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<AutoAwesome />}
                    onClick={() => {
                      setShowAnalysis(false);
                      setShowAIGuidance(true);
                    }}
                  >
                    Get AI Help
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>
      </Dialog>

      {/* Download Options Dialog */}
      <Dialog
        open={showDownloadOptions}
        onClose={() => setShowDownloadOptions(false)}
        maxWidth="sm"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            bgcolor: theme.palette.mode === 'dark' 
              ? 'rgba(30, 30, 30, 0.95)' 
              : 'background.paper',
            border: theme.palette.mode === 'dark' 
              ? '1px solid rgba(255, 255, 255, 0.08)' 
              : '1px solid rgba(0, 0, 0, 0.08)',
            backdropFilter: 'blur(20px)',
          }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">Download CV</Typography>
            <IconButton onClick={() => setShowDownloadOptions(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Select Template:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {templates.map((template) => (
                <Chip
                  key={template.id}
                  label={template.name}
                  onClick={() => setSelectedTemplate(template.id)}
                  color={selectedTemplate === template.id ? 'primary' : 'default'}
                  variant={selectedTemplate === template.id ? 'filled' : 'outlined'}
                />
              ))}
            </Box>
          </Box>
          
          <Typography variant="subtitle1" gutterBottom>
            Select Format:
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<Download />}
              onClick={() => {
                handleGenerateCV('pdf', selectedTemplate);
                setShowDownloadOptions(false);
              }}
              disabled={isLoading}
              sx={{ justifyContent: 'flex-start', textTransform: 'none', py: 1.5 }}
            >
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="subtitle2">📄 Download as PDF</Typography>
                <Typography variant="caption" color="textSecondary">
                  Universal format, perfect for applications
                </Typography>
              </Box>
            </Button>
            
            <Button
              variant="outlined"
              fullWidth
              startIcon={<Download />}
              onClick={() => {
                handleGenerateCV('word', selectedTemplate);
                setShowDownloadOptions(false);
              }}
              disabled={isLoading}
              sx={{ justifyContent: 'flex-start', textTransform: 'none', py: 1.5 }}
            >
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="subtitle2">📝 Download as Word</Typography>
                <Typography variant="caption" color="textSecondary">
                  Editable format for further customization
                </Typography>
              </Box>
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default OptimizedCVBuilder;
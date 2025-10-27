import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  IconButton,
  LinearProgress,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Backdrop,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  ArrowBack,
  ArrowForward,
  Save,
  Download,
  Preview,
  SmartToy,
  CheckCircle,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Import CV Builder components
import CVPersonalInfoStep from '../components/cv-builder/CVPersonalInfoStep';
import CVExperienceStep from '../components/cv-builder/CVExperienceStep';
import CVEducationStep from '../components/cv-builder/CVEducationStep';
import CVSkillsStep from '../components/cv-builder/CVSkillsStep';
import CVLanguagesStep from '../components/cv-builder/CVLanguagesStep';
import CVProjectsStep from '../components/cv-builder/CVProjectsStep';
import CVCertificationsStep from '../components/cv-builder/CVCertificationsStep';
import CVAwardsStep from '../components/cv-builder/CVAwardsStep';
import CVReferencesStep from '../components/cv-builder/CVReferencesStep';
import CVTemplateStep from '../components/cv-builder/CVTemplateStep';
import CVPreviewStep from '../components/cv-builder/CVPreviewStep';

// Import types and service
import cvBuilderService, { CVData, CVTemplate } from '../services/cvBuilderService';

interface Step {
  label: string;
  description: string;
  required: boolean;
}

const steps: Step[] = [
  { label: 'Personal Info', description: 'Basic information', required: true },
  { label: 'Experience', description: 'Work history', required: true },
  { label: 'Education', description: 'Educational background', required: true },
  { label: 'Skills', description: 'Technical & soft skills', required: true },
  { label: 'Languages', description: 'Language proficiency', required: false },
  { label: 'Projects', description: 'Personal projects', required: false },
  { label: 'Certifications', description: 'Professional certificates', required: false },
  { label: 'Awards', description: 'Achievements & awards', required: false },
  { label: 'References', description: 'Professional references', required: false },
  { label: 'Template', description: 'Choose CV template', required: true },
  { label: 'Preview', description: 'Final review', required: true },
];

const CVBuilderPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  // State management
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState<CVTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<CVTemplate | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info',
  });

  // CV Data state
  const [cvData, setCvData] = useState<CVData>({
    personalInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      location: '',
      professionalSummary: '',
      linkedIn: '',
      website: '',
      github: '',
      portfolio: '',
    },
    experiences: [],
    education: [],
    skills: [],
    languages: [],
    projects: [],
    certifications: [],
    awards: [],
    volunteerExperience: [],
    publications: [],
    professionalMemberships: [],
    references: [],
  });

  // Load templates on component mount
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const templatesData = await cvBuilderService.getTemplates();
      setTemplates(templatesData);
    } catch (error) {
      showSnackbar('Failed to load templates', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    setActiveStep(stepIndex);
  };

  const handleCVDataChange = (section: keyof CVData, data: any) => {
    setCvData(prev => ({
      ...prev,
      [section]: data,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await cvBuilderService.saveDraft(cvData);
      showSnackbar('CV saved successfully', 'success');
    } catch (error) {
      showSnackbar('Failed to save CV', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async (format: 'pdf' | 'word') => {
    if (!selectedTemplate) {
      showSnackbar('Please select a template first', 'warning');
      setActiveStep(steps.length - 2); // Go to template step
      return;
    }

    try {
      setLoading(true);
      
      // Map the data to ensure backend compatibility 
      const exportData = {
        ...cvData,
        // Ensure both experience and experiences are available for backend compatibility
        experiences: cvData.experiences || [],
        experience: cvData.experiences || []
      };
      
      const blob = format === 'pdf' 
        ? await cvBuilderService.exportToPDF(exportData, selectedTemplate.id)
        : await cvBuilderService.exportToWord(exportData, selectedTemplate.id);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `CV_${cvData.personalInfo.firstName}_${cvData.personalInfo.lastName}.${format === 'pdf' ? 'pdf' : 'docx'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      showSnackbar(`CV exported as ${format.toUpperCase()} successfully`, 'success');
    } catch (error) {
      showSnackbar(`Failed to export CV as ${format.toUpperCase()}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const getCompletionPercentage = (): number => {
    let completedSteps = 0;
    const totalSteps = steps.length;

    if (isStepComplete(0)) completedSteps++;
    if (isStepComplete(1)) completedSteps++;
    if (isStepComplete(2)) completedSteps++;
    if (isStepComplete(3)) completedSteps++;
    if (isStepComplete(4)) completedSteps++;
    if (isStepComplete(5)) completedSteps++;
    if (isStepComplete(6)) completedSteps++;
    if (isStepComplete(7)) completedSteps++;
    if (isStepComplete(8)) completedSteps++;
    if (isStepComplete(9)) completedSteps++;
    if (isStepComplete(10)) completedSteps++;

    return Math.round((completedSteps / totalSteps) * 100);
  };

  const isStepComplete = (stepIndex: number): boolean => {
    switch (stepIndex) {
      case 0: // Personal Info
        return !!(cvData.personalInfo.firstName && cvData.personalInfo.lastName && cvData.personalInfo.email);
      case 1: // Experience
        return cvData.experiences.length > 0;
      case 2: // Education
        return cvData.education.length > 0;
      case 3: // Skills
        return cvData.skills.length > 0;
      case 4: // Languages
        return true; // Optional
      case 5: // Projects
        return true; // Optional
      case 6: // Certifications
        return true; // Optional
      case 7: // Awards
        return true; // Optional
      case 8: // References
        return true; // Optional
      case 9: // Template
        return !!selectedTemplate;
      case 10: // Preview
        return true;
      default:
        return false;
    }
  };

  const renderStepContent = (stepIndex: number) => {
    switch (stepIndex) {
      case 0:
        return (
          <CVPersonalInfoStep
            data={cvData.personalInfo}
            onChange={(data) => handleCVDataChange('personalInfo', data)}
          />
        );
      case 1:
        return (
          <CVExperienceStep
            data={cvData.experiences}
            onChange={(data) => handleCVDataChange('experiences', data)}
          />
        );
      case 2:
        return (
          <CVEducationStep
            data={cvData.education}
            onChange={(data) => handleCVDataChange('education', data)}
          />
        );
      case 3:
        return (
          <CVSkillsStep
            data={cvData.skills}
            onChange={(data) => handleCVDataChange('skills', data)}
          />
        );
      case 4:
        return (
          <CVLanguagesStep
            data={cvData.languages}
            onChange={(data) => handleCVDataChange('languages', data)}
          />
        );
      case 5:
        return (
          <CVProjectsStep
            data={cvData.projects}
            onChange={(data) => handleCVDataChange('projects', data)}
          />
        );
      case 6:
        return (
          <CVCertificationsStep
            data={cvData.certifications}
            onChange={(data) => handleCVDataChange('certifications', data)}
          />
        );
      case 7:
        return (
          <CVAwardsStep
            data={cvData.awards}
            onChange={(data) => handleCVDataChange('awards', data)}
          />
        );
      case 8:
        return (
          <CVReferencesStep
            data={cvData.references}
            onChange={(data) => handleCVDataChange('references', data)}
          />
        );
      case 9:
        return (
          <CVTemplateStep
            templates={templates}
            selectedTemplate={selectedTemplate}
            onTemplateSelect={setSelectedTemplate}
            cvData={cvData}
          />
        );
      case 10:
        return (
          <CVPreviewStep
            cvData={cvData}
            template={selectedTemplate}
            onExport={handleExport}
          />
        );
      default:
        return <Typography>Unknown step</Typography>;
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: theme.palette.mode === 'dark' ? 'background.default' : 'grey.50' 
    }}>
      {/* Loading Backdrop */}
      <Backdrop open={loading} sx={{ zIndex: theme.zIndex.drawer + 1 }}>
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
          <CircularProgress color="primary" />
          <Typography variant="h6" color="white">
            Processing...
          </Typography>
        </Box>
      </Backdrop>

      {/* Header */}
      <AppBar 
        position="sticky" 
        elevation={0}
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
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate('/dashboard')}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            CV Builder
          </Typography>
          
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="body2" sx={{ mr: 1 }}>
              {getCompletionPercentage()}% Complete
            </Typography>
            <Button
              color="inherit"
              startIcon={saving ? <CircularProgress size={16} /> : <Save />}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </Box>
        </Toolbar>
        
        <LinearProgress 
          variant="determinate" 
          value={getCompletionPercentage()} 
          sx={{ height: 4 }}
        />
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Grid container spacing={4}>
          {/* Stepper Sidebar - Hidden on mobile */}
          {!isMobile && (
            <Grid item xs={12} md={3}>
              <Paper 
                elevation={2} 
                sx={{ 
                  p: 3, 
                  position: 'sticky', 
                  top: 100,
                  bgcolor: theme.palette.mode === 'dark' 
                    ? 'rgba(30, 30, 30, 0.8)' 
                    : 'background.paper',
                  border: theme.palette.mode === 'dark' 
                    ? '1px solid rgba(255, 255, 255, 0.08)' 
                    : '1px solid rgba(0, 0, 0, 0.08)',
                  backdropFilter: 'blur(20px)',
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Steps
                </Typography>
                
                <Stepper orientation="vertical" activeStep={activeStep}>
                  {steps.map((step, index) => (
                    <Step key={step.label}>
                      <StepLabel 
                        onClick={() => handleStepClick(index)}
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'action.hover' },
                          borderRadius: 1,
                          p: 1,
                        }}
                        StepIconComponent={({ active, completed }) => (
                          <Box
                            sx={{
                              width: 24,
                              height: 24,
                              borderRadius: '50%',
                              bgcolor: completed 
                                ? 'success.main' 
                                : active 
                                  ? 'primary.main' 
                                  : theme.palette.mode === 'dark' 
                                    ? 'grey.600' 
                                    : 'grey.300',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontSize: '0.75rem',
                              border: theme.palette.mode === 'dark' && !completed && !active
                                ? '1px solid rgba(255, 255, 255, 0.2)'
                                : 'none',
                            }}
                          >
                            {completed ? <CheckCircle sx={{ fontSize: 16 }} /> : index + 1}
                          </Box>
                        )}
                      >
                        <Typography variant="subtitle2">{step.label}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {step.description}
                        </Typography>
                      </StepLabel>
                    </Step>
                  ))}
                </Stepper>
              </Paper>
            </Grid>
          )}

          {/* Main Content */}
          <Grid item xs={12} md={isMobile ? 12 : 9}>
            <Paper 
              elevation={2} 
              sx={{ 
                p: 4, 
                minHeight: 600,
                bgcolor: theme.palette.mode === 'dark' 
                  ? 'rgba(30, 30, 30, 0.8)' 
                  : 'background.paper',
                border: theme.palette.mode === 'dark' 
                  ? '1px solid rgba(255, 255, 255, 0.08)' 
                  : '1px solid rgba(0, 0, 0, 0.08)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <Box sx={{ mb: 4 }}>
                <Typography variant="h4" gutterBottom>
                  {steps[activeStep].label}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {steps[activeStep].description}
                </Typography>
              </Box>

              {/* Step Content */}
              <Box sx={{ mb: 4 }}>
                {renderStepContent(activeStep)}
              </Box>

              {/* Navigation Buttons */}
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Button
                  disabled={activeStep === 0}
                  onClick={handleBack}
                  startIcon={<ArrowBack />}
                  variant="outlined"
                >
                  Back
                </Button>

                <Box display="flex" gap={2}>
                  {activeStep === steps.length - 1 ? (
                    <>
                      <Button
                        variant="contained"
                        onClick={() => handleExport('pdf')}
                        startIcon={<Download />}
                        color="primary"
                      >
                        Export PDF
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => handleExport('word')}
                        startIcon={<Download />}
                      >
                        Export Word
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      endIcon={<ArrowForward />}
                    >
                      Next
                    </Button>
                  )}
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Floating AI Assistant */}
      <Fab
        color="secondary"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
        }}
        onClick={() => showSnackbar('AI Assistant coming soon!', 'info')}
      >
        <SmartToy />
      </Fab>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CVBuilderPage;
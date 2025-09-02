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
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Snackbar,
  Chip,
  Divider,
  LinearProgress,
  Tooltip,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Skeleton,
  Stack,
  Badge,
  AppBar,
  Toolbar,
} from '@mui/material';
import {
  AutoFixHigh,
  Download,
  Preview,
  Save,
  Psychology,
  TrendingUp,
  Lightbulb,
  FileUpload,
  Share,
  Settings,
  ArrowBack,
  ArrowForward,
  CloudUpload,
  PictureAsPdf,
  Description,
  Analytics,
  SmartToy,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  Refresh,
  Launch,
  ContentCopy,
  School,
  Work,
  Person,
  Star,
  Edit,
  Add,
  Delete,
  Visibility,
  MoreVert,
  Language,
  Code,
  EmojiEvents,
  Verified,
  ContactPhone,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '@mui/material/styles';
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
import CVAIAssistant from '../components/cv-builder/CVAIAssistant';
import cvBuilderService, { CVData, CVTemplate, AIAnalysisResult } from '../services/cvBuilderService';

const steps = [
  { label: 'Personal Info', icon: <Person />, required: true, description: 'Basic contact information and professional summary' },
  { label: 'Experience', icon: <Work />, required: true, description: 'Your work history and achievements' },
  { label: 'Education', icon: <School />, required: true, description: 'Academic qualifications and degrees' },
  { label: 'Skills', icon: <Star />, required: true, description: 'Technical and soft skills' },
  { label: 'Languages', icon: <Language />, required: false, description: 'Language proficiencies and certifications' },
  { label: 'Projects', icon: <Code />, required: false, description: 'Personal and professional projects' },
  { label: 'Certifications', icon: <Verified />, required: false, description: 'Professional certifications and licenses' },
  { label: 'Awards', icon: <EmojiEvents />, required: false, description: 'Achievements and recognitions' },
  { label: 'References', icon: <ContactPhone />, required: false, description: 'Professional references' },
  { label: 'Template', icon: <Settings />, required: true, description: 'Choose your CV design and layout' },
  { label: 'Preview', icon: <Visibility />, required: false, description: 'Review and export your CV' },
];

const CVBuilderPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [activeStep, setActiveStep] = useState(0);
  const [cvData, setCvData] = useState<CVData>({
    personalInfo: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: '',
      location: '',
      professionalSummary: '',
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
    customSections: [],
  });
  
  const [selectedTemplate, setSelectedTemplate] = useState<CVTemplate | null>(null);
  const [templates, setTemplates] = useState<CVTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' | 'info' });
  const [uploadDialog, setUploadDialog] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSaveEnabled) return;
    
    const autoSaveTimer = setTimeout(async () => {
      // Only auto-save if there's meaningful content
      const hasContent = cvData.personalInfo.firstName || 
                        cvData.personalInfo.lastName || 
                        cvData.experiences.length > 0 || 
                        cvData.education.length > 0;
      
      if (hasContent && !savingDraft) {
        try {
          setSavingDraft(true);
          await cvBuilderService.saveDraft(cvData);
          setLastSaved(new Date());
        } catch (error) {
          console.error('Auto-save failed:', error);
        } finally {
          setSavingDraft(false);
        }
      }
    }, 10000); // Auto-save every 10 seconds

    return () => clearTimeout(autoSaveTimer);
  }, [cvData, autoSaveEnabled, savingDraft]);

  const loadTemplates = async () => {
    try {
      const templatesData = await cvBuilderService.getTemplates();
      setTemplates(templatesData);
      if (templatesData.length > 0 && !selectedTemplate) {
        setSelectedTemplate(templatesData[0]);
      }
    } catch (error) {
      showSnackbar('Failed to load templates', 'error');
    }
  };

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep((prevActiveStep) => prevActiveStep - 1);
    }
  };

  const handleStepClick = (step: number) => {
    setActiveStep(step);
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCVDataChange = (section: keyof CVData, data: any) => {
    setCvData(prev => ({
      ...prev,
      [section]: data,
    }));
  };

  const handleAnalyzeCV = async () => {
    setAnalyzing(true);
    try {
      const analysis = await cvBuilderService.analyzeCV(cvData);
      setAiAnalysis(analysis);
      setShowAIAssistant(true);
      showSnackbar(`CV analysis complete! Score: ${analysis.score}/100`, 'info');
    } catch (error) {
      showSnackbar('Failed to analyze CV', 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAIAnalysis = async () => {
    await handleAnalyzeCV();
  };

  const handleSaveDraft = async () => {
    setSavingDraft(true);
    try {
      await cvBuilderService.saveDraft(cvData);
      setLastSaved(new Date());
      showSnackbar('CV draft saved successfully!', 'success');
    } catch (error) {
      showSnackbar('Failed to save draft', 'error');
    } finally {
      setSavingDraft(false);
    }
  };

  const handleExport = (format: 'pdf' | 'word') => async () => {
    setExportMenuAnchor(null);
    if (!selectedTemplate) {
      showSnackbar('Please select a template first', 'warning');
      setActiveStep(9); // Navigate to template step
      return;
    }

    // Enhanced validation - check all required sections
    const validationErrors = [];
    
    // Check personal info
    if (!cvData.personalInfo.firstName || !cvData.personalInfo.lastName) {
      validationErrors.push('Please fill in your first and last name');
    }
    if (!cvData.personalInfo.email) {
      validationErrors.push('Please provide your email address');
    }
    if (!cvData.personalInfo.phone) {
      validationErrors.push('Please provide your phone number');
    }
    if (!cvData.personalInfo.location) {
      validationErrors.push('Please provide your location');
    }

    // Check experience
    const hasValidExperience = cvData.experiences && cvData.experiences.length > 0 &&
      cvData.experiences.some(exp => 
        exp.jobTitle && exp.company && exp.startDate && exp.responsibilities && exp.responsibilities.length > 0
      );
    if (!hasValidExperience) {
      validationErrors.push('Please add at least one complete work experience');
    }

    // Check education
    const hasValidEducation = cvData.education && cvData.education.length > 0 &&
      cvData.education.some(edu => 
        edu.degree && edu.institution && edu.graduationDate
      );
    if (!hasValidEducation) {
      validationErrors.push('Please add at least one complete education entry');
    }

    // Check skills
    if (!cvData.skills || cvData.skills.length < 3) {
      validationErrors.push('Please add at least 3 skills');
    }

    if (validationErrors.length > 0) {
      showSnackbar(`CV incomplete: ${validationErrors.join(', ')}`, 'warning');
      // Navigate to the first incomplete step
      if (validationErrors[0].includes('name') || validationErrors[0].includes('email') || validationErrors[0].includes('phone') || validationErrors[0].includes('location')) {
        setActiveStep(0);
      } else if (validationErrors[0].includes('experience')) {
        setActiveStep(1);
      } else if (validationErrors[0].includes('education')) {
        setActiveStep(2);
      } else if (validationErrors[0].includes('skills')) {
        setActiveStep(3);
      }
      return;
    }

    setLoading(true);
    try {
      const blob = format === 'pdf' 
        ? await cvBuilderService.exportToPDF(cvData, selectedTemplate.id)
        : await cvBuilderService.exportToWord(cvData, selectedTemplate.id);
      
      // Check if the response is actually a blob
      if (!(blob instanceof Blob)) {
        throw new Error('Invalid response format');
      }

      // Check if blob has content
      if (blob.size === 0) {
        throw new Error('Empty file generated');
      }
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${cvData.personalInfo.firstName}_${cvData.personalInfo.lastName}_CV.${format === 'pdf' ? 'pdf' : 'docx'}`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      showSnackbar(`CV exported as ${format === 'pdf' ? 'PDF' : 'Word'} successfully!`, 'success');
    } catch (error: any) {
      console.error(`Export error (${format}):`, error);
      let errorMessage = `Failed to export CV as ${format === 'pdf' ? 'PDF' : 'Word'}`;
      
      if (error.message === 'Network Error') {
        errorMessage += '. Please check your internet connection.';
      } else if (error.message === 'Invalid response format') {
        errorMessage += '. The server returned an invalid response.';
      } else if (error.message === 'Empty file generated') {
        errorMessage += '. The generated file is empty.';
      }
      
      showSnackbar(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadResume = async (file: File) => {
    setLoading(true);
    try {
      const parsedCV = await cvBuilderService.parseResumeFile(file);
      setCvData(parsedCV);
      setUploadDialog(false);
      showSnackbar('Resume uploaded and parsed successfully!', 'success');
    } catch (error) {
      showSnackbar('Failed to parse resume file', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleUploadResume(file);
    }
  };

  const generateAIContent = async (prompt: string, section: string) => {
    try {
      const content = await cvBuilderService.generateAIContent(prompt, section);
      return content;
    } catch (error) {
      showSnackbar('Failed to generate AI content', 'error');
      return '';
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <CVPersonalInfoStep
            data={cvData.personalInfo}
            onChange={(data) => handleCVDataChange('personalInfo', data)}
            onGenerateAIContent={generateAIContent}
          />
        );
      case 1:
        return (
          <CVExperienceStep
            data={cvData.experiences}
            onChange={(data) => handleCVDataChange('experiences', data)}
            onGenerateAIContent={generateAIContent}
          />
        );
      case 2:
        return (
          <CVEducationStep
            data={cvData.education}
            onChange={(data) => handleCVDataChange('education', data)}
            onGenerateAIContent={generateAIContent}
          />
        );
      case 3:
        return (
          <CVSkillsStep
            data={cvData.skills}
            onChange={(data) => handleCVDataChange('skills', data)}
            onGenerateAIContent={generateAIContent}
          />
        );
      case 4:
        return (
          <CVLanguagesStep
            data={cvData.languages}
            onChange={(data) => handleCVDataChange('languages', data)}
            onGenerateAIContent={generateAIContent}
          />
        );
      case 5:
        return (
          <CVProjectsStep
            data={cvData.projects}
            onChange={(data) => handleCVDataChange('projects', data)}
            onGenerateAIContent={generateAIContent}
          />
        );
      case 6:
        return (
          <CVCertificationsStep
            data={cvData.certifications}
            onChange={(data) => handleCVDataChange('certifications', data)}
            onGenerateAIContent={generateAIContent}
          />
        );
      case 7:
        return (
          <CVAwardsStep
            data={cvData.awards}
            onChange={(data) => handleCVDataChange('awards', data)}
            onGenerateAIContent={generateAIContent}
          />
        );
      case 8:
        return (
          <CVReferencesStep
            data={cvData.references}
            onChange={(data) => handleCVDataChange('references', data)}
            onGenerateAIContent={generateAIContent}
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
        return 'Unknown step';
    }
  };

  const getCompletionPercentage = () => {
    let completed = 0;
    let requiredCompleted = 0;
    const totalRequired = 5; // Personal Info, Experience, Education, Skills, Template
    const totalOptional = 6; // Languages, Projects, Certifications, Awards, References, Professional Summary
    
    // Required sections (weighted more heavily)
    
    // Personal info completion (REQUIRED)
    const hasPersonalInfo = cvData.personalInfo.firstName && 
                           cvData.personalInfo.lastName && 
                           cvData.personalInfo.email &&
                           cvData.personalInfo.phone &&
                           cvData.personalInfo.location;
    
    if (hasPersonalInfo) {
      requiredCompleted++;
    }
    
    // Experience completion (REQUIRED - at least 1 with complete details)
    const hasValidExperience = cvData.experiences && cvData.experiences.length > 0 &&
      cvData.experiences.some(exp => 
        exp.jobTitle && exp.company && exp.startDate && exp.responsibilities && exp.responsibilities.length > 0
      );
    
    if (hasValidExperience) {
      requiredCompleted++;
    }
    
    // Education completion (REQUIRED - at least 1 with complete details)
    const hasValidEducation = cvData.education && cvData.education.length > 0 &&
      cvData.education.some(edu => 
        edu.degree && edu.institution && edu.graduationDate
      );
    
    if (hasValidEducation) {
      requiredCompleted++;
    }
    
    // Skills completion (REQUIRED - at least 3 skills)
    const hasValidSkills = cvData.skills && cvData.skills.length >= 3;
    
    if (hasValidSkills) {
      requiredCompleted++;
    }
    
    // Template selection (REQUIRED)
    if (selectedTemplate) {
      requiredCompleted++;
    }
    
    // Optional sections (lower weight but still valuable)
    let optionalCompleted = 0;
    
    // Languages completion (optional but valuable)
    if (cvData.languages && cvData.languages.length > 0) {
      optionalCompleted++;
    }
    
    // Projects completion (optional)
    if (cvData.projects && cvData.projects.length > 0) {
      optionalCompleted++;
    }
    
    // Certifications completion (optional)
    if (cvData.certifications && cvData.certifications.length > 0) {
      optionalCompleted++;
    }
    
    // Awards completion (optional)
    if (cvData.awards && cvData.awards.length > 0) {
      optionalCompleted++;
    }
    
    // References completion (optional)
    if (cvData.references && cvData.references.length > 0) {
      optionalCompleted++;
    }
    
    // Professional summary (bonus completion)
    if (cvData.personalInfo.professionalSummary && cvData.personalInfo.professionalSummary.length > 50) {
      optionalCompleted += 0.5;
    }
    
    // Calculate weighted completion
    // Required sections count as 70% of total completion
    // Optional sections count as 30% of total completion
    const requiredPercentage = (requiredCompleted / totalRequired) * 70;
    const optionalPercentage = (Math.min(optionalCompleted, totalOptional) / totalOptional) * 30;
    
    return Math.round(requiredPercentage + optionalPercentage);
  };

  const isStepComplete = (step: number) => {
    switch (step) {
      case 0: // Personal Info - Enhanced validation
        return cvData.personalInfo.firstName && 
               cvData.personalInfo.lastName && 
               cvData.personalInfo.email &&
               cvData.personalInfo.phone &&
               cvData.personalInfo.location;
      
      case 1: // Experience - Requires at least one complete experience
        return cvData.experiences && cvData.experiences.length > 0 &&
               cvData.experiences.some(exp => 
                 exp.jobTitle && exp.company && exp.startDate && 
                 exp.responsibilities && exp.responsibilities.length > 0
               );
      
      case 2: // Education - Requires at least one complete education entry
        return cvData.education && cvData.education.length > 0 &&
               cvData.education.some(edu => 
                 edu.degree && edu.institution && edu.graduationDate
               );
      
      case 3: // Skills - Requires at least 3 skills for a good CV
        return cvData.skills && cvData.skills.length >= 3;
      
      case 4: // Languages - Optional but nice to have
        return cvData.languages && cvData.languages.length > 0;
      
      case 5: // Projects - Optional
        return cvData.projects && cvData.projects.length > 0;
      
      case 6: // Certifications - Optional
        return cvData.certifications && cvData.certifications.length > 0;
      
      case 7: // Awards - Optional
        return cvData.awards && cvData.awards.length > 0;
      
      case 8: // References - Optional
        return cvData.references && cvData.references.length > 0;
      
      case 9: // Template - Required
        return selectedTemplate !== null;
      
      case 10: // Preview - Always complete when reached
        return true;
      
      default:
        return false;
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <IconButton
            edge="start"
            onClick={() => navigate('/app/dashboard')}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" component="div">
              AI-Powered CV Builder
            </Typography>
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="body2" color="text.secondary">
                Step {activeStep + 1} of {steps.length}: {steps[activeStep].label}
              </Typography>
              <Chip 
                label={`${getCompletionPercentage()}% Complete`}
                color={getCompletionPercentage() >= 70 ? 'success' : getCompletionPercentage() >= 40 ? 'warning' : 'error'}
                size="small"
                variant="outlined"
              />
            </Box>
          </Box>
          
          <Stack direction="row" spacing={1}>
            <Tooltip title="Upload existing resume">
              <IconButton onClick={() => setUploadDialog(true)}>
                <FileUpload />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Analyze with AI">
              <IconButton onClick={handleAnalyzeCV} disabled={analyzing}>
                {analyzing ? <CircularProgress size={20} /> : <Psychology />}
              </IconButton>
            </Tooltip>
            
            <Tooltip title={lastSaved ? `Last saved: ${lastSaved.toLocaleTimeString()}` : "Save draft"}>
              <IconButton onClick={handleSaveDraft} disabled={savingDraft}>
                {savingDraft ? <CircularProgress size={20} /> : <Save />}
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Export CV">
              <IconButton
                onClick={(e) => setExportMenuAnchor(e.currentTarget)}
                disabled={!selectedTemplate}
              >
                <Download />
              </IconButton>
            </Tooltip>
          </Stack>
        </Toolbar>
        
        {/* Progress bar */}
        <Box sx={{ px: 3, pb: 1 }}>
          <Box display="flex" alignItems="center" mb={1}>
            <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
              {getCompletionPercentage()}% Complete
            </Typography>
            <LinearProgress
              variant="determinate"
              value={getCompletionPercentage()}
              sx={{ flexGrow: 1 }}
            />
            {lastSaved && (
              <Tooltip title={`Auto-saved at ${lastSaved.toLocaleTimeString()}`}>
                <Typography variant="caption" color="success.main" sx={{ ml: 2, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CheckCircle sx={{ fontSize: 12 }} />
                  Saved
                </Typography>
              </Tooltip>
            )}
            {savingDraft && (
              <Typography variant="caption" color="text.secondary" sx={{ ml: 2, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CircularProgress size={12} />
                Saving...
              </Typography>
            )}
          </Box>
        </Box>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          {/* Stepper Sidebar */}
          <Grid item xs={12} md={3}>
            <Paper elevation={2} sx={{ p: 2, position: 'sticky', top: 100 }}>
              <Typography variant="h6" gutterBottom>
                Build Your CV
              </Typography>
              <Stepper
                activeStep={activeStep}
                orientation="vertical"
                sx={{ mt: 2 }}
              >
                {steps.map((step, index) => (
                  <Step key={step.label} completed={isStepComplete(index)}>
                    <StepLabel
                      onClick={() => handleStepClick(index)}
                      sx={{ 
                        cursor: 'pointer',
                        '& .MuiStepLabel-labelContainer': {
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          gap: 0.5,
                        }
                      }}
                      StepIconComponent={() => (
                        <Box
                          sx={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            bgcolor: isStepComplete(index) 
                              ? 'success.main' 
                              : index === activeStep 
                                ? 'primary.main' 
                                : step.required
                                  ? 'warning.light'
                                  : 'grey.300',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            border: step.required ? '2px solid' : 'none',
                            borderColor: step.required ? 'warning.main' : 'transparent',
                          }}
                        >
                          {isStepComplete(index) ? (
                            <CheckCircle sx={{ fontSize: 16 }} />
                          ) : (
                            React.cloneElement(step.icon, { sx: { fontSize: 16 } })
                          )}
                        </Box>
                      )}
                    >
                      <Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2" fontWeight={index === activeStep ? 'bold' : 'normal'}>
                            {step.label}
                          </Typography>
                          {step.required && (
                            <Chip label="Required" size="small" color="warning" variant="outlined" sx={{ height: 16, fontSize: '0.6rem' }} />
                          )}
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                          {step.description}
                        </Typography>
                      </Box>
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>

              {/* Progress Tips Card */}
              <Card sx={{ mt: 3, bgcolor: 'info.light' }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                    <Lightbulb color="primary" />
                    <Typography variant="subtitle2">Quick Tips</Typography>
                  </Stack>
                  <Stack spacing={1}>
                    {getCompletionPercentage() < 30 && (
                      <Typography variant="body2">
                        🎯 Start with the required sections: Personal Info, Experience, Education, and Skills
                      </Typography>
                    )}
                    {getCompletionPercentage() >= 30 && getCompletionPercentage() < 70 && (
                      <Typography variant="body2">
                        ✨ Great progress! Consider adding optional sections like Languages or Projects to stand out
                      </Typography>
                    )}
                    {getCompletionPercentage() >= 70 && (
                      <Typography variant="body2">
                        🚀 Your CV is nearly complete! Choose a template and preview your professional CV
                      </Typography>
                    )}
                    <Typography variant="body2">
                      💡 Use the AI assistant to help generate content for any section
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>

              {/* AI Analysis Card */}
              {aiAnalysis && (
                <Card sx={{ mt: 3, bgcolor: 'background.paper' }}>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                      <Psychology color="primary" />
                      <Typography variant="subtitle2">AI Analysis</Typography>
                    </Stack>
                    
                    <Box display="flex" alignItems="center" mb={2}>
                      <Typography variant="h4" color="primary" sx={{ mr: 1 }}>
                        {aiAnalysis.score}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        / 100
                      </Typography>
                    </Box>
                    
                    <Stack spacing={1}>
                      {aiAnalysis.improvements.slice(0, 3).map((improvement, index) => (
                        <Chip
                          key={index}
                          label={improvement.suggestion}
                          size="small"
                          color={improvement.priority === 'high' ? 'error' : improvement.priority === 'medium' ? 'warning' : 'default'}
                          variant="outlined"
                        />
                      ))}
                    </Stack>
                    
                    <Button
                      size="small"
                      onClick={() => setShowAIAssistant(true)}
                      sx={{ mt: 2 }}
                    >
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              )}
            </Paper>
          </Grid>

          {/* Main Content */}
          <Grid item xs={12} md={9}>
            <Paper elevation={2} sx={{ p: 4, minHeight: 600 }}>
              <Box mb={3}>
                <Typography variant="h4" gutterBottom>
                  {steps[activeStep].label}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {activeStep === 0 && "Let's start with your basic contact information and professional summary"}
                  {activeStep === 1 && "Add your work experience and professional achievements"}
                  {activeStep === 2 && "Include your educational background and qualifications"}
                  {activeStep === 3 && "Highlight your technical and soft skills"}
                  {activeStep === 4 && "Add languages you speak and your proficiency levels"}
                  {activeStep === 5 && "Showcase your personal and professional projects"}
                  {activeStep === 6 && "Include your professional certifications and licenses"}
                  {activeStep === 7 && "Add awards and recognitions you've received"}
                  {activeStep === 8 && "Provide professional references (optional)"}
                  {activeStep === 9 && "Choose a professional template for your CV"}
                  {activeStep === 10 && "Review your CV and export in your preferred format"}
                </Typography>
              </Box>

              <Box mb={4}>
                {renderStepContent(activeStep)}
              </Box>

              {/* Smart Navigation */}
              <Card sx={{ mt: 4, p: 2, bgcolor: 'background.default' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Button
                    onClick={handleBack}
                    disabled={activeStep === 0}
                    startIcon={<ArrowBack />}
                    variant="outlined"
                  >
                    Back
                  </Button>
                  
                  <Box sx={{ textAlign: 'center', flex: 1, mx: 2 }}>
                    {!isStepComplete(activeStep) && steps[activeStep].required && (
                      <Alert severity="warning" sx={{ mb: 1 }}>
                        <Typography variant="body2">
                          Complete this required section to continue
                        </Typography>
                      </Alert>
                    )}
                    
                    <Typography variant="body2" color="text.secondary">
                      Step {activeStep + 1} of {steps.length}
                    </Typography>
                    
                    {isStepComplete(activeStep) && (
                      <Chip 
                        icon={<CheckCircle />} 
                        label="Section Complete" 
                        color="success" 
                        size="small" 
                        sx={{ mt: 1 }} 
                      />
                    )}
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {!steps[activeStep].required && activeStep < steps.length - 1 && (
                      <Button
                        onClick={() => setActiveStep(activeStep + 1)}
                        variant="outlined"
                        color="secondary"
                        size="small"
                      >
                        Skip Optional
                      </Button>
                    )}
                    
                    {activeStep < steps.length - 1 ? (
                      <Button
                        onClick={handleNext}
                        disabled={steps[activeStep].required && !isStepComplete(activeStep)}
                        endIcon={<ArrowForward />}
                        variant="contained"
                      >
                        {activeStep === steps.length - 2 ? 'Preview' : 'Next'}
                      </Button>
                    ) : (
                      <Button
                        onClick={handleExport('pdf')}
                        startIcon={<Download />}
                        variant="contained"
                        disabled={!selectedTemplate || loading || getCompletionPercentage() < 70}
                      >
                        {loading ? 'Exporting...' : 'Export CV'}
                      </Button>
                    )}
                  </Box>
                </Box>
                
                {/* Quick Actions */}
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {activeStep < 9 && (
                    <Button
                      size="small"
                      startIcon={<Lightbulb />}
                      onClick={handleAIAnalysis}
                      disabled={analyzing}
                      variant="outlined"
                    >
                      {analyzing ? 'Analyzing...' : 'AI Help'}
                    </Button>
                  )}
                  
                  <Button
                    size="small"
                    startIcon={<Save />}
                    onClick={handleSaveDraft}
                    disabled={savingDraft}
                    variant="outlined"
                  >
                    {savingDraft ? 'Saving...' : 'Save Draft'}
                  </Button>
                  
                  {getCompletionPercentage() >= 70 && activeStep !== 10 && (
                    <Button
                      size="small"
                      startIcon={<Visibility />}
                      onClick={() => setActiveStep(10)}
                      color="success"
                      variant="outlined"
                    >
                      Preview CV
                    </Button>
                  )}
                </Box>
              </Card>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Floating AI Assistant */}
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1000,
        }}
        onClick={() => setShowAIAssistant(true)}
      >
        <SmartToy />
      </Fab>

      {/* AI Assistant Dialog */}
      <CVAIAssistant
        open={showAIAssistant}
        onClose={() => setShowAIAssistant(false)}
        cvData={cvData}
        analysis={aiAnalysis}
        onUpdateCV={setCvData}
      />

      {/* Upload Dialog */}
      <Dialog open={uploadDialog} onClose={() => setUploadDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Existing Resume</DialogTitle>
        <DialogContent>
          <Box
            sx={{
              border: '2px dashed',
              borderColor: 'grey.300',
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              cursor: 'pointer',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'action.hover',
              },
            }}
            component="label"
          >
            <input
              type="file"
              hidden
              accept=".pdf,.doc,.docx"
              onChange={handleFileUpload}
            />
            <CloudUpload sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Drop your resume here or click to browse
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Supports PDF, DOC, and DOCX files
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Export Menu */}
      <Menu
        anchorEl={exportMenuAnchor}
        open={Boolean(exportMenuAnchor)}
        onClose={() => setExportMenuAnchor(null)}
      >
        <MenuItem onClick={handleExport('pdf')}>
          <PictureAsPdf sx={{ mr: 1 }} />
          Export as PDF
        </MenuItem>
        <MenuItem onClick={handleExport('word')}>
          <Description sx={{ mr: 1 }} />
          Export as Word
        </MenuItem>
      </Menu>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CVBuilderPage;
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
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '@mui/material/styles';
import CVPersonalInfoStep from '../components/cv-builder/CVPersonalInfoStep';
import CVExperienceStep from '../components/cv-builder/CVExperienceStep';
import CVEducationStep from '../components/cv-builder/CVEducationStep';
import CVSkillsStep from '../components/cv-builder/CVSkillsStep';
import CVTemplateStep from '../components/cv-builder/CVTemplateStep';
import CVPreviewStep from '../components/cv-builder/CVPreviewStep';
import CVAIAssistant from '../components/cv-builder/CVAIAssistant';
import cvBuilderService, { CVData, CVTemplate, AIAnalysisResult } from '../services/cvBuilderService';

const steps = [
  { label: 'Personal Info', icon: <Person /> },
  { label: 'Experience', icon: <Work /> },
  { label: 'Education', icon: <School /> },
  { label: 'Skills', icon: <Star /> },
  { label: 'Template', icon: <Settings /> },
  { label: 'Preview', icon: <Visibility /> },
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
    projects: [],
    certifications: [],
    awards: [],
    languages: [],
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

  useEffect(() => {
    loadTemplates();
  }, []);

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

  const handleSaveDraft = async () => {
    setSavingDraft(true);
    try {
      await cvBuilderService.saveDraft(cvData);
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
      return;
    }

    setLoading(true);
    try {
      const blob = format === 'pdf' 
        ? await cvBuilderService.exportToPDF(cvData, selectedTemplate.id)
        : await cvBuilderService.exportToWord(cvData, selectedTemplate.id);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${cvData.personalInfo.firstName}_${cvData.personalInfo.lastName}_CV.${format === 'pdf' ? 'pdf' : 'docx'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showSnackbar(`CV exported as ${format.toUpperCase()} successfully!`, 'success');
    } catch (error) {
      showSnackbar(`Failed to export CV as ${format.toUpperCase()}`, 'error');
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
          <CVTemplateStep
            templates={templates}
            selectedTemplate={selectedTemplate}
            onTemplateSelect={setSelectedTemplate}
            cvData={cvData}
          />
        );
      case 5:
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
    const total = 6;
    
    // Personal info completion
    if (cvData.personalInfo.firstName && cvData.personalInfo.lastName && cvData.personalInfo.email) {
      completed++;
    }
    
    // Experience completion
    if (cvData.experiences && cvData.experiences.length > 0) {
      completed++;
    }
    
    // Education completion
    if (cvData.education && cvData.education.length > 0) {
      completed++;
    }
    
    // Skills completion
    if (cvData.skills && cvData.skills.length > 0) {
      completed++;
    }
    
    // Template selection
    if (selectedTemplate) {
      completed++;
    }
    
    // Preview (always completed if we reach this step)
    if (activeStep >= 5) {
      completed++;
    }
    
    return Math.round((completed / total) * 100);
  };

  const isStepComplete = (step: number) => {
    switch (step) {
      case 0:
        return cvData.personalInfo.firstName && cvData.personalInfo.lastName && cvData.personalInfo.email;
      case 1:
        return cvData.experiences && cvData.experiences.length > 0;
      case 2:
        return cvData.education && cvData.education.length > 0;
      case 3:
        return cvData.skills && cvData.skills.length > 0;
      case 4:
        return selectedTemplate !== null;
      case 5:
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
          
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            AI-Powered CV Builder
          </Typography>
          
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
            
            <Tooltip title="Save draft">
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
                          alignItems: 'center',
                          gap: 1,
                        }
                      }}
                      StepIconComponent={() => (
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            bgcolor: isStepComplete(index) 
                              ? 'success.main' 
                              : index === activeStep 
                                ? 'primary.main' 
                                : 'grey.300',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                          }}
                        >
                          {isStepComplete(index) ? (
                            <CheckCircle fontSize="small" />
                          ) : (
                            step.icon
                          )}
                        </Box>
                      )}
                    >
                      <Typography
                        variant="body2"
                        color={index === activeStep ? 'primary' : 'textSecondary'}
                        fontWeight={index === activeStep ? 'bold' : 'normal'}
                      >
                        {step.label}
                      </Typography>
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>

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
                  {activeStep === 0 && "Let's start with your basic information"}
                  {activeStep === 1 && "Add your work experience and achievements"}
                  {activeStep === 2 && "Include your educational background"}
                  {activeStep === 3 && "Highlight your skills and competencies"}
                  {activeStep === 4 && "Choose a professional template"}
                  {activeStep === 5 && "Review and export your CV"}
                </Typography>
              </Box>

              <Box mb={4}>
                {renderStepContent(activeStep)}
              </Box>

              {/* Navigation Buttons */}
              <Box display="flex" justifyContent="between" mt={4}>
                <Button
                  disabled={activeStep === 0}
                  onClick={handleBack}
                  startIcon={<ArrowBack />}
                  variant="outlined"
                >
                  Back
                </Button>
                
                <Box flexGrow={1} />
                
                {activeStep < steps.length - 1 ? (
                  <Button
                    onClick={handleNext}
                    endIcon={<ArrowForward />}
                    variant="contained"
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    onClick={handleExport('pdf')}
                    startIcon={<Download />}
                    variant="contained"
                    disabled={!selectedTemplate || loading}
                  >
                    {loading ? 'Exporting...' : 'Export CV'}
                  </Button>
                )}
              </Box>
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
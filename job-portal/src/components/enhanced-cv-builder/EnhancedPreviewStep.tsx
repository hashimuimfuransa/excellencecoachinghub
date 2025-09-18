import React, { useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Download,
  Visibility,
  Assessment,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  ExpandMore,
  TrendingUp,
  Lightbulb,
  AutoFixHigh,
  Share,
  Print,
  Email,
} from '@mui/icons-material';
import { CVData, CVTemplate, AIAnalysisResult } from '../../services/cvBuilderService';

interface EnhancedPreviewStepProps {
  cvData: CVData;
  selectedTemplate: CVTemplate | null;
  analysis: AIAnalysisResult | null;
  onExport: (format: 'pdf' | 'word') => void;
}

const EnhancedPreviewStep: React.FC<EnhancedPreviewStepProps> = ({
  cvData,
  selectedTemplate,
  analysis,
  onExport,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const calculateCompletionScore = (): number => {
    let score = 0;
    let maxScore = 0;

    // Personal Info (30 points)
    maxScore += 30;
    if (cvData.personalInfo.firstName && cvData.personalInfo.lastName && cvData.personalInfo.email) {
      score += 15;
    }
    if (cvData.personalInfo.phone && cvData.personalInfo.location) {
      score += 10;
    }
    if (cvData.personalInfo.professionalSummary && cvData.personalInfo.professionalSummary.length > 50) {
      score += 5;
    }

    // Experience (25 points)
    maxScore += 25;
    const experiences = cvData.experiences || cvData.experience || [];
    if (experiences.length > 0) {
      score += 15;
      const hasDetailedExperience = experiences.some(exp => 
        exp.achievements && exp.achievements.length > 0
      );
      if (hasDetailedExperience) score += 10;
    }

    // Education (20 points)
    maxScore += 20;
    if (cvData.education.length > 0) score += 20;

    // Skills (15 points)
    maxScore += 15;
    const skillsCount = Array.isArray(cvData.skills) 
      ? cvData.skills.length 
      : (cvData.skills?.technical?.length || 0) + (cvData.skills?.soft?.length || 0) + (cvData.skills?.languages?.length || 0);
    if (skillsCount >= 3) score += 10;
    if (skillsCount >= 8) score += 5;

    // Template (10 points)
    maxScore += 10;
    if (selectedTemplate) score += 10;

    return Math.round((score / maxScore) * 100);
  };

  const getReadinessStatus = () => {
    const score = calculateCompletionScore();
    if (score >= 90) return { status: 'excellent', color: 'success', message: 'Excellent! Your CV is ready to impress employers.' };
    if (score >= 75) return { status: 'good', color: 'success', message: 'Good! Your CV is solid and ready to use.' };
    if (score >= 60) return { status: 'decent', color: 'warning', message: 'Decent! Consider adding more details for better impact.' };
    return { status: 'needs-work', color: 'error', message: 'Needs work. Please complete more sections before exporting.' };
  };

  const getValidationIssues = (): { type: 'error' | 'warning' | 'info'; message: string; section?: string }[] => {
    const issues = [];

    // Critical issues (errors)
    if (!cvData.personalInfo.firstName || !cvData.personalInfo.lastName) {
      issues.push({ type: 'error', message: 'Full name is required', section: 'Personal Info' });
    }
    if (!cvData.personalInfo.email) {
      issues.push({ type: 'error', message: 'Email address is required', section: 'Personal Info' });
    }
    const experiences = cvData.experiences || cvData.experience || [];
    if (experiences.length === 0) {
      issues.push({ type: 'error', message: 'At least one work experience is required', section: 'Experience' });
    }
    if (cvData.education.length === 0) {
      issues.push({ type: 'error', message: 'At least one education entry is required', section: 'Education' });
    }
    const skillsCount = Array.isArray(cvData.skills) 
      ? cvData.skills.length 
      : (cvData.skills?.technical?.length || 0) + (cvData.skills?.soft?.length || 0) + (cvData.skills?.languages?.length || 0);
    if (skillsCount < 3) {
      issues.push({ type: 'error', message: 'At least 3 skills are recommended', section: 'Skills' });
    }
    if (!selectedTemplate) {
      issues.push({ type: 'error', message: 'Please select a template', section: 'Template' });
    }

    // Warnings
    if (!cvData.personalInfo.phone) {
      issues.push({ type: 'warning', message: 'Phone number is recommended for better contact options', section: 'Personal Info' });
    }
    if (!cvData.personalInfo.professionalSummary) {
      issues.push({ type: 'warning', message: 'Professional summary helps grab employer attention', section: 'Personal Info' });
    }
    if (experiences.some(exp => !exp.achievements || exp.achievements.length === 0)) {
      issues.push({ type: 'warning', message: 'Add achievements to make your experience more impactful', section: 'Experience' });
    }

    // Tips
    if (!cvData.personalInfo.linkedIn) {
      issues.push({ type: 'info', message: 'LinkedIn profile can increase your visibility', section: 'Personal Info' });
    }
    if (skillsCount < 8) {
      issues.push({ type: 'info', message: 'Consider adding more skills (6-12 recommended)', section: 'Skills' });
    }

    return issues;
  };

  const handleExport = async (format: 'pdf' | 'word') => {
    setExporting(true);
    try {
      await onExport(format);
      setExportDialogOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  const renderCVPreview = () => (
    <Card sx={{ height: 600, overflow: 'auto', border: 2, borderColor: 'primary.main' }}>
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4, pb: 2, borderBottom: 2, borderColor: 'primary.main' }}>
          <Typography variant="h4" fontWeight="bold" color="primary">
            {cvData.personalInfo.firstName} {cvData.personalInfo.lastName}
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {cvData.experiences[0]?.jobTitle || 'Professional'}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap', mt: 1 }}>
            <Typography variant="body2">{cvData.personalInfo.email}</Typography>
            {cvData.personalInfo.phone && (
              <Typography variant="body2">{cvData.personalInfo.phone}</Typography>
            )}
            {cvData.personalInfo.location && (
              <Typography variant="body2">{cvData.personalInfo.location}</Typography>
            )}
          </Box>
        </Box>

        {/* Professional Summary */}
        {cvData.personalInfo.professionalSummary && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" color="primary" gutterBottom>
              Professional Summary
            </Typography>
            <Typography variant="body1" paragraph>
              {cvData.personalInfo.professionalSummary}
            </Typography>
          </Box>
        )}

        {/* Experience */}
        {cvData.experiences.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" color="primary" gutterBottom>
              Professional Experience
            </Typography>
            {cvData.experiences.slice(0, 2).map((exp, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {exp.jobTitle}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {exp.company} • {exp.location}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {exp.startDate} - {exp.isCurrentRole ? 'Present' : exp.endDate}
                  </Typography>
                </Box>
                {exp.achievements && exp.achievements.length > 0 && (
                  <Box component="ul" sx={{ mt: 1, pl: 2 }}>
                    {exp.achievements.slice(0, 2).map((achievement, i) => (
                      <Box component="li" key={i}>
                        <Typography variant="body2">{achievement}</Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            ))}
            {cvData.experiences.length > 2 && (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                ... and {cvData.experiences.length - 2} more experience{cvData.experiences.length - 2 > 1 ? 's' : ''}
              </Typography>
            )}
          </Box>
        )}

        {/* Education */}
        {cvData.education.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" color="primary" gutterBottom>
              Education
            </Typography>
            {cvData.education.slice(0, 2).map((edu, index) => (
              <Box key={index} sx={{ mb: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {edu.degree} {edu.fieldOfStudy && `in ${edu.fieldOfStudy}`}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {edu.institution} • {edu.startDate} - {edu.isCurrentlyStudying ? 'Present' : edu.endDate}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        {/* Skills */}
        {cvData.skills.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" color="primary" gutterBottom>
              Key Skills
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {cvData.skills.slice(0, 12).map((skill, index) => (
                <Chip
                  key={index}
                  label={skill.name}
                  size="small"
                  variant="outlined"
                  color={skill.level >= 4 ? 'primary' : 'default'}
                />
              ))}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const completionScore = calculateCompletionScore();
  const readinessStatus = getReadinessStatus();
  const validationIssues = getValidationIssues();
  const errors = validationIssues.filter(issue => issue.type === 'error');
  const warnings = validationIssues.filter(issue => issue.type === 'warning');
  const tips = validationIssues.filter(issue => issue.type === 'info');

  return (
    <Box>
      {/* Header */}
      <Card sx={{ mb: 3, bgcolor: readinessStatus.color + '.light' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Assessment sx={{ mr: 1, color: readinessStatus.color + '.main' }} />
              <Typography variant="h6" fontWeight="bold">
                CV Review & Export
              </Typography>
            </Box>
            <Chip
              label={`${completionScore}% Complete`}
              color={readinessStatus.color as any}
              icon={completionScore >= 75 ? <CheckCircle /> : <Warning />}
            />
          </Box>

          <Typography variant="body1" color="text.secondary" paragraph>
            {readinessStatus.message}
          </Typography>

          <LinearProgress
            variant="determinate"
            value={completionScore}
            color={readinessStatus.color as any}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Left Column - Issues and Analysis */}
        <Grid item xs={12} lg={5}>
          {/* Validation Issues */}
          {(errors.length > 0 || warnings.length > 0) && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Issues to Address
                </Typography>

                {errors.length > 0 && (
                  <Accordion defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <ErrorIcon color="error" sx={{ mr: 1 }} />
                        <Typography variant="subtitle1" color="error">
                          Critical Issues ({errors.length})
                        </Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List dense>
                        {errors.map((issue, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              <ErrorIcon color="error" />
                            </ListItemIcon>
                            <ListItemText
                              primary={issue.message}
                              secondary={issue.section}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                )}

                {warnings.length > 0 && (
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Warning color="warning" sx={{ mr: 1 }} />
                        <Typography variant="subtitle1" color="warning.main">
                          Recommendations ({warnings.length})
                        </Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List dense>
                        {warnings.map((issue, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              <Warning color="warning" />
                            </ListItemIcon>
                            <ListItemText
                              primary={issue.message}
                              secondary={issue.section}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                )}
              </CardContent>
            </Card>
          )}

          {/* AI Analysis */}
          {analysis && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AutoFixHigh sx={{ mr: 1, color: 'secondary.main' }} />
                  <Typography variant="h6" fontWeight="bold">
                    AI Analysis
                  </Typography>
                  <Chip
                    label={`${analysis.score}/100`}
                    color={analysis.score >= 80 ? 'success' : analysis.score >= 60 ? 'warning' : 'error'}
                    sx={{ ml: 2 }}
                  />
                </Box>

                <Typography variant="body2" paragraph>
                  Your CV has been analyzed for impact, relevance, and completeness.
                </Typography>

                {analysis.suggestions && analysis.suggestions.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Key Suggestions:
                    </Typography>
                    <List dense>
                      {analysis.suggestions.slice(0, 3).map((suggestion, index) => (
                        <ListItem key={index} sx={{ pl: 0 }}>
                          <ListItemIcon>
                            <Lightbulb color="info" />
                          </ListItemIcon>
                          <ListItemText primary={suggestion} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tips */}
          {tips.length > 0 && (
            <Card sx={{ mb: 3, bgcolor: 'info.light' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Lightbulb sx={{ mr: 1, color: 'info.main' }} />
                  <Typography variant="h6" fontWeight="bold" color="info.main">
                    Pro Tips
                  </Typography>
                </Box>
                <List dense>
                  {tips.map((tip, index) => (
                    <ListItem key={index} sx={{ pl: 0 }}>
                      <ListItemIcon>
                        <TrendingUp color="info" />
                      </ListItemIcon>
                      <ListItemText
                        primary={tip.message}
                        secondary={tip.section}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Export Your CV
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Your CV is ready! Choose your preferred format for download.
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    startIcon={<Download />}
                    onClick={() => handleExport('pdf')}
                    disabled={errors.length > 0}
                  >
                    Download PDF
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="large"
                    startIcon={<Download />}
                    onClick={() => handleExport('word')}
                    disabled={errors.length > 0}
                  >
                    Download Word
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Preview full CV">
                      <IconButton>
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Share CV">
                      <IconButton onClick={() => setShareDialogOpen(true)}>
                        <Share />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Print CV">
                      <IconButton>
                        <Print />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Email CV">
                      <IconButton>
                        <Email />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Grid>
              </Grid>

              {errors.length > 0 && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  Please resolve all critical issues before exporting your CV.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - CV Preview */}
        <Grid item xs={12} lg={7}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                  CV Preview
                </Typography>
                {selectedTemplate && (
                  <Chip
                    label={selectedTemplate.name}
                    variant="outlined"
                    size="small"
                  />
                )}
              </Box>
              {renderCVPreview()}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Export Progress Dialog */}
      <Dialog open={exporting}>
        <DialogContent sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Generating your CV...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This may take a few moments
          </Typography>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Share Your CV</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            Share your CV with potential employers or save it to your preferred platform.
          </Typography>
          {/* Share options would go here */}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EnhancedPreviewStep;
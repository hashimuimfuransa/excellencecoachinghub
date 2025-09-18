import React, { useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Alert,
  useTheme,
  useMediaQuery,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Summarize,
  CheckCircle,
  Warning,
  Error,
  Download,
  Preview,
  Share,
  Edit,
  ExpandMore,
  Person,
  School,
  Work,
  Code,
  FolderOpen,
  WorkspacePremium,
  ContactPage,
  VolunteerActivism,
} from '@mui/icons-material';
import { CVData } from '../../services/cvBuilderService';

interface EnhancedSummaryStepProps {
  data: CVData;
  onEdit: (step: number) => void;
  onGenerateCV: () => void;
  onPreview: () => void;
  onShare?: () => void;
}

const EnhancedSummaryStep: React.FC<EnhancedSummaryStepProps> = ({
  data,
  onEdit,
  onGenerateCV,
  onPreview,
  onShare,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [expandedSection, setExpandedSection] = useState<string>('');

  const sections = [
    {
      key: 'personalInfo',
      title: 'Personal Information',
      icon: Person,
      data: data.personalInfo,
      stepIndex: 0,
      getCompletion: () => {
        const info = data.personalInfo;
        let score = 0;
        if (info.firstName) score += 15;
        if (info.lastName) score += 15;
        if (info.email) score += 15;
        if (info.phone) score += 15;
        if (info.location) score += 10;
        if (info.professionalSummary) score += 20;
        if (info.linkedinUrl) score += 5;
        if (info.portfolioUrl) score += 5;
        return score;
      },
      getIssues: () => {
        const issues = [];
        const info = data.personalInfo;
        if (!info.firstName || !info.lastName) issues.push('Name is required');
        if (!info.email) issues.push('Email is required');
        if (!info.phone) issues.push('Phone number is recommended');
        if (!info.professionalSummary) issues.push('Professional summary is highly recommended');
        if (!info.location) issues.push('Location helps with job matching');
        return issues;
      },
    },
    {
      key: 'education',
      title: 'Education',
      icon: School,
      data: data.education,
      stepIndex: 1,
      getCompletion: () => {
        if (!data.education.length) return 0;
        const avgCompletion = data.education.reduce((sum, edu) => {
          let score = 0;
          if (edu.degree) score += 30;
          if (edu.institution) score += 30;
          if (edu.startDate) score += 20;
          if (edu.endDate || edu.isOngoing) score += 20;
          return sum + score;
        }, 0) / data.education.length;
        return Math.min(avgCompletion, 100);
      },
      getIssues: () => {
        const issues = [];
        if (!data.education.length) issues.push('At least one education entry is recommended');
        data.education.forEach((edu, index) => {
          if (!edu.degree) issues.push(`Education ${index + 1}: Degree is required`);
          if (!edu.institution) issues.push(`Education ${index + 1}: Institution is required`);
        });
        return issues;
      },
    },
    {
      key: 'experience',
      title: 'Work Experience',
      icon: Work,
      data: data.experience,
      stepIndex: 2,
      getCompletion: () => {
        if (!data.experience.length) return 0;
        const avgCompletion = data.experience.reduce((sum, exp) => {
          let score = 0;
          if (exp.jobTitle) score += 25;
          if (exp.company) score += 25;
          if (exp.startDate) score += 20;
          if (exp.endDate || exp.isOngoing) score += 15;
          if (exp.description) score += 15;
          return sum + score;
        }, 0) / data.experience.length;
        return Math.min(avgCompletion, 100);
      },
      getIssues: () => {
        const issues = [];
        if (!data.experience.length) issues.push('Work experience is highly recommended');
        data.experience.forEach((exp, index) => {
          if (!exp.jobTitle) issues.push(`Experience ${index + 1}: Job title is required`);
          if (!exp.company) issues.push(`Experience ${index + 1}: Company is required`);
          if (!exp.description) issues.push(`Experience ${index + 1}: Description is recommended`);
        });
        return issues;
      },
    },
    {
      key: 'skills',
      title: 'Skills',
      icon: Code,
      data: data.skills,
      stepIndex: 3,
      getCompletion: () => {
        const skills = data.skills;
        let score = 0;
        if (skills.technical.length > 0) score += 40;
        if (skills.soft.length > 0) score += 30;
        if (skills.languages.length > 0) score += 30;
        return Math.min(score, 100);
      },
      getIssues: () => {
        const issues = [];
        if (data.skills.technical.length === 0) issues.push('Technical skills are highly recommended');
        if (data.skills.soft.length === 0) issues.push('Soft skills help showcase your personality');
        if (data.skills.languages.length === 0) issues.push('Language skills are valuable for many roles');
        return issues;
      },
    },
    {
      key: 'projects',
      title: 'Projects',
      icon: FolderOpen,
      data: data.projects,
      stepIndex: 4,
      getCompletion: () => {
        if (!data.projects.length) return 0;
        const avgCompletion = data.projects.reduce((sum, proj) => {
          let score = 0;
          if (proj.title) score += 30;
          if (proj.description) score += 30;
          if (proj.technologies.length > 0) score += 20;
          if (proj.startDate) score += 20;
          return sum + score;
        }, 0) / data.projects.length;
        return Math.min(avgCompletion, 100);
      },
      getIssues: () => {
        const issues = [];
        if (data.projects.length < 2) issues.push('2-3 projects help showcase your abilities');
        data.projects.forEach((proj, index) => {
          if (!proj.title) issues.push(`Project ${index + 1}: Title is required`);
          if (!proj.description) issues.push(`Project ${index + 1}: Description is recommended`);
          if (proj.technologies.length === 0) issues.push(`Project ${index + 1}: Technologies used should be listed`);
        });
        return issues;
      },
    },
    {
      key: 'certifications',
      title: 'Certifications',
      icon: WorkspacePremium,
      data: data.certifications,
      stepIndex: 5,
      getCompletion: () => {
        if (!data.certifications.length) return 0;
        return 100; // If they have any certifications, consider it complete
      },
      getIssues: () => {
        const issues = [];
        if (data.certifications.length === 0) issues.push('Professional certifications can strengthen your profile');
        return issues;
      },
    },
    {
      key: 'references',
      title: 'References',
      icon: ContactPage,
      data: data.references,
      stepIndex: 6,
      getCompletion: () => {
        if (!data.references.length) return 0;
        const avgCompletion = data.references.reduce((sum, ref) => {
          let score = 0;
          if (ref.name) score += 40;
          if (ref.jobTitle) score += 30;
          if (ref.company) score += 30;
          return sum + score;
        }, 0) / data.references.length;
        return Math.min(avgCompletion, 100);
      },
      getIssues: () => {
        const issues = [];
        if (data.references.length < 2) issues.push('2-3 references are typically expected');
        return issues;
      },
    },
    {
      key: 'volunteer',
      title: 'Volunteer Experience',
      icon: VolunteerActivism,
      data: data.volunteerExperience,
      stepIndex: 7,
      getCompletion: () => {
        if (!data.volunteerExperience.length) return 0;
        return 100; // If they have any volunteer experience, consider it complete
      },
      getIssues: () => {
        const issues = [];
        if (data.volunteerExperience.length === 0) issues.push('Volunteer work shows initiative and values');
        return issues;
      },
    },
  ];

  const overallCompletion = sections.reduce((sum, section) => sum + section.getCompletion(), 0) / sections.length;
  const allIssues = sections.flatMap(section => section.getIssues());
  const criticalIssues = allIssues.filter(issue => 
    issue.includes('required') || 
    issue.includes('Work experience') || 
    issue.includes('Name is required') ||
    issue.includes('Email is required')
  );

  const getCompletionColor = (completion: number) => {
    if (completion >= 80) return 'success';
    if (completion >= 60) return 'warning';
    return 'error';
  };

  const getCompletionStatus = (completion: number) => {
    if (completion >= 80) return { icon: CheckCircle, color: 'success.main', text: 'Complete' };
    if (completion >= 60) return { icon: Warning, color: 'warning.main', text: 'Needs Attention' };
    return { icon: Error, color: 'error.main', text: 'Incomplete' };
  };

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Header Card */}
        <Grid item xs={12}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            mb: 3 
          }}>
            <CardContent sx={{ py: isMobile ? 2 : 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Summarize sx={{ mr: 1, fontSize: 28 }} />
                <Typography variant="h5" fontWeight="bold">
                  CV Summary & Review
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ opacity: 0.9, mb: 3 }}>
                Review your CV completeness, fix any issues, and generate your professional CV.
              </Typography>
              
              {/* Overall Progress */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" fontWeight="bold">
                    Overall Completion
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {Math.round(overallCompletion)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={overallCompletion}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: 'rgba(255, 255, 255, 0.3)',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 4,
                      bgcolor: overallCompletion >= 80 ? '#4caf50' : overallCompletion >= 60 ? '#ff9800' : '#f44336',
                    },
                  }}
                />
              </Box>

              {/* Quick Stats */}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip 
                  label={`${sections.filter(s => s.getCompletion() >= 80).length}/${sections.length} Sections Complete`}
                  sx={{ 
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    fontWeight: 'bold',
                  }}
                />
                {criticalIssues.length > 0 && (
                  <Chip 
                    label={`${criticalIssues.length} Critical Issues`}
                    sx={{ 
                      bgcolor: 'rgba(244, 67, 54, 0.3)',
                      color: 'white',
                      fontWeight: 'bold',
                    }}
                  />
                )}
                {overallCompletion >= 80 && (
                  <Chip 
                    label="✓ Ready to Generate"
                    sx={{ 
                      bgcolor: 'rgba(76, 175, 80, 0.3)',
                      color: 'white',
                      fontWeight: 'bold',
                    }}
                  />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Critical Issues Alert */}
        {criticalIssues.length > 0 && (
          <Grid item xs={12}>
            <Alert severity="error">
              <Typography variant="subtitle2" gutterBottom>
                Critical Issues Found
              </Typography>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {criticalIssues.map((issue, index) => (
                  <li key={index}>{issue}</li>
                ))}
              </ul>
            </Alert>
          </Grid>
        )}

        {/* Section Review */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Section Review
              </Typography>
              
              {sections.map((section) => {
                const completion = section.getCompletion();
                const issues = section.getIssues();
                const status = getCompletionStatus(completion);
                const IconComponent = section.icon;
                const StatusIconComponent = status.icon;

                return (
                  <Accordion 
                    key={section.key}
                    expanded={expandedSection === section.key}
                    onChange={() => setExpandedSection(expandedSection === section.key ? '' : section.key)}
                    sx={{ mb: 1 }}
                  >
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', pr: 2 }}>
                        <IconComponent sx={{ mr: 2, color: 'primary.main' }} />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {section.title}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            <LinearProgress
                              variant="determinate"
                              value={completion}
                              color={getCompletionColor(completion)}
                              sx={{ flex: 1, mr: 2, height: 6, borderRadius: 3 }}
                            />
                            <Typography variant="caption" sx={{ minWidth: 40 }}>
                              {Math.round(completion)}%
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <StatusIconComponent sx={{ color: status.color, fontSize: 20 }} />
                          <Typography variant="caption" color={status.color}>
                            {status.text}
                          </Typography>
                          <Button
                            size="small"
                            startIcon={<Edit />}
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(section.stepIndex);
                            }}
                          >
                            Edit
                          </Button>
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      {issues.length > 0 ? (
                        <Alert severity={completion < 60 ? 'error' : 'warning'} sx={{ mb: 2 }}>
                          <Typography variant="body2" gutterBottom>
                            Issues to Address:
                          </Typography>
                          <ul style={{ margin: 0, paddingLeft: '20px' }}>
                            {issues.map((issue, index) => (
                              <li key={index}>{issue}</li>
                            ))}
                          </ul>
                        </Alert>
                      ) : (
                        <Alert severity="success" sx={{ mb: 2 }}>
                          This section looks complete! 🎉
                        </Alert>
                      )}
                      
                      {/* Section Summary */}
                      <Typography variant="body2" color="text.secondary">
                        {section.key === 'personalInfo' && `Name: ${data.personalInfo.firstName} ${data.personalInfo.lastName}`}
                        {section.key === 'education' && `${data.education.length} education entries`}
                        {section.key === 'experience' && `${data.experience.length} work experiences`}
                        {section.key === 'skills' && `${data.skills.technical.length + data.skills.soft.length + data.skills.languages.length} skills total`}
                        {section.key === 'projects' && `${data.projects.length} projects`}
                        {section.key === 'certifications' && `${data.certifications.length} certifications`}
                        {section.key === 'references' && `${data.references.length} references`}
                        {section.key === 'volunteer' && `${data.volunteerExperience.length} volunteer experiences`}
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </CardContent>
          </Card>
        </Grid>

        {/* Action Buttons */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Generate Your CV
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Your CV is {Math.round(overallCompletion)}% complete. 
                {overallCompletion >= 80 
                  ? ' You can generate your professional CV now!' 
                  : ' Consider addressing the issues above for a better CV.'}
              </Typography>
              
              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'center',
              }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<Download />}
                  onClick={onGenerateCV}
                  fullWidth={isMobile}
                  sx={{ minWidth: isMobile ? 'auto' : 200 }}
                >
                  Generate CV
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<Preview />}
                  onClick={onPreview}
                  fullWidth={isMobile}
                  sx={{ minWidth: isMobile ? 'auto' : 160 }}
                >
                  Preview
                </Button>
                {onShare && (
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<Share />}
                    onClick={onShare}
                    fullWidth={isMobile}
                    sx={{ minWidth: isMobile ? 'auto' : 120 }}
                  >
                    Share
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Tips */}
        <Grid item xs={12}>
          <Alert severity="info">
            <Typography variant="body2">
              <strong>CV Generation Tips:</strong>
            </Typography>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>Aim for 80%+ completion in critical sections (Personal Info, Experience, Education, Skills)</li>
              <li>Use the preview feature to check formatting and layout</li>
              <li>Consider multiple CV versions for different job applications</li>
              <li>Keep your CV updated as you gain new experiences</li>
              <li>Download in PDF format for best compatibility with ATS systems</li>
            </ul>
          </Alert>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EnhancedSummaryStep;
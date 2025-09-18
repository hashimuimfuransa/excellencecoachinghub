import React, { useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Stack,
  Divider,
  Chip,
  LinearProgress,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import {
  Download,
  Share,
  Edit,
  PictureAsPdf,
  Description,
  Email,
  Phone,
  LocationOn,
  LinkedIn,
  Language as WebIcon,
  Work,
  School,
  Star,
  CalendarToday,
  Business,
  Grade,
  Link as LinkIcon,
  EmojiEvents,
  MoreVert,
  Visibility,
  Print,
} from '@mui/icons-material';
import { CVData, CVTemplate } from '../../services/cvBuilderService';
import dayjs from 'dayjs';

interface CVPreviewStepProps {
  cvData: CVData;
  template: CVTemplate | null;
  onExport: (format: 'pdf' | 'word') => () => void;
}

const CVPreviewStep: React.FC<CVPreviewStepProps> = ({
  cvData,
  template,
  onExport,
}) => {
  const [shareDialog, setShareDialog] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const getLevelProgress = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner': return 25;
      case 'intermediate': return 50;
      case 'advanced': return 75;
      case 'expert': return 100;
      default: return 50;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner': return 'error';
      case 'intermediate': return 'warning';
      case 'advanced': return 'info';
      case 'expert': return 'success';
      default: return 'primary';
    }
  };

  const formatDateRange = (startDate: string, endDate: string, isCurrentJob?: boolean) => {
    const start = dayjs(startDate).format('MMM YYYY');
    const end = isCurrentJob ? 'Present' : dayjs(endDate).format('MMM YYYY');
    return `${start} - ${end}`;
  };

  const handleExportWithLoading = (format: 'pdf' | 'word') => async () => {
    setIsExporting(true);
    try {
      await onExport(format)();
    } finally {
      setIsExporting(false);
      setMenuAnchor(null);
    }
  };

  const handleShare = () => {
    navigator.share({
      title: `${cvData.personalInfo.firstName} ${cvData.personalInfo.lastName} - CV`,
      text: 'Check out my professional CV',
      url: window.location.href,
    }).catch(() => {
      // Fallback to copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    });
    setShareDialog(false);
  };

  const getTemplateStyles = () => {
    if (!template) return {};
    
    return {
      primary: template.color === 'blue' ? '#1976d2' : 
               template.color === 'gray' ? '#757575' :
               template.color === 'purple' ? '#9c27b0' :
               template.color === 'green' ? '#388e3c' :
               template.color === 'orange' ? '#f57c00' :
               template.color === 'navy' ? '#1a237e' : '#1976d2',
      secondary: template.color === 'blue' ? '#42a5f5' : 
                template.color === 'gray' ? '#bdbdbd' :
                template.color === 'purple' ? '#ce93d8' :
                template.color === 'green' ? '#81c784' :
                template.color === 'orange' ? '#ffb74d' :
                template.color === 'navy' ? '#5c6bc0' : '#42a5f5',
    };
  };

  const styles = getTemplateStyles();

  return (
    <Box>
      {/* Header with actions */}
      <Box display="flex" alignItems="center" justifyContent="between" mb={3}>
        <Box>
          <Typography variant="h6" gutterBottom>
            CV Preview - {template?.name || 'Professional Template'}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Review your CV before downloading
          </Typography>
        </Box>
        
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={() => window.print()}
          >
            Print
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<Share />}
            onClick={() => setShareDialog(true)}
          >
            Share
          </Button>
          
          <Button
            variant="contained"
            startIcon={isExporting ? <CircularProgress size={16} /> : <Download />}
            onClick={(e) => setMenuAnchor(e.currentTarget)}
            disabled={isExporting}
          >
            {isExporting ? 'Exporting...' : 'Download'}
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={3}>
        {/* CV Preview */}
        <Grid item xs={12} md={8}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 4, 
              minHeight: 800,
              bgcolor: 'white',
              '& *': { fontFamily: '"Times New Roman", serif !important' }
            }}
            id="cv-preview"
          >
            {/* Header Section */}
            <Box mb={4} sx={{ borderBottom: 3, borderColor: styles.primary, pb: 2 }}>
              <Typography variant="h3" sx={{ color: styles.primary, mb: 1, fontWeight: 'bold' }}>
                {cvData.personalInfo.firstName} {cvData.personalInfo.lastName}
              </Typography>
              
              <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
                {cvData.personalInfo.email && (
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Email sx={{ fontSize: 16, color: styles.primary }} />
                    <Typography variant="body2">{cvData.personalInfo.email}</Typography>
                  </Box>
                )}
                
                {cvData.personalInfo.phone && (
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Phone sx={{ fontSize: 16, color: styles.primary }} />
                    <Typography variant="body2">{cvData.personalInfo.phone}</Typography>
                  </Box>
                )}
                
                {cvData.personalInfo.location && (
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <LocationOn sx={{ fontSize: 16, color: styles.primary }} />
                    <Typography variant="body2">{cvData.personalInfo.location}</Typography>
                  </Box>
                )}
                
                {cvData.personalInfo.linkedIn && (
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <LinkedIn sx={{ fontSize: 16, color: styles.primary }} />
                    <Typography variant="body2">{cvData.personalInfo.linkedIn}</Typography>
                  </Box>
                )}
                
                {cvData.personalInfo.website && (
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <WebIcon sx={{ fontSize: 16, color: styles.primary }} />
                    <Typography variant="body2">{cvData.personalInfo.website}</Typography>
                  </Box>
                )}
              </Stack>
            </Box>

            {/* Professional Summary */}
            {cvData.personalInfo.professionalSummary && (
              <Box mb={4}>
                <Typography variant="h5" sx={{ color: styles.primary, mb: 2, fontWeight: 'bold' }}>
                  PROFESSIONAL SUMMARY
                </Typography>
                <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                  {cvData.personalInfo.professionalSummary}
                </Typography>
              </Box>
            )}

            {/* Experience Section */}
            {(() => {
              const experiences = cvData.experiences || cvData.experience || [];
              return experiences.length > 0 && (
                <Box mb={4}>
                  <Typography variant="h5" sx={{ color: styles.primary, mb: 2, fontWeight: 'bold' }}>
                    PROFESSIONAL EXPERIENCE
                  </Typography>
                  
                  {experiences.map((exp, index) => (
                  <Box key={exp.id} mb={3}>
                    <Box display="flex" justifyContent="between" alignItems="start" mb={1}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {exp.jobTitle}
                        </Typography>
                        <Typography variant="body1" sx={{ color: styles.primary, fontWeight: 'bold' }}>
                          {exp.company} {exp.location && `• ${exp.location}`}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontStyle: 'italic', minWidth: 120, textAlign: 'right' }}>
                        {formatDateRange(exp.startDate, exp.endDate || '', exp.isCurrentJob)}
                      </Typography>
                    </Box>
                    
                    {exp.responsibilities && exp.responsibilities.filter(r => r.trim()).length > 0 && (
                      <Box mb={2}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                          Key Responsibilities:
                        </Typography>
                        <Box component="ul" sx={{ pl: 2, m: 0 }}>
                          {exp.responsibilities.filter(r => r.trim()).map((resp, idx) => (
                            <Typography component="li" variant="body2" key={idx} sx={{ mb: 0.5 }}>
                              {resp}
                            </Typography>
                          ))}
                        </Box>
                      </Box>
                    )}
                    
                    {exp.achievements && exp.achievements.filter(a => a.trim()).length > 0 && (
                      <Box mb={2}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                          Key Achievements:
                        </Typography>
                        <Box component="ul" sx={{ pl: 2, m: 0 }}>
                          {exp.achievements.filter(a => a.trim()).map((achievement, idx) => (
                            <Typography component="li" variant="body2" key={idx} sx={{ mb: 0.5 }}>
                              {achievement}
                            </Typography>
                          ))}
                        </Box>
                      </Box>
                    )}
                    
                    {index < experiences.length - 1 && <Divider sx={{ mt: 2 }} />}
                  </Box>
                ))}
              </Box>
              );
            })()}

            {/* Education Section */}
            {cvData.education && cvData.education.length > 0 && (
              <Box mb={4}>
                <Typography variant="h5" sx={{ color: styles.primary, mb: 2, fontWeight: 'bold' }}>
                  EDUCATION
                </Typography>
                
                {cvData.education.map((edu, index) => (
                  <Box key={edu.id} mb={2}>
                    <Box display="flex" justifyContent="between" alignItems="start" mb={1}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {edu.degree}
                        </Typography>
                        <Typography variant="body1" sx={{ color: styles.primary }}>
                          {edu.institution} {edu.location && `• ${edu.location}`}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontStyle: 'italic', minWidth: 120, textAlign: 'right' }}>
                        {dayjs(edu.graduationDate).format('MMM YYYY')}
                        {edu.gpa && ` • GPA: ${edu.gpa}`}
                      </Typography>
                    </Box>
                    
                    {edu.relevantCourses && edu.relevantCourses.filter(c => c.trim()).length > 0 && (
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', display: 'inline' }}>
                          Relevant Courses: 
                        </Typography>
                        <Typography variant="body2" sx={{ display: 'inline', ml: 1 }}>
                          {edu.relevantCourses.filter(c => c.trim()).join(', ')}
                        </Typography>
                      </Box>
                    )}
                    
                    {index < cvData.education.length - 1 && <Divider sx={{ mt: 2 }} />}
                  </Box>
                ))}
              </Box>
            )}

            {/* Skills Section */}
            {(() => {
              const hasSkills = cvData.skills && (
                (Array.isArray(cvData.skills) && cvData.skills.length > 0) ||
                (cvData.skills.technical?.length > 0 || cvData.skills.soft?.length > 0 || cvData.skills.languages?.length > 0)
              );
              
              if (!hasSkills) return null;
              
              return (
                <Box mb={4}>
                  <Typography variant="h5" sx={{ color: styles.primary, mb: 2, fontWeight: 'bold' }}>
                    CORE COMPETENCIES
                  </Typography>
                  
                  <Grid container spacing={2}>
                    {Array.isArray(cvData.skills) ? (
                      // Old array structure
                      ['Technical', 'Soft', 'Language', 'Other'].map(category => {
                        const categorySkills = cvData.skills.filter(skill => skill.category === category);
                        if (categorySkills.length === 0) return null;
                        
                        return (
                          <Grid item xs={12} sm={6} key={category}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: styles.primary }}>
                              {category} Skills:
                            </Typography>
                            <Typography variant="body2" sx={{ lineHeight: 1.4 }}>
                              {categorySkills.map(skill => skill.name).join(' • ')}
                            </Typography>
                          </Grid>
                        );
                      })
                    ) : (
                      // New nested object structure
                      <>
                        {cvData.skills.technical?.length > 0 && (
                          <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: styles.primary }}>
                              Technical Skills:
                            </Typography>
                            <Typography variant="body2" sx={{ lineHeight: 1.4 }}>
                              {cvData.skills.technical.map(skill => skill.name).join(' • ')}
                            </Typography>
                          </Grid>
                        )}
                        
                        {cvData.skills.soft?.length > 0 && (
                          <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: styles.primary }}>
                              Soft Skills:
                            </Typography>
                            <Typography variant="body2" sx={{ lineHeight: 1.4 }}>
                              {cvData.skills.soft.map(skill => skill.name).join(' • ')}
                            </Typography>
                          </Grid>
                        )}
                        
                        {cvData.skills.languages?.length > 0 && (
                          <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: styles.primary }}>
                              Languages:
                            </Typography>
                            <Typography variant="body2" sx={{ lineHeight: 1.4 }}>
                              {cvData.skills.languages.map(lang => `${lang.name || lang.language} (${lang.proficiency || lang.level || 'Proficient'})`).join(' • ')}
                            </Typography>
                          </Grid>
                        )}
                      </>
                    )}
                  </Grid>
                </Box>
              );
            })()}

            {/* Languages Section - Only if not already included in skills */}
            {cvData.languages && cvData.languages.length > 0 && (!cvData.skills?.languages || cvData.skills.languages.length === 0) && (
              <Box mb={4}>
                <Typography variant="h5" sx={{ color: styles.primary, mb: 2, fontWeight: 'bold' }}>
                  LANGUAGES
                </Typography>
                
                <Grid container spacing={2}>
                  {cvData.languages.map((lang, index) => (
                    <Grid item xs={12} sm={6} key={lang.id}>
                      <Box display="flex" justifyContent="between" alignItems="center" mb={1}>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                          {lang.language}
                        </Typography>
                        <Typography variant="body2" sx={{ color: styles.primary, fontWeight: 'bold' }}>
                          {lang.proficiency}
                        </Typography>
                      </Box>
                      {lang.certification && (
                        <Typography variant="body2" color="textSecondary">
                          Certification: {lang.certification}
                        </Typography>
                      )}
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {/* Projects Section */}
            {cvData.projects && cvData.projects.length > 0 && (
              <Box mb={4}>
                <Typography variant="h5" sx={{ color: styles.primary, mb: 2, fontWeight: 'bold' }}>
                  PROJECTS
                </Typography>
                
                {cvData.projects.map((project, index) => (
                  <Box key={project.id} mb={3}>
                    <Box display="flex" justifyContent="between" alignItems="start" mb={1}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {project.title}
                        </Typography>
                        {project.organization && (
                          <Typography variant="body1" sx={{ color: styles.primary }}>
                            {project.organization}
                          </Typography>
                        )}
                      </Box>
                      <Typography variant="body2" sx={{ fontStyle: 'italic', minWidth: 120, textAlign: 'right' }}>
                        {formatDateRange(project.startDate, project.endDate || '', project.isOngoing)}
                      </Typography>
                    </Box>
                    
                    {project.description && (
                      <Typography variant="body2" sx={{ mb: 1, lineHeight: 1.6 }}>
                        {project.description}
                      </Typography>
                    )}
                    
                    {project.technologies && project.technologies.filter(t => t.trim()).length > 0 && (
                      <Box mb={1}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', display: 'inline' }}>
                          Technologies: 
                        </Typography>
                        <Typography variant="body2" sx={{ display: 'inline', ml: 1 }}>
                          {project.technologies.filter(t => t.trim()).join(', ')}
                        </Typography>
                      </Box>
                    )}
                    
                    {project.projectUrl && (
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <LinkIcon sx={{ fontSize: 16, color: styles.primary }} />
                        <Typography variant="body2" sx={{ color: styles.primary }}>
                          {project.projectUrl}
                        </Typography>
                      </Box>
                    )}
                    
                    {index < cvData.projects.length - 1 && <Divider sx={{ mt: 2 }} />}
                  </Box>
                ))}
              </Box>
            )}

            {/* Certifications Section */}
            {cvData.certifications && cvData.certifications.length > 0 && (
              <Box mb={4}>
                <Typography variant="h5" sx={{ color: styles.primary, mb: 2, fontWeight: 'bold' }}>
                  CERTIFICATIONS
                </Typography>
                
                {cvData.certifications.map((cert, index) => (
                  <Box key={cert.id} mb={2}>
                    <Box display="flex" justifyContent="between" alignItems="start" mb={1}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {cert.name}
                        </Typography>
                        <Typography variant="body1" sx={{ color: styles.primary }}>
                          {cert.issuingOrganization}
                        </Typography>
                      </Box>
                      <Box textAlign="right">
                        <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                          Issued: {dayjs(cert.issueDate).format('MMM YYYY')}
                        </Typography>
                        {cert.expiryDate && (
                          <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                            Expires: {dayjs(cert.expiryDate).format('MMM YYYY')}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    
                    {cert.credentialId && (
                      <Typography variant="body2" color="textSecondary">
                        Credential ID: {cert.credentialId}
                      </Typography>
                    )}
                    
                    {cert.credentialUrl && (
                      <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                        <LinkIcon sx={{ fontSize: 16, color: styles.primary }} />
                        <Typography variant="body2" sx={{ color: styles.primary }}>
                          {cert.credentialUrl}
                        </Typography>
                      </Box>
                    )}
                    
                    {index < cvData.certifications.length - 1 && <Divider sx={{ mt: 2 }} />}
                  </Box>
                ))}
              </Box>
            )}

            {/* Awards Section */}
            {cvData.awards && cvData.awards.length > 0 && (
              <Box mb={4}>
                <Typography variant="h5" sx={{ color: styles.primary, mb: 2, fontWeight: 'bold' }}>
                  AWARDS & ACHIEVEMENTS
                </Typography>
                
                {cvData.awards.map((award, index) => (
                  <Box key={award.id} mb={2}>
                    <Box display="flex" justifyContent="between" alignItems="start" mb={1}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {award.name}
                        </Typography>
                        <Typography variant="body1" sx={{ color: styles.primary }}>
                          {award.issuingOrganization}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontStyle: 'italic', minWidth: 120, textAlign: 'right' }}>
                        {dayjs(award.dateReceived).format('MMM YYYY')}
                      </Typography>
                    </Box>
                    
                    {award.description && (
                      <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                        {award.description}
                      </Typography>
                    )}
                    
                    {index < cvData.awards.length - 1 && <Divider sx={{ mt: 2 }} />}
                  </Box>
                ))}
              </Box>
            )}

            {/* References Section */}
            {cvData.references && cvData.references.length > 0 && (
              <Box mb={4}>
                <Typography variant="h5" sx={{ color: styles.primary, mb: 2, fontWeight: 'bold' }}>
                  REFERENCES
                </Typography>
                
                <Grid container spacing={2}>
                  {cvData.references.map((ref, index) => (
                    <Grid item xs={12} sm={6} key={ref.id}>
                      <Box mb={2}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {ref.name}
                        </Typography>
                        <Typography variant="body1" sx={{ color: styles.primary }}>
                          {ref.jobTitle}
                        </Typography>
                        <Typography variant="body1">
                          {ref.company}
                        </Typography>
                        
                        <Stack spacing={0.5} mt={1}>
                          {ref.email && (
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <Email sx={{ fontSize: 14, color: styles.primary }} />
                              <Typography variant="body2">{ref.email}</Typography>
                            </Box>
                          )}
                          
                          {ref.phone && (
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <Phone sx={{ fontSize: 14, color: styles.primary }} />
                              <Typography variant="body2">{ref.phone}</Typography>
                            </Box>
                          )}
                        </Stack>
                        
                        {ref.relationship && (
                          <Typography variant="body2" color="textSecondary" mt={1}>
                            Relationship: {ref.relationship}
                          </Typography>
                        )}
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Side Panel */}
        <Grid item xs={12} md={4}>
          <Stack spacing={2}>
            {/* CV Stats */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  CV Statistics
                </Typography>
                
                <Stack spacing={2}>
                  <Box>
                    <Box display="flex" justifyContent="between" alignItems="center" mb={0.5}>
                      <Typography variant="body2">Completeness</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>85%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={85} sx={{ height: 6, borderRadius: 3 }} />
                  </Box>
                  
                  <Divider />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                        {cvData.experiences.length}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Work Experience
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                        {cvData.education.length}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Education
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                        {cvData.skills.length}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Skills
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                        {cvData.languages?.length || 0}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Languages
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                        {cvData.projects?.length || 0}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Projects
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                        {cvData.certifications?.length || 0}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Certifications
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                        {cvData.awards?.length || 0}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Awards
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                        {cvData.references?.length || 0}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        References
                      </Typography>
                    </Grid>
                  </Grid>
                </Stack>
              </CardContent>
            </Card>

            {/* Export Options */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Export Options
                </Typography>
                
                <Stack spacing={1}>
                  <Button
                    variant="outlined"
                    startIcon={<PictureAsPdf />}
                    onClick={handleExportWithLoading('pdf')}
                    disabled={isExporting}
                    fullWidth
                  >
                    Download as PDF
                  </Button>
                  
                  <Button
                    variant="outlined"
                    startIcon={<Description />}
                    onClick={handleExportWithLoading('word')}
                    disabled={isExporting}
                    fullWidth
                  >
                    Download as Word
                  </Button>
                  
                  <Button
                    variant="outlined"
                    startIcon={<Print />}
                    onClick={() => window.print()}
                    fullWidth
                  >
                    Print CV
                  </Button>
                </Stack>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card sx={{ bgcolor: 'background.default' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  💡 Final Tips
                </Typography>
                
                <Stack spacing={1}>
                  <Typography variant="body2">
                    • Tailor your CV for each job application
                  </Typography>
                  <Typography variant="body2">
                    • Use industry-specific keywords
                  </Typography>
                  <Typography variant="body2">
                    • Keep it concise (1-2 pages maximum)
                  </Typography>
                  <Typography variant="body2">
                    • Proofread for spelling and grammar
                  </Typography>
                  <Typography variant="body2">
                    • Save in PDF format for applications
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      {/* Export Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={handleExportWithLoading('pdf')}>
          <PictureAsPdf sx={{ mr: 1 }} />
          Download as PDF
        </MenuItem>
        <MenuItem onClick={handleExportWithLoading('word')}>
          <Description sx={{ mr: 1 }} />
          Download as Word
        </MenuItem>
      </Menu>

      {/* Share Dialog */}
      <Dialog open={shareDialog} onClose={() => setShareDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Share Your CV</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Button
              variant="outlined"
              startIcon={<LinkIcon />}
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                setShareDialog(false);
              }}
              fullWidth
            >
              Copy Link
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<Email />}
              onClick={() => {
                window.location.href = `mailto:?subject=My Professional CV&body=Please find my CV at: ${window.location.href}`;
                setShareDialog(false);
              }}
              fullWidth
            >
              Share via Email
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CVPreviewStep;
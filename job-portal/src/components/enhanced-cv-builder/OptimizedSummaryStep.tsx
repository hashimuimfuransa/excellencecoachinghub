import React, { memo } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  Card,
  CardContent,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  Download,
  Preview,
  Edit,
  Person,
  Work,
  School,
  Build,
  Code,
  EmojiEvents,
  People,
  VolunteerActivism,
} from '@mui/icons-material';
import { CVData } from '../../services/cvBuilderService';

interface OptimizedSummaryStepProps {
  data: CVData;
  onEdit: (step: number) => void;
  onGenerateCV: (format?: 'pdf' | 'word', templateId?: string) => void;
  onPreview: () => void;
}

const OptimizedSummaryStep: React.FC<OptimizedSummaryStepProps> = memo(({
  data,
  onEdit,
  onGenerateCV,
  onPreview,
}) => {
  const getSectionCount = (section: any): number => {
    if (Array.isArray(section)) return section.length;
    if (section && typeof section === 'object') {
      if ('technical' in section) {
        return (section.technical?.length || 0) + (section.soft?.length || 0) + (section.languages?.length || 0);
      }
    }
    return 0;
  };

  const getSectionIcon = (sectionName: string) => {
    switch (sectionName) {
      case 'Personal Info': return <Person />;
      case 'Experience': return <Work />;
      case 'Education': return <School />;
      case 'Skills': return <Build />;
      case 'Projects': return <Code />;
      case 'Certifications': return <EmojiEvents />;
      case 'References': return <People />;
      case 'Volunteer': return <VolunteerActivism />;
      default: return null;
    }
  };

  const sections = [
    {
      name: 'Personal Info',
      step: 0,
      data: data.personalInfo,
      isComplete: !!(data.personalInfo?.firstName && data.personalInfo?.lastName && data.personalInfo?.email),
      summary: `${data.personalInfo?.firstName || ''} ${data.personalInfo?.lastName || ''}`.trim() || 'Not completed',
    },
    {
      name: 'Experience',
      step: 1,
      data: data.experience,
      count: getSectionCount(data.experience),
      isComplete: (data.experience?.length || 0) > 0,
      summary: `${data.experience?.length || 0} experience(s) added`,
    },
    {
      name: 'Education',
      step: 2,
      data: data.education,
      count: getSectionCount(data.education),
      isComplete: (data.education?.length || 0) > 0,
      summary: `${data.education?.length || 0} education(s) added`,
    },
    {
      name: 'Skills',
      step: 3,
      data: data.skills,
      count: getSectionCount(data.skills),
      isComplete: getSectionCount(data.skills) > 0,
      summary: `${getSectionCount(data.skills)} skills added`,
    },
    {
      name: 'Projects',
      step: 4,
      data: data.projects,
      count: getSectionCount(data.projects),
      isComplete: true, // Optional
      summary: `${data.projects?.length || 0} projects added`,
    },
    {
      name: 'Certifications',
      step: 5,
      data: data.certifications,
      count: getSectionCount(data.certifications),
      isComplete: true, // Optional
      summary: `${data.certifications?.length || 0} certifications added`,
    },
    {
      name: 'References',
      step: 6,
      data: data.references,
      count: getSectionCount(data.references),
      isComplete: true, // Optional
      summary: `${data.references?.length || 0} references added`,
    },
    {
      name: 'Volunteer',
      step: 7,
      data: data.volunteerExperience,
      count: getSectionCount(data.volunteerExperience),
      isComplete: true, // Optional
      summary: `${data.volunteerExperience?.length || 0} volunteer experiences added`,
    },
  ];

  const completedSections = sections.filter(section => section.isComplete).length;
  const totalSections = sections.filter(section => section.step <= 3).length; // Only required sections
  const completionPercentage = Math.round((completedSections / sections.length) * 100);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        CV Summary & Review
      </Typography>
      
      <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
        Review your CV information below. Click "Edit" on any section to make changes.
      </Typography>

      {/* Completion Status */}
      <Paper sx={{ p: 3, mb: 4, bgcolor: 'primary.50' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h6" gutterBottom>
              CV Completion Status
            </Typography>
            <Typography variant="body2">
              {completedSections}/{sections.length} sections completed ({completionPercentage}%)
            </Typography>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
              <Button
                variant="outlined"
                startIcon={<Preview />}
                onClick={onPreview}
                fullWidth
              >
                Preview CV
              </Button>
              <Button
                variant="contained"
                startIcon={<Download />}
                onClick={onGenerateCV}
                fullWidth
                disabled={completedSections < totalSections}
              >
                Generate CV
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Section Summaries */}
      <Grid container spacing={3}>
        {sections.map((section) => (
          <Grid item xs={12} key={section.name}>
            <Card 
              sx={{ 
                border: section.isComplete ? '2px solid' : '1px solid',
                borderColor: section.isComplete ? 'success.main' : 'grey.300',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getSectionIcon(section.name)}
                    <Typography variant="h6">
                      {section.name}
                    </Typography>
                    <Chip
                      size="small"
                      label={section.isComplete ? 'Complete' : 'Incomplete'}
                      color={section.isComplete ? 'success' : 'default'}
                      variant={section.isComplete ? 'filled' : 'outlined'}
                    />
                  </Box>
                  <Button
                    size="small"
                    startIcon={<Edit />}
                    onClick={() => onEdit(section.step)}
                  >
                    Edit
                  </Button>
                </Box>

                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  {section.summary}
                </Typography>

                {/* Section-specific previews */}
                {section.name === 'Personal Info' && data.personalInfo?.firstName && (
                  <Box>
                    <Typography variant="subtitle2">Preview:</Typography>
                    <Typography variant="body2">
                      {data.personalInfo.firstName} {data.personalInfo.lastName}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {data.personalInfo.email} • {data.personalInfo.phone}
                    </Typography>
                    {data.personalInfo.professionalSummary && (
                      <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                        "{data.personalInfo.professionalSummary.substring(0, 100)}
                        {data.personalInfo.professionalSummary.length > 100 ? '...' : ''}"
                      </Typography>
                    )}
                  </Box>
                )}

                {section.name === 'Experience' && data.experience && data.experience.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2">Latest Experience:</Typography>
                    <Typography variant="body2">
                      {data.experience[0].jobTitle} at {data.experience[0].company}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {data.experience[0].startDate} - {data.experience[0].isOngoing ? 'Present' : data.experience[0].endDate}
                    </Typography>
                  </Box>
                )}

                {section.name === 'Education' && data.education && data.education.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2">Latest Education:</Typography>
                    <Typography variant="body2">
                      {data.education[0].degree} from {data.education[0].institution}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {data.education[0].startDate} - {data.education[0].isOngoing ? 'Present' : data.education[0].endDate}
                    </Typography>
                  </Box>
                )}

                {section.name === 'Skills' && data.skills && (
                  <Box>
                    <Typography variant="subtitle2">Skills Overview:</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                      {data.skills.technical?.slice(0, 5).map((skill, index) => (
                        <Chip key={index} label={skill.name} size="small" />
                      ))}
                      {(data.skills.technical?.length || 0) > 5 && (
                        <Chip label={`+${(data.skills.technical?.length || 0) - 5} more`} size="small" variant="outlined" />
                      )}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Final Actions */}
      <Paper sx={{ p: 3, mt: 4, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          Ready to Generate Your CV?
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          Make sure all required sections are complete before generating your professional CV.
        </Typography>
        
        {completedSections < totalSections ? (
          <Box>
            <Typography variant="body2" color="error" sx={{ mb: 2 }}>
              Please complete the required sections: Personal Info, Experience, Education, and Skills
            </Typography>
            <Button variant="outlined" disabled>
              Complete Required Sections First
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="outlined"
              size="large"
              startIcon={<Preview />}
              onClick={onPreview}
            >
              Preview CV
            </Button>
            <Button
              variant="contained"
              size="large"
              startIcon={<Download />}
              onClick={onGenerateCV}
            >
              Generate & Download CV
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
});

OptimizedSummaryStep.displayName = 'OptimizedSummaryStep';

export default OptimizedSummaryStep;
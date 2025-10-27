import React, { memo, useCallback, useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  Grid,
  Typography,
  Button,
  IconButton,
  Paper,
  Checkbox,
  FormControlLabel,
  Chip,
  Divider,
} from '@mui/material';
import {
  Add,
  Delete,
  AutoAwesome,
  Work,
} from '@mui/icons-material';
import { Experience } from '../../services/cvBuilderService';
import OptimizedTextField from './OptimizedTextField';
import OptimizedTextArea from './OptimizedTextArea';

interface OptimizedExperienceStepProps {
  data: Experience[];
  onChange: (section: string, data: Experience[]) => void;
  onAIHelp: (action: string, data: any) => void;
}

const OptimizedExperienceStep: React.FC<OptimizedExperienceStepProps> = memo(({
  data,
  onChange,
  onAIHelp,
}) => {
  const [expandedIndex, setExpandedIndex] = useState<number>(0);
  const [newResponsibility, setNewResponsibility] = useState<{ [key: number]: string }>({});

  const handleAddExperience = useCallback(() => {
    const newExperience: Experience = {
      id: Date.now().toString(),
      jobTitle: '',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      isOngoing: false,
      description: '',
      responsibilities: [],
      achievements: [],
    };
    
    const updatedData = [...data, newExperience];
    onChange('experience', updatedData);
    setExpandedIndex(updatedData.length - 1);
  }, [data, onChange]);

  const handleRemoveExperience = useCallback((index: number) => {
    const updatedData = data.filter((_, i) => i !== index);
    onChange('experience', updatedData);
    if (expandedIndex >= updatedData.length) {
      setExpandedIndex(Math.max(0, updatedData.length - 1));
    }
  }, [data, onChange, expandedIndex]);

  const handleExperienceChange = useCallback((index: number, field: keyof Experience, value: any) => {
    if (!data || !data[index]) return;
    const updatedData = [...data];
    updatedData[index] = {
      ...updatedData[index],
      [field]: value,
    };
    onChange('experience', updatedData);
  }, [data, onChange]);

  const handleResponsibilityAdd = useCallback((index: number, responsibility: string) => {
    if (!data || !data[index] || !responsibility.trim()) return;
    
    const updatedData = [...data];
    updatedData[index] = {
      ...updatedData[index],
      responsibilities: [...(updatedData[index].responsibilities || []), responsibility.trim()],
    };
    onChange('experience', updatedData);
  }, [data, onChange]);

  const handleResponsibilityRemove = useCallback((expIndex: number, respIndex: number) => {
    if (!data || !data[expIndex]) return;
    const updatedData = [...data];
    updatedData[expIndex] = {
      ...updatedData[expIndex],
      responsibilities: (updatedData[expIndex].responsibilities || []).filter((_, i) => i !== respIndex),
    };
    onChange('experience', updatedData);
  }, [data, onChange]);

  const handleAIEnhance = useCallback(async (index: number) => {
    if (!data || !data[index]) return;
    
    const experience = data[index];
    const token = localStorage.getItem('token');
    
    if (!token) {
      // Generate basic achievements without API
      const basicAchievements = generateBasicAchievements(experience);
      handleExperienceChange(index, 'achievements', basicAchievements);
      
      setTimeout(() => {
        const event = new CustomEvent('showMessage', { 
          detail: { message: '✨ Basic achievements generated!', type: 'success' } 
        });
        window.dispatchEvent(event);
      }, 100);
      return;
    }

    try {
      // Generate achievements if they don't exist or are minimal
      if (!experience.achievements || experience.achievements.length === 0 || 
          experience.achievements.join('').length < 50) {
        
        const achievementsResponse = await fetch('/api/cv-builder/ai/achievements', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            jobTitle: experience.jobTitle,
            company: experience.company,
            responsibilities: experience.responsibilities || []
          }),
        });
        
        if (achievementsResponse.ok) {
          const achievementsResult = await achievementsResponse.json();
          handleExperienceChange(index, 'achievements', achievementsResult.achievements);
        } else {
          // Fallback to basic achievements
          const basicAchievements = generateBasicAchievements(experience);
          handleExperienceChange(index, 'achievements', basicAchievements);
        }
      }

      // Improve description if it exists
      if (experience.description && experience.description.length > 20) {
        const improveResponse = await fetch('/api/cv-builder/ai/improve', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            content: experience.description,
            type: 'experience'
          }),
        });
        
        if (improveResponse.ok) {
          const improveResult = await improveResponse.json();
          handleExperienceChange(index, 'description', improveResult.improvedContent);
        }
      }

      // Show success message
      setTimeout(() => {
        const event = new CustomEvent('showMessage', { 
          detail: { message: '✨ AI has enhanced your experience!', type: 'success' } 
        });
        window.dispatchEvent(event);
      }, 100);
      
    } catch (error) {
      console.error('Error enhancing experience:', error);
      // Generate basic achievements instead of opening dialog
      const basicAchievements = generateBasicAchievements(experience);
      handleExperienceChange(index, 'achievements', basicAchievements);
      
      setTimeout(() => {
        const event = new CustomEvent('showMessage', { 
          detail: { message: '📝 Basic achievements generated!', type: 'info' } 
        });
        window.dispatchEvent(event);
      }, 100);
    }
  }, [data, handleExperienceChange]);

  const handleAIGenerateAchievements = useCallback(async (index: number) => {
    if (!data || !data[index]) return;
    
    const experience = data[index];
    const token = localStorage.getItem('token');
    
    if (!token) {
      // Generate basic achievements without API
      const basicAchievements = generateBasicAchievements(experience);
      handleExperienceChange(index, 'achievements', basicAchievements);
      
      setTimeout(() => {
        const event = new CustomEvent('showMessage', { 
          detail: { message: '🎯 Basic achievements generated!', type: 'success' } 
        });
        window.dispatchEvent(event);
      }, 100);
      return;
    }

    try {
      const response = await fetch('/api/cv-builder/ai/achievements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          jobTitle: experience.jobTitle,
          company: experience.company,
          responsibilities: experience.responsibilities || []
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        handleExperienceChange(index, 'achievements', result.achievements);
        
        // Show success message
        setTimeout(() => {
          const event = new CustomEvent('showMessage', { 
            detail: { message: '🎯 AI-generated achievements added!', type: 'success' } 
          });
          window.dispatchEvent(event);
        }, 100);
      } else {
        // Generate basic achievements instead of opening dialog
        const basicAchievements = generateBasicAchievements(experience);
        handleExperienceChange(index, 'achievements', basicAchievements);
        
        setTimeout(() => {
          const event = new CustomEvent('showMessage', { 
            detail: { message: '📝 Basic achievements generated!', type: 'info' } 
          });
          window.dispatchEvent(event);
        }, 100);
      }
    } catch (error) {
      console.error('Error generating achievements:', error);
      // Generate basic achievements instead of opening dialog
      const basicAchievements = generateBasicAchievements(experience);
      handleExperienceChange(index, 'achievements', basicAchievements);
      
      setTimeout(() => {
        const event = new CustomEvent('showMessage', { 
          detail: { message: '📝 Basic achievements generated!', type: 'info' } 
        });
        window.dispatchEvent(event);
      }, 100);
    }
  }, [data, handleExperienceChange]);

  const generateBasicAchievements = useCallback((experience: Experience): string[] => {
    const jobTitle = experience.jobTitle?.toLowerCase() || 'professional';
    const company = experience.company || 'organization';
    
    const achievementTemplates = {
      developer: [
        '• Developed and maintained high-quality software solutions',
        '• Improved application performance through code optimization',
        '• Collaborated with cross-functional teams to deliver projects on time',
        '• Implemented best practices for code quality and testing'
      ],
      manager: [
        '• Led a team to achieve departmental goals and objectives',
        '• Improved operational efficiency through process optimization',
        '• Mentored team members and fostered professional development',
        '• Achieved significant cost savings through strategic initiatives'
      ],
      sales: [
        '• Exceeded sales targets by 15-25% consistently',
        '• Built and maintained strong client relationships',
        '• Identified new business opportunities and market segments',
        '• Contributed to revenue growth through strategic sales initiatives'
      ],
      marketing: [
        '• Increased brand awareness and market reach',
        '• Developed and executed successful marketing campaigns',
        '• Improved customer engagement metrics by 20-30%',
        '• Collaborated with various teams to align marketing strategies'
      ],
      analyst: [
        '• Analyzed complex data sets to provide actionable insights',
        '• Created comprehensive reports for management decision-making',
        '• Improved data accuracy and reporting processes',
        '• Supported strategic initiatives through detailed analysis'
      ],
      default: [
        '• Successfully completed assigned projects and responsibilities',
        '• Collaborated effectively with team members and stakeholders',
        '• Contributed to operational improvements and efficiency gains',
        '• Maintained high standards of quality and professionalism'
      ]
    };

    // Determine role category
    let roleCategory = 'default';
    if (jobTitle.includes('develop') || jobTitle.includes('engineer') || jobTitle.includes('program')) {
      roleCategory = 'developer';
    } else if (jobTitle.includes('manager') || jobTitle.includes('director') || jobTitle.includes('lead')) {
      roleCategory = 'manager';
    } else if (jobTitle.includes('sales') || jobTitle.includes('account')) {
      roleCategory = 'sales';
    } else if (jobTitle.includes('marketing') || jobTitle.includes('brand')) {
      roleCategory = 'marketing';
    } else if (jobTitle.includes('analyst') || jobTitle.includes('research')) {
      roleCategory = 'analyst';
    }

    return achievementTemplates[roleCategory as keyof typeof achievementTemplates] || achievementTemplates.default;
  }, []);

  if (!data || data.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Work sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
        <Typography variant="h6" color="textSecondary" gutterBottom>
          No work experience added yet
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          Add your professional experience to showcase your career journey
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddExperience}
        >
          Add Your First Experience
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' },
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 2, sm: 0 },
        mb: { xs: 2, sm: 3 }
      }}>
        <Typography variant="h6" sx={{ 
          fontSize: { xs: '1.1rem', sm: '1.25rem' }
        }}>
          Work Experience ({data.length})
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Add sx={{ fontSize: { xs: '1rem', sm: '1.2rem' } }} />}
          onClick={handleAddExperience}
          size={window.innerWidth < 600 ? "medium" : "large"}
          sx={{
            fontSize: { xs: '0.875rem', sm: '1rem' },
            px: { xs: 2, sm: 2 },
            alignSelf: { xs: 'flex-start', sm: 'auto' }
          }}
        >
          {window.innerWidth < 600 ? 'Add' : 'Add Experience'}
        </Button>
      </Box>

      {data.map((experience, index) => (
        <Paper
          key={experience.id}
          sx={{
            p: { xs: 2, sm: 3 },
            mb: 2,
            border: expandedIndex === index ? 2 : 1,
            borderColor: expandedIndex === index ? 'primary.main' : 'grey.300',
            cursor: 'pointer',
            borderRadius: { xs: 2, sm: 1 }
          }}
          onClick={() => setExpandedIndex(index)}
        >
          {/* Experience Header */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: { xs: 'flex-start', sm: 'start' },
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 2, sm: 1 },
            mb: 2 
          }}>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography variant="h6" sx={{
                fontSize: { xs: '1rem', sm: '1.1rem' },
                lineHeight: 1.3,
                wordBreak: 'break-word'
              }}>
                {experience.jobTitle || 'Untitled Position'} 
                {experience.company && ` at ${experience.company}`}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                mt: 0.5,
                wordBreak: 'break-word'
              }}>
                {experience.location} • {experience.startDate} - {experience.isOngoing ? 'Present' : experience.endDate}
              </Typography>
            </Box>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'row', sm: 'row' },
              gap: { xs: 1, sm: 1 },
              alignSelf: { xs: 'flex-start', sm: 'flex-start' }
            }}>
              <Button
                size="small"
                startIcon={<AutoAwesome sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }} />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAIEnhance(index);
                }}
                variant="outlined"
                color="secondary"
                sx={{
                  fontSize: { xs: '0.7rem', sm: '0.8rem' },
                  px: { xs: 1, sm: 1.5 },
                  py: { xs: 0.3, sm: 0.5 },
                  minWidth: { xs: 'auto', sm: 'auto' }
                }}
              >
                {window.innerWidth < 600 ? 'AI' : 'AI Enhance'}
              </Button>
              <IconButton
                size="small"
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveExperience(index);
                }}
                sx={{ p: { xs: 0.5, sm: 1 } }}
              >
                <Delete fontSize={window.innerWidth < 600 ? "small" : "medium"} />
              </IconButton>
            </Box>
          </Box>

          {expandedIndex === index && (
            <Box sx={{ mt: 2 }}>
              <Divider sx={{ mb: 2 }} />
              
              {/* Basic Information */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <OptimizedTextField
                    fullWidth
                    label="Job Title *"
                    value={experience.jobTitle}
                    onChange={(value) => handleExperienceChange(index, 'jobTitle', value)}
                    variant="outlined"
                    required
                    maxLength={100}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <OptimizedTextField
                    fullWidth
                    label="Company *"
                    value={experience.company}
                    onChange={(value) => handleExperienceChange(index, 'company', value)}
                    variant="outlined"
                    required
                    maxLength={100}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <OptimizedTextField
                    fullWidth
                    label="Location"
                    value={experience.location}
                    onChange={(value) => handleExperienceChange(index, 'location', value)}
                    variant="outlined"
                    maxLength={100}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Start Date *"
                    type="month"
                    value={experience.startDate}
                    onChange={(e) => handleExperienceChange(index, 'startDate', e.target.value)}
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={experience.isOngoing}
                        onChange={(e) => handleExperienceChange(index, 'isOngoing', e.target.checked)}
                      />
                    }
                    label="I currently work here"
                  />
                </Grid>
                {!experience.isOngoing && (
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="End Date"
                      type="month"
                      value={experience.endDate}
                      onChange={(e) => handleExperienceChange(index, 'endDate', e.target.value)}
                      variant="outlined"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                )}
              </Grid>

              {/* Description */}
              <Box sx={{ mb: 3 }}>
                <OptimizedTextArea
                  fullWidth
                  label="Job Description"
                  value={experience.description}
                  onChange={(value) => handleExperienceChange(index, 'description', value)}
                  variant="outlined"
                  placeholder="Provide a brief overview of your role and the company..."
                  onAIHelp={() => handleAIEnhance(index)}
                  maxLength={1000}
                  showCharacterCount
                  enableFullscreen
                  minRows={4} // Increased for better mobile experience
                  maxRows={8} // Increased for mobile to prevent overflow
                  autoGrow
                />
              </Box>

              {/* Responsibilities */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Key Responsibilities
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {experience.responsibilities.map((resp, respIndex) => (
                    <Chip
                      key={respIndex}
                      label={resp}
                      onDelete={() => handleResponsibilityRemove(index, respIndex)}
                      size="small"
                    />
                  ))}
                </Box>
                <OptimizedTextField
                  fullWidth
                  placeholder="Add a responsibility and press Enter"
                  value={newResponsibility[index] || ''}
                  onChange={(value) => setNewResponsibility(prev => ({ ...prev, [index]: value }))}
                  variant="outlined"
                  size="small"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const value = newResponsibility[index] || '';
                      if (value.trim()) {
                        handleResponsibilityAdd(index, value);
                        setNewResponsibility(prev => ({ ...prev, [index]: '' }));
                      }
                    }
                  }}
                  debounceMs={0}
                  maxLength={200}
                />
              </Box>

              {/* Achievements */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2">
                    Key Achievements
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<AutoAwesome />}
                    onClick={() => handleAIGenerateAchievements(index)}
                    sx={{ fontSize: '0.75rem' }}
                  >
                    AI Generate
                  </Button>
                </Box>
                <OptimizedTextArea
                  fullWidth
                  value={experience.achievements?.join('\n') || ''}
                  onChange={(value) => handleExperienceChange(index, 'achievements', 
                    value.split('\n').filter(line => line.trim())
                  )}
                  variant="outlined"
                  placeholder="• Increased sales by 25% through improved customer engagement\n• Led a team of 10 developers on critical project\n• Implemented new system that reduced costs by $50K annually"
                  helperText="List your key achievements, one per line. Start each with a bullet point (•)"
                  label=""
                  onAIHelp={() => handleAIGenerateAchievements(index)}
                  maxLength={800}
                  showCharacterCount
                  enableFullscreen
                  minRows={4} // Increased for better mobile experience
                  maxRows={10} // Increased for mobile to prevent overflow
                  autoGrow
                />
              </Box>
            </Box>
          )}
        </Paper>
      ))}
    </Box>
  );
});

OptimizedExperienceStep.displayName = 'OptimizedExperienceStep';

export default OptimizedExperienceStep;
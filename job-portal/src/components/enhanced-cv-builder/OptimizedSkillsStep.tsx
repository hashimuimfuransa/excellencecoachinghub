import React, { memo, useCallback, useState } from 'react';
import {
  Box,
  TextField,
  Typography,
  Button,
  Chip,
  Slider,
  Grid,
  Paper,
  Tabs,
  Tab,
  IconButton,
} from '@mui/material';
import { Add, AutoAwesome, Close } from '@mui/icons-material';
import { Skills } from '../../services/cvBuilderService';

interface OptimizedSkillsStepProps {
  data: Skills;
  onChange: (section: string, data: Skills) => void;
  onAIHelp: (action: string, data: any) => void;
}

const OptimizedSkillsStep: React.FC<OptimizedSkillsStepProps> = memo(({
  data,
  onChange,
  onAIHelp,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [newSkillName, setNewSkillName] = useState('');
  const [newLanguageName, setNewLanguageName] = useState('');
  const [newLanguageProficiency, setNewLanguageProficiency] = useState('');

  const handleAddTechnicalSkill = useCallback(() => {
    if (!newSkillName.trim()) return;
    
    const updatedSkills = {
      ...data,
      technical: [
        ...(data.technical || []),
        { name: newSkillName.trim(), level: 5, category: 'General' }
      ]
    };
    onChange('skills', updatedSkills);
    setNewSkillName('');
  }, [data, onChange, newSkillName]);

  const handleAddSoftSkill = useCallback(() => {
    if (!newSkillName.trim()) return;
    
    const updatedSkills = {
      ...data,
      soft: [
        ...(data.soft || []),
        { name: newSkillName.trim(), level: 5, category: 'General' }
      ]
    };
    onChange('skills', updatedSkills);
    setNewSkillName('');
  }, [data, onChange, newSkillName]);

  const handleAddLanguage = useCallback(() => {
    if (!newLanguageName.trim() || !newLanguageProficiency.trim()) return;
    
    const updatedSkills = {
      ...data,
      languages: [
        ...(data.languages || []),
        { name: newLanguageName.trim(), proficiency: newLanguageProficiency.trim() }
      ]
    };
    onChange('skills', updatedSkills);
    setNewLanguageName('');
    setNewLanguageProficiency('');
  }, [data, onChange, newLanguageName, newLanguageProficiency]);

  const handleRemoveTechnicalSkill = useCallback((index: number) => {
    const updatedSkills = {
      ...data,
      technical: data.technical?.filter((_, i) => i !== index) || []
    };
    onChange('skills', updatedSkills);
  }, [data, onChange]);

  const handleRemoveSoftSkill = useCallback((index: number) => {
    const updatedSkills = {
      ...data,
      soft: data.soft?.filter((_, i) => i !== index) || []
    };
    onChange('skills', updatedSkills);
  }, [data, onChange]);

  const handleRemoveLanguage = useCallback((index: number) => {
    const updatedSkills = {
      ...data,
      languages: data.languages?.filter((_, i) => i !== index) || []
    };
    onChange('skills', updatedSkills);
  }, [data, onChange]);

  const handleSkillLevelChange = useCallback((index: number, level: number, type: 'technical' | 'soft') => {
    const updatedSkills = {
      ...data,
      [type]: data[type]?.map((skill, i) => 
        i === index ? { ...skill, level } : skill
      ) || []
    };
    onChange('skills', updatedSkills);
  }, [data, onChange]);

  const handleAISkillSuggestions = useCallback(async () => {
    const token = localStorage.getItem('token');
    
    // Try to determine industry and role from personal info or experience data
    const personalInfo = (window as any).cvData?.personalInfo || {};
    const experiences = (window as any).cvData?.experiences || [];
    
    // Extract industry and role from the most recent experience
    let industry = 'Technology'; // Default
    let role = 'Professional'; // Default
    
    if (experiences.length > 0) {
      const latestExp = experiences[0];
      role = latestExp.jobTitle || 'Professional';
      
      // Try to infer industry from company or job title
      const jobTitle = latestExp.jobTitle?.toLowerCase() || '';
      const company = latestExp.company?.toLowerCase() || '';
      
      if (jobTitle.includes('developer') || jobTitle.includes('engineer') || jobTitle.includes('programmer') || 
          jobTitle.includes('software') || jobTitle.includes('tech') || jobTitle.includes('it')) {
        industry = 'Technology';
      } else if (jobTitle.includes('manager') || jobTitle.includes('director') || jobTitle.includes('supervisor')) {
        industry = 'Management';
      } else if (jobTitle.includes('sales') || jobTitle.includes('marketing') || jobTitle.includes('business development')) {
        industry = 'Sales & Marketing';
      } else if (jobTitle.includes('finance') || jobTitle.includes('accountant') || jobTitle.includes('accounting')) {
        industry = 'Finance';
      } else if (jobTitle.includes('designer') || jobTitle.includes('creative') || jobTitle.includes('artist') || 
                 jobTitle.includes('ui') || jobTitle.includes('ux')) {
        industry = 'Creative';
      } else if (jobTitle.includes('nurse') || jobTitle.includes('doctor') || jobTitle.includes('medical') || 
                 jobTitle.includes('healthcare') || jobTitle.includes('physician') || jobTitle.includes('therapist')) {
        industry = 'Healthcare';
      } else if (jobTitle.includes('teacher') || jobTitle.includes('professor') || jobTitle.includes('educator') || 
                 jobTitle.includes('instructor') || jobTitle.includes('academic')) {
        industry = 'Education';
      } else if (jobTitle.includes('hr') || jobTitle.includes('human resources') || jobTitle.includes('recruiter') || 
                 jobTitle.includes('talent')) {
        industry = 'Human Resources';
      } else if (jobTitle.includes('server') || jobTitle.includes('hospitality') || jobTitle.includes('restaurant') || 
                 jobTitle.includes('hotel') || jobTitle.includes('chef') || jobTitle.includes('bartender')) {
        industry = 'Hospitality';
      } else if (jobTitle.includes('engineer') && !jobTitle.includes('software')) {
        industry = 'Engineering';
      } else if (jobTitle.includes('lawyer') || jobTitle.includes('attorney') || jobTitle.includes('legal') || 
                 jobTitle.includes('paralegal')) {
        industry = 'Legal';
      }
    }

    if (!token) {
      // Generate basic skills without API
      const basicSkills = generateBasicSkills(industry, role);
      const updatedSkills = {
        ...data,
        technical: [...(data.technical || []), ...basicSkills.technical],
        soft: [...(data.soft || []), ...basicSkills.soft]
      };
      
      onChange('skills', updatedSkills);
      
      setTimeout(() => {
        const event = new CustomEvent('showMessage', { 
          detail: { 
            message: `🎯 Added ${basicSkills.technical.length + basicSkills.soft.length} suggested skills!`, 
            type: 'success' 
          } 
        });
        window.dispatchEvent(event);
      }, 100);
      return;
    }

    try {
      const response = await fetch('/api/cv-builder/ai/keywords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          industry,
          role
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        const keywords = result.keywords || [];
        
        // Split keywords into technical and soft skills
        const technicalKeywords = ['JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'AWS', 'Docker', 'Git'];
        const softKeywords = ['Leadership', 'Communication', 'Problem Solving', 'Team Collaboration', 'Project Management'];
        
        const suggestedTechnical = keywords.filter((keyword: string) => 
          technicalKeywords.some(tech => keyword.toLowerCase().includes(tech.toLowerCase())) ||
          keyword.toLowerCase().includes('js') ||
          keyword.toLowerCase().includes('programming') ||
          keyword.toLowerCase().includes('development') ||
          keyword.toLowerCase().includes('database') ||
          keyword.toLowerCase().includes('framework') ||
          keyword.toLowerCase().includes('software')
        ).slice(0, 8);
        
        const suggestedSoft = keywords.filter((keyword: string) => 
          softKeywords.some(soft => keyword.toLowerCase().includes(soft.toLowerCase())) ||
          keyword.toLowerCase().includes('management') ||
          keyword.toLowerCase().includes('communication') ||
          keyword.toLowerCase().includes('leadership') ||
          keyword.toLowerCase().includes('collaboration') ||
          keyword.toLowerCase().includes('analytical')
        ).slice(0, 8);

        // Add suggested skills to the current skills
        const updatedSkills = {
          ...data,
          technical: [
            ...(data.technical || []),
            ...suggestedTechnical.map((skill: string) => ({ 
              name: skill, 
              level: 6, 
              category: 'Suggested' 
            }))
          ],
          soft: [
            ...(data.soft || []),
            ...suggestedSoft.map((skill: string) => ({ 
              name: skill, 
              level: 7, 
              category: 'Suggested' 
            }))
          ]
        };
        
        onChange('skills', updatedSkills);
        
        // Show success message
        setTimeout(() => {
          const event = new CustomEvent('showMessage', { 
            detail: { 
              message: `🎯 Added ${suggestedTechnical.length + suggestedSoft.length} AI-suggested skills!`, 
              type: 'success' 
            } 
          });
          window.dispatchEvent(event);
        }, 100);
        
      } else {
        // Generate basic skills instead of opening dialog
        const basicSkills = generateBasicSkills(industry, role);
        const updatedSkills = {
          ...data,
          technical: [...(data.technical || []), ...basicSkills.technical],
          soft: [...(data.soft || []), ...basicSkills.soft]
        };
        
        onChange('skills', updatedSkills);
        
        setTimeout(() => {
          const event = new CustomEvent('showMessage', { 
            detail: { 
              message: `📝 Added ${basicSkills.technical.length + basicSkills.soft.length} basic skills!`, 
              type: 'info' 
            } 
          });
          window.dispatchEvent(event);
        }, 100);
      }
    } catch (error) {
      console.error('Error getting skill suggestions:', error);
      // Generate basic skills instead of opening dialog
      const basicSkills = generateBasicSkills(industry, role);
      const updatedSkills = {
        ...data,
        technical: [...(data.technical || []), ...basicSkills.technical],
        soft: [...(data.soft || []), ...basicSkills.soft]
      };
      
      onChange('skills', updatedSkills);
      
      setTimeout(() => {
        const event = new CustomEvent('showMessage', { 
          detail: { 
            message: `📝 Added ${basicSkills.technical.length + basicSkills.soft.length} basic skills!`, 
            type: 'info' 
          } 
        });
        window.dispatchEvent(event);
      }, 100);
    }
  }, [data, onChange]);

  const generateBasicSkills = useCallback((industry: string, role: string) => {
    const skillsByIndustry = {
      'Technology': {
        technical: [
          { name: 'JavaScript', level: 7, category: 'Programming' },
          { name: 'Python', level: 6, category: 'Programming' },
          { name: 'React', level: 6, category: 'Framework' },
          { name: 'Node.js', level: 6, category: 'Backend' },
          { name: 'SQL', level: 6, category: 'Database' },
          { name: 'Git', level: 7, category: 'Tools' },
          { name: 'HTML/CSS', level: 7, category: 'Web' },
          { name: 'RESTful APIs', level: 6, category: 'Integration' }
        ],
        soft: [
          { name: 'Problem Solving', level: 8, category: 'General' },
          { name: 'Analytical Thinking', level: 7, category: 'General' },
          { name: 'Team Collaboration', level: 7, category: 'General' },
          { name: 'Continuous Learning', level: 8, category: 'General' },
          { name: 'Technical Communication', level: 6, category: 'General' }
        ]
      },
      'Management': {
        technical: [
          { name: 'Project Management', level: 8, category: 'Management' },
          { name: 'Microsoft Office', level: 7, category: 'Software' },
          { name: 'Data Analysis', level: 6, category: 'Analysis' },
          { name: 'Budget Management', level: 6, category: 'Finance' }
        ],
        soft: [
          { name: 'Leadership', level: 8, category: 'General' },
          { name: 'Team Management', level: 8, category: 'General' },
          { name: 'Strategic Planning', level: 7, category: 'General' },
          { name: 'Decision Making', level: 7, category: 'General' },
          { name: 'Communication', level: 8, category: 'General' }
        ]
      },
      'Sales & Marketing': {
        technical: [
          { name: 'CRM Software', level: 7, category: 'Software' },
          { name: 'Digital Marketing', level: 6, category: 'Marketing' },
          { name: 'Social Media Management', level: 6, category: 'Marketing' },
          { name: 'Google Analytics', level: 6, category: 'Analytics' }
        ],
        soft: [
          { name: 'Communication', level: 9, category: 'General' },
          { name: 'Negotiation', level: 8, category: 'General' },
          { name: 'Relationship Building', level: 8, category: 'General' },
          { name: 'Persuasion', level: 7, category: 'General' },
          { name: 'Customer Focus', level: 8, category: 'General' }
        ]
      },
      'Finance': {
        technical: [
          { name: 'Excel', level: 8, category: 'Software' },
          { name: 'Financial Analysis', level: 7, category: 'Finance' },
          { name: 'QuickBooks', level: 6, category: 'Software' },
          { name: 'SAP', level: 6, category: 'Software' }
        ],
        soft: [
          { name: 'Analytical Thinking', level: 8, category: 'General' },
          { name: 'Attention to Detail', level: 9, category: 'General' },
          { name: 'Problem Solving', level: 7, category: 'General' },
          { name: 'Time Management', level: 7, category: 'General' }
        ]
      },
      'Creative': {
        technical: [
          { name: 'Adobe Creative Suite', level: 7, category: 'Design' },
          { name: 'Figma', level: 6, category: 'Design' },
          { name: 'UI/UX Design', level: 6, category: 'Design' },
          { name: 'Typography', level: 6, category: 'Design' },
          { name: 'Color Theory', level: 6, category: 'Design' },
          { name: 'Wireframing', level: 6, category: 'Design' }
        ],
        soft: [
          { name: 'Creativity', level: 9, category: 'General' },
          { name: 'Visual Communication', level: 8, category: 'General' },
          { name: 'Attention to Detail', level: 8, category: 'General' },
          { name: 'Client Collaboration', level: 7, category: 'General' },
          { name: 'Adaptability', level: 7, category: 'General' }
        ]
      },
      'Healthcare': {
        technical: [
          { name: 'EMR/EHR Systems', level: 7, category: 'Medical' },
          { name: 'Medical Terminology', level: 8, category: 'Medical' },
          { name: 'Patient Care', level: 8, category: 'Clinical' },
          { name: 'Medical Documentation', level: 7, category: 'Documentation' },
          { name: 'HIPAA Compliance', level: 8, category: 'Compliance' }
        ],
        soft: [
          { name: 'Empathy', level: 9, category: 'General' },
          { name: 'Communication', level: 8, category: 'General' },
          { name: 'Attention to Detail', level: 9, category: 'General' },
          { name: 'Stress Management', level: 8, category: 'General' },
          { name: 'Teamwork', level: 8, category: 'General' }
        ]
      },
      'Education': {
        technical: [
          { name: 'Curriculum Development', level: 7, category: 'Academic' },
          { name: 'Learning Management Systems', level: 6, category: 'Technology' },
          { name: 'Assessment & Evaluation', level: 7, category: 'Academic' },
          { name: 'Educational Technology', level: 6, category: 'Technology' },
          { name: 'Microsoft Office Suite', level: 7, category: 'Software' }
        ],
        soft: [
          { name: 'Communication', level: 9, category: 'General' },
          { name: 'Patience', level: 8, category: 'General' },
          { name: 'Adaptability', level: 8, category: 'General' },
          { name: 'Leadership', level: 7, category: 'General' },
          { name: 'Mentoring', level: 8, category: 'General' }
        ]
      },
      'Human Resources': {
        technical: [
          { name: 'HRIS Systems', level: 7, category: 'HR Tech' },
          { name: 'Recruitment & Selection', level: 8, category: 'HR' },
          { name: 'Performance Management', level: 7, category: 'HR' },
          { name: 'Employment Law', level: 6, category: 'Legal' },
          { name: 'Benefits Administration', level: 6, category: 'Benefits' }
        ],
        soft: [
          { name: 'Interpersonal Skills', level: 9, category: 'General' },
          { name: 'Conflict Resolution', level: 8, category: 'General' },
          { name: 'Communication', level: 8, category: 'General' },
          { name: 'Discretion', level: 9, category: 'General' },
          { name: 'Problem Solving', level: 7, category: 'General' }
        ]
      },
      'Hospitality': {
        technical: [
          { name: 'POS Systems', level: 7, category: 'Technology' },
          { name: 'Food Safety Certification', level: 8, category: 'Safety' },
          { name: 'Inventory Management', level: 6, category: 'Operations' },
          { name: 'Reservation Systems', level: 7, category: 'Technology' },
          { name: 'Event Planning', level: 6, category: 'Operations' }
        ],
        soft: [
          { name: 'Customer Service', level: 9, category: 'General' },
          { name: 'Communication', level: 8, category: 'General' },
          { name: 'Multitasking', level: 8, category: 'General' },
          { name: 'Team Collaboration', level: 8, category: 'General' },
          { name: 'Cultural Sensitivity', level: 7, category: 'General' }
        ]
      },
      'Engineering': {
        technical: [
          { name: 'AutoCAD', level: 7, category: 'Design' },
          { name: 'Project Management', level: 7, category: 'Management' },
          { name: 'Technical Documentation', level: 7, category: 'Documentation' },
          { name: 'Quality Assurance', level: 6, category: 'QA' },
          { name: 'MATLAB', level: 6, category: 'Analysis' },
          { name: 'Regulatory Compliance', level: 6, category: 'Compliance' }
        ],
        soft: [
          { name: 'Problem Solving', level: 9, category: 'General' },
          { name: 'Analytical Thinking', level: 8, category: 'General' },
          { name: 'Attention to Detail', level: 8, category: 'General' },
          { name: 'Team Collaboration', level: 7, category: 'General' },
          { name: 'Communication', level: 7, category: 'General' }
        ]
      },
      'Legal': {
        technical: [
          { name: 'Legal Research', level: 8, category: 'Legal' },
          { name: 'Contract Analysis', level: 7, category: 'Legal' },
          { name: 'Case Management Software', level: 6, category: 'Technology' },
          { name: 'Legal Writing', level: 8, category: 'Writing' },
          { name: 'Compliance Management', level: 7, category: 'Compliance' }
        ],
        soft: [
          { name: 'Attention to Detail', level: 9, category: 'General' },
          { name: 'Analytical Thinking', level: 8, category: 'General' },
          { name: 'Communication', level: 8, category: 'General' },
          { name: 'Confidentiality', level: 9, category: 'General' },
          { name: 'Time Management', level: 8, category: 'General' }
        ]
      }
    };

    const defaultSkills = {
      technical: [
        { name: 'Microsoft Office', level: 7, category: 'Software' },
        { name: 'Computer Literacy', level: 7, category: 'General' },
        { name: 'Data Entry', level: 6, category: 'General' },
        { name: 'Internet Research', level: 6, category: 'General' }
      ],
      soft: [
        { name: 'Communication', level: 7, category: 'General' },
        { name: 'Team Collaboration', level: 7, category: 'General' },
        { name: 'Problem Solving', level: 6, category: 'General' },
        { name: 'Time Management', level: 7, category: 'General' },
        { name: 'Adaptability', level: 6, category: 'General' }
      ]
    };

    return skillsByIndustry[industry as keyof typeof skillsByIndustry] || defaultSkills;
  }, []);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Skills & Languages</Typography>
        <Button
          startIcon={<AutoAwesome />}
          variant="outlined"
          color="secondary"
          onClick={handleAISkillSuggestions}
        >
          AI Skill Suggestions
        </Button>
      </Box>

      <Paper sx={{ width: '100%' }}>
        <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)}>
          <Tab label={`Technical Skills (${data.technical?.length || 0})`} />
          <Tab label={`Soft Skills (${data.soft?.length || 0})`} />
          <Tab label={`Languages (${data.languages?.length || 0})`} />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* Technical Skills Tab */}
          {activeTab === 0 && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Technical Skills
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                <TextField
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  placeholder="Enter technical skill (e.g., JavaScript, Python)"
                  variant="outlined"
                  size="small"
                  sx={{ flexGrow: 1 }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddTechnicalSkill();
                    }
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleAddTechnicalSkill}
                  startIcon={<Add />}
                >
                  Add
                </Button>
              </Box>

              <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                {data.technical?.map((skill, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Paper 
                      elevation={2}
                      sx={{ 
                        p: { xs: 2, sm: 2.5 }, 
                        bgcolor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: { xs: 2, sm: 2 },
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          elevation: 4,
                          borderColor: 'primary.main',
                          transform: 'translateY(-2px)',
                        },
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: 4,
                          background: `linear-gradient(90deg, 
                            ${skill.level <= 3 ? '#ff5722' : skill.level <= 6 ? '#ff9800' : skill.level <= 8 ? '#2196f3' : '#4caf50'} 0%, 
                            ${skill.level <= 3 ? '#ff7043' : skill.level <= 6 ? '#ffb74d' : skill.level <= 8 ? '#64b5f6' : '#81c784'} 100%)`
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                        <Box sx={{ flex: 1, mr: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                            {skill.name}
                          </Typography>
                          {skill.category && (
                            <Chip
                              label={skill.category}
                              size="small"
                              variant="outlined"
                              sx={{ 
                                height: 20, 
                                fontSize: '0.7rem',
                                bgcolor: 'action.hover',
                                borderColor: 'transparent'
                              }}
                            />
                          )}
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveTechnicalSkill(index)}
                          sx={{ 
                            color: 'error.main',
                            '&:hover': { bgcolor: 'error.light', color: 'error.contrastText' }
                          }}
                        >
                          <Close fontSize="small" />
                        </IconButton>
                      </Box>
                      
                      <Box sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="caption" color="textSecondary">
                            Proficiency
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              fontWeight: 600,
                              color: skill.level <= 3 ? 'error.main' : skill.level <= 6 ? 'warning.main' : skill.level <= 8 ? 'info.main' : 'success.main'
                            }}
                          >
                            {skill.level <= 3 ? 'Beginner' : skill.level <= 6 ? 'Intermediate' : skill.level <= 8 ? 'Advanced' : 'Expert'} ({skill.level}/10)
                          </Typography>
                        </Box>
                        <Slider
                          value={skill.level}
                          onChange={(_, value) => handleSkillLevelChange(index, value as number, 'technical')}
                          min={1}
                          max={10}
                          size="small"
                          sx={{ 
                            '& .MuiSlider-thumb': {
                              width: 16,
                              height: 16,
                            },
                            '& .MuiSlider-track': {
                              background: `linear-gradient(90deg, 
                                ${skill.level <= 3 ? '#ff5722' : skill.level <= 6 ? '#ff9800' : skill.level <= 8 ? '#2196f3' : '#4caf50'} 0%, 
                                ${skill.level <= 3 ? '#ff7043' : skill.level <= 6 ? '#ffb74d' : skill.level <= 8 ? '#64b5f6' : '#81c784'} 100%)`
                            }
                          }}
                        />
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Soft Skills Tab */}
          {activeTab === 1 && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Soft Skills
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                <TextField
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  placeholder="Enter soft skill (e.g., Leadership, Communication)"
                  variant="outlined"
                  size="small"
                  sx={{ flexGrow: 1 }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddSoftSkill();
                    }
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleAddSoftSkill}
                  startIcon={<Add />}
                >
                  Add
                </Button>
              </Box>

              <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                {data.soft?.map((skill, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Paper 
                      elevation={2}
                      sx={{ 
                        p: { xs: 2, sm: 2.5 }, 
                        bgcolor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: { xs: 2, sm: 2 },
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          elevation: 4,
                          borderColor: 'secondary.main',
                          transform: 'translateY(-2px)',
                        },
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: 4,
                          background: `linear-gradient(90deg, 
                            ${skill.level <= 3 ? '#e91e63' : skill.level <= 6 ? '#9c27b0' : skill.level <= 8 ? '#673ab7' : '#3f51b5'} 0%, 
                            ${skill.level <= 3 ? '#f06292' : skill.level <= 6 ? '#ba68c8' : skill.level <= 8 ? '#9575cd' : '#7986cb'} 100%)`
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                        <Box sx={{ flex: 1, mr: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                            {skill.name}
                          </Typography>
                          {skill.category && (
                            <Chip
                              label={skill.category}
                              size="small"
                              variant="outlined"
                              sx={{ 
                                height: 20, 
                                fontSize: '0.7rem',
                                bgcolor: 'secondary.light',
                                color: 'secondary.contrastText',
                                borderColor: 'transparent'
                              }}
                            />
                          )}
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveSoftSkill(index)}
                          sx={{ 
                            color: 'error.main',
                            '&:hover': { bgcolor: 'error.light', color: 'error.contrastText' }
                          }}
                        >
                          <Close fontSize="small" />
                        </IconButton>
                      </Box>
                      
                      <Box sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="caption" color="textSecondary">
                            Proficiency
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              fontWeight: 600,
                              color: skill.level <= 3 ? 'error.main' : skill.level <= 6 ? 'warning.main' : skill.level <= 8 ? 'info.main' : 'success.main'
                            }}
                          >
                            {skill.level <= 3 ? 'Basic' : skill.level <= 6 ? 'Proficient' : skill.level <= 8 ? 'Advanced' : 'Expert'} ({skill.level}/10)
                          </Typography>
                        </Box>
                        <Slider
                          value={skill.level}
                          onChange={(_, value) => handleSkillLevelChange(index, value as number, 'soft')}
                          min={1}
                          max={10}
                          size="small"
                          sx={{ 
                            '& .MuiSlider-thumb': {
                              width: 16,
                              height: 16,
                            },
                            '& .MuiSlider-track': {
                              background: `linear-gradient(90deg, 
                                ${skill.level <= 3 ? '#e91e63' : skill.level <= 6 ? '#9c27b0' : skill.level <= 8 ? '#673ab7' : '#3f51b5'} 0%, 
                                ${skill.level <= 3 ? '#f06292' : skill.level <= 6 ? '#ba68c8' : skill.level <= 8 ? '#9575cd' : '#7986cb'} 100%)`
                            }
                          }}
                        />
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Languages Tab */}
          {activeTab === 2 && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Languages
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                <TextField
                  value={newLanguageName}
                  onChange={(e) => setNewLanguageName(e.target.value)}
                  placeholder="Language (e.g., English, Spanish)"
                  variant="outlined"
                  size="small"
                  sx={{ flexGrow: 1 }}
                />
                <TextField
                  value={newLanguageProficiency}
                  onChange={(e) => setNewLanguageProficiency(e.target.value)}
                  placeholder="Proficiency (e.g., Native, Fluent)"
                  variant="outlined"
                  size="small"
                  sx={{ flexGrow: 1 }}
                />
                <Button
                  variant="contained"
                  onClick={handleAddLanguage}
                  startIcon={<Add />}
                >
                  Add
                </Button>
              </Box>

              <Grid container spacing={2}>
                {data.languages?.map((language, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Paper 
                      elevation={2}
                      sx={{ 
                        p: 2.5, 
                        bgcolor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          elevation: 4,
                          borderColor: 'info.main',
                          transform: 'translateY(-2px)',
                        },
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: 4,
                          background: `linear-gradient(90deg, #00bcd4 0%, #26c6da 100%)`
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ flex: 1, mr: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                            {language.name}
                          </Typography>
                          <Chip
                            label={language.proficiency}
                            size="small"
                            variant="filled"
                            sx={{ 
                              height: 24, 
                              fontSize: '0.75rem',
                              bgcolor: 'info.light',
                              color: 'info.contrastText',
                              fontWeight: 500
                            }}
                          />
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveLanguage(index)}
                          sx={{ 
                            color: 'error.main',
                            '&:hover': { bgcolor: 'error.light', color: 'error.contrastText' }
                          }}
                        >
                          <Close fontSize="small" />
                        </IconButton>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
});

OptimizedSkillsStep.displayName = 'OptimizedSkillsStep';

export default OptimizedSkillsStep;
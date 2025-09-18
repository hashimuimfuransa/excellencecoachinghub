import React, { useState } from 'react';
import {
  Box,
  Grid,
  TextField,
  Typography,
  Card,
  CardContent,
  Button,
  IconButton,
  Chip,
  Alert,
  FormControl,
  FormControlLabel,
  Switch,
  useTheme,
  useMediaQuery,
  Fade,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
} from '@mui/material';
import {
  Add,
  Delete,
  VolunteerActivism,
  ExpandMore,
  Groups,
  Favorite,
  Public,
  School,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { VolunteerExperience } from '../../services/cvBuilderService';

interface EnhancedVolunteerStepProps {
  data: VolunteerExperience[];
  onChange: (data: VolunteerExperience[]) => void;
  onAIHelp?: (action: string, data: any) => void;
}

const defaultVolunteerExperience: Omit<VolunteerExperience, 'id'> = {
  organization: '',
  role: '',
  startDate: '',
  endDate: '',
  isOngoing: false,
  location: '',
  description: '',
  achievements: [''],
};

const volunteerCategories = [
  { category: 'Community Service', icon: '🏘️', examples: ['Food banks', 'Homeless shelters', 'Community centers'] },
  { category: 'Education', icon: '📚', examples: ['Tutoring', 'Mentoring', 'Teaching assistance'] },
  { category: 'Environment', icon: '🌱', examples: ['Clean-up drives', 'Tree planting', 'Conservation'] },
  { category: 'Healthcare', icon: '🏥', examples: ['Hospital volunteering', 'Blood drives', 'Health campaigns'] },
  { category: 'Youth Development', icon: '👥', examples: ['Youth programs', 'Sports coaching', 'Scouting'] },
  { category: 'Animal Welfare', icon: '🐾', examples: ['Animal shelters', 'Wildlife conservation', 'Pet rescue'] },
  { category: 'Arts & Culture', icon: '🎨', examples: ['Museums', 'Festivals', 'Cultural events'] },
  { category: 'Religious/Spiritual', icon: '🕊️', examples: ['Religious organizations', 'Spiritual communities', 'Faith-based service'] },
];

const EnhancedVolunteerStep: React.FC<EnhancedVolunteerStepProps> = ({
  data,
  onChange,
  onAIHelp,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [expandedExperience, setExpandedExperience] = useState<number>(0);

  const addVolunteerExperience = () => {
    const newExperience: VolunteerExperience = {
      ...defaultVolunteerExperience,
      id: Date.now().toString(),
      startDate: dayjs().format('YYYY-MM-DD'),
    };
    onChange([...data, newExperience]);
    setExpandedExperience(data.length);
  };

  const updateVolunteerExperience = (index: number, field: keyof VolunteerExperience, value: any) => {
    const newData = [...data];
    newData[index] = { ...newData[index], [field]: value };
    
    // If setting as ongoing, clear end date
    if (field === 'isOngoing' && value) {
      newData[index].endDate = '';
    }
    
    onChange(newData);
  };

  const deleteVolunteerExperience = (index: number) => {
    const newData = data.filter((_, i) => i !== index);
    onChange(newData);
    if (expandedExperience >= index && expandedExperience > 0) {
      setExpandedExperience(expandedExperience - 1);
    }
  };

  const addAchievement = (experienceIndex: number) => {
    const experience = data[experienceIndex];
    updateVolunteerExperience(experienceIndex, 'achievements', [...experience.achievements, '']);
  };

  const updateAchievement = (experienceIndex: number, achievementIndex: number, value: string) => {
    const experience = data[experienceIndex];
    const newAchievements = [...experience.achievements];
    newAchievements[achievementIndex] = value;
    updateVolunteerExperience(experienceIndex, 'achievements', newAchievements);
  };

  const deleteAchievement = (experienceIndex: number, achievementIndex: number) => {
    const experience = data[experienceIndex];
    const newAchievements = experience.achievements.filter((_, i) => i !== achievementIndex);
    updateVolunteerExperience(experienceIndex, 'achievements', newAchievements);
  };

  const formatDateForDisplay = (dateString: string): string => {
    if (!dateString) return '';
    return dayjs(dateString).format('MMM YYYY');
  };

  const calculateDuration = (startDate: string, endDate: string, isOngoing: boolean): string => {
    if (!startDate) return '';
    
    const start = dayjs(startDate);
    const end = isOngoing ? dayjs() : dayjs(endDate);
    
    if (!end.isValid()) return '';
    
    const months = end.diff(start, 'month');
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    if (years > 0 && remainingMonths > 0) {
      return `${years}y ${remainingMonths}m`;
    } else if (years > 0) {
      return `${years}y`;
    } else {
      return `${remainingMonths}m`;
    }
  };

  const getExperienceCompletion = (experience: VolunteerExperience): number => {
    let score = 0;
    if (experience.organization) score += 25;
    if (experience.role) score += 25;
    if (experience.startDate) score += 20;
    if (experience.endDate || experience.isOngoing) score += 10;
    if (experience.description) score += 20;
    return score;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
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
                  <VolunteerActivism sx={{ mr: 1, fontSize: 28 }} />
                  <Typography variant="h5" fontWeight="bold">
                    Volunteer & Extracurricular Activities
                  </Typography>
                </Box>
                <Typography variant="body1" sx={{ opacity: 0.9, mb: 2 }}>
                  Showcase your volunteer work, leadership roles, and extracurricular activities that demonstrate your values, initiative, and soft skills.
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  flexDirection: isMobile ? 'column' : 'row',
                  gap: isMobile ? 2 : 0,
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Chip 
                      label={`${data.length} Activities`}
                      sx={{ 
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        fontWeight: 'bold',
                      }}
                    />
                    {data.length >= 2 && (
                      <Chip 
                        label="✓ Well Rounded"
                        sx={{ 
                          bgcolor: 'rgba(76, 175, 80, 0.3)',
                          color: 'white',
                          fontWeight: 'bold',
                        }}
                      />
                    )}
                  </Box>
                  <Button
                    startIcon={<Add />}
                    onClick={addVolunteerExperience}
                    variant="outlined"
                    size={isMobile ? "medium" : "small"}
                    fullWidth={isMobile}
                    sx={{ 
                      borderColor: 'rgba(255, 255, 255, 0.7)',
                      color: 'white',
                      '&:hover': {
                        borderColor: 'white',
                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                      },
                    }}
                  >
                    Add Activity
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Category Guide */}
          {data.length === 0 && (
            <Grid item xs={12}>
              <Card sx={{ border: '1px dashed', borderColor: 'divider' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Groups /> Popular Volunteer Categories
                  </Typography>
                  <Grid container spacing={2}>
                    {volunteerCategories.slice(0, 6).map((cat, index) => (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        <Box sx={{ 
                          p: 2, 
                          border: 1, 
                          borderColor: 'divider', 
                          borderRadius: 1,
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'action.hover' },
                        }}
                        onClick={() => {
                          const newExperience: VolunteerExperience = {
                            ...defaultVolunteerExperience,
                            id: Date.now().toString(),
                            role: `${cat.category} Volunteer`,
                            startDate: dayjs().format('YYYY-MM-DD'),
                          };
                          onChange([...data, newExperience]);
                          setExpandedExperience(data.length);
                        }}
                        >
                          <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <span style={{ fontSize: 20 }}>{cat.icon}</span>
                            {cat.category}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {cat.examples.join(', ')}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Experiences List */}
          {data.length > 0 ? (
            <Grid item xs={12}>
              <Box sx={{ space: 2 }}>
                {data.map((experience, index) => (
                  <Fade in={true} key={experience.id} timeout={300 * (index + 1)}>
                    <Accordion
                      expanded={expandedExperience === index}
                      onChange={() => setExpandedExperience(expandedExperience === index ? -1 : index)}
                      sx={{ mb: 2, border: 1, borderColor: 'divider' }}
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMore />}
                        sx={{
                          bgcolor: 'background.paper',
                          '&:hover': { bgcolor: 'action.hover' },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%', mr: 2 }}>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 1, 
                              mb: 1,
                              flexWrap: 'wrap',
                            }}>
                              <Typography variant={isMobile ? "body1" : "subtitle1"} fontWeight="bold" sx={{ 
                                wordBreak: 'break-word',
                                minWidth: 0,
                              }}>
                                {experience.role || `Volunteer ${index + 1}`}
                              </Typography>
                              {experience.isOngoing && (
                                <Chip label="Ongoing" size="small" color="success" />
                              )}
                              <Chip
                                label={`${getExperienceCompletion(experience)}%`}
                                size="small"
                                color={getExperienceCompletion(experience) >= 80 ? 'success' : 
                                       getExperienceCompletion(experience) >= 60 ? 'warning' : 'error'}
                              />
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ 
                              wordBreak: 'break-word',
                              mb: 0.5,
                            }}>
                              {experience.organization || 'Organization'}
                              {experience.location && ` • ${experience.location}`}
                            </Typography>
                            <Typography variant={isMobile ? "caption" : "body2"} color="text.secondary" sx={{ 
                              wordBreak: 'break-word',
                            }}>
                              {formatDateForDisplay(experience.startDate)} - {
                                experience.isOngoing ? 'Present' : formatDateForDisplay(experience.endDate || '')
                              }
                              {calculateDuration(experience.startDate, experience.endDate || '', experience.isOngoing || false) && 
                                ` (${calculateDuration(experience.startDate, experience.endDate || '', experience.isOngoing || false)})`}
                            </Typography>
                          </Box>
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteVolunteerExperience(index);
                            }}
                            color="error"
                            size="small"
                            sx={{ mt: isMobile ? 0 : -0.5 }}
                          >
                            <Delete />
                          </IconButton>
                        </Box>
                      </AccordionSummary>
                      
                      <AccordionDetails sx={{ pt: 0 }}>
                        <Grid container spacing={3}>
                          {/* Basic Information */}
                          <Grid item xs={12}>
                            <Typography variant="subtitle2" color="primary" gutterBottom>
                              Basic Information
                            </Typography>
                            <Grid container spacing={isMobile ? 2 : 3}>
                              <Grid item xs={12} sm={6}>
                                <TextField
                                  fullWidth
                                  label="Role/Position"
                                  value={experience.role}
                                  onChange={(e) => updateVolunteerExperience(index, 'role', e.target.value)}
                                  required
                                  placeholder="e.g., Youth Mentor, Event Coordinator"
                                  size={isMobile ? "medium" : "small"}
                                />
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <TextField
                                  fullWidth
                                  label="Organization"
                                  value={experience.organization}
                                  onChange={(e) => updateVolunteerExperience(index, 'organization', e.target.value)}
                                  required
                                  placeholder="e.g., Red Cross, Local Food Bank"
                                  size={isMobile ? "medium" : "small"}
                                />
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <TextField
                                  fullWidth
                                  label="Location (Optional)"
                                  value={experience.location || ''}
                                  onChange={(e) => updateVolunteerExperience(index, 'location', e.target.value)}
                                  placeholder="e.g., Boston, MA"
                                  size={isMobile ? "medium" : "small"}
                                />
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <Box sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  height: isMobile ? 'auto' : '40px',
                                  mt: isMobile ? 1 : 0 
                                }}>
                                  <FormControlLabel
                                    control={
                                      <Switch
                                        checked={experience.isOngoing || false}
                                        onChange={(e) => updateVolunteerExperience(index, 'isOngoing', e.target.checked)}
                                      />
                                    }
                                    label="Currently active"
                                  />
                                </Box>
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <DatePicker
                                  label="Start Date"
                                  value={experience.startDate ? dayjs(experience.startDate) : null}
                                  onChange={(date) => updateVolunteerExperience(index, 'startDate', date?.format('YYYY-MM-DD'))}
                                  slotProps={{
                                    textField: {
                                      fullWidth: true,
                                      required: true,
                                      size: isMobile ? "medium" : "small",
                                    }
                                  }}
                                />
                              </Grid>
                              {!experience.isOngoing && (
                                <Grid item xs={12} sm={6}>
                                  <DatePicker
                                    label="End Date"
                                    value={experience.endDate ? dayjs(experience.endDate) : null}
                                    onChange={(date) => updateVolunteerExperience(index, 'endDate', date?.format('YYYY-MM-DD'))}
                                    slotProps={{
                                      textField: {
                                        fullWidth: true,
                                        size: isMobile ? "medium" : "small",
                                      }
                                    }}
                                  />
                                </Grid>
                              )}
                            </Grid>
                          </Grid>

                          <Divider />

                          {/* Description */}
                          <Grid item xs={12}>
                            <Typography variant="subtitle2" color="primary" gutterBottom>
                              Description & Responsibilities
                            </Typography>
                            <TextField
                              fullWidth
                              multiline
                              rows={isMobile ? 4 : 3}
                              label="Description"
                              value={experience.description}
                              onChange={(e) => updateVolunteerExperience(index, 'description', e.target.value)}
                              placeholder="Describe your role, responsibilities, and the organization's mission. What did you do and why was it meaningful?"
                              size={isMobile ? "medium" : "small"}
                            />
                          </Grid>

                          {/* Achievements & Impact */}
                          <Grid item xs={12}>
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: isMobile ? 'flex-start' : 'center', 
                              justifyContent: 'space-between', 
                              mb: 2,
                              flexDirection: isMobile ? 'column' : 'row',
                              gap: isMobile ? 1 : 0,
                            }}>
                              <Typography variant="subtitle2" color="primary">
                                Achievements & Impact
                              </Typography>
                              <Button
                                size={isMobile ? "medium" : "small"}
                                startIcon={<Add />}
                                onClick={() => addAchievement(index)}
                                fullWidth={isMobile}
                              >
                                Add Achievement
                              </Button>
                            </Box>
                            {experience.achievements.map((achievement, achIndex) => (
                              <Box key={achIndex} sx={{ 
                                display: 'flex', 
                                gap: 1, 
                                mb: 2,
                                flexDirection: isMobile ? 'column' : 'row',
                              }}>
                                <TextField
                                  fullWidth
                                  multiline
                                  rows={isMobile ? 3 : 2}
                                  placeholder="e.g., Organized fundraising event that raised $5,000 for local families in need"
                                  value={achievement}
                                  onChange={(e) => updateAchievement(index, achIndex, e.target.value)}
                                  size={isMobile ? "medium" : "small"}
                                />
                                {isMobile ? (
                                  <Button
                                    onClick={() => deleteAchievement(index, achIndex)}
                                    disabled={experience.achievements.length === 1}
                                    color="error"
                                    size="small"
                                    startIcon={<Delete />}
                                    sx={{ alignSelf: 'flex-end' }}
                                  >
                                    Remove
                                  </Button>
                                ) : (
                                  <IconButton
                                    onClick={() => deleteAchievement(index, achIndex)}
                                    disabled={experience.achievements.length === 1}
                                    color="error"
                                    size="small"
                                  >
                                    <Delete />
                                  </IconButton>
                                )}
                              </Box>
                            ))}
                            {experience.achievements.every(a => !a.trim()) && (
                              <Alert severity="info" sx={{ mt: 1 }}>
                                Add specific achievements, impact metrics, or skills gained through this volunteer experience.
                              </Alert>
                            )}
                          </Grid>
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  </Fade>
                ))}
              </Box>
            </Grid>
          ) : (
            /* Empty State */
            <Grid item xs={12}>
              <Card sx={{ textAlign: 'center', py: 8, bgcolor: 'grey.50' }}>
                <CardContent>
                  <VolunteerActivism sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No volunteer activities added yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Add your volunteer work and extracurricular activities to show leadership, initiative, and community involvement. 
                    These experiences demonstrate valuable soft skills and personal values.
                  </Typography>
                  <Button
                    startIcon={<Add />}
                    onClick={addVolunteerExperience}
                    variant="contained"
                    size="large"
                  >
                    Add Your First Activity
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Tips */}
          <Grid item xs={12}>
            <Alert severity="info">
              <Typography variant="body2">
                <strong>Volunteer Activity Tips:</strong>
              </Typography>
              <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                <li>Include volunteer work that demonstrates relevant skills for your target role</li>
                <li>Quantify your impact when possible (hours volunteered, funds raised, people helped)</li>
                <li>Show leadership roles and progression over time</li>
                <li>Include ongoing commitments to show consistency and dedication</li>
                <li>Highlight activities that align with your career goals or target company values</li>
                <li>Don't forget student government, club leadership, or sports team participation</li>
              </ul>
            </Alert>
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider>
  );
};

export default EnhancedVolunteerStep;
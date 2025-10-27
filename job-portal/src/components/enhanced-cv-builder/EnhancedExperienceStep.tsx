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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Chip,
  Alert,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  FormControlLabel,
  Switch,
  useTheme,
  useMediaQuery,
  Tooltip,
  Fade,
  Zoom,
} from '@mui/material';
import {
  Add,
  Delete,
  Edit,
  ExpandMore,
  Work,
  AutoFixHigh,
  TrendingUp,
  CalendarToday,
  Business,
  LocationOn,
  CheckCircle,
  Warning,
  Lightbulb,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import cvBuilderService from '../../services/cvBuilderService';

interface Experience {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  isCurrentRole: boolean;
  responsibilities: string[];
  achievements: string[];
  technologies: string[];
  description: string;
}

interface EnhancedExperienceStepProps {
  data: Experience[];
  onChange: (data: Experience[]) => void;
}

const defaultExperience: Experience = {
  id: '',
  jobTitle: '',
  company: '',
  location: '',
  startDate: '',
  endDate: '',
  isCurrentRole: false,
  responsibilities: [''],
  achievements: [''],
  technologies: [],
  description: '',
};

const EnhancedExperienceStep: React.FC<EnhancedExperienceStepProps> = ({
  data,
  onChange,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [editingIndex, setEditingIndex] = useState<number>(-1);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [generatingAchievements, setGeneratingAchievements] = useState(false);
  const [selectedExperienceIndex, setSelectedExperienceIndex] = useState<number>(-1);
  const [expandedAccordion, setExpandedAccordion] = useState<number>(0);

  const addExperience = () => {
    const newExperience: Experience = {
      ...defaultExperience,
      id: Date.now().toString(),
    };
    onChange([...data, newExperience]);
    setEditingIndex(data.length);
    setExpandedAccordion(data.length);
  };

  const deleteExperience = (index: number) => {
    const newData = data.filter((_, i) => i !== index);
    onChange(newData);
    if (editingIndex === index) {
      setEditingIndex(-1);
    }
  };

  const updateExperience = (index: number, field: keyof Experience, value: any) => {
    const newData = [...data];
    newData[index] = { ...newData[index], [field]: value };
    
    // If setting current role, clear end date
    if (field === 'isCurrentRole' && value) {
      newData[index].endDate = '';
    }
    
    onChange(newData);
  };

  const addResponsibility = (experienceIndex: number) => {
    const newData = [...data];
    newData[experienceIndex].responsibilities.push('');
    onChange(newData);
  };

  const updateResponsibility = (experienceIndex: number, responsibilityIndex: number, value: string) => {
    const newData = [...data];
    newData[experienceIndex].responsibilities[responsibilityIndex] = value;
    onChange(newData);
  };

  const deleteResponsibility = (experienceIndex: number, responsibilityIndex: number) => {
    const newData = [...data];
    newData[experienceIndex].responsibilities = newData[experienceIndex].responsibilities.filter(
      (_, i) => i !== responsibilityIndex
    );
    onChange(newData);
  };

  const addAchievement = (experienceIndex: number) => {
    const newData = [...data];
    newData[experienceIndex].achievements.push('');
    onChange(newData);
  };

  const updateAchievement = (experienceIndex: number, achievementIndex: number, value: string) => {
    const newData = [...data];
    newData[experienceIndex].achievements[achievementIndex] = value;
    onChange(newData);
  };

  const deleteAchievement = (experienceIndex: number, achievementIndex: number) => {
    const newData = [...data];
    newData[experienceIndex].achievements = newData[experienceIndex].achievements.filter(
      (_, i) => i !== achievementIndex
    );
    onChange(newData);
  };

  const generateAIAchievements = async (experienceIndex: number) => {
    const experience = data[experienceIndex];
    if (!experience.jobTitle || !experience.company) {
      return;
    }

    try {
      setGeneratingAchievements(true);
      const achievements = await cvBuilderService.generateAchievements(
        experience.jobTitle,
        experience.company,
        experience.responsibilities.filter(r => r.trim())
      );
      
      const newData = [...data];
      newData[experienceIndex].achievements = achievements;
      onChange(newData);
      setAiDialogOpen(false);
    } catch (error) {
      console.error('Failed to generate achievements:', error);
    } finally {
      setGeneratingAchievements(false);
    }
  };

  const getExperienceCompletionScore = (experience: Experience): number => {
    let score = 0;
    if (experience.jobTitle) score += 20;
    if (experience.company) score += 20;
    if (experience.startDate) score += 15;
    if (experience.endDate || experience.isCurrentRole) score += 15;
    if (experience.responsibilities.some(r => r.trim())) score += 15;
    if (experience.achievements.some(a => a.trim())) score += 15;
    return score;
  };

  const getOverallCompletionScore = (): number => {
    if (data.length === 0) return 0;
    const totalScore = data.reduce((sum, exp) => sum + getExperienceCompletionScore(exp), 0);
    return Math.round(totalScore / data.length);
  };

  const formatDateForDisplay = (dateString: string): string => {
    if (!dateString) return '';
    return dayjs(dateString).format('MMM YYYY');
  };

  const calculateDuration = (startDate: string, endDate: string, isCurrentRole: boolean): string => {
    if (!startDate) return '';
    
    const start = dayjs(startDate);
    const end = isCurrentRole ? dayjs() : dayjs(endDate);
    
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

  const getTipsForExperience = (experience: Experience): string[] => {
    const tips: string[] = [];
    
    if (!experience.jobTitle) tips.push('Add your job title');
    if (!experience.company) tips.push('Add company name');
    if (!experience.achievements.some(a => a.trim())) {
      tips.push('Add quantifiable achievements (use numbers, percentages, or results)');
    }
    if (experience.responsibilities.length < 3) {
      tips.push('Add at least 3 key responsibilities');
    }
    if (!experience.startDate) tips.push('Add start date');
    if (!experience.endDate && !experience.isCurrentRole) tips.push('Add end date or mark as current role');
    
    return tips;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        {/* Header with completion status */}
        <Card sx={{ mb: 3, bgcolor: 'background.paper' }}>
          <CardContent sx={{ py: 2 }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: isMobile ? 'flex-start' : 'center', 
              justifyContent: 'space-between', 
              mb: 2,
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? 2 : 0,
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Work sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight="bold">
                  Work Experience
                </Typography>
              </Box>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                flexDirection: isMobile ? 'column' : 'row',
                width: isMobile ? '100%' : 'auto',
              }}>
                <Typography variant="body2" color="text.secondary">
                  {getOverallCompletionScore()}% Complete
                </Typography>
                <Button
                  startIcon={<Add />}
                  onClick={addExperience}
                  variant="contained"
                  size={isMobile ? "medium" : "small"}
                  fullWidth={isMobile}
                >
                  Add Experience
                </Button>
              </Box>
            </Box>

            {data.length > 0 && (
              <Alert severity="info" sx={{ mb: 2 }}>
                💡 <strong>Pro Tip:</strong> Use action verbs (managed, developed, increased) and include specific numbers or percentages to make your achievements stand out.
              </Alert>
            )}
          </CardContent>
        </Card>

        {data.length === 0 ? (
          <Card sx={{ textAlign: 'center', py: 8 }}>
            <CardContent>
              <Work sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No work experience added yet
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Add your professional experience to showcase your career journey.
                Include internships, part-time jobs, and volunteer work if you're just starting out.
              </Typography>
              <Button
                startIcon={<Add />}
                onClick={addExperience}
                variant="contained"
                size="large"
              >
                Add Your First Experience
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Box sx={{ space: 2 }}>
            {data.map((experience, index) => (
              <Fade in={true} key={experience.id} timeout={300 * (index + 1)}>
                <Accordion
                  expanded={expandedAccordion === index}
                  onChange={() => setExpandedAccordion(expandedAccordion === index ? -1 : index)}
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
                            {experience.jobTitle || 'Job Title'}
                          </Typography>
                          {experience.isCurrentRole && (
                            <Chip label="Current" size="small" color="success" />
                          )}
                          <Chip
                            label={`${getExperienceCompletionScore(experience)}%`}
                            size="small"
                            color={getExperienceCompletionScore(experience) >= 80 ? 'success' : 
                                   getExperienceCompletionScore(experience) >= 50 ? 'warning' : 'error'}
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ 
                          wordBreak: 'break-word',
                          display: isMobile ? 'block' : 'inline',
                        }}>
                          {experience.company || 'Company'}
                          {!isMobile && ' • '}
                          {isMobile && <br />}
                          {experience.location || 'Location'}
                        </Typography>
                        <Typography variant={isMobile ? "caption" : "body2"} color="text.secondary" sx={{ 
                          mt: isMobile ? 0.5 : 0,
                          wordBreak: 'break-word',
                        }}>
                          {formatDateForDisplay(experience.startDate)} - {
                            experience.isCurrentRole ? 'Present' : formatDateForDisplay(experience.endDate)
                          }
                          {calculateDuration(experience.startDate, experience.endDate, experience.isCurrentRole) && 
                            ` (${calculateDuration(experience.startDate, experience.endDate, experience.isCurrentRole)})`}
                        </Typography>
                      </Box>
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteExperience(index);
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
                              label="Job Title"
                              value={experience.jobTitle}
                              onChange={(e) => updateExperience(index, 'jobTitle', e.target.value)}
                              required
                              placeholder="e.g., Senior Software Engineer"
                              size={isMobile ? "medium" : "small"}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Company"
                              value={experience.company}
                              onChange={(e) => updateExperience(index, 'company', e.target.value)}
                              required
                              placeholder="e.g., Google, Microsoft"
                              size={isMobile ? "medium" : "small"}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Location"
                              value={experience.location}
                              onChange={(e) => updateExperience(index, 'location', e.target.value)}
                              placeholder="e.g., San Francisco, CA"
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
                                    checked={experience.isCurrentRole}
                                    onChange={(e) => updateExperience(index, 'isCurrentRole', e.target.checked)}
                                  />
                                }
                                label="I currently work here"
                              />
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <DatePicker
                              label="Start Date"
                              value={experience.startDate ? dayjs(experience.startDate) : null}
                              onChange={(date) => updateExperience(index, 'startDate', date?.format('YYYY-MM-DD'))}
                              slotProps={{
                                textField: {
                                  fullWidth: true,
                                  required: true,
                                  size: isMobile ? "medium" : "small",
                                }
                              }}
                            />
                          </Grid>
                          {!experience.isCurrentRole && (
                            <Grid item xs={12} sm={6}>
                              <DatePicker
                                label="End Date"
                                value={experience.endDate ? dayjs(experience.endDate) : null}
                                onChange={(date) => updateExperience(index, 'endDate', date?.format('YYYY-MM-DD'))}
                                slotProps={{
                                  textField: {
                                    fullWidth: true,
                                    required: !experience.isCurrentRole,
                                    size: isMobile ? "medium" : "small",
                                  }
                                }}
                              />
                            </Grid>
                          )}
                        </Grid>
                      </Grid>

                      {/* Key Responsibilities */}
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
                            Key Responsibilities
                          </Typography>
                          <Button
                            size={isMobile ? "medium" : "small"}
                            startIcon={<Add />}
                            onClick={() => addResponsibility(index)}
                            fullWidth={isMobile}
                          >
                            Add Responsibility
                          </Button>
                        </Box>
                        {experience.responsibilities.map((responsibility, respIndex) => (
                          <Box key={respIndex} sx={{ 
                            display: 'flex', 
                            gap: 1, 
                            mb: 2,
                            flexDirection: isMobile ? 'column' : 'row',
                          }}>
                            <TextField
                              fullWidth
                              multiline
                              rows={isMobile ? 3 : 2}
                              placeholder="e.g., Developed and maintained web applications using React and Node.js"
                              value={responsibility}
                              onChange={(e) => updateResponsibility(index, respIndex, e.target.value)}
                              size={isMobile ? "medium" : "small"}
                            />
                            {isMobile ? (
                              <Button
                                onClick={() => deleteResponsibility(index, respIndex)}
                                disabled={experience.responsibilities.length === 1}
                                color="error"
                                size="small"
                                startIcon={<Delete />}
                                sx={{ alignSelf: 'flex-end' }}
                              >
                                Remove
                              </Button>
                            ) : (
                              <IconButton
                                onClick={() => deleteResponsibility(index, respIndex)}
                                disabled={experience.responsibilities.length === 1}
                                color="error"
                                size="small"
                              >
                                <Delete />
                              </IconButton>
                            )}
                          </Box>
                        ))}
                      </Grid>

                      {/* Key Achievements */}
                      <Grid item xs={12}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: isMobile ? 'flex-start' : 'center', 
                          justifyContent: 'space-between', 
                          mb: 2,
                          flexDirection: isMobile ? 'column' : 'row',
                          gap: isMobile ? 2 : 0,
                        }}>
                          <Typography variant="subtitle2" color="primary">
                            Key Achievements
                          </Typography>
                          <Box sx={{ 
                            display: 'flex', 
                            gap: 1,
                            flexDirection: isMobile ? 'column' : 'row',
                            width: isMobile ? '100%' : 'auto',
                          }}>
                            <Button
                              size={isMobile ? "medium" : "small"}
                              startIcon={generatingAchievements ? <CircularProgress size={16} /> : <AutoFixHigh />}
                              onClick={() => generateAIAchievements(index)}
                              disabled={generatingAchievements || !experience.jobTitle || !experience.company}
                              variant="outlined"
                              fullWidth={isMobile}
                            >
                              AI Generate
                            </Button>
                            <Button
                              size={isMobile ? "medium" : "small"}
                              startIcon={<Add />}
                              onClick={() => addAchievement(index)}
                              fullWidth={isMobile}
                            >
                              Add Achievement
                            </Button>
                          </Box>
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
                              placeholder="e.g., Increased system performance by 40% through database optimization"
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
                      </Grid>

                      {/* Tips and Suggestions */}
                      {getTipsForExperience(experience).length > 0 && (
                        <Grid item xs={12}>
                          <Alert severity="warning">
                            <Typography variant="subtitle2" gutterBottom>
                              💡 Suggestions to improve this experience:
                            </Typography>
                            <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                              {getTipsForExperience(experience).map((tip, tipIndex) => (
                                <li key={tipIndex}>{tip}</li>
                              ))}
                            </ul>
                          </Alert>
                        </Grid>
                      )}
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </Fade>
            ))}
          </Box>
        )}

        {/* Overall Tips */}
        {data.length > 0 && (
          <Card sx={{ mt: 3, bgcolor: 'info.light' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Lightbulb sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="subtitle1" fontWeight="bold" color="info.main">
                  Experience Section Best Practices
                </Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" paragraph>
                    <strong>Action Verbs:</strong> Start bullet points with strong action verbs like "developed," "managed," "increased," "implemented," "led," "optimized."
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Quantify Results:</strong> Include numbers, percentages, and concrete outcomes whenever possible.
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" paragraph>
                    <strong>Reverse Chronology:</strong> List experiences from most recent to oldest.
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Relevance:</strong> Emphasize experiences most relevant to your target role.
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default EnhancedExperienceStep;
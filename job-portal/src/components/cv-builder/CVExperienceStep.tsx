import React, { useState } from 'react';
import {
  Box,
  Grid,
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  Chip,
  Stack,
  Divider,
  Tooltip,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Add,
  Work,
  Edit,
  Delete,
  SmartToy,
  CalendarToday,
  Business,
  LocationOn,
  Star,
  TrendingUp,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { Experience } from '../../services/cvBuilderService';

interface CVExperienceStepProps {
  data: Experience[];
  onChange: (data: Experience[]) => void;
  onGenerateAIContent: (prompt: string, section: string) => Promise<string>;
}

const CVExperienceStep: React.FC<CVExperienceStepProps> = ({
  data,
  onChange,
  onGenerateAIContent,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [currentExperience, setCurrentExperience] = useState<Experience>({
    id: '',
    jobTitle: '',
    company: '',
    location: '',
    startDate: '',
    endDate: '',
    isCurrentJob: false,
    responsibilities: [''],
    achievements: [''],
  });
  const [generating, setGenerating] = useState<string | null>(null);

  const handleAddExperience = () => {
    setCurrentExperience({
      id: Date.now().toString(),
      jobTitle: '',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      isCurrentJob: false,
      responsibilities: [''],
      achievements: [''],
    });
    setEditingIndex(null);
    setDialogOpen(true);
  };

  const handleEditExperience = (index: number) => {
    setCurrentExperience(data[index]);
    setEditingIndex(index);
    setDialogOpen(true);
  };

  const handleDeleteExperience = (index: number) => {
    const newData = [...data];
    newData.splice(index, 1);
    onChange(newData);
  };

  const handleSaveExperience = () => {
    const newData = [...data];
    if (editingIndex !== null) {
      newData[editingIndex] = currentExperience;
    } else {
      newData.push(currentExperience);
    }
    onChange(newData);
    setDialogOpen(false);
  };

  const handleInputChange = (field: keyof Experience, value: any) => {
    setCurrentExperience(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const addResponsibility = () => {
    setCurrentExperience(prev => ({
      ...prev,
      responsibilities: [...prev.responsibilities, ''],
    }));
  };

  const updateResponsibility = (index: number, value: string) => {
    const newResponsibilities = [...currentExperience.responsibilities];
    newResponsibilities[index] = value;
    setCurrentExperience(prev => ({
      ...prev,
      responsibilities: newResponsibilities,
    }));
  };

  const removeResponsibility = (index: number) => {
    const newResponsibilities = [...currentExperience.responsibilities];
    newResponsibilities.splice(index, 1);
    setCurrentExperience(prev => ({
      ...prev,
      responsibilities: newResponsibilities,
    }));
  };

  const addAchievement = () => {
    setCurrentExperience(prev => ({
      ...prev,
      achievements: [...prev.achievements, ''],
    }));
  };

  const updateAchievement = (index: number, value: string) => {
    const newAchievements = [...currentExperience.achievements];
    newAchievements[index] = value;
    setCurrentExperience(prev => ({
      ...prev,
      achievements: newAchievements,
    }));
  };

  const removeAchievement = (index: number) => {
    const newAchievements = [...currentExperience.achievements];
    newAchievements.splice(index, 1);
    setCurrentExperience(prev => ({
      ...prev,
      achievements: newAchievements,
    }));
  };

  const generateResponsibilities = async () => {
    setGenerating('responsibilities');
    try {
      const prompt = `Generate 4-6 professional job responsibilities for a ${currentExperience.jobTitle} at ${currentExperience.company}. Make them specific, action-oriented, and relevant to the role.`;
      const content = await onGenerateAIContent(prompt, 'responsibilities');
      const responsibilities = content.split('\n').filter(r => r.trim());
      setCurrentExperience(prev => ({
        ...prev,
        responsibilities,
      }));
    } catch (error) {
      console.error('Failed to generate responsibilities:', error);
    } finally {
      setGenerating(null);
    }
  };

  const generateAchievements = async () => {
    setGenerating('achievements');
    try {
      const prompt = `Generate 3-4 measurable achievements for a ${currentExperience.jobTitle} at ${currentExperience.company}. Include metrics, percentages, or specific outcomes where possible.`;
      const content = await onGenerateAIContent(prompt, 'achievements');
      const achievements = content.split('\n').filter(a => a.trim());
      setCurrentExperience(prev => ({
        ...prev,
        achievements,
      }));
    } catch (error) {
      console.error('Failed to generate achievements:', error);
    } finally {
      setGenerating(null);
    }
  };

  const formatDateRange = (startDate: string, endDate: string, isCurrentJob: boolean) => {
    const start = dayjs(startDate).format('MMM YYYY');
    const end = isCurrentJob ? 'Present' : dayjs(endDate).format('MMM YYYY');
    return `${start} - ${end}`;
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="between" mb={3}>
        <Box display="flex" alignItems="center">
          <Work sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">Work Experience</Typography>
        </Box>
        
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddExperience}
        >
          Add Experience
        </Button>
      </Box>

      {data.length === 0 ? (
        <Card elevation={1} sx={{ textAlign: 'center', py: 4 }}>
          <CardContent>
            <Work sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" color="textSecondary" gutterBottom>
              No work experience added yet
            </Typography>
            <Typography variant="body2" color="textSecondary" mb={3}>
              Add your professional experience to showcase your career journey
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddExperience}
            >
              Add Your First Experience
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {data.map((experience, index) => (
            <Grid item xs={12} key={experience.id}>
              <Card elevation={1}>
                <CardContent>
                  <Box display="flex" alignItems="start" justifyContent="between">
                    <Box flexGrow={1}>
                      <Typography variant="h6" gutterBottom>
                        {experience.jobTitle}
                      </Typography>
                      
                      <Stack direction="row" spacing={2} alignItems="center" mb={1}>
                        <Box display="flex" alignItems="center">
                          <Business sx={{ mr: 0.5, fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {experience.company}
                          </Typography>
                        </Box>
                        
                        {experience.location && (
                          <Box display="flex" alignItems="center">
                            <LocationOn sx={{ mr: 0.5, fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              {experience.location}
                            </Typography>
                          </Box>
                        )}
                        
                        <Box display="flex" alignItems="center">
                          <CalendarToday sx={{ mr: 0.5, fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {formatDateRange(experience.startDate, experience.endDate || '', experience.isCurrentJob)}
                          </Typography>
                        </Box>
                      </Stack>

                      {experience.responsibilities.length > 0 && (
                        <Box mb={2}>
                          <Typography variant="subtitle2" gutterBottom>
                            Key Responsibilities:
                          </Typography>
                          <List dense>
                            {experience.responsibilities.filter(r => r.trim()).slice(0, 3).map((resp, idx) => (
                              <ListItem key={idx} sx={{ pl: 0 }}>
                                <ListItemText 
                                  primary={
                                    <Typography variant="body2">
                                      • {resp}
                                    </Typography>
                                  }
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      )}

                      {experience.achievements.length > 0 && experience.achievements.some(a => a.trim()) && (
                        <Box>
                          <Typography variant="subtitle2" gutterBottom color="success.main">
                            Key Achievements:
                          </Typography>
                          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            {experience.achievements.filter(a => a.trim()).slice(0, 2).map((achievement, idx) => (
                              <Chip
                                key={idx}
                                label={achievement}
                                size="small"
                                color="success"
                                variant="outlined"
                                icon={<Star />}
                              />
                            ))}
                          </Stack>
                        </Box>
                      )}
                    </Box>
                    
                    <Box display="flex" flexDirection="column" gap={1}>
                      <IconButton
                        size="small"
                        onClick={() => handleEditExperience(index)}
                        color="primary"
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteExperience(index)}
                        color="error"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Experience Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingIndex !== null ? 'Edit Experience' : 'Add Experience'}
        </DialogTitle>
        
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Job Title"
                value={currentExperience.jobTitle}
                onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Company"
                value={currentExperience.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location"
                value={currentExperience.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="City, Country"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={currentExperience.isCurrentJob}
                    onChange={(e) => handleInputChange('isCurrentJob', e.target.checked)}
                  />
                }
                label="Current Job"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Start Date"
                  value={currentExperience.startDate ? dayjs(currentExperience.startDate) : null}
                  onChange={(date) => handleInputChange('startDate', date?.format('YYYY-MM-DD') || '')}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
            
            {!currentExperience.isCurrentJob && (
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="End Date"
                    value={currentExperience.endDate ? dayjs(currentExperience.endDate) : null}
                    onChange={(date) => handleInputChange('endDate', date?.format('YYYY-MM-DD') || '')}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                      }
                    }}
                  />
                </LocalizationProvider>
              </Grid>
            )}
            
            {/* Responsibilities Section */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              
              <Box display="flex" alignItems="center" justifyContent="between" mb={2}>
                <Typography variant="subtitle1">Key Responsibilities</Typography>
                <Box>
                  <Tooltip title="Generate with AI">
                    <IconButton
                      onClick={generateResponsibilities}
                      disabled={generating === 'responsibilities'}
                      color="primary"
                      size="small"
                    >
                      {generating === 'responsibilities' ? (
                        <CircularProgress size={16} />
                      ) : (
                        <SmartToy />
                      )}
                    </IconButton>
                  </Tooltip>
                  <Button
                    size="small"
                    onClick={addResponsibility}
                    startIcon={<Add />}
                  >
                    Add
                  </Button>
                </Box>
              </Box>
              
              {currentExperience.responsibilities.map((responsibility, index) => (
                <Box key={index} display="flex" alignItems="center" gap={1} mb={1}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Describe your key responsibility..."
                    value={responsibility}
                    onChange={(e) => updateResponsibility(index, e.target.value)}
                    multiline
                    maxRows={3}
                  />
                  <IconButton
                    size="small"
                    onClick={() => removeResponsibility(index)}
                    color="error"
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Grid>
            
            {/* Achievements Section */}
            <Grid item xs={12}>
              <Box display="flex" alignItems="center" justifyContent="between" mb={2}>
                <Typography variant="subtitle1">Key Achievements</Typography>
                <Box>
                  <Tooltip title="Generate with AI">
                    <IconButton
                      onClick={generateAchievements}
                      disabled={generating === 'achievements'}
                      color="primary"
                      size="small"
                    >
                      {generating === 'achievements' ? (
                        <CircularProgress size={16} />
                      ) : (
                        <SmartToy />
                      )}
                    </IconButton>
                  </Tooltip>
                  <Button
                    size="small"
                    onClick={addAchievement}
                    startIcon={<Add />}
                  >
                    Add
                  </Button>
                </Box>
              </Box>
              
              {currentExperience.achievements.map((achievement, index) => (
                <Box key={index} display="flex" alignItems="center" gap={1} mb={1}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Describe your achievement with metrics (e.g., Increased sales by 30%)"
                    value={achievement}
                    onChange={(e) => updateAchievement(index, e.target.value)}
                    multiline
                    maxRows={3}
                  />
                  <IconButton
                    size="small"
                    onClick={() => removeAchievement(index)}
                    color="error"
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveExperience}
            variant="contained"
            disabled={!currentExperience.jobTitle || !currentExperience.company}
          >
            {editingIndex !== null ? 'Update' : 'Add'} Experience
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CVExperienceStep;
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
  Chip,
  Stack,
  Divider,
  FormControlLabel,
  Switch,
  Tooltip,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Add,
  Code,
  Edit,
  Delete,
  SmartToy,
  CalendarToday,
  Launch,
  GitHub,
  Star,
  Public,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { Project } from '../../services/cvBuilderService';

interface CVProjectsStepProps {
  data: Project[];
  onChange: (data: Project[]) => void;
  onGenerateAIContent: (prompt: string, section: string) => Promise<string>;
}

const CVProjectsStep: React.FC<CVProjectsStepProps> = ({
  data,
  onChange,
  onGenerateAIContent,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [currentProject, setCurrentProject] = useState<Project>({
    id: '',
    name: '',
    description: '',
    technologies: [],
    startDate: '',
    endDate: '',
    isOngoing: false,
    url: '',
    repositoryUrl: '',
    role: '',
    achievements: [],
  });
  const [currentTechnology, setCurrentTechnology] = useState('');
  const [currentAchievement, setCurrentAchievement] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const handleOpenDialog = (project?: Project, index?: number) => {
    if (project && index !== undefined) {
      setCurrentProject({ ...project });
      setEditingIndex(index);
    } else {
      setCurrentProject({
        id: Date.now().toString(),
        name: '',
        description: '',
        technologies: [],
        startDate: '',
        endDate: '',
        isOngoing: false,
        url: '',
        repositoryUrl: '',
        role: '',
        achievements: [],
      });
      setEditingIndex(null);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setCurrentProject({
      id: '',
      name: '',
      description: '',
      technologies: [],
      startDate: '',
      endDate: '',
      isOngoing: false,
      url: '',
      repositoryUrl: '',
      role: '',
      achievements: [],
    });
    setEditingIndex(null);
  };

  const handleInputChange = (field: keyof Project, value: any) => {
    setCurrentProject(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddTechnology = () => {
    if (currentTechnology.trim() && !currentProject.technologies.includes(currentTechnology.trim())) {
      setCurrentProject(prev => ({
        ...prev,
        technologies: [...prev.technologies, currentTechnology.trim()]
      }));
      setCurrentTechnology('');
    }
  };

  const handleRemoveTechnology = (tech: string) => {
    setCurrentProject(prev => ({
      ...prev,
      technologies: prev.technologies.filter(t => t !== tech)
    }));
  };

  const handleAddAchievement = () => {
    if (currentAchievement.trim()) {
      setCurrentProject(prev => ({
        ...prev,
        achievements: [...prev.achievements, currentAchievement.trim()]
      }));
      setCurrentAchievement('');
    }
  };

  const handleRemoveAchievement = (index: number) => {
    setCurrentProject(prev => ({
      ...prev,
      achievements: prev.achievements.filter((_, i) => i !== index)
    }));
  };

  const handleSave = () => {
    if (editingIndex !== null) {
      const updatedData = [...data];
      updatedData[editingIndex] = currentProject;
      onChange(updatedData);
    } else {
      onChange([...data, currentProject]);
    }
    handleCloseDialog();
  };

  const handleDelete = (index: number) => {
    const updatedData = data.filter((_, i) => i !== index);
    onChange(updatedData);
  };

  const generateProjectDescription = async () => {
    if (!currentProject.name || !currentProject.role) {
      return;
    }

    setAiLoading(true);
    try {
      const prompt = `Generate a compelling project description for a ${currentProject.role} role in a project called "${currentProject.name}" using technologies: ${currentProject.technologies.join(', ')}. Focus on technical implementation and impact.`;
      const description = await onGenerateAIContent(prompt, 'project_description');
      handleInputChange('description', description);
    } catch (error) {
      console.error('Failed to generate project description:', error);
    } finally {
      setAiLoading(false);
    }
  };

  const generateProjectAchievements = async () => {
    if (!currentProject.name || !currentProject.description) {
      return;
    }

    setAiLoading(true);
    try {
      const prompt = `Generate 3-5 specific achievements for a project called "${currentProject.name}" with description: "${currentProject.description}". Focus on measurable impact and technical accomplishments.`;
      const achievementsText = await onGenerateAIContent(prompt, 'project_achievements');
      
      // Split the response into individual achievements
      const achievements = achievementsText
        .split('\n')
        .map(line => line.replace(/^[-*•]\s*/, '').trim())
        .filter(line => line.length > 10);
      
      handleInputChange('achievements', [...currentProject.achievements, ...achievements]);
    } catch (error) {
      console.error('Failed to generate achievements:', error);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" gutterBottom>
          Projects
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
          sx={{ borderRadius: 2 }}
        >
          Add Project
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" paragraph>
        Showcase your most impressive projects, side projects, or portfolio pieces that demonstrate your skills and expertise.
      </Typography>

      {data.length === 0 ? (
        <Card sx={{ textAlign: 'center', p: 4, backgroundColor: '#f8f9fa' }}>
          <Code sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No projects added yet
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Add your projects to showcase your technical skills and experience.
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
            Add Your First Project
          </Button>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {data.map((project, index) => (
            <Grid item xs={12} key={project.id}>
              <Card elevation={1} sx={{ '&:hover': { elevation: 2 } }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box flex={1}>
                      <Typography variant="h6" gutterBottom>
                        {project.name}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {project.role} | {dayjs(project.startDate).format('MMM YYYY')} - {
                          project.isOngoing ? 'Present' : project.endDate ? dayjs(project.endDate).format('MMM YYYY') : ''
                        }
                      </Typography>

                      <Typography variant="body2" paragraph>
                        {project.description}
                      </Typography>

                      {project.technologies.length > 0 && (
                        <Box mb={2}>
                          <Typography variant="subtitle2" gutterBottom>
                            Technologies:
                          </Typography>
                          <Stack direction="row" spacing={1} flexWrap="wrap">
                            {project.technologies.map((tech, techIndex) => (
                              <Chip key={techIndex} label={tech} size="small" variant="outlined" />
                            ))}
                          </Stack>
                        </Box>
                      )}

                      {project.achievements.length > 0 && (
                        <Box mb={2}>
                          <Typography variant="subtitle2" gutterBottom>
                            Key Achievements:
                          </Typography>
                          <List dense>
                            {project.achievements.map((achievement, achIndex) => (
                              <ListItem key={achIndex} sx={{ pl: 0, py: 0.5 }}>
                                <Star sx={{ fontSize: 16, mr: 1, color: 'primary.main' }} />
                                <ListItemText primary={achievement} />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      )}

                      <Box display="flex" gap={1} flexWrap="wrap">
                        {project.url && (
                          <Chip
                            icon={<Launch />}
                            label="Live Demo"
                            clickable
                            size="small"
                            onClick={() => window.open(project.url, '_blank')}
                          />
                        )}
                        {project.repositoryUrl && (
                          <Chip
                            icon={<GitHub />}
                            label="Repository"
                            clickable
                            size="small"
                            onClick={() => window.open(project.repositoryUrl, '_blank')}
                          />
                        )}
                      </Box>
                    </Box>
                    
                    <Box display="flex" flexDirection="column" gap={1}>
                      <IconButton onClick={() => handleOpenDialog(project, index)} size="small">
                        <Edit />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(index)} size="small" color="error">
                        <Delete />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Add/Edit Project Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingIndex !== null ? 'Edit Project' : 'Add Project'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="Project Name"
                value={currentProject.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., E-commerce Web Application"
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Your Role"
                value={currentProject.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
                placeholder="e.g., Full Stack Developer"
                required
              />
            </Grid>

            <Grid item xs={12}>
              <Box display="flex" alignItems="center" gap={2}>
                <TextField
                  fullWidth
                  label="Project Description"
                  value={currentProject.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  multiline
                  rows={3}
                  placeholder="Describe the project, its purpose, and your contributions"
                />
                <Tooltip title="Generate AI Description">
                  <IconButton 
                    onClick={generateProjectDescription}
                    disabled={aiLoading || !currentProject.name}
                    color="primary"
                  >
                    {aiLoading ? <CircularProgress size={20} /> : <SmartToy />}
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Start Date"
                  value={currentProject.startDate ? dayjs(currentProject.startDate) : null}
                  onChange={(date) => handleInputChange('startDate', date?.format('YYYY-MM-DD') || '')}
                  views={['year', 'month']}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={currentProject.isOngoing}
                    onChange={(e) => handleInputChange('isOngoing', e.target.checked)}
                  />
                }
                label="Currently Working On"
              />
            </Grid>

            {!currentProject.isOngoing && (
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="End Date"
                    value={currentProject.endDate ? dayjs(currentProject.endDate) : null}
                    onChange={(date) => handleInputChange('endDate', date?.format('YYYY-MM-DD') || '')}
                    views={['year', 'month']}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                      }
                    }}
                  />
                </LocalizationProvider>
              </Grid>
            )}

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Project URL"
                value={currentProject.url}
                onChange={(e) => handleInputChange('url', e.target.value)}
                placeholder="https://your-project.com"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Repository URL"
                value={currentProject.repositoryUrl}
                onChange={(e) => handleInputChange('repositoryUrl', e.target.value)}
                placeholder="https://github.com/username/repo"
              />
            </Grid>

            {/* Technologies Section */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Technologies & Tools
              </Typography>
              
              <Box display="flex" gap={2} mb={2}>
                <TextField
                  fullWidth
                  label="Add Technology"
                  value={currentTechnology}
                  onChange={(e) => setCurrentTechnology(e.target.value)}
                  placeholder="e.g., React, Node.js, MongoDB"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTechnology();
                    }
                  }}
                />
                <Button variant="outlined" onClick={handleAddTechnology}>
                  Add
                </Button>
              </Box>

              {currentProject.technologies.length > 0 && (
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {currentProject.technologies.map((tech, index) => (
                    <Chip
                      key={index}
                      label={tech}
                      onDelete={() => handleRemoveTechnology(tech)}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Stack>
              )}
            </Grid>

            {/* Achievements Section */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6">
                  Key Achievements
                </Typography>
                <Tooltip title="Generate AI Achievements">
                  <IconButton 
                    onClick={generateProjectAchievements}
                    disabled={aiLoading || !currentProject.description}
                    color="primary"
                  >
                    {aiLoading ? <CircularProgress size={20} /> : <SmartToy />}
                  </IconButton>
                </Tooltip>
              </Box>
              
              <Box display="flex" gap={2} mb={2}>
                <TextField
                  fullWidth
                  label="Add Achievement"
                  value={currentAchievement}
                  onChange={(e) => setCurrentAchievement(e.target.value)}
                  placeholder="e.g., Increased user engagement by 40%"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddAchievement();
                    }
                  }}
                />
                <Button variant="outlined" onClick={handleAddAchievement}>
                  Add
                </Button>
              </Box>

              {currentProject.achievements.length > 0 && (
                <List>
                  {currentProject.achievements.map((achievement, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={achievement} />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => handleRemoveAchievement(index)}
                          size="small"
                        >
                          <Delete />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            disabled={!currentProject.name || !currentProject.role}
          >
            {editingIndex !== null ? 'Update' : 'Add'} Project
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CVProjectsStep;
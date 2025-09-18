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
  FolderOpen,
  ExpandMore,
  Link as LinkIcon,
  GitHub,
  Launch,
  Code,
  BusinessCenter,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { Project } from '../../services/cvBuilderService';

interface EnhancedProjectsStepProps {
  data: Project[];
  onChange: (data: Project[]) => void;
  onAIHelp?: (action: string, data: any) => void;
}

const defaultProject: Omit<Project, 'id'> = {
  title: '',
  description: '',
  technologies: [],
  startDate: '',
  endDate: '',
  isOngoing: false,
  projectUrl: '',
  repositoryUrl: '',
  organization: '',
  role: '',
  achievements: [],
};

const commonTechnologies = [
  'React', 'Node.js', 'Python', 'JavaScript', 'TypeScript', 'Java', 'C#', 'PHP',
  'Angular', 'Vue.js', 'Next.js', 'Express.js', 'Django', 'Flask', 'Spring Boot',
  'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'AWS', 'Azure', 'GCP', 'Docker',
  'Kubernetes', 'Git', 'Jenkins', 'CI/CD', 'REST API', 'GraphQL'
];

const EnhancedProjectsStep: React.FC<EnhancedProjectsStepProps> = ({
  data,
  onChange,
  onAIHelp,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [expandedProject, setExpandedProject] = useState<number>(0);
  const [newTechnology, setNewTechnology] = useState('');

  const addProject = () => {
    const newProject: Project = {
      ...defaultProject,
      id: Date.now().toString(),
      startDate: dayjs().format('YYYY-MM-DD'),
    };
    onChange([...data, newProject]);
    setExpandedProject(data.length);
  };

  const updateProject = (index: number, field: keyof Project, value: any) => {
    const newData = [...data];
    newData[index] = { ...newData[index], [field]: value };
    
    // If setting as ongoing, clear end date
    if (field === 'isOngoing' && value) {
      newData[index].endDate = '';
    }
    
    onChange(newData);
  };

  const deleteProject = (index: number) => {
    const newData = data.filter((_, i) => i !== index);
    onChange(newData);
    if (expandedProject >= index && expandedProject > 0) {
      setExpandedProject(expandedProject - 1);
    }
  };

  const addTechnology = (projectIndex: number, technology: string) => {
    const project = data[projectIndex];
    if (technology.trim() && !project.technologies.includes(technology.trim())) {
      updateProject(projectIndex, 'technologies', [...project.technologies, technology.trim()]);
    }
  };

  const removeTechnology = (projectIndex: number, techIndex: number) => {
    const project = data[projectIndex];
    const newTechnologies = project.technologies.filter((_, i) => i !== techIndex);
    updateProject(projectIndex, 'technologies', newTechnologies);
  };

  const addAchievement = (projectIndex: number) => {
    const project = data[projectIndex];
    updateProject(projectIndex, 'achievements', [...(project.achievements || []), '']);
  };

  const updateAchievement = (projectIndex: number, achIndex: number, value: string) => {
    const project = data[projectIndex];
    const newAchievements = [...(project.achievements || [])];
    newAchievements[achIndex] = value;
    updateProject(projectIndex, 'achievements', newAchievements);
  };

  const removeAchievement = (projectIndex: number, achIndex: number) => {
    const project = data[projectIndex];
    const newAchievements = (project.achievements || []).filter((_, i) => i !== achIndex);
    updateProject(projectIndex, 'achievements', newAchievements);
  };

  const formatDateForDisplay = (dateString: string): string => {
    if (!dateString) return '';
    return dayjs(dateString).format('MMM YYYY');
  };

  const getProjectDuration = (startDate: string, endDate: string, isOngoing: boolean): string => {
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

  const getProjectCompletion = (project: Project): number => {
    let score = 0;
    if (project.title) score += 20;
    if (project.description) score += 25;
    if (project.technologies.length > 0) score += 20;
    if (project.startDate) score += 15;
    if (project.endDate || project.isOngoing) score += 10;
    if ((project.achievements || []).some(a => a.trim())) score += 10;
    return score;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        <Grid container spacing={3}>
          {/* Header Card */}
          <Grid item xs={12}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              mb: 3 
            }}>
              <CardContent sx={{ py: isMobile ? 2 : 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <FolderOpen sx={{ mr: 1, fontSize: 28 }} />
                  <Typography variant="h5" fontWeight="bold">
                    Projects & Achievements
                  </Typography>
                </Box>
                <Typography variant="body1" sx={{ opacity: 0.9, mb: 2 }}>
                  Showcase your best projects and measurable achievements to demonstrate your impact and capabilities.
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
                      label={`${data.length} Projects`}
                      sx={{ 
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        fontWeight: 'bold',
                      }}
                    />
                    {data.length >= 3 && (
                      <Chip 
                        label="✓ Strong Portfolio"
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
                    onClick={addProject}
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
                    Add Project
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Projects List */}
          {data.length > 0 ? (
            <Grid item xs={12}>
              <Box sx={{ space: 2 }}>
                {data.map((project, index) => (
                  <Fade in={true} key={project.id} timeout={300 * (index + 1)}>
                    <Accordion
                      expanded={expandedProject === index}
                      onChange={() => setExpandedProject(expandedProject === index ? -1 : index)}
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
                                {project.title || `Project ${index + 1}`}
                              </Typography>
                              {project.isOngoing && (
                                <Chip label="Ongoing" size="small" color="success" />
                              )}
                              <Chip
                                label={`${getProjectCompletion(project)}%`}
                                size="small"
                                color={getProjectCompletion(project) >= 80 ? 'success' : 
                                       getProjectCompletion(project) >= 50 ? 'warning' : 'error'}
                              />
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ 
                              wordBreak: 'break-word',
                              mb: 0.5,
                            }}>
                              {project.organization && `${project.organization} • `}
                              {project.role || 'Personal Project'}
                            </Typography>
                            <Typography variant={isMobile ? "caption" : "body2"} color="text.secondary" sx={{ 
                              wordBreak: 'break-word',
                            }}>
                              {formatDateForDisplay(project.startDate)} - {
                                project.isOngoing ? 'Present' : formatDateForDisplay(project.endDate || '')
                              }
                              {getProjectDuration(project.startDate, project.endDate || '', project.isOngoing || false) && 
                                ` (${getProjectDuration(project.startDate, project.endDate || '', project.isOngoing || false)})`}
                            </Typography>
                          </Box>
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteProject(index);
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
                                  label="Project Title"
                                  value={project.title}
                                  onChange={(e) => updateProject(index, 'title', e.target.value)}
                                  required
                                  placeholder="e.g., E-commerce Web Application"
                                  size={isMobile ? "medium" : "small"}
                                />
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <TextField
                                  fullWidth
                                  label="Organization (Optional)"
                                  value={project.organization || ''}
                                  onChange={(e) => updateProject(index, 'organization', e.target.value)}
                                  placeholder="e.g., ABC Company, University"
                                  size={isMobile ? "medium" : "small"}
                                />
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <TextField
                                  fullWidth
                                  label="Your Role"
                                  value={project.role || ''}
                                  onChange={(e) => updateProject(index, 'role', e.target.value)}
                                  placeholder="e.g., Full-Stack Developer, Team Lead"
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
                                        checked={project.isOngoing || false}
                                        onChange={(e) => updateProject(index, 'isOngoing', e.target.checked)}
                                      />
                                    }
                                    label="This is an ongoing project"
                                  />
                                </Box>
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <DatePicker
                                  label="Start Date"
                                  value={project.startDate ? dayjs(project.startDate) : null}
                                  onChange={(date) => updateProject(index, 'startDate', date?.format('YYYY-MM-DD'))}
                                  slotProps={{
                                    textField: {
                                      fullWidth: true,
                                      required: true,
                                      size: isMobile ? "medium" : "small",
                                    }
                                  }}
                                />
                              </Grid>
                              {!project.isOngoing && (
                                <Grid item xs={12} sm={6}>
                                  <DatePicker
                                    label="End Date"
                                    value={project.endDate ? dayjs(project.endDate) : null}
                                    onChange={(date) => updateProject(index, 'endDate', date?.format('YYYY-MM-DD'))}
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

                          {/* Project Description */}
                          <Grid item xs={12}>
                            <Typography variant="subtitle2" color="primary" gutterBottom>
                              Project Description
                            </Typography>
                            <TextField
                              fullWidth
                              multiline
                              rows={isMobile ? 4 : 3}
                              label="Description"
                              value={project.description}
                              onChange={(e) => updateProject(index, 'description', e.target.value)}
                              placeholder="Describe the project objectives, your contributions, and the impact. Include specific metrics when possible..."
                              size={isMobile ? "medium" : "small"}
                            />
                          </Grid>

                          {/* Technologies Used */}
                          <Grid item xs={12}>
                            <Typography variant="subtitle2" color="primary" gutterBottom>
                              Technologies & Tools
                            </Typography>
                            <Box sx={{ mb: 2 }}>
                              <Grid container spacing={1} alignItems="center">
                                <Grid item xs={12} sm={8}>
                                  <TextField
                                    fullWidth
                                    label="Add Technology"
                                    value={newTechnology}
                                    onChange={(e) => setNewTechnology(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        addTechnology(index, newTechnology);
                                        setNewTechnology('');
                                      }
                                    }}
                                    placeholder="e.g., React, Node.js, MongoDB"
                                    size="small"
                                  />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                  <Button
                                    onClick={() => {
                                      addTechnology(index, newTechnology);
                                      setNewTechnology('');
                                    }}
                                    startIcon={<Add />}
                                    disabled={!newTechnology.trim()}
                                    fullWidth={isMobile}
                                    size="small"
                                  >
                                    Add
                                  </Button>
                                </Grid>
                              </Grid>
                            </Box>
                            
                            {/* Common Technologies */}
                            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                              Quick add:
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
                              {commonTechnologies.slice(0, 10).map((tech) => (
                                <Chip
                                  key={tech}
                                  label={tech}
                                  size="small"
                                  onClick={() => {
                                    addTechnology(index, tech);
                                  }}
                                  variant="outlined"
                                  sx={{ 
                                    cursor: 'pointer',
                                    opacity: project.technologies.includes(tech) ? 0.5 : 1,
                                  }}
                                  disabled={project.technologies.includes(tech)}
                                />
                              ))}
                            </Box>

                            {/* Selected Technologies */}
                            {project.technologies.length > 0 && (
                              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                {project.technologies.map((tech, techIndex) => (
                                  <Chip
                                    key={techIndex}
                                    label={tech}
                                    onDelete={() => removeTechnology(index, techIndex)}
                                    color="primary"
                                    size="small"
                                  />
                                ))}
                              </Box>
                            )}
                          </Grid>

                          {/* Project Links */}
                          <Grid item xs={12}>
                            <Typography variant="subtitle2" color="primary" gutterBottom>
                              Project Links
                            </Typography>
                            <Grid container spacing={2}>
                              <Grid item xs={12} sm={6}>
                                <TextField
                                  fullWidth
                                  label="Project URL"
                                  value={project.projectUrl || ''}
                                  onChange={(e) => updateProject(index, 'projectUrl', e.target.value)}
                                  placeholder="https://myproject.com"
                                  size={isMobile ? "medium" : "small"}
                                  InputProps={{
                                    startAdornment: <Launch sx={{ mr: 1, color: 'action.active' }} />
                                  }}
                                />
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <TextField
                                  fullWidth
                                  label="Repository URL"
                                  value={project.repositoryUrl || ''}
                                  onChange={(e) => updateProject(index, 'repositoryUrl', e.target.value)}
                                  placeholder="https://github.com/username/project"
                                  size={isMobile ? "medium" : "small"}
                                  InputProps={{
                                    startAdornment: <GitHub sx={{ mr: 1, color: 'action.active' }} />
                                  }}
                                />
                              </Grid>
                            </Grid>
                          </Grid>

                          {/* Key Achievements */}
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
                                Key Achievements & Impact
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
                            {(project.achievements || []).map((achievement, achIndex) => (
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
                                  placeholder="e.g., Increased user engagement by 45% through responsive design implementation"
                                  value={achievement}
                                  onChange={(e) => updateAchievement(index, achIndex, e.target.value)}
                                  size={isMobile ? "medium" : "small"}
                                />
                                {isMobile ? (
                                  <Button
                                    onClick={() => removeAchievement(index, achIndex)}
                                    color="error"
                                    size="small"
                                    startIcon={<Delete />}
                                    sx={{ alignSelf: 'flex-end' }}
                                  >
                                    Remove
                                  </Button>
                                ) : (
                                  <IconButton
                                    onClick={() => removeAchievement(index, achIndex)}
                                    color="error"
                                    size="small"
                                  >
                                    <Delete />
                                  </IconButton>
                                )}
                              </Box>
                            ))}
                            {(!project.achievements || project.achievements.length === 0) && (
                              <Alert severity="info" sx={{ mt: 1 }}>
                                Add quantifiable achievements to make your project stand out. Include metrics like performance improvements, user growth, or cost savings.
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
                  <FolderOpen sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No projects added yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Showcase your best projects to demonstrate your skills and achievements. Include personal projects, work projects, and significant contributions.
                  </Typography>
                  <Button
                    startIcon={<Add />}
                    onClick={addProject}
                    variant="contained"
                    size="large"
                  >
                    Add Your First Project
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Tips */}
          <Grid item xs={12}>
            <Alert severity="info">
              <Typography variant="body2">
                <strong>Project Tips:</strong>
              </Typography>
              <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                <li>Include 3-5 of your most relevant and impressive projects</li>
                <li>Use specific metrics and numbers to quantify your impact</li>
                <li>Link to live demos or repositories when possible</li>
                <li>Highlight technologies and skills relevant to your target role</li>
                <li>Show progression from simple to complex projects over time</li>
              </ul>
            </Alert>
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider>
  );
};

export default EnhancedProjectsStep;
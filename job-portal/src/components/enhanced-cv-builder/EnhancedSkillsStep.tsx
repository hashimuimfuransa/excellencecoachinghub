import React, { useState } from 'react';
import cvBuilderService from '../../services/cvBuilderService';
import {
  Box,
  Grid,
  TextField,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  IconButton,
  Autocomplete,
  Alert,
  LinearProgress,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  useMediaQuery,
  Paper,
  Stack,
  Tooltip,
  Zoom,
  Fade,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  Delete,
  Star,
  TrendingUp,
  Code,
  Business,
  Psychology,
  AutoFixHigh,
  CheckCircle,
  Warning,
  Lightbulb,
  Search,
} from '@mui/icons-material';

interface Skill {
  id: string;
  name: string;
  level: number; // 1-5 scale
  category: 'technical' | 'soft' | 'language' | 'other';
}

interface EnhancedSkillsStepProps {
  data: Skill[];
  onChange: (data: Skill[]) => void;
  onAIHelp?: (section: string, data: any) => void;
}

// Predefined skill suggestions
const skillSuggestions = {
  technical: [
    'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'TypeScript', 'SQL', 'Git',
    'AWS', 'Docker', 'MongoDB', 'PostgreSQL', 'REST APIs', 'GraphQL', 'HTML/CSS',
    'Angular', 'Vue.js', 'Express.js', 'Spring Boot', 'Django', 'Flask', 'Redis',
    'Kubernetes', 'Jenkins', 'Terraform', 'Linux', 'Windows Server', 'Azure',
  ],
  soft: [
    'Leadership', 'Communication', 'Problem Solving', 'Team Management', 'Project Management',
    'Time Management', 'Critical Thinking', 'Adaptability', 'Collaboration', 'Creativity',
    'Analytical Thinking', 'Decision Making', 'Conflict Resolution', 'Presentation Skills',
    'Customer Service', 'Sales', 'Marketing', 'Negotiation', 'Strategic Planning',
  ],
  language: [
    'English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Portuguese',
    'Italian', 'Russian', 'Arabic', 'Hindi', 'Korean', 'Dutch', 'Swedish',
  ],
};

const EnhancedSkillsStep: React.FC<EnhancedSkillsStepProps> = ({
  data,
  onChange,
  onAIHelp,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [newSkill, setNewSkill] = useState({ name: '', level: 3, category: 'technical' as const });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);

  const addSkill = () => {
    if (newSkill.name.trim()) {
      const skill: Skill = {
        id: Date.now().toString(),
        name: newSkill.name.trim(),
        level: newSkill.level,
        category: newSkill.category,
      };
      onChange([...data, skill]);
      setNewSkill({ name: '', level: 3, category: 'technical' });
    }
  };

  const removeSkill = (id: string) => {
    onChange(data.filter(skill => skill.id !== id));
  };

  const updateSkillLevel = (id: string, level: number) => {
    onChange(data.map(skill => 
      skill.id === id ? { ...skill, level } : skill
    ));
  };

  const addSuggestedSkill = (skillName: string, category: keyof typeof skillSuggestions) => {
    if (!data.some(skill => skill.name.toLowerCase() === skillName.toLowerCase())) {
      const skill: Skill = {
        id: Date.now().toString(),
        name: skillName,
        level: 3,
        category: category === 'language' ? 'language' : category === 'soft' ? 'soft' : 'technical',
      };
      onChange([...data, skill]);
    }
  };

  const getSkillsByCategory = (category: string) => {
    return data.filter(skill => skill.category === category);
  };

  const getLevelText = (level: number) => {
    const levels = ['', 'Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert'];
    return levels[level];
  };

  const getLevelColor = (level: number) => {
    if (level >= 4) return 'success';
    if (level >= 3) return 'primary';
    if (level >= 2) return 'warning';
    return 'error';
  };

  const completionPercentage = Math.min(100, (data.length / 8) * 100);

  const allSuggestions = [
    ...skillSuggestions.technical,
    ...skillSuggestions.soft,
    ...skillSuggestions.language,
  ];

  const handleGenerateAISkills = async (targetRole?: string) => {
    setAiGenerating(true);
    try {
      const profession = targetRole || 'general professional';
      const prompt = `Generate 8-12 relevant skills for a ${profession}. Include both technical and soft skills. Format as comma-separated values.`;
      
      const generatedSkills = await cvBuilderService.generateAIContent(prompt, 'skills');
      const skillNames = generatedSkills.split(',').map(s => s.trim()).filter(s => s);
      
      const newSkills: Skill[] = skillNames.slice(0, 12).map((skillName, index) => ({
        id: (Date.now() + index).toString(),
        name: skillName,
        level: Math.floor(Math.random() * 3) + 2, // Random level between 2-4
        category: skillSuggestions.technical.includes(skillName) ? 'technical' : 
                 skillSuggestions.soft.includes(skillName) ? 'soft' : 'technical',
      }));

      // Add only skills that don't already exist
      const existingSkillNames = data.map(s => s.name.toLowerCase());
      const uniqueNewSkills = newSkills.filter(skill => 
        !existingSkillNames.includes(skill.name.toLowerCase())
      );
      
      if (uniqueNewSkills.length > 0) {
        onChange([...data, ...uniqueNewSkills]);
        if (onAIHelp) {
          onAIHelp('generate-skills', { skills: uniqueNewSkills });
        }
      }
    } catch (error) {
      console.error('Failed to generate AI skills:', error);
      alert('Failed to generate skills. Please try again or add skills manually.');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleOptimizeSkills = async () => {
    if (data.length === 0) {
      alert('Please add some skills first before optimizing.');
      return;
    }

    setAiGenerating(true);
    try {
      const skillNames = data.map(s => s.name);
      const optimizedData = await cvBuilderService.optimizeSkillsForATS(skillNames);
      
      if (onAIHelp) {
        onAIHelp('optimize-skills', { optimizedSkills: optimizedData });
      }
    } catch (error) {
      console.error('Failed to optimize skills:', error);
      alert('Failed to optimize skills. Please try again.');
    } finally {
      setAiGenerating(false);
    }
  };

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Progress Header */}
        <Grid item xs={12}>
          <Paper 
            elevation={0}
            sx={{ 
              p: { xs: 3, md: 4 }, 
              mb: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: 3,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Star sx={{ mr: 2, fontSize: 32 }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    Skills & Expertise
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Showcase your professional capabilities
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h4" fontWeight="bold">
                  {data.length}
                </Typography>
                <Typography variant="caption">
                  Skills Added
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Progress</Typography>
                <Typography variant="body2">{Math.round(completionPercentage)}%</Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={completionPercentage}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: 4,
                  },
                }}
              />
            </Box>
            
            <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
              <Chip 
                label={data.length >= 8 ? '✓ Optimal Range' : data.length >= 6 ? '✓ Good Range' : data.length >= 3 ? 'Add More' : 'Get Started'}
                sx={{ 
                  bgcolor: data.length >= 6 ? 'rgba(76, 175, 80, 0.3)' : 'rgba(255, 193, 7, 0.3)',
                  color: 'white',
                  fontWeight: 'bold',
                  mb: 1,
                }}
              />
              <Chip 
                label="6-12 Recommended"
                variant="outlined"
                sx={{ 
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  color: 'white',
                  mb: 1,
                }}
              />
              <Button
                startIcon={aiGenerating ? <CircularProgress size={12} color="inherit" /> : <AutoFixHigh />}
                onClick={() => handleGenerateAISkills()}
                disabled={aiGenerating}
                variant="outlined"
                size="small"
                sx={{ 
                  borderColor: 'rgba(255, 255, 255, 0.7)',
                  color: 'white',
                  mb: 1,
                  '&:hover': {
                    borderColor: 'white',
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                {aiGenerating ? 'Generating...' : 'AI Generate Skills'}
              </Button>
            </Stack>
          </Paper>
        </Grid>

        {/* Add New Skill */}
        <Grid item xs={12}>
          <Card sx={{ 
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            overflow: 'visible',
          }}>
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: 'primary.light',
                    mr: 2,
                  }}
                >
                  <Add sx={{ color: 'primary.main', fontSize: 24 }} />
                </Box>
                <Typography variant="h6" fontWeight="bold">
                  Add New Skill
                </Typography>
              </Box>

              <Grid container spacing={3} alignItems="flex-end">
                <Grid item xs={12} sm={5}>
                  <Autocomplete
                    options={allSuggestions}
                    freeSolo
                    value={newSkill.name}
                    onInputChange={(event, newValue) => {
                      setNewSkill({ ...newSkill, name: newValue || '' });
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Skill Name"
                        placeholder="Type or select a skill..."
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <InputAdornment position="start">
                              <Search color="action" />
                            </InputAdornment>
                          ),
                        }}
                        sx={{ 
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            fontSize: { xs: '16px', md: '14px' },
                          }
                        }}
                      />
                    )}
                    sx={{ width: '100%' }}
                  />
                </Grid>

                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={newSkill.category}
                      onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value as any })}
                      label="Category"
                      sx={{ 
                        borderRadius: 2,
                        fontSize: { xs: '16px', md: '14px' },
                      }}
                    >
                      <MenuItem value="technical">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Code sx={{ mr: 1, fontSize: 18 }} />
                          Technical
                        </Box>
                      </MenuItem>
                      <MenuItem value="soft">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Psychology sx={{ mr: 1, fontSize: 18 }} />
                          Soft Skills
                        </Box>
                      </MenuItem>
                      <MenuItem value="language">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Business sx={{ mr: 1, fontSize: 18 }} />
                          Language
                        </Box>
                      </MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Level: {getLevelText(newSkill.level)}
                    </Typography>
                    <Slider
                      value={newSkill.level}
                      onChange={(e, value) => setNewSkill({ ...newSkill, level: value as number })}
                      min={1}
                      max={5}
                      step={1}
                      marks
                      sx={{ width: '100%' }}
                    />
                  </Box>
                </Grid>

                <Grid item xs={12} sm={2}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={addSkill}
                    disabled={!newSkill.name.trim()}
                    size="large"
                    sx={{ borderRadius: 2, py: 1.5 }}
                  >
                    Add Skill
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Skill Suggestions */}
        <Grid item xs={12}>
          <Card sx={{ 
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            overflow: 'visible',
          }}>
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: 'secondary.light',
                      mr: 2,
                    }}
                  >
                    <Lightbulb sx={{ color: 'secondary.main', fontSize: 24 }} />
                  </Box>
                  <Typography variant="h6" fontWeight="bold">
                    Skill Suggestions
                  </Typography>
                </Box>
                <Button
                  size="small"
                  onClick={() => setShowSuggestions(!showSuggestions)}
                >
                  {showSuggestions ? 'Hide' : 'Show'} Suggestions
                </Button>
              </Box>

              {showSuggestions && (
                <Fade in={showSuggestions}>
                  <Box>
                    {Object.entries(skillSuggestions).map(([category, skills]) => (
                      <Box key={category} sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ textTransform: 'capitalize' }}>
                          {category === 'soft' ? 'Soft Skills' : category} Skills
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {skills.slice(0, isMobile ? 10 : 15).map((skill) => {
                            const isAdded = data.some(s => s.name.toLowerCase() === skill.toLowerCase());
                            return (
                              <Chip
                                key={skill}
                                label={skill}
                                onClick={() => !isAdded && addSuggestedSkill(skill, category as keyof typeof skillSuggestions)}
                                variant={isAdded ? "filled" : "outlined"}
                                color={isAdded ? "success" : "default"}
                                disabled={isAdded}
                                icon={isAdded ? <CheckCircle /> : undefined}
                                sx={{
                                  cursor: isAdded ? 'default' : 'pointer',
                                  '&:hover': isAdded ? {} : {
                                    bgcolor: 'primary.light',
                                    color: 'primary.main',
                                  },
                                }}
                              />
                            );
                          })}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Fade>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Current Skills */}
        {data.length > 0 && (
          <Grid item xs={12}>
            <Card sx={{ 
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              overflow: 'visible',
            }}>
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: 'success.light',
                      mr: 2,
                    }}
                  >
                    <Star sx={{ color: 'success.main', fontSize: 24 }} />
                  </Box>
                  <Typography variant="h6" fontWeight="bold">
                    Your Skills ({data.length})
                  </Typography>
                </Box>

                <Grid container spacing={2}>
                  {data.map((skill) => (
                    <Grid item xs={12} sm={6} md={4} key={skill.id}>
                      <Zoom in={true}>
                        <Card variant="outlined" sx={{ 
                          borderRadius: 2,
                          '&:hover': {
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            transform: 'translateY(-2px)',
                          },
                          transition: 'all 0.2s ease',
                        }}>
                          <CardContent sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                              <Typography variant="subtitle1" fontWeight="medium" noWrap>
                                {skill.name}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={() => removeSkill(skill.id)}
                                color="error"
                              >
                                <Delete />
                              </IconButton>
                            </Box>
                            
                            <Chip
                              label={skill.category}
                              size="small"
                              color={skill.category === 'technical' ? 'primary' : skill.category === 'soft' ? 'secondary' : 'default'}
                              sx={{ mb: 2 }}
                            />

                            <Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                  Level
                                </Typography>
                                <Typography variant="body2" color={`${getLevelColor(skill.level)}.main`} fontWeight="medium">
                                  {getLevelText(skill.level)}
                                </Typography>
                              </Box>
                              <Slider
                                value={skill.level}
                                onChange={(e, value) => updateSkillLevel(skill.id, value as number)}
                                min={1}
                                max={5}
                                step={1}
                                size="small"
                                color={getLevelColor(skill.level) as any}
                                sx={{ width: '100%' }}
                              />
                            </Box>
                          </CardContent>
                        </Card>
                      </Zoom>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Skills Analytics */}
        <Grid item xs={12}>
          <Card sx={{ 
            borderRadius: 3,
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            overflow: 'visible',
          }}>
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                  Skills Overview
                </Typography>
                {data.length > 0 && (
                  <Button
                    startIcon={aiGenerating ? <CircularProgress size={16} color="inherit" /> : <TrendingUp />}
                    onClick={handleOptimizeSkills}
                    disabled={aiGenerating}
                    variant="outlined"
                    size="small"
                    color="primary"
                  >
                    {aiGenerating ? 'Optimizing...' : 'AI Optimize'}
                  </Button>
                )}
              </Box>
              
              <Grid container spacing={3}>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" fontWeight="bold" color="primary">
                      {getSkillsByCategory('technical').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Technical
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" fontWeight="bold" color="secondary">
                      {getSkillsByCategory('soft').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Soft Skills
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" fontWeight="bold" color="info">
                      {getSkillsByCategory('language').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Languages
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" fontWeight="bold" color="success">
                      {data.filter(s => s.level >= 4).length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Advanced+
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Recommendations */}
              <Box sx={{ mt: 3 }}>
                {data.length < 3 && (
                  <Alert severity="warning" sx={{ borderRadius: 2, mb: 2 }}>
                    <Typography variant="body2">
                      <strong>Add more skills:</strong> Include at least 3-6 skills for a comprehensive profile.
                    </Typography>
                  </Alert>
                )}
                
                {getSkillsByCategory('soft').length === 0 && (
                  <Alert severity="info" sx={{ borderRadius: 2, mb: 2 }}>
                    <Typography variant="body2">
                      <strong>Include soft skills:</strong> Employers value communication, leadership, and problem-solving abilities.
                    </Typography>
                  </Alert>
                )}

                {data.length >= 6 && (
                  <Alert severity="success" sx={{ borderRadius: 2 }}>
                    <Typography variant="body2">
                      <strong>Great skill coverage!</strong> Your skills section is well-rounded and comprehensive.
                    </Typography>
                  </Alert>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EnhancedSkillsStep;
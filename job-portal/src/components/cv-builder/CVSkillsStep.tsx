import React, { useState } from 'react';
import {
  Box,
  Grid,
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Autocomplete,
  LinearProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add,
  Star,
  Delete,
  Code,
  People,
  Language,
  Extension,
  SmartToy,
  Edit,
} from '@mui/icons-material';
import { Skill } from '../../services/cvBuilderService';

interface CVSkillsStepProps {
  data: Skill[];
  onChange: (data: Skill[]) => void;
  onGenerateAIContent: (prompt: string, section: string) => Promise<string>;
}

const skillSuggestions = {
  Technical: [
    'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'HTML/CSS',
    'Angular', 'Vue.js', 'PHP', 'C++', 'C#', '.NET', 'Swift', 'Kotlin',
    'Ruby', 'Go', 'Rust', 'TypeScript', 'AWS', 'Azure', 'Docker', 'Kubernetes',
    'Git', 'Linux', 'MongoDB', 'PostgreSQL', 'Redis', 'GraphQL', 'REST APIs'
  ],
  Soft: [
    'Leadership', 'Communication', 'Problem Solving', 'Team Collaboration',
    'Time Management', 'Adaptability', 'Critical Thinking', 'Creativity',
    'Project Management', 'Public Speaking', 'Negotiation', 'Customer Service',
    'Conflict Resolution', 'Strategic Planning', 'Decision Making', 'Mentoring'
  ],
  Language: [
    'English', 'Spanish', 'French', 'German', 'Chinese (Mandarin)',
    'Japanese', 'Korean', 'Arabic', 'Italian', 'Portuguese', 'Russian',
    'Hindi', 'Dutch', 'Swedish', 'Norwegian'
  ],
  Other: [
    'Microsoft Office', 'Adobe Creative Suite', 'Salesforce', 'Google Analytics',
    'Tableau', 'Power BI', 'Figma', 'Sketch', 'AutoCAD', 'MATLAB', 'R',
    'SPSS', 'Photoshop', 'Illustrator', 'InDesign', 'Premiere Pro'
  ]
};

const CVSkillsStep: React.FC<CVSkillsStepProps> = ({
  data,
  onChange,
  onGenerateAIContent,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [newSkill, setNewSkill] = useState<Skill>({
    id: '',
    name: '',
    level: 'Intermediate',
    category: 'Technical',
  });

  const skillCategories = ['Technical', 'Soft', 'Language', 'Other'] as const;

  const handleAddSkill = () => {
    setNewSkill({
      id: Date.now().toString(),
      name: '',
      level: 'Intermediate',
      category: 'Technical',
    });
    setEditingIndex(null);
    setDialogOpen(true);
  };

  const handleEditSkill = (index: number) => {
    setNewSkill(data[index]);
    setEditingIndex(index);
    setDialogOpen(true);
  };

  const handleDeleteSkill = (index: number) => {
    const newData = [...data];
    newData.splice(index, 1);
    onChange(newData);
  };

  const handleSaveSkill = () => {
    if (!newSkill.name.trim()) return;
    
    const newData = [...data];
    if (editingIndex !== null) {
      newData[editingIndex] = newSkill;
    } else {
      newData.push(newSkill);
    }
    onChange(newData);
    setDialogOpen(false);
  };

  const quickAddSkill = (skillName: string, category: Skill['category']) => {
    const skill: Skill = {
      id: Date.now().toString(),
      name: skillName,
      level: 'Intermediate',
      category,
    };
    onChange([...data, skill]);
  };

  const getSkillsByCategory = (category: Skill['category']) => {
    return data.filter(skill => skill.category === category);
  };

  const getLevelColor = (level: Skill['level']) => {
    switch (level) {
      case 'Beginner': return 'error';
      case 'Intermediate': return 'warning';
      case 'Advanced': return 'info';
      case 'Expert': return 'success';
      default: return 'primary';
    }
  };

  const getLevelProgress = (level: Skill['level']) => {
    switch (level) {
      case 'Beginner': return 25;
      case 'Intermediate': return 50;
      case 'Advanced': return 75;
      case 'Expert': return 100;
      default: return 50;
    }
  };

  const getCategoryIcon = (category: Skill['category']) => {
    switch (category) {
      case 'Technical': return <Code />;
      case 'Soft': return <People />;
      case 'Language': return <Language />;
      case 'Other': return <Extension />;
      default: return <Star />;
    }
  };

  const renderSkillsTab = (category: Skill['category'], index: number) => {
    const skills = getSkillsByCategory(category);
    
    return (
      <Box key={category} sx={{ py: 2 }}>
        {skills.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              No {category.toLowerCase()} skills added yet
            </Typography>
            <Typography variant="caption" color="textSecondary" mb={2} display="block">
              Add skills that are relevant to your target job
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {skills.map((skill, skillIndex) => {
              const originalIndex = data.findIndex(s => s.id === skill.id);
              return (
                <Grid item xs={12} sm={6} md={4} key={skill.id}>
                  <Card elevation={1} sx={{ height: '100%' }}>
                    <CardContent sx={{ pb: 1 }}>
                      <Box display="flex" alignItems="center" justifyContent="between" mb={1}>
                        <Typography variant="subtitle2" noWrap title={skill.name}>
                          {skill.name}
                        </Typography>
                        <Box>
                          <IconButton
                            size="small"
                            onClick={() => handleEditSkill(originalIndex)}
                            sx={{ p: 0.5 }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteSkill(originalIndex)}
                            color="error"
                            sx={{ p: 0.5 }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                      
                      <Box mb={1}>
                        <Box display="flex" alignItems="center" justifyContent="between" mb={0.5}>
                          <Typography variant="caption" color="textSecondary">
                            {skill.level}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {getLevelProgress(skill.level)}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={getLevelProgress(skill.level)}
                          color={getLevelColor(skill.level)}
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
        
        {/* Quick Add Suggestions */}
        {skillSuggestions[category] && (
          <Box mt={3}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Quick add popular {category.toLowerCase()} skills:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {skillSuggestions[category]
                .filter(suggestion => !data.some(skill => skill.name.toLowerCase() === suggestion.toLowerCase()))
                .slice(0, 8)
                .map((suggestion) => (
                  <Chip
                    key={suggestion}
                    label={suggestion}
                    size="small"
                    variant="outlined"
                    onClick={() => quickAddSkill(suggestion, category)}
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
            </Stack>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="between" mb={3}>
        <Box display="flex" alignItems="center">
          <Star sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">Skills & Competencies</Typography>
        </Box>
        
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddSkill}
        >
          Add Skill
        </Button>
      </Box>

      {data.length === 0 ? (
        <Card elevation={1} sx={{ textAlign: 'center', py: 4 }}>
          <CardContent>
            <Star sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" color="textSecondary" gutterBottom>
              No skills added yet
            </Typography>
            <Typography variant="body2" color="textSecondary" mb={3}>
              Add your skills to showcase your expertise and competencies
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddSkill}
            >
              Add Your First Skill
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card elevation={1}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              variant="fullWidth"
            >
              {skillCategories.map((category, index) => (
                <Tab
                  key={category}
                  label={
                    <Box display="flex" alignItems="center" gap={1}>
                      {getCategoryIcon(category)}
                      <span>{category}</span>
                      <Chip
                        label={getSkillsByCategory(category).length}
                        size="small"
                        color="primary"
                        sx={{ ml: 1 }}
                      />
                    </Box>
                  }
                />
              ))}
            </Tabs>
          </Box>
          
          <CardContent>
            {skillCategories.map((category, index) => (
              activeTab === index && renderSkillsTab(category, index)
            ))}
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Skill Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingIndex !== null ? 'Edit Skill' : 'Add Skill'}
        </DialogTitle>
        
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Autocomplete
                freeSolo
                options={skillSuggestions[newSkill.category] || []}
                value={newSkill.name}
                onChange={(_, value) => setNewSkill(prev => ({ ...prev, name: value || '' }))}
                onInputChange={(_, value) => setNewSkill(prev => ({ ...prev, name: value || '' }))}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Skill Name"
                    required
                    placeholder="e.g., JavaScript, Leadership, Spanish"
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={newSkill.category}
                  label="Category"
                  onChange={(e) => setNewSkill(prev => ({ 
                    ...prev, 
                    category: e.target.value as Skill['category']
                  }))}
                >
                  {skillCategories.map((category) => (
                    <MenuItem key={category} value={category}>
                      <Box display="flex" alignItems="center">
                        {getCategoryIcon(category)}
                        <Typography sx={{ ml: 1 }}>{category}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Proficiency Level</InputLabel>
                <Select
                  value={newSkill.level}
                  label="Proficiency Level"
                  onChange={(e) => setNewSkill(prev => ({ 
                    ...prev, 
                    level: e.target.value as Skill['level']
                  }))}
                >
                  <MenuItem value="Beginner">
                    <Box display="flex" alignItems="center" width="100%">
                      <Typography flexGrow={1}>Beginner</Typography>
                      <LinearProgress
                        variant="determinate"
                        value={25}
                        color="error"
                        sx={{ width: 60, ml: 2 }}
                      />
                    </Box>
                  </MenuItem>
                  <MenuItem value="Intermediate">
                    <Box display="flex" alignItems="center" width="100%">
                      <Typography flexGrow={1}>Intermediate</Typography>
                      <LinearProgress
                        variant="determinate"
                        value={50}
                        color="warning"
                        sx={{ width: 60, ml: 2 }}
                      />
                    </Box>
                  </MenuItem>
                  <MenuItem value="Advanced">
                    <Box display="flex" alignItems="center" width="100%">
                      <Typography flexGrow={1}>Advanced</Typography>
                      <LinearProgress
                        variant="determinate"
                        value={75}
                        color="info"
                        sx={{ width: 60, ml: 2 }}
                      />
                    </Box>
                  </MenuItem>
                  <MenuItem value="Expert">
                    <Box display="flex" alignItems="center" width="100%">
                      <Typography flexGrow={1}>Expert</Typography>
                      <LinearProgress
                        variant="determinate"
                        value={100}
                        color="success"
                        sx={{ width: 60, ml: 2 }}
                      />
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="caption" color="textSecondary">
                <strong>Tip:</strong> Focus on skills that are relevant to your target job. 
                Use industry keywords that recruiters commonly search for.
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveSkill}
            variant="contained"
            disabled={!newSkill.name.trim()}
          >
            {editingIndex !== null ? 'Update' : 'Add'} Skill
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CVSkillsStep;
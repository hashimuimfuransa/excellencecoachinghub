import React, { memo, useCallback, useState } from 'react';
import {
  Box,
  TextField,
  Grid,
  Typography,
  Button,
  IconButton,
  Paper,
  Chip,
} from '@mui/material';
import { Add, Delete, Code } from '@mui/icons-material';
import { Project } from '../../services/cvBuilderService';

interface OptimizedProjectsStepProps {
  data: Project[];
  onChange: (section: string, data: Project[]) => void;
  onAIHelp: (action: string, data: any) => void;
}

const OptimizedProjectsStep: React.FC<OptimizedProjectsStepProps> = memo(({
  data,
  onChange,
  onAIHelp,
}) => {
  const [expandedIndex, setExpandedIndex] = useState<number>(0);

  const handleAddProject = useCallback(() => {
    const newProject: Project = {
      id: Date.now().toString(),
      title: '',
      description: '',
      technologies: [],
      startDate: '',
      endDate: '',
      isOngoing: false,
      projectUrl: '',
      repositoryUrl: '',
    };
    
    const updatedData = [...data, newProject];
    onChange('projects', updatedData);
    setExpandedIndex(updatedData.length - 1);
  }, [data, onChange]);

  const handleRemoveProject = useCallback((index: number) => {
    const updatedData = data.filter((_, i) => i !== index);
    onChange('projects', updatedData);
    if (expandedIndex >= updatedData.length) {
      setExpandedIndex(Math.max(0, updatedData.length - 1));
    }
  }, [data, onChange, expandedIndex]);

  const handleProjectChange = useCallback((index: number, field: keyof Project, value: any) => {
    const updatedData = [...data];
    updatedData[index] = {
      ...updatedData[index],
      [field]: value,
    };
    onChange('projects', updatedData);
  }, [data, onChange]);

  if (data.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Code sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
        <Typography variant="h6" color="textSecondary" gutterBottom>
          No projects added yet
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          Showcase your personal and professional projects
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddProject}
        >
          Add Project
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Projects ({data.length})</Typography>
        <Button variant="outlined" startIcon={<Add />} onClick={handleAddProject}>
          Add Project
        </Button>
      </Box>

      {data.map((project, index) => (
        <Paper
          key={project.id}
          sx={{
            p: 3,
            mb: 2,
            border: expandedIndex === index ? 2 : 1,
            borderColor: expandedIndex === index ? 'primary.main' : 'grey.300',
            cursor: 'pointer',
          }}
          onClick={() => setExpandedIndex(index)}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6">
                {project.title || 'Untitled Project'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {project.technologies?.slice(0, 3).join(', ')}
                {project.technologies?.length > 3 && ' & more...'}
              </Typography>
            </Box>
            <IconButton
              size="small"
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveProject(index);
              }}
            >
              <Delete />
            </IconButton>
          </Box>

          {expandedIndex === index && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Project Title *"
                  value={project.title}
                  onChange={(e) => handleProjectChange(index, 'title', e.target.value)}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description *"
                  value={project.description}
                  onChange={(e) => handleProjectChange(index, 'description', e.target.value)}
                  variant="outlined"
                  placeholder="Describe what this project does, your role, and key features..."
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="month"
                  value={project.startDate}
                  onChange={(e) => handleProjectChange(index, 'startDate', e.target.value)}
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="End Date"
                  type="month"
                  value={project.endDate}
                  onChange={(e) => handleProjectChange(index, 'endDate', e.target.value)}
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Project URL"
                  value={project.projectUrl || ''}
                  onChange={(e) => handleProjectChange(index, 'projectUrl', e.target.value)}
                  variant="outlined"
                  placeholder="https://..."
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Repository URL"
                  value={project.repositoryUrl || ''}
                  onChange={(e) => handleProjectChange(index, 'repositoryUrl', e.target.value)}
                  variant="outlined"
                  placeholder="https://github.com/..."
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Technologies Used
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {project.technologies?.map((tech, techIndex) => (
                    <Chip
                      key={techIndex}
                      label={tech}
                      onDelete={() => {
                        const updatedTech = project.technologies?.filter((_, i) => i !== techIndex) || [];
                        handleProjectChange(index, 'technologies', updatedTech);
                      }}
                      size="small"
                    />
                  ))}
                </Box>
                <TextField
                  fullWidth
                  placeholder="Add technology and press Enter"
                  variant="outlined"
                  size="small"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const target = e.target as HTMLInputElement;
                      const newTech = target.value.trim();
                      if (newTech && !project.technologies?.includes(newTech)) {
                        handleProjectChange(index, 'technologies', [
                          ...(project.technologies || []),
                          newTech
                        ]);
                        target.value = '';
                      }
                    }
                  }}
                />
              </Grid>
            </Grid>
          )}
        </Paper>
      ))}
    </Box>
  );
});

OptimizedProjectsStep.displayName = 'OptimizedProjectsStep';

export default OptimizedProjectsStep;
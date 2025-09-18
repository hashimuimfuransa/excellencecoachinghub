import React, { memo, useCallback, useState } from 'react';
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
} from '@mui/material';
import {
  Add,
  Delete,
  School,
} from '@mui/icons-material';
import { Education } from '../../services/cvBuilderService';

interface OptimizedEducationStepProps {
  data: Education[];
  onChange: (section: string, data: Education[]) => void;
  onAIHelp: (action: string, data: any) => void;
}

const OptimizedEducationStep: React.FC<OptimizedEducationStepProps> = memo(({
  data,
  onChange,
  onAIHelp,
}) => {
  const [expandedIndex, setExpandedIndex] = useState<number>(0);

  const handleAddEducation = useCallback(() => {
    const newEducation: Education = {
      id: Date.now().toString(),
      degree: '',
      institution: '',
      location: '',
      startDate: '',
      endDate: '',
      isOngoing: false,
      gpa: '',
      relevantCourses: [],
      achievements: [],
    };
    
    const updatedData = [...data, newEducation];
    onChange('education', updatedData);
    setExpandedIndex(updatedData.length - 1);
  }, [data, onChange]);

  const handleRemoveEducation = useCallback((index: number) => {
    const updatedData = data.filter((_, i) => i !== index);
    onChange('education', updatedData);
    if (expandedIndex >= updatedData.length) {
      setExpandedIndex(Math.max(0, updatedData.length - 1));
    }
  }, [data, onChange, expandedIndex]);

  const handleEducationChange = useCallback((index: number, field: keyof Education, value: any) => {
    const updatedData = [...data];
    updatedData[index] = {
      ...updatedData[index],
      [field]: value,
    };
    onChange('education', updatedData);
  }, [data, onChange]);

  if (data.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <School sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
        <Typography variant="h6" color="textSecondary" gutterBottom>
          No education added yet
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          Add your educational background to showcase your qualifications
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddEducation}
        >
          Add Education
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Education ({data.length})
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Add />}
          onClick={handleAddEducation}
        >
          Add Education
        </Button>
      </Box>

      {data.map((education, index) => (
        <Paper
          key={education.id}
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
                {education.degree || 'Untitled Degree'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {education.institution} • {education.startDate} - {education.isOngoing ? 'Present' : education.endDate}
              </Typography>
            </Box>
            <IconButton
              size="small"
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveEducation(index);
              }}
            >
              <Delete />
            </IconButton>
          </Box>

          {expandedIndex === index && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Degree *"
                  value={education.degree}
                  onChange={(e) => handleEducationChange(index, 'degree', e.target.value)}
                  variant="outlined"
                  placeholder="e.g., Bachelor of Science"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Institution *"
                  value={education.institution}
                  onChange={(e) => handleEducationChange(index, 'institution', e.target.value)}
                  variant="outlined"
                  placeholder="University/College name"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Location"
                  value={education.location}
                  onChange={(e) => handleEducationChange(index, 'location', e.target.value)}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="GPA"
                  value={education.gpa || ''}
                  onChange={(e) => handleEducationChange(index, 'gpa', e.target.value)}
                  variant="outlined"
                  placeholder="e.g., 3.8/4.0"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Start Date *"
                  type="month"
                  value={education.startDate}
                  onChange={(e) => handleEducationChange(index, 'startDate', e.target.value)}
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={education.isOngoing}
                      onChange={(e) => handleEducationChange(index, 'isOngoing', e.target.checked)}
                    />
                  }
                  label="Currently studying"
                />
              </Grid>
              {!education.isOngoing && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="End Date"
                    type="month"
                    value={education.endDate}
                    onChange={(e) => handleEducationChange(index, 'endDate', e.target.value)}
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              )}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Relevant Courses"
                  value={education.relevantCourses?.join(', ') || ''}
                  onChange={(e) => handleEducationChange(index, 'relevantCourses', 
                    e.target.value.split(',').map(course => course.trim()).filter(course => course)
                  )}
                  variant="outlined"
                  placeholder="Data Structures, Algorithms, Database Systems"
                  helperText="Separate multiple courses with commas"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Achievements"
                  value={education.achievements?.join('\n') || ''}
                  onChange={(e) => handleEducationChange(index, 'achievements', 
                    e.target.value.split('\n').filter(line => line.trim())
                  )}
                  variant="outlined"
                  placeholder="• Dean's List for 3 consecutive semesters&#10;• President of Computer Science Club"
                  helperText="List achievements, one per line"
                />
              </Grid>
            </Grid>
          )}
        </Paper>
      ))}
    </Box>
  );
});

OptimizedEducationStep.displayName = 'OptimizedEducationStep';

export default OptimizedEducationStep;
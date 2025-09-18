import React, { memo, useCallback, useState } from 'react';
import {
  Box,
  TextField,
  Grid,
  Typography,
  Button,
  IconButton,
  Paper,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { Add, Delete, VolunteerActivism } from '@mui/icons-material';
import { VolunteerExperience } from '../../services/cvBuilderService';

interface OptimizedVolunteerStepProps {
  data: VolunteerExperience[];
  onChange: (section: string, data: VolunteerExperience[]) => void;
  onAIHelp: (action: string, data: any) => void;
}

const OptimizedVolunteerStep: React.FC<OptimizedVolunteerStepProps> = memo(({
  data,
  onChange,
  onAIHelp,
}) => {
  const [expandedIndex, setExpandedIndex] = useState<number>(0);

  const handleAddVolunteer = useCallback(() => {
    const newVolunteer: VolunteerExperience = {
      id: Date.now().toString(),
      organization: '',
      role: '',
      startDate: '',
      endDate: '',
      isOngoing: false,
      location: '',
      description: '',
      achievements: [],
    };
    
    const updatedData = [...data, newVolunteer];
    onChange('volunteerExperience', updatedData);
    setExpandedIndex(updatedData.length - 1);
  }, [data, onChange]);

  const handleRemoveVolunteer = useCallback((index: number) => {
    const updatedData = data.filter((_, i) => i !== index);
    onChange('volunteerExperience', updatedData);
    if (expandedIndex >= updatedData.length) {
      setExpandedIndex(Math.max(0, updatedData.length - 1));
    }
  }, [data, onChange, expandedIndex]);

  const handleVolunteerChange = useCallback((index: number, field: keyof VolunteerExperience, value: any) => {
    const updatedData = [...data];
    updatedData[index] = {
      ...updatedData[index],
      [field]: value,
    };
    onChange('volunteerExperience', updatedData);
  }, [data, onChange]);

  if (data.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <VolunteerActivism sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
        <Typography variant="h6" color="textSecondary" gutterBottom>
          No volunteer experience added yet
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          Add your volunteer work and community involvement
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddVolunteer}
        >
          Add Volunteer Experience
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Volunteer Experience ({data.length})</Typography>
        <Button variant="outlined" startIcon={<Add />} onClick={handleAddVolunteer}>
          Add Experience
        </Button>
      </Box>

      {data.map((volunteer, index) => (
        <Paper
          key={volunteer.id}
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
                {volunteer.role || 'Untitled Role'} 
                {volunteer.organization && ` at ${volunteer.organization}`}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {volunteer.location} • {volunteer.startDate} - {volunteer.isOngoing ? 'Present' : volunteer.endDate}
              </Typography>
            </Box>
            <IconButton
              size="small"
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveVolunteer(index);
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
                  label="Organization *"
                  value={volunteer.organization}
                  onChange={(e) => handleVolunteerChange(index, 'organization', e.target.value)}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Role *"
                  value={volunteer.role}
                  onChange={(e) => handleVolunteerChange(index, 'role', e.target.value)}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Location"
                  value={volunteer.location || ''}
                  onChange={(e) => handleVolunteerChange(index, 'location', e.target.value)}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Start Date *"
                  type="month"
                  value={volunteer.startDate}
                  onChange={(e) => handleVolunteerChange(index, 'startDate', e.target.value)}
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={volunteer.isOngoing}
                      onChange={(e) => handleVolunteerChange(index, 'isOngoing', e.target.checked)}
                    />
                  }
                  label="I currently volunteer here"
                />
              </Grid>
              {!volunteer.isOngoing && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="End Date"
                    type="month"
                    value={volunteer.endDate}
                    onChange={(e) => handleVolunteerChange(index, 'endDate', e.target.value)}
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              )}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  value={volunteer.description}
                  onChange={(e) => handleVolunteerChange(index, 'description', e.target.value)}
                  variant="outlined"
                  placeholder="Describe your volunteer role, responsibilities, and impact..."
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Key Achievements"
                  value={volunteer.achievements?.join('\n') || ''}
                  onChange={(e) => handleVolunteerChange(index, 'achievements', 
                    e.target.value.split('\n').filter(line => line.trim())
                  )}
                  variant="outlined"
                  placeholder="• Organized events for 200+ participants&#10;• Raised $5,000 for local charity"
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

OptimizedVolunteerStep.displayName = 'OptimizedVolunteerStep';

export default OptimizedVolunteerStep;
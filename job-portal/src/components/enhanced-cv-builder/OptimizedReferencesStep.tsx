import React, { memo, useCallback, useState } from 'react';
import {
  Box,
  TextField,
  Grid,
  Typography,
  Button,
  IconButton,
  Paper,
} from '@mui/material';
import { Add, Delete, People } from '@mui/icons-material';
import { Reference } from '../../services/cvBuilderService';

interface OptimizedReferencesStepProps {
  data: Reference[];
  onChange: (section: string, data: Reference[]) => void;
  onAIHelp: (action: string, data: any) => void;
}

const OptimizedReferencesStep: React.FC<OptimizedReferencesStepProps> = memo(({
  data,
  onChange,
  onAIHelp,
}) => {
  const [expandedIndex, setExpandedIndex] = useState<number>(0);

  const handleAddReference = useCallback(() => {
    const newReference: Reference = {
      id: Date.now().toString(),
      name: '',
      jobTitle: '',
      company: '',
      email: '',
      phone: '',
      relationship: '',
    };
    
    const updatedData = [...data, newReference];
    onChange('references', updatedData);
    setExpandedIndex(updatedData.length - 1);
  }, [data, onChange]);

  const handleRemoveReference = useCallback((index: number) => {
    const updatedData = data.filter((_, i) => i !== index);
    onChange('references', updatedData);
    if (expandedIndex >= updatedData.length) {
      setExpandedIndex(Math.max(0, updatedData.length - 1));
    }
  }, [data, onChange, expandedIndex]);

  const handleReferenceChange = useCallback((index: number, field: keyof Reference, value: any) => {
    const updatedData = [...data];
    updatedData[index] = {
      ...updatedData[index],
      [field]: value,
    };
    onChange('references', updatedData);
  }, [data, onChange]);

  if (data.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <People sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
        <Typography variant="h6" color="textSecondary" gutterBottom>
          No references added yet
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          Add professional references who can vouch for your work
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddReference}
        >
          Add Reference
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Professional References ({data.length})</Typography>
        <Button variant="outlined" startIcon={<Add />} onClick={handleAddReference}>
          Add Reference
        </Button>
      </Box>

      {data.map((reference, index) => (
        <Paper
          key={reference.id}
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
                {reference.name || 'Unnamed Reference'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {reference.jobTitle} at {reference.company}
              </Typography>
            </Box>
            <IconButton
              size="small"
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveReference(index);
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
                  label="Full Name *"
                  value={reference.name}
                  onChange={(e) => handleReferenceChange(index, 'name', e.target.value)}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Job Title *"
                  value={reference.jobTitle}
                  onChange={(e) => handleReferenceChange(index, 'jobTitle', e.target.value)}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Company *"
                  value={reference.company}
                  onChange={(e) => handleReferenceChange(index, 'company', e.target.value)}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Relationship"
                  value={reference.relationship || ''}
                  onChange={(e) => handleReferenceChange(index, 'relationship', e.target.value)}
                  variant="outlined"
                  placeholder="e.g., Former Manager, Colleague"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={reference.email || ''}
                  onChange={(e) => handleReferenceChange(index, 'email', e.target.value)}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={reference.phone || ''}
                  onChange={(e) => handleReferenceChange(index, 'phone', e.target.value)}
                  variant="outlined"
                />
              </Grid>
            </Grid>
          )}
        </Paper>
      ))}
    </Box>
  );
});

OptimizedReferencesStep.displayName = 'OptimizedReferencesStep';

export default OptimizedReferencesStep;
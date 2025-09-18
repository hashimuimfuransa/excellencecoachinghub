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
import { Add, Delete, EmojiEvents } from '@mui/icons-material';
import { Certification } from '../../services/cvBuilderService';

interface OptimizedCertificationsStepProps {
  data: Certification[];
  onChange: (section: string, data: Certification[]) => void;
  onAIHelp: (action: string, data: any) => void;
}

const OptimizedCertificationsStep: React.FC<OptimizedCertificationsStepProps> = memo(({
  data,
  onChange,
  onAIHelp,
}) => {
  const [expandedIndex, setExpandedIndex] = useState<number>(0);

  const handleAddCertification = useCallback(() => {
    const newCertification: Certification = {
      id: Date.now().toString(),
      name: '',
      issuingOrganization: '',
      issueDate: '',
      expiryDate: '',
      credentialId: '',
      credentialUrl: '',
    };
    
    const updatedData = [...data, newCertification];
    onChange('certifications', updatedData);
    setExpandedIndex(updatedData.length - 1);
  }, [data, onChange]);

  const handleRemoveCertification = useCallback((index: number) => {
    const updatedData = data.filter((_, i) => i !== index);
    onChange('certifications', updatedData);
    if (expandedIndex >= updatedData.length) {
      setExpandedIndex(Math.max(0, updatedData.length - 1));
    }
  }, [data, onChange, expandedIndex]);

  const handleCertificationChange = useCallback((index: number, field: keyof Certification, value: any) => {
    const updatedData = [...data];
    updatedData[index] = {
      ...updatedData[index],
      [field]: value,
    };
    onChange('certifications', updatedData);
  }, [data, onChange]);

  if (data.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <EmojiEvents sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
        <Typography variant="h6" color="textSecondary" gutterBottom>
          No certifications added yet
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          Add your professional certifications and licenses
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddCertification}
        >
          Add Certification
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Certifications ({data.length})</Typography>
        <Button variant="outlined" startIcon={<Add />} onClick={handleAddCertification}>
          Add Certification
        </Button>
      </Box>

      {data.map((certification, index) => (
        <Paper
          key={certification.id}
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
                {certification.name || 'Untitled Certification'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {certification.issuingOrganization} • {certification.issueDate}
              </Typography>
            </Box>
            <IconButton
              size="small"
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveCertification(index);
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
                  label="Certification Name *"
                  value={certification.name}
                  onChange={(e) => handleCertificationChange(index, 'name', e.target.value)}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Issuing Organization *"
                  value={certification.issuingOrganization}
                  onChange={(e) => handleCertificationChange(index, 'issuingOrganization', e.target.value)}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Issue Date *"
                  type="month"
                  value={certification.issueDate}
                  onChange={(e) => handleCertificationChange(index, 'issueDate', e.target.value)}
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Expiry Date"
                  type="month"
                  value={certification.expiryDate || ''}
                  onChange={(e) => handleCertificationChange(index, 'expiryDate', e.target.value)}
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Credential ID"
                  value={certification.credentialId || ''}
                  onChange={(e) => handleCertificationChange(index, 'credentialId', e.target.value)}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Credential URL"
                  value={certification.credentialUrl || ''}
                  onChange={(e) => handleCertificationChange(index, 'credentialUrl', e.target.value)}
                  variant="outlined"
                  placeholder="https://..."
                />
              </Grid>
            </Grid>
          )}
        </Paper>
      ))}
    </Box>
  );
});

OptimizedCertificationsStep.displayName = 'OptimizedCertificationsStep';

export default OptimizedCertificationsStep;
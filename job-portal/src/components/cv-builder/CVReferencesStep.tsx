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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Stack,
  Chip,
} from '@mui/material';
import {
  Add,
  ContactPhone,
  Edit,
  Delete,
  Person,
  Business,
  Email,
  Phone,
  WorkHistory,
} from '@mui/icons-material';
import { Reference } from '../../services/cvBuilderService';

interface CVReferencesStepProps {
  data: Reference[];
  onChange: (data: Reference[]) => void;
  onGenerateAIContent: (prompt: string, section: string) => Promise<string>;
}

const CVReferencesStep: React.FC<CVReferencesStepProps> = ({
  data,
  onChange,
  onGenerateAIContent,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [currentReference, setCurrentReference] = useState<Reference>({
    id: '',
    name: '',
    title: '',
    company: '',
    email: '',
    phone: '',
    relationship: '',
    yearsKnown: 1,
  });
  const [showContactDetails, setShowContactDetails] = useState(false);

  const relationshipTypes = [
    'Direct Supervisor',
    'Manager',
    'Team Lead',
    'Senior Colleague',
    'Client',
    'Project Manager',
    'Department Head',
    'CEO/Executive',
    'Professor',
    'Academic Advisor',
    'Mentor',
    'Business Partner',
    'Other'
  ];

  const handleOpenDialog = (reference?: Reference, index?: number) => {
    if (reference && index !== undefined) {
      setCurrentReference({ ...reference });
      setEditingIndex(index);
    } else {
      setCurrentReference({
        id: Date.now().toString(),
        name: '',
        title: '',
        company: '',
        email: '',
        phone: '',
        relationship: '',
        yearsKnown: 1,
      });
      setEditingIndex(null);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setCurrentReference({
      id: '',
      name: '',
      title: '',
      company: '',
      email: '',
      phone: '',
      relationship: '',
      yearsKnown: 1,
    });
    setEditingIndex(null);
  };

  const handleInputChange = (field: keyof Reference, value: any) => {
    setCurrentReference(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    if (editingIndex !== null) {
      const updatedData = [...data];
      updatedData[editingIndex] = currentReference;
      onChange(updatedData);
    } else {
      onChange([...data, currentReference]);
    }
    handleCloseDialog();
  };

  const handleDelete = (index: number) => {
    const updatedData = data.filter((_, i) => i !== index);
    onChange(updatedData);
  };

  const getRelationshipColor = (relationship: string) => {
    switch (relationship) {
      case 'Direct Supervisor':
      case 'Manager':
        return 'primary';
      case 'CEO/Executive':
      case 'Department Head':
        return 'error';
      case 'Client':
      case 'Business Partner':
        return 'success';
      case 'Professor':
      case 'Academic Advisor':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" gutterBottom>
          Professional References
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
          sx={{ borderRadius: 2 }}
        >
          Add Reference
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" paragraph>
        Add professional references who can vouch for your work quality and character. Always ask permission before listing someone as a reference.
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Pro Tip:</strong> Include 3-4 references from different contexts (supervisors, colleagues, clients) who have worked closely with you. 
          Contact details are typically shared only when specifically requested by employers.
        </Typography>
      </Alert>

      <Box mb={3}>
        <Button
          variant="outlined"
          startIcon={showContactDetails ? <ContactPhone /> : <Person />}
          onClick={() => setShowContactDetails(!showContactDetails)}
          size="small"
        >
          {showContactDetails ? 'Hide' : 'Show'} Contact Details
        </Button>
      </Box>

      {data.length === 0 ? (
        <Card sx={{ textAlign: 'center', p: 4, backgroundColor: '#f8f9fa' }}>
          <ContactPhone sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No references added yet
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Add professional references who can speak to your skills, work ethic, and character.
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
            Add Your First Reference
          </Button>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {data.map((reference, index) => (
            <Grid item xs={12} md={6} key={reference.id}>
              <Card elevation={1} sx={{ '&:hover': { elevation: 2 }, height: '100%' }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box flex={1}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Person color="primary" />
                        <Typography variant="h6">
                          {reference.name}
                        </Typography>
                      </Box>
                      
                      <Typography variant="subtitle2" color="primary" gutterBottom>
                        {reference.title}
                      </Typography>

                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <Business sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {reference.company}
                        </Typography>
                      </Box>

                      <Box mb={2}>
                        <Chip
                          label={reference.relationship}
                          size="small"
                          color={getRelationshipColor(reference.relationship) as any}
                          variant="outlined"
                        />
                        {reference.yearsKnown && (
                          <Chip
                            label={`${reference.yearsKnown} years`}
                            size="small"
                            sx={{ ml: 1 }}
                            icon={<WorkHistory />}
                          />
                        )}
                      </Box>

                      {showContactDetails && (
                        <Stack spacing={1}>
                          {reference.email && (
                            <Box display="flex" alignItems="center" gap={1}>
                              <Email sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                {reference.email}
                              </Typography>
                            </Box>
                          )}
                          {reference.phone && (
                            <Box display="flex" alignItems="center" gap={1}>
                              <Phone sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                {reference.phone}
                              </Typography>
                            </Box>
                          )}
                        </Stack>
                      )}
                    </Box>
                    
                    <Box display="flex" flexDirection="column" gap={1}>
                      <IconButton onClick={() => handleOpenDialog(reference, index)} size="small">
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

      {/* Add/Edit Reference Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingIndex !== null ? 'Edit Reference' : 'Add Reference'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Important:</strong> Always ask for permission before listing someone as a reference. 
                  Give them advance notice when you apply for positions.
                </Typography>
              </Alert>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Full Name"
                value={currentReference.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., John Smith"
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Job Title"
                value={currentReference.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="e.g., Senior Software Engineer"
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Company/Organization"
                value={currentReference.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                placeholder="e.g., Microsoft Corporation"
                required
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Relationship</InputLabel>
                <Select
                  value={currentReference.relationship}
                  label="Relationship"
                  onChange={(e) => handleInputChange('relationship', e.target.value)}
                >
                  {relationshipTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Years Known"
                type="number"
                value={currentReference.yearsKnown}
                onChange={(e) => handleInputChange('yearsKnown', parseInt(e.target.value) || 1)}
                inputProps={{ min: 1, max: 50 }}
                helperText="How long have you worked together?"
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Contact Information
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Contact details are typically shared only when specifically requested by employers.
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={currentReference.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="john.smith@company.com"
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone Number"
                value={currentReference.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
                helperText="Include country code for international numbers"
              />
            </Grid>
          </Grid>

          <Box mt={3} p={2} sx={{ backgroundColor: 'info.light', borderRadius: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              📋 Reference Best Practices:
            </Typography>
            <Stack spacing={1}>
              <Typography variant="body2">
                • Choose people who know your work well and can speak positively about you
              </Typography>
              <Typography variant="body2">
                • Include a mix: direct supervisors, colleagues, and clients if possible
              </Typography>
              <Typography variant="body2">
                • Provide them with your updated CV and job descriptions you're applying for
              </Typography>
              <Typography variant="body2">
                • Keep them updated on your job search progress
              </Typography>
            </Stack>
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            disabled={!currentReference.name || !currentReference.title || !currentReference.company || !currentReference.email}
          >
            {editingIndex !== null ? 'Update' : 'Add'} Reference
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CVReferencesStep;
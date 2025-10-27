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
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  useMediaQuery,
  Fade,
  Switch,
  FormControlLabel,
  Divider,
} from '@mui/material';
import {
  Add,
  Delete,
  ContactPage,
  Person,
  Business,
  Phone,
  Email,
  CheckCircle,
  Warning,
} from '@mui/icons-material';
import { Reference } from '../../services/cvBuilderService';

interface EnhancedReferencesStepProps {
  data: Reference[];
  onChange: (data: Reference[]) => void;
  onAIHelp?: (action: string, data: any) => void;
}

const defaultReference: Omit<Reference, 'id'> = {
  name: '',
  jobTitle: '',
  company: '',
  email: '',
  phone: '',
  relationship: '',
  yearsKnown: undefined,
};

const relationshipTypes = [
  'Direct Supervisor',
  'Manager',
  'Team Lead',
  'Colleague',
  'Client',
  'Professor',
  'Mentor',
  'Project Manager',
  'HR Representative',
  'Other',
];

const EnhancedReferencesStep: React.FC<EnhancedReferencesStepProps> = ({
  data,
  onChange,
  onAIHelp,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [showReferencesOnCV, setShowReferencesOnCV] = useState(false);
  const [newReference, setNewReference] = useState<Omit<Reference, 'id'>>(defaultReference);

  const addReference = () => {
    if (newReference.name.trim() && newReference.jobTitle.trim() && newReference.company.trim()) {
      const reference: Reference = {
        ...newReference,
        id: Date.now().toString(),
      };
      onChange([...data, reference]);
      setNewReference(defaultReference);
    }
  };

  const updateReference = (index: number, field: keyof Reference, value: any) => {
    const newData = [...data];
    newData[index] = { ...newData[index], [field]: value };
    onChange(newData);
  };

  const deleteReference = (index: number) => {
    const newData = data.filter((_, i) => i !== index);
    onChange(newData);
  };

  const getReferenceCompleteness = (reference: Reference): number => {
    let score = 0;
    if (reference.name) score += 25;
    if (reference.jobTitle) score += 20;
    if (reference.company) score += 20;
    if (reference.email || reference.phone) score += 25;
    if (reference.relationship) score += 10;
    return score;
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  };

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Header Card */}
        <Grid item xs={12}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: 'white',
            mb: 3 
          }}>
            <CardContent sx={{ py: isMobile ? 2 : 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ContactPage sx={{ mr: 1, fontSize: 28 }} />
                <Typography variant="h5" fontWeight="bold">
                  References
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ opacity: 0.9, mb: 2 }}>
                Add professional references who can vouch for your work quality and character. Quality matters more than quantity.
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                <Chip 
                  label={`${data.length} References`}
                  sx={{ 
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    fontWeight: 'bold',
                  }}
                />
                {data.length >= 2 && (
                  <Chip 
                    label="✓ Good Coverage"
                    sx={{ 
                      bgcolor: 'rgba(76, 175, 80, 0.3)',
                      color: 'white',
                      fontWeight: 'bold',
                    }}
                  />
                )}
              </Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={showReferencesOnCV}
                    onChange={(e) => setShowReferencesOnCV(e.target.checked)}
                    sx={{ 
                      '& .MuiSwitch-switchBase.Mui-checked': { color: 'white' },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: 'rgba(255, 255, 255, 0.3)' }
                    }}
                  />
                }
                label="Include references on CV (vs. 'Available upon request')"
                sx={{ color: 'white' }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Information Alert */}
        <Grid item xs={12}>
          <Alert severity="info">
            <Typography variant="body2">
              <strong>Reference Best Practices:</strong>
            </Typography>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>Always ask permission before listing someone as a reference</li>
              <li>Choose references who know your work well and can speak positively about you</li>
              <li>Include a mix of supervisors, colleagues, and clients when possible</li>
              <li>Keep your references informed about your job search and provide them with your current CV</li>
              <li>Consider including "References available upon request" instead of full details if CV space is limited</li>
            </ul>
          </Alert>
        </Grid>

        {/* Add New Reference Form */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Add /> Add Reference
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={newReference.name}
                    onChange={(e) => setNewReference(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., John Smith"
                    size={isMobile ? "medium" : "small"}
                    required
                    InputProps={{
                      startAdornment: <Person sx={{ mr: 1, color: 'action.active' }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Job Title"
                    value={newReference.jobTitle}
                    onChange={(e) => setNewReference(prev => ({ ...prev, jobTitle: e.target.value }))}
                    placeholder="e.g., Senior Manager, Professor"
                    size={isMobile ? "medium" : "small"}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Company/Organization"
                    value={newReference.company}
                    onChange={(e) => setNewReference(prev => ({ ...prev, company: e.target.value }))}
                    placeholder="e.g., ABC Corporation, XYZ University"
                    size={isMobile ? "medium" : "small"}
                    required
                    InputProps={{
                      startAdornment: <Business sx={{ mr: 1, color: 'action.active' }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size={isMobile ? "medium" : "small"}>
                    <InputLabel>Relationship</InputLabel>
                    <Select
                      value={newReference.relationship || ''}
                      label="Relationship"
                      onChange={(e) => setNewReference(prev => ({ ...prev, relationship: e.target.value }))}
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
                    label="Email Address"
                    type="email"
                    value={newReference.email || ''}
                    onChange={(e) => setNewReference(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="john.smith@company.com"
                    size={isMobile ? "medium" : "small"}
                    error={newReference.email ? !validateEmail(newReference.email) : false}
                    helperText={newReference.email && !validateEmail(newReference.email) ? 'Invalid email format' : ''}
                    InputProps={{
                      startAdornment: <Email sx={{ mr: 1, color: 'action.active' }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    value={newReference.phone || ''}
                    onChange={(e) => setNewReference(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1 (555) 123-4567"
                    size={isMobile ? "medium" : "small"}
                    error={newReference.phone ? !validatePhone(newReference.phone) : false}
                    helperText={newReference.phone && !validatePhone(newReference.phone) ? 'Invalid phone format' : ''}
                    InputProps={{
                      startAdornment: <Phone sx={{ mr: 1, color: 'action.active' }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Years Known"
                    type="number"
                    value={newReference.yearsKnown || ''}
                    onChange={(e) => setNewReference(prev => ({ ...prev, yearsKnown: e.target.value ? parseInt(e.target.value) : undefined }))}
                    placeholder="3"
                    size={isMobile ? "medium" : "small"}
                    inputProps={{ min: 0, max: 50 }}
                  />
                </Grid>
              </Grid>
              
              <Button
                onClick={addReference}
                startIcon={<Add />}
                variant="contained"
                disabled={!newReference.name.trim() || !newReference.jobTitle.trim() || !newReference.company.trim()}
                fullWidth={isMobile}
              >
                Add Reference
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Current References */}
        {data.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Your References ({data.length})
                </Typography>
                
                <Grid container spacing={2}>
                  {data.map((reference, index) => (
                    <Grid item xs={12} key={reference.id}>
                      <Fade in={true} timeout={300 * (index + 1)}>
                        <Card variant="outlined">
                          <CardContent sx={{ py: isMobile ? 2 : 1.5 }}>
                            {/* Reference Header */}
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                              <Box sx={{ flex: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                  <Person color="primary" sx={{ fontSize: 18 }} />
                                  <Typography variant="subtitle1" fontWeight="bold">
                                    {reference.name}
                                  </Typography>
                                  <Chip
                                    label={`${getReferenceCompleteness(reference)}%`}
                                    size="small"
                                    color={getReferenceCompleteness(reference) >= 80 ? 'success' : 
                                           getReferenceCompleteness(reference) >= 60 ? 'warning' : 'error'}
                                  />
                                </Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                  {reference.jobTitle} at {reference.company}
                                </Typography>
                                {reference.relationship && (
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                    Relationship: {reference.relationship}
                                    {reference.yearsKnown && ` (${reference.yearsKnown} years)`}
                                  </Typography>
                                )}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                                  {reference.email && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      <Email sx={{ fontSize: 14, color: 'action.active' }} />
                                      <Typography variant="caption">
                                        {reference.email}
                                        {!validateEmail(reference.email) && (
                                          <Warning sx={{ fontSize: 14, color: 'error.main', ml: 0.5 }} />
                                        )}
                                      </Typography>
                                    </Box>
                                  )}
                                  {reference.phone && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      <Phone sx={{ fontSize: 14, color: 'action.active' }} />
                                      <Typography variant="caption">
                                        {reference.phone}
                                        {!validatePhone(reference.phone) && (
                                          <Warning sx={{ fontSize: 14, color: 'error.main', ml: 0.5 }} />
                                        )}
                                      </Typography>
                                    </Box>
                                  )}
                                </Box>
                              </Box>
                              <IconButton
                                onClick={() => deleteReference(index)}
                                color="error"
                                size="small"
                              >
                                <Delete />
                              </IconButton>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            {/* Edit Form */}
                            <Grid container spacing={2}>
                              <Grid item xs={12} sm={6}>
                                <TextField
                                  fullWidth
                                  label="Full Name"
                                  value={reference.name}
                                  onChange={(e) => updateReference(index, 'name', e.target.value)}
                                  size="small"
                                />
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <TextField
                                  fullWidth
                                  label="Job Title"
                                  value={reference.jobTitle}
                                  onChange={(e) => updateReference(index, 'jobTitle', e.target.value)}
                                  size="small"
                                />
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <TextField
                                  fullWidth
                                  label="Company"
                                  value={reference.company}
                                  onChange={(e) => updateReference(index, 'company', e.target.value)}
                                  size="small"
                                />
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <FormControl fullWidth size="small">
                                  <InputLabel>Relationship</InputLabel>
                                  <Select
                                    value={reference.relationship || ''}
                                    label="Relationship"
                                    onChange={(e) => updateReference(index, 'relationship', e.target.value)}
                                  >
                                    {relationshipTypes.map((type) => (
                                      <MenuItem key={type} value={type}>
                                        {type}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </Grid>
                              <Grid item xs={12} sm={4}>
                                <TextField
                                  fullWidth
                                  label="Email"
                                  type="email"
                                  value={reference.email || ''}
                                  onChange={(e) => updateReference(index, 'email', e.target.value)}
                                  size="small"
                                  error={reference.email ? !validateEmail(reference.email) : false}
                                />
                              </Grid>
                              <Grid item xs={12} sm={4}>
                                <TextField
                                  fullWidth
                                  label="Phone"
                                  value={reference.phone || ''}
                                  onChange={(e) => updateReference(index, 'phone', e.target.value)}
                                  size="small"
                                  error={reference.phone ? !validatePhone(reference.phone) : false}
                                />
                              </Grid>
                              <Grid item xs={12} sm={4}>
                                <TextField
                                  fullWidth
                                  label="Years Known"
                                  type="number"
                                  value={reference.yearsKnown || ''}
                                  onChange={(e) => updateReference(index, 'yearsKnown', e.target.value ? parseInt(e.target.value) : undefined)}
                                  size="small"
                                  inputProps={{ min: 0, max: 50 }}
                                />
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      </Fade>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Empty State */}
        {data.length === 0 && (
          <Grid item xs={12}>
            <Card sx={{ textAlign: 'center', py: 6, bgcolor: 'grey.50' }}>
              <CardContent>
                <ContactPage sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No references added yet
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Add 2-4 professional references who can vouch for your work quality, character, and achievements. 
                  Remember to ask for permission first!
                </Typography>
                <Button
                  onClick={() => {
                    // Scroll to add form
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  variant="outlined"
                  startIcon={<Add />}
                >
                  Add Reference
                </Button>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Reference vs "Available upon request" info */}
        <Grid item xs={12}>
          <Card sx={{ border: '1px dashed', borderColor: showReferencesOnCV ? 'primary.main' : 'divider' }}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                {showReferencesOnCV ? '📝 References will be included on your CV' : '📄 "References available upon request" will be shown'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {showReferencesOnCV 
                  ? 'Including full reference details on your CV saves employers time but uses more space. Make sure you have permission from all references.'
                  : 'This is the most common approach. It saves CV space and allows you to tailor references for specific opportunities. You can provide details when requested.'
                }
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EnhancedReferencesStep;
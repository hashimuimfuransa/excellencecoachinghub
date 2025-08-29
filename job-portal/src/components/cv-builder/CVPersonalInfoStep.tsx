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
  Tooltip,
  CircularProgress,
  Divider,
  Stack,
  Chip,
} from '@mui/material';
import {
  SmartToy,
  LinkedIn,
  Language,
  Phone,
  Email,
  LocationOn,
  Person,
  AutoFixHigh,
} from '@mui/icons-material';
import { PersonalInfo } from '../../services/cvBuilderService';

interface CVPersonalInfoStepProps {
  data: PersonalInfo;
  onChange: (data: PersonalInfo) => void;
  onGenerateAIContent: (prompt: string, section: string) => Promise<string>;
}

const CVPersonalInfoStep: React.FC<CVPersonalInfoStepProps> = ({
  data,
  onChange,
  onGenerateAIContent,
}) => {
  const [generating, setGenerating] = useState<string | null>(null);

  const handleInputChange = (field: keyof PersonalInfo) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    onChange({
      ...data,
      [field]: event.target.value,
    });
  };

  const generateProfessionalSummary = async () => {
    setGenerating('summary');
    try {
      const prompt = `Create a professional summary for a person named ${data.firstName} ${data.lastName} who is a professional looking for opportunities. Make it compelling and concise (2-3 sentences).`;
      const summary = await onGenerateAIContent(prompt, 'professional-summary');
      onChange({
        ...data,
        professionalSummary: summary,
      });
    } catch (error) {
      console.error('Failed to generate professional summary:', error);
    } finally {
      setGenerating(null);
    }
  };

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Personal Information */}
        <Grid item xs={12} md={6}>
          <Card elevation={1}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Person sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Personal Information</Typography>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={data.firstName}
                    onChange={handleInputChange('firstName')}
                    required
                    variant="outlined"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={data.lastName}
                    onChange={handleInputChange('lastName')}
                    required
                    variant="outlined"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    type="email"
                    value={data.email}
                    onChange={handleInputChange('email')}
                    required
                    variant="outlined"
                    InputProps={{
                      startAdornment: <Email sx={{ mr: 1, color: 'action.active' }} />,
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    value={data.phone}
                    onChange={handleInputChange('phone')}
                    variant="outlined"
                    InputProps={{
                      startAdornment: <Phone sx={{ mr: 1, color: 'action.active' }} />,
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Location"
                    value={data.location}
                    onChange={handleInputChange('location')}
                    variant="outlined"
                    placeholder="City, Country"
                    InputProps={{
                      startAdornment: <LocationOn sx={{ mr: 1, color: 'action.active' }} />,
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="LinkedIn Profile"
                    value={data.linkedIn || ''}
                    onChange={handleInputChange('linkedIn')}
                    variant="outlined"
                    placeholder="https://linkedin.com/in/yourprofile"
                    InputProps={{
                      startAdornment: <LinkedIn sx={{ mr: 1, color: 'action.active' }} />,
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Website/Portfolio"
                    value={data.website || ''}
                    onChange={handleInputChange('website')}
                    variant="outlined"
                    placeholder="https://yourwebsite.com"
                    InputProps={{
                      startAdornment: <Language sx={{ mr: 1, color: 'action.active' }} />,
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Professional Summary */}
        <Grid item xs={12} md={6}>
          <Card elevation={1}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="between" mb={2}>
                <Box display="flex" alignItems="center">
                  <AutoFixHigh sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">Professional Summary</Typography>
                </Box>
                
                <Tooltip title="Generate with AI">
                  <IconButton
                    onClick={generateProfessionalSummary}
                    disabled={generating === 'summary'}
                    color="primary"
                  >
                    {generating === 'summary' ? (
                      <CircularProgress size={20} />
                    ) : (
                      <SmartToy />
                    )}
                  </IconButton>
                </Tooltip>
              </Box>
              
              <TextField
                fullWidth
                multiline
                rows={6}
                label="Professional Summary"
                value={data.professionalSummary}
                onChange={handleInputChange('professionalSummary')}
                variant="outlined"
                placeholder="Write a compelling professional summary that highlights your key strengths, experience, and career objectives..."
                helperText="A strong professional summary is 2-3 sentences that capture your most relevant qualifications and career goals."
              />
              
              <Box mt={2}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Tips for a great professional summary:
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip label="Highlight key achievements" size="small" variant="outlined" />
                  <Chip label="Include relevant keywords" size="small" variant="outlined" />
                  <Chip label="Show your value proposition" size="small" variant="outlined" />
                  <Chip label="Keep it concise" size="small" variant="outlined" />
                </Stack>
              </Box>
            </CardContent>
          </Card>

          {/* Summary Tips */}
          <Card elevation={1} sx={{ mt: 2, bgcolor: 'background.default' }}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom color="primary">
                💡 Professional Summary Examples
              </Typography>
              
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Marketing Professional:</strong> "Results-driven marketing specialist with 5+ years of experience in digital campaigns and brand management. Proven track record of increasing brand awareness by 40% and driving $2M+ in revenue growth."
                </Typography>
              </Box>
              
              <Divider sx={{ my: 1 }} />
              
              <Box>
                <Typography variant="body2" color="text.secondary">
                  <strong>Software Developer:</strong> "Full-stack developer with expertise in React, Node.js, and cloud technologies. Passionate about creating scalable solutions and have successfully delivered 20+ projects for Fortune 500 companies."
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CVPersonalInfoStep;
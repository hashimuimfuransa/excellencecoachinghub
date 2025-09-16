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
  useTheme,
  useMediaQuery,
  InputAdornment,
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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
    <Box sx={{ maxWidth: '100%', overflow: 'hidden' }}>
      <Grid container spacing={{ xs: 2, md: 3 }}>
        {/* Personal Information - Optimized for Mobile */}
        <Grid item xs={12} lg={6}>
          <Card 
            elevation={0}
            sx={{ 
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              height: 'fit-content'
            }}
          >
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Box display="flex" alignItems="center" mb={2}>
                <Person sx={{ mr: 1, color: 'primary.main', fontSize: { xs: 20, md: 24 } }} />
                <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ fontWeight: 600 }}>
                  Personal Details
                </Typography>
              </Box>
              
              <Grid container spacing={{ xs: 1.5, md: 2 }}>
                {/* Compact Name Fields */}
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={data.firstName}
                    onChange={handleInputChange('firstName')}
                    required
                    variant="outlined"
                    size={isMobile ? "small" : "medium"}
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={data.lastName}
                    onChange={handleInputChange('lastName')}
                    required
                    variant="outlined"
                    size={isMobile ? "small" : "medium"}
                  />
                </Grid>
                
                {/* Email - Full Width */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={data.email}
                    onChange={handleInputChange('email')}
                    required
                    variant="outlined"
                    size={isMobile ? "small" : "medium"}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email sx={{ fontSize: { xs: 18, md: 20 }, color: 'primary.main' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                {/* Phone and Location - Compact Row */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={data.phone}
                    onChange={handleInputChange('phone')}
                    variant="outlined"
                    size={isMobile ? "small" : "medium"}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Phone sx={{ fontSize: { xs: 18, md: 20 }, color: 'primary.main' }} />
                        </InputAdornment>
                      ),
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
                    size={isMobile ? "small" : "medium"}
                    placeholder="City, Country"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationOn sx={{ fontSize: { xs: 18, md: 20 }, color: 'primary.main' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                {/* Social Links - More Compact */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="LinkedIn"
                    value={data.linkedIn || ''}
                    onChange={handleInputChange('linkedIn')}
                    variant="outlined"
                    size={isMobile ? "small" : "medium"}
                    placeholder="linkedin.com/in/yourprofile"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LinkedIn sx={{ fontSize: { xs: 18, md: 20 }, color: '#0077B5' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Website"
                    value={data.website || ''}
                    onChange={handleInputChange('website')}
                    variant="outlined"
                    size={isMobile ? "small" : "medium"}
                    placeholder="yourwebsite.com"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Language sx={{ fontSize: { xs: 18, md: 20 }, color: 'primary.main' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Professional Summary - Compact Version */}
        <Grid item xs={12} lg={6}>
          <Card 
            elevation={0}
            sx={{ 
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              height: 'fit-content'
            }}
          >
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Box 
                display="flex" 
                alignItems="center" 
                justifyContent="space-between" 
                mb={2}
              >
                <Box display="flex" alignItems="center">
                  <AutoFixHigh sx={{ mr: 1, color: 'primary.main', fontSize: { xs: 20, md: 24 } }} />
                  <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ fontWeight: 600 }}>
                    Professional Summary
                  </Typography>
                </Box>
                
                <Tooltip title="Generate with AI">
                  <IconButton
                    onClick={generateProfessionalSummary}
                    disabled={generating === 'summary'}
                    color="primary"
                    size={isMobile ? "small" : "medium"}
                  >
                    {generating === 'summary' ? (
                      <CircularProgress size={16} />
                    ) : (
                      <SmartToy sx={{ fontSize: { xs: 18, md: 20 } }} />
                    )}
                  </IconButton>
                </Tooltip>
              </Box>
              
              <TextField
                fullWidth
                multiline
                rows={isMobile ? 4 : 5}
                label="Professional Summary"
                value={data.professionalSummary}
                onChange={handleInputChange('professionalSummary')}
                variant="outlined"
                size={isMobile ? "small" : "medium"}
                placeholder="Compelling summary highlighting your key strengths and career objectives..."
                helperText="2-3 sentences capturing your most relevant qualifications and goals."
              />
              
              {/* Compact Tips */}
              <Box mt={1.5}>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip 
                    label="Key achievements" 
                    size="small" 
                    variant="outlined"
                    sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}
                  />
                  <Chip 
                    label="Relevant keywords" 
                    size="small" 
                    variant="outlined"
                    sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}
                  />
                  <Chip 
                    label="Value proposition" 
                    size="small" 
                    variant="outlined"
                    sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}
                  />
                </Stack>
              </Box>
            </CardContent>
          </Card>

          {/* Quick Examples - Only show on larger screens */}
          {!isMobile && (
            <Card 
              elevation={0}
              sx={{ 
                mt: 2, 
                bgcolor: theme.palette.grey[50],
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom color="primary" sx={{ fontWeight: 600 }}>
                  💡 Quick Examples
                </Typography>
                
                <Box sx={{ mb: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.4 }}>
                    <strong>Marketing:</strong> "Results-driven marketing specialist with 5+ years in digital campaigns and brand management..."
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 1 }} />
                
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.4 }}>
                    <strong>Developer:</strong> "Full-stack developer with expertise in React, Node.js, and cloud technologies..."
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default CVPersonalInfoStep;
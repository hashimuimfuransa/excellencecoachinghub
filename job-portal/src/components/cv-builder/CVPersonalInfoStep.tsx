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
              border: theme.palette.mode === 'dark'
                ? '1px solid rgba(255, 255, 255, 0.08)'
                : `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              height: 'fit-content',
              bgcolor: theme.palette.mode === 'dark'
                ? 'rgba(30, 30, 30, 0.8)'
                : 'background.paper',
              backdropFilter: 'blur(20px)',
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

        {/* Professional Summary - Mobile Responsive */}
        <Grid item xs={12} lg={6}>
          <Card 
            elevation={0}
            sx={{ 
              border: theme.palette.mode === 'dark'
                ? '1px solid rgba(255, 255, 255, 0.08)'
                : `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              height: 'fit-content',
              minHeight: { xs: 'auto', md: '320px' },
              display: 'flex',
              flexDirection: 'column',
              bgcolor: theme.palette.mode === 'dark'
                ? 'rgba(30, 30, 30, 0.8)'
                : 'background.paper',
              backdropFilter: 'blur(20px)',
            }}
          >
            <CardContent sx={{ 
              p: { xs: 2, sm: 2.5, md: 3 },
              flex: 1,
              '&:last-child': { 
                paddingBottom: { xs: 2, sm: 2.5, md: 3 } 
              }
            }}>
              <Box 
                display="flex" 
                alignItems="center" 
                justifyContent="space-between" 
                mb={{ xs: 1.5, md: 2 }}
                flexWrap="wrap"
                gap={{ xs: 1, md: 0 }}
              >
                <Box display="flex" alignItems="center" flex={1} minWidth="fit-content">
                  <AutoFixHigh sx={{ 
                    mr: { xs: 0.75, md: 1 }, 
                    color: 'primary.main', 
                    fontSize: { xs: 18, sm: 20, md: 24 } 
                  }} />
                  <Typography 
                    variant={isMobile ? "subtitle1" : "h6"} 
                    sx={{ 
                      fontWeight: 600,
                      fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' }
                    }}
                  >
                    Professional Summary
                  </Typography>
                </Box>
                
                <Tooltip title="Generate with AI">
                  <IconButton
                    onClick={generateProfessionalSummary}
                    disabled={generating === 'summary'}
                    color="primary"
                    size={isMobile ? "small" : "medium"}
                    sx={{
                      padding: { xs: '6px', sm: '8px', md: '8px' },
                      borderRadius: 2,
                      '&:hover': {
                        backgroundColor: 'primary.main',
                        color: 'white',
                        '& .MuiSvgIcon-root': {
                          color: 'white'
                        }
                      }
                    }}
                  >
                    {generating === 'summary' ? (
                      <CircularProgress 
                        size={isMobile ? 14 : 16} 
                        sx={{ color: 'inherit' }}
                      />
                    ) : (
                      <SmartToy sx={{ fontSize: { xs: 16, sm: 18, md: 20 } }} />
                    )}
                  </IconButton>
                </Tooltip>
              </Box>
              
              <TextField
                fullWidth
                multiline
                rows={isMobile ? 5 : 6}
                label="Professional Summary"
                value={data.professionalSummary}
                onChange={handleInputChange('professionalSummary')}
                variant="outlined"
                size={isMobile ? "small" : "medium"}
                placeholder="Compelling summary highlighting your key strengths and career objectives..."
                helperText="2-3 sentences capturing your most relevant qualifications and goals."
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    fontSize: { xs: '0.875rem', md: '1rem' },
                    padding: { xs: '8px', md: '14px' }
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: { xs: '0.875rem', md: '1rem' }
                  },
                  '& .MuiOutlinedInput-input': {
                    lineHeight: { xs: 1.4, md: 1.5 },
                    padding: { xs: '12px 14px', md: '16px 14px' }
                  },
                  '& .MuiFormHelperText-root': {
                    fontSize: { xs: '0.75rem', md: '0.8rem' },
                    marginTop: { xs: 1, md: 1.5 }
                  }
                }}
                inputProps={{
                  style: {
                    minHeight: isMobile ? '100px' : '120px'
                  }
                }}
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
                bgcolor: theme.palette.mode === 'dark'
                  ? 'rgba(30, 30, 30, 0.8)'
                  : theme.palette.grey[50],
                border: theme.palette.mode === 'dark'
                  ? '1px solid rgba(255, 255, 255, 0.08)'
                  : `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                backdropFilter: 'blur(20px)',
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
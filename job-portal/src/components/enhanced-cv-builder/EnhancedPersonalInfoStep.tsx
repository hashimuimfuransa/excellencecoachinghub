import React, { useState } from 'react';
import cvBuilderService from '../../services/cvBuilderService';
import {
  Box,
  Grid,
  TextField,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  Chip,
  IconButton,
  InputAdornment,
  useTheme,
  useMediaQuery,
  Paper,
  Stack,
  Divider,
  Tooltip,
  Zoom,
  CircularProgress,
} from '@mui/material';
import {
  PersonOutline,
  EmailOutlined,
  PhoneOutlined,
  LocationOnOutlined,
  LinkedIn,
  LanguageOutlined,
  AutoFixHigh,
  CheckCircle,
  Warning,
  Lightbulb,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';

interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  professionalSummary: string;
  linkedIn: string;
  portfolio: string;
}

interface EnhancedPersonalInfoStepProps {
  data: PersonalInfo;
  onChange: (data: PersonalInfo) => void;
  onAIHelp?: (section: string, data: any) => void;
}

const EnhancedPersonalInfoStep: React.FC<EnhancedPersonalInfoStepProps> = ({
  data,
  onChange,
  onAIHelp,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [showValidation, setShowValidation] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const handleChange = (field: keyof PersonalInfo, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhone = (phone: string) => {
    const re = /^[\+]?[1-9][\d]{0,15}$/;
    return phone === '' || re.test(phone.replace(/[\s\-\(\)]/g, ''));
  };

  const getCompletionScore = () => {
    let score = 0;
    const fields = ['firstName', 'lastName', 'email', 'phone', 'location', 'professionalSummary'];
    
    fields.forEach(field => {
      if (data[field as keyof PersonalInfo]) {
        score += field === 'professionalSummary' ? 30 : 14;
      }
    });
    
    return Math.min(100, score);
  };

  const completionScore = getCompletionScore();

  const validateForm = () => {
    setShowValidation(true);
    return data.firstName && data.lastName && data.email && validateEmail(data.email);
  };

  const handleGenerateAISummary = async () => {
    if (!data.firstName || !data.lastName) {
      alert('Please enter your name first before generating a professional summary.');
      return;
    }

    setIsGeneratingAI(true);
    try {
      const cvData = {
        personalInfo: data,
        experiences: [],
        education: [],
        skills: [],
        languages: [],
        projects: [],
        certifications: [],
        awards: [],
        volunteerExperience: [],
        publications: [],
        professionalMemberships: [],
        references: [],
      };

      const generatedSummary = await cvBuilderService.generateProfessionalSummary(cvData);
      handleChange('professionalSummary', generatedSummary);
      
      if (onAIHelp) {
        onAIHelp('professional-summary', { summary: generatedSummary });
      }
    } catch (error) {
      console.error('Failed to generate AI summary:', error);
      alert('Failed to generate professional summary. Please try again or write one manually.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleAIContentHelp = async (contentType: string) => {
    if (!data.firstName || !data.lastName) {
      alert('Please enter your name first before using AI assistance.');
      return;
    }

    setIsGeneratingAI(true);
    try {
      let prompt = '';
      let section = '';
      
      if (contentType === 'summary') {
        prompt = `Generate a professional summary for ${data.firstName} ${data.lastName}. Location: ${data.location || 'Not specified'}. Email: ${data.email}. Create a compelling 2-3 sentence summary that highlights their professional strengths and career objectives.`;
        section = 'professional-summary';
      }

      const generatedContent = await cvBuilderService.generateAIContent(prompt, section);
      
      if (contentType === 'summary') {
        handleChange('professionalSummary', generatedContent);
      }
      
      if (onAIHelp) {
        onAIHelp(section, { content: generatedContent });
      }
    } catch (error) {
      console.error('Failed to generate AI content:', error);
      alert('Failed to generate content. Please try again or write it manually.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  return (
    <Box>
      <Grid container spacing={{ xs: 2, md: 3 }}>
        {/* Progress Card */}
        <Grid item xs={12}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 2, 
              mb: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: 3,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  Personal Information
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Complete your profile to get started
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h4" fontWeight="bold">
                  {completionScore}%
                </Typography>
                <Typography variant="caption">
                  Complete
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Basic Information */}
        <Grid item xs={12}>
          <Card sx={{ 
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            overflow: 'visible',
          }}>
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: 'primary.light',
                    mr: 2,
                  }}
                >
                  <PersonOutline sx={{ color: 'primary.main', fontSize: 24 }} />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    Basic Information
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Your contact details and professional identity
                  </Typography>
                </Box>
              </Box>
              
              <Grid container spacing={{ xs: 3, md: 3 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={data.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    required
                    error={!data.firstName && showValidation}
                    helperText={!data.firstName && showValidation ? 'First name is required' : ''}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonOutline color="action" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        fontSize: { xs: '16px', md: '14px' }, // Prevent zoom on iOS
                        '&:hover': {
                          boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.12)',
                        },
                        '&.Mui-focused': {
                          boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.2)',
                        },
                      }
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={data.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    required
                    error={!data.lastName && showValidation}
                    helperText={!data.lastName && showValidation ? 'Last name is required' : ''}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonOutline color="action" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        fontSize: { xs: '16px', md: '14px' },
                        '&:hover': {
                          boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.12)',
                        },
                        '&.Mui-focused': {
                          boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.2)',
                        },
                      }
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="email"
                    label="Email Address"
                    value={data.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    required
                    error={(!data.email || !validateEmail(data.email)) && showValidation}
                    helperText={
                      !data.email && showValidation ? 'Email address is required' :
                      data.email && !validateEmail(data.email) && showValidation ? 'Please enter a valid email' :
                      'Use a professional email address'
                    }
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailOutlined color="action" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        fontSize: { xs: '16px', md: '14px' },
                        '&:hover': {
                          boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.12)',
                        },
                        '&.Mui-focused': {
                          boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.2)',
                        },
                      }
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    value={data.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    error={!validatePhone(data.phone) && showValidation}
                    helperText={
                      !validatePhone(data.phone) && showValidation ? 'Please enter a valid phone number' :
                      'Include country code for international positions'
                    }
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneOutlined color="action" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        fontSize: { xs: '16px', md: '14px' },
                        '&:hover': {
                          boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.12)',
                        },
                        '&.Mui-focused': {
                          boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.2)',
                        },
                      }
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Location"
                    value={data.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    placeholder="City, State/Province, Country"
                    helperText="City and country are usually sufficient"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationOnOutlined color="action" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        fontSize: { xs: '16px', md: '14px' },
                        '&:hover': {
                          boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.12)',
                        },
                        '&.Mui-focused': {
                          boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.2)',
                        },
                      }
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Professional Summary */}
        <Grid item xs={12}>
          <Card sx={{ 
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            overflow: 'visible',
          }}>
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: 'secondary.light',
                      mr: 2,
                    }}
                  >
                    <AutoFixHigh sx={{ color: 'secondary.main', fontSize: 24 }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      Professional Summary
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      A compelling overview of your professional background
                    </Typography>
                  </Box>
                </Box>
                
                <Tooltip title="Click to generate with AI">
                  <Chip 
                    label={isGeneratingAI ? "Generating..." : "Generate with AI"} 
                    size="small" 
                    color="secondary" 
                    variant="outlined"
                    icon={isGeneratingAI ? <CircularProgress size={12} color="inherit" /> : <AutoFixHigh />}
                    onClick={handleGenerateAISummary}
                    disabled={isGeneratingAI || !data.firstName || !data.lastName}
                    clickable
                    sx={{ cursor: 'pointer' }}
                  />
                </Tooltip>
              </Box>

              <TextField
                fullWidth
                multiline
                rows={isMobile ? 4 : 5}
                label="Professional Summary"
                value={data.professionalSummary}
                onChange={(e) => handleChange('professionalSummary', e.target.value)}
                placeholder="Write a compelling 2-3 sentence summary that highlights your expertise, key achievements, and career goals. Focus on what makes you unique and valuable to employers."
                helperText={`${data.professionalSummary.length}/300 characters • 2-3 sentences recommended`}
                inputProps={{ maxLength: 300 }}
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    fontSize: { xs: '16px', md: '14px' },
                    '&:hover': {
                      boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.12)',
                    },
                    '&.Mui-focused': {
                      boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.2)',
                    },
                  }
                }}
              />

              {/* AI Suggestions */}
              {!data.professionalSummary && (
                <Box sx={{ mt: 2 }}>
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    <Typography variant="body2" fontWeight="medium" gutterBottom>
                      💡 Pro Tip: A strong professional summary should include:
                    </Typography>
                    <Box component="ul" sx={{ m: 0, pl: 2 }}>
                      <li>Your current role or target position</li>
                      <li>Years of experience and key expertise</li>
                      <li>One major achievement or unique value proposition</li>
                    </Box>
                  </Alert>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Optional Links */}
        <Grid item xs={12}>
          <Card sx={{ 
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            overflow: 'visible',
          }}>
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: 'info.light',
                    mr: 2,
                  }}
                >
                  <LanguageOutlined sx={{ color: 'info.main', fontSize: 24 }} />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    Professional Links
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Optional but recommended for better networking
                  </Typography>
                </Box>
              </Box>
              
              <Grid container spacing={{ xs: 3, md: 3 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="LinkedIn Profile"
                    value={data.linkedIn}
                    onChange={(e) => handleChange('linkedIn', e.target.value)}
                    placeholder="https://linkedin.com/in/yourprofile"
                    helperText="Improves your professional visibility"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LinkedIn color="action" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        fontSize: { xs: '16px', md: '14px' },
                        '&:hover': {
                          boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.12)',
                        },
                        '&.Mui-focused': {
                          boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.2)',
                        },
                      }
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Portfolio/Website"
                    value={data.portfolio}
                    onChange={(e) => handleChange('portfolio', e.target.value)}
                    placeholder="https://yourportfolio.com"
                    helperText="Showcase your work and projects"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LanguageOutlined color="action" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        fontSize: { xs: '16px', md: '14px' },
                        '&:hover': {
                          boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.12)',
                        },
                        '&.Mui-focused': {
                          boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.2)',
                        },
                      }
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Preview */}
        <Grid item xs={12}>
          <Card sx={{ 
            borderRadius: 3,
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            overflow: 'visible',
          }}>
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                  Quick Preview
                </Typography>
                <IconButton onClick={() => setShowPreview(!showPreview)}>
                  {showPreview ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </Box>

              {showPreview && (
                <Zoom in={showPreview}>
                  <Paper sx={{ p: 3, borderRadius: 2 }}>
                    <Typography variant="h5" fontWeight="bold" gutterBottom>
                      {data.firstName} {data.lastName}
                    </Typography>
                    {data.email && (
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {data.email} {data.phone && `• ${data.phone}`} {data.location && `• ${data.location}`}
                      </Typography>
                    )}
                    {data.professionalSummary && (
                      <Typography variant="body1" sx={{ mt: 2 }}>
                        {data.professionalSummary}
                      </Typography>
                    )}
                    
                    <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                      {data.linkedIn && <Chip label="LinkedIn" size="small" />}
                      {data.portfolio && <Chip label="Portfolio" size="small" />}
                    </Stack>
                  </Paper>
                </Zoom>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Validation Summary */}
        {showValidation && (
          <Grid item xs={12}>
            <Alert 
              severity={validateForm() ? 'success' : 'warning'}
              sx={{ borderRadius: 2 }}
            >
              <Typography variant="body2" fontWeight="medium">
                {validateForm() 
                  ? '✅ Personal information section is complete!'
                  : '⚠️ Please complete all required fields before proceeding'
                }
              </Typography>
            </Alert>
          </Grid>
        )}

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, borderRadius: 2, bgcolor: 'grey.50' }}>
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={2} 
              alignItems={{ xs: 'stretch', sm: 'center' }}
            >
              <Button
                variant="outlined"
                startIcon={<CheckCircle />}
                onClick={() => setShowValidation(true)}
                fullWidth={isMobile}
              >
                Validate Info
              </Button>
              <Button
                variant="outlined"
                startIcon={isGeneratingAI ? <CircularProgress size={16} color="inherit" /> : <AutoFixHigh />}
                color="secondary"
                fullWidth={isMobile}
                onClick={() => handleAIContentHelp('summary')}
                disabled={isGeneratingAI || !data.firstName || !data.lastName}
              >
                {isGeneratingAI ? 'Generating...' : 'Get AI Help'}
              </Button>
              <Button
                variant="text"
                startIcon={<Lightbulb />}
                fullWidth={isMobile}
              >
                View Tips
              </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EnhancedPersonalInfoStep;
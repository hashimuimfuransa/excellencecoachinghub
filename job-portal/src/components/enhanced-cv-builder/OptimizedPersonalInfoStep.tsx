import React, { memo, useCallback } from 'react';
import {
  Box,
  TextField,
  Grid,
  Typography,
  Avatar,
  Button,
  IconButton,
  Paper,
} from '@mui/material';
import { PhotoCamera, AutoAwesome } from '@mui/icons-material';
import { PersonalInfo } from '../../services/cvBuilderService';
import OptimizedTextField from './OptimizedTextField';
import OptimizedTextArea from './OptimizedTextArea';

interface OptimizedPersonalInfoStepProps {
  data: PersonalInfo;
  onChange: (section: string, data: PersonalInfo) => void;
  onAIHelp: (action: string, data: any) => void;
}

const OptimizedPersonalInfoStep: React.FC<OptimizedPersonalInfoStepProps> = memo(({
  data,
  onChange,
  onAIHelp,
}) => {
  const handleFieldChange = useCallback((field: keyof PersonalInfo, value: string) => {
    onChange('personalInfo', {
      ...data,
      [field]: value,
    });
  }, [data, onChange]);

  const handleAISummary = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        // Generate a basic professional summary based on available data
        const basicSummary = generateBasicSummary(data);
        handleFieldChange('professionalSummary', basicSummary);
        setTimeout(() => {
          const event = new CustomEvent('showMessage', { 
            detail: { message: '✨ Basic professional summary generated!', type: 'success' } 
          });
          window.dispatchEvent(event);
        }, 100);
        return;
      }

      const response = await fetch('/api/cv-builder/ai/professional-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          cvData: {
            personalInfo: data,
            experiences: [], // Will be filled as user progresses
            education: [],
            skills: []
          }
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        handleFieldChange('professionalSummary', result.summary);
        // Show success message
        setTimeout(() => {
          const event = new CustomEvent('showMessage', { 
            detail: { message: '✨ AI-generated professional summary added!', type: 'success' } 
          });
          window.dispatchEvent(event);
        }, 100);
      } else {
        // Generate a basic summary instead of opening dialog
        const basicSummary = generateBasicSummary(data);
        handleFieldChange('professionalSummary', basicSummary);
        setTimeout(() => {
          const event = new CustomEvent('showMessage', { 
            detail: { message: '📝 Basic professional summary generated!', type: 'info' } 
          });
          window.dispatchEvent(event);
        }, 100);
      }
    } catch (error) {
      console.error('Error generating AI summary:', error);
      // Generate a basic summary instead of opening dialog
      const basicSummary = generateBasicSummary(data);
      handleFieldChange('professionalSummary', basicSummary);
      setTimeout(() => {
        const event = new CustomEvent('showMessage', { 
          detail: { message: '📝 Basic professional summary generated!', type: 'info' } 
        });
        window.dispatchEvent(event);
      }, 100);
    }
  }, [data, handleFieldChange]);

  const generateBasicSummary = useCallback((personalInfo: PersonalInfo): string => {
    // Get additional context from user's CV data
    const cvData = (window as any).cvData;
    const experiences = cvData?.experiences || [];
    const education = cvData?.education || [];
    
    // Extract years of experience
    let yearsOfExperience = 0;
    if (experiences.length > 0) {
      const latestExp = experiences[0];
      const startYear = latestExp.startDate ? new Date(latestExp.startDate).getFullYear() : new Date().getFullYear();
      const endYear = latestExp.current ? new Date().getFullYear() : 
                     (latestExp.endDate ? new Date(latestExp.endDate).getFullYear() : new Date().getFullYear());
      yearsOfExperience = Math.max(1, endYear - startYear);
      
      // Add experience from other roles
      experiences.slice(1).forEach((exp: any) => {
        const expStart = exp.startDate ? new Date(exp.startDate).getFullYear() : 0;
        const expEnd = exp.current ? new Date().getFullYear() : 
                      (exp.endDate ? new Date(exp.endDate).getFullYear() : 0);
        yearsOfExperience += Math.max(0, expEnd - expStart);
      });
    }
    
    // Determine industry and role
    let industry = 'professional';
    let currentRole = 'professional';
    let keySkills = [];
    
    if (experiences.length > 0) {
      const latestExp = experiences[0];
      currentRole = latestExp.jobTitle || 'professional';
      
      const jobTitle = latestExp.jobTitle?.toLowerCase() || '';
      
      if (jobTitle.includes('developer') || jobTitle.includes('engineer') || jobTitle.includes('programmer')) {
        industry = 'technology';
        keySkills = ['software development', 'problem-solving', 'technical innovation'];
      } else if (jobTitle.includes('manager') || jobTitle.includes('director')) {
        industry = 'management';
        keySkills = ['team leadership', 'strategic planning', 'operational excellence'];
      } else if (jobTitle.includes('sales') || jobTitle.includes('marketing')) {
        industry = 'sales and marketing';
        keySkills = ['relationship building', 'revenue growth', 'market analysis'];
      } else if (jobTitle.includes('designer') || jobTitle.includes('creative')) {
        industry = 'creative';
        keySkills = ['creative design', 'visual communication', 'user experience'];
      } else if (jobTitle.includes('teacher') || jobTitle.includes('educator')) {
        industry = 'education';
        keySkills = ['curriculum development', 'student engagement', 'knowledge transfer'];
      } else if (jobTitle.includes('healthcare') || jobTitle.includes('medical')) {
        industry = 'healthcare';
        keySkills = ['patient care', 'medical expertise', 'healthcare delivery'];
      } else {
        keySkills = ['professional excellence', 'collaborative teamwork', 'quality results'];
      }
    }
    
    // Check education level
    let educationLevel = '';
    if (education.length > 0) {
      const highestEd = education[0];
      if (highestEd.degree?.toLowerCase().includes('master') || highestEd.degree?.toLowerCase().includes('mba')) {
        educationLevel = 'graduate-level ';
      } else if (highestEd.degree?.toLowerCase().includes('bachelor') || highestEd.degree?.toLowerCase().includes('degree')) {
        educationLevel = 'university ';
      }
    }
    
    const location = personalInfo.location ? ` based in ${personalInfo.location}` : '';
    const experienceText = yearsOfExperience > 0 ? `${yearsOfExperience}+ years of experience in ${industry}` : `experience in ${industry}`;
    
    const summaryTemplates = [
      `Results-driven ${currentRole}${location} with ${experienceText}. Proven track record in ${keySkills[0]} and ${keySkills[1]}, with expertise in delivering high-quality solutions that drive business growth. Strong ${educationLevel}background combined with practical experience in ${keySkills[2]} and cross-functional collaboration.`,
      
      `Dynamic and accomplished ${currentRole} with ${experienceText}. Demonstrated expertise in ${keySkills[0]}, ${keySkills[1]}, and ${keySkills[2]}. Known for innovative problem-solving approach and ability to deliver exceptional results in fast-paced environments. ${educationLevel.charAt(0).toUpperCase() + educationLevel.slice(1)}educated professional committed to continuous learning and professional excellence.`,
      
      `Experienced ${currentRole}${location} bringing ${experienceText} to challenging projects and initiatives. Specialized in ${keySkills[0]} with proven ability in ${keySkills[1]} and ${keySkills[2]}. Strong analytical and communication skills combined with ${educationLevel}training enable effective leadership and collaboration across diverse teams and projects.`
    ];
    
    // Select a random template
    return summaryTemplates[Math.floor(Math.random() * summaryTemplates.length)];
  }, []);

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ mb: { xs: 2, sm: 3 } }}>
        Personal Information
      </Typography>
      
      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {/* Profile Photo */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ 
            p: { xs: 2, sm: 2 }, 
            textAlign: 'center',
            borderRadius: { xs: 2, sm: 1 }
          }}>
            <Avatar
              sx={{ 
                width: { xs: 80, sm: 100, md: 120 }, 
                height: { xs: 80, sm: 100, md: 120 }, 
                mx: 'auto', 
                mb: 2,
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }
              }}
              src={data.photo}
            >
              {data.firstName?.[0]}{data.lastName?.[0]}
            </Avatar>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="photo-upload"
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    handleFieldChange('photo', event.target?.result as string);
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
            <label htmlFor="photo-upload">
              <IconButton 
                color="primary" 
                component="span"
                size={window.innerWidth < 600 ? "small" : "medium"}
              >
                <PhotoCamera />
              </IconButton>
            </label>
            <Typography variant="caption" display="block">
              Upload Photo
            </Typography>
          </Paper>
        </Grid>

        {/* Basic Information */}
        <Grid item xs={12} md={9}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <OptimizedTextField
                fullWidth
                label="First Name *"
                value={data.firstName || ''}
                onChange={(value) => handleFieldChange('firstName', value)}
                variant="outlined"
                required
                maxLength={50}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <OptimizedTextField
                fullWidth
                label="Last Name *"
                value={data.lastName || ''}
                onChange={(value) => handleFieldChange('lastName', value)}
                variant="outlined"
                required
                maxLength={50}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <OptimizedTextField
                fullWidth
                label="Email Address *"
                type="email"
                value={data.email || ''}
                onChange={(value) => handleFieldChange('email', value)}
                variant="outlined"
                required
                validatePattern={/^[^\s@]+@[^\s@]+\.[^\s@]+$/}
                validateMessage="Please enter a valid email address"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <OptimizedTextField
                fullWidth
                label="Phone Number *"
                value={data.phone || ''}
                onChange={(value) => handleFieldChange('phone', value)}
                variant="outlined"
                required
                validatePattern={/^[\+]?[\d\s\(\)\-\.]{8,}$/}
                validateMessage="Please enter a valid phone number"
              />
            </Grid>
            <Grid item xs={12}>
              <OptimizedTextField
                fullWidth
                label="Location"
                value={data.location || ''}
                onChange={(value) => handleFieldChange('location', value)}
                variant="outlined"
                maxLength={100}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <OptimizedTextField
                fullWidth
                label="LinkedIn Profile"
                value={data.linkedinUrl || ''}
                onChange={(value) => handleFieldChange('linkedinUrl', value)}
                variant="outlined"
                validatePattern={/^https:\/\/(www\.)?linkedin\.com\/in\/[\w-]+\/?$/}
                validateMessage="Please enter a valid LinkedIn URL"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <OptimizedTextField
                fullWidth
                label="Portfolio/Website"
                value={data.portfolioUrl || ''}
                onChange={(value) => handleFieldChange('portfolioUrl', value)}
                variant="outlined"
                validatePattern={/^https?:\/\/[^\s/$.?#].[^\s]*$/}
                validateMessage="Please enter a valid URL"
              />
            </Grid>
            <Grid item xs={12}>
              <OptimizedTextField
                fullWidth
                label="GitHub Profile"
                value={data.githubUrl || ''}
                onChange={(value) => handleFieldChange('githubUrl', value)}
                variant="outlined"
                validatePattern={/^https:\/\/github\.com\/[\w-]+\/?$/}
                validateMessage="Please enter a valid GitHub URL"
              />
            </Grid>
          </Grid>
        </Grid>

        {/* Professional Summary */}
        <Grid item xs={12}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: { xs: 'flex-start', sm: 'center' }, 
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 1, sm: 1 }, 
            mb: 1 
          }}>
            <Typography variant="subtitle1" sx={{ 
              fontSize: { xs: '1rem', sm: '1.1rem' },
              fontWeight: 600,
              flex: 1
            }}>
              Professional Summary *
            </Typography>
            <Button
              size={window.innerWidth < 600 ? "small" : "medium"}
              startIcon={<AutoAwesome sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }} />}
              onClick={handleAISummary}
              variant="outlined"
              color="secondary"
              sx={{
                alignSelf: { xs: 'flex-start', sm: 'auto' },
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                px: { xs: 1.5, sm: 2 },
                py: { xs: 0.5, sm: 0.75 },
                minWidth: { xs: 'auto', sm: 'auto' }
              }}
            >
              {window.innerWidth < 600 ? 'AI Help' : 'AI Assist'}
            </Button>
          </Box>
          <OptimizedTextArea
            fullWidth
            value={data.professionalSummary || ''}
            onChange={(value) => handleFieldChange('professionalSummary', value)}
            variant="outlined"
            onAIHelp={handleAISummary}
            label=""
            placeholder="Write a compelling professional summary that highlights your key skills, experiences, and career objectives..."
            helperText="Aim for 3-4 sentences that capture your professional identity and value proposition."
            maxLength={500}
            showCharacterCount
            enableFullscreen
            autoGrow
            minRows={5} // Increased for better mobile experience
            maxRows={12} // Increased for mobile to prevent overflow
          />
        </Grid>

        {/* Additional Fields */}
        <Grid item xs={12} sm={6}>
          <OptimizedTextField
            fullWidth
            label="Professional Title"
            value={data.title || ''}
            onChange={(value) => handleFieldChange('title', value)}
            variant="outlined"
            maxLength={100}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <OptimizedTextField
            fullWidth
            label="Nationality"
            value={data.nationality || ''}
            onChange={(value) => handleFieldChange('nationality', value)}
            variant="outlined"
            maxLength={50}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Date of Birth"
            type="date"
            value={data.dateOfBirth || ''}
            onChange={(e) => handleFieldChange('dateOfBirth', e.target.value)}
            variant="outlined"
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <OptimizedTextField
            fullWidth
            label="Marital Status"
            value={data.maritalStatus || ''}
            onChange={(value) => handleFieldChange('maritalStatus', value)}
            variant="outlined"
            maxLength={30}
          />
        </Grid>
      </Grid>
    </Box>
  );
});

OptimizedPersonalInfoStep.displayName = 'OptimizedPersonalInfoStep';

export default OptimizedPersonalInfoStep;
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  Grid,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import {
  Person,
  School,
  Work,
  Star,
  Send,
  CheckCircle,
  Warning
} from '@mui/icons-material';
import { teacherProfileService, ITeacherProfile, IUpdateTeacherProfileData } from '../../services/teacherProfileService';

const steps = [
  'Personal Information',
  'Professional Background',
  'Teaching Expertise',
  'Review & Submit'
];

const ProfileCompletion: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [profile, setProfile] = useState<ITeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form data
  const [formData, setFormData] = useState<IUpdateTeacherProfileData>({
    phone: '',
    bio: '',
    specialization: [],
    experience: 0,
    education: [],
    skills: [],
    languages: [],
    teachingAreas: [],
    preferredLevels: [],
    hourlyRate: 0,
    socialLinks: {}
  });

  // Load existing profile
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const profileData = await teacherProfileService.getMyProfile();
      setProfile(profileData);
      
      // Pre-fill form with existing data
      setFormData({
        phone: profileData.phone || '',
        bio: profileData.bio || '',
        specialization: profileData.specialization || [],
        experience: profileData.experience || 0,
        education: profileData.education || [],
        skills: profileData.skills || [],
        languages: profileData.languages || [],
        teachingAreas: profileData.teachingAreas || [],
        preferredLevels: profileData.preferredLevels || [],
        hourlyRate: profileData.hourlyRate || 0,
        socialLinks: profileData.socialLinks || {}
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSave = async () => {
    try {
      setSubmitting(true);
      await teacherProfileService.updateMyProfile(formData);
      setSuccess('Profile saved successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitForApproval = async () => {
    try {
      setSubmitting(true);
      await teacherProfileService.updateMyProfile(formData);
      await teacherProfileService.submitForApproval();
      setSuccess('Profile submitted for approval successfully!');
      loadProfile(); // Reload to get updated status
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit profile');
    } finally {
      setSubmitting(false);
    }
  };

  const addArrayItem = (field: keyof IUpdateTeacherProfileData, value: string) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [field]: [...(prev[field] as string[] || []), value.trim()]
      }));
    }
  };

  const removeArrayItem = (field: keyof IUpdateTeacherProfileData, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[] || []).filter((_, i) => i !== index)
    }));
  };

  const addEducation = () => {
    setFormData(prev => ({
      ...prev,
      education: [
        ...(prev.education || []),
        { degree: '', institution: '', year: new Date().getFullYear(), field: '' }
      ]
    }));
  };

  const updateEducation = (index: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      education: (prev.education || []).map((edu, i) => 
        i === index ? { ...edu, [field]: value } : edu
      )
    }));
  };

  const removeEducation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      education: (prev.education || []).filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Show status if profile is already submitted
  if (profile?.profileStatus === 'pending') {
    return (
      <Container maxWidth="md">
        <Box mt={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Warning color="warning" sx={{ mr: 2 }} />
                <Typography variant="h5">Profile Under Review</Typography>
              </Box>
              <Typography variant="body1" paragraph>
                Your teacher profile has been submitted and is currently under review by our admin team.
                You will be notified once the review is complete.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Submitted on: {new Date(profile.submittedAt!).toLocaleDateString()}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Container>
    );
  }

  if (profile?.profileStatus === 'approved') {
    return (
      <Container maxWidth="md">
        <Box mt={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <CheckCircle color="success" sx={{ mr: 2 }} />
                <Typography variant="h5">Profile Approved</Typography>
              </Box>
              <Typography variant="body1" paragraph>
                Congratulations! Your teacher profile has been approved and your account is now active.
                You can start creating courses and teaching students.
              </Typography>
              {profile.adminFeedback && (
                <Box mt={2}>
                  <Typography variant="subtitle2">Admin Feedback:</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {profile.adminFeedback}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      </Container>
    );
  }

  if (profile?.profileStatus === 'rejected') {
    return (
      <Container maxWidth="md">
        <Box mt={4}>
          <Alert severity="error" sx={{ mb: 2 }}>
            Your profile was rejected. Please review the feedback and resubmit.
          </Alert>
          {profile.rejectionReason && (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle2">Rejection Reason:</Typography>
                <Typography variant="body2">{profile.rejectionReason}</Typography>
                {profile.adminFeedback && (
                  <Box mt={2}>
                    <Typography variant="subtitle2">Admin Feedback:</Typography>
                    <Typography variant="body2">{profile.adminFeedback}</Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}
          {/* Continue with the form to allow resubmission */}
        </Box>
      </Container>
    );
  }

  const PersonalInfoStep = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Phone Number"
          value={formData.phone || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          placeholder="+1 (555) 123-4567"
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          multiline
          rows={4}
          label="Professional Bio"
          value={formData.bio || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
          placeholder="Tell us about yourself, your teaching philosophy, and what makes you a great teacher..."
          helperText={`${(formData.bio || '').length}/2000 characters`}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="LinkedIn Profile"
          value={formData.socialLinks?.linkedin || ''}
          onChange={(e) => setFormData(prev => ({ 
            ...prev, 
            socialLinks: { ...prev.socialLinks, linkedin: e.target.value }
          }))}
          placeholder="https://linkedin.com/in/yourprofile"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Portfolio/Website"
          value={formData.socialLinks?.portfolio || ''}
          onChange={(e) => setFormData(prev => ({ 
            ...prev, 
            socialLinks: { ...prev.socialLinks, portfolio: e.target.value }
          }))}
          placeholder="https://yourportfolio.com"
        />
      </Grid>
    </Grid>
  );

  const ProfessionalBackgroundStep = () => {
    const [newSkill, setNewSkill] = useState('');
    const [newLanguage, setNewLanguage] = useState('');

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="number"
            label="Years of Experience"
            value={formData.experience || 0}
            onChange={(e) => setFormData(prev => ({ ...prev, experience: parseInt(e.target.value) || 0 }))}
            inputProps={{ min: 0 }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="number"
            label="Hourly Rate (USD)"
            value={formData.hourlyRate || 0}
            onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: parseFloat(e.target.value) || 0 }))}
            inputProps={{ min: 0, step: 0.01 }}
          />
        </Grid>

        {/* Education */}
        <Grid item xs={12}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Education</Typography>
            <Button onClick={addEducation} variant="outlined" size="small">
              Add Education
            </Button>
          </Box>
          {(formData.education || []).map((edu, index) => (
            <Card key={index} sx={{ mb: 2 }}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Degree"
                      value={edu.degree}
                      onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Institution"
                      value={edu.institution}
                      onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Year"
                      value={edu.year}
                      onChange={(e) => updateEducation(index, 'year', parseInt(e.target.value))}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Field of Study"
                      value={edu.field || ''}
                      onChange={(e) => updateEducation(index, 'field', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button 
                      onClick={() => removeEducation(index)} 
                      color="error" 
                      size="small"
                    >
                      Remove
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))}
        </Grid>

        {/* Skills */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>Skills</Typography>
          <Box display="flex" gap={1} mb={2}>
            <TextField
              label="Add Skill"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addArrayItem('skills', newSkill);
                  setNewSkill('');
                }
              }}
            />
            <Button 
              onClick={() => {
                addArrayItem('skills', newSkill);
                setNewSkill('');
              }}
              variant="outlined"
            >
              Add
            </Button>
          </Box>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {(formData.skills || []).map((skill, index) => (
              <Chip
                key={index}
                label={skill}
                onDelete={() => removeArrayItem('skills', index)}
                color="primary"
                variant="outlined"
              />
            ))}
          </Box>
        </Grid>

        {/* Languages */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>Languages</Typography>
          <Box display="flex" gap={1} mb={2}>
            <TextField
              label="Add Language"
              value={newLanguage}
              onChange={(e) => setNewLanguage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addArrayItem('languages', newLanguage);
                  setNewLanguage('');
                }
              }}
            />
            <Button 
              onClick={() => {
                addArrayItem('languages', newLanguage);
                setNewLanguage('');
              }}
              variant="outlined"
            >
              Add
            </Button>
          </Box>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {(formData.languages || []).map((language, index) => (
              <Chip
                key={index}
                label={language}
                onDelete={() => removeArrayItem('languages', index)}
                color="secondary"
                variant="outlined"
              />
            ))}
          </Box>
        </Grid>
      </Grid>
    );
  };

  const TeachingExpertiseStep = () => {
    const [newSpecialization, setNewSpecialization] = useState('');
    const [newTeachingArea, setNewTeachingArea] = useState('');

    return (
      <Grid container spacing={3}>
        {/* Specializations */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>Specializations *</Typography>
          <Box display="flex" gap={1} mb={2}>
            <TextField
              label="Add Specialization"
              value={newSpecialization}
              onChange={(e) => setNewSpecialization(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addArrayItem('specialization', newSpecialization);
                  setNewSpecialization('');
                }
              }}
            />
            <Button 
              onClick={() => {
                addArrayItem('specialization', newSpecialization);
                setNewSpecialization('');
              }}
              variant="outlined"
            >
              Add
            </Button>
          </Box>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {(formData.specialization || []).map((spec, index) => (
              <Chip
                key={index}
                label={spec}
                onDelete={() => removeArrayItem('specialization', index)}
                color="primary"
              />
            ))}
          </Box>
        </Grid>

        {/* Teaching Areas */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>Teaching Areas *</Typography>
          <Box display="flex" gap={1} mb={2}>
            <TextField
              label="Add Teaching Area"
              value={newTeachingArea}
              onChange={(e) => setNewTeachingArea(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addArrayItem('teachingAreas', newTeachingArea);
                  setNewTeachingArea('');
                }
              }}
            />
            <Button 
              onClick={() => {
                addArrayItem('teachingAreas', newTeachingArea);
                setNewTeachingArea('');
              }}
              variant="outlined"
            >
              Add
            </Button>
          </Box>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {(formData.teachingAreas || []).map((area, index) => (
              <Chip
                key={index}
                label={area}
                onDelete={() => removeArrayItem('teachingAreas', index)}
                color="secondary"
              />
            ))}
          </Box>
        </Grid>

        {/* Preferred Levels */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>Preferred Teaching Levels</Typography>
          <Box>
            {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
              <FormControlLabel
                key={level}
                control={
                  <Checkbox
                    checked={(formData.preferredLevels || []).includes(level as any)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData(prev => ({
                          ...prev,
                          preferredLevels: [...(prev.preferredLevels || []), level as any]
                        }));
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          preferredLevels: (prev.preferredLevels || []).filter(l => l !== level)
                        }));
                      }
                    }}
                  />
                }
                label={level}
              />
            ))}
          </Box>
        </Grid>
      </Grid>
    );
  };

  const ReviewStep = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>Review Your Profile</Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Please review all the information below before submitting your profile for approval.
        </Typography>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Personal Information</Typography>
            <Typography><strong>Phone:</strong> {formData.phone || 'Not provided'}</Typography>
            <Typography><strong>Bio:</strong> {formData.bio || 'Not provided'}</Typography>
            <Typography><strong>LinkedIn:</strong> {formData.socialLinks?.linkedin || 'Not provided'}</Typography>
            <Typography><strong>Portfolio:</strong> {formData.socialLinks?.portfolio || 'Not provided'}</Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Professional Background</Typography>
            <Typography><strong>Experience:</strong> {formData.experience} years</Typography>
            <Typography><strong>Hourly Rate:</strong> ${formData.hourlyRate}</Typography>
            <Typography><strong>Education:</strong> {(formData.education || []).length} entries</Typography>
            <Typography><strong>Skills:</strong> {(formData.skills || []).join(', ') || 'None'}</Typography>
            <Typography><strong>Languages:</strong> {(formData.languages || []).join(', ') || 'None'}</Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Teaching Expertise</Typography>
            <Typography><strong>Specializations:</strong> {(formData.specialization || []).join(', ')}</Typography>
            <Typography><strong>Teaching Areas:</strong> {(formData.teachingAreas || []).join(', ')}</Typography>
            <Typography><strong>Preferred Levels:</strong> {(formData.preferredLevels || []).join(', ') || 'None'}</Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return <PersonalInfoStep />;
      case 1:
        return <ProfessionalBackgroundStep />;
      case 2:
        return <TeachingExpertiseStep />;
      case 3:
        return <ReviewStep />;
      default:
        return 'Unknown step';
    }
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 0:
        return true; // Personal info is optional
      case 1:
        return (formData.experience || 0) >= 0;
      case 2:
        return (formData.specialization || []).length > 0 && (formData.teachingAreas || []).length > 0;
      case 3:
        return true;
      default:
        return false;
    }
  };

  return (
    <Container maxWidth="md">
      <Box mt={4} mb={4}>
        <Typography variant="h4" gutterBottom>
          Complete Your Teacher Profile
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Complete your profile to get approved as a teacher and start creating courses.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <Paper sx={{ p: 3 }}>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box sx={{ mb: 4 }}>
            {getStepContent(activeStep)}
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
            <Button
              color="inherit"
              disabled={activeStep === 0}
              onClick={handleBack}
              sx={{ mr: 1 }}
            >
              Back
            </Button>
            <Box sx={{ flex: '1 1 auto' }} />
            
            <Button
              onClick={handleSave}
              disabled={submitting}
              sx={{ mr: 1 }}
            >
              {submitting ? <CircularProgress size={20} /> : 'Save Draft'}
            </Button>

            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleSubmitForApproval}
                disabled={submitting || !isStepValid(activeStep)}
                startIcon={<Send />}
              >
                {submitting ? <CircularProgress size={20} /> : 'Submit for Approval'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={!isStepValid(activeStep)}
              >
                Next
              </Button>
            )}
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default ProfileCompletion;

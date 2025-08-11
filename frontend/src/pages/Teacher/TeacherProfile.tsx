import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  Grid,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Badge
} from '@mui/material';
import {
  Add,
  Delete,
  Save,
  Send,
  Person,
  School,
  Work,
  Language,
  Schedule,
  Link as LinkIcon,
  CheckCircle,
  Pending,
  Cancel,
  PhotoCamera,
  Upload
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { 
  teacherProfileService, 
  ITeacherProfile, 
  IEducation, 
  ICertification,
  ISocialLinks,
  IAddress
} from '../../services/teacherProfileService';

const steps = [
  'Personal Information',
  'Professional Background',
  'Teaching Expertise',
  'Review & Submit'
];

const TeacherProfile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [profile, setProfile] = useState<ITeacherProfile | null>(null);

  // Form data state
  const [formData, setFormData] = useState({
    // Personal Information
    phone: '',
    dateOfBirth: '',
    profilePicture: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      zipCode: ''
    } as IAddress,
    
    // Professional Information
    specialization: [] as string[],
    bio: '',
    experience: 0,
    education: [] as IEducation[],
    
    // Certifications and Skills
    certifications: [] as ICertification[],
    skills: [] as string[],
    languages: [] as string[],
    
    // Teaching Information
    teachingAreas: [] as string[],
    preferredLevels: [] as ('Beginner' | 'Intermediate' | 'Advanced')[],
    hourlyRate: 0,
    
    // Social Links
    socialLinks: {
      linkedin: '',
      github: '',
      portfolio: '',
      website: ''
    } as ISocialLinks
  });

  // Temporary input states
  const [newSkill, setNewSkill] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [newSpecialization, setNewSpecialization] = useState('');
  const [newTeachingArea, setNewTeachingArea] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Load existing profile
  useEffect(() => {
    const loadProfile = async () => {
      if (!user || user.role !== 'teacher') return;
      
      try {
        setLoading(true);
        const existingProfile = await teacherProfileService.getMyProfile();
        setProfile(existingProfile);
        
        // Populate form with existing data
        setFormData({
          phone: existingProfile.phone || '',
          dateOfBirth: existingProfile.dateOfBirth || '',
          profilePicture: existingProfile.profilePicture || '',
          address: existingProfile.address || {
            street: '',
            city: '',
            state: '',
            country: '',
            zipCode: ''
          },
          specialization: existingProfile.specialization || [],
          bio: existingProfile.bio || '',
          experience: existingProfile.experience || 0,
          education: existingProfile.education || [],
          certifications: existingProfile.certifications || [],
          skills: existingProfile.skills || [],
          languages: existingProfile.languages || [],
          teachingAreas: existingProfile.teachingAreas || [],
          preferredLevels: existingProfile.preferredLevels || [],
          hourlyRate: existingProfile.hourlyRate || 0,
          socialLinks: existingProfile.socialLinks || {
            linkedin: '',
            github: '',
            portfolio: '',
            website: ''
          }
        });
        
      } catch (err: any) {
        if (err.response?.status !== 404) {
          setError(err.message || 'Failed to load profile');
        }
        // If 404, it means profile doesn't exist yet, which is fine
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  // Handle form input changes
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedInputChange = (parent: string, field: string, value: any) => {
    setFormData(prev => {
      const parentObj = prev[parent as keyof typeof prev] as any;
      return {
        ...prev,
        [parent]: {
          ...parentObj,
          [field]: value
        }
      };
    });
  };

  // Array management functions
  const addToArray = (field: keyof typeof formData, value: string) => {
    if (!value.trim()) return;
    
    const currentArray = formData[field] as string[];
    if (!currentArray.includes(value.trim())) {
      setFormData(prev => ({
        ...prev,
        [field]: [...currentArray, value.trim()]
      }));
    }
  };

  const removeFromArray = (field: keyof typeof formData, index: number) => {
    const currentArray = formData[field] as string[];
    setFormData(prev => ({
      ...prev,
      [field]: currentArray.filter((_, i) => i !== index)
    }));
  };

  // Education management
  const addEducation = () => {
    const newEducation: IEducation = {
      degree: '',
      institution: '',
      year: new Date().getFullYear(),
      field: ''
    };
    setFormData(prev => ({
      ...prev,
      education: [...prev.education, newEducation]
    }));
  };

  const updateEducation = (index: number, field: keyof IEducation, value: any) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.map((edu, i) => 
        i === index ? { ...edu, [field]: value } : edu
      )
    }));
  };

  const removeEducation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  // Certification management
  const addCertification = () => {
    const newCertification: ICertification = {
      name: '',
      issuer: '',
      issueDate: '',
      expiryDate: '',
      credentialId: ''
    };
    setFormData(prev => ({
      ...prev,
      certifications: [...prev.certifications, newCertification]
    }));
  };

  const updateCertification = (index: number, field: keyof ICertification, value: any) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.map((cert, i) => 
        i === index ? { ...cert, [field]: value } : cert
      )
    }));
  };

  const removeCertification = (index: number) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

  // Profile picture upload
  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    try {
      setUploadingImage(true);
      setError(null);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);

      // For now, we'll use a simple base64 conversion
      // In production, you'd upload to a service like Cloudinary
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64String = e.target?.result as string;
        handleInputChange('profilePicture', base64String);
      };
      reader.readAsDataURL(file);

    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  // Form validation
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0: // Personal Information
        return !!(formData.phone && formData.address.city && formData.address.country);
      case 1: // Professional Background
        return !!(formData.bio && formData.experience >= 0 && formData.education.length > 0);
      case 2: // Teaching Expertise
        return !!(formData.specialization.length > 0 && formData.teachingAreas.length > 0);
      default:
        return true;
    }
  };

  // Navigation
  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
      setError(null);
    } else {
      setError('Please fill in all required fields before proceeding.');
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
    setError(null);
  };

  // Clean and prepare data for submission
  const prepareFormData = (data: typeof formData) => {
    const cleanData: any = { ...data };

    // Clean empty strings and convert to proper types
    if (!cleanData.phone?.trim()) delete cleanData.phone;
    if (!cleanData.dateOfBirth?.trim()) delete cleanData.dateOfBirth;
    if (!cleanData.profilePicture?.trim()) delete cleanData.profilePicture;
    if (!cleanData.bio?.trim()) delete cleanData.bio;

    // Clean address - remove empty fields
    if (cleanData.address) {
      const address = { ...cleanData.address };
      Object.keys(address).forEach(key => {
        if (!address[key as keyof typeof address]?.trim()) {
          delete address[key as keyof typeof address];
        }
      });
      if (Object.keys(address).length === 0) {
        delete cleanData.address;
      } else {
        cleanData.address = address;
      }
    }

    // Clean social links - remove empty fields
    if (cleanData.socialLinks) {
      const socialLinks = { ...cleanData.socialLinks };
      Object.keys(socialLinks).forEach(key => {
        if (!socialLinks[key as keyof typeof socialLinks]?.trim()) {
          delete socialLinks[key as keyof typeof socialLinks];
        }
      });
      if (Object.keys(socialLinks).length === 0) {
        delete cleanData.socialLinks;
      } else {
        cleanData.socialLinks = socialLinks;
      }
    }

    // Clean arrays - remove empty items
    cleanData.specialization = cleanData.specialization.filter((item: string) => item.trim());
    cleanData.skills = cleanData.skills.filter((item: string) => item.trim());
    cleanData.languages = cleanData.languages.filter((item: string) => item.trim());
    cleanData.teachingAreas = cleanData.teachingAreas.filter((item: string) => item.trim());

    // Clean education array - remove incomplete entries
    cleanData.education = cleanData.education.filter((edu: any) =>
      edu.degree?.trim() && edu.institution?.trim() && edu.year
    );

    // Clean certifications array - remove incomplete entries
    cleanData.certifications = cleanData.certifications.filter((cert: any) =>
      cert.name?.trim() && cert.issuer?.trim()
    );

    return cleanData;
  };

  // Save draft
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const cleanedData = prepareFormData(formData);
      console.log('Saving profile with cleaned data:', JSON.stringify(cleanedData, null, 2));
      console.log('Profile exists:', !!profile);

      if (profile) {
        const updatedProfile = await teacherProfileService.updateMyProfile(cleanedData);
        setProfile(updatedProfile);
        setSuccess('Profile saved successfully!');
      } else {
        // For new profiles, we'll use updateMyProfile which will create if doesn't exist
        const newProfile = await teacherProfileService.updateMyProfile(cleanedData);
        setProfile(newProfile);
        setSuccess('Profile created successfully!');
      }
    } catch (err: any) {
      console.error('Error saving profile:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.error || err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  // Submit for approval
  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);

      const cleanedData = prepareFormData(formData);
      console.log('Submitting profile with cleaned data:', JSON.stringify(cleanedData, null, 2));

      // First save the profile
      const savedProfile = await teacherProfileService.updateMyProfile(cleanedData);
      setProfile(savedProfile);

      // Then submit for approval
      const submittedProfile = await teacherProfileService.submitForApproval();
      setProfile(submittedProfile);

      setSuccess('Profile submitted for approval successfully! You will be notified once it\'s reviewed.');

      // Redirect to dashboard after a delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);

    } catch (err: any) {
      console.error('Error submitting profile:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.error || err.message || 'Failed to submit profile');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        {/* Header */}
        <Box mb={4}>
          <Typography variant="h4" gutterBottom>
            Teacher Profile
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Complete your teacher profile to start creating and teaching courses.
          </Typography>
          
          {/* Profile Status */}
          {profile && (
            <Box mt={2}>
              <Chip
                label={`Status: ${profile.profileStatus}`}
                color={
                  profile.profileStatus === 'approved' ? 'success' :
                  profile.profileStatus === 'pending' ? 'warning' :
                  profile.profileStatus === 'rejected' ? 'error' : 'default'
                }
                icon={
                  profile.profileStatus === 'approved' ? <CheckCircle /> :
                  profile.profileStatus === 'pending' ? <Pending /> :
                  profile.profileStatus === 'rejected' ? <Cancel /> : undefined
                }
              />
              
              {profile.profileStatus === 'rejected' && profile.rejectionReason && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">Rejection Reason:</Typography>
                  <Typography variant="body2">{profile.rejectionReason}</Typography>
                  {profile.adminFeedback && (
                    <>
                      <Typography variant="subtitle2" sx={{ mt: 1 }}>Admin Feedback:</Typography>
                      <Typography variant="body2">{profile.adminFeedback}</Typography>
                    </>
                  )}
                </Alert>
              )}
            </Box>
          )}
        </Box>

        {/* Error/Success Messages */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Progress Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Form Content */}
        <Box>
          {/* Step 0: Personal Information */}
          {activeStep === 0 && (
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Person sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    Personal Information
                  </Typography>
                </Box>

                <Grid container spacing={3}>
                  {/* Profile Picture Upload */}
                  <Grid item xs={12}>
                    <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
                      <Typography variant="subtitle1" gutterBottom>
                        Profile Picture
                      </Typography>
                      <Box position="relative" mb={2}>
                        <Avatar
                          src={formData.profilePicture || undefined}
                          sx={{ width: 120, height: 120, mb: 2 }}
                        >
                          {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </Avatar>
                        <Badge
                          overlap="circular"
                          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                          badgeContent={
                            <IconButton
                              color="primary"
                              aria-label="upload picture"
                              component="label"
                              sx={{
                                backgroundColor: 'primary.main',
                                color: 'white',
                                '&:hover': {
                                  backgroundColor: 'primary.dark',
                                },
                              }}
                              disabled={uploadingImage}
                            >
                              {uploadingImage ? (
                                <CircularProgress size={20} color="inherit" />
                              ) : (
                                <PhotoCamera />
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleProfilePictureUpload}
                                style={{ display: 'none' }}
                              />
                            </IconButton>
                          }
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary" textAlign="center">
                        Click the camera icon to upload a profile picture
                        <br />
                        (Max 5MB, JPG/PNG format)
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Phone Number *"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+1 (555) 123-4567"
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Date of Birth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom>
                      Address
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Street Address"
                      value={formData.address.street}
                      onChange={(e) => handleNestedInputChange('address', 'street', e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="City *"
                      value={formData.address.city}
                      onChange={(e) => handleNestedInputChange('address', 'city', e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="State/Province"
                      value={formData.address.state}
                      onChange={(e) => handleNestedInputChange('address', 'state', e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Country *"
                      value={formData.address.country}
                      onChange={(e) => handleNestedInputChange('address', 'country', e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="ZIP/Postal Code"
                      value={formData.address.zipCode}
                      onChange={(e) => handleNestedInputChange('address', 'zipCode', e.target.value)}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Step 1: Professional Background */}
          {activeStep === 1 && (
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Work sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    Professional Background
                  </Typography>
                </Box>

                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Professional Bio *"
                      multiline
                      rows={4}
                      value={formData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      placeholder="Tell us about your professional background, teaching philosophy, and what makes you a great teacher..."
                      helperText={`${formData.bio.length}/2000 characters`}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Years of Experience *"
                      type="number"
                      value={formData.experience}
                      onChange={(e) => handleInputChange('experience', parseInt(e.target.value) || 0)}
                      inputProps={{ min: 0, max: 50 }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Hourly Rate (USD)"
                      type="number"
                      value={formData.hourlyRate}
                      onChange={(e) => handleInputChange('hourlyRate', parseFloat(e.target.value) || 0)}
                      inputProps={{ min: 0, step: 0.01 }}
                      InputProps={{ startAdornment: '$' }}
                    />
                  </Grid>

                  {/* Education Section */}
                  <Grid item xs={12}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="subtitle1">
                        Education *
                      </Typography>
                      <Button
                        startIcon={<Add />}
                        onClick={addEducation}
                        variant="outlined"
                        size="small"
                      >
                        Add Education
                      </Button>
                    </Box>

                    {formData.education.map((edu, index) => (
                      <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                        <CardContent>
                          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Typography variant="subtitle2">Education #{index + 1}</Typography>
                            <IconButton
                              onClick={() => removeEducation(index)}
                              color="error"
                              size="small"
                            >
                              <Delete />
                            </IconButton>
                          </Box>

                          <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                              <TextField
                                fullWidth
                                label="Degree"
                                value={edu.degree}
                                onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                                placeholder="Bachelor of Science"
                              />
                            </Grid>

                            <Grid item xs={12} md={6}>
                              <TextField
                                fullWidth
                                label="Field of Study"
                                value={edu.field || ''}
                                onChange={(e) => updateEducation(index, 'field', e.target.value)}
                                placeholder="Computer Science"
                              />
                            </Grid>

                            <Grid item xs={12} md={6}>
                              <TextField
                                fullWidth
                                label="Institution"
                                value={edu.institution}
                                onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                                placeholder="University Name"
                              />
                            </Grid>

                            <Grid item xs={12} md={6}>
                              <TextField
                                fullWidth
                                label="Graduation Year"
                                type="number"
                                value={edu.year}
                                onChange={(e) => updateEducation(index, 'year', parseInt(e.target.value) || new Date().getFullYear())}
                                inputProps={{ min: 1950, max: new Date().getFullYear() + 10 }}
                              />
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    ))}

                    {formData.education.length === 0 && (
                      <Alert severity="info">
                        Please add at least one education entry to continue.
                      </Alert>
                    )}
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Teaching Expertise */}
          {activeStep === 2 && (
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <School sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    Teaching Expertise
                  </Typography>
                </Box>

                <Grid container spacing={3}>
                  {/* Specialization */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom>
                      Specialization Areas *
                    </Typography>
                    <Box display="flex" gap={1} mb={2}>
                      <TextField
                        fullWidth
                        label="Add Specialization"
                        value={newSpecialization}
                        onChange={(e) => setNewSpecialization(e.target.value)}
                        placeholder="e.g., Web Development, Data Science"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addToArray('specialization', newSpecialization);
                            setNewSpecialization('');
                          }
                        }}
                      />
                      <Button
                        variant="outlined"
                        onClick={() => {
                          addToArray('specialization', newSpecialization);
                          setNewSpecialization('');
                        }}
                        disabled={!newSpecialization.trim()}
                      >
                        Add
                      </Button>
                    </Box>
                    <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                      {formData.specialization.map((spec, index) => (
                        <Chip
                          key={index}
                          label={spec}
                          onDelete={() => removeFromArray('specialization', index)}
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                    {formData.specialization.length === 0 && (
                      <Alert severity="info">
                        Please add at least one specialization area.
                      </Alert>
                    )}
                  </Grid>

                  {/* Teaching Areas */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom>
                      Teaching Areas *
                    </Typography>
                    <Box display="flex" gap={1} mb={2}>
                      <TextField
                        fullWidth
                        label="Add Teaching Area"
                        value={newTeachingArea}
                        onChange={(e) => setNewTeachingArea(e.target.value)}
                        placeholder="e.g., Programming, Mathematics"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addToArray('teachingAreas', newTeachingArea);
                            setNewTeachingArea('');
                          }
                        }}
                      />
                      <Button
                        variant="outlined"
                        onClick={() => {
                          addToArray('teachingAreas', newTeachingArea);
                          setNewTeachingArea('');
                        }}
                        disabled={!newTeachingArea.trim()}
                      >
                        Add
                      </Button>
                    </Box>
                    <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                      {formData.teachingAreas.map((area, index) => (
                        <Chip
                          key={index}
                          label={area}
                          onDelete={() => removeFromArray('teachingAreas', index)}
                          color="secondary"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                    {formData.teachingAreas.length === 0 && (
                      <Alert severity="info">
                        Please add at least one teaching area.
                      </Alert>
                    )}
                  </Grid>

                  {/* Preferred Levels */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom>
                      Preferred Teaching Levels
                    </Typography>
                    <Box>
                      {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
                        <FormControlLabel
                          key={level}
                          control={
                            <Checkbox
                              checked={formData.preferredLevels.includes(level as any)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData(prev => ({
                                    ...prev,
                                    preferredLevels: [...prev.preferredLevels, level as any]
                                  }));
                                } else {
                                  setFormData(prev => ({
                                    ...prev,
                                    preferredLevels: prev.preferredLevels.filter(l => l !== level)
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

                  {/* Skills */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>
                      Skills
                    </Typography>
                    <Box display="flex" gap={1} mb={2}>
                      <TextField
                        fullWidth
                        label="Add Skill"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        placeholder="e.g., JavaScript, Python"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addToArray('skills', newSkill);
                            setNewSkill('');
                          }
                        }}
                      />
                      <Button
                        variant="outlined"
                        onClick={() => {
                          addToArray('skills', newSkill);
                          setNewSkill('');
                        }}
                        disabled={!newSkill.trim()}
                      >
                        Add
                      </Button>
                    </Box>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {formData.skills.map((skill, index) => (
                        <Chip
                          key={index}
                          label={skill}
                          onDelete={() => removeFromArray('skills', index)}
                          size="small"
                        />
                      ))}
                    </Box>
                  </Grid>

                  {/* Languages */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>
                      Languages
                    </Typography>
                    <Box display="flex" gap={1} mb={2}>
                      <TextField
                        fullWidth
                        label="Add Language"
                        value={newLanguage}
                        onChange={(e) => setNewLanguage(e.target.value)}
                        placeholder="e.g., English, Spanish"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addToArray('languages', newLanguage);
                            setNewLanguage('');
                          }
                        }}
                      />
                      <Button
                        variant="outlined"
                        onClick={() => {
                          addToArray('languages', newLanguage);
                          setNewLanguage('');
                        }}
                        disabled={!newLanguage.trim()}
                      >
                        Add
                      </Button>
                    </Box>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {formData.languages.map((language, index) => (
                        <Chip
                          key={index}
                          label={language}
                          onDelete={() => removeFromArray('languages', index)}
                          size="small"
                        />
                      ))}
                    </Box>
                  </Grid>

                  {/* Social Links */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom>
                      <LinkIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Social Links (Optional)
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="LinkedIn Profile"
                          value={formData.socialLinks.linkedin}
                          onChange={(e) => handleNestedInputChange('socialLinks', 'linkedin', e.target.value)}
                          placeholder="https://linkedin.com/in/yourprofile"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="GitHub Profile"
                          value={formData.socialLinks.github}
                          onChange={(e) => handleNestedInputChange('socialLinks', 'github', e.target.value)}
                          placeholder="https://github.com/yourusername"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Portfolio Website"
                          value={formData.socialLinks.portfolio}
                          onChange={(e) => handleNestedInputChange('socialLinks', 'portfolio', e.target.value)}
                          placeholder="https://yourportfolio.com"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Personal Website"
                          value={formData.socialLinks.website}
                          onChange={(e) => handleNestedInputChange('socialLinks', 'website', e.target.value)}
                          placeholder="https://yourwebsite.com"
                        />
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Review & Submit */}
          {activeStep === 3 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Review & Submit
                </Typography>

                <Alert severity="info" sx={{ mb: 3 }}>
                  Please review your information before submitting. Once submitted, your profile will be reviewed by our admin team.
                </Alert>

                {/* Profile Summary */}
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          Personal Information
                        </Typography>
                        <Typography variant="body2">Phone: {formData.phone}</Typography>
                        <Typography variant="body2">
                          Location: {formData.address.city}, {formData.address.country}
                        </Typography>
                        {formData.dateOfBirth && (
                          <Typography variant="body2">
                            Date of Birth: {new Date(formData.dateOfBirth).toLocaleDateString()}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          Professional Background
                        </Typography>
                        <Typography variant="body2">Experience: {formData.experience} years</Typography>
                        <Typography variant="body2">Education: {formData.education.length} entries</Typography>
                        {formData.hourlyRate > 0 && (
                          <Typography variant="body2">Hourly Rate: ${formData.hourlyRate}</Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          Teaching Expertise
                        </Typography>
                        <Box mb={2}>
                          <Typography variant="body2" gutterBottom>
                            <strong>Specializations:</strong>
                          </Typography>
                          <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                            {formData.specialization.map((spec, index) => (
                              <Chip key={index} label={spec} size="small" color="primary" />
                            ))}
                          </Box>
                        </Box>

                        <Box mb={2}>
                          <Typography variant="body2" gutterBottom>
                            <strong>Teaching Areas:</strong>
                          </Typography>
                          <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                            {formData.teachingAreas.map((area, index) => (
                              <Chip key={index} label={area} size="small" color="secondary" />
                            ))}
                          </Box>
                        </Box>

                        {formData.preferredLevels.length > 0 && (
                          <Box mb={2}>
                            <Typography variant="body2" gutterBottom>
                              <strong>Preferred Levels:</strong>
                            </Typography>
                            <Box display="flex" flexWrap="wrap" gap={1}>
                              {formData.preferredLevels.map((level, index) => (
                                <Chip key={index} label={level} size="small" variant="outlined" />
                              ))}
                            </Box>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>

                  {formData.bio && (
                    <Grid item xs={12}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle1" gutterBottom>
                            Professional Bio
                          </Typography>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                            {formData.bio}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          )}
        </Box>

        {/* Navigation Buttons */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mt={4}>
          <Button
            onClick={handleBack}
            disabled={activeStep === 0}
            variant="outlined"
          >
            Back
          </Button>

          <Box display="flex" gap={2}>
            {/* Save Draft Button */}
            <Button
              onClick={handleSave}
              disabled={saving}
              variant="outlined"
              startIcon={saving ? <CircularProgress size={20} /> : <Save />}
            >
              {saving ? 'Saving...' : 'Save Draft'}
            </Button>

            {/* Next/Submit Button */}
            {activeStep < steps.length - 1 ? (
              <Button
                onClick={handleNext}
                variant="contained"
                disabled={!validateStep(activeStep)}
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={submitting || profile?.profileStatus === 'pending'}
                variant="contained"
                color="success"
                startIcon={submitting ? <CircularProgress size={20} /> : <Send />}
              >
                {submitting
                  ? 'Submitting...'
                  : profile?.profileStatus === 'pending'
                    ? 'Already Submitted'
                    : 'Submit for Approval'
                }
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default TeacherProfile;

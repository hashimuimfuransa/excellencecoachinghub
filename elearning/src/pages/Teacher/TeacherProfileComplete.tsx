import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardHeader,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Chip,
  LinearProgress,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Avatar,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Divider,
  IconButton
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
  Person,
  School,
  MenuBook,
  CloudUpload,
  CloudDownload,
  Check,
  Warning,
  Delete,
  Description
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { teacherProfileService, ITeacherProfile, IUpdateTeacherProfileData } from '../../services/teacherProfileService';


const TeacherProfileComplete: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ITeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  // Form data
  const [formData, setFormData] = useState<IUpdateTeacherProfileData>({
    phone: '',
    dateOfBirth: '',
    nationalId: '',
    address: {
      province: '',
      district: '',
      sector: '',
      cell: '',
      village: '',
      country: 'Rwanda'
    },
    specialization: [],
    bio: '',
    experience: 0,
    education: [],
    certifications: [],
    skills: [],
    languages: [],
    teachingAreas: [],
    preferredLevels: [],
    hourlyRate: 0,
    paymentType: 'per_hour',
    monthlyRate: 0,
    socialLinks: {
      linkedin: '',
      github: '',
      portfolio: '',
      website: ''
    }
  });



  // CV upload
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvUploading, setCvUploading] = useState(false);

  // Profile picture upload
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const [profilePictureUploading, setProfilePictureUploading] = useState(false);

  const steps = [
    { label: 'Personal Info', icon: <Person /> },
    { label: 'Professional', icon: <School /> },
    { label: 'Teaching', icon: <MenuBook /> },
    { label: 'Documents', icon: <CloudUpload /> }
  ];

  const theme = useTheme();
  const isMobile = useMediaQuery(theme?.breakpoints?.down?.('sm') || '(max-width:600px)');
  const isTablet = useMediaQuery(theme?.breakpoints?.down?.('md') || '(max-width:900px)');

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    calculateCompletionPercentage();
  }, [formData, cvFile, profilePicture]);

  // Auto-save form data to localStorage to prevent data loss
  useEffect(() => {
    if (formData && Object.keys(formData).length > 0) {
      setAutoSaveStatus('saving');
      try {
        localStorage.setItem('teacherProfileFormData', JSON.stringify(formData));
        setAutoSaveStatus('saved');
        console.log('💾 Form data auto-saved to localStorage');
      } catch (error) {
        console.warn('Failed to save form data to localStorage:', error);
        setAutoSaveStatus('error');
      }
    }
  }, [formData]);



  const loadProfile = async () => {
    try {
      console.log('🔍 Loading teacher profile...');
      const profileData = await teacherProfileService.getMyProfile();
      console.log('🔍 Profile loaded:', profileData);
      console.log('🔍 CV Document:', profileData.cvDocument);
      console.log('🔍 Profile Status:', profileData.profileStatus);
      console.log('🔍 Profile Data Keys:', Object.keys(profileData));
      console.log('🔍 Specialization:', profileData.specialization);
      console.log('🔍 Bio:', profileData.bio);
      console.log('🔍 Experience:', profileData.experience);
      
      setProfile(profileData);

      // Try to restore form data from localStorage first
      let savedFormData = null;
      try {
        const savedData = localStorage.getItem('teacherProfileFormData');
        if (savedData) {
          savedFormData = JSON.parse(savedData);
          console.log('📱 Restored form data from localStorage:', savedFormData);
        }
      } catch (error) {
        console.warn('Failed to parse saved form data:', error);
      }
      
      // For pending/approved profiles, prioritize server data over localStorage
      // For incomplete profiles, use localStorage if available (for auto-save feature)
      const shouldUseServerData = profileData.profileStatus === 'pending' || profileData.profileStatus === 'approved';
      
      // Clear localStorage for pending/approved profiles to avoid confusion
      if (shouldUseServerData && savedFormData) {
        try {
          localStorage.removeItem('teacherProfileFormData');
          console.log('🧹 Cleared localStorage for pending/approved profile');
        } catch (error) {
          console.warn('Failed to clear localStorage:', error);
        }
      }
      
      // Use server data if profile is pending/approved, otherwise use saved form data if available
      const baseFormData = shouldUseServerData ? {
        phone: profileData.phone || '',
        dateOfBirth: profileData.dateOfBirth ? profileData.dateOfBirth.split('T')[0] : '',
        nationalId: profileData.nationalId || '',
        address: {
          province: profileData.address?.province || '',
          district: profileData.address?.district || '',
          sector: profileData.address?.sector || '',
          cell: profileData.address?.cell || '',
          village: profileData.address?.village || '',
          country: profileData.address?.country || 'Rwanda'
        },
        specialization: profileData.specialization || [],
        bio: profileData.bio || '',
        experience: profileData.experience || 0,
        education: profileData.education || [],
        certifications: profileData.certifications || [],
        skills: profileData.skills || [],
        languages: profileData.languages || [],
        teachingAreas: profileData.teachingAreas || [],
        preferredLevels: profileData.preferredLevels || [],
        hourlyRate: profileData.hourlyRate || 0,
        paymentType: profileData.paymentType || 'per_hour',
        monthlyRate: profileData.monthlyRate || 0,
        socialLinks: {
          linkedin: profileData.socialLinks?.linkedin || '',
          github: profileData.socialLinks?.github || '',
          portfolio: profileData.socialLinks?.portfolio || '',
          website: profileData.socialLinks?.website || ''
        }
      } : (savedFormData || {
        phone: profileData.phone || '',
        dateOfBirth: profileData.dateOfBirth ? profileData.dateOfBirth.split('T')[0] : '',
        nationalId: profileData.nationalId || '',
        address: {
          province: profileData.address?.province || '',
          district: profileData.address?.district || '',
          sector: profileData.address?.sector || '',
          cell: profileData.address?.cell || '',
          village: profileData.address?.village || '',
          country: profileData.address?.country || 'Rwanda'
        },
        specialization: profileData.specialization || [],
        bio: profileData.bio || '',
        experience: profileData.experience || 0,
        education: profileData.education || [],
        certifications: profileData.certifications || [],
        skills: profileData.skills || [],
        languages: profileData.languages || [],
        teachingAreas: profileData.teachingAreas || [],
        preferredLevels: profileData.preferredLevels || [],
        hourlyRate: profileData.hourlyRate || 0,
        paymentType: profileData.paymentType || 'per_hour',
        monthlyRate: profileData.monthlyRate || 0,
        socialLinks: {
          linkedin: profileData.socialLinks?.linkedin || '',
          github: profileData.socialLinks?.github || '',
          portfolio: profileData.socialLinks?.portfolio || '',
          website: profileData.socialLinks?.website || ''
        }
      });

      setFormData(baseFormData);
      console.log('🔍 Form data set:', baseFormData);
      console.log('🔍 Using server data:', shouldUseServerData);

      if (profileData.profilePicture) {
        setProfilePicturePreview(profileData.profilePicture);
      }
    } catch (err: any) {
      console.error('❌ Error loading profile:', err);
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const calculateCompletionPercentage = () => {
    const requiredFields = [
      formData.phone,
      formData.dateOfBirth,
      formData.nationalId,
      formData.address?.province,
      formData.address?.district,
      formData.address?.sector,
      formData.address?.cell,
      formData.specialization?.length > 0,
      formData.bio,
      formData.experience > 0,
      formData.education?.length > 0,
      formData.teachingAreas?.length > 0,
      formData.preferredLevels?.length > 0,
      formData.hourlyRate > 0 || formData.monthlyRate > 0,
      cvFile || profile?.cvDocument,
      profilePicture || profile?.profilePicture
    ];

    const completedFields = requiredFields.filter(Boolean).length;
    const percentage = Math.round((completedFields / requiredFields.length) * 100);
    setCompletionPercentage(percentage);
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof IUpdateTeacherProfileData],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleArrayChange = (field: string, value: string) => {
    const items = value.split(',').map(item => item.trim()).filter(item => item);
    setFormData(prev => ({
      ...prev,
      [field]: items
    }));
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('📸 Profile picture selected:', file.name, 'Size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
      
      // Clear any previous errors
      setError(null);
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Profile picture must be less than 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }

      setProfilePicture(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePicturePreview(e.target?.result as string);
        console.log('📸 Profile picture preview loaded');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Clear any previous errors
      setError(null);
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('CV file must be less than 10MB');
        return;
      }
      
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please select a PDF or Word document for your CV');
        return;
      }

      setCvFile(file);
      console.log('📄 CV file selected:', file.name, 'Size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
      setSuccess('CV file selected successfully. Click "Upload CV Now" to save it.');
    }
  };

  const uploadCV = async () => {
    if (!cvFile) return;

    console.log('📄 Starting CV upload...', cvFile.name);
    setCvUploading(true);
    try {
      const formData = new FormData();
      formData.append('cv', cvFile);

      console.log('📄 Uploading CV to server...');
      const response = await teacherProfileService.uploadCV(formData);
      console.log('📄 CV upload response:', response);
      
      if (response.success) {
        console.log('✅ CV uploaded successfully');
        setSuccess('CV uploaded successfully');
        setCvFile(null);
        
        // Update profile state with CV info without reloading entire form
        if (profile) {
          setProfile(prev => prev ? {
            ...prev,
            cvDocument: response.data?.cvDocument || prev.cvDocument
          } : null);
        }
        
        // Clear the file input
        const input = document.getElementById('cv-upload') as HTMLInputElement;
        if (input) input.value = '';
      } else {
        console.error('❌ CV upload failed:', response.error);
        setError(response.error || 'Failed to upload CV');
      }
    } catch (err: any) {
      console.error('❌ CV upload error:', err);
      setError(err.message || 'Failed to upload CV');
    } finally {
      setCvUploading(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Upload profile picture if selected
      if (profilePicture) {
        console.log('📸 Uploading profile picture...');
        setProfilePictureUploading(true);
        
        try {
          const pictureFormData = new FormData();
          pictureFormData.append('profilePicture', profilePicture);
          
          const uploadResponse = await teacherProfileService.uploadProfilePicture(pictureFormData);
          console.log('📸 Profile picture upload response:', uploadResponse);
          
          if (uploadResponse.success) {
            console.log('✅ Profile picture uploaded successfully');
            formData.profilePicture = uploadResponse.data.profilePicture;
          } else {
            console.error('❌ Profile picture upload failed:', uploadResponse.error);
            setError(uploadResponse.error || 'Failed to upload profile picture');
            return;
          }
        } finally {
          setProfilePictureUploading(false);
        }
      }

      console.log('💾 Saving profile data...');
      const response = await teacherProfileService.updateProfile(formData);
      console.log('💾 Profile save response:', response);
      
      if (response.success) {
        console.log('✅ Profile saved successfully');
        setSuccess('Profile saved successfully');
        await loadProfile();
      } else {
        console.error('❌ Profile save failed:', response.error);
        setError(response.error || 'Failed to save profile');
      }
    } catch (err: any) {
      console.error('❌ Profile save error:', err);
      setError(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const submitForReview = async () => {
    if (completionPercentage < 100) {
      setError('Please complete all required fields before submitting');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Save profile first
      await saveProfile();
      
      // Upload CV if not already uploaded
      if (cvFile) {
        await uploadCV();
      }

      // Submit for review
      const response = await teacherProfileService.submitProfile();
      if (response.success) {
        setSuccess('Profile submitted for review successfully! You will receive an email confirmation.');
        
        // Clear saved form data since profile is now submitted
        try {
          localStorage.removeItem('teacherProfileFormData');
          console.log('🧹 Cleared saved form data after successful submission');
        } catch (error) {
          console.warn('Failed to clear saved form data:', error);
        }
        
        // Reload profile to get updated status
        await loadProfile();
        
        setTimeout(() => {
          navigate('/teacher/profile-completion');
        }, 2000);
      } else {
        setError(response.error || 'Failed to submit profile');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit profile');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      <Card elevation={2}>
        <CardHeader
          title={
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                Complete Your Teacher Profile
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Fill in all required information to get your profile approved
              </Typography>
            </Box>
          }
          action={
            <Box display="flex" alignItems="center" gap={1}>
              <Chip 
                label={`${completionPercentage}% Complete`}
                color={completionPercentage === 100 ? 'success' : 'primary'}
                variant="outlined"
              />
              {autoSaveStatus === 'saved' && (
                <Chip 
                  label="Auto-saved"
                  color="success"
                  size="small"
                  icon={<Check />}
                />
              )}
              {autoSaveStatus === 'saving' && (
                <Chip 
                  label="Saving..."
                  color="info"
                  size="small"
                  icon={<CircularProgress size={12} />}
                />
              )}
              {autoSaveStatus === 'error' && (
                <Chip 
                  label="Save failed"
                  color="error"
                  size="small"
                  icon={<Warning />}
                />
              )}
            </Box>
          }
          sx={{ pb: 1 }}
        />
        
        <LinearProgress 
          variant="determinate" 
          value={completionPercentage} 
          sx={{ mb: 2 }}
          color={completionPercentage === 100 ? 'success' : 'primary'}
        />

        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              <Box display="flex" alignItems="center">
                <Warning sx={{ mr: 1 }} />
                {error}
              </Box>
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
              <Box display="flex" alignItems="center">
                <Check sx={{ mr: 1 }} />
                {success}
              </Box>
            </Alert>
          )}

          {/* Auto-save info */}
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              💾 <strong>Auto-save enabled:</strong> Your form data is automatically saved as you type, so you won't lose your progress even if the page refreshes or you navigate away.
              {profile?.profileStatus === 'pending' && (
                <Box component="span" sx={{ display: 'block', mt: 1, fontWeight: 'bold', color: 'primary.main' }}>
                  📋 Showing your submitted profile data (Status: Pending Review)
                </Box>
              )}
              {profile?.profileStatus === 'approved' && (
                <Box component="span" sx={{ display: 'block', mt: 1, fontWeight: 'bold', color: 'success.main' }}>
                  ✅ Showing your approved profile data (Status: Approved)
                </Box>
              )}
            </Typography>
          </Alert>

          {/* Step Navigation */}
          <Box sx={{ mb: { xs: 2, md: 4 } }}>
            <Stepper activeStep={activeStep} alternativeLabel={!isMobile} orientation={isMobile ? 'vertical' : 'horizontal'}>
              {steps.map((step, index) => (
                <Step key={step.label}>
                  <StepLabel 
                    icon={step.icon}
                    onClick={() => setActiveStep(index)}
                    sx={{ cursor: 'pointer' }}
                  >
                    {step.label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>

          {/* Step Content */}
          {activeStep === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper elevation={1} sx={{ p: { xs: 2, md: 3 }, height: '100%' }}>
                  <Typography variant="h6" gutterBottom>
                    <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Personal Information
                  </Typography>
                  
                  {/* Profile Picture */}
                  <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Avatar
                      src={profilePicturePreview || undefined}
                      sx={{ width: { xs: 96, md: 120 }, height: { xs: 96, md: 120 }, mx: 'auto', mb: 2 }}
                    >
                      {user?.firstName?.[0]}
                    </Avatar>
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="profile-picture-upload"
                      type="file"
                      onChange={handleProfilePictureChange}
                      disabled={profilePictureUploading}
                    />
                    
                    {profilePicturePreview ? (
                      <Box sx={{ mb: 2 }}>
                        <Alert severity="success" sx={{ mb: 2 }}>
                          <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Box>
                              <Box display="flex" alignItems="center">
                                <Check sx={{ mr: 1, color: 'success.main' }} />
                                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                  Profile picture selected
                                </Typography>
                              </Box>
                              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                                {profilePicture ? `File: ${profilePicture.name}` : 'Current profile picture'}
                              </Typography>
                            </Box>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={profilePictureUploading ? <CircularProgress size={16} /> : <CloudUpload />}
                              onClick={() => document.getElementById('profile-picture-upload')?.click()}
                              disabled={profilePictureUploading}
                            >
                              {profilePictureUploading ? 'Uploading...' : 'Replace'}
                            </Button>
                          </Box>
                        </Alert>
                      </Box>
                    ) : (
                      <Box sx={{ mb: 2 }}>
                        <Alert severity="info" sx={{ mb: 2 }}>
                          <Typography variant="body2" sx={{ mb: 2, fontWeight: 'medium' }}>
                            📸 Profile Picture
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 2 }}>
                            Upload a professional photo to complete your profile.
                          </Typography>
                          <label htmlFor="profile-picture-upload">
                            <Button 
                              variant="contained" 
                              component="span" 
                              startIcon={profilePictureUploading ? <CircularProgress size={16} /> : <CloudUpload />}
                              fullWidth
                              disabled={profilePictureUploading}
                            >
                              {profilePictureUploading ? 'Uploading...' : 'Choose Photo'}
                            </Button>
                          </label>
                        </Alert>
                      </Box>
                    )}
                    
                    <Typography variant="caption" display="block" color="text.secondary">
                      Accepted formats: JPG, PNG, GIF (Max 5MB)
                    </Typography>
                  </Box>

                  <TextField
                    fullWidth
                    label="Phone Number *"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+250 XXX XXX XXX"
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    fullWidth
                    label="Date of Birth *"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    fullWidth
                    label="National ID *"
                    value={formData.nationalId}
                    onChange={(e) => handleInputChange('nationalId', e.target.value)}
                    placeholder="16-digit National ID"
                    inputProps={{ maxLength: 16 }}
                    helperText="Enter your 16-digit Rwanda National ID"
                  />
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper elevation={1} sx={{ p: { xs: 2, md: 3 }, height: '100%' }}>
                  <Typography variant="h6" gutterBottom>
                    Address Information
                  </Typography>

                  <TextField
                    fullWidth
                    label="Country *"
                    value={formData.address?.country || ''}
                    onChange={(e) => handleInputChange('address.country', e.target.value)}
                    placeholder="e.g., Rwanda, United States"
                    sx={{ mb: 2 }}
                    inputProps={{
                      style: { 
                        fontSize: '14px',
                        padding: '12px 14px'
                      }
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Province *"
                    value={formData.address?.province || ''}
                    onChange={(e) => handleInputChange('address.province', e.target.value)}
                    placeholder="e.g., Kigali City, Eastern Province"
                    sx={{ mb: 2 }}
                    inputProps={{
                      style: { 
                        fontSize: '14px',
                        padding: '12px 14px'
                      }
                    }}
                  />

                  <TextField
                    fullWidth
                    label="District *"
                    value={formData.address?.district || ''}
                    onChange={(e) => handleInputChange('address.district', e.target.value)}
                    placeholder="e.g., Gasabo, Nyarugenge"
                    sx={{ mb: 2 }}
                    inputProps={{
                      style: { 
                        fontSize: '14px',
                        padding: '12px 14px'
                      }
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Sector *"
                    value={formData.address?.sector || ''}
                    onChange={(e) => handleInputChange('address.sector', e.target.value)}
                    placeholder="e.g., Kimironko, Remera"
                    sx={{ mb: 2 }}
                    inputProps={{
                      style: { 
                        fontSize: '14px',
                        padding: '12px 14px'
                      }
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Cell *"
                    value={formData.address?.cell || ''}
                    onChange={(e) => handleInputChange('address.cell', e.target.value)}
                    placeholder="e.g., Kibagabaga, Nyarutarama"
                    sx={{ mb: 2 }}
                    inputProps={{
                      style: { 
                        fontSize: '14px',
                        padding: '12px 14px'
                      }
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Village"
                    value={formData.address?.village || ''}
                    onChange={(e) => handleInputChange('address.village', e.target.value)}
                    placeholder="e.g., Umudugudu wa Mbanza"
                    inputProps={{
                      style: { 
                        fontSize: '14px',
                        padding: '12px 14px'
                      }
                    }}
                  />
                </Paper>
              </Grid>
            </Grid>
          )}

          {/* Step 2: Professional Information */}
          {activeStep === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={7}>
                <Paper elevation={1} sx={{ p: { xs: 2, md: 3 } }}>
                  <Typography variant="h6" gutterBottom>
                    <School sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Professional Details
                  </Typography>

                  <TextField
                    fullWidth
                    label="Specialization *"
                    value={formData.specialization?.join(', ') || ''}
                    onChange={(e) => handleArrayChange('specialization', e.target.value)}
                    placeholder="e.g., Mathematics, Physics, Chemistry"
                    helperText="You can type multiple specializations separated by commas. All characters including spaces and commas are supported."
                    sx={{ mb: 2 }}
                    inputProps={{
                      style: { 
                        fontSize: '14px',
                        padding: '12px 14px'
                      }
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Years of Experience *"
                    type="number"
                    inputProps={{ 
                      min: 0, 
                      max: 50,
                      style: { 
                        fontSize: '14px',
                        padding: '12px 14px'
                      }
                    }}
                    value={formData.experience}
                    onChange={(e) => handleInputChange('experience', parseInt(e.target.value) || 0)}
                    placeholder="e.g., 5"
                    helperText="Enter your total years of teaching experience"
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    fullWidth
                    label="Bio *"
                    multiline
                    rows={4}
                    value={formData.bio}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.length <= 2000) {
                        handleInputChange('bio', value);
                      }
                    }}
                    placeholder="Tell us about yourself, your teaching philosophy, and experience..."
                    inputProps={{ 
                      maxLength: 2000,
                      style: { 
                        fontSize: '14px',
                        lineHeight: '1.5'
                      }
                    }}
                    helperText={`${formData.bio?.length || 0}/2000 characters. You can use all characters including commas, spaces, and special characters.`}
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    fullWidth
                    label="Skills"
                    value={formData.skills?.join(', ') || ''}
                    onChange={(e) => handleArrayChange('skills', e.target.value)}
                    placeholder="e.g., Problem Solving, Communication, Leadership"
                    helperText="You can type multiple skills separated by commas. All characters including spaces and commas are supported."
                    sx={{ mb: 2 }}
                    inputProps={{
                      style: { 
                        fontSize: '14px',
                        padding: '12px 14px'
                      }
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Languages"
                    value={formData.languages?.join(', ') || ''}
                    onChange={(e) => handleArrayChange('languages', e.target.value)}
                    placeholder="e.g., English, Kinyarwanda, French"
                    helperText="You can type multiple languages separated by commas. All characters including spaces and commas are supported."
                    inputProps={{
                      style: { 
                        fontSize: '14px',
                        padding: '12px 14px'
                      }
                    }}
                  />
                </Paper>
              </Grid>

              <Grid item xs={12} md={5}>
                <Paper elevation={1} sx={{ p: { xs: 2, md: 3 } }}>
                  <Typography variant="h6" gutterBottom>
                    Education & Social Links
                  </Typography>

                  <Typography variant="subtitle2" gutterBottom>
                    Education *
                  </Typography>
                  {formData.education?.map((edu, index) => (
                    <Paper key={index} elevation={0} sx={{ p: 2, mb: 2, border: '1px solid #e0e0e0' }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            size="small"
                            placeholder="e.g., Bachelor of Science, Master of Arts"
                            value={edu.degree}
                            onChange={(e) => {
                              const newEducation = [...(formData.education || [])];
                              newEducation[index] = { ...edu, degree: e.target.value };
                              handleInputChange('education', newEducation);
                            }}
                            inputProps={{
                              style: { 
                                fontSize: '14px',
                                padding: '8px 12px'
                              }
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            size="small"
                            placeholder="e.g., University of Rwanda, Harvard University"
                            value={edu.institution}
                            onChange={(e) => {
                              const newEducation = [...(formData.education || [])];
                              newEducation[index] = { ...edu, institution: e.target.value };
                              handleInputChange('education', newEducation);
                            }}
                            inputProps={{
                              style: { 
                                fontSize: '14px',
                                padding: '8px 12px'
                              }
                            }}
                          />
                        </Grid>
                        <Grid item xs={10} sm={10}>
                          <TextField
                            fullWidth
                            size="small"
                            type="number"
                            placeholder="e.g., 2020"
                            value={edu.year}
                            onChange={(e) => {
                              const newEducation = [...(formData.education || [])];
                              newEducation[index] = { ...edu, year: parseInt(e.target.value) || new Date().getFullYear() };
                              handleInputChange('education', newEducation);
                            }}
                            inputProps={{
                              min: 1950,
                              max: new Date().getFullYear() + 10,
                              style: { 
                                fontSize: '14px',
                                padding: '8px 12px'
                              }
                            }}
                          />
                        </Grid>
                        <Grid item xs={2} sm={2}>
                          <IconButton
                            color="error"
                            onClick={() => {
                              const newEducation = formData.education?.filter((_, i) => i !== index);
                              handleInputChange('education', newEducation);
                            }}
                          >
                            <Delete />
                          </IconButton>
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      const newEducation = [...(formData.education || []), { degree: '', institution: '', year: new Date().getFullYear() }];
                      handleInputChange('education', newEducation);
                    }}
                    sx={{ mb: 3 }}
                  >
                    Add Education
                  </Button>

                  <Typography variant="subtitle2" gutterBottom>
                    Social Links
                  </Typography>
                  <TextField
                    fullWidth
                    label="LinkedIn Profile"
                    value={formData.socialLinks?.linkedin || ''}
                    onChange={(e) => handleInputChange('socialLinks.linkedin', e.target.value)}
                    placeholder="e.g., https://linkedin.com/in/yourprofile"
                    sx={{ mb: 2 }}
                    inputProps={{
                      style: { 
                        fontSize: '14px',
                        padding: '12px 14px'
                      }
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Portfolio Website"
                    value={formData.socialLinks?.portfolio || ''}
                    onChange={(e) => handleInputChange('socialLinks.portfolio', e.target.value)}
                    placeholder="e.g., https://yourportfolio.com"
                    inputProps={{
                      style: { 
                        fontSize: '14px',
                        padding: '12px 14px'
                      }
                    }}
                  />
                </Paper>
              </Grid>
            </Grid>
          )}

          {/* Step 3: Teaching Information */}
          {activeStep === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper elevation={1} sx={{ p: { xs: 2, md: 3 } }}>
                  <Typography variant="h6" gutterBottom>
                    <MenuBook sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Teaching Preferences
                  </Typography>

                  <TextField
                    fullWidth
                    label="Teaching Areas *"
                    value={formData.teachingAreas?.join(', ') || ''}
                    onChange={(e) => handleArrayChange('teachingAreas', e.target.value)}
                    placeholder="Mathematics, Science, Programming"
                    helperText="What subjects do you teach?"
                    sx={{ mb: 3 }}
                  />

                  <Typography variant="subtitle2" gutterBottom>
                    Preferred Levels *
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    {['Beginner', 'Intermediate', 'Advanced'].map(level => (
                      <FormControlLabel
                        key={level}
                        control={
                          <Checkbox
                            checked={formData.preferredLevels?.includes(level as any) || false}
                            onChange={(e) => {
                              const currentLevels = formData.preferredLevels || [];
                              if (e.target.checked) {
                                handleInputChange('preferredLevels', [...currentLevels, level]);
                              } else {
                                handleInputChange('preferredLevels', currentLevels.filter(l => l !== level));
                              }
                            }}
                          />
                        }
                        label={level}
                      />
                    ))}
                  </Box>
                </Paper>
              </Grid>

              <Grid item md={6}>
                <Paper elevation={1} sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h6" gutterBottom>
                    Payment Information
                  </Typography>

                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Payment Type *</InputLabel>
                    <Select
                      value={formData.paymentType}
                      onChange={(e) => handleInputChange('paymentType', e.target.value)}
                      label="Payment Type *"
                    >
                      <MenuItem value="per_hour">Per Hour</MenuItem>
                      <MenuItem value="per_month">Per Month</MenuItem>
                    </Select>
                  </FormControl>

                  {formData.paymentType === 'per_hour' && (
                    <TextField
                      fullWidth
                      label="Hourly Rate (RWF) *"
                      type="number"
                      inputProps={{ min: 0 }}
                      value={formData.hourlyRate}
                      onChange={(e) => handleInputChange('hourlyRate', parseFloat(e.target.value) || 0)}
                      placeholder="5000"
                    />
                  )}

                  {formData.paymentType === 'per_month' && (
                    <TextField
                      fullWidth
                      label="Monthly Rate (RWF) *"
                      type="number"
                      inputProps={{ min: 0 }}
                      value={formData.monthlyRate}
                      onChange={(e) => handleInputChange('monthlyRate', parseFloat(e.target.value) || 0)}
                      placeholder="50000"
                    />
                  )}
                </Paper>
              </Grid>
            </Grid>
          )}

          {/* Step 4: Documents */}
          {activeStep === 3 && (
            <Grid container justifyContent="center">
              <Grid item xs={12} md={8}>
                <Paper elevation={1} sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    <CloudUpload sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Required Documents
                  </Typography>

                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <Description sx={{ mr: 1 }} />
                      CV/Resume * (Required for Approval)
                    </Typography>
                    
                    {/* Hidden file input - always present for both upload and replace */}
                    <input
                      accept=".pdf,.doc,.docx"
                      style={{ display: 'none' }}
                      id="cv-upload"
                      type="file"
                      onChange={handleCvChange}
                    />
                    
                    {profile?.cvDocument ? (
                      <Alert severity="success" sx={{ mb: 2 }}>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                          <Box flex={1}>
                            <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
                              <Check sx={{ mr: 1, color: 'success.main' }} />
                              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                CV uploaded: {profile.cvDocument.originalName}
                              </Typography>
                            </Box>
                            <Typography variant="caption" display="block" sx={{ mb: 1 }}>
                              Uploaded on: {new Date(profile.cvDocument.uploadedAt).toLocaleDateString()}
                            </Typography>
                            <Typography variant="caption" display="block" color="text.secondary">
                              File size: {profile.cvDocument.filename}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              size="small"
                              variant="contained"
                              color="primary"
                              startIcon={<CloudDownload />}
                              onClick={() => window.open(profile.cvDocument.url, '_blank')}
                              sx={{ minWidth: 'auto' }}
                            >
                              View
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<CloudUpload />}
                              onClick={() => document.getElementById('cv-upload')?.click()}
                            >
                              Replace
                            </Button>
                          </Box>
                        </Box>
                      </Alert>
                    ) : (
                      <Alert severity="warning" sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ mb: 2, fontWeight: 'medium' }}>
                          📄 CV Upload Required
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 3 }}>
                          Your CV is required for profile approval. Please upload your most recent CV in PDF or Word format.
                        </Typography>
                        
                        <Box sx={{ p: 3, border: '2px dashed', borderColor: 'primary.main', borderRadius: 1, bgcolor: 'background.paper', textAlign: 'center' }}>
                          <label htmlFor="cv-upload">
                            <Button 
                              variant="contained" 
                              component="span" 
                              startIcon={<CloudUpload />}
                              size="large"
                              sx={{ mb: 2 }}
                            >
                              Choose CV File
                            </Button>
                          </label>
                          
                          <Typography variant="caption" display="block" color="text.secondary">
                            Accepted formats: PDF, DOC, DOCX (Max 10MB)
                          </Typography>
                        </Box>
                      </Alert>
                    )}
                    
                    {/* Show selected file info for both new upload and replace */}
                    {cvFile && (
                      <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1, border: '1px solid', borderColor: 'grey.300' }}>
                        <Typography variant="body2" gutterBottom sx={{ fontWeight: 'medium' }}>
                          📎 Selected: {cvFile.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                          Size: {(cvFile.size / 1024 / 1024).toFixed(2)} MB
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            variant="contained"
                            color="success"
                            onClick={uploadCV}
                            disabled={cvUploading}
                            startIcon={cvUploading ? <CircularProgress size={16} /> : <CloudUpload />}
                            fullWidth
                          >
                            {cvUploading ? 'Uploading CV...' : profile?.cvDocument ? 'Replace CV Now' : 'Upload CV Now'}
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            startIcon={<Delete />}
                            onClick={() => {
                              setCvFile(null);
                              // Reset the file input
                              const input = document.getElementById('cv-upload') as HTMLInputElement;
                              if (input) input.value = '';
                            }}
                            disabled={cvUploading}
                          >
                            Cancel
                          </Button>
                        </Box>
                      </Box>
                    )}
                  </Box>

                  <Alert severity="info">
                    <Typography variant="h6" gutterBottom>📋 Profile Completion Checklist:</Typography>
                    <Box component="ul" sx={{ pl: 2 }}>
                      <li style={{ color: formData.phone ? 'green' : 'gray' }}>
                        {formData.phone ? '✅' : '⏳'} Personal Information
                      </li>
                      <li style={{ color: formData.specialization?.length ? 'green' : 'gray' }}>
                        {formData.specialization?.length ? '✅' : '⏳'} Professional Details
                      </li>
                      <li style={{ color: formData.teachingAreas?.length ? 'green' : 'gray' }}>
                        {formData.teachingAreas?.length ? '✅' : '⏳'} Teaching Preferences
                      </li>
                      <li style={{ color: profile?.cvDocument || cvFile ? 'green' : 'gray' }}>
                        {profile?.cvDocument || cvFile ? '✅' : '⏳'} CV Upload
                      </li>
                      <li style={{ color: profilePicturePreview ? 'green' : 'gray' }}>
                        {profilePicturePreview ? '✅' : '⏳'} Profile Picture
                      </li>
                    </Box>
                  </Alert>
                </Paper>
              </Grid>
            </Grid>
          )}

          {/* Navigation Buttons */}
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mt: 4 }}>
            <Button
              variant="outlined"
              onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
              disabled={activeStep === 0}
              fullWidth={isMobile}
            >
              Back
            </Button>

            <Box>
              <Button
                variant="outlined"
                onClick={saveProfile}
                disabled={saving}
                sx={{ mr: 2 }}
                startIcon={saving ? <CircularProgress size={16} /> : undefined}
              >
                {saving ? 'Saving...' : 'Save Progress'}
              </Button>

              {activeStep < 3 ? (
                <Button
                  variant="contained"
                  onClick={() => setActiveStep(Math.min(3, activeStep + 1))}
                  fullWidth={isMobile}
                >
                  Next
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="success"
                  onClick={submitForReview}
                  disabled={submitting || completionPercentage < 100}
                  startIcon={submitting ? <CircularProgress size={16} /> : undefined}
                >
                  {submitting ? 'Submitting...' : 'Submit for Review'}
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default TeacherProfileComplete;
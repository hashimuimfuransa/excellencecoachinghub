import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  Card,
  CardContent,
  CardHeader,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  IconButton,
  Divider,
  Stack,
  Alert,
  AlertTitle,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  useTheme,
  alpha,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import {
  Business,
  LocationOn,
  Language,
  Phone,
  Email,
  Person,
  Upload,
  Save,
  Send,
  Edit,
  CheckCircle,
  Warning,
  Pending,
  Cancel,
  Add,
  Delete,
  CloudUpload,
  Description,
  Verified,
  AdminPanelSettings,
  Timeline,
  Group,
  AttachMoney,
  Work,
  Visibility
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { companyService } from '../services/companyService';

interface CompanyProfile {
  _id?: string;
  companyName: string;
  companyDescription: string;
  industry: string;
  companySize: string;
  foundedYear: number;
  headquarters: string;
  website: string;
  phone: string;
  email: string;
  logo?: string;
  coverImage?: string;
  socialLinks: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
  };
  benefits: string[];
  culture: {
    values: string[];
    workEnvironment: string;
    diversity: string;
  };
  locations: Array<{
    id: string;
    address: string;
    city: string;
    state: string;
    country: string;
    isHeadquarters: boolean;
  }>;
  documents: Array<{
    id: string;
    name: string;
    type: 'business_license' | 'tax_certificate' | 'incorporation' | 'other';
    url: string;
    uploadedAt: string;
  }>;
  approvalStatus: 'draft' | 'pending' | 'approved' | 'rejected';
  approvalNotes?: string;
  completionPercentage: number;
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  lastUpdated: string;
}

const EmployerCompanyProfilePage: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [profile, setProfile] = useState<CompanyProfile>({
    companyName: '',
    companyDescription: '',
    industry: '',
    companySize: '',
    foundedYear: new Date().getFullYear(),
    headquarters: '',
    website: '',
    phone: '',
    email: user?.email || '',
    socialLinks: {},
    benefits: [],
    culture: {
      values: [],
      workEnvironment: '',
      diversity: ''
    },
    locations: [],
    documents: [],
    approvalStatus: 'draft',
    completionPercentage: 0,
    lastUpdated: new Date().toISOString()
  });
  
  const [currentStep, setCurrentStep] = useState(0);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [documentType, setDocumentType] = useState<'business_license' | 'tax_certificate' | 'incorporation' | 'other'>('business_license');
  const [newBenefit, setNewBenefit] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newLocation, setNewLocation] = useState({
    address: '',
    city: '',
    state: '',
    country: '',
    isHeadquarters: false
  });

  // Mock data for demonstration
  const mockProfile: CompanyProfile = {
    _id: '1',
    companyName: 'TechVision Solutions',
    companyDescription: 'We are a leading technology company specializing in innovative software solutions for businesses worldwide.',
    industry: 'Technology',
    companySize: '51-200',
    foundedYear: 2018,
    headquarters: 'San Francisco, CA',
    website: 'https://techvision.com',
    phone: '+1 (555) 123-4567',
    email: 'hr@techvision.com',
    logo: '',
    coverImage: '',
    socialLinks: {
      linkedin: 'https://linkedin.com/company/techvision',
      twitter: 'https://twitter.com/techvision'
    },
    benefits: [
      'Health Insurance',
      'Dental Insurance',
      'Vision Insurance',
      'Flexible Working Hours',
      'Remote Work Options',
      'Professional Development',
      '401(k) Matching',
      'Paid Time Off'
    ],
    culture: {
      values: ['Innovation', 'Collaboration', 'Integrity', 'Excellence'],
      workEnvironment: 'We foster a collaborative and innovative work environment where every team member is valued and encouraged to grow.',
      diversity: 'We are committed to building a diverse and inclusive workplace where everyone can thrive regardless of their background.'
    },
    locations: [
      {
        id: '1',
        address: '123 Tech Street',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        isHeadquarters: true
      },
      {
        id: '2',
        address: '456 Innovation Ave',
        city: 'Austin',
        state: 'TX',
        country: 'USA',
        isHeadquarters: false
      }
    ],
    documents: [
      {
        id: '1',
        name: 'Business License',
        type: 'business_license',
        url: '/documents/business-license.pdf',
        uploadedAt: '2023-11-01T10:00:00Z'
      },
      {
        id: '2',
        name: 'Certificate of Incorporation',
        type: 'incorporation',
        url: '/documents/incorporation.pdf',
        uploadedAt: '2023-11-01T10:05:00Z'
      }
    ],
    approvalStatus: 'pending',
    completionPercentage: 85,
    submittedAt: '2023-11-15T14:30:00Z',
    lastUpdated: '2023-11-15T14:30:00Z'
  };

  const industries = [
    'Technology',
    'Finance',
    'Healthcare',
    'Education',
    'Manufacturing',
    'Retail',
    'Consulting',
    'Marketing',
    'Real Estate',
    'Other'
  ];

  const companySizes = [
    '1-10',
    '11-50',
    '51-200',
    '201-500',
    '501-1000',
    '1001-5000',
    '5000+'
  ];

  const documentTypes = [
    { value: 'business_license', label: 'Business License' },
    { value: 'tax_certificate', label: 'Tax Certificate' },
    { value: 'incorporation', label: 'Certificate of Incorporation' },
    { value: 'other', label: 'Other' }
  ];

  const steps = [
    'Company Information',
    'Contact Details',
    'Company Culture',
    'Locations & Documents (Optional)',
    'Review & Submit'
  ];

  useEffect(() => {
    fetchCompanyProfile();
  }, []);

  const fetchCompanyProfile = async () => {
    try {
      setLoading(true);
      const response = await companyService.getMyCompanyProfileStatus();
      if (response.success && response.data) {
        const companyData = response.data;
        setProfile({
          _id: companyData._id,
          companyName: companyData.name || '',
          companyDescription: companyData.description || '',
          industry: companyData.industry || '',
          companySize: companyData.size || '',
          foundedYear: companyData.founded || new Date().getFullYear(),
          headquarters: companyData.location || '',
          website: companyData.website || '',
          phone: companyData.socialLinks?.phone || '',
          email: user?.email || '',
          socialLinks: companyData.socialLinks || {},
          benefits: [],
          culture: {
            values: [],
            workEnvironment: '',
            diversity: ''
          },
          locations: [],
          documents: companyData.documents || [],
          approvalStatus: companyData.approvalStatus || 'draft',
          approvalNotes: companyData.approvalNotes,
          completionPercentage: 0,
          submittedAt: companyData.submittedAt,
          approvedAt: companyData.reviewedAt,
          rejectedAt: companyData.approvalStatus === 'rejected' ? companyData.reviewedAt : undefined,
          lastUpdated: companyData.updatedAt || new Date().toISOString()
        });
      }
    } catch (error: any) {
      console.error('Error fetching company profile:', error);
      // If no profile exists, keep the default empty profile
      if (error.response?.status !== 404) {
        // Show error for non-404 errors
        console.error('Unexpected error:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateCompletionPercentage = (profileData: CompanyProfile): number => {
    let completed = 0;
    const total = 12; // Reduced from 15 to make some fields optional

    // Required fields (8)
    if (profileData.companyName?.trim()) completed++;
    if (profileData.companyDescription?.trim()) completed++;
    if (profileData.industry) completed++;
    if (profileData.companySize) completed++;
    if (profileData.headquarters?.trim()) completed++;
    if (profileData.website?.trim()) completed++;
    if (profileData.phone?.trim()) completed++;
    if (profileData.email?.trim()) completed++;
    
    // Important but optional fields (4)
    if (profileData.foundedYear && profileData.foundedYear > 1800) completed++;
    if (profileData.benefits.length > 0) completed++;
    if (profileData.culture.values.length > 0) completed++;
    if (profileData.locations.length > 0) completed++;

    // Optional fields (not counted): 
    // - culture.workEnvironment
    // - culture.diversity  
    // - documents
    // - social links

    return Math.round((completed / total) * 100);
  };

  // Update completion percentage whenever profile changes
  useEffect(() => {
    const newPercentage = calculateCompletionPercentage(profile);
    if (profile.completionPercentage !== newPercentage) {
      setProfile(prev => ({
        ...prev,
        completionPercentage: newPercentage
      }));
    }
  }, [
    profile.companyName,
    profile.companyDescription,
    profile.industry,
    profile.companySize,
    profile.foundedYear,
    profile.headquarters,
    profile.website,
    profile.phone,
    profile.email,
    profile.benefits,
    profile.culture.values,
    profile.locations
  ]);

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      
      const companyData = {
        name: profile.companyName,
        description: profile.companyDescription,
        industry: profile.industry,
        size: profile.companySize,
        founded: profile.foundedYear,
        location: profile.headquarters,
        website: profile.website,
        socialLinks: {
          ...profile.socialLinks,
          phone: profile.phone
        },
        documents: profile.documents.map(doc => ({
          type: doc.type,
          url: doc.url,
          name: doc.name
        }))
      };

      if (profile._id) {
        // Update existing profile
        await companyService.updateMyCompanyProfile(companyData);
      }
      
      const updatedProfile = {
        ...profile,
        lastUpdated: new Date().toISOString()
      };
      setProfile(updatedProfile);
      
      // Refresh data from server
      await fetchCompanyProfile();
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForApproval = async () => {
    try {
      setSubmitting(true);
      
      const companyData = {
        name: profile.companyName,
        description: profile.companyDescription,
        industry: profile.industry,
        size: profile.companySize,
        founded: profile.foundedYear,
        location: profile.headquarters,
        website: profile.website,
        socialLinks: {
          ...profile.socialLinks,
          phone: profile.phone
        },
        documents: profile.documents.map(doc => ({
          type: doc.type,
          url: doc.url,
          name: doc.name
        }))
      };

      if (profile._id) {
        // Update existing profile
        await companyService.updateMyCompanyProfile(companyData);
      } else {
        // Submit new profile
        await companyService.submitCompanyProfileForApproval(companyData);
      }
      
      // Refresh data from server
      await fetchCompanyProfile();
    } catch (error) {
      console.error('Error submitting for approval:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddBenefit = () => {
    if (newBenefit.trim() && !profile.benefits.includes(newBenefit.trim())) {
      setProfile(prev => ({
        ...prev,
        benefits: [...prev.benefits, newBenefit.trim()]
      }));
      setNewBenefit('');
    }
  };

  const handleRemoveBenefit = (benefit: string) => {
    setProfile(prev => ({
      ...prev,
      benefits: prev.benefits.filter(b => b !== benefit)
    }));
  };

  const handleAddValue = () => {
    if (newValue.trim() && !profile.culture.values.includes(newValue.trim())) {
      setProfile(prev => ({
        ...prev,
        culture: {
          ...prev.culture,
          values: [...prev.culture.values, newValue.trim()]
        }
      }));
      setNewValue('');
    }
  };

  const handleRemoveValue = (value: string) => {
    setProfile(prev => ({
      ...prev,
      culture: {
        ...prev.culture,
        values: prev.culture.values.filter(v => v !== value)
      }
    }));
  };

  const handleAddLocation = () => {
    if (newLocation.city && newLocation.state && newLocation.country) {
      const location = {
        id: Date.now().toString(),
        ...newLocation
      };
      setProfile(prev => ({
        ...prev,
        locations: [...prev.locations, location]
      }));
      setNewLocation({
        address: '',
        city: '',
        state: '',
        country: '',
        isHeadquarters: false
      });
    }
  };

  const handleRemoveLocation = (locationId: string) => {
    setProfile(prev => ({
      ...prev,
      locations: prev.locations.filter(l => l.id !== locationId)
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      case 'draft': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle />;
      case 'pending': return <Pending />;
      case 'rejected': return <Cancel />;
      case 'draft': return <Edit />;
      default: return <Warning />;
    }
  };

  const isSubmittable = profile.completionPercentage >= 80;

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
              Company Profile
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Complete your company profile to start posting jobs and hiring candidates
            </Typography>
          </Box>
          <Box display="flex" gap={2}>
            <Chip
              icon={getStatusIcon(profile.approvalStatus)}
              label={profile.approvalStatus.toUpperCase()}
              color={getStatusColor(profile.approvalStatus) as any}
              sx={{ textTransform: 'capitalize' }}
            />
          </Box>
        </Box>

        {/* Completion Progress */}
        <Box mt={3}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2" fontWeight="medium">
              Profile Completion
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {profile.completionPercentage}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={profile.completionPercentage}
            sx={{ height: 8, borderRadius: 4 }}
            color={profile.completionPercentage >= 80 ? 'success' : 'primary'}
          />
          {profile.completionPercentage < 80 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Complete at least 80% to submit for approval
            </Typography>
          )}
        </Box>
      </Paper>

      {/* Status Alerts */}
      {profile.approvalStatus === 'pending' && (
        <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
          <AlertTitle>Pending Approval</AlertTitle>
          Your company profile has been submitted and is currently under review by our admin team. 
          You'll be notified once it's approved.
          {profile.submittedAt && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Submitted on {new Date(profile.submittedAt).toLocaleDateString()}
            </Typography>
          )}
        </Alert>
      )}

      {profile.approvalStatus === 'approved' && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
          <AlertTitle>Profile Approved!</AlertTitle>
          Congratulations! Your company profile has been approved. You can now post jobs and hire candidates.
          {profile.approvedAt && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Approved on {new Date(profile.approvedAt).toLocaleDateString()}
            </Typography>
          )}
        </Alert>
      )}

      {profile.approvalStatus === 'rejected' && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          <AlertTitle>Profile Rejected</AlertTitle>
          Your company profile was rejected. Please review the feedback below and resubmit.
          {profile.approvalNotes && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              <strong>Admin Notes:</strong> {profile.approvalNotes}
            </Typography>
          )}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Stepper activeStep={currentStep} orientation="vertical">
              {/* Step 1: Company Information */}
              <Step>
                <StepLabel>Company Information</StepLabel>
                <StepContent>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="Company Name *"
                        value={profile.companyName}
                        onChange={(e) => setProfile(prev => ({ ...prev, companyName: e.target.value }))}
                        required
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="Company Description *"
                        multiline
                        rows={4}
                        value={profile.companyDescription}
                        onChange={(e) => setProfile(prev => ({ ...prev, companyDescription: e.target.value }))}
                        required
                        helperText="Describe what your company does and what makes it unique"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControl fullWidth required>
                        <InputLabel>Industry</InputLabel>
                        <Select
                          value={profile.industry}
                          onChange={(e) => setProfile(prev => ({ ...prev, industry: e.target.value }))}
                          label="Industry"
                        >
                          {industries.map((industry) => (
                            <MenuItem key={industry} value={industry}>
                              {industry}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControl fullWidth required>
                        <InputLabel>Company Size</InputLabel>
                        <Select
                          value={profile.companySize}
                          onChange={(e) => setProfile(prev => ({ ...prev, companySize: e.target.value }))}
                          label="Company Size"
                        >
                          {companySizes.map((size) => (
                            <MenuItem key={size} value={size}>
                              {size} employees
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Founded Year (Optional)"
                        type="number"
                        value={profile.foundedYear || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, foundedYear: parseInt(e.target.value) || 0 }))}
                        inputProps={{ min: 1800, max: new Date().getFullYear() }}
                        placeholder="e.g., 2010"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Headquarters *"
                        value={profile.headquarters}
                        onChange={(e) => setProfile(prev => ({ ...prev, headquarters: e.target.value }))}
                        required
                        placeholder="e.g., San Francisco, CA, USA"
                      />
                    </Grid>
                  </Grid>
                  <Box mt={2} display="flex" gap={1}>
                    <Button
                      variant="contained"
                      onClick={() => setCurrentStep(1)}
                    >
                      Next
                    </Button>
                  </Box>
                </StepContent>
              </Step>

              {/* Step 2: Contact Details */}
              <Step>
                <StepLabel>Contact Details</StepLabel>
                <StepContent>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Company Website *"
                        value={profile.website}
                        onChange={(e) => setProfile(prev => ({ ...prev, website: e.target.value }))}
                        required
                        placeholder="https://yourcompany.com"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Phone Number *"
                        value={profile.phone}
                        onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                        required
                        placeholder="+1 (555) 123-4567"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Contact Email *"
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="LinkedIn Profile"
                        value={profile.socialLinks.linkedin || ''}
                        onChange={(e) => setProfile(prev => ({ 
                          ...prev, 
                          socialLinks: { ...prev.socialLinks, linkedin: e.target.value }
                        }))}
                        placeholder="https://linkedin.com/company/yourcompany"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Twitter Profile"
                        value={profile.socialLinks.twitter || ''}
                        onChange={(e) => setProfile(prev => ({ 
                          ...prev, 
                          socialLinks: { ...prev.socialLinks, twitter: e.target.value }
                        }))}
                        placeholder="https://twitter.com/yourcompany"
                      />
                    </Grid>
                  </Grid>
                  <Box mt={2} display="flex" gap={1}>
                    <Button onClick={() => setCurrentStep(0)}>Back</Button>
                    <Button
                      variant="contained"
                      onClick={() => setCurrentStep(2)}
                    >
                      Next
                    </Button>
                  </Box>
                </StepContent>
              </Step>

              {/* Step 3: Company Culture */}
              <Step>
                <StepLabel>Company Culture</StepLabel>
                <StepContent>
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="h6" gutterBottom>Benefits & Perks</Typography>
                      <Box display="flex" gap={1} mb={2}>
                        <TextField
                          fullWidth
                          label="Add Benefit"
                          value={newBenefit}
                          onChange={(e) => setNewBenefit(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddBenefit()}
                        />
                        <Button variant="outlined" onClick={handleAddBenefit} startIcon={<Add />}>
                          Add
                        </Button>
                      </Box>
                      <Box display="flex" flexWrap="wrap" gap={1}>
                        {profile.benefits.map((benefit, index) => (
                          <Chip
                            key={index}
                            label={benefit}
                            onDelete={() => handleRemoveBenefit(benefit)}
                            color="primary"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <Typography variant="h6" gutterBottom>Company Values</Typography>
                      <Box display="flex" gap={1} mb={2}>
                        <TextField
                          fullWidth
                          label="Add Value"
                          value={newValue}
                          onChange={(e) => setNewValue(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddValue()}
                        />
                        <Button variant="outlined" onClick={handleAddValue} startIcon={<Add />}>
                          Add
                        </Button>
                      </Box>
                      <Box display="flex" flexWrap="wrap" gap={1}>
                        {profile.culture.values.map((value, index) => (
                          <Chip
                            key={index}
                            label={value}
                            onDelete={() => handleRemoveValue(value)}
                            color="secondary"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="Work Environment (Optional)"
                        multiline
                        rows={3}
                        value={profile.culture.workEnvironment}
                        onChange={(e) => setProfile(prev => ({
                          ...prev,
                          culture: { ...prev.culture, workEnvironment: e.target.value }
                        }))}
                        helperText="Describe your company's work environment and culture"
                      />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="Diversity & Inclusion (Optional)"
                        multiline
                        rows={3}
                        value={profile.culture.diversity}
                        onChange={(e) => setProfile(prev => ({
                          ...prev,
                          culture: { ...prev.culture, diversity: e.target.value }
                        }))}
                        helperText="Describe your commitment to diversity and inclusion"
                      />
                    </Grid>
                  </Grid>
                  <Box mt={2} display="flex" gap={1}>
                    <Button onClick={() => setCurrentStep(1)}>Back</Button>
                    <Button
                      variant="contained"
                      onClick={() => setCurrentStep(3)}
                    >
                      Next
                    </Button>
                  </Box>
                </StepContent>
              </Step>

              {/* Step 4: Locations & Documents */}
              <Step>
                <StepLabel>Locations & Documents (Optional)</StepLabel>
                <StepContent>
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="h6" gutterBottom>Office Locations</Typography>
                      <Card variant="outlined" sx={{ p: 2, mb: 2 }}>
                        <Grid container spacing={2}>
                          <Grid size={{ xs: 12 }}>
                            <TextField
                              fullWidth
                              label="Address"
                              value={newLocation.address}
                              onChange={(e) => setNewLocation(prev => ({ ...prev, address: e.target.value }))}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                              fullWidth
                              label="City"
                              value={newLocation.city}
                              onChange={(e) => setNewLocation(prev => ({ ...prev, city: e.target.value }))}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                              fullWidth
                              label="State/Province"
                              value={newLocation.state}
                              onChange={(e) => setNewLocation(prev => ({ ...prev, state: e.target.value }))}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                              fullWidth
                              label="Country"
                              value={newLocation.country}
                              onChange={(e) => setNewLocation(prev => ({ ...prev, country: e.target.value }))}
                            />
                          </Grid>
                          <Grid size={{ xs: 12 }}>
                            <Button variant="outlined" onClick={handleAddLocation} startIcon={<Add />}>
                              Add Location
                            </Button>
                          </Grid>
                        </Grid>
                      </Card>
                      
                      <Stack spacing={2}>
                        {profile.locations.map((location) => (
                          <Card key={location.id} variant="outlined">
                            <CardContent>
                              <Box display="flex" justifyContent="space-between" alignItems="start">
                                <Box>
                                  <Typography variant="subtitle1" fontWeight="bold">
                                    {location.city}, {location.state}, {location.country}
                                    {location.isHeadquarters && (
                                      <Chip label="Headquarters" size="small" sx={{ ml: 1 }} />
                                    )}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {location.address}
                                  </Typography>
                                </Box>
                                <IconButton
                                  onClick={() => handleRemoveLocation(location.id)}
                                  color="error"
                                  size="small"
                                >
                                  <Delete />
                                </IconButton>
                              </Box>
                            </CardContent>
                          </Card>
                        ))}
                      </Stack>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <Typography variant="h6" gutterBottom>Legal Documents</Typography>
                      <Box mb={2}>
                        <Button
                          variant="outlined"
                          startIcon={<Upload />}
                          onClick={() => setUploadDialogOpen(true)}
                        >
                          Upload Document
                        </Button>
                      </Box>
                      
                      <Stack spacing={2}>
                        {profile.documents.map((document) => (
                          <Card key={document.id} variant="outlined">
                            <CardContent>
                              <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Box display="flex" alignItems="center">
                                  <Description sx={{ mr: 2, color: 'text.secondary' }} />
                                  <Box>
                                    <Typography variant="subtitle2" fontWeight="bold">
                                      {document.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {documentTypes.find(t => t.value === document.type)?.label} • 
                                      Uploaded {new Date(document.uploadedAt).toLocaleDateString()}
                                    </Typography>
                                  </Box>
                                </Box>
                                <Box display="flex" gap={1}>
                                  <Button size="small" startIcon={<Visibility />}>
                                    View
                                  </Button>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => {
                                      setProfile(prev => ({
                                        ...prev,
                                        documents: prev.documents.filter(d => d.id !== document.id)
                                      }));
                                    }}
                                  >
                                    <Delete />
                                  </IconButton>
                                </Box>
                              </Box>
                            </CardContent>
                          </Card>
                        ))}
                      </Stack>
                      
                      {profile.documents.length === 0 && (
                        <Alert severity="info" sx={{ mt: 2 }}>
                          Upload your business license, tax certificate, and other legal documents to complete your profile.
                        </Alert>
                      )}
                    </Grid>
                  </Grid>
                  <Box mt={2} display="flex" gap={1}>
                    <Button onClick={() => setCurrentStep(2)}>Back</Button>
                    <Button
                      variant="contained"
                      onClick={() => setCurrentStep(4)}
                    >
                      Next
                    </Button>
                  </Box>
                </StepContent>
              </Step>

              {/* Step 5: Review & Submit */}
              <Step>
                <StepLabel>Review & Submit</StepLabel>
                <StepContent>
                  <Alert 
                    severity={profile.completionPercentage >= 80 ? "success" : "warning"} 
                    sx={{ mb: 3 }}
                  >
                    <AlertTitle>Profile Status</AlertTitle>
                    Your profile is {profile.completionPercentage}% complete. 
                    {profile.completionPercentage >= 80 
                      ? " You can now submit for approval!"
                      : ` Please complete at least 80% to submit for approval.`
                    }
                  </Alert>

                  <Typography variant="h6" gutterBottom>Review Your Information</Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Please review all the information above before submitting your company profile for approval. 
                    Once submitted, you won't be able to make changes until the review is complete.
                  </Typography>

                  <Box mt={2} display="flex" gap={1}>
                    <Button onClick={() => setCurrentStep(3)}>Back</Button>
                    <Button
                      variant="outlined"
                      onClick={handleSaveProfile}
                      disabled={saving}
                      startIcon={saving ? <CircularProgress size={16} /> : <Save />}
                    >
                      Save Draft
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleSubmitForApproval}
                      disabled={!isSubmittable || submitting}
                      startIcon={submitting ? <CircularProgress size={16} /> : <Send />}
                    >
                      Submit for Approval
                    </Button>
                  </Box>
                </StepContent>
              </Step>
            </Stepper>
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={3}>
            {/* Profile Summary */}
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Profile Summary
              </Typography>
              <Stack spacing={2}>
                <Box display="flex" alignItems="center" justifyContent="between">
                  <Box display="flex" alignItems="center">
                    <Business sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">Company Name</Typography>
                  </Box>
                  {profile.companyName ? (
                    <CheckCircle sx={{ color: 'success.main' }} />
                  ) : (
                    <Warning sx={{ color: 'warning.main' }} />
                  )}
                </Box>

                <Box display="flex" alignItems="center" justifyContent="between">
                  <Box display="flex" alignItems="center">
                    <Description sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">Description</Typography>
                  </Box>
                  {profile.companyDescription ? (
                    <CheckCircle sx={{ color: 'success.main' }} />
                  ) : (
                    <Warning sx={{ color: 'warning.main' }} />
                  )}
                </Box>

                <Box display="flex" alignItems="center" justifyContent="between">
                  <Box display="flex" alignItems="center">
                    <Language sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">Website</Typography>
                  </Box>
                  {profile.website ? (
                    <CheckCircle sx={{ color: 'success.main' }} />
                  ) : (
                    <Warning sx={{ color: 'warning.main' }} />
                  )}
                </Box>

                <Box display="flex" alignItems="center" justifyContent="between">
                  <Box display="flex" alignItems="center">
                    <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">Locations</Typography>
                  </Box>
                  {profile.locations.length > 0 ? (
                    <CheckCircle sx={{ color: 'success.main' }} />
                  ) : (
                    <Warning sx={{ color: 'warning.main' }} />
                  )}
                </Box>

                <Box display="flex" alignItems="center" justifyContent="between">
                  <Box display="flex" alignItems="center">
                    <Description sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">Documents</Typography>
                  </Box>
                  {profile.documents.length > 0 ? (
                    <CheckCircle sx={{ color: 'success.main' }} />
                  ) : (
                    <Warning sx={{ color: 'warning.main' }} />
                  )}
                </Box>
              </Stack>
            </Paper>

            {/* Help & Support */}
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Need Help?
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Our team is here to help you complete your company profile and get started with hiring.
              </Typography>
              <Button variant="outlined" fullWidth startIcon={<AdminPanelSettings />}>
                Contact Support
              </Button>
            </Paper>
          </Stack>
        </Grid>
      </Grid>

      {/* Upload Document Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Upload Document</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Document Type</InputLabel>
              <Select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value as any)}
                label="Document Type"
              >
                {documentTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Box
              sx={{
                border: '2px dashed',
                borderColor: 'primary.main',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.05)
                }
              }}
            >
              <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Drop files here or click to upload
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Supported formats: PDF, DOC, DOCX, JPG, PNG (Max 10MB)
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained"
            onClick={() => {
              // Mock document upload
              const newDocument = {
                id: Date.now().toString(),
                name: `${documentTypes.find(t => t.value === documentType)?.label}.pdf`,
                type: documentType,
                url: `/documents/${documentType}.pdf`,
                uploadedAt: new Date().toISOString()
              };
              setProfile(prev => ({
                ...prev,
                documents: [...prev.documents, newDocument]
              }));
              setUploadDialogOpen(false);
            }}
          >
            Upload
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EmployerCompanyProfilePage;
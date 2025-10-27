import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  Alert,
  AlertTitle,
  CircularProgress,
  useTheme,
  alpha,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Divider,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox
} from '@mui/material';
import {
  School,
  Add,
  Delete,
  Save,
  Publish,
  Preview,
  Psychology,
  AttachMoney,
  Schedule,
  LocationOn,
  Business,
  TrendingUp,
  CheckCircle,
  Warning,
  Info,
  Lightbulb,
  Groups,
  Assignment
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { internshipService, InternshipFormData } from '../services/internshipService';
import { LoadingButton } from '@mui/lab';

const steps = [
  'Basic Information',
  'Position Details', 
  'Requirements & Benefits',
  'Application Process',
  'Review & Publish'
];

const CreateInternshipPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitType, setSubmitType] = useState<'draft' | 'publish'>('draft');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [companyProfileComplete, setCompanyProfileComplete] = useState(false);

  const [formData, setFormData] = useState<InternshipFormData>({
    title: '',
    description: '',
    company: user?.company || '',
    department: '',
    location: '',
    numberOfPositions: 1,
    applicationProcedure: '',
    internshipPeriod: {
      startDate: '',
      endDate: '',
      duration: ''
    },
    isPaid: false,
    stipend: {
      amount: 0,
      currency: 'USD',
      frequency: 'monthly'
    },
    expectedStartDate: '',
    expectedEndDate: '',
    experienceLevel: 'entry_level',
    educationLevel: 'bachelor',
    skills: [],
    requirements: [],
    responsibilities: [],
    benefits: [],
    learningObjectives: [],
    mentorshipProvided: true,
    certificateProvided: false,
    applicationDeadline: '',
    psychometricTestRequired: false,
    psychometricTests: [],
    workArrangement: 'on-site',
    contactInfo: {
      email: user?.email || '',
      phone: '',
      website: '',
      address: '',
      contactPerson: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
      applicationInstructions: ''
    }
  });

  // Form field state for array inputs
  const [newSkill, setNewSkill] = useState('');
  const [newRequirement, setNewRequirement] = useState('');
  const [newResponsibility, setNewResponsibility] = useState('');
  const [newBenefit, setNewBenefit] = useState('');
  const [newLearningObjective, setNewLearningObjective] = useState('');

  // Skill suggestions
  const skillSuggestions = [
    'JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'Data Analysis',
    'Marketing', 'Design Thinking', 'Project Management', 'Communication',
    'Research', 'Content Writing', 'Social Media', 'Excel', 'PowerBI',
    'Figma', 'Adobe Creative Suite', 'Video Editing', 'SEO', 'Analytics'
  ];

  // Check company profile completeness
  useEffect(() => {
    const checkCompanyProfile = () => {
      if (!user) {
        setCompanyProfileComplete(false);
        return;
      }
      
      // Required fields for company profile
      const requiredFields = [
        user.company,
        user.email,
        user.firstName,
        user.lastName
      ];
      
      const isComplete = requiredFields.every(field => field && field.trim() !== '');
      setCompanyProfileComplete(isComplete);
    };

    checkCompanyProfile();
  }, [user]);

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof InternshipFormData],
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

  const addToArray = (arrayField: string, value: string, setterFunction: React.Dispatch<React.SetStateAction<string>>) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [arrayField]: [...(prev[arrayField as keyof InternshipFormData] as string[]), value.trim()]
      }));
      setterFunction('');
    }
  };

  const removeFromArray = (arrayField: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      [arrayField]: (prev[arrayField as keyof InternshipFormData] as string[]).filter((_, i) => i !== index)
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0: // Basic Information
        return !!(formData.title && formData.description && formData.company && formData.department && formData.location);
      case 1: // Position Details
        return !!(formData.numberOfPositions > 0 && formData.expectedStartDate && formData.expectedEndDate && 
                 new Date(formData.expectedEndDate) > new Date(formData.expectedStartDate));
      case 2: // Requirements & Benefits
        return formData.requirements.length > 0 && formData.responsibilities.length > 0;
      case 3: // Application Process
        return !!(formData.applicationProcedure && formData.contactInfo?.email && formData.applicationDeadline);
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
      setError(null);
    } else {
      setError('Please fill in all required fields before continuing.');
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
    setError(null);
  };

  const handleSubmit = async (isDraft: boolean = false) => {
    try {
      setLoading(true);
      setSubmitType(isDraft ? 'draft' : 'publish');
      setError(null);

      // Calculate duration in months between expectedStartDate and expectedEndDate
      let duration = '';
      if (formData.expectedStartDate && formData.expectedEndDate) {
        const startDate = new Date(formData.expectedStartDate);
        const endDate = new Date(formData.expectedEndDate);
        const monthsDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
        duration = `${monthsDiff} months`;
      }

      const submitData = {
        ...formData,
        status: isDraft ? 'draft' : 'active',
        // Map expectedStartDate/expectedEndDate to internshipPeriod structure
        internshipPeriod: {
          startDate: formData.expectedStartDate,
          endDate: formData.expectedEndDate,
          duration: duration
        }
      };

      // Remove stipend if not paid
      if (!formData.isPaid) {
        delete submitData.stipend;
      }

      const response = await internshipService.createInternship(submitData);

      setSuccess(isDraft ? 'Internship saved as draft successfully!' : 'Internship published successfully!');
      
      setTimeout(() => {
        navigate('/app/employer/internships');
      }, 2000);

    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create internship');
    } finally {
      setLoading(false);
    }
  };

  const renderBasicInformation = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Internship Title"
          placeholder="e.g., Frontend Development Internship"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          required
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Company"
          value={formData.company}
          onChange={(e) => handleInputChange('company', e.target.value)}
          required
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Department/Field"
          placeholder="e.g., Software Engineering, Marketing, Design"
          value={formData.department}
          onChange={(e) => handleInputChange('department', e.target.value)}
          required
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Location"
          value={formData.location}
          onChange={(e) => handleInputChange('location', e.target.value)}
          required
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>Work Arrangement</InputLabel>
          <Select
            value={formData.workArrangement}
            label="Work Arrangement"
            onChange={(e) => handleInputChange('workArrangement', e.target.value)}
          >
            <MenuItem value="on-site">On-site</MenuItem>
            <MenuItem value="remote">Remote</MenuItem>
            <MenuItem value="hybrid">Hybrid</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          multiline
          rows={4}
          label="Internship Description"
          placeholder="Describe the internship opportunity, what the intern will be doing, and what makes this position unique..."
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          required
        />
      </Grid>
    </Grid>
  );

  const renderPositionDetails = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          type="number"
          label="Number of Positions"
          value={formData.numberOfPositions}
          onChange={(e) => handleInputChange('numberOfPositions', parseInt(e.target.value) || 1)}
          InputProps={{ inputProps: { min: 1, max: 100 } }}
          required
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          type="date"
          label="Expected Start Date"
          value={formData.expectedStartDate}
          onChange={(e) => handleInputChange('expectedStartDate', e.target.value)}
          InputLabelProps={{ shrink: true }}
          required
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          type="date"
          label="Expected End Date"
          value={formData.expectedEndDate}
          onChange={(e) => handleInputChange('expectedEndDate', e.target.value)}
          InputLabelProps={{ shrink: true }}
          error={formData.expectedStartDate && formData.expectedEndDate && 
                 new Date(formData.expectedEndDate) <= new Date(formData.expectedStartDate)}
          helperText={formData.expectedStartDate && formData.expectedEndDate && 
                     new Date(formData.expectedEndDate) <= new Date(formData.expectedStartDate) ?
                     "End date must be after start date" : ""}
          required
        />
      </Grid>
      
      {formData.expectedStartDate && formData.expectedEndDate && (
        <Grid item xs={12}>
          <Alert severity="info" sx={{ mt: 1 }}>
            <Typography variant="body2">
              Internship Duration: {(() => {
                const start = new Date(formData.expectedStartDate);
                const end = new Date(formData.expectedEndDate);
                const monthsDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));
                return `${monthsDiff} months`;
              })()} 
              (from {new Date(formData.expectedStartDate).toLocaleDateString()} to {new Date(formData.expectedEndDate).toLocaleDateString()})
            </Typography>
          </Alert>
        </Grid>
      )}

      <Grid item xs={12} md={6}>
        <FormControl fullWidth required>
          <InputLabel>Experience Level</InputLabel>
          <Select
            value={formData.experienceLevel}
            label="Experience Level"
            onChange={(e) => handleInputChange('experienceLevel', e.target.value)}
          >
            <MenuItem value="entry_level">Entry Level</MenuItem>
            <MenuItem value="mid_level">Mid Level</MenuItem>
            <MenuItem value="senior_level">Senior Level</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} md={6}>
        <FormControl fullWidth required>
          <InputLabel>Education Level</InputLabel>
          <Select
            value={formData.educationLevel}
            label="Education Level"
            onChange={(e) => handleInputChange('educationLevel', e.target.value)}
          >
            <MenuItem value="high_school">High School</MenuItem>
            <MenuItem value="associate">Associate Degree</MenuItem>
            <MenuItem value="bachelor">Bachelor's Degree</MenuItem>
            <MenuItem value="master">Master's Degree</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={formData.isPaid}
              onChange={(e) => handleInputChange('isPaid', e.target.checked)}
            />
          }
          label="Paid Internship"
        />
      </Grid>

      {formData.isPaid && (
        <>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="number"
              label="Stipend Amount"
              value={formData.stipend?.amount || 0}
              onChange={(e) => handleInputChange('stipend.amount', parseFloat(e.target.value) || 0)}
              InputProps={{ inputProps: { min: 0 } }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Currency</InputLabel>
              <Select
                value={formData.stipend?.currency || 'USD'}
                label="Currency"
                onChange={(e) => handleInputChange('stipend.currency', e.target.value)}
              >
                <MenuItem value="USD">USD</MenuItem>
                <MenuItem value="RWF">RWF</MenuItem>
                <MenuItem value="EUR">EUR</MenuItem>
                <MenuItem value="GBP">GBP</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Payment Frequency</InputLabel>
              <Select
                value={formData.stipend?.frequency || 'monthly'}
                label="Payment Frequency"
                onChange={(e) => handleInputChange('stipend.frequency', e.target.value)}
              >
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="biweekly">Bi-weekly</MenuItem>
                <MenuItem value="lump_sum">Lump Sum</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </>
      )}

      <Grid item xs={12} md={6}>
        <FormControlLabel
          control={
            <Switch
              checked={formData.mentorshipProvided}
              onChange={(e) => handleInputChange('mentorshipProvided', e.target.checked)}
            />
          }
          label="Mentorship Provided"
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <FormControlLabel
          control={
            <Switch
              checked={formData.certificateProvided}
              onChange={(e) => handleInputChange('certificateProvided', e.target.checked)}
            />
          }
          label="Certificate Upon Completion"
        />
      </Grid>
    </Grid>
  );

  const renderRequirementsAndBenefits = () => (
    <Grid container spacing={3}>
      {/* Skills */}
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Required Skills
        </Typography>
        <Box display="flex" gap={1} mb={2} flexWrap="wrap">
          <Autocomplete
            sx={{ minWidth: 200, flexGrow: 1 }}
            freeSolo
            options={skillSuggestions}
            value={newSkill}
            onChange={(_, value) => setNewSkill(value || '')}
            onInputChange={(_, value) => setNewSkill(value)}
            renderInput={(params) => (
              <TextField {...params} label="Add skill" variant="outlined" />
            )}
          />
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={() => addToArray('skills', newSkill, setNewSkill)}
          >
            Add
          </Button>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
          {formData.skills.map((skill, index) => (
            <Chip
              key={index}
              label={skill}
              onDelete={() => removeFromArray('skills', index)}
              color="primary"
              variant="outlined"
            />
          ))}
        </Stack>
      </Grid>

      {/* Requirements */}
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Requirements
        </Typography>
        <Box display="flex" gap={1} mb={2}>
          <TextField
            fullWidth
            label="Add requirement"
            value={newRequirement}
            onChange={(e) => setNewRequirement(e.target.value)}
            placeholder="e.g., Currently enrolled in relevant degree program"
          />
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={() => addToArray('requirements', newRequirement, setNewRequirement)}
          >
            Add
          </Button>
        </Box>
        <List>
          {formData.requirements.map((req, index) => (
            <ListItem key={index}>
              <ListItemText primary={req} />
              <ListItemSecondaryAction>
                <Button
                  size="small"
                  color="error"
                  onClick={() => removeFromArray('requirements', index)}
                >
                  <Delete />
                </Button>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Grid>

      {/* Responsibilities */}
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Responsibilities
        </Typography>
        <Box display="flex" gap={1} mb={2}>
          <TextField
            fullWidth
            label="Add responsibility"
            value={newResponsibility}
            onChange={(e) => setNewResponsibility(e.target.value)}
            placeholder="e.g., Assist with frontend development tasks"
          />
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={() => addToArray('responsibilities', newResponsibility, setNewResponsibility)}
          >
            Add
          </Button>
        </Box>
        <List>
          {formData.responsibilities.map((resp, index) => (
            <ListItem key={index}>
              <ListItemText primary={resp} />
              <ListItemSecondaryAction>
                <Button
                  size="small"
                  color="error"
                  onClick={() => removeFromArray('responsibilities', index)}
                >
                  <Delete />
                </Button>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Grid>

      {/* Learning Objectives */}
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Learning Objectives
        </Typography>
        <Box display="flex" gap={1} mb={2}>
          <TextField
            fullWidth
            label="Add learning objective"
            value={newLearningObjective}
            onChange={(e) => setNewLearningObjective(e.target.value)}
            placeholder="e.g., Gain hands-on experience with React development"
          />
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={() => addToArray('learningObjectives', newLearningObjective, setNewLearningObjective)}
          >
            Add
          </Button>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
          {formData.learningObjectives.map((objective, index) => (
            <Chip
              key={index}
              label={objective}
              onDelete={() => removeFromArray('learningObjectives', index)}
              color="secondary"
              variant="outlined"
            />
          ))}
        </Stack>
      </Grid>

      {/* Benefits */}
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Benefits
        </Typography>
        <Box display="flex" gap={1} mb={2}>
          <TextField
            fullWidth
            label="Add benefit"
            value={newBenefit}
            onChange={(e) => setNewBenefit(e.target.value)}
            placeholder="e.g., Flexible working hours, Networking opportunities"
          />
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={() => addToArray('benefits', newBenefit, setNewBenefit)}
          >
            Add
          </Button>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
          {formData.benefits.map((benefit, index) => (
            <Chip
              key={index}
              label={benefit}
              onDelete={() => removeFromArray('benefits', index)}
              color="success"
              variant="outlined"
            />
          ))}
        </Stack>
      </Grid>
    </Grid>
  );

  const renderApplicationProcess = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <TextField
          fullWidth
          multiline
          rows={4}
          label="Application Procedure"
          placeholder="Describe how students should apply for this internship..."
          value={formData.applicationProcedure}
          onChange={(e) => handleInputChange('applicationProcedure', e.target.value)}
          required
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          type="date"
          label="Application Deadline"
          value={formData.applicationDeadline}
          onChange={(e) => handleInputChange('applicationDeadline', e.target.value)}
          InputLabelProps={{ shrink: true }}
          required
        />
      </Grid>

      <Divider sx={{ width: '100%', my: 2 }} />

      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Contact Information
        </Typography>
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Contact Email"
          type="email"
          value={formData.contactInfo?.email || ''}
          onChange={(e) => handleInputChange('contactInfo.email', e.target.value)}
          required
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Contact Person"
          value={formData.contactInfo?.contactPerson || ''}
          onChange={(e) => handleInputChange('contactInfo.contactPerson', e.target.value)}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Phone Number"
          value={formData.contactInfo?.phone || ''}
          onChange={(e) => handleInputChange('contactInfo.phone', e.target.value)}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Company Website"
          value={formData.contactInfo?.website || ''}
          onChange={(e) => handleInputChange('contactInfo.website', e.target.value)}
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          multiline
          rows={3}
          label="Additional Application Instructions"
          placeholder="Any additional instructions for applicants..."
          value={formData.contactInfo?.applicationInstructions || ''}
          onChange={(e) => handleInputChange('contactInfo.applicationInstructions', e.target.value)}
        />
      </Grid>
    </Grid>
  );

  const renderReviewAndPublish = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Alert severity="info">
          <AlertTitle>Review Your Internship Posting</AlertTitle>
          Please review all the information below before publishing your internship opportunity.
        </Alert>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              {formData.title}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              {formData.company} • {formData.department} • {formData.location}
            </Typography>
            
            <Box display="flex" gap={1} mb={2}>
              <Chip 
                label={formData.isPaid ? `Paid: ${formData.stipend?.amount} ${formData.stipend?.currency}/${formData.stipend?.frequency}` : 'Unpaid'} 
                color={formData.isPaid ? 'success' : 'default'}
              />
              <Chip label={`${formData.numberOfPositions} position${formData.numberOfPositions > 1 ? 's' : ''}`} />
              <Chip label={formData.workArrangement} />
            </Box>

            <Typography variant="body1" paragraph>
              {formData.description}
            </Typography>

            <Typography variant="h6" gutterBottom>Skills Required</Typography>
            <Box mb={2}>
              {formData.skills.map((skill, index) => (
                <Chip key={index} label={skill} size="small" sx={{ mr: 1, mb: 1 }} />
              ))}
            </Box>

            <Typography variant="h6" gutterBottom>Learning Objectives</Typography>
            <Box mb={2}>
              {formData.learningObjectives.map((objective, index) => (
                <Chip key={index} label={objective} size="small" color="secondary" sx={{ mr: 1, mb: 1 }} />
              ))}
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return renderBasicInformation();
      case 1:
        return renderPositionDetails();
      case 2:
        return renderRequirementsAndBenefits();
      case 3:
        return renderApplicationProcess();
      case 4:
        return renderReviewAndPublish();
      default:
        return 'Unknown step';
    }
  };

  // Show company profile incomplete warning
  if (!companyProfileComplete) {
    return (
      <Container maxWidth="lg">
        <Box py={4}>
          <Typography variant="h3" component="h1" gutterBottom align="center">
            Create Internship Opportunity
          </Typography>
          
          <Alert severity="warning" sx={{ mb: 4 }}>
            <AlertTitle>Complete Your Company Profile</AlertTitle>
            <Typography variant="body1" gutterBottom>
              Before you can create internship opportunities, please complete your company profile with all required information.
            </Typography>
            <Box mt={2}>
              <Button
                variant="contained"
                startIcon={<Business />}
                onClick={() => navigate('/app/employer/profile')}
                sx={{ mr: 2 }}
              >
                Complete Profile
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate(-1)}
              >
                Go Back
              </Button>
            </Box>
          </Alert>

          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Required Information Checklist:
            </Typography>
            <List>
              <ListItem>
                <Checkbox 
                  checked={!!user?.company} 
                  color={user?.company ? 'success' : 'error'}
                  disabled 
                />
                <ListItemText primary="Company Name" />
              </ListItem>
              <ListItem>
                <Checkbox 
                  checked={!!user?.email} 
                  color={user?.email ? 'success' : 'error'}
                  disabled 
                />
                <ListItemText primary="Contact Email" />
              </ListItem>
              <ListItem>
                <Checkbox 
                  checked={!!user?.firstName} 
                  color={user?.firstName ? 'success' : 'error'}
                  disabled 
                />
                <ListItemText primary="First Name" />
              </ListItem>
              <ListItem>
                <Checkbox 
                  checked={!!user?.lastName} 
                  color={user?.lastName ? 'success' : 'error'}
                  disabled 
                />
                <ListItemText primary="Last Name" />
              </ListItem>
            </List>
          </Card>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box py={4}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          Create Internship Opportunity
        </Typography>
        <Typography variant="body1" color="text.secondary" align="center" mb={4}>
          Post an internship opportunity to connect with talented students and recent graduates
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        <Paper elevation={1} sx={{ p: 4 }}>
          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
                <StepContent>
                  <Box sx={{ mb: 2 }}>
                    {getStepContent(index)}
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <div>
                      {index === steps.length - 1 ? (
                        <Box display="flex" gap={2}>
                          <LoadingButton
                            variant="contained"
                            onClick={() => handleSubmit(false)}
                            loading={loading && submitType === 'publish'}
                            startIcon={<Publish />}
                          >
                            Publish Internship
                          </LoadingButton>
                          <LoadingButton
                            variant="outlined"
                            onClick={() => handleSubmit(true)}
                            loading={loading && submitType === 'draft'}
                            startIcon={<Save />}
                          >
                            Save as Draft
                          </LoadingButton>
                        </Box>
                      ) : (
                        <Button
                          variant="contained"
                          onClick={handleNext}
                          disabled={!validateStep(activeStep)}
                        >
                          Continue
                        </Button>
                      )}
                      <Button
                        disabled={index === 0}
                        onClick={handleBack}
                        sx={{ ml: 1 }}
                      >
                        Back
                      </Button>
                    </div>
                  </Box>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </Paper>
      </Box>
    </Container>
  );
};

export default CreateInternshipPage;
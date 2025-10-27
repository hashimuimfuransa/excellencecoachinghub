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
  Work,
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
  School,
  TrendingUp,
  CheckCircle,
  Warning,
  Info,
  Lightbulb
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { employerService } from '../services/employerService';
import { companyService } from '../services/companyService';
import { LoadingButton } from '@mui/lab';

interface JobFormData {
  title: string;
  description: string;
  company: string;
  location: string;
  jobType: string;
  experienceLevel: string;
  educationLevel: string;
  salary: {
    min: number;
    max: number;
    currency: string;
    negotiable: boolean;
  };
  skills: string[];
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  applicationDeadline: string;
  psychometricTestRequired: boolean;
  psychometricTests: string[];
  workArrangement: string;
  department: string;
  remoteWork: boolean;
}

interface PsychometricTest {
  _id: string;
  title: string;
  description: string;
  type: string;
  duration: number;
  questionsCount: number;
}

const CreateJobPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [psychometricTests, setPsychometricTests] = useState<PsychometricTest[]>([]);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  
  // Company profile approval state
  const [companyProfileStatus, setCompanyProfileStatus] = useState<'loading' | 'approved' | 'pending' | 'rejected' | 'not-submitted'>('loading');
  const [companyProfile, setCompanyProfile] = useState<any>(null);
  
  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    description: '',
    company: user?.company || '',
    location: '',
    jobType: '',
    experienceLevel: '',
    educationLevel: '',
    salary: {
      min: 0,
      max: 0,
      currency: 'USD',
      negotiable: false
    },
    skills: [],
    requirements: [],
    responsibilities: [],
    benefits: [],
    applicationDeadline: '',
    psychometricTestRequired: false,
    psychometricTests: [],
    workArrangement: '',
    department: '',
    remoteWork: false
  });

  const [tempInputs, setTempInputs] = useState({
    skill: '',
    requirement: '',
    responsibility: '',
    benefit: ''
  });

  // Form validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Predefined options
  const jobTypes = [
    { value: 'full_time', label: 'Full Time' },
    { value: 'part_time', label: 'Part Time' },
    { value: 'contract', label: 'Contract' },
    { value: 'internship', label: 'Internship' },
    { value: 'freelance', label: 'Freelance' }
  ];

  const experienceLevels = [
    { value: 'entry_level', label: 'Entry Level (0-2 years)' },
    { value: 'mid_level', label: 'Mid Level (3-5 years)' },
    { value: 'senior_level', label: 'Senior Level (6+ years)' },
    { value: 'executive', label: 'Executive Level' }
  ];

  const educationLevels = [
    { value: 'high_school', label: 'High School' },
    { value: 'associate', label: 'Associate Degree' },
    { value: 'bachelor', label: 'Bachelor\'s Degree' },
    { value: 'master', label: 'Master\'s Degree' },
    { value: 'doctorate', label: 'Doctorate' },
    { value: 'professional', label: 'Professional Certification' }
  ];

  const workArrangements = [
    { value: 'on_site', label: 'On-site' },
    { value: 'remote', label: 'Remote' },
    { value: 'hybrid', label: 'Hybrid' }
  ];

  const currencies = [
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'GBP', label: 'GBP (£)' },
    { value: 'INR', label: 'INR (₹)' },
    { value: 'CAD', label: 'CAD (C$)' },
    { value: 'AUD', label: 'AUD (A$)' }
  ];

  const commonSkills = [
    'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'SQL',
    'AWS', 'Docker', 'Kubernetes', 'Git', 'Agile', 'REST APIs', 'GraphQL',
    'MongoDB', 'PostgreSQL', 'Redis', 'HTML', 'CSS', 'Vue.js', 'Angular',
    'Express.js', 'Next.js', 'Django', 'Spring Boot', 'Microservices',
    'Machine Learning', 'Data Analysis', 'Leadership', 'Project Management',
    'Communication', 'Problem Solving', 'Team Collaboration'
  ];

  const commonBenefits = [
    'Health Insurance', 'Dental Insurance', 'Vision Insurance',
    'Life Insurance', '401(k) Matching', 'Paid Time Off',
    'Flexible Working Hours', 'Remote Work Options', 'Professional Development',
    'Training Budget', 'Conference Attendance', 'Gym Membership',
    'Free Lunch', 'Stock Options', 'Bonus Eligibility',
    'Maternity/Paternity Leave', 'Mental Health Support', 'Wellness Programs'
  ];

  const steps = [
    'Basic Information',
    'Job Details',
    'Requirements & Skills', 
    'Compensation & Benefits',
    'Assessment & Review'
  ];

  useEffect(() => {
    checkCompanyProfileStatus();
    fetchPsychometricTests();
  }, []);

  const checkCompanyProfileStatus = async () => {
    try {
      setLoading(true);
      const response = await companyService.getMyCompanyProfileStatus();
      
      if (response.success && response.data) {
        setCompanyProfile(response.data);
        setCompanyProfileStatus(response.data.approvalStatus);
      }
    } catch (error: any) {
      console.error('Error checking company profile status:', error);
      if (error.response?.status === 404) {
        setCompanyProfileStatus('not-submitted');
      } else {
        console.error('Unexpected error:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchPsychometricTests = async () => {
    try {
      const response = await employerService.getPsychometricTests();
      setPsychometricTests(response.data || []);
    } catch (error) {
      console.error('Error fetching psychometric tests:', error);
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 0:
        if (!formData.title.trim()) newErrors.title = 'Job title is required';
        if (!formData.description.trim()) newErrors.description = 'Job description is required';
        if (!formData.company.trim()) newErrors.company = 'Company name is required';
        if (!formData.location.trim()) newErrors.location = 'Location is required';
        break;
      case 1:
        if (!formData.jobType) newErrors.jobType = 'Job type is required';
        if (!formData.experienceLevel) newErrors.experienceLevel = 'Experience level is required';
        if (!formData.educationLevel) newErrors.educationLevel = 'Education level is required';
        if (!formData.workArrangement) newErrors.workArrangement = 'Work arrangement is required';
        break;
      case 2:
        if (formData.skills.length === 0) newErrors.skills = 'At least one skill is required';
        if (formData.requirements.length === 0) newErrors.requirements = 'At least one requirement is required';
        if (formData.responsibilities.length === 0) newErrors.responsibilities = 'At least one responsibility is required';
        break;
      case 3:
        if (formData.salary.min < 0) newErrors.salaryMin = 'Minimum salary must be positive';
        if (formData.salary.max < formData.salary.min) newErrors.salaryMax = 'Maximum salary must be greater than minimum';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleInputChange = (field: keyof JobFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSalaryChange = (field: keyof JobFormData['salary'], value: any) => {
    setFormData(prev => ({
      ...prev,
      salary: {
        ...prev.salary,
        [field]: value
      }
    }));
  };

  const addArrayItem = (field: 'skills' | 'requirements' | 'responsibilities' | 'benefits', item: string) => {
    if (item.trim() && !formData[field].includes(item.trim())) {
      handleInputChange(field, [...formData[field], item.trim()]);
      setTempInputs(prev => ({
        ...prev,
        [field === 'skills' ? 'skill' : field.slice(0, -1)]: ''
      }));
    }
  };

  const removeArrayItem = (field: 'skills' | 'requirements' | 'responsibilities' | 'benefits', index: number) => {
    const newArray = formData[field].filter((_, i) => i !== index);
    handleInputChange(field, newArray);
  };

  const handleSaveDraft = async () => {
    try {
      setSaving(true);
      const jobData = {
        ...formData,
        applicationDeadline: formData.applicationDeadline || undefined,
        status: 'draft'
      };
      
      const response = await employerService.createJob(jobData);
      
      // Show success message
      alert('Job saved as draft successfully!');
      
      // Redirect to jobs page or stay for further editing
      if (response.data?._id) {
        navigate(`/app/employer/jobs/${response.data._id}/edit`);
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('Failed to save draft. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    try {
      // Validate all steps
      let isValid = true;
      for (let i = 0; i < steps.length - 1; i++) {
        if (!validateStep(i)) {
          isValid = false;
          setActiveStep(i);
          break;
        }
      }

      if (!isValid) {
        alert('Please fill in all required fields before publishing.');
        return;
      }

      setPublishing(true);
      const jobData = {
        ...formData,
        applicationDeadline: formData.applicationDeadline || undefined,
        status: 'active'
      };
      
      const response = await employerService.createJob(jobData);
      
      // Show success message
      alert('Job published successfully!');
      
      // Redirect to jobs page
      navigate('/app/employer/jobs');
    } catch (error) {
      console.error('Error publishing job:', error);
      alert('Failed to publish job. Please try again.');
    } finally {
      setPublishing(false);
    }
  };

  const getCompletionPercentage = (): number => {
    let completed = 0;
    const total = 12;

    if (formData.title) completed++;
    if (formData.description) completed++;
    if (formData.company) completed++;
    if (formData.location) completed++;
    if (formData.jobType) completed++;
    if (formData.experienceLevel) completed++;
    if (formData.educationLevel) completed++;
    if (formData.skills.length > 0) completed++;
    if (formData.requirements.length > 0) completed++;
    if (formData.responsibilities.length > 0) completed++;
    if (formData.salary.min > 0) completed++;
    if (formData.workArrangement) completed++;

    return Math.round((completed / total) * 100);
  };

  const renderBasicInformation = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Job Title *"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          error={!!errors.title}
          helperText={errors.title || 'e.g., Senior Full Stack Developer'}
          placeholder="Enter the job position title"
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Company Name *"
          value={formData.company}
          onChange={(e) => handleInputChange('company', e.target.value)}
          error={!!errors.company}
          helperText={errors.company}
          placeholder="Your company name"
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Department"
          value={formData.department}
          onChange={(e) => handleInputChange('department', e.target.value)}
          placeholder="e.g., Engineering, Marketing, Sales"
        />
      </Grid>

      <Grid item xs={12} sm={8}>
        <TextField
          fullWidth
          label="Location *"
          value={formData.location}
          onChange={(e) => handleInputChange('location', e.target.value)}
          error={!!errors.location}
          helperText={errors.location || 'City, State, Country'}
          placeholder="e.g., San Francisco, CA, USA"
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 4 }}>
        <Autocomplete
          fullWidth
          freeSolo
          options={workArrangements.map(arrangement => arrangement.label)}
          value={workArrangements.find(arrangement => arrangement.value === formData.workArrangement)?.label || formData.workArrangement || ''}
          onChange={(_, newValue) => {
            const selectedArrangement = workArrangements.find(arrangement => arrangement.label === newValue);
            handleInputChange('workArrangement', selectedArrangement ? selectedArrangement.value : newValue || '');
          }}
          onInputChange={(_, newValue) => {
            const selectedArrangement = workArrangements.find(arrangement => arrangement.label === newValue);
            handleInputChange('workArrangement', selectedArrangement ? selectedArrangement.value : newValue);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Work Arrangement *"
              error={!!errors.workArrangement}
              helperText={errors.workArrangement}
              placeholder="Select or type work arrangement"
            />
          )}
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Job Description *"
          multiline
          rows={6}
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          error={!!errors.description}
          helperText={errors.description || 'Provide a detailed description of the role, company culture, and what makes this opportunity unique'}
          placeholder="Describe the role, responsibilities, company culture, and what makes this opportunity special..."
        />
      </Grid>
    </Grid>
  );

  const renderJobDetails = () => (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, sm: 4 }}>
        <Autocomplete
          fullWidth
          freeSolo
          options={jobTypes.map(type => type.label)}
          value={jobTypes.find(type => type.value === formData.jobType)?.label || formData.jobType || ''}
          onChange={(_, newValue) => {
            const selectedType = jobTypes.find(type => type.label === newValue);
            handleInputChange('jobType', selectedType ? selectedType.value : newValue || '');
          }}
          onInputChange={(_, newValue) => {
            const selectedType = jobTypes.find(type => type.label === newValue);
            handleInputChange('jobType', selectedType ? selectedType.value : newValue);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Job Type *"
              error={!!errors.jobType}
              helperText={errors.jobType}
              placeholder="Select or type job type"
            />
          )}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 4 }}>
        <Autocomplete
          fullWidth
          freeSolo
          options={experienceLevels.map(level => level.label)}
          value={experienceLevels.find(level => level.value === formData.experienceLevel)?.label || formData.experienceLevel || ''}
          onChange={(_, newValue) => {
            const selectedLevel = experienceLevels.find(level => level.label === newValue);
            handleInputChange('experienceLevel', selectedLevel ? selectedLevel.value : newValue || '');
          }}
          onInputChange={(_, newValue) => {
            const selectedLevel = experienceLevels.find(level => level.label === newValue);
            handleInputChange('experienceLevel', selectedLevel ? selectedLevel.value : newValue);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Experience Level *"
              error={!!errors.experienceLevel}
              helperText={errors.experienceLevel}
              placeholder="Select or type experience level"
            />
          )}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 4 }}>
        <Autocomplete
          fullWidth
          freeSolo
          options={educationLevels.map(level => level.label)}
          value={educationLevels.find(level => level.value === formData.educationLevel)?.label || formData.educationLevel || ''}
          onChange={(_, newValue) => {
            const selectedLevel = educationLevels.find(level => level.label === newValue);
            handleInputChange('educationLevel', selectedLevel ? selectedLevel.value : newValue || '');
          }}
          onInputChange={(_, newValue) => {
            const selectedLevel = educationLevels.find(level => level.label === newValue);
            handleInputChange('educationLevel', selectedLevel ? selectedLevel.value : newValue);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Education Level *"
              error={!!errors.educationLevel}
              helperText={errors.educationLevel}
              placeholder="Select or type education level"
            />
          )}
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Application Deadline (Optional)"
          type="date"
          value={formData.applicationDeadline}
          onChange={(e) => handleInputChange('applicationDeadline', e.target.value)}
          InputLabelProps={{ shrink: true }}
          inputProps={{ min: new Date().toISOString().split('T')[0] }}
          helperText="Leave empty for no deadline"
        />
      </Grid>
    </Grid>
  );

  const renderRequirementsAndSkills = () => (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12 }}>
        <Typography variant="h6" gutterBottom>
          Required Skills
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center" mb={2}>
          <Autocomplete
            fullWidth
            freeSolo
            options={commonSkills}
            value={tempInputs.skill}
            onChange={(_, newValue) => setTempInputs(prev => ({ ...prev, skill: newValue || '' }))}
            onInputChange={(_, newValue) => setTempInputs(prev => ({ ...prev, skill: newValue }))}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Add Skill"
                error={!!errors.skills}
                helperText={errors.skills}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    addArrayItem('skills', tempInputs.skill);
                    e.preventDefault();
                  }
                }}
              />
            )}
          />
          <Button
            variant="outlined"
            onClick={() => addArrayItem('skills', tempInputs.skill)}
            startIcon={<Add />}
          >
            Add
          </Button>
        </Stack>
        <Box display="flex" flexWrap="wrap" gap={1}>
          {formData.skills.map((skill, index) => (
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

      <Grid size={{ xs: 12 }}>
        <Typography variant="h6" gutterBottom>
          Job Requirements
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center" mb={2}>
          <TextField
            fullWidth
            label="Add Requirement"
            value={tempInputs.requirement}
            onChange={(e) => setTempInputs(prev => ({ ...prev, requirement: e.target.value }))}
            error={!!errors.requirements}
            helperText={errors.requirements}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                addArrayItem('requirements', tempInputs.requirement);
                e.preventDefault();
              }
            }}
            placeholder="e.g., Bachelor's degree in Computer Science"
          />
          <Button
            variant="outlined"
            onClick={() => addArrayItem('requirements', tempInputs.requirement)}
            startIcon={<Add />}
          >
            Add
          </Button>
        </Stack>
        <Stack spacing={1}>
          {formData.requirements.map((requirement, index) => (
            <Card key={index} variant="outlined">
              <CardContent sx={{ py: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">{requirement}</Typography>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => removeArrayItem('requirements', index)}
                    startIcon={<Delete />}
                  >
                    Remove
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Grid>

      <Grid size={{ xs: 12 }}>
        <Typography variant="h6" gutterBottom>
          Job Responsibilities
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center" mb={2}>
          <TextField
            fullWidth
            label="Add Responsibility"
            value={tempInputs.responsibility}
            onChange={(e) => setTempInputs(prev => ({ ...prev, responsibility: e.target.value }))}
            error={!!errors.responsibilities}
            helperText={errors.responsibilities}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                addArrayItem('responsibilities', tempInputs.responsibility);
                e.preventDefault();
              }
            }}
            placeholder="e.g., Design and implement new features"
          />
          <Button
            variant="outlined"
            onClick={() => addArrayItem('responsibilities', tempInputs.responsibility)}
            startIcon={<Add />}
          >
            Add
          </Button>
        </Stack>
        <Stack spacing={1}>
          {formData.responsibilities.map((responsibility, index) => (
            <Card key={index} variant="outlined">
              <CardContent sx={{ py: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">{responsibility}</Typography>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => removeArrayItem('responsibilities', index)}
                    startIcon={<Delete />}
                  >
                    Remove
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Grid>
    </Grid>
  );

  const renderCompensationAndBenefits = () => (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12 }}>
        <Typography variant="h6" gutterBottom>
          Salary Range
        </Typography>
      </Grid>

      <Grid size={{ xs: 12, sm: 4 }}>
        <TextField
          fullWidth
          label="Minimum Salary"
          type="number"
          value={formData.salary.min}
          onChange={(e) => handleSalaryChange('min', Number(e.target.value))}
          error={!!errors.salaryMin}
          helperText={errors.salaryMin}
          InputProps={{
            startAdornment: currencies.find(c => c.value === formData.salary.currency)?.label.split('(')[1]?.slice(0, -1) || '$'
          }}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 4 }}>
        <TextField
          fullWidth
          label="Maximum Salary"
          type="number"
          value={formData.salary.max}
          onChange={(e) => handleSalaryChange('max', Number(e.target.value))}
          error={!!errors.salaryMax}
          helperText={errors.salaryMax}
          InputProps={{
            startAdornment: currencies.find(c => c.value === formData.salary.currency)?.label.split('(')[1]?.slice(0, -1) || '$'
          }}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 4 }}>
        <Autocomplete
          fullWidth
          freeSolo
          options={currencies.map(currency => currency.label)}
          value={currencies.find(currency => currency.value === formData.salary.currency)?.label || formData.salary.currency || ''}
          onChange={(_, newValue) => {
            const selectedCurrency = currencies.find(currency => currency.label === newValue);
            handleSalaryChange('currency', selectedCurrency ? selectedCurrency.value : newValue || '');
          }}
          onInputChange={(_, newValue) => {
            const selectedCurrency = currencies.find(currency => currency.label === newValue);
            handleSalaryChange('currency', selectedCurrency ? selectedCurrency.value : newValue);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Currency"
              placeholder="Select or type currency"
            />
          )}
        />
      </Grid>

      <Grid size={{ xs: 12 }}>
        <FormControlLabel
          control={
            <Switch
              checked={formData.salary.negotiable}
              onChange={(e) => handleSalaryChange('negotiable', e.target.checked)}
            />
          }
          label="Salary is negotiable"
        />
      </Grid>

      <Grid size={{ xs: 12 }}>
        <Typography variant="h6" gutterBottom>
          Benefits & Perks
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center" mb={2}>
          <Autocomplete
            fullWidth
            freeSolo
            options={commonBenefits}
            value={tempInputs.benefit}
            onChange={(_, newValue) => setTempInputs(prev => ({ ...prev, benefit: newValue || '' }))}
            onInputChange={(_, newValue) => setTempInputs(prev => ({ ...prev, benefit: newValue }))}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Add Benefit"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    addArrayItem('benefits', tempInputs.benefit);
                    e.preventDefault();
                  }
                }}
              />
            )}
          />
          <Button
            variant="outlined"
            onClick={() => addArrayItem('benefits', tempInputs.benefit)}
            startIcon={<Add />}
          >
            Add
          </Button>
        </Stack>
        <Box display="flex" flexWrap="wrap" gap={1}>
          {formData.benefits.map((benefit, index) => (
            <Chip
              key={index}
              label={benefit}
              onDelete={() => removeArrayItem('benefits', index)}
              color="secondary"
              variant="outlined"
            />
          ))}
        </Box>
      </Grid>
    </Grid>
  );

  const renderAssessmentAndReview = () => (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Psychometric Assessment
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.psychometricTestRequired}
                  onChange={(e) => handleInputChange('psychometricTestRequired', e.target.checked)}
                />
              }
              label="Require psychometric tests for this position"
            />
            
            {formData.psychometricTestRequired && (
              <Box mt={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Select Tests to Include:
                </Typography>
                <List dense>
                  {psychometricTests.map((test) => (
                    <ListItem key={test._id} divider>
                      <ListItemText
                        primary={test.title}
                        secondary={`${test.description} • ${test.duration} min • ${test.questionsCount} questions`}
                      />
                      <ListItemSecondaryAction>
                        <Checkbox
                          checked={formData.psychometricTests.includes(test._id)}
                          onChange={(e) => {
                            const newTests = e.target.checked
                              ? [...formData.psychometricTests, test._id]
                              : formData.psychometricTests.filter(id => id !== test._id);
                            handleInputChange('psychometricTests', newTests);
                          }}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Job Posting Summary
            </Typography>
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary">
                Completion: {getCompletionPercentage()}%
              </Typography>
            </Box>
            
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2">Title:</Typography>
                <Typography variant="body2">{formData.title || 'Not specified'}</Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2">Company:</Typography>
                <Typography variant="body2">{formData.company || 'Not specified'}</Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2">Location:</Typography>
                <Typography variant="body2">{formData.location || 'Not specified'}</Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2">Job Type:</Typography>
                <Typography variant="body2">
                  {jobTypes.find(t => t.value === formData.jobType)?.label || 'Not specified'}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2">Skills Required:</Typography>
                <Typography variant="body2">
                  {formData.skills.length > 0 ? formData.skills.join(', ') : 'None specified'}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2">Salary Range:</Typography>
                <Typography variant="body2">
                  {formData.salary.min > 0 && formData.salary.max > 0
                    ? `${formData.salary.currency} ${formData.salary.min.toLocaleString()} - ${formData.salary.max.toLocaleString()}`
                    : 'Not specified'}
                  {formData.salary.negotiable && ' (Negotiable)'}
                </Typography>
              </Box>
            </Stack>
            
            <Box mt={3}>
              <Button
                variant="outlined"
                startIcon={<Preview />}
                onClick={() => setPreviewDialogOpen(true)}
              >
                Preview Job Posting
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return renderBasicInformation();
      case 1:
        return renderJobDetails();
      case 2:
        return renderRequirementsAndSkills();
      case 3:
        return renderCompensationAndBenefits();
      case 4:
        return renderAssessmentAndReview();
      default:
        return null;
    }
  };

  // Show loading state
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={40} />
          <Typography variant="h6" sx={{ ml: 2 }}>
            Checking company profile status...
          </Typography>
        </Box>
      </Container>
    );
  }

  // Show locked state if company profile is not approved
  if (companyProfileStatus !== 'approved') {
    const getStatusMessage = () => {
      switch (companyProfileStatus) {
        case 'not-submitted':
          return {
            title: 'Company Profile Required',
            message: 'You need to submit your company profile for approval before posting jobs.',
            action: 'Submit Company Profile',
            actionPath: '/app/employer/company-profile',
            color: 'info'
          };
        case 'pending':
          return {
            title: 'Company Profile Under Review',
            message: 'Your company profile is currently being reviewed by our team. You\'ll be able to post jobs once it\'s approved.',
            action: 'View Profile Status',
            actionPath: '/app/employer/company-profile',
            color: 'warning'
          };
        case 'rejected':
          return {
            title: 'Company Profile Needs Attention',
            message: companyProfile?.rejectionReason || 'Your company profile was rejected. Please review the feedback and resubmit.',
            action: 'Update Profile',
            actionPath: '/app/employer/company-profile',
            color: 'error'
          };
        default:
          return {
            title: 'Access Restricted',
            message: 'Unable to verify company profile status.',
            action: 'Go Back',
            actionPath: '/app/employer/jobs',
            color: 'error'
          };
      }
    };

    const statusInfo = getStatusMessage();

    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <Box sx={{ mb: 3 }}>
            <Warning sx={{ fontSize: 80, color: `${statusInfo.color}.main`, mb: 2 }} />
            <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
              {statusInfo.title}
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
              {statusInfo.message}
            </Typography>
            
            {companyProfileStatus === 'pending' && companyProfile?.submittedAt && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Submitted on: {new Date(companyProfile.submittedAt).toLocaleDateString()}
              </Typography>
            )}
            
            {companyProfileStatus === 'rejected' && companyProfile?.reviewedAt && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Reviewed on: {new Date(companyProfile.reviewedAt).toLocaleDateString()}
              </Typography>
            )}
          </Box>

          <Box display="flex" gap={2} justifyContent="center">
            <Button
              variant="contained"
              color={statusInfo.color as any}
              startIcon={<Business />}
              onClick={() => navigate(statusInfo.actionPath)}
              size="large"
            >
              {statusInfo.action}
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/app/employer/jobs')}
              size="large"
            >
              Back to Jobs
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
              Create New Job Posting
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Fill out the form below to create and publish your job posting
            </Typography>
          </Box>
          <Box display="flex" gap={2}>
            <LoadingButton
              variant="outlined"
              startIcon={<Save />}
              loading={saving}
              onClick={handleSaveDraft}
            >
              Save Draft
            </LoadingButton>
            <LoadingButton
              variant="contained"
              startIcon={<Publish />}
              loading={publishing}
              onClick={handlePublish}
              disabled={getCompletionPercentage() < 80}
            >
              Publish Job
            </LoadingButton>
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Main Form */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Stepper activeStep={activeStep} orientation="vertical">
              {steps.map((label, index) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                  <StepContent>
                    {renderStepContent(index)}
                    
                    <Box mt={3} display="flex" gap={1}>
                      <Button
                        disabled={activeStep === 0}
                        onClick={handleBack}
                      >
                        Back
                      </Button>
                      {activeStep === steps.length - 1 ? (
                        <Box display="flex" gap={1}>
                          <LoadingButton
                            variant="outlined"
                            startIcon={<Save />}
                            loading={saving}
                            onClick={handleSaveDraft}
                          >
                            Save Draft
                          </LoadingButton>
                          <LoadingButton
                            variant="contained"
                            startIcon={<Publish />}
                            loading={publishing}
                            onClick={handlePublish}
                          >
                            Publish Job
                          </LoadingButton>
                        </Box>
                      ) : (
                        <Button
                          variant="contained"
                          onClick={handleNext}
                        >
                          Next
                        </Button>
                      )}
                    </Box>
                  </StepContent>
                </Step>
              ))}
            </Stepper>
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={3}>
            {/* Progress Card */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Completion Progress
                </Typography>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">
                    {getCompletionPercentage()}% Complete
                  </Typography>
                  {getCompletionPercentage() >= 80 ? (
                    <CheckCircle sx={{ color: 'success.main' }} />
                  ) : (
                    <Warning sx={{ color: 'warning.main' }} />
                  )}
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {getCompletionPercentage() >= 80 
                      ? 'Ready to publish!'
                      : 'Complete at least 80% to publish'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Tips Card */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Lightbulb sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Tips for Better Job Postings
                </Typography>
                <Stack spacing={1}>
                  <Typography variant="body2">
                    • Use clear, specific job titles
                  </Typography>
                  <Typography variant="body2">
                    • Include 3-7 key skills
                  </Typography>
                  <Typography variant="body2">
                    • Be transparent about salary ranges
                  </Typography>
                  <Typography variant="body2">
                    • Highlight company culture and benefits
                  </Typography>
                  <Typography variant="body2">
                    • Consider psychometric tests for better matching
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      {/* Preview Dialog */}
      <Dialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Job Posting Preview</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3}>
            <Box>
              <Typography variant="h5" fontWeight="bold">{formData.title}</Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {formData.company} • {formData.location}
              </Typography>
            </Box>

            <Box>
              <Typography variant="h6">Job Description</Typography>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-line', mt: 1 }}>
                {formData.description}
              </Typography>
            </Box>

            {formData.responsibilities.length > 0 && (
              <Box>
                <Typography variant="h6">Responsibilities</Typography>
                <List dense>
                  {formData.responsibilities.map((responsibility, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={`• ${responsibility}`} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {formData.requirements.length > 0 && (
              <Box>
                <Typography variant="h6">Requirements</Typography>
                <List dense>
                  {formData.requirements.map((requirement, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={`• ${requirement}`} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {formData.skills.length > 0 && (
              <Box>
                <Typography variant="h6">Required Skills</Typography>
                <Box mt={1} display="flex" flexWrap="wrap" gap={1}>
                  {formData.skills.map((skill, index) => (
                    <Chip key={index} label={skill} size="small" />
                  ))}
                </Box>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CreateJobPage;
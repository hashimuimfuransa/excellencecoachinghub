import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Autocomplete,
  FormControlLabel,
  Switch,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  Slider,
  Rating,
  InputAdornment,
  LinearProgress,
  CircularProgress,
  Snackbar,
  Fade
} from '@mui/material';
import {
  Add,
  Delete,
  Edit,
  Save,
  Cancel,
  Upload,
  Link as LinkIcon,
  Link,
  Work,
  School,
  EmojiEvents,
  Language,
  Code,
  LocationOn,
  AttachMoney,
  Business,
  Person,
  Settings,
  Verified,
  CheckCircle,
  Error,
  CloudUpload
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  User,
  WorkExperience,
  Education,
  Certification,
  Achievement,
  Award,
  EmploymentStatus,
  ExperienceLevel,
  EducationLevel,
  JobType
} from '../types/user';
import { checkProfileCompletion } from '../utils/profileCompletionUtils';
import { uploadCV } from '../utils/simpleFileUpload';
import { uploadCVWithFetch } from '../utils/fetchUpload';
import { uploadCVRenderWorkaround } from '../utils/renderUpload';
import { uploadCVSimple } from '../utils/workingUpload';
import { uploadCVBulletproof } from '../utils/bulletproofUpload';

interface ComprehensiveProfileFormProps {
  user: User;
  onSave: (updatedUser: Partial<User>) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  onFileUploadStateChange?: (isUploading: boolean) => void;
}

const steps = [
  'Basic Information',
  'Professional Details',
  'Experience & Education',
  'Skills & Languages',
  'Preferences & Settings'
];

// World countries for dropdowns (sorted alphabetically)
const countries = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria',
  'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan',
  'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia',
  'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo (Brazzaville)', 'Congo (Kinshasa)',
  'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Côte d\'Ivoire', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic',
  'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland',
  'France', 'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea',
  'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq',
  'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait',
  'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg',
  'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico',
  'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru',
  'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 'Oman',
  'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal',
  'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'São Tomé and Príncipe',
  'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia',
  'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria',
  'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey',
  'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu',
  'Vatican City', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
];

const industries = [
  'Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing',
  'Retail', 'Consulting', 'Media', 'Government', 'Non-profit', 'Real Estate',
  'Transportation', 'Energy', 'Telecommunications', 'Hospitality'
];

const commonSkills = [
  // Technical Skills
  'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'AWS', 'Azure', 'Docker', 'Kubernetes',
  'TypeScript', 'Angular', 'Vue.js', 'PHP', 'C++', 'C#', '.NET', 'Ruby', 'Go', 'Rust',
  'HTML', 'CSS', 'SASS', 'LESS', 'Bootstrap', 'Tailwind CSS', 'jQuery', 'Express.js',
  'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch', 'GraphQL', 'REST API',
  'Git', 'GitHub', 'GitLab', 'Bitbucket', 'Jenkins', 'CI/CD', 'DevOps', 'Linux',
  
  // Data & Analytics
  'Data Analysis', 'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Pandas', 'NumPy',
  'R', 'MATLAB', 'Tableau', 'Power BI', 'Excel', 'Google Analytics', 'Data Visualization',
  'Statistics', 'Business Intelligence', 'ETL', 'Data Mining', 'Big Data', 'Hadoop', 'Spark',
  
  // Design & Creative
  'UI/UX Design', 'Adobe Photoshop', 'Adobe Illustrator', 'Figma', 'Sketch', 'InVision',
  'Adobe XD', 'Canva', 'Adobe Premiere Pro', 'Final Cut Pro', 'Video Editing', 'Graphic Design',
  'Web Design', 'Mobile App Design', 'Prototyping', 'Wireframing', 'User Research',
  
  // Project Management & Business
  'Project Management', 'Agile', 'Scrum', 'Kanban', 'Jira', 'Confluence', 'Trello', 'Asana',
  'Microsoft Project', 'PMI', 'PRINCE2', 'Lean Six Sigma', 'Process Improvement',
  'Business Analysis', 'Requirements Gathering', 'Stakeholder Management', 'Risk Management',
  
  // Marketing & Sales
  'Digital Marketing', 'SEO', 'SEM', 'Google Ads', 'Facebook Ads', 'Content Marketing',
  'Social Media Marketing', 'Email Marketing', 'Marketing Automation', 'HubSpot', 'Salesforce',
  'CRM', 'Lead Generation', 'Sales', 'Business Development', 'Account Management',
  'Brand Management', 'Public Relations', 'Event Planning', 'Market Research',
  
  // Communication & Soft Skills
  'Communication', 'Public Speaking', 'Presentation Skills', 'Technical Writing',
  'Documentation', 'Training', 'Mentoring', 'Team Building', 'Conflict Resolution',
  'Negotiation', 'Customer Service', 'Client Relations', 'Cross-functional Collaboration',
  
  // Leadership & Management
  'Leadership', 'Team Management', 'People Management', 'Strategic Planning',
  'Change Management', 'Performance Management', 'Talent Acquisition', 'HR',
  'Budget Management', 'Financial Planning', 'Operations Management',
  
  // Industry-Specific Skills
  'Healthcare', 'Finance', 'Banking', 'Insurance', 'Real Estate', 'Legal', 'Compliance',
  'Quality Assurance', 'Testing', 'QA Automation', 'Selenium', 'Cypress', 'Jest',
  'Cybersecurity', 'Information Security', 'Network Security', 'Penetration Testing',
  'Blockchain', 'Cryptocurrency', 'Smart Contracts', 'Solidity',
  
  // Languages & International
  'English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Portuguese',
  'Russian', 'Arabic', 'Hindi', 'Italian', 'Dutch', 'Korean', 'Swedish', 'Norwegian',
  
  // Soft Skills & Personal Development
  'Problem Solving', 'Critical Thinking', 'Analytical Skills', 'Time Management',
  'Organization', 'Adaptability', 'Creativity', 'Innovation', 'Attention to Detail',
  'Multitasking', 'Stress Management', 'Emotional Intelligence', 'Cultural Awareness',
  
  // Tools & Software
  'Microsoft Office', 'Google Workspace', 'Slack', 'Zoom', 'Microsoft Teams',
  'Adobe Creative Suite', 'Sketch', 'Figma', 'Notion', 'Evernote', 'Monday.com',
  'Zapier', 'IFTTT', 'Automation', 'Workflow Optimization'
];

const languages = [
  // Major World Languages
  'English', 'Spanish', 'French', 'German', 'Chinese (Mandarin)', 'Chinese (Cantonese)', 
  'Japanese', 'Korean', 'Portuguese', 'Russian', 'Arabic', 'Hindi', 'Italian', 'Dutch',
  
  // European Languages
  'Swedish', 'Norwegian', 'Danish', 'Finnish', 'Polish', 'Czech', 'Hungarian', 'Romanian',
  'Bulgarian', 'Croatian', 'Serbian', 'Slovak', 'Slovenian', 'Lithuanian', 'Latvian',
  'Estonian', 'Greek', 'Turkish', 'Ukrainian', 'Belarusian', 'Moldovan',
  
  // Asian Languages
  'Thai', 'Vietnamese', 'Indonesian', 'Malay', 'Tagalog', 'Tamil', 'Telugu', 'Bengali',
  'Punjabi', 'Gujarati', 'Marathi', 'Urdu', 'Sinhala', 'Burmese', 'Khmer', 'Lao',
  'Mongolian', 'Tibetan', 'Nepali', 'Sinhalese',
  
  // African Languages
  'Swahili', 'Amharic', 'Yoruba', 'Igbo', 'Hausa', 'Zulu', 'Xhosa', 'Afrikaans',
  'Somali', 'Tigrinya', 'Oromo', 'Wolof', 'Fulani', 'Akan', 'Kinyarwanda',
  
  // Middle Eastern Languages
  'Persian (Farsi)', 'Hebrew', 'Kurdish', 'Pashto', 'Dari', 'Tajik', 'Uzbek',
  'Kazakh', 'Kyrgyz', 'Turkmen', 'Azerbaijani', 'Georgian', 'Armenian',
  
  // American Languages
  'Quechua', 'Guarani', 'Nahuatl', 'Aymara', 'Mapudungun', 'Tupi', 'Carib',
  
  // Sign Languages
  'American Sign Language (ASL)', 'British Sign Language (BSL)', 'French Sign Language',
  'German Sign Language', 'Japanese Sign Language', 'Chinese Sign Language',
  
  // Other Languages
  'Esperanto', 'Latin', 'Ancient Greek', 'Sanskrit', 'Yiddish', 'Ladino',
  'Catalan', 'Basque', 'Galician', 'Welsh', 'Irish Gaelic', 'Scottish Gaelic',
  'Breton', 'Corsican', 'Maltese', 'Icelandic', 'Faroese', 'Luxembourgish'
];

const ComprehensiveProfileForm: React.FC<ComprehensiveProfileFormProps> = ({
  user,
  onSave,
  onCancel,
  loading = false,
  onFileUploadStateChange
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<Partial<User>>(user);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [validationResult, setValidationResult] = useState<any>(null);
  
  // Save states
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  // File upload states
  const [cvFile, setCvFile] = useState<File | null>(null);
  
  // Upload progress states
  const [uploadStates, setUploadStates] = useState({
    cv: { uploading: false, progress: 0, success: false, error: null as string | null }
  });
  
  // Dialog states
  const [experienceDialog, setExperienceDialog] = useState({ open: false, item: null as WorkExperience | null, index: -1 });
  const [educationDialog, setEducationDialog] = useState({ open: false, item: null as Education | null, index: -1 });
  const [certificationDialog, setCertificationDialog] = useState({ open: false, item: null as Certification | null, index: -1 });

  // Simple validation with timeout to prevent too frequent calls
  const [validationTimeout, setValidationTimeout] = useState<NodeJS.Timeout | null>(null);

  // Update validation when formData or user changes
  useEffect(() => {
    // Skip validation during file upload to prevent issues
    if (uploadStates.cv.uploading) {
      console.log('⏳ Skipping validation during file upload');
      return;
    }

    // Clear existing timeout
    if (validationTimeout) {
      clearTimeout(validationTimeout);
    }

    // Set new timeout for validation
    const newTimeout = setTimeout(() => {
      try {
        const combinedUserData = { ...user, ...formData };
        console.log('🔍 ComprehensiveProfileForm updating validation for:', combinedUserData);
        
        // Additional safety check
        if (!combinedUserData || typeof combinedUserData !== 'object') {
          console.warn('⚠️ Invalid user data for validation');
          return;
        }
        
        const result = checkProfileCompletion(combinedUserData);
        console.log('📊 ComprehensiveProfileForm validation result:', result);
        setValidationResult(result);
      } catch (error) {
        console.error('❌ Validation error in ComprehensiveProfileForm:', error);
        // Set a default validation result if validation fails
        setValidationResult({
          isValid: false,
          completionPercentage: 0,
          status: 'incomplete',
          missingFields: ['Profile validation error'],
          recommendations: ['Please refresh the page and try again'],
          canAccessFeatures: {
            psychometricTests: false,
            aiInterviews: false,
            premiumJobs: false,
          },
          completedSections: {
            basic: false,
            contact: false,
            professional: false,
            skills: false,
            experience: false,
            education: false,
            preferences: false,
            documents: false
          }
        });
      }
    }, 300);

    setValidationTimeout(newTimeout);

    // Cleanup on unmount
    return () => {
      if (newTimeout) {
        clearTimeout(newTimeout);
      }
    };
  }, [user, formData, uploadStates.cv.uploading]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleNestedInputChange = (parentField: string, childField: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parentField]: {
        ...prev[parentField],
        [childField]: value
      }
    }));
  };

  const handleArrayAdd = (field: string, item: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), item]
    }));
  };

  const handleArrayUpdate = (field: string, index: number, item: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] || []).map((existing: any, i: number) => 
        i === index ? item : existing
      )
    }));
  };

  const handleArrayRemove = (field: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] || []).filter((_: any, i: number) => i !== index)
    }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, fileType: 'cv') => {
    const files = event.target.files;
    if (!files || !files[0]) return;

    const file = files[0];

    // Notify parent component that file upload is starting
    onFileUploadStateChange?.(true);

    // Reset upload state
    setUploadStates(prev => ({
      ...prev,
      [fileType]: { uploading: true, progress: 0, success: false, error: null }
    }));

    try {
      console.log('Starting CV upload with bulletproof method...');
      
      const fileUrl = await uploadCVBulletproof(file, (progress) => {
        setUploadStates(prev => ({
          ...prev,
          [fileType]: { ...prev[fileType], progress }
        }));
      });
      
      console.log('CV upload successful:', fileUrl);
      
      // Update states
      setUploadStates(prev => ({
        ...prev,
        [fileType]: { uploading: false, progress: 100, success: true, error: null }
      }));
      
      setCvFile(file);
      
      // Update form data
      setFormData(prev => ({
        ...prev,
        cvFile: fileUrl
      }));

      // Reset success state after 3 seconds
      setTimeout(() => {
        setUploadStates(prev => ({
          ...prev,
          [fileType]: { ...prev[fileType], success: false }
        }));
      }, 3000);

    } catch (error: any) {
      console.error('CV upload error:', error);
      
      setUploadStates(prev => ({
        ...prev,
        [fileType]: { uploading: false, progress: 0, success: false, error: error.message || 'Upload failed' }
      }));

      // Clear error after 5 seconds
      setTimeout(() => {
        setUploadStates(prev => ({
          ...prev,
          [fileType]: { ...prev[fileType], error: null }
        }));
      }, 5000);
    } finally {
      // Notify parent component that file upload is complete
      onFileUploadStateChange?.(false);
    }

    // Reset file input
    event.target.value = '';
  };

  const removeFile = (fileType: 'cv') => {
    setCvFile(null);
    handleInputChange('cvFile', null);
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 0: // Basic Information
        if (!formData.firstName?.trim()) newErrors.firstName = 'First name is required';
        if (!formData.lastName?.trim()) newErrors.lastName = 'Last name is required';
        if (!formData.email?.trim()) newErrors.email = 'Email is required';
        if (!formData.phone?.trim()) newErrors.phone = 'Phone number is required';
        break;
      case 1: // Professional Details
        if (!formData.jobTitle?.trim()) newErrors.jobTitle = 'Job title is required';
        if (!formData.employmentStatus) newErrors.employmentStatus = 'Employment status is required';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(activeStep)) {
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      console.log('🔄 Frontend: Saving profile data:', {
        formDataKeys: Object.keys(formData),
        phone: formData.phone,
        location: formData.location,
        jobTitle: formData.jobTitle,
        bio: formData.bio,
        skills: formData.skills,
        experience: formData.experience?.length || 0,
        education: formData.education?.length || 0,
        expectedSalary: formData.expectedSalary,
        passport: formData.passport,
        fullFormData: formData
      });
      await onSave(formData);
      
      setSaveSuccess(true);
      console.log('Profile saved successfully!');
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
      
    } catch (error: any) {
      console.error('Error saving profile:', error);
      const errorMessage = error.message || 'Failed to save profile. Please try again.';
      setSaveError(errorMessage);
      
      // Auto-hide error message after 5 seconds
      setTimeout(() => {
        setSaveError(null);
      }, 5000);
    } finally {
      setSaving(false);
    }
  };

  // Experience Dialog Component
  const ExperienceDialog = () => {
    const [expData, setExpData] = useState<WorkExperience>(
      experienceDialog.item || {
        company: '',
        position: '',
        startDate: '',
        endDate: '',
        current: false,
        description: '',
        location: '',
        achievements: [],
        employmentType: JobType.FULL_TIME,
        industry: '',
        responsibilities: [],
        technologies: []
      }
    );

    const handleSave = () => {
      if (experienceDialog.index >= 0) {
        handleArrayUpdate('experience', experienceDialog.index, expData);
      } else {
        handleArrayAdd('experience', { ...expData, _id: Date.now().toString() });
      }
      setExperienceDialog({ open: false, item: null, index: -1 });
    };

    return (
      <Dialog open={experienceDialog.open} maxWidth="md" fullWidth>
        <DialogTitle>
          {experienceDialog.index >= 0 ? 'Edit Experience' : 'Add Experience'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Company"
                value={expData.company}
                onChange={(e) => setExpData(prev => ({ ...prev, company: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Position"
                value={expData.position}
                onChange={(e) => setExpData(prev => ({ ...prev, position: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Employment Type</InputLabel>
                <Select
                  value={expData.employmentType || ''}
                  onChange={(e) => setExpData(prev => ({ ...prev, employmentType: e.target.value as JobType }))}
                >
                  <MenuItem value={JobType.FULL_TIME}>Full Time</MenuItem>
                  <MenuItem value={JobType.PART_TIME}>Part Time</MenuItem>
                  <MenuItem value={JobType.CONTRACT}>Contract</MenuItem>
                  <MenuItem value={JobType.INTERNSHIP}>Internship</MenuItem>
                  <MenuItem value={JobType.FREELANCE}>Freelance</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                options={industries}
                value={expData.industry || ''}
                onChange={(_, value) => setExpData(prev => ({ ...prev, industry: value || '' }))}
                renderInput={(params) => <TextField {...params} label="Industry" />}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location"
                value={expData.location || ''}
                onChange={(e) => setExpData(prev => ({ ...prev, location: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Start Date"
                  value={expData.startDate ? new Date(expData.startDate) : null}
                  onChange={(date) => setExpData(prev => ({ 
                    ...prev, 
                    startDate: date ? date.toISOString().split('T')[0] : '' 
                  }))}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={expData.current}
                    onChange={(e) => setExpData(prev => ({ ...prev, current: e.target.checked }))}
                  />
                }
                label="I currently work here"
              />
            </Grid>
            {!expData.current && (
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="End Date"
                    value={expData.endDate ? new Date(expData.endDate) : null}
                    onChange={(date) => setExpData(prev => ({ 
                      ...prev, 
                      endDate: date ? date.toISOString().split('T')[0] : '' 
                    }))}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </LocalizationProvider>
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Description"
                value={expData.description}
                onChange={(e) => setExpData(prev => ({ ...prev, description: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={commonSkills}
                freeSolo
                value={expData.technologies || []}
                onChange={(_, value) => setExpData(prev => ({ ...prev, technologies: value }))}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => {
                    const { key, ...tagProps } = getTagProps({ index });
                    return (
                      <Chip key={key} variant="outlined" label={option} {...tagProps} />
                    );
                  })
                }
                renderInput={(params) => (
                  <TextField {...params} label="Technologies Used" placeholder="Add technologies" />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExperienceDialog({ open: false, item: null, index: -1 })}>
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  const EducationDialog = () => {
    const [eduData, setEduData] = useState<Education>(
      educationDialog.item || {
        institution: '',
        degree: '',
        field: '',
        year: new Date().getFullYear(),
        startDate: '',
        endDate: '',
        grade: '',
        description: ''
      }
    );

    const handleSave = () => {
      if (educationDialog.index >= 0) {
        handleArrayUpdate('education', educationDialog.index, eduData);
      } else {
        handleArrayAdd('education', eduData);
      }
      setEducationDialog({ open: false, item: null, index: -1 });
    };

    return (
      <Dialog 
        open={educationDialog.open} 
        onClose={() => setEducationDialog({ open: false, item: null, index: -1 })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {educationDialog.index >= 0 ? 'Edit Education' : 'Add Education'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Institution/University"
                value={eduData.institution}
                onChange={(e) => setEduData({ ...eduData, institution: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Degree"
                value={eduData.degree}
                onChange={(e) => setEduData({ ...eduData, degree: e.target.value })}
                placeholder="e.g., Bachelor of Science, Master of Arts"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Field of Study"
                value={eduData.field}
                onChange={(e) => setEduData({ ...eduData, field: e.target.value })}
                placeholder="e.g., Computer Science, Business Administration"
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={eduData.startDate}
                onChange={(e) => setEduData({ ...eduData, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={eduData.endDate}
                onChange={(e) => setEduData({ ...eduData, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                helperText="Leave empty if currently studying"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Graduation Year"
                type="number"
                value={eduData.year}
                onChange={(e) => setEduData({ ...eduData, year: parseInt(e.target.value) })}
                inputProps={{ min: 1950, max: new Date().getFullYear() + 10 }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Grade/GPA"
                value={eduData.grade}
                onChange={(e) => setEduData({ ...eduData, grade: e.target.value })}
                placeholder="e.g., 3.8/4.0, First Class, Distinction"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={eduData.description}
                onChange={(e) => setEduData({ ...eduData, description: e.target.value })}
                placeholder="Describe your academic achievements, relevant coursework, projects, or honors"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEducationDialog({ open: false, item: null, index: -1 })}>
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0: // Basic Information
        return (
          <Box sx={{ p: 2 }}>
            {/* Personal Information Section */}
            <Typography variant="h6" gutterBottom sx={{ mb: 3, color: 'primary.main', fontWeight: 'bold' }}>
              Personal Information
            </Typography>
            <Grid container spacing={4}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={formData.firstName || ''}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  error={!!errors.firstName}
                  helperText={errors.firstName}
                  required
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={formData.lastName || ''}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  error={!!errors.lastName}
                  helperText={errors.lastName}
                  required
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  error={!!errors.email}
                  helperText={errors.email}
                  required
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={formData.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  error={!!errors.phone}
                  helperText={errors.phone || "Include country code (e.g., +250 123 456 789 for Rwanda)"}
                  required
                  placeholder="+250 123 456 789"
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        📞
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Date of Birth"
                    value={formData.dateOfBirth ? new Date(formData.dateOfBirth) : null}
                    onChange={(date) => handleInputChange('dateOfBirth', date ? date.toISOString().split('T')[0] : '')}
                    slotProps={{ textField: { fullWidth: true, sx: { mb: 2 } } }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="National ID Number (Optional)"
                  value={formData.idNumber || ''}
                  onChange={(e) => handleInputChange('idNumber', e.target.value)}
                  helperText="Enter your national identification number"
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        🆔
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Passport Number (Optional)"
                  value={formData.passport || ''}
                  onChange={(e) => handleInputChange('passport', e.target.value)}
                  helperText="Enter your passport number if you don't have an ID"
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        📘
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Gender</InputLabel>
                  <Select
                    value={formData.gender || ''}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                  >
                    <MenuItem value="male">Male</MenuItem>
                    <MenuItem value="female">Female</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                    <MenuItem value="prefer_not_to_say">Prefer not to say</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Divider sx={{ my: 4 }} />

            {/* Location Information Section */}
            <Typography variant="h6" gutterBottom sx={{ mb: 3, color: 'primary.main', fontWeight: 'bold' }}>
              Location Information
            </Typography>
            <Grid container spacing={4}>
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={countries}
                  value={formData.nationality || ''}
                  onChange={(_, value) => handleInputChange('nationality', value)}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      label="Country/Nationality" 
                      helperText="Select your African country"
                      sx={{ mb: 2 }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="City/Location"
                  value={formData.location || ''}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  helperText="Enter your current city or location"
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Full Address (Optional)"
                  value={formData.address || ''}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  helperText="Complete address for potential employers"
                  sx={{ mb: 2 }}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 4 }} />

            {/* About Me Section */}
            <Typography variant="h6" gutterBottom sx={{ mb: 3, color: 'primary.main', fontWeight: 'bold' }}>
              About Me
            </Typography>
            <Grid container spacing={4}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={5}
                  label="Professional Bio / About Me"
                  value={formData.bio || ''}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  helperText="Write a compelling professional summary that highlights your key strengths, experience, and career goals. This will be visible to employers."
                  sx={{ mb: 2 }}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 4 }} />

            {/* Document Upload Section */}
            <Typography variant="h6" gutterBottom sx={{ mb: 3, color: 'primary.main', fontWeight: 'bold' }}>
              CV Upload
            </Typography>
            <Grid container spacing={4}>
              {/* CV Upload */}
              <Grid item xs={12}>
                <Paper sx={{ 
                  p: 4, 
                  border: '2px dashed', 
                  borderColor: uploadStates.cv.success ? 'success.light' : uploadStates.cv.error ? 'error.light' : 'primary.light', 
                  borderRadius: 2,
                  bgcolor: uploadStates.cv.success ? 'success.50' : uploadStates.cv.error ? 'error.50' : 'transparent'
                }}>
                  <Box sx={{ textAlign: 'center' }}>
                    {uploadStates.cv.uploading ? (
                      <CircularProgress sx={{ fontSize: 48, mb: 2 }} />
                    ) : uploadStates.cv.success ? (
                      <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                    ) : uploadStates.cv.error ? (
                      <Error sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />
                    ) : (
                      <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                    )}
                    
                    <Typography variant="h6" gutterBottom>
                      {uploadStates.cv.uploading ? 'Uploading CV...' : 'Upload Your CV'}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Upload your most current CV/Resume (PDF, DOC, DOCX - Max 10MB)
                    </Typography>

                    {/* Upload Progress */}
                    {uploadStates.cv.uploading && (
                      <Box sx={{ mb: 2 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={uploadStates.cv.progress} 
                          sx={{ mb: 1 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {uploadStates.cv.progress}% uploaded
                        </Typography>
                      </Box>
                    )}

                    {/* Success Message */}
                    {uploadStates.cv.success && (
                      <Alert severity="success" sx={{ mb: 2 }}>
                        CV uploaded successfully!
                      </Alert>
                    )}

                    {/* Error Message */}
                    {uploadStates.cv.error && (
                      <Alert severity="error" sx={{ mb: 2 }}>
                        {uploadStates.cv.error}
                      </Alert>
                    )}
                    
                    <input
                      accept=".pdf,.doc,.docx"
                      style={{ display: 'none' }}
                      id="cv-upload"
                      type="file"
                      onChange={(e) => handleFileUpload(e, 'cv')}
                      disabled={uploadStates.cv.uploading}
                    />
                    <label htmlFor="cv-upload">
                      <Button 
                        variant="contained" 
                        component="span" 
                        startIcon={uploadStates.cv.uploading ? <CircularProgress size={20} /> : <Upload />}
                        disabled={uploadStates.cv.uploading}
                        size="large"
                        sx={{ mr: 2 }}
                      >
                        {uploadStates.cv.uploading ? 'Uploading...' : 'Choose CV File'}
                      </Button>
                    </label>
                    
                    {cvFile && !uploadStates.cv.uploading && (
                      <Box sx={{ mt: 2 }}>
                        <Chip
                          label={cvFile.name}
                          onDelete={() => removeFile('cv')}
                          color="primary"
                          variant="outlined"
                          icon={<CheckCircle />}
                        />
                      </Box>
                    )}
                  </Box>
                </Paper>
              </Grid>


            </Grid>
          </Box>
        );

      case 1: // Professional Details
        return (
          <Box sx={{ p: 2 }}>
            {/* Current Position Section */}
            <Typography variant="h6" gutterBottom sx={{ mb: 3, color: 'primary.main', fontWeight: 'bold' }}>
              Current Position
            </Typography>
            <Grid container spacing={4}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Job Title / Position"
                  value={formData.jobTitle || ''}
                  onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                  error={!!errors.jobTitle}
                  helperText={errors.jobTitle || "Your current or most recent job title"}
                  required
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Current Company / Organization"
                  value={formData.company || ''}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  helperText="Name of your current or most recent employer"
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={industries}
                  value={formData.industry || ''}
                  onChange={(_, value) => handleInputChange('industry', value)}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      label="Industry" 
                      helperText="Select your industry sector"
                      sx={{ mb: 2 }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Department"
                  value={formData.department || ''}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  helperText="Your department or division"
                  sx={{ mb: 2 }}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 4 }} />

            {/* Employment Status Section */}
            <Typography variant="h6" gutterBottom sx={{ mb: 3, color: 'primary.main', fontWeight: 'bold' }}>
              Employment Status
            </Typography>
            <Grid container spacing={4}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required sx={{ mb: 2 }}>
                  <InputLabel>Employment Status</InputLabel>
                  <Select
                    value={formData.employmentStatus || ''}
                    onChange={(e) => handleInputChange('employmentStatus', e.target.value)}
                    error={!!errors.employmentStatus}
                  >
                    <MenuItem value={EmploymentStatus.EMPLOYED}>Currently Employed</MenuItem>
                    <MenuItem value={EmploymentStatus.UNEMPLOYED}>Unemployed / Job Seeking</MenuItem>
                    <MenuItem value={EmploymentStatus.STUDENT}>Student</MenuItem>
                    <MenuItem value={EmploymentStatus.FREELANCER}>Freelancer</MenuItem>
                    <MenuItem value={EmploymentStatus.SELF_EMPLOYED}>Self Employed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Experience Level</InputLabel>
                  <Select
                    value={formData.experienceLevel || ''}
                    onChange={(e) => handleInputChange('experienceLevel', e.target.value)}
                  >
                    <MenuItem value={ExperienceLevel.ENTRY_LEVEL}>Entry Level (0-2 years)</MenuItem>
                    <MenuItem value={ExperienceLevel.MID_LEVEL}>Mid Level (3-5 years)</MenuItem>
                    <MenuItem value={ExperienceLevel.SENIOR_LEVEL}>Senior Level (6+ years)</MenuItem>
                    <MenuItem value={ExperienceLevel.EXECUTIVE}>Executive / Leadership</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Years of Experience"
                  type="number"
                  value={formData.yearsOfExperience || ''}
                  onChange={(e) => handleInputChange('yearsOfExperience', parseInt(e.target.value) || 0)}
                  helperText="Total years of professional experience"
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Notice Period"
                  value={formData.noticePeriod || ''}
                  onChange={(e) => handleInputChange('noticePeriod', e.target.value)}
                  helperText="e.g., Immediate, 1 month, 2 months"
                  sx={{ mb: 2 }}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 4 }} />

            {/* Professional Summary Section */}
            <Typography variant="h6" gutterBottom sx={{ mb: 3, color: 'primary.main', fontWeight: 'bold' }}>
              Professional Summary
            </Typography>
            <Grid container spacing={4}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={6}
                  label="Professional Summary"
                  value={formData.summary || ''}
                  onChange={(e) => handleInputChange('summary', e.target.value)}
                  helperText="Write a comprehensive summary of your professional background, key achievements, skills, and career goals. This is your elevator pitch to employers."
                  sx={{ mb: 2 }}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 4 }} />

            {/* Compensation & Availability Section */}
            <Typography variant="h6" gutterBottom sx={{ mb: 3, color: 'primary.main', fontWeight: 'bold' }}>
              Compensation & Availability
            </Typography>
            <Grid container spacing={4}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Current Salary (Annual)"
                  type="number"
                  value={formData.currentSalary || ''}
                  onChange={(e) => handleInputChange('currentSalary', parseFloat(e.target.value) || 0)}
                  InputProps={{
                    startAdornment: <AttachMoney />
                  }}
                  helperText="Your current annual salary (optional)"
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Expected Salary (Annual)"
                  type="number"
                  value={formData.expectedSalary || ''}
                  onChange={(e) => handleInputChange('expectedSalary', parseFloat(e.target.value) || 0)}
                  InputProps={{
                    startAdornment: <AttachMoney />
                  }}
                  helperText="Your salary expectations"
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Preferred Job Type</InputLabel>
                  <Select
                    value={formData.preferredJobType || ''}
                    onChange={(e) => handleInputChange('preferredJobType', e.target.value)}
                  >
                    <MenuItem value={JobType.FULL_TIME}>Full Time</MenuItem>
                    <MenuItem value={JobType.PART_TIME}>Part Time</MenuItem>
                    <MenuItem value={JobType.CONTRACT}>Contract</MenuItem>
                    <MenuItem value={JobType.INTERNSHIP}>Internship</MenuItem>
                    <MenuItem value={JobType.FREELANCE}>Freelance</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Work Preference</InputLabel>
                  <Select
                    value={formData.workPreference || ''}
                    onChange={(e) => handleInputChange('workPreference', e.target.value)}
                  >
                    <MenuItem value="remote">Remote</MenuItem>
                    <MenuItem value="onsite">On-site</MenuItem>
                    <MenuItem value="hybrid">Hybrid</MenuItem>
                    <MenuItem value="flexible">Flexible</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        );

      case 2: // Experience & Education
        return (
          <Box>
            {/* Work Experience Section */}
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Work /> Work Experience
                </Typography>
                <Button
                  startIcon={<Add />}
                  onClick={() => setExperienceDialog({ open: true, item: null, index: -1 })}
                >
                  Add Experience
                </Button>
              </Box>
              
              {formData.experience && formData.experience.length > 0 ? (
                <List>
                  {formData.experience.map((exp, index) => (
                    <ListItem key={index} divider>
                      <ListItemText
                        primary={`${exp.position} at ${exp.company}`}
                        secondary={`${exp.startDate} - ${exp.current ? 'Present' : exp.endDate || 'N/A'} | ${exp.location || 'Location not specified'}`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          onClick={() => setExperienceDialog({ open: true, item: exp, index })}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          onClick={() => handleArrayRemove('experience', index)}
                        >
                          <Delete />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Alert severity="info">
                  No work experience added yet. Click "Add Experience" to get started.
                </Alert>
              )}
            </Box>

            <ExperienceDialog />

            {/* Education Section */}
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <School /> Education & Academic Background
                </Typography>
                <Button
                  startIcon={<Add />}
                  onClick={() => setEducationDialog({ open: true, item: null, index: -1 })}
                >
                  Add Education
                </Button>
              </Box>
              
              {formData.education && formData.education.length > 0 ? (
                <List>
                  {formData.education.map((edu, index) => (
                    <ListItem key={index} divider>
                      <ListItemText
                        primary={`${edu.degree} in ${edu.field}`}
                        secondary={
                          <React.Fragment>
                            <span style={{ display: 'block' }}>
                              {edu.institution} • {edu.startDate} - {edu.endDate || edu.year}
                            </span>
                            {edu.grade && (
                              <span style={{ display: 'block' }}>
                                Grade: {edu.grade}
                              </span>
                            )}
                            {edu.description && (
                              <span style={{ display: 'block', marginTop: '4px' }}>
                                {edu.description}
                              </span>
                            )}
                          </React.Fragment>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          onClick={() => setEducationDialog({ open: true, item: edu, index })}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          onClick={() => handleArrayRemove('education', index)}
                        >
                          <Delete />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Alert severity="info">
                  No education background added yet. Click "Add Education" to get started.
                </Alert>
              )}
            </Box>

            <EducationDialog />
          </Box>
        );

      case 3: // Skills & Languages
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Code /> Skills
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Add any skills you have - technical, soft skills, tools, languages, or industry-specific knowledge. 
                You can type custom skills or select from suggestions.
              </Typography>
              <Autocomplete
                multiple
                options={commonSkills}
                freeSolo
                value={formData.skills || []}
                onChange={(_, value) => handleInputChange('skills', value)}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => {
                    const { key, ...tagProps } = getTagProps({ index });
                    return (
                      <Chip 
                        key={key} 
                        variant="outlined" 
                        label={option} 
                        {...tagProps}
                        sx={{ 
                          mb: 1,
                          '&:hover': {
                            backgroundColor: 'primary.light',
                            color: 'primary.contrastText'
                          }
                        }}
                      />
                    );
                  })
                }
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label="Skills" 
                    placeholder="Type to add skills (e.g., 'Communication', 'Python', 'Project Management')"
                    helperText="Add as many skills as you want - there's no limit!"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        minHeight: '56px',
                        alignItems: 'flex-start',
                        paddingTop: '8px'
                      }
                    }}
                  />
                )}
                sx={{
                  '& .MuiAutocomplete-tag': {
                    margin: '4px 4px 4px 0'
                  }
                }}
              />
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  💡 <strong>Tip:</strong> Include a mix of technical skills (programming languages, tools), 
                  soft skills (communication, leadership), and industry knowledge to showcase your full potential.
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Language /> Languages
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Add any languages you speak, including dialects, sign languages, or programming languages. 
                You can type custom languages or select from suggestions.
              </Typography>
              <Autocomplete
                multiple
                options={languages}
                freeSolo
                value={(formData.languages || []).map(lang => lang.language)}
                onChange={(_, value) => {
                  const languageObjects = value.map(lang => ({
                    language: lang,
                    proficiency: 'conversational' as const
                  }));
                  handleInputChange('languages', languageObjects);
                }}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => {
                    const { key, ...tagProps } = getTagProps({ index });
                    return (
                      <Chip 
                        key={key} 
                        variant="outlined" 
                        label={option} 
                        {...tagProps}
                        sx={{ 
                          mb: 1,
                          '&:hover': {
                            backgroundColor: 'secondary.light',
                            color: 'secondary.contrastText'
                          }
                        }}
                      />
                    );
                  })
                }
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label="Languages" 
                    placeholder="Type to add languages (e.g., 'English', 'Spanish', 'American Sign Language')"
                    helperText="Add as many languages as you want - there's no limit!"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        minHeight: '56px',
                        alignItems: 'flex-start',
                        paddingTop: '8px'
                      }
                    }}
                  />
                )}
                sx={{
                  '& .MuiAutocomplete-tag': {
                    margin: '4px 4px 4px 0'
                  }
                }}
              />
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  🌍 <strong>Tip:</strong> Include all languages you speak, including native languages, 
                  foreign languages, dialects, sign languages, and even programming languages. 
                  This helps employers understand your communication abilities and cultural background.
                </Typography>
              </Box>
            </Grid>
            
            {/* Social Media Links Section */}
            <Grid item xs={12}>
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main', fontWeight: 'bold' }}>
                <Link /> Social Media & Portfolio Links
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Add your professional social media profiles and portfolio links to showcase your work
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="LinkedIn Profile"
                value={formData.socialLinks?.linkedin || ''}
                onChange={(e) => handleNestedInputChange('socialLinks', 'linkedin', e.target.value)}
                placeholder="https://linkedin.com/in/yourprofile"
                InputProps={{
                  startAdornment: <InputAdornment position="start">🔗</InputAdornment>
                }}
                sx={{ mb: 2 }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="GitHub Profile"
                value={formData.socialLinks?.github || ''}
                onChange={(e) => handleNestedInputChange('socialLinks', 'github', e.target.value)}
                placeholder="https://github.com/yourusername"
                InputProps={{
                  startAdornment: <InputAdornment position="start">💻</InputAdornment>
                }}
                sx={{ mb: 2 }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Portfolio Website"
                value={formData.socialLinks?.portfolio || ''}
                onChange={(e) => handleNestedInputChange('socialLinks', 'portfolio', e.target.value)}
                placeholder="https://yourportfolio.com"
                InputProps={{
                  startAdornment: <InputAdornment position="start">🎨</InputAdornment>
                }}
                sx={{ mb: 2 }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Personal Website"
                value={formData.socialLinks?.website || ''}
                onChange={(e) => handleNestedInputChange('socialLinks', 'website', e.target.value)}
                placeholder="https://yourwebsite.com"
                InputProps={{
                  startAdornment: <InputAdornment position="start">🌐</InputAdornment>
                }}
                sx={{ mb: 2 }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Twitter/X Profile"
                value={formData.socialLinks?.twitter || ''}
                onChange={(e) => handleNestedInputChange('socialLinks', 'twitter', e.target.value)}
                placeholder="https://twitter.com/yourusername"
                InputProps={{
                  startAdornment: <InputAdornment position="start">🐦</InputAdornment>
                }}
                sx={{ mb: 2 }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Behance Profile"
                value={formData.socialLinks?.behance || ''}
                onChange={(e) => handleNestedInputChange('socialLinks', 'behance', e.target.value)}
                placeholder="https://behance.net/yourprofile"
                InputProps={{
                  startAdornment: <InputAdornment position="start">🎭</InputAdornment>
                }}
                sx={{ mb: 2 }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Dribbble Profile"
                value={formData.socialLinks?.dribbble || ''}
                onChange={(e) => handleNestedInputChange('socialLinks', 'dribbble', e.target.value)}
                placeholder="https://dribbble.com/yourprofile"
                InputProps={{
                  startAdornment: <InputAdornment position="start">🏀</InputAdornment>
                }}
                sx={{ mb: 2 }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="YouTube Channel"
                value={formData.socialLinks?.youtube || ''}
                onChange={(e) => handleNestedInputChange('socialLinks', 'youtube', e.target.value)}
                placeholder="https://youtube.com/c/yourchannel"
                InputProps={{
                  startAdornment: <InputAdornment position="start">📺</InputAdornment>
                }}
                sx={{ mb: 2 }}
              />
            </Grid>
          </Grid>
        );

      case 4: // Preferences & Settings
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Job Preferences
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Preferred Job Types</InputLabel>
                <Select
                  multiple
                  value={formData.jobPreferences?.preferredJobTypes || []}
                  onChange={(e) => handleNestedInputChange('jobPreferences', 'preferredJobTypes', e.target.value)}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as JobType[]).map((value) => (
                        <Chip key={value} label={value.replace('_', ' ')} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  <MenuItem value={JobType.FULL_TIME}>Full Time</MenuItem>
                  <MenuItem value={JobType.PART_TIME}>Part Time</MenuItem>
                  <MenuItem value={JobType.CONTRACT}>Contract</MenuItem>
                  <MenuItem value={JobType.INTERNSHIP}>Internship</MenuItem>
                  <MenuItem value={JobType.FREELANCE}>Freelance</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Autocomplete
                multiple
                options={countries}
                value={formData.jobPreferences?.preferredLocations || []}
                onChange={(_, value) => handleNestedInputChange('jobPreferences', 'preferredLocations', value)}
                renderInput={(params) => <TextField {...params} label="Preferred Locations" />}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.jobPreferences?.remoteWork || false}
                    onChange={(e) => handleNestedInputChange('jobPreferences', 'remoteWork', e.target.checked)}
                  />
                }
                label="Open to remote work"
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.jobPreferences?.willingToRelocate || false}
                    onChange={(e) => handleNestedInputChange('jobPreferences', 'willingToRelocate', e.target.checked)}
                  />
                }
                label="Willing to relocate"
              />
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  // Use validation result from state
  const profileCompletion = validationResult?.completionPercentage || 0;

  return (
    <Box sx={{ maxWidth: '1200px', mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 2, textAlign: 'center', color: 'primary.main', fontWeight: 'bold' }}>
        Complete Your Professional Profile
      </Typography>
      
      {/* Profile Completion Indicator */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Profile Completion: {profileCompletion}%
        </Typography>
        <LinearProgress 
          variant="determinate" 
          value={profileCompletion} 
          sx={{ 
            height: 8, 
            borderRadius: 4, 
            maxWidth: 400, 
            mx: 'auto',
            bgcolor: 'grey.200',
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
              bgcolor: profileCompletion >= 80 ? 'success.main' : profileCompletion >= 50 ? 'warning.main' : 'error.main'
            }
          }} 
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {profileCompletion >= 80 ? 'Excellent! Your profile is almost complete.' : 
           profileCompletion >= 50 ? 'Good progress! Add more details to improve visibility.' : 
           'Get started by filling out your basic information and uploading documents.'}
        </Typography>
      </Box>
      
      <Typography variant="body1" sx={{ mb: 4, textAlign: 'center', color: 'text.secondary' }}>
        Build a comprehensive profile to attract top employers and unlock all platform features
      </Typography>

      {/* Success Alert */}
      {saveSuccess && (
        <Fade in={saveSuccess}>
          <Alert 
            severity="success" 
            sx={{ mb: 3 }}
            onClose={() => setSaveSuccess(false)}
            icon={<CheckCircle />}
          >
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              Profile Saved Successfully!
            </Typography>
            <Typography variant="body2">
              Your profile has been updated and saved to the backend.
            </Typography>
          </Alert>
        </Fade>
      )}

      {/* Error Alert */}
      {saveError && (
        <Fade in={!!saveError}>
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            onClose={() => setSaveError(null)}
            icon={<Error />}
          >
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              Save Failed
            </Typography>
            <Typography variant="body2">
              {saveError}
            </Typography>
          </Alert>
        </Fade>
      )}
      
      <Stepper activeStep={activeStep} orientation="vertical" sx={{ mt: 4 }}>
        {steps.map((label, index) => (
          <Step key={label}>
            <StepLabel 
              sx={{ 
                '& .MuiStepLabel-label': { 
                  fontSize: '1.1rem', 
                  fontWeight: 'bold',
                  color: activeStep === index ? 'primary.main' : 'text.secondary'
                } 
              }}
            >
              {label}
            </StepLabel>
            <StepContent>
              <Paper 
                sx={{ 
                  p: { xs: 2, sm: 4, md: 6 }, 
                  mb: 3, 
                  borderRadius: 3,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                {renderStepContent(index)}
              </Paper>
              <Box sx={{ mb: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  onClick={index === steps.length - 1 ? handleSubmit : handleNext}
                  disabled={loading || saving}
                  size="large"
                  startIcon={
                    (index === steps.length - 1 && saving) ? 
                    <CircularProgress size={20} color="inherit" /> : 
                    (index === steps.length - 1 ? <Save /> : null)
                  }
                  sx={{ 
                    px: 4, 
                    py: 1.5,
                    borderRadius: 2,
                    fontWeight: 'bold',
                    minWidth: 140,
                    bgcolor: index === steps.length - 1 && saveSuccess ? 'success.main' : undefined,
                    '&:hover': {
                      bgcolor: index === steps.length - 1 && saveSuccess ? 'success.dark' : undefined,
                    }
                  }}
                >
                  {saving ? 'Saving Profile...' : 
                   saveSuccess && index === steps.length - 1 ? 'Profile Saved!' :
                   (index === steps.length - 1 ? 'Save Profile' : 'Continue')}
                </Button>
                <Button
                  disabled={index === 0}
                  onClick={handleBack}
                  variant="outlined"
                  size="large"
                  sx={{ 
                    px: 4, 
                    py: 1.5,
                    borderRadius: 2,
                    fontWeight: 'bold',
                    minWidth: 100
                  }}
                >
                  Back
                </Button>
                {onCancel && (
                  <Button
                    onClick={onCancel}
                    variant="text"
                    size="large"
                    sx={{ 
                      px: 4, 
                      py: 1.5,
                      borderRadius: 2,
                      fontWeight: 'bold',
                      minWidth: 100
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </Box>
            </StepContent>
          </Step>
        ))}
      </Stepper>

      {/* Upload Status Snackbars */}
      <Snackbar
        open={uploadStates.cv.success}
        autoHideDuration={3000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          CV uploaded successfully to Cloudinary!
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!uploadStates.cv.error}
        autoHideDuration={5000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="error" sx={{ width: '100%' }}>
          CV upload failed: {uploadStates.cv.error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ComprehensiveProfileForm;
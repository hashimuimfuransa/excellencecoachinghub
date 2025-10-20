import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Divider,
  Autocomplete,
  useTheme,
  useMediaQuery,
  Stack
} from '@mui/material';
import {
  Save,
  Send,
  Add,
  Delete,
  School,
  Description,
  AttachMoney,
  Category
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { courseService } from '../../services/courseService';

const steps = ['Basic Information', 'Course Details', 'Discoverability & Target Audience', 'Review & Submit'];

const categories = [
  // Programming Languages
  'JavaScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin', 'TypeScript',
  
  // Web Development
  'Web Development', 'Frontend Development', 'Backend Development', 'Full Stack Development',
  'HTML', 'CSS', 'React', 'Vue.js', 'Angular', 'Node.js', 'Express.js', 'Next.js', 'Nuxt.js',
  
  // Mobile Development
  'Mobile Development', 'iOS Development', 'Android Development', 'React Native', 'Flutter',
  'Xamarin', 'Ionic', 'Cordova',
  
  // Data Science & AI
  'Data Science', 'Machine Learning', 'Artificial Intelligence', 'Deep Learning', 'Data Analysis',
  'Data Visualization', 'Statistics', 'R Programming', 'TensorFlow', 'PyTorch', 'Pandas', 'NumPy',
  
  // Cloud & DevOps
  'Cloud Computing', 'AWS', 'Azure', 'Google Cloud', 'DevOps', 'Docker', 'Kubernetes', 'CI/CD',
  'Jenkins', 'GitLab', 'GitHub Actions', 'Terraform', 'Ansible',
  
  // Cybersecurity
  'Cybersecurity', 'Ethical Hacking', 'Penetration Testing', 'Network Security', 'Information Security',
  'Cryptography', 'Security Analysis', 'Risk Management',
  
  // Database
  'Database', 'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch', 'Database Design',
  'Data Modeling', 'Database Administration',
  
  // Design & UI/UX
  'UI/UX Design', 'Graphic Design', 'Web Design', 'User Interface Design', 'User Experience Design',
  'Adobe Photoshop', 'Adobe Illustrator', 'Figma', 'Sketch', 'Adobe XD', 'Prototyping',
  
  // Business & Marketing
  'Digital Marketing', 'SEO', 'SEM', 'Social Media Marketing', 'Content Marketing', 'Email Marketing',
  'Analytics', 'Google Analytics', 'Facebook Ads', 'Google Ads', 'Marketing Strategy',
  
  // Project Management
  'Project Management', 'Agile', 'Scrum', 'Kanban', 'Jira', 'Trello', 'Asana', 'Product Management',
  
  // Finance & Accounting
  'Finance', 'Accounting', 'Financial Analysis', 'Investment', 'Trading', 'Cryptocurrency',
  'Blockchain', 'Personal Finance', 'Corporate Finance',
  
  // Language Learning
  'English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Korean', 'Portuguese',
  'Italian', 'Russian', 'Arabic', 'Hindi',
  
  // Creative Arts
  'Photography', 'Video Editing', 'Music Production', 'Digital Art', 'Animation', '3D Modeling',
  'Blender', 'After Effects', 'Premiere Pro', 'Final Cut Pro',
  
  // Health & Fitness
  'Fitness', 'Yoga', 'Nutrition', 'Mental Health', 'Meditation', 'Weight Loss', 'Muscle Building',
  'Cardio Training', 'Strength Training',
  
  // Academic Subjects
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Literature',
  'Philosophy', 'Psychology', 'Sociology', 'Economics', 'Political Science',
  
  // Professional Skills
  'Communication Skills', 'Leadership', 'Public Speaking', 'Writing', 'Presentation Skills',
  'Time Management', 'Critical Thinking', 'Problem Solving', 'Negotiation', 'Team Building',
  
  // Technology Trends
  'Blockchain Development', 'Web3', 'NFT', 'Metaverse', 'IoT', 'Edge Computing', 'Quantum Computing',
  'AR/VR Development', 'Game Development', 'Unity', 'Unreal Engine',
  
  // Other Categories
  'Entrepreneurship', 'Startup', 'E-commerce', 'Online Business', 'Freelancing', 'Remote Work',
  'Career Development', 'Resume Writing', 'Interview Skills', 'Networking'
];

// Learning Categories for better course discoverability (curated)
const learningCategories = [
  {
    id: 'professional_coaching',
    title: 'Professional Coaching',
    description: 'Grow your career with expert coaching',
    subcategories: [
      'Leadership & Executive Coaching',
      'Project Management Coaching',
      'Career Growth Coaching',
      'CPA Coaching',
      'CAT Coaching',
      'ACCA Coaching'
    ]
  },
  {
    id: 'business_entrepreneurship',
    title: 'Business & Entrepreneurship Coaching',
    description: 'Build, grow and scale your business',
    subcategories: [
      'Business Startup Coaching',
      'Entrepreneurship Development Coaching',
      'Small Business Management Coaching',
      'Business Strategy & Planning Coaching',
      'Financial Management Coaching',
      'Marketing & Branding Coaching',
      'Innovation & Growth Coaching'
    ]
  },
  {
    id: 'academic_coaching',
    title: 'Academic Coaching',
    description: 'Achieve academic excellence at any level',
    subcategories: [
      'Primary Coaching',
      'Secondary Coaching',
      'University Coaching',
      'Exam Preparation Coaching',
      'Study Skills Coaching',
      'Research & Thesis Coaching'
    ]
  },
  {
    id: 'language_coaching',
    title: 'Language Coaching',
    description: 'Master languages for life and business',
    subcategories: [
      'English Language Coaching',
      'French Language Coaching',
      'Kinyarwanda Language Coaching',
      'Business Communication Coaching',
      'Public Speaking in English Coaching',
      'Writing & Presentation Skills Coaching'
    ]
  },
  {
    id: 'technical_digital_coaching',
    title: 'Technical & Digital Coaching',
    description: 'Practical digital skills for today’s world',
    subcategories: [
      'Artificial Intelligence (AI) Coaching',
      'Machine Learning Coaching',
      'Data Analytics Coaching',
      'Cybersecurity Coaching',
      'Cloud Computing Coaching',
      'Software & Web Development Coaching',
      'Digital Marketing Coaching',
      'IT Systems Coaching',
      'Vocational & Technical Skills Coaching'
    ]
  },
  {
    id: 'job_seeker_coaching',
    title: 'Job Seeker Coaching',
    description: 'Land the job you want with structured coaching',
    subcategories: [
      // Technology & IT
      'Software Engineer', 'Web Developer', 'Mobile App Developer', 'UI/UX Designer', 
      'Data Analyst', 'Cybersecurity Analyst', 'IT Support', 'Network Administrator',
      'Database Administrator', 'System Administrator', 'DevOps Engineer', 'Quality Assurance',
      'Technical Writer', 'IT Consultant', 'Software Tester', 'Business Intelligence',
      'Digital Marketing', 'SEO Specialist', 'Content Writer', 'Social Media Manager',
      
      // Business & Finance
      'Accountant', 'Financial Analyst', 'Business Analyst', 'Project Manager',
      'Operations Manager', 'Product Manager', 'Sales Manager', 'Marketing Manager',
      'HR Manager', 'Business Development', 'Management Consultant', 'Auditor',
      'Bookkeeper', 'Payroll Specialist', 'Tax Consultant', 'Financial Advisor',
      'Insurance Agent', 'Real Estate Agent', 'Banking Professional', 'Investment Analyst',
      
      // Healthcare & Medical
      'Doctor', 'Nurse', 'Pharmacist', 'Medical Technician', 'Dentist',
      'Physiotherapist', 'Laboratory Technician', 'Radiologist', 'Veterinarian',
      'Medical Assistant', 'Healthcare Administrator', 'Public Health Officer',
      
      // Education & Training
      'Teacher', 'University Lecturer', 'School Principal', 'Curriculum Developer',
      'Educational Consultant', 'Librarian', 'Research Assistant', 'Training Specialist',
      'Language Teacher', 'Translator', 'Interpreter', 'Educational Technology',
      
      // Engineering & Construction
      'Civil Engineer', 'Mechanical Engineer', 'Electrical Engineer', 'Chemical Engineer',
      'Environmental Engineer', 'Architect', 'Surveyor', 'Construction Manager',
      'Project Engineer', 'Quality Control Engineer', 'Maintenance Engineer',
      
      // Agriculture & Environment
      'Agricultural Engineer', 'Farm Manager', 'Agribusiness Manager', 'Environmental Engineer',
      'Environmental Health Officer', 'Food Inspector', 'Agricultural Consultant',
      
      // Tourism & Hospitality
      'Hotel Manager', 'Restaurant Manager', 'Chef', 'Tour Guide', 'Travel Agent',
      'Event Manager', 'Wedding Planner', 'Tourism Coordinator', 'Hospitality Manager',
      
      // Government & Public Service
      'Civil Servant', 'Policy Analyst', 'Public Administrator', 'Diplomat',
      'Legal Officer', 'Judge', 'Lawyer', 'Paralegal', 'Legal Secretary',
      'Government Relations', 'Public Affairs Officer',
      
      // Media & Communications
      'Journalist', 'Radio Presenter', 'TV Producer', 'Content Creator',
      'Public Relations', 'Advertising', 'Photographer', 'Videographer',
      'Media Relations', 'Communications Officer', 'Brand Manager',
      
      // Transportation & Logistics
      'Pilot', 'Air Traffic Controller', 'Logistics Coordinator', 'Supply Chain Manager',
      'Driver', 'Mechanic', 'Aviation Technician', 'Transportation Manager',
      'Fleet Manager', 'Warehouse Manager', 'Procurement Officer',
      
      // Retail & Commerce
      'Store Manager', 'Sales Representative', 'Cashier', 'Inventory Manager',
      'Retail Buyer', 'Merchandiser', 'Customer Service', 'Sales Associate',
      'Import/Export Specialist', 'Customs Officer', 'Trade Specialist',
      
      // Non-Profit & NGO
      'Program Coordinator', 'Grant Writer', 'Community Development Worker',
      'Social Worker', 'Counselor', 'Youth Worker', 'Environmental Activist',
      'Development Worker', 'Aid Worker', 'Volunteer Coordinator', 'Fundraising',
      
      // Sports & Recreation
      'Sports Coach', 'Fitness Instructor', 'Sports Administrator', 'Event Coordinator',
      'Recreation Manager', 'Athletic Trainer', 'Sports Marketing',
      
      // Entertainment & Arts
      'Musician', 'Actor', 'Artist', 'Painter', 'Sculptor', 'Fashion Designer',
      'Interior Designer', 'Graphic Designer', 'Creative Director', 'Art Director',
      
      // Security & Safety
      'Security Guard', 'Police Officer', 'Military Officer', 'Private Investigator',
      'Safety Officer', 'Risk Manager', 'Compliance Officer', 'Security Manager',
      
      // Beauty & Wellness
      'Hair Stylist', 'Beautician', 'Massage Therapist', 'Spa Manager',
      'Wellness Coach', 'Fitness Trainer', 'Nutritionist', 'Beauty Consultant',
      
      // Skilled Trades
      'Electrician', 'Plumber', 'Carpenter', 'Mason', 'Welder', 'Machinist',
      'Maintenance Worker', 'Technician', 'Repair Specialist', 'Installation Specialist',
      
      // Manufacturing & Production
      'Factory Worker', 'Production Manager', 'Quality Control', 'Machine Operator',
      'Assembly Worker', 'Packaging Specialist', 'Manufacturing Engineer',
      
      // Administrative & Support
      'Personal Assistant', 'Secretary', 'Receptionist', 'Office Manager',
      'Administrative Assistant', 'Data Entry Clerk', 'Executive Assistant',
      'Office Administrator', 'Administrative Coordinator',
      
      // Customer Service & Support
      'Customer Support', 'Call Center Agent', 'Technical Support', 'Help Desk',
      'Customer Success', 'Account Manager', 'Client Relations', 'Service Representative',
      
      // Freelance & Consulting
      'Freelancer', 'Consultant', 'Independent Contractor', 'Service Provider',
      'Business Owner', 'Entrepreneur', 'Startup Founder', 'Franchise Owner',
      
      // Research & Analysis
      'Market Research', 'Research Analyst', 'Data Scientist', 'Statistician',
      'Research Coordinator', 'Survey Researcher', 'Policy Researcher',
      
      // Human Resources
      'Recruiter', 'Training Coordinator', 'Employee Relations', 'Compensation Analyst',
      'Benefits Administrator', 'HR Generalist', 'Talent Acquisition', 'HR Business Partner',
      
      // Sales & Marketing
      'Sales Representative', 'Account Executive', 'Territory Manager', 'Sales Coordinator',
      'Marketing Coordinator', 'Brand Specialist', 'Digital Marketing Specialist',
      'Content Marketing', 'Email Marketing', 'Social Media Specialist',
      
      // Operations & Management
      'Operations Analyst', 'Process Improvement', 'Operations Coordinator',
      'Facilities Manager', 'Property Manager', 'Asset Manager', 'Space Planner',
      
      // International & Development
      'International Relations', 'Foreign Affairs', 'Development Specialist',
      'International Business', 'Cross-cultural Consultant', 'Global Program Manager'
    ]
  },
  {
    id: 'personal_corporate_coaching',
    title: 'Personal & Corporate Development Coaching',
    description: 'Unlock personal and team performance',
    subcategories: [
      'Personal Growth Coaching',
      'Confidence & Communication Coaching',
      'Time Management Coaching',
      'Emotional Intelligence Coaching',
      'Public Speaking Coaching',
      'Parenting Coaching',
      'Team Performance Coaching',
      'HR & Legal Compliance Coaching',
      'Customer Service Coaching',
      'Workplace Ethics Coaching'
    ]
  }
];

const CreateCourse: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  
  // Mobile responsive breakpoints
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  
  // State management
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    level: 'Beginner' as 'Beginner' | 'Intermediate' | 'Advanced',
    duration: 0,
    prerequisites: [] as string[],
    learningObjectives: [] as string[],
    tags: [] as string[],
    // New fields for better discoverability
    careerGoal: '',
    experienceLevel: '',
    timeCommitment: '',
    learningStyle: '',
    specificInterests: [] as string[],
    learningCategories: [] as string[],
    learningSubcategories: [] as string[]
  });

  // Temporary input states
  const [newPrerequisite, setNewPrerequisite] = useState('');
  const [newObjective, setNewObjective] = useState('');
  const [newTag, setNewTag] = useState('');
  const [newSpecificInterest, setNewSpecificInterest] = useState('');

  // Handle form input changes
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle learning category selection
  const handleLearningCategoryToggle = (categoryId: string) => {
    const currentCategories = formData.learningCategories;
    const currentSubcategories = formData.learningSubcategories;
    
    if (currentCategories.includes(categoryId)) {
      // Remove category and its subcategories
      const category = learningCategories.find(cat => cat.id === categoryId);
      const subcategoriesToRemove = category?.subcategories || [];
      
      handleInputChange('learningCategories', currentCategories.filter(id => id !== categoryId));
      handleInputChange('learningSubcategories', currentSubcategories.filter(sub => !subcategoriesToRemove.includes(sub)));
    } else {
      // Add category
      handleInputChange('learningCategories', [...currentCategories, categoryId]);
    }
  };

  // Handle subcategory selection
  const handleSubcategoryToggle = (subcategory: string) => {
    const currentSubcategories = formData.learningSubcategories;
    
    if (currentSubcategories.includes(subcategory)) {
      handleInputChange('learningSubcategories', currentSubcategories.filter(sub => sub !== subcategory));
    } else {
      handleInputChange('learningSubcategories', [...currentSubcategories, subcategory]);
    }
  };

  // Get available subcategories for selected categories
  const getAvailableSubcategories = () => {
    return formData.learningCategories.flatMap(categoryId => {
      const category = learningCategories.find(cat => cat.id === categoryId);
      return category?.subcategories || [];
    });
  };

  // Array management functions
  const addToArray = (field: keyof typeof formData, value: string, setter: (value: string) => void) => {
    if (!value.trim()) return;
    
    const currentArray = formData[field] as string[];
    if (!currentArray.includes(value.trim())) {
      setFormData(prev => ({
        ...prev,
        [field]: [...currentArray, value.trim()]
      }));
      setter('');
    }
  };

  const removeFromArray = (field: keyof typeof formData, index: number) => {
    const currentArray = formData[field] as string[];
    setFormData(prev => ({
      ...prev,
      [field]: currentArray.filter((_, i) => i !== index)
    }));
  };

  // Form validation
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0: // Basic Information
        return !!(formData.title && formData.description && formData.category);
      case 1: // Course Details
        return !!(formData.level && formData.duration > 0);
      case 2: // Discoverability & Target Audience
        return !!(formData.careerGoal && formData.experienceLevel && formData.timeCommitment && formData.learningStyle && formData.learningCategories.length > 0 && formData.learningSubcategories.length > 0);
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

  // Submit course
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      const courseData = {
        ...formData,
        price: 0 // Price will be set by admin during approval
      };

      const response = await courseService.createCourse(courseData);

      setSuccess('Course created successfully and submitted for approval!');

      // Redirect to courses page after a delay
      setTimeout(() => {
        navigate('/dashboard/teacher/courses');
      }, 2000);

    } catch (err: any) {
      console.error('Course creation error:', err);

      // Handle specific teacher profile errors
      if (err.response?.data?.code) {
        const { code, profileStatus, error: errorMessage } = err.response.data;

        switch (code) {
          case 'PROFILE_NOT_FOUND':
            setError('Please create your teacher profile before creating courses.');
            setTimeout(() => {
              navigate('/dashboard/teacher/profile/complete');
            }, 3000);
            break;
          case 'PROFILE_INCOMPLETE':
            setError('Please complete your teacher profile before creating courses.');
            setTimeout(() => {
              navigate('/dashboard/teacher/profile/complete');
            }, 3000);
            break;
          case 'PROFILE_PENDING':
            setError('Your teacher profile is pending approval. You cannot create courses until your profile is approved.');
            break;
          case 'PROFILE_REJECTED':
            setError('Your teacher profile has been rejected. Please update your profile and resubmit for approval.');
            setTimeout(() => {
              navigate('/dashboard/teacher/profile/complete');
            }, 3000);
            break;
          default:
            setError(errorMessage || 'Your teacher profile is not approved. Please contact support.');
        }
      } else {
        setError(err.message || 'Failed to create course');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: { xs: 2, sm: 4 }, mb: { xs: 2, sm: 4 }, px: { xs: 1, sm: 2 } }}>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
        {/* Header - Mobile Responsive */}
        <Box mb={{ xs: 3, sm: 4 }}>
          <Typography 
            variant={isMobile ? "h5" : "h4"} 
            gutterBottom
            sx={{ 
              fontWeight: 700,
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
            }}
          >
            Create New Course
          </Typography>
          <Typography 
            variant={isMobile ? "body2" : "body1"} 
            color="text.secondary"
            sx={{ 
              fontSize: { xs: '0.875rem', sm: '1rem' },
              lineHeight: 1.6
            }}
          >
            Create a comprehensive course to share your knowledge with students
          </Typography>
        </Box>

        {/* Error/Success Messages */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        {/* Progress Stepper - Mobile Responsive */}
        <Stepper 
          activeStep={activeStep} 
          sx={{ 
            mb: { xs: 3, sm: 4 },
            '& .MuiStepLabel-label': {
              fontSize: { xs: '0.75rem', sm: '0.875rem' }
            }
          }}
          orientation={isMobile ? "vertical" : "horizontal"}
        >
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel 
                sx={{ 
                  '& .MuiStepLabel-label': {
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    lineHeight: 1.2
                  }
                }}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Form Content */}
        <Box>
          {/* Step 0: Basic Information - Mobile Responsive */}
          {activeStep === 0 && (
            <Card>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Box display="flex" alignItems="center" mb={{ xs: 2, sm: 3 }}>
                  <School sx={{ mr: 1, fontSize: { xs: 20, sm: 24 } }} />
                  <Typography 
                    variant={isMobile ? "subtitle1" : "h6"}
                    sx={{ 
                      fontWeight: 600,
                      fontSize: { xs: '1.1rem', sm: '1.25rem' }
                    }}
                  >
                    Basic Information
                  </Typography>
                </Box>
                
                <Grid container spacing={{ xs: 2, sm: 3 }}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Course Title *"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="e.g., Complete Web Development Bootcamp"
                      helperText="Choose a clear, descriptive title for your course"
                      size={isMobile ? "small" : "medium"}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Course Description *"
                      multiline
                      rows={isMobile ? 3 : 4}
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Describe what students will learn in this course..."
                      helperText={`${formData.description.length}/2000 characters`}
                      size={isMobile ? "small" : "medium"}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Autocomplete
                      freeSolo
                      options={categories}
                      value={formData.category}
                      onChange={(event, newValue) => {
                        handleInputChange('category', newValue || '');
                      }}
                      onInputChange={(event, newInputValue) => {
                        handleInputChange('category', newInputValue);
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Category *"
                          placeholder="Type or select a category..."
                          helperText="Type to search or enter a custom category"
                          required
                          size={isMobile ? "small" : "medium"}
                        />
                      )}
                      renderOption={(props, option) => (
                        <Box component="li" {...props}>
                          {option}
                        </Box>
                      )}
                      filterOptions={(options, { inputValue }) => {
                        const filtered = options.filter(option =>
                          option.toLowerCase().includes(inputValue.toLowerCase())
                        );
                        // If no matches and user typed something, add their input as an option
                        if (inputValue && !filtered.includes(inputValue)) {
                          filtered.push(inputValue);
                        }
                        return filtered;
                      }}
                    />
                    <Typography 
                      variant="caption" 
                      color="text.secondary" 
                      sx={{ 
                        mt: 1, 
                        display: 'block',
                        fontSize: { xs: '0.7rem', sm: '0.75rem' }
                      }}
                    >
                      💡 You can type any category you want! Start typing to see suggestions or create your own.
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Difficulty Level *</InputLabel>
                      <Select
                        value={formData.level}
                        label="Difficulty Level *"
                        onChange={(e) => handleInputChange('level', e.target.value)}
                        size={isMobile ? "small" : "medium"}
                      >
                        <MenuItem value="Beginner">Beginner</MenuItem>
                        <MenuItem value="Intermediate">Intermediate</MenuItem>
                        <MenuItem value="Advanced">Advanced</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Step 1: Course Details - Mobile Responsive */}
          {activeStep === 1 && (
            <Card>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Box display="flex" alignItems="center" mb={{ xs: 2, sm: 3 }}>
                  <Description sx={{ mr: 1, fontSize: { xs: 20, sm: 24 } }} />
                  <Typography 
                    variant={isMobile ? "subtitle1" : "h6"}
                    sx={{ 
                      fontWeight: 600,
                      fontSize: { xs: '1.1rem', sm: '1.25rem' }
                    }}
                  >
                    Course Details
                  </Typography>
                </Box>
                
                <Grid container spacing={{ xs: 2, sm: 3 }}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Duration (hours) *"
                      type="number"
                      value={formData.duration}
                      onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || 0)}
                      inputProps={{ min: 1, max: 1000 }}
                      helperText="Estimated course duration"
                      size={isMobile ? "small" : "medium"}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Alert 
                      severity="info" 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        height: '100%',
                        fontSize: { xs: '0.75rem', sm: '0.875rem' }
                      }}
                    >
                      <Typography 
                        variant="body2"
                        sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                      >
                        💰 Course pricing will be set by admin during approval process
                      </Typography>
                    </Alert>
                  </Grid>
                  
                  {/* Prerequisites - Mobile Responsive */}
                  <Grid item xs={12}>
                    <Typography 
                      variant="subtitle1" 
                      gutterBottom
                      sx={{ 
                        fontSize: { xs: '0.9rem', sm: '1rem' },
                        fontWeight: 600
                      }}
                    >
                      Prerequisites
                    </Typography>
                    <Box 
                      display="flex" 
                      gap={{ xs: 0.5, sm: 1 }} 
                      mb={2}
                      flexDirection={{ xs: 'column', sm: 'row' }}
                    >
                      <TextField
                        fullWidth
                        label="Add Prerequisite"
                        value={newPrerequisite}
                        onChange={(e) => setNewPrerequisite(e.target.value)}
                        placeholder="e.g., Basic HTML knowledge"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addToArray('prerequisites', newPrerequisite, setNewPrerequisite);
                          }
                        }}
                        size={isMobile ? "small" : "medium"}
                      />
                      <Button
                        variant="outlined"
                        onClick={() => addToArray('prerequisites', newPrerequisite, setNewPrerequisite)}
                        disabled={!newPrerequisite.trim()}
                        size={isMobile ? "small" : "medium"}
                        sx={{ minWidth: { xs: 'auto', sm: '80px' } }}
                      >
                        Add
                      </Button>
                    </Box>
                    <Box display="flex" flexWrap="wrap" gap={{ xs: 0.5, sm: 1 }} mb={2}>
                      {formData.prerequisites.map((prereq, index) => (
                        <Chip
                          key={index}
                          label={prereq}
                          onDelete={() => removeFromArray('prerequisites', index)}
                          color="primary"
                          variant="outlined"
                          size={isMobile ? "small" : "medium"}
                          sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                        />
                      ))}
                    </Box>
                  </Grid>

                  {/* Learning Objectives - Mobile Responsive */}
                  <Grid item xs={12}>
                    <Typography 
                      variant="subtitle1" 
                      gutterBottom
                      sx={{ 
                        fontSize: { xs: '0.9rem', sm: '1rem' },
                        fontWeight: 600
                      }}
                    >
                      Learning Objectives
                    </Typography>
                    <Box 
                      display="flex" 
                      gap={{ xs: 0.5, sm: 1 }} 
                      mb={2}
                      flexDirection={{ xs: 'column', sm: 'row' }}
                    >
                      <TextField
                        fullWidth
                        label="Add Learning Objective"
                        value={newObjective}
                        onChange={(e) => setNewObjective(e.target.value)}
                        placeholder="e.g., Build responsive websites"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addToArray('learningObjectives', newObjective, setNewObjective);
                          }
                        }}
                        size={isMobile ? "small" : "medium"}
                      />
                      <Button
                        variant="outlined"
                        onClick={() => addToArray('learningObjectives', newObjective, setNewObjective)}
                        disabled={!newObjective.trim()}
                        size={isMobile ? "small" : "medium"}
                        sx={{ minWidth: { xs: 'auto', sm: '80px' } }}
                      >
                        Add
                      </Button>
                    </Box>
                    <Box display="flex" flexWrap="wrap" gap={{ xs: 0.5, sm: 1 }} mb={2}>
                      {formData.learningObjectives.map((objective, index) => (
                        <Chip
                          key={index}
                          label={objective}
                          onDelete={() => removeFromArray('learningObjectives', index)}
                          color="secondary"
                          variant="outlined"
                          size={isMobile ? "small" : "medium"}
                          sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                        />
                      ))}
                    </Box>
                  </Grid>

                  {/* Tags - Mobile Responsive */}
                  <Grid item xs={12}>
                    <Typography 
                      variant="subtitle1" 
                      gutterBottom
                      sx={{ 
                        fontSize: { xs: '0.9rem', sm: '1rem' },
                        fontWeight: 600
                      }}
                    >
                      Tags
                    </Typography>
                    <Box 
                      display="flex" 
                      gap={{ xs: 0.5, sm: 1 }} 
                      mb={2}
                      flexDirection={{ xs: 'column', sm: 'row' }}
                    >
                      <TextField
                        fullWidth
                        label="Add Tag"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="e.g., javascript, react"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addToArray('tags', newTag, setNewTag);
                          }
                        }}
                        size={isMobile ? "small" : "medium"}
                      />
                      <Button
                        variant="outlined"
                        onClick={() => addToArray('tags', newTag, setNewTag)}
                        disabled={!newTag.trim()}
                        size={isMobile ? "small" : "medium"}
                        sx={{ minWidth: { xs: 'auto', sm: '80px' } }}
                      >
                        Add
                      </Button>
                    </Box>
                    <Box display="flex" flexWrap="wrap" gap={{ xs: 0.5, sm: 1 }}>
                      {formData.tags.map((tag, index) => (
                        <Chip
                          key={index}
                          label={tag}
                          onDelete={() => removeFromArray('tags', index)}
                          size={isMobile ? "small" : "medium"}
                          sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                        />
                      ))}
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Discoverability & Target Audience - Mobile Responsive */}
          {activeStep === 2 && (
            <Card>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Box display="flex" alignItems="center" mb={{ xs: 2, sm: 3 }}>
                  <Category sx={{ mr: 1, fontSize: { xs: 20, sm: 24 } }} />
                  <Typography 
                    variant={isMobile ? "subtitle1" : "h6"}
                    sx={{ 
                      fontWeight: 600,
                      fontSize: { xs: '1.1rem', sm: '1.25rem' }
                    }}
                  >
                    Discoverability & Target Audience
                  </Typography>
                </Box>
                
                <Grid container spacing={{ xs: 2, sm: 3 }}>
                  {/* Career Goal */}
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Target Career Goal</InputLabel>
                      <Select
                        value={formData.careerGoal}
                        label="Target Career Goal"
                        onChange={(e) => handleInputChange('careerGoal', e.target.value)}
                        size={isMobile ? "small" : "medium"}
                      >
                        <MenuItem value="employment">Looking for Employment</MenuItem>
                        <MenuItem value="business_owner">Running a Business</MenuItem>
                        <MenuItem value="student">Student</MenuItem>
                        <MenuItem value="career_change">Career Change</MenuItem>
                        <MenuItem value="skill_upgrade">Skill Upgrade</MenuItem>
                        <MenuItem value="exploring">Just Exploring</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Experience Level */}
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Target Experience Level</InputLabel>
                      <Select
                        value={formData.experienceLevel}
                        label="Target Experience Level"
                        onChange={(e) => handleInputChange('experienceLevel', e.target.value)}
                        size={isMobile ? "small" : "medium"}
                      >
                        <MenuItem value="beginner">Beginner (New to the field)</MenuItem>
                        <MenuItem value="intermediate">Intermediate (Some experience)</MenuItem>
                        <MenuItem value="advanced">Advanced (Experienced professional)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Time Commitment */}
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Expected Time Commitment</InputLabel>
                      <Select
                        value={formData.timeCommitment}
                        label="Expected Time Commitment"
                        onChange={(e) => handleInputChange('timeCommitment', e.target.value)}
                        size={isMobile ? "small" : "medium"}
                      >
                        <MenuItem value="light">1-2 hours/week (Light learning)</MenuItem>
                        <MenuItem value="moderate">3-5 hours/week (Moderate learning)</MenuItem>
                        <MenuItem value="intensive">6-10 hours/week (Intensive learning)</MenuItem>
                        <MenuItem value="full_time">10+ hours/week (Full-time learning)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Learning Style */}
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Primary Learning Style</InputLabel>
                      <Select
                        value={formData.learningStyle}
                        label="Primary Learning Style"
                        onChange={(e) => handleInputChange('learningStyle', e.target.value)}
                        size={isMobile ? "small" : "medium"}
                      >
                        <MenuItem value="visual">Visual Learning (Videos, diagrams, infographics)</MenuItem>
                        <MenuItem value="hands_on">Hands-on Practice (Projects, exercises, labs)</MenuItem>
                        <MenuItem value="theoretical">Theoretical Study (Reading, lectures, concepts)</MenuItem>
                        <MenuItem value="interactive">Interactive Learning (Discussions, collaboration, Q&A)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Learning Categories - Mobile Responsive */}
                  <Grid item xs={12}>
                    <Typography 
                      variant="subtitle1" 
                      gutterBottom
                      sx={{ 
                        fontSize: { xs: '0.9rem', sm: '1rem' },
                        fontWeight: 600
                      }}
                    >
                      Learning Categories *
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ 
                        mb: 2,
                        fontSize: { xs: '0.75rem', sm: '0.875rem' }
                      }}
                    >
                      Select the learning categories that best match your course content. This helps students find your course based on their interests.
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={{ xs: 1, sm: 1.5 }} mb={2}>
                      {learningCategories.map((category) => (
                        <Chip
                          key={category.id}
                          label={category.title}
                          onClick={() => handleLearningCategoryToggle(category.id)}
                          color={formData.learningCategories.includes(category.id) ? 'primary' : 'default'}
                          variant={formData.learningCategories.includes(category.id) ? 'filled' : 'outlined'}
                          size={isMobile ? "small" : "medium"}
                          sx={{ 
                            fontSize: { xs: '0.7rem', sm: '0.75rem' },
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: formData.learningCategories.includes(category.id) 
                                ? 'primary.dark' 
                                : 'primary.light',
                              color: formData.learningCategories.includes(category.id) 
                                ? 'white' 
                                : 'primary.main'
                            }
                          }}
                        />
                      ))}
                    </Box>
                    {formData.learningCategories.length > 0 && (
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{ 
                          fontSize: { xs: '0.7rem', sm: '0.75rem' },
                          display: 'block',
                          mb: 1
                        }}
                      >
                        Selected Categories: {formData.learningCategories.map(id => 
                          learningCategories.find(cat => cat.id === id)?.title
                        ).join(', ')}
                      </Typography>
                    )}

                    {/* Subcategories Selection */}
                    {formData.learningCategories.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography 
                          variant="subtitle2" 
                          gutterBottom
                          sx={{ 
                            fontSize: { xs: '0.8rem', sm: '0.9rem' },
                            fontWeight: 600,
                            mb: 1
                          }}
                        >
                          Select Specific Subcategories (Optional but Recommended)
                        </Typography>
                        <Typography 
                          variant="caption" 
                          color="text.secondary"
                          sx={{ 
                            fontSize: { xs: '0.65rem', sm: '0.7rem' },
                            display: 'block',
                            mb: 1.5
                          }}
                        >
                          Choose specific subcategories to make your course more discoverable and targeted.
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={{ xs: 0.5, sm: 1 }} mb={2}>
                          {getAvailableSubcategories().map((subcategory) => (
                            <Chip
                              key={subcategory}
                              label={subcategory}
                              onClick={() => handleSubcategoryToggle(subcategory)}
                              color={formData.learningSubcategories.includes(subcategory) ? 'secondary' : 'default'}
                              variant={formData.learningSubcategories.includes(subcategory) ? 'filled' : 'outlined'}
                              size="small"
                              sx={{ 
                                fontSize: { xs: '0.65rem', sm: '0.7rem' },
                                cursor: 'pointer',
                                '&:hover': {
                                  backgroundColor: formData.learningSubcategories.includes(subcategory) 
                                    ? 'secondary.dark' 
                                    : 'secondary.light',
                                  color: formData.learningSubcategories.includes(subcategory) 
                                    ? 'white' 
                                    : 'secondary.main'
                                }
                              }}
                            />
                          ))}
                        </Box>
                        {formData.learningSubcategories.length > 0 && (
                          <Typography 
                            variant="caption" 
                            color="text.secondary"
                            sx={{ 
                              fontSize: { xs: '0.65rem', sm: '0.7rem' },
                              display: 'block',
                              mb: 1
                            }}
                          >
                            Selected Subcategories: {formData.learningSubcategories.join(', ')}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Grid>

                  {/* Specific Interests/Skills - Mobile Responsive */}
                  <Grid item xs={12}>
                    <Typography 
                      variant="subtitle1" 
                      gutterBottom
                      sx={{ 
                        fontSize: { xs: '0.9rem', sm: '1rem' },
                        fontWeight: 600
                      }}
                    >
                      Specific Topics & Skills Covered
                    </Typography>
                    <Box 
                      display="flex" 
                      gap={{ xs: 0.5, sm: 1 }} 
                      mb={2}
                      flexDirection={{ xs: 'column', sm: 'row' }}
                    >
                      <TextField
                        fullWidth
                        label="Add Specific Topic/Skill"
                        value={newSpecificInterest}
                        onChange={(e) => setNewSpecificInterest(e.target.value)}
                        placeholder="e.g., React Hooks, Digital Marketing Analytics, Financial Modeling"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addToArray('specificInterests', newSpecificInterest, setNewSpecificInterest);
                          }
                        }}
                        size={isMobile ? "small" : "medium"}
                      />
                      <Button
                        variant="outlined"
                        onClick={() => addToArray('specificInterests', newSpecificInterest, setNewSpecificInterest)}
                        disabled={!newSpecificInterest.trim()}
                        size={isMobile ? "small" : "medium"}
                        sx={{ minWidth: { xs: 'auto', sm: '80px' } }}
                      >
                        Add
                      </Button>
                    </Box>
                    <Box display="flex" flexWrap="wrap" gap={{ xs: 0.5, sm: 1 }} mb={2}>
                      {formData.specificInterests.map((interest, index) => (
                        <Chip
                          key={index}
                          label={interest}
                          onDelete={() => removeFromArray('specificInterests', index)}
                          color="info"
                          variant="outlined"
                          size={isMobile ? "small" : "medium"}
                          sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                        />
                      ))}
                    </Box>
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ 
                        fontSize: { xs: '0.7rem', sm: '0.75rem' }
                      }}
                    >
                      💡 These specific topics will help students find your course when searching for particular skills or technologies.
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Review & Submit - Mobile Responsive */}
          {activeStep === 3 && (
            <Card>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography 
                  variant={isMobile ? "subtitle1" : "h6"} 
                  gutterBottom
                  sx={{ 
                    fontWeight: 600,
                    fontSize: { xs: '1.1rem', sm: '1.25rem' }
                  }}
                >
                  Review & Submit
                </Typography>
                
                <Alert 
                  severity="info" 
                  sx={{ 
                    mb: { xs: 2, sm: 3 },
                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                  }}
                >
                  Please review your course information. Once submitted, your course will be reviewed by our admin team before being published.
                </Alert>

                {/* Course Summary - Mobile Responsive */}
                <Grid container spacing={{ xs: 2, sm: 3 }}>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined" sx={{ height: '100%' }}>
                      <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                        <Typography 
                          variant="subtitle1" 
                          gutterBottom
                          sx={{ 
                            fontSize: { xs: '0.9rem', sm: '1rem' },
                            fontWeight: 600
                          }}
                        >
                          Basic Information
                        </Typography>
                        <Stack spacing={0.5}>
                          <Typography 
                            variant="body2" 
                            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                          >
                            <strong>Title:</strong> {formData.title}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                          >
                            <strong>Category:</strong> {formData.category}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                          >
                            <strong>Level:</strong> {formData.level}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                          >
                            <strong>Duration:</strong> {formData.duration} hours
                          </Typography>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Card variant="outlined" sx={{ height: '100%' }}>
                      <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                        <Typography 
                          variant="subtitle1" 
                          gutterBottom
                          sx={{ 
                            fontSize: { xs: '0.9rem', sm: '1rem' },
                            fontWeight: 600
                          }}
                        >
                          Target Audience
                        </Typography>
                        <Stack spacing={0.5}>
                          <Typography 
                            variant="body2" 
                            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                          >
                            <strong>Career Goal:</strong> {formData.careerGoal}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                          >
                            <strong>Experience Level:</strong> {formData.experienceLevel}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                          >
                            <strong>Time Commitment:</strong> {formData.timeCommitment}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                          >
                            <strong>Learning Style:</strong> {formData.learningStyle}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                          >
                            <strong>Learning Categories:</strong> {formData.learningCategories.map(id => 
                              learningCategories.find(cat => cat.id === id)?.title
                            ).join(', ')}
                          </Typography>
                          {formData.learningSubcategories.length > 0 && (
                            <Typography 
                              variant="body2" 
                              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                            >
                              <strong>Subcategories:</strong> {formData.learningSubcategories.join(', ')}
                            </Typography>
                          )}
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Card variant="outlined" sx={{ height: '100%' }}>
                      <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                        <Typography 
                          variant="subtitle1" 
                          gutterBottom
                          sx={{ 
                            fontSize: { xs: '0.9rem', sm: '1rem' },
                            fontWeight: 600
                          }}
                        >
                          Course Content
                        </Typography>
                        <Stack spacing={0.5}>
                          <Typography 
                            variant="body2" 
                            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                          >
                            <strong>Prerequisites:</strong> {formData.prerequisites.length}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                          >
                            <strong>Learning Objectives:</strong> {formData.learningObjectives.length}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                          >
                            <strong>Tags:</strong> {formData.tags.length}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                          >
                            <strong>Specific Topics:</strong> {formData.specificInterests.length}
                          </Typography>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12}>
                    <Card variant="outlined">
                      <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                        <Typography 
                          variant="subtitle1" 
                          gutterBottom
                          sx={{ 
                            fontSize: { xs: '0.9rem', sm: '1rem' },
                            fontWeight: 600
                          }}
                        >
                          Description
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            whiteSpace: 'pre-wrap',
                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                            lineHeight: 1.5
                          }}
                        >
                          {formData.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}
        </Box>

        {/* Navigation Buttons - Mobile Responsive */}
        <Box 
          display="flex" 
          justifyContent="space-between" 
          alignItems="center" 
          mt={{ xs: 3, sm: 4 }}
          flexDirection={{ xs: 'column', sm: 'row' }}
          gap={{ xs: 2, sm: 0 }}
        >
          <Button
            onClick={handleBack}
            disabled={activeStep === 0}
            variant="outlined"
            fullWidth={isMobile}
            size={isMobile ? "small" : "medium"}
            sx={{ order: { xs: 2, sm: 1 } }}
          >
            Back
          </Button>

          <Box 
            display="flex" 
            gap={{ xs: 1, sm: 2 }}
            width={{ xs: '100%', sm: 'auto' }}
            order={{ xs: 1, sm: 2 }}
          >
            {activeStep < steps.length - 1 ? (
              <Button
                onClick={handleNext}
                variant="contained"
                disabled={!validateStep(activeStep)}
                fullWidth={isMobile}
                size={isMobile ? "small" : "medium"}
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                variant="contained"
                color="success"
                startIcon={loading ? <CircularProgress size={20} /> : <Send />}
                fullWidth={isMobile}
                size={isMobile ? "small" : "medium"}
              >
                {loading ? 'Creating...' : 'Create Course'}
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default CreateCourse;

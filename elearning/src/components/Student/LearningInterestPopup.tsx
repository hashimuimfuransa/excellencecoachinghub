import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  LinearProgress,
  useTheme,
  useMediaQuery,
  styled,
  Paper,
  Avatar,
  Stack,
  TextField
} from '@mui/material';
import {
  Close,
  School,
  Business,
  Work,
  Psychology,
  Computer,
  Palette,
  Science,
  Language,
  LocalHospital,
  Engineering,
  Calculate,
  TrendingUp,
  EmojiEvents,
  CheckCircle,
  ArrowForward,
  ArrowBack
} from '@mui/icons-material';

// Styled components for modern design
const StyledDialog = styled(Dialog)(({ theme }) => ({
  zIndex: 9999,
  '& .MuiDialog-paper': {
    borderRadius: theme.spacing(2),
    maxWidth: '680px',
    width: '100%',
    maxHeight: '85vh',
    background: 'linear-gradient(135deg, #ffffff 0%, #f5f7fb 100%)',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
    zIndex: 9999,
  },
  '& .MuiBackdrop-root': {
    zIndex: 9998,
  },
}));

const StepCard = styled(Card)(({ theme, selected }) => ({
  cursor: 'pointer',
  transition: 'all 0.25s ease',
  border: selected ? `2px solid ${theme.palette.primary.main}` : '1px solid rgba(0,0,0,0.08)',
  background: selected 
    ? `linear-gradient(135deg, ${theme.palette.primary.main}0A, ${theme.palette.primary.main}14)`
    : 'white',
  '&:hover': {
    transform: 'translateY(-3px)',
    boxShadow: theme.shadows[4],
    borderColor: theme.palette.primary.main,
  },
}));

const InterestChip = styled(Chip)(({ theme, selected }) => ({
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  height: 28,
  borderRadius: 16,
  background: selected 
    ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
    : theme.palette.grey[100],
  color: selected ? 'white' : theme.palette.text.primary,
  fontWeight: selected ? 700 : 500,
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: theme.shadows[2],
  },
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: 10,
  textTransform: 'none',
  fontWeight: 700,
  padding: theme.spacing(1, 2),
  fontSize: '0.95rem',
  boxShadow: '0 3px 10px rgba(0, 0, 0, 0.12)',
}));

// Learning interest data (curated)
const learningCategories = [
  {
    id: 'professional_coaching',
    title: 'Professional Coaching',
    description: 'Grow your career with expert coaching',
    icon: <Work sx={{ fontSize: 40 }} />,
    color: '#2196F3',
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
    icon: <Business sx={{ fontSize: 40 }} />,
    color: '#4CAF50',
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
    icon: <School sx={{ fontSize: 40 }} />,
    color: '#FF9800',
    subcategories: [
      'Nursery Coaching',
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
    icon: <Language sx={{ fontSize: 40 }} />,
    color: '#9C27B0',
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
    icon: <Computer sx={{ fontSize: 40 }} />,
    color: '#E91E63',
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
    icon: <Work sx={{ fontSize: 40 }} />,
    color: '#F44336',
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
    icon: <Psychology sx={{ fontSize: 40 }} />,
    color: '#673AB7',
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

const careerGoals = [
  { id: 'job_seeker', title: 'Looking for Employment', icon: <Work />, description: 'I want to find a job in my field' },
  { id: 'business_owner', title: 'Running a Business', icon: <Business />, description: 'I own or want to start a business' },
  { id: 'student', title: 'Student', icon: <School />, description: 'I am currently studying' },
  { id: 'career_change', title: 'Career Change', icon: <TrendingUp />, description: 'I want to switch careers' },
  { id: 'skill_upgrade', title: 'Skill Upgrade', icon: <EmojiEvents />, description: 'I want to improve my current skills' }
];

const experienceLevels = [
  { id: 'beginner', title: 'Beginner', description: 'New to this field' },
  { id: 'intermediate', title: 'Intermediate', description: 'Some experience' },
  { id: 'advanced', title: 'Advanced', description: 'Experienced professional' }
];

interface LearningInterestData {
  categories: string[];
  careerGoal: string;
  experienceLevel: string;
  interests: string[];
  timeCommitment: string;
  learningStyle: string;
}

interface LearningInterestPopupProps {
  open: boolean;
  onClose: () => void;
  onComplete: (data: LearningInterestData) => void;
}

const LearningInterestPopup: React.FC<LearningInterestPopupProps> = ({
  open,
  onClose,
  onComplete
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Debug logging
  useEffect(() => {
    console.log('🎯 LearningInterestPopup - Props received:', { open, isMobile });
  }, [open, isMobile]);
  
  const [activeStep, setActiveStep] = useState(0);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<LearningInterestData>({
    categories: [],
    careerGoal: '',
    experienceLevel: '',
    interests: [],
    timeCommitment: '',
    learningStyle: ''
  });

  const steps = ['Choose Category', 'Pick Subcategory'];

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setFormData(prev => ({ ...prev, categories: [categoryId] }));
    setActiveStep(1);
  };

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleComplete = (finalData?: Partial<LearningInterestData>) => {
    const payload = { ...formData, ...(finalData || {}) } as LearningInterestData;
    // Navigate via URL params for category/subcategory to trigger page filtering
    try {
      const category = payload.categories?.[0] || selectedCategoryId;
      const subcategory = payload.interests?.[0] || '';
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (subcategory) params.set('subcategory', subcategory);
      const url = `/dashboard/student/courses?tab=discover&${params.toString()}`;
      window.location.assign(url);
    } catch (e) {
      // Fallback to existing callback
      onComplete(payload);
    }
    onClose();
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="subtitle1" gutterBottom sx={{ mb: 2, textAlign: 'center', fontWeight: 700 }}>
              Select a category
            </Typography>
            <Grid container spacing={1.5}>
              {learningCategories.map((category) => (
                <Grid item xs={12} sm={6} md={4} key={category.id}>
                  <StepCard
                    selected={formData.categories.includes(category.id)}
                    onClick={() => handleCategoryToggle(category.id)}
                  >
                    <CardContent sx={{ textAlign: 'center', p: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: category.color,
                          width: 48,
                          height: 48,
                          mx: 'auto',
                          mb: 1.5
                        }}
                      >
                        {category.icon}
                      </Avatar>
                      <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                        {category.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {category.description}
                      </Typography>
                      {formData.categories.includes(category.id) && (
                        <CheckCircle sx={{ color: 'primary.main', mt: 1 }} />
                      )}
                    </CardContent>
                  </StepCard>
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      case 1:
        const selected = learningCategories.find(c => c.id === selectedCategoryId);
        const subcategories = selected?.subcategories || [];
        
        const filteredSubcategories = subcategories.filter(sub => 
          sub.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return (
          <Box>
            <Typography variant="subtitle1" gutterBottom sx={{ mb: 2, textAlign: 'center', fontWeight: 700 }}>
              {selected?.title}: choose a subcategory
            </Typography>
            
            {/* Search Field */}
            <Box sx={{ mb: 2, px: 2 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search subcategory/job..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'white',
                    '&:hover': {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'primary.main',
                      },
                    },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <Box sx={{ mr: 1, color: 'text.secondary' }}>
                      🔍
                    </Box>
                  ),
                }}
              />
            </Box>

            {/* Job Categories */}
            <Box sx={{ maxHeight: '360px', overflowY: 'auto', px: 2 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                {filteredSubcategories.map((sub) => (
                  <InterestChip
                    key={sub}
                    label={sub}
                    selected={false}
                    onClick={() => handleComplete({ interests: [sub] })}
                    sx={{
                      fontSize: '0.8rem',
                      px: 1.5,
                      height: 28,
                      '&:hover': {
                        boxShadow: 2,
                      },
                    }}
                  />
                ))}
              </Box>
              
              {filteredSubcategories.length === 0 && searchTerm && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No jobs found matching "{searchTerm}"
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Try a different search term or browse all categories
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        );

      // Steps beyond 1 are removed in the simplified flow
      case 2:
      case 3:
      case 4:
      case 5:
        return null;

      default:
        return 'Unknown step';
    }
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 0: return formData.categories.length > 0;
      default: return true;
    }
  };

  const progress = ((activeStep + 1) / steps.length) * 100;

  console.log('🎯 LearningInterestPopup - About to render:', { open, isMobile, progress });

  return (
    <StyledDialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
    >
      <DialogTitle sx={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        textAlign: 'center',
        py: 2,
        position: 'relative',
        fontSize: '1.25rem',
        fontWeight: 800,
        mb: 0
      }}>
        🎯 Quick Interest Picker
        <Box sx={{ fontSize: '1rem', opacity: 0.9, mt: 1 }}>
          Pick a category and subcategory to see courses
        </Box>
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 16,
            top: 16,
            color: 'white',
            bgcolor: 'rgba(255, 255, 255, 0.2)',
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.3)',
            }
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {/* Progress Bar */}
        <Box sx={{ px: 2.5, pt: 1.5 }}>
          <LinearProgress variant="determinate" value={progress} sx={{ height: 6, borderRadius: 3 }} />
        </Box>

        {/* Simplified content (no stepper) */}

        {/* Step Content */}
        <Box sx={{ px: 2.5, pb: 2 }}>
          {getStepContent(activeStep)}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', borderTop: '1px solid #e2e8f0' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          {activeStep === 1 ? (
            <ActionButton
              onClick={handleBack}
              variant="outlined"
              startIcon={<ArrowBack />}
              sx={{ borderColor: 'primary.main', color: 'primary.main', minWidth: 0 }}
            >
              Back
            </ActionButton>
          ) : <Box />}

          <Box sx={{ display: 'flex', gap: 2 }}>
            <ActionButton
              onClick={onClose}
              variant="contained"
              endIcon={<Close />}
              sx={{
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a6fd8, #6a4190)',
                }
              }}
            >
              Close
            </ActionButton>
          </Box>
        </Box>
      </DialogActions>
    </StyledDialog>
  );
};

export default LearningInterestPopup;
